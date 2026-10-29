---
title: 接入插件命令
description: 通过 cli/plugins.ts 接入已有插件提供的命令，理解命名空间、开发命令、构建钩子和部署验证。
---

插件通过 `./cli` 入口提供命令，应用在 `cli/plugins.ts` 中选择接入哪些贡献。本篇关注应用一侧的安装、注册和使用；命令的实现和插件的发布约定见 [命令行扩展](../extension-development/extend-command-line.md)。

## 先确认插件提供了什么

查看插件的使用说明、`package.json` 中的导出和 `cli/index.ts`，确认它是否提供 `./cli` 入口，以及命令需要哪些服务和配置。只提供客户端或服务端能力的插件，不一定带有 CLI。

默认模板的 `cli/plugins.ts` 已经注册了 Foundation 和 Scheduler；Examples 模板还注册了 CLI Example、Agents 等贡献。请保留当前应用已有的注册项，再按插件说明接入它需要的运行端。

CLI 注册、服务端注册和客户端注册各有用途。例如，命令需要用到插件的服务时，只接入 CLI 并不会自动注册该服务，仍需检查 `server/plugins.ts`。完整的安装和注册流程见 [管理插件](manage-plugins.md)。

## 注册到应用

下面使用 [命令行扩展](../extension-development/extend-command-line.md) 中创建的本地插件 `@nocobase/app-plugin-notice-cli`。请先完成该插件的创建和命令实现，确保工作区依赖已经安装、包可以被解析。这个包名只是教程中的本地示例，并不表示 npm 上有同名的可安装包。

先预览注册结果，再正式执行：

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install
```

`--no-install` 会跳过依赖安装，因此需要事先完成工作区的安装；它也不会免除维护 `package.json` 和锁文件的责任。注册后，检查生成的 `cli/plugins.ts`，结果应与下面这个在默认模板基础上扩展的示例类似。如果应用已有其他插件，请保留它们，不要用整段代码覆盖现有列表。

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

`defineCliPlugins()` 负责组合插件贡献，数组中的顺序就是注册顺序。自动注册已经添加的项，不需要再手工添加一遍；手工维护时，import 和数组项要同时保留。

## 查找与调用命令

插件包 `@nocobase/app-plugin-notice-cli` 的 topic 是 `notice-cli`，因此插件声明的 `preview` 命令对应：

```bash
pnpm nocobase notice-cli preview --help
pnpm nocobase notice-cli preview --text " Hello " --json
pnpm nocobase notice-cli preview --text " " --json
```

第二条命令返回 `result: { text: "Hello", length: 5 }`；第三条返回 `INVALID_TEXT`，退出码为 `2`。可以先运行 `pnpm nocobase commands --json` 查找命令，再查看具体命令的 `--help`。统一的输出和错误处理方式见 [编写应用命令](application-commands.md)。

如果你正在运行 Examples 应用，它还自带另一个可用的示例：

```bash
pnpm nocobase cli-example greet world --json
```

这条命令由 `@nocobase/app-plugin-cli-example` 提供，返回问候语和目标名称。普通的默认模板并没有注册这个示例插件，不能直接假设这条命令存在。

topic 通常取自包名去掉 npm scope 和 `app-plugin-` 前缀后的部分。同名的 topic 会产生冲突，而且不能靠注册顺序覆盖。遇到冲突时，应调整插件的命名设计，而不是删除应用中无关的已有命令。

## 开发命令与构建钩子

| 插件贡献 | 在应用中的用途 | 部署后 |
| --- | --- | --- |
| `commands` | 诊断、维护等运行时命令 | 保留 |
| `devCommands` | 读取源码、生成文件等开发任务 | 不注册 |
| `buildHooks` | 在应用构建阶段运行插件任务 | 在构建期间执行，不是部署后的命令 |
| `devHooks` | 在应用开发启动前运行任务 | 在开发期间执行 |

构建钩子的阶段包括 `beforeBuild`、`afterClientBuild`、`afterServerBuild` 和 `afterBuild`，开发钩子的阶段为 `beforeDev`。插件声明的钩子会由应用 CLI 统一汇总，直接使用项目的 `pnpm build` 和 `pnpm dev` 就会进入相应流程，不需要把每个钩子都复制到应用脚本中。

钩子声明中的 `command` 是由可执行文件和参数组成的数组，不经过 shell。编写钩子的细节见 [命令行扩展](../extension-development/extend-command-line.md#开发命令和构建钩子)。Examples 中的 `preview-acceptance.ts` 是该示例应用特有的验收辅助逻辑，并不是通用的插件注册所必需的文件。

## 验证与移除

接入后，确认帮助信息中出现了预期的 topic，正常输入能返回结果，错误输入能返回稳定的错误码。构建之后，再通过部署入口验证：

```bash
pnpm build
node dist/cli/index.js notice-cli preview --text Hello --json
node dist/cli/index.js commands --json
```

部署后的命令集应包含 `commands`，并排除 `devCommands`。如果命令需要业务服务或数据库，还要使用独立的验证配置检查真实的服务调用；纯文本预览只能验证 CLI 的接入和输出。

如果只是不再暴露该插件的 CLI，从 `cli/plugins.ts` 中移除对应的 import 和数组项，然后重新构建即可。卸载整个插件之前，还要一并检查其他运行端、依赖和数据资源，按 [管理插件](manage-plugins.md) 处理。

实现参照：[Examples 的 CLI 注册](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/cli/plugins.ts)、[CLI Example 的声明](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/examples/app-plugin-cli-example/cli/index.ts)。
