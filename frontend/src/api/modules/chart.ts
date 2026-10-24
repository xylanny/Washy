import client from '@/api/client';
import type { Result, ChartAnalysisVO, ChartAnalysisDTO } from '../types';

export const chartAPI = {
  generateConclusionByAi: (data: ChartAnalysisDTO): Promise<Result<ChartAnalysisVO>> => {
    return client.post(`/chart/analysis/ai`, data);
  },
};