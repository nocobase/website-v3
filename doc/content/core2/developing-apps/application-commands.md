---
title: Write application commands
description: Write AppCommand classes in cli/commands, access application services, handle arguments, paths, JSON output and failures, and verify the commands after deployment.
---

An application's own commands live in `cli/commands/` and suit data exports, diagnostics and one-off maintenance. For example, running `pnpm nocobase app statuses export` in the application directory reads the status dictionary and saves it to a file.

This guide is for developers and operators who can access the application directory and configuration. For an entry that lets users or Agents operate the business over the network, see [Provide an application CLI client](cli-client.md); for commands shared across several applications, see [Integrate plugin commands](plugin-commands.md).

## Directories and command names

```text
cli/
├── commands/
│   └── statuses/
│       ├── export.ts       # app statuses export
│       └── _helpers.ts     # Helpers, not a command
└── plugins.ts              # Plugin command registration
```

Each command file default-exports an `AppCommand` subclass, and the file path decides its command name under `app`; no index file registration is needed. Files and directories starting with `_`, and directories named `lib`, are skipped. Do not put commands in directories such as `dist`, `build`, `coverage` or `generated`, which the project's version control, formatting or checking rules ignore.

Application commands go into the deployment build, so the packages they need at runtime must be in `dependencies`. Generation scripts that only work in the source environment can stay as project scripts or be provided by a plugin's `devCommands`; application commands have no separate "register only during development" declaration.

## Example: export the status dictionary

First complete the `appStatuses` example at the start of [Create tables and initialize data](data-models-and-migrations.md) and run its migration and Seed, which give you the `code` and `title` fields and the default records. This example uses that independent example and does not depend on the historical projects-and-tasks tutorial later in that guide.

Add `cli/commands/statuses/export.ts`:

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

The command only reads the dictionary and does not change the database. The example exports at most 100 records and fails explicitly beyond that; exporting large amounts of data needs its own pagination and file-writing design, so not every record is loaded into memory. Neither `--dry-run` nor an empty dictionary creates an output file, and an existing file is never overwritten.

In the application root, run:

```bash
pnpm nocobase app statuses export --help
pnpm nocobase app statuses export --dry-run --json
pnpm nocobase app statuses export --output ./statuses.json --json
```

With the two default records, the preview returns the structure below; the file path depends on the application and its storage configuration:

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

The last command creates `statuses.json`. Using the same output path again returns `OUTPUT_EXISTS` with exit code `2`; pick another file name to continue verifying.

## Choose the application capabilities you need

| Need | Entry |
| --- | --- |
| Locate files in the application directory | `this.rootDir`, without creating the application |
| Read configuration, storage paths or the environment | `this.withApp(async ({ app, env }) => ...)` |
| Get the database or business services | In the callback, call `app.registerProviders()` first, then get them from `app.container` |
| Depend on the full startup lifecycle | In the callback, `await app.start()` |

`withApp()` creates the application, runs the callback, then shuts down the application and destroys the runtime; cleanup happens even if the callback fails. It does not register or start Providers automatically. `app.config` and `app.paths` are available without registration; start the full lifecycle only when you need running services, because starting may also start consumers and scheduled jobs. For how to organize services, see [Server business services](server-business-services.md).

Use the application object only inside the callback, and return plain result data from it. A cleanup failure is reported as a warning, so that business work already done is not misjudged as failed and then run again.

Local commands access services through the application configuration and do not inherit a browser user's sign-in or data scope. Business operations that need a user identity should validate the caller's identity and scope explicitly, or be offered through a protected HTTP API; see [Authentication, permissions and data scopes](authentication-and-permissions.md).

## Arguments, paths and module loading

`AppCommand` is based on oclif. Declare positional arguments with `Args` and options with `Flags`, and describe what each one is for; describe the command's result and usage with `summary` and `examples`. `pnpm nocobase commands --json` lists this information for people and Agents to discover.

Use `appPath()` for path options: a relative path the user passes is resolved from the current working directory, a declared default is resolved from the application root, and the command always receives an absolute path that needs no further resolution. This example takes its default location from `app.paths.storage()`, because in deployments the storage directory may live outside the code directory.

Showing help also imports the command module. So keep only `@nocobase/app-cli`, `@oclif/core` and Node built-in modules at the top level, and import heavier dependencies such as the database dynamically inside `run()`; never connect to a database or run work at the top of the module.

## Output, errors and logs

`AppCommand` already provides `--json`, so do not declare it again. Return typed plain data on success and throw `CommandError` on failure.

| Purpose | How | Behavior with `--json` |
| --- | --- | --- |
| Result for people | `this.log(text)` | The text is not printed |
| Result for programs | `return result` | Goes into `result` |
| Progress | `this.logToStderr(text)` | Still written to stderr |
| Warning | `this.warn(text)` | Goes into `warnings` |
| Failure | `throw new CommandError(...)` | `ok: false` and `error.code`, with a nonzero exit code |

Use stable uppercase names for `code`, tell the caller what to do in `suggestions`, and keep necessary plain data in `details`. The exit code for errors defaults to `1`; use `2` for invalid usage. To suggest running another framework command, `this.cliCommand(['db', 'apply'])` produces an invocation that matches the source or deployment environment.

The default status is `success`; set `success-noop` for a preview or when there is nothing to do, and `partial-success` when only part of the work was done, explaining what remains. Never put credentials or a whole export into the result.

Avoid `console.log()`, hand-written JSON output, `process.exit()`, `this.exit()`, `this.logJson()` and `this.error()`, which break the output contract or the exit semantics. A `CommandError`'s `cause` is not printed directly; when troubleshooting, set `NOCOBASE_CLI_DEBUG=1` to see the redacted error chain on stderr. For operational logs that must be kept, use the application's logging service; see [Logging](../framework/support/logging.md).

## Testing and delivery

Command tests go in `tests/cli/`. `@nocobase/app-testing/cli` provides `bindAppCommand()` and `runAppCommand()`: the former binds an isolated test application directory and a command ID such as `app:statuses:export`, and the latter returns the result, JSON, stdout, stderr and exit code. You can inject `loadRuntime` and `createApp` to isolate services.

When you need a real application and database, use `createTestAppConfig()` and `bindTestAppCommand()` from the same entry, prepare migrations and Seeds following the [database command test example](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/command.md), and call `config.dispose()` when done. A custom runtime loader must wire in test configuration and storage isolation itself and must never point at the development database.

At minimum, verify: a normal export and the file contents; a preview that writes no file; `success-noop` for an empty dictionary; an existing file left untouched with `OUTPUT_EXISTS`; and an error plus released resources when reading or writing fails. Command tests that capture process output should run sequentially.

```bash
pnpm lint
pnpm typecheck
pnpm nocobase commands --json
pnpm build
node dist/cli/index.js app statuses export --help
node dist/cli/index.js app statuses export --dry-run --json
```

Run the project's configured CLI tests first, then the checks above. A preview through the deployment entry still reads the database selected by the deployment configuration, so run it in a prepared verification environment; checking the help output alone does not prove data access works.

This guide follows the [application command authoring reference](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/commands.md). For the shared runtime mechanisms, see [Command-line runtime](../framework/runtime/cli.md); for built-in command options, see [Command-line reference](../reference/cli.md).
