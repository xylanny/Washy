<template>
  <div class="chart-panel__fields" :class="{ 'is-off': empty }">
    <FormItem prop="innerRadius" label="Inner radius">
      <FormSlider
        :model-value="asNumber('innerRadius')"
        :min="0"
        :max="80"
        :step="5"
        :disabled="empty"
        :format-value="percentFormat"
        @update:model-value="setField('innerRadius', $event ?? 0)"
      />
    </FormItem>

    <FormItem prop="labelPosition" label="Labels">
      <FormSelect
        :model-value="asSelect('labelPosition')"
        :options="LABEL_OPTIONS"
        :disabled="empty"
        @update:model-value="setField('labelPosition', $event ?? 'outside')"
      />
    </FormItem>

    <FormItem prop="labelType" label="Label content">
      <FormSelect
        :model-value="asSelect('labelType')"
        :options="LABEL_TYPE_OPTIONS"
        :disabled="empty"
        @update:model-value="setField('labelType', $event ?? 'percent')"
      />
    </FormItem>

    <FormItem prop="rose" label="Rose">
      <FormSelect
        :model-value="asSelect('rose')"
        :options="ROSE_OPTIONS"
        :disabled="empty"
        @update:model-value="setField('rose', $event ?? 'none')"
      />
    </FormItem>

    <FormItem prop="showLegend" label="Show legend">
      <FormSwitch
        :model-value="asBoolean('showLegend')"
        :disabled="empty"
        @update:model-value="setField('showLegend', Boolean($event))"
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
  </div>
</template>

<script lang="ts" setup>
import type { ChartFieldsEmits, ChartPanelValue } from "../../ChartPanel/types";
import type { ChartPieConfig } from "../types";
import { LABEL_OPTIONS, LABEL_TYPE_OPTIONS, ROSE_OPTIONS } from "../constants";
import FormInput from "@/components/Form/FormInput/FormInput.vue";
import FormItem from "@/components/Form/FormItem.vue";
import FormSelect from "@/components/Form/FormSelect/FormSelect.vue";
import FormSlider from "@/components/Form/FormSlider/FormSlider.vue";
import FormSwitch from "@/components/Form/FormSwitch/FormSwitch.vue";
import { useFieldValue } from "../../ChartPanel/useFieldValue";

const props = defineProps<{
  model: ChartPieConfig;
  empty: boolean;
}>();

const emits = defineEmits<ChartFieldsEmits>();

const { asString, asNumber, asBoolean, asSelect } = useFieldValue(() => props.model);

function percentFormat(value: number): string {
  return `${value}%`;
}

function setField(key: string, value: ChartPanelValue): void {
  emits("update:field", { key, value });
}
</script>
