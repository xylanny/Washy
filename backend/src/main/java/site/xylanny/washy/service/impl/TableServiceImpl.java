package site.xylanny.washy.service.impl;

import site.xylanny.washy.model.dto.KMeansDTO;
import site.xylanny.washy.model.dto.KMeansVO;
import site.xylanny.washy.service.TableService;
import site.xylanny.washy.service.UserService;
import site.xylanny.washy.utils.KMeansUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class TableServiceImpl implements TableService {

    private final UserService userService;

    @Override
    public KMeansVO analysisByKmeans(KMeansDTO kMeansDTO, String authorization) throws IOException {

        return KMeansUtil.analyze(
                kMeansDTO.getFile(),
                kMeansDTO.getColumns(),
                kMeansDTO.getK(),
                kMeansDTO.getMaxIterations(),
                kMeansDTO.getTolerance(),
                kMeansDTO.getSeed()
        );
    }
}
