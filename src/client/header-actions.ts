/**
 * 会话头操作（conversation.session.header.actions 插槽）：在会话标题旁的
 * 操作行里加一个按钮。session 级 list；条目按 order 升序渲染（负值预留给
 * 静态会话上下文）。参考：ui-agent-preset / ui-jobs / ui-subagent 都在这里
 * 注册过按钮。
 * @module dsh-plugin-template/client/header-actions
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import { NAMESPACE } from './constants.ts'

/** 在 `conversation.session.header.actions` 插槽注册示例按钮。 */
export function registerHeaderAction(ctx: Context): void {
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register(
    { name: 'conversation.session.header.actions', id: NAMESPACE, order: 30 },
    HeaderAction,
  ))
}

/** 一个点亮/熄灭的会话头按钮。 */
function HeaderAction(): React.ReactElement {
  const [lit, setLit] = React.useState(false)
  return React.createElement(
    'button',
    {
      type: 'button',
      className: 'dtpl-btn',
      'aria-pressed': lit,
      onClick: () => setLit(!lit),
    },
    React.createElement('span', { className: 'dtpl-sidebar-dot' }, lit ? '●' : '○'),
    React.createElement('span', null, '模板'),
  )
}
