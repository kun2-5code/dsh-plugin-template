/**
 * 本插件的样式表：一个 <style> 节点，所有 `dtpl-*` 类都在这里定义。
 *
 * 约定（改名时保持不变）：
 * - `dtpl-` 前缀必须全局唯一，否则两个插件的规则会互相串味。
 * - 颜色只用 `--dsw-alias-*` 主题令牌，不写字面色值，这样明暗主题自动跟随。
 * - `font-weight` 不超过 500；字号只用主题的排版层级。
 *
 * 节点带 `data-plugin` 归属标记，便于定位是哪一份样式表。
 * @module dsh-plugin-template/client/styles
 */

import { NAMESPACE } from './constants.ts'

const CSS = `
.dtpl-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid var(--dsw-alias-label-primary);
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.dtpl-btn:disabled { opacity: 0.5; cursor: default; }
.dtpl-dot { font-size: 11px; }
.dtpl-badge {
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
}
.dtpl-row { display: flex; align-items: center; gap: 8px; }
.dtpl-note { color: var(--dsw-alias-label-secondary); font-size: 13px; }
.dtpl-summary, .dtpl-prose { color: var(--dsw-alias-label-secondary); font-size: 13px; }
.dtpl-strip {
  margin: 0 auto;
  padding: 2px 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  text-align: center;
}
.dtpl-dock {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.dtpl-dock-id { color: var(--dsw-alias-label-tertiary); }
.dtpl-overlay {
  position: fixed;
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: min(320px, calc(100vw - 32px));
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-label-primary);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  box-shadow: var(--dsw-alias-shadow-popup);
}
.dtpl-overlay-close {
  border: 0;
  background: none;
  color: var(--dsw-alias-label-secondary);
  font-size: 15px;
  cursor: pointer;
}
.dtpl-command { display: flex; gap: 8px; font-size: 13px; }
.dtpl-command-line { font-family: var(--dsw-alias-font-code); }
.dtpl-command-status { color: var(--dsw-alias-label-secondary); }
.dtpl-command-failed { color: var(--dsw-alias-state-error-primary); }
.dtpl-form { display: flex; flex-direction: column; gap: 12px; }
.dtpl-form-title { margin: 0; font-size: 14px; font-weight: 500; }
.dtpl-field { display: flex; flex-direction: column; gap: 4px; }
.dtpl-field-inline { flex-direction: row; align-items: flex-start; gap: 8px; }
.dtpl-field-label { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.dtpl-field-hint { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.dtpl-field input[type='text'], .dtpl-field input[type='number'] {
  padding: 6px 8px;
  border: 1px solid var(--dsw-alias-label-primary);
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
}
.dtpl-invalid { color: var(--dsw-alias-state-error-primary); font-size: 12px; }
.dtpl-form-actions { display: flex; gap: 8px; justify-content: flex-end; }
`

/**
 * 注入本插件的样式表。
 * @returns 移除样式节点的清理函数，交给 `ctx.effect` 在插件停用时调用。
 */
export function injectStyles(): () => void {
  const tag = document.createElement('style')
  tag.dataset.plugin = NAMESPACE
  tag.textContent = CSS
  document.head.appendChild(tag)
  return () => { tag.remove() }
}
