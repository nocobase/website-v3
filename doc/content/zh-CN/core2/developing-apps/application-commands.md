---
title: 编写应用命令
description: 在 cli/commands 中编写 AppCommand，访问应用服务，处理参数、路径、JSON 输出与失败，并验证部署后的命令。
---

应用自己的命令放在 `cli/commands/` 中，适合导出数据、诊断问题或一次性的维护工作。例如，在应用目录执行 `pnpm nocobase app statuses export`，读取状态字典并保存为文件。

本篇面向能够访问应用目录和配置的开发者与运维人员。供用户或 Agent 通过网络操作业务的入口，见 [为应用提供 CLI 客户端](cli-client.md)；需要在多个应用之间共享的命令，见 [接入插件命令](plugin-commands.md)。

## 目录与命令名称

```text
cli/
├── commands/
│   └── statuses/
│       ├── export.ts       # app statuses export
│       └── _helpers.ts     # 辅助代码，不注册为命令
└── plugins.ts              # 插件命令注册
```

每个命令文件默认导出一个 `AppCommand` 子类，文件路径决定它在 `app` 下的命令名称，不需要在索引文件中注册。以 `_` 开头的文件和目录，以及名为 `lib` 的目录，都会被跳过。不要把命令放进 `dist`、`build`、`coverage` 或 `generated` 等目录，这些名称会被项目的版本管理、格式化或检查规则忽略。

应用命令会随构建进入部署产物，所以它运行时依赖的包必须写在 `dependencies` 中。只在源码环境中使用的生成脚本，可以保留为项目脚本，或者由插件的 `devCommands` 提供；应用命令没有单独的“仅在开发时注册”的声明。

## 示例：导出状态字典

请先完成 [建表与数据初始化](data-models-and-migrations.md) 开头的 `appStatuses` 示例，执行迁移和 Seed，得到 `code`、`title` 两个字段和默认记录。本例使用的是那个独立示例，不依赖后面的历史项目与任务教程。

新增 `cli/commands/statuses/export.ts`：

```ts
// cli/commands/statuses/export.ts
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { AppCommand, CommandError, appPath } from '@nocobase/app-cli';
import { Flags, type Interfaces } from '@oclif/core';

export interface StatusExportResult {
  readonly file: string;
  readonly count: number;
  readonly written: boolean;
}

export default class ExportStatuses extends AppCommand {
  static override summary = 'Export the application status dictionary.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --dry-run --json',
    '<%= config.bin %> <%= command.id %> --output ./statuses.json --json',
  ];
  static override flags: {
    output: Interfaces.OptionFlag<string | undefined>;
    'dry-run': Interfaces.BooleanFlag<boolean>;
  } = {
    output: appPath({ description: 'Write a new JSON file at this path.' }),
    'dry-run': Flags.boolean({
      default: false,
      description: 'Read the dictionary without writing a file.',
    }),
  };

  async run(): Promise<StatusExportResult> {
    const { flags } = await this.parse(ExportStatuses);
    const { databaseManagerToken } = await import('@nocobase/db');
    const result = await this.withApp(async ({ app }) => {
      app.registerProviders();
      const database = app.container.resolve(databaseManagerToken);
      const rows = await database.repository('appStatuses').findMany({
        select: (s) => s.fields('code', 'title'),
        sort: (s) => [s.field('code').asc()],
        limit: 101,
      });
      if (rows.length > 100) {
        throw new CommandError('This example exports at most 100 statuses.', {
          code: 'EXPORT_LIMIT_EXCEEDED',
          suggestions: ['Add pagination before exporting larger dictionaries.'],
        });
      }

      const file = flags.output ?? app.paths.storage('exports/statuses.json');
      if (flags['dry-run'] || rows.length === 0) {
        return { file, count: rows.length, written: false };
      }
      try {
        await mkdir(dirname(file), { recursive: true });
      } catch (cause) {
        throw new CommandError('The output directory could not be prepared.', {
          code: 'EXPORT_WRITE_FAILED',
          cause,
        });
      }
      try {
        await writeFile(file, JSON.stringify(rows, null, 2) + '\n', {
          encoding: 'utf8',
          flag: 'wx',
        });
      } catch (cause) {
        if ((cause as NodeJS.ErrnoException).code === 'EEXIST') {
          throw new CommandError('The output file already exists.', {
            code: 'OUTPUT_EXISTS',
            exit: 2,
            suggestions: ['Choose another path with --output.'],
          });
        }
        throw new CommandError('The export file could not be written.', {
          code: 'EXPORT_WRITE_FAILED',
          cause,
        });
      }
      return { file, count: rows.length, written: true };
    });

    if (!result.written) this.setStatus('success-noop');
    this.log(result.written
      ? `Exported ${result.count} statuses to ${result.file}.`
      : `No file written: ${result.count} statuses; target ${result.file}.`);
    return result;
  }
}
```

这个命令只读取字典，不修改数据库。示例最多导出 100 条记录，超出时会明确报错；导出大量数据时，应另行设计分页和文件写入，避免把全部记录放进内存。使用 `--dry-run` 或字典为空时，都不会创建输出文件；已存在的文件也不会被覆盖。

在应用根目录执行：

```bash
pnpm nocobase app statuses export --help
pnpm nocobase app statuses export --dry-run --json
pnpm nocobase app statuses export --output ./statuses.json --json
```

在只有两条默认记录的情况下，预览返回的结构如下；文件路径会随应用和存储配置变化：

```json
{
  "schemaVersion": 1,
  "ok": true,
  "command": "app statuses export",
  "status": "success-noop",
  "result": {
    "file": "/path/to/my-app/storage/exports/statuses.json",
    "count": 2,
    "written": false
  },
  "warnings": []
}
```

最后一条命令会创建 `statuses.json`。再次使用同一个输出路径时，会返回 `OUTPUT_EXISTS`，退出码为 `2`；换一个文件名即可继续验证。

## 选择需要的应用能力

| 需求 | 入口 |
| --- | --- |
| 定位应用目录下的文件 | `this.rootDir`，不会创建应用 |
| 读取配置、存储路径或环境 | `this.withApp(async ({ app, env }) => ...)` |
| 获取数据库或业务服务 | 在回调中先调用 `app.registerProviders()`，再从 `app.container` 获取 |
| 依赖完整的启动生命周期 | 在回调中调用 `await app.start()` |

`withApp()` 会创建应用、执行回调，然后关闭应用并销毁运行时；即使回调失败，也会完成清理。它不会自动注册或启动 Provider。`app.config` 和 `app.paths` 不需要注册就可以访问；只有在需要运行中的服务时，才启动完整的生命周期，因为启动过程也可能同时启动消费者和定时任务。服务的组织方式见 [服务端业务服务](server-business-services.md)。

应用对象只在回调中使用，回调返回普通的结果数据。清理失败会作为警告报告，以免把已经完成的业务结果误判为失败，进而引发重复执行。

本地命令通过应用配置访问服务，不会自动继承浏览器中用户的登录状态或数据范围。需要用户身份的业务操作，应明确校验调用者的身份和范围，或者通过受保护的 HTTP 接口提供，见 [认证、权限与数据范围](authentication-and-permissions.md)。

## 参数、路径与模块加载

`AppCommand` 基于 oclif。位置参数用 `Args` 声明，选项用 `Flags` 声明，每个参数都应说明用途；命令本身则用 `summary` 和 `examples` 描述它的结果和调用方式。`pnpm nocobase commands --json` 会列出这些信息，供人和 Agent 查找。

路径类选项使用 `appPath()`：用户传入的相对路径按当前工作目录解析，声明的默认值按应用根目录解析，命令收到的始终是绝对路径，不需要再次解析。本例的默认位置取自 `app.paths.storage()`，因为部署时存储目录可能位于代码目录之外。

查看帮助时也会导入命令模块。因此，模块顶层只保留 `@nocobase/app-cli`、`@oclif/core` 和 Node 内置模块，数据库等较重的依赖在 `run()` 中动态导入；不要在模块顶层连接数据库或执行任务。

## 输出、错误与日志

`AppCommand` 已经提供了 `--json`，不需要重复声明。成功时返回有类型的普通数据，失败时抛出 `CommandError`。

| 目的 | 写法 | 使用 `--json` 时的行为 |
| --- | --- | --- |
| 面向人的结果 | `this.log(text)` | 不输出这段文本 |
| 面向程序的结果 | `return result` | 放入 `result` |
| 进度 | `this.logToStderr(text)` | 照常写入 stderr |
| 警告 | `this.warn(text)` | 放入 `warnings` |
| 失败 | `throw new CommandError(...)` | 输出 `ok: false` 和 `error.code`，并以非零退出码结束 |

`code` 使用稳定的大写名称，`suggestions` 告诉调用方如何处理，`details` 保存必要的普通数据。错误的退出码默认为 `1`，用法无效时使用 `2`。如果要建议调用方执行另一个框架命令，可以用 `this.cliCommand(['db', 'apply'])` 生成与源码环境或部署环境相匹配的调用方式。

默认状态为 `success`；只是预览或无事可做时，设置为 `success-noop`；只完成了部分工作时，设置为 `partial-success`，并说明还有哪些没有完成。结果中不要包含凭据或整份导出数据。

请避免使用 `console.log()`、手工输出 JSON、`process.exit()`、`this.exit()`、`this.logJson()` 和 `this.error()`，以免破坏输出约定或退出语义。`CommandError` 的 `cause` 不会直接输出；排查问题时，可以设置 `NOCOBASE_CLI_DEBUG=1`，在 stderr 中查看经过脱敏的错误链。需要持久保存的运维日志，请使用应用的日志服务，见 [日志](../framework/support/logging.md)。

## 测试与交付

命令的测试放在 `tests/cli/`。`@nocobase/app-testing/cli` 提供 `bindAppCommand()` 和 `runAppCommand()`：前者指定一个独立的测试应用目录，以及 `app:statuses:export` 这样的命令 ID；后者返回结果、JSON、stdout、stderr 和退出码。还可以注入 `loadRuntime`、`createApp` 来隔离服务。

需要真实的应用和数据库时，使用同一入口提供的 `createTestAppConfig()` 和 `bindTestAppCommand()`，按 [数据库命令测试示例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/command.md) 准备迁移和 Seed，结束后调用 `config.dispose()`。自定义的运行时加载器需要自行接入测试配置和存储隔离，绝不能指向开发数据库。

至少需要验证：正常导出及文件内容；预览时不写文件；字典为空时返回 `success-noop`；已有文件保持原样并返回 `OUTPUT_EXISTS`；读取或写入失败时返回错误并释放资源。会捕获进程输出的命令测试，应按顺序执行。

```bash
pnpm lint
pnpm typecheck
pnpm nocobase commands --json
pnpm build
node dist/cli/index.js app statuses export --help
node dist/cli/index.js app statuses export --dry-run --json
```

先运行项目配置的 CLI 测试，再执行以上检查。部署入口下的预览仍会读取部署配置指定的数据库，请在准备好的验证环境中运行；只检查帮助信息，不能证明数据访问正常。

本文依据 [应用命令开发指引](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/commands.md) 编写。共用的运行机制见 [命令行运行时](../framework/runtime/cli.md)，内置命令的参数见 [命令行参考](../reference/cli.md)。
