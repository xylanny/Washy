<template>
  <div class="chart-panel__fields" :class="{ 'is-off': empty }">
    <FormItem prop="horizontal" label="Orientation">
      <FormSelect
        :model-value="asBoolean('horizontal') ? 'horizontal' : 'vertical'"
        :options="ORIENTATION_OPTIONS"
        :disabled="empty"
        @update:model-value="setField('horizontal', $event === 'horizontal')"
      />
    </FormItem>

    <FormItem prop="barWidth" label="Bar width">
      <FormSlider
        :model-value="asNumber('barWidth')"
        :min="4"
        :max="40"
        :step="1"
        :disabled="empty"
        :format-value="pxFormat"
        @update:model-value="setField('barWidth', $event ?? 16)"
      />
    </FormItem>

    <FormItem prop="borderRadius" label="Corner radius">
      <FormSlider
        :model-value="asNumber('borderRadius')"
        :min="0"
        :max="12"
        :step="1"
        :disabled="empty"
        :format-value="pxFormat"
        @update:model-value="setField('borderRadius', $event ?? 0)"
      />
    </FormItem>

    <FormItem prop="showValues" label="Show values">
      <FormSwitch
        :model-value="asBoolean('showValues')"
        :disabled="empty"
        @update:model-value="setField('showValues', Boolean($event))"
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

    <FormItem prop="xLabelRotate" label="X labels">
      <FormSelect
        :model-value="asNumber('xLabelRotate') ?? 0"
        :options="ROTATE_OPTIONS"
        :disabled="empty"
        @update:model-value="setField('xLabelRotate', Number($event ?? 0))"
      />
    </FormItem>

    <FormItem prop="showGridY" label="Y grid">
      <FormSwitch
        :model-value="asBoolean('showGridY')"
        :disabled="empty"
        @update:model-value="setField('showGridY', Boolean($event))"
      />
    </FormItem>

    <FormItem prop="yScale" label="Fit Y">
      <FormSwitch
        :model-value="asBoolean('yScale')"
        :disabled="empty"
        @update:model-value="setField('yScale', Boolean($event))"
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
import type { ChartBarConfig } from "../types";
import { ORIENTATION_OPTIONS } from "../constants";
import { ROTATE_OPTIONS } from "../../constants";
import ChartPanelPosition from "../../ChartPanel/ChartPanelPosition/ChartPanelPosition.vue";
import FormInput from "@/components/Form/FormInput/FormInput.vue";
import FormItem from "@/components/Form/FormItem.vue";
import FormSelect from "@/components/Form/FormSelect/FormSelect.vue";
import FormSlider from "@/components/Form/FormSlider/FormSlider.vue";
import FormSwitch from "@/components/Form/FormSwitch/FormSwitch.vue";
import { useFieldValue } from "../../ChartPanel/useFieldValue";

const props = defineProps<{
  model: ChartBarConfig;
  empty: boolean;
}>();

const emits = defineEmits<ChartFieldsEmits>();

const { asString, asNumber, asBoolean } = useFieldValue(() => props.model);

function pxFormat(value: number): string {
  return `${value}px`;
}

function setField(key: string, value: ChartPanelValue): void {
  emits("update:field", { key, value });
}
</script>
