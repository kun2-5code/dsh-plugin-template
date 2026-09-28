/**
 * 客户端半边共用的标识常量。
 * 改名时保持 package.json 的 `name`、src/index.ts 的 `name`、cordis.patch.yml 的
 * `id`/`name` 与此处一致（见 README "Making it your own plugin"）。
 * @module dsh-plugin-template/client/constants
 */

/**
 * 插件名：同时是 cordis.patch.yml 里的行 id（也就是宿主派生的 settings 命名空间）、
 * `plugins.bundle.config` 插槽的 key、以及客户端模块加载器登记的 id。
 * 三处必须一致。
 */
export const NAMESPACE = 'dsh-plugin-template'

/** 客户端半边自己的 locale 字典命名空间。 */
export const LOCALE_NAMESPACE = 'settings.pluginTemplate'

/**
 * 示例命令名（不含前导斜杠）：宿主半边（src/commands.ts）用它注册命令，
 * 浏览器半边（src/client/commandview.tsx）用它作为
 * `conversation.chat.commandview` 的 keyed 键；两端必须一致。
 */
export const DEMO_COMMAND_NAME = 'dsh-demo'
