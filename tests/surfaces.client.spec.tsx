// @vitest-environment jsdom
/**
 * 命令行渲染与几个小控件的用户可见行为。
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { afterEach, describe, expect, it } from 'vitest'
import { AssistantAction } from '../src/client/assistant-actions.tsx'
import { CommandRow } from '../src/client/commandview.tsx'
import { InputRight } from '../src/client/input-right.tsx'
import { SidebarAction } from '../src/client/sidebar-action.tsx'
import { en } from '../src/client/locales.ts'

/** 读英文字典；类型取注册时那个，理由同 config-card 的 fixture。 */
const dictionary: Record<string, string> = en
const t: PropsLocale<'settings.pluginTemplate'>['t'] = (key) => dictionary[key] ?? key

afterEach(cleanup)

describe('command row', () => {
  /** 合成节点：命令名与参数在命令发出时才有值。 */
  const synthetic = { name: null, args: null, outcome: null }
  /** 完成节点。exactOptionalPropertyTypes 下 text 只能真的缺席，不能显式为 undefined。 */
  const done = (kind: 'success' | 'error', text?: string) => ({
    name: 'dsh-demo',
    args: ' hi',
    outcome: text === undefined ? { kind } : { kind, text },
  })

  it('shows the command name alone before the run node arrives', () => {
    render(<CommandRow t={t} node={synthetic} />)
    expect(screen.getByText('/dsh-demo')).toBeDefined()
    expect(screen.getByText(en['command.running'])).toBeDefined()
  })

  it('echoes the command with its arguments once the run node arrives', () => {
    render(<CommandRow t={t} node={done('success', 'echo: hi')} />)
    expect(screen.getByText('/dsh-demo hi')).toBeDefined()
  })

  it('reports a successful command with the text the host produced', () => {
    render(<CommandRow t={t} node={done('success', 'echo: hi')} />)
    expect(screen.getByText('echo: hi')).toBeDefined()
  })

  it('reports a failed command as failed, not as done', () => {
    // 模板曾经的真实缺陷：这里读的是 outcome.text，kind 从不参与判断，
    // 于是 kind 为 error 而 text 为空的命令会显示"完成"。
    render(<CommandRow t={t} node={done('error')} />)
    expect(screen.getByText(en['command.failed'])).toBeDefined()
    expect(screen.queryByText(en['command.succeeded'])).toBeNull()
  })

  it('prefers the host text over the generic label on failure', () => {
    render(<CommandRow t={t} node={done('error', 'denied by policy')} />)
    expect(screen.getByText('denied by policy')).toBeDefined()
  })

  it('does not claim success while the node itself is absent', () => {
    render(<CommandRow t={t} />)
    expect(screen.getByText(en['command.running'])).toBeDefined()
    expect(screen.queryByText(en['command.succeeded'])).toBeNull()
  })
})

describe('sidebar footer action', () => {
  it('shows its label as text in the expanded sidebar', () => {
    render(<SidebarAction t={t} wide />)
    expect(screen.getByText(en['sidebar.label'])).toBeDefined()
  })

  it('keeps an accessible name in rail mode, where no text is shown', () => {
    // rail 态下只剩状态点；没有 aria-label 的话这个按钮就没有名字。
    render(<SidebarAction t={t} wide={false} />)
    const button = screen.getByRole('button', { name: en['sidebar.label'] })
    expect(button).toBeDefined()
    expect(button.textContent).not.toContain(en['sidebar.label'])
  })

  it('exposes its pressed state', () => {
    render(<SidebarAction t={t} wide />)
    const button = screen.getByRole('button', { name: en['sidebar.label'] })
    expect(button.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('true')
  })
})

describe('input right control', () => {
  it('is an explicit non-submit button', () => {
    // 它渲染在输入卡片里；缺 type 会落成 submit。
    render(<InputRight t={t} />)
    expect(screen.getByRole('button').getAttribute('type')).toBe('button')
  })

  it('counts each press once, reading the latest value', () => {
    render(<InputRight t={t} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)
    expect(button.textContent).toContain('3')
  })
})

describe('per-message action', () => {
  it('addresses the message the owner passed, without printing its id', () => {
    render(<AssistantAction t={t} messageId="msg-42" />)
    const button = screen.getByRole('button', { name: en['message.save'] })
    expect(button.getAttribute('data-message-id')).toBe('msg-42')
    // 消息 id 是内部身份，不该出现在用户可见文字里。
    expect(button.textContent).not.toContain('msg-42')
  })

  it('changes its label when toggled, not only its colour', () => {
    render(<AssistantAction t={t} messageId="msg-42" />)
    fireEvent.click(screen.getByRole('button', { name: en['message.save'] }))
    expect(screen.getByRole('button', { name: en['message.saved'] })).toBeDefined()
  })
})
