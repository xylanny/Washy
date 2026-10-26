<template>
  <div class="chart-panel__fields">
    <FormItem prop="showLegend" label="Show legend">
      <FormSwitch
        :model-value="asBoolean('showLegend')"
        @update:model-value="setField('showLegend', Boolean($event))"
      />
    </FormItem>

    <FormItem
      prop="legendPosition"
      label="Placement"
      :class="{ 'is-off': !model.showLegend }"
    >
      <ChartPanelPosition
        :model-value="asString('legendPosition')"
        :disabled="!model.showLegend"
        @update:model-value="setField('legendPosition', $event)"
      />
    </FormItem>
  </div>
</template>

<script lang="ts" setup>
import type { ChartFieldsEmits, ChartPanelValue } from "../../ChartPanel/types";
import type { ChartLineConfig } from "../types";
import ChartPanelPosition from "../../ChartPanel/ChartPanelPosition/ChartPanelPosition.vue";
import FormItem from "@/components/Form/FormItem.vue";
import FormSwitch from "@/components/Form/FormSwitch/FormSwitch.vue";
import { useFieldValue } from "../../ChartPanel/useFieldValue";

const props = defineProps<{ model: ChartLineConfig }>();

const emits = defineEmits<ChartFieldsEmits>();

const { asString, asBoolean } = useFieldValue(() => props.model);

function setField(key: string, value: ChartPanelValue): void {
  emits("update:field", { key, value });
}
</script>
