package site.xylanny.washy.utils;

import site.xylanny.washy.exception.BusinessException;
import site.xylanny.washy.model.dto.KMeansVO;
import site.xylanny.washy.model.enums.BusinessCode;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

public final class KMeansUtil {

    private KMeansUtil() {
    }

    public static KMeansVO analyze(
            MultipartFile file,
            List<String> requestedColumns,
            Integer requestedK,
            Integer requestedMaxIterations,
            Double requestedTolerance,
            Integer seed
    ) throws IOException {
        int k = requestedK == null ? 0 : requestedK;
        int maxIterations = requestedMaxIterations == null ? 100 : requestedMaxIterations;
        double tolerance = requestedTolerance == null ? 0.0001 : requestedTolerance;
        return calculate(readCsv(file), requestedColumns, k, maxIterations, tolerance, seed);
    }

    private static List<List<String>> readCsv(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename != null && !filename.toLowerCase().endsWith(".csv")) {
            throw new IllegalArgumentException("当前仅支持 CSV 数据集文件");
        }
        StringBuilder content = new StringBuilder();
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            char[] buffer = new char[8192];
            int length;
            while ((length = reader.read(buffer)) != -1) {
                content.append(buffer, 0, length);
            }
        }

        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder value = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < content.length(); i++) {
            char character = content.charAt(i);
            if (character == '"') {
                if (quoted && i + 1 < content.length() && content.charAt(i + 1) == '"') {
                    value.append('"');
                    i++;
                } else {
                    quoted = !quoted;
                }
            } else if (character == ',' && !quoted) {
                row.add(value.toString().trim());
                value.setLength(0);
            } else if ((character == '\n' || character == '\r') && !quoted) {
                if (character == '\r' && i + 1 < content.length()
                        && content.charAt(i + 1) == '\n') {
                    i++;
                }
                row.add(value.toString().trim());
                value.setLength(0);
                if (row.stream().anyMatch(cell -> !cell.isEmpty())) {
                    rows.add(row);
                }
                row = new ArrayList<>();
            } else {
                value.append(character);
            }
        }
        if (!value.isEmpty() || !row.isEmpty()) {
            row.add(value.toString().trim());
            if (row.stream().anyMatch(cell -> !cell.isEmpty())) {
                rows.add(row);
            }
        }
        if (!rows.isEmpty() && !rows.get(0).isEmpty()
                && rows.get(0).get(0).startsWith("\uFEFF")) {
            rows.get(0).set(0, rows.get(0).get(0).substring(1));
        }
        return rows;
    }

    private static KMeansVO calculate(List<List<String>> rows, List<String> requestedColumns,
                                       int k, int maxIterations, double tolerance, Integer seed) {
        if(rows.size() < 2){
            throw new BusinessException(BusinessCode.PARAMS_ERROR, "数据集至少需要包含表头和一条数据");
        }
        List<Integer> columnIndexes = selectColumns(rows.get(0), requestedColumns);
        List<double[]> points = new ArrayList<>();
        for (int rowIndex = 1; rowIndex < rows.size(); rowIndex++) {
            List<String> row = rows.get(rowIndex);
            double[] point = new double[columnIndexes.size()];
            for (int i = 0; i < columnIndexes.size(); i++) {
                int columnIndex = columnIndexes.get(i);

                if(columnIndex >= row.size() || row.get(columnIndex).isEmpty()){
                    throw new BusinessException(BusinessCode.PARAMS_ERROR, "第 " + (rowIndex + 1) + " 行存在空值");
                }

                try {
                    point[i] = Double.parseDouble(row.get(columnIndex));
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("第 " + (rowIndex + 1) + " 行包含非数字值");
                }
                if(!Double.isFinite(point[i])){
                    throw  new BusinessException(BusinessCode.PARAMS_ERROR, "数据集只能包含有数字");
                }
            }
            points.add(point);
        }

        if(points.size() < k){
            throw new BusinessException(BusinessCode.PARAMS_ERROR, "聚类数量不能大于数据行数");
        }

        Random random = seed == null ? new Random() : new Random(seed);
        List<double[]> centroids = initializeCentroids(points, k, random);
        int[] labels = new int[points.size()];
        Arrays.fill(labels, -1);
        for (int iteration = 0; iteration < maxIterations; iteration++) {
            assignLabels(points, centroids, labels);
            double[][] sums = new double[k][centroids.get(0).length];
            int[] counts = new int[k];
            for (int i = 0; i < points.size(); i++) {
                int label = labels[i];
                counts[label]++;
                for (int dimension = 0; dimension < points.get(i).length; dimension++) {
                    sums[label][dimension] += points.get(i)[dimension];
                }
            }
            double maxShift = 0;
            for (int cluster = 0; cluster < k; cluster++) {
                if (counts[cluster] == 0) {
                    continue;
                }
                double[] next = new double[centroids.get(cluster).length];
                for (int dimension = 0; dimension < next.length; dimension++) {
                    next[dimension] = sums[cluster][dimension] / counts[cluster];
                }
                maxShift = Math.max(maxShift, squaredDistance(centroids.get(cluster), next));
                centroids.set(cluster, next);
            }
            if (maxShift <= tolerance * tolerance) {
                break;
            }
        }

        KMeansVO result = new KMeansVO();
        result.setK(k);
        result.setLabels(Arrays.stream(labels).boxed().toList());
        result.setCentroids(centroids.stream()
                .map(point -> Arrays.stream(point).boxed().toList()).toList());
        result.setNums(clusterCounts(labels, k));
        result.setSilhouetteScore(calculateSilhouette(points, labels, k));
        return result;
    }

    private static List<Integer> selectColumns(List<String> headers, List<String> requestedColumns) {
        Map<String, Integer> indexes = new HashMap<>();
        for (int i = 0; i < headers.size(); i++) {
            if (indexes.put(headers.get(i), i) != null) {
                throw new IllegalArgumentException("数据集存在重复列名：" + headers.get(i));
            }
        }
        List<Integer> selected = new ArrayList<>();
        if (requestedColumns == null || requestedColumns.isEmpty()) {
            for (int i = 0; i < headers.size(); i++) {
                selected.add(i);
            }
        } else {
            Set<String> uniqueColumns = new HashSet<>();
            for (String column : requestedColumns) {
                if (column == null || !uniqueColumns.add(column) || !indexes.containsKey(column)) {
                    throw new IllegalArgumentException("分析列不存在或重复：" + column);
                }
                selected.add(indexes.get(column));
            }
        }
        if (selected.isEmpty()) {
            throw new IllegalArgumentException("至少需要选择一列进行分析");
        }
        return selected;
    }

    private static List<double[]> initializeCentroids(List<double[]> points, int k, Random random) {
        List<Integer> indexes = new ArrayList<>();
        for (int i = 0; i < points.size(); i++) {
            indexes.add(i);
        }
        Collections.shuffle(indexes, random);
        List<double[]> centroids = new ArrayList<>();
        for (int i = 0; i < k; i++) {
            centroids.add(points.get(indexes.get(i)).clone());
        }
        return centroids;
    }

    private static void assignLabels(List<double[]> points, List<double[]> centroids, int[] labels) {
        for (int i = 0; i < points.size(); i++) {
            int nearest = 0;
            double nearestDistance = squaredDistance(points.get(i), centroids.get(0));
            for (int cluster = 1; cluster < centroids.size(); cluster++) {
                double distance = squaredDistance(points.get(i), centroids.get(cluster));
                if (distance < nearestDistance) {
                    nearest = cluster;
                    nearestDistance = distance;
                }
            }
            labels[i] = nearest;
        }
    }

    private static double squaredDistance(double[] left, double[] right) {
        double distance = 0;
        for (int i = 0; i < left.length; i++) {
            double difference = left[i] - right[i];
            distance += difference * difference;
        }
        return distance;
    }

    private static List<Integer> clusterCounts(int[] labels, int k) {
        int[] counts = new int[k];
        for (int label : labels) {
            counts[label]++;
        }
        return Arrays.stream(counts).boxed().toList();
    }

    private static double calculateSilhouette(List<double[]> points, int[] labels, int k) {
        double total = 0;
        for (int i = 0; i < points.size(); i++) {
            double sameClusterDistance = 0;
            int sameClusterCount = 0;
            double nearestOtherClusterDistance = Double.POSITIVE_INFINITY;
            for (int j = 0; j < points.size(); j++) {
                if (i == j) {
                    continue;
                }
                double distance = Math.sqrt(squaredDistance(points.get(i), points.get(j)));
                if (labels[i] == labels[j]) {
                    sameClusterDistance += distance;
                    sameClusterCount++;
                }
            }
            if (sameClusterCount > 0) {
                sameClusterDistance /= sameClusterCount;
            }
            for (int cluster = 0; cluster < k; cluster++) {
                if (cluster == labels[i]) {
                    continue;
                }
                double clusterDistance = 0;
                int clusterCount = 0;
                for (int j = 0; j < points.size(); j++) {
                    if (labels[j] == cluster) {
                        clusterDistance += Math.sqrt(squaredDistance(points.get(i), points.get(j)));
                        clusterCount++;
                    }
                }
                if (clusterCount > 0) {
                    nearestOtherClusterDistance = Math.min(nearestOtherClusterDistance,
                            clusterDistance / clusterCount);
                }
            }
            double denominator = Math.max(sameClusterDistance, nearestOtherClusterDistance);
            total += denominator == 0 || Double.isInfinite(denominator)
                    ? 0 : (nearestOtherClusterDistance - sameClusterDistance) / denominator;
        }
        return total / points.size();
    }
}
