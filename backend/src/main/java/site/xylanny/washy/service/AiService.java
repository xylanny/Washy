package site.xylanny.washy.service;

import site.xylanny.washy.model.other.ChatMessage;

import java.util.List;

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
     * 多轮对话（支持历史消息）
     *
     * @param messages 消息列表（按顺序，包含历史消息）
     * @return AI 回复内容
     */
    String chatWithHistory(List<ChatMessage> messages);
}