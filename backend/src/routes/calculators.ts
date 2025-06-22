import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../storage/storage.js';
import { Calculator } from '../types/index.js';
import { extractVariables } from '../utils/mathUtils.js';
import { evaluate } from 'mathjs';

const router = Router();

// GET /api/calculators - Get all calculators
router.get('/', async (req, res) => {
  const calculators = await db.getCalculators();
  // sort by creation date descending
  calculators.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(calculators);
});

// GET /api/calculators/:id - Get a single calculator
router.get('/:id', async (req, res) => {
  const calculator = await db.getCalculatorById(req.params.id);
  if (calculator) {
    res.json(calculator);
  } else {
    res.status(404).json({ message: 'Calculator not found' });
  }
});

// POST /api/calculators - Create a new calculator
router.post('/', async (req, res) => {
  const { title, description, formula } = req.body;

  if (!title || !formula) {
    return res.status(400).json({ message: 'Title and formula are required' });
  }

  try {
    const variables = extractVariables(formula);
    const now = new Date().toISOString();

    const newCalculator: Calculator = {
      id: uuidv4(),
      title,
      description: description || '',
      formula,
      variables,
      createdAt: now,
      updatedAt: now,
    };

    const addedCalculator = await db.addCalculator(newCalculator);
    res.status(201).json(addedCalculator);
  } catch (error) {
    res.status(400).json({ message: 'Invalid formula' });
  }
});

// PUT /api/calculators/:id - Update a calculator
router.put('/:id', async (req, res) => {
    const { title, description, formula } = req.body;
  
    if (!title || !formula) {
      return res.status(400).json({ message: 'Title and formula are required' });
    }
  
    try {
      const variables = extractVariables(formula);
      const updatedAt = new Date().toISOString();
  
      const updatedData: Partial<Calculator> = {
        title,
        description,
        formula,
        variables,
        updatedAt,
      };
  
      const updatedCalculator = await db.updateCalculator(req.params.id, updatedData);
  
      if (updatedCalculator) {
        res.json(updatedCalculator);
      } else {
        res.status(404).json({ message: 'Calculator not found' });
      }
    } catch (error) {
      res.status(400).json({ message: 'Invalid formula' });
    }
});

// DELETE /api/calculators/:id - Delete a calculator
router.delete('/:id', async (req, res) => {
  const success = await db.deleteCalculator(req.params.id);
  if (success) {
    res.status(204).send(); // No Content
  } else {
    res.status(404).json({ message: 'Calculator not found' });
  }
});

// POST /api/calculate - Perform a calculation
router.post('/calculate', (req, res) => {
    const { formula, variables } = req.body;
  
    if (!formula || !variables) {
      return res.status(400).json({ message: 'Formula and variables are required.' });
    }
  
    try {
      const result = evaluate(formula, variables);
      res.json({ result });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
});


export default router; 