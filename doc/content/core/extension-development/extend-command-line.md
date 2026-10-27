---
title: Extend the command line
description: Register plugin commands with arguments, JSON output, errors and build hooks.
---

Plugins can contribute App commands for diagnostics, artifact generation and one-off maintenance. This example adds `notice-cli preview`, which validates text and returns a preview without starting the application or writing database records.

## Use an Agent

```text
Create a notice-cli plugin with a preview command accepting --text.
Validate nonempty text and length, return normalized text and its character count,
and support --json and stable error codes. Keep the generated info command,
test success and failure, and register the plugin in this App.
```

## Create the CLI capability

Run from the App root. Paths are relative to `packages/app-plugin-notice-cli/`:

```bash
pnpm create @nocobase/plugin@beta notice-cli --with cli
```

The scaffold supplies `cli/index.ts`, an `info` command, the `./cli` export and development/build configuration. A CLI plugin does not require Client or Server entries.

## Write the command

Create `cli/preview.ts`:

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

`AppCommand` supplies the parsing environment and output contract. It already provides `--json`; do not declare it again. Return plain data on success and throw `CommandError` on failure. Do not call `process.exit()`, `this.exit()` or print custom JSON.

The input bound uses JavaScript string length; the reported count uses Unicode code points. Pure text processing needs no `withApp()`. Create the App only when the command needs its configuration or services.

| Need | Use |
| --- | --- |
| Locate App files | `this.rootDir` |
| Read configuration or use services | `this.withApp(async ({ app }) => ...)`; register Providers before resolving services |
| Run the complete lifecycle | Call `await app.start()` inside `withApp()` |

`withApp()` cleans up after success or failure. Full startup can start background work, so do not start every Provider just to read a configuration value.

## Declare the commands

Keep `info` and add `preview` in `cli/index.ts`:

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

`@nocobase/app-plugin-notice-cli` derives topic `notice-cli`, giving `pnpm nocobase notice-cli preview`. Packages with the same short name under different npm scopes derive the same topic and cannot coexist in that command namespace. Built-in names such as `build` are reserved too.

| Output | Write | Under `--json` |
| --- | --- | --- |
| Human result | `this.log(...)` | Suppressed |
| Program result | `return result` | Included as `result` in one document |
| Progress | `this.logToStderr(...)` | Still stderr |
| Warning | `this.warn(...)` | Included in warnings |
| Failure | Throw `CommandError` | `ok: false`, stable `error.code`, nonzero exit |

## Test the command

Create `tests/cli/preview.test.ts`:

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

If the generated `tests/cli/info.test.ts` asserts the whole command map contains only `info`, change it to `expect(cliPlugin.commands.info).toBe(PluginInfo)`. Keep the existing output tests rather than deleting them.

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

The first two return `Hello` and length 5. The final command returns `INVALID_TEXT` and exits with status 2. After the App’s `pnpm build`, run `node dist/cli/index.js notice-cli preview --text Hello --json` to check the deployment command too.

## Development commands and hooks

Put commands needed after deployment in `commands`. Put source-only compilation or generation commands in `devCommands`, which are omitted from the deployment command set.

Use `buildHooks` or `devHooks` only when the App genuinely needs a generation step. Build stages are `beforeBuild`, `afterClientBuild`, `afterServerBuild` and `afterBuild`; development has `beforeDev`. A hook’s `command` is an executable-and-arguments array, not a shell string: no `&&`, pipes or redirects. Failure stops the pipeline, making hooks appropriate for required artifacts.
