/**
 * 输入卡片下方状态条（conversation.composer.dock 插槽）：在输入卡片下方
 * （仍在卡片宽度列内）渲染一行状态文字。session 级 list；与 input.dock 不同，
 * 本插槽渲染在输入条内部（bar 的 footer），宽度继承卡片列约束——照 StatsLine
 * 的完整对齐：margin auto 居中 + text-align center（styles.ts），无需自己定位。
 * 参考：ui-conversation 自己注册的 StatsLine（id 'stats'）。
 * @module dsh-plugin-template/client/composer-dock
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import { NAMESPACE } from './constants.ts'

/** 在 `conversation.composer.dock` 插槽注册示例状态条。 */
export function registerComposerDock(ctx: Context): void {
  ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
    { name: 'conversation.composer.dock', id: NAMESPACE, order: 30 },
    ComposerDock,
  ))
}

/** 输入卡片下方的一行状态文字。 */
function ComposerDock(): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'dtpl-composer-strip' },
    '模板状态条（conversation.composer.dock）',
  )
}
