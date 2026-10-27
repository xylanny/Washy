package site.xylanny.washy.service;

import site.xylanny.washy.model.other.AiReply;

/**
 * 流式响应的回调。
 *
 * <p>回调在读取 DeepSeek 响应的线程上同步执行，任何运行时异常都会中断本次流式请求，
 * 调用方可以借此在客户端断开连接后立即停止读取上游数据。</p>
 */
public interface AiStreamListener {

    /** 收到一段思考过程（推理模型才会返回） */
    void onReasoning(String delta);

    /** 收到一段回复正文 */
    void onContent(String delta);

    /** 流式响应正常结束 */
    void onComplete(AiReply reply);
}
