package site.xylanny.washy.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI 服务能力信息，前端据此决定是否展示图片入口、上下文长度提示等。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiInfoVO {

    /** 纯文本对话模型 */
    private String model;

    /** 图文对话模型 */
    private String visionModel;

    /** 是否支持图片理解 */
    private boolean visionEnabled;

    /** 单条消息最多携带的图片数 */
    private Integer maxImages;

    /** 单次回复的 token 上限 */
    private Integer maxTokens;

    /** 一次请求最多携带的历史消息条数 */
    private Integer maxHistoryMessages;

    /** 数据上下文的字符上限 */
    private Integer maxContextChars;
}
