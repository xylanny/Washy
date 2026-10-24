package site.xylanny.washy.service;

import site.xylanny.washy.model.dto.ChartAnalysisDTO;
import site.xylanny.washy.model.dto.ChartAnalysisVO;

/**
 * @author Jun
 * @description 针对表【chart(图表表)】的数据库操作Service
 * @createDate 2026-09-08 10:56:19
 */
public interface ChartService {

    /**
     * 让Ai分析图表数据并生成结论
     *
     * @param dto 图表分析请求
     * @return 图表分析结果
     */
    ChartAnalysisVO analyzeChartByAi(ChartAnalysisDTO dto);
}
