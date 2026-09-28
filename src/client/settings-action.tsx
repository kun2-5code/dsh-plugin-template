/**
 * 设置页头部动作：`settings.action`，在设置页头部注册一个示例按钮。
 *
 * root 级 list 插槽，注册项渲染在完成/取消/重置这一排按钮之前。
 * @module dsh-plugin-template/client/settings-action
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'

/** 注册项的 props。 */
type SettingsActionProps = PropsLocale<typeof LOCALE_NAMESPACE>

/**
 * 注册 `settings.action` 的示例按钮。
 * @param ctx - 客户端根上下文。
 */
export function registerSettingsAction(ctx: Context): void {
  ctx.slots.inject('settings.action', () => ctx.slots.register(
    { name: 'settings.action', id: NAMESPACE, order: 30, locale: LOCALE_NAMESPACE },
    SettingsAction,
  ))
}

/**
 * 设置页头部的一个开关按钮。
 *
 * 几何抄 `ui-settings-general` 的输入框那一档：0.5px 描边 + `--dsw-radius-md`，
 * 与设置页里其它可见控件读起来是一套。
 */
function SettingsAction(props: SettingsActionProps): React.ReactElement {
  const { t } = props
  const [armed, setArmed] = React.useState(false)
  return (
    <button
      type="button"
      className="dtpl-text-btn"
      aria-pressed={armed}
      onClick={() => { setArmed(!armed) }}
    >
      {armed ? t('settings.armed') : t('settings.idle')}
    </button>
  )
}
