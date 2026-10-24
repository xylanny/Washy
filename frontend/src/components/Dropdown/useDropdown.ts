import { inject, onBeforeUnmount, provide, ref } from "vue";
import type { DropdownContext } from "./types";
import { DROPDOWN_CONTEXT_KEY } from "./constants";

export function createDropdownContext() {
  const rootEl = ref<HTMLElement>();
  const panelEl = ref<HTMLElement>();
  const closeFn = ref<() => void>(() => {});

  const triggers = new Set<HTMLElement>();
  const childCloses = new Set<() => void>();
  const childCtxs = new Set<DropdownContext>();

  const parentCtx = inject<DropdownContext | undefined>(
    DROPDOWN_CONTEXT_KEY,
    undefined,
  );

  function closeCurPanel() {
    childCloses.forEach((c) => c());
    childCloses.clear();
    closeFn.value();
  }

  function closeAllPanels() {
    closeCurPanel();
    parentCtx?.closeAllPanels();
  }

  function getAllEls(): HTMLElement[] {
    const els: HTMLElement[] = [];
    if (rootEl.value) els.push(rootEl.value);
    if (panelEl.value) els.push(panelEl.value);

    childCtxs.forEach((ctx) => {
      els.push(...ctx.getAll());
    });
    return els;
  }

  const context: DropdownContext = {
    isChild: !!parentCtx,
    parentCtx,
    getRoot: () => rootEl.value,
    getPanel: () => panelEl.value,
    getAll: getAllEls,
    closeCurPanel,
    closeAllPanels,
    registerTrigger: (el) => {
      triggers.add(el);
      return () => triggers.delete(el);
    },
    registerChildClose: (close) => {
      childCloses.add(close);
      return () => childCloses.delete(close);
    },
    registerChildCtx: (ctx) => {
      childCtxs.add(ctx);
      return () => childCtxs.delete(ctx);
    },
    notifyParentEnter: () => {
      parentCtx?.notifyParentEnter();
    },
    notifyParentLeave: () => {
      parentCtx?.notifyParentLeave();
    },
  };

  provide(DROPDOWN_CONTEXT_KEY, context);

  onBeforeUnmount(() => {
    triggers.clear();
    childCloses.clear();
    childCtxs.clear();
  });

  return {
    context,
    setRoot: (el?: HTMLElement) => (rootEl.value = el),
    setPanel: (el?: HTMLElement) => (panelEl.value = el),
    bindClose: (close: () => void) => (closeFn.value = close),
  };
}

export function useDropdownContext(): DropdownContext | undefined {
  return inject(DROPDOWN_CONTEXT_KEY, undefined);
}
