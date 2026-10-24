package site.xylanny.washy.model.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.io.Serializable;
import java.util.List;

@Data
public class KMeansDTO implements Serializable {

    /**
     * 数据集文件
     */
    private MultipartFile file;

    /**
     * 需要分析的列名
     */
    private List<String> columns;

    // K-Meas算法额外参数
    /**
     * 聚类数量
     */
    private Integer k;

    /**
     * 最大迭代数
     */
    private Integer maxIterations = 100;

    /**
     * 收敛阈值
     */
    private Double tolerance = 0.0001;

    /**
     * 随机种子
     */
    private Integer seed;
}
