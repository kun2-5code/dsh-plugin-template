# UI surfaces the plugin registers on

This template demonstrates registering a browser UI on **three** surfaces of the dsh web GUI. All of them go through the same slot API (`ctx.slots.inject(...)` + `ctx.slots.register(...)`) from the client half (`src/client/`); only the slot `name` differs. None of them depends on the `WEB_SETTINGS_NAMESPACES` allowlist — only the config card's *data path* (the settings namespace) is gated by it, and the card explains that state instead of vanishing.

## Index

| # | Slot | Where it appears | Scope | Implementation | Built-in reference |
|---|------|------------------|-------|----------------|--------------------|
| 1 | `settings.plugin.item` | 设置 → 插件 → Configurable（配置卡片） | root | `src/client/config-card.ts` | ui-settings-plugins (bash / agent-loop / web-search cards) |
| 2 | `sidebar.footer.action` | 左侧栏底部、"设置"旁（按钮） | root | `src/client/sidebar-action.ts` | declared by ui-sidebar; **no built-in registrant (blank seat)** |
| 3 | `conversation.input.dock` | 输入卡片上方一整行（状态条） | session | `src/client/input-dock.ts` | ui-goal (GoalDock) |

## Where each one shows up

1. **Config card** — Settings → Plugins → Configurable tab. Editable fields once the harness exposes the `dsh-plugin-template` namespace (see README "The config card on a stock harness"); otherwise a read-only explainer card.
2. **Sidebar footer action** — a button at the bottom of the left sidebar, next to Settings. Wide sidebar shows "模板示例操作"; the collapsed rail shows a state dot only (reads the `wide` owner prop).
3. **Input dock** — a status strip above the composer card in a conversation. Session-scoped: the registration's `inject` factory receives the `sessionId` and hands it to the component. **Layout note:** `conversation.input.dock` renders as a full-width row inside the composer stack; width and centering are each entry's own responsibility. Align with the composer card exactly as the built-in QueueDock does — constrain the width with the framework's layout variables (`--dsh-composer-card-max-width`, `--dsh-composer-dock-inset`) and center with `margin: 0 auto`. Never invent your own widths.

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

- **Sidebar**: `sidebar.workspaces`, `sidebar.settings` (replacement seats), `sidebar.footer.action` (done above).
- **Conversation chrome**: `conversation.session.header.actions` / `.utilities` (top action row), `conversation.composer.dock` (under the composer card), `conversation.input.left` / `.right` (in-card tool row), `conversation.input.overlay` (full-width overlay), `conversation.input.plan` / `.model` (named seats).
- **Chat content**: `conversation.chat.node` (keyed business message nodes — see the harness cookbook `docs/cookbook/adding-a-conversation-node.md`), `conversation.chat.assistant-actions` (per-message buttons), `conversation.chat.turnTail` (chain), `conversation.chat.commandview` (slash-command rows), `conversation.view` (new tab).
- **Tool**: `tool.call.toolview` (keyed by tool name), plus the tool's own `presentCall` / `presentResult` render intents on the host side.
- **Global**: `shell.overlay` (frame-wide floating layer — badges, toasts).

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
