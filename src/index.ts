/**
 * dsh-plugin-template 主插件：一个可直接运行的示例，演示 dsh 插件最常用的四种形态——
 * 配置（Config + Schemastery 校验）、工具注册（defineTool）、事件监听（ctx.on）、
 * 显式资源清理（ctx.effect），外加"配置可在 GUI 设置里点击修改"：
 * 配置通过 settings 命名空间（ctx.settings）接线，浏览器半边的配置卡片
 * （见 src/client.ts）写入用户设置文档，本插件实时读取。
 * 注意：Web 设置面板的可见性受 harness 的 WEB_SETTINGS_NAMESPACES 白名单限制，
 * 只影响卡片的可编辑性，不影响本插件实时读取配置（详见 README）。
 *
 * 加载契约：模块具名导出 apply(ctx, config)；框架在依赖（inject）就绪后调用 apply，
 * 卸载时自动回收所有通过 ctx 注册的监听器与 effect，无需手动移除。
 * @module dsh-plugin-template
 */

import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'

/** 插件显示名（诊断日志中使用）。 */
export const name = 'dsh-plugin-template'

/** 依赖的服务：tools 就绪后本插件才会加载。 */
export const inject = ['tools']

/** 插件配置：部署时通过 cordis.yml 覆盖，也可以在 GUI 设置里改。 */
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

/**
 * 插件主体：所有注册都是 effect，随插件卸载自动回收。
 *
 * 配置来源：settings 服务存在时，把它注册为命名空间 `dsh-plugin-template`
 * （cordis.yml 里的配置作为 composition base 层），GUI 配置卡片写入的用户层
 * 会覆盖 base；settings 服务不存在时回退到 cordis.yml 配置，行为与原来完全一致。
 * 工具的 execute 与定时器都通过 configSource() 惰性读取，因此用户在 GUI 里改完
 * 配置立即生效，无需重启。
 */
export function apply(ctx: Context, config: Config): void {
  let configSource: () => Config = () => config
  installSettingsSection(ctx, settingsNamespace('dsh-plugin-template'), Config, config, {
    // 收到当前权威配置源（有 settings 时是命名空间的解析值，否则是 composition entry）。
    setSource: (current) => {
      configSource = current
    },
    // 本示例所有字段都在使用点读取，无需为配置变更重建任何注册。
    onChange: () => {},
  })

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
      const { greeting } = configSource()
      return `${greeting}, ${args.name}!`
    },
  }))

  // 2) 事件监听：同样是 effect，插件卸载时自动移除。
  ctx.on('my-plugin/ready', ({ id }) => {
    if (configSource().verbose) console.log(`[${name}] ${id} is ready`)
  })

  // 3) 需要显式清理的资源（网络连接、定时器等）用 ctx.effect 提供 disposer。
  ctx.effect(() => {
    const timer = setInterval(() => {
      if (configSource().verbose) console.log(`[${name}] heartbeat (maxRetries=${configSource().maxRetries})`)
    }, 60_000)
    return () => clearInterval(timer)
  })
}
