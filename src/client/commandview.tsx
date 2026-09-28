/**
 * 命令行渲染：`conversation.chat.commandview`，为示例命令 `/dsh-demo`
 * 注册一行自定义展示。keyed 插槽，注册时给 `key: DEMO_COMMAND_NAME`；
 * 不注册这一行时宿主用通用的命令卡片兜底。
 *
 * 对应的宿主半边注册在 src/commands.ts 的 registerDemoCommand，
 * 两端共用 src/client/constants.ts 里的 DEMO_COMMAND_NAME。
 * @module dsh-plugin-template/client/commandview
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { DEMO_COMMAND_NAME, LOCALE_NAMESPACE } from './constants.ts'

/** `command/run` 及其后续节点的结构子集。 */
interface CommandNodeLike {
  /** 命令名；合成节点发出时为 null。 */
  name: string | null
  /** 命令名之后的原始参数；没有参数时为 null。 */
  args: string | null
  /** `command/done` 之前为 null，就绪后带 kind 与可选文案。 */
  outcome: { kind: 'success' | 'error'; text?: string } | null
}

/** 注册项的 props：owner 传命令节点，加本插件的 `t` 席位。 */
type CommandRowProps =
  & { readonly node?: CommandNodeLike }
  & PropsLocale<typeof LOCALE_NAMESPACE>

/**
 * 注册 `/dsh-demo` 的命令行渲染。
 * @param ctx - 客户端根上下文。
 */
export function registerCommandView(ctx: Context): void {
  ctx.slots.inject('conversation.chat.commandview', () => ctx.slots.register(
    { name: 'conversation.chat.commandview', key: DEMO_COMMAND_NAME, locale: LOCALE_NAMESPACE },
    CommandRow,
  ))
}

/**
 * 把命令节点折成一行文案和一个状态。
 *
 * 三种状态互斥：节点还没有 `command/done` 就是执行中；done 且 `kind` 为
 * `error` 是失败（带文案时优先显示文案）；其余是完成。
 * @param props - owner 传的命令节点与 `t` 席位。
 * @returns 命令行与状态节点。
 */
export function CommandRow(props: CommandRowProps): React.ReactElement {
  const { t, node } = props
  const line = node === undefined || node.name === null
    ? `/${DEMO_COMMAND_NAME}`
    : `/${node.name}${node.args ?? ''}`
  const outcome = node?.outcome
  const state = outcome === undefined || outcome === null
    ? 'running'
    : outcome.kind === 'error'
      ? 'failed'
      : 'succeeded'
  const status = state === 'running'
    ? t('command.running')
    : outcome?.text ?? t(state === 'failed' ? 'command.failed' : 'command.succeeded')
  return (
    <div className="dtpl-command">
      <span className="dtpl-command-line">{line}</span>
      <span className={`dtpl-command-status dtpl-command-${state}`}>{status}</span>
    </div>
  )
}
