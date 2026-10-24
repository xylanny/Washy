import type { Table, TableRow } from "@/types";
import { tableAPI } from "@/api/modules/table";
import type { KMeansVO, KMeansDTO } from "@/api/types";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import * as XLSX from "xlsx";

export const useTableStore = defineStore("table", () => {
  const table = ref<Table | null>(null);
  const loading = ref(false);
  // 统一替换 error 为 message，可存放提示信息和错误信息
  const message = ref<string | null>(null);

  const rows = computed(() => table.value?.rows.length ?? 0);
  const cols = computed(() => table.value?.headers.length ?? 0);

  function parseFileToTable(file: File): Promise<Table> {
    loading.value = true;
    message.value = null;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let workbook: XLSX.WorkBook;
          if (file.name.endsWith(".csv")) {
            const csvData = data as string;
            workbook = XLSX.read(csvData, {
              type: "string",
              raw: true,
              codepage: 65001,
            });
          } else {
            const arrayBuffer = data as ArrayBuffer;
            workbook = XLSX.read(arrayBuffer, {
              type: "array",
              raw: true,
              cellDates: true,
            });
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            defval: "",
            raw: false,
          }) as TableRow[];

          const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

          table.value = {
            headers,
            rows: jsonData,
            fileName: file.name,
          };

          loading.value = false;
          resolve(table.value);
        } catch (err) {
          loading.value = false;
          message.value =
            err instanceof Error ? err.message : "Parse file to table failure";
          reject(new Error(message.value));
        }
      };

      reader.onerror = () => {
        loading.value = false;
        message.value = "Read file failure";
        reject(new Error(message.value));
      };

      if (file.name.endsWith(".csv")) reader.readAsText(file, "UTF-8");
      else reader.readAsArrayBuffer(file);
    });
  }

  function addRow(position: "start" | "end" = "end") {
    if (!table.value) return;

    const newRow: TableRow = {};
    table.value.headers.forEach((header) => {
      newRow[header] = "";
    });

    if (position === "start") {
      table.value.rows.unshift(newRow);
    } else {
      table.value.rows.push(newRow);
    }
  }

  function deleteRow(idx: number): void {
    if (!table.value) return;
    if (idx < 0 || idx >= table.value.rows.length) return;
    table.value.rows.splice(idx, 1);
  }

  function updateRow(idx: number, header: string, value: any): void {
    if (!table.value) return;
    if (idx < 0 || idx >= table.value.rows.length) return;
    if (!table.value.headers.includes(header)) return;

    table.value.rows[idx][header] = value;
  }

  function exportTableToFile(
    table: Table,
    fileType: "xlsx" | "csv" = "xlsx",
    download = true,
  ): File {
    try {
      if (!table || table.rows.length === 0) {
        throw new Error("No data in table can be exported");
      }

      const dataForExport = table.rows.map((row) =>
        table.headers.map((header) => row[header] ?? ""),
      );
      const wsData = [table.headers, ...dataForExport];
      const worksheet = XLSX.utils.aoa_to_sheet(wsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet");
      const baseName = table.fileName
        ? table.fileName.replace(/\.[^.]+$/, "")
        : "export";
      const fileName = `${baseName}_edited.${fileType === "xlsx" ? "xlsx" : "csv"}`;
      const content = XLSX.write(workbook, {
        bookType: fileType,
        type: "array",
        ...(fileType === "csv" && { FS: "," }),
      });
      const file = new File([content], fileName, {
        type:
          fileType === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv",
      });

      if (download) {
        XLSX.writeFile(workbook, fileName, {
          bookType: fileType,
          type: "buffer",
          ...(fileType === "csv" && { FS: "," }),
        });
      }

      return file;
    } catch (err) {
      message.value =
        err instanceof Error ? err.message : "Export table to file failure";
      throw new Error(message.value);
    }
  }

  async function analysisByKMeans(
    params: Omit<KMeansDTO, "file">,
  ): Promise<KMeansVO | null> {
    if (!table.value) return null;

    if (table.value.rows.length === 0) {
      throw new Error("No data in table can be analyzed");
    }

    const formData = new FormData();
    formData.append("file", exportTableToFile(table.value, "csv", false));

    if (params.k !== undefined) formData.append("k", String(params.k));
    if (params.maxIterations !== undefined) {
      formData.append("maxIterations", String(params.maxIterations));
    }
    if (params.tolerance !== undefined) {
      formData.append("tolerance", String(params.tolerance));
    }
    if (params.seed !== undefined) formData.append("seed", String(params.seed));
    for (const column of params.columns ?? []) {
      formData.append("columns", column);
    }

    const responseBody = await tableAPI.analysisByKmeans(formData as KMeansDTO);

    if (responseBody.code !== 20000) {
      message.value = responseBody.message ?? "K-Means analysis failed";
      throw new Error(message.value);
    }

    return responseBody.data ?? null;
  }

  function isValidFileType(file: File): boolean {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const extension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    return (
      validTypes.includes(file.type) || validExtensions.includes(extension)
    );
  }

  function resetMessage(): void {
    message.value = null;
  }

  function clearTable(): void {
    table.value = null; // 直接设为 null 更好
    message.value = "No data in table";
  }

  return {
    table,
    loading,
    message,
    rows,
    cols,
    parseFileToTable,
    addRow,
    updateRow,
    deleteRow,
    exportTableToFile,
    isValidFileType,
    resetMessage,
    clearTable,
    analysisByKMeans,
  };
});
