/**
 * dsh-ide-panels — i18n 文案完整性测试
 *
 * 找出「代码里 t("key") 用到、但字典里没有」的 key（会直接把 key 当文案显示给用户），
 * 以及「字典里有、代码里没用」的死文案。同时检查中英文字典的 key 是否一一对应。
 *
 * 运行：node tests/i18n.test.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "lib", "client.js"), "utf8");

let failures = 0;
function check(ok, label, extra) {
	if (ok) console.log(`  ✓ ${label}`);
	else { console.error(`  ✗ ${label}${extra ? "\n      " + extra : ""}`); failures += 1; }
}

/** 抽出 `var NAME = { ... };` 的对象字面量文本（按大括号配平，跳过字符串内的大括号）。 */
function extractObject(name) {
	const start = src.indexOf(`var ${name} = {`);
	if (start < 0) throw new Error(`未找到 ${name}`);
	const open = src.indexOf("{", start);
	let depth = 0;
	let inStr = false;
	let quote = "";
	for (let i = open; i < src.length; i += 1) {
		const ch = src[i];
		const prev = src[i - 1];
		if (inStr) {
			if (ch === quote && prev !== "\\") inStr = false;
			continue;
		}
		if (ch === '"' || ch === "'") { inStr = true; quote = ch; continue; }
		if (ch === "{") depth += 1;
		else if (ch === "}") {
			depth -= 1;
			if (depth === 0) return src.slice(open, i + 1);
		}
	}
	throw new Error(`${name} 未闭合`);
}

/** 取字典的 key：只认顶层（depth===1）形如 "key": 的条目。 */
function keysOf(name) {
	const body = extractObject(name);
	const keys = new Set();
	let depth = 0;
	let i = 0;
	let pending = null;
	while (i < body.length) {
		const ch = body[i];
		if (ch === '"' || ch === "'") {
			let j = i + 1;
			let s = "";
			while (j < body.length) {
				if (body[j] === "\\") { s += body[j + 1]; j += 2; continue; }
				if (body[j] === ch) break;
				s += body[j];
				j += 1;
			}
			pending = depth === 1 ? s : null;
			i = j + 1;
			continue;
		}
		if (ch === "{") { depth += 1; pending = null; i += 1; continue; }
		if (ch === "}") { depth -= 1; pending = null; i += 1; continue; }
		if (ch === ":" && depth === 1 && pending !== null) { keys.add(pending); pending = null; i += 1; continue; }
		if (!/\s/.test(ch)) pending = null;
		i += 1;
	}
	return keys;
}

const zh = keysOf("DICT_ZH");
const en = keysOf("DICT_EN");
check(zh.size > 50, `中文词典解析出 ${zh.size} 条`, zh.size <= 50 ? "解析可能失败" : "");
check(en.size > 50, `英文词典解析出 ${en.size} 条`);

/* 代码里用到的静态 key（t("x") / labelKey: "x" 形式） */
const used = new Set();
const re = /\bt\(\s*"([^"]+)"\s*\)/g;
let m;
while ((m = re.exec(src))) used.add(m[1]);
const labelRe = /labelKey:\s*"([^"]+)"/g;
while ((m = labelRe.exec(src))) used.add(m[1]);
check(used.size > 50, `代码里用到 ${used.size} 个静态 key`);

const missingZh = [...used].filter((k) => !zh.has(k)).sort();
const missingEn = [...used].filter((k) => !en.has(k)).sort();
check(missingZh.length === 0, "中文文案无缺失", missingZh.length ? "缺失: " + missingZh.join(", ") : "");
check(missingEn.length === 0, "英文文案无缺失", missingEn.length ? "缺失: " + missingEn.join(", ") : "");

const onlyZh = [...zh].filter((k) => !en.has(k)).sort();
const onlyEn = [...en].filter((k) => !zh.has(k)).sort();
check(onlyZh.length === 0, "中英词典 key 一一对应（无只在中文的条目）", onlyZh.length ? "只在中文: " + onlyZh.join(", ") : "");
check(onlyEn.length === 0, "中英词典 key 一一对应（无只在英文的条目）", onlyEn.length ? "只在英文: " + onlyEn.join(", ") : "");

/* 动态拼接的 key 前缀（提示人工确认这些前缀下的 key 都存在） */
const dyn = new Set();
const dynRe = /\bt\(\s*"([^"]*\.)"\s*\+/g;
while ((m = dynRe.exec(src))) dyn.add(m[1]);
console.log(`  · 动态拼接的 key 前缀: ${[...dyn].join(" ") || "(无)"}`);
for (const prefix of dyn) {
	const missing = [];
	for (const v of ["files", "docs", "terminal", "browser", "changes", "explorer", "search", "source", "remote", "extensions", "general", "agent", "debug", "output"]) {
		if (src.indexOf(`"${prefix}${v}"`) >= 0 && !zh.has(prefix + v)) missing.push(prefix + v);
	}
	check(missing.length === 0, `动态前缀 "${prefix}" 下的视图 key 都在词典里`, missing.join(", "));
}

const unused = [...zh].filter((k) => !used.has(k)).sort();
console.log(`  · 词典中未被静态引用的条目 ${unused.length} 个（多为动态 key 或预留）`);

console.log("");
if (failures > 0) {
	console.error(`FAILED: ${failures} 项未通过`);
	process.exit(1);
}
console.log("I18N TEST PASS ✓");
