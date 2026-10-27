package site.xylanny.washy.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import site.xylanny.washy.config.AiProperties;
import site.xylanny.washy.exception.BusinessException;
import site.xylanny.washy.model.dto.AiChatDTO;
import site.xylanny.washy.model.dto.AiChatDTO.AiChatMessageDTO;
import site.xylanny.washy.model.dto.AiChatVO;
import site.xylanny.washy.model.dto.AiInfoVO;
import site.xylanny.washy.model.enums.BusinessCode;
import site.xylanny.washy.model.other.AiReply;
import site.xylanny.washy.model.other.ChatMessage;
import site.xylanny.washy.model.other.ContentPart;
import site.xylanny.washy.service.AiChatService;
import site.xylanny.washy.service.AiService;
import site.xylanny.washy.service.AiStreamListener;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * AI 对话业务实现。
 *
 * <p>职责：</p>
 * <ol>
 *   <li>校验前端传来的对话（角色、图片格式、长度、轮次）；</li>
 *   <li>生成固定的分析师人设，并把前端生成的数据上下文拼进系统提示词；</li>
 *   <li>把「文字 + 图片」的消息转换成 DeepSeek 的多模态格式。</li>
 * </ol>
 */
@Slf4j
@Service
public class AiChatServiceImpl implements AiChatService {

    /** 单条消息的文本上限，避免把整张表贴进对话 */
    private static final int MAX_MESSAGE_CHARS = 20_000;

    /** 一次对话允许携带的图片总数上限（单条按 ai.max-images 限制） */
    private static final int MAX_TOTAL_IMAGES = 12;

    private static final String BASE_SYSTEM_PROMPT = """
            你是 Washy 的数据分析助手，一位严谨、务实的数据分析师兼 BI 顾问。

            工作方式：
            1. 只依据用户提供的数据、图片与上下文作答。数据不足时，先明确说明缺少什么，再给出可验证的初步判断，绝不编造数字。
            2. 结论要具体：引用字段名、数值、变化幅度、占比、排名或异常点，避免"整体表现良好"这类空泛表述。
            3. 涉及计算时给出简要口径或步骤，方便用户复核。
            4. 需要对比多个对象时优先使用 Markdown 表格；需要罗列时使用有序列表。
            5. 回答结构：先给结论，再给依据，最后给可执行的建议；除非用户要求展开，正文控制在 400 字以内。
            6. 用户上传的是图表截图时，先说明你观察到的坐标系、图例、趋势与异常点，再给出分析。
            7. 使用与用户提问一致的语言（默认简体中文），语气专业、克制、可执行。
            """;

    private final AiService aiService;
    private final AiProperties properties;

    public AiChatServiceImpl(AiService aiService, AiProperties properties) {
        this.aiService = aiService;
        this.properties = properties;
    }

    @Override
    public AiChatVO chat(AiChatDTO dto) {
        PreparedChat prepared = prepare(dto);
        long start = System.currentTimeMillis();

        AiReply reply = aiService.chatWithHistory(
                prepared.messages(), prepared.temperature(), prepared.maxTokens());
        reply.setElapsedMs(System.currentTimeMillis() - start);

        log.info("AI 对话完成：消息 {} 条，回复 {} 字，耗时 {}ms",
                prepared.messages().size(),
                reply.getContent() == null ? 0 : reply.getContent().length(),
                reply.getElapsedMs());

        return toVo(reply);
    }

    @Override
    public void chatStream(AiChatDTO dto, AiStreamListener listener) {
        PreparedChat prepared = prepare(dto);
        long start = System.currentTimeMillis();

        aiService.chatStream(prepared.messages(), prepared.temperature(), prepared.maxTokens(),
                new AiStreamListener() {
                    @Override
                    public void onReasoning(String delta) {
                        listener.onReasoning(delta);
                    }

                    @Override
                    public void onContent(String delta) {
                        listener.onContent(delta);
                    }

                    @Override
                    public void onComplete(AiReply reply) {
                        reply.setElapsedMs(System.currentTimeMillis() - start);
                        listener.onComplete(reply);
                    }
                });
    }

    @Override
    public AiInfoVO info() {
        return AiInfoVO.builder()
                .model(properties.getModel())
                .visionModel(properties.getVisionModel())
                .visionEnabled(properties.isVisionEnabled())
                .maxImages(properties.getMaxImages())
                .maxTokens(properties.getMaxTokens())
                .maxHistoryMessages(properties.getMaxHistoryMessages())
                .maxContextChars(properties.getMaxContextChars())
                .build();
    }

    /* ==================== 请求准备 ==================== */

    private PreparedChat prepare(AiChatDTO dto) {
        if (dto == null) {
            throw new BusinessException(BusinessCode.PARAMS_MISSING, "请求体不能为空");
        }

        List<AiChatMessageDTO> history = dto.getMessages();
        if (history == null || history.isEmpty()) {
            throw new BusinessException(BusinessCode.PARAMS_MISSING, "对话内容不能为空");
        }

        List<ChatMessage> messages = new ArrayList<>();
        messages.add(ChatMessage.system(buildSystemPrompt(dto.getDatasetContext())));

        int maxImages = intOr(properties.getMaxImages(), 4);
        long maxImageBytes = intOr(properties.getMaxImageBytes(), 8 * 1024 * 1024);
        int totalImages = 0;
        long totalImageChars = 0;

        for (AiChatMessageDTO turn : trimHistory(history)) {
            String role = roleOf(turn.getRole());
            if (role == null) {
                log.debug("忽略角色非法的消息：{}", turn.getRole());
                continue;
            }

            String text = limit(turn.getContent(), MAX_MESSAGE_CHARS);
            List<String> images = "user".equals(role) ? normalizeImages(turn.getImages()) : List.of();

            if (!StringUtils.hasText(text) && images.isEmpty()) {
                continue;
            }

            if (images.isEmpty()) {
                messages.add(new ChatMessage(role, text));
                continue;
            }

            if (images.size() > maxImages) {
                throw new BusinessException(
                        BusinessCode.PARAMS_ERROR, "单条消息最多携带 " + maxImages + " 张图片");
            }

            totalImages += images.size();
            for (String image : images) {
                totalImageChars += image.length();
            }

            List<ContentPart> parts = new ArrayList<>();
            if (StringUtils.hasText(text)) {
                parts.add(ContentPart.text(text));
            }
            for (String image : images) {
                parts.add(ContentPart.image(image));
            }
            messages.add(ChatMessage.user(parts));
        }

        if (messages.size() <= 1) {
            throw new BusinessException(BusinessCode.PARAMS_MISSING, "提问内容不能为空");
        }

        if (totalImages > MAX_TOTAL_IMAGES) {
            throw new BusinessException(
                    BusinessCode.PARAMS_ERROR,
                    "本次对话携带的图片过多（最多 " + MAX_TOTAL_IMAGES + " 张），请新建对话后重试");
        }

        if (totalImageChars > maxImageBytes) {
            throw new BusinessException(
                    BusinessCode.PARAMS_ERROR,
                    "图片体积过大，请压缩后重试（单次上限 "
                            + (maxImageBytes / 1024 / 1024) + "MB）");
        }

        ChatMessage last = messages.get(messages.size() - 1);
        if (!"user".equals(last.getRole())) {
            throw new BusinessException(BusinessCode.PARAMS_ERROR, "最后一条消息必须来自用户");
        }

        return new PreparedChat(messages,
                resolveTemperature(dto.getTemperature()),
                resolveMaxTokens(dto.getMaxTokens()));
    }

    /**
     * 只允许 user / assistant：系统人设由服务端固定，避免前端覆盖。
     */
    private String roleOf(String role) {
        if (!StringUtils.hasText(role)) {
            return "user";
        }
        if ("user".equalsIgnoreCase(role)) {
            return "user";
        }
        if ("assistant".equalsIgnoreCase(role)) {
            return "assistant";
        }
        return null;
    }

    /**
     * 只保留最近若干条，并且从用户消息开始，避免历史从半句助手回复开头。
     */
    private List<AiChatMessageDTO> trimHistory(List<AiChatMessageDTO> history) {
        int max = Math.max(2, intOr(properties.getMaxHistoryMessages(), 20));
        List<AiChatMessageDTO> list = history.size() > max
                ? new ArrayList<>(history.subList(history.size() - max, history.size()))
                : new ArrayList<>(history);

        while (!list.isEmpty() && !"user".equals(roleOf(list.get(0).getRole()))) {
            list.remove(0);
        }
        return list;
    }

    /**
     * 校验图片：必须是以 data:image/ 开头的 base64 Data URL。
     */
    private List<String> normalizeImages(List<String> images) {
        if (images == null || images.isEmpty()) {
            return List.of();
        }
        if (!properties.isVisionEnabled()) {
            throw new BusinessException(
                    BusinessCode.PARAMS_ERROR, "当前 AI 模型未开启图片理解，请先移除图片");
        }

        List<String> result = new ArrayList<>();
        for (String image : images) {
            if (!StringUtils.hasText(image)) {
                continue;
            }
            String dataUrl = image.trim();
            if (!dataUrl.startsWith("data:image/") || !dataUrl.contains(";base64,")) {
                throw new BusinessException(
                        BusinessCode.PARAMS_ERROR, "图片格式不支持，请使用 data:image/*;base64 编码的图片");
            }
            result.add(dataUrl);
        }
        return result;
    }

    /* ==================== 提示词 ==================== */

    private String buildSystemPrompt(String datasetContext) {
        StringBuilder prompt = new StringBuilder(BASE_SYSTEM_PROMPT);
        prompt.append("\n当前日期：")
                .append(LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE))
                .append("\n");

        if (StringUtils.hasText(datasetContext)) {
            prompt.append("\n【当前数据集上下文】\n")
                    .append("以下内容由前端根据用户当前打开的数据表生成，是本轮分析的事实依据：\n")
                    .append(limit(datasetContext.trim(), properties.getMaxContextChars()))
                    .append("\n");
        }

        return prompt.toString();
    }

    private Double resolveTemperature(Double value) {
        double fallback = properties.getTemperature() != null ? properties.getTemperature() : 0.7;
        double temperature = value != null ? value : fallback;
        return Math.max(0d, Math.min(2d, temperature));
    }

    private Integer resolveMaxTokens(Integer value) {
        int ceiling = properties.getMaxTokens() != null ? properties.getMaxTokens() : 4096;
        int maxTokens = value != null ? value : ceiling;
        return Math.max(64, Math.min(ceiling, maxTokens));
    }

    private int intOr(Integer value, int fallback) {
        return value != null ? value : fallback;
    }

    private String limit(String value, int max) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() <= max) {
            return trimmed;
        }
        return trimmed.substring(0, max) + "\n...（内容过长，已截断）";
    }

    private AiChatVO toVo(AiReply reply) {
        return AiChatVO.builder()
                .content(reply.getContent())
                .reasoningContent(reply.getReasoningContent())
                .model(reply.getModel())
                .promptTokens(reply.getPromptTokens())
                .completionTokens(reply.getCompletionTokens())
                .totalTokens(reply.getTotalTokens())
                .elapsedMs(reply.getElapsedMs())
                .build();
    }

    /** 校验并转换完成的一次对话 */
    private record PreparedChat(List<ChatMessage> messages, Double temperature, Integer maxTokens) {
    }
}
