<template>
  <div class="chart-panel__fields">
    <FormItem prop="nameField" label="Name field">
      <FormSelect
        :model-value="asSelect('nameField')"
        :options="categoryOptions"
        @update:model-value="setField('nameField', $event ?? '')"
      />
    </FormItem>

    <FormItem prop="valueField" label="Value field">
      <FormSelect
        :model-value="asSelect('valueField')"
        :options="valueOptions"
        :disabled="!valueOptions.length"
        @update:model-value="setField('valueField', $event ?? '')"
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
import type { ChartPieConfig } from "../types";
import FormItem from "@/components/Form/FormItem.vue";
import FormSelect from "@/components/Form/FormSelect/FormSelect.vue";
import { useFieldValue } from "../../ChartPanel/useFieldValue";

const props = defineProps<{
  model: ChartPieConfig;
  categoryOptions: ChartPanelOption[];
  valueOptions: ChartPanelOption[];
}>();

const emits = defineEmits<ChartFieldsEmits>();

const { asSelect } = useFieldValue(() => props.model);

function setField(key: string, value: ChartPanelValue): void {
  emits("update:field", { key, value });
}
</script>
