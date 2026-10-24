
export interface Result<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface UserUpdateDTO {
  userName?: string;
  userAvatar?: string;
}

export interface ResultUserVO {
  code?: number;
  message?: string;
  data?: UserVO;
}

export interface UserVO {
  id?: number;
  userName?: string;
  userAvatar?: string;
  userEmail?: string;
  userRole?: string;
  createTime?: string;
  updateTime?: string;
  token?: string;
}

export interface UserRegisterDTO {
  userName?: string;
  userEmail?: string;
  emailCode?: string;
  userPassword?: string;
  checkedPassword?: string;
}

export interface UserLoginDTO {
  userEmail?: string;
  userPassword?: string;
}

export interface KMeansDTO {
  file?: string;
  columns?: string[];
  k?: number;
  maxIterations?: number;
  tolerance?: number;
  seed?: number;
}

export interface KMeansVO {
  k?: number;
  labels?: number[];
  centroids?: number[][];
  silhouetteScore?: number;
  nums?: number[];
}

export interface ResultKMeansVO {
  code?: number;
  message?: string;
  data?: KMeansVO;
}

export interface ChartAnalysisDTO {
  file?: string;
  x?: string;
  y?: string;
  chartType?: string;
  chartGoal?: string;
}

export interface ChartAnalysisVO {
  process?: string;
  chartConclusion?: string;
}

export interface ResultChartAnalysisVO {
  code?: number;
  message?: string;
  data?: ChartAnalysisVO;
}
