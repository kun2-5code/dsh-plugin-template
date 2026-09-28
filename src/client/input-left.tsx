/**
 * 输入卡片左端控件：`conversation.input.left`，在输入卡片左端注册一个示例开关。
 *
 * session 级 list 插槽，owner 只传状态位（`InputZone`），需要实时数据时用
 * 标准 hook（`useSession` / `useInput`）而不是自建订阅。
 * @module dsh-plugin-template/client/input-left
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'

/** 注册项的 props。 */
type InputLeftProps = PropsLocale<typeof LOCALE_NAMESPACE>

/**
 * 注册 `conversation.input.left` 的示例控件。
 * @param ctx - 客户端根上下文。
 */
export function registerInputLeft(ctx: Context): void {
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register(
    { name: 'conversation.input.left', id: NAMESPACE, order: 30, locale: LOCALE_NAMESPACE },
    InputLeft,
  ))
}

/** 输入卡片左端的一个开关。 */
function InputLeft(props: InputLeftProps): React.ReactElement {
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
      <span>{t('input.left')}</span>
    </button>
  )
}
