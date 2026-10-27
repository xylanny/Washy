package site.xylanny.washy.model.other;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 发往 DeepSeek /chat/completions 的请求体。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatRequest {

    private String model;
    private List<ChatMessage> messages;
    private Double temperature;

    /** DeepSeek 使用的是下划线命名 */
    @JsonProperty("max_tokens")
    private Integer maxTokens;

    private Boolean stream;
}
