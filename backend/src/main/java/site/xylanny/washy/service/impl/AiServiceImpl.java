package site.xylanny.washy.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import site.xylanny.washy.config.AiProperties;
import site.xylanny.washy.exception.BusinessException;
import site.xylanny.washy.model.enums.BusinessCode;
import site.xylanny.washy.model.other.AiReply;
import site.xylanny.washy.model.other.ChatMessage;
import site.xylanny.washy.model.other.ChatRequest;
import site.xylanny.washy.service.AiService;
import site.xylanny.washy.service.AiStreamListener;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * DeepSeek（OpenAI 兼容协议）客户端实现。
 *
 * <p>只做协议层的事：拼请求、发请求、解析响应（含 SSE 流式响应）。
 * 提示词、数据上下文等业务逻辑在 {@code AiChatServiceImpl} 中。</p>
 */
@Slf4j
@Service
public class AiServiceImpl implements AiService {

    private static final String CHAT_COMPLETIONS_PATH = "/chat/completions";
    private static final String SSE_DATA_PREFIX = "data:";
    private static final String SSE_DONE = "[DONE]";

    private final AiProperties properties;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    public AiServiceImpl(AiProperties properties) {
        this.properties = properties;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(
                        properties.getConnectTimeoutSeconds() != null
                                ? properties.getConnectTimeoutSeconds()
                                : 10))
                .build();
    }

    /* ==================== 非流式 ==================== */

    @Override
    public String chat(String prompt) {
        return chat(null, prompt);
    }

    @Override
    public String chat(String systemPrompt, String prompt) {
        if (!StringUtils.hasText(prompt)) {
            throw new BusinessException(BusinessCode.PARAMS_MISSING, "提问内容不能为空");
        }

        List<ChatMessage> messages = new ArrayList<>();
        if (StringUtils.hasText(systemPrompt)) {
            messages.add(ChatMessage.system(systemPrompt));
        }
        messages.add(ChatMessage.user(prompt));

        return chatWithHistory(messages).getContent();
    }

    @Override
    public AiReply chatWithHistory(List<ChatMessage> messages) {
        return chatWithHistory(messages, null, null);
    }

    @Override
    public AiReply chatWithHistory(List<ChatMessage> messages, Double temperature, Integer maxTokens) {
        validateMessages(messages);
        validateConfiguration();

        ChatRequest request = buildRequest(messages, temperature, maxTokens, false);
        String responseBody = executeWithRetry(writeJson(request));
        return parseReply(responseBody);
    }

    /* ==================== 流式 ==================== */

    @Override
    public void chatStream(List<ChatMessage> messages,
                           Double temperature,
                           Integer maxTokens,
                           AiStreamListener listener) {
        validateMessages(messages);
        validateConfiguration();

        if (listener == null) {
            throw new BusinessException(BusinessCode.PARAMS_MISSING, "流式回调不能为空");
        }

        ChatRequest request = buildRequest(messages, temperature, maxTokens, true);
        String requestJson = writeJson(request);

        int maxAttempts = Math.max(1, properties.getMaxRetries());
        for (int attempt = 1; ; attempt++) {
            // 记录本次尝试是否已经向客户端推送过内容，推送过就不能再重试
            AttemptState state = new AttemptState();

            try {
                doChatStream(requestJson, listener, state);
                return;
            } catch (RetryableAiException | IOException e) {
                if (state.emitted || attempt >= maxAttempts) {
                    log.error("AI 流式响应失败（attempt={}）：{}", attempt, e.getMessage());
                    throw new BusinessException(
                            BusinessCode.THIRD_PARTY_ERROR,
                            "AI 服务暂时不可用，请稍后重试：" + e.getMessage(),
                            e);
                }
                log.warn("AI 流式请求第 {}/{} 次失败，准备重试：{}", attempt, maxAttempts, e.getMessage());
                sleepBeforeRetry(attempt);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new BusinessException(BusinessCode.THIRD_PARTY_ERROR, "AI 流式请求被中断", e);
            }
        }
    }

    /* ==================== 请求构造 ==================== */

    private ChatRequest buildRequest(List<ChatMessage> messages,
                                     Double temperature,
                                     Integer maxTokens,
                                     boolean stream) {
        return ChatRequest.builder()
                .model(resolveModel(messages))
                .messages(messages)
                .temperature(temperature != null ? temperature : properties.getTemperature())
                .maxTokens(maxTokens != null ? maxTokens : properties.getMaxTokens())
                .stream(stream)
                .build();
    }

    /** 消息里包含多模态片段时切换到视觉模型 */
    private String resolveModel(List<ChatMessage> messages) {
        boolean multimodal = messages.stream()
                .anyMatch(message -> message.getContent() instanceof List);

        if (multimodal && properties.isVisionEnabled()) {
            String visionModel = properties.getVisionModel();
            if (StringUtils.hasText(visionModel)) {
                return visionModel;
            }
        }
        return properties.getModel();
    }

    private String writeJson(ChatRequest request) {
        try {
            String json = objectMapper.writeValueAsString(request);
            log.debug("发送 AI 请求：{}", truncate(json, 800));
            return json;
        } catch (IOException e) {
            throw new BusinessException(BusinessCode.SYSTEM_ERROR, "构造 AI 请求失败", e);
        }
    }

    private HttpRequest buildHttpRequest(String requestJson, boolean stream) {
        Duration timeout = Duration.ofSeconds(
                properties.getTimeoutSeconds() != null ? properties.getTimeoutSeconds() : 120);

        return HttpRequest.newBuilder()
                .uri(URI.create(trimTrailingSlash(properties.getBaseUrl()) + CHAT_COMPLETIONS_PATH))
                .header("Authorization", "Bearer " + properties.getApiKey())
                .header("Content-Type", "application/json")
                .header("Accept", stream ? "text/event-stream" : "application/json")
                .timeout(timeout)
                .POST(HttpRequest.BodyPublishers.ofString(requestJson, StandardCharsets.UTF_8))
                .build();
    }

    private String trimTrailingSlash(String url) {
        if (!StringUtils.hasText(url)) {
            return "https://api.deepseek.com";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    /* ==================== 非流式执行 ==================== */

    private String executeWithRetry(String requestJson) {
        int maxAttempts = Math.max(1, properties.getMaxRetries());
        Exception lastError = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                log.debug("AI 请求 attempt={}/{}", attempt, maxAttempts);
                return doChat(requestJson);
            } catch (RetryableAiException | IOException e) {
                lastError = e;
                log.warn("AI 请求第 {}/{} 次失败：{}", attempt, maxAttempts, e.getMessage());
                if (attempt < maxAttempts) {
                    sleepBeforeRetry(attempt);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new BusinessException(BusinessCode.THIRD_PARTY_ERROR, "AI 请求被中断", e);
            }
        }

        throw new BusinessException(
                BusinessCode.THIRD_PARTY_ERROR,
                "AI 服务暂时不可用，请稍后重试："
                        + (lastError != null ? lastError.getMessage() : "未知错误"),
                lastError);
    }

    private String doChat(String requestJson) throws IOException, InterruptedException {
        HttpResponse<String> response = httpClient.send(
                buildHttpRequest(requestJson, false),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

        int status = response.statusCode();
        if (status < 200 || status >= 300) {
            String body = response.body();
            log.error("AI 接口返回错误：status={}, body={}", status, truncate(body, 500));
            if (isRetryableStatus(status)) {
                throw new RetryableAiException("上游返回 " + status + "：" + truncate(body, 200));
            }
            throw new BusinessException(
                    BusinessCode.THIRD_PARTY_ERROR,
                    String.format("AI 服务返回错误(%d)：%s", status, extractErrorMessage(body)));
        }

        return response.body();
    }

    /* ==================== 流式执行 ==================== */

    private void doChatStream(String requestJson, AiStreamListener listener, AttemptState state)
            throws IOException, InterruptedException {

        HttpResponse<InputStream> response = httpClient.send(
                buildHttpRequest(requestJson, true),
                HttpResponse.BodyHandlers.ofInputStream());

        try (InputStream body = response.body()) {
            int status = response.statusCode();
            if (status < 200 || status >= 300) {
                String errorBody = readAll(body);
                log.error("AI 流式接口返回错误：status={}, body={}", status, truncate(errorBody, 500));
                if (isRetryableStatus(status)) {
                    throw new RetryableAiException("上游返回 " + status + "：" + truncate(errorBody, 200));
                }
                throw new BusinessException(
                        BusinessCode.THIRD_PARTY_ERROR,
                        String.format("AI 服务返回错误(%d)：%s", status, extractErrorMessage(errorBody)));
            }

            readEventStream(body, listener, state);
        }
    }

    private void readEventStream(InputStream stream, AiStreamListener listener, AttemptState state)
            throws IOException {

        StringBuilder content = new StringBuilder();
        StringBuilder reasoning = new StringBuilder();
        String model = null;
        Integer promptTokens = null;
        Integer completionTokens = null;
        Integer totalTokens = null;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(stream, StandardCharsets.UTF_8))) {

            String line;
            while ((line = reader.readLine()) != null) {
                String data = extractSseData(line);
                if (data == null) {
                    continue;
                }
                if (SSE_DONE.equals(data)) {
                    break;
                }

                JsonNode chunk;
                try {
                    chunk = objectMapper.readTree(data);
                } catch (IOException e) {
                    log.debug("忽略无法解析的流式数据块：{}", truncate(data, 200));
                    continue;
                }

                throwIfErrorNode(chunk);

                if (chunk.hasNonNull("model")) {
                    model = chunk.get("model").asText();
                }

                JsonNode choices = chunk.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    JsonNode delta = choices.get(0).path("delta");

                    String reasoningDelta = textOf(delta, "reasoning_content");
                    if (StringUtils.hasLength(reasoningDelta)) {
                        reasoning.append(reasoningDelta);
                        state.emitted = true;
                        listener.onReasoning(reasoningDelta);
                    }

                    String contentDelta = textOf(delta, "content");
                    if (StringUtils.hasLength(contentDelta)) {
                        content.append(contentDelta);
                        state.emitted = true;
                        listener.onContent(contentDelta);
                    }
                }

                JsonNode usage = chunk.path("usage");
                if (usage.isObject()) {
                    promptTokens = intOf(usage, "prompt_tokens");
                    completionTokens = intOf(usage, "completion_tokens");
                    totalTokens = intOf(usage, "total_tokens");
                }
            }
        }

        AiReply reply = AiReply.builder()
                .content(content.toString())
                .reasoningContent(reasoning.length() > 0 ? reasoning.toString() : null)
                .model(model)
                .promptTokens(promptTokens)
                .completionTokens(completionTokens)
                .totalTokens(totalTokens)
                .build();

        log.debug("AI 流式响应结束：content={} 字，reasoning={} 字",
                reply.getContent().length(),
                reply.getReasoningContent() == null ? 0 : reply.getReasoningContent().length());

        listener.onComplete(reply);
    }

    private String extractSseData(String line) {
        if (line == null) {
            return null;
        }
        String trimmed = line.trim();
        if (!trimmed.startsWith(SSE_DATA_PREFIX)) {
            return null;
        }
        String data = trimmed.substring(SSE_DATA_PREFIX.length()).trim();
        return data.isEmpty() ? null : data;
    }

    /* ==================== 响应解析 ==================== */

    private AiReply parseReply(String responseBody) {
        JsonNode root;
        try {
            root = objectMapper.readTree(responseBody);
        } catch (IOException e) {
            log.error("无法解析 AI 响应：{}", truncate(responseBody, 500));
            throw new BusinessException(BusinessCode.THIRD_PARTY_ERROR, "无法解析 AI 响应", e);
        }

        throwIfErrorNode(root);

        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            log.error("AI 响应缺少 choices：{}", truncate(responseBody, 500));
            throw new BusinessException(BusinessCode.THIRD_PARTY_ERROR, "AI 响应缺少 choices 字段");
        }

        JsonNode message = choices.get(0).path("message");
        JsonNode usage = root.path("usage");

        return AiReply.builder()
                .content(defaultString(textOf(message, "content")))
                .reasoningContent(textOf(message, "reasoning_content"))
                .model(root.path("model").asText(null))
                .promptTokens(intOf(usage, "prompt_tokens"))
                .completionTokens(intOf(usage, "completion_tokens"))
                .totalTokens(intOf(usage, "total_tokens"))
                .build();
    }

    private void throwIfErrorNode(JsonNode node) {
        JsonNode error = node.path("error");
        if (error.isObject()) {
            String message = error.path("message").asText("未知错误");
            log.error("AI 服务返回错误：{}", message);
            throw new BusinessException(BusinessCode.THIRD_PARTY_ERROR, "AI 服务返回错误：" + message);
        }
    }

    private String textOf(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isTextual() ? value.asText() : null;
    }

    private Integer intOf(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isNumber() ? value.asInt() : null;
    }

    private String defaultString(String value) {
        return value != null ? value : "";
    }

    /* ==================== 校验与工具 ==================== */

    private void validateMessages(List<ChatMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            throw new BusinessException(BusinessCode.PARAMS_MISSING, "对话内容不能为空");
        }
    }

    private void validateConfiguration() {
        if (!StringUtils.hasText(properties.getApiKey())) {
            throw new BusinessException(
                    BusinessCode.SYSTEM_ERROR,
                    "AI 服务未配置 API Key，请设置环境变量 DEEPSEEK_API_KEY 或 ai.api-key");
        }
    }

    private boolean isRetryableStatus(int status) {
        return status == 429 || status >= 500;
    }

    private void sleepBeforeRetry(int attempt) {
        long delay = Math.min(1000L * (1L << (attempt - 1)), 8000L);
        try {
            log.debug("等待 {}ms 后重试", delay);
            Thread.sleep(delay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(BusinessCode.THIRD_PARTY_ERROR, "重试被中断", e);
        }
    }

    private String extractErrorMessage(String body) {
        if (!StringUtils.hasText(body)) {
            return "无响应内容";
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode error = root.path("error");
            if (error.isObject()) {
                String message = error.path("message").asText("");
                if (StringUtils.hasText(message)) {
                    return message;
                }
            }
        } catch (IOException ignored) {
            // 不是 JSON 就直接返回截断后的原文
        }
        return truncate(body, 180);
    }

    private String readAll(InputStream stream) {
        try {
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "";
        }
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return "null";
        }
        return value.length() > max ? value.substring(0, max) + "...（已截断）" : value;
    }

    /** 可重试的上游错误（限流、5xx） */
    private static class RetryableAiException extends RuntimeException {
        RetryableAiException(String message) {
            super(message);
        }
    }

    /** 单次流式尝试的状态 */
    private static class AttemptState {
        private boolean emitted;
    }
}
