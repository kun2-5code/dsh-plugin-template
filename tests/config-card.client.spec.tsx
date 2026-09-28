// @vitest-environment jsdom
/**
 * 配置表单的用户可见行为。
 *
 * 组件直接从源码相对路径导入，props 由本文件构造——不引入渲染机制，这样断言的
 * 是组件对 owner 传进来的值与写动作的反应，而不是插槽系统怎么接线。
 *
 * 覆盖的重点是三处曾经真实出错的地方：保存失败后表单不能被永久卡死、
 * 无效输入要挡住保存并让无障碍属性指到那条提示、把字段改回部署默认值要发
 * `unset` 而不是 `set`。
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { PluginConfigViewProps } from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfigCard } from '../src/client/config-card.tsx'
import { en } from '../src/client/locales.ts'

/**
 * 读英文字典，组件拿到的 `t` 与真实注册时一致。
 *
 * `t` 的类型必须用注册时的那个：`TranslateNS` 除了本插件的键，还接受共享常用
 * 词汇（如 `cancel`），所以手写一个更窄的签名过不了类型检查。
 */
const dictionary: Record<string, string> = en
const t: PropsLocale<'settings.pluginTemplate'>['t'] = (key) => dictionary[key] ?? key

/** owner 传进来的写动作签名，直接从组件的 props 类型推出来。 */
type Mutate = NonNullable<NonNullable<PluginConfigViewProps['form']>>['mutate']

/**
 * 一个签名与真实写动作一致的替身。
 * @param outcome - 布尔值表示宿主接受或拒绝；Error 表示传输失败。
 * @returns 可断言的替身。
 */
function mutateDouble(outcome: boolean | Error = true) {
  return vi.fn<Mutate>(() => (outcome instanceof Error
    ? Promise.reject(outcome)
    : Promise.resolve(outcome)))
}

/** 宿主已接受的默认值，也是组装层里的值。 */
const ACCEPTED = { greeting: 'Hello', maxRetries: 3, verbose: false }
const BASE = { greeting: 'Hello from dsh-plugin-template', maxRetries: 3, verbose: false }

/** `form` 的可调项。 */
interface FormOptions {
  /** 快照状态，默认 `ready`。 */
  status?: 'loading' | 'ready' | 'unavailable'
  /** 已接受的值；`undefined` 表示还没有收到值。 */
  value?: Record<string, unknown> | undefined
  /** 用户层。 */
  user?: Record<string, unknown>
  /** 文档是否可写。 */
  writable?: boolean
  /** 写入动作的替身。 */
  mutate?: ReturnType<typeof mutateDouble>
}

/**
 * 构造 owner 传进来的 form。
 * @param options - 快照各字段与写入动作。
 * @returns owner props 里的 form。
 */
function form(options: FormOptions = {}) {
  const mutate = options.mutate ?? mutateDouble()
  return {
    state: {
      status: options.status ?? 'ready',
      value: 'value' in options ? options.value : { ...ACCEPTED },
      base: { ...BASE },
      user: options.user ?? {},
      revision: 7,
      writable: options.writable ?? true,
      mode: 'host' as const,
    },
    mutate,
  }
}

/** 取出某个输入框。 */
function field(label: string): HTMLInputElement {
  const node = screen.getByLabelText(label)
  if (!(node instanceof HTMLInputElement)) throw new Error(`${label} is not an input`)
  return node
}

/** 取出保存按钮。 */
function saveButton(): HTMLButtonElement {
  const node = screen.getByRole('button', { name: en['card.save'] })
  if (!(node instanceof HTMLButtonElement)) throw new Error('save button not found')
  return node
}

afterEach(cleanup)

describe('configuration form states', () => {
  it('renders the one-line description when the owner asks for a summary', () => {
    render(<ConfigCard t={t} view="summary" form={form()} />)
    expect(screen.getByText(en['card.description'])).toBeDefined()
    expect(screen.queryByRole('button', { name: en['card.save'] })).toBeNull()
  })

  it('explains that the plugin is not loaded when the owner sends no form', () => {
    render(<ConfigCard t={t} view="page" />)
    expect(screen.getByText(en['card.unavailable'])).toBeDefined()
  })

  it('reports loading while the accepted values are still arriving', () => {
    render(<ConfigCard t={t} view="page" form={form({ status: 'loading', value: undefined })} />)
    expect(screen.getByText(en['card.loading'])).toBeDefined()
  })

  it('reports unavailable when the namespace is not served', () => {
    render(<ConfigCard t={t} view="page" form={form({ status: 'unavailable' })} />)
    expect(screen.getByText(en['card.unavailable'])).toBeDefined()
  })

  it('shows the accepted values in the three fields', () => {
    render(<ConfigCard t={t} view="page" form={form()} />)
    expect(field(en['field.greeting.label']).value).toBe('Hello')
    expect(field(en['field.maxRetries.label']).value).toBe('3')
    expect(field(en['field.verbose.label']).checked).toBe(false)
  })

  it('marks a field overridden when the user layer holds that key', () => {
    render(<ConfigCard t={t} view="page" form={form({ user: { greeting: 'Hey' } })} />)
    const overridden = screen.getAllByText(en['card.overridden'])
    expect(overridden).toHaveLength(1)
    // 徽标属于 greeting 字段，不应同时出现在 maxRetries 上。
    const greetingField = field(en['field.greeting.label']).closest('.dtpl-field')
    expect(greetingField?.textContent).toContain(en['card.overridden'])
    const retriesField = field(en['field.maxRetries.label']).closest('.dtpl-field')
    expect(retriesField?.textContent).not.toContain(en['card.overridden'])
  })

  it('disables editing and explains when the document is read-only', () => {
    render(<ConfigCard t={t} view="page" form={form({ writable: false })} />)
    expect(field(en['field.greeting.label']).disabled).toBe(true)
    expect(saveButton().disabled).toBe(true)
    expect(screen.getByText(en['card.readOnly'])).toBeDefined()
  })
})

describe('configuration form editing', () => {
  it('keeps save disabled while nothing differs from the accepted values', () => {
    render(<ConfigCard t={t} view="page" form={form()} />)
    expect(saveButton().disabled).toBe(true)
  })

  it('submits the edited field with the revision it read', async () => {
    const mutate = mutateDouble()
    render(<ConfigCard t={t} view="page" form={form({ mutate })} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: 'Hey' } })
    expect(saveButton().disabled).toBe(false)

    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        [{ op: 'set', path: ['greeting'], value: 'Hey' }],
        7,
      )
    })
  })

  it('submits every changed field in one mutation', async () => {
    const mutate = mutateDouble()
    render(<ConfigCard t={t} view="page" form={form({ mutate })} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: 'Hey' } })
    fireEvent.change(field(en['field.maxRetries.label']), { target: { value: '5' } })
    fireEvent.click(field(en['field.verbose.label']))

    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledTimes(1)
    })
    const ops = mutate.mock.calls[0]?.[0] as { op: string; path: string[]; value?: unknown }[]
    expect(ops).toEqual([
      { op: 'set', path: ['greeting'], value: 'Hey' },
      { op: 'set', path: ['maxRetries'], value: 5 },
      { op: 'set', path: ['verbose'], value: true },
    ])
  })

  it('unsets a field the user put back to the deployment default', async () => {
    const mutate = mutateDouble()
    // 用户层覆盖了 greeting，已接受的值因此是 'Hey'。
    render(<ConfigCard t={t} view="page" form={form({
      value: { greeting: 'Hey', maxRetries: 3, verbose: false },
      user: { greeting: 'Hey' },
      mutate,
    })} />)
    // 回到 base 的值就应当清除覆盖，而不是再写一次同样的值。
    fireEvent.change(field(en['field.greeting.label']), {
      target: { value: 'Hello from dsh-plugin-template' },
    })

    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith([{ op: 'unset', path: ['greeting'] }], 7)
    })
  })

  it('restores the accepted values on reset', () => {
    render(<ConfigCard t={t} view="page" form={form()} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: 'Hey' } })
    expect(saveButton().disabled).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: en['card.reset'] }))

    expect(field(en['field.greeting.label']).value).toBe('Hello')
    expect(saveButton().disabled).toBe(true)
  })
})

describe('configuration form validation', () => {
  it('blocks saving a negative retry count and links the message to the input', () => {
    render(<ConfigCard t={t} view="page" form={form()} />)
    fireEvent.change(field(en['field.maxRetries.label']), { target: { value: '-1' } })

    expect(saveButton().disabled).toBe(true)
    const input = field(en['field.maxRetries.label'])
    expect(input.getAttribute('aria-invalid')).toBe('true')
    // 提示与错误都要能被辅助技术读到：aria-describedby 列出两者。
    const described = (input.getAttribute('aria-describedby') ?? '').split(' ')
    const texts = described.map(id => document.getElementById(id)?.textContent)
    expect(texts).toContain(en['field.maxRetries.hint'])
    expect(texts).toContain(en['field.maxRetries.invalid'])
  })

  it('keeps the hint out of the input accessible name', () => {
    render(<ConfigCard t={t} view="page" form={form()} />)
    // 无障碍名称只应是标签文字，提示走 aria-describedby。
    expect(field(en['field.maxRetries.label']).getAttribute('aria-describedby'))
      .toBe('dtpl-max-retries-hint')
  })

  it('accepts an empty retry count as "use the deployment default"', async () => {
    const mutate = mutateDouble()
    render(<ConfigCard t={t} view="page" form={form({
      value: { greeting: 'Hello', maxRetries: 9, verbose: false },
      user: { maxRetries: 9 },
      mutate,
    })} />)
    fireEvent.change(field(en['field.maxRetries.label']), { target: { value: '' } })

    expect(saveButton().disabled).toBe(false)
    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith([{ op: 'unset', path: ['maxRetries'] }], 7)
    })
  })

  it('does not submit through the form element while a value is invalid', () => {
    const mutate = mutateDouble()
    const { container } = render(<ConfigCard t={t} view="page" form={form({ mutate })} />)
    // number 输入能存下 '1.5'，但重试次数必须是整数。
    fireEvent.change(field(en['field.maxRetries.label']), { target: { value: '1.5' } })
    expect(saveButton().disabled).toBe(true)

    // 回车或脚本提交绕过按钮的 disabled，save 自己必须把关。
    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    expect(mutate).not.toHaveBeenCalled()
  })
})

describe('configuration form save outcomes', () => {
  it('reports a refused write and stays usable so the user can correct it', async () => {
    const mutate = mutateDouble(false)
    render(<ConfigCard t={t} view="page" form={form({ mutate })} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: 'Hey' } })
    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe(en['card.saveFailed'])
    })
    // 表单必须还能用：草稿保留，按钮重新可用。
    expect(field(en['field.greeting.label']).value).toBe('Hey')
    expect(saveButton().disabled).toBe(false)
  })

  it('recovers from a transport failure instead of leaving saving stuck on', async () => {
    // 这是模板曾经的真实缺陷：mutate 抛错时没有 finally，saving 卡在 true，
    // 保存按钮永久禁用，草稿也拿不回来。
    const mutate = mutateDouble(new Error('transport down'))
    render(<ConfigCard t={t} view="page" form={form({ mutate })} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: 'Hey' } })
    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe(en['card.saveFailed'])
    })
    expect(field(en['field.greeting.label']).value).toBe('Hey')
    expect(saveButton().disabled).toBe(false)
    expect(screen.queryByRole('button', { name: en['card.saving'] })).toBeNull()
  })

  it('does not call mutate when the draft matches the accepted values', async () => {
    const mutate = mutateDouble()
    render(<ConfigCard t={t} view="page" form={form({ mutate })} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: 'Hey' } })
    fireEvent.click(screen.getByRole('button', { name: en['card.reset'] }))

    fireEvent.click(saveButton())

    expect(mutate).not.toHaveBeenCalled()
  })
})
