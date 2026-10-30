---
title: 命令行参考
description: NocoBase 3 应用命令的调用方式、开发与部署差异、配置、数据库、插件和 JSON 输出。
---

本页说明应用的 `nocobase` 命令。创建应用、创建插件和生产安装由独立工具完成，分别见[创建应用](../getting-started/create-app.md)、[创建插件](../extension-development/create-plugin.md)和[使用 PM2 部署](../tutorials/deploy-with-app-installer.md)。

## 调用入口

在应用源码根目录调用本地依赖中的命令：

```bash
pnpm nocobase commands
pnpm nocobase config check --no-connect
pnpm nocobase plugin register --help
```

部署构建产物保留自己的 CLI，从部署应用根目录调用：

```bash
node dist/cli/index.js commands
node dist/cli/index.js config check --no-connect
```

部署环境只有构建时保留的运行命令；`dev`、插件源码接入和构建等开发命令不在其中。生产安装由 app-installer 管理时，使用安装文档中对应版本目录下的入口。

## 命令速查

“源码”表示应用开发工作区；“两者”表示源码和部署运行时均提供。插件还会贡献自己的命令，以当前应用的 `commands` 输出为准。

| 命令 | 环境 | 用途与常用参数 |
| --- | --- | --- |
| `dev` / `build` / `start` | 源码 | 开发、构建、启动构建产物；参数由各命令处理 |
| `info` / `commands` | 两者 | 查看应用信息 / 命令树；`commands --json` 包含参数和执行能力 |
| `config init` | 两者 | 初始化本地配置；`--dialect`、`--config`；不会安装数据库驱动 |
| `config set` | 两者 | 写入 `key=value`；`--from-env` 从环境变量读取值 |
| `config check` | 两者 | 检查配置；`--no-connect` 离线检查；`--strict` 将警告视为失败 |
| `config env` / `config variables` | 两者 | 列出环境变量映射 / 部署配置清单；`variables --out` 写入清单文件 |
| `db apply` | 两者 | 执行待运行的迁移与初始数据；支持 `--dry-run` |
| `db rollback` / `db redo` | 两者 | 回退最近一批迁移 / 回退后重做；会改变数据库 |
| `db reset` | 两者 | 重置受管理的数据表；会删除数据 |
| `db repair` | 两者 | 修复迁移校验和记录；不能用来替代结构迁移 |
| `db unlock` | 两者 | 处理残留迁移锁；须先确认没有迁移进程仍在执行 |
| `db sample` | 仅开发 | 加载示例数据；即使命令目录列出，部署环境也会拒绝执行 |
| `collections generate` | 两者 | 生成 Collection 缓存；`--check` 只检查是否一致 |
| `collections doctor` | 两者 | 诊断 Collection 与数据库差异；`--fix` 会修改内容 |
| `locales check` | 两者 | 检查多语言资源 |
| `secrets status` / `secrets rotate` | 两者 | 检查 / 轮换加密数据；`rotate --dry-run` 预览，`--batch-size` 控制批次 |
| `plugin inspect` | 源码 | 查看插件入口和接入信息 |
| `plugin register` | 源码 | 安装或注册插件；可预览 `--dry-run` |
| `plugin unregister` | 源码 | 取消插件注册；不等同于移除数据库中的业务数据 |
| `plugin update` | 源码 | 升级指定插件；省略名称时升级全部已注册插件，再同步 Skill |
| `package remove` | 源码 | 移除包依赖及相关接入；支持 `--dry-run` |
| `skills sync` | 源码 | 从依赖同步 Skill；支持包 / 插件选择与 `--dry-run` |
| `dist check` / `dist retarget` | 源码 | 检查 / 调整部署产物 |
| `cli build` / `cli link` | 源码 | 构建可分发的业务 CLI / 安装本地命令链接 |

## 开发与构建

默认应用脚本提供常用入口：

```bash
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

脚本以应用自己的 `package.json` 为准。构建指定平台并导出部署压缩包：

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

`--target` 选择构建目标，例如 `linux-x64` 或 `linux-arm64-musl`；目标应匹配实际服务器。`--node-version` 指定目标 Node 主版本。`--tar` 将部署归档写入 `storage/exports/dist.tar.gz`。数据库原生依赖不能简单跨系统复制。

## 配置命令

```bash
pnpm nocobase config init --dialect sqlite
pnpm nocobase config set server.port=13000 client.app.title="My App"
pnpm nocobase config env
pnpm nocobase config variables --json
pnpm nocobase config check --no-connect --strict
```

`config init` 在已有配置时通常保持原文件；覆盖需要显式 `--force`。`config set` 支持点分路径和 YAML 标量；对象、数组等复杂配置直接编辑配置文件更清晰。未知配置分区会被拒绝，环境变量覆盖也会影响最终结果。

`config check` 默认会尝试非 SQLite 连接；`--no-connect` 只做配置检查，`--connect` 也验证 SQLite 连接。连接检查不执行迁移。详细字段与密钥输入方法见[配置项参考](configuration.md)。

## 数据库命令

支持连接选择的命令使用 `--connection <name>`；`--all` 选择全部连接。两者互斥，省略时使用默认连接。它们不是所有命令都支持的通用选项。

先检查计划，再执行迁移：

```bash
pnpm nocobase db apply --connection main --dry-run
pnpm nocobase db apply --connection main
```

`rollback`、`redo`、`reset` 和 `repair` 支持的预览与确认选项以各自 `--help` 为准。`--force` 是明确确认操作，不是修复错误的常规办法。已经执行的迁移发生校验和变化时，应先确认原因；只有内容变化确实不影响已部署结构时，才考虑校验和修复。数据库变更与恢复流程见[建表与数据初始化](../developing-apps/data-models-and-migrations.md)。

## 插件与 Skill

在已经创建 `packages/app-plugin-announcements/` 的应用中，可先预览注册改动：

```bash
pnpm nocobase plugin register @nocobase/app-plugin-announcements --dry-run
pnpm nocobase skills sync --dry-run
```

插件的实际包名由其 `package.json` 决定。`--no-install`、`--no-skills` 等选项只在相应命令支持时使用；不要把一次注册理解为所有运行端均已生效，应检查生成的 Client、Server 和 CLI 注册文件。具体流程见[管理插件](../developing-apps/manage-plugins.md)。

`.agents/skills/` 中同步出来的指引可以再次生成；维护插件提供的 Skill 时编辑插件的 `skills/` 源文件。

## 应用和插件业务命令

应用中的 `cli/commands/orders/sync.ts` 对应：

```bash
pnpm nocobase app orders sync --help
```

插件通过 CLI 入口声明自己的命令。其命名空间通常由包名去掉 scope 和 `app-plugin-` 前缀得到；命名冲突会报错。部署后可调用已经打包的业务命令，但不会临时扫描新的源码文件。

应用命令的编写与验证见[编写应用命令](../developing-apps/application-commands.md)，应用侧注册见[接入插件命令](../developing-apps/plugin-commands.md)，插件实现见[命令行扩展](../extension-development/extend-command-line.md)。

`cli link` 用于本地调试独立客户端，`cli build` 将其打包供远程业务调用。这类客户端通过 HTTP 使用已运行应用的接口，接入流程见[为应用提供 CLI 客户端](../developing-apps/cli-client.md)。

## JSON 输出与自动化

```bash
pnpm nocobase commands --json
pnpm nocobase config check --no-connect --json
```

成功响应的主要字段如下；`result` 的结构由命令决定：

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

该片段只说明信封字段，不是完整的配置检查输出。自动化应同时检查退出码、`ok` 和 `status`，再读取 `result`；失败通常以非零退出码结束。`success-noop` 表示无需变更，`partial-success` 表示仍有未完成事项，应检查 `warnings` 和结果中的问题说明。`commands --json` 会标明哪些命令支持 JSON、预览和强制执行。`dev`、`build`、`start` 等透传命令不统一支持 JSON。`NOCOBASE_CONTENT_TYPE=json` 也只对支持该模式的命令生效。

## 核对范围

2026-10-27 在默认模板 beta.83、`@nocobase/app-cli` 1.0.0-beta.29、Node 24.21.0 和 pnpm 11.7.0 下，核对了源码与部署产物的命令目录，并执行离线配置检查、环境变量清单、选项帮助和本地公告插件的注册预览。数据库重置、回退、密钥轮换等有状态操作未作为本页验证步骤执行。实现参考见 [app-cli 源码](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli)。
