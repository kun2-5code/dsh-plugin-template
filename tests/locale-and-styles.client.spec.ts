// @vitest-environment jsdom
/**
 * 文案字典与样式表的约定。
 *
 * 这两条是仓库里对客户端半边的硬性要求，写成测试就不会在后续编辑里悄悄退化：
 * 用户可见文字必须来自字典，样式必须只用主题令牌。
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { en, zh, type TemplateLocaleKey } from '../src/client/locales.ts'
import { injectStyles } from '../src/client/styles.ts'

/** 客户端半边源码目录。 */
const CLIENT_DIR = join(import.meta.dirname, '..', 'src', 'client')

/**
 * 递归读出客户端半边所有 .ts/.tsx 源文件。
 * @returns 文件路径与内容。
 */
function clientSources(): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = []
  for (const name of readdirSync(CLIENT_DIR)) {
    if (!name.endsWith('.ts') && !name.endsWith('.tsx')) continue
    out.push({ path: name, text: readFileSync(join(CLIENT_DIR, name), 'utf8') })
  }
  return out
}

describe('locale dictionaries', () => {
  it('declares the same keys in English and Chinese', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort())
  })

  it('has a non-empty value for every declared key', () => {
    const declared = Object.keys(en) as TemplateLocaleKey[]
    for (const key of declared) {
      expect(en[key], `en.${key} should be non-empty`).toBeTruthy()
      expect(zh[key], `zh.${key} should be non-empty`).toBeTruthy()
    }
  })

  it('keeps protocol tokens out of product copy', () => {
    // 槽位名、服务名、字段 id 是协议记号，不是给用户看的措辞。
    // 模板曾经把 '（conversation.input.dock 插槽示例）' 直接印在界面上。
    const protocolWords = [
      'conversation.', 'settings.plugin', 'sidebar.', 'shell.overlay',
      'plugins.bundle', 'dtpl-', 'Config', 'volatile', 'namespace', 'slot',
    ]
    for (const [key, value] of Object.entries(en)) {
      for (const word of protocolWords) {
        expect(value.includes(word), `en.${key} leaks the protocol token "${word}": ${value}`)
          .toBe(false)
      }
    }
  })

  it('only asks the dictionary for keys that exist', () => {
    // 抓 `t('card.svae')` 这类手写键名打错的情况。
    const known = new Set<string>(Object.keys(en))
    const used = new Set<string>()
    for (const { path, text } of clientSources()) {
      for (const match of text.matchAll(/\bt\('([^']+)'\)/g)) {
        const key = match[1]
        if (key === undefined) continue
        used.add(key)
        expect(known.has(key), `${path} asks for t('${key}'), which no dictionary declares`)
          .toBe(true)
      }
    }
    expect(used.size, 'the client half should read its copy from the dictionary').toBeGreaterThan(10)
  })
})

describe('stylesheet', () => {
  /**
   * 注入一次样式表并取回其内容。
   * @returns 样式表 CSS 文本。
   */
  function css(): string {
    const dispose = injectStyles()
    const tag = document.querySelector('style[data-plugin="dsh-plugin-template"]')
    if (tag === null) throw new Error('stylesheet was not injected')
    const text = tag.textContent ?? ''
    dispose()
    return text
  }

  it('colours everything through theme tokens', () => {
    // 字面色值不会跟随明暗主题；只允许 var(--dsw-alias-*)。
    const literals = css().match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g)
    expect(literals, `stylesheet should carry no literal colours, found ${literals?.join(', ')}`)
      .toBeNull()
  })

  it('keeps font weight at or below the feature ceiling', () => {
    const weights = [...css().matchAll(/font-weight:\s*(\d+)/g)].map(m => Number(m[1]))
    for (const weight of weights) {
      expect(weight, `font-weight ${weight} exceeds the 500 ceiling`).toBeLessThanOrEqual(500)
    }
  })

  it('marks the sheet with the plugin name so its owner is identifiable', () => {
    const dispose = injectStyles()
    expect(document.querySelectorAll('style[data-plugin="dsh-plugin-template"]')).toHaveLength(1)
    dispose()
    expect(document.querySelectorAll('style[data-plugin="dsh-plugin-template"]')).toHaveLength(0)
  })
})
