import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCalculatorById, ApiError } from '../services/api';
import type { Calculator } from '../types';
import { evaluate } from 'mathjs';
import { motion } from 'framer-motion';
import ShareModal from "./ShareModal";

// 错误状态类型
interface ErrorState {
  hasError: boolean;
  message: string;
  type: 'not-found' | 'network' | 'validation' | 'server' | 'unknown';
  canRetry: boolean;
}

const CalculatorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [calculator, setCalculator] = useState<Calculator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [copySuccess, setCopySuccess] = useState('');
  const [shareUrl, setShareUrl] = useState<string>("");
  const [showShareModal, setShowShareModal] = useState(false);

  // 错误处理函数
  const handleError = (error: unknown): ErrorState => {
    if (error instanceof ApiError) {
      switch (error.code) {
        case 'NOT_FOUND':
          return {
            hasError: true,
            message: '抱歉，没有找到这个计算器。可能已被删除或链接有误。',
            type: 'not-found',
            canRetry: false
          };
        case 'INVALID_ID':
          return {
            hasError: true,
            message: '链接格式不正确，请检查URL是否完整。',
            type: 'validation',
            canRetry: false
          };
        case 'NETWORK':
          return {
            hasError: true,
            message: '网络连接出现问题，请检查网络后重试。',
            type: 'network',
            canRetry: true
          };
        case 'TIMEOUT':
          return {
            hasError: true,
            message: '请求超时，请稍后重试。',
            type: 'network',
            canRetry: true
          };
        case 'SERVER':
          return {
            hasError: true,
            message: '服务器暂时不可用，请稍后重试。',
            type: 'server',
            canRetry: true
          };
        default:
          return {
            hasError: true,
            message: error.message || '加载计算器时出现错误，请稍后重试。',
            type: 'unknown',
            canRetry: true
          };
      }
    }
    
    return {
      hasError: true,
      message: '发生未知错误，请稍后重试。',
      type: 'unknown',
      canRetry: true
    };
  };

  // 加载计算器数据
  const loadCalculator = async () => {
    if (!id) {
      setError({
        hasError: true,
        message: '缺少计算器ID参数。',
        type: 'validation',
        canRetry: false
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await getCalculatorById(id);
      setCalculator(data);
      
      // 初始化变量值
      const initialValues: Record<string, string> = {};
      if (data.variables && Array.isArray(data.variables)) {
        data.variables.forEach(v => { initialValues[v] = '5'; });
      }
      setVariableValues(initialValues);
      
    } catch (err) {
      console.error("Failed to fetch calculator:", err);
      setError(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  // 重试加载
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadCalculator();
  };

  useEffect(() => {
    loadCalculator();
  }, [id]);

  const handleVariableChange = (variable: string, value: string) => {
    setVariableValues(prev => {
      const newValues = { ...prev, [variable]: value };
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
      const calculatedResult = evaluate(calculator.formula, numericValues);
      return calculatedResult;
    } catch (error) {
      console.error('Calculation error:', error);
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

  // 生成当前详情页链接
  const getShareUrl = () => {
    if (!calculator) return "";
    const base = import.meta.env.VITE_BASE || "";
    const basePath = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${window.location.origin}${basePath}/calculator/${calculator.id}`;
  };

  // 加载状态
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white/80">
          {retryCount > 0 ? `正在重试加载... (${retryCount})` : '加载计算器中...'}
        </p>
      </div>
    );
  }
  
  // 错误状态
  if (error?.hasError) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-2xl text-center"
        >
          <div className={`text-6xl mb-6 ${
            error.type === 'not-found' ? '🔍' :
            error.type === 'network' ? '🌐' :
            error.type === 'validation' ? '⚠️' :
            error.type === 'server' ? '🔧' : '❌'
          }`}>
            {error.type === 'not-found' ? '🔍' :
             error.type === 'network' ? '🌐' :
             error.type === 'validation' ? '⚠️' :
             error.type === 'server' ? '🔧' : '❌'}
          </div>
          
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            {error.type === 'not-found' ? '计算器未找到' :
             error.type === 'network' ? '网络连接问题' :
             error.type === 'validation' ? '链接格式错误' :
             error.type === 'server' ? '服务器错误' : '加载失败'}
          </h2>
          
          <p className="text-gray-600 mb-8 text-lg">{error.message}</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {error.canRetry && (
              <button 
                onClick={handleRetry}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-300"
              >
                重试加载
              </button>
            )}
            
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors duration-300"
            >
              返回首页
            </button>
            
            {error.type === 'not-found' && (
              <button 
                onClick={() => navigate('/new')}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors duration-300"
              >
                创建新计算器
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }
  
  if (!calculator) {
    return (
      <div className="text-center py-16">
        <p className="text-white">数据加载异常，请刷新页面重试。</p>
      </div>
    );
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-center mb-10 pb-6 border-b-2 border-gray-100 gap-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">{calculator.title}</h2>
              <p className="text-gray-600 text-lg">{calculator.description}</p>
            </div>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 min-w-[72px]"
              onClick={() => {
                setShareUrl(getShareUrl());
                setShowShareModal(true);
              }}
            >
              分享
            </button>
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
                  <div key={variable} className="flex flex-wrap items-center bg-gray-50 p-4 rounded-xl gap-2">
                    <label className="min-w-[100px] text-lg font-semibold text-brand-from capitalize">
                      {calculator.variableLabels?.[variable] || variable} ({variable}):
                    </label>
                    <input
                      type="number"
                      value={variableValues[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`请输入${calculator.variableLabels?.[variable] || variable}`}
                      className="w-full sm:flex-1 max-w-[220px] ml-0 sm:ml-5 px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-from focus:bg-white transition-all duration-300 text-lg text-black"
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
      <ShareModal open={showShareModal} url={shareUrl} onClose={() => setShowShareModal(false)} />
    </>
  );
};

export default CalculatorPage; 