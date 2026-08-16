/**
 * 客户端半边的一次性样式注入：所有 dtpl-* class 汇总在单个 <style> 里，
 * 颜色全部走主题变量（--dsw-alias-*，见 harness 的
 * ui-theme/src/styles/design-platform.css），深浅色自动适配。
 * @module dsh-plugin-template/client/styles
 */

import { NAMESPACE } from './constants.ts'

/** tsconfig 没有 dom lib，这里声明用到的 DOM 形状。 */
declare const document: {
  createElement(tag: 'style'): { dataset: Record<string, string>; textContent: string }
  head: { appendChild(node: { dataset: Record<string, string>; textContent: string }): void }
}

let stylesInjected = false

/** 注入 <style data-plugin data-plugin-css>；client-modules 的 claimStyles 据此回收。 */
export function injectStyles(): void {
  if (stylesInjected || typeof document === 'undefined') return
  stylesInjected = true
  const tag = document.createElement('style')
  tag.dataset.plugin = NAMESPACE
  tag.dataset.pluginCss = `${NAMESPACE}/card`
  tag.textContent = `
.dtpl-card {
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-3);
  transition: border-color .16s, background .16s;
}
.dtpl-card:hover { border-color: var(--dsw-alias-label-dimmed); }
.dtpl-card-open { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-label-dimmed); }
.dtpl-header {
  width: 100%; appearance: none; border: 0; background: none; font: inherit;
  color: inherit; text-align: left; cursor: pointer;
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 12px;
}
.dtpl-header:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }
.dtpl-head-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.dtpl-name { font-size: 15px; font-weight: 600; line-height: 1.4; color: var(--dsw-alias-label-primary); }
.dtpl-description { font-size: 13px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); }
/* 与内置 PluginCard 同款 chevron 图标（IconChevronDownOutline14）的样式。 */
.dtpl-chevron {
  flex: none; color: var(--dsw-alias-label-tertiary); transition: transform .16s;
}
.dtpl-chevron-open { transform: rotate(180deg); }
.dtpl-body { border-top: 1px solid var(--dsw-alias-border-l2); margin: 0 16px; padding-bottom: 8px; }
.dtpl-read-only { margin: 12px 0 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); }
.dtpl-pending {
  flex: none; border-radius: 999px; padding: 1px 8px; font-size: 11px; line-height: 17px;
  font-weight: 500; white-space: nowrap;
  background: var(--dsw-alias-bg-module-platform); color: var(--dsw-alias-label-secondary);
}
.dtpl-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 12px 0 4px; border-top: 1px solid var(--dsw-alias-border-l2);
}
.dtpl-failed { flex: 1; min-width: 0; margin: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-state-error-primary); }
.dtpl-discard, .dtpl-save {
  appearance: none; border: 1px solid transparent; border-radius: 8px;
  padding: 5px 14px; font: inherit; font-size: 13px; line-height: 1.5; cursor: pointer;
}
.dtpl-discard { border-color: var(--dsw-alias-border-l2); background: none; color: var(--dsw-alias-label-secondary); }
.dtpl-discard:hover:not(:disabled) { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-label-dimmed); }
.dtpl-save { background: var(--dsw-alias-label-primary); color: var(--dsw-alias-bg-layer-3); }
.dtpl-discard:disabled, .dtpl-save:disabled { opacity: 0.4; cursor: default; }
.dtpl-discard:focus-visible, .dtpl-save:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.dtpl-field { display: flex; flex-direction: column; gap: 6px; padding: 12px 0; }
.dtpl-field + .dtpl-field { border-top: 1px solid var(--dsw-alias-border-l2); }
.dtpl-field-head { display: flex; align-items: center; gap: 8px; }
.dtpl-label { flex: 1; min-width: 0; font-size: 13px; font-weight: 500; line-height: 1.5; color: var(--dsw-alias-label-primary); }
.dtpl-status { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; }
.dtpl-status-title { margin: 0; font-size: 14px; font-weight: 600; line-height: 1.4; color: var(--dsw-alias-label-primary); }
.dtpl-status-body { margin: 0; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-tertiary); }
.dtpl-sidebar-action {
  appearance: none; border: 0; background: none; font: inherit;
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 12px; border-radius: 8px; text-align: left;
  font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary); cursor: pointer;
}
.dtpl-sidebar-action:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.dtpl-sidebar-action:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }
.dtpl-sidebar-dot { flex: none; font-size: 10px; line-height: 1; }
.dtpl-dock {
  box-sizing: border-box;
  /* conversation.input.dock 渲染为全宽行；宽度/居中由条目自己负责。
     与内置 QueueDock 对齐输入卡片：内容列 = 卡片宽 - 4 个 dock inset（= 对话正文宽）。 */
  width: 100%;
  max-width: calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));
  margin: 0 auto;
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary);
  border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px;
  background: var(--dsw-alias-bg-layer-3);
}
.dtpl-dock-id { color: var(--dsw-alias-label-primary); font-weight: 500; }
.dtpl-overlay {
  /* shell.overlay 层只是 inset:0 的全框层、不提供条目布局——条目自己定位
     （toast 式：fixed 到右下角，避开导航与操作区）；层本身点击穿透，
     条目自行 opt-in 指针事件。 */
  position: fixed;
  right: 16px;
  bottom: 16px;
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 999px;
  border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3);
  font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary);
  pointer-events: auto;
}
.dtpl-overlay-close {
  appearance: none; border: 0; background: none; padding: 0; font: inherit; cursor: pointer;
  font-size: 12px; line-height: 1; color: var(--dsw-alias-label-tertiary);
}
.dtpl-overlay-close:hover { color: var(--dsw-alias-label-primary); }
.dtpl-header-util {
  /* 会话头右侧工具徽标：非交互徽章（pill），背景走 platform 模块色。 */
  appearance: none; border: 0; background: var(--dsw-alias-bg-module-platform); font: inherit;
  padding: 3px 10px; border-radius: 999px; font-size: 12px; line-height: 1.5;
  color: var(--dsw-alias-label-secondary);
}
.dtpl-input-tool {
  appearance: none; border: 1px solid var(--dsw-alias-border-l2); background: none; font: inherit; cursor: pointer;
  height: 28px; padding: 0 10px; border-radius: 8px; font-size: 12px; line-height: 1.5;
  color: var(--dsw-alias-label-secondary); display: inline-flex; align-items: center; gap: 6px;
}
.dtpl-input-tool:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.dtpl-command {
  display: flex; align-items: center; gap: 10px; min-width: 0;
  padding: 8px 12px; font-size: 13px; line-height: 1.5; color: var(--dsw-alias-label-primary);
  border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px;
  background: var(--dsw-alias-bg-layer-3);
}
.dtpl-command-line { color: var(--dsw-alias-label-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dtpl-command-status { flex: none; font-size: 12px; color: var(--dsw-alias-label-tertiary); }
.dtpl-btn {
  appearance: none; border: 1px solid var(--dsw-alias-border-l2); background: none; font: inherit; cursor: pointer;
  height: 28px; padding: 0 10px; border-radius: 8px; font-size: 12px; line-height: 1.5;
  color: var(--dsw-alias-label-secondary); display: inline-flex; align-items: center; gap: 6px;
}
.dtpl-btn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.dtpl-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.dtpl-general-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 0; font-size: 13px; line-height: 1.5; color: var(--dsw-alias-label-primary);
}
.dtpl-general-row input[type='checkbox'] { width: 16px; height: 16px; accent-color: var(--dsw-alias-brand-primary); }
.dtpl-tab-content { padding: 16px; font-size: 13px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }
.dtpl-tab-content p { margin: 0 0 8px; }
.dtpl-composer-strip {
  /* 照内置 StatsLine 的完整对齐：条在输入卡片列内 margin auto 居中，
     文字 text-align center（block 而非 flex，便于超长省略号）。 */
  box-sizing: border-box;
  display: block;
  text-align: center;
  width: 100%;
  max-width: var(--dsh-chat-content-width);
  margin: 0 auto;
  padding: 4px calc(var(--dsh-composer-side-clearance) + 16px) 0;
  font-size: 12px; line-height: 20px; color: var(--dsw-alias-label-tertiary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dtpl-badges { display: inline-flex; align-items: center; gap: 8px; }
.dtpl-badge {
  border-radius: 999px; padding: 1px 8px; font-size: 11px; line-height: 17px; white-space: nowrap; font-weight: 500;
  background: var(--dsw-alias-bg-module-platform); color: var(--dsw-alias-label-secondary);
}
.dtpl-reset { border: none; background: none; padding: 0; font: inherit; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary); cursor: pointer; }
.dtpl-reset:hover:not(:disabled) { color: var(--dsw-alias-label-primary); }
.dtpl-reset:disabled { cursor: default; }
.dtpl-input {
  height: 34px; padding: 0 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px;
  background: var(--dsw-alias-bg-layer-3); font: inherit; font-size: 13px; line-height: 1.5;
  color: var(--dsw-alias-label-primary);
}
.dtpl-input:focus-visible { outline: none; border-color: var(--dsw-alias-brand-primary); }
.dtpl-input:disabled { color: var(--dsw-alias-label-tertiary); cursor: default; }
.dtpl-input-invalid { border-color: var(--dsw-alias-state-error-primary); }
.dtpl-checkbox { width: 16px; height: 16px; accent-color: var(--dsw-alias-brand-primary); }
.dtpl-invalid { margin: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-state-error-primary); }
.dtpl-hint { margin: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); }
`
  document.head.appendChild(tag)
}
