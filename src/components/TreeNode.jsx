import React, { useState } from 'react';

function TreeNode({ node, selectedId, depth, expandedIds, onSelect, onToggle, onCreateChild, onDelete, onEditTitle }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const isSelected = selectedId === node.id;
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = depth * 16 + 12;

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setEditingId(node.id);
    setEditValue(node.title);
  };

  const handleEditConfirm = () => {
    if (editValue.trim()) {
      onEditTitle(node.id, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="tree-node">
      <div
        className={`group flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all hover:bg-gray-700 ${
          isSelected ? 'bg-green-600/30 border border-green-500/50' : ''
        }`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* 展开/折叠按钮 */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-200 transition-colors"
          >
            {isExpanded ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        ) : (
          <span className="w-5 h-5 flex items-center justify-center text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
        )}

        {/* 节点标题 - 双击编辑 */}
        {editingId === node.id ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditConfirm}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleEditConfirm();
              } else if (e.key === 'Escape') {
                setEditingId(null);
              }
            }}
            className="flex-1 bg-gray-600 text-gray-100 text-sm px-2 py-0.5 rounded outline-none focus:ring-2 focus:ring-green-500"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 truncate text-sm text-gray-200"
            title={node.title}
            onDoubleClick={handleDoubleClick}
          >
            {node.title}
          </span>
        )}

        {/* 操作按钮 - 仅悬停时显示 */}
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingId(node.id);
              setEditValue(node.title);
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-400 transition-colors"
            title="编辑标题"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateChild(node);
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-green-400 transition-colors"
            title="添加子分支"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
            title="删除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div className="children-container">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              depth={depth + 1}
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
  );
}

export default TreeNode;
