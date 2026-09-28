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

`plugins.bundle.config` is the seat a bundle uses to contribute its own configuration page. The Plugins page renders the entry between the bundle's description and its rows, and passes two things:

- `view: 'page'` — render the form. (`'summary'` asks for a one-line description instead; the template's card handles both.)
- `form` — `ConfigPageForm`, holding the host-accepted `state` and a revision-fenced `mutate(ops, expectedRevision)`.

Because the owner supplies the form, the page does not read `ctx.configForms`, does not subscribe to a settings scope, and does not call `ctx.get`. A failed save is recoverable because the draft lives in component state and `mutate` is awaited inside `try`/`finally`.

The matching host half is `Config` fields carrying `.volatile()` in `src/index.ts`. The Loader derives the settings namespace from the `id` of the row in `cordis.patch.yml`; there is no allowlist to add a plugin to and no separate registration to call.

## Choosing a surface

Pick a slot that already allocates space for what you are adding. For a status strip, `conversation.composer.dock` is the intended seat — it sits outside the composer card but inside the input column, beside the host's own stats line. Use `shell.overlay` only when the thing genuinely floats over the frame and its placement is known.

These seats are declared by other packages and are not all empty. `sidebar.footer.action` and `shell.overlay` both have registrants today, as does `settings.action`; a list entry picks its place with `order`. The live tree is the authority: query `Slots.listSubTree` (or `cordis_inspect` with `what: "client"`) to read each slot's current occupants, cardinality, and props before you change a slot.

## Conventions for a client half

- **No runtime package imports.** `react` comes from the browser platform module table. Harness client packages appear only as `import type {} from '.../client'`, which is erased and creates no module request. Importing another feature plugin's values is prohibited; share behavior through services and UI through slots.
- **Copy is locale-owned.** Every user-visible string lives in `src/client/locales.ts` and reaches the component through the `t` seat that the registration's `locale` option provides. List labels use a thunk (`label: () => t('key')`) so a locale switch needs no re-registration.
- **Styling uses theme tokens.** Colors come from `--dsw-alias-*`; no literal color values. `font-weight` stays at or below 500. The `dtpl-` class prefix must stay unique to this package, because a shared prefix lets two plugins' rules bleed into each other.
- **Effects dispose.** The stylesheet is registered inside `ctx.effect` and returns a cleanup that removes the node, so reloading the plugin does not accumulate stylesheets. The client half has no timers or global listeners; the host half's heartbeat in `src/index.ts` is wrapped in `ctx.effect` for the same reason.
- **The factory is side-effect-free.** `lib/client.js` registers a lazy factory; work happens in `apply`.
