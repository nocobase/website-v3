---
title: 为应用提供 CLI 客户端
description: 使用 app-cli-client 为应用提供独立的命令行入口，连接服务端业务 API，并完成本地调试与打包分发。
---

应用可以拥有一个独立的 CLI，例如 `nocobase-examples`。使用者在自己的电脑上登录应用，然后通过命令执行服务端的业务操作，既不需要拿到应用源码，也不需要数据库配置。它也可以作为 Agent 调用业务功能的入口。

`@nocobase/app-cli-client` 负责登录、命令发现和 HTTP 调用；有哪些业务命令，则由服务端的命令清单决定。命令执行时，业务逻辑仍然在服务端完成。

## 什么时候需要

| 场景 | 入口 |
| --- | --- |
| 在应用环境内导出数据或运行维护任务 | [应用命令](application-commands.md)，如 `pnpm nocobase app statuses export` |
| 使用插件提供的本地维护或开发命令 | [插件命令](plugin-commands.md)，如 `pnpm nocobase notice-cli preview` |
| 用户、自动化流程或 Agent 通过网络使用已在运行的应用 | 独立 CLI，如 `nocobase-examples user options` |

独立 CLI 根据业务 API 的描述生成命令。把一个文件放进 `cli/commands/`，并不会让它变成远程业务命令。

## 先准备服务端

本篇沿用 Examples 模板已有的配置和 `user options` 命令。你需要一个能正常运行、已完成数据库初始化的 Examples 应用，以及一个有权读取用户管理选项的登录账号。

服务端需要完成以下接入，只在 `package.json` 中添加名称是不够的：

- **API 文档与命令清单。** 路由通过 `describeRoute()` 等公开机制描述参数、响应和身份要求，CLI 从应用的命令清单中读取这些信息，清单的默认地址为 `/api/cli/manifest`。
- **调用者身份。** 当前的 Examples 通过 Agents 插件为 CLI 服务接入调用者识别，并配合认证、用户和权限插件处理身份与授权。自建应用需要提供相应的集成；默认模板并不保证开箱即具备这一整套接入。
- **浏览器登录。** Examples 的认证配置包含 device authorization、bearer session 和 `/device` 确认页面，并允许 `nocobase-cli` 这个 client ID。如果使用自己的 ID，客户端和服务端的允许列表要一起调整。

可以参照 [Examples 的认证配置](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/server/config/auth.ts) 和 [Agents 的 CLI 身份集成](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/plugins/app-plugin-agents/server/cli/surface.ts)。命令在清单中是否可见，与接口实际的授权是两个不同的层次；业务接口仍需验证每次请求的权限和数据范围。

## 配置客户端名称

Examples 的 `package.json` 已经包含以下配置。为自己的应用接入时，把 `cli` 合并进已有的 `nocobase` 对象，保留其他字段，并在 `devDependencies` 中添加与应用版本配套的 `@nocobase/app-cli-client`。

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

`bin` 是使用者在终端输入的命令名，`displayName` 用于帮助和提示信息，`auth.clientId` 对应服务端允许的设备登录客户端。新应用可以使用自己的名称，但不要占用框架的 `nocobase` 或 Runner 的 `nocobase-runner`。

`envPrefix`、`stateDir`、`skills` 等是按需使用的选项，完整字段见 [CLI 配置说明](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-cli/README.md#the-applications-own-cli-cli-build-and-cli-link)。这里先只跑通连接和业务调用。

## 本地连接与调用

在 Examples 应用的根目录运行：

```bash
pnpm nocobase cli link
pnpm exec nocobase-examples --help
```

`cli link` 在项目的 `node_modules/.bin` 中创建命令入口，用于本地调试。它不会启动服务端，也不会配置服务端的登录和命令清单。

确认应用服务端已经运行，把下面的示例地址替换为实际的访问地址；如果应用部署在子路径下，地址中也要包含该路径：

```bash
pnpm exec nocobase-examples login --server https://your-app.example.com
pnpm exec nocobase-examples whoami
pnpm exec nocobase-examples docs
pnpm exec nocobase-examples user options --help
pnpm exec nocobase-examples user options --json
```

`login` 会显示授权码，并引导你在浏览器中确认；成功后，保存当前服务器的登录配置。`whoami` 检查当前身份，`docs` 查看可用的业务命令，具体命令的 `--help` 则用于查看参数。

`user options` 是用户插件已有的只读接口，返回用户管理中可分配的角色范围和角色选项。实际可用的命令，以服务端版本和当前身份对应的清单为准；不能只凭命令名就判断自己拥有访问权限。连接不同环境时，用 `--profile` 区分配置；自动化登录及其他参数，请先查看 `login --help`。

## 怎样提供自己的业务命令

先编写、注册并验证业务 HTTP 接口，见 [路由与 HTTP 接口](apis-and-services.md)。CLI 使用的是同一份接口描述，不需要在 `cli/commands/` 中再写一份重复的实现。

用户插件的 `/options` 接口在 `describeRoute()` 的元数据中展开了 `cliRoute({ command: 'user options' })`。可以用下面的方式得到等价的 CLI 元数据，再通过 `...cliMetadata` 合并进现有的声明：

```ts
import { cliRoute } from '@nocobase/app-server/router';

// Merge into the existing describeRoute({ ... }) metadata.
const cliMetadata = cliRoute({ command: 'user options' });
```

这只是路由元数据的片段，并不是完整的接口；参数校验、响应声明、认证和业务处理仍然保留在原有的路由中。完整的实例见 [用户插件路由](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/plugins/app-plugin-users/server/routes/index.ts)。

`cliRoute()` 可以指定命令名、位置参数、选项和示例；不做定制时，命令名可以根据 API 描述推导出来。需要排除某个接口时，使用 `cliRoute(false)`，但这只影响 CLI 清单，并不会关闭 HTTP 接口。完整选项见 [CLI 路由契约](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/router/cli/types.ts)。

接口变更后，要重新检查 CLI 的帮助、参数、返回结果和失败语义，并用不同权限的账号验证服务端的授权。

## 构建与分发

本地调用验证通过后，在应用根目录构建独立的 CLI：

```bash
pnpm nocobase cli build --help
pnpm nocobase cli build --universal --json
```

`--universal` 生成一个不内置 Node.js 的归档，使用者需要安装 Node.js 24 或更高版本；没有同时指定 `--targets` 时，只构建这个通用归档。如果需要附带运行时，请按 `--help` 的说明选择支持的目标平台。

默认产物位于应用的 `storage/runners/dist/` 下，按 channel、product 和 version 组织，包含归档和清单；具体路径以构建结果为准。`cli build` 只负责打包，不会自动上传归档或部署应用。你可以根据产品需要，通过下载站或已有的发布流程进行分发。

交付之前，在一个独立的目录中解压归档，用其中的 `bin/nocobase-examples` 验证帮助、登录、`whoami` 和一条有权限的业务命令，确认客户端能连接到目标应用。客户端归档与 `pnpm build` 生成的应用部署目录用途不同，需要分别验证。

## 排查常见问题

| 现象 | 检查什么 |
| --- | --- |
| `pnpm exec` 找不到命令 | `nocobase.cli.bin` 是否正确，依赖安装与 `cli link` 是否成功 |
| 登录无法完成 | 实际的服务地址、设备登录配置、client ID 和确认页面 |
| 登录后无法取得命令清单 | `/api/cli/manifest` 和调用者身份集成是否可用 |
| 找不到某个业务命令 | 当前服务器的版本、路由是否进入了 API 文档、CLI 的排除配置以及按身份的筛选 |
| 命令存在，但请求被拒绝 | 当前账号的操作权限、数据范围以及接口的校验 |

本地和远程三类入口的共用说明见 [命令行参考](../reference/cli.md)。
