<template>
  <section class="ai">
    <div class="ai__body">
      <AiSessionList
        :sessions="orderedSessions"
        :active-id="aiStore.activeId"
        :model="info?.model"
        :open="railOpen"
        @create="handleNewSession"
        @select="handleSelect"
        @remove="aiStore.deleteSession"
      />

      <div
        v-if="railOpen"
        class="ai__rail-overlay"
        @click="railOpen = false"
      ></div>

      <div class="ai__chat">
        <button
          type="button"
          class="ai__rail-toggle"
          title="Chats"
          @click="railOpen = true"
          v-html="ICON_SVG_MENU"
        ></button>

        <p v-if="serviceWarning" class="ai__notice">
          <span>{{ serviceWarning }}</span>
          <span class="ai__notice-actions">
            <button
              type="button"
              class="ai__notice-action"
              @click="checkService"
            >
              Check again
            </button>
            <button
              type="button"
              class="ai__notice-close"
              title="Dismiss"
              @click="dismissed = true"
              v-html="ICON_SVG_CLOSE"
            ></button>
          </span>
        </p>

        <p v-if="notice" class="ai__notice">
          <span>{{ notice }}</span>
          <button
            type="button"
            class="ai__notice-close"
            title="Dismiss"
            @click="notice = ''"
            v-html="ICON_SVG_CLOSE"
          ></button>
        </p>

        <!-- 空会话：引导 -->
        <div v-if="activeMessages.length === 0" class="ai__empty">
          <span class="ai__empty-icon" v-html="ICON_SVG_SPARK"></span>
          <h2 class="ai__empty-title">{{ EMPTY_STATE.title }}</h2>
          <p class="ai__empty-hint">{{ EMPTY_STATE.hint }}</p>
        </div>

        <!-- 对话内容 -->
        <div v-else ref="messagesRef" class="ai__messages">
          <div class="ai__messages-inner">
            <AiMessage
              v-for="message in activeMessages"
              :key="message.id"
              :message="message"
              @retry="aiStore.retry()"
            />
          </div>
        </div>

        <AiComposer
          ref="composerRef"
          v-model:draft="draft"
          :streaming="activeStreaming"
          :busy="aiStore.streaming"
          :vision-enabled="canUseVision"
          :max-images="maxImages"
          :dataset="activeSession?.dataset ?? null"
          :dataset-loading="datasetLoading"
          :has-table="hasTable"
          :table-label="tableLabel"
          @send="handleSend"
          @stop="aiStore.stop()"
          @attach-dataset="handleAttachDataset"
          @use-table="handleUseTable"
          @clear-dataset="aiStore.setDataset(null)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AiImage } from "@/stores/ai";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAiStore } from "@/stores/ai";
import { useTableStore } from "@/stores/table";
import { buildDatasetDigest, parseDataFile } from "@/utils/dataset";
import AiSessionList from "./AiSessionList/AiSessionList.vue";
import AiMessage from "./AiMessage/AiMessage.vue";
import AiComposer from "./AiComposer/AiComposer.vue";
import {
  EMPTY_STATE,
  ICON_SVG_CLOSE,
  ICON_SVG_MENU,
  ICON_SVG_SPARK,
} from "./constants";

const aiStore = useAiStore();
const tableStore = useTableStore();

const {
  activeSession,
  activeMessages,
  activeStreaming,
  orderedSessions,
  canUseVision,
  maxImages,
  info,
  serviceReady,
} = storeToRefs(aiStore);

const messagesRef = ref<HTMLElement | null>(null);
const composerRef = ref<InstanceType<typeof AiComposer> | null>(null);

const draft = ref("");
const notice = ref("");
const datasetLoading = ref(false);
const railOpen = ref(false);
const dismissed = ref(false);

const hasTable = computed(() => Boolean(tableStore.table));

const serviceWarning = computed(() => {
  if (serviceReady.value !== false || dismissed.value) return "";
  return "AI service unavailable at /api/ai — is the backend running?";
});

const tableLabel = computed(() => {
  const table = tableStore.table;
  if (!table) return "";
  const rows = table.rows.length.toLocaleString();
  return `${table.fileName || "Table"} · ${rows} rows × ${table.headers.length} cols`;
});

/** 最后一条消息的长度，用来在流式输出时跟随滚动 */
const lastMessageLength = computed(() => {
  const list = activeMessages.value;
  const last = list[list.length - 1];
  return last ? last.content.length + last.reasoning.length : 0;
});

function handleNewSession(): void {
  aiStore.newSession();
  railOpen.value = false;
  notice.value = "";
  void nextTick(() => composerRef.value?.focus());
}

function handleSelect(id: string): void {
  aiStore.selectSession(id);
  railOpen.value = false;
}

/** 重新探测 AI 服务（后端重启后无需刷新页面） */
async function checkService(): Promise<void> {
  dismissed.value = false;
  await aiStore.loadInfo();
}

/* ==================== 发送与附件 ==================== */

function handleSend(text: string, images: AiImage[]): void {
  notice.value = "";
  void aiStore.send(text, images);
}

async function handleAttachDataset(file: File): Promise<void> {
  datasetLoading.value = true;
  notice.value = "";

  try {
    const table = await parseDataFile(file);
    aiStore.setDataset(buildDatasetDigest(table, file.name));
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : "Could not read that data file.";
  } finally {
    datasetLoading.value = false;
  }
}

function handleUseTable(): void {
  const table = tableStore.table;
  if (!table) return;

  notice.value = "";
  aiStore.setDataset(buildDatasetDigest(table, table.fileName));
}

function nearBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 160;
}

async function follow(): Promise<void> {
  const element = messagesRef.value;
  if (!element) return;

  const shouldFollow = nearBottom(element);
  await nextTick();

  if (shouldFollow && messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
}

async function scrollToBottom(): Promise<void> {
  await nextTick();
  const element = messagesRef.value;
  if (element) element.scrollTop = element.scrollHeight;
}

watch([() => activeMessages.value.length, lastMessageLength], () => {
  void follow();
});

watch(
  () => aiStore.activeId,
  () => {
    void scrollToBottom();
  },
);

onMounted(() => {
  void aiStore.loadInfo();

  if (!aiStore.activeSession && aiStore.orderedSessions.length > 0) {
    aiStore.selectSession(aiStore.orderedSessions[0].id);
  }

  void scrollToBottom();
});
</script>

<style scoped lang="scss" src="./style.scss"></style>
