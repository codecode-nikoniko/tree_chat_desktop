import React from 'react';
import TreeNode from './TreeNode';

function TreeNav({
  nodes,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  onCreateRoot,
  onCreateChild,
  onDelete,
  onEditTitle,
}) {
  return (
    <div className="w-72 h-full bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🌳</span>
          <h1 className="text-lg font-semibold text-gray-100">树形对话管理器</h1>
        </div>
        <button
          onClick={onCreateRoot}
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建对话
        </button>
      </div>

      {/* 树形列表 */}
      <div className="flex-1 overflow-y-auto p-3">
        {nodes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">暂无对话</p>
            <p className="text-xs mt-1">点击上方按钮创建</p>
          </div>
        ) : (
          <div className="space-y-1">
            {nodes.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                selectedId={selectedId}
                depth={0}
                expandedIds={expandedIds}
                onSelect={onSelect}
                onToggle={onToggle}
                onCreateChild={onCreateChild}
                onDelete={onDelete}
                onEditTitle={onEditTitle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TreeNav;
