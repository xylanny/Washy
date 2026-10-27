package site.xylanny.washy.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI 对话响应。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatVO {

    /** 回复正文（Markdown） */
    private String content;

    /** 思考过程（推理模型才会返回） */
    private String reasoningContent;

    /** 实际处理该请求的模型 */
    private String model;

    private Integer promptTokens;

    private Integer completionTokens;

    private Integer totalTokens;

    /** 耗时（毫秒） */
    private Long elapsedMs;
}
