/**
 * 逐消息动作：`conversation.chat.assistant-actions`，在每条 AI 回复旁注册一个按钮。
 *
 * session 级 list 插槽。owner 会把它所寻址的那条消息的 `messageId` 作为 prop
 * 传进来，所以按钮能定位到具体消息；owner 另行提供 `wide` 之类的宽度位。
 * @module dsh-plugin-template/client/assistant-actions
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'

/** 注册项的 props：owner 传消息 id，加本插件的 `t` 席位。 */
type AssistantActionProps =
  & { readonly messageId: string }
  & PropsLocale<typeof LOCALE_NAMESPACE>

/**
 * 注册 `conversation.chat.assistant-actions` 的示例按钮。
 * @param ctx - 客户端根上下文。
 */
export function registerAssistantAction(ctx: Context): void {
  ctx.slots.inject('conversation.chat.assistant-actions', () => ctx.slots.register(
    { name: 'conversation.chat.assistant-actions', id: NAMESPACE, order: 30, locale: LOCALE_NAMESPACE },
    AssistantAction,
  ))
}

/** 每条 AI 回复旁的一个开关按钮。pill 形态，与消息行读起来一致。 */
export function AssistantAction(props: AssistantActionProps): React.ReactElement {
  const { t, messageId } = props
  const [saved, setSaved] = React.useState(false)
  return (
    <button
      type="button"
      className="dtpl-btn"
      aria-pressed={saved}
      // 消息 id 是内部身份，不印在界面上；放进 data 属性供处理函数定位。
      data-message-id={messageId}
      title={saved ? t('message.saved') : t('message.save')}
      onClick={() => { setSaved(!saved) }}
    >
      <span>{saved ? t('message.saved') : t('message.save')}</span>
    </button>
  )
}
