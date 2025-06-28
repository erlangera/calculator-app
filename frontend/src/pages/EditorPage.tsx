import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { getCalculatorById, createCalculator, updateCalculator } from '../services/api';
import { parse, evaluate } from 'mathjs';
import { motion } from 'framer-motion';

interface IFormInput {
  title: string;
  description: string;
  formula: string;
  variableLabels: Record<string, string>;
}

const extractVariables = (formula: string): string[] => {
  try {
    const node = parse(formula);
    const variables = new Set<string>();
    node.traverse((n: any) => {
      if (n.isSymbolNode && /^[a-z]$/.test(n.name)) {
        variables.add(n.name);
      }
    });
    return Array.from(variables).sort();
  } catch {
    return [];
  }
};

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<IFormInput>({
    defaultValues: {
      title: '圆面积计算器',
      description: '计算圆的面积，输入半径即可',
      formula: '3.14159 * r^2',
      variableLabels: { r: '半径' }
    }
  });
  
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [previewValues, setPreviewValues] = useState<Record<string, number>>({ r: 5 });
  const [previewResult, setPreviewResult] = useState<string>('78.54');

  const formulaValue = watch('formula', '3.14159 * r^2');
  const variableLabelsValue = watch('variableLabels', { r: '半径' });
  const liveVariables = useMemo(() => extractVariables(formulaValue), [formulaValue]);

  useEffect(() => {
    if (isEditMode && id) {
      getCalculatorById(id).then(data => {
        setValue('title', data.title);
        setValue('description', data.description || '');
        setValue('formula', data.formula);
        setValue('variableLabels', data.variableLabels || {});
      });
    }
  }, [id, isEditMode, setValue]);

  // Update preview values when variables change
  useEffect(() => {
    const newValues: Record<string, number> = {};
    liveVariables.forEach(v => {
      if (!(v in previewValues)) {
        newValues[v] = v === 'r' ? 5 : 0;
      } else {
        newValues[v] = previewValues[v];
      }
    });
    setPreviewValues(newValues);
  }, [liveVariables]);

  // Calculate preview result
  useEffect(() => {
    if (formulaValue && !formulaError) {
      try {
        const result = evaluate(formulaValue, previewValues);
        setPreviewResult(typeof result === 'number' ? result.toFixed(2) : result.toString());
      } catch {
        setPreviewResult('...');
      }
    } else {
      setPreviewResult('...');
    }
  }, [formulaValue, previewValues, formulaError]);

  const onSubmit = async (data: IFormInput) => {
    try {
      if (isEditMode && id) {
        await updateCalculator(id, data);
      } else {
        await createCalculator(data);
      }
      navigate('/');
    } catch (error) {
      console.error('Failed to save calculator', error);
    }
  };

  useEffect(() => {
    try {
      if (formulaValue) {
        parse(formulaValue);
      }
      setFormulaError(null);
    } catch (e: any) {
      setFormulaError(e.message);
    }
  }, [formulaValue]);

  const handlePreviewValueChange = (variable: string, value: number) => {
    setPreviewValues(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const handleVariableLabelChange = (variable: string, label: string) => {
    setValue('variableLabels', {
      ...variableLabelsValue,
      [variable]: label
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-3xl p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
          
          {/* Editor Panel */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
              <div className="w-1 h-6 bg-brand-from rounded mr-3"></div>
              编辑计算器
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">计算器标题</label>
                <input
                  {...register('title', { required: '标题是必需的' })}
                  placeholder="例如：圆面积计算器"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-from transition-all duration-300"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">描述（可选）</label>
                <input
                  {...register('description')}
                  placeholder="简单描述这个计算器的用途"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-from transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">公式</label>
                <input
                  {...register('formula', { required: '公式是必需的' })}
                  placeholder="例如：3.14159 * r^2"
                  className={`w-full px-4 py-3 rounded-xl border-2 font-mono ${
                    formulaError 
                      ? 'border-red-400 bg-red-50' 
                      : 'border-gray-200 bg-white focus:border-brand-from'
                  } text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-300`}
                />
                <p className="text-sm text-gray-500 mt-2">
                  支持 +、-、*、/、^、sqrt()、sin()、cos() 等
                </p>
                {errors.formula && <p className="text-red-500 text-sm mt-1">{errors.formula.message}</p>}
                {formulaError && <p className="text-red-500 text-sm mt-1">语法错误: {formulaError}</p>}
              </div>

              {/* Variable Labels Section */}
              {liveVariables.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">变量标签设置</label>
                  <div className="space-y-3">
                    {liveVariables.map(variable => (
                      <div key={variable} className="flex items-center gap-3">
                        <span className="text-sm font-mono text-gray-600 min-w-[20px]">{variable}:</span>
                        <input
                          type="text"
                          value={variableLabelsValue[variable] || ''}
                          onChange={(e) => handleVariableLabelChange(variable, e.target.value)}
                          placeholder={`${variable}的标签（如：半径）`}
                          className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-from transition-all duration-300"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    为每个变量设置友好的显示标签，留空则使用变量名
                  </p>
                </div>
              )}
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => navigate('/')} 
                  className="px-6 py-3 bg-transparent border-2 border-brand-from text-brand-from rounded-xl font-medium hover:bg-brand-from hover:text-white transition-all duration-300"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !!formulaError} 
                  className="px-6 py-3 bg-gradient-to-r from-brand-from to-brand-to hover:from-brand-to hover:to-brand-from text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isSubmitting ? '保存中...' : '保存计算器'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Preview Panel */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
              <div className="w-1 h-6 bg-brand-from rounded mr-3"></div>
              预览
            </h3>
            
            <div className="space-y-6">
              {/* Formula Display */}
              <div className="bg-blue-50 border-2 border-dashed border-blue-300 p-5 rounded-xl text-center">
                <div className="text-xl font-serif text-gray-800">
                  面积 = 3.14159 × r²
                </div>
              </div>
              
              {/* Variables Grid */}
              {liveVariables.length > 0 && (
                <div className="space-y-4">
                  {liveVariables.map(variable => (
                    <div key={variable} className="text-center">
                      <label className="block text-sm font-semibold mb-2 text-brand-from capitalize">
                        {variableLabelsValue[variable] || variable} ({variable})
                      </label>
                      <input
                        type="number"
                        value={previewValues[variable] || 0}
                        onChange={(e) => handlePreviewValueChange(variable, parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-800 text-center focus:outline-none focus:border-brand-from transition-all duration-300"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Result Display */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-5 rounded-xl text-center">
                <div className="text-2xl font-bold">
                  结果: {previewResult}
                </div>
              </div>
              
              <button 
                onClick={() => {
                  const newValues: Record<string, number> = {};
                  liveVariables.forEach(v => newValues[v] = 0);
                  setPreviewValues(newValues);
                }}
                className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors duration-300"
              >
                重置
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EditorPage; 