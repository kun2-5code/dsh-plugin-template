/**
 * 通用设置行（settings.general.item 插槽）：在 设置 → 通用 页里加一行偏好。
 * root 级 list——加一个条目就是一行；行自包含（标签、当前值、写路径都是自己的，
 * 参考内置的语言/外观/Composer 回车 行）。本示例是本地状态的开关行，不接
 * settings 命名空间（那属于配置卡片那套数据链路）。
 * @module dsh-plugin-template/client/general-item
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import { NAMESPACE } from './constants.ts'

/** 在 `settings.general.item` 插槽注册示例偏好行。 */
export function registerGeneralItem(ctx: Context): void {
  ctx.slots.inject('settings.general.item', () => ctx.slots.register(
    { name: 'settings.general.item', id: NAMESPACE, order: 30 },
    GeneralItem,
  ))
}

/** 一行"模板示例开关"（本地状态，演示行自包含的写法）。 */
function GeneralItem(): React.ReactElement {
  const [enabled, setEnabled] = React.useState(false)
  return React.createElement(
    'label',
    { className: 'dtpl-general-row' },
    React.createElement('span', null, '模板示例开关'),
    React.createElement('input', {
      type: 'checkbox',
      checked: enabled,
      onChange: () => setEnabled(!enabled),
    }),
  )
}
