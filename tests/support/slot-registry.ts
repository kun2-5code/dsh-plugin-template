/**
 * 测试用的插槽注册表替身。
 *
 * 为什么是替身：发布出去的 harness 客户端入口是浏览器 bundle，按约定在导入
 * 时刻就调用 `window.__ModuleLoader__.load(...)`，不是可被 Node 直接 import 的
 * 库；在测试里把它物化出来会把 react-dom 拉进同一个进程，制造两份 React
 * 身份——那正是仓库明令避免的重复模块缺陷。走 `./src/*` 子路径也不可行：那会
 * 在同一进程里塞进第二套插槽系统，测试到的行为与运行时不是同一份代码。
 *
 * 替身保真的部分（这些正是本插件会犯的错）：
 * - 未被父级 children 表声明的槽位，`register` 直接抛错；
 * - `inject` 会等声明出现，声明到达后才装上贡献；
 * - 贡献通过调用方 fiber 的 `ctx.effect` 挂载，所以随插件停用一起撤销——
 *   这条由 cordis 的 tracker 保证：经 `ctx.slots` 访问时服务上的 `this.ctx`
 *   就是调用方 fiber，与真实 `SlotRegistry` 同一机制。
 *
 * 不保真的部分：**keyed 分发**、优先级裁决、store 轴、工厂槽、作用域分区、props
 * 派生。keyed 那条是本插件真正依赖的轴：`conversation.chat.commandview` 与
 * `plugins.bundle.config` 都按 key 选条目，而这个替身只按槽名归集，登记了选项也
 * 证明不了分发时能选中。`slot-registration.client.spec.ts` 里那条走真实 SlotCore
 * 的用例补的就是这个缺口。改插槽种类或作用域时，真实行为要对照
 * docs/subsystems/slots.md 与 `SlotRegistry` 源码核对。
 */

import { Service, type Context } from '@deepseek-ai/cordis'

/** 一次 `register` 的选项，测试只关心判定归属所需的字段。 */
export interface SlotEntryOptions {
  /** 目标槽位名。 */
  name: string
  /** keyed 槽的键。 */
  key?: string
  /** list 槽的条目标识。 */
  id?: string
  /** list 槽的渲染顺序。 */
  order?: number
  /** list 槽的显示标签，字符串或按 locale 变化的 thunk。 */
  label?: string | (() => string)
  /** 声明 locale 字典命名空间，渲染器据此注入 `t` 席位。 */
  locale?: string
}

/** 一个已注册的贡献。 */
export interface SlotEntry {
  options: SlotEntryOptions
  component: unknown
}

/**
 * 订阅者：槽位声明或条目变化时收到通知。
 */
export type SlotListener = () => void

/**
 * 记录贡献并强制声明检查的插槽注册表。
 */
export class TestSlotRegistry extends Service {
  /** 已被父级声明的槽位。 */
  private readonly declared = new Set<string>()
  /** 按槽位名归集的贡献。 */
  private readonly entries = new Map<string, SlotEntry[]>()
  /** 等待声明到达的注入回调。 */
  private readonly waiting = new Map<string, (() => unknown)[]>()
  /** 变更订阅者。 */
  private readonly listeners = new Set<SlotListener>()

  constructor(ctx: Context) {
    super(ctx, 'slots')
  }

  /**
   * 声明一批槽位，等价于外壳在某父级的 children 表里声明它们。
   * @param names - 槽位名。
   */
  declare(...names: string[]): void {
    for (const name of names) {
      this.declared.add(name)
      const queued = this.waiting.get(name)
      this.waiting.delete(name)
      for (const run of queued ?? []) run()
    }
    this.emitChange()
  }

  /**
   * 等目标槽位被声明后再注册贡献。已声明则立即装上。
   * @param name - 目标槽位名。
   * @param register - 装上贡献的回调，返回值是撤销函数。
   */
  inject(name: string, register: () => unknown): void {
    if (!this.declared.has(name)) {
      const queued = this.waiting.get(name) ?? []
      queued.push(register)
      this.waiting.set(name, queued)
      return
    }
    this.mount(register)
  }

  /**
   * 向已声明的槽位注册一项贡献。
   * @param options - 注册选项。
   * @param component - 组件；测试不关心其类型。
   * @returns 撤销该贡献的函数。
   */
  register(options: SlotEntryOptions, component: unknown): () => void {
    if (!this.declared.has(options.name)) {
      throw new Error(`slot "${options.name}" is not declared (a parent entry's children table must declare it)`)
    }
    const entry: SlotEntry = { options, component }
    const list = this.entries.get(options.name) ?? []
    list.push(entry)
    this.entries.set(options.name, list)
    this.emitChange()
    return () => {
      const current = this.entries.get(options.name)
      if (current === undefined) return
      const index = current.indexOf(entry)
      if (index >= 0) current.splice(index, 1)
      this.emitChange()
    }
  }

  /**
   * 读某个槽位当前的贡献。
   * @param name - 槽位名。
   * @returns 贡献列表。
   */
  entriesOf(name: string): SlotEntry[] {
    return this.entries.get(name) ?? []
  }

  /**
   * 观察变更。
   * @param listener - 变更时调用。
   * @returns 移除监听器的函数。
   */
  subscribe(listener: SlotListener): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /**
   * 经 `ctx.slots` 访问时，cordis 的 tracker 会把调用方 fiber 放在这里；
   * 贡献挂到它的 effect 上，就随插件 fiber 一起撤销。
   * @param register - 装上贡献的回调。
   */
  private mount(register: () => unknown): void {
    this.ctx.effect(() => {
      const dispose = register()
      return () => {
        if (typeof dispose === 'function') dispose()
      }
    })
  }

  private emitChange(): void {
    for (const listener of [...this.listeners]) listener()
  }
}

/**
 * 判断一个槽位服务是不是本文件的测试替身。
 *
 * `ctx.get('slots')` 的声明合并把它标成真实的 `SlotRegistry`，直接断言成替身
 * 类型是不安全的转换；这里用类型谓词把替身缩出来，不用断言。
 * @param value - 待判断的服务实例。
 * @returns 是替身时为 true。
 */
export function isTestSlotRegistry(value: unknown): value is TestSlotRegistry {
  return typeof (value as { declare?: unknown } | undefined)?.declare === 'function'
}
