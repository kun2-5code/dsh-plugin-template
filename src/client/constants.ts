/**
 * 客户端半边共用的标识常量。
 * 改名时保持 package.json 的 `name`、src/index.ts 的 `name`、cordis.patch.yml 的
 * `id`/`name` 与此处一致（见 README "Making it your own plugin"）。
 * @module dsh-plugin-template/client/constants
 */

/** 插件名：settings 命名空间、settings 卡片插槽条目 id、侧栏/输入区条目的共用标识。 */
export const NAMESPACE = 'dsh-plugin-template'

/**
 * 示例命令名（不含前导斜杠）：host 半边（src/commands.ts）用它注册命令，
 * 浏览器半边（src/client/commandview.ts）用它作为 conversation.chat.commandview
 * 的 keyed 键；两端必须一致。
 */
export const DEMO_COMMAND_NAME = 'dsh-demo'
