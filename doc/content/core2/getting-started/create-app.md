---
title: Create an app
description: Create a local NocoBase 3 application, start it and sign in as an administrator.
---

By the end of this guide, you will have:

- A `my-app/` project directory containing application source, `AGENTS.md` and package-provided Skills, ready to commit to Git.
- A locally running application you can sign in to as an administrator.

SQLite is the default, so no separate database installation is needed. Choose either approach below: let an Agent do the work or run the commands yourself. Both use the same creation tool and produce the same result.

## Prepare

| Requirement | Details |
| --- | --- |
| Node.js 24 or later | Check with `node --version`. Install with `nvm install 24` or `fnm install 24` |
| pnpm 11 | Check with `pnpm --version`. Install with `corepack enable && corepack prepare pnpm@11 --activate` or `npm install -g pnpm@11` |
| Unix-like terminal | Use macOS or Linux directly, or WSL on Windows. The commands below do not work in PowerShell or cmd |
| Coding tool (for the Agent approach) | A coding tool that supports Skills, such as Claude Code or Codex |

After installing or upgrading Node.js or pnpm, open a new terminal to ensure the new versions take effect.

## With an Agent

**1. Install the app creation Skill.** Run this in a terminal and select your coding tool when prompted:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

`-g` installs the Skill globally so it is available from any directory.

**2. Start an Agent session in an empty directory.** Create a directory such as `my-app`; its name becomes the application name. Start a new Agent session there so it loads the newly installed Skill.

**3. Describe what you want:**

```text
Create a NocoBase 3 application in the current directory for local development, using SQLite.
Start it when ready and tell me the URL and the initial sign-in account.
```

The Agent checks Node.js and pnpm versions, creates the project, generates and checks configuration, starts the application and confirms the URL opens. It should then tell you:

- The application URL and initial sign-in account.
- How to start the application again later.
- Whether you can continue development in the current session.

If Node.js or pnpm is missing, the Agent explains what is missing and how to install it; it does not install them itself. Name another database, such as PostgreSQL, in your request if needed. Do not send database passwords in the conversation: put them in environment variables and tell the Agent the variable names.

An application started by an Agent session stops when that session ends. Run `pnpm dev` in the application directory to start it again.

For further development, start an Agent session in the application directory. Its `AGENTS.md` and `.agents/skills/` match the installed version and take over from the app creation Skill.

## Without an Agent

### 1. Create the project

Run this from the directory where you want to keep the project:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
```

The tool creates `my-app/`, downloads the application template, installs dependencies and synchronizes their Skills to `.agents/skills/`.

- `my-app` is both the directory name and application name. The directory must be new or empty. Its name must start with a lowercase letter or digit and contain only lowercase letters, digits, dots, dashes and underscores. You cannot use `.` for the current directory.
- `@beta` selects the latest beta creation tool, and `--template-tag=beta` selects the latest beta application template. Both are required.
- `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` allows pnpm to install newly published versions for this command only, without changing your pnpm configuration.

### 2. Generate configuration

```bash
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
```

`config init` generates `config.yml` from `config.example.yml`, including encryption keys. This machine-specific file contains secrets and is already ignored by Git. Do not commit or share it. Running the command again on a configured application leaves the existing file unchanged.

`config check` loads configuration as startup would and reports missing keys, unknown settings and other problems. Follow its guidance until the check passes.

> [!NOTE]
> The initial administrator account comes from `users.initialAdmin` in `config.yml`. To choose your own username and password, change them before the first startup. Changing this setting later does not update an existing account.

### 3. Start the application

```bash
pnpm dev
```

On first startup, the application creates tables and initial data, including the administrator account. Wait for the terminal to print a line beginning with `Local:`, which means the application is ready.

Open the complete URL from that line, keeping the trailing `/main/` or other application path. If the default port is occupied, another is selected automatically, so use the printed URL rather than constructing one yourself.

Press <kbd>Ctrl</kbd>+<kbd>C</kbd> to stop the application. Next time, run `pnpm dev` from its directory to restart it.

## Sign in

If you have not changed `users.initialAdmin`, use the default administrator:

| Username | Email | Password |
| --- | --- | --- |
| `nocobase` | `admin@nocobase.com` | `admin123` |

You can sign in with either the username or email. Change the default password promptly, especially if others can access the application.

**Done when**: You can sign in as an administrator and see the application home page.

## Commit the first version

Commit the new project to Git now so you can see exactly what each subsequent Agent change modifies:

```bash
git init
git add -A
git commit -m "chore: create app"
```

The template's `.gitignore` excludes `config.yml`, SQLite database files, `storage/`, `node_modules/` and synchronized `.agents/skills/`. Commit `.agents/rules/`, which contains application-owned rules.

## Use another database

SQLite suits local development and evaluation. To use the same database locally as in production, complete the following before first startup, replacing the commands in step 2. For PostgreSQL:

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres
pnpm nocobase config check
```

When run in a terminal, `config init` prompts for the host, database name, username and password without echoing the password. It tests the connection before writing configuration. If the driver is missing, it writes no files and provides the required `pnpm add` command.

| Database | Driver package | `--dialect` |
| --- | --- | --- |
| PostgreSQL | `@nocobase/db-postgres` | `postgres` |
| MySQL, MariaDB | `@nocobase/db-mysql` | `mysql` |
| SQL Server | `@nocobase/db-mssql` | `mssql` |
| Oracle | `@nocobase/db-oracle` | `oracle` |

If `config.yml` already exists, `config init` will not overwrite it. Use `pnpm nocobase config set` to update fields under `database.connections.main`. Read passwords from environment variables with `--from-env` to keep them out of command history:

```bash
pnpm nocobase config set --from-env database.connections.main.password=MY_APP_DB_PASSWORD
```

Changing databases does not migrate existing data. See [Database support and compatibility](../reference/compatibility.md) for supported versions and [Configuration reference](../reference/configuration.md) for all settings.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Node.js is older than 24, or creation reports `NODE_UNSUPPORTED` | Upgrade Node.js, open a new terminal and retry |
| No matching version is found, or the newest version is not installed | Confirm the command starts with `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` |
| Template download fails | Check the network and npm registry. The project has not been created, so retry directly |
| Dependency installation fails | The project directory exists. Run `pnpm install` there instead of recreating it |
| `Could not locate the bindings file` | No prebuilt `better-sqlite3` binary matches the platform. Install a C++ toolchain, add `better-sqlite3: true` under `allowBuilds` in `pnpm-workspace.yaml`, then run `rm -rf node_modules && pnpm install` |
| Skill synchronization fails | The application can still run. Retry with `pnpm nocobase skills sync` in its directory |
| `pnpm dev` reports the application is not configured | Run `config init` and `config check` from step 2 |
| The browser cannot find the page | Use the complete `Local:` URL printed by `pnpm dev`, including the port and trailing `/main/` |
| Changing `users.initialAdmin` does not change the sign-in password | This setting only creates the initial administrator; it does not reset an existing account. See [FAQ](../reference/faq.md#why-did-changing-the-initial-administrator-password-not-update-an-account) |

## Next steps

- [Project structure](project-structure.md): find pages, APIs, tables and tests.
- [Build your first app](../tutorials/build-your-first-app.md): build a team task application with an Agent.
- [Develop with an Agent](../developing-apps/develop-with-an-agent.md): describe requirements and check results.
- When you are ready to deploy, see [Choose a deployment method](../deployment/choose-a-deployment-method.md).
