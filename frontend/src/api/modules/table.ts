import client from '@/api/client';
import type { Result, KMeansVO, KMeansDTO } from '../types';

export const tableAPI = {
  analysisByKmeans: (data: KMeansDTO): Promise<Result<KMeansVO>> => {
    return client.post(`/table/analysis/kmeans`, data);
  },
};