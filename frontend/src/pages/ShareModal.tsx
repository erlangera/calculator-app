import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface ShareModalProps {
  open: boolean;
  url: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ open, url, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
          onClick={onClose}
        >
          ×
        </button>
        {copied && (
          <span className="fixed left-1/2 -translate-x-1/2 top-4 px-5 py-2 bg-green-500 text-white text-base rounded shadow z-[9999]">
            复制成功
          </span>
        )}
        <h3 className="text-lg font-bold mb-4 text-gray-800 text-center">分享此计算器</h3>
        <div className="flex flex-col items-center gap-4">
          <QRCodeCanvas value={url} size={128} />
          <div className="w-full break-all text-center text-sm text-gray-600 bg-gray-100 rounded p-2 mb-2">{url}</div>
          <div className="relative w-full">
            <button
              className="w-full bg-brand-from hover:bg-brand-to text-white font-semibold py-2 px-4 rounded transition-all duration-200"
              onClick={handleCopy}
            >
              复制链接
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 