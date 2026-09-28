# UI surfaces

[English](ui-surfaces.md) | **中文**

客户端半边在十四个槽位上注册。每个槽位是 `src/client/` 下一个独立模块，入口 `src/client/index.ts` 对每个模块调用一个 `register*` 函数。

所有注册都走 `ctx.slots.inject(name, () => ctx.slots.register(...))`。这种写法会等拥有方声明该槽位，声明消失时移除自己的贡献，并随插件的 fiber 一起离开。直接对未声明的槽位调用 `ctx.slots.register` 会抛错。

## 索引

| # | 槽位 | 基数 | 作用域 | 模块 | 展示内容 |
|---|---|---|---|---|---|
| 1 | `plugins.bundle.config` | keyed | root | `config-card.tsx` | bundle 在 Plugins 页上的配置表单 |
| 2 | `sidebar.footer.action` | list | root | `sidebar-action.tsx` | 侧栏底部的一个按钮 |
| 3 | `conversation.input.dock` | list | session | `input-dock.tsx` | 输入卡片上方的一条状态行 |
| 4 | `shell.overlay` | list | root | `shell-overlay.tsx` | 帧级浮动 pill |
| 5 | `conversation.session.header.utilities` | list | session | `header-utilities.tsx` | 会话标题旁的一枚徽标 |
| 6 | `conversation.input.left` | list | session | `input-left.tsx` | 输入卡片左端的一个控件 |
| 7 | `conversation.input.right` | list | session | `input-right.tsx` | 输入卡片右端的一个控件 |
| 8 | `conversation.chat.commandview` | keyed | session | `commandview.tsx` | `/dsh-demo` 的自定义命令行 |
| 9 | `settings.general.item` | list | root | `general-item.tsx` | 设置 → 通用 里的一行偏好 |
| 10 | `settings.plugins.tab` | list | root | `plugins-tab.tsx` | 插件设置分区里的一个 tab |
| 11 | `settings.action` | list | root | `settings-action.tsx` | 设置页头部的一个按钮 |
| 12 | `conversation.session.header.actions` | list | session | `header-actions.tsx` | 会话标题旁的一个动作按钮 |
| 13 | `conversation.composer.dock` | list | session | `composer-dock.tsx` | 输入卡片下缘的一条状态行 |
| 14 | `conversation.chat.assistant-actions` | list | session | `assistant-actions.tsx` | AI 回复上的逐消息按钮 |

第 1 行以 `NAMESPACE` 里的包名为键；第 8 行以 `DEMO_COMMAND_NAME` 为键，宿主半边的 `src/commands.ts` 用的是同一个常量。其余十二个是 list 条目，需要 `id` 和 `order`。

## 配置表单（第 1 行）

`plugins.bundle.config` 是 bundle 贡献自己配置页面的位置。Plugins 页会在 bundle 的描述与各行之间渲染这个条目，并传入两样东西：

- `view: 'page'` —— 渲染表单。（`'summary'` 则只要一行描述；模版的卡片两种都处理。）
- `form` —— `ConfigPageForm`，带宿主已接受的 `state` 和一个带 revision 围栏的 `mutate(ops, expectedRevision)`。

因为表单由拥有方提供，这一页不读 `ctx.configForms`、不订阅 settings scope、也不调用 `ctx.get`。保存失败可以恢复：草稿放在组件状态里，`mutate` 在 `try`/`finally` 里 await。

对应的宿主半边是 `src/index.ts` 里带 `.volatile()` 的 `Config` 字段。Loader 从 `cordis.patch.yml` 那一行的 `id` 派生出 settings 命名空间；没有白名单要加，也没有额外的注册要调。

## 怎么挑一个面

选一个已经为你要加的内容预留了位置的槽位。做状态条时，`conversation.composer.dock` 就是为此准备的位置——它在输入卡片之外、输入栏之内，与宿主自带的统计行同层。只有当东西确实浮在整帧之上、而且位置已知时，才用 `shell.overlay`。

这些槽位由别的包声明，并非全都空着。`sidebar.footer.action`、`shell.overlay`、`settings.action` 目前都有注册方；list 条目用 `order` 决定位置。实时的那棵树才是权威：改槽位前先查 `Slots.listSubTree`（或用 `cordis_inspect` 传 `what: "client"`）读当前占用者、基数与 props。

## 客户端半边的约定

- **不在运行时 import 包。** `react` 来自浏览器平台模块表。harness 客户端包只以 `import type {} from '.../client'` 出现，会被擦除且不产生模块请求。禁止 import 别的功能插件的值；行为通过服务共享，UI 通过插槽共享。
- **文案归 locale 所有。** 每条用户可见文字都放在 `src/client/locales.ts`，通过注册项 `locale` 选项提供的 `t` 席位到达组件。list 标签用 thunk（`label: () => t('key')`），切换语言不需要重新注册。
- **样式跟随主机。** 框架的样式就是插件的样式。`src/client/styles.ts` 引用 `--dsw-alias-*` 语义别名并照抄主机自己的几何约定，不会给主机已经定过外观的控件再定一套。遵守的规则来自 [docs/web-styling.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/web-styling.md)：中性描边画 0.5px；抬升面用 `border: 0` 加 `box-shadow: var(--dsw-elevation-panel)`，不把描边令牌和阴影配在一起；圆角取 `--dsw-radius-*` 刻度，每个全圆角都配 `corner-shape: round`；字号取主机的 12/13/14/16 刻度且始终与行高成对；悬停用 `--dsw-alias-interactive-bg-hover`，禁用用 `opacity: 0.45`；主题的焦点环绝不覆盖。`dtpl-` 类前缀必须保持本包独有——共用前缀会让两个插件的规则互相串味。
- **令牌是签入的快照。** `tests/support/theme-tokens.ts` 列出本包允许引用的令牌，以及核对时对应的主题版本；`tests/theme-tokens.client.spec.ts` 强制这份清单，并在安装的主题版本变动时报错。主题的令牌表没有随包发布，仓库外的包无法在测试时读到。这个守卫不是摆设：本包第一版样式表引用了并不存在的 `--dsw-alias-shadow-popup`，浮层的阴影因此静默失效。
- **effect 要回收。** 样式表在 `ctx.effect` 里注册，并返回移除节点的清理函数，所以重新加载插件不会累积样式表。客户端半边没有定时器或全局监听；宿主半边 `src/index.ts` 里的心跳出于同样原因包在 `ctx.effect` 中。
- **工厂体无副作用。** `lib/client.js` 只注册一个惰性工厂，实际工作在 `apply` 里。
