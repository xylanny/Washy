package site.xylanny.washy.model.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class KMeansVO implements Serializable {

     /**
     * 聚类数量
     */
    private Integer k;

    /**
     * 每个数据点的簇标签
     */
    private List<Integer> labels;

    /**
     * 各簇中心点坐标
     */
    private List<List<Double>> centroids;

    /**
     * 轮廓系数（评估聚类质量）
     */
    private Double silhouetteScore;

    /**
     * 每个簇的样本数
     */
    private List<Integer> nums;
}
