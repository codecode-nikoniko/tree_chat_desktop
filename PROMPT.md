# 树形对话管理器 - 开发提示词

## 一、项目概述

开发一款**树形对话管理器**，用于解决与大模型对话时的以下痛点：
1. 问答层层嵌套，被刷屏到很上面
2. 提问过的所有问题无法成体系展示
3. 无关问题可能污染模型的上下文窗口

**核心思路**：用树形结构组织对话，支持随时添加分支，可选择是否继承上下文。

---

## 二、技术栈

### 前端
- **前端框架**：React 18 + Hooks
- **样式框架**：Tailwind CSS (CDN)
- **Markdown解析**：Marked.js (CDN)
- **构建工具**：Vite

### 桌面端
- **桌面框架**：Electron 28+
- **IPC通信**：Electron IPC + preload 脚本

### 存储
- **数据存储**：本地 md 文件（Electron 主进程文件系统）
- **存储位置**：`{用户数据目录}/conversations/`

### API
- **调用方式**：Fetch + SSE 流式输出
- **多Provider支持**：OpenAI / Anthropic / 智谱AI / MiniMax / Ollama / 自定义

---

## 三、项目结构

```
tree-chat/
├── package.json              # 项目配置
├── vite.config.js            # Vite 配置
├── tailwind.config.cjs       # Tailwind 配置
├── postcss.config.cjs        # PostCSS 配置
├── index.html                # HTML 入口
├── electron/
│   ├── main.cjs              # Electron 主进程
│   └── preload.js            # 预加载脚本（暴露 IPC API）
├── src/
│   ├── main.jsx              # React 入口
│   ├── App.jsx               # 主应用组件
│   ├── components/
│   │   ├── TreeNav.jsx       # 左侧树形导航
│   │   ├── TreeNode.jsx      # 递归树节点
│   │   ├── ChatArea.jsx      # 右侧对话区
│   │   ├── MessageList.jsx   # 消息列表
│   │   └── modals/
│   │       ├── SettingsModal.jsx      # API 设置
│   │       ├── ExportModal.jsx        # 导出对话
│   │       ├── ContextModal.jsx       # 添加子分支
│   │       └── DeleteConfirmModal.jsx # 删除确认
│   ├── hooks/
│   │   ├── useStorage.js     # 文件存储 Hook
│   │   └── useAI.js          # API 调用 Hook
│   ├── utils/
│   │   ├── providers.js      # API Provider 配置
│   │   └── treeUtils.js      # 树操作工具
│   └── styles/
│       └── index.css         # Tailwind 入口
└── conversations/           # 对话存储目录（运行时生成）
```

---

## 四、数据结构

### 节点数据结构

```javascript
// 对话树节点
{
    id: "node_xxx",                    // 唯一标识
    title: "对话标题",                   // 显示在左侧导航
    useContext: false,                 // 是否继承父节点上下文
    parentId: "node_yyy",               // 父节点 ID（根节点为 null）
    messages: [                         // 对话消息数组
        { role: "user", content: "用户问题" },
        { role: "assistant", content: "AI回答" }
    ],
    children: [],                      // 子节点 ID 数组
    createdAt: "2026-04-12T..."       // 创建时间
}
```

### 设置数据结构

```javascript
{
    provider: "openai",                // 当前选中的 Provider
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o",
    apiKeys: {                         // 每个 Provider 的 API Key
        "openai": "sk-xxx",
        "anthropic": "sk-ant-xxx",
        "custom_123": "xxx"
    },
    customProviders: {                 // 自定义 Provider 配置
        "custom_123": {
            name: "通义千问",
            baseUrl: "https://api.example.com",
            model: "qwen-turbo"
        }
    }
}
```

---

## 五、界面布局

```
┌──────────────────────────────────────────────────────────────┐
│  🌳 树形对话管理器                        ⚙️ 设置             │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                  │
│  ➕ 新建    │     [对话标题]              ✅继承上下文 📥导出 ⚙ │
│            │                                                  │
│  ▼ 📄 闭包   │     👤 用户：xxx                           │
│    + 📄 1.1│     🤖 AI：xxx                              │
│    + 📄 1.2│         （流式输出中...▊）                   │
│            │                                                  │
│  📄 异步    │     [输入问题...        ] [发送]               │
│            │                                                  │
└────────────┴─────────────────────────────────────────────────┘
```

### 布局说明

| 区域 | 宽度 | 说明 |
|------|------|------|
| 左侧导航栏 | 280px (w-72) | 树形结构，可展开/折叠 |
| 右侧内容区 | flex-1 | 显示对话内容 |

---

## 六、功能需求

### 6.1 左侧树形导航

| 功能 | 说明 |
|------|------|
| 显示所有根节点 | 竖向排列，带展开/折叠箭头 |
| 递归显示子节点 | 层级缩进，offset = depth * 16 + 12 px |
| 悬停显示操作按钮 | ➕添加子分支、🗑️删除 |
| 双击/点击编辑标题 | 直接在节点处编辑，无需弹窗 |
| 选中高亮 | 绿色背景 bg-green-600/30 |
| 节点标题显示 | 超出宽度时截断，title 属性显示完整 |

### 6.2 对话显示

| 功能 | 说明 |
|------|------|
| 用户消息 | 绿色背景，右对齐 |
| AI消息 | 灰色背景，左对齐，支持Markdown渲染 |
| 流式输出 | 打字机效果，带闪烁光标 |
| 初始提示 | 无消息时显示引导文字 |

### 6.3 创建对话

| 功能 | 说明 |
|------|------|
| 创建根对话 | 点击按钮创建，useContext默认为false |
| 创建子分支 | 点击➕按钮，选择继承/独立，点击选项直接创建 |

### 6.4 上下文继承

**添加子分支弹窗**：

```
┌─────────────────────────────────────┐
│  🌿 添加子分支                    ✕ │
├─────────────────────────────────────┤
│  为 "父节点标题" 添加子分支           │
│  请选择是否继承父节点的对话上下文      │
│                                      │
│  ┌─────────────────────────────┐   │
│  │ 🔗 继承上下文                 │   │
│  │ AI能理解完整的问题背景          │   │
│  └─────────────────────────────┘   │
│                                      │
│  ┌─────────────────────────────┐   │
│  │ 🆕 独立对话                  │   │
│  │ 不受之前对话的影响           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

- 点击选项直接创建，无需确认按钮
- 右上角 ✕ 关闭弹窗

### 6.5 弹窗样式规范

- 背景遮罩：bg-black/50
- 弹窗圆角：rounded-xl
- 弹窗内边距：p-6
- 按钮圆角：rounded-lg
- 按钮内边距：px-4 py-2.5
- 过渡效果：transition
- 弹窗宽度：max-w-sm / max-w-md

---

## 七、支持的 API

### 7.1 Provider 配置

| Provider | Base URL | 模型示例 |
|----------|----------|----------|
| OpenAI | https://api.openai.com/v1 | gpt-4o |
| Anthropic | https://api.anthropic.com | claude-3-haiku |
| 智谱AI (GLM) | https://open.bigmodel.cn/api/paas/v4 | glm-4-flash |
| MiniMax | https://api.minimax.chat/v1 | MiniMax-Text-01 |
| Ollama | http://localhost:11434 | llama3 |

### 7.2 自定义 Provider

支持用户添加自定义 API 厂商：
- 输入名称、Base URL、模型
- 支持删除已添加的自定义厂商
- 自定义厂商默认使用 Bearer Token 认证

### 7.3 API Key 记忆

- 每个 Provider 的 API Key 独立存储
- 切换 Provider 时自动加载对应的 Key
- 不会因切换 Provider 丢失其他厂商的 Key

### 7.4 API 设置弹窗

```
┌─────────────────────────────────────┐
│  ⚙️ API 设置                      ✕ │
├─────────────────────────────────────┤
│  API Provider                       │
│  [下拉选择____________▼]            │
│  [+ 添加自定义 Provider]            │
│                                      │
│  API Key (OpenAI)                   │
│  [••••••••••••••••••]               │
│                                      │
│  Base URL                           │
│  [____________________]             │
│                                      │
│  模型                               │
│  [____________________]             │
│                                      │
│  已保存的 API Keys：                 │
│  ┌─────────────────────────────┐   │
│  │ Anthropic: ****xxxx    使用  │   │
│  │ 自定义厂商: ****yyyy  使用 删除│   │
│  └─────────────────────────────┘   │
│                                      │
│           [取消]    [保存]          │
└─────────────────────────────────────┘
```

### 7.5 流式响应处理

根据不同 Provider 解析 SSE 流：

```javascript
// OpenAI / GLM / MiniMax / 自定义
content = parsed.choices?.[0]?.delta?.content || ''

// Anthropic
content = parsed.type === 'content_block_delta'
    ? parsed.delta?.text || ''
    : ''

// Ollama
content = parsed.message?.content || ''
```

---

## 八、导出功能

### 8.1 导出弹窗

```
┌─────────────────────────────────────┐
│  📥 导出对话                        ✕ │
├─────────────────────────────────────┤
│  文档标题                           │
│  [____________________]             │
│                                      │
│  选择要导出的根会话 (2/3)            │
│  ┌─────────────────────────────┐   │
│  │ ☑ 对话1 (✅)         使用    │   │
│  │ ☑ 对话2 (❌)         使用    │   │
│  │ ☐ 对话3 (✅)         使用    │   │
│  └─────────────────────────────┘   │
│  全选  取消                          │
│                                      │
│           [取消]    [导出(2)]        │
└─────────────────────────────────────┘
```

### 8.2 导出格式

```markdown
# 自定义文档标题

> 导出时间: 2026/4/12

---

## 1 主对话标题
> 上下文继承: ❌ 禁用

**👤 用户:**
问题内容

**🤖 AI:**
回答内容

## 1.1 子分支标题
> 上下文继承: ✅ 启用

**👤 用户:**
追问内容

**🤖 AI:**
回答内容

---
```

### 8.3 导出文件名

`{文档标题}_{日期}.md`

---

## 九、删除确认

使用统一样式的自定义弹窗：

```
┌─────────────────────────────────────┐
│  🗑️ 确认删除                       ✕ │
├─────────────────────────────────────┤
│  确定删除 "对话标题" 及其所有子分支吗？ │
│                                      │
│           [取消]    [删除]           │
└─────────────────────────────────────┘
```

---

## 十、操作快捷键

| 操作 | 快捷键 |
|------|--------|
| 发送消息 | Enter |
| 换行 | Shift + Enter |
| 关闭弹窗 | Escape |
| 保存标题 | Enter（编辑时） |

---

## 十一、本地存储

### 存储位置

```
{用户数据目录}/tree-chat/
├── conversations/
│   ├── index.json       # 对话索引
│   ├── node_xxx.md      # 节点对话内容
│   └── ...
└── settings.json        # API 设置
```

### IPC 通信接口

通过 preload 暴露的 API：

```javascript
window.electronAPI.loadNodes()        // 加载所有节点
window.electronAPI.saveNodes(data)    // 保存所有节点
window.electronAPI.saveNodeMd(node)    // 保存节点到 md
window.electronAPI.deleteNodeMd(id)     // 删除节点 md
window.electronAPI.exportAll(data)      // 导出对话
window.electronAPI.importFile()         // 导入 md 文件
window.electronAPI.saveSettings(s)      // 保存设置
window.electronAPI.loadSettings()      // 加载设置
```

---

## 十二、代码规范

### 12.1 React Hooks 规范

```javascript
// useStorage.js - 文件存储 Hook
export function useStorage() {
    const [nodes, setNodes] = useState([])
    const [settings, setSettings] = useState({...})

    const createRootNode = useCallback(async (title) => {
        // ...
    }, [nodes, saveNodes])

    // ...

    return { nodes, settings, createRootNode, ... }
}

// useAI.js - API 调用 Hook
export function useAI(settings) {
    const sendMessage = useCallback(async (messages, onChunk, onComplete) => {
        // ...
    }, [settings])

    return { sendMessage, streaming, streamingContent }
}
```

### 12.2 递归组件（TreeNode）

```jsx
function TreeNode({ node, selectedId, depth, expandedIds, onSelect, ... }) {
    const [editingId, setEditingId] = useState(null)

    return (
        <div className="tree-node">
            <div onClick={() => onSelect(node.id)}>
                {/* 展开/折叠按钮 */}
                {/* 标题（双击编辑） */}
                {/* 操作按钮 */}
            </div>
            {hasChildren && isExpanded && (
                <div>
                    {node.children.map(child => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            ...
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
```

### 12.3 CSS 动画

```css
/* 流式光标 */
.streaming-cursor::after {
    content: '▊';
    animation: blink 0.8s infinite;
}
@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

/* 弹窗动画 */
.modal-overlay { animation: fadeIn 0.2s ease; }
.modal-content { animation: slideIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; } }
@keyframes slideIn {
    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}
```

---

## 十三、开发要求

1. **多文件结构**：React + Electron 架构
2. **构建工具**：使用 Vite 开发，生产用 npm run build
3. **响应式**：使用 React Hooks
4. **美观**：使用 Tailwind CSS 暗色主题
5. **可维护**：代码结构清晰，模块化设计
6. **可用**：实现所有功能，确保可正常运行

---

## 十四、验证清单

| 功能 | 验证方法 |
|------|----------|
| 创建根对话 | 点击按钮，左侧出现新节点 |
| 添加子分支 | 点击➕，选择继承/独立，节点出现 |
| 编辑标题 | 点击✏️按钮或双击，直接编辑 |
| 删除节点 | 点击🗑️，确认后节点消失 |
| 发送消息 | 输入文字，AI流式响应 |
| 上下文继承 | 启用后，AI能理解之前对话 |
| 导出 | 弹窗选择根会话，下载.md文件 |
| 切换Provider | 设置中换API，消息正常发送 |
| 自定义API | 添加/删除自定义厂商 |
| API Key记忆 | 切换Provider后Key不丢失 |

---

## 十五、启动方式

### 开发模式

```bash
npm install
npm run electron:dev
```

### 生产构建

```bash
npm run build     # 构建 React 应用
npm run electron  # 运行 Electron
```

---

## 十六、文件输出

```
tree-chat/
├── dist/                    # 构建输出
├── src/                     # React 源码
├── electron/                # Electron 源码
└── conversations/           # 对话存储（运行时生成）
```
