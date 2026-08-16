# dsh-plugin-template

[English](README.md) | **简体中文**

DeepSeek Harness（`dsh`）插件模板：一个可直接运行、可直接安装的最小插件包，演示插件最常用的六种形态：

- **配置**：`Config` 接口 + Schemastery schema，校验与默认值在加载时生效（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.zh.md)）
- **工具**：`ctx.tools.register(defineTool(...))` 注册模型可调用的工具（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/tool.zh.md)）
- **事件**：`ctx.on` / `ctx.emit` + declaration merging 类型化事件（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/events.zh.md)）
- **Service**：类形式插件，为其他插件提供服务（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/service.zh.md)）
- **Hook**：`tools/pre-execute` 权限门示例，按配置拒绝工具调用（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/extension-cookbook.zh.md)）
- **客户端 UI（浏览器半边）**：`src/client/` 在**十四个**面上注册浏览器 UI（索引见 [docs/ui-surfaces.zh.md](docs/ui-surfaces.zh.md)）：设置 → 插件 → Configurable 的**可点击配置卡片**（通过 settings 命名空间把 greeting / maxRetries / verbose 写进用户设置文档并实时生效；原版 harness 上卡片以只读"未暴露"状态渲染并说明原因，而不是消失）、左侧栏底部**操作按钮**、输入卡片上方**状态条**、全框架**浮层 pill**、会话标题右侧**工具徽标**、输入工具行**左右小按钮**、示例命令 `/dsh-demo` 的**自定义命令渲染行**、通用页**偏好行**、插件页**新 tab**、设置面板**头部操作**、会话标题旁**操作按钮**、输入卡片下方**状态条**、每条 AI 消息上的**操作按钮**——外加 `greet` 工具的 `presentResult` 渲染意图。只有配置卡片的数据路径受 harness 白名单门控，其余十三个是纯插槽注册，任何 harness 上装完即用

本模板按官方 [bundle 分发模型](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.zh.md) 组织：包内声明 `dsh.bundle` 与 `cordis.patch.yml`，用户 `dsh plugin add` 后即作为配置层生效。

## 目录结构

```
dsh-plugin-template/
├── package.json        # npm 包清单 + dsh.bundle / dsh.client 声明 + prepare 构建脚本
├── tsconfig.json       # 严格模式类型检查配置（tsc --noEmit）
├── tsdown.config.ts    # 构建配置：Node 库（lib/）+ 客户端 bundle（lib/client.js），自包含、供 git 安装时 prepare 使用
├── cordis.patch.yml    # bundle 配置层：插入插件行
├── dev/cordis.yml      # 本地开发 overlay（指向源码，配合 dsh web --patch；仅 host 半边）
├── docs/
│   └── ui-surfaces.zh.md  # 插件注册在哪些 UI 面上 + 插槽索引（英文版 ui-surfaces.md）
├── src/
│   ├── index.ts        # 主插件：Config + 工具 + 事件 + effect，配置经 settings 命名空间实时接线
│   ├── commands.ts     # host 半边：示例斜杠命令 /hello（回复 world）与 /dsh-demo（自定义渲染行）
│   ├── service.ts      # 可选示例：Service 提供方（默认注释启用）
│   ├── hook.ts         # 可选示例：hook 权限门（默认注释启用）
│   └── client/         # 浏览器半边：每个 UI 面一个模块（见 docs/ui-surfaces.zh.md）
│       ├── index.ts        # client 入口：inject + apply，组装各注册
│       ├── constants.ts    # 共用 NAMESPACE / DEMO_COMMAND_NAME（与 package.json name / cordis.patch.yml 保持一致）
│       ├── types.ts        # ctx 服务的最小结构类型（不 import @deepseek-ai 客户端包）
│       ├── styles.ts       # 一次性注入的 <style>，所有 dtpl-* class（只走主题变量）
│       ├── config-card.ts  # settings.plugin.item：可点击配置卡片（暂存表单 + 状态说明）
│       ├── sidebar-action.ts # sidebar.footer.action：侧栏底部按钮
│       ├── input-dock.ts   # conversation.input.dock：输入卡片上方状态条（session 级）
│       ├── shell-overlay.ts # shell.overlay：全框架浮层 pill
│       ├── header-utilities.ts # conversation.session.header.utilities：会话头右侧工具徽标
│       ├── input-left.ts   # conversation.input.left：工具行左端小按钮
│       ├── input-right.ts  # conversation.input.right：发送键旁小按钮
│       ├── commandview.ts  # conversation.chat.commandview：/dsh-demo 自定义渲染行
│       ├── general-item.ts # settings.general.item：设置 → 通用 一行偏好开关
│       ├── plugins-tab.ts  # settings.plugins.tab：插件页新 tab
│       ├── settings-action.ts # settings.action：设置面板头部操作按钮
│       ├── header-actions.ts # conversation.session.header.actions：会话标题旁操作按钮
│       ├── composer-dock.ts  # conversation.composer.dock：输入卡片下方状态条
│       └── assistant-actions.ts # conversation.chat.assistant-actions：消息操作按钮
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

> 如果本仓库**嵌在** `deepseek-harness` 检出里（如放在 harness 仓库根目录下的嵌套仓库），`pnpm install` 会被父 workspace 捕获，不会给本仓库装依赖（本仓库不是 workspace 成员）。此时用 `pnpm install --ignore-workspace`（pnpm ≥9.5），让模板用自己的 pnpm-lock.yaml 装出独立 node_modules；或者把模板单独 clone 出来开发。

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

1. 左下角 **设置** → **插件** → **Configurable** 页，应看到一张 `dsh-plugin-template` 卡片。原版 harness 上它渲染为只读的"未暴露"状态卡（见下文）；完成 harness 一行改动后渲染为含 `greeting` / `maxRetries` / `verbose` 三个可编辑字段的表单；
2. 把 `greeting` 改成别的值，点 **保存**，状态行应提示"修改后点击保存立即生效"；
3. 回到会话，让模型调用 `greet` 工具，应看到新 greeting（host 半边实时读取命名空间解析值，无需重启）；
4. 用户改动写进设置文档（`$DSH_HOME` 下的 `settings.yaml`），重启后依然生效；想恢复默认就在卡片里改回或清除对应字段。

改动 client 半边（`src/client/`）后重跑 `pnpm build` 即可，刷新页面（client bundle 带 rev 缓存失效）生效。

### 原版 harness 上的配置卡片（不改源码）

卡片是浏览器插件（`src/client/config-card.ts`），通过 `settingsScope` 服务绑定 settings 命名空间 `dsh-plugin-template`。它在任何状态下都渲染——但原版 harness 上会渲染成只读的"未暴露"状态卡，而不是可编辑表单。原因：dsh 的 Web 网关只把白名单内的 settings 命名空间暴露给设置面板（`WEB_SETTINGS_NAMESPACES`，见 `packages/host/apiproxy/src/api-proxy.ts`），不在名单里的命名空间即使插件注册了，`settings.describe` 也会回答 `settings-not-exposed`。这是 harness 侧的注册决策点（同一段源码注释把"把暴露声明移进 `settings.register()`"标注为 deferred work），不是模板缺陷：内置卡片能渲染是因为它们的命名空间（`shell`、`agent-loop`…）在白名单里，而目前不存在插件侧把它加入白名单的通道——网关的 RPC 表是编译期固定的，也没有任何注册期标志。

原版 harness 上零改动即可用的部分：
- **整个 host 半边**——`greet` 工具、事件、Service、hook 权限门，包括**配置实时读取**：写入只在 Web RPC 层被门控，插件自身每次执行都读取命名空间的解析值；
- **卡片插槽本身**：卡片出现在 设置 → 插件 → Configurable 页并说明暴露状态，而不是静默消失。

要让卡片可编辑，二选一：
1. 在 `WEB_SETTINGS_NAMESPACES` 里加一行 `'dsh-plugin-template'`（`packages/host/apiproxy/src/api-proxy.ts`；改完需重建/重启 harness，更新检出新代码后会丢失）：

```ts
const WEB_SETTINGS_NAMESPACES = [
  'agent-loop', 'shell', 'locale', 'permission', 'ui-conversation', 'ui-theme', 'web-search-deepseek',
  'dsh-plugin-template',   // ← 加这一行
] as const
```

2. 等 harness 的 deferred work——把暴露声明移进 `settings.register()`——本模板已经按规范方式（`installSettingsSection`）注册命名空间，届时无需任何改动。

## 改成你自己的插件

1. 改包名：`package.json` 的 `name`（npm 名，如 `dsh-my-plugin`）、`src/index.ts` 的 `name`、`cordis.patch.yml` 里的 `id` 与 `name` 三处保持一致；改 `./service` 子路径时同步改 `exports`/`files`。**改包名后还要同步浏览器半边相关处**：`tsdown.config.ts` 里 client bundle 的 `id`（`__ModuleLoader__.load({ id })`）、`src/client/constants.ts` 的 `NAMESPACE`、`package.json` 的 `dsh.client`（若需要 `inject`）。
2. 改 `Config` 接口与 `Config` schema：任何两个部署希望设置不同的值都必须是配置字段（[设计原则](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.zh.md#设计原则)）。配置已经接线到 settings 命名空间，GUI 卡片会自动按你的 schema 渲染出可编辑表单吗？——不会，卡片是 `src/client/config-card.ts` 里手写的；新增字段需要同步加一行输入框。
3. 在 `apply` 里注册你的工具：`ctx.tools.register(defineTool({...}))`，`execute` 返回 `output.schema` 声明的规范值，`output.render` 纯函数负责模型可见渲染（[工具参考](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-tool.zh.md)）。
4. 需要为其他插件提供能力时，启用 `src/service.ts` 并在 `cordis.patch.yml` 里取消对应行注释。
5. 记得 `declare module '@deepseek-ai/cordis'` 合并 `Context` / `Events` 类型，跨包边界才类型安全。
6. 需要拦截工具调用、做权限门或响应系统钩子时，启用 `src/hook.ts`（取消 `cordis.patch.yml` 里对应行注释）：`ctx.on('tools/pre-execute', ...)` 返回 `{ kind: 'deny', reason }` 或调用 `next()` 放行（[扩展插件形态](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/extension-cookbook.zh.md)）。
7. 配置读取：`src/index.ts` 里所有配置读取点都走 `configSource()`（settings 命名空间解析值，回退 composition entry）。如果你在 `apply` 里基于配置做了注册级推导（如按配置注册不同工具），要在 `installSettingsSection` 的 `onChange` 里重建，而不是只在执行点读取（参考 [bash-local](https://github.com/deepseek-ai/deepseek-harness/blob/main/packages/shell/bash-local/src/index.ts) 的用法）。

## 浏览器半边（client）是怎么工作的

- `package.json` 声明 `dsh.client: { platform: "web" }` + `exports["./client"]` → dsh 的 client-modules 扫描到后，把 `lib/client.js` 作为浏览器插件加载；
- client 入口（`src/client/index.ts`）组装每个 UI 面的注册——配置卡片（`settings.plugin.item`）、侧栏底部按钮（`sidebar.footer.action`）、输入区 Dock（`conversation.input.dock`）——见 [UI 注册面索引](docs/ui-surfaces.zh.md)；
- 配置卡片通过 `settingsScope` 服务绑定 `dsh-plugin-template` 命名空间：读快照、暂存草稿、保存时逐字段 `set`（自带 revision 围栏）；
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
