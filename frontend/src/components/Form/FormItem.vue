<template>
  <div
    class="form-item"
    :class="[
      `is-${validateState}`,
      `is-label-${labelPosition}`,
      {
        'is-required': isRequired,
        'is-error': validateState === 'error',
      },
    ]"
  >
    <label
      v-if="label || $slots.label"
      class="form-item__label"
      :for="inputIds[0] || itemId"
      :style="labelStyle"
    >
      <slot name="label" :label="label">{{ label }}</slot>
    </label>
    <div class="form-item__content">
      <slot></slot>

      <transition name="zoom-in-top">
        <div
          v-if="validateState === 'error'"
          class="form-item__error"
          role="alert"
        >
          <slot name="error" :message="validateMessage">{{
            validateMessage
          }}</slot>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {
  FormItemSlots,
  FormItemProps,
  RuleItem,
  ValidateState,
  FormItemContext,
  FormItemExposes,
} from "./types";
import { formContextKey, formItemContextKey } from "./constants";
import {
  computed,
  inject,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
} from "vue";
import { isArray, isEmptyValue, isString } from "@/utils/judge";

const props = defineProps<FormItemProps>();

defineSlots<FormItemSlots>();

const formContext = inject(formContextKey, undefined);

const fieldValue = computed(() => formContext?.model?.[props.prop]);

const normalizeRules = computed<RuleItem[]>(() => {
  const raw = formContext?.rules?.[props.prop];

  if (!raw) {
    return [];
  }

  return isArray(raw) ? raw : [raw];
});

const isRequired = computed(
  () => props.required || normalizeRules.value.some((r) => r.required),
);

const validateState = ref<ValidateState>("");
const validateMessage = ref("");

const inputIds = ref<string[]>([]);

function addInputId(id: string) {
  if (!inputIds.value.includes(id)) {
    inputIds.value.push(id);
  }
}

function removeInputId(id: string) {
  const i = inputIds.value.indexOf(id);

  if (i > -1) {
    inputIds.value.splice(i, 1);
  }
}

const itemId = `form-item-${props.prop}`;

async function validateRule(rule: RuleItem, trigger: string): Promise<boolean> {
  if (trigger && rule.trigger) {
    const triggers = isArray(rule.trigger) ? rule.trigger : [rule.trigger];

    if (!triggers.includes(trigger as any)) {
      return true;
    }
  }

  const value = fieldValue;

  if (rule.required) {
    const empty = isEmptyValue(value);

    if (empty) {
      validateMessage.value =
        rule.message || `${props.label || props.prop} is required`;

      return false;
    }
  }

  if (rule.validator) {
    try {
      const ok = await rule.validator(value, formContext?.model ?? {});

      if (!ok) {
        validateMessage.value = rule.message || "Validation failed";

        return false;
      }
    } catch (err) {
      validateMessage.value = isString(err)
        ? err
        : rule.message || "Validation failed";

      return false;
    }
  }

  return true;
}

async function validate(trigger = ""): Promise<boolean> {
  const rules = normalizeRules.value;

  if (!rules.length && !props.required) {
    validateState.value = "";
    validateMessage.value = "";

    return true;
  }

  validateState.value = "validating";

  for (const rule of rules.length
    ? rules
    : [{ require: props.required } as RuleItem]) {
    const ok = await validateRule(rule, trigger);

    if (!ok) {
      validateState.value = "error";

      return false;
    }
  }

  validateState.value = "success";
  validateMessage.value = "";

  return true;
}

function clearValidate() {
  validateState.value = "";
  validateMessage.value = "";
}

function resetField() {
  clearValidate();

  if (formContext) formContext.model[props.prop] = undefined;
}

const itemContext: FormItemContext = reactive({
  prop: props.prop,
  get validateState() {
    return validateState.value;
  },
  validate,
  resetField,
  clearValidate,
  inputIds: inputIds.value,
  addInputId,
  removeInputId,
});

onMounted(() => formContext?.addField(itemContext));
onUnmounted(() => formContext?.removeField(itemContext));

// 供 FormSelect 等控件注入，用于读取校验状态与登记控件 id
provide(formItemContextKey, itemContext);

const labelWidth = computed(
  () => props.labelWidth ?? formContext?.labelWidth ?? "auto",
);

const labelPosition = computed(() => formContext?.labelPosition ?? "right");

const labelStyle = computed(() => {
  if (labelPosition.value === "top") {
    return undefined;
  }

  const width = labelWidth.value;

  return { width: typeof width === "number" ? `${width}px` : width };
});

defineExpose<FormItemExposes>({
  validate,
  resetField,
  clearValidate,
  get validateState() {
    return validateState.value;
  },
  get validateMessage() {
    return validateMessage.value;
  },
});
</script>

<style lang="scss" scoped src="./style.scss"></style>
