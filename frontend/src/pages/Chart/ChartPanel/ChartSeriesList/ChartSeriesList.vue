<template>
  <Collapse v-model="activeSections" class="chart-series">
    <CollapseItem name="series" :collapsible="series.length > 0">
      <template #title>
        <span class="chart-series__title">Series</span>
      </template>

      <!-- 与 Figma 的分组头一致：可新增的列表把右侧箭头换成 + -->
      <template v-if="addable" #icon>
        <button
          type="button"
          class="chart-series__add"
          aria-label="Add series"
          title="Add series"
          @click.stop="handleAdd"
          @keydown.enter.stop
          @keydown.space.stop
        >
          <svg
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M8.75 3.25a.75.75 0 0 0-1.5 0v4h-4a.75.75 0 0 0 0 1.5h4v4a.75.75 0 0 0 1.5 0v-4h4a.75.75 0 0 0 0-1.5h-4v-4z"
            />
          </svg>
        </button>
      </template>

      <div class="chart-series__list">
        <div
          v-for="(item, index) in series"
          :key="index"
          class="chart-series__item"
        >
          <div class="chart-series__row">
            <span
              class="chart-series__swatch"
              :style="{ background: item.color }"
            >
              <input
                type="color"
                class="chart-series__color"
                :value="item.color"
                :aria-label="`Series ${index + 1} color`"
                @input="handlePick(index, $event)"
              />
            </span>

            <input
              class="chart-series__hex"
              type="text"
              spellcheck="false"
              autocomplete="off"
              :value="item.color"
              :aria-label="`Series ${index + 1} color (hex)`"
              @input="handleHexInput(index, $event)"
              @blur="handleHexBlur(index, $event)"
            />

            <button
              type="button"
              class="chart-series__remove"
              :aria-label="`Remove series ${index + 1}`"
              :title="`Remove series ${index + 1}`"
              @click="handleRemove(index)"
            >
              <svg
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M3.25 8a.75.75 0 0 1 .75-.75h8a.75.75 0 0 1 0 1.5H4A.75.75 0 0 1 3.25 8z"
                />
              </svg>
            </button>
          </div>

          <FormSelect
            :model-value="item.field || undefined"
            :options="options"
            @update:model-value="emitUpdate(index, 'field', String($event ?? ''))"
          />
        </div>
      </div>
    </CollapseItem>
  </Collapse>
</template>

<script lang="ts" setup>
import type { CollapseItemName } from "@/components/Collapse/types";
import type { ChartSeriesListEmits, ChartSeriesListProps } from "./types";
import { ref } from "vue";
import Collapse from "@/components/Collapse/Collapse.vue";
import CollapseItem from "@/components/Collapse/CollapseItem.vue";
import FormSelect from "@/components/Form/FormSelect/FormSelect.vue";

const props = withDefaults(defineProps<ChartSeriesListProps>(), {
  addable: false,
});

const emits = defineEmits<ChartSeriesListEmits>();

/** 默认展开，列表为空时不可展开 */
const activeSections = ref<CollapseItemName[]>(["series"]);

/** #rgb / #rrggbb 均视为合法颜色 */
const HEX_COLOR_PATTERN = /^#?[0-9a-f]{3}$|^#?[0-9a-f]{6}$/i;

/** 统一成 #rrggbb，便于 color input 与配置对象互通 */
function normalizeHex(value: string): string {
  const hex = value.trim().replace(/^#/, "");

  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((char) => char + char)
      .join("")}`;
  }

  return `#${hex}`;
}

function emitUpdate(index: number, key: string, value: string): void {
  emits("update", index, key, value);
}

/** 新增时顺带展开分组，避免加了却看不到 */
function handleAdd(): void {
  if (!activeSections.value.includes("series")) {
    activeSections.value = [...activeSections.value, "series"];
  }

  emits("add");
}

function handlePick(index: number, evt: Event): void {
  emitUpdate(index, "color", (evt.target as HTMLInputElement).value);
}

function handleRemove(index: number): void {
  emits("remove", index);
}

function handleHexInput(index: number, evt: Event): void {
  const raw = (evt.target as HTMLInputElement).value;

  if (!HEX_COLOR_PATTERN.test(raw.trim())) return;

  emitUpdate(index, "color", normalizeHex(raw));
}

/** 失焦时把未完成/不合法的输入还原成当前颜色 */
function handleHexBlur(index: number, evt: FocusEvent): void {
  (evt.target as HTMLInputElement).value =
    props.series[index]?.color ?? "#000000";
}
</script>

<style lang="scss" scoped src="./style.scss"></style>
