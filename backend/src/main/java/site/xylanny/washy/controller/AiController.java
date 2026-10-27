package site.xylanny.washy.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import site.xylanny.washy.exception.BusinessException;
import site.xylanny.washy.model.dto.AiChatDTO;
import site.xylanny.washy.model.dto.AiChatVO;
import site.xylanny.washy.model.dto.AiInfoVO;
import site.xylanny.washy.model.dto.Result;
import site.xylanny.washy.model.other.AiReply;
import site.xylanny.washy.service.AiChatService;
import site.xylanny.washy.service.AiStreamListener;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * AI 对话接口。
 *
 * <ul>
 *   <li>{@code POST /ai/chat}：一次性返回完整回复（application/json）</li>
 *   <li>{@code POST /ai/chat/stream}：SSE 流式回复，事件为
 *       {@code reasoning} / {@code content} / {@code done} / {@code error}</li>
 *   <li>{@code GET /ai/info}：当前模型能力（是否支持图片、上下文长度等）</li>
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/ai")
public class AiController {

    /** 单次流式对话的最长存活时间 */
    private static final long STREAM_TIMEOUT_MS = 5 * 60 * 1000L;

    private final AiChatService aiChatService;
    private final ExecutorService aiStreamExecutor;

    public AiController(AiChatService aiChatService,
                        @Qualifier("aiStreamExecutor") ExecutorService aiStreamExecutor) {
        this.aiChatService = aiChatService;
        this.aiStreamExecutor = aiStreamExecutor;
    }

    @PostMapping("/chat")
    public Result<AiChatVO> chat(@RequestBody AiChatDTO dto) {
        return Result.success(aiChatService.chat(dto));
    }

    @GetMapping("/info")
    public Result<AiInfoVO> info() {
        return Result.success(aiChatService.info());
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@RequestBody AiChatDTO dto) {
        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);
        // 客户端断开 / 超时后不再继续推送，也不需要再读取上游数据
        AtomicBoolean closed = new AtomicBoolean(false);

        emitter.onCompletion(() -> closed.set(true));
        emitter.onTimeout(() -> {
            closed.set(true);
            emitter.complete();
        });
        emitter.onError(error -> {
            closed.set(true);
            log.debug("AI 流式连接异常：{}", error.getMessage());
        });

        aiStreamExecutor.execute(() -> {
            try {
                aiChatService.chatStream(dto, new SseEmitterListener(emitter, closed));
            } catch (StreamAbortedException e) {
                log.debug("客户端已断开，中止 AI 流式生成");
                closeQuietly(emitter);
            } catch (BusinessException e) {
                log.warn("AI 流式对话失败：{}", e.getMessage());
                SseEmitterListener.push(emitter, closed, "error",
                        Map.of("message", e.getMessage() == null ? "AI 服务异常" : e.getMessage()));
                closeQuietly(emitter);
            } catch (Exception e) {
                log.error("AI 流式对话异常", e);
                SseEmitterListener.push(emitter, closed, "error",
                        Map.of("message", "AI 服务异常，请稍后重试"));
                closeQuietly(emitter);
            }
        });

        return emitter;
    }

    private void closeQuietly(SseEmitter emitter) {
        try {
            emitter.complete();
        } catch (IllegalStateException ignored) {
            // 连接已经结束，忽略
        }
    }

    /** 客户端已断开，用于中断读取上游响应 */
    private static final class StreamAbortedException extends RuntimeException {
        StreamAbortedException() {
            super("client disconnected");
        }
    }

    /**
     * 把 AI 的增量回调翻译成 SSE 事件。推送失败即代表客户端断开，
     * 抛出 {@link StreamAbortedException} 让上游停止读取。
     */
    private static final class SseEmitterListener implements AiStreamListener {

        private final SseEmitter emitter;
        private final AtomicBoolean closed;

        private SseEmitterListener(SseEmitter emitter, AtomicBoolean closed) {
            this.emitter = emitter;
            this.closed = closed;
        }

        @Override
        public void onReasoning(String delta) {
            send("reasoning", Map.of("delta", delta));
        }

        @Override
        public void onContent(String delta) {
            send("content", Map.of("delta", delta));
        }

        @Override
        public void onComplete(AiReply reply) {
            send("done", donePayload(reply));
            try {
                emitter.complete();
            } catch (IllegalStateException ignored) {
                // 已经结束
            }
        }

        private void send(String event, Object payload) {
            if (!push(emitter, closed, event, payload)) {
                throw new StreamAbortedException();
            }
        }

        private static boolean push(SseEmitter emitter, AtomicBoolean closed,
                                    String event, Object payload) {
            if (closed.get()) {
                return false;
            }
            try {
                emitter.send(SseEmitter.event()
                        .name(event)
                        .data(payload, MediaType.APPLICATION_JSON));
                return true;
            } catch (IOException | IllegalStateException e) {
                closed.set(true);
                log.debug("推送 SSE 事件失败（{}）：{}", event, e.getMessage());
                return false;
            }
        }

        private static Map<String, Object> donePayload(AiReply reply) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("model", reply.getModel());
            payload.put("reasoningContent", reply.getReasoningContent());
            payload.put("promptTokens", reply.getPromptTokens());
            payload.put("completionTokens", reply.getCompletionTokens());
            payload.put("totalTokens", reply.getTotalTokens());
            payload.put("elapsedMs", reply.getElapsedMs());
            payload.put("length", reply.getContent() == null ? 0 : reply.getContent().length());
            return payload;
        }
    }
}
