/**
 * 测试用的 locale 服务替身。
 *
 * 与 `tests/support/slot-registry.ts` 同理：发布出去的客户端入口是浏览器
 * bundle，不能在 Node 测试里直接 import。这个替身只实现本插件用到的两个
 * 成员，并保留两条真实语义：字典随 effect 注册因而随插件撤销，`t` 读的是
 * 当前语言，所以切换语言后 thunk 标签会跟着变。
 */

import { Service, type Context } from '@deepseek-ai/cordis'

/** 一个命名空间下各语言的文案。 */
export type Dictionary = Record<string, string>

/** 命名空间到各语言文案的映射。 */
export type DictionarySet = Record<string, Dictionary>

/**
 * 按当前语言读取各命名空间文案的服务。
 */
export class TestLocale extends Service {
  private readonly dictionaries = new Map<string, DictionarySet>()
  private language: string = 'en'

  constructor(ctx: Context) {
    super(ctx, 'locale')
  }

  /**
   * 切换当前语言。
   * @param language - 语言标签。
   */
  setLocale(language: string): void {
    this.language = language
  }

  /**
   * 读当前语言。
   * @returns 语言标签。
   */
  getLocale(): string {
    return this.language
  }

  /**
   * 注册一个命名空间的各语言文案，随调用方 fiber 撤销。
   * @param namespace - 字典命名空间。
   * @param sets - 各语言文案。
   * @returns 撤销函数。
   */
  register(namespace: string, sets: DictionarySet): () => void {
    this.dictionaries.set(namespace, sets)
    this.emitChange()
    return () => {
      this.dictionaries.delete(namespace)
      this.emitChange()
    }
  }

  /**
   * 绑定一个命名空间的读取器。
   * @param namespace - 字典命名空间。
   * @returns 按当前语言取值的函数。
   */
  bind(namespace: string): (key: string) => string {
    return (key: string) => {
      const sets = this.dictionaries.get(namespace)
      if (sets === undefined) return `${namespace}.${key}`
      return sets[this.language]?.[key] ?? sets.en?.[key] ?? `${namespace}.${key}`
    }
  }

  /**
   * 某命名空间在当前语言下是否真的有这个键。
   * @param namespace - 字典命名空间。
   * @param key - 文案键。
   * @returns 存在为 true。
   */
  has(namespace: string, key: string): boolean {
    return this.dictionaries.get(namespace)?.[this.language]?.[key] !== undefined
  }

  private readonly changeListeners = new Set<() => void>()

  /**
   * 观察语言或字典变化。
   * @param listener - 变更时调用。
   * @returns 移除监听器的函数。
   */
  subscribe(listener: () => void): () => void {
    this.changeListeners.add(listener)
    return () => { this.changeListeners.delete(listener) }
  }

  private emitChange(): void {
    for (const listener of [...this.changeListeners]) listener()
  }
}

/**
 * 判断一个 locale 服务是不是本文件的测试替身。
 *
 * 理由同 `isTestSlotRegistry`：`ctx.get('locale')` 的声明合并指向真实运行时，
 * 用类型谓词而不是断言取回替身。
 * @param value - 待判断的服务实例。
 * @returns 是替身时为 true。
 */
export function isTestLocale(value: unknown): value is TestLocale {
  return typeof (value as { has?: unknown } | undefined)?.has === 'function'
}
