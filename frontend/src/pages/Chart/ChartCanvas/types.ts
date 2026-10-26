/**
 * 图表画布（通用）的 props
 *
 * 画布只负责「画板 + 统一空态」，具体画哪种图由页面通过默认插槽组装；
 * 空态由画布统一渲染，页面只负责告诉它当前有没有可画的内容。
 */
export interface ChartCanvasProps {
  /** 为 true 时不渲染插槽，只显示统一空态 */
  empty?: boolean;
}
