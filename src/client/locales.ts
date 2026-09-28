/**
 * 客户端半边的文案字典。
 *
 * 约定：所有用户可见文字（正文、无障碍名称、占位符、状态标签）都在这里，
 * 组件通过注册项的 `locale` 选项拿到 `t` 席位后读取，不在代码里写死。
 * 改语言只改这里，不需要重新注册插槽。
 * @module dsh-plugin-template/client/locales
 */

/** 本插件渲染时用到的全部 locale 键。 */
export type TemplateLocaleKey =
  // 配置表单
  | 'card.title' | 'card.description' | 'card.loading' | 'card.unavailable'
  | 'card.readOnly' | 'card.save' | 'card.saving' | 'card.saveFailed'
  | 'card.overridden' | 'card.reset' | 'card.invalid'
  | 'field.greeting.label' | 'field.greeting.hint'
  | 'field.maxRetries.label' | 'field.maxRetries.hint' | 'field.maxRetries.invalid'
  | 'field.verbose.label' | 'field.verbose.hint'
  // 侧栏
  | 'sidebar.label'
  // 输入区
  | 'inputDock.label' | 'inputDock.waiting'
  | 'input.left' | 'input.right'
  // 浮层
  | 'overlay.text' | 'overlay.close'
  // 会话头
  | 'header.badge' | 'header.label'
  // 命令行
  | 'command.running' | 'command.succeeded' | 'command.failed'
  // 设置
  | 'general.label' | 'settings.armed' | 'settings.idle'
  | 'pluginsTab.label' | 'composerDock.text'
  // 消息
  | 'message.save' | 'message.saved'

/** 英文文案。 */
export const en: Record<TemplateLocaleKey, string> = {
  'card.title': 'Plugin template',
  'card.description': 'Settings for the sample greeting tool.',
  'card.loading': 'Reading settings…',
  'card.unavailable': 'This plugin is not loaded, so it cannot be configured right now.',
  'card.readOnly': 'This deployment stores settings read-only.',
  'card.save': 'Save',
  'card.saving': 'Saving…',
  'card.saveFailed': 'The deployment did not accept these values; they were left for you to correct.',
  'card.overridden': 'Overridden',
  'card.reset': 'Reset to default',
  'card.invalid': 'This value is not valid.',
  'field.greeting.label': 'Greeting',
  'field.greeting.hint': 'Prefix the greeting tool puts in front of a name.',
  'field.maxRetries.label': 'Maximum retries',
  'field.maxRetries.hint': 'How many times one operation may retry.',
  'field.maxRetries.invalid': 'Enter a whole number of at least 0.',
  'field.verbose.label': 'Debug logging',
  'field.verbose.hint': 'Write the plugin’s heartbeat and readiness events to the log.',
  'sidebar.label': 'Template',
  'inputDock.label': 'Input dock',
  'inputDock.waiting': 'No session',
  'input.left': 'Left',
  'input.right': 'Right',
  'overlay.text': 'Overlay example',
  'overlay.close': 'Dismiss the overlay example',
  'header.badge': 'Template',
  'header.label': 'Template',
  'command.running': 'Running…',
  'command.succeeded': 'Done',
  'command.failed': 'Failed',
  'general.label': 'Template preference',
  'settings.armed': 'Template button · on',
  'settings.idle': 'Template button',
  'pluginsTab.label': 'Template',
  'composerDock.text': 'Template status strip',
  'message.save': 'Save message',
  'message.saved': 'Message saved',
}

/** 简体中文文案。 */
export const zh: Record<TemplateLocaleKey, string> = {
  'card.title': '插件模版',
  'card.description': '示例打招呼工具的设置。',
  'card.loading': '正在读取设置…',
  'card.unavailable': '该插件当前未加载，暂时无法配置。',
  'card.readOnly': '本部署的设置为只读。',
  'card.save': '保存',
  'card.saving': '保存中…',
  'card.saveFailed': '本部署没有接受这些值，已保留供你修改。',
  'card.overridden': '已覆盖',
  'card.reset': '恢复默认',
  'card.invalid': '这个值不合法。',
  'field.greeting.label': '打招呼文案',
  'field.greeting.hint': '打招呼工具放在名字前面的前缀。',
  'field.maxRetries.label': '最大重试次数',
  'field.maxRetries.hint': '单次操作最多重试几次。',
  'field.maxRetries.invalid': '请填不小于 0 的整数。',
  'field.verbose.label': '调试日志',
  'field.verbose.hint': '把本插件的心跳与就绪事件写入日志。',
  'sidebar.label': '模版',
  'inputDock.label': '输入区 Dock',
  'inputDock.waiting': '无会话',
  'input.left': '左',
  'input.right': '右',
  'overlay.text': '浮层示例',
  'overlay.close': '关闭浮层示例',
  'header.badge': '模版',
  'header.label': '模版',
  'command.running': '执行中…',
  'command.succeeded': '完成',
  'command.failed': '失败',
  'general.label': '模版偏好',
  'settings.armed': '模版按钮 · 已点亮',
  'settings.idle': '模版按钮',
  'pluginsTab.label': '模版',
  'composerDock.text': '模版状态条',
  'message.save': '收藏消息',
  'message.saved': '已收藏',
}
