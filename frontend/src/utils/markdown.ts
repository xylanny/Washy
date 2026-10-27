/**
 * 极简 Markdown → HTML。
 *
 * 只覆盖 AI 回复里常见的语法：标题、段落、列表、表格、围栏代码块、行内代码、
 * 加粗、斜体、删除线、链接、引用、分隔线。
 *
 * 安全性：所有来自模型/用户的文本都会先做 HTML 转义，再拼接固定的标签，
 * 因此结果可以直接用 v-html 渲染。
 */

const CODE_TOKEN = "\u0000";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 行内元素：行内代码 → 链接 → 加粗 → 斜体 → 删除线 */
export function renderInline(source: string): string {
  if (!source) return "";

  const codes: string[] = [];

  let text = source.replace(/`([^`]+)`/g, (_match, code: string) => {
    const index = codes.push(`<code>${escapeHtml(code)}</code>`) - 1;
    return `${CODE_TOKEN}${index}${CODE_TOKEN}`;
  });

  text = escapeHtml(text);

  // 只允许 http/https 链接
  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_match, label: string, url: string) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`,
  );

  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  text = text.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  return text.replace(
    new RegExp(`${CODE_TOKEN}(\\d+)${CODE_TOKEN}`, "g"),
    (_match, index: string) => codes[Number(index)] ?? "",
  );
}

function splitTableRow(line: string): string[] {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|")) row = row.slice(0, -1);
  return row.split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell));
}

interface BlockResult {
  html: string;
  next: number;
}

function renderTable(lines: string[], start: number): BlockResult {
  const header = splitTableRow(lines[start]);
  const rows: string[][] = [];

  let index = start + 2;
  while (index < lines.length && lines[index].includes("|") && lines[index].trim() !== "") {
    rows.push(splitTableRow(lines[index]));
    index++;
  }

  const head = header.map((cell) => `<th>${renderInline(cell)}</th>`).join("");
  const body = rows
    .map((row) => {
      const cells = header
        .map((_cell, cellIndex) => `<td>${renderInline(row[cellIndex] ?? "")}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return {
    html: `<div class="md-table"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`,
    next: index,
  };
}

function renderList(lines: string[], start: number, ordered: boolean): BlockResult {
  const items: string[] = [];
  const pattern = ordered ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;

  let index = start;
  while (index < lines.length) {
    const match = lines[index].match(pattern);
    if (!match) break;

    let content = match[1];
    index++;

    // 续行：缩进且不是新的列表项
    while (
      index < lines.length &&
      /^\s{2,}\S/.test(lines[index]) &&
      !/^\s*([-*+]|\d+[.)])\s+/.test(lines[index])
    ) {
      content += ` ${lines[index].trim()}`;
      index++;
    }

    items.push(`<li>${renderInline(content)}</li>`);
  }

  const tag = ordered ? "ol" : "ul";
  return { html: `<${tag}>${items.join("")}</${tag}>`, next: index };
}

/**
 * 把 Markdown 渲染成可直接 v-html 的 HTML 字符串。
 */
export function renderMarkdown(source: string): string {
  if (!source) return "";

  const codeBlocks: string[] = [];
  let text = source.replace(/\r\n/g, "\n");

  // 1. 先把围栏代码块抽出来，避免其中的 Markdown 语法被误解析
  text = text.replace(
    /```([^\n`]*)\n([\s\S]*?)(?:```|$)/g,
    (_match, lang: string, code: string) => {
      const language = lang.trim();
      const index =
        codeBlocks.push(
          `<pre class="md-code"><code${
            language ? ` data-lang="${escapeHtml(language)}"` : ""
          }>${escapeHtml(code.replace(/\n$/, ""))}</code></pre>`,
        ) - 1;
      return `\n${CODE_TOKEN}BLOCK${index}${CODE_TOKEN}\n`;
    },
  );

  const lines = text.split("\n");
  const html: string[] = [];
  const blockPattern = new RegExp(`^${CODE_TOKEN}BLOCK(\\d+)${CODE_TOKEN}$`);

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed === "") {
      index++;
      continue;
    }

    const block = trimmed.match(blockPattern);
    if (block) {
      html.push(codeBlocks[Number(block[1])] ?? "");
      index++;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      // 页面标题已经占了 h1，这里的标题整体下调一级
      const level = Math.min(heading[1].length + 1, 6);
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      index++;
      continue;
    }

    if (/^([-*_])\s*(\1\s*){2,}$/.test(trimmed)) {
      html.push("<hr />");
      index++;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quote.push(lines[index].trim().replace(/^>\s?/, ""));
        index++;
      }
      html.push(
        `<blockquote>${quote.map((item) => renderInline(item)).join("<br />")}</blockquote>`,
      );
      continue;
    }

    if (
      trimmed.includes("|") &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1])
    ) {
      const table = renderTable(lines, index);
      html.push(table.html);
      index = table.next;
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const list = renderList(lines, index, true);
      html.push(list.html);
      index = list.next;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const list = renderList(lines, index, false);
      html.push(list.html);
      index = list.next;
      continue;
    }

    // 段落：连续的普通行合并成一个块，中间保留换行
    const paragraph: string[] = [trimmed];
    index++;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (next === "") break;
      if (/^#{1,6}\s+/.test(next)) break;
      if (/^\s*([-*+]|\d+[.)])\s+/.test(next)) break;
      if (next.startsWith(">")) break;
      if (blockPattern.test(next)) break;
      if (
        next.includes("|") &&
        index + 1 < lines.length &&
        isTableSeparator(lines[index + 1])
      ) {
        break;
      }
      paragraph.push(next);
      index++;
    }

    html.push(
      `<p>${paragraph.map((item) => renderInline(item)).join("<br />")}</p>`,
    );
  }

  return html.join("\n");
}
