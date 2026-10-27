package site.xylanny.washy.service;

import site.xylanny.washy.model.dto.AiChatDTO;
import site.xylanny.washy.model.dto.AiChatVO;
import site.xylanny.washy.model.dto.AiInfoVO;

/**
 * AI 对话业务：负责校验请求、构造提示词（人设 + 数据上下文）、拼装多模态消息。
 */
public interface AiChatService {

    /**
     * 一次性返回完整回复
     */
    AiChatVO chat(AiChatDTO dto);

    /**
     * 流式回复，增量回调给 {@code listener}
     */
    void chatStream(AiChatDTO dto, AiStreamListener listener);

    /**
     * 当前 AI 服务能力
     */
    AiInfoVO info();
}
