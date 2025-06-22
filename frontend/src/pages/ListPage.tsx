import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCalculators, deleteCalculator as apiDeleteCalculator } from '../services/api';
import type { Calculator } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const ListPage: React.FC = () => {
  const [calculators, setCalculators] = useState<Calculator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCalculators = () => {
    setLoading(true);
    getCalculators()
      .then(data => {
        setCalculators(data);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to fetch calculators:", err);
        setError('Failed to load calculators. Please try again later.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCalculators();
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个计算器吗？')) {
      apiDeleteCalculator(id)
        .then(() => {
          setCalculators(prev => prev.filter(c => c.id !== id));
        })
        .catch(err => {
          console.error("Failed to delete calculator:", err);
          setError('Failed to delete calculator.');
        });
    }
  };

  const filteredCalculators = useMemo(() => 
    calculators.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase())
    ), [calculators, searchTerm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-3xl p-8 shadow-2xl">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">我的计算器</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="搜索计算器..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-3 rounded-full border-2 border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-from transition-all duration-300 w-80"
            />
            <Link 
              to="/new" 
              className="bg-gradient-to-r from-brand-from to-brand-to hover:from-brand-to hover:to-brand-from text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg whitespace-nowrap"
            >
              + 新建计算器
            </Link>
          </div>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-from mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center py-16">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        )}
        
        {!loading && !error && (
          <AnimatePresence>
            {filteredCalculators.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCalculators.map(calculator => (
                  <motion.div
                    key={calculator.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="group"
                  >
                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-brand-from/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg relative overflow-hidden">
                      {/* Top accent bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-from to-brand-to"></div>
                      
                      <h3 className="text-xl font-semibold mb-3 text-gray-800">{calculator.title}</h3>
                      
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <code className="text-sm text-blue-600 font-mono break-all">
                          {calculator.formula}
                        </code>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-6">
                        创建时间: {new Date(calculator.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        <Link 
                          to={`/calculator/${calculator.id}`}
                          className="bg-brand-from hover:bg-brand-to text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                        >
                          使用
                        </Link>
                        <Link 
                          to={`/edit/${calculator.id}`}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                        >
                          编辑
                        </Link>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/calculator/${calculator.id}`)
                              .then(() => alert('链接已复制到剪贴板！'))
                              .catch(() => alert('复制失败'));
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                        >
                          分享
                        </button>
                        <button 
                          onClick={() => handleDelete(calculator.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  {searchTerm ? `未找到 "${searchTerm}" 的结果` : "还没有创建任何计算器"}
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  {searchTerm ? "尝试使用不同的关键词搜索。" : "开始创建您的第一个计算器吧！"}
                </p>
                <Link 
                  to="/new" 
                  className="bg-gradient-to-r from-brand-from to-brand-to hover:from-brand-to hover:to-brand-from text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                >
                  创建您的第一个计算器
                </Link>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default ListPage; 