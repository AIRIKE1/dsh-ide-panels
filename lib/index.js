/**
 * dsh-ide-panels — 主机（Node）侧入口。
 *
 * 职责：
 *  1. 把 "ui-panels" 设置命名空间注册进 Host settings 文档（外壳状态持久化）；
 *  2. 提供「插件管理」HTTP 路由（由客户端扩展管理视图调用）：
 *     · GET  /dsh-ui-panels/plugins          → 列出已安装插件（名称/版本/描述/GitHub/启用态）
 *     · POST /dsh-ui-panels/plugins/toggle   → 启用/禁用某个插件（改写 profile 的 dsh.profile.bundles，重启生效）
 *
 * 插件启用/禁用原理：desktop profile 的 package.json 中 dsh.profile.bundles 数组
 * 决定启动时加载哪些 bundle。本模块直接读写该文件（本文件位于
 * <profile>/node_modules/dsh-ide-panels/lib/，向上三级即 profile 根）。
 */
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, appendFileSync, mkdirSync, rmSync, openSync, readSync, closeSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, exec } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
/** node-pty 来自 desktop profile 的 node_modules（better-sidebar 的依赖）。 */
let pty = null;
try {
  pty = require("node-pty");
} catch {
  pty = null;
}
/** 真实 PowerShell 终端会话表（id → pty 实例）。 */
const ptySessions = new Map();
/** 单个终端的输出缓冲上限（字符）：超出丢弃最旧部分，避免长时间不读时内存无界增长。 */
const MAX_PTY_BUFFER = 1024 * 1024;
let ptySeq = 0;

export const name = "dsh-ide-panels";

/** 本插件持有的设置命名空间（客户端 settingsScope.bind 使用同一命名空间）。
 * 注意：DSH 强制命名空间全小写（/^[a-z][a-z0-9-]*$/），必须用 kebab-case，否则启动即失败。 */
const SETTINGS_NAMESPACE = settingsNamespace("ui-panels");

/** 持久化 schema：外壳整体开关、右侧栏/底部面板开关、各侧当前选中视图、底部是否展开、中间标签页（多开实例）。
 * 注意：openTabs 用 z.any() 的宽松数组 —— schemastery 校验失败会让 settings.register() 抛错，
 * 结果整个命名空间注册不上（客户端 status=unavailable），面板状态从此既不保存也不恢复。
 * v0.1.0 存的是 string[]、v0.1.1 改成对象数组，旧数据正好会踩这个坑。
 * 真正的类型校验由客户端 mergeState 做（逐字段 typeof 检查），这里宽松不损失安全性。 */
const PanelsSettingsSchema = z.object({
  open: z.boolean().default(true),
  rightOpen: z.boolean().default(true),
  bottomOpen: z.boolean().default(true),
  bottomExpanded: z.boolean().default(false),
  centerOpen: z.boolean().default(true),
  bottomHeight: z.number().default(200),
  rightView: z.string().default("explorer"),
  bottomView: z.string().default("terminal"),
  centerView: z.string().default(""),
  openTabs: z.array(z.any()).default([])
});

/** 兜底 schema：连上面那份都注册不上时（例如持久化文档里有类型完全对不上的字段），
 * 用"全部宽松"的版本再试一次，保证命名空间一定可用。 */
const PanelsSettingsLooseSchema = z.object({
  open: z.any(),
  rightOpen: z.any(),
  bottomOpen: z.any(),
  bottomExpanded: z.any(),
  centerOpen: z.any(),
  bottomHeight: z.any(),
  rightView: z.any(),
  bottomView: z.any(),
  centerView: z.any(),
  openTabs: z.any()
});

/* =====================================================================
 * 插件管理（profile bundles 读写）
 * =================================================================== */
/** 本插件自身（不允许禁用自己，否则没有入口再启用）。 */
const SELF_NAME = "dsh-ide-panels";
/** 本文件位于 <profile>/node_modules/dsh-ide-panels/lib/ → 向上三级即 profile 根。 */
const PROFILE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PROFILE_PKG_PATH = join(PROFILE_ROOT, "package.json");
const NODE_MODULES_DIR = join(PROFILE_ROOT, "node_modules");

function readProfilePkg() {
  // PowerShell 写入的文件可能带 UTF-8 BOM，读取时剥离
  return JSON.parse(readFileSync(PROFILE_PKG_PATH, "utf8").replace(/^\uFEFF/, ""));
}
function writeProfilePkg(pkg) {
  writeFileSync(PROFILE_PKG_PATH, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}
function bundlesOf(pkg) {
  return Array.isArray(pkg?.dsh?.profile?.bundles) ? pkg.dsh.profile.bundles : [];
}
function isDirectory(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}
/** 是否为 DSH 插件包（含 dsh.client 或 dsh.bundle 声明）。 */
function isPluginDir(dir) {
  const pkgPath = join(NODE_MODULES_DIR, dir, "package.json");
  if (!existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    return Boolean(pkg.dsh && (pkg.dsh.bundle?.patch || pkg.dsh.client));
  } catch {
    return false;
  }
}
/** 规整仓库地址为可点击的 GitHub URL。 */
function normalizeGithub(raw) {
  if (!raw || typeof raw !== "string") return null;
  let out = raw.replace(/^git\+/, "").replace(/\.git$/, "");
  if (/^https?:\/\//.test(out)) return out;
  if (out.startsWith("github:")) return "https://github.com/" + out.slice(7);
  if (out.startsWith("git@github.com:")) return "https://github.com/" + out.slice(15);
  if (out.includes("/")) return "https://github.com/" + out.replace(/^\/+/, "");
  return null;
}
function pluginMeta(name, enabled, system) {
  const pkgPath = join(NODE_MODULES_DIR, name, "package.json");
  let version = "";
  let description = "";
  let repository = null;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    version = pkg.version ?? "";
    description = pkg.description ?? "";
    repository = normalizeGithub(typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url ?? null);
  } catch {
    /* 系统包不在 profile node_modules，保持空元数据 */
  }
  return { name, version, description, repository, enabled, system, self: name === SELF_NAME };
}
/** 扫描 profile node_modules 下的顶层包名（含 @scope/name 形式）。 */
function scanModuleDirs() {
  const out = [];
  if (!isDirectory(NODE_MODULES_DIR)) return out;
  for (const entry of readdirSync(NODE_MODULES_DIR)) {
    if (entry.startsWith(".")) continue;
    const full = join(NODE_MODULES_DIR, entry);
    if (!isDirectory(full)) continue;
    if (entry.startsWith("@")) {
      for (const sub of readdirSync(full)) {
        if (sub.startsWith(".")) continue;
        out.push(entry + "/" + sub);
      }
    } else {
      out.push(entry);
    }
  }
  return out;
}
/** 列出全部已安装插件：先 bundles（启用），再 node_modules 里的插件包（未启用）。 */
function listPlugins() {
  const pkg = readProfilePkg();
  const bundles = bundlesOf(pkg);
  const seen = new Set();
  const plugins = [];
  for (const name of bundles) {
    if (seen.has(name) || typeof name !== "string") continue;
    seen.add(name);
    const system = !isDirectory(join(NODE_MODULES_DIR, name));
    plugins.push(pluginMeta(name, true, system));
  }
  for (const dir of scanModuleDirs()) {
    if (seen.has(dir)) continue;
    if (isPluginDir(dir)) {
      seen.add(dir);
      plugins.push(pluginMeta(dir, false, false));
    }
  }
  return plugins;
}
/** 启用/禁用：改写 profile bundles。系统包与本插件自身拒绝操作。 */
function togglePlugin(name, enabled) {
  if (name === SELF_NAME) throw new Error("不能禁用插件管理外壳自身（dsh-ide-panels）");
  const pkg = readProfilePkg();
  if (!isDirectory(join(NODE_MODULES_DIR, name))) {
    throw new Error(`"${name}" 是系统内置包，不允许在此处禁用`);
  }
  pkg.dsh ??= {};
  pkg.dsh.profile ??= {};
  pkg.dsh.profile.bundles ??= [];
  const bundles = pkg.dsh.profile.bundles;
  const idx = bundles.indexOf(name);
  if (enabled && idx < 0) bundles.push(name);
  if (!enabled && idx >= 0) bundles.splice(idx, 1);
  writeProfilePkg(pkg);
  return { name, enabled, restartRequired: true, profile: PROFILE_PKG_PATH };
}

/** 注册插件管理路由（disposer 由调用方持有）。 */
/** 诊断日志：客户端通过 /dsh-ui-panels/diag POST 状态/错误，写入 profile 下 jsonl（便于排查运行期问题）。 */
const DIAG_PATH = join(PROFILE_ROOT, "dsh-ui-panels-diag.jsonl");
function appendDiag(payload) {
  try {
    const line = JSON.stringify(Object.assign({ ts: Date.now() }, payload)) + "\n";
    appendFileSync(DIAG_PATH, line, "utf8");
    try {
      if (statSync(DIAG_PATH).size > 1024 * 1024) {
        const tail = readFileSync(DIAG_PATH, "utf8").split("\n").slice(-600).join("\n");
        writeFileSync(DIAG_PATH, tail, "utf8");
      }
    } catch { /* 忽略截断失败 */ }
  } catch { /* 忽略诊断写入失败 */ }
}

function registerPluginRoutes(webServer) {
  const send = (res, status, data) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(data));
  };
  const readBody = (req) =>
    new Promise((resolveBody, rejectBody) => {
      const chunks = [];
      req.on("data", (chunk) => {
        chunks.push(chunk);
        if (chunks.reduce((n, c) => n + c.length, 0) > 1024 * 1024) {
          rejectBody(new Error("body too large"));
          req.destroy();
        }
      });
      req.on("end", () => {
        try {
          const text = Buffer.concat(chunks).toString("utf8").trim();
          resolveBody(text ? JSON.parse(text) : {});
        } catch (e) {
          rejectBody(e);
        }
      });
      req.on("error", rejectBody);
    });
  const disposers = [];
  /* 文件读写：中间「编辑器」视图使用。GET /dsh-ui-panels/fs?path=<绝对路径> 读取；POST {path, content} 写入。 */
  disposers.push(
    webServer.register({
      kind: "exact",
      path: "/dsh-ui-panels/fs",
      handler: async (req, res) => {
        try {
          if (req.method === "POST") {
            const body = await readBody(req);
            if (!body || typeof body.path !== "string" || typeof body.content !== "string") {
              return send(res, 400, { ok: false, error: "path (string) and content (string) are required" });
            }
            const full = resolve(body.path);
            if (isDirectory(full)) return send(res, 400, { ok: false, error: "is a directory: " + full });
            writeFileSync(full, body.content, "utf8");
            return send(res, 200, { ok: true, path: full, size: Buffer.byteLength(body.content, "utf8") });
          }
          if (req.method !== "GET") return send(res, 405, { ok: false, error: "method not allowed" });
          const url = new URL(req.url, "http://localhost");
          const target = url.searchParams.get("path") || "";
          if (!target) return send(res, 400, { ok: false, error: "path required" });
          const full = resolve(target);
          if (!existsSync(full)) return send(res, 404, { ok: false, error: "file not found: " + full });
          if (isDirectory(full)) return send(res, 400, { ok: false, error: "is a directory: " + full });
          const stat = statSync(full);
          const MAX_READ = 512 * 1024;
          /* 只读需要的字节：旧实现 readFileSync 整个文件再截断，打开一个 1GB 日志会直接吃掉 1GB 内存 */
          const need = Math.min(stat.size, MAX_READ);
          const raw = Buffer.allocUnsafe(need);
          let got = 0;
          const fd = openSync(full, "r");
          try {
            while (got < need) {
              const n = readSync(fd, raw, got, need - got, got);
              if (n <= 0) break;
              got += n;
            }
          } finally {
            closeSync(fd);
          }
          const truncated = stat.size > got;
          const buf = raw.subarray(0, got);
          /* 二进制检测：图片/可执行文件直接按 UTF-8 读会在编辑器里显示一整屏乱码。
           * 例外：带 BOM 的 UTF-16 文本按 UTF-16 正确解码（PowerShell 默认导出的就是这种）。 */
          let text = null;
          if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
            text = buf.subarray(2).toString("utf16le");
          } else if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
            const swapped = Buffer.from(buf.subarray(2));
            swapped.swap16();
            text = swapped.toString("utf16le");
          } else {
            const probe = buf.subarray(0, 8192);
            if (probe.includes(0)) {
              return send(res, 200, { ok: false, binary: true, path: full, size: raw.length, error: "二进制文件，编辑器不支持预览（" + stat.size + " 字节）" });
            }
            text = buf.toString("utf8");
          }
          send(res, 200, { ok: true, path: full, size: raw.length, truncated, text });
        } catch (e) {
          send(res, 500, { ok: false, error: String(e?.message ?? e) });
        }
      }
    })
  );
  /* 代码变更：git 状态。GET /dsh-ui-panels/git-status?path=<工作区> */
  disposers.push(
    webServer.register({
      kind: "exact",
      path: "/dsh-ui-panels/git-status",
      handler: (req, res) => {
        try {
          if (req.method !== "GET") return send(res, 405, { ok: false, error: "method not allowed" });
          const url = new URL(req.url, "http://localhost");
          const gsRaw = String(url.searchParams.get("path") || "").trim();
          if (!gsRaw) return send(res, 400, { ok: false, error: "path required" });
          const target = resolve(gsRaw);
          if (!existsSync(target)) return send(res, 400, { ok: false, error: "path required or not found" });
          exec(`git -C "${target}" status --porcelain -z`, { timeout: 15000, windowsHide: true }, (err, stdout) => {
            if (err) {
              return send(res, 200, { ok: false, error: String(err.message || err), repo: false });
            }
            const changed = [];
            const tokens = stdout.split("\0");
            for (const t of tokens) {
              if (!t) continue;
              const status = t.slice(0, 2).trim();
              const path = t.slice(3);
              if (path) changed.push({ path, status: status || "??" });
            }
            send(res, 200, { ok: true, repo: true, changed });
          });
        } catch (e) {
          send(res, 500, { ok: false, error: String(e?.message ?? e) });
        }
      }
    })
  );
  /* 用系统默认程序打开文件（编辑器「在外部打开」）。POST {path} */
  disposers.push(
    webServer.register({
      kind: "exact",
      path: "/dsh-ui-panels/open-external",
      handler: async (req, res) => {
        try {
          if (req.method !== "POST") return send(res, 405, { ok: false, error: "method not allowed" });
          const body = await readBody(req);
          if (!body || typeof body.path !== "string") return send(res, 400, { ok: false, error: "path required" });
          const full = resolve(body.path);
          if (!existsSync(full)) return send(res, 404, { ok: false, error: "not found: " + full });
          exec(`start "" "${full}"`, { windowsHide: true, shell: "cmd.exe" }, (err) => {
            if (err) return send(res, 500, { ok: false, error: String(err.message || err) });
            send(res, 200, { ok: true });
          });
        } catch (e) {
          send(res, 500, { ok: false, error: String(e?.message ?? e) });
        }
      }
    })
  );
  /* 搜索：本地文件搜索（不依赖 agent）。POST {dir, query, mode: name|content|both} */
  disposers.push(
    webServer.register({
      kind: "exact",
      path: "/dsh-ui-panels/search",
      handler: async (req, res) => {
        try {
          if (req.method !== "POST") return send(res, 405, { ok: false, error: "method not allowed" });
          const body = await readBody(req);
          const dirRaw = String(body?.dir || "").trim();
          const query = String(body?.query || "").toLowerCase();
          const mode = body?.mode || "both";
          /* 空 dir 绝不能回退到宿主进程 CWD（那会把 DSH 安装目录当成工作区搜） */
          if (!dirRaw || !query) {
            return send(res, 400, { ok: false, error: "dir (directory) and query (string) are required" });
          }
          const dir = resolve(dirRaw);
          if (!existsSync(dir) || !isDirectory(dir)) {
            return send(res, 404, { ok: false, error: "not a directory: " + dir });
          }
          const SKIP_DIRS = new Set(["node_modules", ".git", ".dsh", ".cache", "dist", "build", ".venv", "__pycache__", ".next", ".turbo", "bin", "obj"]);
          const TEXT_EXT = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".md", ".txt", ".html", ".css", ".scss", ".less", ".yml", ".yaml", ".xml", ".py", ".java", ".c", ".h", ".cpp", ".hpp", ".cs", ".go", ".rs", ".rb", ".php", ".sh", ".ps1", ".bat", ".ini", ".cfg", ".conf", ".toml", ".sql", ".vue", ".svelte", ".astro", ".env", ".log", ".gitignore", ".dockerignore", ".editorconfig"]);
          const results = [];
          const MAX_FILES = 4000, MAX_DEPTH = 12;
          let scanned = 0;
          function walk(d, depth) {
            if (depth > MAX_DEPTH || scanned > MAX_FILES) return;
            let entries;
            try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
            for (const e of entries) {
              if (scanned > MAX_FILES) return;
              const name = e.name;
              if (SKIP_DIRS.has(name)) continue;
              const full = join(d, name);
              if (e.isDirectory()) { walk(full, depth + 1); continue; }
              scanned++;
              const nameMatch = mode !== "content" && name.toLowerCase().includes(query);
              let line = 0, snippet = "";
              /* 注意：这里只按模式判断是否读正文 —— 之前写成 (nameMatch || mode==="content")，
               * 导致默认的 "both" 模式只对"文件名已命中"的文件搜正文，正文搜索形同失效。 */
              if (mode !== "name") {
                const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
                if (TEXT_EXT.has(ext) || !ext) {
                  try {
                    const raw = readFileSync(full);
                    const head = raw.subarray(0, 64 * 1024).toString("utf8");
                    const lines = head.split("\n");
                    for (let i = 0; i < lines.length; i++) {
                      if (lines[i].toLowerCase().includes(query)) { line = i + 1; snippet = lines[i].slice(0, 180).trim(); break; }
                    }
                  } catch { /* 忽略不可读 */ }
                }
              }
              if (nameMatch || line > 0) results.push({ path: full, name, line, snippet });
            }
          }
          walk(dir, 0);
          results.sort((a, b) => a.name.localeCompare(b.name));
          send(res, 200, { ok: true, dir, query, scanned, results: results.slice(0, 500) });
        } catch (e) {
          send(res, 500, { ok: false, error: String(e?.message ?? e) });
        }
      }
    })
  );
  /* Git 源代码管理：status/diff/log + stage/unstage/commit/checkout。GET action=…&path=… */
  disposers.push(
    webServer.register({
      kind: "exact",
      path: "/dsh-ui-panels/git",
      handler: async (req, res) => {
        try {
          const url = new URL(req.url, "http://localhost");
          const action = url.searchParams.get("action") || "status";
          const pathRaw = String(url.searchParams.get("path") || "").trim();
          if (!pathRaw) return send(res, 400, { ok: false, error: "path required" });
          const target = resolve(pathRaw);
          if (!existsSync(target)) return send(res, 400, { ok: false, error: "path required" });
          const runGit = (args) => new Promise((resolveRun) => {
            exec(`git -C "${target}" ${args}`, { timeout: 20000, windowsHide: true, maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => {
              resolveRun({ err, stdout: String(stdout || ""), stderr: String(stderr || "") });
            });
          });
          if (req.method === "GET") {
            if (action === "status") {
              const { err, stdout } = await runGit("status --porcelain -z");
              if (err) return send(res, 200, { ok: false, error: "not a git repository", repo: false });
              const changed = [];
              for (const t of stdout.split("\0")) {
                if (!t) continue;
                const xy = t.slice(0, 2);
                const p = t.slice(3);
                if (p) changed.push({ path: p, status: xy.trim() || "??", staged: xy[0] !== " " && xy[0] !== "?" && xy[0] !== "!" });
              }
              return send(res, 200, { ok: true, repo: true, changed });
            }
            if (action === "init") {
              const { err, stderr } = await runGit("init");
              return send(res, 200, { ok: !err, error: err ? String(stderr || err.message) : undefined });
            }
            if (action === "diff") {
              const file = url.searchParams.get("file") || "";
              const staged = url.searchParams.get("staged") === "1";
              const { err, stdout } = await runGit(`${staged ? "--cached " : ""}diff --unified=3 ${file ? `-- "${file}"` : ""}`);
              if (err) return send(res, 200, { ok: false, error: String(err.message || err) });
              return send(res, 200, { ok: true, diff: stdout });
            }
            /* 变更对比：HEAD 版本内容（旧）。GET action=show&file=… */
            if (action === "show") {
              const file = url.searchParams.get("file") || "";
              if (!file) return send(res, 400, { ok: false, error: "file required" });
              const { err, stdout } = await runGit(`show "HEAD:${file.replace(/"/g, '\\"')}"`);
              return send(res, 200, { ok: !err, content: err ? "" : stdout });
            }
            /* 变更对比：新增行号列表（基于 git diff --unified=0）。GET action=diffnum&file=… */
            if (action === "diffnum") {
              const file = url.searchParams.get("file") || "";
              const staged = url.searchParams.get("staged") === "1";
              if (!file) return send(res, 400, { ok: false, error: "file required" });
              const { err, stdout } = await runGit(`${staged ? "--cached " : ""}diff --unified=0 -- "${file}"`);
              if (err) return send(res, 200, { ok: false, error: String(err.message || err), lines: [] });
              const lines = [];
              const re = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm;
              let m;
              while ((m = re.exec(stdout)) !== null) {
                const start = parseInt(m[1], 10);
                const count = m[2] ? parseInt(m[2], 10) : 1;
                for (let i = 0; i < count; i++) lines.push(start + i);
              }
              return send(res, 200, { ok: true, lines });
            }
            if (action === "log") {
              const { err, stdout } = await runGit("log --oneline -20");
              if (err) return send(res, 200, { ok: false, error: String(err.message || err) });
              const log = stdout.split("\n").filter(Boolean).map((l) => {
                const sp = l.indexOf(" ");
                return { hash: sp > 0 ? l.slice(0, sp) : l, msg: sp > 0 ? l.slice(sp + 1) : "" };
              });
              return send(res, 200, { ok: true, log });
            }
            return send(res, 400, { ok: false, error: "unknown action: " + action });
          }
          if (req.method === "POST") {
            const body = await readBody(req);
            if (action === "stage") {
              const file = body?.all ? "-A" : `"${body?.file || ""}"`;
              const { err, stderr } = await runGit(`add ${file}`);
              return send(res, 200, { ok: !err, error: err ? String(stderr || err.message) : undefined });
            }
            if (action === "unstage") {
              const { err, stderr } = await runGit(`reset -- "${body?.file || ""}"`);
              return send(res, 200, { ok: !err, error: err ? String(stderr || err.message) : undefined });
            }
            if (action === "commit") {
              const msg = String(body?.message || "").trim();
              if (!msg) return send(res, 400, { ok: false, error: "commit message required" });
              const { err, stderr } = await runGit(`commit -m "${msg.replace(/"/g, "'")}"`);
              return send(res, 200, { ok: !err, error: err ? String(stderr || err.message) : undefined });
            }
            if (action === "checkout") {
              const file = body?.file;
              if (!file) return send(res, 400, { ok: false, error: "file required" });
              const { err, stderr } = await runGit(`checkout -- "${file}"`);
              return send(res, 200, { ok: !err, error: err ? String(stderr || err.message) : undefined });
            }
            return send(res, 400, { ok: false, error: "unknown action: " + action });
          }
          return send(res, 405, { ok: false, error: "method not allowed" });
        } catch (e) {
          send(res, 500, { ok: false, error: String(e?.message ?? e) });
        }
      }
    })
  );
  /* 代码变更（本地文件对比，不依赖 git）：基于 <dir>/.dsh-changes/ 快照。
   *   GET ?action=snapshot&path=<dir> → 备份全部文本文件为基线
   *   GET ?action=list&path=<dir>      → 对比快照，返回 changed [{path, status: M|A|D}]
   *   GET ?action=diff&path=<dir>&file=<rel> → {old, new, lines(新增行号)} */
  disposers.push(
    webServer.register({
      kind: "exact",
      path: "/dsh-ui-panels/changes",
      handler: async (req, res) => {
        try {
          if (req.method !== "GET") return send(res, 405, { ok: false, error: "method not allowed" });
          const url = new URL(req.url, "http://localhost");
          const action = url.searchParams.get("action") || "list";
          const chRaw = String(url.searchParams.get("path") || "").trim();
          /* 空 path 不能回退到宿主 CWD —— 否则会在 DSH 安装目录里建 .dsh-changes 快照 */
          if (!chRaw) return send(res, 400, { ok: false, error: "path required" });
          const dir = resolve(chRaw);
          if (!existsSync(dir) || !isDirectory(dir)) return send(res, 400, { ok: false, error: "path required" });
          const snapDir = join(dir, ".dsh-changes");
          const TEXT_EXT = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".md", ".txt", ".html", ".css", ".scss", ".less", ".yml", ".yaml", ".xml", ".py", ".java", ".c", ".h", ".cpp", ".hpp", ".cs", ".go", ".rs", ".rb", ".php", ".sh", ".ps1", ".bat", ".ini", ".cfg", ".conf", ".toml", ".sql", ".vue", ".svelte", ".astro", ".env", ".log", ".gitignore", ".editorconfig"]);
          const SKIP_DIRS = new Set(["node_modules", ".git", ".dsh", ".dsh-changes", ".cache", "dist", "build", ".venv", "__pycache__", ".next", ".turbo", "bin", "obj"]);
          const isText = (name) => { const e = name.slice(name.lastIndexOf(".")).toLowerCase(); return TEXT_EXT.has(e) || e === ""; };
          const MAX_FILES = 4000;

          if (action === "snapshot") {
            rmSync(snapDir, { recursive: true, force: true });
            mkdirSync(snapDir, { recursive: true });
            let count = 0;
            function walk(d) {
              if (count > MAX_FILES) return;
              let entries;
              try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
              for (const e of entries) {
                if (count > MAX_FILES) return;
                const name = e.name;
                if (SKIP_DIRS.has(name)) continue;
                const full = join(d, name);
                if (e.isDirectory()) { walk(full); continue; }
                if (!isText(name)) continue;
                try {
                  const raw = readFileSync(full);
                  if (raw.length > 512 * 1024) continue;
                  const rel = full.slice(dir.length + 1);
                  const dest = join(snapDir, rel);
                  mkdirSync(dirname(dest), { recursive: true });
                  writeFileSync(dest, raw);
                  count++;
                } catch { /* 忽略 */ }
              }
            }
            walk(dir);
            return send(res, 200, { ok: true, snapshotted: count, dir });
          }

          if (action === "list") {
            if (!existsSync(snapDir)) return send(res, 200, { ok: true, baseline: false, changed: [] });
            const changed = [];
            const snapFiles = [];
            function walkSnap(d) {
              let entries;
              try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
              for (const e of entries) {
                const full = join(d, e.name);
                if (e.isDirectory()) { walkSnap(full); continue; }
                snapFiles.push(full.slice(snapDir.length + 1));
              }
            }
            walkSnap(snapDir);
            const seen = new Set();
            for (const rel of snapFiles) {
              const cur = join(dir, rel);
              seen.add(rel);
              if (!existsSync(cur)) { changed.push({ path: rel, status: "D" }); continue; }
              try {
                const a = readFileSync(join(snapDir, rel));
                const b = readFileSync(cur);
                if (!a.equals(b)) changed.push({ path: rel, status: "M" });
              } catch { /* 忽略 */ }
            }
            /* 新增：当前目录里的文本文件不在快照中 */
            let scanned = 0;
            function walkCur(d) {
              if (scanned > MAX_FILES) return;
              let entries;
              try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
              for (const e of entries) {
                if (scanned > MAX_FILES) return;
                const name = e.name;
                if (SKIP_DIRS.has(name)) continue;
                const full = join(d, name);
                if (e.isDirectory()) { walkCur(full); continue; }
                if (!isText(name)) continue;
                scanned++;
                const rel = full.slice(dir.length + 1);
                if (!seen.has(rel)) changed.push({ path: rel, status: "A" });
              }
            }
            walkCur(dir);
            return send(res, 200, { ok: true, baseline: true, changed });
          }

          if (action === "diff") {
            const file = url.searchParams.get("file") || "";
            if (!file) return send(res, 400, { ok: false, error: "file required" });
            const cur = join(dir, file);
            const snap = join(snapDir, file);
            const newT = existsSync(cur) ? readFileSync(cur).toString("utf8") : "";
            const oldT = existsSync(snap) ? readFileSync(snap).toString("utf8") : "";
            /* 简单行 diff（前缀/后缀匹配）：中间差异行视为新增 */
            const a = oldT.split("\n");
            const b = newT.split("\n");
            let p = 0;
            while (p < a.length && p < b.length && a[p] === b[p]) p++;
            let s = 0;
            while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
            const lines = [];
            for (let i = p; i < b.length - s; i++) lines.push(i + 1);
            return send(res, 200, { ok: true, old: oldT, new: newT, lines });
          }

          return send(res, 400, { ok: false, error: "unknown action: " + action });
        } catch (e) {
          send(res, 500, { ok: false, error: String(e?.message ?? e) });
        }
      }
    })
  );
  /* 远程资源管理器：WSL / SSH。GET /dsh-ui-panels/remote
   *   ?action=list-ssh → 读 ~/.ssh/config 的 Host 列表
   *   ?action=list-wsl → wsl -l 发行版列表
   *   ?provider=wsl|ssh&path=…&host=… → 列目录 */
  disposers.push(
    webServer.register({
      kind: "exact",
      path: "/dsh-ui-panels/remote",
      handler: (req, res) => {
        try {
          if (req.method !== "GET") return send(res, 405, { ok: false, error: "method not allowed" });
          const url = new URL(req.url, "http://localhost");
          const action = url.searchParams.get("action") || "ls";
          if (action !== "list-ssh" && action !== "list-wsl" && action !== "ls") {
            return send(res, 400, { ok: false, error: "unknown action: " + action });
          }
          if (action === "list-ssh") {
            const sshConfig = join(process.env.USERPROFILE || process.env.HOME || "", ".ssh", "config");
            const hosts = [];
            try {
              if (existsSync(sshConfig)) {
                const lines = readFileSync(sshConfig, "utf8").split("\n");
                for (const line of lines) {
                  const m = /^\s*Host\s+(.+)\s*$/i.exec(line);
                  if (m) {
                    for (const h of m[1].split(/\s+/)) {
                      if (h && h !== "*" && h.indexOf("!") !== 0) hosts.push(h);
                    }
                  }
                }
              }
            } catch { /* 忽略 */ }
            return send(res, 200, { ok: true, hosts: hosts.slice(0, 100) });
          }
          if (action === "list-wsl") {
            exec(`wsl -l -q`, { timeout: 8000, windowsHide: true, maxBuffer: 1024 * 1024 }, (err, stdout) => {
              if (err) return send(res, 200, { ok: false, error: String(err.message || err), distros: [] });
              const distros = String(stdout).split("\n").map((s) => s.replace(/\r/g, "").trim()).filter(Boolean);
              return send(res, 200, { ok: true, distros });
            });
            return;
          }
          const provider = url.searchParams.get("provider") || "wsl";
          const remotePath = url.searchParams.get("path") || "/home";
          const host = url.searchParams.get("host") || "";
          const cmd = provider === "ssh"
            ? (host ? `ssh -o BatchMode=yes -o ConnectTimeout=8 ${host} "ls -la --group-directories-first '${remotePath}'"` : null)
            : `wsl -e sh -c "ls -la --group-directories-first '${remotePath}'"`;
          if (!cmd) return send(res, 400, { ok: false, error: "host required for ssh" });
          exec(cmd, { timeout: 12000, windowsHide: true, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) return send(res, 200, { ok: false, error: String(stderr || err.message || err) });
            const entries = [];
            for (const line of String(stdout).split("\n")) {
              const m = /^([d\-l])[rwxSstT\-]{9}\s+\d+\s+\S+\s+\S+\s+(\d+)\s+([A-Za-z]{3}\s+\d+\s+[\d:]+)\s+(.+)$/.exec(line.trim());
              if (m) {
                const name = m[4];
                if (name === "." || name === "..") continue;
                entries.push({ name, dir: m[1] === "d", size: parseInt(m[2], 10) || 0, time: m[3], link: m[1] === "l" });
              }
            }
            send(res, 200, { ok: true, provider, path: remotePath, host, entries });
          });
        } catch (e) {
          send(res, 500, { ok: false, error: String(e?.message ?? e) });
        }
      }
    })
  );
  /* 真实 PowerShell 终端（node-pty）。 */
  if (pty) {
    disposers.push(
      webServer.register({
        kind: "exact",
        path: "/dsh-ui-panels/pty/start",
        handler: async (req, res) => {
          try {
            if (req.method !== "POST") return send(res, 405, { ok: false, error: "method" });
            const body = await readBody(req);
            const cwd = body?.cwd && existsSync(body.cwd) ? resolve(body.cwd) : process.cwd();
            const id = "pty-" + (++ptySeq);
            const shell = process.platform === "win32" ? "powershell.exe" : (process.env.SHELL || "/bin/bash");
            const proc = pty.spawn(shell, [], {
              name: "xterm-256color",
              cols: 100,
              rows: 24,
              cwd,
              env: process.env,
              // 完整 Electron 主进程/工具进程下 ConPTY 的数据事件可能不触发（winpty 后端用管道，更稳）。
              useConpty: false
            });
            // 注意：必须用可变对象承载 buffer（onData 更新 session.buffer），
            // 不能把闭包变量直接放进对象（那是值拷贝，read 永远读到空串）。
            const session = { proc, buffer: "", exited: false, base: 0 };
            proc.onData((data) => {
              session.buffer += data;
              /* 缓冲区封顶：终端长时间不轮询（切标签/最小化）时输出会一直攒，旧实现无上限 → 内存无界增长。
               * 丢弃最旧的部分并用 base 记录已丢长度，read 时把 since 平移即可。 */
              if (session.buffer.length > MAX_PTY_BUFFER) {
                const drop = session.buffer.length - MAX_PTY_BUFFER;
                session.buffer = session.buffer.slice(drop);
                session.base += drop;
              }
            });
            proc.onExit(({ exitCode }) => { session.buffer += `\r\n[进程退出 code=${exitCode}]`; session.exited = true; });
            ptySessions.set(id, session);
            send(res, 200, { ok: true, id, cwd, shell });
          } catch (e) {
            send(res, 500, { ok: false, error: String(e?.message ?? e) });
          }
        }
      })
    );
    disposers.push(
      webServer.register({
        kind: "exact",
        path: "/dsh-ui-panels/pty/read",
        handler: (req, res) => {
          try {
            const url = new URL(req.url, "http://localhost");
            const id = url.searchParams.get("id") || "";
            const since = parseInt(url.searchParams.get("since") || "0", 10);
            const session = ptySessions.get(id);
            if (!session) return send(res, 404, { ok: false, error: "pty not found" });
            /* base = 已被缓冲区裁剪掉的字符数；客户端的 since 落在裁剪区时从头给（会跳一段，但不会死循环） */
            const start = Math.max(0, since - session.base);
            const out = start < session.buffer.length ? session.buffer.slice(start) : "";
            send(res, 200, { ok: true, out, at: session.base + session.buffer.length, base: session.base });
          } catch (e) {
            send(res, 500, { ok: false, error: String(e?.message ?? e) });
          }
        }
      })
    );
    disposers.push(
      webServer.register({
        kind: "exact",
        path: "/dsh-ui-panels/pty/write",
        handler: async (req, res) => {
          try {
            if (req.method !== "POST") return send(res, 405, { ok: false, error: "method" });
            const body = await readBody(req);
            const session = ptySessions.get(body?.id);
            if (!session) return send(res, 404, { ok: false, error: "pty not found" });
            try { session.proc.write(body.data || ""); } catch (e) { /* 忽略 */ }
            send(res, 200, { ok: true });
          } catch (e) {
            send(res, 500, { ok: false, error: String(e?.message ?? e) });
          }
        }
      })
    );
    disposers.push(
      webServer.register({
        kind: "exact",
        path: "/dsh-ui-panels/pty/kill",
        handler: async (req, res) => {
          try {
            if (req.method !== "POST") return send(res, 405, { ok: false, error: "method" });
            const body = await readBody(req);
            const session = ptySessions.get(body?.id);
            if (!session) return send(res, 404, { ok: false, error: "pty not found" });
            try { session.proc.kill(); } catch (e) { /* 忽略 */ }
            ptySessions.delete(body.id);
            send(res, 200, { ok: true });
          } catch (e) {
            send(res, 500, { ok: false, error: String(e?.message ?? e) });
          }
        }
      })
    );
    /* xterm.js 静态文件：从 profile node_modules 提供（客户端用 <script>/<link> 加载） */
    const XTERM_LIB = join(NODE_MODULES_DIR, "xterm", "lib");
    const XTERM_CSS = join(NODE_MODULES_DIR, "xterm", "css");
    disposers.push(
      webServer.register({
        kind: "prefix",
        path: "/dsh-ui-panels/xterm",
        handler: (req, res) => {
          try {
            const url = new URL(req.url, "http://localhost");
            const rel = url.pathname.replace(/^\/dsh-ui-panels\/xterm\//, "");
            if (rel.includes("..")) return send(res, 400, { ok: false, error: "bad path" });
            const isCss = rel === "xterm.css";
            const file = isCss ? join(XTERM_CSS, "xterm.css") : join(XTERM_LIB, rel);
            if (!existsSync(file) || isDirectory(file)) return send(res, 404, { ok: false, error: "not found" });
            res.writeHead(200, { "Content-Type": isCss ? "text/css" : "application/javascript" });
            res.end(readFileSync(file));
          } catch (e) {
            send(res, 500, { ok: false, error: String(e?.message ?? e) });
          }
        }
      })
    );
  }
  /* 目录列表：资源管理器文件树使用。GET /dsh-ui-panels/dir?path=<目录> */
  disposers.push(
    webServer.register({
      kind: "exact",
      path: "/dsh-ui-panels/dir",
      handler: (req, res) => {
        try {
          if (req.method !== "GET") return send(res, 405, { ok: false, error: "method not allowed" });
          const url = new URL(req.url, "http://localhost");
          const dirRaw = String(url.searchParams.get("path") || "").trim();
          if (!dirRaw) return send(res, 400, { ok: false, error: "path required" });
          const target = resolve(dirRaw);
          if (!existsSync(target)) return send(res, 404, { ok: false, error: "not found: " + target });
          if (!isDirectory(target)) return send(res, 400, { ok: false, error: "not a directory: " + target });
          const entries = readdirSync(target, { withFileTypes: true })
            .filter((e) => !e.name.startsWith("."))
            .map((e) => {
              const full = join(target, e.name);
              let size = 0;
              try {
                if (e.isFile()) size = statSync(full).size;
              } catch { /* 忽略 stat 失败 */ }
              return { name: e.name, path: full, isDir: e.isDirectory(), size };
            })
            .sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
          send(res, 200, { ok: true, path: target, entries: entries.slice(0, 3000) });
        } catch (e) {
          send(res, 500, { ok: false, error: String(e?.message ?? e) });
        }
      }
    })
  );
  /* 诊断通道：客户端上报状态/错误（写入 profile 下 dsh-ui-panels-diag.jsonl）。 */
  disposers.push(
    webServer.register({
      kind: "exact",
      path: "/dsh-ui-panels/diag",
      handler: async (req, res) => {
        try {
          if (req.method !== "POST") return send(res, 405, { ok: false, error: "method not allowed" });
          const body = await readBody(req);
          appendDiag(body || {});
          send(res, 200, { ok: true });
        } catch (e) {
          send(res, 400, { ok: false, error: String(e?.message ?? e) });
        }
      }
    })
  );
  disposers.push(
    webServer.register({
      kind: "exact",
      path: "/dsh-ui-panels/plugins",
      handler: (req, res) => {
        try {
          send(res, 200, { ok: true, plugins: listPlugins() });
        } catch (e) {
          send(res, 500, { ok: false, error: String(e?.message ?? e) });
        }
      }
    })
  );
  disposers.push(
    webServer.register({
      kind: "exact",
      path: "/dsh-ui-panels/plugins/toggle",
      handler: async (req, res) => {
        try {
          if (req.method !== "POST") return send(res, 405, { ok: false, error: "method not allowed" });
          const body = await readBody(req);
          if (!body || typeof body.name !== "string" || typeof body.enabled !== "boolean") {
            return send(res, 400, { ok: false, error: "name (string) and enabled (boolean) are required" });
          }
          send(res, 200, { ok: true, ...togglePlugin(body.name, body.enabled) });
        } catch (e) {
          send(res, 400, { ok: false, error: String(e?.message ?? e) });
        }
      }
    })
  );
  return () => {
    for (const dispose of disposers) dispose();
  };
}

/** 注册持久化设置命名空间 + 插件管理路由（服务可选，缺失时静默跳过）。 */
export function apply(ctx) {
  ctx.inject(["settings"], (settingsCtx) => {
    try {
      settingsCtx.settings.register(SETTINGS_NAMESPACE, PanelsSettingsSchema);
      appendDiag({ type: "host-settings", ns: String(SETTINGS_NAMESPACE), schema: "strict", ok: true });
    } catch (e) {
      /* 严格 schema 被既有持久化数据顶掉时，退回宽松 schema：宁可少一层校验，
       * 也不能让命名空间注册失败（那样客户端读写全废，且用户无法自救）。 */
      appendDiag({ type: "host-settings", ns: String(SETTINGS_NAMESPACE), schema: "strict", ok: false, err: String((e && e.message) || e) });
      try {
        settingsCtx.settings.register(SETTINGS_NAMESPACE, PanelsSettingsLooseSchema);
        appendDiag({ type: "host-settings", ns: String(SETTINGS_NAMESPACE), schema: "loose", ok: true });
      } catch (e2) {
        appendDiag({ type: "host-settings", ns: String(SETTINGS_NAMESPACE), schema: "loose", ok: false, err: String((e2 && e2.message) || e2) });
      }
    }
  });
  ctx.inject(["webServer"], (wsCtx) => {
    try {
      const disposer = registerPluginRoutes(wsCtx.webServer);
      appendDiag({ type: "host-ready", pty: !!pty, routes: 7 + (pty ? 6 : 0), ts: Date.now() });
      // pty 自检：2.5 秒内 onData/onExit 是否触发（写入 diag，排查"终端无输出"问题）
      if (pty) {
        try {
          const shell = process.platform === "win32" ? "powershell.exe" : (process.env.SHELL || "/bin/sh");
          const t = pty.spawn(shell, [], { cols: 40, rows: 10, cwd: process.cwd(), env: process.env, useConpty: false });
          let got = "";
          let exited = false;
          t.onData((d) => { got += d; });
          t.onExit(() => { exited = true; });
          setTimeout(() => {
            appendDiag({ type: "pty-self-test", useConpty: false, gotLen: got.length, exited, sample: got.slice(0, 80) });
            try { t.kill(); } catch (e) { /* 忽略 */ }
          }, 2500);
        } catch (e) {
          appendDiag({ type: "pty-self-test", useConpty: false, error: String(e?.message ?? e) });
        }
      }
      return disposer;
    } catch (e) {
      console.error("[dsh-ide-panels] failed to register plugin routes:", e);
      appendDiag({ type: "host-route-error", message: String(e?.message ?? e) });
      return undefined;
    }
  });
}
