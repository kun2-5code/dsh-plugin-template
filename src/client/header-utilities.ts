/**
 * 会话头工具位（conversation.session.header.utilities 插槽）：在会话标题右侧
 * 渲染一个右对齐的工具徽标。session 级 list——通过 options.inject 工厂收到
 * sessionId；与 header.actions（操作按钮行）分开，避免挤占标题旁的交互位。
 * 参考：ui-conversation 声明该插槽，目前没有任何内置插件注册（空白加法位）。
 * @module dsh-plugin-template/client/header-utilities
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import { NAMESPACE } from './constants.ts'

/** 在 `conversation.session.header.utilities` 插槽注册示例工具位。 */
export function registerHeaderUtility(ctx: Context): void {
  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register(
    {
      name: 'conversation.session.header.utilities',
      id: NAMESPACE,
      order: 30,
      inject: (sessionId) => ({ sessionId }),
    },
    HeaderUtility,
  ))
}

/** 右对齐工具徽标：展示注入的 sessionId 前 8 位，演示 session 级接线。 */
function HeaderUtility(props: { sessionId?: string }): React.ReactElement {
  const short = props.sessionId === undefined ? '—' : props.sessionId.slice(0, 8)
  return React.createElement(
    'span',
    { className: 'dtpl-header-util' },
    `模板工具位 · ${short}`,
  )
}
