/**
 * 侧栏底部动作：`sidebar.footer.action`，在侧栏底部注册一个示例开关。
 *
 * root 级 list 插槽，一个条目一个按钮。owner 会传 `wide`：展开态为 true，
 * 收起态（rail）为 false，此时只剩图标——所以收起态必须另给一个无障碍名称。
 * @module dsh-plugin-template/client/sidebar-action
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'

/** 注册项的 props：owner 的 wide 状态加本插件的 `t` 席位。 */
type SidebarActionProps =
  & { readonly wide: boolean }
  & PropsLocale<typeof LOCALE_NAMESPACE>

/**
 * 注册 `sidebar.footer.action` 的示例开关。
 * @param ctx - 客户端根上下文。
 */
export function registerSidebarAction(ctx: Context): void {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
    { name: 'sidebar.footer.action', id: NAMESPACE, order: 30, locale: LOCALE_NAMESPACE },
    SidebarAction,
  ))
}

/**
 * 侧栏底部按钮。
 *
 * 几何抄 `ui-sidebar` 的 `.iconButton`：28px 方、`--dsw-radius-sm`、transparent
 * 底。展开态在图标右侧补文字，收起态只剩图标——收起时按钮仍要有无障碍名称。
 */
export function SidebarAction(props: SidebarActionProps): React.ReactElement {
  const { t } = props
  const [lit, setLit] = React.useState(false)
  return (
    <button
      type="button"
      className="dtpl-icon-btn"
      aria-pressed={lit}
      aria-label={t('sidebar.label')}
      onClick={() => { setLit(!lit) }}
    >
      <span className="dtpl-dot" data-on={lit} />
      {props.wide && <span>{t('sidebar.label')}</span>}
    </button>
  )
}
