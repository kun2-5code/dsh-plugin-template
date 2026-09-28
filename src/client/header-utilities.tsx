/**
 * 会话头工具位：`conversation.session.header.utilities`，在会话标题右侧渲染一枚徽标。
 *
 * session 级 list 插槽，注册时通过 `inject` 工厂拿到 sessionId；`order` 越小
 * 越靠前。该位置的 chrome 留给宿主占用。
 * @module dsh-plugin-template/client/header-utilities
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'

/** 注册项注入给组件的面。 */
interface HeaderUtilityFace {
  /** 当前会话的 id。 */
  sessionId?: string
}

/** 注册项的 props。 */
type HeaderUtilityProps =
  PropsLocale<typeof LOCALE_NAMESPACE> & InjectFace<HeaderUtilityFace>

/**
 * 注册 `conversation.session.header.utilities` 的示例徽标。
 * @param ctx - 客户端根上下文。
 */
export function registerHeaderUtility(ctx: Context): void {
  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register(
    {
      name: 'conversation.session.header.utilities',
      id: NAMESPACE,
      order: 30,
      locale: LOCALE_NAMESPACE,
      inject: (sessionId: string): HeaderUtilityFace => ({ sessionId }),
    },
    HeaderUtility,
  ))
}

/**
 * 会话头右侧的一枚被动标签。
 *
 * 几何抄 `ui-agent-preset` 的 `AgentPresetLabel .label`：22px 高、4px 圆角、
 * 12/22 三级文字、最宽 180px，标题行窄于 540px 时整枚隐藏——passive chrome 先让位。
 */
function HeaderUtility(props: HeaderUtilityProps): React.ReactElement {
  return <span className="dtpl-tag">{props.t('header.badge')}</span>
}
