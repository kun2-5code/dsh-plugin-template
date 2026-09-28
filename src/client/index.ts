/**
 * 客户端半边入口：唯一职责是注册文案字典、注入样式，并把各 UI 面的注册
 * 组装起来。每个 UI 面一个独立模块，行为见 docs/ui-surfaces.md。
 *
 * 依赖纪律：浏览器半边不 import 任何宿主侧包。`react` 由浏览器模块表提供，
 * 其它 harness 客户端包只以 `import type` 出现（类型擦除，不产生模块请求）。
 * 样式的颜色一律用 `--dsw-alias-*` 主题令牌，不写字面色值。
 *
 * @module dsh-plugin-template/client
 */

// 类型引入：拉进各宿主包的 Context 与插槽表声明合并。
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type { Context } from '@deepseek-ai/cordis'
import { registerAssistantAction } from './assistant-actions.tsx'
import { registerCommandView } from './commandview.tsx'
import { registerComposerDock } from './composer-dock.tsx'
import { registerConfigCard } from './config-card.tsx'
import { LOCALE_NAMESPACE } from './constants.ts'
import { registerGeneralItem } from './general-item.tsx'
import { registerHeaderAction } from './header-actions.tsx'
import { registerHeaderUtility } from './header-utilities.tsx'
import { registerInputDock } from './input-dock.tsx'
import { registerInputLeft } from './input-left.tsx'
import { registerInputRight } from './input-right.tsx'
import { en, zh, type TemplateLocaleKey } from './locales.ts'
import { registerPluginsTab } from './plugins-tab.tsx'
import { registerSettingsAction } from './settings-action.tsx'
import { registerShellOverlay } from './shell-overlay.tsx'
import { registerSidebarAction } from './sidebar-action.tsx'
import { injectStyles } from './styles.ts'

/** 声明本插件的 locale 字典命名空间，让 `PropsLocale` 给出带类型的 `t`。 */
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** 本插件各 UI 面的文案。 */
    'settings.pluginTemplate': TemplateLocaleKey
  }
}

/** 依赖的服务：slots 与 locale 就绪后本插件才会加载。 */
export const inject = ['slots', 'locale', 'configForms']

/**
 * 挂载本插件的浏览器半边。
 * @param ctx - 客户端根上下文。
 */
export function apply(ctx: Context): void {
  // 字典随生命周期注册与撤销。
  ctx.effect(
    () => ctx.locale.register(LOCALE_NAMESPACE, { zh, en }),
    'dsh-plugin-template: dictionaries',
  )
  // 样式表同样挂 effect：返回的清理函数会在插件停用时移除样式节点。
  ctx.effect(() => injectStyles())

  registerConfigCard(ctx)
  registerSidebarAction(ctx)
  registerInputDock(ctx)
  registerShellOverlay(ctx)
  registerHeaderUtility(ctx)
  registerInputLeft(ctx)
  registerInputRight(ctx)
  registerCommandView(ctx)
  registerGeneralItem(ctx)
  registerPluginsTab(ctx)
  registerSettingsAction(ctx)
  registerHeaderAction(ctx)
  registerComposerDock(ctx)
  registerAssistantAction(ctx)
}
