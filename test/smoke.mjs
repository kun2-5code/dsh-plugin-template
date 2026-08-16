// 构建产物冒烟测试：验证主插件注册 greet 工具、配置经 settings 命名空间实时接线、
// hook 权限门按配置拒绝/放行。
// 运行：node test/smoke.mjs（先 pnpm build）
import assert from 'node:assert/strict'
import { name, inject, apply } from '../lib/index.js'
import * as hook from '../lib/hook.js'

// 最小可用的 ctx：只实现本插件用到的成员。
// inject 存在但从不提供服务 —— 模拟"profile 里没有 settings 服务"，
// 此时 installSettingsSection 不执行，配置回退到 composition entry。
const registered = []
const ctx = {
  tools: {
    register(definition) {
      registered.push(definition)
    },
  },
  on() {
    return () => {}
  },
  effect() {
    return () => {}
  },
  inject() {
    return () => {}
  },
}

const config = { greeting: 'Hi', maxRetries: 5 }
apply(ctx, config)

assert.equal(name, 'dsh-plugin-template')
assert.deepEqual(inject, ['tools'])

const tool = registered.find((t) => t.name === 'greet')
assert.ok(tool, 'greet tool should be registered')
assert.equal(await tool.execute({ name: 'Ada' }), 'Hi, Ada!')

// settings 接线：模拟 settings 服务存在（installSettingsSection 的依赖立即满足），
// 断言 greet 工具实时读取命名空间的解析值，而不是静态配置。
{
  let liveValue = { greeting: 'Hey', maxRetries: 3 }
  const settingsCtx = {
    settings: {
      register(ns, schema, options) {
        assert.equal(ns, 'dsh-plugin-template')
        assert.equal(options.base, config, 'composition entry 应作为 base 层传入')
        return {
          get() {
            return liveValue
          },
          watch() {
            return () => {}
          },
        }
      },
    },
    effect() {
      return () => {}
    },
  }
  const liveRegistered = []
  const registeredCommands = []
  const liveCtx = {
    tools: { register(d) { liveRegistered.push(d) } },
    on() { return () => {} },
    effect() { return () => {} },
    // 按注入名分发：installSettingsSection 注入 ['settings']，registerDemoCommand 注入 ['commands']。
    inject(names, callback) {
      if (names.includes('settings')) callback(settingsCtx)
      if (names.includes('commands')) callback({ commands: { register(d) { registeredCommands.push(d) } } })
      return () => {}
    },
  }
  apply(liveCtx, config)
  const liveTool = liveRegistered.find((t) => t.name === 'greet')
  assert.ok(liveTool, 'greet tool should be registered')
  assert.equal(await liveTool.execute({ name: 'Bob' }), 'Hey, Bob!')
  liveValue = { greeting: 'Yo', maxRetries: 1 }
  assert.equal(await liveTool.execute({ name: 'Bob' }), 'Yo, Bob!', '配置变更应实时生效')
  assert.ok(registeredCommands.some((c) => c.name === 'dsh-demo'), 'demo command should be registered')
  assert.ok(registeredCommands.some((c) => c.name === 'hello'), 'hello command should be registered')
}

// hook 权限门：捕获注册的 tools/pre-execute 监听器，验证拒绝与放行两条路径。
let listener
const hookCtx = {
  on(_event, fn) {
    listener = fn
  },
}
hook.apply(hookCtx, { denyTools: ['bash'] })
assert.ok(listener, 'tools/pre-execute listener should be registered')

const denied = await listener({ name: 'bash' }, () => Promise.resolve({ kind: 'allow' }))
assert.deepEqual(denied, { kind: 'deny', reason: 'Tool "bash" is denied by policy.' })

const allowed = await listener({ name: 'greet' }, () => Promise.resolve({ kind: 'allow' }))
assert.deepEqual(allowed, { kind: 'allow' })

console.log('smoke ok')
