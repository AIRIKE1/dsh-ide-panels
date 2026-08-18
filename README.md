<div align="center">

# dsh-ide-panels

**DSH（DeepSeek Harness）客户端布局插件 —— 仿 VS Code 的 IDE 外壳**

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![version](https://img.shields.io/badge/version-0.1.0-green.svg)](https://github.com/AIRIKE1/dsh-ide-panels/releases)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-%E6%8F%92%E4%BB%B6-purple.svg)](https://github.com/deepseek-ai/deepseek-harness)

[**English**](docs/lang/README_EN.md) · 中文

> *"聊天的左边是对话，聊天的右边是你的 IDE。"*

**中间工具标签区（编辑器/终端/浏览器/代码变更，可多开）· 右侧栏（资源管理器/搜索/Git/远程）· 底部面板（终端/输出，可拉伸）——全部可开关，状态持久化。**

</div>

## 📚 导航

[⚡ 安装](#-安装) · [🎨 功能](#-功能) · [🖥️ 界面结构](#️-界面结构) · [⌨️ 快捷键](#️-快捷键) · [🔍 工作原理](#-工作原理) · [🔷 更新日志](#-更新日志) · [❓ FAQ](#-faq) · [🗺️ Roadmap](#️-roadmap)

---

## ⚡ 安装

2026 年了，你有 Agent，让它自己装。打开 DeepSeek Harness 的插件市场或直接把下面这句丢给任意 Agent：

```
帮我安装 dsh-ide-panels 这个插件：https://github.com/AIRIKE1/dsh-ide-panels
```

Agent 会自动识别 DSH 的 profile 目录、完成复制、注册 bundle。完成后**重启 DSH Desktop** 即可看到外壳。

<details>
<summary>🛠️ 想自己手动装？点开看路径</summary>

**一键脚本**（在插件源码目录执行）：

```powershell
.\install.ps1
```

**手动三步**：

1. 把 `dsh-ide-panels` 整个文件夹复制到
   `%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-ide-panels`；
2. 编辑 `%USERPROFILE%\.dsh\profiles\desktop\package.json`，在
   `dsh.profile.bundles` 数组末尾追加 `"dsh-ide-panels"`；
3. **重启 DSH Desktop**（新插件的 bundle 需要重新生成启动图，无法热加载）。

> 卸载：从 `bundles` 里移除该名称、删除 `node_modules\dsh-ide-panels` 文件夹即可。

Windows 特殊处理、排障、验证方法见 [📦 详细安装说明 INSTALL.md](INSTALL.md)。

</details>

---

## 🎨 功能

| 区域 | 内容 | 亮点 |
|---|---|---|
| 🗂️ **中间标签页工具区** | 编辑器 / 文档 / 终端 / 浏览器 / 代码变更 | 同一工具**可无限多开**、标签**拖拽排序**、关闭即回收；空状态是"打开工具"面板 |
| 📁 **右侧栏** | 资源管理器 / 搜索 / 源代码管理 / 远程 / 扩展管理 / 设置 / Agent | 图标竖排 + 面板，底部带开关按钮 |
| 📉 **底部面板** | 终端 / 调试控制台 / 输出 | 常驻标签条、**高度可自由拉伸**、内容区随动 |
| 🖥️ **真实 PowerShell 终端** | node-pty + xterm.js | winpty 后端稳定输出、**Ctrl+滚轮缩放字号**、容器自适应行列 |
| 🆚 **本地代码变更对比** | 快照基线 → 前后文件对比 | **不依赖 git**：建立基线后，改过的文件左右分栏展示，新增代码**绿色高亮** |
| 🌿 **Git 源码管理** | status / stage / commit / diff / log | 无仓库时一键**初始化**；变更列表 + 提交历史 |
| 🌐 **远程资源管理器** | SSH / WSL | 直接输入 IP/主机连接；SSH 分组读取 `~/.ssh/config`、WSL 列出发行版 |
| 🔍 **本地文件搜索** | 文件名 / 内容 / 两者 | 不依赖 Agent，递归扫描，点击结果直达编辑器 |

---

## 🖥️ 界面结构

```
┌─────────────┬──────────┬──────────────────┬───────────┬─────────┐
│             │          │                  │ 编辑器    │         │
│  DSH 会话   │   聊天   │  中间标签工具区   │ 文档      │ 右侧栏  │
│  侧栏       │  (常驻)  │  (标签可多开)     │ 终端      │ (竖排)  │
│             │          │                  │ 代码变更  │         │
│             │          ├──────────────────┴───────────┴─────────┤
│             │          │  底部面板：终端 / 调试控制台 / 输出       │
└─────────────┴──────────┴─────────────────────────────────────────┘
```

- **左侧**：DSH 自带会话侧栏（保留）
- **聊天**：始终在左侧 400px，不被任何面板遮挡
- **中间**：工具标签区（可拖拽/多开/关闭）
- **右侧**：主侧栏（图标竖排 + 面板）
- **底部**：面板条（可拉伸高度）

---

## ⌨️ 快捷键

| 操作 | 方式 |
|---|---|
| 开关整个外壳 | `Ctrl+Shift+S` |
| 切换右侧栏 | `Ctrl+Shift+J` |
| 切换底部面板 | `Ctrl+Shift+B` |
| 收起单个面板 | 面板标题右侧 ✕ |
| 终端缩放字号 | 终端内 `Ctrl+滚轮` |

所有开关状态持久化在 Host settings（`ui-panels` 命名空间，全小写，符合 DSH 命名规范），重启后保持。

---

## 🔍 工作原理

1. 插件注册进官方 `shell.overlay` 槽位（root 级 list），在 DSH 对话界面叠加可开关的外壳；
2. 右侧栏注册进 AppFrame 的 `details` 槽位（priority -1 压制官方详情面板），作为同级网格列渲染——对话列自动变窄、互不遮挡；
3. 网格用 CSS 变量（`--dp-left/--dp-right/--dp-chat/--dp-strip`）动态驱动：侧栏宽、聊天宽、右侧宽、底部高都能拖拽/拉伸，并随窗口大小自适应；
4. 终端走 host 端 node-pty（winpty 后端）——真实 PowerShell 进程，xterm.js 渲染，轮询读写；
5. 代码变更走**本地文件快照**（`.dsh-changes/` 目录）——不依赖 git，任何目录都能对比；
6. 搜索/远程/Git 全部由 host 路由直连本地（`/dsh-ui-panels/*`），不经过 Agent。

---

## 🔷 更新日志

> 🔷 **2026.08.18 — v0.1.0 发布**：首个版本。中间标签工具区（多开/拖拽/关闭）、右侧栏（资源管理器/搜索/Git/远程/扩展/设置/Agent）、底部面板（可拉伸 + 终端/调试/输出）、真实 PowerShell 终端（winpty + xterm）、本地代码变更对比（快照 + 前后高亮）、Git 源码管理、SSH/WSL 远程、本地文件搜索。

> ⭐ 觉得好用的话，给仓库点个 Star 吧！

---

## ❓ FAQ

**装了没效果？**
重启 DSH Desktop。新插件的 bundle 需要重新生成启动图，无法热加载。

**中间"打开工具"面板点不开工具？**
旧版本设置里可能存了旧格式的标签数据；重启一次（host schema 已更新为多开结构）即可。

**代码变更对比为什么是空的？**
先点"建立基线"——它会把当前目录所有文本文件存一份快照；之后改过的文件才会列出来。不依赖 git，任何目录可用。

**终端没有输出？**
确认 host 端 node-pty 可用（重启后生效）。终端是真实 PowerShell（winpty 后端），连接断开点"重连"。

**远程 SSH 连不上？**
先在输入框填 `user@ip` 直接连接；用 `~/.ssh/config` 里配置的主机需要免密/密钥认证。

**怎么卸载？**
从 `dsh.profile.bundles` 移除该名称，删除 `node_modules\dsh-ide-panels` 文件夹，重启。

---

## 🗺️ Roadmap

- [x] 中间标签工具区（多开/拖拽/关闭/溢出收纳）
- [x] 右侧栏（去重 + 竖排开关）
- [x] 底部面板（可拉伸/常驻）
- [x] 真实 PowerShell 终端
- [x] 本地代码变更对比（不依赖 git）
- [x] Git 源码管理 / SSH+WSL 远程 / 本地搜索
- [ ] 设置里自定义右侧栏/中间工具
- [ ] 标签右键菜单（复制/固定）
- [ ] 多工作区文件树

---

<div align="center">

*Created by [AIRIKE](https://github.com/AIRIKE1) · [MIT License](LICENSE) · Powered by [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)*

</div>
