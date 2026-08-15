# dsh-plugin-template

DeepSeek Harness（`dsh`）插件模板：一个可直接运行、可直接安装的最小插件包，演示插件最常用的四种形态：

- **配置**：`Config` 接口 + Schemastery schema，校验与默认值在加载时生效（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.zh.md)）
- **工具**：`ctx.tools.register(defineTool(...))` 注册模型可调用的工具（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/tool.zh.md)）
- **事件**：`ctx.on` / `ctx.emit` + declaration merging 类型化事件（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/events.zh.md)）
- **Service**：类形式插件，为其他插件提供服务（[文档](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/service.zh.md)）

本模板按官方 [bundle 分发模型](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.zh.md) 组织：包内声明 `dsh.bundle` 与 `cordis.patch.yml`，用户 `dsh plugin add` 后即作为配置层生效。

## 目录结构

```
dsh-plugin-template/
├── package.json        # npm 包清单 + dsh.bundle 声明 + prepare 构建脚本
├── tsconfig.json       # 严格模式类型检查配置（tsc --noEmit）
├── tsdown.config.ts    # 构建配置（ESM，输出 lib/，自包含，供 git 安装时 prepare 使用）
├── cordis.patch.yml    # bundle 配置层：插入插件行
├── dev/cordis.yml      # 本地开发 overlay（指向源码，配合 dsh web --patch）
├── src/
│   ├── index.ts        # 主插件：Config + 工具 + 事件 + effect
│   └── service.ts      # 可选示例：Service 提供方（默认注释启用）
└── test/smoke.mjs      # 构建产物冒烟测试
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

### 本地开发（改插件）

在 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 源码根目录，用 overlay 直接加载本仓库源码（免安装、免构建）：

```sh
pnpm dsh web --patch /absolute/path/to/dsh-plugin-template/dev/cordis.yml
```

把 `dev/cordis.yml` 里的 `name` 改成这个仓库在你机器上的绝对路径，然后打开 `http://127.0.0.1:3080` 让模型调用 `greet` 工具试试。

开发循环内自己跑检查：

```sh
pnpm install
pnpm typecheck
pnpm build
node test/smoke.mjs
```

## 改成你自己的插件

1. 改包名：`package.json` 的 `name`（npm 名，如 `dsh-my-plugin`）、`src/index.ts` 的 `name`、`cordis.patch.yml` 里的 `id` 与 `name` 三处保持一致；改 `./service` 子路径时同步改 `exports`/`files`。
2. 改 `Config` 接口与 `Config` schema：任何两个部署希望设置不同的值都必须是配置字段（[设计原则](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/config.zh.md#设计原则)）。
3. 在 `apply` 里注册你的工具：`ctx.tools.register(defineTool({...}))`，`execute` 返回 `output.schema` 声明的规范值，`output.render` 纯函数负责模型可见渲染（[工具参考](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-tool.zh.md)）。
4. 需要为其他插件提供能力时，启用 `src/service.ts` 并在 `cordis.patch.yml` 里取消对应行注释。
5. 记得 `declare module '@deepseek-ai/cordis'` 合并 `Context` / `Events` 类型，跨包边界才类型安全。
6. 需要拦截工具调用、做权限门或响应系统钩子时，写 hook 插件：`ctx.on('tools/pre-execute', ...)` 返回 `{ kind: 'deny', reason }` 或调用 `next()` 放行（[扩展插件形态](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/extension-cookbook.zh.md)）。

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
