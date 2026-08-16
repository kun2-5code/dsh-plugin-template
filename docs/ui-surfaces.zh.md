# 插件注册在哪些 UI 面上

本模板演示了在 dsh web GUI 的**十四个**面上注册浏览器 UI（外加一个 host 侧工具渲染意图）。它们都走同一个插槽 API（`ctx.slots.inject(...)` + `ctx.slots.register(...)`），来自客户端半边（`src/client/`），区别只有插槽 `name`。它们**都不依赖** `WEB_SETTINGS_NAMESPACES` 白名单——只有配置卡片的*数据路径*（settings 命名空间）受白名单门控，且卡片会渲染说明状态而不是消失。

## 索引

| # | 插槽 | 出现位置 | 作用域 | 实现文件 | 内置参考 |
|---|------|----------|--------|----------|----------|
| 1 | `settings.plugin.item` | 设置 → 插件 → Configurable（配置卡片） | root | `src/client/config-card.ts` | ui-settings-plugins（bash / agent-loop / web-search 三张卡） |
| 2 | `sidebar.footer.action` | 左侧栏底部、"设置"旁（按钮） | root | `src/client/sidebar-action.ts` | ui-sidebar 声明该插槽；**无内置插件注册（空白加法位）** |
| 3 | `conversation.input.dock` | 输入卡片上方一整行（状态条） | session | `src/client/input-dock.ts` | ui-goal（GoalDock） |
| 4 | `shell.overlay` | 全框架浮层（pill） | root | `src/client/shell-overlay.ts` | ui-layout 声明；**空白加法位** |
| 5 | `conversation.session.header.utilities` | 会话标题右侧（工具徽标） | session | `src/client/header-utilities.ts` | ui-conversation 声明；**空白加法位** |
| 6 | `conversation.input.left` | 输入卡片工具行左端（小按钮） | session | `src/client/input-left.ts` | ui-conversation 声明；**空白加法位** |
| 7 | `conversation.input.right` | 工具行右端、发送键旁（小按钮） | session | `src/client/input-right.ts` | ui-conversation 声明；**空白加法位** |
| 8 | `conversation.chat.commandview` | 斜杠命令渲染行（`/dsh-demo`） | session | `src/client/commandview.ts` + host 侧 `src/commands.ts` | ui-conversation 声明；**空白加法位**（GenericCommandCard 兜底） |
| 9 | `settings.general.item` | 设置 → 通用（一行偏好开关） | root | `src/client/general-item.ts` | locale / ui-theme / ui-conversation / permission / agent-preset |
| 10 | `settings.plugins.tab` | 设置 → 插件（新 tab） | root | `src/client/plugins-tab.ts` | ui-settings-plugin-inventory |
| 11 | `settings.action` | 设置面板头部操作按钮 | root | `src/client/settings-action.ts` | ui-settings-general |
| 12 | `conversation.session.header.actions` | 会话标题旁操作按钮 | session | `src/client/header-actions.ts` | agent-preset / jobs / subagent |
| 13 | `conversation.composer.dock` | 输入卡片下方状态条 | session | `src/client/composer-dock.ts` | StatsLine（ui-conversation） |
| 14 | `conversation.chat.assistant-actions` | 每条 AI 消息的操作按钮 | session | `src/client/assistant-actions.ts` | ui-message-feedback |

除插槽外，host 半边还演示了一个工具渲染意图：`greet` 工具定义了 `presentResult`（`src/index.ts`），把结果渲染成更友好的卡片。它不是插槽——是工具定义上的纯函数、可重放。`presentCall` / `presentationMeta` 仍未演示。

## 各自显示在哪

1. **配置卡片**——设置 → 插件 → Configurable 页。harness 把 `dsh-plugin-template` 命名空间暴露后可编辑（见 README"原版 harness 上的配置卡片"）；否则渲染只读说明卡。
2. **侧栏底部按钮**——左侧栏底部"设置"旁的按钮。宽栏显示"模板示例操作"；收起成窄栏（rail）时只显示状态点（读取 `wide` owner prop）。
3. **输入区 Dock**——会话中输入卡片上方的一行状态条。session 级：注册时的 `inject` 工厂收到 `sessionId` 并交给组件。**布局注意**：`conversation.input.dock` 渲染为 composer 栈内的全宽行，宽度与居中由每个条目自己负责。对齐输入卡片的方式与内置 QueueDock 完全一致——用框架的布局变量（`--dsh-composer-card-max-width`、`--dsh-composer-dock-inset`）约束宽度，用 `margin: 0 auto` 居中；不要自己发明宽度数值。
4. **全局浮层**——全框架浮层上的一枚 pill（任意页面）。root 级；浮层层本身点击穿透，条目自行 opt-in 指针事件（`styles.ts` 里的 `pointer-events: auto`）。**布局注意**：该层只是 `inset: 0` 的全框层、不提供条目布局——条目自己定位；本示例按 toast 惯例用 `position: fixed` 钉在右下角并带关闭按钮。
5. **会话头工具位**——会话标题右侧的右对齐徽标。session 级；展示注入的 `sessionId` 前 8 位（演示 session 级 list 插槽的 `inject` 工厂）。
6. **工具行左端 / 7. 工具行右端**——输入卡片工具行左端（内置 chrome 之后）与右端（发送键旁）的常驻小按钮，与内置工具行 chrome 同一单行高度预算。
8. **命令渲染行**——示例命令 `/dsh-demo` 的自定义渲染行。该插槽按命令名 keyed：host 半边（`src/commands.ts`）注册命令本体，`src/client/commandview.ts` 用 `key: DEMO_COMMAND_NAME` 注册渲染行。在输入框输入 `/dsh-demo 任意内容` 即可看到命令行（完整命令原文 + 结算状态）。host 半边还注册了 `/hello`（回复 world）且**不注册渲染行**——它走默认的 GenericCommandCard，是对照组：证明斜杠命令零 UI 注册即可用。
9. **通用设置行**——设置 → 通用页里的一行偏好（本地状态的开关行，自包含，参照内置的语言/外观行）。
10. **插件页标签页**——设置 → 插件页里新增一个"模板示例"tab；选项里的 `label` 就是标签页文字。
11. **设置头部操作**——设置面板内容列头部、关闭按钮前的按钮。
12. **会话头操作**——会话标题旁的切换按钮（同一操作行里还有内置的预设 / jobs / subagent 按钮）。
13. **输入卡片下方状态条**——与 `input.dock` 不同，本插槽渲染在输入条内部（宽度继承卡片列约束），照 StatsLine 用 `--dsh-chat-content-width` 对齐即可，无需自己定位。
14. **消息操作**——每条已定稿的 AI 消息上的"收藏"切换按钮（同一行还有 message-feedback 的复制/评价）。

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

- **侧栏**：`sidebar.workspaces`、`sidebar.settings`（替换型座）。
- **对话页外壳**：`conversation.input.overlay`（全宽浮层——内置：斜杠菜单）、`conversation.input.plan` / `.model`（命名座）。
- **消息流**：`conversation.chat.node`（按类型分发的业务消息节点——见 harness 的 `docs/cookbook/adding-a-conversation-node.md`）、`conversation.chat.turnTail`（chain——内置：deliverables）、`conversation.view`（新 tab——内置：trajectory）。
- **工具**：`tool.call.toolview`（按工具名 keyed——内置：skill）；host 侧 `presentCall` / `presentationMeta` 渲染意图仍未演示。
- **设置**：`settings.section`（整个新设置页）、`settings.onboarding`。

插槽声明与 owner props 在 harness 客户端包中（`packages/client/ui-conversation/src/client/contract/slots.ts`、`ui-sidebar/.../contract/slots.ts`、`ui-tool/...`、`ui-settings/...`、`ui-layout/...`）。

## 跟着框架走

模板刻意不发明自己的外观与布局数值：

- **颜色**只用 harness 的主题变量（`--dsw-alias-*`，定义在 `ui-theme` 包）——不写任何字面色值。
- **布局**只用 harness 的布局变量（`--dsh-*`，如 `--dsh-composer-card-max-width`、`--dsh-composer-dock-inset`、`--dsh-chat-content-width`）——不手写宽度。
- **插槽按声明使用**：读取契约给你的 owner props 与作用域；不注册框架未声明的插槽，也不重写框架已派生的 share。
- **拿不准时照抄最近的内置注册者**（QueueDock、GoalDock、StatsLine…），而不是发明新模式。

## 给本模板新增一个 UI 面

1. 新建 `src/client/<surface>.ts`，写 `registerXxx(ctx)`（照抄上面的模式）。
2. 在 `src/client/index.ts` 的 `apply` 里调用它。
3. 把样式加进 `src/client/styles.ts`（全部 `dtpl-*` class，只走主题变量）。
4. 在上面的索引表加一行，然后 `pnpm build` 并刷新 GUI 页面（client bundle 带 rev 缓存失效）。
