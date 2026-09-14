<div align="center">

# dsh-ide-panels

**A VS Code-style IDE shell as a DSH (DeepSeek Harness) client plugin**

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![version](https://img.shields.io/badge/version-0.1.1-green.svg)](https://github.com/AIRIKE1/dsh-ide-panels/releases)
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
