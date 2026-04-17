// 递归查找节点
export function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// 递归移除节点
export function removeNode(nodes, id) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      return nodes.splice(i, 1)[0];
    }
    if (nodes[i].children && nodes[i].children.length > 0) {
      const removed = removeNode(nodes[i].children, id);
      if (removed) return removed;
    }
  }
  return null;
}

// 收集所有祖先节点的消息
export function collectAncestorMessages(nodes, nodeId) {
  const ancestors = [];
  const node = findNode(nodes, nodeId);
  if (!node) return ancestors;

  // 获取父节点链
  function findAncestors(nodes, targetId, path = []) {
    for (const n of nodes) {
      if (n.id === targetId) {
        return path;
      }
      if (n.children && n.children.length > 0) {
        const found = findAncestors(n.children, targetId, [...path, n]);
        if (found) return found;
      }
    }
    return null;
  }

  const ancestorPath = findAncestors(nodes, nodeId, []);
  if (!ancestorPath) return ancestors;

  // 收集祖先节点的消息
  for (const ancestor of ancestorPath) {
    if (ancestor.messages && ancestor.messages.length > 0) {
      ancestors.push(...ancestor.messages);
    }
  }

  return ancestors;
}

// 生成唯一 ID
export function generateId() {
  return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 创建新节点
export function createNode(title, useContext = false, parentId = null) {
  return {
    id: generateId(),
    title,
    useContext,
    parentId,
    messages: [],
    children: [],
    createdAt: new Date().toISOString(),
  };
}

// 递归更新节点
export function updateNodeInTree(nodes, id, updates) {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, ...updates };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: updateNodeInTree(node.children, id, updates),
      };
    }
    return node;
  });
}

// 递归统计根节点数量
export function countRootNodes(nodes) {
  return nodes.length;
}

// 扁平化树结构（用于导出）
export function flattenTree(nodes, result = []) {
  for (const node of nodes) {
    result.push(node);
    if (node.children && node.children.length > 0) {
      flattenTree(node.children, result);
    }
  }
  return result;
}
