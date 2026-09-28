/**
 * 测试用的 settings 服务替身：按命名空间给出一个可读可写的 `ConfigForm`。
 *
 * 为什么需要它：`plugins.bundle.config` 上宿主**不传** `form`，页面的已接受值和
 * 写动作都来自 `ctx.configForms`。如果测试直接造一个 `form` prop 塞给组件，就
 * 绕过了"值从哪来"这一步——上一版就是这么写的，11 项 form 相关测试全绿，真机上
 * 那一节却永远显示"插件未加载"。让 fixture 从这个替身出发，"值会到达"就成了
 * 被测的一部分。
 *
 * 替身保留真实契约里要紧的部分：快照在变化前引用稳定、`mutate` 带 revision
 * 围栏、宿主可以拒绝（返回 false）或传输失败（抛错）、用户层与组装层分开。
 */

import { Service, type Context } from '@deepseek-ai/cordis'
import type { ConfigForm, ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { NamespaceValues } from '../../src/client/config-form.ts'

/** 一次写入操作。 */
export type WriteOp = { op: 'set'; path: string[]; value: unknown } | { op: 'unset'; path: string[] }

/** 宿主会怎么回应一次写入。 */
export type WriteOutcome = 'accept' | 'refuse' | 'throw'

/** 一个命名空间的可编辑文档。 */
export interface NamespaceDocument {
  /** 组装层的值，来自 cordis.patch.yml 那一行。 */
  base: Record<string, unknown>
  /** 用户层；某字段在这里出现即视为已覆盖。 */
  user: Record<string, unknown>
  /** 文档是否可写。 */
  writable?: boolean
}

/** 命名空间当前是否被宿主服务。 */
export type ServiceState = 'loading' | 'ready' | 'unavailable'

/**
 * 一个命名空间的 `ConfigForm`，底层是一份内存文档。
 */
export class TestConfigForm<T> implements ConfigForm<T> {
  private snapshot: ConfigFormSnapshot<T>
  private readonly listeners = new Set<() => void>()
  /** 宿主对下一次写入的回应。 */
  outcome: WriteOutcome = 'accept'
  /** 收到的每一次 `mutate` 的参数，供断言。 */
  readonly writes: { ops: readonly WriteOp[]; expectedRevision: number | undefined }[] = []
  /** 强制下一份快照的加载完成。 */
  state: ServiceState = 'ready'

  /**
   * @param base - 组装层的值。
   * @param user - 用户层的值。
   * @param writable - 文档是否可写。
   */
  constructor(base: Record<string, unknown>, user: Record<string, unknown> = {}, writable = true) {
    this.snapshot = {
      status: 'ready',
      value: { ...base, ...user } as T,
      base: { ...base },
      user: { ...user },
      revision: 1,
      writable,
      mode: 'host',
    }
  }

  /**
   * 把命名空间切到尚未就绪或未被服务。
   * @param next - 目标状态。
   */
  setState(next: ServiceState): void {
    this.state = next
    this.publish(next === 'ready' ? this.snapshot : {
      ...this.snapshot,
      status: next,
      value: undefined as T,
    })
  }

  /** @returns 当前快照。 */
  getSnapshot(): ConfigFormSnapshot<T> {
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
   * 提交一组写入。
   * @param ops - 写入操作。
   * @param expectedRevision - 期望的 revision；不匹配时拒绝。
   * @returns 宿主接受为 true。
   */
  async mutate(ops: readonly WriteOp[], expectedRevision?: number): Promise<boolean> {
    this.writes.push({ ops, expectedRevision })
    if (this.outcome === 'throw') throw new Error('transport down')
    if (this.outcome === 'refuse') return false
    if (expectedRevision !== undefined && expectedRevision !== this.snapshot.revision) return false

    const user = { ...(this.snapshot.user as Record<string, unknown>) }
    for (const op of ops) {
      const [field, ...rest] = op.path
      if (field === undefined) continue
      if (rest.length > 0) continue
      if (op.op === 'unset') delete user[field]
      else user[field] = op.value
    }
    this.publish({
      ...this.snapshot,
      value: { ...(this.snapshot.base as object), ...user } as T,
      user,
      revision: (this.snapshot.revision ?? 0) + 1,
    })
    return true
  }

  /**
   * @param field - 字段名。
   * @param value - 要写入的值。
   * @returns 宿主接受为 true。
   */
  async set(field: string, value: unknown): Promise<boolean> {
    return this.mutate([{ op: 'set', path: [field], value }])
  }

  /**
   * @param field - 字段名。
   * @returns 宿主接受为 true。
   */
  async unset(field: string): Promise<boolean> {
    return this.mutate([{ op: 'unset', path: [field] }])
  }

  /** 让宿主在别处接受一个新值（模拟另一个客户端改了设置）。 */
  externallySet(field: string, value: unknown): void {
    const user = { ...(this.snapshot.user as Record<string, unknown>), [field]: value }
    this.publish({
      ...this.snapshot,
      value: { ...(this.snapshot.base as object), ...user } as T,
      user,
      revision: (this.snapshot.revision ?? 0) + 1,
    })
  }

  /**
   * 造一个"命名空间未被宿主服务"的 scope。
   * @returns 该 scope。
   */
  unserved(): this {
    this.state = 'unavailable'
    this.publish({
      ...this.snapshot,
      status: 'unavailable',
      value: undefined as T,
      writable: false,
      revision: undefined,
    })
    return this
  }

  private publish(next: ConfigFormSnapshot<T>): void {
    this.snapshot = next
    for (const listener of [...this.listeners]) listener()
  }
}

/**
 * 按 entry id 给出 settings scope 的服务。
 *
 * `get` 刻意不做泛型：本文件只在测试里使用，而被测源码里的 `ctx.configForms`
 * 类型来自宿主包的 declaration merge（真实的 `ConfigForms`），与这里无关。测试侧
 * 需要的是一个具体类型，好把 scope 直接交给控制器。
 */
export class TestConfigForms extends Service {
  private readonly forms = new Map<string, ConfigForm<NamespaceValues>>()

  constructor(ctx: Context) {
    super(ctx, 'configForms')
  }

  /**
   * 声明一个命名空间及其文档。
   * @param entryId - 命名空间（cordis.patch.yml 里的行 id）。
   * @param document - 组装层与用户层的值。
   * @returns 该命名空间的 scope，可直接断言写入。
   */
  declare(entryId: string, document: NamespaceDocument): TestConfigForm<NamespaceValues> {
    const form = new TestConfigForm<NamespaceValues>(document.base, document.user, document.writable)
    this.forms.set(entryId, form)
    return form
  }

  /**
   * 取出一个命名空间的 scope；未声明时给出一个"未被服务"的。
   * @param entryId - 命名空间。
   * @returns scope。
   */
  get(entryId: string): ConfigForm<NamespaceValues> {
    return this.forms.get(entryId) ?? new TestConfigForm<NamespaceValues>({}).unserved()
  }

  /**
   * 判断某个服务是不是本文件的替身。
   * @param value - 待判断的实例。
   * @returns 是替身时为 true。
   */
  static is(value: unknown): boolean {
    return typeof (value as { declare?: unknown } | undefined)?.declare === 'function'
  }
}
