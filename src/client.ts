/**
 * dsh-plugin-template 的浏览器半边（client plugin）：在 设置 → 插件 → Configurable
 * 里注册一张配置卡片，让 greeting / maxRetries / verbose 可以在 GUI 里点击修改。
 *
 * 工作方式：
 * - host 半边（src/index.ts）用 installSettingsSection 把配置注册成 settings 命名空间
 *   `dsh-plugin-template`（cordis.yml 配置是 composition base 层）；
 * - 本文件在 `settings.plugin.item` 插槽注册卡片，通过 `settingsScope` 服务绑定该
 *   命名空间，读取解析值、展示表单、把用户改动写进用户设置文档（revision 防并发）；
 * - host 半边实时读取命名空间解析值，因此保存后立即生效。
 *
 * 关于"开箱即用"：卡片在任何状态下都渲染。harness 的 Web 网关只把白名单内的
 * settings 命名空间暴露给设置面板（WEB_SETTINGS_NAMESPACES，见
 * packages/host/apiproxy/src/api-proxy.ts），第三方命名空间不在名单时
 * `settings.describe` 回答 settings-not-exposed——此时卡片渲染"未暴露"说明并给出
 * 两条出路，而不是静默消失。该限制只影响卡片的可编辑性，不影响 host 半边
 * （greet 工具仍实时读取配置）；详见 README 的 "The config card on a stock
 * harness" 一节。
 *
 * UI 结构参考 harness 内置插件的设置卡片（packages/client/ui-settings-plugins：
 * WebSearchCard / PluginCard / ValueField / card-form）：
 * - 可折叠卡片头：名称 + 描述 + "未保存"徽标（折叠时也可见）+ 展开箭头；
 * - 暂存表单模型：编辑只进草稿，Save 是唯一的写入点，Discard 丢弃草稿，
 *   无效输入阻止保存并在字段下提示；保存后从 Host 接受的结果回读；
 * - 字段行：标签 + "已覆盖"徽标 + 重置（回退 composition base 层）+ 控件 + 提示；
 * - 颜色全部走主题变量（--dsw-alias-*，见 ui-theme/src/styles/design-platform.css），
 *   深浅色自动适配。
 *
 * 加载契约：与 host 半边同包，经 package.json 的 `dsh.client` 声明 +
 * `exports["./client"]` 被 dsh 的 client-modules 发现，浏览器加载构建产物
 * lib/client.js（CJS + __ModuleLoader__.load 握手，见 tsdown.config.ts）。
 * 注意：client 半边只在插件以"包名"安装进 profile 时才会加载；`--patch` overlay
 * 用绝对源码路径挂载的插件行不会加载 client 半边。
 *
 * 依赖纪律：运行时只 import react（浏览器平台模块表提供），其余一律走 ctx 服务，
 * 不直接 import 任何 @deepseek-ai 客户端包（避免跨插件值导入与版本分裂）。
 * 下面是各服务的最小结构类型，运行时实例来自 ctx；完整契约见
 * dsh-client-runtime 的 SettingsScope 与 dsh-client-ui-settings 的 SettingsScopeBinder。
 * @module dsh-plugin-template/client
 */

import React from 'react'
import type { Context } from '@deepseek-ai/cordis'

// ---- 最小结构类型（运行时实例来自 ctx 服务）----

/** 一个 settings 命名空间在浏览器侧的同步快照（SettingsScopeSnapshot 的结构子集）。 */
interface SettingsSnapshot {
  status: 'loading' | 'ready' | 'unavailable'
  /** 最近一次 schema 解析后的值（schema 默认 → base → 用户层）；首个接受值之前为 undefined。 */
  value: unknown
  /** 原始用户层（已存储）；字段在此出现即视为"用户覆盖"。 */
  user: unknown
  /** Host 文档是否可写（memory 模式永远不可写）。 */
  writable: boolean
}

/** 浏览器侧 settings scope 的最小面（dsh-client-runtime SettingsScope 的结构子集）。 */
interface SettingsScopeLike {
  getSnapshot(): SettingsSnapshot
  /** 观察快照替换；返回移除监听器的 disposer。 */
  subscribe(listener: () => void): () => void
  /** 写一个字段（自带 revision 围栏，写失败会重读 Host 状态）。 */
  set(field: string, value: unknown): Promise<void>
  /** 清除一个字段，让它重新继承 composition base 层。 */
  unset(field: string): Promise<void>
}

/** settingsScope 服务的最小面（dsh-client-ui-settings SettingsScopeBinder）。 */
interface SettingsScopeBinderLike {
  bind(spec: { namespace: string }): SettingsScopeLike
}

/** 浏览器插槽服务的最小面（dsh-client-ui-slots 的结构子集；完整类型由该包的声明合并提供）。 */
interface SlotsLike {
  /** 等目标插槽被声明后注册贡献；返回移除该贡献的 disposer。 */
  inject(name: string, register: () => unknown): void
  /** 向一个已声明的插槽注册一项贡献（组件或返回元素的渲染函数）。 */
  register(
    options: { name: string; id: string; order: number; label: string },
    component: () => React.ReactElement,
  ): unknown
}

// 'slots' 是 inject 声明的必选依赖，按约定应通过 ctx.slots 使用；cordis 原生
// Context 没有 slots 成员（其类型由 dsh-client-ui-slots 包的声明合并提供），而本
// 模板不 import 任何 @deepseek-ai 客户端包（依赖纪律），因此用本地最小结构类型
// 做声明合并，运行时实例来自 ctx。
declare module '@deepseek-ai/cordis' {
  interface Context {
    /** 浏览器插槽服务（运行时由 client-ui-slots 提供）。 */
    slots: SlotsLike
  }
}

/** 本文件只注入一个 <style>；tsconfig 没有 dom lib，这里声明用到的 DOM 形状。 */
declare const document: {
  createElement(tag: 'style'): { dataset: Record<string, string>; textContent: string }
  head: { appendChild(node: { dataset: Record<string, string>; textContent: string }): void }
}

// ---- 字段声明 ----

type FieldKind = 'text' | 'number' | 'checkbox'

interface FieldSpec {
  field: string
  kind: FieldKind
  label: string
  hint: string
  /** 无效草稿时的提示（number 用）。 */
  invalidLabel?: string
}

const FIELDS: readonly FieldSpec[] = [
  {
    field: 'greeting',
    kind: 'text',
    label: '打招呼文案',
    hint: 'greet 工具返回时使用的前缀文案。',
  },
  {
    field: 'maxRetries',
    kind: 'number',
    label: '最大重试次数',
    hint: '非负整数；用于示例心跳日志。',
    invalidLabel: '必须是非负整数',
  },
  {
    field: 'verbose',
    kind: 'checkbox',
    label: '打印调试日志',
    hint: '开启后插件在事件与心跳时输出日志。',
  },
]

// ---- 暂存表单模型（语义参考 harness card-form.ts）----

/** 一个字段的暂存编辑：文本字段存 {edit|clear}，开关字段存 {toggle}。 */
type StagedEdit =
  | { kind: 'edit'; text: string }
  | { kind: 'clear' }
  | { kind: 'toggle'; value: boolean }

/** 表单对某个字段的渲染状态（供字段行消费）。 */
interface FieldState {
  /** 文本类字段的草稿/当前值。 */
  text?: string
  /** 开关类字段的选中状态。 */
  checked?: boolean
  /** 保存后是否会留下用户层覆盖（"已覆盖"徽标）。 */
  overridden: boolean
  /** 草稿不是该字段可接受的值。 */
  invalid: boolean
}

/** 卡片级状态（与 harness PluginCard 的 CardShell 对应）。 */
interface CardShell {
  /** 命名空间快照状态；ready 才渲染可编辑表单，其余状态渲染说明卡片。 */
  status: 'loading' | 'ready' | 'unavailable'
  /** 是否为可编辑状态（status === 'ready'）。 */
  available: boolean
  writable: boolean
  dirty: boolean
  invalid: boolean
  saving: boolean
  failed: boolean
}

/** 一次保存要执行的写操作；run 为 undefined 表示该字段草稿无效。 */
interface PlannedWrite {
  field: string
  run: (() => Promise<boolean>) | undefined
}

/** 暂存表单：编辑只进草稿，Save 是唯一写入点，保存后从 Host 接受的结果回读。 */
class CardForm {
  private readonly staged = new Map<string, StagedEdit>()
  private readonly listeners = new Set<() => void>()
  private saving = false
  private failed = false

  constructor(private readonly scope: SettingsScopeLike) {
    scope.subscribe(() => this.publish())
  }

  /** 订阅表单变化（草稿变更或快照刷新）；返回取消订阅的 disposer。 */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** 卡片级状态。 */
  shell(): CardShell {
    const snapshot = this.scope.getSnapshot()
    const plan = this.plan()
    return {
      status: snapshot.status,
      available: snapshot.status === 'ready',
      writable: snapshot.writable,
      dirty: plan.length > 0,
      invalid: plan.some((item) => item.run === undefined),
      saving: this.saving,
      failed: this.failed,
    }
  }

  /** 一个字段的渲染状态。 */
  fieldState(field: string): FieldState {
    const spec = this.spec(field)
    const staged = this.staged.get(field)
    const section = this.sectionValue()
    const stored = this.stored(field)
    if (spec.kind === 'checkbox') {
      if (staged === undefined) return { checked: section[field] === true, overridden: stored, invalid: false }
      if (staged.kind === 'toggle') return { checked: staged.value, overridden: true, invalid: false }
      return { checked: section[field] === true, overridden: false, invalid: false }
    }
    if (staged === undefined) {
      return { text: this.format(spec, section[field]), overridden: stored, invalid: false }
    }
    if (staged.kind === 'clear') {
      return { text: this.format(spec, section[field]), overridden: false, invalid: false }
    }
    // 文本字段只暂存 { kind: 'edit' }（toggle 只属于 checkbox，且上面已返回）。
    if (staged.kind !== 'edit') {
      return { text: '', overridden: false, invalid: false }
    }
    const parsed = this.parse(spec, staged.text)
    return { text: staged.text, overridden: parsed?.kind === 'set', invalid: parsed === undefined }
  }

  /** 暂存一次文本编辑。 */
  edit(field: string, text: string): void {
    this.staged.set(field, { kind: 'edit', text })
    this.failed = false
    this.publish()
  }

  /** 暂存一次开关切换。 */
  toggle(field: string, value: boolean): void {
    this.staged.set(field, { kind: 'toggle', value })
    this.failed = false
    this.publish()
  }

  /** 暂存一次清除：保存时 unset，字段回退到 composition base 层。 */
  resetField(field: string): void {
    this.staged.set(field, { kind: 'clear' })
    this.failed = false
    this.publish()
  }

  /** 丢弃所有暂存编辑。 */
  discard(): void {
    if (this.staged.size === 0 && !this.failed) return
    this.staged.clear()
    this.failed = false
    this.publish()
  }

  /**
   * 写入每一个暂存编辑，再从 Host 接受的结果回读。
   * 失败时保留草稿，让用户改正而不是重打。
   */
  async save(): Promise<void> {
    const plan = this.plan()
    const writes = plan.flatMap((item) => item.run === undefined ? [] : [item.run])
    if (plan.length === 0 || this.saving || writes.length !== plan.length) return
    this.saving = true
    this.failed = false
    this.publish()
    let landed = true
    for (const write of writes) {
      landed = await write() && landed
    }
    if (landed) this.staged.clear()
    this.saving = false
    this.failed = !landed
    this.publish()
  }

  /** 一次保存会执行的写操作，按暂存顺序。 */
  private plan(): PlannedWrite[] {
    const plan: PlannedWrite[] = []
    for (const [field, staged] of this.staged) {
      const spec = this.spec(field)
      if (staged.kind === 'toggle') {
        plan.push({ field, run: () => this.store(field, staged.value) })
        continue
      }
      if (staged.kind === 'clear') {
        if (this.stored(field)) plan.push({ field, run: () => this.clear(field) })
        continue
      }
      if (staged.text === this.format(spec, this.sectionValue()[field])) continue
      const parsed = this.parse(spec, staged.text)
      if (parsed === undefined) plan.push({ field, run: undefined })
      else if (parsed.kind === 'clear') plan.push({ field, run: () => this.clear(field) })
      else plan.push({ field, run: () => this.store(field, parsed.value) })
    }
    return plan
  }

  private async store(field: string, value: unknown): Promise<boolean> {
    await this.scope.set(field, value)
    return this.stored(field) && this.sectionValue()[field] === value
  }

  private async clear(field: string): Promise<boolean> {
    await this.scope.unset(field)
    return !this.stored(field)
  }

  private sectionValue(): Record<string, unknown> {
    const value = this.scope.getSnapshot().value
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {}
  }

  private stored(field: string): boolean {
    const user = this.scope.getSnapshot().user
    return typeof user === 'object' && user !== null && Object.prototype.hasOwnProperty.call(user, field)
  }

  private spec(field: string): FieldSpec {
    const spec = FIELDS.find((candidate) => candidate.field === field)
    if (spec === undefined) throw new Error(`card has no field ${field}`)
    return spec
  }

  private format(spec: FieldSpec, value: unknown): string {
    if (spec.kind === 'number') return typeof value === 'number' ? String(value) : ''
    return typeof value === 'string' ? value : ''
  }

  private parse(
    spec: FieldSpec,
    text: string,
  ): { kind: 'set'; value: unknown } | { kind: 'clear' } | undefined {
    if (spec.kind === 'number') {
      if (text === '') return undefined
      const value = Number(text)
      if (!Number.isInteger(value) || value < 0) return undefined
      return { kind: 'set', value }
    }
    if (text === '') return { kind: 'clear' }
    return { kind: 'set', value: text }
  }

  private publish(): void {
    for (const listener of this.listeners) listener()
  }
}

// ---- 卡片 UI ----

/** 本插件的 settings 命名空间（与 host 半边 installSettingsSection 一致）。 */
const NAMESPACE = 'dsh-plugin-template'

/** 依赖的服务：slots 就绪后本插件才会加载。 */
export const inject = ['slots']

/**
 * 客户端插件主体：绑定命名空间、构建暂存表单、注册配置卡片到 `settings.plugin.item` 插槽。
 * 卡片在任意状态下都渲染：settingsScope 缺失、命名空间未暴露、读取中都会渲染说明卡片，
 * 只有命名空间可用时才渲染可编辑表单（详见 ConfigCard 的状态矩阵）。
 * @param ctx - 客户端根上下文。
 */
export function apply(ctx: Context): void {
  // settingsScope 是设置界面提供的可选能力；缺失时卡片渲染"未挂载"状态而不是消失。
  let form: CardForm | undefined
  const settingsScope: SettingsScopeBinderLike | undefined = ctx.get('settingsScope')
  if (settingsScope === undefined) {
    console.warn(`[${NAMESPACE}] settingsScope service absent; the config card shows the unmounted state`)
  } else {
    form = new CardForm(settingsScope.bind({ namespace: NAMESPACE }))
  }

  injectStyles()

  // 'slots' 是 inject 声明的必选依赖，直接使用 ctx.slots（可选服务才用 ctx.get）。
  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register(
    { name: 'settings.plugin.item', id: NAMESPACE, order: 30, label: NAMESPACE },
    () => React.createElement(ConfigCard, { form }),
  ))
}

/**
 * 配置卡片：可折叠头 + 暂存表单 + 保存/放弃。
 *
 * hook 纪律：所有 hook（useReducer / useState / useEffect）必须位于任何提前
 * return 之前——命名空间从 loading 变为 ready 时组件会重渲染，若 useState 写在
 * "不可用即 return null" 之后，hook 数量会从 2 变成 3，React 抛出 "Rendered
 * more hooks than during the previous render" 直接把卡片打崩（这正是本文件
 * 曾经的 bug）。
 *
 * 状态矩阵（卡片永远渲染，绝不静默消失）：
 * - form 为 undefined：settingsScope 服务未挂载（非 web profile），渲染"未挂载"说明；
 * - status 'loading'：仍在读取命名空间，渲染"正在读取"；
 * - status 'unavailable'：命名空间未对 Web 暴露（harness 的 WEB_SETTINGS_NAMESPACES
 *   白名单，见 README）或设置服务未注册，渲染"未暴露"说明与两条出路；
 * - status 'ready'：渲染可编辑表单。
 */
function ConfigCard({ form }: { form: CardForm | undefined }): React.ReactElement | null {
  const [, forceRender] = React.useReducer((count: number) => count + 1, 0)
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => (form === undefined ? undefined : form.subscribe(forceRender)), [form])

  if (form === undefined) {
    return statusCard(
      '配置卡片未挂载',
      '设置服务（settingsScope）未提供；web profile（dsh-web-app）自带该服务，请用 dsh web 启动。',
    )
  }

  const shell = form.shell()
  if (!shell.available) {
    if (shell.status === 'unavailable') {
      return statusCard(
        `配置命名空间 ${NAMESPACE} 未对 Web 暴露`,
        'harness 的 Web 网关只向设置面板暴露白名单内的 settings 命名空间（WEB_SETTINGS_NAMESPACES，'
        + '见 packages/host/apiproxy/src/api-proxy.ts），本命名空间不在名单里，因此 `settings.describe` '
        + '回答 settings-not-exposed。host 半边不受影响：greet 工具仍实时读取配置。',
        '要让本卡片可编辑：在 harness 的 WEB_SETTINGS_NAMESPACES 里加一行 '
        + `${NAMESPACE} 后重建/重启 harness；或等 harness 把暴露声明移进 `
        + 'settings.register()（源码注释标注的 deferred work）。',
      )
    }
    return statusCard('正在读取配置…', '命名空间数据到达后本卡片会自动切换为可编辑状态。')
  }

  const blocked = !shell.dirty || shell.invalid || shell.saving

  return React.createElement(
    'li',
    { className: open ? 'dtpl-card dtpl-card-open' : 'dtpl-card' },
    React.createElement(
      'button',
      {
        type: 'button',
        className: 'dtpl-header',
        'aria-expanded': open,
        onClick: () => setOpen(!open),
      },
      React.createElement(
        'span',
        { className: 'dtpl-head-text' },
        React.createElement('span', { className: 'dtpl-name' }, 'dsh-plugin-template'),
        React.createElement('span', { className: 'dtpl-description' }, '示例插件的配置：greeting / maxRetries / verbose'),
      ),
      shell.dirty ? React.createElement('span', { className: 'dtpl-pending' }, '未保存') : null,
      React.createElement('span', { className: open ? 'dtpl-chevron dtpl-chevron-open' : 'dtpl-chevron' }),
    ),
    open
      ? React.createElement(
        'div',
        { className: 'dtpl-body' },
        !shell.writable
          ? React.createElement('p', { className: 'dtpl-read-only', role: 'status' }, '当前设置文档只读（memory 模式或只读 provider）')
          : null,
        FIELDS.map((spec) => renderField(form, spec, shell)),
        React.createElement(
          'div',
          { className: 'dtpl-footer' },
          shell.failed
            ? React.createElement('p', { className: 'dtpl-failed', role: 'status' }, '保存失败，草稿已保留，请修正后重试')
            : null,
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dtpl-discard',
              disabled: !shell.dirty || shell.saving,
              onClick: () => form.discard(),
            },
            '放弃',
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dtpl-save',
              disabled: blocked,
              onClick: () => { void form.save() },
            },
            shell.saving ? '保存中…' : '保存',
          ),
        ),
      )
      : null,
  )
}

/** 渲染一张只读状态卡片（未挂载 / 读取中 / 未暴露），说明而非静默消失。 */
function statusCard(title: string, body: string, remedy?: string): React.ReactElement {
  return React.createElement(
    'li',
    { className: 'dtpl-card' },
    React.createElement(
      'div',
      { className: 'dtpl-status' },
      React.createElement('p', { className: 'dtpl-status-title' }, title),
      React.createElement('p', { className: 'dtpl-status-body' }, body),
      remedy === undefined
        ? null
        : React.createElement('p', { className: 'dtpl-status-body' }, remedy),
    ),
  )
}

/** 渲染一个字段行：标签 + 覆盖徽标/重置 + 控件 + 提示。 */
function renderField(form: CardForm, spec: FieldSpec, shell: CardShell): React.ReactElement {
  const state = form.fieldState(spec.field)
  const disabled = !shell.writable

  let control: React.ReactElement
  if (spec.kind === 'checkbox') {
    control = React.createElement('input', {
      id: `dtpl-${spec.field}`,
      type: 'checkbox',
      checked: state.checked === true,
      disabled,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        form.toggle(spec.field, (event.target as unknown as { checked: boolean }).checked),
    })
  } else {
    control = React.createElement('input', {
      id: `dtpl-${spec.field}`,
      className: state.invalid ? 'dtpl-input dtpl-input-invalid' : 'dtpl-input',
      type: 'text',
      ...(spec.kind === 'number' ? { inputMode: 'numeric' as const } : {}),
      ...(state.invalid ? { 'aria-invalid': true } : {}),
      value: state.text ?? '',
      disabled,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        form.edit(spec.field, (event.target as unknown as { value: string }).value),
    })
  }

  return React.createElement(
    'div',
    { className: 'dtpl-field' },
    React.createElement(
      'div',
      { className: 'dtpl-field-head' },
      React.createElement('label', { className: 'dtpl-label', htmlFor: `dtpl-${spec.field}` }, spec.label),
      state.overridden
        ? React.createElement(
          'span',
          { className: 'dtpl-badges' },
          React.createElement('span', { className: 'dtpl-badge' }, '已覆盖'),
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dtpl-reset',
              disabled,
              onClick: () => form.resetField(spec.field),
            },
            '重置',
          ),
        )
        : null,
    ),
    control,
    React.createElement(
      'p',
      { className: state.invalid ? 'dtpl-invalid' : 'dtpl-hint' },
      state.invalid ? spec.invalidLabel ?? '无效的值' : spec.hint,
    ),
  )
}

// ---- 样式：一次性注入 <style>（class 前缀 dtpl-，颜色全走主题变量）----

let stylesInjected = false

function injectStyles(): void {
  if (stylesInjected || typeof document === 'undefined') return
  stylesInjected = true
  const tag = document.createElement('style')
  tag.dataset.plugin = NAMESPACE
  tag.dataset.pluginCss = `${NAMESPACE}/card`
  tag.textContent = `
.dtpl-card {
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-3);
  transition: border-color .16s, background .16s;
}
.dtpl-card:hover { border-color: var(--dsw-alias-label-dimmed); }
.dtpl-card-open { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-label-dimmed); }
.dtpl-header {
  width: 100%; appearance: none; border: 0; background: none; font: inherit;
  color: inherit; text-align: left; cursor: pointer;
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 12px;
}
.dtpl-header:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }
.dtpl-head-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.dtpl-name { font-size: 15px; font-weight: 600; line-height: 1.4; color: var(--dsw-alias-label-primary); }
.dtpl-description { font-size: 13px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); }
.dtpl-chevron {
  flex: none; color: var(--dsw-alias-label-tertiary); transition: transform .16s;
  width: 8px; height: 8px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg); margin: -3px 4px 0 0;
}
.dtpl-chevron-open { transform: rotate(225deg); }
.dtpl-body { border-top: 1px solid var(--dsw-alias-border-l2); margin: 0 16px; padding-bottom: 8px; }
.dtpl-read-only { margin: 12px 0 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); }
.dtpl-pending {
  flex: none; border-radius: 999px; padding: 1px 8px; font-size: 11px; line-height: 17px;
  font-weight: 500; white-space: nowrap;
  background: var(--dsw-alias-bg-module-platform); color: var(--dsw-alias-label-secondary);
}
.dtpl-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 12px 0 4px; border-top: 1px solid var(--dsw-alias-border-l2);
}
.dtpl-failed { flex: 1; min-width: 0; margin: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-state-error-primary); }
.dtpl-discard, .dtpl-save {
  appearance: none; border: 1px solid transparent; border-radius: 8px;
  padding: 5px 14px; font: inherit; font-size: 13px; line-height: 1.5; cursor: pointer;
}
.dtpl-discard { border-color: var(--dsw-alias-border-l2); background: none; color: var(--dsw-alias-label-secondary); }
.dtpl-discard:hover:not(:disabled) { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-label-dimmed); }
.dtpl-save { background: var(--dsw-alias-label-primary); color: var(--dsw-alias-bg-layer-3); }
.dtpl-discard:disabled, .dtpl-save:disabled { opacity: 0.4; cursor: default; }
.dtpl-discard:focus-visible, .dtpl-save:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.dtpl-field { display: flex; flex-direction: column; gap: 6px; padding: 12px 0; }
.dtpl-field + .dtpl-field { border-top: 1px solid var(--dsw-alias-border-l2); }
.dtpl-field-head { display: flex; align-items: center; gap: 8px; }
.dtpl-label { flex: 1; min-width: 0; font-size: 13px; font-weight: 500; line-height: 1.5; color: var(--dsw-alias-label-primary); }
.dtpl-status { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; }
.dtpl-status-title { margin: 0; font-size: 14px; font-weight: 600; line-height: 1.4; color: var(--dsw-alias-label-primary); }
.dtpl-status-body { margin: 0; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-tertiary); }
.dtpl-badges { display: inline-flex; align-items: center; gap: 8px; }
.dtpl-badge {
  border-radius: 999px; padding: 1px 8px; font-size: 11px; line-height: 17px; white-space: nowrap; font-weight: 500;
  background: var(--dsw-alias-bg-module-platform); color: var(--dsw-alias-label-secondary);
}
.dtpl-reset { border: none; background: none; padding: 0; font: inherit; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary); cursor: pointer; }
.dtpl-reset:hover:not(:disabled) { color: var(--dsw-alias-label-primary); }
.dtpl-reset:disabled { cursor: default; }
.dtpl-input {
  height: 34px; padding: 0 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px;
  background: var(--dsw-alias-bg-layer-3); font: inherit; font-size: 13px; line-height: 1.5;
  color: var(--dsw-alias-label-primary);
}
.dtpl-input:focus-visible { outline: none; border-color: var(--dsw-alias-brand-primary); }
.dtpl-input:disabled { color: var(--dsw-alias-label-tertiary); cursor: default; }
.dtpl-input-invalid { border-color: var(--dsw-alias-state-error-primary); }
.dtpl-checkbox { width: 16px; height: 16px; accent-color: var(--dsw-alias-brand-primary); }
.dtpl-invalid { margin: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-state-error-primary); }
.dtpl-hint { margin: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); }
`
  document.head.appendChild(tag)
}
