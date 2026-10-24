<template>
  <form class="form" @submit.prevent>
    <slot></slot>
  </form>
</template>

<script lang="ts" setup>
import type {
  FormItemContext,
  FormEmits,
  FormProps,
  FormContext,
  FormExposes,
  FormSlots,
} from "./types";
import { provide, reactive, ref } from "vue";
import { formContextKey } from "./constants";

const props = withDefaults(defineProps<FormProps>(), {
  rules: () => ({}),
  labelWidth: "auto",
  labelPosition: "right",
});

const emits = defineEmits<FormEmits>();

defineSlots<FormSlots>();

const fields = ref<FormItemContext[]>([]);

function addField(field: FormItemContext) {
  if (!fields.value.includes(field)) {
    fields.value.push(field);
  }
}

function removeField(field: FormItemContext) {
  const i = fields.value.indexOf(field);

  if (i > -1) fields.value.splice(i, 1);
}

async function validateField(prop: string, trigger = ""): Promise<boolean> {
  const field = fields.value.find((f) => f.prop === prop);

  if (!field) {
    return true;
  }

  const ok = await field.validate(trigger);

  emits("validate", prop, ok, ok ? undefined : "");

  return ok;
}

async function validate(): Promise<boolean> {
  const result = await Promise.all(
    fields.value.map(async (f) => {
      const ok = await f.validate("");

      emits("validate", f.prop, ok);

      return ok;
    }),
  );

  return result.every(Boolean);
}

function resetFields() {
  fields.value.forEach((f) => f.resetField());
}

function clearValidate(props?: string[]) {
  fields.value
    .filter((f) => !props || props.includes(f.prop))
    .forEach((f) => f.clearValidate());
}

const context: FormContext = reactive({
  model: props.model,
  rules: props.rules,
  labelWidth: props.labelWidth,
  labelPosition: props.labelPosition,
  addField,
  removeField,
  validateField,
  resetField: (prop: string) => {
    fields.value.find((f) => f.prop === prop)?.resetField();
  },
});
provide(formContextKey, context);

defineExpose<FormExposes>({
  validate,
  validateField,
  resetFields,
  clearValidate,
});
</script>
