/**
 * 全局浮层（shell.overlay 插槽）：在框架级浮层上渲染一枚示例 pill。
 * root 级 list——加一个条目就是加一个浮层元素；该层本身是点击穿透的
 * （click-through），条目自行 opt-in 指针事件（styles.ts 的 pointer-events）。
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

/** 一枚常驻示例 pill（无交互，演示浮层座本身）。 */
function ShellOverlayDemo(): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'dtpl-overlay', role: 'status' },
    '模板浮层示例（shell.overlay）',
  )
}
