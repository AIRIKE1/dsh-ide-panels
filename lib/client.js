window.__ModuleLoader__.load({
	id: "dsh-ide-panels",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var react = require("react");
		var primitives = require("@deepseek-ai/dsh-client-ui-primitives");

		/* =====================================================================
		 * 1) 样式（与官方包一致：注入 <style data-plugin-css> 一次性样式表）
		 * =================================================================== */
		var CSS = [
			/* 双类选择器：确保 pointer-events:none 压过官方 .overlayLayer>*{pointer-events:auto}（同优先级按文档顺序裁决，双类可无视顺序） */
			".dp-root.dp-root{position:absolute;inset:0;z-index:20;pointer-events:none;font-family:inherit}",
			".dp-root *{box-sizing:border-box}",
			/* ── 图标条 ── */
			".dp-rail{width:48px;flex:none;background:var(--dsw-specific-sidebar-fill);display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:2px;overflow:hidden}",
			".dp-left{position:absolute;left:0;top:0;bottom:0;display:flex;pointer-events:auto}",
			".dp-right{position:absolute;right:0;top:0;bottom:0;display:flex;flex-direction:row-reverse;pointer-events:auto}",
			".dp-left .dp-rail{border-right:1px solid var(--dsw-alias-border-l1)}",
			".dp-right .dp-rail{border-left:1px solid var(--dsw-alias-border-l1)}",
			".dp-rail-btn{width:36px;height:36px;flex:none;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);background:transparent;border:none;border-radius:8px;cursor:pointer;padding:0;transition:background var(--ds-transition-duration-fast) var(--ds-ease-in-out),color var(--ds-transition-duration-fast) var(--ds-ease-in-out)}",
			".dp-rail-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".dp-rail-btn[data-active]{color:var(--dsw-alias-label-primary);background:var(--dsw-specific-sidebar-nav-item-active)}",
			/* 底部 4 个开关按钮（中间/右侧/底部/外壳）：竖排、无背景色 —— 激活只用图标颜色区分 */
			".dp-rail-btn.dp-rail-switch[data-active]{background:transparent;color:var(--dsw-alias-label-primary)}",
			".dp-rail-spacer{flex:1}",
			".dp-rail-sep{width:24px;height:1px;margin:4px 0;background:var(--dsw-alias-border-l2);flex:none}",
			/* ── 面板 ── */
			/* 面板弹性宽度：跟随右侧栏轨道（拖窄时收缩，绝不溢出格子） */
			".dp-panel{flex:1;min-width:0;width:auto;background:var(--dsw-specific-sidebar-fill);display:flex;flex-direction:column;overflow:hidden}",
			".dp-left .dp-panel{border-right:1px solid var(--dsw-alias-border-l1)}",
			".dp-right .dp-panel{border-left:1px solid var(--dsw-alias-border-l1)}",
			".dp-panel-head{display:flex;align-items:center;gap:6px;padding:8px 8px 8px 14px;flex:none;color:var(--dsw-alias-label-secondary);font-size:11px;letter-spacing:.05em;text-transform:uppercase;user-select:none}",
			".dp-panel-title{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
			".dp-panel-close{width:24px;height:24px;flex:none;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary);background:transparent;border:none;border-radius:6px;cursor:pointer;padding:0}",
			".dp-panel-close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".dp-panel-body{flex:1;min-height:0;overflow:auto;padding:2px 12px 14px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary)}",
			/* ── 底部面板 ── */
			".dp-bottom{position:absolute;bottom:0;display:flex;flex-direction:column;background:var(--dsw-specific-sidebar-fill);border-top:1px solid var(--dsw-alias-border-l2);pointer-events:auto;overflow:hidden;animation:dp-in .18s var(--ds-ease-in-out)}",
			".dp-bottom-resize{position:absolute;top:-4px;left:0;right:0;height:8px;cursor:row-resize;z-index:6;touch-action:none}",
			".dp-bottom-resize::after{content:'';position:absolute;left:8px;right:8px;top:3px;height:2px;border-radius:2px;background:transparent;transition:background var(--ds-transition-duration-fast) var(--ds-ease-in-out)}",
			".dp-bottom-resize:hover::after{background:var(--dsw-alias-border-l3)}",
			".dp-bottom-tabs{display:flex;align-items:center;gap:2px;padding:0 10px;height:34px;flex:none;border-bottom:1px solid var(--dsw-alias-border-l1);overflow:hidden}",
			".dp-bottom-tab{display:flex;align-items:center;gap:6px;height:26px;padding:0 10px;color:var(--dsw-alias-label-secondary);background:transparent;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-family:inherit;white-space:nowrap}",
			".dp-bottom-tab:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".dp-bottom-tab[data-active]{color:var(--dsw-alias-label-primary);background:var(--dsw-specific-sidebar-nav-item-active)}",
			".dp-bottom-tab svg{opacity:.85}",
			".dp-bottom-close{margin-left:auto;width:26px;height:26px;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary);background:transparent;border:none;border-radius:6px;cursor:pointer;padding:0}",
			".dp-bottom-close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".dp-bottom-body{flex:1;min-height:0;overflow:auto;padding:8px 14px 12px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary)}",
			/* ── 外壳关闭时的单个开关按钮：右上角（标题栏下方），不挡输入区 ── */
			".dp-fab-row{position:absolute;top:var(--dp-top,46px);right:10px;left:auto;bottom:auto;z-index:22;pointer-events:auto;display:flex;align-items:center;gap:6px}",
			".dp-fab{width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l3);border-radius:9px;box-shadow:var(--dsw-shadow-lv2);cursor:pointer;padding:0;transition:background var(--ds-transition-duration-fast) var(--ds-ease-in-out),color var(--ds-transition-duration-fast) var(--ds-ease-in-out)}",
			".dp-fab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1)}",
			".dp-fab[data-active]{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-brand-primary)}",
			/* ── 通用元素 ── */
			".dp-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--dsw-alias-border-l1);width:100%}",
			".dp-row:last-child{border-bottom:none}",
			".dp-row-main{flex:1;min-width:0}",
			".dp-row-title{font-size:13px;color:var(--dsw-alias-label-primary);line-height:20px}",
			".dp-row-desc{font-size:12px;color:var(--dsw-alias-label-tertiary);line-height:18px;margin-top:1px}",
			".dp-switch{font:inherit;cursor:pointer;border-radius:999px;padding:3px 12px;font-size:12px;line-height:18px;border:1px solid var(--dsw-alias-border-l3);flex:none;transition:background var(--ds-transition-duration-fast) var(--ds-ease-in-out),color var(--ds-transition-duration-fast) var(--ds-ease-in-out)}",
			".dp-switch[data-on]{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}",
			".dp-switch:not([data-on]){background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary)}",
			".dp-btn{font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l3);border-radius:8px;padding:5px 12px;font-size:12px;line-height:18px;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary)}",
			".dp-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dp-btn[data-primary]{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}",
			".dp-btn[data-primary]:hover{background:var(--dsw-alias-button-primary-hover)}",
			".dp-hint{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);margin:8px 0}",
			".dp-kbd{display:inline-block;padding:1px 6px;margin:0 2px;font-size:11px;line-height:16px;border:1px solid var(--dsw-alias-border-l3);border-bottom-width:2px;border-radius:5px;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);font-family:inherit;white-space:nowrap}",
			".dp-link{color:var(--dsw-alias-brand-primary);text-decoration:none;cursor:pointer}",
			".dp-link:hover{text-decoration:underline}",
			".dp-list{display:flex;flex-direction:column;gap:2px}",
			".dp-item{display:flex;flex-direction:column;gap:1px;width:100%;text-align:left;background:transparent;border:none;border-radius:8px;padding:6px 8px;cursor:pointer;color:var(--dsw-alias-label-primary);font-family:inherit}",
			".dp-item:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dp-item[data-active]{background:var(--dsw-specific-sidebar-nav-item-active)}",
			".dp-item-title{font-size:13px;line-height:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
			".dp-item-sub{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
			".dp-group-head{display:flex;align-items:center;gap:6px;padding:10px 4px 4px;font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary);user-select:none}",
			/* ── 中间标签区（只在中间列内，不横贯全窗）──
			 * top 用 --dp-top（标题栏下方），overflow:hidden 保证中间内容绝不溢入右侧栏（各用各的） ── */
			".dp-center{position:absolute;top:var(--dp-top,46px);bottom:0;left:0;pointer-events:none;display:flex;flex-direction:column;min-width:0;overflow:hidden}",
			/* ── 中间标签页系统（17.png 样式：标签 + 关闭 × + 加号 + 溢出 »）── */
			".dp-center-tabs{pointer-events:auto;display:flex;align-items:center;gap:2px;height:30px;flex:none;padding:0 8px;background:var(--dsw-specific-sidebar-fill);border-bottom:1px solid var(--dsw-alias-border-l1);overflow:visible}",
			".dp-center-tab-list{display:flex;align-items:center;gap:2px;flex:1;min-width:0;overflow:hidden}",
			".dp-center-tab{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 6px 0 10px;color:var(--dsw-alias-label-secondary);background:transparent;border:1px solid transparent;border-radius:7px;cursor:pointer;font-size:12px;font-family:inherit;white-space:nowrap;user-select:none;flex:none;transition:background var(--ds-transition-duration-fast) var(--ds-ease-in-out),color var(--ds-transition-duration-fast) var(--ds-ease-in-out)}",
			".dp-center-tab:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".dp-center-tab .dp-center-tab-label{max-width:110px;overflow:hidden;text-overflow:ellipsis}",
			".dp-center-tab-active{color:#fff;border-color:rgba(145,197,240,.35);background:linear-gradient(135deg,rgba(59,42,99,.9),rgba(59,134,211,.75))!important}",
			".dp-center-tab-active:hover{color:#fff}",
			".dp-tab-close{width:16px;height:16px;flex:none;display:flex;align-items:center;justify-content:center;color:inherit;opacity:.65;background:transparent;border:none;border-radius:4px;cursor:pointer;padding:0}",
			".dp-tab-close:hover{opacity:1;background:rgba(0,0,0,.25)}",
			".dp-tab-add-wrap{position:relative;flex:none;margin-left:2px;padding-left:8px;border-left:1px solid var(--dsw-alias-border-l1)}",
			".dp-tab-more-wrap{position:relative;flex:none}",
			".dp-tab-add,.dp-tab-more{width:24px;height:24px;flex:none;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);background:transparent;border:1px solid transparent;border-radius:7px;cursor:pointer;padding:0;font-size:15px;line-height:1;font-family:inherit}",
			".dp-tab-add:hover,.dp-tab-more:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".dp-tab-add[data-active],.dp-tab-more[data-active]{color:#fff;border-color:rgba(145,197,240,.4);background:linear-gradient(135deg,rgba(59,42,99,.85),rgba(59,134,211,.7))}",
			".dp-tab-pop{position:absolute;top:28px;right:0;z-index:60;min-width:170px;max-height:320px;overflow:auto;padding:5px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-shadow-lv2);display:flex;flex-direction:column;gap:1px}",
			".dp-pop-item{display:flex;align-items:center;gap:8px;width:100%;padding:7px 9px;text-align:left;color:var(--dsw-alias-label-primary);background:transparent;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-family:inherit}",
			".dp-pop-item:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dp-pop-item-active{color:#fff;background:linear-gradient(135deg,rgba(59,42,99,.85),rgba(59,134,211,.7))}",
			/* ── 空状态「打开工具」面板（无背景色块，纯图标+文字，与整体风格一致）── */
			".dp-open-tools{height:100%;display:flex;align-items:flex-start;justify-content:center;overflow:auto}",
			".dp-open-tools-inner{max-width:560px;width:100%;padding:44px 20px 20px;text-align:center}",
			".dp-open-tools-title{font-size:20px;font-weight:600;color:var(--dsw-alias-label-primary);line-height:28px}",
			".dp-open-tools-sub{font-size:13px;color:var(--dsw-alias-label-tertiary);line-height:20px;margin:4px 0 22px}",
			".dp-open-tools-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px}",
			".dp-tool-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px 8px;background:transparent;border:none;border-radius:10px;cursor:pointer;color:var(--dsw-alias-label-primary);font-family:inherit;transition:background var(--ds-transition-duration-fast) var(--ds-ease-in-out)}",
			".dp-tool-card:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dp-tool-card-icon{display:flex;align-items:center;justify-content:center;width:44px;height:44px;color:var(--dsw-alias-label-secondary)}",
			".dp-tool-card:hover .dp-tool-card-icon{color:var(--dsw-alias-label-primary)}",
			".dp-tool-card-label{font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary)}",
			".dp-center-view{pointer-events:auto;flex:1;min-height:0;min-width:0;background:var(--dsw-alias-bg-base);overflow:auto;padding:4px 16px 16px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary)}",
			/* 彻底隐藏 shell 内所有原生滚动条（长条），只保留编辑器自定义滑块滚动条（滚轮仍可滚动） */
			".dp-root *::-webkit-scrollbar{display:none}",
			".dp-root *{scrollbar-width:none;-ms-overflow-style:none}",
			/* diff 高亮 */
			".dp-code-add .dp-code-text{color:var(--dsw-alias-state-success-primary)}",
			".dp-code-add{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent)}",
			".dp-code-del .dp-code-text{color:var(--dsw-alias-state-error-primary)}",
			".dp-code-del{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent)}",
			/* ── 源代码管理（VS Code 19 风格）── */
			".dp-scm-empty{padding:18px 6px 8px;text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center}",
			".dp-scm-empty-title{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}",
			".dp-scm-head{display:flex;align-items:center;gap:6px;padding:8px 0 4px;text-transform:uppercase;font-size:11px;letter-spacing:.05em;color:var(--dsw-alias-label-tertiary)}",
			".dp-scm-head-title{flex:1;min-width:0}",
			".dp-icon-btn{width:22px;height:22px;flex:none;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary);background:transparent;border:none;border-radius:5px;cursor:pointer;padding:0;font-size:13px;line-height:1}",
			".dp-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			/* ── 远程资源管理器（VS Code 20 风格）── */
			".dp-remote-head{display:flex;align-items:center;gap:6px;padding:10px 0 4px;text-transform:uppercase;font-size:11px;letter-spacing:.05em;color:var(--dsw-alias-label-tertiary);user-select:none}",
			".dp-remote-head-title{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
			".dp-remote-head-actions{display:flex;align-items:center;gap:2px;flex:none}",
			".dp-ssh-input{padding:6px 10px}",
			/* ── 代码变更对比（前后文件 + 新增行高亮）── */
			".dp-cmp{display:flex;flex-direction:column;height:100%;min-height:0}",
			".dp-cmp-head{display:flex;align-items:center;gap:8px;padding:4px 0 8px;flex:none}",
			".dp-cmp-body{flex:1;min-height:0;display:flex;gap:10px;overflow:hidden}",
			".dp-cmp-col{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;overflow:hidden;background:var(--dsw-alias-bg-layer-2)}",
			".dp-cmp-col-title{flex:none;padding:6px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--dsw-alias-label-tertiary);border-bottom:1px solid var(--dsw-alias-border-l1)}",
			".dp-cmp-code{flex:1;min-height:0;overflow:auto;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:19px;padding:6px 0}",
			".dp-cmp-line{display:flex;gap:10px;padding:0 12px;min-height:19px}",
			".dp-cmp-text{white-space:pre-wrap;word-break:break-all;color:var(--dsw-alias-label-primary)}",
			".dp-cmp-new{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 22%, transparent)}",
			".dp-cmp-new .dp-cmp-text{color:var(--dsw-alias-state-success-primary)}",
			/* ── 列拖拽手柄（聊天|中间、中间|右侧），可自由拉伸，带最小宽度 ── */
			".dp-hsplit{position:absolute;top:var(--dp-top,30px);bottom:var(--dp-strip,34px);width:5px;margin-left:-2px;cursor:col-resize;z-index:21;pointer-events:auto;touch-action:none}",
			".dp-hsplit:hover::after,.dp-hsplit[data-dragging]::after{content:'';position:absolute;left:2px;top:0;bottom:0;width:1px;background:var(--dsw-alias-border-l3)}",
			".dp-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:19px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:8px 0;margin:0;overflow:auto;max-height:calc(100vh - 260px)}",
			".dp-code-line{display:flex;gap:12px;padding:0 12px;min-height:19px}",
			".dp-code-line:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dp-code-num{flex:none;min-width:36px;text-align:right;color:var(--dsw-alias-label-tertiary);user-select:none;opacity:.7}",
			".dp-code-text{white-space:pre-wrap;word-break:break-all;color:var(--dsw-alias-label-primary)}",
			/* ── 可编辑编辑器 ── */
			".dp-editor-toolbar{display:flex;align-items:center;gap:6px;padding:8px 0;flex-wrap:wrap}",
			".dp-editor-status{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);margin-left:auto;white-space:nowrap}",
			".dp-editor-status[data-dirty]{color:var(--dsw-alias-state-warn-primary)}",
			".dp-editor-status[data-saved]{color:var(--dsw-alias-state-success-primary)}",
			".dp-editor{display:flex;height:100%;min-height:0;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;overflow:hidden;background:var(--dsw-alias-bg-layer-2);position:relative}",
			".dp-editor-gutter{flex:none;width:46px;overflow:hidden;background:var(--dsw-alias-bg-layer-2);border-right:1px solid var(--dsw-alias-border-l1);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:20px;text-align:right;color:var(--dsw-alias-label-tertiary);padding:8px 8px 8px 0;user-select:none}",
			".dp-editor-gutter div{height:20px;padding-right:8px}",
			".dp-editor-textarea{flex:1;min-width:0;background:transparent;border:none;outline:none;color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:20px;padding:8px 12px 22px;resize:none;white-space:pre;overflow:auto;tab-size:2;scrollbar-width:none;-ms-overflow-style:none}",
			".dp-editor-textarea::-webkit-scrollbar{display:none}",
			".dp-editor-textarea::selection{background:var(--dsw-alias-interactive-bg-hover-accent)}",
			/* 自定义滚动条：垂直滑块（右边缘）+ 横向滚动条（sticky 贴滚动容器底部，即底部栏上方，不随内容滚动） */
			".dp-scroll-v{position:absolute;right:2px;top:0;width:8px;height:40px;background:rgba(128,128,140,.55);border-radius:4px;cursor:pointer;display:none;z-index:5}",
			".dp-scroll-v:hover{background:rgba(128,128,140,.8)}",
			".dp-scroll-h{position:sticky;bottom:0;left:46px;right:0;height:8px;background:rgba(128,128,140,.55);border-radius:4px;cursor:pointer;display:none;z-index:5;flex:none}",
			".dp-scroll-h:hover{background:rgba(128,128,140,.8)}",
			".dp-browser{display:flex;flex-direction:column;height:100%;min-height:0}",
			".dp-browser-bar{display:flex;align-items:center;gap:6px;padding:8px 0;flex:none}",
			".dp-browser-btn{width:28px;height:28px;flex:none;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);background:transparent;border:none;border-radius:6px;cursor:pointer;padding:0}",
			".dp-browser-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".dp-browser-btn:disabled{opacity:.35;cursor:default}",
			".dp-iframe{flex:1;min-height:0;width:100%;border:none;background:var(--dsw-alias-bg-base);border-radius:10px}",
			/* ── 真实终端 ── */
			".dp-terminal{display:flex;flex-direction:column;height:100%;min-height:0}",
			".dp-terminal-bar{display:flex;align-items:center;gap:8px;padding:6px 0;flex:none}",
			".dp-terminal-host{flex:1;min-height:0;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:6px;overflow:hidden}",
			".dp-terminal-host .xterm{height:100%}",
			".dp-input{width:100%;font:inherit;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l3);border-radius:8px;padding:6px 10px;outline:none}",
			".dp-input:focus{border-color:var(--dsw-alias-brand-primary)}",
			".dp-input::placeholder{color:var(--dsw-alias-label-tertiary)}",
			".dp-empty{padding:18px 6px;text-align:center;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}",
			".dp-view-error{padding:14px;border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, transparent);border-radius:10px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;background:var(--dsw-alias-bg-layer-2);word-break:break-word}",
			".dp-view-error-title{font-weight:500;font-size:13px;color:var(--dsw-alias-state-error-primary)}",
			".dp-shell-error{position:absolute;inset:0;z-index:25;pointer-events:auto;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb, var(--dsw-alias-bg-base) 82%, transparent)}",
			".dp-shell-error-card{max-width:480px;width:calc(100% - 48px);padding:20px;border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, transparent);border-radius:14px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;box-shadow:var(--dsw-shadow-lv2);word-break:break-word}",
			".dp-tag{display:inline-block;padding:1px 7px;font-size:10px;line-height:15px;border:1px solid var(--dsw-alias-border-l3);border-radius:999px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-module-platform);white-space:nowrap;flex:none}",
			".dp-tag-warn{color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent)}",
			".dp-section-title{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary);line-height:22px;margin:12px 0 4px}",
			".dp-rule{border:none;border-top:1px solid var(--dsw-alias-border-l1);margin:10px 0}",
			/* ── 日志（调试控制台 / 输出）── */
			".dp-log{display:flex;gap:8px;padding:1px 0;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:18px;white-space:pre-wrap;word-break:break-word}",
			".dp-log-time{flex:none;color:var(--dsw-alias-label-tertiary)}",
			".dp-log-warn .dp-log-text{color:var(--dsw-alias-state-warn-primary)}",
			".dp-log-error .dp-log-text{color:var(--dsw-alias-state-error-primary)}",
			".dp-log-info .dp-log-text{color:var(--dsw-alias-label-secondary)}",
			".dp-log-plain .dp-log-text{color:var(--dsw-alias-label-primary)}",
			/* ── 进入动画 ── */
			"@keyframes dp-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
			".dp-rail,.dp-panel,.dp-bottom{animation:dp-in .15s var(--ds-ease-in-out) backwards}",
			/* ── 外壳打开时：4 列网格，三列全部撑满全高（无顶部/底部空条）──
			 *   第1列（auto）= DSH 会话侧栏；第2列（--dp-chat）= 聊天；第3列 = 中间编辑器区；第4列 = 右侧栏。
			 *   frame 与三列由运行时打标（data-dp-frame / data-dp-col）——DSH 换 CSS Modules 哈希类名后依然生效。
			 *   顶栏/底部条只叠在中间列上（经 --dp-left/--dp-right 内缩），不覆盖聊天与侧栏。 ── */
			"body[data-dp-shell=\"1\"] [data-dp-frame]{grid-template-columns:auto var(--dp-chat,400px) minmax(0,1fr) var(--dp-right,336px) !important}",
			"body[data-dp-shell=\"1\"] [data-dp-col=\"1\"]{grid-column:1 !important}",
			"body[data-dp-shell=\"1\"] [data-dp-col=\"2\"]{grid-column:2 !important}",
			"body[data-dp-shell=\"1\"] [data-dp-col=\"3\"]{grid-column:4 !important}",
			/* 底部条与中间标签区只覆盖中间列（聊天/侧栏不受影响）；中间视图止于底部条上方 */
			".dp-bottom{left:var(--dp-left,0px);right:var(--dp-right,336px)}",
			".dp-center{left:var(--dp-left,0px);right:var(--dp-right,336px);bottom:var(--dp-strip,34px)}",
			".dp-center-view{padding-bottom:12px}",
			".dp-right-sidebar{display:flex;flex-direction:column;height:100%;width:100%;min-width:0;overflow:hidden}",
			".dp-right-main{display:flex;flex:1;min-height:0;width:100%;overflow:hidden}",
			".dp-right-sidebar .dp-rail{border-left:1px solid var(--dsw-alias-border-l1)}",
			".dp-right-sidebar .dp-panel{border-left:1px solid var(--dsw-alias-border-l1)}"
		].join("");
		var CSS_TAG = "dsh-ide-panels/shell.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(CSS_TAG) + "]") === null) {
			var tag = document.createElement("style");
			tag.dataset.plugin = "dsh-ide-panels";
			tag.dataset.pluginCss = CSS_TAG;
			tag.textContent = CSS;
			document.head.appendChild(tag);
		}

		/* =====================================================================
		 * 2) 工具
		 * =================================================================== */
		/** 不可变快照 store（getSnapshot/subscribe 兼容 useSyncExternalStore）。 */
		function createSnapshotStore(init) {
			var state = init;
			var listeners = new Set();
			return {
				getSnapshot: function () {
					return state;
				},
				subscribe: function (listener) {
					listeners.add(listener);
					return function () {
						listeners.delete(listener);
					};
				},
				set: function (patch) {
					state = Object.assign({}, state, patch);
					listeners.forEach(function (l) { l(); });
				},
				replace: function (next) {
					state = next;
					listeners.forEach(function (l) { l(); });
				}
			};
		}
		/** 构造行内小图标（与 primitives 一致的 16px outline 风格）。 */
		function iconOf(paths) {
			return function (props) {
				var size = (props && props.size) || 16;
				var cls = props && props.className;
				return react.createElement("svg", {
					width: size,
					height: size,
					viewBox: "0 0 16 16",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: 1.5,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					className: cls,
					"aria-hidden": true
				}, paths.map(function (d) {
					return react.createElement("path", { d: d, key: d });
				}));
			};
		}
		var IconTerminal16 = iconOf(["M2.5 4.5 6 8l-3.5 3.5", "M8 12.5h5.5"]);
		var IconOutput16 = iconOf(["M2.5 4.75h11", "M2.5 8h11", "M2.5 11.25h7"]);
		var IconDebug16 = function (props) {
			var size = (props && props.size) || 16;
			return react.createElement("svg", {
				width: size, height: size, viewBox: "0 0 16 16",
				fill: "none", stroke: "currentColor", strokeWidth: 1.4,
				strokeLinecap: "round", strokeLinejoin: "round",
				className: props && props.className, "aria-hidden": true
			}, [
				react.createElement("circle", { key: "h", cx: 8, cy: 6, r: 2.1 }),
				react.createElement("path", { key: "b", d: "M8 8.1V11" }),
				react.createElement("path", { key: "l", d: "M5.9 9.4 4.9 11.4" }),
				react.createElement("path", { key: "r", d: "M10.1 9.4 11.1 11.4" }),
				react.createElement("path", { key: "a1", d: "M6.3 4.3 5.2 2.7" }),
				react.createElement("path", { key: "a2", d: "M9.7 4.3 10.8 2.7" })
			]);
		};
		var IconDocs16 = function (props) {
			var size = (props && props.size) || 16;
			return react.createElement("svg", {
				width: size, height: size, viewBox: "0 0 16 16",
				fill: "none", stroke: "currentColor", strokeWidth: 1.5,
				strokeLinecap: "round", strokeLinejoin: "round",
				className: props && props.className, "aria-hidden": true
			}, [
				react.createElement("path", { key: "c", d: "M3 2.8h9.6a1 1 0 0 1 1 1v9.4a1 1 0 0 1-1 1H3z" }),
				react.createElement("path", { key: "s", d: "M3 2.8h3.4a1.2 1.2 0 0 1 1.2 1.2v9.2" })
			]);
		};
		/** 底部面板图标：带底部条的窗口。 */
		var IconBottom16 = function (props) {
			var size = (props && props.size) || 16;
			return react.createElement("svg", {
				width: size, height: size, viewBox: "0 0 16 16",
				fill: "none", stroke: "currentColor", strokeWidth: 1.5,
				strokeLinecap: "round", strokeLinejoin: "round",
				className: props && props.className, "aria-hidden": true
			}, [
				react.createElement("rect", { key: "w", x: 2.5, y: 2.5, width: 11, height: 11, rx: 1.5 }),
				react.createElement("path", { key: "s", d: "M2.5 11.5h11" })
			]);
		};
		/** 安全的字符串化（日志用）。 */
		function stringify(value) {
			if (value === void 0) return "undefined";
			if (value === null) return "null";
			if (typeof value === "string") return value;
			if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
			if (value instanceof Error) return value.stack || (value.name + ": " + value.message);
			try {
				var text = JSON.stringify(value);
				return text === void 0 ? String(value) : text;
			} catch (e) {
				return String(value);
			}
		}

		/* =====================================================================
		 * 3) console 捕获（调试控制台 / 输出 数据源）
		 * =================================================================== */
		var logStore = createSnapshotStore({ logs: [] });
		var MAX_LOGS = 400;
		var LOG_SEQ = 0;
		var consolePatched = false;
		function patchConsole() {
			if (consolePatched || typeof window === "undefined") return;
			consolePatched = true;
			var originals = {
				log: console.log.bind(console),
				info: console.info.bind(console),
				warn: console.warn.bind(console),
				error: console.error.bind(console),
				debug: console.debug.bind(console)
			};
			function push(kind, args) {
				var text = Array.prototype.map.call(args, stringify).join(" ");
				if (text.length > 4000) text = text.slice(0, 4000) + " …";
				var current = logStore.getSnapshot().logs;
				var next = current.length >= MAX_LOGS ? current.slice(current.length - MAX_LOGS + 1) : current.slice();
				next.push({ kind: kind, text: text, time: Date.now(), id: ++LOG_SEQ });
				logStore.replace({ logs: next });
			}
			console.log = function () { originals.log.apply(console, arguments); push("log", arguments); };
			console.info = function () { originals.info.apply(console, arguments); push("info", arguments); };
			console.warn = function () { originals.warn.apply(console, arguments); push("warn", arguments); };
			console.error = function () { originals.error.apply(console, arguments); push("error", arguments); };
			console.debug = function () { originals.debug.apply(console, arguments); push("debug", arguments); };
		}
		function formatLogTime(ts) {
			var d = new Date(ts);
			function p(n) { return n < 10 ? "0" + n : String(n); }
			return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
		}

		/* =====================================================================
		 * 4) 多语言
		 * =================================================================== */
		var NS = "ui-panels";
		var DICT_ZH = {
			"shell.label": "IDE 面板",
			"fab.open": "打开 IDE 面板（Ctrl+Shift+S）",
			"fab.close": "收起 IDE 面板（Ctrl+Shift+S）",
			"fab.right": "切换右侧栏（Ctrl+Shift+J）",
			"fab.bottom": "切换底部面板（Ctrl+Shift+B）",
			"view.editor": "编辑器",
			"view.docs": "文档",
			"view.terminal": "终端",
			"view.browser": "浏览器",
			"view.changes": "代码变更",
			"view.general": "通用设置",
			"view.agent": "Agent 设置",
			"view.explorer": "资源管理器",
			"view.search": "搜索替换",
			"view.remote": "远程资源管理器",
			"view.source": "源代码管理",
			"view.extensions": "扩展管理",
			"view.debug": "调试控制台",
			"view.output": "输出",
			"view.chat": "对话",
			"view.files": "编辑器",
			"files.pathPlaceholder": "输入文件绝对路径，回车打开",
			"files.open": "打开",
			"files.hint": "输入文件绝对路径（如 C:\\Users\\you\\code\\main.ts）后回车，即可查看/编辑文件。",
			"editor.save": "保存",
			"editor.undo": "撤销",
			"editor.redo": "重做",
			"editor.cancel": "取消",
			"editor.saving": "保存中…",
			"editor.saved": "已保存",
			"editor.dirty": "未保存",
			"editor.saveError": "保存失败：",
			"editor.external": "外部打开",
			"changes.clean": "工作区没有变更",
			"changes.before": "更改前",
			"changes.after": "更改后（高亮为新增代码）",
			"changes.back": "返回变更列表",
			"changes.noBaseline": "尚未建立变更基线",
			"changes.noBaselineHint": "点击「建立基线」把当前所有文件存一份快照，之后修改的文件会显示在这里（本地对比，不依赖 git）。",
			"changes.snapshot": "建立基线",
			"browser.urlPlaceholder": "输入网址…",
			"browser.go": "打开",
			"browser.hint": "输入网址后回车，在此处嵌入浏览。部分站点会拒绝被嵌入。",
			"browser.back": "后退",
			"browser.fwd": "前进",
			"browser.reload": "刷新",
			"terminal.restart": "重连",
			"close": "关闭",
			"general.shell": "IDE 外壳",
			"general.shell.desc": "显示/隐藏整个右侧栏与底部面板外壳",
			"general.right": "右侧主侧栏",
			"general.right.desc": "编辑器/文档/终端/浏览器/代码变更/资源管理器/搜索/远程/源代码管理/扩展管理/设置",
			"general.bottom": "底部面板",
			"general.bottom.desc": "终端/调试控制台/输出",
			"general.shortcuts": "快捷键",
			"general.openSettings": "打开 DSH 设置面板",
			"general.openSettings.desc": "打开 DSH 官方设置（含模型/Agent 预设/插件等分区）",
			"agent.desc": "Agent 的模型、预设与权限在 DSH 官方设置中管理：",
			"agent.section.models": "模型：选择当前会话使用的模型",
			"agent.section.presets": "Agent 预设：切换思考模式/能力集",
			"agent.section.permissions": "权限：管理文件/命令/网络的批准策略",
			"agent.hint": "也可以直接在对话输入框使用 / 开头的命令（如 /agent）。",
			"explorer.workspaces": "工作区",
			"explorer.sessions": "会话",
			"explorer.new": "新建会话",
			"explorer.blank": "空白会话",
			"search.placeholder": "搜索文件（文件名或内容）",
			"search.go": "搜索",
			"search.both": "文件名+内容",
			"search.byName": "仅文件名",
			"search.byContent": "仅内容",
			"search.searching": "搜索中…",
			"search.inDir": "目录：",
			"search.found": "找到 {n} 个结果（扫描 {scanned} 个文件）",
			"search.empty": "没有匹配的文件",
			"remote.mode": "连接模式",
			"remote.local": "本地（loopback）",
			"remote.remote": "远程",
			"remote.desc": "浏览远程文件系统：WSL 发行版或 SSH 主机（需要已配置的 SSH 免密或密钥）。",
			"remote.sshHost": "SSH 主机（user@host）",
			"remote.ssh": "SSH 连接目标",
			"remote.wsl": "WSL 连接目标",
			"remote.noSsh": "未发现 SSH 配置（~/.ssh/config 的 Host）",
			"remote.noWsl": "未发现 WSL 发行版",
			"remote.back": "返回",
			"remote.loading": "加载中…",
			"remote.empty": "目录为空",
			"source.desc": "Git 源代码管理：查看变更、暂存、提交。",
			"source.noWorkspace": "请先在左侧选择一个会话/工作区",
			"source.noRepo": "当前文件夹中没有 Git 存储库",
			"source.noRepoHint": "可初始化一个仓库，它将实现 Git 提供支持的源代码管理功能。",
			"source.initRepo": "初始化仓库",
			"source.changes": "更改",
			"source.clean": "工作区干净，没有变更",
			"source.diff": "diff",
			"source.stage": "暂存",
			"source.unstage": "取消暂存",
			"source.commit": "提交",
			"source.commitMsg": "提交信息…",
			"source.log": "最近提交",
			"tools.title": "打开工具",
			"tools.subtitle": "使用工具，扩展更多能力",
			"tools.add": "选择要打开的功能",
			"tools.more": "展开未显示的工具",
			"fab.center": "切换中间工具区",
			"extensions.loaded": "已加载的插件",
			"extensions.open": "打开 DSH 插件设置",
			"extensions.desc": "插件列表来自客户端 loader；安装/停用请到 DSH 官方设置的「插件」分区。",
			"pm.title": "插件管理",
			"pm.desc": "查看 / 启用 / 禁用已安装插件，并可跳转其 GitHub 仓库。变更会写入 desktop profile 的 bundles，重启后生效。",
			"pm.refresh": "刷新",
			"pm.loading": "加载中…",
			"pm.none": "未发现可管理的插件",
			"pm.error": "加载失败",
			"pm.system": "系统内置",
			"pm.self": "本插件",
			"pm.restart": "重启后生效",
			"pm.github": "GitHub",
			"editor.current": "当前会话",
			"editor.none": "尚未选择会话",
			"editor.desc": "编辑器即中间主对话区——与 Agent 的对话、工具调用与结果都在这里呈现。",
			"editor.new": "新建会话",
			"docs.title": "DSH 文档",
			"docs.desc": "常用入口：",
			"docs.github": "DeepSeek Harness (GitHub)",
			"docs.site": "DSH 官方文档",
			"docs.plugin": "本插件说明（README）",
			"docs.shortcuts": "外壳快捷键",
			"terminal.desc": "终端能力由 Agent 的 bash / pwsh 工具提供。在对话中输入命令，Agent 会在你的工作区中执行并回报结果。",
			"terminal.tip": "提示：打开底部面板的「终端」标签可随时查看本说明；如需真实终端体验，请在对话中让 Agent 打开终端工具。",
			"browser.desc": "浏览器能力由 Agent 的 web 工具提供（网页抓取/搜索）。需要浏览网页、查询信息时，直接把需求告诉 Agent。",
			"browser.tip": "本面板为入口说明；浏览结果会以网页预览卡片的形式呈现在对话中。",
			"changes.desc": "代码变更概览需要 Host 端文件观察支持。当前工作区：",
			"changes.none": "（未连接工作区）",
			"changes.tip": "让 Agent 修改文件后，变更内容会展示在对话的工具结果中。",
			"debug.desc": "浏览器端 console 的 warn / error 消息（本插件捕获）。",
			"debug.empty": "暂无警告或错误。",
			"output.desc": "浏览器端 console 的 log / info 消息（本插件捕获）。",
			"output.empty": "暂无输出。",
			"output.clear": "清空",
			"shortcuts.shell": "开关外壳",
			"shortcuts.left": "切换左侧栏",
			"shortcuts.right": "切换右侧栏",
			"shortcuts.bottom": "切换底部面板",
			"view.errorTitle": "视图渲染出错",
			"view.errorHint": "错误详情已写入「调试控制台」。",
			"view.retry": "重试",
			"shell.errorTitle": "IDE 外壳渲染出错",
			"shell.errorHint": "错误详情已写入「调试控制台」。可点「重试」恢复，或「收起外壳」回到 DSH 界面。",
			"shell.close": "收起外壳"
		};
		var DICT_EN = {
			"shell.label": "IDE Panels",
			"fab.open": "Open IDE panels (Ctrl+Shift+S)",
			"fab.close": "Collapse IDE panels (Ctrl+Shift+S)",
			"fab.right": "Toggle right sidebar (Ctrl+Shift+J)",
			"fab.bottom": "Toggle bottom panel (Ctrl+Shift+B)",
			"view.editor": "Editor",
			"view.docs": "Docs",
			"view.terminal": "Terminal",
			"view.browser": "Browser",
			"view.changes": "Code Changes",
			"view.general": "General Settings",
			"view.agent": "Agent Settings",
			"view.explorer": "Explorer",
			"view.search": "Search & Replace",
			"view.remote": "Remote Explorer",
			"view.source": "Source Control",
			"view.extensions": "Extensions",
			"view.debug": "Debug Console",
			"view.output": "Output",
			"view.chat": "Chat",
			"view.files": "Editor",
			"files.pathPlaceholder": "Absolute file path, Enter to open",
			"files.open": "Open",
			"files.hint": "Type an absolute file path (e.g. C:\\Users\\you\\code\\main.ts) and press Enter to view/edit it.",
			"editor.save": "Save",
			"editor.undo": "Undo",
			"editor.redo": "Redo",
			"editor.cancel": "Cancel",
			"editor.saving": "Saving…",
			"editor.saved": "Saved",
			"editor.dirty": "Unsaved",
			"editor.saveError": "Save failed: ",
			"editor.external": "Open externally",
			"changes.clean": "No changes in workspace",
			"changes.before": "Before",
			"changes.after": "After (highlighted = new code)",
			"changes.back": "Back to changes",
			"changes.noBaseline": "No change baseline yet",
			"changes.noBaselineHint": "Click 'Create Baseline' to snapshot all files; changed files will show here afterwards (local diff, no git).",
			"changes.snapshot": "Create Baseline",
			"browser.urlPlaceholder": "Enter URL…",
			"browser.go": "Open",
			"browser.hint": "Enter a URL and press Enter to browse it inline. Some sites refuse embedding.",
			"browser.back": "Back",
			"browser.fwd": "Forward",
			"browser.reload": "Reload",
			"terminal.restart": "Reconnect",
			"close": "Close",
			"general.shell": "IDE shell",
			"general.shell.desc": "Show/hide the whole right-sidebar & bottom-panel shell",
			"general.right": "Right main sidebar",
			"general.right.desc": "Editor / Docs / Terminal / Browser / Changes / Explorer / Search / Remote / Source / Extensions / Settings",
			"general.bottom": "Bottom panel",
			"general.bottom.desc": "Terminal / Debug Console / Output",
			"general.shortcuts": "Shortcuts",
			"general.openSettings": "Open DSH settings",
			"general.openSettings.desc": "Open the official DSH settings (models / agent presets / plugins…)",
			"agent.desc": "Agent models, presets and permissions live in the official DSH settings:",
			"agent.section.models": "Models: pick the model for the current session",
			"agent.section.presets": "Agent presets: switch thinking mode / capability set",
			"agent.section.permissions": "Permissions: approve file / command / network policies",
			"agent.hint": "You can also type slash commands (e.g. /agent) in the composer.",
			"explorer.workspaces": "Workspaces",
			"explorer.sessions": "Sessions",
			"explorer.new": "New session",
			"explorer.blank": "Blank session",
			"search.placeholder": "Search files (name or content)",
			"search.go": "Search",
			"search.both": "Name+content",
			"search.byName": "Name only",
			"search.byContent": "Content only",
			"search.searching": "Searching…",
			"search.inDir": "In:",
			"search.found": "{n} results (scanned {scanned} files)",
			"search.empty": "No matching files",
			"remote.mode": "Connection mode",
			"remote.local": "Local (loopback)",
			"remote.remote": "Remote",
			"remote.desc": "Browse remote filesystems: WSL distros or SSH hosts (key-based auth required).",
			"remote.sshHost": "SSH host (user@host)",
			"remote.ssh": "SSH Targets",
			"remote.wsl": "WSL Targets",
			"remote.noSsh": "No SSH hosts found (~/.ssh/config Host)",
			"remote.noWsl": "No WSL distros found",
			"remote.back": "Back",
			"remote.loading": "Loading…",
			"remote.empty": "Empty directory",
			"source.desc": "Git source control: view changes, stage and commit.",
			"source.noWorkspace": "Select a session/workspace on the left first",
			"source.noRepo": "No Git repository in the current folder",
			"source.noRepoHint": "Initialize a repository to enable Git-powered source control.",
			"source.initRepo": "Initialize Repository",
			"source.changes": "Changes",
			"source.clean": "Working tree clean",
			"source.diff": "diff",
			"source.stage": "Stage",
			"source.unstage": "Unstage",
			"source.commit": "Commit",
			"source.commitMsg": "Commit message…",
			"source.log": "Recent commits",
			"tools.title": "Open a tool",
			"tools.subtitle": "Use tools to extend your capabilities",
			"tools.add": "Pick a feature to open",
			"tools.more": "Show hidden tools",
			"fab.center": "Toggle center tools area",
			"extensions.loaded": "Loaded plugins",
			"extensions.open": "Open DSH plugin settings",
			"extensions.desc": "The list comes from the client loader; install/disable plugins in the official settings' Plugins section.",
			"pm.title": "Plugin Manager",
			"pm.desc": "View, enable and disable installed plugins, and jump to their GitHub repos. Changes write to the desktop profile bundles and take effect after a restart.",
			"pm.refresh": "Refresh",
			"pm.loading": "Loading…",
			"pm.none": "No manageable plugins found",
			"pm.error": "Failed to load",
			"pm.system": "System",
			"pm.self": "This plugin",
			"pm.restart": "Restart required",
			"pm.github": "GitHub",
			"editor.current": "Current session",
			"editor.none": "No session selected",
			"editor.desc": "The editor IS the center conversation area — chat, tool calls and results appear there.",
			"editor.new": "New session",
			"docs.title": "DSH docs",
			"docs.desc": "Useful links:",
			"docs.github": "DeepSeek Harness (GitHub)",
			"docs.site": "DSH official docs",
			"docs.plugin": "This plugin README",
			"docs.shortcuts": "Shell shortcuts",
			"terminal.desc": "Terminal capability comes from the Agent's bash / pwsh tools. Type commands in the chat and the Agent runs them in your workspace.",
			"terminal.tip": "Tip: open the bottom panel's Terminal tab for this note; for a real terminal ask the Agent to open its terminal tool.",
			"browser.desc": "Browsing is done by the Agent's web tools. Just tell the Agent what to look up.",
			"browser.tip": "This panel is an entry note; browse results render as web cards in the conversation.",
			"changes.desc": "A code-changes overview needs Host file watching. Current workspace:",
			"changes.none": "(no workspace connected)",
			"changes.tip": "After the Agent edits files, changes appear in the tool results in the chat.",
			"debug.desc": "warn / error messages captured from the browser console.",
			"debug.empty": "No warnings or errors yet.",
			"output.desc": "log / info messages captured from the browser console.",
			"output.empty": "No output yet.",
			"output.clear": "Clear",
			"shortcuts.shell": "Toggle shell",
			"shortcuts.left": "Toggle left sidebar",
			"shortcuts.right": "Toggle right sidebar",
			"shortcuts.bottom": "Toggle bottom panel",
			"view.errorTitle": "View render error",
			"view.errorHint": "Details were written to the Debug Console.",
			"view.retry": "Retry",
			"shell.errorTitle": "IDE shell render error",
			"shell.errorHint": "Details were written to the Debug Console. Retry to recover, or collapse the shell to return to DSH.",
			"shell.close": "Collapse shell"
		};

		/* =====================================================================
		 * 5) 视图目录
		 * =================================================================== */
		/** 右侧主侧栏：资源管理器 / 搜索替换 / 源代码管理 / 远程资源管理器 / 扩展管理 / 通用设置 / Agent 设置。 */
		var RIGHT_VIEWS = [
			{ id: "explorer", icon: primitives.IconFolderOpenOutline16, labelKey: "view.explorer" },
			{ id: "search", icon: primitives.IconSearchOutline16, labelKey: "view.search" },
			{ id: "source", icon: primitives.IconBranchOutline16, labelKey: "view.source" },
			{ id: "remote", icon: primitives.IconGlobeOutline14, labelKey: "view.remote" },
			null,
			{ id: "extensions", icon: primitives.IconCordisPluginOutline14, labelKey: "view.extensions" },
			{ id: "general", icon: primitives.IconSettingsOutline16, labelKey: "view.general" },
			{ id: "agent", icon: primitives.IconAgentPresetOutline16, labelKey: "view.agent" }
		];
		/** 底部面板：终端 / 调试控制台 / 输出。 */
		var BOTTOM_VIEWS = [
			{ id: "terminal", icon: IconTerminal16, labelKey: "view.terminal" },
			{ id: "debug", icon: IconDebug16, labelKey: "view.debug" },
			{ id: "output", icon: IconOutput16, labelKey: "view.output" }
		];
		/** 中间标签工具（可打开为标签页）：编辑器 / 文档 / 终端 / 浏览器 / 代码变更。 */
		var CENTER_VIEWS = [
			{ id: "files", icon: primitives.IconFolderOpenOutline16, labelKey: "view.files" },
			{ id: "docs", icon: IconDocs16, labelKey: "view.docs" },
			{ id: "terminal", icon: IconTerminal16, labelKey: "view.terminal" },
			{ id: "browser", icon: primitives.IconBrowseOutline16, labelKey: "view.browser" },
			{ id: "changes", icon: primitives.IconEditOutline16, labelKey: "view.changes" }
		];
		/** 打开工具面板的完整工具列表（空状态时展示，点击打开对应标签页）。 */
		var OPEN_TOOLS = CENTER_VIEWS.slice(0);
		var VIEW_MAP = {};
		(function () {
			[].concat(CENTER_VIEWS, RIGHT_VIEWS, BOTTOM_VIEWS).forEach(function (v) {
				if (v) VIEW_MAP[v.id] = v;
			});
		})();
		/** 中间标签多开序号（同一工具可开多个实例，key = view + "-" + 序号）。 */
		var tabSeq = 0;

		/* =====================================================================
		 * 6) 视图组件
		 * =================================================================== */
		function h(type, props) {
			var children = Array.prototype.slice.call(arguments, 2);
			return react.createElement.apply(react, [type, props].concat(children));
		}

		/** 面板头（标题 + 关闭按钮）。 */
		function PanelHeader(props) {
			return h("div", { className: "dp-panel-head" },
				h("span", { className: "dp-panel-title" }, props.title),
				h("button", {
					type: "button",
					className: "dp-panel-close",
					"aria-label": props.t("close"),
					title: props.t("close"),
					onClick: props.onClose
				}, h(primitives.IconCloseOutline16, { size: 14 }))
			);
		}

		/** 通用占位说明视图（图标 + 标题 + 说明行）。 */
		function InfoView(props) {
			var Icon = props.icon;
			return h("div", null,
				h("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "10px 0 4px" } },
					h(Icon, { size: 18 }),
					h("span", { style: { fontSize: 14, fontWeight: 500, color: "var(--dsw-alias-label-primary)" } }, props.title)
				),
				props.rows.map(function (row, i) {
					return h("p", { key: i, className: "dp-hint", style: { marginTop: 6 } }, row);
				})
			);
		}

		/** 编辑器视图：当前会话信息。 */
		function EditorView(props) {
			var sessions = props.sessions;
			var workspaces = props.workspaces;
			var ss = react.useSyncExternalStore(sessions.list.subscribe, sessions.list.getSnapshot);
			var ws = react.useSyncExternalStore(workspaces.list.subscribe, workspaces.list.getSnapshot);
			var current = ss.current !== void 0 ? ss.byId[ss.current] : void 0;
			var t = props.t;
			var startNew = function () {
				var first = ws.items && ws.items[0];
				if (!first) return;
				workspaces.connectWorkspace(first.workspaceId).then(function (id) {
					if (id) sessions.open(id);
				}).catch(function () {});
			};
			return h("div", null,
				h("div", { className: "dp-section-title" }, t("editor.current")),
				current ? h("div", { className: "dp-list" },
					h("div", { className: "dp-item", "data-active": true },
						h("span", { className: "dp-item-title" }, current.title || "(untitled)"),
						h("span", { className: "dp-item-sub" }, current.cwd || (current.blank ? t("explorer.blank") : ""))
					)
				) : h("div", { className: "dp-empty" }, t("editor.none")),
				h("p", { className: "dp-hint", style: { marginTop: 10 } }, t("editor.desc")),
				ws.items && ws.items.length > 0 && h("button", {
					type: "button",
					className: "dp-btn",
					"data-primary": true,
					onClick: startNew
				}, t("editor.new"))
			);
		}

		/** 文档视图：链接 + 快捷键。 */
		function DocsView(props) {			var t = props.t;
			var link = function (href, text) {
				return h("a", { key: href, className: "dp-link", href: href, target: "_blank", rel: "noreferrer" }, text);
			};
			var kbd = function (label, keys) {
				return h("div", { key: label, style: { display: "flex", alignItems: "center", gap: 8, padding: "3px 0" } },
					h("span", { style: { flex: 1, fontSize: 13, color: "var(--dsw-alias-label-primary)" } }, label),
					h("span", null, keys.map(function (k, i) { return h("span", { key: i }, i > 0 ? " + " : null, h("span", { className: "dp-kbd" }, k)); }))
				);
			};
			return h("div", null,
				h("div", { className: "dp-section-title", style: { marginTop: 4 } }, t("docs.desc")),
				h("div", { style: { display: "flex", flexDirection: "column", gap: 4 } },
					link("https://github.com/deepseek-ai/deepseek-harness", t("docs.github")),
					link("https://deepseek-ai.github.io/deepseek-harness/", t("docs.site")),
					link("https://github.com/anywhere-labs/deepseek-harness-desktop", t("docs.plugin"))
				),
				h("div", { className: "dp-section-title", style: { marginTop: 10 } }, t("docs.shortcuts")),
				kbd(t("shortcuts.shell"), ["Ctrl", "Shift", "S"]),
				kbd(t("shortcuts.right"), ["Ctrl", "Shift", "J"]),
				kbd(t("shortcuts.bottom"), ["Ctrl", "Shift", "B"])
			);
		}

		/** xterm 加载状态（模块级，只加载一次）。 */
		var xtermLoading = false;
		function ensureXterm(cb) {
			if (typeof window !== "undefined" && window.Terminal) { cb(); return; }
			if (xtermLoading) {
				var wait1 = window.setInterval(function () {
					if (window.Terminal) { window.clearInterval(wait1); cb(); }
				}, 50);
				return;
			}
			xtermLoading = true;
			try {
				var link = document.createElement("link");
				link.rel = "stylesheet";
				link.href = "/dsh-ui-panels/xterm/xterm.css";
				document.head.appendChild(link);
				var script = document.createElement("script");
				script.src = "/dsh-ui-panels/xterm/xterm.js";
				script.onload = function () {
					var wait2 = window.setInterval(function () {
						if (window.Terminal) { window.clearInterval(wait2); cb(); }
					}, 50);
				};
				script.onerror = function () { cb && cb(new Error("xterm load failed")); };
				document.head.appendChild(script);
			} catch (e) {
				xtermLoading = false;
				cb && cb(e);
			}
		}

		/** 终端视图：真实 PowerShell（node-pty + xterm.js，轮询读写）。 */
		function TerminalView(props) {
			var t = props.t;
			var sessions = props.sessions;
			var ss = react.useSyncExternalStore(sessions.list.subscribe, sessions.list.getSnapshot);
			var current = ss.current !== void 0 ? ss.byId[ss.current] : void 0;
			var cwd = (current && current.cwd) || "";
			var hostRef = react.useRef(null);
			var sessionKeyState = react.useState(0);
			var sessionKey = sessionKeyState[0];
			var bumpKey = sessionKeyState[1];
			var statusState = react.useState("idle");
			var status = statusState[0];
			var setStatus = statusState[1];

			react.useEffect(function () {
				var host = hostRef.current;
				if (!host) return;
				var term = null;
				var ptyInfo = null;
				var pollTimer = null;
				var disposed = false;
				var onDataOff = null;
				/* 声明提到 useEffect 顶层（清理函数需要引用）：滚轮缩放 + 容器自适应 */
				var onWheel = null;
				var fitTerm = null;
				var ro = null;
				setStatus("loading");
				ensureXterm(function (err) {
					if (disposed) return;
					if (err) { setStatus("error:" + String(err.message || err)); return; }
					try {
						host.innerHTML = "";
						term = new window.Terminal({
							cursorBlink: true,
							fontSize: 13,
							fontFamily: "ui-monospace, Consolas, monospace",
							scrollback: 2000,
							theme: {
								background: "var(--dsw-alias-bg-layer-2)",
								foreground: "var(--dsw-alias-label-primary)",
								cursor: "var(--dsw-alias-brand-primary)",
								cursorAccent: "#fff",
								selectionBackground: "color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent)",
								selectionForeground: "var(--dsw-alias-label-primary)"
							}
						});
						// 按容器尺寸估算 cols/rows
						var w = host.clientWidth || 600;
						var h = host.clientHeight || 240;
						term.resize(Math.max(20, Math.floor(w / 8)), Math.max(5, Math.floor(h / 18)));
						term.open(host);
						term.writeln("正在启动 PowerShell…");
						/* Ctrl+滚轮 缩放字号（自由拉伸终端文字） */
						onWheel = function (e) {
							if (!e.ctrlKey || !term) return;
							e.preventDefault();
							var cur = term.options.fontSize || 13;
							var next = Math.max(8, Math.min(28, cur + (e.deltaY < 0 ? 1 : -1)));
							term.options.fontSize = next;
							try { term.refresh(); } catch (e2) { /* 忽略 */ }
						};
						host.addEventListener("wheel", onWheel, { passive: false });
						/* 容器尺寸变化（底部面板拉伸/窗口缩放）时自适应 cols/rows，避免内容被截断 */
						fitTerm = function () {
							if (!term || disposed) return;
							var cw = host.clientWidth || 0;
							var ch = host.clientHeight || 0;
							if (cw < 20 || ch < 20) return;
							var fs = term.options.fontSize || 13;
							var cols = Math.max(20, Math.floor(cw / (fs * 0.62)));
							var rows = Math.max(5, Math.floor(ch / (fs * 1.45)));
							term.resize(cols, rows);
						};
						try { if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(fitTerm); ro.observe(host); } } catch (e2) { /* 忽略 */ }
						window.addEventListener("resize", fitTerm);
						setTimeout(fitTerm, 60);
						fetch("/dsh-ui-panels/pty/start", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ cwd: cwd })
						})
							.then(function (r) { return r.json(); })
							.then(function (json) {
								if (disposed) return;
								if (json && json.ok) {
									ptyInfo = { id: json.id, since: 0 };
									setStatus("ready");
									onDataOff = term.onData(function (data) {
										if (ptyInfo) {
											fetch("/dsh-ui-panels/pty/write", {
												method: "POST",
												headers: { "Content-Type": "application/json" },
												body: JSON.stringify({ id: ptyInfo.id, data: data })
											}).catch(function () {});
										}
									});
									pollTimer = window.setInterval(function () {
										if (!ptyInfo || disposed) return;
										fetch("/dsh-ui-panels/pty/read?id=" + encodeURIComponent(ptyInfo.id) + "&since=" + ptyInfo.since)
											.then(function (r) { return r.json(); })
											.then(function (j) {
												if (disposed || !ptyInfo) return;
												if (j && j.ok && j.out) {
													ptyInfo.since = j.at;
													term.write(j.out);
												}
											})
											.catch(function () {});
									}, 80);
								} else {
									setStatus("error:" + ((json && json.error) || "start failed"));
								}
							})
							.catch(function (e) { if (!disposed) setStatus("error:" + String(e)); });
					} catch (e) {
						if (!disposed) setStatus("error:" + String((e && e.message) || e));
					}
				});
				return function () {
					disposed = true;
					if (pollTimer) window.clearInterval(pollTimer);
					if (onDataOff) { try { onDataOff.dispose(); } catch (e) { /* 忽略 */ } }
					try { host.removeEventListener("wheel", onWheel); } catch (e) { /* 忽略 */ }
					try { window.removeEventListener("resize", fitTerm); } catch (e) { /* 忽略 */ }
					if (ro) { try { ro.disconnect(); } catch (e) { /* 忽略 */ } }
					if (ptyInfo) {
						fetch("/dsh-ui-panels/pty/kill", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ id: ptyInfo.id })
						}).catch(function () {});
					}
					if (term) { try { term.dispose(); } catch (e) { /* 忽略 */ } }
				};
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [sessionKey]);

			return h("div", { className: "dp-terminal" },
				h("div", { className: "dp-terminal-bar" },
					h("span", { className: "dp-hint", style: { flex: 1, margin: 0, fontSize: 12 } }, "PowerShell" + (cwd ? " — " + cwd : "")),
					h("button", { type: "button", className: "dp-btn", style: { padding: "2px 10px" }, onClick: function () { bumpKey(function (k) { return k + 1; }); } }, t("terminal.restart"))
				),
				status.indexOf("error:") === 0 && h("div", { className: "dp-view-error" }, status.slice(6)),
				h("div", { key: "host-" + sessionKey, ref: hostRef, className: "dp-terminal-host" })
			);
		}

		/** 浏览器视图。 */
		function BrowserView(props) {
			var t = props.t;
			return h(InfoView, {
				icon: primitives.IconBrowseOutline16,
				title: t("view.browser"),
				rows: [t("browser.desc"), t("browser.tip")]
			});
		}

		/** 代码变更视图：本地文件快照对比（不依赖 git）。首次建立基线，之后列出修改的文件；点击看前后对比 + 新增高亮。 */
		function ChangesView(props) {
			var t = props.t;
			var sessions = props.sessions;
			var ss = react.useSyncExternalStore(sessions.list.subscribe, sessions.list.getSnapshot);
			var current = ss.current !== void 0 ? ss.byId[ss.current] : void 0;
			var root = (current && current.cwd) || "";
			var state = react.useState({ status: "loading", baseline: false, changed: [], error: null, sel: null, oldText: "", newText: "", hi: [], loadState: "idle" });
			var data = state[0];
			var setData = state[1];
			function load() {
				if (!root) { setData(Object.assign({}, data, { status: "error", changed: [], error: t("changes.none"), baseline: false })); return; }
				setData(Object.assign({}, data, { status: "loading", changed: [], error: null }));
				fetchJson("/dsh-ui-panels/changes?action=list&path=" + encodeURIComponent(root))
					.then(function (json) {
						if (json && json.ok) setData(Object.assign({}, data, { status: "ready", baseline: json.baseline !== false, changed: json.changed || [], error: null }));
						else setData(Object.assign({}, data, { status: "error", changed: [], error: (json && json.error) || "failed", baseline: false }));
					})
					.catch(function (e) { setData(Object.assign({}, data, { status: "error", changed: [], error: String(e), baseline: false })); });
			}
			react.useEffect(function () { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [root]);
			function snapshot() {
				setData(Object.assign({}, data, { status: "loading" }));
				fetchJson("/dsh-ui-panels/changes?action=snapshot&path=" + encodeURIComponent(root))
					.then(function (j) { load(); })
					.catch(function (e) { setData(Object.assign({}, data, { status: "error", error: String(e) })); });
			}
			/* 点击文件 → 读 旧(快照)/新(当前) + 新增行号 */
			function openCompare(c) {
				var full = c.path.indexOf(":") >= 2 || c.path.indexOf("\\") >= 0 || c.path.indexOf("/") >= 0 ? c.path : joinPath(root, c.path);
				setData(Object.assign({}, data, { sel: c, oldText: "", newText: "", hi: [], loadState: "loading" }));
				fetchJson("/dsh-ui-panels/changes?action=diff&path=" + encodeURIComponent(root) + "&file=" + encodeURIComponent(c.path))
					.then(function (j) {
						if (j && j.ok) setData(Object.assign({}, data, { sel: c, oldText: j.old || "", newText: j.new || "", hi: j.lines || [], loadState: "ready" }));
						else setData(Object.assign({}, data, { sel: c, loadState: "ready", error: (j && j.error) || "diff failed" }));
					})
					.catch(function (e) { setData(Object.assign({}, data, { sel: c, loadState: "ready", error: String(e) })); });
			}
			var statusLabel = function (s) {
				if (s === "A") return "A";
				if (s === "M") return "M";
				if (s === "D") return "D";
				return s || "?";
			};
			/* 对比视图：左=更改前(基线)，右=更改后(当前)，新增行高亮 */
			if (data.sel) {
				var selPath = data.sel.path;
				var newLines = data.newText.split("\n");
				var oldLines = data.oldText.split("\n");
				return h("div", { className: "dp-cmp" },
					h("div", { className: "dp-cmp-head" },
						h("button", { type: "button", className: "dp-btn", style: { padding: "2px 8px" }, onClick: function () { setData(Object.assign({}, data, { sel: null })); } }, "← " + t("changes.back")),
						h("span", { className: "dp-item-sub", style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, selPath),
						h("span", { className: "dp-tag" }, statusLabel(data.sel.status))
					),
					data.loadState === "loading" && h("div", { className: "dp-empty" }, t("pm.loading")),
					data.loadState === "ready" && h("div", { className: "dp-cmp-body" },
						h("div", { className: "dp-cmp-col" },
							h("div", { className: "dp-cmp-col-title" }, t("changes.before")),
							h("div", { className: "dp-cmp-code" }, oldLines.map(function (l, i) {
								return h("div", { key: i, className: "dp-cmp-line" }, h("span", { className: "dp-code-num" }, i + 1), h("span", { className: "dp-cmp-text" }, l || " "));
							}))
						),
						h("div", { className: "dp-cmp-col" },
							h("div", { className: "dp-cmp-col-title" }, t("changes.after")),
							h("div", { className: "dp-cmp-code" }, newLines.map(function (l, i) {
								var isNew = data.hi.indexOf(i + 1) >= 0;
								return h("div", { key: i, className: "dp-cmp-line" + (isNew ? " dp-cmp-new" : "") }, h("span", { className: "dp-code-num" }, i + 1), h("span", { className: "dp-cmp-text" }, l || " "));
							}))
						)
					)
				);
			}
			return h("div", null,
				h("div", { className: "dp-group-head" },
					h(primitives.IconBranchOutline16, { size: 14 }),
					h("span", { style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, root || t("changes.none")),
					h("button", { type: "button", className: "dp-panel-close", style: { width: 20, height: 20 }, title: t("pm.refresh"), onClick: load }, "⟳")
				),
				data.status === "loading" && h("div", { className: "dp-empty" }, t("pm.loading")),
				data.error && h("div", { className: "dp-hint" }, data.error),
				data.status === "ready" && !data.baseline && root && h("div", { className: "dp-scm-empty" },
					h("div", { className: "dp-scm-empty-title" }, t("changes.noBaseline")),
					h("p", { className: "dp-hint" }, t("changes.noBaselineHint")),
					h("button", { type: "button", className: "dp-btn", "data-primary": true, onClick: snapshot }, t("changes.snapshot"))
				),
				data.status === "ready" && data.baseline && (data.changed.length === 0
					? h("div", { className: "dp-empty" }, t("changes.clean"))
					: h("div", { className: "dp-list" }, data.changed.map(function (c) {
						return h("button", {
							key: c.path,
							type: "button",
							className: "dp-item",
							style: { flexDirection: "row", alignItems: "center", gap: 8 },
							onClick: function () { openCompare(c); }
						},
							h("span", { className: "dp-tag", style: { flex: "none" } }, statusLabel(c.status)),
							h("span", { className: "dp-item-title", style: { fontSize: 12 } }, c.path)
						);
					})))
			);
		}
		/** 拼接路径（Windows 反斜杠兼容）。 */
		function joinPath(base, rel) {
			var sep = base.indexOf("\\") >= 0 ? "\\" : "/";
			return base.replace(/[\\/]+$/, "") + sep + rel.replace(/^[\\/]+/, "").replace(/\//g, sep);
		}

		/** 诊断上报：把客户端状态/错误 POST 到 host（写入 profile 的 dsh-ui-panels-diag.jsonl，便于排查）。 */
		function reportDiag(payload) {
			try {
				fetch("/dsh-ui-panels/diag", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				}).catch(function () {});
			} catch (e) { /* 忽略 */ }
		}

		/** fetch + JSON 校验：host 路由未注册（旧版本 host）会返回 HTML 404，这里转成友好错误而不是 SyntaxError。 */
		function fetchJson(url, opts) {
			return fetch(url, opts).then(function (r) {
				var ct = "";
				try { ct = (r.headers && r.headers.get && r.headers.get("content-type")) || ""; } catch (e) { /* 忽略 */ }
				if (ct.indexOf("application/json") < 0) {
					throw new Error("host 接口返回 " + r.status + "（可能是旧版本 host，请重启应用后重试）");
				}
				return r.json();
			});
		}

		/** 布局探针：上报真实 DOM 计算布局，用于排查"中间/右侧共用空间"。 */
		function layoutProbe() {
			var out = {};
			try {
				var b = document.body;
				out.dpChat = b.style.getPropertyValue("--dp-chat");
				out.dpRight = b.style.getPropertyValue("--dp-right");
				out.dpLeft = b.style.getPropertyValue("--dp-left");
				out.dpStrip = b.style.getPropertyValue("--dp-strip");
				out.dpTop = b.style.getPropertyValue("--dp-top");
				out.dpFabTop = b.style.getPropertyValue("--dp-fab-top");
				out.dpFabLeft = b.style.getPropertyValue("--dp-fab-left");
				out.bodyAttr = b.getAttribute("data-dp-shell");
				/* 窗口/DPI 指标：排查"CSS 像素 vs 物理像素"导致的视觉错位 */
				try {
					out.winInner = window.innerWidth + "x" + window.innerHeight;
					out.winOuter = (window.outerWidth || 0) + "x" + (window.outerHeight || 0);
					out.dpr = window.devicePixelRatio;
					out.screen = (typeof screen !== "undefined" && screen) ? screen.width + "x" + screen.height + " avail " + screen.availWidth + "x" + screen.availHeight : "?";
					var de = document.documentElement.getBoundingClientRect();
					out.docEl = Math.round(de.width) + "x" + Math.round(de.height) + "|sw=" + document.documentElement.scrollWidth + "|cw=" + document.documentElement.clientWidth;
					out.bodyW = Math.round(b.getBoundingClientRect().width) + "|bsw=" + b.scrollWidth;
				} catch (eM) { /* 忽略 */ }
				try { tagFrame(); } catch (eT) { /* 忽略 */ }
				var f = findFrameEl();
				out.frameFound = !!f;
				out.frameClass = f ? String(f.className || "").slice(0, 48) : "";
				var frames = f ? [f] : [];
				out.frameCount = frames.length;
				if (f) {
					out.frameGridInline = f.style.gridTemplateColumns;
					out.frameRect = Math.round(f.getBoundingClientRect().width) + "x" + Math.round(f.getBoundingClientRect().height);
					var layerEl = document.querySelector("[data-shell-overlay]");
					if (layerEl) { var lr = layerEl.getBoundingClientRect(); out.overlayRect = Math.round(lr.left) + "," + Math.round(lr.top) + "," + Math.round(lr.width) + "x" + Math.round(lr.height); }
					var colRects = [];
					for (var ci = 1; ci <= 3; ci++) {
						var ce = f.querySelector('[data-dp-col="' + ci + '"]');
						if (ce) { var cr = ce.getBoundingClientRect(); colRects.push(ci + ":" + Math.round(cr.left) + "," + Math.round(cr.top) + "," + Math.round(cr.width) + "x" + Math.round(cr.height)); }
						else { colRects.push(ci + ":none"); }
					}
					out.colRects = colRects;

					out.frameGrid = getComputedStyle(f).gridTemplateColumns;
					var kids = f.children;
					out.kidCount = kids.length;
					var kidInfo = [];
					for (var i = 0; i < kids.length; i++) {
						var k = kids[i];
						var r = k.getBoundingClientRect();
						var cs = getComputedStyle(k);
						kidInfo.push(i + ":" + String(k.className || "").slice(0, 30) + "|col=" + cs.gridColumn + "|x=" + Math.round(r.left) + "|y=" + Math.round(r.top) + "|w=" + Math.round(r.width) + "|h=" + Math.round(r.height) + "|sw=" + k.scrollWidth + "|cw=" + k.clientWidth);
					}
					out.kids = kidInfo;
				}
				var root = document.querySelector(".dp-root");
				out.root = !!root;
				if (root) {
					var r0 = root.getBoundingClientRect();
					out.rootRect = Math.round(r0.left) + "," + Math.round(r0.top) + "," + Math.round(r0.width) + "x" + Math.round(r0.height);
					var q = root.querySelector(".dp-center");
					if (q) { var rc = q.getBoundingClientRect(); out.centerRect = Math.round(rc.left) + "," + Math.round(rc.top) + "," + Math.round(rc.width) + "x" + Math.round(rc.height) + "|sw=" + q.scrollWidth + "|cw=" + q.clientWidth; var qt = q.querySelector(".dp-center-tabs"); if (qt) { var rt = qt.getBoundingClientRect(); out.tabsRect = Math.round(rt.left) + "," + Math.round(rt.top) + "," + Math.round(rt.width) + "x" + Math.round(rt.height); } }
					var q2 = root.querySelector(".dp-bottom");
					if (q2) { var rb = q2.getBoundingClientRect(); out.bottomRect = Math.round(rb.left) + "," + Math.round(rb.top) + "," + Math.round(rb.width) + "x" + Math.round(rb.height); } else { out.bottomRect = "ABSENT"; }
					var q4 = root.querySelector(".dp-fab-row");
					if (q4) { var rf = q4.getBoundingClientRect(); out.fabRect = Math.round(rf.left) + "," + Math.round(rf.top) + "," + Math.round(rf.width) + "x" + Math.round(rf.height); }
				}
				var rs = document.querySelector(".dp-right-sidebar");
				out.rightSidebar = !!rs;
				if (rs) { var rrs = rs.getBoundingClientRect(); out.rightSidebarRect = Math.round(rrs.left) + "," + Math.round(rrs.top) + "," + Math.round(rrs.width) + "x" + Math.round(rrs.height); }
				var railEl = document.querySelector(".dp-right-sidebar .dp-rail");
				out.rail = !!railEl;
				if (railEl) {
					var rl = railEl.getBoundingClientRect();
					out.railRect = Math.round(rl.left) + "," + Math.round(rl.top) + "," + Math.round(rl.width) + "x" + Math.round(rl.height);
					out.railKids = railEl.children.length;
					out.railBtns = railEl.querySelectorAll("button").length;
					try {
						var rb0 = railEl.querySelector("button");
						if (rb0) {
							var cs0 = getComputedStyle(rb0);
							out.railBtn0 = "color=" + cs0.color + "|bg=" + cs0.backgroundColor + "|svg=" + (rb0.querySelector("svg") ? rb0.querySelector("svg").getAttribute("width") + "x" + rb0.querySelector("svg").getAttribute("height") : "none");
							out.railBtn0Html = rb0.innerHTML.slice(0, 120);
						}
						var btnRects = [];
						var bts = railEl.querySelectorAll("button");
						for (var bi = 0; bi < bts.length; bi++) {
							var br = bts[bi].getBoundingClientRect();
							btnRects.push(bi + ":" + Math.round(br.left) + "," + Math.round(br.top) + "," + Math.round(br.width) + "x" + Math.round(br.height));
						}
						out.railBtnRects = btnRects;
					} catch (e2) { /* 忽略 */ }
				}
				// 标题栏与顶部元素识别：找顶部 (top<60) 的宽元素（标题栏），以及含 DeepSeek 文本的元素
				var tbs = [];
				try {
					var allEls = document.querySelectorAll("div,header,section,nav,button");
					for (var i = 0; i < allEls.length; i++) {
						var el = allEls[i];
						var r = el.getBoundingClientRect();
						if (r.width < 200 || r.height < 20 || r.height > 70 || r.top > 60) continue;
						var txt = (el.textContent || "").replace(/\s+/g, " ").trim();
						if (txt.indexOf("DeepSeek") >= 0 || /(title|topbar|titlebar|header)/i.test(String(el.className || ""))) {
							if (tbs.length < 6) tbs.push(String(el.className || "").slice(0, 40) + "|" + Math.round(r.top) + "," + Math.round(r.height) + "x" + Math.round(r.width) + "|" + txt.slice(0, 30));
						}
					}
				} catch (e) { /* 忽略 */ }
				out.topEls = tbs;
			} catch (e) { out.err = String((e && e.message) || e); }
			return out;
		}

		/** 编辑器视图：可编辑文件（行号 + 保存/撤销/重做/取消 + Ctrl+S），经 host 路由读写；资源管理器点击文件自动打开。 */
		function FilesView(props) {
			var t = props.t;
			var sessions = props.sessions;
			var ss = react.useSyncExternalStore(sessions.list.subscribe, sessions.list.getSnapshot);
			var current = ss.current !== void 0 ? ss.byId[ss.current] : void 0;
			var pathState = react.useState((current && current.cwd) || "");
			var path = pathState[0];
			var setPath = pathState[1];
			var contentState = react.useState({ status: "idle", size: 0, error: null, truncated: false, path: "" });
			var content = contentState[0];
			var setContent = contentState[1];
			var valueState = react.useState("");
			var value = valueState[0];
			var setValue = valueState[1];
			var savedState = react.useState("");
			var saved = savedState[0];
			var setSaved = savedState[1];
			var saveState = react.useState(""); // "" | "saving" | "saved" | error...
			var saveStatus = saveState[0];
			var setSaveStatus = saveState[1];
			var gutterRef = react.useRef(null);
			var taRef = react.useRef(null);
			var vBarRef = react.useRef(null);
			var hBarRef = react.useRef(null);
			var openReq = react.useSyncExternalStore(fileOpenStore.subscribe, fileOpenStore.getSnapshot);
			var dirty = value !== saved;

			function load(target) {
				var finalTarget = (target !== void 0 ? target : path).trim();
				if (!finalTarget) return;
				if (target !== void 0) setPath(finalTarget);
				setContent({ status: "loading", size: 0, error: null, truncated: false, path: finalTarget });
				fetch("/dsh-ui-panels/fs?path=" + encodeURIComponent(finalTarget))
					.then(function (r) { return r.json(); })
					.then(function (json) {
						if (json && json.ok) {
							setContent({ status: "ready", size: json.size || 0, error: null, truncated: !!json.truncated, path: json.path || finalTarget });
							setValue(json.text || "");
							setSaved(json.text || "");
							setSaveStatus("");
						} else {
							setContent({ status: "error", size: 0, error: (json && json.error) || "read failed", truncated: false, path: finalTarget });
						}
					})
					.catch(function (e) {
						setContent({ status: "error", size: 0, error: String(e), truncated: false, path: finalTarget });
					});
			}
			// 资源管理器点击文件 → 自动加载
			react.useEffect(function () {
				if (openReq && openReq.path) load(openReq.path);
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [openReq && openReq.path]);

			function save() {
				var target = path.trim();
				if (!target || !dirty) return;
				setSaveStatus("saving");
				fetch("/dsh-ui-panels/fs", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ path: target, content: value })
				})
					.then(function (r) { return r.json(); })
					.then(function (json) {
						if (json && json.ok) {
							setSaved(value);
							setSaveStatus("saved");
						} else {
							setSaveStatus("error:" + ((json && json.error) || "save failed"));
						}
					})
					.catch(function (e) { setSaveStatus("error:" + String(e)); });
			}
			function undo() {
				try { document.execCommand("undo"); } catch (e) { /* 忽略 */ }
			}
			function cancelEdit() {
				setValue(saved);
				setSaveStatus("");
			}
			function openExternal() {
				var target = (content.path || path).trim();
				if (!target) return;
				fetch("/dsh-ui-panels/open-external", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ path: target })
				}).catch(function () { /* 忽略 */ });
			}
			function onKeyDown(e) {
				if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "s") {
					e.preventDefault();
					save();
				}
			}
			function onScroll(e) {
				if (gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop;
				syncScrollBars();
			}
			/* 自定义滚动条：滑块随内容同步；横向滚动条固定在编辑器底部（不随内容上下移动） */
			function syncScrollBars() {
				var ta = taRef.current;
				if (!ta) return;
				var vs = vBarRef.current;
				var hs = hBarRef.current;
				if (!syncScrollBars.diaged) {
					syncScrollBars.diaged = true;
					try { reportDiag({ type: "editor-scroll", sh: ta.scrollHeight, ch: ta.clientHeight, sw: ta.scrollWidth, cw: ta.clientWidth, vDisp: vs ? vs.style.display : "no-vs", hDisp: hs ? hs.style.display : "no-hs", ready: !!document.querySelector(".dp-editor-textarea") }); } catch (e) { /* 忽略 */ }
				}
				if (vs) {
					var vMax = ta.scrollHeight - ta.clientHeight;
					if (vMax > 0) {
						var vH = Math.max(20, Math.min(ta.clientHeight * 0.8, (ta.clientHeight * ta.clientHeight) / ta.scrollHeight));
						vs.style.height = vH + "px";
						vs.style.top = (ta.scrollTop / vMax) * (ta.clientHeight - vH - 8) + "px";
						vs.style.display = "block";
					} else {
						vs.style.display = "none";
					}
				}
				if (hs) {
					var hMax = ta.scrollWidth - ta.clientWidth;
					if (hMax > 0) {
						var hW = Math.max(30, Math.min(ta.clientWidth * 0.8, (ta.clientWidth * ta.clientWidth) / ta.scrollWidth));
						hs.style.width = hW + "px";
						hs.style.left = (ta.scrollLeft / hMax) * (ta.clientWidth - hW - 8) + "px";
						hs.style.display = "block";
					} else {
						hs.style.display = "none";
					}
				}
			}
			function startVScroll(e) {
				e.preventDefault();
				var ta = taRef.current, bar = vBarRef.current;
				if (!ta || !bar) return;
				var startY = e.clientY;
				var startTop = ta.scrollTop;
				var onMove = function (ev) {
					var dy = ev.clientY - startY;
					var vMax = ta.scrollHeight - ta.clientHeight;
					var trackH = Math.max(1, ta.clientHeight - bar.clientHeight);
					ta.scrollTop = Math.max(0, Math.min(vMax, startTop + (dy / trackH) * vMax));
					syncScrollBars();
				};
				var onUp = function () {
					document.removeEventListener("pointermove", onMove);
					document.removeEventListener("pointerup", onUp);
				};
				document.addEventListener("pointermove", onMove);
				document.addEventListener("pointerup", onUp);
			}
			function startHScroll(e) {
				e.preventDefault();
				var ta = taRef.current, bar = hBarRef.current;
				if (!ta || !bar) return;
				var startX = e.clientX;
				var startLeft = ta.scrollLeft;
				var onMove = function (ev) {
					var dx = ev.clientX - startX;
					var hMax = ta.scrollWidth - ta.clientWidth;
					var trackW = Math.max(1, ta.clientWidth - bar.clientWidth);
					ta.scrollLeft = Math.max(0, Math.min(hMax, startLeft + (dx / trackW) * hMax));
					syncScrollBars();
				};
				var onUp = function () {
					document.removeEventListener("pointermove", onMove);
					document.removeEventListener("pointerup", onUp);
				};
				document.addEventListener("pointermove", onMove);
				document.addEventListener("pointerup", onUp);
			}
			/* 内容/尺寸变化后同步滚动条（打开文件后延时同步） */
			react.useEffect(function () {
				var t1 = setTimeout(syncScrollBars, 60);
				var t2 = setTimeout(syncScrollBars, 300);
				return function () { clearTimeout(t1); clearTimeout(t2); };
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [value, content.status]);
			var lineCount = value.split("\n").length;
			var numbers = [];
			for (var i = 1; i <= lineCount; i++) numbers.push(i);
			var statusText = saveStatus === "saving" ? t("editor.saving") : saveStatus === "saved" ? t("editor.saved") : saveStatus.indexOf("error:") === 0 ? t("editor.saveError") + saveStatus.slice(6) : dirty ? t("editor.dirty") : "";

			return h("div", null,
				h("div", { className: "dp-editor-toolbar" },
					h("input", {
						className: "dp-input",
						style: { flex: 1, minWidth: 120, fontFamily: "inherit" },
						placeholder: t("files.pathPlaceholder"),
						value: path,
						onChange: function (e) { setPath(e.target.value); },
						onKeyDown: function (e) { if (e.key === "Enter") load(); }
					}),
					h("button", { type: "button", className: "dp-btn", onClick: function () { load(); } }, t("files.open")),
					h("button", {
						type: "button",
						className: "dp-btn",
						"data-primary": dirty ? true : void 0,
						disabled: !dirty || saveStatus === "saving",
						onClick: save
					}, t("editor.save")),
					h("button", { type: "button", className: "dp-btn", disabled: !dirty, onClick: undo }, t("editor.undo")),
					h("button", { type: "button", className: "dp-btn", disabled: !dirty, onClick: cancelEdit }, t("editor.cancel")),
					h("button", {
						type: "button",
						className: "dp-btn",
						disabled: !content.path,
						onClick: openExternal
					}, t("editor.external")),
					h("span", { className: "dp-editor-status", "data-dirty": dirty ? true : void 0, "data-saved": saveStatus === "saved" ? true : void 0 }, statusText)
				),
				content.status === "loading" && h("div", { className: "dp-empty" }, t("pm.loading")),
				content.status === "error" && h("div", { className: "dp-view-error" }, content.error),
				content.status === "ready" && h("div", { className: "dp-editor" },
					h("div", { ref: gutterRef, className: "dp-editor-gutter", "aria-hidden": true },
						numbers.map(function (n) { return h("div", { key: n }, String(n)); })
					),
					h("textarea", {
						ref: taRef,
						className: "dp-editor-textarea",
						spellCheck: false,
						wrap: "off",
						value: value,
						onChange: function (e) { setValue(e.target.value); setSaveStatus(""); },
						onKeyDown: onKeyDown,
						onScroll: onScroll
					}),
					h("div", { ref: vBarRef, className: "dp-scroll-v", onPointerDown: startVScroll })
				),
				/* 横向滚动条：sticky 贴在滚动容器底部（= 底部栏上方），不随内容上下移动 */
				h("div", { ref: hBarRef, className: "dp-scroll-h", onPointerDown: startHScroll }),
				content.status === "idle" && h("div", { className: "dp-hint" }, t("files.hint"))
			);
		}

		/** 带行号的代码展示（编辑器样式）。 */
		function renderCodeLines(text) {
			var lines = String(text).split("\n");
			return h("div", { className: "dp-code" },
				lines.map(function (line, i) {
					return h("div", { key: i, className: "dp-code-line" },
						h("span", { className: "dp-code-num" }, String(i + 1)),
						h("span", { className: "dp-code-text" }, line)
					);
				})
			);
		}

		/** 浏览器视图：浏览器风格（返回/前进/刷新 + 地址栏 + 内容区）。 */
		function BrowserView(props) {
			var t = props.t;
			var urlState = react.useState("");
			var url = urlState[0];
			var setUrl = urlState[1];
			var frameState = react.useState("");
			var frameUrl = frameState[0];
			var setFrameUrl = frameState[1];
			var historyState = react.useState([]);
			var history = historyState[0];
			var setHistory = historyState[1];
			var indexState = react.useState(-1);
			var index = indexState[0];
			var setIndex = indexState[1];
			function normalize(u) {
				var s = (u || "").trim();
				if (!s) return "";
				if (!/^https?:\/\//i.test(s)) s = "https://" + s;
				return s;
			}
			function go(target) {
				var u = normalize(target !== void 0 ? target : url);
				if (!u) return;
				var next = history.slice(0, index + 1);
				next.push(u);
				setHistory(next);
				setIndex(next.length - 1);
				setFrameUrl(u);
				if (target === void 0) setUrl(u);
			}
			function back() {
				if (index <= 0) return;
				var i = index - 1;
				setIndex(i);
				setFrameUrl(history[i]);
				setUrl(history[i]);
			}
			function fwd() {
				if (index >= history.length - 1) return;
				var i = index + 1;
				setIndex(i);
				setFrameUrl(history[i]);
				setUrl(history[i]);
			}
			function reload() {
				if (frameUrl) setFrameUrl("");
				window.setTimeout(function () { if (frameUrl) setFrameUrl(frameUrl); }, 30);
			}
			return h("div", { className: "dp-browser" },
				h("div", { className: "dp-browser-bar" },
					h("button", { type: "button", className: "dp-browser-btn", disabled: index <= 0, onClick: back, title: t("browser.back") }, h(primitives.IconChevronLeftOutline14, { size: 15 })),
					h("button", { type: "button", className: "dp-browser-btn", disabled: index >= history.length - 1, onClick: fwd, title: t("browser.fwd") }, h(primitives.IconChevronRightOutline14, { size: 15 })),
					h("button", { type: "button", className: "dp-browser-btn", disabled: !frameUrl, onClick: reload, title: t("browser.reload") }, h(primitives.IconRefreshOutline16, { size: 14 })),
					h("input", {
						className: "dp-input",
						style: { flex: 1, fontFamily: "inherit" },
						placeholder: t("browser.urlPlaceholder"),
						value: url,
						onChange: function (e) { setUrl(e.target.value); },
						onKeyDown: function (e) { if (e.key === "Enter") go(); }
					}),
					h("button", { type: "button", className: "dp-browser-btn", onClick: function () { go(); }, title: t("browser.go") }, h(primitives.IconRightUpOutline16, { size: 14 }))
				),
				frameUrl
					? h("iframe", { key: frameUrl, className: "dp-iframe", src: frameUrl, sandbox: "allow-scripts allow-same-origin allow-forms", title: "browser" })
					: h("div", { className: "dp-empty" }, t("browser.hint"))
			);
		}

		/** 打开 DSH 官方设置面板：对侧栏底部的设置触发按钮派发一次原生 click。只匹配确凿的触发按钮，绝不盲点。 */
		function openDshSettings() {
			try {
				var buttons = document.querySelectorAll("button[aria-haspopup='dialog']");
				for (var i = 0; i < buttons.length; i++) {
					var text = (buttons[i].textContent || "").trim();
					// 优先：文字精确匹配（侧栏展开态显示「设置 / Settings」标签）
					if (text === "设置" || text === "Settings") {
						buttons[i].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
						return true;
					}
				}
				// 其次：className 含 trigger 的对话框按钮（侧栏收起态只有图标、无文字）
				for (var j = 0; j < buttons.length; j++) {
					var cls = (buttons[j].className || "") || "";
					if (cls.split(/\s+/).some(function (c) { return c.indexOf("trigger") >= 0; })) {
						buttons[j].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
						return true;
					}
				}
			} catch (e) { /* 忽略 */ }
			return false;
		}

		/** 通用设置视图：外壳开关 + 快捷键 + 打开官方设置。 */
		function GeneralSettingsView(props) {
			var t = props.t;
			var state = props.state;
			var actions = props.actions;
			function row(title, desc, on, onToggle) {
				return h("div", { className: "dp-row" },
					h("div", { className: "dp-row-main" },
						h("div", { className: "dp-row-title" }, title),
						h("div", { className: "dp-row-desc" }, desc)
					),
					h("button", {
						type: "button",
						className: "dp-switch",
						"data-on": on ? true : void 0,
						"aria-pressed": on,
						onClick: onToggle
					}, on ? "ON" : "OFF")
				);
			}
			var kbd = function (label, keys) {
				return h("div", { key: label, style: { display: "flex", alignItems: "center", gap: 8, padding: "3px 0" } },
					h("span", { style: { flex: 1, fontSize: 13, color: "var(--dsw-alias-label-primary)" } }, label),
					h("span", null, keys.map(function (k, i) { return h("span", { key: i }, i > 0 ? " + " : null, h("span", { className: "dp-kbd" }, k)); }))
				);
			};
			return h("div", null,
				row(t("general.shell"), t("general.shell.desc"), state.open, actions.toggleShell),
				row(t("general.right"), t("general.right.desc"), state.rightOpen, actions.toggleRight),
				row(t("general.bottom"), t("general.bottom.desc"), state.bottomOpen, actions.toggleBottom),
				h("div", { className: "dp-section-title" }, t("general.shortcuts")),
				kbd(t("shortcuts.shell"), ["Ctrl", "Shift", "S"]),
				kbd(t("shortcuts.right"), ["Ctrl", "Shift", "J"]),
				kbd(t("shortcuts.bottom"), ["Ctrl", "Shift", "B"]),
				h("div", { className: "dp-section-title" }, t("general.openSettings")),
				h("p", { className: "dp-hint" }, t("general.openSettings.desc")),
				h("button", { type: "button", className: "dp-btn", onClick: openDshSettings }, t("general.openSettings"))
			);
		}

		/** Agent 设置视图。 */
		function AgentSettingsView(props) {
			var t = props.t;
			return h("div", null,
				h("p", { className: "dp-hint" }, t("agent.desc")),
				h("div", { className: "dp-list" },
					h("div", { className: "dp-item", style: { cursor: "default" } }, h("span", { className: "dp-item-title" }, "· " + t("agent.section.models"))),
					h("div", { className: "dp-item", style: { cursor: "default" } }, h("span", { className: "dp-item-title" }, "· " + t("agent.section.presets"))),
					h("div", { className: "dp-item", style: { cursor: "default" } }, h("span", { className: "dp-item-title" }, "· " + t("agent.section.permissions")))
				),
				h("p", { className: "dp-hint", style: { marginTop: 10 } }, t("agent.hint")),
				h("button", { type: "button", className: "dp-btn", onClick: openDshSettings }, t("general.openSettings"))
			);
		}

		/** 共享的"打开文件"请求：资源管理器点击文件 → 中间「文件内容」视图读取。 */
		var fileOpenStore = createSnapshotStore({ path: null });

		/** 资源管理器视图：当前工作目录的文件树（目录可展开，文件点击后在中间打开）。 */
		function ExplorerView(props) {
			var t = props.t;
			var sessions = props.sessions;
			var ss = react.useSyncExternalStore(sessions.list.subscribe, sessions.list.getSnapshot);
			var current = ss.current !== void 0 ? ss.byId[ss.current] : void 0;
			var root = (current && current.cwd) || "";
			var expandedState = react.useState({});
			var expanded = expandedState[0];
			var setExpanded = expandedState[1];
			var entriesState = react.useState({});
			var entries = entriesState[0];
			var setEntries = entriesState[1];

			function fetchDir(path) {
				if (entries[path] !== void 0) return;
				fetch("/dsh-ui-panels/dir?path=" + encodeURIComponent(path))
					.then(function (r) { return r.json(); })
					.then(function (json) {
						setEntries(function (prev) {
							var patch = {};
							patch[path] = (json && json.ok && Array.isArray(json.entries)) ? json.entries : [];
							return Object.assign({}, prev, patch);
						});
					})
					.catch(function () {
						setEntries(function (prev) {
							var patch = {};
							patch[path] = [];
							return Object.assign({}, prev, patch);
						});
					});
			}
			// 根目录自动展开
			react.useEffect(function () {
				if (!root) return;
				setExpanded(function (prev) {
					if (prev[root]) return prev;
					var next = Object.assign({}, prev);
					next[root] = true;
					return next;
				});
				fetchDir(root);
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [root]);

			function toggleDir(path) {
				if (expanded[path]) {
					var next = Object.assign({}, expanded);
					delete next[path];
					setExpanded(next);
					return;
				}
				var patch = {};
				patch[path] = true;
				setExpanded(Object.assign({}, expanded, patch));
				fetchDir(path);
			}
			function openFile(path) {
				fileOpenStore.set({ path: path });
				try { props.actions.setCenterView("files"); } catch (e) { /* 忽略 */ }
			}
			function renderNode(node, depth) {
				var pad = { paddingLeft: 6 + depth * 14 };
				return h("div", { key: node.path },
					h("button", {
						type: "button",
						className: "dp-item",
						style: Object.assign({}, pad, { flexDirection: "row", alignItems: "center", gap: 6 }),
						title: node.path,
						onClick: function () { if (node.isDir) toggleDir(node.path); else openFile(node.path); }
					},
						h(node.isDir ? primitives.IconFolderClose16 : primitives.IconCodeOutline16, { size: 14 }),
						h("span", { className: "dp-item-title", style: { fontSize: 12 } }, node.name)
					),
					node.isDir && expanded[node.path]
						? (entries[node.path] !== void 0
							? entries[node.path].map(function (child) { return renderNode(child, depth + 1); })
							: h("div", { className: "dp-empty", style: { padding: "2px 6px" } }, "…"))
						: null
				);
			}

			if (!root) return h("div", { className: "dp-empty" }, t("explorer.workspaces") + "…");
			var children = entries[root];
			return h("div", null,
				h("div", { className: "dp-group-head" },
					h(primitives.IconFolderOpenOutline16, { size: 14 }),
					h("span", { style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, root)
				),
				children !== void 0
					? children.map(function (child) { return renderNode(child, 1); })
					: h("div", { className: "dp-empty" }, "…")
			);
		}

		/** 搜索视图：本地文件搜索（host /dsh-ui-panels/search，不依赖 agent）。 */
		function SearchView(props) {
			var t = props.t;
			var sessions = props.sessions;
			var ss = react.useSyncExternalStore(sessions.list.subscribe, sessions.list.getSnapshot);
			var current = ss.current !== void 0 ? ss.byId[ss.current] : void 0;
			var state = react.useState({ query: "", mode: "both", status: "idle", results: [], scanned: 0, error: null, dir: "" });
			var data = state[0];
			var setData = state[1];
			var doSearch = function () {
				var q = data.query.trim();
				if (!q) return;
				setData(Object.assign({}, data, { status: "searching", results: [], error: null }));
				fetchJson("/dsh-ui-panels/search", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ dir: (current && current.cwd) || "", query: q, mode: data.mode })
				})
					.then(function (json) {
						if (json && json.ok) setData(Object.assign({}, data, { status: "done", results: json.results || [], scanned: json.scanned || 0, dir: json.dir || "", error: null }));
						else setData(Object.assign({}, data, { status: "error", error: (json && json.error) || "search failed" }));
					})
					.catch(function (e) { setData(Object.assign({}, data, { status: "error", error: String(e) })); });
			};
			return h("div", null,
				h("div", { style: { padding: "8px 0 6px", display: "flex", gap: 6, alignItems: "center" } },
					h("input", {
						className: "dp-input",
						type: "search",
						style: { flex: 1, minWidth: 0 },
						placeholder: t("search.placeholder"),
						value: data.query,
						onKeyDown: function (e) { if (e.key === "Enter") doSearch(); },
						onChange: function (e) { setData(Object.assign({}, data, { query: e.target.value })); }
					}),
					h("button", { type: "button", className: "dp-btn", "data-primary": true, onClick: doSearch, disabled: data.status === "searching" }, t("search.go"))
				),
				h("div", { style: { display: "flex", gap: 10, padding: "0 0 6px", alignItems: "center" } },
					h("label", { className: "dp-radio", style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--dsw-alias-label-secondary)", cursor: "pointer" } },
						h("input", { type: "radio", name: "smode", checked: data.mode === "both", onChange: function () { setData(Object.assign({}, data, { mode: "both" })); } }),
						t("search.both")
					),
					h("label", { className: "dp-radio", style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--dsw-alias-label-secondary)", cursor: "pointer" } },
						h("input", { type: "radio", name: "smode", checked: data.mode === "name", onChange: function () { setData(Object.assign({}, data, { mode: "name" })); } }),
						t("search.byName")
					),
					h("label", { className: "dp-radio", style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--dsw-alias-label-secondary)", cursor: "pointer" } },
						h("input", { type: "radio", name: "smode", checked: data.mode === "content", onChange: function () { setData(Object.assign({}, data, { mode: "content" })); } }),
						t("search.byContent")
					)
				),
				data.dir ? h("p", { className: "dp-hint", style: { margin: "2px 0 6px" } }, t("search.inDir") + " " + data.dir) : null,
				data.status === "searching" && h("div", { className: "dp-hint" }, t("search.searching")),
				data.error && h("div", { className: "dp-view-error" }, data.error),
				data.status === "done" && h("p", { className: "dp-hint" }, t("search.found", { n: data.results.length, scanned: data.scanned })),
				data.status === "done" && data.results.length > 0 && h("div", { className: "dp-list" }, data.results.map(function (r) {
					return h("button", {
						key: r.path,
						type: "button",
						className: "dp-item",
						onClick: function () {
							try { fileOpenStore.set(r.path); } catch (e) { /* 忽略 */ }
							if (props.actions) props.actions.setCenterView("files");
						}
					},
						h("span", { className: "dp-item-title" }, r.name + (r.line ? " : " + r.line : "")),
						h("span", { className: "dp-item-sub" }, r.path + (r.snippet ? " — " + r.snippet : ""))
					);
				})),
				data.status === "done" && data.results.length === 0 && h("div", { className: "dp-empty" }, t("search.empty"))
			);
		}

		/** 远程资源管理器视图（VS Code 20.png 风格）：SSH 连接目标 / WSL 连接目标 分组 + 浏览远程文件。 */
		function RemoteView(props) {
			var t = props.t;
			var sessions = props.sessions;
			var ss = react.useSyncExternalStore(sessions.list.subscribe, sessions.list.getSnapshot);
			var current = ss.current !== void 0 ? ss.byId[ss.current] : void 0;
			var state = react.useState({ mode: "groups", sshHosts: [], wslDistros: [], provider: "wsl", host: "", path: "/home", entries: [], stack: [], status: "idle", error: null });
			var data = state[0];
			var setData = state[1];
			var list = function (provider, host, path) {
				setData(Object.assign({}, data, { status: "loading", error: null, path: path }));
				var url = "/dsh-ui-panels/remote?provider=" + encodeURIComponent(provider) + "&path=" + encodeURIComponent(path) + (provider === "ssh" && host ? "&host=" + encodeURIComponent(host) : "");
				fetchJson(url)
					.then(function (json) {
						if (json && json.ok) setData(Object.assign({}, data, { status: "ready", entries: json.entries || [], path: json.path, error: null }));
						else setData(Object.assign({}, data, { status: "error", error: (json && json.error) || "list failed" }));
					})
					.catch(function (e) { setData(Object.assign({}, data, { status: "error", error: String(e) })); });
			};
			var loadGroups = function () {
				fetchJson("/dsh-ui-panels/remote?action=list-ssh")
					.then(function (j) { if (j && j.ok) setData(Object.assign({}, data, { sshHosts: j.hosts || [] })); })
					.catch(function () {});
				fetchJson("/dsh-ui-panels/remote?action=list-wsl")
					.then(function (j) { if (j && j.ok) setData(Object.assign({}, data, { wslDistros: j.distros || [] })); })
					.catch(function () {});
			};
			react.useEffect(function () {
				loadGroups();
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, []);
			var connect = function (provider, host, path) {
				setData(Object.assign({}, data, { mode: "browse", provider: provider, host: host, stack: [] }));
				list(provider, host, path || "/home");
			};
			var joinR = function (base, name) { return (base === "/" ? "" : base) + "/" + name; };
			var enter = function (e) {
				setData(Object.assign({}, data, { stack: data.stack.concat([data.path]) }));
				list(data.provider, data.host, joinR(data.path, e.name));
			};
			var back = function () {
				var s = data.stack.slice(0, -1);
				var prev = s.length ? s[s.length - 1] : "/home";
				setData(Object.assign({}, data, { stack: s }));
				list(data.provider, data.host, prev);
			};
			/* 分组头（VS Code 风格：小字标题 + 右侧操作按钮） */
			var groupHead = function (title, actions) {
				return h("div", { className: "dp-remote-head" },
					h("span", { className: "dp-remote-head-title" }, title),
					h("div", { className: "dp-remote-head-actions" }, actions || null)
				);
			};
			if (data.mode === "groups") {
				return h("div", null,
					groupHead(t("remote.ssh"), [
						h("button", { key: "r", type: "button", className: "dp-icon-btn", title: t("pm.refresh"), onClick: loadGroups }, "⟳")
					]),
					/* 直接输入 IP / 主机连接（20.png 参照 + 用户要求） */
					h("div", { className: "dp-ssh-input" },
						h("input", {
							className: "dp-input",
							placeholder: t("remote.sshHost") + "（如 user@1.2.3.4）",
							value: data.sshInput || "",
							onKeyDown: function (e) { if (e.key === "Enter" && e.target.value.trim()) { var h = e.target.value.trim(); setData(Object.assign({}, data, { sshInput: "", sshHosts: [h].concat(data.sshHosts) })); connect("ssh", h, "/home"); } },
							onChange: function (e) { setData(Object.assign({}, data, { sshInput: e.target.value })); }
						})
					),
					h("div", { className: "dp-list" }, (data.sshHosts.length ? data.sshHosts : []).map(function (hst) {
						return h("button", { key: hst, type: "button", className: "dp-item", onClick: function () { connect("ssh", hst, "/home"); } },
							h("span", { className: "dp-item-title" }, "🖥  " + hst),
							h("span", { className: "dp-item-sub" }, "SSH")
						);
					})),
					data.sshHosts.length === 0 && data.status !== "loading" && h("div", { className: "dp-hint", style: { padding: "0 10px" } }, t("remote.noSsh")),
					groupHead(t("remote.wsl"), [
						h("button", { key: "r", type: "button", className: "dp-icon-btn", title: t("pm.refresh"), onClick: loadGroups }, "⟳")
					]),
					h("div", { className: "dp-list" }, (data.wslDistros.length ? data.wslDistros : []).map(function (d) {
						return h("button", { key: d, type: "button", className: "dp-item", onClick: function () { connect("wsl", "", "/home"); } },
							h("span", { className: "dp-item-title" }, "🐧  " + d),
							h("span", { className: "dp-item-sub" }, "WSL")
						);
					})),
					data.wslDistros.length === 0 && h("div", { className: "dp-hint", style: { padding: "0 10px" } }, t("remote.noWsl"))
				);
			}
			return h("div", null,
				h("div", { style: { display: "flex", alignItems: "center", gap: 6, padding: "2px 0 6px", flexWrap: "wrap" } },
					h("button", { type: "button", className: "dp-btn", style: { padding: "2px 8px" }, onClick: function () { setData(Object.assign({}, data, { mode: "groups" })); } }, "← " + t("remote.back")),
					data.stack.length > 0 && h("button", { type: "button", className: "dp-btn", style: { padding: "2px 8px" }, onClick: back }, "↑"),
					h("span", { className: "dp-item-sub", style: { wordBreak: "break-all" } }, (data.provider === "ssh" && data.host ? data.host + ":" : "WSL:") + data.path)
				),
				data.status === "loading" && h("div", { className: "dp-hint" }, t("remote.loading")),
				data.error && h("div", { className: "dp-view-error" }, data.error),
				data.status === "ready" && h("div", null,
					data.entries.length === 0 && h("div", { className: "dp-empty" }, t("remote.empty")),
					h("div", { className: "dp-list" }, data.entries.map(function (e) {
						return h("button", {
							key: e.name,
							type: "button",
							className: "dp-item",
							onClick: e.dir ? function () { enter(e); } : null
						},
							h("span", { className: "dp-item-title" }, (e.dir ? "📁 " : (e.link ? "🔗 " : "📄 ")) + e.name),
							h("span", { className: "dp-item-sub" }, (!e.dir ? (e.size > 0 ? String(e.size) + " B" : "") : "") + (e.time ? "  " + e.time : ""))
						);
					}))
				)
			);
		}

		/** 源代码管理视图：git 仓库（status / diff / stage / commit / log），host /dsh-ui-panels/git。 */
		function SourceView(props) {
			var t = props.t;
			var sessions = props.sessions;
			var ss = react.useSyncExternalStore(sessions.list.subscribe, sessions.list.getSnapshot);
			var current = ss.current !== void 0 ? ss.byId[ss.current] : void 0;
			var root = (current && current.cwd) || "";
			var state = react.useState({ status: "loading", repo: false, changed: [], msg: "", diff: null, diffFile: "", log: [], error: null });
			var data = state[0];
			var setData = state[1];
			var git = function (action, extra, file, staged) {
				var url = "/dsh-ui-panels/git?action=" + encodeURIComponent(action) + "&path=" + encodeURIComponent(root) + (file ? "&file=" + encodeURIComponent(file) : "") + (staged ? "&staged=1" : "");
				if (extra) {
					return fetchJson(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(extra) });
				}
				return fetchJson(url);
			};
			var load = function () {
				if (!root) { setData(Object.assign({}, data, { status: "idle", repo: false, changed: [], error: null })); return; }
				setData(Object.assign({}, data, { status: "loading" }));
				git("status").then(function (j) {
					if (j && j.ok) {
						setData(Object.assign({}, data, { status: "ready", repo: true, changed: j.changed || [], error: null }));
						git("log").then(function (j2) {
							if (j2 && j2.ok) setData(Object.assign({}, data, { status: "ready", repo: true, log: j2.log || [] }));
						}).catch(function () {});
					} else {
						setData(Object.assign({}, data, { status: "ready", repo: false, changed: [], error: (j && j.error) || null }));
					}
				}).catch(function (e) { setData(Object.assign({}, data, { status: "error", error: String(e) })); });
			};
			react.useEffect(function () {
				load();
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [root]);
			var showDiff = function (file, staged) {
				git("diff", null, file, staged).then(function (j) {
					setData(Object.assign({}, data, { diff: (j && j.diff) || "", diffFile: file, error: null }));
				}).catch(function (e) { setData(Object.assign({}, data, { error: String(e) })); });
			};
			var stage = function (file) {
				git("stage", { file: file }).then(function (j) { if (j && j.ok) load(); else setData(Object.assign({}, data, { error: (j && j.error) || "failed" })); });
			};
			var commit = function () {
				if (!data.msg.trim()) return;
				git("commit", { message: data.msg }).then(function (j) {
					if (j && j.ok) { setData(Object.assign({}, data, { msg: "" })); load(); }
					else setData(Object.assign({}, data, { error: (j && j.error) || "commit failed" }));
				});
			};
			var statusLabel = function (s) {
				var m = { "??": "U", "M": "M", "A": "A", "D": "D", "R": "R", "C": "C", "UU": "UU", "MM": "MM", "AM": "AM" };
				return m[s] || s;
			};
			var initRepo = function () {
				git("init").then(function (j) { if (j && j.ok) load(); else setData(Object.assign({}, data, { error: (j && j.error) || "init failed" })); });
			};
			return h("div", null,
				!root ? h("div", { className: "dp-empty" }, t("source.noWorkspace")) : null,
				data.status === "loading" && h("div", { className: "dp-hint" }, t("remote.loading")),
				data.error && h("div", { className: "dp-view-error" }, data.error),
				data.status === "ready" && !data.repo && root && h("div", { className: "dp-scm-empty" },
					h("div", { className: "dp-scm-empty-title" }, t("source.noRepo")),
					h("p", { className: "dp-hint" }, t("source.noRepoHint")),
					h("button", { type: "button", className: "dp-btn", "data-primary": true, onClick: initRepo }, t("source.initRepo"))
				),
				data.status === "ready" && data.repo && h("div", null,
					h("div", { className: "dp-scm-head" },
						h("span", { className: "dp-scm-head-title" }, t("source.changes")),
						h("button", { type: "button", className: "dp-icon-btn", "aria-label": t("pm.refresh"), title: t("pm.refresh"), onClick: load }, "⟳")
					),
					data.changed.length === 0 && h("div", { className: "dp-empty" }, t("source.clean")),
					h("div", { className: "dp-list" }, data.changed.map(function (c) {
						return h("div", { key: c.path + c.status, className: "dp-item", style: { cursor: "default" } },
							h("div", { style: { display: "flex", alignItems: "center", gap: 6, width: "100%" } },
								h("span", { className: "dp-tag" + (c.staged ? " dp-tag-warn" : ""), style: { flex: "none", minWidth: 22, textAlign: "center" } }, statusLabel(c.status)),
								h("span", { className: "dp-item-title", style: { flex: 1, minWidth: 0, fontSize: 12 } }, c.path),
								h("button", { type: "button", className: "dp-btn", style: { padding: "1px 7px", fontSize: 11 }, onClick: function () { showDiff(c.path, c.staged); } }, t("source.diff")),
								h("button", {
									type: "button",
									className: "dp-btn",
									style: { padding: "1px 7px", fontSize: 11 },
									onClick: function () { stage(c.path); }
								}, c.staged ? t("source.unstage") : t("source.stage"))
							)
						);
					})),
					data.diff !== null && h("div", { className: "dp-code", style: { marginTop: 8, maxHeight: 220 } },
						h("div", { style: { display: "flex", alignItems: "center", gap: 6, padding: "0 12px 4px" } },
							h("span", { className: "dp-item-sub" }, data.diffFile),
							h("button", { type: "button", className: "dp-btn", style: { padding: "1px 7px", fontSize: 11, marginLeft: "auto" }, onClick: function () { setData(Object.assign({}, data, { diff: null })); } }, t("close"))
						),
						data.diff.split("\n").map(function (l, i) {
							var cls = "dp-code-line";
							if (l.indexOf("+") === 0 && l.indexOf("+++") !== 0) cls += " dp-code-add";
							else if (l.indexOf("-") === 0 && l.indexOf("---") !== 0) cls += " dp-code-del";
							return h("div", { key: i, className: cls }, h("span", { className: "dp-code-num" }, i + 1), h("span", { className: "dp-code-text" }, l || " "));
						})
					),
					h("div", { className: "dp-group-head" }, t("source.commit")),
					h("div", { style: { display: "flex", gap: 6, alignItems: "center", paddingBottom: 4 } },
						h("input", {
							className: "dp-input",
							style: { flex: 1, minWidth: 0 },
							placeholder: t("source.commitMsg"),
							value: data.msg,
							onKeyDown: function (e) { if (e.key === "Enter") commit(); },
							onChange: function (e) { setData(Object.assign({}, data, { msg: e.target.value })); }
						}),
						h("button", { type: "button", className: "dp-btn", "data-primary": true, onClick: commit, disabled: !data.msg.trim() }, t("source.commit"))
					),
					data.log.length > 0 && h("div", null,
						h("div", { className: "dp-group-head" }, t("source.log")),
						h("div", { className: "dp-list" }, data.log.map(function (l) {
							return h("div", { key: l.hash, className: "dp-item", style: { cursor: "default" } },
								h("span", { className: "dp-item-sub", style: { fontFamily: "ui-monospace,Consolas,monospace" } }, l.hash + "  " + l.msg)
							);
						}))
					)
				)
			);
		}

		/** 扩展管理视图：插件管理器（查看 / 启用 / 禁用 / GitHub 链接，经 host 路由读写 profile bundles）。 */
		function ExtensionsView(props) {
			var t = props.t;
			var state = react.useState({ status: "loading", plugins: [], pending: {}, restarted: {}, error: null });
			var data = state[0];
			var setData = state[1];

			var load = function () {
				setData({ status: "loading", plugins: [], pending: {}, restarted: {}, error: null });
				fetch("/dsh-ui-panels/plugins")
					.then(function (r) { return r.json(); })
					.then(function (json) {
						if (json && json.ok) {
							setData({ status: "ready", plugins: json.plugins || [], pending: {}, restarted: {}, error: null });
						} else {
							setData({ status: "error", plugins: [], pending: {}, restarted: {}, error: (json && json.error) || "unknown" });
						}
					})
					.catch(function (e) {
						setData({ status: "error", plugins: [], pending: {}, restarted: {}, error: String(e) });
					});
			};
			react.useEffect(function () {
				load();
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, []);

			var toggle = function (plugin) {
				if (plugin.system || plugin.self || data.pending[plugin.name]) return;
				var target = !plugin.enabled;
				setData(function (prev) {
					return Object.assign({}, prev, { pending: Object.assign({}, prev.pending, (function () { var o = {}; o[plugin.name] = true; return o; })()) });
				});
				fetch("/dsh-ui-panels/plugins/toggle", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: plugin.name, enabled: target })
				})
					.then(function (r) { return r.json(); })
					.then(function (json) {
						setData(function (prev) {
							var pending = Object.assign({}, prev.pending);
							delete pending[plugin.name];
							var restarted = Object.assign({}, prev.restarted);
							var plugins = prev.plugins.map(function (p) {
								if (p.name !== plugin.name) return p;
								return Object.assign({}, p, json && json.ok ? { enabled: json.enabled } : {});
							});
							if (json && json.ok) restarted[plugin.name] = true;
							return Object.assign({}, prev, { plugins: plugins, pending: pending, restarted: restarted, error: json && !json.ok ? json.error : prev.error });
						});
					})
					.catch(function (e) {
						setData(function (prev) {
							var pending = Object.assign({}, prev.pending);
							delete pending[plugin.name];
							return Object.assign({}, prev, { pending: pending, error: String(e) });
						});
					});
			};

			return h("div", null,
				h("p", { className: "dp-hint" }, t("pm.desc")),
				h("div", { style: { display: "flex", alignItems: "center", gap: 8, margin: "6px 0 8px" } },
					h("button", { type: "button", className: "dp-btn", onClick: load }, h("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 } }, h(primitives.IconRefreshOutline16, { size: 13 }), t("pm.refresh"))),
					h("button", { type: "button", className: "dp-btn", onClick: openDshSettings }, t("extensions.open"))
				),
				data.error !== null && h("div", { className: "dp-empty", style: { color: "var(--dsw-alias-state-error-primary)" } },
					t("pm.error") + ": " + data.error),
				data.status === "loading" && h("div", { className: "dp-empty" }, t("pm.loading")),
				data.status === "ready" && (data.plugins.length === 0
					? h("div", { className: "dp-empty" }, t("pm.none"))
					: h("div", { className: "dp-list" }, data.plugins.map(function (p) {
						return h("div", { key: p.name, className: "dp-item", style: { cursor: "default", gap: 3 } },
							h("div", { style: { display: "flex", alignItems: "center", gap: 6, minWidth: 0, width: "100%" } },
								h("span", { className: "dp-item-title", style: { flex: 1, fontSize: 12 } }, p.name + (p.version ? "  v" + p.version : "")),
								p.system && h("span", { className: "dp-tag" }, t("pm.system")),
								p.self && h("span", { className: "dp-tag" }, t("pm.self")),
								h("button", {
									type: "button",
									className: "dp-switch",
									style: { padding: "1px 9px", fontSize: 11 },
									"data-on": p.enabled ? true : void 0,
									"aria-pressed": p.enabled,
									disabled: p.system || p.self,
									onClick: function () { toggle(p); }
								}, p.enabled ? "ON" : "OFF")
							),
							p.description && h("span", { className: "dp-item-sub" }, p.description),
							h("div", { style: { display: "flex", alignItems: "center", gap: 8, minHeight: 16 } },
								p.repository && h("a", {
									className: "dp-link",
									href: p.repository,
									target: "_blank",
									rel: "noreferrer",
									title: t("pm.github"),
									style: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }
								}, h(primitives.IconLinkOutline16, { size: 12 }), t("pm.github")),
								data.pending[p.name] && h("span", { className: "dp-item-sub" }, "…"),
								data.restarted[p.name] && h("span", { className: "dp-tag dp-tag-warn" }, t("pm.restart"))
							)
						);
					})))
			);
		}

		/** 视图级错误边界：某个视图渲染崩溃时只显示错误卡片，不影响整个外壳。 */
		function ViewErrorBoundary(props) {
			react.Component.call(this, props);
			this.state = { error: null };
		}
		ViewErrorBoundary.prototype = Object.create(react.Component.prototype);
		ViewErrorBoundary.prototype.constructor = ViewErrorBoundary;
		/** 注意：getDerivedStateFromError 必须是类静态方法（React 经构造函数查找）。 */
		ViewErrorBoundary.getDerivedStateFromError = function (error) {
			return { error: error };
		};
		ViewErrorBoundary.prototype.componentDidCatch = function (error) {
			try {
				if (typeof console !== "undefined" && console.error) console.error("[dsh-ide-panels] view error:", error);
				reportDiag({ type: "view-error", message: String((error && error.message) || error) });
			} catch (e) { /* 忽略 */ }
		};
		ViewErrorBoundary.prototype.render = function () {
			if (this.state.error !== null) {
				var message = this.state.error instanceof Error ? (this.state.error.message || String(this.state.error)) : String(this.state.error);
				return h("div", { className: "dp-view-error" },
					h("div", { className: "dp-view-error-title" }, (this.props.t && this.props.t("view.errorTitle")) || "视图渲染出错"),
					h("div", { style: { marginTop: 6 } }, message),
					h("div", { style: { marginTop: 4, opacity: 0.75 } }, (this.props.t && this.props.t("view.errorHint")) || "错误详情已写入「调试控制台」。"),
					h("button", {
						type: "button",
						className: "dp-btn",
						style: { marginTop: 8 },
						onClick: function () { this.setState({ error: null }); }.bind(this)
					}, (this.props.t && this.props.t("view.retry")) || "重试")
				);
			}
			return this.props.children;
		};

		/** 顶层外壳错误边界：外壳整体渲染崩溃时显示全屏错误卡片，避免整个应用白屏。 */
		function ShellBoundary(props) {
			react.Component.call(this, props);
			this.state = { error: null };
		}
		ShellBoundary.prototype = Object.create(react.Component.prototype);
		ShellBoundary.prototype.constructor = ShellBoundary;
		ShellBoundary.getDerivedStateFromError = function (error) {
			return { error: error };
		};
		ShellBoundary.prototype.componentDidCatch = function (error) {
			try {
				if (typeof console !== "undefined" && console.error) console.error("[dsh-ide-panels] shell error:", error);
				reportDiag({ type: "shell-error", message: String((error && error.message) || error) });
			} catch (e) { /* 忽略 */ }
		};
		ShellBoundary.prototype.render = function () {
			if (this.state.error !== null) {
				var t = this.props.t || function (k) { return k; };
				var message = this.state.error instanceof Error ? (this.state.error.message || String(this.state.error)) : String(this.state.error);
				return h("div", { className: "dp-shell-error" },
					h("div", { className: "dp-shell-error-card" },
						h("div", { className: "dp-view-error-title" }, t("shell.errorTitle")),
						h("div", { style: { marginTop: 8 } }, message),
						h("div", { style: { marginTop: 4, opacity: 0.75 } }, t("shell.errorHint")),
						h("div", { style: { marginTop: 12, display: "flex", gap: 8 } },
							h("button", {
								type: "button",
								className: "dp-btn",
								"data-primary": true,
								onClick: function () { this.setState({ error: null }); }.bind(this)
							}, t("view.retry")),
							h("button", {
								type: "button",
								className: "dp-btn",
								onClick: function () { try { this.props.actions.toggleShell(); } catch (e) {} }.bind(this)
							}, t("shell.close"))
						)
					)
				);
			}
			return this.props.children;
		};

		/** 日志列表（调试控制台 / 输出共用）。 */
		function LogView(props) {
			var t = props.t;
			var kinds = props.kinds;
			var logs = react.useSyncExternalStore(logStore.subscribe, logStore.getSnapshot).logs;
			var filtered = logs.filter(function (l) { return kinds.indexOf(l.kind) >= 0; });
			var clsOf = function (kind) {
				if (kind === "error") return "dp-log-error";
				if (kind === "warn") return "dp-log-warn";
				if (kind === "log") return "dp-log-plain";
				return "dp-log-info";
			};
			return h("div", null,
				h("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0 6px" } },
					h("span", { className: "dp-hint", style: { flex: 1, margin: 0 } }, props.desc),
					h("button", { type: "button", className: "dp-btn", style: { padding: "2px 10px" }, onClick: function () { logStore.replace({ logs: [] }); } }, t("output.clear"))
				),
				filtered.length > 0
					? h("div", null, filtered.slice(-200).map(function (l) {
						return h("div", { key: l.id, className: "dp-log " + clsOf(l.kind) },
							h("span", { className: "dp-log-time" }, formatLogTime(l.time)),
							h("span", { className: "dp-log-text" }, l.text)
						);
					}))
					: h("div", { className: "dp-empty" }, t(props.emptyKey || "debug.empty"))
			);
		}

		/** 视图分发表：id → render(props)。 */
		function viewRenderers(props) {
			return {
				editor: function () { return h(EditorView, props); },
				docs: function () { return h(DocsView, props); },
				terminal: function () { return h(TerminalView, props); },
				browser: function () { return h(BrowserView, props); },
				changes: function () { return h(ChangesView, props); },
				general: function () { return h(GeneralSettingsView, props); },
				agent: function () { return h(AgentSettingsView, props); },
				explorer: function () { return h(ExplorerView, props); },
				search: function () { return h(SearchView, props); },
				remote: function () { return h(RemoteView, props); },
				source: function () { return h(SourceView, props); },
				extensions: function () { return h(ExtensionsView, props); },
				files: function () { return h(FilesView, props); },
				browser: function () { return h(BrowserView, props); },
				chat: function () { return null; },
				debug: function () { return h(LogView, Object.assign({}, props, { kinds: ["warn", "error"], desc: props.t("debug.desc"), emptyKey: "debug.empty" })); },
				output: function () { return h(LogView, Object.assign({}, props, { kinds: ["log", "info", "debug"], desc: props.t("output.desc"), emptyKey: "output.empty" })); }
			};
		}

		/* =====================================================================
		 * 7) 外壳组件
		 * =================================================================== */
		/** 列宽状态（模块级）：聊天列与右侧栏可自由拉伸；上限随窗口大小/侧栏宽/另一列宽动态计算（全屏与窗口化行为一致，绝不溢出）。 */
		var CHAT_MIN = 220, RIGHT_MIN = 200, CENTER_MIN = 300;
		var chatWidth = 400;
		var rightWidth = 336;
		var rightOpenFlag = true; // 右侧栏是否展开（sync 时更新，用于计算可用空间）
		function clampW(v, min, max) { return Math.max(min, Math.min(max, Math.round(v))); }
		/* ── 官方框架定位 + 列宽求解 ──────────────────────────────────────────
		 * 官方框架定位（抗 DSH 升级）───────────────────────────────────────
		 * DSH 的 AppFrame 类名是构建期 CSS Modules 哈希（pI_x6G_frame → qNbT7G_frame），升级即变。
		 * 唯一稳定的锚点是 overlay 层的 data-shell-overlay 属性：frame = 它的父元素。
		 * 运行时找到 frame 与三个在流内的列并打上自有属性 data-dp-frame / data-dp-col，
		 * 之后 CSS 只依赖这两个属性 → DSH 再换哈希也不会失配。 */
		/** AppFrame 元素（overlay 层的父元素）。 */
		function findFrameEl() {
			try {
				var layer = document.querySelector("[data-shell-overlay]");
				return (layer && layer.parentElement) || null;
			} catch (e) { return null; }
		}
		/** 幂等写属性（值相同不写，避免无意义的 mutation 记录）。 */
		function markAttr(el, name, value) {
			try {
				if (el && el.getAttribute(name) !== value) el.setAttribute(name, value);
			} catch (e) { /* 忽略 */ }
		}
		/** 给 frame 与三列打标；三者齐全才算成功。 */
		function tagFrame() {
			var f = findFrameEl();
			if (!f || !f.querySelector) return false;
			var sb = null, cc = null, rb = null;
			try { sb = f.querySelector(':scope > [class*="_sidebarCol"]'); } catch (e) { sb = null; }
			try { cc = f.querySelector(':scope > [class*="_centerCol"]'); } catch (e) { cc = null; }
			try { rb = f.querySelector(':scope > [class*="_rightbarCol"]'); } catch (e) { rb = null; }
			if (!rb) { try { rb = f.querySelector(":scope > [data-rightbar-col]"); } catch (e) { rb = null; } }
			if (!sb || !cc || !rb) {
				/* 兜底：按 DOM 顺序取前三个"在流内"的直接子元素（跳过 overlay 层与拖拽手柄）。 */
				var flow = [];
				try {
					for (var i = 0; i < f.children.length && flow.length < 3; i++) {
						var k = f.children[i];
						try {
							if (k.getAttribute && k.getAttribute("data-shell-overlay") !== null) continue;
							var pos = getComputedStyle(k).position;
							if (pos === "absolute" || pos === "fixed") continue;
						} catch (e2) { /* 忽略 */ }
						flow.push(k);
					}
				} catch (e3) { /* 忽略 */ }
				if (!sb) sb = flow[0] || null;
				if (!cc) cc = flow[1] || null;
				if (!rb) rb = flow[2] || null;
			}
			if (!sb || !cc || !rb) return false;
			markAttr(f, "data-dp-frame", "1");
			markAttr(sb, "data-dp-col", "1");
			markAttr(cc, "data-dp-col", "2");
			markAttr(rb, "data-dp-col", "3");
			return true;
		}
		/** 轻量重测标题栏下沿（--dp-top）：只查标题栏，不扫描整棵 DOM。 */
		function refreshTopInset() {
			try {
				var trow = document.querySelector('[class*="titleRow"]');
				if (!trow) return;
				var tr = trow.getBoundingClientRect();
				if (tr.height <= 0) return;
				var top = Math.round(tr.top + tr.height + 2) + "px";
				if (document.body.style.getPropertyValue("--dp-top") !== top) {
					document.body.style.setProperty("--dp-top", top);
					document.body.style.setProperty("--dp-fab-top", Math.round(tr.top) + "px");
				}
			} catch (e) { /* 忽略 */ }
		}
		/** 关闭官方右栏：新 API 是 closeRightbar()，旧版本是 closeDetails()（2.0.10 已移除）。 */
		function closeOfficialRightbar(L) {
			try {
				if (!L) return;
				if (typeof L.closeRightbar === "function") L.closeRightbar();
				else if (typeof L.closeDetails === "function") L.closeDetails();
			} catch (e) { /* 忽略 */ }
		}
		/** 测量当前可用宽度与侧栏宽，返回聊天/右侧列的动态上限（至少不低于各自最小值）。 */
		function currentLimits() {
			var avail = 1280;
			try {
				var w = window.innerWidth || document.documentElement.clientWidth;
				if (w > 0) avail = w;
			} catch (e) { /* 忽略 */ }
			var sidebarW = 0;
			try {
				var layer = document.querySelector("[data-shell-overlay]");
				var frameEl = layer && layer.parentElement;
				var sidebarCol = frameEl && frameEl.firstElementChild;
				if (sidebarCol) {
					var sw = sidebarCol.getBoundingClientRect().width;
					if (sw > 0) sidebarW = sw;
				}
			} catch (e) { /* 忽略 */ }
			var rightW = rightOpenFlag ? rightWidth : 48;
			return {
				chatMax: Math.max(CHAT_MIN, avail - sidebarW - rightW - CENTER_MIN),
				rightMax: Math.max(RIGHT_MIN, avail - sidebarW - chatWidth - CENTER_MIN)
			};
		}
		/** 重算 --dp-left = 会话侧栏宽 + 聊天宽（拖拽聊天列与侧栏展开/收起时都要刷新）。 */
		function refreshDpLeft() {
			var dpLeft = chatWidth + "px";
			try {
				var layer = document.querySelector("[data-shell-overlay]");
				var frameEl = layer && layer.parentElement;
				var sidebarCol = frameEl && frameEl.firstElementChild;
				if (sidebarCol) {
					var w = sidebarCol.getBoundingClientRect().width;
					if (w > 0) dpLeft = (w + chatWidth) + "px";
				}
			} catch (e) { /* 忽略 */ }
			try { document.body.style.setProperty("--dp-left", dpLeft); } catch (e) { /* 忽略 */ }
		}
		function setChatWidth(w) {
			chatWidth = clampW(w, CHAT_MIN, currentLimits().chatMax);
			try { document.body.style.setProperty("--dp-chat", chatWidth + "px"); } catch (e) { /* 忽略 */ }
			refreshDpLeft();
		}
		function setRightWidth(w) {
			rightWidth = clampW(w, RIGHT_MIN, currentLimits().rightMax);
			try { document.body.style.setProperty("--dp-right", rightWidth + "px"); } catch (e) { /* 忽略 */ }
		}
		/** 窗口/状态变化时重钳制当前列宽（全屏↔窗口化切换后保持一致行为）。
		 *  钳制只收缩不放宽（保留用户拖拽宽度），但保证中间工具区至少 CENTER_MIN。 */
		function reClampWidths() {
			var lim = currentLimits();
			chatWidth = clampW(chatWidth, CHAT_MIN, lim.chatMax);
			rightWidth = clampW(rightWidth, RIGHT_MIN, lim.rightMax);
		}
		/**
		 * RightSidebar — 右侧主侧栏，注册进 AppFrame 的右列槽位（rightbar，旧版为 details；
		 * single 槽位 priority -1 压制官方右栏）。CSS 把它所在的 rightbarCol 放到网格第 4 列，
		 * 于是 4 列互不遮挡：会话侧栏 | 聊天 | 中间工具区 | 右侧栏。
		 */
		function RightSidebar(props) {
			var state = react.useSyncExternalStore(props.store.subscribe, props.store.getSnapshot);
			var t = props.t;
			var actions = props.actions;
			var renderers = viewRenderers(Object.assign({}, props, { state: state }));
			var rightPanelOpen = state.open && state.rightOpen;
			/* 右侧视图必须在当前目录内（旧持久化值如 remote/search/source 已移入中间标签，这里回退 explorer）。 */
			var rightView = RIGHT_VIEWS.some(function (v) { return v && v.id === state.rightView; }) ? state.rightView : "explorer";

			function railButton(view, isActive, onActivate) {
				var Icon = view.icon;
				return h("button", {
					key: view.id,
					type: "button",
					className: "dp-rail-btn",
					"data-active": isActive ? true : void 0,
					title: t(view.labelKey),
					"aria-label": t(view.labelKey),
					onClick: onActivate
				}, h(Icon, { size: 18 }));
			}

			/* 点击图标：面板关闭则打开+切换视图；已激活则保持打开（绝不折叠）。关闭只通过 ✕。
			 * 底部：竖排开关按钮（中间工具区 / 右侧栏 / 底部条 / 外壳），无背景色，跟随 rail 风格。 */
			var rightRail = h("nav", { className: "dp-rail", "aria-label": t("shell.label") + " (R)" },
				RIGHT_VIEWS.map(function (view, i) {
					if (view === null) return h("div", { key: "sep" + i, className: "dp-rail-sep" });
					var active = !rightPanelOpen ? false : rightView === view.id;
					return railButton(view, active, function () {
						if (!state.rightOpen) { actions.setRightView(view.id); actions.openRight(true); }
						else if (rightView !== view.id) actions.setRightView(view.id);
					});
				}),
				h("div", { key: "rail-sp", className: "dp-rail-spacer" }),
				h("button", {
					key: "sw-center",
					type: "button",
					className: "dp-rail-btn dp-rail-switch",
					"data-active": state.centerOpen !== false ? true : void 0,
					title: t("fab.center"),
					"aria-label": t("fab.center"),
					onClick: actions.toggleCenter
				}, h(primitives.IconPanelLeftOutline16, { size: 18 })),
				h("button", {
					key: "sw-right",
					type: "button",
					className: "dp-rail-btn dp-rail-switch",
					"data-active": state.rightOpen ? true : void 0,
					title: t("fab.right"),
					"aria-label": t("fab.right"),
					onClick: actions.toggleRight
				}, h(primitives.IconPanelLeftOutline16, { size: 18 })),
				h("button", {
					key: "sw-bottom",
					type: "button",
					className: "dp-rail-btn dp-rail-switch",
					"data-active": state.bottomOpen ? true : void 0,
					title: t("fab.bottom"),
					"aria-label": t("fab.bottom"),
					onClick: actions.toggleBottom
				}, h(IconBottom16, { size: 18 })),
				h("button", {
					key: "sw-shell",
					type: "button",
					className: "dp-rail-btn dp-rail-switch",
					title: t("fab.close"),
					"aria-label": t("fab.close"),
					onClick: actions.toggleShell
				}, h(primitives.IconCloseOutline16, { size: 18 }))
			);
			var rightPanel = rightPanelOpen ? h("section", { className: "dp-panel" },
				h(PanelHeader, { title: t("view." + rightView), t: t, onClose: actions.toggleRight }),
				h("div", { className: "dp-panel-body" },
					h(ViewErrorBoundary, { key: "R:" + rightView, t: t }, (renderers[rightView] || renderers.explorer)()))
			) : null;

			return h("div", { className: "dp-right-sidebar" },
				h("div", { className: "dp-right-main" }, rightRail, rightPanel)
			);
		}

		/**
		 * PanelsShell — 外壳覆盖层：中间标签区 + 底部面板 + 悬浮开关。
		 * 根节点 pointer-events:none；仅标签区/底部/按钮接收指针事件；右侧栏已由 details 槽位以同级列渲染。
		 */
		/** 空状态「打开工具」面板：DeepSeek 品牌风格工具网格，点击打开对应标签页（17.png 样式）。 */
		function OpenToolsView(props) {
			var t = props.t;
			var actions = props.actions;
			return h("div", { className: "dp-open-tools" },
				h("div", { className: "dp-open-tools-inner" },
					h("div", { className: "dp-open-tools-title" }, t("tools.title")),
					h("div", { className: "dp-open-tools-sub" }, t("tools.subtitle")),
					h("div", { className: "dp-open-tools-grid" },
						OPEN_TOOLS.map(function (view) {
							var Icon = view.icon;
							return h("button", {
								key: view.id,
								type: "button",
								className: "dp-tool-card",
								onClick: function () { actions.setCenterView(view.id); }
							},
								h("span", { className: "dp-tool-card-icon" }, h(Icon, { size: 20 })),
								h("span", { className: "dp-tool-card-label" }, t(view.labelKey))
							);
						})
					)
				)
			);
		}
		function PanelsShell(props) {
			var state = react.useSyncExternalStore(props.store.subscribe, props.store.getSnapshot);
			var t = props.t;
			var actions = props.actions;
			var renderers = viewRenderers(Object.assign({}, props, { state: state }));
			var rightPanelOpen = state.open && state.rightOpen;
			var bottomOpen = state.open && state.bottomOpen;
			react.useEffect(function () {
				try { reportDiag({ type: "shell-rendered", open: state.open }); } catch (e) { /* 忽略 */ }
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, []);

			/* 底部面板：默认常驻为 34px 标签条（不挡输入框）；点标签展开（高度可自由拉伸）；✕ 收起为标签条。
			 * 全宽独立一条（left/right 由 CSS 变量 --dp-left/--dp-right 决定，与左右侧栏分开）。 */
			var bottomHidden = !bottomOpen;
			var bottomExpanded = bottomOpen && state.bottomExpanded;
			var bottomHeight = bottomExpanded ? (state.bottomHeight || 200) : 34;
			var bottomDragRef = react.useRef(null);
			function startBottomDrag(event) {
				event.preventDefault();
				var startY = event.clientY;
				var startH = state.bottomHeight || 200;
				bottomDragRef.current = { startY: startY, startH: startH };
				var onMove = function (ev) {
					var d = bottomDragRef.current;
					if (!d) return;
					actions.setBottomHeight(d.startH + (d.startY - ev.clientY));
				};
				var onUp = function () {
					bottomDragRef.current = null;
					document.removeEventListener("pointermove", onMove);
					document.removeEventListener("pointerup", onUp);
				};
				document.addEventListener("pointermove", onMove);
				document.addEventListener("pointerup", onUp);
			}
			var bottom = bottomHidden ? null : h("section", { key: "bottom", className: "dp-bottom" + (bottomExpanded ? " dp-bottom-expanded" : ""), style: {
				height: bottomHeight
			} },
				bottomExpanded && h("div", { className: "dp-bottom-resize", onPointerDown: startBottomDrag }),
				h("div", { className: "dp-bottom-tabs" },
					BOTTOM_VIEWS.map(function (view) {
						var Icon = view.icon;
						return h("button", {
							key: view.id,
							type: "button",
							className: "dp-bottom-tab",
							"data-active": state.bottomView === view.id ? true : void 0,
							onClick: function () {
								actions.setBottomView(view.id);
								if (!bottomExpanded) actions.setBottomExpanded(true);
							}
						},
							h(Icon, { size: 14 }),
							h("span", null, t(view.labelKey))
						);
					}),
					h("button", {
						type: "button",
						className: "dp-bottom-close",
						"aria-label": t("close"),
						title: t("close"),
						onClick: bottomExpanded ? actions.setBottomExpanded.bind(null, false) : actions.toggleBottom
					}, h(primitives.IconCloseOutline16, { size: 14 }))
				),
				bottomExpanded && h("div", { className: "dp-bottom-body" },
					h(ViewErrorBoundary, { key: "B:" + state.bottomView, t: t }, (renderers[state.bottomView] || renderers.terminal)()))
			);

			/* 中间标签页系统：多开（同一工具可开多个实例）+ 标签切换/关闭 + 加号菜单 + 溢出收纳（» 展开） */
			var openTabs = state.openTabs || [];
			var activeTab = openTabs.length
				? (openTabs.some(function (t) { return t.key === state.centerView; }) ? state.centerView : openTabs[openTabs.length - 1].key)
				: "";
			var activeTabObj = null;
			for (var ai = 0; ai < openTabs.length; ai++) { if (openTabs[ai].key === activeTab) { activeTabObj = openTabs[ai]; break; } }
			var activeViewId = activeTabObj ? activeTabObj.view : "";
			/* 同视图多开时，标签名带序号（终端、终端 2…） */
			var tabLabel = function (tab) {
				var n = 0;
				for (var i = 0; i < openTabs.length; i++) {
					if (openTabs[i].view === tab.view) n++;
					if (openTabs[i].key === tab.key) break;
				}
				return n > 1 ? t(VIEW_MAP[tab.view].labelKey) + " " + n : t(VIEW_MAP[tab.view].labelKey);
			};
			var tabsRef = react.useRef(null);
			var ovState = react.useState(false);
			var isOverflow = ovState[0];
			var setOverflow = ovState[1];
			var menuState = react.useState(false);
			var isMenuOpen = menuState[0];
			var setIsMenuOpen = menuState[1];
			var moreState = react.useState(false);
			var isMoreOpen = moreState[0];
			var setIsMoreOpen = moreState[1];
			react.useLayoutEffect(function () {
				var el = tabsRef.current;
				if (!el) return;
				var check = function () {
					try { setOverflow(el.scrollWidth > el.clientWidth + 2); } catch (e) { /* 忽略 */ }
				};
				check();
				var ro = null;
				try { if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(check); ro.observe(el); } } catch (e) { /* 忽略 */ }
				window.addEventListener("resize", check);
				return function () {
					window.removeEventListener("resize", check);
					if (ro) { try { ro.disconnect(); } catch (e) { /* 忽略 */ } }
				};
			}, [openTabs.length]);
			var centerTabs = h("nav", { className: "dp-center-tabs", "aria-label": t("shell.label") + " (C)" },
				h("div", { ref: tabsRef, className: "dp-center-tab-list" },
					openTabs.map(function (tab) {
						var view = VIEW_MAP[tab.view];
						var Icon = view.icon;
						return h("span", {
							key: tab.key,
							className: "dp-center-tab" + (activeTab === tab.key ? " dp-center-tab-active" : ""),
							draggable: true,
							onDragStart: function (e) { try { e.dataTransfer.setData("text/plain", tab.key); e.dataTransfer.effectAllowed = "move"; } catch (e2) { /* 忽略 */ } },
							onDragOver: function (e) { e.preventDefault(); try { e.dataTransfer.dropEffect = "move"; } catch (e2) { /* 忽略 */ } },
							onDrop: function (e) { e.preventDefault(); try { var k = e.dataTransfer.getData("text/plain"); if (k && k !== tab.key) actions.moveCenterTab(k, tab.key); } catch (e2) { /* 忽略 */ } },
							onClick: function () { actions.activateCenterTab(tab.key); }
						},
							h(Icon, { size: 13 }),
							h("span", { className: "dp-center-tab-label" }, tabLabel(tab)),
							h("button", {
								type: "button",
								className: "dp-tab-close",
								"aria-label": t("close"),
								title: t("close"),
								onClick: function (e) { e.stopPropagation(); actions.closeCenterTab(tab.key); }
							}, h(primitives.IconCloseOutline16, { size: 11 }))
						);
					})
				),
				isOverflow && h("div", { className: "dp-tab-more-wrap", key: "more" },
					h("button", {
						type: "button",
						className: "dp-tab-more",
						"data-active": isMoreOpen ? true : void 0,
						"aria-label": t("tools.more"),
						title: t("tools.more"),
						onClick: function () { setIsMoreOpen(!isMoreOpen); }
					}, "»"),
					isMoreOpen && h("div", { className: "dp-tab-pop", key: "morepop" },
						openTabs.map(function (tab) {
							var view = VIEW_MAP[tab.view];
							var Icon = view.icon;
							return h("button", {
								key: tab.key,
								type: "button",
								className: "dp-pop-item" + (activeTab === tab.key ? " dp-pop-item-active" : ""),
								onClick: function () { setIsMoreOpen(false); actions.activateCenterTab(tab.key); }
							},
								h(Icon, { size: 13 }),
								h("span", null, tabLabel(tab))
							);
						})
					)
				),
				h("div", { className: "dp-tab-add-wrap", key: "add" },
					h("button", {
						type: "button",
						className: "dp-tab-add",
						"data-active": isMenuOpen ? true : void 0,
						"aria-label": t("tools.add"),
						title: t("tools.add"),
						onClick: function () { setIsMenuOpen(!isMenuOpen); }
					}, "+"),
					isMenuOpen && h("div", { className: "dp-tab-pop", key: "addpop" },
						OPEN_TOOLS.map(function (view) {
							var Icon = view.icon;
							return h("button", {
								key: view.id,
								type: "button",
								className: "dp-pop-item",
								onClick: function () { setIsMenuOpen(false); actions.setCenterView(view.id); }
							},
								h(Icon, { size: 13 }),
								h("span", null, t(view.labelKey))
							);
						})
					)
				)
			);
			var centerContent = h("div", { className: "dp-center-view" },
				activeViewId
					? h(ViewErrorBoundary, { key: "C:" + activeTab, t: t }, (renderers[activeViewId] || renderers.files)())
					: h(OpenToolsView, Object.assign({}, props, { state: state }))
			);
			var centerArea = h("div", { key: "center", className: "dp-center" },
				centerTabs,
				centerContent
			);

			/* 外壳关闭时的单个"打开"按钮：放右上角（标题栏下方），不挡输入区。 */
			var fabRow = state.open ? [] : [
				h("button", {
					key: "tb-shell",
					type: "button",
					className: "dp-fab",
					title: t("fab.open"),
					"aria-label": t("fab.open"),
					onClick: actions.toggleShell
				}, h(primitives.IconPanelLeftOutline16, { size: 18 }))
			];

			/* 列拖拽手柄：聊天|中间 与 中间|右侧 边界，可自由拉伸（带最小值）。 */
			var dragRef = react.useRef(null);
			function startDrag(mode, event) {
				event.preventDefault();
				dragRef.current = { mode: mode, startX: event.clientX, startChat: chatWidth, startRight: rightWidth };
				var onMove = function (ev) {
					var d = dragRef.current;
					if (!d) return;
					var dx = ev.clientX - d.startX;
					if (d.mode === "chat") setChatWidth(d.startChat + dx);
					else setRightWidth(d.startRight - dx);
				};
				var onUp = function () {
					dragRef.current = null;
					document.removeEventListener("pointermove", onMove);
					document.removeEventListener("pointerup", onUp);
				};
				document.addEventListener("pointermove", onMove);
				document.addEventListener("pointerup", onUp);
			}
			var handleChat = h("div", {
				key: "h-chat",
				className: "dp-hsplit",
				style: { left: "calc(var(--dp-left,0px) - 2px)" },
				onPointerDown: function (e) { startDrag("chat", e); }
			});
			var handleRight = state.rightOpen ? h("div", {
				key: "h-right",
				className: "dp-hsplit",
				style: { left: "calc(100% - var(--dp-right,336px) - 2px)" },
				onPointerDown: function (e) { startDrag("right", e); }
			}) : null;

			return h("div", { className: "dp-root", "data-open": state.open ? true : void 0 },
				state.open ? [
					state.centerOpen !== false ? centerArea : null,
					bottom,
					handleChat,
					handleRight
				] : null,
				h("div", { className: "dp-fab-row" }, fabRow)
			);
		}

		/* =====================================================================
		 * 8) 插件主体
		 * =================================================================== */
		/** 默认状态：中间标签页系统（openTabs=打开的中间视图，centerView=当前活动标签）。
		 * 底部面板默认常驻（标签条），不挡输入框。 */
		function buildDefaults() {
			return {
				open: true,
				leftOpen: true,
				rightOpen: true,
				bottomOpen: true,
				bottomExpanded: true,
				centerOpen: true,
				bottomHeight: 200,
				leftView: "editor",
				rightView: "explorer",
				bottomView: "terminal",
				centerView: "",
				openTabs: []
			};
		}
		function mergeState(value, defaults) {
			if (value === void 0 || value === null || typeof value !== "object") return Object.assign({}, defaults);
			var out = Object.assign({}, defaults);
			["open", "leftOpen", "rightOpen", "bottomOpen", "bottomExpanded", "centerOpen"].forEach(function (k) {
				if (typeof value[k] === "boolean") out[k] = value[k];
			});
			if (typeof value.bottomHeight === "number" && value.bottomHeight >= 60 && value.bottomHeight <= 800) out.bottomHeight = value.bottomHeight;
			["leftView", "rightView", "bottomView"].forEach(function (k) {
				if (typeof value[k] === "string" && value[k]) out[k] = value[k];
			});
			if (typeof value.centerView === "string") out.centerView = value.centerView;
			if (Array.isArray(value.openTabs)) {
				out.openTabs = value.openTabs.filter(function (t) {
					return t && typeof t === "object" && typeof t.key === "string" && typeof t.view === "string" && VIEW_MAP[t.view];
				});
			}
			return out;
		}

		function apply(ctx) {
			// 8.1 多语言
			var disposeDict = null;
			if (ctx.locale && typeof ctx.locale.register === "function") {
				try {
					disposeDict = ctx.locale.register(NS, { zh: DICT_ZH, en: DICT_EN });
				} catch (e) { /* 命名空间冲突等极端情况：忽略 */ }
			}
			var t = (function () {
				try {
					return ctx.locale.bind(NS);
				} catch (e) {
					return function (key) { return key; };
				}
			})();

			// 8.2 持久化作用域（Host settings "ui-panels" 命名空间，全小写 kebab-case）
			var scope = ctx.settingsScope.bind({ namespace: "ui-panels" });
			var defaults = buildDefaults();
			var store = createSnapshotStore(Object.assign({}, defaults));

			function readValue() {
				var snapshot = scope.getSnapshot();
				return snapshot === void 0 ? void 0 : snapshot.value;
			}
			function adopt() {
				store.replace(mergeState(readValue(), defaults));
			}
			var unsubscribeScope = scope.subscribe(adopt);
			adopt();

			/** 窗口标题诊断：把外壳状态写进 document.title，外部可通过进程窗口标题读取。 */
			function syncTitle() {
				try {
					var s = store.getSnapshot();
					var base = (typeof document !== "undefined" && document.title) || "";
					document.title = "DP[" + (s.open ? "O" : "o") + (s.rightOpen ? "R" : "r") + (s.bottomOpen ? "B" : "b") + ":" + s.rightView + "] " + base.replace(/^DP\[[^\]]*\]\s*/, "");
				} catch (e) { /* 忽略 */ }
			}
			// 不强制写入默认值：apply 时代理尚未完成首次读取（无 revision），写入会被 host 拒绝，
			// 反而阻碍持久化。默认值由 mergeState 兜底；用户手动切换时带 revision 即可正常落盘。
			syncTitle();
			unsubscribeScope = scope.subscribe(function () {
				adopt();
				syncTitle();
			});

			// 诊断：上报 apply 后的初始状态
			try {
				var diagState = store.getSnapshot();
				reportDiag({ type: "apply", open: diagState.open, rightOpen: diagState.rightOpen, bottomOpen: diagState.bottomOpen, rightView: diagState.rightView, settingsConfigured: readValue() !== void 0 });
			} catch (e) { /* 忽略 */ }
			// 诊断：查询 host settings 命名空间列表，确认 ui-panels 是否注册（持久化排查）
			try {
				if (ctx.connection && ctx.connection.api && ctx.connection.api.settings && typeof ctx.connection.api.settings.describe === "function") {
					var describeTimer = null;
					try { describeTimer = window.setTimeout(function () { describeTimer = null; }, 4000); } catch (e) { /* 忽略 */ }
					ctx.connection.api.settings.describe({}).then(function (response) {
						if (describeTimer !== null) { try { window.clearTimeout(describeTimer); } catch (e) { /* 忽略 */ } }
						var namespaces = [];
						try {
							if (response && response.result && response.result.ok && Array.isArray(response.result.value.namespaces)) {
								namespaces = response.result.value.namespaces.map(function (n) { return n.ns; });
							}
						} catch (e) { /* 忽略 */ }
						reportDiag({ type: "settings-namespaces", nsRegistered: namespaces.indexOf("ui-panels") >= 0, namespaces: namespaces });
					}).catch(function (err) {
						if (describeTimer !== null) { try { window.clearTimeout(describeTimer); } catch (e) { /* 忽略 */ } }
						reportDiag({ type: "settings-namespaces", nsRegistered: null, error: String((err && err.message) || err) });
					});
				} else {
					reportDiag({ type: "settings-namespaces", nsRegistered: null, error: "connection.api.settings unavailable" });
				}
			} catch (e) { /* 忽略 */ }
			// 周期诊断：每 5 秒上报一次当前状态（含 body 属性与 overlay 存在性）
			var diagTimer = null;
			try {
				diagTimer = window.setInterval(function () {
					try { tagFrame(); refreshTopInset(); } catch (eT) { /* 忽略 */ }
					var s = store.getSnapshot();
					reportDiag({
						type: "tick",
						open: s.open,
						rightOpen: s.rightOpen,
						bottomOpen: s.bottomOpen,
						bodyAttr: document.body ? document.body.getAttribute("data-dp-shell") : null,
						overlayPresent: !!document.querySelector("[data-shell-overlay]"),
						rootPresent: !!document.querySelector(".dp-root"),
						layout: layoutProbe()
					});
				}, 5000);
			} catch (e) { /* 忽略 */ }

			/** 写设置并立即本地生效（Host 回包后再由 adopt 校正）。 */
			function persist(field, value) {
				scope.set(field, value);
				var next = mergeState(Object.assign({}, store.getSnapshot(), (function () { var o = {}; o[field] = value; return o; })()), defaults);
				store.replace(next);
			}
			var actions = {
				toggleShell: function () {
					var next = !store.getSnapshot().open;
					persist("open", next);
					if (!next) { /* 整体收起时同时隐藏底部面板，保持现场简单 */ }
				},
				toggleLeft: function () { persist("leftOpen", !store.getSnapshot().leftOpen); },
				toggleRight: function () { persist("rightOpen", !store.getSnapshot().rightOpen); },
				toggleBottom: function () { persist("bottomOpen", !store.getSnapshot().bottomOpen); },
				toggleCenter: function () { persist("centerOpen", store.getSnapshot().centerOpen === false); },
				setBottomExpanded: function (expanded) { persist("bottomExpanded", !!expanded); },
				setBottomHeight: function (h) { persist("bottomHeight", Math.max(60, Math.min(800, Math.round(h)))); },
				openLeft: function (open) { persist("leftOpen", !!open); },
				openRight: function (open) { persist("rightOpen", !!open); },
				setLeftView: function (id) { persist("leftView", id); },
				setRightView: function (id) { persist("rightView", id); },
				setBottomView: function (id) { persist("bottomView", id); },
				/** 打开中间工具并激活（支持同一工具多开：每次打开新实例）。 */
				setCenterView: function (id) {
					if (!VIEW_MAP[id]) return;
					var s = store.getSnapshot();
					var tabs = (s.openTabs || []).slice(0);
					var key = id + "-" + (++tabSeq);
					tabs.push({ key: key, view: id });
					var next = mergeState(Object.assign({}, s, { centerView: key, openTabs: tabs }), defaults);
					store.replace(next); // 本地立即生效（持久化失败不影响打开）
					scope.set("openTabs", tabs).catch(function () {});
					scope.set("centerView", key).catch(function () {});
				},
				/** 激活已有标签（按 key）。 */
				activateCenterTab: function (key) {
					var s = store.getSnapshot();
					if (!(s.openTabs || []).some(function (t) { return t.key === key; })) return;
					var next = mergeState(Object.assign({}, s, { centerView: key }), defaults);
					store.replace(next);
					scope.set("centerView", key).catch(function () {});
				},
				/** 关闭中间标签；激活相邻标签。 */
				closeCenterTab: function (key) {
					var s = store.getSnapshot();
					var tabs = (s.openTabs || []).slice(0);
					var idx = -1;
					for (var i = 0; i < tabs.length; i++) { if (tabs[i].key === key) { idx = i; break; } }
					if (idx < 0) return;
					tabs.splice(idx, 1);
					var nextView = s.centerView === key ? (tabs.length ? tabs[Math.max(0, idx - 1)].key : "") : s.centerView;
					var next = mergeState(Object.assign({}, s, { centerView: nextView, openTabs: tabs }), defaults);
					store.replace(next);
					scope.set("openTabs", tabs).catch(function () {});
					scope.set("centerView", nextView).catch(function () {});
				},
				/** 拖动标签排序（终端等工具可自由移动位置）。 */
				moveCenterTab: function (fromKey, toKey) {
					var s = store.getSnapshot();
					var tabs = (s.openTabs || []).slice(0);
					var fi = -1, ti = -1;
					for (var i = 0; i < tabs.length; i++) {
						if (tabs[i].key === fromKey) fi = i;
						if (tabs[i].key === toKey) ti = i;
					}
					if (fi < 0 || ti < 0 || fi === ti) return;
					var moved = tabs.splice(fi, 1)[0];
					tabs.splice(ti, 0, moved);
					var next = mergeState(Object.assign({}, s, { openTabs: tabs }), defaults);
					store.replace(next);
					scope.set("openTabs", tabs).catch(function () {});
				}
			};

			// 8.3 console 捕获
			patchConsole();

			// 8.4 键盘快捷键（Ctrl+Shift+S/J/B；输入框内不拦截）
			ctx.effect(function () {
				var onKeyDown = function (event) {
					if (!event.ctrlKey || !event.shiftKey || event.altKey) return;
					var target = event.target;
					if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
					var key = event.key.toUpperCase();
					if (key === "S") { event.preventDefault(); actions.toggleShell(); }
					else if (key === "J") { event.preventDefault(); actions.toggleRight(); }
					else if (key === "B") { event.preventDefault(); actions.toggleBottom(); }
				};
				document.addEventListener("keydown", onKeyDown);
				return function () {
					document.removeEventListener("keydown", onKeyDown);
				};
			}, NS + ": keyboard");

			// 8.5 注册进 shell.overlay（root 级 list 槽位）
			var injected = {
				store: store,
				t: t,
				actions: actions,
				sessions: ctx.sessions,
				workspaces: ctx.workspaces,
				connection: ctx.connection,
				ctx: ctx
			};
			ctx.slots.inject("shell.overlay", function () {
				try {
					var disposeRegistration = ctx.slots.register({
						name: "shell.overlay",
						id: "dsh-ui-panels",
						order: 900,
						label: function () {
							return t("shell.label");
						}
					}, function (props) {
						// 顶层错误边界：外壳任何渲染错误都显示错误卡片，绝不拖垮整个应用
						return h(ShellBoundary, Object.assign({}, injected, props),
							h(PanelsShell, Object.assign({}, injected, props)));
					});
					reportDiag({ type: "registered" });
					return disposeRegistration;
				} catch (e) {
					reportDiag({ type: "register-error", message: String((e && e.message) || e) });
					return function () {};
				}
			});

			// 右侧主侧栏：注册进 AppFrame 的右列槽位。
			// DSH 2.0.10 起官方槽位名是 `rightbar`（dsh-client-ui-sidebar-right 在此注册）；旧版本名是 `details`。
			// 两个都注册，但只允许一个生效（claimRightSlot）——避免万一两个槽位都存在时右侧栏渲染两次。
			// priority -1（低于官方 0）：single 槽位"优先级最低者渲染"，所以我们的右栏取代官方右栏。
			var rightSlotClaimed = null;
			function claimRightSlot(slotName) {
				if (rightSlotClaimed === null) rightSlotClaimed = slotName;
				return rightSlotClaimed === slotName;
			}
			function injectRightSlot(slotName) {
				ctx.slots.inject(slotName, function () {
					if (!claimRightSlot(slotName)) {
						reportDiag({ type: "right-slot-skipped", slot: slotName });
						return function () {};
					}
					try {
						var disposeRight = ctx.slots.register({
							name: slotName,
							priority: -1,
							locale: NS
						}, function (props) {
							return h(ShellBoundary, Object.assign({}, injected, props),
								h(RightSidebar, Object.assign({}, injected, props)));
						});
						reportDiag({ type: "right-slot-registered", slot: slotName });
						return disposeRight;
					} catch (e) {
						reportDiag({ type: "right-slot-error", slot: slotName, message: String((e && e.message) || e) });
						return function () {};
					}
				});
			}
			injectRightSlot("rightbar");
			injectRightSlot("details");

			// 8.6 外壳打开时：同步 body 标记与 CSS 变量。
			// --dp-chat/--dp-right = 可拖拽的列宽；--dp-left = 会话侧栏宽 + 聊天宽。
			ctx.effect(function () {
				function sync() {
					var state = store.getSnapshot();
					try { tagFrame(); } catch (eTag) { /* 忽略 */ }
					try {
						if (state.open) document.body.setAttribute("data-dp-shell", "1");
						else document.body.removeAttribute("data-dp-shell");
						rightOpenFlag = state.rightOpen;
						// 全屏↔窗口化切换（窗口 resize）或侧栏展开/收起时，重新按可用空间钳制列宽
						reClampWidths();
						document.body.style.setProperty("--dp-chat", chatWidth + "px");
						document.body.style.setProperty("--dp-right", state.rightOpen ? rightWidth + "px" : "48px");
						document.body.style.setProperty("--dp-strip", state.bottomOpen ? (state.bottomExpanded ? (state.bottomHeight || 200) + "px" : "34px") : "0px");
						refreshDpLeft();
						// 标题栏定位：把中心标签区放到标题栏下方（--dp-top），开关按钮放到标题右侧（--dp-fab-top/left）
						try {
							var trow = document.querySelector('[class*="titleRow"]');
							var tTitle = null;
							try {
								var cands = document.querySelectorAll("div,span,h1,h2,p,button");
								var bestTop = 1e9;
								for (var i = 0; i < cands.length; i++) {
									var el2 = cands[i];
									var r2 = el2.getBoundingClientRect();
									if (r2.top > 60 || r2.height > 40 || r2.height < 10 || r2.width < 30) continue;
									var tx = (el2.textContent || "").replace(/\s+/g, " ").trim();
									if (tx.length > 4 && tx.length < 40 && /^DeepSeek/i.test(tx) && el2.children.length === 0) {
										if (r2.top < bestTop) { bestTop = r2.top; tTitle = el2; }
									}
								}
							} catch (e2) { /* 忽略 */ }
							if (trow) {
								var tr = trow.getBoundingClientRect();
								document.body.style.setProperty("--dp-top", Math.round(tr.top + tr.height + 2) + "px");
								document.body.style.setProperty("--dp-fab-top", Math.round(tr.top) + "px");
							} else {
								document.body.style.setProperty("--dp-top", "46px");
								document.body.style.setProperty("--dp-fab-top", "12px");
							}
							if (tTitle) {
								var rt2 = tTitle.getBoundingClientRect();
								document.body.style.setProperty("--dp-fab-left", Math.round(rt2.right + 10) + "px");
							} else {
								document.body.style.setProperty("--dp-fab-left", "240px");
							}
						} catch (e) { /* 忽略 */ }
					} catch (e) { /* 忽略 */ }
					if (!state.open) return;
					try {
						closeOfficialRightbar(ctx.layout);
					} catch (e) { /* 忽略 */ }
				}
				var off = store.subscribe(sync);
				sync();
				// DSH 侧栏宽度变化（展开/收起）与窗口缩放时重测 --dp-left，中间自动靠左对齐
				var observer = null;
				try {
					var layer0 = document.querySelector("[data-shell-overlay]");
					var frameEl0 = layer0 && layer0.parentElement;
					var sidebarEl = frameEl0 && frameEl0.firstElementChild;
					if (sidebarEl && typeof ResizeObserver !== "undefined") {
						observer = new ResizeObserver(function () {
							if (store.getSnapshot().open) sync();
						});
						observer.observe(sidebarEl);
					}
				} catch (e) { /* 忽略 */ }
				var onResize = function () {
					if (store.getSnapshot().open) sync();
				};
				window.addEventListener("resize", onResize);
				return function () {
					off();
					window.removeEventListener("resize", onResize);
					if (observer) { try { observer.disconnect(); } catch (e) { /* 忽略 */ } }
				};
			}, NS + ": shell layout sync");

			// 8.6b 官方右栏看门狗：外壳打开时，官方右栏轨道一旦被打开（DSH 自带展开按钮或其他插件）立即关掉，
			// 避免与我们的第 4 列重复占位。frame 在 apply 时可能尚未挂载，所以观察 body 并在回调里延迟解析 frame。
			ctx.effect(function () {
				var observer = null;
				try {
					if (typeof MutationObserver !== "undefined") {
						var checkOfficialRightbar = function () {
							var state = store.getSnapshot();
							if (!state.open) return;
							try {
								var frameEl = findFrameEl();
								if (!frameEl) return;
								var grid = frameEl.style.gridTemplateColumns;
								if (!grid) return;
								var parts = grid.split(/\s+/).filter(Boolean);
								var third = parts.length >= 3 ? parseInt(parts[2], 10) : 0;
								if (third > 0) closeOfficialRightbar(ctx.layout);
							} catch (e) { /* 忽略 */ }
						};
						observer = new MutationObserver(checkOfficialRightbar);
						observer.observe(document.body, { attributes: true, attributeFilter: ["style"], subtree: true });
					}
				} catch (e) { /* 忽略 */ }
				return function () {
					if (observer) { try { observer.disconnect(); } catch (e) { /* 忽略 */ } }
				};
			}, NS + ": details watchdog");

			// 8.6c 官方框架打标 + 标题栏下沿重测。
			// 渲染器启动时 frame 可能晚于本插件挂载，先用 rAF 连试约 60 帧，之后每 2 秒幂等补一次。
			ctx.effect(function () {
				var tries = 0;
				var raf = null;
				var timer = null;
				function attempt() {
					raf = null;
					var ok = false;
					try { ok = tagFrame(); } catch (e) { /* 忽略 */ }
					try { refreshTopInset(); } catch (e2) { /* 忽略 */ }
					if (ok || ++tries > 60) return;
					try { raf = window.requestAnimationFrame(attempt); } catch (e3) { raf = window.setTimeout(attempt, 50); }
				}
				try { raf = window.requestAnimationFrame(attempt); } catch (e) { /* 忽略 */ }
				try {
					timer = window.setInterval(function () {
						try { tagFrame(); refreshTopInset(); } catch (e2) { /* 忽略 */ }
					}, 2000);
				} catch (e3) { /* 忽略 */ }
				return function () {
					if (raf !== null) {
						try { window.cancelAnimationFrame(raf); } catch (e) { /* 忽略 */ }
						try { window.clearTimeout(raf); } catch (e2) { /* 忽略 */ }
					}
					if (timer !== null) { try { window.clearInterval(timer); } catch (e3) { /* 忽略 */ } }
				};
			}, NS + ": frame tagging");

			// 8.7 生命周期清理
			ctx.effect(function () {
				return function () {
					if (unsubscribeScope) unsubscribeScope();
					if (disposeDict) disposeDict();
					if (diagTimer !== null) { try { window.clearInterval(diagTimer); } catch (e) { /* 忽略 */ } }
				};
			}, NS + ": lifecycle");
		}

		exports.apply = apply;
		exports.inject = ["slots", "locale", "settingsScope", "connection", "remote", "sessions", "workspaces", "loader", "layout"];
		return module.exports;
	}
});
