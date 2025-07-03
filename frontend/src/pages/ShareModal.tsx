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

  // 手动选择文本
  const handleTextSelect = (event: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(event.currentTarget);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          onClick={onClose}
          aria-label="关闭分享窗口"
        >
          ×
        </button>
        
        {/* 状态提示 */}
        {copyState.status !== 'idle' && (
          <div className={`fixed left-1/2 -translate-x-1/2 top-4 px-5 py-2 text-white text-base rounded shadow z-[9999] ${
            copyState.status === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {copyState.message}
          </div>
        )}
        
        <h3 className="text-lg font-bold mb-6 text-gray-800 text-center pr-8">分享此计算器</h3>
        
        <div className="flex flex-col items-center gap-6">
          {/* QR码区域 */}
          <div className="flex flex-col items-center">
            {urlValidation.isValid && !qrState.hasError ? (
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                <QRCodeCanvas 
                  value={url} 
                  size={128}
                  level="M"
                  onError={handleQRError}
                />
              </div>
            ) : (
              <div className="p-4 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center w-32 h-32">
                <div className="text-center text-gray-500">
                  <div className="text-2xl mb-2">⚠️</div>
                  <div className="text-xs">
                    {qrState.hasError ? qrState.errorMessage : urlValidation.message}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* URL显示区域 */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分享链接：
            </label>
            <div 
              className={`w-full break-all text-center text-sm p-3 rounded border-2 cursor-pointer transition-colors ${
                urlValidation.isValid 
                  ? 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100' 
                  : 'text-red-600 bg-red-50 border-red-200'
              }`}
              onClick={handleTextSelect}
              title="点击选择文本"
            >
              {url || '链接生成失败'}
            </div>
            {!urlValidation.isValid && (
              <p className="text-red-500 text-xs mt-1">{urlValidation.message}</p>
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className="flex flex-col w-full gap-3">
            <button
              className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 ${
                urlValidation.isValid
                  ? 'bg-brand-from hover:bg-brand-to text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleCopy}
              disabled={!urlValidation.isValid || copyState.status === 'idle' && copyState.message === '正在复制...'}
            >
              {copyState.status === 'idle' && copyState.message === '正在复制...' ? '复制中...' : '复制链接'}
            </button>
            
            {/* 备用提示 */}
            {copyState.status === 'error' && (
              <p className="text-xs text-gray-500 text-center">
                提示：您也可以点击上方链接区域手动选择并复制
              </p>
            )}
          </div>
          
          {/* 分享提示 */}
          <div className="text-xs text-gray-500 text-center border-t pt-4 w-full">
            <p>💡 扫描二维码或复制链接即可分享给他人</p>
            {!isClipboardSupported() && (
              <p className="mt-1 text-orange-600">
                您的浏览器不支持自动复制，请手动选择链接文本
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 