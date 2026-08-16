/**
 * 客户端半边的最小结构类型：运行时实例全部来自 ctx 服务（cordis 的 ctx.get /
 * 声明合并），不 import 任何 @deepseek-ai 客户端包，避免跨插件值导入与版本分裂。
 * 完整契约见 dsh-client-runtime 的 SettingsScope / SettingsScopeBinder 与
 * dsh-client-ui-slots 的插槽系统。
 * @module dsh-plugin-template/client/types
 */

import type { Context } from '@deepseek-ai/cordis'

/** 一个 settings 命名空间在浏览器侧的同步快照（SettingsScopeSnapshot 的结构子集）。 */
export interface SettingsSnapshot {
  status: 'loading' | 'ready' | 'unavailable'
  /** 最近一次 schema 解析后的值（schema 默认 → base → 用户层）；首个接受值之前为 undefined。 */
  value: unknown
  /** 原始用户层（已存储）；字段在此出现即视为"用户覆盖"。 */
  user: unknown
  /** Host 文档是否可写（memory 模式永远不可写）。 */
  writable: boolean
}

/** 浏览器侧 settings scope 的最小面（dsh-client-runtime SettingsScope 的结构子集）。 */
export interface SettingsScopeLike {
  getSnapshot(): SettingsSnapshot
  /** 观察快照替换；返回移除监听器的 disposer。 */
  subscribe(listener: () => void): () => void
  /** 写一个字段（自带 revision 围栏，写失败会重读 Host 状态）。 */
  set(field: string, value: unknown): Promise<void>
  /** 清除一个字段，让它重新继承 composition base 层。 */
  unset(field: string): Promise<void>
}

/** settingsScope 服务的最小面（dsh-client-ui-settings SettingsScopeBinder）。 */
export interface SettingsScopeBinderLike {
  bind(spec: { namespace: string }): SettingsScopeLike
}

/** 一次 slots.register 的最小选项（dsh-client-ui-slots 的 ErasedOptions 结构子集）。 */
export interface SlotOptions {
  /** 目标插槽名，如 'settings.plugin.item'。 */
  name: string
  /** keyed 插槽的键（conversation.chat.commandview 按命令名、tool.call.toolview 按工具名）。 */
  key?: string
  /** list 插槽的条目标识；同插槽内唯一。 */
  id?: string
  /** 渲染顺序；越小越靠前（list 条目按 order 升序渲染）。 */
  order?: number
  /** 列表条目显示标签（字符串或按 locale 变化的 thunk；本模板用固定字符串）。 */
  label?: string
  /** session 级插槽的注入工厂：收到 sessionId，返回注入给组件的面（结构随插槽而定）。 */
  inject?: (sessionId: string) => Record<string, unknown>
}

/** 浏览器插槽服务的最小面（dsh-client-ui-slots 的结构子集）。 */
export interface SlotsLike {
  /** 等目标插槽被声明后注册贡献；返回移除该贡献的 disposer。 */
  inject(name: string, register: () => unknown): void
  /**
   * 向一个已声明的插槽注册一项贡献。组件实参类型为 unknown 与真实 API 一致
   * （ui-slots 的 register 第二个参数就是 unknown）；组件的 props 是框架四份
   * share（runtime/owner/store/inject）的组合，随插槽而定。
   */
  register(options: SlotOptions, component: unknown): unknown
}

// 'slots' 是 inject 声明的必选依赖，按约定应通过 ctx.slots 使用；cordis 原生
// Context 没有 slots 成员（其类型由 dsh-client-ui-slots 包的声明合并提供），而本
// 模板不 import 任何 @deepseek-ai 客户端包（依赖纪律），因此用本地最小结构类型
// 做声明合并，运行时实例来自 ctx。
declare module '@deepseek-ai/cordis' {
  interface Context {
    /** 浏览器插槽服务（运行时由 client-ui-slots 提供）。 */
    slots: SlotsLike
  }
}
