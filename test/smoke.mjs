// 构建产物冒烟测试：验证主插件注册 greet 工具、hook 权限门按配置拒绝/放行。
// 运行：node test/smoke.mjs（先 pnpm build）
import assert from 'node:assert/strict'
import { name, inject, apply } from '../lib/index.js'
import * as hook from '../lib/hook.js'

// 最小可用的 ctx：只实现本插件用到的成员。
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
}

const config = { greeting: 'Hi', maxRetries: 5 }
apply(ctx, config)

assert.equal(name, 'dsh-plugin-template')
assert.deepEqual(inject, ['tools'])

const tool = registered.find((t) => t.name === 'greet')
assert.ok(tool, 'greet tool should be registered')
assert.equal(await tool.execute({ name: 'Ada' }), 'Hi, Ada!')

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
