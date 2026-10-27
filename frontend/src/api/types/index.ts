
export interface Result<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface UserUpdateDTO {
  userName?: string;
  userAvatar?: string;
}

export interface ResultUserVO {
  code?: number;
  message?: string;
  data?: UserVO;
}

export interface UserVO {
  id?: number;
  userName?: string;
  userAvatar?: string;
  userEmail?: string;
  userRole?: string;
  createTime?: string;
  updateTime?: string;
  token?: string;
}

export interface UserRegisterDTO {
  userName?: string;
  userEmail?: string;
  emailCode?: string;
  userPassword?: string;
  checkedPassword?: string;
}

export interface UserLoginDTO {
  userEmail?: string;
  userPassword?: string;
}

export interface KMeansDTO {
  file?: string;
  columns?: string[];
  k?: number;
  maxIterations?: number;
  tolerance?: number;
  seed?: number;
}

export interface KMeansVO {
  k?: number;
  labels?: number[];
  centroids?: number[][];
  silhouetteScore?: number;
  nums?: number[];
}

export interface ResultKMeansVO {
  code?: number;
  message?: string;
  data?: KMeansVO;
}

export interface ChartAnalysisDTO {
  file?: string;
  x?: string;
  y?: string;
  chartType?: string;
  chartGoal?: string;
}

export interface ChartAnalysisVO {
  process?: string;
  chartConclusion?: string;
}

export interface ResultChartAnalysisVO {
  code?: number;
  message?: string;
  data?: ChartAnalysisVO;
}

/** ===== AI 对话 ===== */

/** 一条对话消息：content 为文本，images 为 data:image/*;base64 Data URL */
export interface AiChatTurn {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

/** POST /ai/chat 与 /ai/chat/stream 的请求体 */
export interface AiChatDTO {
  messages: AiChatTurn[];
  /** 由前端根据当前数据表生成的数据上下文 */
  datasetContext?: string;
  temperature?: number;
  maxTokens?: number;
}

/** 非流式对话结果 */
export interface AiChatVO {
  content?: string;
  reasoningContent?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  elapsedMs?: number;
}

/** 流式对话结束事件 */
export interface AiStreamDone {
  model?: string;
  reasoningContent?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  elapsedMs?: number;
  length?: number;
}

/** GET /ai/info */
export interface AiInfoVO {
  model?: string;
  visionModel?: string;
  visionEnabled?: boolean;
  maxImages?: number;
  maxTokens?: number;
  maxHistoryMessages?: number;
  maxContextChars?: number;
}
