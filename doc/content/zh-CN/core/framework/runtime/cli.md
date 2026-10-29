---
title: 命令行运行时
---

`@nocobase/app-cli` 将框架命令、应用业务命令与插件命令组成一棵命令树。它根据应用清单识别源码工作区或部署产物，加载对应入口。

## 如何定位应用

源码入口从工作目录向上寻找应用 `package.json`。`nocobase.templateKind` 表示源码应用，构建后的 `nocobase.buildTarget` 表示部署产物。也可通过 `NOCOBASE_APP_ROOT` 指定目标；它不会改变当前工作目录。

部署的 `dist/cli/index.js` 传入自己的位置，不需要全局安装 CLI 或 pnpm。使用实际构建产物中的入口，避免另一个项目的命令版本参与解析。

```bash
pnpm nocobase commands --json
node dist/cli/index.js commands --json
```

## 业务命令的命名空间

| 来源 | 声明 | 调用示例 |
| --- | --- | --- |
| 应用 | `cli/commands/orders/sync.ts` | `nocobase app orders sync` |
| 插件 | `cli/plugins.ts` 注册的 CLI 贡献 | `nocobase orders info` |
| 开发工具 | 插件 `devCommands`、开发钩子 | 只在源码环境保留 |

插件 topic 通常来自去掉 scope 和 `app-plugin-` 的包名。不同包得到同一 topic 时会冲突，不能靠注册顺序覆盖。

## 按需启动服务

继承 `AppCommand` 的命令可用 `withApp()` 创建、使用并清理应用。读取配置或处理数据库迁移通常不需要启动所有后台消费者。只有业务依赖完整生命周期时才执行 `app.start()`。

模块导入只应声明命令。不要在顶层连接数据库，否则连查看帮助和列命令也会产生副作用。开发构建钩子通过注册的 CLI 运行时汇总，不能绕过入口直接调用内部构建脚本。

## 输出与交付

面向程序的数据从命令返回值进入统一 JSON 的 `result`；进度写 stderr。调用方还需检查退出码、`ok`、`status` 和警告。源码新增命令后重新构建，才能进入部署产物。

应用侧的实现与接入见[编写应用命令](../../developing-apps/application-commands.md)和[接入插件命令](../../developing-apps/plugin-commands.md)，插件命令声明见[命令行扩展](../../extension-development/extend-command-line.md)，完整内置参数见[命令行参考](../../reference/cli.md)。通过 HTTP 调用业务接口的独立入口见[为应用提供 CLI 客户端](../../developing-apps/cli-client.md)。

## 接口与实现

- [CLI runtime](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli/README.md)
