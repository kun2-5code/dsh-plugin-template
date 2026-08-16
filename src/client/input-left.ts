/**
 * 输入卡片工具行左端控件（conversation.input.left 插槽）：常驻小按钮，
 * 位于输入卡片工具行左端、内置 chrome（access mode / plan / attach）之后。
 * session 级 list；owner 只传点状快照（InputZone），需要实时数据走框架
 * 标准 hook。参考：ui-conversation 声明该插槽，目前没有任何内置插件注册
 * （空白加法位）。
 * @module dsh-plugin-template/client/input-left
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import { NAMESPACE } from './constants.ts'

/** 在 `conversation.input.left` 插槽注册示例控件。 */
export function registerInputLeft(ctx: Context): void {
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register(
    { name: 'conversation.input.left', id: NAMESPACE, order: 30 },
    InputLeft,
  ))
}

/** 一个点亮/熄灭的常驻小按钮。 */
function InputLeft(): React.ReactElement {
  const [lit, setLit] = React.useState(false)
  return React.createElement(
    'button',
    {
      type: 'button',
      className: 'dtpl-input-tool',
      'aria-pressed': lit,
      onClick: () => setLit(!lit),
    },
    React.createElement('span', { className: 'dtpl-sidebar-dot' }, lit ? '●' : '○'),
    React.createElement('span', null, '模板左'),
  )
}
