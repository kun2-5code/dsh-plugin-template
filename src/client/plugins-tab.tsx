/**
 * 设置 → 插件 里的一个迁移页：`settings.plugins.tab`，在插件设置分区里加一个
 * 示例 tab。
 *
 * root 级 list 插槽。tab 标题走 `label` thunk，切换语言时重新求值，不需要
 * 重新注册。注意本插件的配置表单不在这里——bundle 的配置页用
 * `plugins.bundle.config`（见 config-card.tsx），这里的清单页只承载说明文字。
 * @module dsh-plugin-template/client/plugins-tab
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'

/** 注册项的 props。 */
type PluginsTabProps = PropsLocale<typeof LOCALE_NAMESPACE>

/**
 * 注册 `settings.plugins.tab` 的示例迁移页。
 * @param ctx - 客户端根上下文。
 */
export function registerPluginsTab(ctx: Context): void {
  const t = ctx.locale.bind(LOCALE_NAMESPACE)
  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register(
    {
      name: 'settings.plugins.tab',
      id: NAMESPACE,
      order: 30,
      // thunk：每次读取标签时重新求值，切换语言不需要重新注册。
      label: () => t('pluginsTab.label'),
      locale: LOCALE_NAMESPACE,
    },
    PluginsTab,
  ))
}

/** 迁移页内容：说明这一页演示了什么。 */
function PluginsTab(props: PluginsTabProps): React.ReactElement {
  const { t } = props
  return (
    <div className="dtpl-prose">
      <p>{t('pluginsTab.label')}</p>
      <p>{t('card.description')}</p>
    </div>
  )
}
