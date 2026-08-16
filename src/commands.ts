/**
 * 示例斜杠命令（host 半边）：注册两个对照示例——
 * - `/hello`：无参数，直接回复 world，走框架默认的 GenericCommandCard 渲染行
 *   （演示"命令零 UI 注册即可用"）；
 * - `/dsh-demo`：回显输入，配合浏览器半边的 src/client/commandview.ts
 *   （conversation.chat.commandview 插槽，按命令名 keyed）演示自定义渲染行。
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

/** /hello 命令名（仅 host 半边使用，无自定义渲染行，因此不放进共享常量）。 */
const HELLO_COMMAND_NAME = 'hello'

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

/** 注册 /hello 命令：命令服务未组合时静默跳过（可选子插件）。 */
export function registerHelloCommand(ctx: Context): void {
  ctx.inject(['commands'], (commandCtx) => {
    commandCtx.commands.register({
      name: HELLO_COMMAND_NAME,
      description: 'dsh-plugin-template 示例命令：回复 world。',
      handler: () => ({ kind: 'success', text: 'world' }),
    })
  })
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
