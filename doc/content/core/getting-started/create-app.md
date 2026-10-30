---
title: Create an app
metaDescription: Create a local NocoBase 3 application with the default template and SQLite, start it and sign in.
---

## Prepare the environment

- Node.js 24 or later, and pnpm 11.
- On Windows, use WSL. Run the commands below in a POSIX shell such as Bash.

Choose either to have an agent create the application or to run the commands yourself.

## Create with an agent

Install the app creation Skill and select your agent when prompted:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

If your agent is already open, start a new session so it can use the newly installed Skill. Then open the agent in an empty directory, such as `my-app`, and send:

```prompt
Create a NocoBase 3 application for local development in this empty directory, using the default template and SQLite.
Start it and tell me the URL and the initial sign-in details.
```

The agent creates the application, generates configuration and starts it, then gives you the URL and initial sign-in details.

## Run the commands yourself

Run the following where you want to keep the application. The creation tool makes a new `my-app` directory and installs dependencies:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
```

NocoBase 3 is in beta. `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` allows pnpm to install newly published versions for this command only.

Enter the directory, generate configuration, check it and start the application:

```bash
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

- `config init` generates the local `config.yml` and application secrets. SQLite needs no separate database installation. Keep `config.yml` out of Git.
- `config check` loads configuration as startup would and suggests fixes if it finds problems.
- `pnpm dev` starts the development server and prints a `Local:` URL when ready. Keep this terminal running; closing it stops the application.

## Sign in

Open the application URL and sign in with the default administrator: username `nocobase`, password `admin123`. Where you get the URL depends on how you created the application:

- **With an agent**: use the URL the agent gives you.
- **With manual commands**: use the `Local:` URL printed in the terminal.

The URL includes an application path, such as `/main/`. Keep that path when opening it.

After signing in, you reach the home page. It lists built-in capabilities and example requests you can give an agent:

![The newly created application home page, before adding business features.](/assets/core/tutorials/getting-started/home.png)

The screenshot is from an example application using default template `1.0.0-beta.78`. The interface may differ with your installed version.

## Next step

Continue to [Develop your first feature](build-your-first-app.md) to have an agent add customer management to the application you just created.
