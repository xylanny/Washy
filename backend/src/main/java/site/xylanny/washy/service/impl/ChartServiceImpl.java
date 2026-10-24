package site.xylanny.washy.service.impl;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import site.xylanny.washy.exception.BusinessException;
import site.xylanny.washy.model.dto.ChartAnalysisDTO;
import site.xylanny.washy.model.dto.ChartAnalysisVO;
import site.xylanny.washy.model.enums.BusinessCode;
import site.xylanny.washy.service.AiService;
import site.xylanny.washy.service.ChartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * @author Jun
 * @description 针对表【chart(图表表)】的数据库操作Service实现
 * @createDate 2026-09-08 10:56:19
 */

@Slf4j
@Service
@RequiredArgsConstructor
public class ChartServiceImpl implements ChartService {

    private final AiService aiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT =
            "你是一个经验丰富的数据分析师和商业智能专家。你擅长从数据中提取洞察，" +
                    "发现趋势、模式和异常，并用清晰、专业、易于理解的语言表达你的分析结论。";

    @Override
    public ChartAnalysisVO analyzeChartByAi(ChartAnalysisDTO dto) {
        // 1. 参数校验
        validateRequest(dto);

        try {
            // 2. 读取CSV数据
            String csvData = readCsvFile(dto.getFile());

            // 3. 构建Prompt
            String prompt = buildPrompt(dto, csvData);

            // 4. 调用AI服务
            String aiResponse = aiService.chat(SYSTEM_PROMPT, prompt);

            // 5. 解析AI响应
            return parseAiResponse(aiResponse);

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("图表分析失败", e);
            throw new BusinessException(BusinessCode.SYSTEM_ERROR, "图表分析失败: " + e.getMessage());
        }
    }

    private void validateRequest(ChartAnalysisDTO dto) {
        if (dto == null) {
            throw new BusinessException(BusinessCode.PARAMS_ERROR, "请求参数不能为空");
        }
        if (dto.getFile() == null || dto.getFile().isEmpty()) {
            throw new BusinessException(BusinessCode.PARAMS_ERROR, "数据文件不能为空");
        }
        if (!StringUtils.hasText(dto.getX())) {
            throw new BusinessException(BusinessCode.PARAMS_ERROR, "X轴字段不能为空");
        }
        if (!StringUtils.hasText(dto.getY())) {
            throw new BusinessException(BusinessCode.PARAMS_ERROR, "Y轴字段不能为空");
        }
        if (!StringUtils.hasText(dto.getChartType())) {
            throw new BusinessException(BusinessCode.PARAMS_ERROR, "图表类型不能为空");
        }
        if (!StringUtils.hasText(dto.getChartGoal())) {
            throw new BusinessException(BusinessCode.PARAMS_ERROR, "分析目的不能为空");
        }

        // 验证文件类型
        String filename = dto.getFile().getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            throw new BusinessException(BusinessCode.PARAMS_ERROR, "仅支持CSV格式文件");
        }
    }

    private String readCsvFile(org.springframework.web.multipart.MultipartFile file) throws Exception {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            List<String> lines = new ArrayList<>();
            String line;
            int count = 0;

            // 读取表头 + 前100行数据（避免数据量过大）
            while ((line = reader.readLine()) != null && count < 101) {
                lines.add(line);
                count++;
            }

            return String.join("\n", lines);
        }
    }

    private String buildPrompt(ChartAnalysisDTO dto, String csvData) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("请分析以下数据并生成图表分析结论。\n\n");

        // 数据信息
        prompt.append("【数据信息】\n");
        prompt.append("图表类型：").append(dto.getChartType()).append("\n");
        prompt.append("X轴：").append(dto.getX()).append("\n");
        prompt.append("Y轴：").append(dto.getY()).append("\n");
        prompt.append("分析目的：").append(dto.getChartGoal()).append("\n\n");

        // 数据内容
        prompt.append("【数据内容】\n");
        prompt.append(csvData).append("\n\n");

        // 分析要求
        prompt.append("【分析要求】\n");
        prompt.append("1. 根据数据和分析目的，提供专业的分析结论\n");
        prompt.append("2. 分析应包括：数据总体趋势、关键发现、异常点（如有）\n");
        prompt.append("3. 结论要具体、有针对性，不要泛泛而谈\n");
        prompt.append("4. 请用中文回答，保持专业但易于理解的语气\n\n");

        // 输出格式要求
        prompt.append("【输出格式】\n");
        prompt.append("请按以下JSON格式输出结果：\n");
        prompt.append("{\n");
        prompt.append("  \"process\": \"你的推导过程，包括数据观察、趋势分析、异常识别等\",\n");
        prompt.append("  \"chartConclusion\": \"最终结论，简洁明了地总结分析结果\"\n");
        prompt.append("}\n");
        prompt.append("注意：只输出JSON，不要有其他内容。");

        return prompt.toString();
    }

    private ChartAnalysisVO parseAiResponse(String aiResponse) {
        try {
            // 清理响应，提取JSON
            String jsonContent = extractJson(aiResponse);

            JsonNode rootNode = objectMapper.readTree(jsonContent);

            ChartAnalysisVO vo = new ChartAnalysisVO();

            JsonNode processNode = rootNode.path("process");
            if (!processNode.isMissingNode() && processNode.isTextual()) {
                vo.setProcess(processNode.asText());
            }

            JsonNode conclusionNode = rootNode.path("chartConclusion");
            if (!conclusionNode.isMissingNode() && conclusionNode.isTextual()) {
                vo.setChartConclusion(conclusionNode.asText());
            }

            // 如果解析失败，使用默认值
            if (!StringUtils.hasText(vo.getProcess()) && !StringUtils.hasText(vo.getChartConclusion())) {
                vo.setProcess("AI分析完成");
                vo.setChartConclusion(aiResponse);
            }

            return vo;

        } catch (Exception e) {
            log.warn("解析AI响应失败，使用原始响应", e);
            ChartAnalysisVO vo = new ChartAnalysisVO();
            vo.setProcess("AI分析完成");
            vo.setChartConclusion(aiResponse);
            return vo;
        }
    }

    private String extractJson(String response) {
        // 尝试提取JSON
        int start = response.indexOf('{');
        int end = response.lastIndexOf('}');

        if (start >= 0 && end > start) {
            return response.substring(start, end + 1);
        }

        // 如果没有找到JSON，尝试提取```json ```包裹的内容
        if (response.contains("```json")) {
            start = response.indexOf("```json") + 7;
            end = response.indexOf("```", start);
            if (start > 7 && end > start) {
                return response.substring(start, end).trim();
            }
        }

        // 如果还是没有，尝试提取``` ```包裹的内容
        if (response.contains("```")) {
            start = response.indexOf("```") + 3;
            end = response.indexOf("```", start);
            if (start > 3 && end > start) {
                return response.substring(start, end).trim();
            }
        }

        return response;
    }
}

