/**
 * 宿主半边在真实 cordis 组装下的行为。
 *
 * `test/smoke.mjs` 验的是构建产物能不能加载；这一份验的是源码在真实 fiber 上
 * 的行为：注册是不是 effect、插件停用后工具与监听有没有撤掉、配置是不是每次
 * 执行时现读。
 */

import { Context, Service } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { apply, inject, name, type Config } from '../src/index.ts'
import { apply as hookApply, name as hookName } from '../src/hook.ts'
import { requireDouble } from './support/require-double.ts'

/**
 * 收集工具注册的最小 tools 服务。
 *
 * `register` 把撤销挂到调用方 fiber 的 effect 上——真实的工具注册表也是这么
 * 做的，插件只需返回撤销函数，回收由注册表在 fiber 停止时触发。
 */
class CollectingTools extends Service {
  readonly definitions: { name: string; execute: (args: never) => Promise<unknown> }[] = []
  readonly disposals: number[] = []
  constructor(ctx: Context) {
    super(ctx, 'tools')
  }
  register(definition: { name: string; execute: (args: never) => Promise<unknown> }): () => void {
    // 注册表把贡献挂在调用方 fiber 的 effect 上：插件停用时定义自动消失。
    this.ctx.effect(() => {
      this.definitions.push(definition)
      return () => {
        this.disposals.push(1)
        const index = this.definitions.indexOf(definition)
        if (index >= 0) this.definitions.splice(index, 1)
      }
    })
    return () => {}
  }
}

/** 收集命令注册的最小 commands 服务。 */
class CollectingCommands extends Service {
  readonly definitions: { name: string; handler: () => unknown }[] = []
  constructor(ctx: Context) {
    super(ctx, 'commands')
  }
  register(definition: { name: string; handler: () => unknown }): () => void {
    this.ctx.effect(() => {
      this.definitions.push(definition)
      return () => {
        const index = this.definitions.indexOf(definition)
        if (index >= 0) this.definitions.splice(index, 1)
      }
    })
    return () => {}
  }
}

/**
 * 构造一份配置。
 *
 * `Volatile<T>` 只有一个 `get()` 成员，所以引用可以照接口直接构造，不需要断言；
 * `VolatileSnapshot` 对原始类型就是它本身。
 * @param overrides - 各字段的值。
 * @returns 一份配置。
 */
function config(overrides: { greeting?: string; maxRetries?: number; verbose?: boolean } = {}): Config {
  return {
    greeting: { get: () => overrides.greeting ?? 'Hello' },
    maxRetries: { get: () => overrides.maxRetries ?? 3 },
    verbose: { get: () => overrides.verbose ?? false },
  }
}

/** 判断一个 tools 服务是不是本文件的测试替身。 */
function isCollectingTools(value: unknown): value is CollectingTools {
  return typeof (value as { definitions?: unknown } | undefined)?.definitions === 'object'
}

/** 判断一个 commands 服务是不是本文件的测试替身。 */
function isCollectingCommands(value: unknown): value is CollectingCommands {
  return typeof (value as { definitions?: unknown } | undefined)?.definitions === 'object'
}

/** 装好宿主 ctx。 */
async function bench() {
  const ctx = new Context()
  await ctx.plugin(CollectingTools).await()
  await ctx.plugin(CollectingCommands).await()
  return {
    ctx,
    tools: requireDouble(ctx.get('tools'), isCollectingTools, 'tools test double'),
    commands: requireDouble(ctx.get('commands'), isCollectingCommands, 'commands test double'),
  }
}

/** 取出 greet 工具。 */
function greet(tools: CollectingTools) {
  const tool = tools.definitions.find(d => d.name === 'greet')
  if (tool === undefined) throw new Error('greet tool was not registered')
  return tool
}

describe('host half registration', () => {
  it('exports the function-plugin shape cordis needs', () => {
    expect(name).toBe('dsh-plugin-template')
    expect(inject).toEqual(['tools'])
  })

  it('registers the greet tool and both demo commands', async () => {
    const { ctx, tools, commands } = await bench()
    const fiber = await ctx.plugin({ inject, apply }, config()).await()

    expect(tools.definitions.map(d => d.name)).toContain('greet')
    expect(commands.definitions.map(c => c.name).sort()).toEqual(['dsh-demo', 'hello'])

    await fiber.dispose()
  })

  it('replies with the stored value for /hello', async () => {
    const { ctx, commands } = await bench()
    const fiber = await ctx.plugin({ inject, apply }, config()).await()
    const hello = commands.definitions.find(c => c.name === 'hello')

    expect(hello?.handler()).toEqual({ kind: 'success', text: 'world' })

    await fiber.dispose()
  })
})

describe('host half config reads', () => {
  it('reads the greeting on every call, not once at load', async () => {
    const { ctx, tools } = await bench()
    // 引用在两次调用之间换掉取值，模拟宿主热更新后的配置。
    const greeting = { current: 'Hello' }
    const live: Config = {
      greeting: { get: () => greeting.current },
      maxRetries: { get: () => 3 },
      verbose: { get: () => false },
    }
    const fiber = await ctx.plugin({ inject, apply }, live).await()

    expect(await greet(tools).execute({ name: 'Ada' } as never)).toBe('Hello, Ada!')
    greeting.current = 'Hey'
    // 同一个工具实例读到了新值，用户改配置后下一次调用即可见。
    expect(await greet(tools).execute({ name: 'Ada' } as never)).toBe('Hey, Ada!')

    await fiber.dispose()
  })

  it('keeps the canonical value a plain string, as output.schema declares', async () => {
    const { ctx, tools } = await bench()
    const fiber = await ctx.plugin({ inject, apply }, config({ greeting: 'Hi' })).await()
    const value = await greet(tools).execute({ name: 'Bob' } as never)

    expect(value).toBe('Hi, Bob!')
    expect(typeof value).toBe('string')

    await fiber.dispose()
  })
})

describe('host half disposal', () => {
  it('removes the tool registration when the fiber is disposed', async () => {
    const { ctx, tools } = await bench()
    const fiber = await ctx.plugin({ inject, apply }, config()).await()
    expect(tools.definitions).toHaveLength(1)

    await fiber.dispose()

    // 注册表把撤销挂在调用方 fiber 上；插件返回了撤销函数，所以工具随之消失。
    expect(tools.disposals, 'the registry should have called the plugin disposer').toHaveLength(1)
    expect(tools.definitions, 'the tool must leave with the plugin fiber').toHaveLength(0)
  })
})

describe('permission gate hook', () => {
  /** 装一个只记录监听器的 ctx。 */
  function hookBench() {
    const listeners: ((exec: { name: string }, next: () => Promise<unknown>) => Promise<unknown>)[] = []
    return { ctx: { on: (_e: string, fn: never) => { listeners.push(fn) } }, listeners }
  }

  it('exports its own plugin name', () => {
    expect(hookName).toBe('dsh-plugin-template-permission-gate')
  })

  it('denies a listed tool and explains why', async () => {
    const { ctx, listeners } = hookBench()
    hookApply(ctx as never, { denyTools: ['bash'] })
    const listener = listeners[0]
    if (listener === undefined) throw new Error('hook did not register a listener')

    const decision = await listener({ name: 'bash' }, () => Promise.resolve({ kind: 'allow' }))

    expect(decision).toEqual({ kind: 'deny', reason: 'Tool "bash" is denied by policy.' })
  })

  it('delegates to the rest of the chain for a tool it does not deny', async () => {
    // waterfall 监听器不调用 next() 就会截断整条链——放行时必须转交。
    const { ctx, listeners } = hookBench()
    hookApply(ctx as never, { denyTools: ['bash'] })
    const listener = listeners[0]
    if (listener === undefined) throw new Error('hook did not register a listener')

    const decision = await listener({ name: 'greet' }, () => Promise.resolve({ kind: 'allow' }))

    expect(decision).toEqual({ kind: 'allow' })
  })
})
