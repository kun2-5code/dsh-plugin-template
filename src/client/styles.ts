/**
 * 本插件的样式表：一个 <style> 节点，全部规则在下面。
 *
 * 原则：框架的样式就是我们的样式。这里只做两件事——引用主题语义别名，以及
 * 复制主机自己的几何约定。任何控件外观都不要在这里重新发明：能少写就少写，
 * 剩下的交给主题。
 *
 * 仓库内我们遵守的规则（docs/web-styling.md 与 packages/client/AGENTS.md），
 * 以及本文件对应的做法：
 *
 * - 颜色只用 `--dsw-alias-*` 语义别名，不复制调色板值，不写字面色值。
 * - 中性描边画 0.5px（Chromium 下一个设备像素）：用 `--dsw-alias-border-l1`。
 * - 抬升面（这里只有浮层）用 `border: 0` 加 `box-shadow: var(--dsw-elevation-panel)`，
 *   不把 `--dsw-alias-border-*` 描边和 elevation 阴影配在一起。
 * - 圆角走主题的 `--dsw-radius-*` 刻度；全圆角（胶囊、圆形）必须配
 *   `corner-shape: round`，否则超椭圆平滑会把圆拉扁。
 * - 字号与行高成对出现，取主机的排版刻度（12 / 13 / 14 / 16）。
 * - 悬停用 `--dsw-alias-interactive-bg-hover`，禁用用 `opacity: 0.45`。
 * - 不写 `outline: none`。焦点环由主题的 focus.css 提供，插件只要不覆盖它。
 *
 * 为什么是一张注入的表而不是 CSS Module：仓库里的组件样式确实用 CSS Module，
 * 但那条管线（`packages/client/tsdown.client.ts` 的 clientBundle preset）不随包
 * 发布，仓库外的包要自己复现构建。插槽组件渲染在宿主给的位置上，插件拿不到一个
 * 属于自己的根节点，因此也无法用根类名把规则限定在作用域内——`dtpl-` 前缀必须
 * 全局唯一，这是它存在的唯一理由。
 *
 * @module dsh-plugin-template/client/styles
 */

import { NAMESPACE } from './constants.ts'

const CSS = `
.dtpl-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 0.5px solid var(--dsw-alias-border-l1);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
}
.dtpl-btn:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dtpl-btn:disabled { opacity: 0.45; cursor: default; }

.dtpl-dot { font-size: 12px; line-height: 16px; }

.dtpl-badge {
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 999px;
  corner-shape: round;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 16px;
}

.dtpl-row { display: flex; align-items: center; gap: 8px; }

.dtpl-note, .dtpl-summary, .dtpl-prose {
  margin: 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 20px;
}

.dtpl-strip {
  margin: 0 auto;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 16px;
  text-align: center;
}

.dtpl-dock {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 16px;
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
  border: 0;
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
  box-shadow: var(--dsw-elevation-panel);
}
.dtpl-overlay-close {
  padding: 0 4px;
  border: 0;
  background: none;
  color: var(--dsw-alias-label-secondary);
  font-size: 16px;
  line-height: 20px;
  cursor: pointer;
}

.dtpl-command {
  display: flex;
  gap: 8px;
  font-size: 13px;
  line-height: 20px;
}
.dtpl-command-status { color: var(--dsw-alias-label-secondary); }
.dtpl-command-failed { color: var(--dsw-alias-state-error-primary); }

.dtpl-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
}
.dtpl-form-title {
  margin: 0;
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
}
.dtpl-field { display: flex; flex-direction: column; gap: 4px; }
.dtpl-field-inline { flex-direction: row; align-items: flex-start; gap: 8px; }
.dtpl-field-label { display: flex; align-items: center; gap: 6px; }
.dtpl-field-hint {
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 16px;
}
.dtpl-field input[type='text'],
.dtpl-field input[type='number'] {
  padding: 6px 8px;
  border: 0.5px solid var(--dsw-alias-border-l1);
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
}
.dtpl-field input:disabled { opacity: 0.45; }
.dtpl-invalid { color: var(--dsw-alias-state-error-primary); font-size: 12px; line-height: 16px; }
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
