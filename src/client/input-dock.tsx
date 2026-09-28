/**
 * 输入区 Dock：`conversation.input.dock`，在输入卡片上方渲染一条状态行。
 *
 * session 级 list 插槽，注册时通过 `inject` 工厂拿到 sessionId；owner 还会
 * 传 `session` / `input` 快照，需要实时数据时优先用那些标准 hook。
 * @module dsh-plugin-template/client/input-dock
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'

/** 注册项注入给组件的面。 */
interface InputDockFace {
  /** 当前会话的 id。 */
  sessionId?: string
}

/** 注册项的 props。 */
type InputDockProps = PropsLocale<typeof LOCALE_NAMESPACE> & InjectFace<InputDockFace>

/**
 * 注册 `conversation.input.dock` 的示例状态行。
 * @param ctx - 客户端根上下文。
 */
export function registerInputDock(ctx: Context): void {
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register(
    {
      name: 'conversation.input.dock',
      id: NAMESPACE,
      order: 30,
      locale: LOCALE_NAMESPACE,
      inject: (sessionId: string): InputDockFace => ({ sessionId }),
    },
    InputDock,
  ))
}

/** 输入区上方的状态行：显示注册时拿到的会话 id。 */
function InputDock(props: InputDockProps): React.ReactElement {
  const { t, sessionId } = props
  return (
    <div className="dtpl-dock">
      <span>{t('inputDock.label')}</span>
      <span className="dtpl-dock-id">{sessionId ?? t('inputDock.waiting')}</span>
    </div>
  )
}
