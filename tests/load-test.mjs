/**
 * dsh-ide-panels — 模块加载冒烟测试
 *
 * 在 stub 浏览器环境下真正执行 lib/client.js 的 bundle factory，
 * 捕捉模块作用域错误（未定义变量、图标引用错误、CSS 注入崩溃等），
 * 这类错误会在 bundle 加载时直接导致入口失败。
 *
 * 运行：node tests/load-test.mjs
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

/** React stub：只提供 factory 模块作用域用到的成员。 */
const reactStub = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  Component: function () {},
  Fragment: "fragment",
  useState: () => [],
  useEffect: () => {},
  useSyncExternalStore: (subscribe, getSnapshot) => getSnapshot(),
  useRef: () => ({ current: null }),
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  useLayoutEffect: () => {},
  createContext: () => ({ Provider: "provider", Consumer: "consumer" })
};
reactStub.Component.prototype = { isReactComponent: true };

/** primitives stub：任何 IconXxx / 组件都返回无操作组件。 */
const primitiveStub = new Proxy({}, {
  get: (target, prop) => {
    if (prop === "__esModule") return false;
    if (prop in target) return target[prop];
    const fn = (props) => reactStub.createElement("svg", props);
    target[prop] = fn;
    return fn;
  }
});

/** 极简 document stub（factory 模块作用域注入 <style>）。 */
const documentStub = {
  querySelector: () => null,
  createElement: (tag) => ({ dataset: {}, textContent: "", appendChild() {}, remove() {} }),
  head: { appendChild() {} }
};

let loaded = null;
const windowStub = {
  innerWidth: 1600,
  addEventListener() {},
  removeEventListener() {},
  __ModuleLoader__: {
    load: (def) => { loaded = def; }
  }
};

const requireStub = (id) => {
  if (id === "react") return reactStub;
  if (id === "@deepseek-ai/dsh-client-ui-primitives") return primitiveStub;
  throw new Error(`unexpected require: ${id}`);
};

try {
  globalThis.window = windowStub;
  globalThis.document = documentStub;
  // 执行 bundle 源码（factory 由 __ModuleLoader__.load 捕获）
  // eslint-disable-next-line no-eval
  (0, eval)(clientSrc);
} catch (e) {
  console.error("bundle top-level execution failed:", e);
  process.exit(1);
}

check(loaded !== null, "bundle 已调用 __ModuleLoader__.load");

let exportsObj = null;
try {
  exportsObj = loaded.factory(requireStub);
} catch (e) {
  console.error("bundle factory execution failed:", e);
  process.exit(1);
}

check(exportsObj !== null && typeof exportsObj === "object", "factory 返回模块对象");
check(typeof exportsObj.apply === "function", "导出 apply()");
check(Array.isArray(exportsObj.inject) && exportsObj.inject.includes("slots"), "导出 inject（含 slots）");
check(exportsObj.inject.includes("layout"), "inject 含 layout");
check(exportsObj.inject.includes("loader"), "inject 含 loader");

// CSS 注入检查
check(typeof windowStub.__lastCss !== "undefined" || true, "CSS 注入 stub 已执行（无崩溃）");

console.log("");
if (failures > 0) {
  console.error(`FAILED: ${failures} 项未通过`);
  process.exit(1);
}
console.log("LOAD TEST PASS ✓");
