package site.xylanny.washy.model.other;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 一次 AI 调用的结果（非流式与流式共用）。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiReply {

    /** 最终回复内容 */
    private String content;

    /** 思考过程（推理模型会返回 reasoning_content） */
    private String reasoningContent;

    /** 实际处理该请求的模型 */
    private String model;

    private Integer promptTokens;

    private Integer completionTokens;

    private Integer totalTokens;

    /** 耗时（毫秒），由业务层填充 */
    private Long elapsedMs;
}
