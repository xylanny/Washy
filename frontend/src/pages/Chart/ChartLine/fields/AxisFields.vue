<template>
  <div class="chart-panel__fields">
    <FormItem prop="valueUnit" label="Value unit">
      <FormInput
        :model-value="asString('valueUnit')"
        placeholder="e.g. %"
        clearable
        @update:model-value="setField('valueUnit', $event ?? '')"
      />
    </FormItem>

    <FormItem prop="xLabelRotate" label="X labels" :class="{ 'is-off': empty }">
      <FormSelect
        :model-value="asNumber('xLabelRotate') ?? 0"
        :options="ROTATE_OPTIONS"
        :disabled="empty"
        @update:model-value="setField('xLabelRotate', Number($event ?? 0))"
      />
    </FormItem>

    <FormItem prop="yScale" label="Fit Y" :class="{ 'is-off': empty }">
      <FormSwitch
        :model-value="asBoolean('yScale')"
        :disabled="empty"
        @update:model-value="setField('yScale', Boolean($event))"
      />
    </FormItem>

    <FormItem prop="showGridY" label="Y grid" :class="{ 'is-off': empty }">
      <FormSwitch
        :model-value="asBoolean('showGridY')"
        :disabled="empty"
        @update:model-value="setField('showGridY', Boolean($event))"
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
import type { ChartLineConfig } from "../types";
import { ROTATE_OPTIONS } from "../../constants";
import FormInput from "@/components/Form/FormInput/FormInput.vue";
import FormItem from "@/components/Form/FormItem.vue";
import FormSelect from "@/components/Form/FormSelect/FormSelect.vue";
import FormSwitch from "@/components/Form/FormSwitch/FormSwitch.vue";
import { useFieldValue } from "../../ChartPanel/useFieldValue";

const props = defineProps<{
  model: ChartLineConfig;
  empty: boolean;
}>();

const emits = defineEmits<ChartFieldsEmits>();

const { asString, asNumber, asBoolean } = useFieldValue(() => props.model);

function setField(key: string, value: ChartPanelValue): void {
  emits("update:field", { key, value });
}
</script>
