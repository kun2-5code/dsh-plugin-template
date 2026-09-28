/**
 * 本插件的样式表：一个 <style> 节点，全部规则在下面。
 *
 * 原则：框架的样式就是我们的样式。这里只做两件事——引用主题语义别名，以及
 * **照抄主机自己的几何**。凡是主机已经定过外观的控件，都不重新发明。
 *
 * 每条规则后面的注释写明抄自哪里。抄的来源是：
 * - `packages/client/ui-goal/src/client/GoalBar.module.css`（输入区上方的卡片）
 * - `packages/client/ui-chat/src/client/chat/StatsPills.module.css`（输入卡片下方居中的 pill）
 * - `packages/client/ui-sidebar/src/client/SidebarRoot.module.css`（侧栏图标按钮）
 * - `packages/client/ui-conversation/src/client/queue/QueueDock.module.css`（dock 列宽）
 *
 * 通用约定（docs/web-styling.md 与 packages/client/AGENTS.md）：
 * - 颜色只用 `--dsw-alias-*`，不写字面色值。
 * - 中性描边 0.5px（1x 屏上正好一个设备像素）。
 * - 抬升面用 `border: 0` 加 `box-shadow: var(--dsw-elevation-panel)`。
 * - 圆角走 `--dsw-radius-*`；全圆角必须配 `corner-shape: round`。
 * - 字号与行高成对，取主机刻度 12 / 13 / 14 / 16。
 * - 悬停用 `--dsw-alias-interactive-bg-hover`，禁用用 `opacity: 0.4~0.45`。
 * - 不写 `outline: none`；焦点环由主题的 focus.css 提供。
 *
 * 为什么是一张注入的表而不是 CSS Module：仓库里的组件样式确实用 CSS Module，
 * 但那条管线（`packages/client/tsdown.client.ts` 的 clientBundle preset）不随包
 * 发布，仓库外的包要自己复现构建。插槽组件渲染在宿主给的位置上，插件拿不到属于
 * 自己的根节点，因此也无法用根类名限定作用域——`dtpl-` 前缀必须全局唯一，这是它
 * 存在的唯一理由。
 *
 * @module dsh-plugin-template/client/styles
 */

import { NAMESPACE } from './constants.ts'

const CSS = `
/* ---- 通用小件 ---- */

/* 侧栏底部行：抄 ui-settings-general 的 .trigger。
   展开态是 42px 高的整宽行（flex:1 + 0 10px 0 8px 内边距 + 14px 文字），
   收起态换成 36x36 居中的方钮，和侧栏里其它 rail 控件同尺寸。 */
.dtpl-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  height: 42px;
  padding: 0 10px 0 8px;
  border: none;
  border-radius: var(--dsw-radius-md);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 14px;
  line-height: 22px;
  text-align: left;
  cursor: pointer;
}
.dtpl-foot:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dtpl-foot:disabled { opacity: 0.4; cursor: default; }
.dtpl-foot-rail {
  flex: none;
  justify-content: center;
  gap: 0;
  width: 36px;
  height: 36px;
  padding: 0;
}
.dtpl-foot-label {
  overflow: hidden;
  white-space: nowrap;
}

/* 会话头的被动标签：抄 ui-agent-preset 的 AgentPresetLabel .label。
   22px 高、4px 圆角、12/22 三级文字，标题行变窄时先让这枚 passive chrome 让位。
   注意宿主那条 background 引用了未声明的 --dsw-alias-fill-tsp-secondary，计算后是透明；
   这里用已声明的浅层背景，落成它本来想要的样子。 */
.dtpl-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-sizing: border-box;
  max-width: 180px;
  height: 22px;
  padding: 0 6px;
  border-radius: var(--dsw-radius-xs);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 22px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
@container (max-width: 540px) {
  .dtpl-tag { display: none; }
}

/* 带文字的按钮：抄 StatsPills.module.css:22 的 .pill 形态（胶囊、transparent
   底、tertiary 文字），但给它一个常态的 secondary 文字色，因为它是可点的。 */
.dtpl-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 1px 8px;
  border: none;
  border-radius: 999px;
  corner-shape: round;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font-family: inherit;
  font-size: 12px;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  cursor: pointer;
}
.dtpl-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.dtpl-btn:disabled { opacity: 0.4; cursor: default; }
.dtpl-btn[aria-pressed='true'] { color: var(--dsw-alias-label-primary); }

/* 文字按钮：设置页头部、会话头这类地方需要一个看得出来的按钮。 */
.dtpl-text-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 0.5px solid var(--dsw-alias-border-l4);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
}
.dtpl-text-btn:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dtpl-text-btn:disabled { opacity: 0.45; cursor: default; }

/* 状态点：用 CSS 画，不拿 ●/○ 这样的字符充数。
   字符会随字体回退变成方框，尺寸也跟不住旁边的小字；一个 6px 的圆点由令牌上色，
   明暗主题都跟着走。全圆角配 corner-shape: round。 */
.dtpl-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  corner-shape: round;
  background: var(--dsw-alias-label-tertiary);
}
.dtpl-dot[data-on='true'] { background: var(--dsw-alias-state-success-primary); }

/* 计数/标签徽标：pill 里的数字与标签，tertiary 文字、无底色、表格数字对齐。 */
.dtpl-badge {
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}

/* ---- 输入区 dock（conversation.input.dock）----
   抄 GoalBar.module.css 的 .dock：宽度扣掉 composer 的侧边留白与 dock 内缩，
   再用 margin: 0 auto 居中。GoalBar 的 .bar 是一张撑满的卡片、内容左对齐；这里
   是一排状态而不是卡片，所以内容也要居中——只居中盒子不居中内容，pill 一样会贴在
   左边。 */
.dtpl-dock {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: calc(
    100% -
    var(--dsh-composer-side-clearance) -
    var(--dsh-composer-side-clearance) -
    var(--dsh-composer-dock-inset) -
    var(--dsh-composer-dock-inset) -
    var(--dsh-composer-dock-inset) -
    var(--dsh-composer-dock-inset)
  );
  max-width: calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));
  margin: 0 auto;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 20px;
}
/* 溢出时截断并省略号，不换行——抄 GoalBar .objective 的处理。 */
.dtpl-dock-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 输入卡片下缘 dock（conversation.composer.dock）----
   抄 StatsPills.module.css 的 .root：居中、pill 排布。 */
.dtpl-strip {
  display: flex;
  justify-content: center;
  gap: 12px;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 20px;
}
.dtpl-strip-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- 帧级浮层（shell.overlay）----
   抬升面：border: 0 + elevation-panel，抄 GoalBar .bar 的做法。 */
.dtpl-overlay {
  position: fixed;
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
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
.dtpl-overlay-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dtpl-overlay-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 999px;
  corner-shape: round;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font-size: 16px;
  line-height: 20px;
  cursor: pointer;
}
.dtpl-overlay-close:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}

/* ---- 命令行（conversation.chat.commandview）---- */
.dtpl-command {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
  line-height: 20px;
}
.dtpl-command-line {
  flex: none;
  font-family: var(--ds-font-family-code);
}
.dtpl-command-status {
  min-width: 0;
  overflow: hidden;
  color: var(--dsw-alias-label-tertiary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dtpl-command-failed { color: var(--dsw-alias-state-error-primary); }

/* ---- 设置页与通用设置行 ---- */
.dtpl-note, .dtpl-summary, .dtpl-prose {
  margin: 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 20px;
}
.dtpl-prose > p { margin: 0 0 8px; }
.dtpl-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
}

/* ---- 配置表单 ----
   输入框抄 GoalBar .objectiveInput：0.5px border-l4 + radius-sm。 */
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
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
}
.dtpl-field { display: flex; flex-direction: column; gap: 4px; }
.dtpl-field-inline { flex-direction: row; align-items: flex-start; gap: 8px; }
.dtpl-field-label { display: flex; align-items: center; gap: 6px; }
.dtpl-field-hint {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 16px;
}
.dtpl-field input[type='text'],
.dtpl-field input[type='number'] {
  box-sizing: border-box;
  height: 26px;
  padding: 0 8px;
  border: 0.5px solid var(--dsw-alias-border-l4);
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 13px;
  line-height: 20px;
}
.dtpl-field input:focus { border-color: var(--dsw-alias-state-business-primary); }
.dtpl-field input:disabled { opacity: 0.45; }
.dtpl-field input::placeholder { color: var(--dsw-alias-label-caption); }
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
