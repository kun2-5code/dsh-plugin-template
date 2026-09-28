// @vitest-environment jsdom
/**
 * 配置表单的用户可见行为。
 *
 * fixture 从 `tests/support/config-forms.ts` 的 settings 服务出发：值先落进那份
 * 内存文档，经 `ConfigFormController` 投影，再由组件读出。上一版直接把一个 `form`
 * prop 塞给组件，于是"宿主到底会不会把 form 传下来"这一步被绕过去了——而
 * `plugins.bundle.config` 上宿主确实不传，真实运行里那一节永远显示"未加载"。
 * 现在这条路径本身是被测的。
 *
 * 覆盖的重点是四处曾经真实出错的地方：保存失败后表单不能被永久卡死、无效输入要
 * 挡住保存并让无障碍属性指到那条提示、把字段改回部署默认值要发 `unset`、
 * 以及保存要带上页面读到的那份 revision。
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { afterEach, describe, expect, it } from 'vitest'
import { ConfigCard } from '../src/client/config-card.tsx'
import { ConfigFormController, type ConfigFormFace, type ConfigSnapshot } from '../src/client/config-form.ts'
import { en } from '../src/client/locales.ts'
import { TestConfigForm, type NamespaceDocument, type WriteOutcome } from './support/config-forms.ts'

/**
 * 读英文字典，组件拿到的 `t` 与真实注册时一致。
 *
 * `t` 的类型必须用注册时的那个：`TranslateNS` 除了本插件的键，还接受共享常用
 * 词汇（如 `cancel`），所以手写一个更窄的签名过不了类型检查。
 */
const dictionary: Record<string, string> = en
const t: PropsLocale<'settings.pluginTemplate'>['t'] = (key) => dictionary[key] ?? key

/** 组装层的值，来自 cordis.patch.yml 那一行。 */
const BASE = { greeting: 'Hello from dsh-plugin-template', maxRetries: 3, verbose: false }

/** 宿主默认接受的一份文档。 */
const DEFAULT_DOCUMENT: NamespaceDocument = { base: BASE, user: {} }

/**
 * 组件没读的标准席位。
 *
 * 返回 `never` 的零参函数可以赋给任何选择器钩子，所以不需要断言；而且一旦组件
 * 真去读它，测试会当场炸掉，而不是悄悄拿到 undefined。
 */
function unusedStandardHook(): never {
  throw new Error('the config card fixture does not provide global state')
}

/**
 * 装好一份 settings scope、控制器，以及组件要拿到的 props。
 *
 * 框架钩子按惯例喂桩：组件测试直接给 props，断言行为而不引入渲染机制。
 * @param document - 命名空间文档。
 * @param outcome - 宿主对写入的回应。
 * @param view - owner 要的视图。
 * @returns scope、控制器与 props。
 */
function bench(
  document: NamespaceDocument = DEFAULT_DOCUMENT,
  outcome: WriteOutcome = 'accept',
  view: 'page' | 'summary' = 'page',
  face?: ConfigFormFace,
) {
  const form = new TestConfigForm<Record<string, unknown>>(document.base, document.user, document.writable)
  form.outcome = outcome
  const controller = new ConfigFormController(form)
  const injected = face ?? controller.inject()
  const source = injected.hooks.templateConfig
  return {
    form,
    controller,
    props: {
      view,
      t,
      useTemplateConfig: <S,>(selector: (state: ConfigSnapshot) => S): S => selector(source.getSnapshot()),
      templateConfig: source,
      submit: injected.submit,
      useResource: unusedStandardHook,
      useWorkspaces: unusedStandardHook,
      usePanelInfo: unusedStandardHook,
    },
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
    const { props, controller } = bench(DEFAULT_DOCUMENT, 'accept', 'summary')
    render(<ConfigCard {...props} />)
    expect(screen.getByText(en['card.description'])).toBeDefined()
    expect(screen.queryByRole('button', { name: en['card.save'] })).toBeNull()
    controller.dispose()
  })

  it('reports loading while the namespace is still being served', () => {
    // 先把 scope 切到加载中再构造模型：控制器构造时读一次首份快照，之后靠订阅
    // 跟进变化，所以这里顺带验了它认得出"正在加载"这份状态。
    const form = new TestConfigForm<Record<string, unknown>>(DEFAULT_DOCUMENT.base)
    form.setState('loading')
    const controller = new ConfigFormController(form)
    const { props } = bench(DEFAULT_DOCUMENT, 'accept', 'page', controller.inject())
    render(<ConfigCard {...props} />)
    expect(screen.getByText(en['card.loading'])).toBeDefined()
    controller.dispose()
  })

  it('reports unavailable when the namespace is not served', () => {
    const form = new TestConfigForm<Record<string, unknown>>(DEFAULT_DOCUMENT.base).unserved()
    const controller = new ConfigFormController(form)
    const { props } = bench(DEFAULT_DOCUMENT, 'accept', 'page', controller.inject())
    render(<ConfigCard {...props} />)
    expect(screen.getByText(en['card.unavailable'])).toBeDefined()
    controller.dispose()
  })

  it('shows the accepted values that came from the settings service', () => {
    const { props, controller } = bench()
    render(<ConfigCard {...props} />)
    expect(field(en['field.greeting.label']).value).toBe(BASE.greeting)
    expect(field(en['field.maxRetries.label']).value).toBe('3')
    expect(field(en['field.verbose.label']).checked).toBe(false)
    controller.dispose()
  })

  it('picks up a value accepted from elsewhere without being told', () => {
    const { props, form, controller } = bench()
    render(<ConfigCard {...props} />)
    form.externallySet('greeting', 'Set elsewhere')
    // 组件通过宿主绑定的 useTemplateConfig 读快照；测试里那个桩直接读当前值，
    // 所以这一条验的是模型确实把 scope 的变化投影了出来。
    expect(props.templateConfig.getSnapshot().value.greeting).toBe('Set elsewhere')
    controller.dispose()
  })

  it('marks a field overridden when the user layer holds that key', () => {
    const { props, controller } = bench({ base: BASE, user: { greeting: 'Hey' } })
    render(<ConfigCard {...props} />)
    expect(screen.getAllByText(en['card.overridden'])).toHaveLength(1)
    const greetingField = field(en['field.greeting.label']).closest('.dtpl-field')
    expect(greetingField?.textContent).toContain(en['card.overridden'])
    const retriesField = field(en['field.maxRetries.label']).closest('.dtpl-field')
    expect(retriesField?.textContent).not.toContain(en['card.overridden'])
    controller.dispose()
  })

  it('disables editing and explains when the document is read-only', () => {
    const { props, controller } = bench({ ...DEFAULT_DOCUMENT, writable: false })
    render(<ConfigCard {...props} />)
    expect(field(en['field.greeting.label']).disabled).toBe(true)
    expect(saveButton().disabled).toBe(true)
    expect(screen.getByText(en['card.readOnly'])).toBeDefined()
    controller.dispose()
  })
})

describe('configuration form editing', () => {
  it('keeps save disabled while nothing differs from the accepted values', () => {
    const { props, controller } = bench()
    render(<ConfigCard {...props} />)
    expect(saveButton().disabled).toBe(true)
    controller.dispose()
  })

  it('submits the edited field with the revision the page read', async () => {
    const { props, form, controller } = bench()
    render(<ConfigCard {...props} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: 'Hey' } })
    expect(saveButton().disabled).toBe(false)

    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(form.writes).toHaveLength(1)
    })
    expect(form.writes[0]?.ops).toEqual([{ op: 'set', path: ['greeting'], value: 'Hey' }])
    expect(form.writes[0]?.expectedRevision).toBe(1)
    controller.dispose()
  })

  it('submits every changed field in one mutation', async () => {
    const { props, form, controller } = bench()
    render(<ConfigCard {...props} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: 'Hey' } })
    fireEvent.change(field(en['field.maxRetries.label']), { target: { value: '5' } })
    fireEvent.click(field(en['field.verbose.label']))

    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(form.writes).toHaveLength(1)
    })
    expect(form.writes[0]?.ops).toEqual([
      { op: 'set', path: ['greeting'], value: 'Hey' },
      { op: 'set', path: ['maxRetries'], value: 5 },
      { op: 'set', path: ['verbose'], value: true },
    ])
    controller.dispose()
  })

  it('unsets a field the user put back to the deployment default', async () => {
    const { props, form, controller } = bench({ base: BASE, user: { greeting: 'Hey' } })
    render(<ConfigCard {...props} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: BASE.greeting } })

    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(form.writes).toHaveLength(1)
    })
    expect(form.writes[0]?.ops).toEqual([{ op: 'unset', path: ['greeting'] }])
    controller.dispose()
  })

  it('restores the accepted values on reset', () => {
    const { props, controller } = bench()
    render(<ConfigCard {...props} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: 'Hey' } })
    expect(saveButton().disabled).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: en['card.reset'] }))

    expect(field(en['field.greeting.label']).value).toBe(BASE.greeting)
    expect(saveButton().disabled).toBe(true)
    controller.dispose()
  })

  it('does not resubmit an edit the host already accepted', async () => {
    const { props, form, controller } = bench()
    render(<ConfigCard {...props} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: 'Hey' } })
    fireEvent.click(saveButton())
    await waitFor(() => { expect(form.writes).toHaveLength(1) })
    expect(saveButton().disabled).toBe(true)
    controller.dispose()
  })
})

describe('configuration form validation', () => {
  it('blocks saving a negative retry count and links the message to the input', () => {
    const { props, controller } = bench()
    render(<ConfigCard {...props} />)
    fireEvent.change(field(en['field.maxRetries.label']), { target: { value: '-1' } })

    expect(saveButton().disabled).toBe(true)
    const input = field(en['field.maxRetries.label'])
    expect(input.getAttribute('aria-invalid')).toBe('true')
    // 提示与错误都要能被辅助技术读到：aria-describedby 列出两者。
    const described = (input.getAttribute('aria-describedby') ?? '').split(' ')
    const texts = described.map(id => document.getElementById(id)?.textContent)
    expect(texts).toContain(en['field.maxRetries.hint'])
    expect(texts).toContain(en['field.maxRetries.invalid'])
    controller.dispose()
  })

  it('keeps the hint out of the input accessible name', () => {
    const { props, controller } = bench()
    render(<ConfigCard {...props} />)
    // 无障碍名称只应是标签文字，提示走 aria-describedby。
    expect(field(en['field.maxRetries.label']).getAttribute('aria-describedby'))
      .toBe('dtpl-max-retries-hint')
    controller.dispose()
  })

  it('accepts an empty retry count as "use the deployment default"', async () => {
    const { props, form, controller } = bench({ base: BASE, user: { maxRetries: 9 } })
    render(<ConfigCard {...props} />)
    fireEvent.change(field(en['field.maxRetries.label']), { target: { value: '' } })

    expect(saveButton().disabled).toBe(false)
    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(form.writes).toHaveLength(1)
    })
    expect(form.writes[0]?.ops).toEqual([{ op: 'unset', path: ['maxRetries'] }])
    controller.dispose()
  })

  it('does not submit through the form element while a value is invalid', () => {
    const { props, form, controller } = bench()
    const { container } = render(<ConfigCard {...props} />)
    // number 输入能存下 '1.5'，但重试次数必须是整数。
    fireEvent.change(field(en['field.maxRetries.label']), { target: { value: '1.5' } })
    expect(saveButton().disabled).toBe(true)

    // 回车或脚本提交绕过按钮的 disabled，save 自己必须把关。
    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    expect(form.writes).toHaveLength(0)
    controller.dispose()
  })
})

describe('configuration form save outcomes', () => {
  it('reports a refused write and stays usable so the user can correct it', async () => {
    const { props, controller } = bench(DEFAULT_DOCUMENT, 'refuse')
    render(<ConfigCard {...props} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: 'Hey' } })
    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe(en['card.saveFailed'])
    })
    // 表单必须还能用：草稿保留，按钮重新可用。
    expect(field(en['field.greeting.label']).value).toBe('Hey')
    expect(saveButton().disabled).toBe(false)
    controller.dispose()
  })

  it('recovers from a transport failure instead of leaving saving stuck on', async () => {
    // 这是模板曾经的真实缺陷：mutate 抛错时没有 finally，saving 卡在 true，
    // 保存按钮永久禁用，草稿也拿不回来。
    const { props, controller } = bench(DEFAULT_DOCUMENT, 'throw')
    render(<ConfigCard {...props} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: 'Hey' } })
    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe(en['card.saveFailed'])
    })
    expect(field(en['field.greeting.label']).value).toBe('Hey')
    expect(saveButton().disabled).toBe(false)
    expect(screen.queryByRole('button', { name: en['card.saving'] })).toBeNull()
    controller.dispose()
  })

  it('does not submit when the draft matches the accepted values', () => {
    const { props, form, controller } = bench()
    render(<ConfigCard {...props} />)
    fireEvent.change(field(en['field.greeting.label']), { target: { value: 'Hey' } })
    fireEvent.click(screen.getByRole('button', { name: en['card.reset'] }))

    fireEvent.click(saveButton())

    expect(form.writes).toHaveLength(0)
    controller.dispose()
  })
})
