export interface Calculator {
  id: string;
  title: string;
  description?: string;
  formula: string;
  variables: string[];
  variableLabels?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
} 