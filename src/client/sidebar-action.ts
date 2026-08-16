/**
 * 侧栏底部操作（sidebar.footer.action 插槽）：在左侧栏底部"设置"旁注册一个
 * 示例按钮。该插槽是 root 级 list——加一个条目就是加一个按钮；owner 只传
 * 侧栏宽/窄状态（wide），组件据此决定显示完整文案还是仅图标。
 * 参考：ui-sidebar 声明该插槽，目前没有任何内置插件注册（空白加法位）。
 * @module dsh-plugin-template/client/sidebar-action
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import { NAMESPACE } from './constants.ts'

/** 在 `sidebar.footer.action` 插槽注册示例按钮。 */
export function registerSidebarAction(ctx: Context): void {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
    { name: 'sidebar.footer.action', id: NAMESPACE, order: 30 },
    SidebarAction,
  ))
}

/** 侧栏底部按钮：宽栏显示"模板示例操作"，窄栏（rail）只显示状态点。 */
function SidebarAction(props: { wide?: boolean }): React.ReactElement {
  const [lit, setLit] = React.useState(false)
  return React.createElement(
    'button',
    {
      type: 'button',
      className: 'dtpl-sidebar-action',
      onClick: () => setLit(!lit),
      'aria-pressed': lit,
    },
    React.createElement('span', { className: 'dtpl-sidebar-dot' }, lit ? '●' : '○'),
    props.wide === false
      ? null
      : React.createElement('span', null, '模板示例操作'),
  )
}
