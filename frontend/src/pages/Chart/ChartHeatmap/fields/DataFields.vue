<template>
  <div class="chart-panel__fields">
    <FormItem prop="xField" label="X field">
      <FormSelect
        :model-value="asSelect('xField')"
        :options="categoryOptions"
        @update:model-value="setField('xField', $event ?? '')"
      />
    </FormItem>
  </div>
</template>

<script lang="ts" setup>
import type {
  ChartPanelOption,
  ChartFieldsEmits,
  ChartPanelValue,
} from "../../ChartPanel/types";
import type { ChartHeatmapConfig } from "../types";
import FormItem from "@/components/Form/FormItem.vue";
import FormSelect from "@/components/Form/FormSelect/FormSelect.vue";
import { useFieldValue } from "../../ChartPanel/useFieldValue";

const props = defineProps<{
  model: ChartHeatmapConfig;
  categoryOptions: ChartPanelOption[];
}>();

const emits = defineEmits<ChartFieldsEmits>();

const { asSelect } = useFieldValue(() => props.model);

function setField(key: string, value: ChartPanelValue): void {
  emits("update:field", { key, value });
}
</script>
