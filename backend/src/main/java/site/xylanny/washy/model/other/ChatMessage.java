package site.xylanny.washy.model.other;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 一条对话消息。
 *
 * <p>{@code content} 既可以是纯文本（String），也可以是
 * {@code List<ContentPart>}——后者用于携带图片的多模态消息。</p>
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatMessage {

    private String role;

    private Object content;

    public static ChatMessage system(String content) {
        return new ChatMessage("system", content);
    }

    public static ChatMessage user(String content) {
        return new ChatMessage("user", content);
    }

    public static ChatMessage assistant(String content) {
        return new ChatMessage("assistant", content);
    }

    /** 图文混合的用户消息 */
    public static ChatMessage user(List<ContentPart> parts) {
        return new ChatMessage("user", parts);
    }
}
