# dsh-plugin-template

[English](README.md) | **简体中文**

DeepSeek Harness（`dsh`）插件模板：一个可直接运行、可直接安装的最小插件包，演示插件最常用的六种形态：

- **配置**：`Config` 接口 + Schemastery schema，校验与默认值在加载时生效（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.zh.md)）
- **工具**：`ctx.tools.register(defineTool(...))` 注册模型可调用的工具（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/tool.zh.md)）
- **事件**：`ctx.on` / `ctx.emit` + declaration merging 类型化事件（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/events.zh.md)）
- **Service**：类形式插件，为其他插件提供服务（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/service.zh.md)）
- **Hook**：`tools/pre-execute` 权限门示例，按配置拒绝工具调用（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/extension-cookbook.zh.md)）
- **客户端 UI（浏览器半边）**：`src/client.ts` 在 设置 → 插件 → Configurable 里注册一张**可点击的配置卡片**，通过 settings 命名空间把 greeting / maxRetries / verbose 写进用户设置文档并实时生效

本模板按官方 [bundle 分发模型](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.zh.md) 组织：包内声明 `dsh.bundle` 与 `cordis.patch.yml`，用户 `dsh plugin add` 后即作为配置层生效。

## 目录结构

```
dsh-plugin-template/
├── package.json        # npm 包清单 + dsh.bundle / dsh.client 声明 + prepare 构建脚本
├── tsconfig.json       # 严格模式类型检查配置（tsc --noEmit）
├── tsdown.config.ts    # 构建配置：Node 库（lib/）+ 客户端 bundle（lib/client.js），自包含、供 git 安装时 prepare 使用
├── cordis.patch.yml    # bundle 配置层：插入插件行
├── dev/cordis.yml      # 本地开发 overlay（指向源码，配合 dsh web --patch；仅 host 半边）
├── src/
│   ├── index.ts        # 主插件：Config + 工具 + 事件 + effect，配置经 settings 命名空间实时接线
│   ├── client.ts       # 浏览器半边：设置里可点击的配置卡片（settings.plugin.item 插槽）
│   ├── service.ts      # 可选示例：Service 提供方（默认注释启用）
│   └── hook.ts         # 可选示例：hook 权限门（默认注释启用）
└── test/smoke.mjs      # 构建产物冒烟测试（含 settings 接线单测）
```

## 快速开始

### 作为 bundle 安装（给用户用）

在任意目录，把本包（或你 fork 后的仓库）装进 dsh profile：

```sh
# 本地目录
dsh plugin --profile demo add /path/to/dsh-plugin-template

# 或直接从 GitHub 安装（模板 fork 后替换为你自己的仓库）
dsh plugin --profile demo add github:you/dsh-plugin-template
```

GitHub 安装拉取的是**源码**，pnpm 会运行 `prepare`（即 `tsdown`）构建 `lib/`；pnpm ≥10 首次会拒绝执行 git 依赖的 prepare，把 pnpm 打印的包名加进 profile 的 `pnpm-workspace.yaml` 后重试：

```yaml
allowBuilds:
  dsh-plugin-template: true
```

> 该 allowlist 相当于授权在安装时执行该包的代码，只应允许你信任的源码，并建议锁定 commit：`github:you/dsh-plugin-template#<sha>`。

验证配置层并启动：

```sh
dsh --profile demo --dump-config   # 应看到 "# == dsh-plugin-template" 层
dsh --profile demo
```

> 注意：自定义名字的 profile（如 `demo`）只含 `dsh-base`，是 **headless**（无 GUI）。
> 要看 Web GUI 和下面的配置卡片，用 `web` profile（= `dsh-base` + `dsh-web-app`），见[测试配置卡片](#测试配置卡片在-gui-点击修改)。

### 本地开发（改插件）

在 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 源码根目录，用 overlay 直接加载本仓库源码（免安装、免构建）：

```sh
pnpm dsh web --patch /absolute/path/to/dsh-plugin-template/dev/cordis.yml
```

把 `dev/cordis.yml` 里的 `name` 改成这个仓库在你机器上的绝对路径，然后打开 `http://127.0.0.1:3080` 让模型调用 `greet` 工具试试。

> ⚠️ `--patch` overlay 只加载插件的 **host 半边**（模块路径解析不到包级声明）。
> 要测试浏览器半边的配置卡片，必须走上面的 profile 安装（包以 `name: dsh-plugin-template` 解析），见下一节。

开发循环内自己跑检查：

```sh
pnpm install
pnpm typecheck
pnpm build
node test/smoke.mjs
```

### 测试配置卡片（在 GUI 点击修改）

配置卡片在浏览器里渲染，依赖 dsh 的 client-modules 按**包名**发现 `dsh.client` 声明，所以必须把包安装进 profile（`--patch` 源码路径不行）：

```sh
# 1. 构建（产物 lib/index.js + lib/client.js）
cd /path/to/dsh-plugin-template && pnpm build

# 2. 装进 web profile（= dsh-base + dsh-web-app，带完整 GUI）
dsh plugin --profile web add /path/to/dsh-plugin-template

# 3. 启动 web GUI（`dsh web` 等价于 `dsh --profile web`）
dsh web
```

打开 `http://127.0.0.1:3080`：

1. 左下角 **设置** → **插件** → **Configurable** 页，应看到一张 `dsh-plugin-template` 卡片，含 `greeting` / `maxRetries` / `verbose` 三个可编辑字段；
2. 把 `greeting` 改成别的值，点 **保存**，状态行应提示"修改后点击保存立即生效"；
3. 回到会话，让模型调用 `greet` 工具，应看到新 greeting（host 半边实时读取命名空间解析值，无需重启）；
4. 用户改动写进设置文档（`$DSH_HOME` 下的 `settings.yaml`），重启后依然生效；想恢复默认就在卡片里改回或清除对应字段。

改动 `src/client.ts` 后重跑 `pnpm build` 即可，刷新页面（client bundle 带 rev 缓存失效）生效。

> ⚠️ **已知 harness 限制（一次性设置，必读）**：卡片能否显示，取决于 harness 的
> `packages/host/apiproxy/src/api-proxy.ts` 里的 `WEB_SETTINGS_NAMESPACES` 白名单——
> 不在名单里的命名空间，即使插件注册了，`settings.describe` 也会把它当成
> "not exposed"，卡片因此不渲染。要在你的 harness 检出里给模板加一行：

```ts
const WEB_SETTINGS_NAMESPACES = [
  'agent-loop', 'shell', 'locale', 'permission', 'ui-conversation', 'ui-theme', 'web-search-deepseek',
  'dsh-plugin-template',   // ← 加这一行
] as const
```

> 这是 harness 当前的注册决策点（源码注释原文："adding a section to that page is a
> decision made here rather than by the registering plugin. Moving that
> declaration to `settings.register()` … is deferred work"）。等 harness 把暴露
> 声明移进 `settings.register()` 后，模板就不需要这一行了。该改动是本地源码修改，
> 更新/重装 harness 检出新代码后会丢失，需要重新加。

## 改成你自己的插件

1. 改包名：`package.json` 的 `name`（npm 名，如 `dsh-my-plugin`）、`src/index.ts` 的 `name`、`cordis.patch.yml` 里的 `id` 与 `name` 三处保持一致；改 `./service` 子路径时同步改 `exports`/`files`。**改包名后还要同步三处与浏览器半边有关的地方**：`tsdown.config.ts` 里 client bundle 的 `id`（`__ModuleLoader__.load({ id })`）、`src/client.ts` 的 `NAMESPACE`、`package.json` 的 `dsh.client`（若需要 `inject`）。
2. 改 `Config` 接口与 `Config` schema：任何两个部署希望设置不同的值都必须是配置字段（[设计原则](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.zh.md#设计原则)）。配置已经接线到 settings 命名空间，GUI 卡片会自动按你的 schema 渲染出可编辑表单吗？——不会，卡片是 `src/client.ts` 里手写的；新增字段需要同步加一行输入框。
3. 在 `apply` 里注册你的工具：`ctx.tools.register(defineTool({...}))`，`execute` 返回 `output.schema` 声明的规范值，`output.render` 纯函数负责模型可见渲染（[工具参考](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-tool.zh.md)）。
4. 需要为其他插件提供能力时，启用 `src/service.ts` 并在 `cordis.patch.yml` 里取消对应行注释。
5. 记得 `declare module '@deepseek-ai/cordis'` 合并 `Context` / `Events` 类型，跨包边界才类型安全。
6. 需要拦截工具调用、做权限门或响应系统钩子时，启用 `src/hook.ts`（取消 `cordis.patch.yml` 里对应行注释）：`ctx.on('tools/pre-execute', ...)` 返回 `{ kind: 'deny', reason }` 或调用 `next()` 放行（[扩展插件形态](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/extension-cookbook.zh.md)）。
7. 配置读取：`src/index.ts` 里所有配置读取点都走 `configSource()`（settings 命名空间解析值，回退 composition entry）。如果你在 `apply` 里基于配置做了注册级推导（如按配置注册不同工具），要在 `installSettingsSection` 的 `onChange` 里重建，而不是只在执行点读取（参考 [bash-local](https://github.com/deepseek-ai/deepseek-harness/blob/main/packages/shell/bash-local/src/index.ts) 的用法）。

## 浏览器半边（client）是怎么工作的

- `package.json` 声明 `dsh.client: { platform: "web" }` + `exports["./client"]` → dsh 的 client-modules 扫描到后，把 `lib/client.js` 作为浏览器插件加载；
- `src/client.ts` 在 `settings.plugin.item` 插槽注册卡片，通过 `settingsScope` 服务绑定 `dsh-plugin-template` 命名空间：读快照、暂存草稿、保存时逐字段 `set`（自带 revision 围栏）；
- host 半边 `src/index.ts` 用 `installSettingsSection` 把配置注册成同名命名空间（cordis.yml 配置是 base 层），工具执行时惰性读取解析值 → 保存即生效；
- 运行时 client 半边只依赖 `react`（浏览器平台模块表提供），其余一律走 ctx 服务，不 import 任何 `@deepseek-ai` 客户端包——改模板时请保持这个纪律。

## 发布

- **npm**：`pnpm publish`（`files` 已包含构建产物与补丁，无需额外步骤）
- **tarball**：`pnpm pack`，用户 `dsh plugin --profile demo add ./dsh-plugin-template-0.1.0.tgz`
- **git**：用户 `dsh plugin add github:you/dsh-plugin-template`（配合上面的 `allowBuilds`）

## 相关文档

- 插件开发入门：[basic/index.zh.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/index.zh.md)
- 插件配置：[basic/config.zh.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.zh.md)
- 工具开发：[basic/tool.zh.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/tool.zh.md)
- 打包与安装：[basic/publish.zh.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.zh.md)
- 插件与生命周期：[framework/index.zh.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/index.zh.md)
- 服务与依赖：[framework/service.zh.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/service.zh.md)
- 事件系统：[framework/events.zh.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/events.zh.md)
- Cordis 底层教程：[cordis-tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cordis-tutorial/index.zh.md)
