import { useState, useEffect, useCallback } from 'react';

const API = window.electronAPI;

export function useStorage() {
  const [nodes, setNodes] = useState([]);
  const [settings, setSettings] = useState({
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    apiKeys: {},
    customProviders: {},
  });
  const [loading, setLoading] = useState(true);

  // 加载所有数据
  useEffect(() => {
    async function loadData() {
      try {
        const [nodesResult, settingsResult] = await Promise.all([
          API.loadNodes(),
          API.loadSettings(),
        ]);

        if (nodesResult.nodes) {
          setNodes(nodesResult.nodes);
        }

        if (settingsResult.settings) {
          setSettings(settingsResult.settings);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // 保存所有节点
  const saveNodes = useCallback(async (newNodes) => {
    setNodes(newNodes);
    await API.saveNodes({ nodes: newNodes });
  }, []);

  // 保存设置
  const saveSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    await API.saveSettings(newSettings);
  }, []);

  // 创建根节点
  const createRootNode = useCallback(async (title) => {
    const newNode = {
      id: 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title,
      useContext: false,
      parentId: null,
      messages: [],
      children: [],
      createdAt: new Date().toISOString(),
    };

    const newNodes = [...nodes, newNode];
    await saveNodes(newNodes);
    await API.saveNodeMd(newNode);
    return newNode;
  }, [nodes, saveNodes]);

  // 创建子节点
  const createChildNode = useCallback(async (parentId, title, useContext) => {
    const newNode = {
      id: 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title,
      useContext,
      parentId,
      messages: [],
      children: [],
      createdAt: new Date().toISOString(),
    };

    // 找到父节点并添加子节点
    const addChildToParent = (nodeList) => {
      return nodeList.map((node) => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [...(node.children || []), newNode],
          };
        }
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: addChildToParent(node.children),
          };
        }
        return node;
      });
    };

    const newNodes = addChildToParent(nodes);
    await saveNodes(newNodes);
    await API.saveNodeMd(newNode);
    return newNode;
  }, [nodes, saveNodes]);

  // 更新节点
  const updateNode = useCallback(async (nodeId, updates) => {
    const updateInTree = (nodeList) => {
      return nodeList.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, ...updates };
          API.saveNodeMd(updatedNode);
          return updatedNode;
        }
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: updateInTree(node.children),
          };
        }
        return node;
      });
    };

    const newNodes = updateInTree(nodes);
    await saveNodes(newNodes);
  }, [nodes, saveNodes]);

  // 删除节点（递归删除所有子节点）
  const deleteNode = useCallback(async (nodeId) => {
    // 收集所有要删除的节点ID
    const collectIds = (node, ids = []) => {
      ids.push(node.id);
      if (node.children) {
        for (const child of node.children) {
          collectIds(child, ids);
        }
      }
      return ids;
    };

    const findAndDelete = (nodeList) => {
      for (let i = 0; i < nodeList.length; i++) {
        if (nodeList[i].id === nodeId) {
          const deletedNode = nodeList[i];
          const idsToDelete = collectIds(deletedNode);
          // 删除所有相关 md 文件
          for (const id of idsToDelete) {
            API.deleteNodeMd(id);
          }
          return nodeList.splice(i, 1)[0];
        }
        if (nodeList[i].children && nodeList[i].children.length > 0) {
          const deleted = findAndDelete(nodeList[i].children);
          if (deleted) return deleted;
        }
      }
      return null;
    };

    const newNodes = [...nodes];
    findAndDelete(newNodes);
    await saveNodes(newNodes);
  }, [nodes, saveNodes]);

  // 导出指定节点
  const exportNodes = useCallback(async (title, nodesToExport) => {
    return API.exportAll({ title, nodes: nodesToExport });
  }, []);

  // 导入对话
  const importFile = useCallback(async () => {
    const result = await API.importFile();
    if (result.success && result.content) {
      // 解析导入的内容（简化处理，实际需要更复杂的解析逻辑）
      return result;
    }
    return result;
  }, []);

  return {
    nodes,
    settings,
    loading,
    saveNodes,
    saveSettings,
    createRootNode,
    createChildNode,
    updateNode,
    deleteNode,
    exportNodes,
    importFile,
  };
}
