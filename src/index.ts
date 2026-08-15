/**
 * dsh-plugin-template 主插件：一个可直接运行的示例，演示 dsh 插件最常用的四种形态——
 * 配置（Config + Schemastery 校验）、工具注册（defineTool）、事件监听（ctx.on）、
 * 显式资源清理（ctx.effect）。
 *
 * 加载契约：模块具名导出 apply(ctx, config)；框架在依赖（inject）就绪后调用 apply，
 * 卸载时自动回收所有通过 ctx 注册的监听器与 effect，无需手动移除。
 * @module dsh-plugin-template
 */

import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'

/** 插件显示名（诊断日志中使用）。 */
export const name = 'dsh-plugin-template'

/** 依赖的服务：tools 就绪后本插件才会加载。 */
export const inject = ['tools']

/** 插件配置：部署时通过 cordis.yml 覆盖，不要把可调值硬编码进代码。 */
export interface Config {
  /** 打招呼的前缀文案。 */
  greeting: string
  /** 示例重试次数。 */
  maxRetries: number
  /** 是否打印调试日志。 */
  verbose?: boolean
}

/** Schemastery 配置 schema：负责校验与默认值，配置非法时加载响亮失败。 */
export const Config: Schema<Config> = Schema.object({
  greeting: Schema.string().default('Hello'),
  maxRetries: Schema.number().default(3),
  verbose: Schema.boolean().default(false),
})

/**
 * 类型化事件声明（declaration merging）：声明后 ctx.on / ctx.emit 自动获得类型推导。
 * 事件名遵循 namespace/action 约定。
 */
declare module '@deepseek-ai/cordis' {
  interface Events {
    'my-plugin/ready': (payload: { id: string }) => void
  }
}

/** 插件主体：所有注册都是 effect，随插件卸载自动回收。 */
export function apply(ctx: Context, config: Config): void {
  // 1) 注册一个模型可调用的工具。output.render 是纯函数，把规范输出转成模型可见内容。
  ctx.tools.register(defineTool({
    name: 'greet',
    description: 'Greet someone by name.',
    parameters: {
      name: { type: 'string', required: true, description: 'The name to greet' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      return `${config.greeting}, ${args.name}!`
    },
  }))

  // 2) 事件监听：同样是 effect，插件卸载时自动移除。
  ctx.on('my-plugin/ready', ({ id }) => {
    if (config.verbose) console.log(`[${name}] ${id} is ready`)
  })

  // 3) 需要显式清理的资源（网络连接、定时器等）用 ctx.effect 提供 disposer。
  ctx.effect(() => {
    const timer = setInterval(() => {
      if (config.verbose) console.log(`[${name}] heartbeat (maxRetries=${config.maxRetries})`)
    }, 60_000)
    return () => clearInterval(timer)
  })
}
