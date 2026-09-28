# dsh-plugin-template

English | [中文](README.zh.md)

A ready-to-run, ready-to-install starter template for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) plugins. It demonstrates the most common plugin shapes in one minimal installable bundle:

- **Config** — a `Config` interface plus a Schemastery schema whose live fields carry `.volatile()`, so the Plugins page can edit them without a restart ([docs](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-settings-card.md))
- **Tool** — `ctx.tools.register(defineTool(...))` registers a model-callable tool with a `card`-tagged render intent ([docs](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-tool.md))
- **Events** — `ctx.on` / `ctx.emit` with declaration merging for typed events ([docs](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/events.md))
- **Service** — a class-form plugin that provides a service to other plugins ([docs](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/service.md))
- **Hook** — a `tools/pre-execute` permission gate that denies tool calls by config ([docs](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/extension-cookbook.md))
- **Browser half (client)** — `src/client/` registers browser UI on **fourteen surfaces** (index: [docs/ui-surfaces.md](docs/ui-surfaces.md)): a **configuration form** on the Plugins page, a **sidebar footer action**, an **input dock** strip above the composer, a **shell overlay**, a **header utility** badge, **input tool-row buttons** (left/right), a custom **command row** for `/dsh-demo`, a **General settings row**, a **Plugins settings tab**, a **settings header action**, a **session header action**, a **composer dock** strip, and **per-message actions** on AI replies — plus a `presentResult` render intent on the `greet` tool.

The template follows the official [bundle distribution model](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.md): the package declares `dsh.bundle` plus `cordis.patch.yml`, and `dsh plugin add` activates it as a config layer.

## Directory structure

```
dsh-plugin-template/
├── package.json        # npm manifest + dsh.bundle / dsh.client declarations + prepare build script
├── tsconfig.json       # strict type-check configuration (tsc --noEmit)
├── tsdown.config.ts    # build config: Node library (lib/) + client bundle (lib/client.js)
├── vitest.config.ts    # unit test config (node by default; specs opt into jsdom)
├── cordis.patch.yml    # bundle config layer: inserts the plugin rows
├── locale/             # plugin display metadata read by the Plugins page
│   ├── en.json         #   meta.title / meta.description (the discovery entry)
│   └── zh.json
├── icon.svg            # optional bundle card artwork
├── dev/cordis.yml      # local dev overlay (points at source; use with dsh web --patch)
├── docs/
│   ├── ui-surfaces.md  # where the plugin registers UI + index of every slot (bilingual: ui-surfaces.zh.md)
├── src/
│   ├── index.ts        # main plugin: Config + tool + events + effect
│   ├── commands.ts     # host half: demo slash commands /hello (replies world) and /dsh-demo (custom row)
│   ├── service.ts      # optional example: Service provider (disabled by default)
│   ├── hook.ts         # optional example: hook permission gate (disabled by default)
│   └── client/         # browser half: one module per UI surface (see docs/ui-surfaces.md)
│       ├── index.ts        # client entry: inject + apply, registers the locale dictionary and styles
│       ├── constants.ts    # shared NAMESPACE + LOCALE_NAMESPACE + DEMO_COMMAND_NAME
│       ├── locales.ts      # typed en/zh dictionaries (all user-visible copy lives here)
│       ├── styles.ts       # one injected <style> with all dtpl-* classes (theme tokens only)
│       ├── config-card.tsx # plugins.bundle.config: the configuration form on the Plugins page
│       ├── sidebar-action.tsx # sidebar.footer.action
│       ├── input-dock.tsx  # conversation.input.dock
│       ├── shell-overlay.tsx # shell.overlay
│       ├── header-utilities.tsx # conversation.session.header.utilities
│       ├── input-left.tsx  # conversation.input.left
│       ├── input-right.tsx # conversation.input.right
│       ├── commandview.tsx # conversation.chat.commandview
│       ├── general-item.tsx # settings.general.item
│       ├── plugins-tab.tsx # settings.plugins.tab
│       ├── settings-action.tsx # settings.action
│       ├── header-actions.tsx # conversation.session.header.actions
│       ├── composer-dock.tsx # conversation.composer.dock
│       └── assistant-actions.tsx # conversation.chat.assistant-actions
└── test/smoke.mjs      # smoke test on the build output
└── tests/              # unit tests
    ├── host-half.spec.ts   # the host half on a real cordis Context
    ├── slot-registration.client.spec.ts # every surface registers, and leaves with the fiber
    ├── config-card.client.spec.tsx       # the configuration form's user-visible behavior
    ├── surfaces.client.spec.tsx          # command row, sidebar, input, per-message button
    ├── locale-and-styles.client.spec.ts  # dictionary and stylesheet rules
    └── support/           # test doubles: slot registry, locale
```

## Quick start

### Install as a bundle (for users)

From any directory, install this package (or your fork) into a dsh profile:

```sh
# local directory
dsh plugin --profile demo add /path/to/dsh-plugin-template

# or directly from GitHub (replace with your own repo after forking)
dsh plugin --profile demo add github:you/dsh-plugin-template
```

A GitHub install pulls **source**; pnpm runs `prepare` (i.e. `tsdown`) to build `lib/`. On pnpm ≥10 the first git-dependency prepare is refused; add the package name pnpm prints to the profile's `pnpm-workspace.yaml` and retry:

```yaml
allowBuilds:
  dsh-plugin-template: true
```

> This allowlist authorizes executing that package's code at install time — only allow source you trust, and prefer pinning a commit: `github:you/dsh-plugin-template#<sha>`.

Verify the config layer and boot:

```sh
dsh --profile demo --dump-config   # should show a "# == dsh-plugin-template" layer
dsh --profile demo
```

> Note: a custom-named profile (e.g. `demo`) contains only `dsh-base` and is **headless** (no GUI).
> For the Web GUI and the configuration form below, use the `web` profile (`= dsh-base` + `dsh-web-app`) — see [testing the form](#testing-the-configuration-form-in-the-gui).

### Local development (modifying the plugin)

From the root of a [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) source checkout, load this repo's source directly via an overlay (no install, no build):

```sh
pnpm dsh web --patch /absolute/path/to/dsh-plugin-template/dev/cordis.yml
```

Set `name` in `dev/cordis.yml` to this repo's absolute path on your machine, open `http://127.0.0.1:3080`, and ask the model to call the `greet` tool.

> A `--patch` overlay only loads the plugin's **host half** (module resolution cannot reach package-level declarations).
> To test the browser half you must install into a profile (resolved by `name: dsh-plugin-template`) — see the next section.

Run the checks yourself during development:

```sh
pnpm install
pnpm typecheck
pnpm test:unit
pnpm build
pnpm smoke
pnpm test
```

`typecheck` runs `tsc` over the source, the tests, and the build config. `test:unit` runs the vitest specs; `smoke` runs against `lib/`; `test` runs all of it in that order.

> If this repo sits INSIDE a `deepseek-harness` checkout (nested, as in the harness repo root), `pnpm install` is captured by the parent workspace and installs nothing here — the template is not a workspace member. Use `pnpm install --ignore-workspace` so the template installs its own `node_modules` from its own lockfile; or clone the template standalone.

### Testing the configuration form (in the GUI)

The form renders in the browser and depends on dsh's client-modules discovering the `dsh.client` declaration **by package name**, so the package must be installed into a profile (a `--patch` source path won't do):

```sh
# 1. Build (produces lib/index.js + lib/client.js)
cd /path/to/dsh-plugin-template && pnpm build

# 2. Install into the web profile (= dsh-base + dsh-web-app, full GUI)
dsh plugin --profile web add /path/to/dsh-plugin-template

# 3. Boot the web GUI (`dsh web` is equivalent to `dsh --profile web`)
dsh web
```

Open `http://127.0.0.1:3080`, go to the **Plugins** page in the sidebar, and select **Plugin Template**:

1. The bundle's page renders a configuration form with `greeting`, `maxRetries`, and `verbose`;
2. Change `greeting` and click **Save** — the deployment accepts the values and the status line reports success;
3. Back in a session, ask the model to call the `greet` tool — it uses the new greeting (the host half reads `config.greeting.get()` on every call, no restart);
4. The change lands in the settings document under `$DSH_HOME` and survives restarts. **Reset to default** clears the field so it re-inherits the value from `cordis.patch.yml`.

There is no allowlist to edit and no restart step: a plugin entry whose `Config` has at least one `.volatile()` field is served automatically, and the Plugins page passes this page its `form` (accepted values plus a revision-fenced `mutate`).

After editing the client half (`src/client/`), rerun `pnpm build` and refresh the page (the client bundle's rev query cache-busts).

## Making it your own plugin

1. Rename the package: keep `package.json` `name` (npm name, e.g. `dsh-my-plugin`), `src/index.ts` `name`, and `cordis.patch.yml` `id`/`name` consistent. **Renaming also touches browser-half spots:** the client bundle `id` in `tsdown.config.ts` (`__ModuleLoader__.load({ id })`), `NAMESPACE` in `src/client/constants.ts`, `dsh.client.inject` in `package.json`, and `NAMESPACE` in `src/client/constants.ts` (the Plugins page keys off it), plus `locale/en.json`. When renaming the `./service` subpath, update `exports`/`files` too.
2. Change the `Config` interface and schema: anything two deployments should set differently must be a config field ([design principles](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.md#design-principles)). Mark the fields a user should be able to change without a restart with `.volatile()`, and read them with `.get()` at the point of use.
3. Add a row to the form in `src/client/config-card.tsx` for each new editable field: a label key, a hint key, and a branch in `FIELDS` / `buildOps` / `draftValue`. The form is hand-written — it does not render itself from your schema.
4. Register your tool in `apply`: `ctx.tools.register(defineTool({...}))`; `execute` returns the canonical value declared by `output.schema`, and `output.render` is the pure function for model-visible rendering while `presentResult` is the UI render intent ([tool reference](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-tool.md)).
5. To provide capabilities to other plugins, enable `src/service.ts` and uncomment its row in `cordis.patch.yml`.
6. Remember to `declare module '@deepseek-ai/cordis'` to merge `Context` / `Events` types — that is what keeps cross-package boundaries type-safe. Document each event's `@mode` and every payload `@param`.
7. To intercept tool calls or act as a permission gate, enable `src/hook.ts` (uncomment its `cordis.patch.yml` row): `ctx.on('tools/pre-execute', ...)` returns `{ kind: 'deny', reason }` or calls `next()` to allow ([extension cookbook](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/extension-cookbook.md)).
8. Add a locale key to `src/client/locales.ts` for every new user-visible string, in both `en` and `zh`. Read it through the `t` seat the registration's `locale` option provides; list-slot labels use a thunk (`label: () => t('key')`) so a locale switch needs no re-registration.

## How the browser half works

- `package.json` declares `dsh.client: { platform: "web" }` + `exports["./client"]` — dsh's client-modules discovers it and loads `lib/client.js` as a browser plugin;
- `lib/client.js` is a lazy-CJS factory in the `window.__ModuleLoader__.load({ id, factory })` format. `tsdown.config.ts` reproduces it by hand; the repo's own preset lives in `packages/client/tsdown.client.ts` and is not published;
- the client entry (`src/client/index.ts`) registers the locale dictionary and the stylesheet through `ctx.effect` — both dispose with the plugin — then calls one `register*` per surface;
- each surface registers through `ctx.slots.inject(name, () => ctx.slots.register(...))`, which waits for the owning declaration, removes the contribution when that declaration collapses, and leaves with the plugin fiber;
- at runtime the browser half depends only on `react`, supplied by the browser platform module table. No `@deepseek-ai` client package is imported at runtime — those appear only as `import type`, which is erased. Keep that discipline when editing the template.

## Tests

`pnpm test:unit` runs five specs. They use the real cordis `Context`, so fibers, effects, and disposal behave as they do in a profile:

- `tests/host-half.spec.ts` — the host half on a real assembly: the greet tool and both commands register, the greeting is read on every call rather than once at load, and the tool leaves when the fiber is disposed.
- `tests/slot-registration.client.spec.ts` — all fourteen surfaces land on declared slots, the configuration form is keyed by the package name, the command row by the command name, the Plugins tab label is a locale-following thunk, and every contribution plus the stylesheet and the dictionaries are gone after disposal.
- `tests/config-card.client.spec.tsx` — the form's user-visible behavior: the summary and page views, loading/unavailable/read-only states, which writes it submits and with which revision, clearing a field back to the deployment default, validation that blocks saving and stays reachable to assistive technology, and both save-failure paths leaving the form usable.
- `tests/surfaces.client.spec.tsx` — the command row's three states (running, succeeded, failed), the sidebar button keeping an accessible name in rail mode, the input control being an explicit non-submit button, and the per-message button addressing its message without printing its id.
- `tests/locale-and-styles.client.spec.ts` — the two client rules that rot quietly: every `t('…')` key exists in the dictionaries, and the stylesheet carries no literal colors and no font weight above 500.

`test/smoke.mjs` is separate and runs against `lib/`: it checks that the built artifact loads, the tool and commands work, and the permission gate denies and delegates. `pnpm test` runs typecheck, units, build, and smoke in that order.

The test doubles in `tests/support/` stand in for the harness client services. They cannot be the real ones: the published client entries are browser bundles that call `window.__ModuleLoader__.load(...)` at import time, so materializing one inside a Node test would pull a second React into the process. The doubles are cordis services, so they keep the property that matters here — contributions are mounted on the caller's fiber and are torn down with it — and they enforce that an undeclared slot throws. Their comments say exactly what they do and do not model.

## Publishing

- **npm**: `pnpm publish` (`files` already includes the build output, the patch, the metadata, and the icon)
- **tarball**: `pnpm pack`, then `dsh plugin --profile demo add ./dsh-plugin-template-0.2.0.tgz`
- **git**: `dsh plugin add github:you/dsh-plugin-template` (combined with the `allowBuilds` step above)

## Related docs

- Live configuration forms: [adding-a-settings-card.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-settings-card.md)
- Plugin development intro: [basic/index.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/index.md)
- Plugin config: [basic/config.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.md)
- Tool development: [basic/tool.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/tool.md)
- Packaging & installation: [basic/publish.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.md)
- Plugins & lifecycle: [framework/index.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/index.md)
- Services & dependencies: [framework/service.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/service.md)
- Event system: [framework/events.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/events.md)
- Client UI slots: [subsystems/slots.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/subsystems/slots.md)
- Cordis tutorial: [cordis-tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cordis-tutorial/index.md)
