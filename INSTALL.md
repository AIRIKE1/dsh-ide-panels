# 📦 dsh-ide-panels 详细安装说明

> 对应 README 的「🛠️ 手动安装」折叠块；中英文 README 均可点击进入。

## ✅ 环境要求

- **DSH Desktop**（DeepSeek Harness 桌面版），profile 目录默认 `%USERPROFILE%\.dsh\profiles\desktop`
- PowerShell 5.1+（Windows 10/11 自带）
- git（可选，用于 clone 源码）
- 终端依赖：profile 的 `node_modules` 里需要有 `node-pty`（若没有，`install.ps1` 会尝试从 npm 安装）

## 🚀 一键安装

在插件源码目录执行：

```powershell
.\install.ps1
```

脚本会自动：
1. 把插件复制到 `%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-ide-panels`
2. 在 `dsh.profile.bundles` 里注册 `"dsh-ide-panels"`（若未注册）

> ⚠️ 安装后必须**重启 DSH Desktop**，新 bundle 才能加载。

## 🖐️ 手动安装（三步）

1. **复制插件**：
   ```powershell
   Copy-Item -Recurse .\dsh-ide-panels "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-ide-panels"
   ```
2. **注册 bundle**：编辑 `%USERPROFILE%\.dsh\profiles\desktop\package.json`，在 `dsh.profile.bundles` 数组末尾加：
   ```json
   "dsh-ide-panels"
   ```
3. **重启 DSH Desktop**。

## 🔁 更新

```powershell
cd <dsh-ide-panels 源码目录>
git pull
Copy-Item -Recurse .\* "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-ide-panels\" -Force
# 重启 DSH Desktop
```

## ❌ 卸载

1. 编辑 `package.json`，从 `dsh.profile.bundles` 移除 `"dsh-ide-panels"`；
2. 删除文件夹 `%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-ide-panels`；
3. 重启 DSH Desktop。

## 🪟 Windows 排障

| 现象 | 原因 / 处理 |
|---|---|
| 装了没效果 | 没重启。bundle 启动图是启动时生成的，无法热加载 |
| 终端空白 / 无输出 | `node_modules` 缺 `node-pty`（或 prebuild 不匹配）。在 profile 下 `npm i node-pty` 后重启 |
| 打开工具面板点不开 | 旧设置存了旧格式标签；重启一次（host schema 已更新） |
| 搜索/远程/Git 提示 404 | host 还是旧代码，重启 DSH Desktop 即可 |
| 代码变更对比空 | 先点「建立基线」生成快照 |

## 🧪 验证安装

重启后：
1. 右侧出现图标竖排侧栏；
2. `Ctrl+Shift+S` 能开关整个外壳；
3. 中间标签区空状态显示「打开工具」面板；
4. 底部有「终端 / 调试控制台 / 输出」标签条。

## 📁 目录结构

```
dsh-ide-panels/
├── lib/
│   ├── client.js        # 客户端 bundle（外壳 UI、标签页、视图、CSS）
│   └── index.js         # host 侧（设置命名空间、路由：fs/search/git/remote/pty/…）
├── tests/               # smoke / load-test / apply-test
├── cordis.patch.yml     # bundle patch 声明
├── install.ps1          # 一键安装脚本
├── package.json
└── README.md            # 默认中文 README（docs/lang/README_EN.md 为英文）
```
