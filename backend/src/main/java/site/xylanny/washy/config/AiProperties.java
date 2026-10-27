package site.xylanny.washy.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * DeepSeek 相关配置，对应 application.yml 中的 ai.* 节点。
 *
 * @author Jun
 */
@Data
@Component
@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    /** DeepSeek API Key，缺省时所有 AI 接口都会返回配置错误提示 */
    private String apiKey = "";

    /** OpenAI 兼容的接口地址 */
    private String baseUrl = "https://api.deepseek.com";

    /** 纯文本对话使用的模型 */
    private String model = "deepseek-flash";

    /** 需要理解图片时使用的多模态模型 */
    private String visionModel = "deepseek-flash";

    /** 是否允许携带图片（关闭后前端会隐藏/禁用图片入口） */
    private boolean visionEnabled = true;

    /** 读取超时（秒） */
    private Integer timeoutSeconds = 120;

    /** 连接超时（秒） */
    private Integer connectTimeoutSeconds = 10;

    /** 采样温度 */
    private Double temperature = 0.7;

    /** 单次回复的最大 token 数 */
    private Integer maxTokens = 4096;

    /** 非流式请求的失败重试次数 */
    private Integer maxRetries = 3;

    /** 单条消息最多携带的图片数 */
    private Integer maxImages = 4;

    /** 单条消息携带图片 base64 的总长度上限（字符） */
    private Integer maxImageBytes = 8 * 1024 * 1024;

    /** 数据上下文的字符上限 */
    private Integer maxContextChars = 12000;

    /** 一次请求最多携带的历史消息条数（含本轮） */
    private Integer maxHistoryMessages = 20;

    /** 流式对话使用的线程池大小 */
    private Integer streamPoolSize = 8;
}
