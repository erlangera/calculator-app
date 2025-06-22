import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { Calculator } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.resolve(__dirname, '../../data/calculators.json');

interface DbSchema {
  calculators: Calculator[];
}

async function readData(): Promise<DbSchema> {
  try {
    const data = await fs.readJson(dataPath);
    return data;
  } catch (error) {
    // If the file doesn't exist or is empty, return a default structure
    return { calculators: [] };
  }
}

async function writeData(data: DbSchema): Promise<void> {
  await fs.writeJson(dataPath, data, { spaces: 2 });
}

export const db = {
  async getCalculators(): Promise<Calculator[]> {
    const data = await readData();
    return data.calculators;
  },

  async getCalculatorById(id: string): Promise<Calculator | undefined> {
    const data = await readData();
    return data.calculators.find((c) => c.id === id);
  },

  async addCalculator(calculator: Calculator): Promise<Calculator> {
    const data = await readData();
    data.calculators.push(calculator);
    await writeData(data);
    return calculator;
  },

  async updateCalculator(id: string, updatedCalculator: Partial<Calculator>): Promise<Calculator | undefined> {
    const data = await readData();
    const index = data.calculators.findIndex((c) => c.id === id);
    if (index === -1) {
      return undefined;
    }
    const calculator = { ...data.calculators[index], ...updatedCalculator, updatedAt: new Date().toISOString() };
    data.calculators[index] = calculator;
    await writeData(data);
    return calculator;
  },

  async deleteCalculator(id: string): Promise<boolean> {
    const data = await readData();
    const initialLength = data.calculators.length;
    data.calculators = data.calculators.filter((c) => c.id !== id);
    if (data.calculators.length === initialLength) {
      return false; // Not found
    }
    await writeData(data);
    return true;
  }
}; 