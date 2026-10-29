---
title: Create an app
description: Create, start and sign in to a NocoBase 3 application with a coding Agent or by running the commands yourself.
---

Creating a NocoBase application gives you a project you can keep developing. You can ask a coding Agent to create it or run the commands in a terminal yourself; both approaches use the same creation tool.

This guide uses the default template and SQLite. SQLite needs no separate database service, which makes it convenient for a first local run.

## Prerequisites

Development requires Node.js 24 or later and pnpm 11. If you use an Agent, it can check the environment and tell you what is missing. For manual creation, check the versions in your terminal first:

```bash
node --version
pnpm --version
```

On Windows, work in WSL. The commands below assume a POSIX shell such as Bash.

Choose one of the two creation paths below. The Agent path also needs a coding Agent that supports Skills.

## With an Agent

Prepare an empty directory, such as `my-app`, and start a coding Agent session in it.

First, send this command to the Agent to install the Skill that creates applications:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

When prompted during installation, select the Agent you are using. If the current session does not recognize the new Skill, start another session in the same directory. Once the Skill is loaded, send the creation request:

```text
Please create a NocoBase 3 application for local development in this empty directory.
Use the default template and SQLite, following the application creation guidance.
Complete the setup and checks, start the app, and tell me which URL to open and how to sign in for the first time.
```

Following the guidance, the Agent checks the environment, runs the creation tool, installs dependencies, initializes and checks the configuration, and finally starts the application. If something is missing from the environment, it explains what to prepare first.

When it is done, open the URL the Agent gives you and sign in with the details it provides, or follow [Open the application and sign in](#open-the-application-and-sign-in) below.

The new application directory contains `AGENTS.md` and `.agents/skills/`. For further development, have the Agent read the project's own guidance and Skills; if the current session has not loaded them, start a new session in the application directory.

## Without an Agent

Manual creation needs no Agent Skill. In the parent directory where you keep projects, run the following command; the creation tool creates the `my-app` directory and installs dependencies:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
```

`@beta` selects the beta channel of the NocoBase 3 creation tool, and `--template-tag=beta` selects the beta channel of the template. The environment variable in front lets pnpm install newly published versions, for this command only.

> [!TIP]
> The project directory must not exist yet or must be empty. Its name may contain only lowercase letters, digits, dots, hyphens and underscores, and must start with a letter or digit. The command does not accept `.` as the project name; if you are already inside an empty `my-app` directory, go back to its parent before running the command.

### 1. Initialize configuration

Enter the application directory and generate the local configuration:

```bash
cd my-app
pnpm nocobase config init --dialect sqlite
```

This generates `config.yml` from `config.example.yml` and initializes the required secrets. `config.yml` holds the configuration of the current environment and is ignored by Git.

### 2. Check configuration

```bash
pnpm nocobase config check
```

If the check fails, fix what it reports and check again. Start the application only after the check passes.

### 3. Start the application

```bash
pnpm dev
```

Keep this terminal running. When the development server is ready, it prints a `Local:` URL; open it to access the application.

## Open the application and sign in

Use the complete `Local:` URL printed by `pnpm dev`, including the application path (such as `/main/`). The port may move up when it is already in use, so do not build the address from a default port, and do not treat the frontend Vite port as the full application entry.

![The application's English sign-in page on first open.](/assets/core/tutorials/getting-started/login.png)

Unless you changed the initial administrator configuration, the default sign-in details are:

- Username: `nocobase`
- Password: `admin123`

The initial administrator is configured by `users.initialAdmin` in `config.yml`. If you changed it during creation, use the account you configured. Change the default password after you first sign in.

![The homepage of a newly created application, before any task features are added.](/assets/core/tutorials/getting-started/home.png)

After signing in you see the application's homepage, which introduces the built-in capabilities and offers example requirements you can give an Agent. You now have application source code and a running application, and can start building business features.

These screenshots come from the historical [00-create-app](https://github.com/nocobase/app-tutorials/tree/00-create-app) example on default template `1.0.0-beta.78`; your interface depends on the template version you create. [Build your first app](../tutorials/build-your-first-app-agent-first.md) uses the `1.0.0-beta.84` template published on npmjs.org as its baseline and does not require checking out this old tag.

## Troubleshooting

### The Agent cannot find the creation Skill

Check that you selected the Agent you are using during installation. If the current session has not loaded the new Skill, start another session in the same directory and send the creation request again. Note the two kinds of guidance: creation uses the globally installed `nocobase-create-app`, while development guidance after creation lives in the application directory.

### The application exists but its project Skills are missing

Run this in the application directory, then start a new Agent session there:

```bash
pnpm nocobase skills sync
```

### Startup reports that there is no configuration

Make sure the terminal is in the application directory, then run `pnpm nocobase config init --dialect sqlite` followed by `pnpm nocobase config check`. If a configuration already exists, investigate the specific error instead of deleting the configuration or database to retry.

## Next step

Read [Project structure](project-structure.md) to see where application code, configuration and Agent guidance live.
