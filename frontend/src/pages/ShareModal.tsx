import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface ShareModalProps {
  open: boolean;
  url: string;
  onClose: () => void;
}

// 复制状态类型
interface CopyState {
  status: 'idle' | 'success' | 'error';
  message: string;
}

// QR码生成状态
interface QRState {
  hasError: boolean;
  errorMessage: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ open, url, onClose }) => {
  const [copyState, setCopyState] = useState<CopyState>({ status: 'idle', message: '' });
  const [qrState, setQRState] = useState<QRState>({ hasError: false, errorMessage: '' });
  const [urlValidation, setUrlValidation] = useState<{ isValid: boolean; message: string }>({ 
    isValid: true, 
    message: '' 
  });

  // URL验证
  useEffect(() => {
    if (!url) {
      setUrlValidation({ 
        isValid: false, 
        message: 'URL生成失败，请刷新页面重试' 
      });
      return;
    }

    try {
      new URL(url);
      setUrlValidation({ isValid: true, message: '' });
    } catch {
      setUrlValidation({ 
        isValid: false, 
        message: 'URL格式无效' 
      });
    }
  }, [url]);

  // 重置状态
  useEffect(() => {
    if (open) {
      setCopyState({ status: 'idle', message: '' });
      setQRState({ hasError: false, errorMessage: '' });
    }
  }, [open]);

  // 检查剪贴板API是否可用
  const isClipboardSupported = (): boolean => {
    return (
      typeof navigator !== 'undefined' &&
      'clipboard' in navigator &&
      typeof navigator.clipboard.writeText === 'function'
    );
  };

  // 降级复制方案
  const fallbackCopyToClipboard = (text: string): boolean => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    } catch (err) {
      console.error('Fallback copy failed:', err);
      return false;
    }
  };

  // 主复制函数
  const handleCopy = async () => {
    if (!urlValidation.isValid) {
      setCopyState({ 
        status: 'error', 
        message: '无法复制无效的URL' 
      });
      setTimeout(() => setCopyState({ status: 'idle', message: '' }), 3000);
      return;
    }

    try {
      setCopyState({ status: 'idle', message: '正在复制...' });

      // 尝试使用现代剪贴板API
      if (isClipboardSupported()) {
        await navigator.clipboard.writeText(url);
        setCopyState({ 
          status: 'success', 
          message: '复制成功！' 
        });
      } else {
        // 降级到传统方法
        const success = fallbackCopyToClipboard(url);
        if (success) {
          setCopyState({ 
            status: 'success', 
            message: '复制成功！' 
          });
        } else {
          throw new Error('复制失败');
        }
      }
      
      setTimeout(() => setCopyState({ status: 'idle', message: '' }), 2000);
      
    } catch (error) {
      console.error('Copy failed:', error);
      setCopyState({ 
        status: 'error', 
        message: '复制失败，请手动选择URL文本复制' 
      });
      setTimeout(() => setCopyState({ status: 'idle', message: '' }), 4000);
    }
  };

  // QR码错误处理
  const handleQRError = () => {
    setQRState({ 
      hasError: true, 
      errorMessage: 'QR码生成失败，请使用链接分享' 
    });
  };



  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">分享计算器</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 -m-2 ml-auto sm:ml-0 touch-manipulation"
            aria-label="关闭"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* URL验证警告 */}
        {!urlValidation.isValid && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm">{urlValidation.message}</span>
            </div>
          </div>
        )}

        {urlValidation.isValid && (
          <>
            {/* 分享链接区域 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                分享链接
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={url}
                  readOnly
                  className="flex-1 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm select-all touch-manipulation"
                  style={{ fontSize: '16px' }} // 防止iOS Safari缩放
                />
                <button
                  onClick={handleCopy}
                  className="px-6 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-300 touch-manipulation text-sm sm:text-base whitespace-nowrap"
                >
                  复制链接
                </button>
              </div>
              
              {/* 复制状态反馈 */}
              {copyState.status !== 'idle' && (
                <div className={`mt-3 p-2 rounded-lg text-sm ${
                  copyState.status === 'success' 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {copyState.message}
                </div>
              )}
              
              {!isClipboardSupported() && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700 text-xs sm:text-sm">
                    📱 提示：如果复制失败，请手动选择上方链接并复制
                  </p>
                </div>
              )}
            </div>

            {/* QR码区域 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                扫码分享
              </label>
              <div className="flex justify-center bg-gray-50 p-6 rounded-lg">
                {qrState.hasError ? (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-center">{qrState.errorMessage}</span>
                  </div>
                ) : (
                  <QRCodeCanvas
                    value={url}
                    size={120}
                    level="M"
                    includeMargin={true}
                    onError={handleQRError}
                    className="border border-gray-200 rounded"
                  />
                )}
              </div>
            </div>

            {/* 移动端使用提示 */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 text-sm">📱 移动端分享提示</h4>
              <ul className="text-blue-700 text-xs sm:text-sm space-y-1">
                <li>• 点击"复制链接"将链接复制到剪贴板</li>
                <li>• 使用相机扫描二维码快速打开</li>
                <li>• 链接可以通过微信、QQ等社交应用分享</li>
              </ul>
            </div>
          </>
        )}

        {/* 关闭按钮 */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-300 touch-manipulation text-sm sm:text-base"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 