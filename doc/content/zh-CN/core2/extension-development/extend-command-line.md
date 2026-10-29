---
title: 命令行扩展
description: 为 App 注册插件命令，处理参数、JSON 输出、错误和构建钩子。
---

插件可以为 App 增加自己的命令，用于诊断、生成文件或一次性的维护工作。本篇添加一个 `notice-cli preview` 命令，在终端中检查文本并输出预览结果；它不启动应用服务，也不写入数据库。

## 使用 Agent

```text
请创建 notice-cli 插件，添加 preview 命令，通过 --text 接收公告文本。
检查非空和长度，返回处理后的文本及字符数，支持 --json 和明确的错误码。
保留生成的 info 命令，测试成功与失败，再注册到当前 App。
```

## 创建 CLI 能力

命令在 App 根目录执行，文件路径相对于 `packages/app-plugin-notice-cli/`：

```bash
pnpm create @nocobase/plugin@beta notice-cli --with cli
```

脚手架会生成 `cli/index.ts`、示例命令 `info`、`./cli` 导出，以及开发和构建配置。CLI 不要求同时存在 Client 或 Server 入口。

## 编写命令

新增 `cli/preview.ts`：

```ts
import { AppCommand, CommandError } from '@nocobase/app-cli';
import { Flags, type Interfaces } from '@oclif/core';

export interface NoticePreview { readonly text: string; readonly length: number; }

export default class PreviewNotice extends AppCommand {
  static override summary = 'Preview notice text without saving it.';
  static override flags: { text: Interfaces.OptionFlag<string> } = {
    text: Flags.string({ description: 'Text to preview.', required: true }),
  };
  public async run(): Promise<NoticePreview> {
    const { flags } = await this.parse(PreviewNotice);
    if (!flags.text.trim() || flags.text.trim().length > 200) {
      throw new CommandError(
        'Text must contain between 1 and 200 UTF-16 code units.',
        { code: 'INVALID_TEXT', exit: 2 },
      );
    }
    const text = flags.text.trim();
    const result: NoticePreview = { text, length: Array.from(text).length };
    this.log(`${result.text} (${result.length})`);
    return result;
  }
}
```

`AppCommand` 负责参数解析的环境和统一的输出。它已经提供了 `--json`，不要重复定义。成功时返回普通的数据；失败时抛出 `CommandError`，不要调用 `process.exit()`、`this.exit()`，也不要手工输出 JSON。

本例的输入上限按 JavaScript 字符串长度计算，而显示的字符数按 Unicode 码点计算。纯文本处理不需要 `withApp()`；只有真正要访问配置或服务时，才创建 App。

| 需要的能力 | 使用方式 |
| --- | --- |
| 定位应用中的文件 | `this.rootDir` |
| 读取配置或使用服务 | `this.withApp(async ({ app }) => ...)`；使用服务之前先注册 Provider |
| 需要完整的启动生命周期 | 在 `withApp()` 的回调中调用 `await app.start()` |

`withApp()` 会在回调完成或失败之后清理应用。启动全部 Provider 可能会启动后台任务，因此不要为了读取一个配置值就调用 `app.start()`。

## 声明插件命令

在 `cli/index.ts` 中保留 `info`，并增加 `preview`：

```ts
import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';
import PluginInfo from './info.ts';
import PreviewNotice from './preview.ts';

const cliPlugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-notice-cli',
  commands: { info: PluginInfo, preview: PreviewNotice },
});
export default cliPlugin;
```

包名 `@nocobase/app-plugin-notice-cli` 对应的 topic 是 `notice-cli`，所以命令为 `pnpm nocobase notice-cli preview`。不同 npm scope 下的同名插件会得到相同的 topic，不能同时使用；也不能使用 `build` 等内置命令的名称。

| 输出 | 写法 | 开启 `--json` 后 |
| --- | --- | --- |
| 面向人的结果 | `this.log(...)` | 不输出这段文本 |
| 面向程序的结果 | `return result` | 出现在统一文档的 `result` 中 |
| 进度 | `this.logToStderr(...)` | 仍然写入 stderr |
| 警告 | `this.warn(...)` | 进入警告信息 |
| 失败 | 抛出 `CommandError` | 输出 `ok: false` 和 `error.code`，并以非零状态退出 |

## 测试命令本身

新增 `tests/cli/preview.test.ts`：

```ts
import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import { describe, expect, it } from 'vitest';
import cliPlugin from '../../cli/index.ts';
import PreviewNotice from '../../cli/preview.ts';

const Preview = bindAppCommand(PreviewNotice, {
  id: `${cliPlugin.topic}:preview`,
  rootDir: import.meta.dirname,
});
describe('preview command', () => {
  it('returns one JSON result', async () => {
    const run = await runAppCommand(Preview, ['--text', ' Hello ', '--json']);
    expect(run.json()).toMatchObject({
      ok: true,
      command: 'notice-cli preview',
      result: { text: 'Hello', length: 5 },
    });
    expect(run.exitCode).toBeUndefined();
  });
  it('reports invalid text with a nonzero exit', async () => {
    const run = await runAppCommand(Preview, ['--text', ' ', '--json']);
    expect(run.json()).toMatchObject({
      ok: false,
      error: { code: 'INVALID_TEXT' },
    });
    expect(run.exitCode).toBe(2);
  });
});
```

如果生成的 `tests/cli/info.test.ts` 断言整个命令表中只有 `info`，请改为 `expect(cliPlugin.commands.info).toBe(PluginInfo)`，并保留原有对 info 输出的测试。这是增加功能后对预期的正常更新，不要直接删除测试。

```bash
pnpm --filter @nocobase/app-plugin-notice-cli format
pnpm --filter @nocobase/app-plugin-notice-cli check
```

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install
```

```bash
pnpm nocobase notice-cli preview --text " Hello "
pnpm nocobase notice-cli preview --text " Hello " --json
pnpm nocobase notice-cli preview --text " " --json
```

前两条命令返回 `Hello` 和长度 5；最后一条返回 `INVALID_TEXT`，并以状态 2 退出。运行 App 的 `pnpm build` 之后，再执行 `node dist/cli/index.js notice-cli preview --text Hello --json`，验证在部署产物中也能使用这个命令。

## 开发命令和构建钩子

部署后仍然需要的命令放在 `commands` 中；只用于编译源码或本地生成的命令放在 `devCommands` 中，后者不会进入部署后的命令集。

确实有生成任务时，可以通过 `buildHooks` 或 `devHooks` 让 App 调用命令。构建阶段依次为 `beforeBuild`、`afterClientBuild`、`afterServerBuild` 和 `afterBuild`；开发阶段只有 `beforeDev`。钩子中的 `command` 是由可执行文件和参数组成的数组，不经过 shell，因此不能在其中使用 `&&`、管道或重定向。钩子失败会终止整个流程，适合用来验证必须存在的产物。

应用一侧如何接入和验证已有的插件命令，见 [接入插件命令](../developing-apps/plugin-commands.md)。只属于单个应用的命令，可以直接写在 `cli/commands/` 中，见 [编写应用命令](../developing-apps/application-commands.md)。
