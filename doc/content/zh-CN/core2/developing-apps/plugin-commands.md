---
title: 接入插件命令
description: 通过 cli/plugins.ts 接入已有插件的命令，理解命名空间、开发命令、构建钩子和部署验证。
---

插件通过 `./cli` 入口提供命令，应用在 `cli/plugins.ts` 中选择接入哪些贡献。本篇关注应用侧的安装、注册与使用；命令实现和插件发布契约见[命令行扩展](../extension-development/extend-command-line.md)。

## 先确认插件提供什么

检查插件的使用说明、`package.json` 导出和 `cli/index.ts`，确认是否提供 `./cli` 入口，以及命令需要哪些服务和配置。只提供客户端或服务端能力的插件不一定有 CLI。

默认模板的 `cli/plugins.ts` 已注册 Foundation 与 Scheduler。Examples 模板还注册了 CLI Example、Agents 等贡献。保留当前应用已有的注册项，按插件说明接入需要的运行端。

CLI 注册、服务端注册和客户端注册各有用途。例如，命令需要插件服务时，仅接入 CLI 并不会自动注册该服务，仍需检查 `server/plugins.ts`。完整的安装与注册流程见[管理插件](manage-plugins.md)。

## 注册到应用

以下使用[命令行扩展](../extension-development/extend-command-line.md)中创建的本地 `@nocobase/app-plugin-notice-cli`。先完成该插件的创建与命令实现，确保工作区依赖已安装、包可解析。这个包名是教程中的本地示例，不表示 npm 上存在同名可安装包。

先预览注册结果，再执行：

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install
```

`--no-install` 跳过依赖安装，因此需要提前完成工作区安装；它也不免除维护 `package.json` 和锁文件的要求。注册后检查生成的 `cli/plugins.ts`，结果应类似下面的默认模板扩展示例。若应用已有其他插件，保留它们，不要用整段代码覆盖现有列表。

```ts
// cli/plugins.ts
import { defineCliPlugins, type AppCliPlugins } from '@nocobase/app-cli';
import foundation from '@nocobase/app-plugin-foundation/cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';
import noticeCli from '@nocobase/app-plugin-notice-cli/cli';

const cliPlugins: AppCliPlugins = defineCliPlugins([
  scheduler,
  foundation,
  noticeCli,
]);

export default cliPlugins;
```

`defineCliPlugins()` 组合插件贡献，数组中的顺序也是注册顺序。自动注册已经添加的项无需手工再加一遍；手工维护时同时保留 import 和数组项。

## 查找与调用命令

插件包 `@nocobase/app-plugin-notice-cli` 的 topic 为 `notice-cli`。插件声明的 `preview` 因此对应：

```bash
pnpm nocobase notice-cli preview --help
pnpm nocobase notice-cli preview --text " Hello " --json
pnpm nocobase notice-cli preview --text " " --json
```

第二条返回 `result: { text: "Hello", length: 5 }`；第三条返回 `INVALID_TEXT`，退出码为 `2`。可以先运行 `pnpm nocobase commands --json` 查找命令，再查看具体命令的 `--help`。统一输出与错误处理见[编写应用命令](application-commands.md)。

如果正在运行 Examples 应用，它已有另一个可用示例：

```bash
pnpm nocobase cli-example greet world --json
```

该命令由 `@nocobase/app-plugin-cli-example` 提供，返回问候语和目标名称。普通默认模板并未注册这个示例插件，不能直接假设这条命令存在。

topic 通常取包名去掉 npm scope 和 `app-plugin-` 前缀后的部分。同名 topic 会冲突，注册顺序不能覆盖它。遇到冲突应调整插件的命名设计，而不是删除应用无关的已有命令。

## 开发命令与构建钩子

| 插件贡献 | 应用中的用途 | 部署后 |
| --- | --- | --- |
| `commands` | 诊断、维护等运行命令 | 保留 |
| `devCommands` | 读取源码、生成文件等开发任务 | 不注册 |
| `buildHooks` | 在应用构建阶段运行插件任务 | 构建期间执行，不是部署命令 |
| `devHooks` | 在应用开发启动前运行任务 | 开发期间执行 |

构建钩子的阶段包括 `beforeBuild`、`afterClientBuild`、`afterServerBuild`、`afterBuild`；开发钩子为 `beforeDev`。插件已经声明的钩子会由应用 CLI 汇总，使用项目的 `pnpm build`、`pnpm dev` 即可进入对应流程，不必把每个钩子再复制到应用脚本。

钩子声明的 `command` 是可执行文件与参数组成的数组，不经过 shell。编写钩子的细节仍由[命令行扩展](../extension-development/extend-command-line.md#开发命令和构建钩子)介绍。Examples 中的 `preview-acceptance.ts` 是该示例应用特有的验收辅助逻辑，不是通用插件注册必需的文件。

## 验证与移除

接入后确认帮助中出现预期 topic、正常输入返回结果、错误输入返回稳定错误码。构建后再使用部署入口验证：

```bash
pnpm build
node dist/cli/index.js notice-cli preview --text Hello --json
node dist/cli/index.js commands --json
```

部署命令集应保留 `commands`，排除 `devCommands`。如果命令需要业务服务或数据库，还要使用独立验证配置检查真实服务调用；纯文本预览只能验证 CLI 接入和输出。

只停止暴露该插件的 CLI 时，从 `cli/plugins.ts` 移除对应 import 与数组项，然后重新构建。卸载整个插件前，应一并检查其他运行端、依赖和数据资源，按[管理插件](manage-plugins.md)处理。

实现参照：[Examples 的 CLI 注册](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/cli/plugins.ts)、[CLI Example 声明](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/examples/app-plugin-cli-example/cli/index.ts)。
