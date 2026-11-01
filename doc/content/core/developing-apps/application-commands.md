---
title: Write application commands
description: Write AppCommand classes in cli/commands, access application services, handle paths and JSON output, and verify commands in a deployment.
---

Application-owned commands live in `cli/commands/`. Use them for data exports, diagnostics or one-off maintenance. For example, `pnpm nocobase app statuses export` reads a status dictionary and saves it to a file.

This guide is for developers and operators with access to the application directory and configuration. To let users or agents perform business operations over the network, see [Provide an application CLI client](cli-client.md). For commands shared by multiple applications, see [Integrate plugin commands](plugin-commands.md).

## Directories and command names

```text
cli/
├── commands/
│   └── statuses/
│       ├── export.ts       # app statuses export
│       └── _helpers.ts     # Helpers, not a command
└── plugins.ts              # Plugin command registration
```

Each command file default-exports an `AppCommand` subclass. Its path determines its name under `app`, with no index registration. Files and directories starting with `_`, and directories named `lib`, are skipped. Avoid `dist`, `build`, `coverage` and `generated` as command directories: project version-control, formatting or checking rules ignore those names.

Application commands are included in deployment builds, so their runtime packages must be in `dependencies`. Keep source-only generators in project scripts or a plugin's `devCommands`. Application commands have no separate development-only declaration.

## Example: export the status dictionary

First complete the independent `appStatuses` example at the start of [Create tables and initialize data](data-models-and-migrations.md). Apply its migration and Seed to create the `code` and `title` fields and default records. Adding the optional description field does not change the fields or default codes this command exports.

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

The command reads the dictionary without changing the database. This example exports at most 100 records and explicitly fails above that limit. Larger exports need pagination and a suitable file-writing strategy. A dry run or empty dictionary creates no output file, and existing files are never overwritten.

Run from the application root:

```bash
pnpm nocobase app statuses export --help
pnpm nocobase app statuses export --dry-run --json
pnpm nocobase app statuses export --output ./statuses.json --json
```

With the two default records, a dry run has this shape; the path depends on the application and storage configuration:

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

The last command creates `statuses.json`. Running it again with the same output path returns `OUTPUT_EXISTS` with exit code `2`. Choose another filename to continue.

## Choose the application facilities you need

| Need | Entry point |
| --- | --- |
| Locate application files | `this.rootDir`, without creating an application |
| Read configuration, paths or the environment | `this.withApp(async ({ app, env }) => ...)` |
| Resolve the database or business services | Call `app.registerProviders()` inside the callback, then use `app.container` |
| Use the full startup lifecycle | Call `await app.start()` inside the callback |

`withApp()` creates the application, runs the callback, then shuts it down and destroys the runtime, including when the callback fails. It does not register or start providers automatically. `app.config` and `app.paths` need no registration. Start the full lifecycle only when needed: doing so may also start consumers and schedules. See [Server-side services](server-business-services.md) for service organization.

Use the application object only inside the callback and return plain result data. Cleanup failures become warnings so that completed work is not reported as failed and inadvertently repeated.

A local command uses application configuration to access services. It does not inherit a browser user's session or data scope. Explicitly validate identity and scope for user-bound operations, or expose them through a protected HTTP API; see [Authentication, permissions and data scopes](authentication-and-permissions.md).

## Arguments, paths and module loading

`AppCommand` is based on oclif. Declare positional arguments with `Args` and options with `Flags`. Describe each argument and use `summary` and `examples` to explain the command. `pnpm nocobase commands --json` makes this information discoverable to people and agents.

Use `appPath()` for path options. User-supplied relative paths resolve from the current working directory; declared defaults resolve from the application root. The command receives an absolute path. The example computes its default with `app.paths.storage()` because deployment storage may be outside the code directory.

Help also imports command modules. Keep top-level imports to `@nocobase/app-cli`, `@oclif/core` and Node built-ins. Dynamically import heavier dependencies inside `run()`; never connect to a database or start work at module scope.

## Output, errors and logs

`AppCommand` already provides `--json`. Return typed plain data on success and throw `CommandError` on failure.

| Purpose | API | With `--json` |
| --- | --- | --- |
| Human-readable result | `this.log(text)` | Suppressed |
| Program-readable result | `return result` | Included in `result` |
| Progress | `this.logToStderr(text)` | Still written to stderr |
| Warning | `this.warn(text)` | Included in `warnings` |
| Failure | `throw new CommandError(...)` | `ok: false`, `error.code` and a nonzero exit |

Use stable uppercase error codes, actionable `suggestions` and plain `details`. Errors default to exit code `1`; use `2` for invalid usage. When suggesting another framework command, `this.cliCommand(['db', 'apply'])` produces the correct invocation for the source or deployment environment.

The default status is `success`. Set `success-noop` for a preview or nothing to do, or `partial-success` when some work remains, explaining what was not completed. Keep credentials and entire exports out of the result.

Avoid `console.log()`, manual JSON output, `process.exit()`, `this.exit()`, `this.logJson()` and `this.error()`: they disrupt the output contract or exit semantics. A `CommandError` does not print its `cause`. Set `NOCOBASE_CLI_DEBUG=1` to inspect redacted error chains on stderr. Use the application logging service for persistent operational records; see [Logging](../framework/support/logging.md).

## Testing and delivery

Put command tests in `tests/cli/`. `@nocobase/app-testing/cli` exports `bindAppCommand()` and `runAppCommand()`. Bind the command to an isolated fixture root and an ID such as `app:statuses:export`; run it to inspect its result, JSON, stdout, stderr and exit code. Inject `loadRuntime` and `createApp` to substitute services.

For a real application and database, use `createTestAppConfig()` and `bindTestAppCommand()` from the same entry. Follow the [database command test example](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/command.md) to prepare migrations and Seeds, and call `config.dispose()` afterwards. Custom runtime loaders must wire in test configuration and storage isolation themselves.

Cover successful export and file contents, dry runs without files, empty dictionaries returning `success-noop`, existing files preserved with `OUTPUT_EXISTS`, and resource cleanup after read or write failures. Run tests that capture process output sequentially.

```bash
pnpm lint
pnpm typecheck
pnpm nocobase commands --json
pnpm build
node dist/cli/index.js app statuses export --help
node dist/cli/index.js app statuses export --dry-run --json
```

Run the project's CLI tests before these checks. A deployment dry run still reads the database selected by deployment configuration, so use a prepared verification environment. Help alone does not verify database access.

This guide follows the [application command authoring reference](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/commands.md). See [CLI runtime](../framework/runtime/cli.md) for shared mechanisms and [CLI reference](../reference/cli.md) for built-in commands.
