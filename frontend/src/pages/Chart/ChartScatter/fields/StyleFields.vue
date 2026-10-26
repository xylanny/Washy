<template>
  <div class="chart-panel__fields" :class="{ 'is-off': empty }">
    <FormItem prop="symbol" label="Point shape">
      <FormSelect
        :model-value="asSelect('symbol')"
        :options="SYMBOL_OPTIONS"
        :disabled="empty"
        @update:model-value="setField('symbol', $event ?? 'circle')"
      />
    </FormItem>

    <FormItem prop="symbolSize" label="Point size">
      <FormSlider
        :model-value="asNumber('symbolSize')"
        :min="2"
        :max="40"
        :step="1"
        :disabled="empty"
        :format-value="pxFormat"
        @update:model-value="setField('symbolSize', $event ?? 8)"
      />
    </FormItem>

    <FormItem prop="opacity" label="Opacity">
      <FormSlider
        :model-value="asNumber('opacity')"
        :min="10"
        :max="100"
        :step="5"
        :disabled="empty"
        :format-value="percentFormat"
        @update:model-value="setField('opacity', $event ?? 70)"
      />
    </FormItem>

    <FormItem prop="showLegend" label="Show legend">
      <FormSwitch
        :model-value="asBoolean('showLegend')"
        :disabled="empty"
        @update:model-value="setField('showLegend', Boolean($event))"
      />
    </FormItem>

    <FormItem
      prop="legendPosition"
      label="Placement"
      :class="{ 'is-off': empty || !model.showLegend }"
    >
      <ChartPanelPosition
        :model-value="asString('legendPosition')"
        :disabled="empty || !model.showLegend"
        @update:model-value="setField('legendPosition', $event)"
      />
    </FormItem>

    <FormItem prop="showGrid" label="Grid lines">
      <FormSwitch
        :model-value="asBoolean('showGrid')"
        :disabled="empty"
        @update:model-value="setField('showGrid', Boolean($event))"
      />
    </FormItem>

    <FormItem prop="valueUnit" label="Value unit">
      <FormInput
        :model-value="asString('valueUnit')"
        placeholder="e.g. %"
        clearable
        @update:model-value="setField('valueUnit', $event ?? '')"
      />
    </FormItem>

    <FormItem prop="dataZoom" label="Zoom slider" :class="{ 'is-off': empty }">
      <FormSwitch
        :model-value="asBoolean('dataZoom')"
        :disabled="empty"
        @update:model-value="setField('dataZoom', Boolean($event))"
      />
    </FormItem>
  </div>
</template>

<script lang="ts" setup>
import type { ChartFieldsEmits, ChartPanelValue } from "../../ChartPanel/types";
import type { ChartScatterConfig } from "../types";
import { SYMBOL_OPTIONS } from "../../constants";
import ChartPanelPosition from "../../ChartPanel/ChartPanelPosition/ChartPanelPosition.vue";
import FormInput from "@/components/Form/FormInput/FormInput.vue";
import FormItem from "@/components/Form/FormItem.vue";
import FormSelect from "@/components/Form/FormSelect/FormSelect.vue";
import FormSlider from "@/components/Form/FormSlider/FormSlider.vue";
import FormSwitch from "@/components/Form/FormSwitch/FormSwitch.vue";
import { useFieldValue } from "../../ChartPanel/useFieldValue";

const props = defineProps<{
  model: ChartScatterConfig;
  empty: boolean;
}>();

const emits = defineEmits<ChartFieldsEmits>();

const { asString, asNumber, asBoolean, asSelect } = useFieldValue(() => props.model);

function pxFormat(value: number): string {
  return `${value}px`;
}

function percentFormat(value: number): string {
  return `${value}%`;
}

function setField(key: string, value: ChartPanelValue): void {
  emits("update:field", { key, value });
}
</script>
