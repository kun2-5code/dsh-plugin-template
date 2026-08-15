/**
 * 可选示例：hook 权限门插件。监听工具执行前的水瀑事件 tools/pre-execute，
 * 命中 Config.denyTools 的工具调用直接拒绝，其余调用 next() 放行。
 * 经 package.json 的 "./hook" 子路径导出，cordis.patch.yml 里对应行默认注释。
 * @module dsh-plugin-template/hook
 */

import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import type { PreToolDecision, ToolExecution } from '@deepseek-ai/dsh-tools'

/** 插件显示名（诊断日志中使用）。 */
export const name = 'dsh-plugin-template-permission-gate'

/** 插件配置：禁止模型调用的工具名列表。 */
export interface Config {
  denyTools: string[]
}

/** Schemastery 配置 schema：校验 + 默认值，配置非法时加载响亮失败。 */
export const Config: Schema<Config> = Schema.object({
  denyTools: Schema.array(Schema.string()).default([]),
})

/**
 * 权限门：返回 deny 会中止该工具调用；其余情况必须调用 next() 把决策交给
 * 下游监听器（水瀑语义：不调用 next() 即短路整条链，这是拦截行为，勿误用）。
 */
export function apply(ctx: Context, config: Config): void {
  ctx.on('tools/pre-execute', async (exec: ToolExecution, next): Promise<PreToolDecision> => {
    if (config.denyTools.includes(exec.name)) {
      return { kind: 'deny', reason: `Tool "${exec.name}" is denied by policy.` }
    }
    return next()
  })
}
