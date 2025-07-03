import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getCalculators,
  deleteCalculator as apiDeleteCalculator,
} from "../services/api";
import type { Calculator } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import ShareModal from "./ShareModal";

const ListPage: React.FC = () => {
  const [calculators, setCalculators] = useState<Calculator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [showShareModal, setShowShareModal] = useState(false);

  const fetchCalculators = () => {
    setLoading(true);
    getCalculators()
      .then((data) => {
        setCalculators(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch calculators:", err);
        setError("Failed to load calculators. Please try again later.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCalculators();
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm("确定要删除这个计算器吗？")) {
      apiDeleteCalculator(id)
        .then(() => {
          setCalculators((prev) => prev.filter((c) => c.id !== id));
        })
        .catch((err) => {
          console.error("Failed to delete calculator:", err);
          setError("Failed to delete calculator.");
        });
    }
  };

  const filteredCalculators = useMemo(
    () =>
      calculators.filter((c) =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [calculators, searchTerm]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-3xl p-2 sm:p-4 md:p-8 shadow-2xl">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 sm:gap-0">
          <h2 className="font-bold text-gray-800 text-lg text-center sm:text-2xl sm:text-left sm:flex-shrink-0 sm:max-w-none sm:mr-8">
            我的计算器
          </h2>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto flex-1 gap-2 sm:gap-4 items-center sm:items-center px-2 sm:px-0">
            <input
              type="text"
              placeholder="搜索计算器..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 rounded-full border-2 border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-from transition-all duration-300 w-full sm:w-auto text-base sm:text-lg"
            />
            <Link
              to="/new"
              className="bg-gradient-to-r from-brand-from to-brand-to hover:from-brand-to hover:to-brand-from text-white font-semibold py-2 px-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg whitespace-nowrap w-full sm:w-auto text-center text-base sm:text-lg"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-0">
                {filteredCalculators.map((calculator) => (
                  <motion.div
                    key={calculator.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="group"
                  >
                    <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border-2 border-gray-200 hover:border-brand-from/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg relative overflow-hidden px-2 sm:px-4">
                      {/* Top accent bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-from to-brand-to"></div>

                      <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-gray-800 truncate text-nowrap">
                        {calculator.title}
                      </h3>

                      <div className="bg-blue-50 p-2 sm:p-3 rounded-lg mb-3 sm:mb-4">
                        <code className="text-xs sm:text-sm text-blue-600 font-mono break-all">
                          {calculator.formula}
                        </code>
                      </div>

                      <div className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                        创建时间:{" "}
                        {new Date(calculator.createdAt).toLocaleDateString(
                          "zh-CN"
                        )}
                      </div>

                      <div className="flex flex-row gap-1 flex-nowrap whitespace-nowrap">
                        <Link
                          to={`/calculator/${calculator.id}`}
                          className="bg-brand-from hover:bg-brand-to text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 w-auto min-w-[56px] text-center"
                        >
                          使用
                        </Link>
                        <Link
                          to={`/edit/${calculator.id}`}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 w-auto min-w-[56px] text-center"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => {
                            const base = import.meta.env.VITE_BASE || "";
                            const basePath = base.endsWith("/") ? base.slice(0, -1) : base;
                            const url = `${window.location.origin}${basePath}/calculator/${calculator.id}`;
                            setShareUrl(url);
                            setShowShareModal(true);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 w-auto min-w-[56px] text-center"
                        >
                          分享
                        </button>
                        <button
                          onClick={() => handleDelete(calculator.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 w-auto min-w-[56px] text-center"
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
                  {searchTerm
                    ? `未找到 "${searchTerm}" 的结果`
                    : "还没有创建任何计算器"}
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
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
            )}
          </AnimatePresence>
        )}
      </div>
      <ShareModal open={showShareModal} url={shareUrl} onClose={() => setShowShareModal(false)} />
    </motion.div>
  );
};

export default ListPage;
