import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCalculatorById } from '../services/api';
import type { Calculator } from '../types';
import { evaluate } from 'mathjs';
import { motion } from 'framer-motion';

const CalculatorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [calculator, setCalculator] = useState<Calculator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    if (id) {
      getCalculatorById(id)
        .then(data => {
          console.log('Calculator data:', data); // 调试信息
          setCalculator(data);
          const initialValues: Record<string, string> = {};
          // 确保 variables 存在且是数组
          if (data.variables && Array.isArray(data.variables)) {
            data.variables.forEach(v => { initialValues[v] = '5'; });
          }
          console.log('Initial values:', initialValues); // 调试信息
          setVariableValues(initialValues);
        })
        .catch(err => {
          console.error("Failed to fetch calculator:", err);
          setError('Calculator not found or an error occurred.');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleVariableChange = (variable: string, value: string) => {
    console.log('Variable change:', variable, value); // 调试信息
    setVariableValues(prev => {
      const newValues = { ...prev, [variable]: value };
      console.log('New variable values:', newValues); // 调试信息
      return newValues;
    });
  };

  const result = useMemo(() => {
    if (!calculator || !calculator.variables) return NaN;
    
    const allVariablesSet = calculator.variables.every(v => 
      variableValues[v] !== undefined && variableValues[v] !== ''
    );

    if (!allVariablesSet) return NaN;

    try {
      const numericValues = Object.fromEntries(
        Object.entries(variableValues).map(([key, value]) => [key, parseFloat(value)])
      );
      console.log('Numeric values for calculation:', numericValues); // 调试信息
      const calculatedResult = evaluate(calculator.formula, numericValues);
      console.log('Calculated result:', calculatedResult); // 调试信息
      return calculatedResult;
    } catch (error) {
      console.error('Calculation error:', error); // 调试信息
      return NaN;
    }
  }, [calculator, variableValues]);

  const handleReset = () => {
    if (calculator && calculator.variables) {
      const initialValues: Record<string, string> = {};
      calculator.variables.forEach(v => { initialValues[v] = ''; });
      setVariableValues(initialValues);
    }
  };

  const handleCopyResult = () => {
    if (!isNaN(result)) {
      navigator.clipboard.writeText(result.toString()).then(() => {
        setCopySuccess('已复制！');
        setTimeout(() => setCopySuccess(''), 2000);
      }, () => {
        setCopySuccess('复制失败');
        setTimeout(() => setCopySuccess(''), 2000);
      });
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white/80">加载计算器中...</p>
      </div>
    );
  }
  
  if (error) return <p className="text-center text-red-300 text-lg py-16">{error}</p>;
  if (!calculator) return <p className="text-center text-white py-16">未找到计算器。</p>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-3xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-10 pb-6 border-b-2 border-gray-100">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">{calculator.title}</h2>
          <p className="text-gray-600 text-lg">{calculator.description}</p>
        </div>

        {/* Formula Display */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-3 border-brand-from rounded-2xl p-8 mb-8 text-center">
          <div className="text-2xl font-serif text-gray-800">
            {calculator.formula}
          </div>
        </div>

        {/* Input Parameters */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">输入参数</h3>
          <div className="space-y-4">
            {calculator.variables && calculator.variables.length > 0 ? (
              calculator.variables.map(variable => (
                <div key={variable} className="flex items-center bg-gray-50 p-4 rounded-xl">
                  <label className="min-w-[100px] text-lg font-semibold text-brand-from capitalize">
                    {variable === 'r' ? '半径' : variable} ({variable}):
                  </label>
                  <input
                    type="number"
                    value={variableValues[variable] || ''}
                    onChange={(e) => handleVariableChange(variable, e.target.value)}
                    placeholder={`请输入${variable === 'r' ? '半径' : variable}`}
                    className="flex-1 ml-5 px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-from focus:bg-white transition-all duration-300 text-lg text-black"
                  />
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">
                该公式不需要输入参数
              </div>
            )}
          </div>
        </div>

        {/* Result Section */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-medium text-gray-800 mb-4">计算结果</h3>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl">
            <div className="text-4xl font-bold">
              {isNaN(result) ? '...' : result.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Debug Info (可以在生产环境中移除) */}
        <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm text-black">
          <p><strong>Variables:</strong> {JSON.stringify(calculator.variables)}</p>
          <p><strong>Current Values:</strong> {JSON.stringify(variableValues)}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button 
            onClick={handleReset}
            className="px-6 py-3 bg-transparent border-2 border-brand-from text-brand-from rounded-xl font-medium hover:bg-brand-from hover:text-white transition-all duration-300"
          >
            重置
          </button>
          <button 
            onClick={handleCopyResult}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors duration-300"
          >
            {copySuccess || '复制结果'}
          </button>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors duration-300"
          >
            返回列表
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CalculatorPage; 