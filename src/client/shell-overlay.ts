/**
 * 全局浮层（shell.overlay 插槽）：在框架级浮层上渲染一枚可关闭的示例 pill。
 * root 级 list——加一个条目就是加一个浮层元素。布局注意：该层只是
 * inset:0 的全框层（AppFrame.module.css 的 .overlayLayer），不提供条目布局，
 * 条目自己负责定位——本示例按 toast 惯例 fixed 到右下角（styles.ts），
 * 并带一个关闭按钮，避免挡住任何界面。层本身点击穿透，条目自行 opt-in
 * 指针事件。
 * 参考：ui-layout 声明该插槽，目前没有任何内置插件注册（空白加法位）。
 * @module dsh-plugin-template/client/shell-overlay
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import { NAMESPACE } from './constants.ts'

/** 在 `shell.overlay` 插槽注册示例浮层 pill。 */
export function registerShellOverlay(ctx: Context): void {
  ctx.slots.inject('shell.overlay', () => ctx.slots.register(
    { name: 'shell.overlay', id: NAMESPACE, order: 30 },
    ShellOverlayDemo,
  ))
}

/** 右下角一枚示例 pill，可点 × 关闭（演示浮层座本身 + 条目自定位）。 */
function ShellOverlayDemo(): React.ReactElement | null {
  const [dismissed, setDismissed] = React.useState(false)
  if (dismissed) return null
  return React.createElement(
    'div',
    { className: 'dtpl-overlay', role: 'status' },
    React.createElement('span', null, '模板浮层示例（shell.overlay）'),
    React.createElement(
      'button',
      {
        type: 'button',
        className: 'dtpl-overlay-close',
        'aria-label': '关闭示例浮层',
        onClick: () => setDismissed(true),
      },
      '×',
    ),
  )
}
