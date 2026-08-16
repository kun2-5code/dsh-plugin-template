/**
 * 插件页标签页（settings.plugins.tab 插槽）：在 设置 → 插件 页加一个新 tab。
 * root 级 list；选项里的 label 就是标签页文字（可字符串或按 locale 的 thunk，
 * 本示例用固定字符串），id/order 决定位置。参考：ui-settings-plugin-inventory
 * （插件清单 tab，id 'all'）。
 * @module dsh-plugin-template/client/plugins-tab
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import { NAMESPACE } from './constants.ts'

/** 在 `settings.plugins.tab` 插槽注册示例标签页。 */
export function registerPluginsTab(ctx: Context): void {
  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register(
    { name: 'settings.plugins.tab', id: NAMESPACE, order: 30, label: '模板示例' },
    PluginsTab,
  ))
}

/** 标签页内容：几行说明文字。 */
function PluginsTab(): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'dtpl-tab-content' },
    React.createElement('p', null, '这是一个 settings.plugins.tab 示例标签页。'),
    React.createElement('p', null, '插件页的每个 tab 是一个插槽条目（id + order + label），与 Configurable / 插件清单 并列。'),
  )
}
