/**
 * dsh-ide-panels — DSH 2.0.10 外壳重写适配回归测试
 *
 * 2.0.10 的两个破坏点：
 *   1) AppFrame 的 CSS Modules 哈希类名变了（pI_x6G_frame → qNbT7G_frame），
 *      旧 CSS 覆盖选择器失配 → 4 列网格失效 → 中间面板浮在聊天列上、右侧栏空。
 *   2) 官方右栏槽位由 details 改名为 rightbar。
 *
 * 本测试从 lib/client.js 里抽出真实源码中的 findFrameEl/markAttr/tagFrame，
 * 在一个复刻 2.0.10 DOM 结构的极简假 DOM 上执行，验证打标结果。
 *
 * 运行：node tests/layout-2.0.10.test.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "lib", "client.js"), "utf8");

let failures = 0;
function check(ok, label) {
	if (ok) console.log(`  ✓ ${label}`);
	else { console.error(`  ✗ ${label}`); failures += 1; }
}

/* ── 从源码里按名字抽出函数声明（大括号配平） ─────────────────────── */
function extractFunction(name) {
	const start = src.indexOf(`function ${name}(`);
	if (start < 0) throw new Error(`函数未找到: ${name}`);
	let depth = 0;
	let i = src.indexOf("{", start);
	const open = i;
	for (; i < src.length; i += 1) {
		const ch = src[i];
		if (ch === "{") depth += 1;
		else if (ch === "}") {
			depth -= 1;
			if (depth === 0) return src.slice(start, i + 1);
		}
	}
	throw new Error(`函数未闭合: ${name} @${open}`);
}

/* ── 极简假 DOM（只支持被测代码用到的选择器形态） ─────────────────── */
function matchesCompound(el, compound) {
	// 支持：[attr]、[attr="v"]、[class*="v"]
	const attrStar = /^\[class\*="([^"]+)"\]$/.exec(compound);
	if (attrStar) return String(el.className || "").indexOf(attrStar[1]) >= 0;
	const attrEq = /^\[([\w-]+)="([^"]*)"\]$/.exec(compound);
	if (attrEq) return el.getAttribute(attrEq[1]) === attrEq[2];
	const attrHas = /^\[([\w-]+)\]$/.exec(compound);
	if (attrHas) return el.getAttribute(attrHas[1]) !== null;
	return false;
}
class El {
	constructor(className, opts = {}) {
		this.className = className || "";
		this.children = [];
		this.attrs = Object.assign({}, opts.attrs || {});
		this.style = { position: opts.position || "static", gridTemplateColumns: "" };
		this.parentElement = null;
		this.querySelectorCalls = 0;
	}
	append(...kids) {
		for (const k of kids) { k.parentElement = this; this.children.push(k); }
		return this;
	}
	getAttribute(name) {
		return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
	}
	setAttribute(name, value) {
		this.attrs[name] = String(value);
	}
	/** 只实现 :scope > <compound> 与后代 [data-shell-overlay] 两种查询。 */
	querySelector(selector) {
		this.querySelectorCalls += 1;
		if (selector === "[data-shell-overlay]") {
			const stack = [...this.children];
			while (stack.length) {
				const el = stack.shift();
				if (el.getAttribute("data-shell-overlay") !== null) return el;
				stack.push(...el.children);
			}
			return null;
		}
		const scoped = /^:scope > (.*)$/.exec(selector);
		if (scoped) {
			const compound = scoped[1];
			for (const kid of this.children) if (matchesCompound(kid, compound)) return kid;
			return null;
		}
		throw new Error("测试假 DOM 不支持选择器: " + selector);
	}
}
function getComputedStyleStub(el) {
	return { position: el.style.position };
}

const code = [extractFunction("findFrameEl"), extractFunction("markAttr"), extractFunction("tagFrame")].join("\n");
const makeTagFrame = (documentStub) =>
	// eslint-disable-next-line no-new-func
	new Function("document", "getComputedStyle", `${code}\nreturn tagFrame;`)(documentStub, getComputedStyleStub);

/** 复刻 2.0.10 的 AppFrame DOM：DocumentTitle 渲染 null，故首个子元素即 sidebarCol。 */
function buildFrame(cls) {
	const overlay = new El(`${cls}_overlayLayer`, { attrs: { "data-shell-overlay": "true" } });
	const sidebar = new El(`${cls}_sidebarCol`);
	const center = new El(`${cls}_centerCol`);
	const rightbar = new El(`${cls}_rightbarCol`, { attrs: { "data-rightbar-col": "true" } });
	const handle = new El(`${cls}_handle`, { position: "absolute" });
	const frame = new El(`${cls}_frame`);
	frame.append(sidebar, center, rightbar, overlay, handle);
	return { frame, sidebar, center, rightbar, overlay, handle };
}

/* ── 1) 静态断言：CSS 选择器已改为自有属性，旧哈希不再被引用 ───────── */
check(src.indexOf(".pI_x6G_frame") < 0, "源码不再引用旧哈希类名 .pI_x6G_frame");
check(
	src.indexOf('body[data-dp-shell=\\"1\\"] [data-dp-frame]{grid-template-columns:auto var(--dp-chat,400px) minmax(0,1fr) var(--dp-right,336px) !important}') >= 0,
	"CSS 用 [data-dp-frame] 覆盖 4 列网格"
);
check(src.indexOf('body[data-dp-shell=\\"1\\"] [data-dp-col=\\"1\\"]{grid-column:1 !important}') >= 0, "CSS 第 1 列 → grid-column 1");
check(src.indexOf('body[data-dp-shell=\\"1\\"] [data-dp-col=\\"2\\"]{grid-column:2 !important}') >= 0, "CSS 第 2 列 → grid-column 2");
check(src.indexOf('body[data-dp-shell=\\"1\\"] [data-dp-col=\\"3\\"]{grid-column:4 !important}') >= 0, "CSS 第 3 列（官方右栏）→ grid-column 4");

/* ── 2) 槽位：rightbar 为主、details 兜底、只允许一个生效 ──────────── */
check(src.indexOf('injectRightSlot("rightbar");') >= 0, "注册 rightbar 槽位（2.0.10+）");
check(src.indexOf('injectRightSlot("details");') >= 0, "注册 details 槽位（旧版兜底）");
check(src.indexOf("rightSlotClaimed === slotName") >= 0, "双槽位互斥（避免右侧栏渲染两次）");
check(src.indexOf("priority: -1") >= 0, "priority -1 压制官方右栏（single 槽最低者渲染）");
check(src.indexOf("L.closeRightbar()") >= 0, "关闭官方右栏：新 API closeRightbar()");
check(src.indexOf("typeof L.closeDetails") >= 0, "旧 API closeDetails() 仍作兼容兜底");

/* ── 3) 打标逻辑跑在新版类名（qNbT7G_*）上 ───────────────────────── */
{
	const dom = buildFrame("qNbT7G");
	const tagFrame = makeTagFrame({ querySelector: (s) => dom.frame.querySelector(s) });
	const ok = tagFrame();
	check(ok === true, "tagFrame() 在新版类名上返回成功");
	check(dom.frame.getAttribute("data-dp-frame") === "1", "frame 打上 data-dp-frame");
	check(dom.sidebar.getAttribute("data-dp-col") === "1", "sidebarCol → data-dp-col=1");
	check(dom.center.getAttribute("data-dp-col") === "2", "centerCol → data-dp-col=2");
	check(dom.rightbar.getAttribute("data-dp-col") === "3", "rightbarCol → data-dp-col=3");
	check(dom.overlay.getAttribute("data-dp-col") === null, "overlay 层不被打标");
	check(dom.handle.getAttribute("data-dp-col") === null, "拖拽手柄不被打标");
	// 幂等：重复调用不改变结果，也不重写已有值
	const before = JSON.stringify(dom.frame.attrs);
	check(tagFrame() === true, "tagFrame() 可重复调用");
	check(JSON.stringify(dom.frame.attrs) === before, "markAttr 幂等（值相同不重写）");
}

/* ── 4) 打标与哈希无关：换成任意哈希前缀仍然成功 ───────────────────── */
{
	const dom = buildFrame("aB3xY9");
	const tagFrame = makeTagFrame({ querySelector: (s) => dom.frame.querySelector(s) });
	check(tagFrame() === true, "换任意哈希前缀（aB3xY9_*）仍能打标");
	check(dom.rightbar.getAttribute("data-dp-col") === "3", "任意哈希下 rightbarCol 仍定位为第 3 列（→ 网格第 4 列）");
}

/* ── 5) 兜底路径：类名完全认不出时，按"在流内子元素顺序"取三列 ─────── */
{
	const overlay = new El("x_overlayLayer", { attrs: { "data-shell-overlay": "true" } });
	const sidebar = new El("unknown-a");
	const center = new El("unknown-b");
	const rightbar = new El("unknown-c");
	const handle = new El("x_handle", { position: "absolute" });
	const frame = new El("x_frame");
	frame.append(sidebar, center, rightbar, overlay, handle);
	const tagFrame = makeTagFrame({ querySelector: (s) => frame.querySelector(s) });
	check(tagFrame() === true, "类名认不出时走兜底路径并成功");
	check(sidebar.getAttribute("data-dp-col") === "1", "兜底：第 1 个在流子元素 → col 1");
	check(center.getAttribute("data-dp-col") === "2", "兜底：第 2 个在流子元素 → col 2");
	check(rightbar.getAttribute("data-dp-col") === "3", "兜底：第 3 个在流子元素 → col 3");
	check(handle.getAttribute("data-dp-col") === null, "兜底：absolute 手柄被跳过");
}

/* ── 6) 未挂载时安全失败 ─────────────────────────────────────────── */
{
	const tagFrame = makeTagFrame({ querySelector: () => null });
	check(tagFrame() === false, "overlay 尚未挂载时 tagFrame() 安全返回 false");
}

/* ── 7) 底部开关按钮：竖排、无背景色 ─────────────────────────────── */
check(src.indexOf(".dp-rail-btn.dp-rail-switch[data-active]{background:transparent") >= 0, "开关按钮激活态无背景色（CSS 规则）");
check((src.split('"dp-rail-btn dp-rail-switch"').length - 1) === 4, "4 个开关按钮（中间/右侧/底部/外壳）都带 dp-rail-switch 类");

/* ── 8) 客户端 bug 修复的源码契约（v0.1.2 排查） ─────────────────── */
check(src.indexOf('do { key = id + "-" + (++tabSeq); } while (taken[key]);') >= 0, "标签 key 生成时对已有 key 去重（客户端重载后不再撞 key）");
check(src.indexOf('"search.noWorkspace"') >= 0, "搜索在无工作区时给出明确提示（不再发 dir:\"\" 让 host 回退到安装目录）");

/* ── 9) 性能优化的源码契约（v0.1.3） ────────────────────────────── */
check(src.indexOf('var cands = document.querySelectorAll("div,span,h1,h2,p,button")') < 0, "sync 里不再有全 DOM 扫描（18555 节点下每次 45-84ms）");
check(src.indexOf("function layoutProbe(full)") >= 0, "布局探针支持按需全量（重的 topEls 扫描只在 full 时跑）");
check(src.indexOf("if (full) {") >= 0 && src.indexOf("diagTick % 12 === 0") >= 0, "全量探针每 12 次心跳才跑一次（不再是每 5 秒 84ms 卡顿）");
check(src.indexOf("resizeRaf") >= 0, "resize 事件用 rAF 合并（拖窗口不会每帧跑多次 sync）");
check(src.indexOf("if (!titleRowEl || !titleRowEl.isConnected)") >= 0, "titleRow 查询结果被缓存（不再每次全文档属性子串匹配）");
check(src.indexOf('className: "dp-center-pane"') >= 0, "中间标签各自一个 pane（切标签不再卸载视图）");
check(src.indexOf("if (document.hidden) return;") >= 0, "隐藏的终端暂停轮询（每个后台终端 12.5 次/秒 → 0）");
check(src.indexOf("dp-rail-switch") >= 0, "底部开关类名仍在（无背景色）");
check(src.indexOf('".dp-left ') < 0 && src.indexOf("toggleLeft") < 0, "左侧栏死代码已清除（不可达的 state/actions/CSS）");

/* ── 10) 底栏与中间工作区是同一块空间（v0.1.4） ─────────────────── */
check(src.indexOf('body[data-dp-shell=\\"1\\"][data-dp-nocenter=\\"1\\"] [data-dp-frame]{grid-template-columns:auto minmax(0,1fr) 0px var(--dp-right,336px) !important}') >= 0, "中间关闭时第 3 列收成 0、聊天列改 1fr（空间还给聊天）");
check(src.indexOf("var bottomHidden = !bottomOpen || state.centerOpen === false;") >= 0, "关闭中间工作区时底栏一并隐藏");
check(src.indexOf('if (next && s.centerOpen === false) persist("centerOpen", true);') >= 0, "开底栏时自动打开中间工作区（不会浮在空档里）");
check(src.indexOf("var handleChat = state.centerOpen !== false ?") >= 0, "中间关闭时隐藏 聊天|中间 分栏手柄（没有可拖的分界）");
check(src.indexOf("var centerClosedFlag = false;") >= 0 && src.indexOf("centerClosedFlag = state.centerOpen === false;") >= 0, "中间关闭时右侧栏按可用空间重算上限（聊天只保最小宽度）");

console.log("");
if (failures > 0) {
	console.error(`FAILED: ${failures} 项未通过`);
	process.exit(1);
}
console.log("LAYOUT 2.0.10 TEST PASS ✓");
