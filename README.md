# dsh-plugin-template

**English** | [简体中文](README.zh.md)

A ready-to-run, ready-to-install starter template for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) plugins. It demonstrates the six most common plugin shapes in one minimal installable bundle:

- **Config** — `Config` interface + Schemastery schema; validation and defaults apply at load time ([docs](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.md))
- **Tool** — `ctx.tools.register(defineTool(...))` registers a model-callable tool ([docs](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/tool.md))
- **Events** — `ctx.on` / `ctx.emit` with declaration merging for typed events ([docs](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/events.md))
- **Service** — a class-form plugin that provides a service to other plugins ([docs](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/service.md))
- **Hook** — a `tools/pre-execute` permission gate that denies tool calls by config ([docs](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/extension-cookbook.md))
- **Browser half (client)** — `src/client.ts` registers a **clickable config card** under Settings → Plugins → Configurable; it writes `greeting` / `maxRetries` / `verbose` into the user settings document through the settings namespace, taking effect live. On a stock harness the card renders a read-only "not exposed" status card and explains why (see below).

The template follows the official [bundle distribution model](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.md): the package declares `dsh.bundle` plus `cordis.patch.yml`, and `dsh plugin add` activates it as a config layer.

## Directory structure

```
dsh-plugin-template/
├── package.json        # npm manifest + dsh.bundle / dsh.client declarations + prepare build script
├── tsconfig.json       # strict type-check configuration (tsc --noEmit)
├── tsdown.config.ts    # build config: Node library (lib/) + client bundle (lib/client.js), self-contained for git-install prepare
├── cordis.patch.yml    # bundle config layer: inserts the plugin rows
├── dev/cordis.yml      # local dev overlay (points at source; use with dsh web --patch; host half only)
├── src/
│   ├── index.ts        # main plugin: Config + tool + events + effect, config wired through the settings namespace
│   ├── client.ts       # browser half: clickable config card (settings.plugin.item slot)
│   ├── service.ts      # optional example: Service provider (disabled by default)
│   └── hook.ts         # optional example: hook permission gate (disabled by default)
└── test/smoke.mjs      # smoke test on the build output (incl. settings wiring unit test)
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
> For the Web GUI and the config card below, use the `web` profile (`= dsh-base` + `dsh-web-app`) — see [testing the config card](#testing-the-config-card-in-the-gui).

### Local development (modifying the plugin)

From the root of a [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) source checkout, load this repo's source directly via an overlay (no install, no build):

```sh
pnpm dsh web --patch /absolute/path/to/dsh-plugin-template/dev/cordis.yml
```

Set `name` in `dev/cordis.yml` to this repo's absolute path on your machine, open `http://127.0.0.1:3080`, and ask the model to call the `greet` tool.

> ⚠️ A `--patch` overlay only loads the plugin's **host half** (module resolution cannot reach package-level declarations).
> To test the browser-half config card you must install into a profile (resolved by `name: dsh-plugin-template`) — see the next section.

Run the checks yourself during development:

```sh
pnpm install
pnpm typecheck
pnpm build
node test/smoke.mjs
```

> If this repo sits INSIDE a `deepseek-harness` checkout (nested, as in the harness repo root), `pnpm install` is captured by the parent workspace and installs nothing here — the template is not a workspace member. Use `pnpm install --ignore-workspace` (pnpm ≥9.5) so the template installs its own `node_modules` from its own lockfile; or clone the template standalone.

### Testing the config card (in the GUI)

The config card renders in the browser and depends on dsh's client-modules discovering the `dsh.client` declaration **by package name**, so the package must be installed into a profile (a `--patch` source path won't do):

```sh
# 1. Build (produces lib/index.js + lib/client.js)
cd /path/to/dsh-plugin-template && pnpm build

# 2. Install into the web profile (= dsh-base + dsh-web-app, full GUI)
dsh plugin --profile web add /path/to/dsh-plugin-template

# 3. Boot the web GUI (`dsh web` is equivalent to `dsh --profile web`)
dsh web
```

Open `http://127.0.0.1:3080`:

1. Bottom-left **Settings** → **Plugins** → **Configurable** tab: you should see a `dsh-plugin-template` card. On a stock harness it renders a read-only "not exposed" status card (see below); after the one-line harness change it renders the editable `greeting` / `maxRetries` / `verbose` fields;
2. Change `greeting`, click **Save** — the status line should confirm it takes effect immediately;
3. Back in a session, ask the model to call the `greet` tool — you should see the new greeting (the host half reads the resolved namespace value live, no restart);
4. The change lands in the settings document (`settings.yaml` under `$DSH_HOME`) and survives restarts; to restore a default, edit the field back or clear it in the card.

After editing `src/client.ts`, rerun `pnpm build` and refresh the page (the client bundle's rev query cache-busts).

### The config card on a stock harness (no source edits)

The card is a browser plugin (`src/client.ts`) that binds the settings namespace `dsh-plugin-template` through the `settingsScope` service. It always renders — but on a stock harness it shows a read-only "not exposed" status card instead of editable fields. Why: dsh's web gateway serves settings namespaces only from an explicit allowlist (`WEB_SETTINGS_NAMESPACES` in `packages/host/apiproxy/src/api-proxy.ts`), and a namespace absent from it answers `settings-not-exposed` even when its owner plugin registered it. This is a harness-side registration decision (the same source comment calls moving the declaration into `settings.register()` "deferred work"), not a template defect: the built-in cards render because their namespaces (`shell`, `agent-loop`, …) are allowlisted, and there is currently no plugin-side channel to add one — the gateway's RPC map is compile-time fixed and no registration flag exists yet.

What works on a stock harness with zero edits:
- the entire host half — the `greet` tool, events, the service, the hook gate — including **live config reads**: writes are only gated at the web RPC, the plugin itself reads the resolved namespace value on every execution;
- the card slot itself: the card appears under Settings → Plugins → Configurable and explains the exposure state instead of vanishing silently.

To make the card editable, pick one:
1. add `'dsh-plugin-template'` to `WEB_SETTINGS_NAMESPACES` in `packages/host/apiproxy/src/api-proxy.ts` (one line; rebuild/restart the harness; lost when you update the checkout):

```ts
const WEB_SETTINGS_NAMESPACES = [
  'agent-loop', 'shell', 'locale', 'permission', 'ui-conversation', 'ui-theme', 'web-search-deepseek',
  'dsh-plugin-template',   // ← add this line
] as const
```

2. wait for the harness's deferred work — moving the exposure declaration into `settings.register()` — which this template already targets by registering the namespace the canonical way (`installSettingsSection`).

## Making it your own plugin

1. Rename the package: keep `package.json` `name` (npm name, e.g. `dsh-my-plugin`), `src/index.ts` `name`, and `cordis.patch.yml` `id`/`name` consistent; when renaming the `./service` subpath, update `exports`/`files` too. **Renaming also touches three browser-half spots:** the client bundle `id` in `tsdown.config.ts` (`__ModuleLoader__.load({ id })`), `NAMESPACE` in `src/client.ts`, and `dsh.client` in `package.json` (if you need `inject`).
2. Change the `Config` interface and `Config` schema: anything two deployments should be able to set differently must be a config field ([design principles](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.md#design-principles)). The config is wired to the settings namespace — does the GUI card auto-render a form from your schema? No: the card in `src/client.ts` is hand-written; add a field row there for each new config field.
3. Register your tool in `apply`: `ctx.tools.register(defineTool({...}))`; `execute` returns the canonical value declared by `output.schema`, and `output.render` is the pure function for model-visible rendering ([tool reference](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-tool.md)).
4. To provide capabilities to other plugins, enable `src/service.ts` and uncomment its row in `cordis.patch.yml`.
5. Remember to `declare module '@deepseek-ai/cordis'` to merge `Context` / `Events` types — that is what keeps cross-package boundaries type-safe.
6. To intercept tool calls, act as a permission gate, or respond to system hooks, enable `src/hook.ts` (uncomment its `cordis.patch.yml` row): `ctx.on('tools/pre-execute', ...)` returns `{ kind: 'deny', reason }` or calls `next()` to allow ([extension cookbook](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/extension-cookbook.md)).
7. Config reads: every read in `src/index.ts` goes through `configSource()` (the resolved settings-namespace value, falling back to the composition entry). If you derive registration-level facts from config in `apply` (e.g. register different tools by config), rebuild them in `installSettingsSection`'s `onChange` rather than reading only at execution points (see [bash-local](https://github.com/deepseek-ai/deepseek-harness/blob/main/packages/shell/bash-local/src/index.ts)).

## How the browser half works

- `package.json` declares `dsh.client: { platform: "web" }` + `exports["./client"]` → dsh's client-modules discovers it and loads `lib/client.js` as a browser plugin;
- `src/client.ts` registers a card in the `settings.plugin.item` slot and binds the `dsh-plugin-template` namespace via the `settingsScope` service: reads snapshots, stages drafts, and writes field-by-field on save (revision-fenced);
- the host half (`src/index.ts`) registers the same namespace with `installSettingsSection` (the cordis.yml config is the `base` layer) and reads the resolved value lazily in the tool → saving takes effect immediately;
- at runtime the client half depends only on `react` (provided by the browser platform module table); everything else goes through `ctx` services and no `@deepseek-ai` client package is imported — keep that discipline when editing the template.

## Publishing

- **npm**: `pnpm publish` (`files` already includes the build output and the patch; no extra steps)
- **tarball**: `pnpm pack`, then `dsh plugin --profile demo add ./dsh-plugin-template-0.1.0.tgz`
- **git**: `dsh plugin add github:you/dsh-plugin-template` (combined with the `allowBuilds` step above)

## Related docs

- Plugin development intro: [basic/index.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/index.md)
- Plugin config: [basic/config.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.md)
- Tool development: [basic/tool.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/tool.md)
- Packaging & installation: [basic/publish.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.md)
- Plugins & lifecycle: [framework/index.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/index.md)
- Services & dependencies: [framework/service.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/service.md)
- Event system: [framework/events.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/events.md)
- Cordis tutorial: [cordis-tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cordis-tutorial/index.md)
