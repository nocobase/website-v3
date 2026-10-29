---
title: 命令行参考
description: NocoBase 3 应用命令的调用方式、开发与部署环境的差异，以及配置、数据库、插件命令和 JSON 输出。
---

本页说明应用自带的 `nocobase` 命令。创建应用、创建插件和生产环境的安装由独立的工具完成，分别见 [创建应用](../getting-started/create-app.md)、[创建插件](../extension-development/create-plugin.md) 和 [使用 PM2 部署（app-installer）](../tutorials/deploy-with-app-installer.md)。

## 调用入口

在应用的源码根目录中，调用本地依赖中的命令：

```bash
pnpm nocobase commands
pnpm nocobase config check --no-connect
pnpm nocobase plugin register --help
```

部署的构建产物保留了自己的 CLI，从部署应用的根目录调用：

```bash
node dist/cli/index.js commands
node dist/cli/index.js config check --no-connect
```

部署环境中只包含构建时保留的运行命令，`dev`、插件源码接入和构建等开发命令不在其中。生产安装由 app-installer 管理时，请使用安装文档中所述的、对应版本目录下的入口。

## 命令速查

“源码”表示应用的开发工作区；“两者”表示源码和部署运行时都提供该命令。插件还会贡献自己的命令，以当前应用 `commands` 命令的输出为准。

| 命令 | 环境 | 用途与常用参数 |
| --- | --- | --- |
| `dev` / `build` / `start` | 源码 | 开发、构建、启动构建产物；参数由各命令自行处理 |
| `info` / `commands` | 两者 | 查看应用信息 / 命令树；`commands --json` 包含参数和执行能力 |
| `config init` | 两者 | 初始化本地配置；`--dialect`、`--config`；不会安装数据库驱动 |
| `config set` | 两者 | 写入 `key=value`；`--from-env` 从环境变量读取值 |
| `config check` | 两者 | 检查配置；`--no-connect` 只做离线检查；`--strict` 把警告视为失败 |
| `config env` / `config variables` | 两者 | 列出环境变量映射 / 部署配置清单；`variables --out` 把清单写入文件 |
| `db apply` | 两者 | 执行待运行的迁移和初始数据；支持 `--dry-run` |
| `db rollback` / `db redo` | 两者 | 回退最近一批迁移 / 回退后重做；会改变数据库 |
| `db reset` | 两者 | 重置受管理的数据表；会删除数据 |
| `db repair` | 两者 | 修复迁移的校验和记录；不能代替结构迁移 |
| `db unlock` | 两者 | 处理残留的迁移锁；必须先确认没有迁移进程仍在执行 |
| `db sample` | 仅开发 | 加载示例数据；即使命令目录中列出了它，部署环境也会拒绝执行 |
| `collections generate` | 两者 | 生成 Collection 缓存；`--check` 只检查是否一致 |
| `collections doctor` | 两者 | 诊断 Collection 与数据库之间的差异；`--fix` 会修改内容 |
| `locales check` | 两者 | 检查多语言资源 |
| `secrets status` / `secrets rotate` | 两者 | 检查 / 轮换加密数据；`rotate --dry-run` 用于预览，`--batch-size` 控制批次大小 |
| `plugin inspect` | 源码 | 查看插件的入口和接入信息 |
| `plugin register` | 源码 | 安装或注册插件；可以用 `--dry-run` 预览 |
| `plugin unregister` | 源码 | 取消插件注册；不等于删除数据库中的业务数据 |
| `plugin update` | 源码 | 升级指定的插件；省略名称时升级所有已注册的插件，然后同步 Skills |
| `package remove` | 源码 | 移除包依赖及相关的接入；支持 `--dry-run` |
| `skills sync` | 源码 | 从依赖同步 Skills；支持选择包或插件，以及 `--dry-run` |
| `dist check` / `dist retarget` | 源码 | 检查 / 调整部署产物 |
| `cli build` / `cli link` | 源码 | 构建可分发的业务 CLI / 安装本地的命令链接 |

## 开发与构建

默认的应用脚本提供了常用的入口：

```bash
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

具体的脚本以应用自己的 `package.json` 为准。为指定平台构建并导出部署压缩包：

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

`--target` 选择构建目标，例如 `linux-x64` 或 `linux-arm64-musl`，应与实际的服务器一致；`--node-version` 指定目标的 Node 主版本；`--tar` 把部署归档写入 `storage/exports/dist.tar.gz`。数据库的原生依赖不能简单地跨系统复制。

## 配置命令

```bash
pnpm nocobase config init --dialect sqlite
pnpm nocobase config set server.port=13000 client.app.title="My App"
pnpm nocobase config env
pnpm nocobase config variables --json
pnpm nocobase config check --no-connect --strict
```

已有配置时，`config init` 通常会保留原文件，需要覆盖时必须显式加上 `--force`。`config set` 支持点分路径和 YAML 标量；对象、数组等复杂的配置，直接编辑配置文件会更清晰。未知的配置分区会被拒绝，环境变量的覆盖也会影响最终结果。

`config check` 默认会尝试连接非 SQLite 的数据库；`--no-connect` 只检查配置，`--connect` 则同样验证 SQLite 连接。连接检查不会执行迁移。详细的字段和密钥的输入方式见 [配置项参考](configuration.md)。

## 数据库命令

支持选择连接的命令使用 `--connection <name>`，`--all` 表示选择全部连接。两者不能同时使用，省略时使用默认连接。它们并不是所有命令都支持的通用选项。

先检查执行计划，再执行迁移：

```bash
pnpm nocobase db apply --connection main --dry-run
pnpm nocobase db apply --connection main
```

`rollback`、`redo`、`reset` 和 `repair` 支持哪些预览和确认选项，以各自的 `--help` 为准。`--force` 用于明确确认一项操作，而不是修复错误的常规手段。已经执行过的迁移出现校验和变化时，应先查明原因；只有当内容的变化确实不影响已部署的结构时，才考虑修复校验和。数据库变更与恢复的流程见 [建表与数据初始化](../developing-apps/data-models-and-migrations.md)。

## 插件与 Skills

在已经创建了 `packages/app-plugin-announcements/` 的应用中，可以先预览注册会带来的改动：

```bash
pnpm nocobase plugin register @nocobase/app-plugin-announcements --dry-run
pnpm nocobase skills sync --dry-run
```

插件实际的包名由它的 `package.json` 决定。`--no-install`、`--no-skills` 等选项，只在相应的命令支持时使用。不要以为注册一次就在所有运行端都生效了，请检查生成的 Client、Server 和 CLI 注册文件。具体流程见 [管理插件](../developing-apps/manage-plugins.md)。

`.agents/skills/` 中同步得到的指引可以重新生成；维护插件提供的 Skill 时，请编辑插件 `skills/` 目录下的源文件。

## 应用和插件的业务命令

应用中的 `cli/commands/orders/sync.ts` 对应下面的命令：

```bash
pnpm nocobase app orders sync --help
```

插件通过 CLI 入口声明自己的命令，其命名空间通常由包名去掉 scope 和 `app-plugin-` 前缀得到；命名冲突时会报错。部署之后可以调用已经打包的业务命令，但 CLI 不会临时扫描新的源码文件。

应用命令的编写与验证见 [编写应用命令](../developing-apps/application-commands.md)，应用一侧的注册见 [接入插件命令](../developing-apps/plugin-commands.md)，插件的实现见 [命令行扩展](../extension-development/extend-command-line.md)。

`cli link` 用于在本地调试独立的客户端，`cli build` 则把它打包，供远程调用业务接口。这类客户端通过 HTTP 使用正在运行的应用的接口，接入流程见 [为应用提供 CLI 客户端](../developing-apps/cli-client.md)。

## JSON 输出与自动化

```bash
pnpm nocobase commands --json
pnpm nocobase config check --no-connect --json
```

成功响应的主要字段如下，`result` 的结构由具体命令决定：

```json
{
  "schemaVersion": 1,
  "ok": true,
  "command": "config check",
  "status": "success",
  "result": {},
  "warnings": []
}
```

这个片段只用来说明外层字段，并不是完整的配置检查输出。自动化脚本应同时检查退出码、`ok` 和 `status`，再读取 `result`；失败时通常以非零的退出码结束。`success-noop` 表示没有需要变更的内容，`partial-success` 表示仍有未完成的事项，应检查 `warnings` 和结果中的问题说明。`commands --json` 会标明哪些命令支持 JSON 输出、预览和强制执行。`dev`、`build`、`start` 等透传命令并不统一支持 JSON，`NOCOBASE_CONTENT_TYPE=json` 也只对支持这种模式的命令生效。

## 核对范围

2026-10-27，在默认模板 beta.83、`@nocobase/app-cli` 1.0.0-beta.29、Node 24.21.0 和 pnpm 11.7.0 的环境下，核对了源码和部署产物中的命令目录，并执行了离线配置检查、环境变量清单、选项帮助，以及本地公告插件的注册预览。数据库重置、回退、密钥轮换等会改变状态的操作，没有作为本页的验证步骤执行。实现可参考 [app-cli 源码](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli)。
