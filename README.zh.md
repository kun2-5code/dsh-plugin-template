# dsh-plugin-template

[English](README.md) | 中文

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）插件的开箱即用模版。它在一个最小可安装 bundle 里演示了最常见的几种插件形态：

- **Config** —— `Config` 接口加一个 Schemastery schema，其中可实时改写的字段带 `.volatile()`，于是 Plugins 页能在不重启的情况下编辑它们（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-settings-card.md)）
- **Tool** —— `ctx.tools.register(defineTool(...))` 注册一个模型可调用的工具，并带 `card` 标签的渲染意图（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-tool.md)）
- **Events** —— `ctx.on` / `ctx.emit`，用 declaration merging 得到带类型的事件（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/events.md)）
- **Service** —— 类形式的插件，向其它插件提供一个服务（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/service.md)）
- **Hook** —— 一个 `tools/pre-execute` 权限拦截器，按配置拒绝工具调用（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/extension-cookbook.md)）
- **浏览器半边（client）** —— `src/client/` 在 **十四个 UI 面** 上注册浏览器 UI（索引见 [docs/ui-surfaces.md](docs/ui-surfaces.md)）：Plugins 页上的**配置表单**、**侧栏底部动作**、输入卡片上方的**输入区 Dock**、**帧级浮层**、**会话头徽标**、输入卡片左右两端的**工具位按钮**、`/dsh-demo` 的**自定义命令行**、设置 → 通用 的**偏好行**、设置 → 插件 的**迁移页**、**设置页头部动作**、**会话头动作**、输入卡片下缘的**状态条**，以及 AI 回复上的**逐消息动作**；`greet` 工具另有一个 `presentResult` 渲染意图。

模版遵循官方 [bundle 分发模型](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.md)：包声明 `dsh.bundle` 与 `cordis.patch.yml`，`dsh plugin add` 把它作为一层配置激活。

## 目录结构

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

## 快速开始

### 作为 bundle 安装（给使用者）

在任意目录里把这个包（或你的 fork）装进一个 dsh profile：

```sh
# local directory
dsh plugin --profile demo add /path/to/dsh-plugin-template

# or directly from GitHub (replace with your own repo after forking)
dsh plugin --profile demo add github:you/dsh-plugin-template
```

从 GitHub 安装会拉**源码**，pnpm 随后执行 `prepare`（即 `tsdown`）构建出 `lib/`。pnpm ≥10 会拒绝第一次 git 依赖的 prepare；把 pnpm 打印出来的包名加进该 profile 的 `pnpm-workspace.yaml` 再重试：

```yaml
allowBuilds:
  dsh-plugin-template: true
```

> 这份白名单授权在安装时执行该包的代码——只允许你信任的源码，并且优先固定到某个提交：`github:you/dsh-plugin-template#<sha>`。

确认配置层并启动：

```sh
dsh --profile demo --dump-config   # should show a "# == dsh-plugin-template" layer
dsh --profile demo
```

> 注意：自定义名字的 profile（例如 `demo`）只含 `dsh-base`，是**无 GUI** 的。
> 要用 Web GUI 和下面的配置表单，请用 `web` profile（`= dsh-base` + `dsh-web-app`）——见[在 GUI 里测试配置表单](#testing-the-configuration-form-in-the-gui)。

### 本地开发（修改插件时）

在 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 源码仓库的根目录，用一个 overlay 直接加载本仓库的源码（无需安装、无需构建）：

```sh
pnpm dsh web --patch /absolute/path/to/dsh-plugin-template/dev/cordis.yml
```

把 `dev/cordis.yml` 里的 `name` 改成本机上的路径，写成 **`file://` URL**，打开 `http://127.0.0.1:3080`，让模型调用 `greet` 工具。裸绝对路径在 Windows 上会失败：Loader 把条目的 `name` 直接交给 `import()`，`D:\…` 会被解析成协议 `d:`，该条目以 `ERR_UNSUPPORTED_ESM_URL_SCHEME` 失败，插件根本不会加载。取 URL 形式：`node -e "console.log(require('node:url').pathToFileURL('<路径>').href)"`。

> `--patch` overlay 只加载插件的**宿主半边**（模块解析够不到包级声明）。
> 要测浏览器半边必须装进 profile（由 `name: dsh-plugin-template` 解析）——见下一节。

开发时自己跑检查：

```sh
pnpm install
pnpm typecheck
pnpm test:unit
pnpm build
pnpm smoke
pnpm test
```

`typecheck` 用 `tsc` 检查源码、测试与构建配置。`test:unit` 跑 vitest 那几份 spec；`smoke` 跑在 `lib/` 上；`test` 按这个顺序全跑一遍。

> 如果本仓库位于 `deepseek-harness` 检出目录**内部**（就像在 harness 仓库根目录那样），`pnpm install` 会被上层 workspace 接管，在这里什么也装不上——模版不是 workspace 成员。请用 `pnpm install --ignore-workspace`，让它按自己的 lockfile 装自己的 `node_modules`；或者把模版单独 clone 到别处。

<a id="testing-the-configuration-form-in-the-gui"></a>

### 在 GUI 里测试配置表单

表单在浏览器里渲染，依赖 dsh 的 client-modules **按包名**发现 `dsh.client` 声明，所以这个包必须装进 profile（`--patch` 的源码路径不行）：

```sh
# 1. Build (produces lib/index.js + lib/client.js)
cd /path/to/dsh-plugin-template && pnpm build

# 2. Install into the web profile (= dsh-base + dsh-web-app, full GUI)
dsh plugin --profile web add /path/to/dsh-plugin-template

# 3. Boot the web GUI (`dsh web` is equivalent to `dsh --profile web`)
dsh web
```

打开 `http://127.0.0.1:3080`，进入侧栏的 **Plugins** 页，选中 **Plugin Template**：

1. 该 bundle 的页面上会渲染出含 `greeting`、`maxRetries`、`verbose` 的配置表单；
2. 改掉 `greeting` 并点**保存**——部署接受这些值，状态行确认成功；
3. 回到会话里让模型调用 `greet` 工具——它用的是新的打招呼文案（宿主半边每次调用都读 `config.greeting.get()`，不需要重启）；
4. 改动会落进 `$DSH_HOME` 下的设置文档并在重启后保留。**恢复默认**会清除该字段，让它重新继承 `cordis.patch.yml` 里的值。

没有白名单要改，也不需要重启步骤：只要插件条目的 `Config` 至少有一个 `.volatile()` 字段，命名空间就会被自动服务；Plugins 页把 `form`（已接受的值加一个带 revision 围栏的 `mutate`）交给这个页面。

改完客户端半边（`src/client/`）后，重新 `pnpm build` 并刷新页面（客户端 bundle 的 rev 查询会破缓存）。

## 改成你自己的插件

1. 改名时保持一致：`package.json` 的 `name`（npm 名，例如 `dsh-my-plugin`）、`src/index.ts` 的 `name`、`cordis.patch.yml` 的 `id`/`name`。**改名也牵动浏览器半边**：`tsdown.config.ts` 里客户端 bundle 的 `id`（`__ModuleLoader__.load({ id })`）、`src/client/constants.ts` 的 `NAMESPACE`（Plugins 页靠它做键）、`package.json` 的 `dsh.client.inject`，以及 `locale/en.json`。改 `./service` 子路径时，`exports`/`files` 也要一起改。
2. 改 `Config` 接口与 schema：两次部署之间可能不同的一切都必须是配置字段（[设计原则](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.md#design-principles)）。用户应当能免重启修改的字段标上 `.volatile()`，并在读取处用 `.get()`。
3. 在 `src/client/config-card.tsx` 的表单里为每个新的可编辑字段加一行：标签键、提示键，以及 `FIELDS` / `buildOps` / `draftValue` 里对应的分支。表单是手写的——它不会从你的 schema 自动渲染。
4. 在 `apply` 里注册你的工具：`ctx.tools.register(defineTool({...}))`；`execute` 返回 `output.schema` 声明的正典值，`output.render` 是模型可见渲染的纯函数，`presentResult` 是 UI 渲染意图（[工具参考](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-tool.md)）。
5. 要向其它插件提供能力时，启用 `src/service.ts` 并在 `cordis.patch.yml` 里取消注释它那一行。
6. 记得用 `declare module '@deepseek-ai/cordis'` 合并 `Context` / `Events` 类型——这是跨包边界保持类型安全的手段。每个事件要写清 `@mode`，每个 payload 参数要写 `@param`。
7. 要拦截工具调用或充当权限闸门时，启用 `src/hook.ts`（取消注释 `cordis.patch.yml` 里那一行）：`ctx.on('tools/pre-execute', ...)` 返回 `{ kind: 'deny', reason }` 表示拒绝，调用 `next()` 表示放行（[扩展点手册](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/extension-cookbook.md)）。
8. 每加一条用户可见文案，就在 `src/client/locales.ts` 的 `en` 与 `zh` 里各加一个键，并通过注册项 `locale` 选项提供的 `t` 席位读取；list 槽的标签用 thunk（`label: () => t('key')`），这样切换语言不需要重新注册。

## 浏览器半边如何工作

- `package.json` 声明 `dsh.client: { platform: "web" }` 加 `exports["./client"]`——dsh 的 client-modules 发现它，把 `lib/client.js` 当浏览器插件加载；
- `lib/client.js` 是 `window.__ModuleLoader__.load({ id, factory })` 格式的惰性 CJS 工厂。`tsdown.config.ts` 手搓了这个格式；harness 仓库自己的 preset 在 `packages/client/tsdown.client.ts`，没有发布；
- 客户端入口（`src/client/index.ts`）先通过 `ctx.effect` 注册 locale 字典与样式表——两者都随插件一起撤销——再逐个调用各面的 `register*`；
- 每一面都通过 `ctx.slots.inject(name, () => ctx.slots.register(...))` 注册：它会等拥有方的声明出现，该声明消失时移除自己的贡献，并随插件 fiber 一起离开；
- 运行时浏览器半边只依赖 `react`，由浏览器平台模块表提供。不在运行时 import 任何 `@deepseek-ai` 客户端包——它们只以 `import type` 出现，会被类型擦除。改模版时请保持这个纪律。

## 测试

`pnpm test:unit` 跑五份 spec。它们用真实的 cordis `Context`，所以 fiber、effect 与撤销的行为跟 profile 里一致：

- `tests/host-half.spec.ts` —— 宿主半边在真实组装下的行为：greet 工具与两条命令完成注册；打招呼文案是每次调用现读，而不是加载时读一次；fiber 停用后工具随之消失。
- `tests/slot-registration.client.spec.ts` —— 十四个面都落在已声明的槽位上；配置表单以包名为键，命令行以命令名为键；插件迁移页的标签是跟随语言的 thunk；撤销之后所有贡献、样式表与字典都不见了。
- `tests/config-card.client.spec.tsx` —— 表单的用户可见行为：摘要与页面两种视图、加载中/不可用/只读三种状态、提交哪些写入并带哪个 revision、把字段改回部署默认值、既挡住保存又能被辅助技术读到的校验，以及两条保存失败路径之后表单仍然可用。
- `tests/surfaces.client.spec.tsx` —— 命令行的三种状态（执行中、成功、失败）、侧栏按钮在 rail 态仍保有无障碍名称、输入区控件是显式的非 submit 按钮、逐消息按钮能定位到消息却不把 id 印在界面上。
- `tests/locale-and-styles.client.spec.ts` —— 客户端两条容易悄悄退化的规则：每个 `t('…')` 的键都在字典里；样式表没有字面色值，`font-weight` 不超过 500。

`test/smoke.mjs` 是另一回事，它跑在 `lib/` 上：检查构建产物能加载、工具与命令可用、权限拦截器既会拒绝也会转交。`pnpm test` 按 typecheck、单测、构建、smoke 的顺序全跑一遍。

`tests/support/` 里的替身顶替 harness 的客户端服务。不能用真的：发布出去的客户端入口是浏览器 bundle，在导入时刻就调用 `window.__ModuleLoader__.load(...)`，在 Node 测试里把它物化出来会把第二份 React 拉进同一个进程。替身是 cordis 服务，因此保住了这里真正要紧的性质——贡献挂在调用方 fiber 上并随之撤销——也会对未声明的槽位抛错。它们的注释写明了保真与不保真的部分。

## 发布

- **npm**：`pnpm publish`（`files` 已包含构建产物、patch、元数据与图标）
- **tarball**：`pnpm pack`，然后 `dsh plugin --profile demo add ./dsh-plugin-template-0.2.0.tgz`
- **git**：`dsh plugin add github:you/dsh-plugin-template`（配合上面的 `allowBuilds` 步骤）

## 相关文档

- 实时配置表单：[adding-a-settings-card.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-settings-card.md)
- 插件开发导览：[basic/index.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/index.md)
- 插件配置：[basic/config.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.md)
- 工具开发：[basic/tool.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/tool.md)
- 打包与安装：[basic/publish.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.md)
- 插件与生命周期：[framework/index.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/index.md)
- 服务与依赖：[framework/service.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/service.md)
- 事件系统：[framework/events.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/events.md)
- 客户端 UI 插槽：[subsystems/slots.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/subsystems/slots.md)
- Cordis 教程：[cordis-tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cordis-tutorial/index.md)
