/**
 * dsh-ide-panels — host 路由回归测试
 *
 * 不用起应用：直接加载 host 入口，用 stub webServer 捕获路由并调用处理函数。
 * 覆盖本轮修掉的 bug：
 *   1. 搜索 mode="both" 不搜正文（默认模式形同失效）
 *   2. 空 path/dir 静默回退到宿主进程 CWD（把 DSH 安装目录当工作区）
 *   3. /remote 未知 action 悄悄执行默认 wsl ls
 *   4. /pty/kill 不存在的会话返回 ok:true
 *   5. 二进制文件按 UTF-8 读 → 编辑器一屏乱码（含 UTF-16 文本误判）
 *
 * 前提：被测文件是「已部署到 profile」的那份；脚本会校验它与 lib/index.js 一致。
 * 部署：Copy-Item lib\index.js %USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-ide-panels\lib\index.js
 *
 * 运行：node tests/host-routes.test.mjs
 */
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(here, "..", "lib", "index.js");
const PROFILE = join(process.env.USERPROFILE || process.env.HOME || "", ".dsh", "profiles", "desktop");
const DEPLOYED = join(PROFILE, "node_modules", "dsh-ide-panels", "lib", "index.js");

let failures = 0;
function check(ok, label, extra) {
	if (ok) console.log(`  ✓ ${label}`);
	else { console.error(`  ✗ ${label}${extra ? "  → " + extra : ""}`); failures += 1; }
}
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);

if (sha(SOURCE) !== sha(DEPLOYED)) {
	console.error(`部署副本与源码不一致，先复制：\n  Copy-Item "${SOURCE}" "${DEPLOYED}"`);
	process.exit(1);
}
console.log(`被测文件：${DEPLOYED} (sha ${sha(DEPLOYED)})\n`);

/* ── stub webServer：捕获路由 ─────────────────────────────────────── */
const routes = new Map();
const fakeCtx = {
	inject: (_deps, cb) =>
		cb({
			settings: { register: () => {} },
			webServer: {
				register(route) {
					routes.set(route.path, route.handler);
					return () => {};
				}
			}
		})
};
const mod = await import(pathToFileURL(DEPLOYED).href);
mod.apply(fakeCtx);
check(routes.size >= 10, `已捕获 ${routes.size} 条 host 路由`);

/** 调用一个路由处理函数。 */
async function call(path, { method = "GET", body = null } = {}) {
	const base = path.split("?")[0];
	const handler = routes.get(base);
	if (!handler) throw new Error("route not registered: " + base);
	const req = new EventEmitter();
	req.method = method;
	req.url = path;
	req.destroy = () => {};
	const res = {
		status: 0,
		raw: "",
		writeHead(status) { this.status = status; },
		end(chunk) { this.raw = String(chunk ?? ""); }
	};
	const pending = handler(req, res);
	if (body !== null) {
		const payload = typeof body === "string" ? body : JSON.stringify(body);
		setImmediate(() => { req.emit("data", Buffer.from(payload, "utf8")); req.emit("end"); });
	}
	await pending;
	let json = null;
	try { json = res.raw ? JSON.parse(res.raw) : null; } catch { /* 非 JSON */ }
	return { status: res.status, json, raw: res.raw };
}

/* ── 临时工作区 ──────────────────────────────────────────────────── */
const TMP = mkdtempSync(join(tmpdir(), "dsh-host-test-"));
writeFileSync(join(TMP, "only-in-body.txt"), "alpha\nNEEDLE_TOKEN here\nomega\n", "utf8");
writeFileSync(join(TMP, "needle-name.txt"), "nothing here\n", "utf8");
writeFileSync(join(TMP, "plain.txt"), "just text\n", "utf8");
writeFileSync(join(TMP, "bin.dat"), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01, 0x02, 0x03, 0x00]));
writeFileSync(join(TMP, "utf16.txt"), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("UTF16 内容\n", "utf16le")]));

console.log("1) 搜索：默认 both 模式必须能找到正文命中（本次修的 bug）");
{
	const both = await call("/dsh-ui-panels/search", { method: "POST", body: { dir: TMP, query: "needle_token", mode: "both" } });
	const names = (both.json?.results || []).map((r) => r.name);
	check(both.json?.ok === true, "both 模式返回 ok", JSON.stringify(both.json));
	check(names.includes("only-in-body.txt"), "both 模式命中「只在正文里出现」的文件", JSON.stringify(names));
	const byName = await call("/dsh-ui-panels/search", { method: "POST", body: { dir: TMP, query: "needle_token", mode: "name" } });
	check((byName.json?.results || []).length === 0, "name 模式不搜正文（0 命中）", JSON.stringify(byName.json?.results));
	const byContent = await call("/dsh-ui-panels/search", { method: "POST", body: { dir: TMP, query: "needle_token", mode: "content" } });
	check((byContent.json?.results || []).length === 1, "content 模式命中 1 个");
	const nameHit = await call("/dsh-ui-panels/search", { method: "POST", body: { dir: TMP, query: "needle-name", mode: "both" } });
	check((nameHit.json?.results || []).some((r) => r.name === "needle-name.txt"), "both 模式同时保留文件名命中");
	const line = (both.json?.results || []).find((r) => r.name === "only-in-body.txt");
	check(line?.line === 2, "正文命中的行号正确（=2）", "line=" + line?.line);
}

console.log("2) 空 path/dir 不得回退到宿主 CWD");
{
	const s = await call("/dsh-ui-panels/search", { method: "POST", body: { dir: "", query: "x" } });
	check(s.status === 400 && s.json?.ok === false, `search dir="" → 400`, `HTTP ${s.status} ${s.raw.slice(0, 80)}`);
	const d = await call("/dsh-ui-panels/dir?path=");
	check(d.status === 400 && d.json?.ok === false, `dir path="" → 400`, `HTTP ${d.status} ${d.raw.slice(0, 90)}`);
	const gs = await call("/dsh-ui-panels/git-status?path=");
	check(gs.status === 400 && gs.json?.ok === false, `git-status path="" → 400`, `HTTP ${gs.status}`);
	const g = await call("/dsh-ui-panels/git?action=status&path=");
	check(g.status === 400 && g.json?.ok === false, `git path="" → 400`, `HTTP ${g.status}`);
	const c = await call("/dsh-ui-panels/changes?action=list&path=");
	check(c.status === 400 && c.json?.ok === false, `changes path="" → 400（不再在安装目录建快照）`, `HTTP ${c.status}`);
	const d2 = await call("/dsh-ui-panels/dir?path=" + encodeURIComponent(join(TMP, "plain.txt")));
	check(d2.status === 400, "dir 指向文件 → 400");
	const d3 = await call("/dsh-ui-panels/dir?path=" + encodeURIComponent(join(TMP, "nope")));
	check(d3.status === 404, "dir 不存在 → 404");
}

console.log("3) /remote 未知 action 应拒绝");
{
	const r = await call("/dsh-ui-panels/remote?action=bogus");
	check(r.status === 400 && /unknown action/.test(r.json?.error || ""), "remote action=bogus → 400 unknown action", `HTTP ${r.status} ${r.raw.slice(0, 120)}`);
	const ok = await call("/dsh-ui-panels/remote?action=list-ssh");
	check(ok.status === 200, "remote list-ssh 仍正常");
}

console.log("4) /pty/kill 不存在的会话 → 404");
{
	if (!routes.has("/dsh-ui-panels/pty/kill")) {
		check(true, "pty 不可用，跳过", "node-pty 未加载");
	} else {
		const k = await call("/dsh-ui-panels/pty/kill", { method: "POST", body: { id: "pty-__nope__" } });
		check(k.status === 404 && k.json?.ok === false, "kill 未知 id → 404", `HTTP ${k.status} ${k.raw.slice(0, 80)}`);
	}
}

console.log("5) /fs 文本 / UTF-16 / 二进制");
{
	const t = await call("/dsh-ui-panels/fs?path=" + encodeURIComponent(join(TMP, "plain.txt")));
	check(t.json?.ok === true && t.json.text === "just text\n", "普通文本正常读取");
	const u = await call("/dsh-ui-panels/fs?path=" + encodeURIComponent(join(TMP, "utf16.txt")));
	check(u.json?.ok === true && u.json.text === "UTF16 内容\n", "UTF-16LE 文本被正确解码（不再乱码）", JSON.stringify(u.json?.text));
	const b = await call("/dsh-ui-panels/fs?path=" + encodeURIComponent(join(TMP, "bin.dat")));
	check(b.json?.ok === false && b.json.binary === true, "二进制文件被识别并拒绝预览", JSON.stringify(b.json));
	const miss = await call("/dsh-ui-panels/fs?path=" + encodeURIComponent(join(TMP, "nope.txt")));
	check(miss.status === 404, "不存在的文件 → 404");
}

console.log("6) 变更对比端到端（快照 → 改/增/删 → diff）");
{
	const snap = await call("/changes?action=snapshot&path=".replace("/changes", "/dsh-ui-panels/changes") + encodeURIComponent(TMP));
	check(snap.json?.ok === true && snap.json.snapshotted >= 3, `快照 ${snap.json?.snapshotted} 个文件`, JSON.stringify(snap.json));
	const list0 = await call("/dsh-ui-panels/changes?action=list&path=" + encodeURIComponent(TMP));
	check(list0.json?.baseline === true && (list0.json.changed || []).length === 0, "刚快照后无变更");
	writeFileSync(join(TMP, "plain.txt"), "just text CHANGED\n", "utf8");
	writeFileSync(join(TMP, "added.txt"), "new\n", "utf8");
	rmSync(join(TMP, "only-in-body.txt"));
	const list1 = await call("/dsh-ui-panels/changes?action=list&path=" + encodeURIComponent(TMP));
	const st = Object.fromEntries((list1.json?.changed || []).map((c) => [c.path.replace(/\\/g, "/"), c.status]));
	check(st["plain.txt"] === "M", "改动检测为 M", JSON.stringify(st));
	check(st["added.txt"] === "A", "新增检测为 A");
	check(st["only-in-body.txt"] === "D", "删除检测为 D");
	const diff = await call("/dsh-ui-panels/changes?action=diff&path=" + encodeURIComponent(TMP) + "&file=plain.txt");
	check(diff.json?.ok === true && /CHANGED/.test(diff.json.new || "") && (diff.json.lines || []).includes(1), "diff 返回新旧内容与新增行号", JSON.stringify(diff.json?.lines));
}

console.log("7) 基础路由仍然正常");
{
	const d = await call("/dsh-ui-panels/dir?path=" + encodeURIComponent(TMP));
	const names = (d.json?.entries || []).map((e) => e.name);
	check(d.json?.ok === true && names.includes("plain.txt"), "dir 列目录正常");
	check((d.json?.entries || []).every((e) => !e.name.startsWith(".")), "dir 过滤隐藏文件", JSON.stringify(names));
	const pl = await call("/dsh-ui-panels/plugins");
	check(pl.json?.ok === true && Array.isArray(pl.json.plugins) && pl.json.plugins.length > 0, `plugins 列表 ${pl.json?.plugins?.length} 项`);
	const w = await call("/dsh-ui-panels/fs", { method: "POST", body: { path: join(TMP, "written.txt"), content: "written ok" } });
	const r = await call("/dsh-ui-panels/fs?path=" + encodeURIComponent(join(TMP, "written.txt")));
	check(w.json?.ok === true && r.json?.text === "written ok", "fs 写后读回一致");
	const bad = await call("/dsh-ui-panels/fs", { method: "POST", body: { path: join(TMP, "written.txt") } });
	check(bad.status === 400, "fs 缺少 content 参数 → 400");
}

rmSync(TMP, { recursive: true, force: true });

console.log("");
if (failures > 0) {
	console.error(`FAILED: ${failures} 项未通过`);
	process.exit(1);
}
console.log("HOST ROUTES TEST PASS ✓");
/* node-pty 是原生模块，加载后事件循环不会自然退出 —— 显式收尾 */
process.exit(0);
