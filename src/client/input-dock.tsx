/**
 * 输入区 Dock：`conversation.input.dock`，在输入卡片上方渲染一条居中的状态行。
 *
 * session 级 list 插槽，注册时通过 `inject` 工厂拿到 sessionId。
 *
 * 几何抄 `ui-goal` 的 GoalBar：宽度扣掉 composer 的侧边留白与 dock 内缩，再用
 * `margin: 0 auto` 居中，与输入卡片同宽。内容超长时截断加省略号。
 *
 * 会话 id 是内部身份，不印在界面上——它只用来让这条 dock 随会话重建。这里改为
 * 显示一个本地可切换的示例状态，说明"这条位置能拿到 sessionId"。
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
  /** 当前会话的 id。仅用于确认这条插槽确实绑到了会话。 */
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

/** 输入卡片上方的居中状态行。 */
function InputDock(props: InputDockProps): React.ReactElement {
  const { t, sessionId } = props
  const [on, setOn] = React.useState(false)
  const label = sessionId === undefined ? t('inputDock.waiting') : t('inputDock.label')
  return (
    <div className="dtpl-dock">
      <button
        type="button"
        className="dtpl-btn"
        aria-pressed={on}
        onClick={() => { setOn(!on) }}
      >
        {label}
      </button>
      {on && <span className="dtpl-dock-text">{t('inputDock.detail')}</span>}
    </div>
  )
}
