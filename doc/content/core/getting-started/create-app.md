---
title: Create an app
description: Create a local NocoBase 3 application, start it and sign in as an administrator.
---

## Before you start

| Requirement | Check or details |
| --- | --- |
| Node.js 24 or later | Run `node --version` |
| pnpm 11 | Run `pnpm --version` |
| Unix-like terminal | Use macOS or Linux directly, or WSL on Windows. The commands use Bash-compatible shell syntax |

To create the application with an agent, you also need a coding tool that supports Skills, such as Claude Code or Codex.

<details>
<summary>Install or upgrade Node.js and pnpm</summary>

If you already manage Node.js with nvm or fnm, run `nvm install 24` or `fnm install 24`. Install pnpm 11 with:

```bash
npm install -g pnpm@11
```

After installing or upgrading, open a new terminal and run the checks in the table to confirm the versions.

</details>

For a local trial, SQLite needs no separate database installation. To use PostgreSQL or another database, have the database service, database name and connection account ready. The account must be able to create the application's tables.

## Create and start the application

Choose either [With an agent](#with-an-agent) or [From the command line](#from-the-command-line).

The examples use `my-app` as both the application name and directory name. You can choose another name: start with a lowercase letter or digit and use only lowercase letters, digits, dots, dashes and underscores. The target directory must be new or empty.

### With an agent

**1. Install the app creation Skill.** Run this in a terminal and select your coding tool when prompted:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

`-g` installs the Skill globally, making it available when you create applications in other directories too.

**2. Open an empty directory and start a new agent session.** For example:

```bash
mkdir my-app
cd my-app
```

Open this directory in your coding tool and start a new session so it loads the Skill you just installed.

**3. Describe what you want.**

```prompt
Create a NocoBase 3 app in the current directory for local development. Start it when ready and tell me the URL and sign-in details.
```

**4. Answer setup questions and wait for startup.** The agent checks the environment and asks which database to use. For a local trial, answer “Use SQLite.” For an existing database, provide its type and connection details. Supply the password through an environment variable and tell the agent its name, rather than sending the password in the conversation. If you want a custom initial administrator account, say so before the first startup too.

Once the agent has created the application, checked configuration and started it, [sign in](#sign-in-and-check-the-application) at the complete URL it provides.

### From the command line

**1. Create the project and enter its directory.** Run this from the directory where you want to keep the project:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
```

The tool downloads the application template, installs dependencies and synchronizes their Skills to `.agents/skills/`.

Keep both `@beta` and `--template-tag=beta`: they select the beta channels for the creation tool and application template respectively. `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` allows newly published versions for this command only. The creation tool does not accept `.` in place of an application name.

**2. Generate and check configuration.** The following uses SQLite as an example. For another database, use the commands in the expandable section below instead.

```bash
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
```

`config init` generates `config.yml` and encryption keys from `config.example.yml`, without overwriting existing configuration. `config.yml` contains local settings and secrets and is already ignored by Git. Do not commit or share it.

`config check` checks the configuration and, for databases other than SQLite, connectivity. Resolve any issues it reports before starting the application.

<details>
<summary>Use PostgreSQL or another database</summary>

Install the appropriate driver in the application directory, then generate configuration. For PostgreSQL, use these commands instead of the SQLite configuration commands above:

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres
pnpm nocobase config check
```

In an interactive terminal, `config init` prompts for connection details without echoing the password, then tests the connection. If it fails, check the database service, address and credentials. Even if you choose to save the configuration, wait for `config check` to pass before starting. If the driver is missing, the command writes no configuration and provides the required installation command.

For other drivers, `--dialect` values and version requirements, see [Database support and compatibility](../reference/compatibility.md).

If `config.yml` already exists, running `config init` again will not switch databases. Install the target driver, update the connection using [Database configuration](../reference/configuration.md#database-configuration), then run `config check` again. When updating a password through the CLI, use [`config set --from-env`](../reference/configuration.md#editing-and-checking) to read it from an environment variable. Switching databases does not migrate existing data.

</details>

> [!NOTE]
> To customize the initial administrator account, edit `users.initialAdmin` in `config.yml` before the first startup, then run `pnpm nocobase config check` again.

**3. Start the application.**

```bash
pnpm dev
```

On first startup, the application creates tables and initial data, including the administrator account. Wait for the terminal to print a line beginning with `Local:`, then open its complete URL, keeping the trailing `/main/` or other application path. If the default port is occupied, another is selected automatically, so use the printed address.

## Sign in and check the application

If you have not customized the initial administrator account, sign in with:

| Username | Email | Password |
| --- | --- | --- |
| `nocobase` | `admin@nocobase.com` | `admin123` |

You can sign in with either the username or email. Change the default password after signing in, before allowing others to access the application. `users.initialAdmin` only creates the initial administrator; changing it does not reset an existing account's password.

**Done when**: You can open the application, sign in as an administrator and see the home page.

For an application you started manually, press <kbd>Ctrl</kbd>+<kbd>C</kbd> in its terminal to stop it. If an agent started it, you can ask the agent to stop it. Once the process has stopped, run the following in the application directory to restart it, then use the newly printed URL:

```bash
pnpm dev
```

## Start developing

Continue development in the application directory, with the agent loading its `AGENTS.md` and `.agents/skills/`. These match the installed version. Start a new session if the current one has not loaded them.

Before making changes, commit the initial code to Git so you can review and revert later changes.

<details>
<summary>Save the first Git commit</summary>

With Git installed, open another terminal in the application directory and run:

```bash
git init
git add -A
git diff --cached --stat
git commit -m "chore: create app"
```

Check the staged files before committing. The template's `.gitignore` excludes `config.yml`, SQLite database files, `storage/`, `node_modules/` and synchronized `.agents/skills/`. Commit `.agents/rules/`, which contains application-owned rules.

</details>

Next, follow [Build your first app](../tutorials/build-your-first-app.md) to add task management with an agent. See [Project structure](project-structure.md) to find your way around the code, or [Develop with an agent](../developing-apps/develop-with-an-agent.md) for describing requirements and checking results.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Node.js or pnpm has the wrong version, or `NODE_UNSUPPORTED` appears | Upgrade to the [required versions](#before-you-start), then confirm them in a new terminal |
| A version cannot be found or the template download fails | Check the network, npm registry and the creation command's `@beta`, `--template-tag=beta` and `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0`. A failed download has not created the project, so you can retry directly |
| Dependency installation fails | Run `pnpm install` in the existing application directory rather than recreating it. See below for SQLite driver errors |
| Configuration checks fail, or startup reports missing configuration | Run `config init` if no configuration exists. Otherwise, run `config check` and use its output to fix settings or connection details. See [Configuration reference](../reference/configuration.md) |
| The browser cannot open the application | Confirm the process is still running and use the complete startup URL, including its port and any path such as `/main/` |
| New initial administrator settings do not let you sign in with the new password | Configuration does not reset existing accounts. See [FAQ](../reference/faq.md#why-did-changing-the-initial-administrator-password-not-update-an-account) |
| Skill synchronization fails | Retry with `pnpm nocobase skills sync` in the application directory. The application itself can still run |

<details>
<summary>The SQLite driver reports Could not locate the bindings file</summary>

If no usable prebuilt `better-sqlite3` binary matches the platform, install a C++ toolchain, including make, a C++ compiler and Python. Set `better-sqlite3` to `true` under `allowBuilds` in the application's `pnpm-workspace.yaml`, then reinstall dependencies from the application directory:

```bash
rm -rf node_modules
pnpm install
```

</details>
