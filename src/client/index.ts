/**
 * 客户端半边入口：唯一职责是把各 UI 面的注册组装起来，并导出 cordis 加载
 * 需要的 inject / apply。每个 UI 面一个独立模块（config-card / sidebar-action /
 * input-dock / shell-overlay / header-utilities / input-left / input-right /
 * commandview），各自的注册函数在 apply 里按序调用。
 *
 * 关于"开箱即用"：本入口注册的插槽全部是纯声明式 UI 注册，不受 harness 的
 * WEB_SETTINGS_NAMESPACES 白名单影响——侧栏按钮、输入区 Dock、浮层、工具位
 * 装完即用；只有配置卡片的数据路径（settings 命名空间）受白名单门控，卡片
 * 本身也会渲染说明状态而不是消失。详见 docs/ui-surfaces.md。
 * @module dsh-plugin-template/client
 */

import type { Context } from '@deepseek-ai/cordis'
import { injectStyles } from './styles.ts'
import { registerConfigCard } from './config-card.ts'
import { registerSidebarAction } from './sidebar-action.ts'
import { registerInputDock } from './input-dock.ts'
import { registerShellOverlay } from './shell-overlay.ts'
import { registerHeaderUtility } from './header-utilities.ts'
import { registerInputLeft } from './input-left.ts'
import { registerInputRight } from './input-right.ts'
import { registerCommandView } from './commandview.ts'

/** 依赖的服务：slots 就绪后本插件才会加载。 */
export const inject = ['slots']

/**
 * 客户端插件主体：注入样式，按顺序注册各 UI 面。
 * @param ctx - 客户端根上下文。
 */
export function apply(ctx: Context): void {
  injectStyles()
  registerConfigCard(ctx)
  registerSidebarAction(ctx)
  registerInputDock(ctx)
  registerShellOverlay(ctx)
  registerHeaderUtility(ctx)
  registerInputLeft(ctx)
  registerInputRight(ctx)
  registerCommandView(ctx)
}
