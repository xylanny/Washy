/**
 * 图表画布（通用）的 props
 *
 * 画布只管「容器 + 空态」，具体画哪种图由页面通过默认插槽组装
 * （LineChart / BarChart / PieChart …），因此不依赖任何具体图表类型。
 */
export interface ChartCanvasProps {
  /** 为 true 时不渲染插槽，只显示占位提示 */
  empty?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
}
