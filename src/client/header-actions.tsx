/**
 * 会话头动作：`conversation.session.header.actions`，在会话标题右侧注册一个示例按钮。
 *
 * session 级 list 插槽，同层的 `conversation.session.header.utilities` 留给
 * 徽标类内容。
 * @module dsh-plugin-template/client/header-actions
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'

/** 注册项的 props。 */
type HeaderActionProps = PropsLocale<typeof LOCALE_NAMESPACE>

/**
 * 注册 `conversation.session.header.actions` 的示例按钮。
 * @param ctx - 客户端根上下文。
 */
export function registerHeaderAction(ctx: Context): void {
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register(
    { name: 'conversation.session.header.actions', id: NAMESPACE, order: 30, locale: LOCALE_NAMESPACE },
    HeaderAction,
  ))
}

/** 会话头右侧的一个开关按钮。 */
function HeaderAction(props: HeaderActionProps): React.ReactElement {
  const { t } = props
  const [lit, setLit] = React.useState(false)
  return (
    <button
      type="button"
      className="dtpl-btn"
      aria-pressed={lit}
      onClick={() => { setLit(!lit) }}
    >
      <span className="dtpl-dot" aria-hidden="true">{lit ? '●' : '○'}</span>
      <span>{t('header.label')}</span>
    </button>
  )
}
