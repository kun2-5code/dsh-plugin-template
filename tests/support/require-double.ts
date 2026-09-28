/**
 * 取回已挂载的测试替身。
 *
 * cordis 的 `ctx.get(name)` 返回值由宿主包的 declaration merging 决定，会标成
 * 真实服务类型；直接断言成替身类型是不安全的转换，TypeScript 也会拒绝。这里
 * 走调用方给出的类型谓词做一次真正的检查。
 */

/**
 * 取回一个测试替身，取不到就报错。
 * @param value - `ctx.get(...)` 的返回值。
 * @param guard - 判定替身类型的类型谓词。
 * @param label - 报错信息里用的名字。
 * @returns 缩窄后的替身实例。
 */
export function requireDouble<T>(value: unknown, guard: (input: unknown) => input is T, label: string): T {
  if (!guard(value)) {
    throw new Error(`the ${label} is not mounted; check that ctx.plugin() awaited it`)
  }
  return value
}
