import React, { useState, useEffect, useRef } from 'react';

function TitleModal({ nodeTitle, onConfirm, onClose }) {
  const [title, setTitle] = useState(nodeTitle);
  const inputRef = useRef(null);

  useEffect(() => {
    setTitle(nodeTitle);
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [nodeTitle]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm(title);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [title, onConfirm, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
      <div className="bg-gray-800 rounded-xl max-w-sm w-full mx-4 modal-content">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <span>✏️</span> 编辑标题
          </h2>
        </div>

        <div className="p-6">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm(title);
              }
            }}
            className="w-full bg-gray-700 text-gray-100 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            placeholder="输入标题"
          />
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(title)}
            className="px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

export default TitleModal;
