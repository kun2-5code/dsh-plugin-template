/**
 * 本插件在 Plugins 页上的配置表单。
 *
 * 插槽：`plugins.bundle.config`，keyed，键就是包名（`NAMESPACE`）。
 * owner 渲染 bundle 页时只传 `view: 'page'`——**不传 `form`**。构造
 * `ConfigPageForm` 的 `formFor()` 只喂 `plugins.item` 与 `plugins.row.config`，
 * 所以这一页的已接受值和写动作来自 `ctx.configForms`，经 `config-form.ts` 的
 * 模型经 `hooks` 舱交给渲染器，组件里没有任何订阅机制。
 *
 * 表单模型：草稿是组件私有状态，离开页面即丢弃；只有「保存」会写入，所以没有
 * 「未保存」标记。写入走 `submit(ops, revision)`，revision 围栏防止并发覆盖。
 * 把字段改回部署默认值发的是 `unset` 而不是再写一次同样的值。
 *
 * 宿主侧对应 `src/index.ts` 里带 `.volatile()` 的 Config 字段，命名空间由 Loader
 * 从 cordis.patch.yml 的行 id 派生。
 *
 * @module dsh-plugin-template/client/config-card
 */

// 类型引入：拉进各宿主包的 Context 与插槽表声明合并。
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import { LOCALE_NAMESPACE, NAMESPACE } from './constants.ts'
import type { ConfigFormFace, ConfigSnapshot, WriteOp } from './config-form.ts'
import { createConfigForm } from './config-form.ts'

/** 配置表单的 props：owner 传的值，本插件的 `t` 席位，以及模型的注��面。 */
type ConfigCardProps =
  & PropsRuntime<'plugins.bundle.config'>
  & PropsLocale<typeof LOCALE_NAMESPACE>
  & InjectFace<ConfigFormFace>

/** 表单可编辑的三个字段。 */
const FIELDS = ['greeting', 'maxRetries', 'verbose'] as const

/** 表单草稿：三个字段都可暂时为空，未填的字段回落到部署默认值。 */
interface Draft {
  greeting: string
  maxRetries: string
  verbose: boolean
}

/**
 * 注册本插件的配置表单。
 * @param ctx - 客户端根上下文。
 */
export function registerConfigCard(ctx: Context): void {
  const controller = createConfigForm(ctx)
  ctx.effect(() => () => { controller.dispose() }, 'dsh-plugin-template: config form')
  // 注册不做服务门控：Plugins 页靠"这条插槽上有本 bundle 的注册项"决定那一节
  // 是否渲染，用 whileServed 包起来整节都不会出现。
  ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register(
    {
      name: 'plugins.bundle.config',
      key: NAMESPACE,
      locale: LOCALE_NAMESPACE,
      inject: () => controller.inject(),
    },
    ConfigCard,
  ))
}

/**
 * 把已接受的值读成表单草稿。
 * @param value - 已接受的部分配置。
 * @returns 三个字段的草稿文本。
 */
function readDraft(value: Record<string, unknown>): Draft {
  return {
    greeting: typeof value.greeting === 'string' ? value.greeting : '',
    maxRetries: typeof value.maxRetries === 'number' ? String(value.maxRetries) : '',
    verbose: value.verbose === true,
  }
}

/** 两个配置值是否等价；用于判断某字段是否还需要写入。 */
function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

/** 某字段在用户层里存在即视为已覆盖。 */
function isOverridden(user: unknown, field: string): boolean {
  return typeof user === 'object' && user !== null && field in user
}

/**
 * 把一个字段的草稿读成要写入的值。
 *
 * 文本字段留空表示"回落到部署默认值"，因此返回 undefined；复选框总有一个确定的
 * 布尔值，必须原样返回——把 `false` 当成"没设"会凭空发出一条 `unset`。
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

/**
 * 把草稿折成写入操作：与已接受值相同的字段不写；与部署默认值相同的字段清除
 * 覆盖，回落到组装层；其余字段写入新值。
 * @param accepted - 已接受的值。
 * @param base - 组装层的值。
 * @param draft - 表单草稿。
 * @returns 一次保存要提交的操作。
 */
function buildOps(
  accepted: Record<string, unknown>,
  base: unknown,
  draft: Draft,
): WriteOp[] {
  const baseValues = (base ?? {}) as Record<string, unknown>
  const ops: WriteOp[] = []
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
 * 渲染 Plugins 页上本插件的那一行摘要，或它的配置表单。
 * @param props - owner 传的值，本插件的 `t` 席位，以及模型的注��面。
 * @returns 摘要文案，或配置表单。
 */
export function ConfigCard(props: ConfigCardProps): React.ReactElement {
  const { t, view } = props
  const snapshot = props.useTemplateConfig((state: ConfigSnapshot) => state)
  if (view === 'summary') return <p className="dtpl-summary">{t('card.description')}</p>
  if (snapshot.status === 'loading') return <p className="dtpl-note">{t('card.loading')}</p>
  if (snapshot.status === 'unavailable') return <p className="dtpl-note">{t('card.unavailable')}</p>
  return <SettingsForm {...props} snapshot={snapshot} />
}

/** 配置表单本体：私有草稿在这里，读与写都经 props。 */
function SettingsForm(
  { t, submit, snapshot }: ConfigCardProps & { snapshot: ConfigSnapshot },
): React.ReactElement {
  const accepted = snapshot.value
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
  const editable = snapshot.writable && !saving

  async function save(): Promise<void> {
    // 保存按钮禁用了，但表单仍可被回车或脚本提交，所以这里必须自己把关。
    if (!retriesValid || !dirty) return
    setSaving(true)
    setFailed(false)
    try {
      const ops = buildOps(accepted, snapshot.base, draft)
      if (ops.length === 0) return
      const written = await submit(ops, snapshot.revision)
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
          {isOverridden(snapshot.user, 'greeting') && <em className="dtpl-badge">{t('card.overridden')}</em>}
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
          {isOverridden(snapshot.user, 'maxRetries') && <em className="dtpl-badge">{t('card.overridden')}</em>}
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

      {!snapshot.writable && <p className="dtpl-note">{t('card.readOnly')}</p>}
      {failed && <p className="dtpl-invalid" role="alert">{t('card.saveFailed')}</p>}

      <div className="dtpl-form-actions">
        <button
          type="button"
          // 丢弃编辑正是"有未保存编辑"时才有意义的事，所以不能跟着 dirty 一起禁用。
          disabled={!snapshot.writable}
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
