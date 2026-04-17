const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 节点操作
  loadNodes: () => ipcRenderer.invoke('load-nodes'),
  saveNodes: (data) => ipcRenderer.invoke('save-nodes', data),
  saveNodeMd: (node) => ipcRenderer.invoke('save-node-md', node),
  loadNodeMd: (nodeId) => ipcRenderer.invoke('load-node-md', nodeId),
  deleteNodeMd: (nodeId) => ipcRenderer.invoke('delete-node-md', nodeId),

  // 导入导出
  exportAll: (data) => ipcRenderer.invoke('export-all', data),
  importFile: () => ipcRenderer.invoke('import-file'),

  // 设置
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),

  // 工具
  getConversationsDir: () => ipcRenderer.invoke('get-conversations-dir'),
});
