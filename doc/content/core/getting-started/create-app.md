---
title: Create an app
description: Create, configure and start a NocoBase 3 application with a coding agent or manual commands.
---

Creating a NocoBase application gives you a source project you can continue developing. Ask a coding agent to create it or run the commands yourself; both approaches use the same creation tool.

This guide uses the default template and SQLite. SQLite requires no separate database service and is convenient for a first local run.

## Prerequisites

Development requires Node.js 24 or later and pnpm 11. An agent can check the environment and explain any missing prerequisites. For manual creation, check them in your terminal:

```bash
node --version
pnpm --version
```

On Windows, use WSL. Commands below assume a POSIX shell such as Bash. Choose one creation path. The agent path also requires a coding agent with Skills support.

## With an agent

Prepare an empty directory, such as `my-app`, and start a coding agent session there. Send the following directly to the agent so it installs the creation Skill and then creates the application:

```text
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g

Please create a NocoBase 3 application for local development in this empty directory.
Use the default template and SQLite, following the application creation guidance.
Complete the setup and checks, start the app, and tell me which URL to open and how to sign in for the first time.
```

Select the current agent when prompted during Skill installation. If the session does not recognize the newly installed Skill, start a new session in the same directory and send the creation request again.

The agent checks the environment, invokes the creation tool, installs dependencies, initializes and checks configuration, and starts the application. If prerequisites are missing, it explains the required preparation.

Open the URL supplied by the agent and use its sign-in instructions, or follow [Open the application and sign in](#open-the-application-and-sign-in) below.

The created project contains `AGENTS.md` and `.agents/skills/`. For further development, have the agent read the project's own guidance and Skills. Start a new session in the application directory only if they have not been loaded into the current session.

## Without an agent

You do not need an agent Skill for manual creation. From the parent directory where you keep projects, run:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
```

The command creates `my-app` and installs dependencies. `@beta` selects the NocoBase 3 creation tool's beta channel; `--template-tag=beta` selects the template's beta channel. The environment variable permits newly published dependencies for this command only.

> Use a new or empty directory. Its name must start with a lowercase letter or digit and contain only lowercase letters, digits, dots, hyphens or underscores. The command does not accept `.` as the project name; if you are already inside an empty `my-app`, return to its parent before running it.

### 1. Initialize configuration

```bash
cd my-app
pnpm nocobase config init --dialect sqlite
```

This generates `config.yml` from `config.example.yml` and initializes required secrets. The local configuration is ignored by Git.

### 2. Check configuration

```bash
pnpm nocobase config check
```

Resolve any reported findings and check again. Start the application only after the check passes.

### 3. Start the application

```bash
pnpm dev
```

Keep the terminal running. Once ready, the server prints its complete `Local:` URL.

## Open the application and sign in

Use the full `Local:` URL, including the application's base path, such as `/main/`. Ports may advance when occupied. Do not infer the address from a default port or use the frontend Vite port as the full application entry.

![The application's English sign-in page](/assets/core/tutorials/getting-started/login.png)

Unless you changed the initial administrator configuration, the local defaults are:

- Username: `nocobase`
- Password: `admin123`

The account comes from `users.initialAdmin` in `config.yml`. Use your actual configuration if it differs, and change the default password after signing in.

![The newly created application homepage](/assets/core/tutorials/getting-started/home.png)

The homepage introduces available capabilities and includes example requirements you can give an agent. You now have both application source and a running application.

These screenshots show the historical [00-create-app](https://github.com/nocobase/app-tutorials/tree/00-create-app) example generated from default template `1.0.0-beta.78`; your installed version may look different. [Build your first app](../tutorials/build-your-first-feature.md) uses the npmjs.org-published `1.0.0-beta.81` template baseline and does not require checking out this old tag.

## Troubleshooting

### The agent cannot find the creation Skill

Check that you selected the correct agent during installation. If the current session has not loaded the new Skill, start another in the same directory and resend the creation request. Creation uses the global `nocobase-create-app` Skill; subsequent development follows the application's own guidance.

### The application exists but its Skills are missing

Run this inside the application, then start a new agent session there:

```bash
pnpm nocobase skills sync
```

### Startup reports missing configuration

Confirm that the terminal is in the application directory and run `pnpm nocobase config init --dialect sqlite` followed by `pnpm nocobase config check`. Investigate existing configuration errors rather than deleting configuration or resetting the database to retry.

## Next step

Read [Project structure](project-structure.md) to locate application code, configuration and agent guidance.
