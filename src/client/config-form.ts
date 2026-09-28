/**
 * 配置表单的模型：把本插件的 settings 命名空间投影成页面读的那份快照。
 *
 * 为什么自己建模型：`plugins.bundle.config` 这条插槽上，Plugins 页只传
 * `view`，**不传 `form`**（`PluginManagerPage.tsx:612` 调
 * `renderSlot('plugins.bundle.config', { view: 'page' }, { entryKey: pkg.name })`；
 * 构造 `ConfigPageForm` 的 `formFor()` 只喂 `plugins.item` 与
 * `plugins.row.config`）。所以 bundle 的表单得自己从 `ctx.configForms` 取。
 *
 * 为什么不把订阅写进组件：业务组件里不许有订阅机制。状态经保留的 `hooks`
 * 舱交给渲染器，渲染器把它绑成 `useTemplateConfig`，组件只读快照、只调回调。
 *
 * @module dsh-plugin-template/client/config-form
 */

import type { Context } from '@deepseek-ai/cordis'
import type { ConfigForm, ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import { NAMESPACE } from './constants.ts'

/** 本插件的用户设置，与宿主半边 `Config` 的可编辑字段一一对应。 */
export interface TemplateSettings {
  /** 打招呼时使用的前缀文案。 */
  greeting?: string
  /** 单次操作允许的最大重试次数。 */
  maxRetries?: number
  /** 是否输出示例调试日志。 */
  verbose?: boolean
}

/** 命名空间的 settings scope 实际使用的值类型。 */
export type NamespaceValues = Record<string, unknown>

/** 一次写入操作。类型从写动作自己的签名推出来，不必依赖传输包。 */
export type WriteOp = Parameters<ConfigForm<NamespaceValues>['mutate']>[0][number]

/** 页面渲染所依据的已接受值快照。 */
export interface ConfigSnapshot {
  /** 命名空间是否已就绪。 */
  status: 'loading' | 'ready' | 'unavailable'
  /** 设置文档是否可写。 */
  writable: boolean
  /** 下一次写入的 revision 围栏。 */
  revision: number | undefined
  /** 已接受的值。 */
  value: NamespaceValues
  /** 组装层的值，清除覆盖后回落到它。 */
  base: unknown
  /** 用户层；某字段在这里出现即视为已覆盖。 */
  user: unknown
}

/** 命名空间尚未被宿主服务时的快照。 */
const UNSERVED: ConfigSnapshot = {
  status: 'unavailable',
  writable: false,
  revision: undefined,
  value: {},
  base: {},
  user: {},
}

/**
 * 一个快照源。
 *
 * 渲染器的 `hooks` 舱要的 `HostObservable` 就是这个两方法契约（`getSnapshot` 加
 * `subscribe`）。这里自己实现而不用 `@deepseek-ai/dsh-client-store`：那个包的
 * 发布产物 `import` 了 `zustand` 却没在 `dependencies` 里声明它，所以在 monorepo
 * 之外根本装不起来——写单测时立刻就撞上了。契约只有两个方法，自己实现既去掉一个
 * 运行时外部依赖，也让这份模型能在测试里真正跑到。
 */
export interface ConfigSource {
  /** @returns 当前快照；事实不变时引用保持不变。 */
  getSnapshot(): ConfigSnapshot
  /**
   * @param listener - 快照变化时调用。
   * @returns 移除监听器的函数。
   */
  subscribe(listener: () => void): () => void
}

/** 注册项注入给组件的面。 */
export interface ConfigFormFace {
  hooks: {
    /** 已接受值快照，由渲染器绑成 `useTemplateConfig`。 */
    templateConfig: ConfigSource
  }
  /**
   * 一次性提交全部编辑，并带上页面读到的那份 revision 作为围栏。
   * @param ops - 写入操作。
   * @param expectedRevision - 页面读到的 revision。
   * @returns 宿主接受为 true；拒绝或跳过写入为 false。传输失败会抛出。
   */
  submit(ops: readonly WriteOp[], expectedRevision: number | undefined): Promise<boolean>
}

/**
 * 把 settings scope 的快照投影成页面快照。
 * @param snapshot - scope 的当前快照。
 * @returns 页面快照。
 */
function project(snapshot: ConfigFormSnapshot<NamespaceValues>): ConfigSnapshot {
  if (snapshot.status !== 'ready') {
    return { ...UNSERVED, status: snapshot.status }
  }
  return {
    status: 'ready',
    writable: snapshot.writable,
    revision: snapshot.revision,
    value: snapshot.value ?? {},
    base: snapshot.base,
    user: snapshot.user,
  }
}

/** 两份快照是否描述同一件事；用于避免发布无变化的快照。 */
function unchanged(a: ConfigSnapshot, b: ConfigSnapshot): boolean {
  return a.status === b.status
    && a.writable === b.writable
    && a.revision === b.revision
    && JSON.stringify(a.value) === JSON.stringify(b.value)
    && JSON.stringify(a.base) === JSON.stringify(b.base)
    && JSON.stringify(a.user) === JSON.stringify(b.user)
}

/**
 * 本插件配置表单的模型。
 */
export class ConfigFormController {
  private readonly form: ConfigForm<NamespaceValues>
  private snapshot: ConfigSnapshot
  private readonly listeners = new Set<() => void>()
  private readonly off: () => void

  /**
   * @param form - 本插件命名空间的 settings scope。
   */
  constructor(form: ConfigForm<NamespaceValues>) {
    this.form = form
    this.snapshot = project(form.getSnapshot())
    this.off = form.subscribe(() => {
      const next = project(form.getSnapshot())
      // 快照引用只在事实变化时换新，这是渲染器绑定所依赖的约定。
      if (unchanged(this.snapshot, next)) return
      this.snapshot = next
      for (const listener of [...this.listeners]) listener()
    })
  }

  /** @returns 当前快照。 */
  getSnapshot(): ConfigSnapshot {
    return this.snapshot
  }

  /**
   * @param listener - 快照变化时调用。
   * @returns 移除监听器的函数。
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /**
   * 构造注册项要注入的面。
   * @returns 页面快照与写动作。
   */
  inject(): ConfigFormFace {
    return {
      hooks: {
        templateConfig: {
          getSnapshot: () => this.getSnapshot(),
          subscribe: (listener: () => void) => this.subscribe(listener),
        },
      },
      submit: (ops, expectedRevision) => this.form.mutate(ops, expectedRevision),
    }
  }

  /** 释放对已接受值的订阅。 */
  dispose(): void {
    this.off()
  }
}

/**
 * 按命名空间取出本插件的 settings scope 并建好模型。
 *
 * 注册本身不做服务门控：Plugins 页用"这条插槽上有没有本 bundle 的注册项"来判断
 * 那一节要不要渲染（`config-ledger.ts` 从注册项的 key 收集 bundle），用
 * `whileServed` 包起来会让整节永远不出现。命名空间没被服务时，页面读到
 * `unavailable` 快照并自行说明。
 *
 * @param ctx - 客户端根上下文。
 * @returns 模型，调用方负责在停用时 `dispose()`。
 */
export function createConfigForm(ctx: Context): ConfigFormController {
  return new ConfigFormController(
    ctx.configForms.get<NamespaceValues>(NAMESPACE) as ConfigForm<NamespaceValues>,
  )
}
