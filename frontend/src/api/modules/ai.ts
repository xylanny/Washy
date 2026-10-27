import client from "@/api/client";
import type {
  AiChatDTO,
  AiChatVO,
  AiInfoVO,
  AiStreamDone,
  Result,
} from "../types";

/** 与 client.ts 使用同一个后端地址 */
const BASE_URL: string = import.meta.env.APP_API_BASE_URL ?? "";

export interface AiStreamHandlers {
  /** 思考过程增量 */
  onReasoning?: (delta: string) => void;
  /** 正文增量 */
  onContent?: (delta: string) => void;
  /** 正常结束 */
  onDone?: (done: AiStreamDone) => void;
}

interface ParsedEvent {
  event: string;
  data: string;
}

/**
 * 解析一段 SSE 事件文本。
 * Spring 的 SseEmitter 会写成 `event:content\ndata:{...}\n\n`。
 */
function parseEvent(raw: string): ParsedEvent {
  let event = "message";
  const data: string[] = [];

  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      data.push(line.slice(5).replace(/^ /, ""));
    }
  }

  return { event, data: data.join("\n") };
}

function readJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * 流式对话：逐段回调正文，返回时代表本次对话结束。
 *
 * 后端事件：reasoning / content / done / error。
 */
export async function chatStream(
  payload: AiChatDTO,
  handlers: AiStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem("token");

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/ai/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    // 保留"用户主动停止"的 AbortError，其余都当成服务不可达
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error(
      `Cannot reach the AI service at ${BASE_URL}/ai — is the backend running?`,
    );
  }

  if (response.status === 401) {
    localStorage.removeItem("token");
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (response.status === 404) {
    // 老版本的运行时还没有 /ai 接口
    throw new Error(
      `AI endpoint not found (HTTP 404) at ${BASE_URL}/ai — the running backend looks like an older build. Restart it so /api/ai/** is registered.`,
    );
  }

  if (!response.ok) {
    throw new Error(`AI request failed (HTTP ${response.status})`);
  }

  if (!response.body) {
    throw new Error("This browser does not support streaming responses.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handle = (raw: string): boolean => {
    const { event, data } = parseEvent(raw);
    if (!event || !data) return true;

    if (event === "reasoning") {
      const chunk = readJson<{ delta?: string }>(data);
      if (chunk?.delta) handlers.onReasoning?.(chunk.delta);
      return true;
    }

    if (event === "content") {
      const chunk = readJson<{ delta?: string }>(data);
      if (chunk?.delta) handlers.onContent?.(chunk.delta);
      return true;
    }

    if (event === "done") {
      handlers.onDone?.(readJson<AiStreamDone>(data) ?? {});
      return true;
    }

    if (event === "error") {
      const chunk = readJson<{ message?: string }>(data);
      throw new Error(chunk?.message || "The AI service is unavailable.");
    }

    return true;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const raw = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        handle(raw);
        boundary = buffer.indexOf("\n\n");
      }
    }

    if (buffer.trim()) handle(buffer);
  } finally {
    // 提前结束（异常 / 用户停止）时释放连接
    void reader.cancel().catch(() => undefined);
  }
}

export const aiAPI = {
  /** 当前模型能力 */
  info: (): Promise<Result<AiInfoVO>> => client.get("/ai/info"),

  /** 一次性返回完整回复 */
  chat: (data: AiChatDTO): Promise<Result<AiChatVO>> =>
    client.post("/ai/chat", data),

  /** 流式回复 */
  chatStream,
};
