/**
 * 输入卡片工具行右端控件（conversation.input.right 插槽）：常驻小按钮，
 * 位于工具行右端、发送键旁。session 级 list；与 input.left 同一高度预算
 * （单行）。参考：ui-conversation 声明该插槽，目前没有任何内置插件注册
 * （空白加法位）。
 * @module dsh-plugin-template/client/input-right
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import { NAMESPACE } from './constants.ts'

/** 在 `conversation.input.right` 插槽注册示例控件。 */
export function registerInputRight(ctx: Context): void {
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register(
    { name: 'conversation.input.right', id: NAMESPACE, order: 30 },
    InputRight,
  ))
}

/** 一个本地计数的常驻小按钮。 */
function InputRight(): React.ReactElement {
  const [count, setCount] = React.useState(0)
  return React.createElement(
    'button',
    {
      type: 'button',
      className: 'dtpl-input-tool',
      onClick: () => setCount(count + 1),
    },
    React.createElement('span', null, `模板右 · ${count}`),
  )
}
