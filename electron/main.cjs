const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 只有明确设置了 NODE_ENV=development 才使用开发服务器
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
const conversationsDir = path.join(app.getPath('userData'), 'conversations');
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const indexPath = path.join(conversationsDir, 'index.json');

// 确保目录存在
function ensureDirectories() {
  if (!fs.existsSync(conversationsDir)) {
    fs.mkdirSync(conversationsDir, { recursive: true });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  ensureDirectories();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============ IPC Handlers ============

// 加载所有节点
ipcMain.handle('load-nodes', async () => {
  try {
    if (!fs.existsSync(indexPath)) {
      return { nodes: [] };
    }
    const data = fs.readFileSync(indexPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load nodes:', error);
    return { nodes: [] };
  }
});

// 保存所有节点
ipcMain.handle('save-nodes', async (event, data) => {
  try {
    fs.writeFileSync(indexPath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Failed to save nodes:', error);
    return { success: false, error: error.message };
  }
});

// 保存单个节点到 md 文件
ipcMain.handle('save-node-md', async (event, node) => {
  try {
    const mdPath = path.join(conversationsDir, `${node.id}.md`);
    const content = generateMdContent(node);
    fs.writeFileSync(mdPath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Failed to save node md:', error);
    return { success: false, error: error.message };
  }
});

// 加载单个节点 md 文件
ipcMain.handle('load-node-md', async (event, nodeId) => {
  try {
    const mdPath = path.join(conversationsDir, `${nodeId}.md`);
    if (!fs.existsSync(mdPath)) {
      return { content: null };
    }
    const content = fs.readFileSync(mdPath, 'utf-8');
    return { content };
  } catch (error) {
    console.error('Failed to load node md:', error);
    return { content: null };
  }
});

// 删除节点 md 文件
ipcMain.handle('delete-node-md', async (event, nodeId) => {
  try {
    const mdPath = path.join(conversationsDir, `${nodeId}.md`);
    if (fs.existsSync(mdPath)) {
      fs.unlinkSync(mdPath);
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to delete node md:', error);
    return { success: false, error: error.message };
  }
});

// 导出所有对话为 md 文件
ipcMain.handle('export-all', async (event, { title, nodes }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '导出对话',
      defaultPath: `${title}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    const content = generateExportContent(title, nodes);
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Failed to export:', error);
    return { success: false, error: error.message };
  }
});

// 导入 md 文件
ipcMain.handle('import-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '导入对话',
      filters: [{ name: 'Markdown', extensions: ['md'] }],
      properties: ['openFile'],
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { success: true, content, filePath: result.filePaths[0] };
  } catch (error) {
    console.error('Failed to import:', error);
    return { success: false, error: error.message };
  }
});

// 保存设置
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Failed to save settings:', error);
    return { success: false, error: error.message };
  }
});

// 加载设置
ipcMain.handle('load-settings', async () => {
  try {
    if (!fs.existsSync(settingsPath)) {
      return { settings: null };
    }
    const data = fs.readFileSync(settingsPath, 'utf-8');
    return { settings: JSON.parse(data) };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { settings: null };
  }
});

// 获取 conversations 目录路径
ipcMain.handle('get-conversations-dir', async () => {
  return conversationsDir;
});

// ============ Helper Functions ============

function generateMdContent(node) {
  let content = `---
id: ${node.id}
title: ${node.title}
useContext: ${node.useContext}
createdAt: ${node.createdAt}
parentId: ${node.parentId || ''}
children: ${JSON.stringify(node.children || [])}
---

# ${node.title}

> 上下文继承: ${node.useContext ? '✅ 启用' : '❌ 禁用'}
> 创建时间: ${new Date(node.createdAt).toLocaleString('zh-CN')}

---

`;

  if (node.messages && node.messages.length > 0) {
    for (const msg of node.messages) {
      if (msg.role === 'user') {
        content += `**👤 用户:**\n${msg.content}\n\n`;
      } else {
        content += `**🤖 AI:**\n${msg.content}\n\n`;
      }
    }
  } else {
    content += `_暂无对话内容_\n`;
  }

  return content;
}

function generateExportContent(title, nodes) {
  let content = `# ${title}\n\n> 导出时间: ${new Date().toLocaleString('zh-CN')}\n\n---\n\n`;

  function exportNode(node, prefix) {
    content += `## ${prefix} ${node.title}\n`;
    content += `> 上下文继承: ${node.useContext ? '✅ 启用' : '❌ 禁用'}\n\n`;

    if (node.messages && node.messages.length > 0) {
      for (const msg of node.messages) {
        if (msg.role === 'user') {
          content += `**👤 用户:**\n${msg.content}\n\n`;
        } else {
          content += `**🤖 AI:**\n${msg.content}\n\n`;
        }
      }
    }

    content += `\n---\n\n`;

    // 如果 children 是对象数组（完整节点），直接使用
    if (node.children && node.children.length > 0) {
      if (typeof node.children[0] === 'object') {
        node.children.forEach((child, index) => {
          exportNode(child, `${prefix}.${index + 1}`);
        });
      } else {
        // children 是 ID 数组，需要从 nodes 中查找
        node.children.forEach((childId, index) => {
          const child = findNodeById(nodes, childId);
          if (child) {
            exportNode(child, `${prefix}.${index + 1}`);
          }
        });
      }
    }
  }

  function findNodeById(nodeList, id) {
    for (const n of nodeList) {
      if (n.id === id) return n;
      if (n.children && n.children.length > 0) {
        const found = findNodeById(n.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // 遍历根节点
  nodes.forEach((node, index) => {
    exportNode(node, `${index + 1}`);
  });

  return content;
}
