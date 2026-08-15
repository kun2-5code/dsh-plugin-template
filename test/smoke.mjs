// 构建产物冒烟测试：验证插件加载后注册了 greet 工具，且 execute 使用配置。
// 运行：node test/smoke.mjs（先 pnpm build）
import assert from 'node:assert/strict'
import { name, inject, apply } from '../lib/index.js'

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
console.log('smoke ok')
