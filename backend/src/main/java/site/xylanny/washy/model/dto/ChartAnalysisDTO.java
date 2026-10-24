package site.xylanny.washy.model.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.io.Serializable;

@Data
public class ChartAnalysisDTO implements Serializable {

    /**
     * 图表数据
     */
    private MultipartFile file;

    /**
     * x轴
     */
    private String x;

    /**
     * y轴
     */
    private String y;

    /**
     * 图表类型
     */
    private String chartType;

    /**
     * 分析目的
     */
    private String chartGoal;

}
