import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getCalculators,
  deleteCalculator as apiDeleteCalculator,
  ApiError
} from "../services/api";
import type { Calculator } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import ShareModal from "./ShareModal";

// 错误状态类型
interface ErrorState {
  hasError: boolean;
  message: string;
  type: 'network' | 'server' | 'unknown';
  canRetry: boolean;
}

const ListPage: React.FC = () => {
  const [calculators, setCalculators] = useState<Calculator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 错误处理函数
  const handleError = (error: unknown): ErrorState => {
    if (error instanceof ApiError) {
      switch (error.code) {
        case 'NETWORK':
        case 'TIMEOUT':
          return {
            hasError: true,
            message: '网络连接出现问题，请检查网络后重试。',
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
            message: error.message || '加载计算器列表时出现错误，请稍后重试。',
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

  // 加载计算器列表
  const fetchCalculators = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getCalculators();
      setCalculators(data);
      
    } catch (err) {
      console.error("Failed to fetch calculators:", err);
      setError(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  // 重试加载
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchCalculators();
  };

  useEffect(() => {
    fetchCalculators();
  }, []);

  // 生成分享URL的安全函数
  const generateShareUrl = (calculatorId: string): string => {
    try {
      const base = import.meta.env.VITE_BASE || "";
      const basePath = base.endsWith("/") ? base.slice(0, -1) : base;
      const url = `${window.location.origin}${basePath}/calculator/${calculatorId}`;
      
      // 验证生成的URL
      new URL(url);
      return url;
    } catch (error) {
      console.error('Failed to generate share URL:', error);
      return '';
    }
  };

  // 处理分享
  const handleShare = (calculator: Calculator) => {
    const url = generateShareUrl(calculator.id);
    if (url) {
      setShareUrl(url);
      setShowShareModal(true);
    } else {
      // 显示错误提示
      alert('分享链接生成失败，请稍后重试');
    }
  };

  // 删除计算器
  const handleDelete = async (id: string) => {
    if (window.confirm("确定要删除这个计算器吗？")) {
      try {
        setDeleteError(null);
        await apiDeleteCalculator(id);
        setCalculators((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        console.error("Failed to delete calculator:", err);
        
        let errorMessage = '删除失败，请稍后重试。';
        if (err instanceof ApiError) {
          switch (err.code) {
            case 'NOT_FOUND':
              errorMessage = '计算器不存在，可能已被删除。';
              // 从本地列表中移除
              setCalculators((prev) => prev.filter((c) => c.id !== id));
              break;
            case 'NETWORK':
            case 'TIMEOUT':
              errorMessage = '网络连接问题，删除失败。';
              break;
            case 'SERVER':
              errorMessage = '服务器错误，删除失败。';
              break;
            default:
              errorMessage = err.message || '删除失败，请稍后重试。';
          }
        }
        
        setDeleteError(errorMessage);
        setTimeout(() => setDeleteError(null), 5000);
      }
    }
  };

  const filteredCalculators = useMemo(
    () =>
      calculators.filter((c) =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [calculators, searchTerm]
  );

  // 加载状态
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">
            {retryCount > 0 ? `正在重试加载... (${retryCount})` : '加载计算器列表中...'}
          </p>
        </div>
      </motion.div>
    );
  }

  // 错误状态
  if (error?.hasError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center py-16">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-lg mx-auto">
            <div className="text-6xl mb-6">
              {error.type === 'network' ? '🌐' : error.type === 'server' ? '🔧' : '❌'}
            </div>
            
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {error.type === 'network' ? '网络连接问题' : 
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
              
              <Link 
                to="/new"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors duration-300 text-center"
              >
                创建新计算器
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto"
    >
      {/* 删除错误提示 */}
      {deleteError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 px-5 py-3 bg-red-500 text-white rounded-lg shadow-lg z-50">
          {deleteError}
        </div>
      )}

      {/* Header with Search */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            我的计算器
          </h1>
          <p className="text-white/80 text-lg">
            管理和使用您创建的所有计算器
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* 搜索框 - 移动端优化 */}
          <div className="mb-6 sm:mb-8">
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                placeholder="搜索计算器..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-from focus:border-transparent transition-all duration-300 touch-manipulation"
                style={{ fontSize: '16px' }} // 防止iOS Safari缩放
              />
              <svg 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <Link
            to="/new"
            className="bg-gradient-to-r from-brand-from to-brand-to hover:from-brand-to hover:to-brand-from text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg whitespace-nowrap text-center"
          >
            新建计算器
          </Link>
        </div>
      </div>

      {/* Calculators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {loading ? (
          <div className="col-span-full text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-white/80">加载中...</p>
          </div>
        ) : filteredCalculators.length > 0 ? (
          <AnimatePresence>
            {filteredCalculators.map((calculator, index) => (
              <motion.div
                key={calculator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 line-clamp-2">
                      {calculator.title}
                    </h3>
                    <div className="flex gap-2 flex-shrink-0 ml-2">
                      {/* 分享按钮 - 移动端优化 */}
                      <button
                        onClick={() => handleShare(calculator)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-300 touch-manipulation"
                        aria-label="分享计算器"
                        title="分享计算器"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      </button>
                      {/* 删除按钮 - 移动端优化 */}
                      <button
                        onClick={() => handleDelete(calculator.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-300 touch-manipulation"
                        aria-label="删除计算器"
                        title="删除计算器"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-3">
                    {calculator.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Link
                      to={`/calculator/${calculator.id}`}
                      className="flex-1 bg-brand-from hover:bg-brand-to text-white text-center py-3 px-4 rounded-lg font-medium transition-colors duration-300 touch-manipulation text-sm sm:text-base"
                    >
                      使用计算器
                    </Link>
                    <Link
                      to={`/edit/${calculator.id}`}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors duration-300 touch-manipulation text-sm sm:text-base"
                    >
                      编辑
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20">
              <div className="text-6xl mb-6">📊</div>
              <h3 className="text-2xl font-bold mb-4 text-white">
                {searchTerm
                  ? `未找到 "${searchTerm}" 的结果`
                  : "还没有创建任何计算器"}
              </h3>
              <p className="text-white/80 mb-8 text-lg">
                {searchTerm
                  ? "尝试使用不同的关键词搜索。"
                  : "开始创建您的第一个计算器吧！"}
              </p>
              <Link
                to="/new"
                className="bg-gradient-to-r from-brand-from to-brand-to hover:from-brand-to hover:to-brand-from text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
              >
                创建您的第一个计算器
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <ShareModal 
        open={showShareModal} 
        url={shareUrl} 
        onClose={() => setShowShareModal(false)} 
      />
    </motion.div>
  );
};

export default ListPage;
