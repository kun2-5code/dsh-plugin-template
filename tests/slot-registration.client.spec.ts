// @vitest-environment jsdom
/**
 * 浏览器半边注册到插槽表上，并在插件停用时全部撤销。
 *
 * 这一份覆盖的是模板曾经真实犯过的两类错：注册进已退役的槽位（会抛错），
 * 以及样式表与注册项在停用后残留。fixture 与替身见 tests/support/。
 */

import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { apply, inject } from '../src/client/index.ts'
import { DEMO_COMMAND_NAME, LOCALE_NAMESPACE, NAMESPACE } from '../src/client/constants.ts'
import { isTestLocale, TestLocale } from './support/locale.ts'
import { requireDouble } from './support/require-double.ts'
import { isTestSlotRegistry, TestSlotRegistry } from './support/slot-registry.ts'

/** 本插件贡献的全部槽位。 */
const TARGETS = [
  'plugins.bundle.config',
  'sidebar.footer.action',
  'conversation.input.dock',
  'shell.overlay',
  'conversation.session.header.utilities',
  'conversation.input.left',
  'conversation.input.right',
  'conversation.chat.commandview',
  'settings.general.item',
  'settings.plugins.tab',
  'settings.action',
  'conversation.session.header.actions',
  'conversation.composer.dock',
  'conversation.chat.assistant-actions',
] as const

/**
 * 装好 ctx：插槽表、locale，以及外壳对目标槽位的声明。
 * @returns ctx、槽位表与 locale。
 */
async function bench() {
  const ctx = new Context()
  // cordis 的 ctx.plugin(...) 只挂载第一个参数，服务要各自挂一次。
  await ctx.plugin(TestSlotRegistry).await()
  await ctx.plugin(TestLocale).await()
  const slots = requireDouble(ctx.get('slots'), isTestSlotRegistry, 'slot test double')
  const locale = requireDouble(ctx.get('locale'), isTestLocale, 'locale test double')
  // 外壳在 root 的 children 表里声明这些槽位。
  slots.declare(...TARGETS)
  return { ctx, slots, locale }
}

describe('browser half registration', () => {
  it('contributes exactly one entry to each of the fourteen surfaces', async () => {
    const { ctx, slots } = await bench()
    const fiber = await ctx.plugin({ inject, apply }).await()

    for (const name of TARGETS) {
      expect(slots.entriesOf(name), `slot ${name} should hold one entry`).toHaveLength(1)
    }

    await fiber.dispose()
  })

  it('keys the configuration form by the package name', async () => {
    const { ctx, slots } = await bench()
    const fiber = await ctx.plugin({ inject, apply }).await()

    expect(slots.entriesOf('plugins.bundle.config')[0]?.options.key).toBe(NAMESPACE)

    await fiber.dispose()
  })

  it('keys the command row by the demo command name', async () => {
    const { ctx, slots } = await bench()
    const fiber = await ctx.plugin({ inject, apply }).await()

    expect(slots.entriesOf('conversation.chat.commandview')[0]?.options.key)
      .toBe(DEMO_COMMAND_NAME)

    await fiber.dispose()
  })

  it('gives every list entry an id and a numeric order', async () => {
    const { ctx, slots } = await bench()
    const fiber = await ctx.plugin({ inject, apply }).await()

    for (const name of TARGETS) {
      if (name === 'plugins.bundle.config' || name === 'conversation.chat.commandview') continue
      const options = slots.entriesOf(name)[0]?.options
      expect(options?.id, `slot ${name} entry needs an id`).toBeTruthy()
      expect(typeof options?.order, `slot ${name} entry needs a numeric order`).toBe('number')
    }

    await fiber.dispose()
  })

  it('declares the locale namespace on every entry so components can read copy', async () => {
    const { ctx, slots } = await bench()
    const fiber = await ctx.plugin({ inject, apply }).await()

    for (const name of TARGETS) {
      expect(slots.entriesOf(name)[0]?.options.locale, `slot ${name} needs a locale`)
        .toBe(LOCALE_NAMESPACE)
    }

    await fiber.dispose()
  })

  it('registers the Plugins tab label as a locale-following thunk', async () => {
    const { ctx, slots, locale } = await bench()
    locale.setLocale('zh')
    const fiber = await ctx.plugin({ inject, apply }).await()

    const label = slots.entriesOf('settings.plugins.tab')[0]?.options.label
    expect(typeof label, 'tab label should be a thunk, not a fixed string').toBe('function')
    expect((label as () => string)()).toBe('模版')

    await fiber.dispose()
  })

  it('waits for a slot declaration instead of throwing when one is missing', async () => {
    const ctx = new Context()
    await ctx.plugin(TestSlotRegistry).await()
    await ctx.plugin(TestLocale).await()
    const slots = requireDouble(ctx.get('slots'), isTestSlotRegistry, 'slot test double')
    // 只声明部分槽位：未声明的那些贡献应当等着，不应让插件启动失败。
    slots.declare('shell.overlay')

    const fiber = await ctx.plugin({ inject, apply }).await()
    expect(slots.entriesOf('shell.overlay')).toHaveLength(1)
    expect(slots.entriesOf('sidebar.footer.action')).toHaveLength(0)

    // 声明到达后，之前等着的贡献补装。
    slots.declare('sidebar.footer.action')
    expect(slots.entriesOf('sidebar.footer.action')).toHaveLength(1)

    await fiber.dispose()
  })
})

describe('browser half disposal', () => {
  it('removes every contribution when the fiber is disposed', async () => {
    const { ctx, slots } = await bench()
    const fiber = await ctx.plugin({ inject, apply }).await()
    for (const name of TARGETS) {
      expect(slots.entriesOf(name)).toHaveLength(1)
    }

    await fiber.dispose()

    for (const name of TARGETS) {
      expect(slots.entriesOf(name), `slot ${name} should be empty after disposal`)
        .toHaveLength(0)
    }
  })

  it('removes the stylesheet node it added', async () => {
    const { ctx } = await bench()
    const fiber = await ctx.plugin({ inject, apply }).await()
    expect(document.querySelectorAll(`style[data-plugin="${NAMESPACE}"]`)).toHaveLength(1)

    await fiber.dispose()

    expect(document.querySelectorAll(`style[data-plugin="${NAMESPACE}"]`))
      .toHaveLength(0)
  })

  it('does not accumulate stylesheets across repeated mounts', async () => {
    const { ctx } = await bench()
    for (let round = 0; round < 3; round++) {
      const fiber = await ctx.plugin({ inject, apply }).await()
      expect(document.querySelectorAll(`style[data-plugin="${NAMESPACE}"]`)).toHaveLength(1)
      await fiber.dispose()
    }
    expect(document.querySelectorAll(`style[data-plugin="${NAMESPACE}"]`)).toHaveLength(0)
  })

  it('unregisters its locale dictionaries', async () => {
    const { ctx, locale } = await bench()
    const fiber = await ctx.plugin({ inject, apply }).await()
    expect(locale.has(LOCALE_NAMESPACE, 'card.save')).toBe(true)

    await fiber.dispose()

    expect(locale.has(LOCALE_NAMESPACE, 'card.save')).toBe(false)
  })
})
