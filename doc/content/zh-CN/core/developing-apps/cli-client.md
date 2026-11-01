---
title: 为应用提供 CLI 客户端
description: 使用 app-cli-client 为应用提供独立命令行入口，连接服务端业务 API，并完成本地调试与打包分发。
---

应用可以拥有一个独立的 CLI，例如 `nocobase-examples`。使用者在自己的电脑上登录应用，然后通过命令执行服务端业务操作；无需拿到应用源码或数据库配置。它也可以作为 Agent 调用业务功能的入口。

`@nocobase/app-cli-client` 提供登录、命令发现和 HTTP 调用，服务端的命令清单决定有哪些业务命令。命令执行时，业务逻辑仍在服务端完成。

## 什么时候需要

| 场景 | 入口 |
| --- | --- |
| 在应用环境内导出数据或运行维护任务 | [应用命令](application-commands.md)，如 `pnpm nocobase app statuses export` |
| 使用插件提供的本地维护或开发命令 | [插件命令](plugin-commands.md)，如 `pnpm nocobase notice-cli preview` |
| 用户、自动化或 Agent 通过网络使用已运行应用 | 独立 CLI，如 `nocobase-examples user options` |

独立 CLI 根据业务 API 的描述生成命令。把一个文件放进 `cli/commands/` 不会把它变成远程业务命令。

## 先准备服务端

本篇沿用 Examples 模板的已有配置与 `user options` 命令。需要一个能正常运行、已完成数据库初始化的 Examples 应用，以及有权读取用户管理选项的登录账号。

服务端需具备以下接入，不能只在 `package.json` 中添加名称：

- **API 文档与命令清单。** 路由通过 `describeRoute()` 等公开机制描述参数、响应与身份要求，CLI 从应用的命令清单读取它们，默认地址为 `/api/cli/manifest`。
- **调用身份。** 当前 Examples 使用 Agents 插件向 CLI 服务接入调用者识别，配合认证、用户和权限插件处理身份与授权。自建应用需要提供相应集成；默认模板并不保证开箱具备整套接入。
- **浏览器登录。** Examples 的认证配置包含 device authorization、bearer session 和 `/device` 确认页面，允许 `nocobase-cli` 这个 client ID。使用自己的 ID 时，客户端与服务端允许列表应一起调整。

参照 [Examples 的认证配置](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/server/config/auth.ts)和 [Agents 的 CLI 身份集成](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/plugins/app-plugin-agents/server/cli/surface.ts)。命令清单可见性与实际接口授权是不同层次，业务接口仍需验证每次请求的权限与数据范围。

## 配置客户端名称

Examples 的 `package.json` 已包含以下配置。为自己的应用接入时，将 `cli` 合并进已有 `nocobase` 对象，保留其他字段，并在 `devDependencies` 中添加与应用版本配套的 `@nocobase/app-cli-client`。

```json
{
  "nocobase": {
    "cli": {
      "bin": "nocobase-examples",
      "displayName": "NocoBase Examples",
      "auth": {
        "clientId": "nocobase-cli"
      }
    }
  }
}
```

`bin` 是使用者输入的命令名，`displayName` 用于帮助与提示。`auth.clientId` 对应服务端允许的设备登录客户端。新应用可以使用自己的名称；不要占用框架的 `nocobase` 或 Runner 的 `nocobase-runner`。

`envPrefix`、`stateDir`、`skills` 等是按需选项，完整字段见 [CLI 配置说明](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-cli/README.md#the-applications-own-cli-cli-build-and-cli-link)。这里只先跑通连接和业务调用。

## 本地连接与调用

在 Examples 应用根目录运行：

```bash
pnpm nocobase cli link
pnpm exec nocobase-examples --help
```

`cli link` 在项目的 `node_modules/.bin` 创建命令入口，供本地调试。它不启动服务端，也不配置服务端的登录和命令清单。

确保应用服务端已运行，将下面的示例地址替换为实际访问地址；若应用部署在子路径下，也要包含该路径：

```bash
pnpm exec nocobase-examples login --server https://your-app.example.com
pnpm exec nocobase-examples whoami
pnpm exec nocobase-examples docs
pnpm exec nocobase-examples user options --help
pnpm exec nocobase-examples user options --json
```

`login` 显示授权码并引导浏览器确认，成功后保存当前服务器的登录配置。`whoami` 检查当前身份，`docs` 查看可用业务命令，具体命令的 `--help` 查看参数。

`user options` 是用户插件的现有只读接口，返回用户管理中可分配的角色范围与角色选项。可用命令以服务端版本和当前身份的清单为准，不能仅凭命令名判断自己拥有访问权限。连接不同环境时使用 `--profile` 区分配置；自动化登录和其他参数先查 `login --help`。

## 怎样提供自己的业务命令

先编写、注册并验证业务 HTTP 接口，见[HTTP 路由与接口](apis-and-services.md)。CLI 使用同一份接口描述，不需要在 `cli/commands/` 中另写一个重复的实现。

用户插件的 `/options` 接口在 `describeRoute()` 的元数据中展开 `cliRoute({ command: 'user options' })`。等价的 CLI 元数据可这样取得，再通过 `...cliMetadata` 合并进现有声明：

```ts
import { cliRoute } from '@nocobase/app-server/router';

// Merge into the existing describeRoute({ ... }) metadata.
const cliMetadata = cliRoute({ command: 'user options' });
```

这是路由元数据片段，不是完整接口；参数校验、响应声明、认证和业务处理仍保留在原路由中。完整实例见[用户插件路由](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/plugins/app-plugin-users/server/routes/index.ts)。

`cliRoute()` 可指定命令名、位置参数、选项和示例；未定制时，命令名可以根据 API 描述推导。需要排除某个接口时使用 `cliRoute(false)`，但这只影响 CLI 清单，不会关闭 HTTP 接口。完整选项见 [CLI 路由契约](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/router/cli/types.ts)。

接口变更后，重新检查 CLI 的帮助、参数、返回结果与失败语义，并使用不同权限的账号验证服务端授权。

## 构建与分发

本地调用验证通过后，在应用根目录构建独立 CLI：

```bash
pnpm nocobase cli build --help
pnpm nocobase cli build --universal --json
```

`--universal` 生成不内置 Node.js 的归档，使用者需有 Node.js 24 或以上版本；未同时指定 `--targets` 时，只构建该通用归档。需要携带运行时时，按 `--help` 选择支持的目标平台。

默认产物位于应用的 `storage/runners/dist/` 下，按 channel、product 和 version 组织，包含归档与清单；具体路径以构建结果为准。`cli build` 负责打包，不会自动上传归档或部署应用。可按产品需要通过下载站或已有发布流程分发。

交付前，在独立目录解压归档，用其中的 `bin/nocobase-examples` 验证帮助、登录、`whoami` 和一条有权限的业务命令，确认客户端能连接目标应用。客户端归档与 `pnpm build` 生成的应用部署目录用途不同，应分别验证。

## 排查常见问题

| 现象 | 检查 |
| --- | --- |
| `pnpm exec` 找不到命令 | `nocobase.cli.bin`、依赖安装与 `cli link` 是否成功 |
| 登录无法完成 | 实际服务地址、设备登录配置、client ID 和确认页面 |
| 登录后无法取得命令清单 | `/api/cli/manifest` 与调用者身份集成是否可用 |
| 业务命令不存在 | 当前服务器版本、路由是否进入 API 文档、CLI 排除配置与身份筛选 |
| 命令存在但请求被拒绝 | 当前账号的操作权限、数据范围及接口校验 |

这三类本地与远程入口的共用说明见[命令行参考](../reference/cli.md)。
