import axios from 'axios';
import type { Calculator } from '../types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCalculators = (): Promise<Calculator[]> => {
    return apiClient.get('/calculators').then(res => res.data);
};

export const getCalculatorById = (id: string): Promise<Calculator> => {
    return apiClient.get(`/calculators/${id}`).then(res => res.data);
};

export type CreateCalculatorData = Omit<Calculator, 'id' | 'variables' | 'createdAt' | 'updatedAt'>;

export const createCalculator = (data: CreateCalculatorData): Promise<Calculator> => {
    return apiClient.post('/calculators', data).then(res => res.data);
};

export type UpdateCalculatorData = CreateCalculatorData;

export const updateCalculator = (id: string, data: UpdateCalculatorData): Promise<Calculator> => {
    return apiClient.put(`/calculators/${id}`, data).then(res => res.data);
};

export const deleteCalculator = (id: string): Promise<void> => {
    return apiClient.delete(`/calculators/${id}`).then(res => res.data);
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