/**
 * 通用设置页的一行偏好：`settings.general.item`，在 设置 → 通用 里加一个示例项。
 *
 * root 级 list 插槽。owner 不投影 `label`，文案、当前值和写入路径都归本行，
 * 所以每个字段的可见文字都要走 locale。
 * @module dsh-plugin-template/client/general-item
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'

/** 注册项的 props。 */
type GeneralItemProps = PropsLocale<typeof LOCALE_NAMESPACE>

/**
 * 注册 `settings.general.item` 的示例偏好项。
 * @param ctx - 客户端根上下文。
 */
export function registerGeneralItem(ctx: Context): void {
  ctx.slots.inject('settings.general.item', () => ctx.slots.register(
    { name: 'settings.general.item', id: NAMESPACE, order: 30, locale: LOCALE_NAMESPACE },
    GeneralItem,
  ))
}

/**
 * 通用页里的一行示例偏好。
 *
 * 这一行演示的是插槽注册本身：状态留在组件本地，离开页面即丢弃，不写入
 * 宿主配置。要持久化的偏好请读 config-card.tsx 那种由 owner 提供
 * `form` 的表单。
 */
function GeneralItem(props: GeneralItemProps): React.ReactElement {
  const { t } = props
  const [enabled, setEnabled] = React.useState(false)
  return (
    <label className="dtpl-row">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => { setEnabled(event.currentTarget.checked) }}
      />
      <span>{t('general.label')}</span>
    </label>
  )
}
