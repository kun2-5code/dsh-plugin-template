/**
 * 本模版允许引用的主题令牌，以及它们核对时对应的主题版本。
 *
 * 为什么是快照：主题的令牌表在 `@deepseek-ai/dsh-client-ui-theme` 里以 CSS
 * 源文件存在，但发布出去的包里只带 `brand-font.css`，令牌表没有随包走，仓库外
 * 读不到。所以把核对过的名字固定在这里，由
 * `tests/theme-tokens.client.spec.ts` 保证只用表内的令牌，并在主题版本变化时
 * 报出来、提示重新核对。
 *
 * 核对方法：在 `packages/client/ui-theme/src/styles` 下（令牌定义在 `base.css`
 * 与 `design-platform.css`）对 `--dsw-…:` 的声明取名字。表里没有的名字就写不进去
 * ——本模版第一版就写过一个不存在的 `--dsw-alias-shadow-popup`，浮层的阴影因此
 * 静默失效，没有任何报错。
 */

/** 这些名字核对时对应的主题版本。 */
export const VERIFIED_THEME_VERSION = '0.1.7-rc.2'

/** 本模版允许引用的主题令牌。 */
export const VERIFIED_TOKENS: ReadonlySet<string> = new Set([
  // 背景层
  '--dsw-alias-bg-base',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2',
  // 描边
  '--dsw-alias-border-l1',
  '--dsw-alias-border-l4',
  // 文字
  '--dsw-alias-label-caption',
  '--dsw-alias-label-primary',
  '--dsw-alias-label-secondary',
  '--dsw-alias-label-tertiary',
  // 交互态
  '--dsw-alias-interactive-bg-hover',
  // 状态色
  '--dsw-alias-state-error-primary',
  '--dsw-alias-state-success-primary',
  '--dsw-alias-state-business-primary',
  // 圆角刻度
  '--dsw-radius-sm',
  '--dsw-radius-md',
  '--dsw-radius-lg',
  // 抬升
  '--dsw-elevation-panel',
  '--dsw-elevation-prominent',
  '--dsw-elevation-soft',
  // 焦点环
  '--dsw-focus-ring-width',
])

/**
 * 主机排版刻度里可用的字号。
 * 取自 `packages/client` 下各包的 `*.module.css` 的实际分布：12 / 13 / 14 / 16。
 * 模版不要引入刻度外的字号。
 */
export const HOST_FONT_SIZES: ReadonlySet<string> = new Set(['12px', '13px', '14px', '16px'])
