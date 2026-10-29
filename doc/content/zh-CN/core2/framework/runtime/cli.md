---
title: 命令行运行时
description: 了解命令行运行时如何定位应用、组织框架命令、业务命令和插件命令，以及如何按需启动服务。
---

`@nocobase/app-cli` 把框架命令、应用的业务命令和插件命令组织成一棵命令树。它根据应用清单判断当前是源码工作区还是部署产物，并加载对应的入口。

## 如何定位应用

在源码中运行时，CLI 从工作目录开始向上查找应用的 `package.json`：其中的 `nocobase.templateKind` 表示这是源码应用，构建产物中的 `nocobase.buildTarget` 则表示这是部署产物。也可以通过 `NOCOBASE_APP_ROOT` 指定目标应用，它不会改变当前的工作目录。

部署产物中的 `dist/cli/index.js` 会传入自己所在的位置，因此不需要全局安装 CLI 或 pnpm。请使用实际构建产物中的入口，避免另一个项目中不同版本的命令参与解析。

```bash
pnpm nocobase commands --json
node dist/cli/index.js commands --json
```

## 业务命令的命名空间

| 来源 | 声明位置 | 调用示例 |
| --- | --- | --- |
| 应用 | `cli/commands/orders/sync.ts` | `nocobase app orders sync` |
| 插件 | 在 `cli/plugins.ts` 中注册的 CLI 贡献 | `nocobase orders info` |
| 开发工具 | 插件的 `devCommands` 和开发钩子 | 只在源码环境中保留 |

插件命令的 topic 通常来自包名去掉 scope 和 `app-plugin-` 前缀之后的部分。不同的包得到相同的 topic 时会发生冲突，不能依靠注册顺序来覆盖。

## 按需启动服务

继承 `AppCommand` 的命令可以用 `withApp()` 创建、使用并清理应用。读取配置或处理数据库迁移，通常不需要启动全部的后台消费者；只有业务依赖完整的生命周期时，才执行 `app.start()`。

导入模块时只应声明命令。不要在模块顶层连接数据库，否则连查看帮助、列出命令也会产生副作用。开发时的构建钩子通过已注册的 CLI 运行时汇总，不能绕过入口直接调用内部的构建脚本。

## 输出与交付

面向程序的数据通过命令的返回值，进入统一 JSON 输出的 `result`；进度信息写入 stderr。调用方还需要检查退出码、`ok`、`status` 和警告。在源码中新增命令后，需要重新构建，命令才会进入部署产物。

应用侧的实现与接入见 [编写应用命令](../../developing-apps/application-commands.md) 和 [接入插件命令](../../developing-apps/plugin-commands.md)；插件如何声明命令见 [命令行扩展](../../extension-development/extend-command-line.md)；完整的内置参数见 [命令行参考](../../reference/cli.md)。通过 HTTP 调用业务接口的独立入口，见 [为应用提供 CLI 客户端](../../developing-apps/cli-client.md)。

## 接口与实现

- [CLI runtime](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli/README.md)
