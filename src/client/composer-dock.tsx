/**
 * 输入卡片下缘状态条：`conversation.composer.dock`，渲染在输入卡片正下方。
 *
 * session 级 list 插槽，与 `conversation.input.dock` 同属输入区，但位置更靠下
 * 且在卡片之外——它与宿主自带的统计行（StatsLine）同层。装饰性内容优先选这个
 * 有预留位置的位置，不要自己规划绕过宿主控件的动效路径。
 * @module dsh-plugin-template/client/composer-dock
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'

/** 注册项的 props。 */
type ComposerDockProps = PropsLocale<typeof LOCALE_NAMESPACE>

/**
 * 注册 `conversation.composer.dock` 的示例状态条。
 * @param ctx - 客户端根上下文。
 */
export function registerComposerDock(ctx: Context): void {
  ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
    { name: 'conversation.composer.dock', id: NAMESPACE, order: 30, locale: LOCALE_NAMESPACE },
    ComposerDock,
  ))
}

/** 输入卡片下方居中的一条状态文字。 */
function ComposerDock(props: ComposerDockProps): React.ReactElement {
  return <div className="dtpl-strip">{props.t('composerDock.text')}</div>
}
