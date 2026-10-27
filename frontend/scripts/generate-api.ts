import * as fs from "fs";
import * as path from "path";

const OPENAPI_URL = "http://localhost:8080/api/v3/api-docs";
const OUTPUT_DIR = path.join(process.cwd(), "src", "api");
const TYPES_FILE = path.join(OUTPUT_DIR, "types", "index.ts");
const MODULES_DIR = path.join(OUTPUT_DIR, "modules");

interface Schema {
  type?: string;
  format?: string;
  nullable?: boolean;
  properties?: Record<string, Schema>;
  items?: Schema;
  $ref?: string;
  allOf?: Schema[];
}

interface Operation {
  tags?: string[];
  operationId?: string;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: Schema;
  }>;
  requestBody?: { content?: Record<string, { schema?: Schema }> };
  responses?: Record<string, { content?: Record<string, { schema?: Schema }> }>;
}

interface Doc {
  paths: Record<string, Record<string, Operation>>;
  components?: { schemas?: Record<string, Schema> };
}

const toPascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const cleanRef = (ref: string) => ref.split("/").pop()!;

async function fetchDoc(url: string): Promise<Doc> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

function toTS(schema?: Schema): string {
  if (!schema) return "any";
  if (schema.$ref) {
    const name = cleanRef(schema.$ref);
    return name === "ResultVoid" ? "void" : toPascal(name);
  }
  if (schema.allOf) return schema.allOf.map(toTS).join(" & ");
  if (schema.type === "array") return `${toTS(schema.items)}[]`;
  if (schema.type === "object") {
    if (!schema.properties) return "Record<string, any>";
    const props = Object.entries(schema.properties)
      .map(([k, v]) => `${k}?: ${toTS(v)}`) // 所有字段改为可选
      .join("; ");
    return `{ ${props} }`;
  }
  if (schema.type === "string") return "string";
  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "boolean") return "boolean";
  return "any";
}

function generateTypes(schemas: Record<string, Schema>): string {
  const lines: string[] = [
    "",
    "export interface Result<T = any> {",
    "  code: number;",
    "  message: string;",
    "  data: T;",
    "}",
    "",
  ];
  for (const [name, schema] of Object.entries(schemas)) {
    if (name === "ResultVoid") continue;
    const ts = toTS(schema);
    if (schema.type === "object" && schema.properties) {
      lines.push(`export interface ${toPascal(name)} {`);
      for (const [k, v] of Object.entries(schema.properties)) {
        lines.push(`  ${k}?: ${toTS(v)};`); // 所有字段改为可选
      }
      lines.push("}\n");
    } else {
      lines.push(`export type ${toPascal(name)} = ${ts};\n`);
    }
  }
  return lines.join("\n");
}

function generateModules(doc: Doc): void {
  const groups = new Map<
    string,
    Array<{ path: string; method: string; op: Operation }>
  >();
  for (const [pathUrl, methods] of Object.entries(doc.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      for (const tag of op.tags || ["default"]) {
        if (!groups.has(tag)) groups.set(tag, []);
        groups.get(tag)!.push({ path: pathUrl, method, op });
      }
    }
  }

  if (!fs.existsSync(MODULES_DIR))
    fs.mkdirSync(MODULES_DIR, { recursive: true });

  for (const [tag, items] of groups) {
    const moduleName = tag.replace(/-controller$/, "").replace(/-/g, "_");
    const apiName = moduleName + "API";

    const lines: string[] = ["import client from '@/api/client';"];
    const types = new Set<string>();
    const funcs: string[] = [];

    for (const { path: pathUrl, method, op } of items) {
      const fn =
        op.operationId ||
        `${method}${pathUrl.replace(/[{}]/g, "").replace(/\//g, "_")}`;

      const respSchema = op.responses?.["200"]?.content?.["*/*"]?.schema;
      let dataType = "any";
      let isVoid = false;

      if (respSchema?.$ref) {
        const refName = cleanRef(respSchema.$ref);
        if (refName === "ResultVoid") {
          isVoid = true;
          dataType = "void";
        } else if (refName.startsWith("Result")) {
          const innerType = refName.replace(/^Result/, "");
          if (innerType && innerType !== "Void") {
            dataType = toPascal(innerType);
            types.add(dataType);
          } else {
            isVoid = true;
            dataType = "void";
          }
        } else {
          dataType = toPascal(refName);
          types.add(dataType);
        }
      } else if (respSchema?.type === "array") {
        dataType = `${toTS(respSchema.items)}[]`;
      } else if (respSchema?.type === "object") {
        dataType = "Record<string, any>";
      }

      // !!!根据是否为 void 决定返回类型
      const returnType = isVoid
        ? "Promise<void>"
        : `Promise<Result<${dataType}>>`;

      const requestBody = op.requestBody;
      let bodySchema = requestBody?.content?.["application/json"]?.schema;
      let isMultipart = false;

      if (!bodySchema && requestBody?.content) {
        for (const contentType of Object.keys(requestBody.content)) {
          if (contentType.startsWith("multipart/")) {
            bodySchema = requestBody.content[contentType].schema;
            isMultipart = true;
            break;
          }
        }
      }

      const bodyRef = bodySchema?.$ref;
      const query = (op.parameters || []).filter((p) => p.in === "query");
      const pathP = (op.parameters || []).filter((p) => p.in === "path");

      const args: string[] = [];
      let url = pathUrl;
      let hasBody = false;

      if (bodyRef) {
        const t = toPascal(cleanRef(bodyRef));
        args.push(`data: ${t}`);
        types.add(t);
        hasBody = true;
      } else if (bodySchema?.type === "object" && bodySchema.properties) {
        args.push("data: Record<string, any>");
        hasBody = true;
      } else if (bodySchema?.type === "string") {
        args.push("data: string");
        hasBody = true;
      }

      if (pathP.length) {
        args.push(
          `path: { ${pathP.map((p) => `${p.name}?: ${p.schema?.type || "string"}`).join("; ")} }`,
        );
        for (const p of pathP)
          url = url.replace(`{${p.name}}`, `\${path.${p.name}}`);
      }

      if (query.length) {
        const props = query
          .map((p) => `${p.name}?: ${p.schema?.type || "string"}`)
          .join("; ");
        args.push(`query: { ${props} } = {}`);
        url +=
          "?" + query.map((p) => `${p.name}=\${query.${p.name}}`).join("&");
      }

      const bodyArg = hasBody ? ", data" : "";
      const methodCall = method === "get" ? "get" : method;
      const urlArg = `\`${url}\``;

      funcs.push(`  ${fn}: (${args.join(", ")}): ${returnType} => {`);

      // !!!对于 void 类型，调用 client 方法并忽略返回值
      if (isVoid) {
        if (isMultipart && hasBody) {
          funcs.push(
            `    return client.${methodCall}(${urlArg}, data).then(() => {});`,
          );
        } else {
          funcs.push(
            `    return client.${methodCall}(${urlArg}${bodyArg}).then(() => {});`,
          );
        }
      } else {
        if (isMultipart && hasBody) {
          funcs.push(`    return client.${methodCall}(${urlArg}, data);`);
        } else {
          funcs.push(`    return client.${methodCall}(${urlArg}${bodyArg});`);
        }
      }
      funcs.push(`  },`);
    }

    const imports = Array.from(types)
      .filter((t) => t !== "ResultVoid")
      .join(", ");
    if (imports) {
      lines.push(
        `import type { Result${imports ? `, ${imports}` : ""} } from '../types';`,
      );
    } else {
      lines.push(`import type { Result } from '../types';`);
    }

    lines.push("", `export const ${apiName} = {`, ...funcs, "};");

    fs.writeFileSync(
      path.join(MODULES_DIR, `${moduleName}.ts`),
      lines.join("\n"),
    );
  }
}

async function main() {
  try {
    console.log("📡 获取 OpenAPI...");
    const doc = await fetchDoc(OPENAPI_URL);
    const schemas = doc.components?.schemas || {};

    if (!fs.existsSync(path.dirname(TYPES_FILE)))
      fs.mkdirSync(path.dirname(TYPES_FILE), { recursive: true });
    fs.writeFileSync(TYPES_FILE, generateTypes(schemas));
    console.log("✅ 类型文件已生成:", TYPES_FILE);

    generateModules(doc);
    console.log("✅ 模块文件已生成:", MODULES_DIR);
    console.log("✅ 生成完成");
  } catch (e) {
    console.error("❌ 错误:", e);
  }
}

main();
