/**
 * 示例斜杠命令（host 半边）：注册 /dsh-demo 命令，配合浏览器半边的
 * src/client/commandview.ts（conversation.chat.commandview 插槽，按命令名
 * keyed）做端到端演示——在 GUI 输入 /dsh-demo 任意内容即可看到自定义命令
 * 行。
 *
 * 零新增依赖：ctx.commands 是 @deepseek-ai/dsh-commands 服务；本模块用最小
 * 结构类型 + 本地声明合并，通过 ctx.inject(['commands']) 可选子插件注册
 * （服务未组合时静默跳过，不影响插件加载）。完整契约见
 * @deepseek-ai/dsh-commands 的 CommandDefinition / CommandInvocation /
 * CommandResult。
 * @module dsh-plugin-template/commands
 */

import type { Context } from '@deepseek-ai/cordis'
import { DEMO_COMMAND_NAME } from './client/constants.ts'

/** 命令调用参数的最小结构（dsh-commands CommandInvocation 的结构子集）。 */
interface DemoCommandInvocation {
  /** 命令名之后的原文（含分隔空白）。 */
  readonly rawInput: string
}

/** 命令结果的最小结构（dsh-commands CommandResult 的结构子集）。 */
interface DemoCommandResult {
  kind: 'success' | 'error'
  text?: string
}

/** 命令定义的最小结构（dsh-commands CommandDefinition 的结构子集）。 */
interface DemoCommandDefinition {
  readonly name: string
  readonly description: string
  readonly handler: (invocation: DemoCommandInvocation) => DemoCommandResult | Promise<DemoCommandResult>
}

/** 命令注册表的最小面（dsh-commands CommandRuntime 的结构子集）。 */
interface CommandsLike {
  register(definition: DemoCommandDefinition): unknown
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** 命令注册表（运行时由 @deepseek-ai/dsh-commands 提供）。 */
    commands: CommandsLike
  }
}

/** 注册 /dsh-demo 命令：命令服务未组合时静默跳过（可选子插件）。 */
export function registerDemoCommand(ctx: Context): void {
  ctx.inject(['commands'], (commandCtx) => {
    commandCtx.commands.register({
      name: DEMO_COMMAND_NAME,
      description: 'dsh-plugin-template 示例命令：原样回显输入。',
      handler: ({ rawInput }) => ({ kind: 'success', text: `echo: ${rawInput.trim() || '(no input)'}` }),
    })
  })
}
