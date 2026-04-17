import React, { useState, useEffect } from 'react';

function ContextModal({ parentTitle, onConfirm, onClose }) {
  const [useContext, setUseContext] = useState(true);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        onClose();
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
      <div className="bg-gray-800 rounded-xl max-w-sm w-full mx-4 modal-content">
        {/* 头部 - 带叉号 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <span>🌿</span> 添加子分支
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-300 mb-2">为 "{parentTitle}" 添加子分支</p>
          <p className="text-sm text-gray-500 mb-6">请选择是否继承父节点的对话上下文</p>

          <div className="space-y-3">
            {/* 继承上下文 */}
            <button
              onClick={() => {
                setUseContext(true);
                onConfirm(true);
              }}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                useContext
                  ? 'border-green-500 bg-green-600/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔗</span>
                <div>
                  <div className="font-medium text-gray-100">继承上下文</div>
                  <div className="text-sm text-gray-400">AI 能理解完整的问题背景</div>
                </div>
              </div>
            </button>

            {/* 独立对话 */}
            <button
              onClick={() => {
                setUseContext(false);
                onConfirm(false);
              }}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                !useContext
                  ? 'border-green-500 bg-green-600/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🆕</span>
                <div>
                  <div className="font-medium text-gray-100">独立对话</div>
                  <div className="text-sm text-gray-400">不受之前对话的影响</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContextModal;
