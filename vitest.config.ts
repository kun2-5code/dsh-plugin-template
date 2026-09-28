import { defineConfig } from 'vitest/config'

/**
 * 测试配置。
 *
 * 默认环境是 node：宿主半边与插槽注册测试不需要 DOM。需要 DOM 的组件测试
 * 在自己的 spec 第一行写 `// @vitest-environment jsdom` 单独声明。
 *
 * 组件测试直接从源码相对路径导入内部实现，不为测试扩大包的公开 API。
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.{ts,tsx}'],
  },
})
