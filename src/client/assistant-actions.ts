/**
 * 消息操作（conversation.chat.assistant-actions 插槽）：在每条 AI 回复消息的
 * 操作条里加一个"收藏"按钮。session 级 list；owner 传被寻址消息的 messageId
 * （本示例不消费它，仅演示按钮位）。参考：ui-message-feedback（id 'feedback'）。
 * @module dsh-plugin-template/client/assistant-actions
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import { NAMESPACE } from './constants.ts'

/** 在 `conversation.chat.assistant-actions` 插槽注册示例按钮。 */
export function registerAssistantAction(ctx: Context): void {
  ctx.slots.inject('conversation.chat.assistant-actions', () => ctx.slots.register(
    { name: 'conversation.chat.assistant-actions', id: NAMESPACE, order: 30 },
    AssistantAction,
  ))
}

/** 每条 AI 消息上的"收藏"按钮（本地状态，逐消息独立）。 */
function AssistantAction(): React.ReactElement {
  const [saved, setSaved] = React.useState(false)
  return React.createElement(
    'button',
    {
      type: 'button',
      className: 'dtpl-btn',
      'aria-pressed': saved,
      onClick: () => setSaved(!saved),
    },
    React.createElement('span', null, saved ? '已收藏 ★' : '收藏 ☆'),
  )
}
