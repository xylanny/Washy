<template>
  <article class="ai-message" :class="`ai-message--${message.role}`">
    <!-- 用户消息：右侧气泡 + 图片 -->
    <template v-if="message.role === 'user'">
      <div v-if="message.images.length > 0" class="ai-message__images">
        <button
          v-for="image in message.images"
          :key="image.id"
          type="button"
          class="ai-message__image"
          :title="image.name"
          @click="previewUrl = image.url"
        >
          <img :src="image.url" :alt="image.name" />
        </button>
      </div>

      <div v-if="message.content" class="ai-message__bubble">
        {{ message.content }}
      </div>
    </template>

    <!-- 助手消息：全宽正文 -->
    <template v-else>
      <div v-if="message.reasoning" class="ai-message__reasoning">
        <button
          type="button"
          class="ai-message__reasoning-toggle"
          @click="reasoningOpen = !reasoningOpen"
        >
          <span
            class="ai-message__chevron"
            :class="{ 'is-open': showReasoning }"
            v-html="ICON_SVG_CHEVRON"
          ></span>
          <span>{{ showReasoning ? "Hide thinking" : "Show thinking" }}</span>
        </button>

        <p v-if="showReasoning" class="ai-message__reasoning-text">
          {{ message.reasoning }}
        </p>
      </div>

      <div class="ai-message__content">
        <div
          v-if="message.content"
          class="ai-message__body"
          v-html="html"
        ></div>
        <p
          v-else-if="message.status === 'streaming'"
          class="ai-message__pending"
        >
          {{ message.reasoning ? "Thinking…" : "Waiting for the model…" }}
        </p>

        <span
          v-if="message.status === 'streaming' && message.content"
          class="ai-message__caret"
        ></span>
      </div>

      <p v-if="message.error" class="ai-message__notice">
        {{ message.error }}
      </p>

      <footer v-if="message.status !== 'streaming'" class="ai-message__footer">
        <span class="ai-message__meta">{{ meta }}</span>

        <div class="ai-message__actions">
          <button
            v-if="message.content"
            type="button"
            class="ai-message__action"
            :title="copied ? 'Copied' : 'Copy'"
            @click="copy"
            v-html="copied ? ICON_SVG_CHECK : ICON_SVG_COPY"
          ></button>

          <button
            v-if="message.status === 'error'"
            type="button"
            class="ai-message__action"
            title="Retry"
            @click="emits('retry')"
            v-html="ICON_SVG_RETRY"
          ></button>
        </div>
      </footer>
    </template>

    <Teleport to="body">
      <div
        v-if="previewUrl"
        class="ai-message__preview"
        @click="previewUrl = ''"
      >
        <img :src="previewUrl" alt="attachment preview" />
      </div>
    </Teleport>
  </article>
</template>

<script setup lang="ts">
import type { AiMessage } from "@/stores/ai";
import { computed, ref } from "vue";
import { renderMarkdown } from "@/utils/markdown";
import {
  ICON_SVG_CHECK,
  ICON_SVG_CHEVRON,
  ICON_SVG_COPY,
  ICON_SVG_RETRY,
} from "../constants";

const props = defineProps<{ message: AiMessage }>();

const emits = defineEmits<{ retry: [] }>();

const reasoningOpen = ref(false);
const copied = ref(false);
const previewUrl = ref("");

const html = computed(() => renderMarkdown(props.message.content));

/** 流式输出时默认展开思考过程 */
const showReasoning = computed(
  () => reasoningOpen.value || props.message.status === "streaming",
);

const meta = computed(() => {
  const parts: string[] = [];

  if (props.message.model) parts.push(props.message.model);
  if (props.message.elapsedMs)
    parts.push(formatDuration(props.message.elapsedMs));
  if (props.message.totalTokens)
    parts.push(`${props.message.totalTokens} tokens`);

  return parts.join(" · ");
});

function formatDuration(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.message.content);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1600);
  } catch {
    copied.value = false;
  }
}
</script>

<style scoped lang="scss" src="./style.scss"></style>
