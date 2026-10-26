<template>
  <div class="chart-panel__fields" :class="{ 'is-off': empty }">
    <FormItem prop="showVisualMap" label="Color scale">
      <FormSwitch
        :model-value="asBoolean('showVisualMap')"
        :disabled="empty"
        @update:model-value="setField('showVisualMap', Boolean($event))"
      />
    </FormItem>

    <FormItem prop="showLabels" label="Cell labels">
      <FormSwitch
        :model-value="asBoolean('showLabels')"
        :disabled="empty"
        @update:model-value="setField('showLabels', Boolean($event))"
      />
    </FormItem>

    <FormItem prop="palette" label="Palette">
      <FormSelect
        :model-value="asSelect('palette')"
        :options="PALETTE_OPTIONS"
        :disabled="empty"
        @update:model-value="setField('palette', $event ?? 'spectrum')"
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
import type { ChartHeatmapConfig } from "../types";
import { PALETTE_OPTIONS } from "../constants";
import FormInput from "@/components/Form/FormInput/FormInput.vue";
import FormItem from "@/components/Form/FormItem.vue";
import FormSelect from "@/components/Form/FormSelect/FormSelect.vue";
import FormSwitch from "@/components/Form/FormSwitch/FormSwitch.vue";
import { useFieldValue } from "../../ChartPanel/useFieldValue";

const props = defineProps<{
  model: ChartHeatmapConfig;
  empty: boolean;
}>();

const emits = defineEmits<ChartFieldsEmits>();

const { asString, asBoolean, asSelect } = useFieldValue(() => props.model);

function setField(key: string, value: ChartPanelValue): void {
  emits("update:field", { key, value });
}
</script>
