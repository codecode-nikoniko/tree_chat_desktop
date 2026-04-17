import React, { useState, useEffect } from 'react';

function ExportModal({ nodes, onConfirm, onClose }) {
  const [title, setTitle] = useState('对话导出');
  const [selectedIds, setSelectedIds] = useState(new Set(nodes.map(n => n.id)));

  useEffect(() => {
    setSelectedIds(new Set(nodes.map(n => n.id)));
  }, [nodes]);

  const toggleNode = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(nodes.map(n => n.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleExport = () => {
    const nodesToExport = nodes.filter(n => selectedIds.has(n.id));
    onConfirm(title, nodesToExport);
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
      <div className="bg-gray-800 rounded-xl max-w-md w-full mx-4 modal-content">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <span>📥</span> 导出对话
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

        <div className="p-6 space-y-4">
          {/* 文档标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">文档标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-700 text-gray-100 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>

          {/* 选择根会话 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                选择要导出的根会话 ({selectedCount}/{nodes.length})
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  全选
                </button>
                <button
                  onClick={deselectAll}
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  取消
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto bg-gray-700/50 rounded-lg p-2 space-y-1">
              {nodes.map((node) => (
                <label
                  key={node.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-600/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(node.id)}
                    onChange={() => toggleNode(node.id)}
                    className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-green-500 focus:ring-green-500"
                  />
                  <span className="flex-1 truncate text-sm text-gray-200">
                    {node.title}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    node.useContext
                      ? 'bg-green-600/30 text-green-400'
                      : 'bg-gray-600/30 text-gray-400'
                  }`}>
                    {node.useContext ? '✅' : '❌'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={selectedCount === 0}
            className="px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            导出 {selectedCount > 0 && `(${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportModal;
