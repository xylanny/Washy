<template>
  <aside class="chart-panel" :class="{ 'chart-panel--collapsed': isCollapsed }">
    <div class="chart-panel__content">
      <header class="chart-panel__header">
        <input
          v-if="isEditingTitle"
          ref="titleInputRef"
          v-model="draftTitle"
          class="chart-panel__title-input"
          type="text"
          spellcheck="false"
          autocomplete="off"
          :placeholder="titlePlaceholder"
          :aria-label="titlePlaceholder"
          @keydown.enter.prevent="commitTitle"
          @keydown.esc.prevent="cancelTitle"
          @blur="commitTitle"
        />

        <button
          v-else
          type="button"
          class="chart-panel__title"
          :title="displayTitle"
          @click="startTitleEdit"
        >
          {{ displayTitle }}
        </button>

        <!-- 标题右侧：折叠面板 -->
        <button
          type="button"
          class="chart-panel__toggle"
          aria-label="Collapse panel"
          aria-expanded="true"
          title="Collapse"
          @click="isCollapsed = true"
        >
          <svg
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06z"
            />
          </svg>
        </button>
      </header>

      <!-- 分组切换：像 Figma 的 Design / Prototype -->
      <nav class="chart-panel__tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.name"
          type="button"
          role="tab"
          class="chart-panel__tab"
          :class="{ 'is-active': tab.name === activeTabName }"
          :aria-selected="tab.name === activeTabName"
          @click="selectTab(tab.name)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <div ref="bodyRef" class="chart-panel__body">
        <!-- 所有分组共用同一个表单，只是切换显示其中一组 -->
        <Form :model="model">
          <component
            :is="activeTabComponent"
            v-if="activeTabComponent"
            v-bind="activeTabProps"
            @update:field="handleFieldChange"
            @update:item="handleItemChange"
            @add:item="handleAddItem"
            @remove:item="handleRemoveItem"
          />
        </Form>
      </div>
    </div>

    <!-- 折叠后：浮在 main 右上角的展开按钮 -->
    <Transition name="chart-panel-fade">
      <button
        v-if="isCollapsed"
        type="button"
        class="chart-panel__toggle chart-panel__toggle--floating"
        aria-label="Expand panel"
        aria-expanded="false"
        title="Expand"
        @click="isCollapsed = false"
      >
        <svg
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06z"
          />
        </svg>
      </button>
    </Transition>
  </aside>
</template>

<script lang="ts" setup>
import type {
  ChartPanelEmits,
  ChartPanelFieldChange,
  ChartPanelItemChange,
  ChartPanelProps,
} from "./types";
import { computed, nextTick, ref, watch } from "vue";
import Form from "@/components/Form/Form.vue";

const props = withDefaults(defineProps<ChartPanelProps>(), {
  title: "",
  titlePlaceholder: "Untitled",
});

const emits = defineEmits<ChartPanelEmits>();

/** ===== 分组切换 ===== */

const activeTabName = ref("");

watch(
  () => props.tabs,
  (tabs) => {
    if (tabs.some((tab) => tab.name === activeTabName.value)) return;

    activeTabName.value = tabs[0]?.name ?? "";
  },
  { immediate: true },
);

const activeTab = computed(() =>
  props.tabs.find((tab) => tab.name === activeTabName.value),
);

const activeTabComponent = computed(() => activeTab.value?.component);

const activeTabProps = computed(() => activeTab.value?.props ?? {});

const bodyRef = ref<HTMLElement | null>(null);

function selectTab(name: string): void {
  if (name === activeTabName.value) return;

  activeTabName.value = name;

  // 换组后回到顶部，避免沿用上一组的滚动位置
  nextTick(() => {
    if (bodyRef.value) bodyRef.value.scrollTop = 0;
  });
}

/** ===== 头部标题：点击后原地编辑 ===== */

const isEditingTitle = ref(false);
const draftTitle = ref("");
const titleInputRef = ref<HTMLInputElement | null>(null);

const displayTitle = computed(() => props.title.trim() || props.titlePlaceholder);

async function startTitleEdit(): Promise<void> {
  draftTitle.value = props.title;
  isEditingTitle.value = true;

  await nextTick();

  titleInputRef.value?.focus();
  titleInputRef.value?.select();
}

function commitTitle(): void {
  if (!isEditingTitle.value) return;

  isEditingTitle.value = false;

  const next = draftTitle.value.trim();

  if (next === props.title) return;

  emits("update:title", next);
}

function cancelTitle(): void {
  isEditingTitle.value = false;
}

/** ===== 折叠 ===== */

const isCollapsed = ref(false);

/** ===== 表单变更：原样转发给页面 ===== */

function handleFieldChange(change: ChartPanelFieldChange): void {
  emits("update:field", change);
}

function handleItemChange(change: ChartPanelItemChange): void {
  emits("update:item", change);
}

function handleAddItem(): void {
  emits("add:item");
}

function handleRemoveItem(index: number): void {
  emits("remove:item", index);
}
</script>

<style lang="scss" scoped src="./style.scss"></style>
