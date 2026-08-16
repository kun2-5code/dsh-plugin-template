# UI surfaces the plugin registers on

This template demonstrates registering a browser UI on **fourteen** surfaces of the dsh web GUI (plus one host-side tool render intent). All of them go through the same slot API (`ctx.slots.inject(...)` + `ctx.slots.register(...)`) from the client half (`src/client/`); only the slot `name` differs. None of them depends on the `WEB_SETTINGS_NAMESPACES` allowlist — only the config card's *data path* (the settings namespace) is gated by it, and the card explains that state instead of vanishing.

## Index

| # | Slot | Where it appears | Scope | Implementation | Built-in reference |
|---|------|------------------|-------|----------------|--------------------|
| 1 | `settings.plugin.item` | 设置 → 插件 → Configurable（配置卡片） | root | `src/client/config-card.ts` | ui-settings-plugins (bash / agent-loop / web-search cards) |
| 2 | `sidebar.footer.action` | 左侧栏底部、"设置"旁（按钮） | root | `src/client/sidebar-action.ts` | declared by ui-sidebar; **no built-in registrant (blank seat)** |
| 3 | `conversation.input.dock` | 输入卡片上方一整行（状态条） | session | `src/client/input-dock.ts` | ui-goal (GoalDock) |
| 4 | `shell.overlay` | 全框架浮层（pill） | root | `src/client/shell-overlay.ts` | declared by ui-layout; **blank seat** |
| 5 | `conversation.session.header.utilities` | 会话标题右侧（工具徽标） | session | `src/client/header-utilities.ts` | declared by ui-conversation; **blank seat** |
| 6 | `conversation.input.left` | 输入卡片工具行左端（小按钮） | session | `src/client/input-left.ts` | declared by ui-conversation; **blank seat** |
| 7 | `conversation.input.right` | 工具行右端、发送键旁（小按钮） | session | `src/client/input-right.ts` | declared by ui-conversation; **blank seat** |
| 8 | `conversation.chat.commandview` | 斜杠命令渲染行（`/dsh-demo`） | session | `src/client/commandview.ts` + host `src/commands.ts` | declared by ui-conversation; **blank seat** (GenericCommandCard fallback) |
| 9 | `settings.general.item` | 设置 → 通用（一行偏好开关） | root | `src/client/general-item.ts` | locale / ui-theme / ui-conversation / permission / agent-preset |
| 10 | `settings.plugins.tab` | 设置 → 插件（新 tab） | root | `src/client/plugins-tab.ts` | ui-settings-plugin-inventory |
| 11 | `settings.action` | 设置面板头部操作按钮 | root | `src/client/settings-action.ts` | ui-settings-general |
| 12 | `conversation.session.header.actions` | 会话标题旁操作按钮 | session | `src/client/header-actions.ts` | agent-preset / jobs / subagent |
| 13 | `conversation.composer.dock` | 输入卡片下方状态条 | session | `src/client/composer-dock.ts` | StatsLine (ui-conversation) |
| 14 | `conversation.chat.assistant-actions` | 每条 AI 消息的操作按钮 | session | `src/client/assistant-actions.ts` | ui-message-feedback |

Beyond the slots, the host half demonstrates a tool render intent: the `greet` tool defines `presentResult` (`src/index.ts`) to show its result as a friendlier card. It is not a slot — it is a pure, replayable function on the tool definition. `presentCall` / `presentationMeta` remain undemoed.

## Where each one shows up

1. **Config card** — Settings → Plugins → Configurable tab. Editable fields once the harness exposes the `dsh-plugin-template` namespace (see README "The config card on a stock harness"); otherwise a read-only explainer card.
2. **Sidebar footer action** — a button at the bottom of the left sidebar, next to Settings. Wide sidebar shows "模板示例操作"; the collapsed rail shows a state dot only (reads the `wide` owner prop).
3. **Input dock** — a status strip above the composer card in a conversation. Session-scoped: the registration's `inject` factory receives the `sessionId` and hands it to the component. **Layout note:** `conversation.input.dock` renders as a full-width row inside the composer stack; width and centering are each entry's own responsibility. Align with the composer card exactly as the built-in QueueDock does — constrain the width with the framework's layout variables (`--dsh-composer-card-max-width`, `--dsh-composer-dock-inset`) and center with `margin: 0 auto`. Never invent your own widths.
4. **Shell overlay** — a floating pill on the frame-wide layer (any page). Root-scoped; the layer itself is click-through, and entries opt back into pointer events (`pointer-events: auto` in `styles.ts`). **Layout note:** the layer is an `inset: 0` frame with no entry layout — each entry positions itself; this demo uses a toast-style `position: fixed` bottom-right with a close button.
5. **Header utility** — a right-aligned badge next to the session title. Session-scoped; shows the first 8 chars of the injected `sessionId` (demonstrates the `inject` factory on a session list slot).
6. **Input left / 7. Input right** — small always-visible controls at the left end of the composer tool row (after the resident chrome) and at the right end (next to the send button). Same one-row height budget as the built-in tool-row chrome.
8. **Command row** — a custom renderer for the demo command `/dsh-demo`. The slot is keyed by command name; the host half (`src/commands.ts`) registers the command itself, and `src/client/commandview.ts` registers the row with `key: DEMO_COMMAND_NAME`. Type `/dsh-demo anything` in the input to see the row render the command lifecycle (line + settled outcome). The host half also registers `/hello` (replies `world`) with **no** row — it renders through the default GenericCommandCard, the contrast case proving slash commands work with zero UI registration.
9. **General item** — a preference row in Settings → General (a toggle with local state, self-contained like the built-in Language / Appearance rows).
10. **Plugins tab** — a new tab ("模板示例") in the Settings → Plugins page; the options' `label` is the tab text.
11. **Settings action** — a button in the settings panel header, before Close.
12. **Header action** — a toggle button beside the session title (the action row also hosts the built-in preset / jobs / subagent buttons).
13. **Composer dock** — a status strip under the composer card. Unlike `input.dock`, this slot renders inside the bar's width column, so it inherits the card's constraint — mirror StatsLine's full alignment (`--dsh-chat-content-width` + `margin: 0 auto` + centered text), no self-positioning needed.
14. **Assistant action** — a "收藏" toggle button on every finalized AI message (the same row hosts message-feedback's copy/rating).

## How a surface is registered

Each UI surface lives in its own module under `src/client/` and exports one `register*` function; the client entry (`src/client/index.ts`) calls them in `apply`. The pattern is always:

```ts
// src/client/<surface>.ts
import type { Context } from '@deepseek-ai/cordis'

export function registerXxx(ctx: Context): void {
  ctx.slots.inject('<slot.name>', () => ctx.slots.register(
    {
      name: '<slot.name>',
      id: NAMESPACE,   // unique within the slot; entries render by ascending `order`
      order: 30,
      // session-scoped slots only: inject factory receives the sessionId
      inject: (sessionId) => ({ sessionId }),
    },
    XxxComponent,
  ))
}
```

Minimal structural types for `ctx.slots` live in `src/client/types.ts` (the template never imports `@deepseek-ai` client packages; the real four-share props types come from `dsh-client-ui-slots` when you type components fully).

## Other framework slots this template does NOT implement

The harness declares many more additive slots; the ones a plugin can register into include:

- **Sidebar**: `sidebar.workspaces`, `sidebar.settings` (replacement seats).
- **Conversation chrome**: `conversation.input.overlay` (full-width overlay — built-in: slash menu), `conversation.input.plan` / `.model` (named seats).
- **Chat content**: `conversation.chat.node` (keyed business message nodes — see the harness cookbook `docs/cookbook/adding-a-conversation-node.md`), `conversation.chat.turnTail` (chain — built-in: deliverables), `conversation.view` (new tab — built-in: trajectory).
- **Tool**: `tool.call.toolview` (keyed by tool name — built-in: skill); host-side `presentCall` / `presentationMeta` render intents remain undemoed.
- **Settings**: `settings.section` (a whole new settings page), `settings.onboarding`.

Slot declarations and their owner props live in the harness client packages (`packages/client/ui-conversation/src/client/contract/slots.ts`, `ui-sidebar/.../contract/slots.ts`, `ui-tool/...`, `ui-settings/...`, `ui-layout/...`).

## Follow the framework

The template deliberately does not invent its own look or layout values:

- **Colors** come only from the harness theme tokens (`--dsw-alias-*`, defined in the `ui-theme` package) — no literal colors.
- **Layout** comes only from the harness layout variables (`--dsh-*`, e.g. `--dsh-composer-card-max-width`, `--dsh-composer-dock-inset`, `--dsh-chat-content-width`) — no hand-picked widths.
- **Slots are used as declared**: read the owner props and scope the contract gives you; never register into a slot the framework did not declare, and never re-type a share the framework already derives.
- **When in doubt, mirror the closest built-in registrant** (QueueDock, GoalDock, StatsLine, …) instead of inventing a new pattern.

## Adding a new surface to this template

1. Add `src/client/<surface>.ts` with a `registerXxx(ctx)` function (copy the pattern above).
2. Call it from `apply` in `src/client/index.ts`.
3. Add its styles to `src/client/styles.ts` (all `dtpl-*` classes, theme tokens only).
4. Add a row to the index table above and rebuild: `pnpm build` then refresh the GUI page (the client bundle's rev query cache-busts).
