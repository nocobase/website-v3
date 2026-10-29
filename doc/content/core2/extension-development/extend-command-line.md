---
title: Command-line extensions
description: Register plugin commands with the App, handling arguments, JSON output, errors and build hooks.
---

A plugin can add its own commands to the App for diagnostics, generating files or one-off maintenance. This guide adds a `notice-cli preview` command that checks text in the terminal and outputs a preview; it neither starts application services nor writes to the database.

## Use an Agent

```text
Create a notice-cli plugin with a preview command accepting --text.
Validate nonempty text and length, return normalized text and its character count,
and support --json and stable error codes. Keep the generated info command,
test success and failure, and register the plugin in this App.
```

## Create the CLI capability

Commands run in the App root, and file paths are relative to `packages/app-plugin-notice-cli/`:

```bash
pnpm create @nocobase/plugin@beta notice-cli --with cli
```

The scaffold generates `cli/index.ts`, an example `info` command, the `./cli` export, and development and build configuration. A CLI does not require a Client or Server entry alongside it.

## Write the command

Add `cli/preview.ts`:

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

`AppCommand` provides the argument parsing environment and uniform output. It already provides `--json`, so do not define it again. Return plain data on success and throw `CommandError` on failure; do not call `process.exit()` or `this.exit()`, and do not print JSON by hand.

In this example, the input limit uses JavaScript string length, while the displayed character count uses Unicode code points. Pure text processing does not need `withApp()`; create the App only when you really need to access configuration or services.

| Capability needed | How |
| --- | --- |
| Locate files in the application | `this.rootDir` |
| Read configuration or use services | `this.withApp(async ({ app }) => ...)`; register Providers before using services |
| Need the full startup lifecycle | Call `await app.start()` inside the `withApp()` callback |

`withApp()` cleans up the application after the callback finishes or fails. Starting every Provider may start background jobs, so do not call `app.start()` just to read one configuration value.

## Declare the commands

In `cli/index.ts`, keep `info` and add `preview`:

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

The package name `@nocobase/app-plugin-notice-cli` maps to the topic `notice-cli`, so the command is `pnpm nocobase notice-cli preview`. Plugins with the same name under different npm scopes get the same topic and cannot both be used; names of built-in commands such as `build` cannot be used either.

| Output | How to write it | With `--json` |
| --- | --- | --- |
| Result for people | `this.log(...)` | This text is not printed |
| Result for programs | `return result` | Appears in `result` of the uniform document |
| Progress | `this.logToStderr(...)` | Still written to stderr |
| Warning | `this.warn(...)` | Goes into the warnings |
| Failure | Throw `CommandError` | Outputs `ok: false` with `error.code`, and exits with a nonzero status |

## Test the command

Add `tests/cli/preview.test.ts`:

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

If the generated `tests/cli/info.test.ts` asserts that the whole command table contains only `info`, change it to `expect(cliPlugin.commands.info).toBe(PluginInfo)` and keep the existing tests of the info output. This is a normal update of expectations after adding a feature; do not simply delete the test.

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

The first two commands return `Hello` with length 5; the last returns `INVALID_TEXT` and exits with status 2. After running the App's `pnpm build`, run `node dist/cli/index.js notice-cli preview --text Hello --json` to verify the command also works in the deployment output.

## Development commands and hooks

Commands still needed after deployment go in `commands`; commands used only to compile source or generate files locally go in `devCommands`, which do not enter the deployed command set.

When there really is a generation task, `buildHooks` or `devHooks` can have the App call commands. The build stages are, in order, `beforeBuild`, `afterClientBuild`, `afterServerBuild` and `afterBuild`; development only has `beforeDev`. A hook's `command` is an array of an executable and its arguments that does not go through a shell, so `&&`, pipes and redirection cannot be used in it. A failing hook stops the whole flow, which makes hooks suitable for verifying artifacts that must exist.

For how the application side connects and verifies existing plugin commands, see [Integrate plugin commands](../developing-apps/plugin-commands.md). Commands that belong to a single application can be written directly in `cli/commands/`; see [Write application commands](../developing-apps/application-commands.md).
