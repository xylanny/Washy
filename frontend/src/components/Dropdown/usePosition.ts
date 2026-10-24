import type { ComputedRef, Ref } from "vue";
import type { Align } from "./types";
import { ref, watch } from "vue";
import { VIEWPORT_PADDING } from "./constants";

type MaybeReadonlyRef<T> = Ref<T> | ComputedRef<T>;

export function usePosition(
  triggerRef: MaybeReadonlyRef<HTMLElement | undefined>,
  panelRef: MaybeReadonlyRef<HTMLElement | undefined>,
  align: MaybeReadonlyRef<Align>,
  offset: MaybeReadonlyRef<number>,
) {
  const position = ref({ top: 0, left: 0 });

  function updatePosition() {
    const trigger = triggerRef.value;
    const panel = panelRef.value;

    if (!trigger || !panel) return;

    const triggerRect = trigger.getBoundingClientRect();
    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const gap = Math.max(offset.value, 0);
    const finalAlign = align.value;

    let top = 0;
    let left = 0;

    if (finalAlign === "bottom-right") {
      top = triggerRect.bottom + gap;
      left = triggerRect.right + gap;
    } else if (finalAlign === "top-right") {
      // 修改点：top 与触发器顶部对齐，面板向右展开
      top = triggerRect.top;
      left = triggerRect.right + gap;
    } else if (finalAlign === "bottom-left") {
      top = triggerRect.bottom + gap;
      left = triggerRect.left - gap;
    }

    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    } else if (left + panelWidth > viewportWidth - VIEWPORT_PADDING) {
      left = viewportWidth - panelWidth - VIEWPORT_PADDING;
    }

    if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING;
    } else if (top + panelHeight > viewportHeight - VIEWPORT_PADDING) {
      top = viewportHeight - panelHeight - VIEWPORT_PADDING;
    }

    position.value = { top, left };
  }

  watch([align, panelRef], () => {
    if (panelRef.value) {
      updatePosition();
    }
  });

  return { position, updatePosition };
}
