<template>
  <div class="chart-panel__fields">
    <FormItem prop="categoryField" label="X field">
      <FormSelect
        :model-value="asSelect('categoryField')"
        :options="categoryOptions"
        @update:model-value="setField('categoryField', $event ?? '')"
      />
    </FormItem>

    <ChartSeriesList
      :series="model.series"
      :options="valueOptions"
      :addable="valueOptions.length > 0"
      @update="handleItemUpdate"
      @add="handleAddItem"
      @remove="handleItemRemove"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ChartPanelOption, ChartFieldsEmits, ChartPanelValue } from "../../ChartPanel/types";
import type { ChartLineConfig } from "../types";
import ChartSeriesList from "../../ChartPanel/ChartSeriesList/ChartSeriesList.vue";
import FormItem from "@/components/Form/FormItem.vue";
import FormSelect from "@/components/Form/FormSelect/FormSelect.vue";
import { useFieldValue } from "../../ChartPanel/useFieldValue";

const props = defineProps<{
  model: ChartLineConfig;
  categoryOptions: ChartPanelOption[];
  valueOptions: ChartPanelOption[];
}>();

const emits = defineEmits<ChartFieldsEmits>();

const { asSelect } = useFieldValue(() => props.model);

function setField(key: string, value: ChartPanelValue): void {
  emits("update:field", { key, value });
}

function handleAddItem(): void {
  emits("add:item");
}

function handleItemUpdate(index: number, key: string, value: string): void {
  emits("update:item", { index, key, value });
}

function handleItemRemove(index: number): void {
  emits("remove:item", index);
}
</script>
