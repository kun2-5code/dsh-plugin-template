/**
 * dsh-plugin-template 的宿主半边：声明 Config 字段、注册工具、监听事件。
 *
 * 配置约定（2026-09 起）：插件不再注册 settings 命名空间。Loader 会为每个
 * Config 里带 `.volatile()` 字段的 entry 自动派生命名空间，命名空间 id 就是
 * `cordis.patch.yml` 里那一行的 `id`。因此这里不需要依赖 @deepseek-ai/dsh-settings，
 * 只需在 schema 上标 `.volatile()`，并在读取处调用 `.get()`。
 *
 * 读取时机：每次执行操作时读一次 `.get()`，拿到的是当前生效的值；需要一致
 * 快照的操作在开始时把值取出来传递下去，不要缓存 configSource()。
 *
 * 浏览器半边在 src/client/，注册 14 个 UI 面（含 Plugins 页上的配置表单）。
 * 命名空间会在宿主侧被服务时自动暴露，无需白名单。
 *
 * @module dsh-plugin-template
 */

import type { Context, Volatile } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { registerDemoCommand, registerHelloCommand } from './commands.ts'

/** 宿主插件名，须与 package.json 的 name 及 cordis.patch.yml 的 id 一致。 */
export const name = 'dsh-plugin-template'

/** 依赖的服务：tools 就绪后本插件才会加载。 */
export const inject = ['tools']

/**
 * 插件配置。每个字段都是 Volatile 引用，因此可以在不重启宿主的情况下被
 * 用户改写；`.get()` 返回当前生效的值。
 */
export interface Config {
  /** 打招呼时使用的前缀文案。 */
  greeting: Volatile<string>
  /** 示例：单次操作允许的最大重试次数。 */
  maxRetries: Volatile<number>
  /** 是否输出示例调试日志。 */
  verbose: Volatile<boolean>
}

/**
 * Schemastery schema：默认值写在这里，cordis.yml 与 GUI 改写都会经过它校验。
 * 不写 `Schema<Config>` 注解——`.volatile()` 的输出类型是解包后的值，而
 * `Config` 接口描述的是带引用的形状，两者不能互相赋值。
 */
export const Config = Schema.object({
  greeting: Schema.string().default('Hello').volatile(),
  maxRetries: Schema.number().default(3).volatile(),
  verbose: Schema.boolean().default(false).volatile(),
})

/**
 * 插件事件：经 declaration merging 加入 cordis 的 Events 表，
 * `ctx.on` / `ctx.emit` 随之获得类型。键名用 `<插件名>/<动作>` 的约定。
 */
declare module '@deepseek-ai/cordis' {
  interface Events {
    /**
     * 插件完成初始化时发出。
     * @param payload - 初始化完成的消息
     * @param payload.id - 发出事件的插件名
     * @mode emit
     */
    'my-plugin/ready': (payload: { id: string }) => void
  }
}

/**
 * 插件主体：注册命令与工具，并挂一个随生命周期自动回收的定时器。
 *
 * 所有注册都走 ctx.effect / ctx.on，插件停用时自动撤销，不需要手动 disposer。
 * @param ctx - 宿主插件上下文。
 * @param config - 经过校验的配置，各字段是 Volatile 引用。
 */
export function apply(ctx: Context, config: Config): void {
  // 0) 示例命令。/hello 由宿主侧直接渲染成普通消息；
  //    /dsh-demo 有自定义行，由客户端半边的 src/client/commandview.tsx 渲染。
  registerHelloCommand(ctx)
  registerDemoCommand(ctx)

  // 1) 注册一个模型可调用的工具。output.render 是纯函数，负责模型可见的渲染；
  //    presentResult 是给 UI 的渲染意图，两者是不同的关注点。
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
    presentResult: (_args, result) => ({
      card: 'generic',
      title: 'greet',
      content: [{
        type: 'text',
        text: result.content.map((block) => block.type === 'text' ? block.text : '').join(''),
      }],
    }),
    async execute(args) {
      // 在执行点读取当前生效值，用户改配置后下一次调用即可见。
      return `${config.greeting.get()}, ${args.name}!`
    },
  }))

  // 2) 事件监听同样是 effect，插件停用时自动撤销。
  ctx.on('my-plugin/ready', ({ id }) => {
    if (config.verbose.get()) console.log(`[${name}] ${id} is ready`)
  })

  // 3) 需要真实资源时用 ctx.effect 提供 disposer。
  ctx.effect(() => {
    const timer = setInterval(() => {
      if (config.verbose.get()) {
        console.log(`[${name}] heartbeat (maxRetries=${config.maxRetries.get()})`)
      }
    }, 60_000)
    return () => clearInterval(timer)
  })
}
