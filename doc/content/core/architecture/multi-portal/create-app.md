---
title: Create a multi-portal app
metaDescription: Sign in to the commercial registry, then create, configure and start a multi-portal app.
---

Create and start a multi-portal app to host your business portals. The template includes multi-portal registration, the workbench and portal management, but no preinstalled business portals or sample data.

## Prepare the environment and commercial access

Use Node.js 24 or later, pnpm 11, and an account authorized to download the commercial multi-portal packages. These commands use a POSIX shell such as Bash; on Windows, use WSL.

Sign in through your own terminal. Reuse an existing valid login:

```bash
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
npm whoami --registry=https://pkg-v3.nocobase.com/
npm view @nocobase/app-template-multi-portal@beta version --registry=https://pkg-v3.nocobase.com/
```

Provide the requested account details and use the registry read token at the password prompt. Keep credentials in the npm user configuration, outside project files and Git. Check package access as well as login: a successful `whoami` does not prove download permission.

The template, management plugin and portal generator use the commercial registry. Third-party dependencies still use public npm or your public mirror; do not change the entire default registry to the commercial source.

## Create the app with an Agent

Complete the commercial registry login above on the machine and under the user account where the Agent runs commands. A local npm login is not automatically available to a remote Agent. Do not paste read tokens into chat.

Install the global `nocobase-create-app` Skill and select your Agent when prompted:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

Reopen the Agent session to load the Skill. Open the parent directory where you want the project, and provide its name, location, database and access requirements. Ask the Agent to clarify choices you have not made yet:

```prompt
Create a NocoBase 3 multi-portal app for local development in the my-portals directory.
Confirm the database and access setup with me, then start it and give me the URL and initial login details.
```

The creation Skill supports the commercial multi-portal template. It checks package access, selects `multi-portal`, installs dependencies, configures and starts the app. Check the delivered directory and URL, then sign in to confirm the administrator workbench and portal management are available. An empty portal list is expected. A creation success message alone does not verify login.

Continue development inside the generated app directory, using its `AGENTS.md`, `.agents/rules/multi-portal.md` and project Skills. If the current session has not loaded that guidance, reopen the Agent in the app directory before [developing a portal](develop.md#create-your-first-portal).

The manual steps below are an alternative. Do not repeat them if the Agent has already created, configured and started the app.

## Create the app manually

### Create the app

Run from the parent directory. `my-portals` must be new or empty:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 \
NOCOBASE_REGISTRY=https://pkg-v3.nocobase.com/ \
npm_config_registry=https://registry.npmjs.org \
pnpm create @nocobase/app@beta my-portals \
  --template=multi-portal --template-tag=beta
cd my-portals
```

`multi-portal` selects `@nocobase/app-template-multi-portal`. The creator generates source, installs dependencies and synchronizes development Skills. `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` lets this command install newly released beta packages. Replace the public registry URL if you use a public mirror.

Create-app `0.1.0-beta.36` and later separate commercial and third-party registry installation. The project `.npmrc` records the `@nocobase:registry` URL; credentials remain in user configuration. Continue development using the project's `AGENTS.md`, `.agents/rules/multi-portal.md` and synchronized Skills.

### Configure the database and access address

Initialize configuration from the app root:

```bash
pnpm nocobase config init
```

Choose a database and fill in its connection settings. In a non-interactive shell, pass `--dialect` explicitly. If the driver is missing, install the driver suggested by the command and initialize again. See [Create an app with a different database](../../reference/database-configuration.md) for complete configurations. Initialization writes `config.yml` and application secrets; do not replace that file with a documentation fragment.

When using a LAN address, domain or proxy, set `app.publicOrigin` to the protocol, host and port used in the browser, without a path such as `/main`. Replace these placeholders with the machine's actual LAN IP and app port:

```bash
pnpm nocobase config set 'app.publicOrigin=http://<LAN_IP>:<PORT>'
pnpm nocobase config check
```

Resolve configuration findings before starting. Successful application startup and initialization are still needed to verify database and native driver operation.

### Start the app

```bash
pnpm dev
```

Open the printed `Local:` address, including the app base path. For LAN access, use `APP_SERVER_HOST=0.0.0.0 APP_SERVER_PORT=<PORT> pnpm dev`, matching the configured access port. If an occupied port causes the app to choose another, update `app.publicOrigin` and restart.

Sign in with the administrator configured under `users.initialAdmin`. Unchanged defaults are username `nocobase` and password `admin123`; change the password after first login.

After login, the administrator workbench and **System settings → Portal management** are available. A new app has no generated business portals, so an empty list is expected.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Commercial package returns 401, 403 or no accessible version | Check login expiry, package access and the requested version |
| A third-party package returns 404 from the commercial registry | Correct the default registry; scope the commercial source to `@nocobase`, then run `pnpm install` in the existing app |
| LAN login fails | Match `app.publicOrigin` to the actual browser origin |

## Next step

Continue with [Develop a portal](develop.md#create-your-first-portal) to generate, install and extend your first portal.
