/**
 * 全局浮层：`shell.overlay`，示例一个可关闭的浮层 pill。
 *
 * root 级 list 插槽；只提供 `inset: 0` 的全屏定位层，布局要自己做
 * （见 styles.ts 的固定定位与边距）。浮层必须能从自身按钮、点击外部和
 * Escape 键三条路径关闭，否则键盘和鼠标用户都走不出去。
 * @module dsh-plugin-template/client/shell-overlay
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'

/** 注册项的 props。 */
type ShellOverlayProps = PropsLocale<typeof LOCALE_NAMESPACE>

/**
 * 注册 `shell.overlay` 的示例浮层。
 * @param ctx - 客户端根上下文。
 */
export function registerShellOverlay(ctx: Context): void {
  ctx.slots.inject('shell.overlay', () => ctx.slots.register(
    { name: 'shell.overlay', id: NAMESPACE, order: 30, locale: LOCALE_NAMESPACE },
    ShellOverlayDemo,
  ))
}

/** 帧级浮层示例：自身按钮、点击外部、Escape 都能关闭。 */
export function ShellOverlayDemo(props: ShellOverlayProps): React.ReactElement | null {
  const { t } = props
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    if (dismissed) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setDismissed(true)
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [dismissed])

  if (dismissed) return null
  return (
    <div
      className="dtpl-overlay"
      role="dialog"
      aria-label={t('overlay.text')}
      onClick={() => { setDismissed(true) }}
    >
      <span
        className="dtpl-overlay-text"
        onClick={(event) => { event.stopPropagation() }}
      >{t('overlay.text')}</span>
      <button
        type="button"
        className="dtpl-overlay-close"
        aria-label={t('overlay.close')}
        onClick={() => { setDismissed(true) }}
      >
        ×
      </button>
    </div>
  )
}
