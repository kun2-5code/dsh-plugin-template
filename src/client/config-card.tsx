/**
 * 本插件在 Plugins 页上的配置表单。
 *
 * 插槽：`plugins.bundle.config`，keyed，键就是包名（constants.ts 的 NAMESPACE）。
 * owner 渲染 bundle 页时把 `view: 'page'` 和 `form` 一起传进来；`form` 带
 * 宿主持有的已接受值和写入动作，所以本页不需要自己订阅 settings 快照，
 * 也不需要 `ctx.configForms`。
 *
 * 表单模型：草稿是组件私有状态，离开页面即丢弃；只有「保存」会写入，
 * 所以没有「放弃」按钮，也没有「未保存」标记。写入走
 * `form.mutate(ops, revision)`，revision 围栏防止并发覆盖。
 *
 * 宿主侧对应的是 src/index.ts 里带 `.volatile()` 的 Config 字段，命名空间
 * 由 Loader 从 cordis.patch.yml 的行 id 派生。
 * @module dsh-plugin-template/client/config-card
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { PluginConfigViewProps } from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'

/** 配置表单的 props：owner 传的值与写动作，加上本插件的 `t` 席位。 */
type ConfigCardProps = PluginConfigViewProps & PropsLocale<typeof LOCALE_NAMESPACE>

/** 宿主已接受的配置值。 */
interface TemplateSettings {
  greeting?: string
  maxRetries?: number
  verbose?: boolean
}

/** 表单可编辑的三个字段。 */
const FIELDS = ['greeting', 'maxRetries', 'verbose'] as const

/** 表单草稿：三个字段都可暂时为空，未填的字段回落到部署默认值。 */
interface Draft {
  greeting: string
  maxRetries: string
  verbose: boolean
}

/**
 * 把宿主已接受的值读成表单草稿。
 * @param value - 宿主已接受的部分配置。
 * @returns 三个字段的草稿文本。
 */
function readDraft(value: Record<string, unknown>): Draft {
  const settings = value as TemplateSettings
  return {
    greeting: settings.greeting ?? '',
    maxRetries: settings.maxRetries === undefined ? '' : String(settings.maxRetries),
    verbose: settings.verbose ?? false,
  }
}

/** 两个配置值是否等价；用于判断某字段是否还需要写入。 */
function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

/**
 * 注册本插件的配置表单。
 * @param ctx - 客户端根上下文。
 */
export function registerConfigCard(ctx: Context): void {
  ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register(
    { name: 'plugins.bundle.config', key: NAMESPACE, locale: LOCALE_NAMESPACE },
    ConfigCard,
  ))
}

/**
 * 渲染 Plugins 页上本插件的那一行摘要，或它的配置表单。
 * @param props - owner 传的值与写动作，以及本插件的 `t` 席位。
 * @returns 摘要文案，或配置表单。
 */
export function ConfigCard(props: ConfigCardProps): React.ReactElement {
  const { t, view, form } = props
  if (view === 'summary') return <p className="dtpl-summary">{t('card.description')}</p>
  if (form === undefined) return <p className="dtpl-note">{t('card.unavailable')}</p>
  if (form.state.status === 'loading') return <p className="dtpl-note">{t('card.loading')}</p>
  if (form.state.status === 'unavailable') return <p className="dtpl-note">{t('card.unavailable')}</p>
  return <SettingsForm form={form} t={t} />
}

/** 配置表单本体。 */
function SettingsForm({ form, t }: { form: NonNullable<ConfigCardProps['form']>; t: (key: TemplateKey) => string }): React.ReactElement {
  const { state, mutate } = form
  const accepted = state.value ?? {}
  // `draft` 是可编辑的草稿；`seeding` 是它上次同步到的已接受值。两者有差就是
  // 有待保存的编辑。
  const [draft, setDraft] = React.useState<Draft>(() => readDraft(accepted))
  const [seeding, setSeeding] = React.useState<Draft>(() => readDraft(accepted))
  const [saving, setSaving] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const dirty = !sameValue(draft, seeding)

  // 宿主接受了新值时，只有在用户没有待保存编辑的情况下才重新读成草稿；否则
  // 外部改动会抹掉正在编辑的内容。
  React.useEffect(() => {
    const next = readDraft(accepted)
    if (sameValue(next, seeding) || !sameValue(draft, seeding)) return
    setSeeding(next)
    setDraft(next)
  }, [accepted, seeding, draft])

  const retries = Number(draft.maxRetries)
  const retriesValid = draft.maxRetries === '' || (Number.isInteger(retries) && retries >= 0)
  const editable = state.writable && !saving

  async function save(): Promise<void> {
    // 保存按钮禁用了，但表单仍可被回车或脚本提交，所以这里必须自己把关。
    if (!retriesValid || !dirty) return
    setSaving(true)
    setFailed(false)
    try {
      const ops = buildOps(accepted, state.base, draft)
      if (ops.length === 0) return
      const written = await mutate(ops, state.revision)
      if (written) {
        // 提交成功：这份草稿成为新的基线，宿主追上来之后不会重复提交。
        setSeeding({ ...draft })
      } else {
        setFailed(true)
      }
    } catch {
      // 传输失败保留草稿，表单仍可再次保存。
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className="dtpl-form"
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      <h3 className="dtpl-form-title">{t('card.title')}</h3>

      {/* 提示与错误都通过 aria-describedby 挂到输入框上，不放进 <label>：
          放进 label 会把提示文字并进输入框的无障碍名称里。 */}
      <div className="dtpl-field">
        <div className="dtpl-field-label">
          <label htmlFor="dtpl-greeting">{t('field.greeting.label')}</label>
          {isOverridden(state.user, 'greeting') && <em className="dtpl-badge">{t('card.overridden')}</em>}
        </div>
        <span className="dtpl-field-hint" id="dtpl-greeting-hint">{t('field.greeting.hint')}</span>
        <input
          id="dtpl-greeting"
          type="text"
          value={draft.greeting}
          disabled={!editable}
          aria-describedby="dtpl-greeting-hint"
          onChange={(event) => { setDraft({ ...draft, greeting: event.currentTarget.value }) }}
        />
      </div>

      <div className="dtpl-field">
        <div className="dtpl-field-label">
          <label htmlFor="dtpl-max-retries">{t('field.maxRetries.label')}</label>
          {isOverridden(state.user, 'maxRetries') && <em className="dtpl-badge">{t('card.overridden')}</em>}
        </div>
        <span className="dtpl-field-hint" id="dtpl-max-retries-hint">{t('field.maxRetries.hint')}</span>
        <input
          id="dtpl-max-retries"
          type="number"
          value={draft.maxRetries}
          disabled={!editable}
          aria-invalid={!retriesValid}
          aria-describedby={retriesValid ? 'dtpl-max-retries-hint' : 'dtpl-max-retries-hint dtpl-max-retries-invalid'}
          onChange={(event) => { setDraft({ ...draft, maxRetries: event.currentTarget.value }) }}
        />
        {!retriesValid && <span id="dtpl-max-retries-invalid" className="dtpl-invalid">{t('field.maxRetries.invalid')}</span>}
      </div>

      <div className="dtpl-field dtpl-field-inline">
        <input
          id="dtpl-verbose"
          type="checkbox"
          checked={draft.verbose}
          disabled={!editable}
          aria-describedby="dtpl-verbose-hint"
          onChange={(event) => { setDraft({ ...draft, verbose: event.currentTarget.checked }) }}
        />
        <div>
          <label htmlFor="dtpl-verbose">{t('field.verbose.label')}</label>
          <span className="dtpl-field-hint" id="dtpl-verbose-hint">{t('field.verbose.hint')}</span>
        </div>
      </div>

      {!state.writable && <p className="dtpl-note">{t('card.readOnly')}</p>}
      {failed && <p className="dtpl-invalid" role="alert">{t('card.saveFailed')}</p>}

      <div className="dtpl-form-actions">
        <button
          type="button"
          // 丢弃编辑正是"有未保存编辑"时才有意义的事，所以不能跟着 dirty 一起禁用。
          disabled={!state.writable}
          onClick={() => {
            const next = readDraft(accepted)
            setSeeding(next)
            setDraft(next)
          }}
        >
          {t('card.reset')}
        </button>
        <button type="submit" disabled={!editable || !dirty || !retriesValid}>
          {saving ? t('card.saving') : t('card.save')}
        </button>
      </div>
    </form>
  )
}

/** 表单内部使用的 locale 键类型。 */
type TemplateKey = Parameters<ConfigCardProps['t']>[0]

/** 某字段在用户层里存在即视为已覆盖。 */
function isOverridden(user: unknown, field: string): boolean {
  return typeof user === 'object' && user !== null && field in user
}

/**
 * 把草稿折成写入操作：与已接受值相同的字段不写；与部署默认值相同的字段清除
 * 覆盖，回落到组装层；其余字段写入新值。
 * @param accepted - 宿主已接受的值。
 * @param base - 组装层的值。
 * @param draft - 表单草稿。
 * @returns 一次保存要提交的操作。
 */
function buildOps(
  accepted: Record<string, unknown>,
  base: unknown,
  draft: Draft,
): { op: 'set' | 'unset'; path: string[]; value?: string | number | boolean }[] {
  const baseValues = (base ?? {}) as Record<string, unknown>
  const ops: { op: 'set' | 'unset'; path: string[]; value?: string | number | boolean }[] = []
  for (const field of FIELDS) {
    const next = draftValue(field, draft)
    if (sameValue(next, accepted[field])) continue
    if (next === undefined || sameValue(next, baseValues[field])) {
      ops.push({ op: 'unset', path: [field] })
    } else {
      ops.push({ op: 'set', path: [field], value: next })
    }
  }
  return ops
}

/**
 * 把一个字段的草稿读成要写入的值。
 *
 * 文本字段留空表示"回落到部署默认值"，因此返回 undefined；复选框总有一个确定
 * 的布尔值，必须原样返回——把 `false` 当成"没设"会凭空发出一条 `unset`。
 * @param field - 字段名。
 * @param draft - 表单草稿。
 * @returns 要写入的值，或 undefined 表示清除覆盖。
 */
function draftValue(field: (typeof FIELDS)[number], draft: Draft): string | number | boolean | undefined {
  if (field === 'greeting') return draft.greeting === '' ? undefined : draft.greeting
  if (field === 'verbose') return draft.verbose
  if (draft.maxRetries === '') return undefined
  return Number(draft.maxRetries)
}
