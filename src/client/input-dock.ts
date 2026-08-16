/**
 * 输入区 Dock（conversation.input.dock 插槽）：在输入卡片上方渲染一行状态条。
 * 该插槽是 session 级 list——注册时通过 options.inject 工厂收到 sessionId，
 * 组件经 props 拿到注入的面；owner 只传点状快照（session/input），需要实时
 * 数据时应走框架标准 hook（useSession 等），不要在组件里订阅。
 * 布局注意：该插槽渲染为全宽行，宽度与居中由条目自己负责（styles.ts 里用
 * --dsh-composer-* 变量对齐输入卡片，与内置 QueueDock 一致）。
 * 参考：ui-goal 的 GoalDock 用同一插槽（id 'goal'，order 10）。
 * @module dsh-plugin-template/client/input-dock
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import { NAMESPACE } from './constants.ts'

/** 在 `conversation.input.dock` 插槽注册示例状态条。 */
export function registerInputDock(ctx: Context): void {
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register(
    {
      name: 'conversation.input.dock',
      id: NAMESPACE,
      order: 30,
      inject: (sessionId) => ({ sessionId }),
    },
    InputDock,
  ))
}

/** 输入区上方的一行状态条：展示注入的 sessionId，演示 session 级插槽的接线方式。 */
function InputDock(props: { sessionId?: string }): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'dtpl-dock' },
    React.createElement('span', null, '模板输入区 Dock ·'),
    React.createElement('span', { className: 'dtpl-dock-id' }, props.sessionId ?? '(等待会话)'),
    React.createElement('span', null, '（conversation.input.dock 插槽示例）'),
  )
}
