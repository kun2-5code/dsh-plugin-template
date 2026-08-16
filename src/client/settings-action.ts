/**
 * 设置面板头部操作（settings.action 插槽）：在设置面板内容列头部、关闭按钮
 * 之前渲染一个操作按钮。root 级 list；注册者自拥可见性/行为/文案/失败呈现。
 * 参考：ui-settings-general 声明该插槽（目前基本空白）。
 * @module dsh-plugin-template/client/settings-action
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import { NAMESPACE } from './constants.ts'

/** 在 `settings.action` 插槽注册示例操作按钮。 */
export function registerSettingsAction(ctx: Context): void {
  ctx.slots.inject('settings.action', () => ctx.slots.register(
    { name: 'settings.action', id: NAMESPACE, order: 30 },
    SettingsAction,
  ))
}

/** 一个点亮/熄灭的头部操作按钮（本地状态，演示按钮位）。 */
function SettingsAction(): React.ReactElement {
  const [armed, setArmed] = React.useState(false)
  return React.createElement(
    'button',
    {
      type: 'button',
      className: 'dtpl-btn',
      'aria-pressed': armed,
      onClick: () => setArmed(!armed),
    },
    React.createElement('span', null, armed ? '模板按钮 · 已点亮' : '模板按钮'),
  )
}
