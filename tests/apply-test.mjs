/**
 * dsh-ide-panels — apply() 集成冒烟测试
 *
 * 用 stub ctx 执行 client 的 apply()：
 *   · 验证 apply 不抛错（服务名、bind、effect 等）；
 *   · 触发 shell.overlay 注册，并用迷你渲染器执行整个外壳组件树
 *     （含全部 14 个视图组件 + 错误边界），捕捉渲染期错误；
 *   · 模拟设置回包（adopt）、开关动作（persist）、键盘事件、focusin 自动收起。
 *
 * 运行：node tests/apply-test.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientSrc = readFileSync(join(root, "lib", "client.js"), "utf8");

let failures = 0;
function check(ok, label) {
  if (ok) console.log(`  ✓ ${label}`);
  else { console.error(`  ✗ ${label}`); failures += 1; }
}

/* ---------- 浏览器 stub ---------- */
const listeners = { keydown: [], focusin: [], pointermove: [], pointerup: [] };
const bodyStyle = { props: {}, setProperty: (k, v) => { bodyStyle.props[k] = v; }, getPropertyValue: (k) => bodyStyle.props[k] ?? "" };
const bodyStub = {
  style: bodyStyle,
  setAttribute() {},
  removeAttribute() {},
  getAttribute: () => null
};
const documentStub = {
  addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
  removeEventListener: (type, fn) => { listeners[type] = (listeners[type] || []).filter((f) => f !== fn); },
  querySelector: () => null,
  createElement: (tag) => ({ dataset: {}, textContent: "", appendChild() {}, remove() {} }),
  head: { appendChild() {} },
  body: bodyStub
};
const windowStub = {
  innerWidth: 1600,
  addEventListener() {},
  removeEventListener() {},
  __ModuleLoader__: { load: (def) => { loaded = def; } }
};

/* ---------- react stub ---------- */
const reactStub = {
  createElement: (type, props, ...children) => {
    const p = props || {};
    const flat = children.flat(); // React 会展平嵌套数组 children
    // 真实 React：children 挂在 props.children 上（类组件读 this.props.children）
    if (flat.length === 1) p.children = flat[0];
    else if (flat.length > 1) p.children = flat;
    return { type, props: p, children: flat };
  },
  Component: function Component(props) { this.props = props; },
  Fragment: "fragment",
  useState: (init) => [typeof init === "function" ? init() : init, () => {}],
  useEffect: (fn) => { try { const d = fn(); if (typeof d === "function") d(); } catch {} },
  useSyncExternalStore: (subscribe, getSnapshot) => getSnapshot(),
  useRef: () => ({ current: null }),
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  useLayoutEffect: () => {},
  createContext: () => ({ Provider: "provider", Consumer: "consumer" })
};
reactStub.Component.prototype = { isReactComponent: true };

const primitiveStub = new Proxy({}, {
  get: (target, prop) => {
    if (prop === "__esModule") return false;
    if (prop in target) return target[prop];
    const fn = (props) => reactStub.createElement("svg", props);
    target[prop] = fn;
    return fn;
  }
});
const requireStub = (id) => {
  if (id === "react") return reactStub;
  if (id === "@deepseek-ai/dsh-client-ui-primitives") return primitiveStub;
  throw new Error(`unexpected require: ${id}`);
};

/* ---------- ctx stub ---------- */
let loaded = null;
const injections = [];      // slots.inject 捕获：{name, cb}
const registrations = [];   // slots.register 捕获：{options, component}
let settingsSubscriber = null;
let settingsValue = { open: true, leftOpen: true, rightOpen: true, bottomOpen: false, leftView: "editor", rightView: "explorer", bottomView: "terminal" };
let persistCalls = [];
let effectDisposers = [];

const snapshotStoreStub = () => ({
  subscribe: () => () => {},
  getSnapshot: () => ({ ids: [], byId: {}, current: undefined })
});

const ctx = {
  locale: {
    register: () => () => {},
    bind: () => (key) => key || ""
  },
  settingsScope: {
    bind: () => ({
      getSnapshot: () => ({ value: settingsValue }),
      set: (field, value) => { persistCalls.push([field, value]); },
      subscribe: (fn) => { settingsSubscriber = fn; return () => { settingsSubscriber = null; }; }
    })
  },
  slots: {
    inject: (name, cb) => { injections.push({ name, cb }); },
    register: (options, component) => {
      registrations.push({ options, component });
      return () => {};
    }
  },
  sessions: {
    list: snapshotStoreStub(),
    open: () => {},
    create: async () => "s-new"
  },
  workspaces: {
    list: { subscribe: () => () => {}, getSnapshot: () => ({ items: [{ workspaceId: "w1", name: "W", path: "C:\\w", sessionIds: ["s1"] }] }) },
    connectWorkspace: async () => "s-new",
    startSession: () => {}
  },
  connection: { isLoopback: true },
  layout: { closeDetails: () => {}, openDetails: () => {}, toggleSidebar: () => {} },
  loader: { entries: () => [] },
  effect: (cb) => { const d = cb(); if (typeof d === "function") effectDisposers.push(d); },
  on: () => () => {},
  reflect: { provide: () => {} },
  get: () => undefined,
  emit: () => {},
  plugin: () => {}
};

/* ---------- 迷你渲染器：递归执行函数组件，捕获渲染期错误 ---------- */
function renderElement(el, depth) {
  if (el === null || el === undefined) return;
  if (typeof el !== "object") return; // 字符串/数字文本节点
  if (depth > 40) throw new Error("render depth exceeded");
  let type = el.type;
  if (typeof type === "function") {
    let out;
    try {
      if (type.prototype && typeof type.prototype.render === "function") {
        const inst = new type(el.props);
        out = inst.render();
      } else {
        out = type(el.props);
      }
    } catch (e) {
      console.error(`  [render] component failed: ${type.name || "(anonymous)"}`);
      throw e;
    }
    // 类组件 render 可能返回数组（如 props.children）
    if (Array.isArray(out)) {
      for (const item of out) renderElement(item, depth + 1);
      return;
    }
    renderElement(out, depth + 1);
    return;
  }
  const children = Array.isArray(el.children) ? el.children : [el.children];
  for (const child of children) renderElement(child, depth + 1);
}

/* ---------- 执行 ---------- */
globalThis.window = windowStub;
globalThis.document = documentStub;
(0, eval)(clientSrc);
const mod = loaded.factory(requireStub);

console.log("1) apply() 执行");
let applyError = null;
try {
  mod.apply(ctx);
} catch (e) {
  applyError = e;
}
check(applyError === null, `apply() 不抛错${applyError ? "：" + applyError.message : ""}`);
check(injections.some((i) => i.name === "shell.overlay"), "已注入 shell.overlay");
check(injections.some((i) => i.name === "details"), "已注入 details（右侧栏同级列）");

console.log("2) 注册并渲染外壳树（迷你渲染器执行全部组件）");
let shellError = null;
try {
  for (const inj of injections) inj.cb(); // 触发全部 ctx.slots.register
  const overlayReg = registrations.find((r) => r.options.name === "shell.overlay");
  const detailsReg = registrations.find((r) => r.options.name === "details");
  check(overlayReg !== void 0 && overlayReg.options.id === "dsh-ui-panels", "overlay 注册含 id=dsh-ui-panels");
  check(typeof overlayReg.options.label === "function", "overlay label 为函数");
  check(detailsReg !== void 0 && detailsReg.options.priority === -1, "details 注册 priority=-1（压制官方详情面板）");
  if (overlayReg) renderElement(overlayReg.component({}), 0);
  if (detailsReg) renderElement(detailsReg.component({}), 0);
} catch (e) {
  shellError = e;
}
check(shellError === null, `外壳 + 全部视图渲染不抛错${shellError ? "：" + shellError.message : ""}`);

console.log("3) 视图切换渲染（右侧 general / agent / extensions，底部 debug / output）");
settingsValue = { open: true, leftOpen: true, rightOpen: true, bottomOpen: true, bottomExpanded: true, leftView: "editor", rightView: "general", bottomView: "debug" };
try {
  if (settingsSubscriber) settingsSubscriber();
  const overlayReg = registrations.find((r) => r.options.name === "shell.overlay");
  const detailsReg = registrations.find((r) => r.options.name === "details");
  renderElement(overlayReg.component({}), 0);
  renderElement(detailsReg.component({}), 0);
  check(true, "切换视图后重新渲染不抛错");
} catch (e) {
  check(false, "切换视图渲染抛错：" + e.message);
}
settingsValue = { open: true, leftOpen: true, rightOpen: true, bottomOpen: true, bottomExpanded: true, leftView: "editor", rightView: "agent", bottomView: "output" };
try {
  if (settingsSubscriber) settingsSubscriber();
  const overlayReg = registrations.find((r) => r.options.name === "shell.overlay");
  const detailsReg = registrations.find((r) => r.options.name === "details");
  renderElement(overlayReg.component({}), 0);
  renderElement(detailsReg.component({}), 0);
  check(true, "agent/output 视图渲染不抛错");
} catch (e) {
  check(false, "agent/output 渲染抛错：" + e.message);
}
settingsValue = { open: true, leftOpen: true, rightOpen: true, bottomOpen: true, bottomExpanded: true, leftView: "editor", rightView: "extensions", bottomView: "terminal" };
try {
  if (settingsSubscriber) settingsSubscriber();
  const overlayReg = registrations.find((r) => r.options.name === "shell.overlay");
  const detailsReg = registrations.find((r) => r.options.name === "details");
  renderElement(overlayReg.component({}), 0);
  renderElement(detailsReg.component({}), 0);
  check(true, "extensions 视图渲染不抛错（含 fetch 失败兜底）");
} catch (e) {
  check(false, "extensions 渲染抛错：" + e.message);
}

console.log("4) 设置回包联动（adopt：shell 关闭态）");
settingsValue = { open: false, leftOpen: true, rightOpen: true, bottomOpen: true, bottomExpanded: true, leftView: "docs", rightView: "explorer", bottomView: "output" };
try {
  if (settingsSubscriber) settingsSubscriber();
  const overlayReg = registrations.find((r) => r.options.name === "shell.overlay");
  const detailsReg = registrations.find((r) => r.options.name === "details");
  renderElement(overlayReg.component({}), 0);
  renderElement(detailsReg.component({}), 0);
  check(true, "关闭态渲染不抛错");
} catch (e) {
  check(false, "关闭态渲染抛错：" + e.message);
}

console.log("5) 键盘事件（Ctrl+Shift+S 触发 shell 开关）");
persistCalls = [];
const keyEvent = { ctrlKey: true, shiftKey: true, altKey: false, key: "s", preventDefault: () => {}, target: documentStub };
for (const fn of listeners.keydown) { try { fn(keyEvent); } catch (e) { check(false, "keydown 不抛错：" + e.message); } }
check(persistCalls.some(([f]) => f === "open"), "Ctrl+Shift+S 写入 open");

console.log("6) 底部面板展开状态（setBottomExpanded 持久化）");
persistCalls = [];
// 通过渲染触发 tab 点击不可行（stub），直接验证渲染含 bottomExpanded 不抛错
settingsValue = { open: true, leftOpen: true, rightOpen: true, bottomOpen: true, bottomExpanded: true, leftView: "editor", rightView: "explorer", bottomView: "terminal" };
try {
  if (settingsSubscriber) settingsSubscriber();
  const overlayReg = registrations.find((r) => r.options.name === "shell.overlay");
  const detailsReg = registrations.find((r) => r.options.name === "details");
  renderElement(overlayReg.component({}), 0);
  renderElement(detailsReg.component({}), 0);
  check(true, "底部展开态渲染不抛错");
} catch (e) {
  check(false, "底部展开态渲染抛错：" + e.message);
}

console.log("7) effect disposer 完整性");
check(effectDisposers.length >= 4, `effect 已注册（${effectDisposers.length} 个）`);

console.log("8) 列拖拽（指针按下→移动→抬起，验证宽度变量更新与钳制）");
// 在元素树里找 className 匹配的节点（会执行函数/类组件以展开子树）
function findEl(el, matcher) {
  if (!el || typeof el !== "object") return null;
  const props = el.props || {};
  if (typeof el.type === "string") {
    const cls = props.className || "";
    if (matcher(cls, props)) return el;
    const children = Array.isArray(el.children) ? el.children : [el.children];
    for (const c of children) {
      const found = findEl(c, matcher);
      if (found) return found;
    }
    return null;
  }
  if (typeof el.type === "function") {
    let out;
    try {
      if (el.type.prototype && typeof el.type.prototype.render === "function") {
        const inst = new el.type(el.props);
        out = inst.render();
      } else {
        out = el.type(el.props);
      }
    } catch (e) {
      return null;
    }
    if (Array.isArray(out)) {
      for (const o of out) {
        const found = findEl(o, matcher);
        if (found) return found;
      }
      return null;
    }
    return findEl(out, matcher);
  }
  return null;
}
try {
  settingsValue = { open: true, leftOpen: true, rightOpen: true, bottomOpen: true, bottomExpanded: false, leftView: "editor", rightView: "explorer", bottomView: "terminal" };
  if (settingsSubscriber) settingsSubscriber();
  const overlayReg = registrations.find((r) => r.options.name === "shell.overlay");
  const rootEl = overlayReg.component({});
  const chatHandle = findEl(rootEl, (cls, props) => cls.includes("dp-hsplit") && (props.style?.left || "").includes("--dp-left"));
  const rightHandle = findEl(rootEl, (cls, props) => cls.includes("dp-hsplit") && (props.style?.left || "").includes("--dp-right"));
  check(chatHandle !== null, "聊天|中间 拖拽手柄已渲染");
  check(rightHandle !== null, "中间|右侧 拖拽手柄已渲染（rightOpen 时）");

  // 模拟拖拽聊天列：按下 → 移动 +100px → 抬起
  bodyStyle.props = {};
  const fakeEvt = { clientX: 100, preventDefault() {} };
  chatHandle.props.onPointerDown(fakeEvt);
  const pm = listeners.pointermove.pop();
  pm({ clientX: 200 });
  listeners.pointerup.forEach((fn) => fn({}));
  listeners.pointerup.length = 0;
  check(bodyStyle.props["--dp-chat"] === "500px", `拖拽后 --dp-chat=500px（实际 ${bodyStyle.props["--dp-chat"]}）`);
  check(bodyStyle.props["--dp-left"] === "500px", `拖拽后 --dp-left 同步=500px（实际 ${bodyStyle.props["--dp-left"]}）`);

  // 模拟拖拽右侧栏：按下 → 移动 -60px（右栏变宽）
  bodyStyle.props = {};
  const fakeEvt2 = { clientX: 400, preventDefault() {} };
  rightHandle.props.onPointerDown(fakeEvt2);
  const pm2 = listeners.pointermove.pop();
  pm2({ clientX: 340 });
  listeners.pointerup.forEach((fn) => fn({}));
  listeners.pointerup.length = 0;
  check(bodyStyle.props["--dp-right"] === "396px", `拖拽后 --dp-right=396px（实际 ${bodyStyle.props["--dp-right"]}）`);

  // 钳制：把聊天列拖到 < 280 → 应钳到 280
  bodyStyle.props = {};
  chatHandle.props.onPointerDown({ clientX: 0, preventDefault() {} });
  const pm3 = listeners.pointermove.pop();
  pm3({ clientX: -5000 });
  listeners.pointerup.forEach((fn) => fn({}));
  listeners.pointerup.length = 0;
  check(bodyStyle.props["--dp-chat"] === "220px", `拖拽钳制最小值：--dp-chat=220px（实际 ${bodyStyle.props["--dp-chat"]}）`);

  // 全屏↔窗口化差异：小窗口下动态上限生效（不再用固定 620；上限=窗宽-侧栏-右栏-中间最小160）
  bodyStyle.props = {};
  windowStub.innerWidth = 800; // 模拟窗口化小窗
  chatHandle.props.onPointerDown({ clientX: 0, preventDefault() {} });
  const pm4 = listeners.pointermove.pop();
  pm4({ clientX: 5000 }); // 拖到极大 → 应钳到动态上限
  listeners.pointerup.forEach((fn) => fn({}));
  listeners.pointerup.length = 0;
  // 上限 = 800 - 侧栏0 - 右栏396 - 中间最小160 = 244
  check(bodyStyle.props["--dp-chat"] === "244px", `小窗口动态上限：--dp-chat=244px（实际 ${bodyStyle.props["--dp-chat"]}）`);
  windowStub.innerWidth = 1600;
} catch (e) {
  check(false, "拖拽测试抛错：" + e.message);
}

console.log("");
if (failures > 0) {
  console.error(`FAILED: ${failures} 项未通过`);
  process.exit(1);
}
console.log("APPLY TEST PASS ✓");
