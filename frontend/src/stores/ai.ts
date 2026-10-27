import type { AiChatDTO, AiChatTurn, AiInfoVO } from "@/api/types";
import { aiAPI } from "@/api/modules/ai";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useStorage } from "@vueuse/core";

/** 会话列表的本地存储 key */
const STORAGE_KEY = "washy-ai-sessions";
const ACTIVE_KEY = "washy-ai-active";

/** 最多保留的会话数 / 每个会话保留的消息数 */
const MAX_SESSIONS = 30;
const MAX_MESSAGES = 80;

/** 每次请求最多携带的历史消息条数 */
const MAX_HISTORY_TURNS = 12;

/** 本地存储的写入防抖（流式输出时不能每个 token 都写一次） */
const PERSIST_DELAY = 600;

export interface AiImage {
  id: string;
  name: string;
  /** data:image/*;base64 Data URL */
  url: string;
  bytes: number;
}

export interface AiDatasetRef {
  fileName: string;
  rows: number;
  cols: number;
  /** 发给模型的数据上下文 */
  summary: string;
}

export type AiMessageStatus = "streaming" | "done" | "error" | "stopped";

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** 思考过程 */
  reasoning: string;
  images: AiImage[];
  status: AiMessageStatus;
  error?: string;
  model?: string;
  elapsedMs?: number;
  totalTokens?: number;
  createdAt: number;
}

export interface AiSession {
  id: string;
  title: string;
  messages: AiMessage[];
  /** 会话级别的数据上下文，每次请求都会带上 */
  dataset?: AiDatasetRef;
  createdAt: number;
  updatedAt: number;
}

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSession(): AiSession {
  const now = Date.now();
  return {
    id: createId(),
    title: "",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createAssistantMessage(): AiMessage {
  return {
    id: createId(),
    role: "assistant",
    content: "",
    reasoning: "",
    images: [],
    status: "streaming",
    createdAt: Date.now(),
  };
}

/** 用第一条用户消息给会话起个标题 */
function titleOf(content: string, images: AiImage[]): string {
  const text = content.replace(/\s+/g, " ").trim();
  if (text) return text.length > 32 ? `${text.slice(0, 32)}…` : text;
  return images.length > 0 ? `图片分析（${images.length} 张）` : "新对话";
}

function isSession(value: unknown): value is AiSession {
  const session = value as AiSession;
  return Boolean(
    session && typeof session.id === "string" && Array.isArray(session.messages),
  );
}

/**
 * 读取本地历史。
 * 图片是 base64，体积太大，不写入 localStorage，因此刷新后只保留文字部分。
 */
function loadSessions(): AiSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isSession).map((session) => ({
      ...session,
      title: session.title ?? "",
      messages: (session.messages ?? []).map((message) => ({
        ...message,
        content: message.content ?? "",
        reasoning: message.reasoning ?? "",
        images: [],
        status: message.status === "streaming" ? "stopped" : message.status,
      })),
    }));
  } catch {
    return [];
  }
}

export const useAiStore = defineStore("ai", () => {
  const sessions = ref<AiSession[]>(loadSessions());
  const activeId = useStorage<string>(ACTIVE_KEY, "");
  const info = ref<AiInfoVO | null>(null);
  /** /ai 接口是否可用：null 表示还没探测过 */
  const serviceReady = ref<boolean | null>(null);
  const streaming = ref(false);

  let controller: AbortController | null = null;
  let persistTimer: number | null = null;

  /* ==================== 派生状态 ==================== */

  const activeSession = computed<AiSession | null>(
    () => sessions.value.find((session) => session.id === activeId.value) ?? null,
  );

  /** 会话列表按最近更新排序 */
  const orderedSessions = computed<AiSession[]>(() =>
    [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt),
  );

  /** 当前会话是否有消息正在流式输出 */
  const activeStreaming = computed(
    () =>
      activeSession.value?.messages.some(
        (message) => message.status === "streaming",
      ) ?? false,
  );

  const canUseVision = computed(() => info.value?.visionEnabled ?? true);
  const maxImages = computed(() => info.value?.maxImages ?? 4);
  const activeMessages = computed<AiMessage[]>(
    () => activeSession.value?.messages ?? [],
  );

  /* ==================== 会话管理 ==================== */

  function ensureSession(): AiSession {
    if (activeSession.value) return activeSession.value;

    sessions.value.unshift(createSession());
    activeId.value = sessions.value[0].id;
    // unshift 之后取一次，拿到的是响应式代理
    return sessions.value[0];
  }

  function newSession(): AiSession {
    const blank = sessions.value.find(
      (session) => session.messages.length === 0,
    );
    if (blank) {
      activeId.value = blank.id;
      return blank;
    }

    sessions.value.unshift(createSession());
    activeId.value = sessions.value[0].id;
    trimSessions();
    return sessions.value[0];
  }

  function selectSession(id: string): void {
    activeId.value = id;
  }

  function deleteSession(id: string): void {
    const index = sessions.value.findIndex((session) => session.id === id);
    if (index === -1) return;

    const target = sessions.value[index];
    const hasStreaming = target.messages.some(
      (message) => message.status === "streaming",
    );
    if (hasStreaming) stop();

    sessions.value.splice(index, 1);

    if (activeId.value === id) {
      activeId.value = orderedSessions.value[0]?.id ?? "";
    }
  }

  function trimSessions(): void {
    if (sessions.value.length > MAX_SESSIONS) {
      sessions.value = sessions.value.slice(0, MAX_SESSIONS);
    }
  }

  function setDataset(dataset: AiDatasetRef | null): void {
    const session = ensureSession();
    if (dataset) {
      session.dataset = dataset;
    } else {
      delete session.dataset;
    }
    session.updatedAt = Date.now();
  }

  /* ==================== 发送 / 停止 ==================== */

  async function send(text: string, images: AiImage[] = []): Promise<void> {
    const content = text.trim();
    if ((!content && images.length === 0) || streaming.value) return;

    const session = ensureSession();

    const user: AiMessage = {
      id: createId(),
      role: "user",
      content,
      reasoning: "",
      images,
      status: "done",
      createdAt: Date.now(),
    };
    session.messages.push(user);

    if (!session.title) session.title = titleOf(content, images);
    session.updatedAt = Date.now();

    await request(session);
  }

  /** 重新生成最后一条回复 */
  async function retry(): Promise<void> {
    const session = activeSession.value;
    if (!session || streaming.value) return;

    while (
      session.messages.length > 0 &&
      session.messages[session.messages.length - 1].role === "assistant"
    ) {
      session.messages.pop();
    }
    if (session.messages.length === 0) return;

    await request(session);
  }

  function stop(): void {
    controller?.abort();
  }

  async function request(session: AiSession): Promise<void> {
    // 先按当前历史组装请求，再插入等待中的助手消息，避免把空的占位消息发给模型
    const payload = buildPayload(session);

    session.messages.push(createAssistantMessage());
    const assistant = session.messages[session.messages.length - 1];

    streaming.value = true;
    controller = new AbortController();

    try {
      await aiAPI.chatStream(
        payload,
        {
          onReasoning: (delta) => {
            assistant.reasoning += delta;
          },
          onContent: (delta) => {
            assistant.content += delta;
          },
          onDone: (done) => {
            assistant.model = done.model;
            assistant.elapsedMs = done.elapsedMs;
            assistant.totalTokens = done.totalTokens;
            if (!assistant.reasoning && done.reasoningContent) {
              assistant.reasoning = done.reasoningContent;
            }
          },
        },
        controller.signal,
      );

      // 真的收到回复，说明 /ai 接口是可用的
      serviceReady.value = true;

      if (assistant.status === "streaming") {
        if (assistant.content.trim()) {
          assistant.status = "done";
        } else {
          assistant.status = "error";
          assistant.error = "The model returned no content. Please try again.";
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        assistant.status = "stopped";
        if (!assistant.content && !assistant.reasoning) {
          assistant.error = "Generation stopped.";
        }
      } else {
        assistant.status = "error";
        assistant.error =
          err instanceof Error ? err.message : "Request failed. Please try again.";
      }
    } finally {
      streaming.value = false;
      controller = null;
      session.updatedAt = Date.now();
      schedulePersist();
    }
  }

  /**
   * 组装请求体：
   * - 只带最近若干轮，且从用户消息开始；
   * - 只有最新一轮用户消息携带图片，避免请求体越滚越大。
   */
  function buildPayload(session: AiSession): AiChatDTO {
    const history = session.messages
      .filter((message) => message.status !== "error")
      .slice(-MAX_HISTORY_TURNS);

    const lastUserIndex = history
      .map((message) => message.role)
      .lastIndexOf("user");

    const messages: AiChatTurn[] = history.map((message, index) => {
      const turn: AiChatTurn = {
        role: message.role,
        content: message.content,
      };
      if (index === lastUserIndex && message.images.length > 0) {
        turn.images = message.images.map((image) => image.url);
      }
      return turn;
    });

    while (messages.length > 0 && messages[0].role !== "user") {
      messages.shift();
    }

    return {
      messages,
      datasetContext: session.dataset?.summary,
    };
  }

  /* ==================== 能力信息 ==================== */

  async function loadInfo(): Promise<void> {
    try {
      const result = await aiAPI.info();
      if (result.code === 20000 && result.data) {
        info.value = result.data;
        serviceReady.value = true;
        return;
      }
      info.value = null;
      serviceReady.value = false;
    } catch {
      // 拿不到能力信息时按默认能力处理，同时标记接口不可用
      info.value = null;
      serviceReady.value = false;
    }
  }

  /* ==================== 本地持久化 ==================== */

  function schedulePersist(): void {
    if (persistTimer !== null) return;
    persistTimer = window.setTimeout(() => {
      persistTimer = null;
      persist();
    }, PERSIST_DELAY);
  }

  function persist(): void {
    const strip = (session: AiSession, limit: number): AiSession => ({
      ...session,
      messages: session.messages
        .slice(-limit)
        .map((message) => ({ ...message, images: [] })),
    });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          sessions.value.slice(0, MAX_SESSIONS).map((session) => strip(session, MAX_MESSAGES)),
        ),
      );
    } catch {
      // 超出配额：只保留当前会话，仍然失败就放弃本地历史
      try {
        const current = activeSession.value;
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(current ? [strip(current, 20)] : []),
        );
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  watch(sessions, schedulePersist, { deep: true });

  return {
    sessions,
    orderedSessions,
    activeId,
    activeSession,
    activeMessages,
    activeStreaming,
    streaming,
    info,
    serviceReady,
    canUseVision,
    maxImages,
    ensureSession,
    newSession,
    selectSession,
    deleteSession,
    setDataset,
    send,
    retry,
    stop,
    loadInfo,
  };
});
