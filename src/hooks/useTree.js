import { useState, useCallback } from 'react';
import { findNode, removeNode, collectAncestorMessages } from '../utils/treeUtils';

export function useTree(initialNodes = []) {
  const [nodes, setNodes] = useState(initialNodes);
  const [selectedId, setSelectedId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // 选择节点
  const selectNode = useCallback((id) => {
    setSelectedId(id);
  }, []);

  // 切换展开状态
  const toggleExpand = useCallback((id) => {
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

  // 展开所有
  const expandAll = useCallback(() => {
    const allIds = new Set();
    const collectIds = (nodeList) => {
      for (const node of nodeList) {
        if (node.children && node.children.length > 0) {
          allIds.add(node.id);
          collectIds(node.children);
        }
      }
    };
    collectIds(nodes);
    setExpandedIds(allIds);
  }, [nodes]);

  // 折叠所有
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // 获取选中的节点
  const getSelectedNode = useCallback(() => {
    if (!selectedId) return null;
    return findNode(nodes, selectedId);
  }, [nodes, selectedId]);

  // 获取节点的所有祖先消息
  const getAncestorMessages = useCallback((nodeId) => {
    return collectAncestorMessages(nodes, nodeId);
  }, [nodes]);

  // 设置节点
  const setNodesCallback = useCallback((newNodes) => {
    setNodes(newNodes);
  }, []);

  return {
    nodes,
    selectedId,
    expandedIds,
    selectNode,
    toggleExpand,
    expandAll,
    collapseAll,
    getSelectedNode,
    getAncestorMessages,
    setNodes: setNodesCallback,
  };
}
