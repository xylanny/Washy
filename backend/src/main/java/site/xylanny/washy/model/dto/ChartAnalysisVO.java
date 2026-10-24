package site.xylanny.washy.model.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class ChartAnalysisVO implements Serializable {

    /**
     * 推导过程
     */
    private String process;

    /**
     * 结论
     */
    private String chartConclusion;
}
