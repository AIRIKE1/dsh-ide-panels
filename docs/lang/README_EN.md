<div align="center">

# dsh-ide-panels

**A VS Code-style IDE shell as a DSH (DeepSeek Harness) client plugin**

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![version](https://img.shields.io/badge/version-0.1.4-green.svg)](https://github.com/AIRIKE1/dsh-ide-panels/releases)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-plugin-purple.svg)](https://github.com/deepseek-ai/deepseek-harness)

English · [**中文**](../../README.md)

> *"Chat lives on the left; your IDE lives on the right."*

**Middle tool tabs (editor / terminal / browser / changes, multi-open) · Right sidebar (explorer / search / git / remote) · Bottom panel (terminal / output, resizable) — all toggleable, state persisted.**

</div>

## 📚 Navigation

[⚡ Install](#-install) · [🎨 Features](#-features) · [🖥️ Layout](#️-layout) · [⌨️ Shortcuts](#️-shortcuts) · [🔍 How it works](#-how-it-works) · [🔷 Changelog](#-changelog) · [❓ FAQ](#-faq) · [🗺️ Roadmap](#️-roadmap)

---

## ⚡ Install

It's 2026 — you have an Agent, let it install for you. Open your DeepSeek Harness plugin marketplace, or just drop this line into any Agent:

```
Install the dsh-ide-panels plugin for me: https://github.com/AIRIKE1/dsh-ide-panels
```

The Agent will detect the DSH profile directory, copy the files, and register the bundle. **Restart DSH Desktop** and the shell appears.

<details>
<summary>🛠️ Want to install manually? Expand for paths</summary>

**One-click script** (run in the plugin source directory):

```powershell
.\install.ps1
```

**Manual steps**:

1. Copy the `dsh-ide-panels` folder to
   `%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-ide-panels`;
2. Edit `%USERPROFILE%\.dsh\profiles\desktop\package.json`, append `"dsh-ide-panels"` to the `dsh.profile.bundles` array;
3. **Restart DSH Desktop** (a new bundle needs a fresh boot map; hot reload is not supported).

> Uninstall: remove the name from `bundles` and delete the `node_modules\dsh-ide-panels` folder.

Windows specifics, troubleshooting and verification: see [📦 INSTALL.md](../../INSTALL.md).

</details>

---

## 🎨 Features

| Area | Contents | Highlights |
|---|---|---|
| 🗂️ **Middle tool tabs** | Editor / Docs / Terminal / Browser / Changes | **Unlimited multi-open** of the same tool, **drag to reorder** tabs, close to recycle; empty state shows an "Open a tool" picker |
| 📁 **Right sidebar** | Explorer / Search / Source Control / Remote / Extensions / Settings / Agent | Vertical icon rail + panel, toggle buttons at the bottom |
| 📉 **Bottom panel** | Terminal / Debug Console / Output | Persistent tab strip, **freely resizable height**, content follows |
| 🖥️ **Real PowerShell terminal** | node-pty + xterm.js | Stable winpty backend, **Ctrl+wheel font zoom**, auto-fit rows/cols |
| 🆚 **Local change diff** | Snapshot baseline → before/after file diff | **No git required**: after creating a baseline, changed files show side-by-side with **new code highlighted** |
| 🌿 **Git source control** | status / stage / commit / diff / log | One-click **init** when no repo; change list + history |
| 🌐 **Remote explorer** | SSH / WSL | Connect by typing IP/host directly; SSH group reads `~/.ssh/config`, WSL lists distros |
| 🔍 **Local file search** | name / content / both | No Agent dependency, recursive scan, click result to open in editor |

---

## 🖥️ Layout

```
┌─────────────┬──────────┬──────────────────┬───────────┬─────────┐
│             │          │                  │ Editor    │         │
│  DSH        │   Chat   │  Middle tool     │ Docs      │  Right  │
│  sidebar    │ (fixed)  │  tabs (multi)    │ Terminal  │ sidebar │
│             │          │                  │ Changes   │ (rail)  │
│             │          ├──────────────────┴───────────┴─────────┤
│             │          │  Bottom: Terminal / Debug / Output      │
└─────────────┴──────────┴─────────────────────────────────────────┘
```

- **Left**: DSH's own session sidebar (kept)
- **Chat**: always on the left at 400px, never covered
- **Middle**: tool tabs (drag / multi-open / close)
- **Right**: main sidebar (icon rail + panel)
- **Bottom**: resizable panel strip

---

## ⌨️ Shortcuts

| Action | Shortcut |
|---|---|
| Toggle whole shell | `Ctrl+Shift+S` |
| Toggle center workspace | `Ctrl+Shift+M` |
| Toggle right sidebar | `Ctrl+Shift+J` |
| Toggle bottom panel | `Ctrl+Shift+B` |
| Close one panel | ✕ in panel header |
| Zoom terminal font | `Ctrl+wheel` inside terminal |

All toggle states persist in Host settings (`ui-panels` namespace, lowercase, DSH-compliant) and survive restarts.

---

## 🔍 How it works

1. The plugin registers into the official `shell.overlay` slot (root-level list) and overlays a toggleable shell on the DSH conversation UI;
2. The right sidebar registers into the AppFrame `details` slot (priority -1, shadowing the official details panel) and renders as a sibling grid column — the conversation narrows automatically, no overlap;
3. The grid is driven by CSS variables (`--dp-left/--dp-right/--dp-chat/--dp-strip`): sidebar width, chat width, right width and bottom height are all draggable / resizable and adapt to the window size;
4. The terminal uses host-side node-pty (winpty backend) — a real PowerShell process rendered by xterm.js with poll-based I/O;
5. Change diff uses **local file snapshots** (`.dsh-changes/` directory) — no git required, works in any folder;
6. Search / remote / git all go through host routes (`/dsh-ui-panels/*`) straight to the local machine, never through the Agent.

---

## 🔷 Changelog

> 🔷 **2026.09.14 — v0.1.4 released: bottom panel and center workspace are now one space**

> The old model was wrong: the bottom panel was an independent toggle, and closing the center workspace left a 1fr gap in column 3 with the bottom bar floating in it, unreachable from the chat side.
>
> Now:
> - **The bottom panel belongs to the center workspace**: closing the center hides the bottom with it (the `bottomOpen` preference is kept and restored when the center reopens); opening the bottom turns the center back on so it can never float in a gap
> - **A closed center no longer occupies space**: column 3 collapses to `0px` and the chat column switches to `1fr`, **swallowing the freed space** (measured: chat 381px → **700px**), with `--dp-strip` zeroed so the splitters span the full height
> - The chat|center splitter hides while the center is closed (nothing to split), and the right panel recomputes its width limit against the new space (the chat only keeps its minimum, so the right panel can be dragged wider)
> - New **`Ctrl+Shift+M`** to toggle the center workspace (previously only shell/right/bottom had shortcuts)

> 🔷 **2026.09.14 — v0.1.3 released: performance work + a critical persistence bug + dead-code cleanup**

> **Performance (measured, not felt)**
>
> | Item | Before | After |
> |---|---|---|
> | `sync()` (runs on panel switch / tab open / settings change) | included a **full-DOM scan**: **45–84 ms** at 18,555 nodes | scan removed entirely; **1.6–4.3 ms** steady state |
> | The 5-second diagnostic probe | **84 ms** (getBoundingClientRect + textContent over the whole DOM every tick) | **2–8 ms** (full scan now once per 60 s) |
> | Window resize drag | one sync per resize event | coalesced with rAF, at most one per frame |
> | Background (inactive-tab) terminals | each still polled at **12.5 req/s** | paused while hidden (output is caught up on return) |
> | Host pty output buffer | **unbounded** | capped at 1 MB, oldest dropped first |
> | Opening a large file | whole file read into memory, then truncated (1 GB log = 1 GB RAM) | only the first 512 KB is read |
>
> **Fixed: panel state never persisted at all** (the most serious one)
>
> v0.1.0 stored `openTabs` as an **array of strings**; after v0.1.1 changed it to objects, the host's `settings.register()` threw while validating the existing stored document → the whole `ui-panels` namespace failed to register (client `status: unavailable`) → **the right-panel view, bottom-panel expanded state and open tabs were neither saved nor restored**, and writes were rejected for lack of a revision.
> Now `openTabs` uses a lenient type plus a second, fully-lenient fallback schema, so no legacy document can ever brick the namespace again. A one-line-per-load persistence self-check (`settings-read`) was added to the diagnostics log.
>
> **Switching tabs no longer unmounts views**
> Each tab gets its own pane and inactive ones are `display:none` — unsaved editor changes, terminal sessions/scrollback and scroll positions survive tab switches (previously all were lost).
>
> **Cleanup**
> - Removed unreachable left-panel dead code: `leftOpen` / `leftView` / `toggleLeft` / `openLeft` / `setLeftView` plus the `.dp-left` CSS (the design keeps chat pinned left, so the plugin's own left column was never rendered)
> - Removed the duplicated `browser` key and the null-returning `chat` entry from the view dispatch table
> - Added `tests/i18n.test.mjs`: missing/orphan message checks (151 keys per language, all 129 statically used keys covered, `view.` dynamic prefix checked separately)

> 🔷 **2026.09.14 — v0.1.2 released: systematic bug sweep + 6 fixes**

> Host routes were stress-tested at their boundaries and the client was self-checked inside the live page (573 heartbeats, zero runtime errors). Found and fixed:
>
> | # | Bug | Impact |
> |---|---|---|
> | 1 | Search's default "name+content" mode **never read file bodies** (wrong condition: it only scanned content for files whose name already matched) | Searching for a symbol/keyword inside files returned almost nothing |
> | 2 | With an empty workspace, an empty `path`/`dir` on `dir`/`search`/`git`/`changes` **silently fell back to the host process CWD** | With no active session the search "found" files from the DSH install directory; a snapshot could even be created there |
> | 3 | `/remote` with an unknown action did not fail — it **silently ran the default `wsl ls`** | A typo'd parameter spawned a WSL command out of nowhere |
> | 4 | `/pty/kill` on a nonexistent session returned `ok:true` | Inconsistent with read/write, which correctly 404 |
> | 5 | Binary files were read as UTF-8 into the editor → **a screenful of mojibake** (same for UTF-16 text) | Clicking an image/executable in the explorer was slow and garbled; UTF-16 text is now decoded properly |
> | 6 | Tab keys came from a module-level counter that **resets when the client reloads**, colliding with restored tabs | Closing or dragging a tab could hit the wrong tab |
>
> Also unified `dir`/`git`/`changes` to return 404/400 for nonexistent paths instead of falling back to the CWD.
> Added `tests/host-routes.test.mjs` (stub webServer calling the host handlers directly; covers every fix above plus basic route regressions).

> 🔷 **2026.09.14 — v0.1.1 released: DSH Desktop 2.0.10 shell rewrite support**

> 2.0.10 rewrote AppFrame and broke two hardcoded assumptions here: (1) the layout column frame's CSS Modules hash changed (`.pI_x6G_frame` → `.qNbT7G_frame`), so the 4-column grid override stopped matching — the middle tool area floated over the chat column and the right sidebar went blank; (2) the official right-column slot was renamed (`details` → `rightbar`), so the whole right sidebar stopped rendering; (3) `ctx.layout.closeDetails()` was replaced by `closeRightbar()`.
>
> Since v0.1.1 the plugin **no longer depends on any official hashed class name**: it locates the frame and its three columns at runtime through the stable `data-shell-overlay` anchor and tags them with its own `data-dp-frame` / `data-dp-col` attributes, so the CSS only references those. The right slot is registered under both names (`rightbar` first, `details` as fallback, mutually exclusive) for old and new DSH alike. The middle tool area now has a 300px minimum width so it cannot be squeezed into a slit, and the four bottom switches lost their background color.

> 🔷 **2026.08.18 — v0.1.0 released**: first release. Middle tool tabs (multi-open / drag / close), right sidebar (explorer / search / git / remote / extensions / settings / agent), resizable bottom panel (terminal / debug / output), real PowerShell terminal (winpty + xterm), local change diff (snapshot + highlighted before/after), git source control, SSH/WSL remote, local file search.

> ⭐ Like it? Give the repo a star!

---

## ❓ FAQ

**Installed but nothing shows?**
Restart DSH Desktop. A new bundle needs a fresh boot map; hot reload is not supported.

**"Open a tool" picker doesn't open anything?**
Older settings may hold legacy tab data; one restart fixes it (host schema now supports multi-open).

**Change diff is empty?**
Click "Create Baseline" first — it snapshots all text files in the folder; changed files show up afterwards. No git required.

**Terminal has no output?**
Make sure host-side node-pty is available (takes effect after restart). It's a real PowerShell (winpty backend); hit "Reconnect" if the link drops.

**SSH won't connect?**
Type `user@ip` in the input to connect directly; hosts from `~/.ssh/config` need key-based auth.

**How to uninstall?**
Remove the name from `dsh.profile.bundles`, delete the `node_modules\dsh-ide-panels` folder, restart.

---

## 🗺️ Roadmap

- [x] Middle tool tabs (multi-open / drag / close / overflow)
- [x] Right sidebar (deduped + vertical toggles)
- [x] Resizable / persistent bottom panel
- [x] Real PowerShell terminal
- [x] Local change diff (no git)
- [x] Git source control / SSH+WSL remote / local search
- [ ] User-configurable sidebar & tools in settings
- [ ] Tab context menu (duplicate / pin)
- [ ] Multi-workspace file tree

---

<div align="center">

*Created by [AIRIKE](https://github.com/AIRIKE1) · [MIT License](../../LICENSE) · Powered by [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)*

</div>
