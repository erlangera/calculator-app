export interface Calculator {
  id: string;
  title: string;
  description?: string;
  formula: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
} 