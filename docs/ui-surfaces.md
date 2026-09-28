# UI surfaces

[English](ui-surfaces.zh.md) | **中文**

The client half registers on fourteen slots. Each one is a separate module under `src/client/`, and the entry (`src/client/index.ts`) calls one `register*` function per module.

Every registration goes through `ctx.slots.inject(name, () => ctx.slots.register(...))`. That form waits for the owning package to declare the slot, removes the contribution when the declaration collapses, and leaves with the plugin's fiber. A bare `ctx.slots.register` into an undeclared slot throws.

## Index

| # | Slot | Cardinality | Scope | Module | What it shows |
|---|---|---|---|---|---|
| 1 | `plugins.bundle.config` | keyed | root | `config-card.tsx` | The configuration form on the bundle's Plugins page |
| 2 | `sidebar.footer.action` | list | root | `sidebar-action.tsx` | A button in the sidebar footer |
| 3 | `conversation.input.dock` | list | session | `input-dock.tsx` | A status strip above the composer |
| 4 | `shell.overlay` | list | root | `shell-overlay.tsx` | A frame-wide floating pill |
| 5 | `conversation.session.header.utilities` | list | session | `header-utilities.tsx` | A badge beside the session title |
| 6 | `conversation.input.left` | list | session | `input-left.tsx` | A control at the left end of the input card |
| 7 | `conversation.input.right` | list | session | `input-right.tsx` | A control at the right end of the input card |
| 8 | `conversation.chat.commandview` | keyed | session | `commandview.tsx` | The custom row for `/dsh-demo` |
| 9 | `settings.general.item` | list | root | `general-item.tsx` | One preference row in Settings → General |
| 10 | `settings.plugins.tab` | list | root | `plugins-tab.tsx` | A tab in the Plugins settings section |
| 11 | `settings.action` | list | root | `settings-action.tsx` | A button in the settings header |
| 12 | `conversation.session.header.actions` | list | session | `header-actions.tsx` | A session-title action button |
| 13 | `conversation.composer.dock` | list | session | `composer-dock.tsx` | A status strip under the composer card |
| 14 | `conversation.chat.assistant-actions` | list | session | `assistant-actions.tsx` | A per-message button on AI replies |

Row 1 is keyed by the package name from `NAMESPACE`; row 8 is keyed by `DEMO_COMMAND_NAME`, which the host half also uses in `src/commands.ts`. The other twelve are list entries and need an `id` and an `order`.

## The configuration form (row 1)

`plugins.bundle.config` is the seat a bundle uses to contribute its own configuration page. The Plugins page renders the entry between the bundle's description and its rows, and passes exactly one thing:

- `view: 'page'` — render the form. (`'summary'` asks for a one-line description instead; the template's card handles both.)

It passes **no `form`**. A bundle's form has to come from `ctx.configForms`, keyed by the plugin's settings namespace. `formFor()` in `ui-plugin-manager` builds a `ConfigPageForm`, but it feeds only `plugins.item` and `plugins.row.config`, so a component reading `form` from this seat always gets `undefined` and the page reports the plugin as not loaded. `config-form.ts` holds the namespace's `ConfigForm`, projects its snapshot, and republishes only when the fact moves — the reference stability the renderer's hook binding depends on. The component itself keeps no subscription machinery; writes go out through the controller as a plain callback carrying the revision the page read.

A failed save is recoverable because the draft lives in component state and the controller's `mutate` is awaited inside `try`/`finally`.

The matching host half is `Config` fields carrying `.volatile()` in `src/index.ts`. The Loader derives the settings namespace from the `id` of the row in `cordis.patch.yml`; there is no allowlist to add a plugin to and no separate registration to call.

## Choosing a surface

Pick a slot that already allocates space for what you are adding. For a status strip, `conversation.composer.dock` is the intended seat — it sits outside the composer card but inside the input column, beside the host's own stats line. Use `shell.overlay` only when the thing genuinely floats over the frame and its placement is known.

These seats are declared by other packages and are not all empty. `sidebar.footer.action` and `shell.overlay` both have registrants today, as does `settings.action`; a list entry picks its place with `order`. The live tree is the authority: query `Slots.listSubTree` (or `cordis_inspect` with `what: "client"`) to read each slot's current occupants, cardinality, and props before you change a slot.

## Conventions for a client half

- **No runtime package imports.** `react` comes from the browser platform module table. Harness client packages appear only as `import type {} from '.../client'`, which is erased and creates no module request. Importing another feature plugin's values is prohibited; share behavior through services and UI through slots.
- **Copy is locale-owned.** Every user-visible string lives in `src/client/locales.ts` and reaches the component through the `t` seat that the registration's `locale` option provides. List labels use a thunk (`label: () => t('key')`) so a locale switch needs no re-registration.
- **Styling follows the host.** The framework's styles are the plugin's styles. `src/client/styles.ts` references `--dsw-alias-*` semantic aliases and copies the host's own geometry conventions; it does not define a second look for a control the host already styles. The rules it follows, from [docs/web-styling.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/web-styling.md): neutral borders draw at 0.5px; an elevated surface sets `border: 0` and takes `box-shadow: var(--dsw-elevation-panel)` rather than pairing a border token with a shadow; corner radii come from the `--dsw-radius-*` scale and every full-round radius is paired with `corner-shape: round`; font sizes come from the host's 12/13/14/16 scale and are always paired with a line height; hover uses `--dsw-alias-interactive-bg-hover` and disabled uses `opacity: 0.45`; the theme's focus ring is never suppressed. The `dtpl-` class prefix must stay unique to this package, because a shared prefix lets two plugins' rules bleed into each other.
- **Tokens are a checked-in snapshot.** `tests/support/theme-tokens.ts` lists the tokens this package may reference, plus the theme version they were verified against, and `tests/theme-tokens.client.spec.ts` enforces the list and fails when the installed theme moves. The theme's token sheets are not published, so an out-of-tree package cannot read them at test time. That guard is not decorative: this package's first stylesheet referenced `--dsw-alias-shadow-popup`, which does not exist, and the overlay's shadow silently did nothing.
- **Effects dispose.** The stylesheet is registered inside `ctx.effect` and returns a cleanup that removes the node, so reloading the plugin does not accumulate stylesheets. The client half has no timers or global listeners; the host half's heartbeat in `src/index.ts` is wrapped in `ctx.effect` for the same reason.
- **The factory is side-effect-free.** `lib/client.js` registers a lazy factory; work happens in `apply`.
