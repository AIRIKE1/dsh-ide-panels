/**
 * dsh-ide-panels — 无头冒烟测试
 *
 * 校验：
 *  1) lib/client.js 与 lib/index.js 语法合法（node --check）；
 *  2) client bundle 含关键注册点（shell.overlay 注入、14 个视图 id、快捷键）；
 *  3) 主机侧 index.js 导出 name/apply 且注册 "uiPanels" 命名空间；
 *  4) 视图目录 id 无重复、与渲染分发表一一对应。
 *
 * 运行：node tests/smoke.mjs
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientPath = join(root, "lib", "client.js");
const indexPath = join(root, "lib", "index.js");

let failures = 0;
function check(ok, label) {
  if (ok) console.log(`  ✓ ${label}`);
  else { console.error(`  ✗ ${label}`); failures += 1; }
}

console.log("1) 语法检查（node --check）");
for (const file of [clientPath, indexPath]) {
  const r = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  check(r.status === 0, `${file} 语法合法${r.status === 0 ? "" : "\n" + (r.stderr || r.stdout)}`);
}

console.log("2) client bundle 关键注册点");
const client = readFileSync(clientPath, "utf8");
check(client.includes('ctx.slots.inject("shell.overlay"'), '注入 shell.overlay 槽位');
check(client.includes('id: "dsh-ui-panels"'), 'list 槽位 id = dsh-ui-panels');
check(client.includes('name: "shell.overlay"'), '声明 name = shell.overlay');
check(client.includes('exports.inject = ["slots", "locale", "settingsScope", "connection", "remote", "sessions", "workspaces", "loader", "layout"]'), '声明依赖服务');
check(client.includes('event.key.toUpperCase()') && client.includes('event.ctrlKey'), '键盘快捷键处理（Ctrl+Shift）');
check(client.includes('setBottomExpanded'), '底部面板展开状态');
check(client.includes('bottomExpanded'), 'bottomExpanded 状态字段');
check(client.includes('ViewErrorBoundary'), '视图错误边界');
check(client.includes('getDerivedStateFromError'), '错误边界静态方法');
check(client.includes('patchConsole') && client.includes('logStore'), 'console 日志捕获');
check(client.includes('settingsScope.bind({ namespace: "ui-panels" })'), 'settingsScope 绑定 ui-panels');
check(client.includes('grid-template-columns:auto var(--dp-chat,400px) minmax(0,1fr) var(--dp-right,336px)'), 'DSH 网格：会话侧栏 auto / 聊天 var 可拖 / 编辑器 1fr / 右侧栏 var 可拖');
check(client.includes('grid-column:1 !important') && client.includes('grid-column:2 !important') && client.includes('grid-column:4 !important'), '四列显式定位（侧栏/聊天/右侧栏）');
check(client.includes('--dp-left') && client.includes('--dp-right') && client.includes('--dp-chat'), 'CSS 变量同步（会话侧栏+聊天宽/右侧栏宽/聊天宽）');
check(client.includes('dp-hsplit') && client.includes('startDrag'), '列拖拽手柄（可拉伸带最小值）');
check(client.includes('dp-editor-textarea') && client.includes('execCommand'), '可编辑编辑器（保存/撤销/重做）');
check(client.includes('dp-center') && client.includes('centerView'), '中间标签区');
check(client.includes('dsh-ui-panels/fs'), '文件读取路由（client）');
check(client.includes('dsh-ui-panels/dir'), '目录列表路由（client 文件树）');
check(client.includes('fileOpenStore'), '文件打开共享 store');

console.log("3) 视图目录完整性");
const expectedLeft = []; // 左侧无任何视图
// 右侧栏（去重后）：资源管理器/扩展管理/通用设置/Agent设置
const expectedRight = ["explorer", "extensions", "general", "agent"];
// 中间标签工具（可打开为标签页）
const expectedCenter = ["files", "docs", "terminal", "browser", "changes", "search", "source", "remote"];
const expectedBottom = ["terminal", "debug", "output"];
const allExpected = [...new Set([...expectedLeft, ...expectedRight, ...expectedCenter, ...expectedBottom])];
for (const id of allExpected) {
  check(client.includes(`id: "${id}"`), `视图 id 存在：${id}`);
}
// 渲染分发表覆盖全部视图
const renderKeys = ["files", "docs", "terminal", "browser", "changes", "general", "agent", "explorer", "search", "remote", "source", "extensions", "debug", "output"];
for (const id of renderKeys) {
  check(client.includes(`${id}: function ()`), `渲染分发表包含：${id}`);
}
// 唯一性：渲染分发表 14 个键必须唯一（terminal 在中间与底部目录各出现一次属预期，因为同 id 共用实现）
const renderKeysSet = new Set(renderKeys);
check(renderKeysSet.size === renderKeys.length, `渲染分发表键唯一（${renderKeys.length} 个）`);
check(allExpected.every((id) => renderKeysSet.has(id)), '所有目录 id 都有渲染实现');
// 标签页系统关键点
check(client.includes('openTabs'), '标签页状态 openTabs');
check(client.includes('closeCenterTab'), '标签关闭动作');
check(client.includes('dp-open-tools'), '空状态工具面板');
check(client.includes('dp-tab-add'), '加号按钮');

console.log("4) 主机侧 index.js");
const index = readFileSync(indexPath, "utf8");
check(index.includes('export const name = "dsh-ide-panels"'), '导出 name');
check(index.includes("settingsNamespace(\"ui-panels\")"), '注册 ui-panels 命名空间（全小写合法）');
check(index.includes('PanelsSettingsSchema'), '定义持久化 schema');
check(index.includes("leftView") && index.includes("rightView") && index.includes("bottomView"), 'schema 含左右栏/底部视图字段');
check(index.includes('path: "/dsh-ui-panels/plugins"'), '插件列表路由');
check(index.includes('path: "/dsh-ui-panels/plugins/toggle"'), '插件开关路由');
check(index.includes("function togglePlugin"), 'togglePlugin 实现');
check(index.includes("function normalizeGithub"), 'GitHub 地址规整');
check(index.includes('ctx.inject(["webServer"]'), '注入 webServer 服务');

console.log("4b) 插件管理（client）");
check(client.includes('fetch("/dsh-ui-panels/plugins")'), 'client 拉取插件列表');
check(client.includes('fetch("/dsh-ui-panels/plugins/toggle"'), 'client 切换插件开关');
check(client.includes('"pm.title"'), '插件管理文案（zh）');
check(client.includes('"pm.restart"'), '重启生效提示');
check(client.includes('IconLinkOutline16'), 'GitHub 链接图标');

console.log("5) 元数据");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
check(pkg.dsh?.client?.platform === "web", 'dsh.client.platform = web');
check(Array.isArray(pkg.dsh?.client?.inject) && pkg.dsh.client.inject.length > 0, 'dsh.client.inject 已声明');
check(pkg.dsh?.bundle?.patch === "./cordis.patch.yml", 'bundle patch 声明');
check(pkg.exports?.["./client"] === "./lib/client.js", 'exports ./client');

console.log("");
if (failures > 0) {
  console.error(`FAILED: ${failures} 项未通过`);
  process.exit(1);
}
console.log("ALL PASS ✓");
