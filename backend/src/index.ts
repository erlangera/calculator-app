import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import calculatorRoutes from './routes/calculators.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

// Routes
app.use('/api/calculators', calculatorRoutes);
app.use('/api/calculate', calculatorRoutes); // Re-using the same router for /calculate

app.get('/', (req, res) => {
    res.send('Formula Calculator API is running...');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 