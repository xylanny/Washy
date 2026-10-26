<template>
  <div class="chart-panel__fields" :class="{ 'is-off': empty }">
    <FormItem prop="shape" label="Shape">
      <FormSelect
        :model-value="asSelect('shape')"
        :options="SHAPE_OPTIONS"
        :disabled="empty"
        @update:model-value="setField('shape', $event ?? 'smooth')"
      />
    </FormItem>

    <FormItem prop="area" label="Area">
      <FormSwitch
        :model-value="asBoolean('area')"
        :disabled="empty"
        @update:model-value="setField('area', Boolean($event))"
      />
    </FormItem>

    <FormItem
      prop="areaOpacity"
      label="Area opacity"
      :class="{ 'is-off': empty || !model.area }"
    >
      <FormSlider
        :model-value="asNumber('areaOpacity')"
        :min="10"
        :max="100"
        :step="5"
        :disabled="empty || !model.area"
        :format-value="percentFormat"
        @update:model-value="setField('areaOpacity', $event ?? 60)"
      />
    </FormItem>

    <FormItem prop="lineWidth" label="Line width">
      <FormSlider
        :model-value="asNumber('lineWidth')"
        :min="1"
        :max="8"
        :step="1"
        :disabled="empty"
        :format-value="pxFormat"
        @update:model-value="setField('lineWidth', $event ?? 2)"
      />
    </FormItem>

    <FormItem prop="lineDash" label="Line dash">
      <FormSelect
        :model-value="asSelect('lineDash')"
        :options="DASH_OPTIONS"
        :disabled="empty"
        @update:model-value="setField('lineDash', $event ?? 'solid')"
      />
    </FormItem>

    <FormItem prop="symbol" label="Point shape">
      <FormSelect
        :model-value="asSelect('symbol')"
        :options="SYMBOL_OPTIONS"
        :disabled="empty"
        @update:model-value="setField('symbol', $event ?? 'emptyCircle')"
      />
    </FormItem>

    <FormItem prop="symbolSize" label="Point size">
      <FormSlider
        :model-value="asNumber('symbolSize')"
        :min="0"
        :max="16"
        :step="1"
        :disabled="empty"
        :format-value="pxFormat"
        @update:model-value="setField('symbolSize', $event ?? 6)"
      />
    </FormItem>

    <FormItem prop="showValues" label="Show values">
      <FormSwitch
        :model-value="asBoolean('showValues')"
        :disabled="empty"
        @update:model-value="setField('showValues', Boolean($event))"
      />
    </FormItem>
  </div>
</template>

<script lang="ts" setup>
import type { ChartFieldsEmits, ChartPanelValue } from "../../ChartPanel/types";
import type { ChartLineConfig } from "../types";
import { DASH_OPTIONS, SHAPE_OPTIONS } from "../constants";
import { SYMBOL_OPTIONS } from "../../constants";
import FormItem from "@/components/Form/FormItem.vue";
import FormSelect from "@/components/Form/FormSelect/FormSelect.vue";
import FormSlider from "@/components/Form/FormSlider/FormSlider.vue";
import FormSwitch from "@/components/Form/FormSwitch/FormSwitch.vue";
import { useFieldValue } from "../../ChartPanel/useFieldValue";

const props = defineProps<{
  model: ChartLineConfig;
  empty: boolean;
}>();

const emits = defineEmits<ChartFieldsEmits>();

const { asSelect, asNumber, asBoolean } = useFieldValue(() => props.model);

/** 滑块气泡：1px / 2px … */
function pxFormat(value: number): string {
  return `${value}px`;
}

/** 滑块气泡：60% */
function percentFormat(value: number): string {
  return `${value}%`;
}

function setField(key: string, value: ChartPanelValue): void {
  emits("update:field", { key, value });
}
</script>
