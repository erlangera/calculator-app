import axios, { AxiosError } from 'axios';
import type { Calculator } from '../types';

// 错误类型定义
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 错误消息映射
const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查您的网络连接',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  NOT_FOUND: '请求的计算器不存在',
  VALIDATION_ERROR: '输入数据格式不正确',
  SERVER_ERROR: '服务器内部错误，请稍后重试',
  UNKNOWN_ERROR: '发生未知错误，请稍后重试',
};

// UUID格式验证
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let apiError: ApiError;

    if (error.code === 'ECONNABORTED') {
      apiError = new ApiError(ERROR_MESSAGES.TIMEOUT_ERROR, undefined, 'TIMEOUT');
    } else if (error.code === 'ERR_NETWORK') {
      apiError = new ApiError(ERROR_MESSAGES.NETWORK_ERROR, undefined, 'NETWORK');
    } else if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 404:
          apiError = new ApiError(ERROR_MESSAGES.NOT_FOUND, 404, 'NOT_FOUND');
          break;
        case 400:
          apiError = new ApiError(ERROR_MESSAGES.VALIDATION_ERROR, 400, 'VALIDATION');
          break;
        case 500:
        case 502:
        case 503:
          apiError = new ApiError(ERROR_MESSAGES.SERVER_ERROR, status, 'SERVER');
          break;
        default:
          apiError = new ApiError(ERROR_MESSAGES.UNKNOWN_ERROR, status, 'UNKNOWN');
      }
    } else {
      apiError = new ApiError(ERROR_MESSAGES.NETWORK_ERROR, undefined, 'NETWORK');
    }

    return Promise.reject(apiError);
  }
);

// 重试机制
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | ApiError = new Error('重试失败');
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      // 类型保护，确保error是Error类型
      const currentError = error instanceof Error ? error : new Error(String(error));
      lastError = currentError;
      
      // 如果是客户端错误(4xx)，不重试
      if (currentError instanceof ApiError && currentError.status && currentError.status >= 400 && currentError.status < 500) {
        throw currentError;
      }
      
      // 最后一次重试失败
      if (i === maxRetries) {
        throw currentError;
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  throw lastError;
};

export const getCalculators = (): Promise<Calculator[]> => {
  return retryRequest(() => apiClient.get('/calculators').then(res => res.data));
};

export const getCalculatorById = (id: string): Promise<Calculator> => {
  // 验证UUID格式
  if (!isValidUUID(id)) {
    throw new ApiError('计算器ID格式不正确', 400, 'INVALID_ID');
  }
  
  return retryRequest(() => apiClient.get(`/calculators/${id}`).then(res => res.data));
};

export interface CreateCalculatorData {
  title: string;
  description?: string;
  formula: string;
  variableLabels?: Record<string, string>;
}

export const createCalculator = (data: CreateCalculatorData): Promise<Calculator> => {
  return retryRequest(() => apiClient.post('/calculators', data).then(res => res.data));
};

export const updateCalculator = (id: string, data: CreateCalculatorData): Promise<Calculator> => {
  if (!isValidUUID(id)) {
    throw new ApiError('计算器ID格式不正确', 400, 'INVALID_ID');
  }
  
  return retryRequest(() => apiClient.put(`/calculators/${id}`, data).then(res => res.data));
};

export const deleteCalculator = (id: string): Promise<void> => {
  if (!isValidUUID(id)) {
    throw new ApiError('计算器ID格式不正确', 400, 'INVALID_ID');
  }
  
  return retryRequest(() => apiClient.delete(`/calculators/${id}`).then(() => undefined));
};

export interface CalculationParams {
    formula: string;
    variables: Record<string, number>;
}

export interface CalculationResult {
    result: number;
}

export const performCalculation = (params: CalculationParams): Promise<CalculationResult> => {
    return apiClient.post('/calculate', params).then(res => res.data);
}; 