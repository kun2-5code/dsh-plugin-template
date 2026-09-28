// @vitest-environment jsdom
/**
 * 样式表是否沿用框架的样式。
 *
 * 这一份把"框架的样式就是我们的样式"变成可执行的约束：样式表只允许引用核对过
 * 的主题令牌，字号必须落在主机排版刻度内且与行高成对，全圆角必须配
 * `corner-shape: round`，并且不得盖掉主题的焦点环。
 *
 * 主题升级会让这份快照过期，所以同时断言安装的主题版本与核对版本一致——版本一变
 * 就报错，提醒重新核对令牌表，而不是让样式悄悄跑偏。
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { injectStyles } from '../src/client/styles.ts'
import { HOST_FONT_SIZES, VERIFIED_THEME_VERSION, VERIFIED_TOKENS } from './support/theme-tokens.ts'

/**
 * 注入一次样式表并取回内容，随后撤销。
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

/** 取出样式表里引用到的所有 `--dsw-*` 令牌名。 */
function referencedTokens(): string[] {
  return [...new Set([...css().matchAll(/var\((--dsw-[a-z0-9-]+)/g)].map(m => m[1] ?? ''))]
}

/** 取出样式表里的 `font-size` 声明。 */
function fontSizes(): string[] {
  return [...css().matchAll(/font-size:\s*([^;]+);/g)].map(m => (m[1] ?? '').trim())
}

afterEach(() => {
  document.querySelectorAll('style[data-plugin]').forEach(node => node.remove())
})

describe('theme tokens', () => {
  it('references only tokens verified against the theme', () => {
    const unknown = referencedTokens().filter(token => !VERIFIED_TOKENS.has(token))
    expect(unknown, `unverified theme tokens: ${unknown.join(', ')}`).toEqual([])
  })

  it('actually uses the theme, rather than hardcoding values', () => {
    expect(referencedTokens().length, 'the stylesheet should colour through theme tokens')
      .toBeGreaterThan(4)
  })

  it('matches the theme version the token list was verified against', () => {
    const installed = JSON.parse(
      readFileSync(
        join(import.meta.dirname, '..', 'node_modules', '@deepseek-ai', 'dsh-client-ui-theme', 'package.json'),
        'utf8',
      ),
    ) as { version: string }
    expect(
      installed.version,
      `the theme moved to ${installed.version}; re-verify tests/support/theme-tokens.ts against its src/styles`,
    ).toBe(VERIFIED_THEME_VERSION)
  })
})

describe('colours', () => {
  it('carries no literal colour values', () => {
    const literals = css().match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|\bcolor-mix\(/g)
    expect(literals, `stylesheet should carry no literal colours, found ${literals?.join(', ')}`)
      .toBeNull()
  })
})

describe('typography', () => {
  it('uses only sizes from the host scale', () => {
    const off = fontSizes().filter(size => !HOST_FONT_SIZES.has(size))
    expect(off, `off-scale font sizes: ${off.join(', ')}`).toEqual([])
  })

  it('pairs every font size with a line height', () => {
    // 规则：字号与行高成对。只看声明块的粒度——同一规则里出现 font-size 就必须
    // 出现 line-height。
    const rules = css().split('}')
    for (const rule of rules) {
      if (!rule.includes('font-size:')) continue
      expect(rule, `font-size without line-height in: ${rule.trim().slice(0, 60)}`)
        .toContain('line-height:')
    }
  })

  it('keeps font weight at or below the feature ceiling', () => {
    const weights = [...css().matchAll(/font-weight:\s*(\d+)/g)].map(m => Number(m[1]))
    for (const weight of weights) {
      expect(weight, `font-weight ${weight} exceeds the 500 ceiling`).toBeLessThanOrEqual(500)
    }
  })
})

describe('geometry', () => {
  it('pairs every full-round radius with corner-shape: round', () => {
    // 超椭圆平滑会把没配对的圆拉扁；主题的 corner-shape 规范强制这一对。
    const rules = css().split('}')
    for (const rule of rules) {
      const radius = /border-radius:\s*(999px|100%|50%)/.exec(rule)
      if (radius === null) continue
      expect(rule, `full-round radius ${radius[1]} without corner-shape: round`)
        .toContain('corner-shape: round')
    }
  })

  it('draws neutral borders at the hairline weight', () => {
    const widths = [...css().matchAll(/border:\s*([0-9.]+)px solid var\(--dsw-alias-border/g)]
      .map(m => m[1])
    for (const width of widths) {
      expect(width, `neutral border at ${width}px; the hairline weight is 0.5px`).toBe('0.5')
    }
  })

  it('never pairs a border token with an elevation shadow', () => {
    // 抬升面的描边是阴影的第一层，再加一条 alias 描边会双线。
    for (const rule of css().split('}')) {
      const hasBorder = /border:\s*0\.5px solid var\(--dsw-alias-border/.test(rule)
      const hasElevation = /box-shadow:\s*var\(--dsw-elevation-/.test(rule)
      expect(hasBorder && hasElevation, 'border token paired with an elevation shadow')
        .toBe(false)
    }
  })
})

describe('focus', () => {
  it('does not suppress the theme focus ring', () => {
    expect(css(), 'the theme provides the focus ring; a plugin must not remove it')
      .not.toMatch(/outline:\s*(none|0)\b/)
  })
})

describe('class coverage', () => {
  // 插件拿不到属于自己的根元素（插槽组件渲染在宿主给的位置上），所以样式表只能
  // 靠 `dtpl-` 前缀做全局作用域。代价是拼错类名不会报错，只会静默失效——这组
  // 断言把那份静默变成失败。
  const CLIENT_DIR = join(import.meta.dirname, '..', 'src', 'client')

  /** 样式表里定义的全部 `.dtpl-*` 选择器。 */
  function defined(): string[] {
    return [...css().matchAll(/\.(dtpl-[a-z0-9-]+)/g)].map(m => m[1] ?? '')
  }

  /**
   * 组件源码里出现的类名。`className` 既可能是字符串字面量、模板字面量，也可能是
   * 三元或 `clsx(...)` 表达式，所以整段属性值都扫。模板字面量的动态后缀
   * （`dtpl-command-${state}`）只留下前缀，交由调用方判断是否有规则以它开头。
   */
  function used(): string[] {
    const found = new Set<string>()
    for (const file of readdirSync(CLIENT_DIR)) {
      if (!file.endsWith('.tsx')) continue
      const source = readFileSync(join(CLIENT_DIR, file), 'utf8')
      for (const match of source.matchAll(/className=(?:"([^"]*)"|\{([\s\S]*?)\})/g)) {
        for (const token of `${match[1] ?? ''} ${match[2] ?? ''}`.matchAll(/dtpl-[a-z0-9-${}]+/g)) {
          found.add((token[0] ?? '').replace(/\$\{.*$/u, ''))
        }
      }
    }
    return [...found]
  }

  it('defines a rule for every class a component applies', () => {
    const definedClasses = defined()
    const unresolved = used().filter(name => !definedClasses.includes(name)
      && !definedClasses.some(candidate => candidate.startsWith(name)))
    expect(unresolved, `classes applied but never styled: ${unresolved.join(', ')}`).toEqual([])
  })

  it('styles nothing a component never applies', () => {
    const applied = used()
    const dead = defined().filter(name => !applied.some(usedName => usedName === name
      || usedName.startsWith(`${name}-`)
      || name.startsWith(`${usedName}-`)))
    expect(dead, `rules no component applies: ${dead.join(', ')}`).toEqual([])
  })
})
