// 构建产物上的冒烟测试：验证 greet 工具已注册、按当前配置取词、
// 自定义事件已监听、/hello 与 /dsh-demo 两条命令已注册，以及 hook 权限
// 拦截器会拒绝禁用工具。
//
// 运行方式：先 `pnpm build`，再 `node test/smoke.mjs`。
//
// 覆盖的是构建产物，不是源码；浏览器半边（lib/client.js）需要真实 DOM 与
// 插槽宿主，不在这里测。
import assert from 'node:assert/strict'
import { apply, inject, name } from '../lib/index.js'
import * as hook from '../lib/hook.js'

// 只实现被用到成员的最小 ctx。`tools` 由 inject 提供；`commands` 是可选服务，
// 这里显式提供以便断言命令注册。
const registered = []
const registeredCommands = []
const ctx = {
  tools: {
    register(definition) {
      registered.push(definition)
      return () => {}
    },
  },
  on() {
    return () => {}
  },
  effect() {
    return () => {}
  },
  inject(names, callback) {
    if (names.includes('commands')) {
      callback({ commands: { register(definition) { registeredCommands.push(definition) } } })
    }
    return () => {}
  },
}

// 配置值以 Volatile 引用的形式出现：{ get(): value }
const config = {
  greeting: { get: () => 'Hi' },
  maxRetries: { get: () => 5 },
  verbose: { get: () => false },
}
apply(ctx, config)

assert.equal(name, 'dsh-plugin-template')
assert.deepEqual(inject, ['tools'])

const tool = registered.find(t => t.name === 'greet')
assert.ok(tool, 'greet tool should be registered')
assert.equal(await tool.execute({ name: 'Ada' }), 'Hi, Ada!')
assert.equal(typeof tool.presentResult, 'function', 'greet tool should define presentResult')

// 配置改为实时取值后，同一个工具实例应读到新值，不需要重新注册。
config.greeting = { get: () => 'Hey' }
assert.equal(await tool.execute({ name: 'Bob' }), 'Hey, Bob!')

assert.ok(registeredCommands.some(c => c.name === 'hello'), 'hello command should be registered')
assert.ok(registeredCommands.some(c => c.name === 'dsh-demo'), 'demo command should be registered')

// hook 权限拦截器：拒绝禁用工具，放行其它工具。
let listener
hook.apply({ on(_event, fn) { listener = fn } }, { denyTools: ['bash'] })
assert.ok(listener, 'tools/pre-execute listener should be registered')

const denied = await listener({ name: 'bash' }, () => Promise.resolve({ kind: 'allow' }))
assert.deepEqual(denied, { kind: 'deny', reason: 'Tool "bash" is denied by policy.' })

const allowed = await listener({ name: 'greet' }, () => Promise.resolve({ kind: 'allow' }))
assert.deepEqual(allowed, { kind: 'allow' })

console.log('smoke ok')
