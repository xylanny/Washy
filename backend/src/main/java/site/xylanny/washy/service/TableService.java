package site.xylanny.washy.service;

import site.xylanny.washy.model.dto.KMeansDTO;
import site.xylanny.washy.model.dto.KMeansVO;

import java.io.IOException;

public interface TableService {

    /**
     * 对上传的数据集执行 K-Means 聚类分析。
     *
     * @param kMeansDTO K-Means 请求参数
     * @param request 用于校验登录Token
     * @return 聚类分析结果
     */
    KMeansVO analysisByKmeans(KMeansDTO kMeansDTO, String authorization) throws IOException;
}
