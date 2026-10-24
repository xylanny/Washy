package site.xylanny.washy.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import site.xylanny.washy.model.other.ChatMessage;
import site.xylanny.washy.model.other.ChatRequest;
import site.xylanny.washy.service.AiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class AiServiceImpl implements AiService {

    @Value("${ai.api-key:}")
    private String apiKey;

    @Value("${ai.base-url:https://api.deepseek.com}")
    private String baseUrl;

    @Value("${ai.model:deepseek-chat}")
    private String model;

    @Value("${ai.timeout-seconds:60}")
    private Integer timeoutSeconds;

    @Value("${ai.connect-timeout-seconds:10}")
    private Integer connectTimeoutSeconds;

    @Value("${ai.temperature:0.7}")
    private Double temperature;

    @Value("${ai.max-tokens:800}")
    private Integer maxTokens;

    @Value("${ai.max-retries:3}")
    private Integer maxRetries;

    private static final String CHAT_COMPLETIONS_PATH = "/chat/completions";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AiServiceImpl() {
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(
                        connectTimeoutSeconds != null ? connectTimeoutSeconds : 10
                ))
                .build();
    }

    @Override
    public String chat(String prompt) {
        return chat(null, prompt);
    }

    @Override
    public String chat(String systemPrompt, String prompt) {
        validateInput(prompt);
        validateConfiguration();

        ChatRequest request = buildChatRequest(systemPrompt, prompt);
        return executeWithRetry(request);
    }

    @Override
    public String chatWithHistory(List<ChatMessage> messages) {
        validateMessages(messages);
        validateConfiguration();

        ChatRequest request = ChatRequest.builder()
                .model(model)
                .messages(messages)
                .temperature(temperature)
                .maxTokens(maxTokens)
                .build();

        return executeWithRetry(request);
    }

    private String executeWithRetry(ChatRequest request) {
        AtomicInteger attempt = new AtomicInteger(0);
        Exception lastException = null;

        while (attempt.get() < maxRetries) {
            attempt.incrementAndGet();
            try {
                log.debug("AI request attempt {}/{}", attempt, maxRetries);
                return doChat(request);
            } catch (IOException | InterruptedException e) {
                lastException = e;
                log.warn("AI request attempt {} failed: {}", attempt, e.getMessage());

                if (attempt.get() < maxRetries) {
                    sleepBeforeRetry(attempt.get());
                }
            }
        }

        throw new IllegalStateException(
                "AI request failed after " + maxRetries + " attempts",
                lastException
        );
    }

    private String doChat(ChatRequest request) throws IOException, InterruptedException {
        String requestJson = objectMapper.writeValueAsString(request);

        if (log.isDebugEnabled()) {
            log.debug("Sending AI request: {}", requestJson);
        }

        HttpRequest httpRequest = buildHttpRequest(requestJson);
        HttpResponse<String> response = httpClient.send(
                httpRequest,
                HttpResponse.BodyHandlers.ofString()
        );

        if (log.isDebugEnabled()) {
            log.debug("AI response status: {}", response.statusCode());
        }

        validateResponseStatus(response);
        return extractContentFromResponse(response.body());
    }

    private ChatRequest buildChatRequest(String systemPrompt, String prompt) {
        List<ChatMessage> messages = new ArrayList<>();

        if (StringUtils.hasText(systemPrompt)) {
            messages.add(ChatMessage.system(systemPrompt));
        }
        messages.add(ChatMessage.user(prompt));

        return ChatRequest.builder()
                .model(model)
                .messages(messages)
                .temperature(temperature)
                .maxTokens(maxTokens)
                .build();
    }

    private HttpRequest buildHttpRequest(String requestJson) {
        return HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + CHAT_COMPLETIONS_PATH))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(
                        timeoutSeconds != null ? timeoutSeconds : 60
                ))
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();
    }

    private void validateResponseStatus(HttpResponse<String> response) {
        int statusCode = response.statusCode();
        if (statusCode < 200 || statusCode >= 300) {
            log.error("AI API error: status={}, body={}", statusCode, response.body());
            throw new IllegalStateException(
                    String.format("AI API call failed with status %d: %s",
                            statusCode,
                            truncateResponseBody(response.body()))
            );
        }
    }

    private String extractContentFromResponse(String responseBody) throws IOException {
        JsonNode rootNode = objectMapper.readTree(responseBody);
        JsonNode choicesNode = rootNode.path("choices");

        if (!choicesNode.isArray() || choicesNode.isEmpty()) {
            log.error("Missing 'choices' array in response: {}", responseBody);
            throw new IllegalStateException("AI response missing 'choices' field");
        }

        JsonNode firstChoice = choicesNode.get(0);
        JsonNode messageNode = firstChoice.path("message");
        JsonNode contentNode = messageNode.path("content");

        if (contentNode.isTextual()) {
            String content = contentNode.asText();
            log.debug("AI response content length: {} characters", content.length());
            return content;
        }

        JsonNode errorNode = rootNode.path("error");
        if (!errorNode.isMissingNode()) {
            String errorMsg = errorNode.path("message").asText("Unknown error");
            throw new IllegalStateException("AI API returned error: " + errorMsg);
        }

        log.error("Unexpected response structure: {}", responseBody);
        throw new IllegalStateException("AI response missing content field");
    }

    private void validateInput(String prompt) {
        if (!StringUtils.hasText(prompt)) {
            throw new IllegalArgumentException("Prompt cannot be empty");
        }
    }

    private void validateConfiguration() {
        if (!StringUtils.hasText(apiKey)) {
            throw new IllegalStateException(
                    "AI API key is not configured. Please set 'ai.api-key' in application properties."
            );
        }
    }

    private void validateMessages(List<ChatMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            throw new IllegalArgumentException("Messages list cannot be null or empty");
        }
    }

    private void sleepBeforeRetry(int attempt) {
        long delayMs = calculateBackoffDelay(attempt);
        try {
            log.debug("Waiting {}ms before retry", delayMs);
            Thread.sleep(delayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Retry interrupted", e);
        }
    }

    private long calculateBackoffDelay(int attempt) {
        return Math.min(1000L * (1L << (attempt - 1)), 30000L);
    }

    private String truncateResponseBody(String body) {
        if (body == null) return "null";
        return body.length() > 500 ? body.substring(0, 500) + "... (truncated)" : body;
    }
}