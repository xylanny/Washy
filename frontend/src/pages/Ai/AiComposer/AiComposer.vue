<template>
  <div
    class="ai-composer"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div v-if="dragging" class="ai-composer__overlay">
      Drop images or a CSV / Excel file to attach
    </div>

    <div class="ai-composer__inner">
      <p v-if="notice" class="ai-composer__notice">{{ notice }}</p>

      <div class="ai-composer__box">
        <!-- 数据上下文 -->
        <div v-if="dataset || datasetLoading" class="ai-composer__dataset-row">
          <span class="ai-composer__dataset">
            <span class="ai-composer__dataset-icon" v-html="ICON_SVG_DATA"></span>

            <span class="ai-composer__dataset-name">
              {{ datasetLoading ? "Reading data…" : dataset?.fileName }}
            </span>

            <span v-if="dataset && !datasetLoading" class="ai-composer__dataset-meta">
              {{ dataset.rows.toLocaleString() }} × {{ dataset.cols }}
            </span>

            <button
              v-if="dataset && !datasetLoading"
              type="button"
              class="ai-composer__dataset-remove"
              title="Remove data context"
              @click="emits('clear-dataset')"
              v-html="ICON_SVG_CLOSE"
            ></button>
          </span>
        </div>

        <!-- 待发送的图片 -->
        <div v-if="images.length > 0" class="ai-composer__attachments">
          <figure
            v-for="image in images"
            :key="image.id"
            class="ai-composer__attachment"
          >
            <img :src="image.url" :alt="image.name" />
            <button
              type="button"
              class="ai-composer__attachment-remove"
              :title="`Remove ${image.name}`"
              @click="removeImage(image.id)"
              v-html="ICON_SVG_CLOSE"
            ></button>
          </figure>
        </div>

        <div
          ref="fieldRef"
          class="ai-composer__field"
          @keydown="handleKeydown"
          @paste="handlePaste"
        >
          <FormInput
            type="textarea"
            :rows="1"
            :model-value="draft"
            :placeholder="placeholder"
            @update:model-value="handleDraft"
          />
        </div>

        <div class="ai-composer__footer">
          <div class="ai-composer__tools">
            <button
              type="button"
              class="ai-composer__tool"
              :disabled="!visionEnabled || preparing || busy"
              :title="
                visionEnabled
                  ? `Attach images (up to ${maxImages})`
                  : 'The current model does not support images'
              "
              @click="chooseImages"
              v-html="ICON_SVG_IMAGE"
            ></button>

            <button
              type="button"
              class="ai-composer__tool"
              :disabled="busy || datasetLoading"
              title="Attach a CSV / Excel file as data context"
              @click="chooseData"
              v-html="ICON_SVG_DATA"
            ></button>

            <button
              v-if="hasTable && !dataset"
              type="button"
              class="ai-composer__table"
              :disabled="busy || datasetLoading"
              :title="tableLabel || 'Use the table you are viewing'"
              @click="emits('use-table')"
            >
              Use current table
            </button>
          </div>

          <div class="ai-composer__send-group">
            <span v-if="preparing" class="ai-composer__hint">Preparing image…</span>

            <button
              v-if="streaming"
              type="button"
              class="ai-composer__send ai-composer__send--stop"
              title="Stop generating"
              @click="emits('stop')"
              v-html="ICON_SVG_STOP"
            ></button>

            <button
              v-else
              type="button"
              class="ai-composer__send"
              :disabled="!canSend"
              :title="busy ? 'Another chat is still generating' : 'Send'"
              @click="submit"
              v-html="ICON_SVG_SEND"
            ></button>
          </div>
        </div>
      </div>

      <input
        ref="imageInputRef"
        class="ai-composer__file"
        type="file"
        accept="image/*"
        multiple
        @change="handleImageChange"
      />
      <input
        ref="dataInputRef"
        class="ai-composer__file"
        type="file"
        accept=".csv,.xlsx,.xls"
        @change="handleDataChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AiDatasetRef, AiImage } from "@/stores/ai";
import type { FormInputValue } from "@/components/Form/FormInput/types";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import FormInput from "@/components/Form/FormInput/FormInput.vue";
import { prepareImage } from "@/utils/image";
import {
  COMPOSER_PLACEHOLDER,
  ICON_SVG_CLOSE,
  ICON_SVG_DATA,
  ICON_SVG_IMAGE,
  ICON_SVG_SEND,
  ICON_SVG_STOP,
} from "../constants";

const props = withDefaults(
  defineProps<{
    /** 当前会话正在流式输出 */
    streaming?: boolean;
    /** 任意会话正在流式输出（用于禁用发送） */
    busy?: boolean;
    visionEnabled?: boolean;
    maxImages?: number;
    dataset?: AiDatasetRef | null;
    datasetLoading?: boolean;
    hasTable?: boolean;
    tableLabel?: string;
    placeholder?: string;
  }>(),
  {
    streaming: false,
    busy: false,
    visionEnabled: true,
    maxImages: 4,
    dataset: null,
    datasetLoading: false,
    hasTable: false,
    tableLabel: "",
    placeholder: COMPOSER_PLACEHOLDER,
  },
);

const emits = defineEmits<{
  send: [text: string, images: AiImage[]];
  stop: [];
  "attach-dataset": [file: File];
  "use-table": [];
  "clear-dataset": [];
}>();

const draft = defineModel<string>("draft", { default: "" });

const fieldRef = ref<HTMLElement | null>(null);
const imageInputRef = ref<HTMLInputElement | null>(null);
const dataInputRef = ref<HTMLInputElement | null>(null);

const images = ref<AiImage[]>([]);
const preparing = ref(false);
const dragging = ref(false);
const notice = ref("");

let dragDepth = 0;
let imageSeed = 0;

const canSend = computed(
  () =>
    !props.streaming &&
    !props.busy &&
    !preparing.value &&
    (draft.value.trim().length > 0 || images.value.length > 0),
);

/* ==================== 输入框 ==================== */

/** FormInput 内部的 textarea（组件没有暴露实例，这里按 DOM 取） */
function innerTextarea(): HTMLTextAreaElement | null {
  return (
    fieldRef.value?.querySelector<HTMLTextAreaElement>(".form-input__inner") ??
    null
  );
}

function resize(): void {
  const element = innerTextarea();
  if (!element) return;

  element.style.height = "auto";
  element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
}

function focus(): void {
  innerTextarea()?.focus();
}

function handleDraft(value: FormInputValue): void {
  draft.value = String(value ?? "");
}

function handleKeydown(event: KeyboardEvent): void {
  // 输入法组合中的回车不能当成发送
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;

  event.preventDefault();
  submit();
}

function submit(): void {
  if (!canSend.value) return;

  emits("send", draft.value.trim(), [...images.value]);
  draft.value = "";
  images.value = [];
  notice.value = "";
  void nextTick(resize);
}

/* ==================== 图片 ==================== */

function chooseImages(): void {
  imageInputRef.value?.click();
}

function handleImageChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  void addImages(files);
}

function removeImage(id: string): void {
  images.value = images.value.filter((image) => image.id !== id);
}

async function addImages(files: File[]): Promise<void> {
  if (files.length === 0) return;

  if (!props.visionEnabled) {
    notice.value = "The current model does not support images.";
    return;
  }

  const remaining = Math.max(0, props.maxImages - images.value.length);
  if (remaining === 0) {
    notice.value = `You can attach up to ${props.maxImages} images per message.`;
    return;
  }

  if (files.length > remaining) {
    notice.value = `Only ${remaining} more image(s) fit in one message.`;
  }

  preparing.value = true;

  try {
    for (const file of files.slice(0, remaining)) {
      const prepared = await prepareImage(file);
      images.value.push({
        id: `image-${++imageSeed}`,
        name: prepared.name,
        url: prepared.url,
        bytes: prepared.bytes,
      });
    }
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : "Could not read that image.";
  } finally {
    preparing.value = false;
  }
}

function handlePaste(event: ClipboardEvent): void {
  const files = Array.from(event.clipboardData?.files ?? []).filter((file) =>
    file.type.startsWith("image/"),
  );

  if (files.length === 0) return;

  event.preventDefault();
  void addImages(files);
}

/* ==================== 数据文件 ==================== */

function chooseData(): void {
  dataInputRef.value?.click();
}

function handleDataChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file) emits("attach-dataset", file);
}

/* ==================== 拖拽 ==================== */

function handleDragEnter(): void {
  dragDepth++;
  dragging.value = true;
}

function handleDragLeave(): void {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dragging.value = false;
}

function handleDrop(event: DragEvent): void {
  dragDepth = 0;
  dragging.value = false;

  const files = Array.from(event.dataTransfer?.files ?? []);
  const droppedImages = files.filter((file) => file.type.startsWith("image/"));
  const dataFile = files.find((file) => /\.(csv|xlsx|xls)$/i.test(file.name));

  if (droppedImages.length > 0) {
    void addImages(droppedImages);
  } else if (dataFile) {
    emits("attach-dataset", dataFile);
  }
}

watch(draft, () => {
  void nextTick(resize);
});

onMounted(resize);

defineExpose({ focus });
</script>

<style scoped lang="scss" src="./style.scss"></style>
