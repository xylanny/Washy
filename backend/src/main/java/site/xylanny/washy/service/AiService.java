package site.xylanny.washy.service;

import site.xylanny.washy.model.other.AiReply;
import site.xylanny.washy.model.other.ChatMessage;

import java.util.List;

/**
 * DeepSeek 客户端：只负责协议层面的收发，不包含任何业务提示词。
 */
public interface AiService {

    /**
     * 发送聊天请求（无系统提示词）
     *
     * @param prompt 用户输入
     * @return AI 回复内容
     */
    String chat(String prompt);

    /**
     * 发送聊天请求（带系统提示词）
     *
     * @param systemPrompt 系统提示词
     * @param prompt       用户提示词
     * @return AI 回复内容
     */
    String chat(String systemPrompt, String prompt);

    /**
     * 多轮对话（支持历史消息，支持多模态消息）
     *
     * @param messages 消息列表（按顺序，包含系统提示词与历史消息）
     * @return AI 回复
     */
    AiReply chatWithHistory(List<ChatMessage> messages);

    /**
     * 多轮对话，可覆盖采样参数
     */
    AiReply chatWithHistory(List<ChatMessage> messages, Double temperature, Integer maxTokens);

    /**
     * 流式对话，增量回调给 {@code listener}。
     *
     * <p>因为流式响应一旦开始就无法回放，这里不做过多的自动重试：只有在还没有向客户端
     * 输出任何内容前发生连接类错误时才会重试一次，避免同一段内容被重复推送。</p>
     */
    void chatStream(List<ChatMessage> messages,
                    Double temperature,
                    Integer maxTokens,
                    AiStreamListener listener);
}
