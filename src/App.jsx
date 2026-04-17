import React, { useState, useCallback, useEffect } from 'react';
import TreeNav from './components/TreeNav';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/modals/SettingsModal';
import ContextModal from './components/modals/ContextModal';
import ExportModal from './components/modals/ExportModal';
import DeleteConfirmModal from './components/modals/DeleteConfirmModal';
import { useStorage } from './hooks/useStorage';
import { useAI } from './hooks/useAI';
import { findNode } from './utils/treeUtils';

function App() {
  // 存储相关
  const {
    nodes,
    settings,
    loading,
    saveSettings,
    createRootNode,
    createChildNode,
    updateNode,
    deleteNode,
    exportNodes,
  } = useStorage();

  // AI 相关
  const { sendMessage, streaming, streamingContent } = useAI(settings);

  // 状态
  const [selectedId, setSelectedId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [pendingParentNode, setPendingParentNode] = useState(null);

  // Modal 状态
  const [showSettings, setShowSettings] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 选中的节点
  const selectedNode = selectedId ? findNode(nodes, selectedId) : null;

  // 选择节点
  const handleSelectNode = useCallback((id) => {
    setSelectedId(id);
  }, []);

  // 切换展开
  const handleToggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 创建根节点
  const handleCreateRoot = useCallback(async () => {
    const newNode = await createRootNode('新对话 ' + (nodes.length + 1));
    setSelectedId(newNode.id);
    setExpandedIds((prev) => new Set([...prev, newNode.id]));
  }, [nodes.length, createRootNode]);

  // 创建子节点
  const handleCreateChild = useCallback((parentNode) => {
    setPendingParentNode(parentNode);
    setShowContextModal(true);
  }, []);

  // 确认创建子节点
  const handleConfirmCreateChild = useCallback(async (useContext) => {
    if (!pendingParentNode) return;

    await createChildNode(
      pendingParentNode.id,
      `${pendingParentNode.title} - 分支`,
      useContext
    );

    // 展开父节点
    setExpandedIds((prev) => new Set([...prev, pendingParentNode.id]));
    setShowContextModal(false);
    setPendingParentNode(null);
  }, [pendingParentNode, createChildNode]);

  // 删除节点 - 显示确认弹窗
  const handleDeleteNode = useCallback((node) => {
    setDeleteTarget(node);
    setShowDeleteModal(true);
  }, []);

  // 确认删除
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteNode(deleteTarget.id);
    if (selectedId === deleteTarget.id) {
      setSelectedId(null);
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }, [deleteTarget, selectedId, deleteNode]);

  // 编辑标题（由 TreeNode 双击触发）
  const handleEditTitle = useCallback(async (nodeId, newTitle) => {
    await updateNode(nodeId, { title: newTitle });
  }, [updateNode]);

  // 发送消息
  const handleSendMessage = useCallback(async (content) => {
    if (!selectedNode) return;

    // 添加用户消息
    const newMessages = [...(selectedNode.messages || []), { role: 'user', content }];
    await updateNode(selectedNode.id, { messages: newMessages });

    // 准备发送的消息
    let messagesToSend = newMessages;

    // 如果启用上下文继承，收集祖先消息
    if (selectedNode.useContext) {
      const collectAncestorMessages = (nodes, nodeId, result = []) => {
        const node = findNode(nodes, nodeId);
        if (!node) return result;

        function findPathToRoot(nodes, targetId, path = []) {
          for (const n of nodes) {
            if (n.id === targetId) {
              return [...path, n];
            }
            if (n.children && n.children.length > 0) {
              const found = findPathToRoot(n.children, targetId, [...path, n]);
              if (found) return found;
            }
          }
          return null;
        }

        const path = findPathToRoot(nodes, nodeId, []);
        if (path && path.length > 1) {
          for (let i = 0; i < path.length - 1; i++) {
            if (path[i].messages) {
              result.push(...path[i].messages);
            }
          }
        }
        return result;
      };

      const ancestorMessages = collectAncestorMessages(nodes, selectedNode.id);
      messagesToSend = [...ancestorMessages, ...newMessages];
    }

    // 发送消息
    try {
      await sendMessage(
        messagesToSend,
        () => {},
        async (finalContent) => {
          const finalMessages = [...newMessages, { role: 'assistant', content: finalContent }];
          await updateNode(selectedNode.id, { messages: finalMessages });
        }
      );
    } catch (error) {
      alert('发送失败: ' + error.message);
    }
  }, [selectedNode, nodes, sendMessage, updateNode]);

  // 导出
  const handleExport = useCallback(() => {
    setShowExportModal(true);
  }, []);

  const handleConfirmExport = useCallback(async (title, nodesToExport) => {
    await exportNodes(title, nodesToExport);
    setShowExportModal(false);
  }, [exportNodes]);

  // 保存设置
  const handleSaveSettings = useCallback(async (newSettings) => {
    await saveSettings(newSettings);
  }, [saveSettings]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-gray-100">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-900 text-gray-100">
      {/* 左侧导航 */}
      <TreeNav
        nodes={nodes}
        selectedId={selectedId}
        expandedIds={expandedIds}
        onSelect={handleSelectNode}
        onToggle={handleToggleExpand}
        onCreateRoot={handleCreateRoot}
        onCreateChild={handleCreateChild}
        onDelete={handleDeleteNode}
        onEditTitle={handleEditTitle}
      />

      {/* 右侧对话区 */}
      <ChatArea
        node={selectedNode}
        settings={settings}
        onSendMessage={handleSendMessage}
        streaming={streaming}
        streamingContent={streamingContent}
        onExport={handleExport}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showContextModal && pendingParentNode && (
        <ContextModal
          parentTitle={pendingParentNode.title}
          onConfirm={handleConfirmCreateChild}
          onClose={() => {
            setShowContextModal(false);
            setPendingParentNode(null);
          }}
        />
      )}

      {showExportModal && (
        <ExportModal
          nodes={nodes}
          onConfirm={handleConfirmExport}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showDeleteModal && deleteTarget && (
        <DeleteConfirmModal
          nodeTitle={deleteTarget.title}
          hasChildren={deleteTarget.children && deleteTarget.children.length > 0}
          onConfirm={handleConfirmDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
