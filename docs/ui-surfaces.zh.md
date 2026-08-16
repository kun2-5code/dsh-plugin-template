# 插件注册在哪些 UI 面上

本模板演示了在 dsh web GUI 的**三个**面上注册浏览器 UI。它们都走同一个插槽 API（`ctx.slots.inject(...)` + `ctx.slots.register(...)`），来自客户端半边（`src/client/`），区别只有插槽 `name`。它们**都不依赖** `WEB_SETTINGS_NAMESPACES` 白名单——只有配置卡片的*数据路径*（settings 命名空间）受白名单门控，且卡片会渲染说明状态而不是消失。

## 索引

| # | 插槽 | 出现位置 | 作用域 | 实现文件 | 内置参考 |
|---|------|----------|--------|----------|----------|
| 1 | `settings.plugin.item` | 设置 → 插件 → Configurable（配置卡片） | root | `src/client/config-card.ts` | ui-settings-plugins（bash / agent-loop / web-search 三张卡） |
| 2 | `sidebar.footer.action` | 左侧栏底部、"设置"旁（按钮） | root | `src/client/sidebar-action.ts` | ui-sidebar 声明该插槽；**无内置插件注册（空白加法位）** |
| 3 | `conversation.input.dock` | 输入卡片上方一整行（状态条） | session | `src/client/input-dock.ts` | ui-goal（GoalDock） |

## 各自显示在哪

1. **配置卡片**——设置 → 插件 → Configurable 页。harness 把 `dsh-plugin-template` 命名空间暴露后可编辑（见 README"原版 harness 上的配置卡片"）；否则渲染只读说明卡。
2. **侧栏底部按钮**——左侧栏底部"设置"旁的按钮。宽栏显示"模板示例操作"；收起成窄栏（rail）时只显示状态点（读取 `wide` owner prop）。
3. **输入区 Dock**——会话中输入卡片上方的一行状态条。session 级：注册时的 `inject` 工厂收到 `sessionId` 并交给组件。

## 一个 UI 面怎么注册

每个 UI 面在 `src/client/` 下独立成模块，导出一个 `register*` 函数；客户端入口（`src/client/index.ts`）在 `apply` 里按序调用。模式固定为：

```ts
// src/client/<surface>.ts
import type { Context } from '@deepseek-ai/cordis'

export function registerXxx(ctx: Context): void {
  ctx.slots.inject('<slot.name>', () => ctx.slots.register(
    {
      name: '<slot.name>',
      id: NAMESPACE,   // 同插槽内唯一；条目按 order 升序渲染
      order: 30,
      // 仅 session 级插槽：inject 工厂收到 sessionId
      inject: (sessionId) => ({ sessionId }),
    },
    XxxComponent,
  ))
}
```

`ctx.slots` 的最小结构类型在 `src/client/types.ts`（模板不 import 任何 `@deepseek-ai` 客户端包；要完整类型化组件时，真实四份 share 的 props 类型来自 `dsh-client-ui-slots`）。

## 框架还有哪些可注册面（本模板未实现）

harness 声明了更多加法插槽，插件可以注册的有：

- **侧栏**：`sidebar.workspaces`、`sidebar.settings`（替换型座），`sidebar.footer.action`（已实现）。
- **对话页外壳**：`conversation.session.header.actions` / `.utilities`（顶部操作行）、`conversation.composer.dock`（输入卡片下方）、`conversation.input.left` / `.right`（卡片内工具行）、`conversation.input.overlay`（全宽浮层）、`conversation.input.plan` / `.model`（命名座）。
- **消息流**：`conversation.chat.node`（按类型分发的业务消息节点——见 harness 的 `docs/cookbook/adding-a-conversation-node.md`）、`conversation.chat.assistant-actions`（每条消息上的按钮）、`conversation.chat.turnTail`（chain）、`conversation.chat.commandview`（斜杠命令行）、`conversation.view`（新 tab）。
- **工具**：`tool.call.toolview`（按工具名 keyed），以及 host 侧工具自身的 `presentCall` / `presentResult` 渲染意图。
- **全局**：`shell.overlay`（全框架浮层——badge、toast）。

插槽声明与 owner props 在 harness 客户端包中（`packages/client/ui-conversation/src/client/contract/slots.ts`、`ui-sidebar/.../contract/slots.ts`、`ui-tool/...`、`ui-settings/...`、`ui-layout/...`）。

## 给本模板新增一个 UI 面

1. 新建 `src/client/<surface>.ts`，写 `registerXxx(ctx)`（照抄上面的模式）。
2. 在 `src/client/index.ts` 的 `apply` 里调用它。
3. 把样式加进 `src/client/styles.ts`（全部 `dtpl-*` class，只走主题变量）。
4. 在上面的索引表加一行，然后 `pnpm build` 并刷新 GUI 页面（client bundle 带 rev 缓存失效）。
