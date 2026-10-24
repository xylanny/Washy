// 表行
export type TableRow = Record<string, string | number | boolean | null>;

// 表数据集
export interface Table {
  headers: string[]; // 字段名数组
  rows: TableRow[]; // 数据行数组
  fileName?: string;
}

// 分页配置
export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  total: number;
}
