/**
 * 斜杠命令渲染行（conversation.chat.commandview 插槽）：为示例命令
 * /dsh-demo 注册一行自定义展示。该插槽是 keyed——按命令名（command/run.name）
 * 分发，注册时用 `key: DEMO_COMMAND_NAME`；未注册的命令行由 GenericCommandCard
 * 兜底渲染。命令本体在 host 半边注册（src/commands.ts 的 registerDemoCommand，
 * 同一命令名来自 src/client/constants.ts）。
 * 参考：ui-conversation 声明该插槽，目前没有任何内置插件注册（空白加法位，
 * 有通用兜底）。
 * @module dsh-plugin-template/client/commandview
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import { DEMO_COMMAND_NAME } from './constants.ts'

/** 在 `conversation.chat.commandview` 插槽注册 /dsh-demo 的渲染行。 */
export function registerCommandView(ctx: Context): void {
  ctx.slots.inject('conversation.chat.commandview', () => ctx.slots.register(
    { name: 'conversation.chat.commandview', key: DEMO_COMMAND_NAME, order: 30 },
    CommandRow,
  ))
}

/** command/run 生命周期节点的最小结构（dsh-client-runtime CommandNode 的结构子集）。 */
interface CommandNodeLike {
  /** 命令名；run 落在窗口外时为 null。 */
  name: string | null
  /** 命令名之后的原文（含分隔空白）；省略时为 null。 */
  args: string | null
  /** 结算结果（command/done）；执行中为 null。 */
  outcome: { kind: 'success' | 'error'; text?: string } | null
}

/** /dsh-demo 的自定义命令行：展示完整命令原文与结算状态。 */
function CommandRow(props: { node?: CommandNodeLike }): React.ReactElement {
  const node = props.node
  const line = node === undefined || node.name === null
    ? `/${DEMO_COMMAND_NAME}`
    : `/${node.name}${node.args ?? ''}`
  const status = node?.outcome === null
    ? '执行中…'
    : node?.outcome?.text ?? '完成'
  return React.createElement(
    'div',
    { className: 'dtpl-command' },
    React.createElement('span', { className: 'dtpl-command-line' }, line),
    React.createElement('span', { className: 'dtpl-command-status' }, status),
  )
}
