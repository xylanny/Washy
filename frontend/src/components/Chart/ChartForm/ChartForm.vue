<template>
  <Form class="chart-form" :model="model" :rules="rules">
    <Collapse v-model="activeSections">
      <CollapseItem v-for="group in groups" :key="group.name" :name="group.name">
        <template #title>
          <span class="chart-form__group-name">{{ group.title }}</span>
          <span
            v-if="group.summary && !isOpen(group.name)"
            class="chart-form__group-meta"
          >
            {{ group.summary }}
          </span>
        </template>

        <FormItem
          v-for="field in group.fields"
          :key="field.prop"
          :label="field.label"
          :prop="field.prop"
          :class="{ 'chart-form__row--off': field.disabled }"
        >
          <FormSwitch
            v-if="field.control === 'switch'"
            :model-value="asBoolean(field.prop)"
            @update:model-value="setValue(field.prop, $event)"
          />

          <FormSegmented
            v-else-if="field.control === 'segmented'"
            :model-value="asValue(field.prop)"
            :options="field.options ?? []"
            :disabled="field.disabled"
            @update:model-value="setValue(field.prop, $event)"
          />

          <FormSelect
            v-else-if="field.control === 'select'"
            :model-value="asValue(field.prop)"
            :options="field.options ?? []"
            :disabled="field.disabled"
            @update:model-value="setValue(field.prop, $event)"
          />

          <FormSlider
            v-else-if="field.control === 'slider'"
            :model-value="asNumber(field.prop)"
            :min="field.min ?? 0"
            :max="field.max ?? 100"
            :step="field.step ?? 1"
            :disabled="field.disabled"
            :format-value="field.format"
            @update:model-value="setValue(field.prop, $event)"
          />

          <FormColor
            v-else-if="field.control === 'color'"
            :model-value="asString(field.prop)"
            :disabled="field.disabled"
            @update:model-value="setValue(field.prop, $event)"
          />

          <FormInput
            v-else
            :model-value="asValue(field.prop)"
            :disabled="field.disabled"
            clearable
            @update:model-value="setValue(field.prop, $event)"
          />
        </FormItem>
      </CollapseItem>
    </Collapse>
  </Form>
</template>

<script lang="ts" setup>
import type { CollapseItemName } from "@/components/Collapse/types";
import type { ChartFormProps } from "./types";
import { ref, watch } from "vue";
import Collapse from "@/components/Collapse/Collapse.vue";
import CollapseItem from "@/components/Collapse/CollapseItem.vue";
import Form from "@/components/Form/Form.vue";
import FormColor from "@/components/Form/FormColor/FormColor.vue";
import FormInput from "@/components/Form/FormInput/FormInput.vue";
import FormItem from "@/components/Form/FormItem.vue";
import FormSegmented from "@/components/Form/FormSegmented/FormSegmented.vue";
import FormSelect from "@/components/Form/FormSelect/FormSelect.vue";
import FormSlider from "@/components/Form/FormSlider/FormSlider.vue";
import FormSwitch from "@/components/Form/FormSwitch/FormSwitch.vue";
import { getPathValue, setPathValue } from "@/utils/objectPath";

const props = withDefaults(defineProps<ChartFormProps>(), {
  rules: undefined,
  defaultOpen: () => [],
});

const activeSections = ref<CollapseItemName[]>([
  ...(props.defaultOpen as CollapseItemName[]),
]);

// 切换图表类型（换一份 schema）时，重新按 defaultOpen 展开
watch(
  () => props.groups,
  () => {
    activeSections.value = [...(props.defaultOpen as CollapseItemName[])];
  },
);

function isOpen(name: string): boolean {
  return activeSections.value.includes(name);
}

function getValue(prop: string): unknown {
  return getPathValue(props.model, prop);
}

/** 各控件对值的类型要求不同，这里按控件收窄 */
function asValue(prop: string): string | number | undefined {
  const value = getValue(prop);

  if (typeof value === "string" || typeof value === "number") return value;

  return undefined;
}

function asString(prop: string): string | undefined {
  const value = getValue(prop);

  return typeof value === "string" ? value : undefined;
}

function asNumber(prop: string): number | undefined {
  const value = getValue(prop);

  return typeof value === "number" ? value : Number(value) || 0;
}

function asBoolean(prop: string): boolean {
  return Boolean(getValue(prop));
}

function setValue(prop: string, value: unknown): void {
  setPathValue(props.model, prop, value);
}
</script>

<style lang="scss" scoped src="./style.scss"></style>
