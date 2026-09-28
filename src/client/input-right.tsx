/**
 * 输入卡片右端控件：`conversation.input.right`，在输入卡片右端注册一个示例按钮。
 *
 * session 级 list 插槽，与 `conversation.input.left` 同一层级。按钮放在输入
 * 卡片里，必须显式写 `type="button"`，否则会落成 submit。
 * @module dsh-plugin-template/client/input-right
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'

/** 注册项的 props。 */
type InputRightProps = PropsLocale<typeof LOCALE_NAMESPACE>

/**
 * 注册 `conversation.input.right` 的示例按钮。
 * @param ctx - 客户端根上下文。
 */
export function registerInputRight(ctx: Context): void {
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register(
    { name: 'conversation.input.right', id: NAMESPACE, order: 30, locale: LOCALE_NAMESPACE },
    InputRight,
  ))
}

/** 输入卡片右端的一个计数按钮。 */
export function InputRight(props: InputRightProps): React.ReactElement {
  const { t } = props
  const [count, setCount] = React.useState(0)
  return (
    <button
      type="button"
      className="dtpl-btn"
      onClick={() => { setCount(previous => previous + 1) }}
    >
      <span>{t('input.right')}</span>
      <span className="dtpl-badge">{count}</span>
    </button>
  )
}
