package site.xylanny.washy.model.dto;

import lombok.Data;

import java.util.List;

/**
 * AI 对话请求。
 *
 * <p>前端只需要把最近几轮对话按顺序发上来：</p>
 *
 * <pre>
 * {
 *   "messages": [
 *     {"role": "user", "content": "这组数据的趋势如何？", "images": ["data:image/png;base64,..."]},
 *     {"role": "assistant", "content": "..."},
 *     {"role": "user", "content": "再详细一点"}
 *   ],
 *   "datasetContext": "文件名：sales.csv\n规模：1240 行 × 6 列\n..."
 * }
 * </pre>
 */
@Data
public class AiChatDTO {

    /** 对话消息，最后一条必须是用户消息 */
    private List<AiChatMessageDTO> messages;

    /** 数据上下文（由前端根据当前数据表生成），会拼进系统提示词 */
    private String datasetContext;

    /** 采样温度，缺省使用配置值 */
    private Double temperature;

    /** 最大回复 token，缺省使用配置值，且不允许超过配置上限 */
    private Integer maxTokens;

    @Data
    public static class AiChatMessageDTO {

        /** user / assistant，其他角色会被忽略 */
        private String role;

        /** 文本内容 */
        private String content;

        /** 图片，data:image/*;base64 格式，仅 user 消息生效 */
        private List<String> images;
    }
}
