package site.xylanny.washy.model.other;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 多模态消息中的一个内容片段。
 *
 * <p>DeepSeek 兼容 OpenAI 的多模态协议：当一条消息同时包含文字与图片时，
 * {@code content} 需要写成数组，数组元素形如：</p>
 *
 * <pre>
 * {"type": "text", "text": "这张图说明了什么"}
 * {"type": "image_url", "image_url": {"url": "data:image/png;base64,...."}}
 * </pre>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContentPart {

    private String type;

    private String text;

    @JsonProperty("image_url")
    private ImageUrl imageUrl;

    public static ContentPart text(String text) {
        return ContentPart.builder().type("text").text(text).build();
    }

    public static ContentPart image(String url) {
        return ContentPart.builder()
                .type("image_url")
                .imageUrl(ImageUrl.builder().url(url).build())
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ImageUrl {

        private String url;
    }
}
