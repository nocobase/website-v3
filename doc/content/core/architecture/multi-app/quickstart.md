---
title: Quickstart
description: Create Main and an independent child application with an Agent or manually, publish the child, and create your first hosted instance.
---

Create a multi-app Main application, then build an independent child application and upload it for deployment as a hosted instance. The commands below use local accounts; if you need single sign-on through Main, integrate SSO when configuring the child.

## Prepare your environment and commercial package access

Prepare Node.js 24 or later, pnpm 11.11.0, and an account with download access to the [commercial multi-app packages](overview.md). The commands below require a POSIX shell such as Bash; on Windows, use WSL.

Sign in to the private npm registry in your terminal. Skip this if your existing login is still valid:

```bash
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
npm whoami --registry=https://pkg-v3.nocobase.com/
npm view @nocobase/app-template-multi-app@beta version --registry=https://pkg-v3.nocobase.com/
```

Follow the login prompts, using your commercial registry read token as the password. npm stores credentials in your user configuration; do not put them in project files or commit them to Git. Confirm that the package version query succeeds too: signing in does not establish permission to download this package.

Use creator and template versions that support `multi-app`. Commercial packages come from the registry configured for the `@nocobase` scope. Third-party dependencies still come from public npm or your configured mirror; do not change the default registry to the commercial registry.

## Create the multi-app environment with an Agent

Complete registry login on the machine and under the user account where the Agent actually runs commands. A remote Agent does not inherit your local login. Do not paste read tokens into the conversation.

Install the global `nocobase-create-app` Skill and select your Agent when prompted:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

Reopen the Agent session to load the Skill. The manual steps below show the creation commands and template selection. Once an application exists, follow its own `AGENTS.md` and Skills.

### Create and start Main

Open the Agent in the parent directory where you want Main, for example:

```prompt
Create a NocoBase 3 multi-app Main application for local development in the platform directory, using the multi-app template.
Confirm the database and access address with me first, enable the runtime for hosted children, and tell me the URL and initial sign-in account once it starts.
Use local accounts for now, without single sign-on.
```

Continue in Main's directory after creation and have the Agent read `.agents/rules/multi-app.md`. If the session has not loaded the new project guidance, reopen it there. After signing in, you should see multi-app management.

### Create a child in an independent directory

Open another Agent session in your chosen parent directory for the child. You can choose any location outside Main's project. For example:

```prompt
Create a NocoBase 3 application in the inventory-app directory that I can later deploy as a child on the multi-app platform.
Keep it as an independent project outside Main's directory. Confirm the database configuration and whether I need single sign-on through Main, then configure the chosen sign-in method.
```

Continue developing and managing configuration independently in the child's directory.

SSO through Main requires `@nocobase/app-plugin-platform-sso`. Based on your choice, the Agent handles installation, registration, and configuration, along with Main's identity integration. Without SSO, the plugin is unnecessary and the child keeps its own sign-in method. See [Application template preparation](templates.md) for configuration requirements.

### Build the child and create the first instance

Ask the Agent to build the deployment archive from the child's directory:

```prompt
Build this child application into a deployment archive for upload to the multi-app platform. Confirm the target runtime environment first, then tell me the archive path and application version.
```

The build uses `pnpm build --tar` and produces `storage/exports/dist.tar.gz` inside the child project. Sign in to Main and follow the interface steps under [Build the child and create an instance in the management interface](#build-the-child-and-create-an-instance-in-the-management-interface) to upload, publish, and create the instance.

The manual steps below are an alternative. Do not repeat creation, configuration, or builds that the Agent has already completed.

## Create the multi-app environment manually

### Create Main

Run this from Main's parent directory. `platform` must be a new or empty directory:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 \
NOCOBASE_REGISTRY=https://pkg-v3.nocobase.com/ \
npm_config_registry=https://registry.npmjs.org \
pnpm create @nocobase/app@beta platform \
  --template=multi-app --template-tag=beta
cd platform
```

`multi-app` selects `@nocobase/app-template-multi-app`. The creator generates Main's source, installs dependencies, and synchronizes development Skills. `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` allows this command to install recently published beta packages. You can replace the public registry URL with your public npm mirror.

Creator version `0.1.0-beta.36` and later support separate registries for commercial packages and third-party dependencies. The project's `.npmrc` records the `@nocobase:registry` address; credentials remain in your user configuration.

### Configure and start Main

Initialize configuration in Main's root directory:

```bash
pnpm nocobase config init
```

Choose a database and enter its connection settings. Non-interactive execution requires an explicit `--dialect`. If a driver is missing, install it as directed and rerun initialization. See [Create applications with different databases](../../reference/database-configuration.md) for database-specific settings. Initialization generates `config.yml` and application keys.

The managed Host runs child instances and is disabled by default. The following settings are for a local walkthrough on one machine: Main uses port `13230`, and the Host uses `13231`.

```bash
pnpm nocobase config set \
  server.host=127.0.0.1 \
  server.port=13230 \
  app.publicOrigin=http://127.0.0.1:13230 \
  releases.host.enabled=true \
  releases.host.host=127.0.0.1 \
  releases.host.port=13231 \
  releases.host.publicUrl=http://127.0.0.1:13230
pnpm nocobase config check
pnpm dev
```

Make sure both ports are available. Keep Main's default `/main` base path; its listener forwards child requests to the Host. Access Main's port in your browser, not the Host port directly.

Open the `Local:` URL printed by the terminal, normally `http://127.0.0.1:13230/main/` with these settings. Sign in using the administrator configured under `users.initialAdmin`. The unchanged defaults are username `nocobase` and password `admin123`; change the password after your first sign-in.

To access the application from another machine, set `server.host` to an appropriate listening address and set both `app.publicOrigin` and `releases.host.publicUrl` to the origin your browser uses, without `/main` or another path. If startup uses a different port, update both URLs and restart.

### Create and configure a child in an independent directory

Open another terminal and switch to your chosen parent directory for the child. It must be outside `platform`, either alongside it or elsewhere. `inventory-app` must be a new or empty directory:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 \
npm_config_registry=https://registry.npmjs.org \
pnpm create @nocobase/app@beta inventory-app --template-tag=beta
cd inventory-app
pnpm nocobase config init
pnpm nocobase config check
```

This uses the standard application template. Each application installs its own dependencies, keeps its own configuration and keys, and uses an independent database. If they use the same database server, allocate separate databases or isolated schemas rather than reusing Main's tables.

If the child needs SSO through Main, also install, register, and configure `@nocobase/app-plugin-platform-sso` in the child and complete Main's identity integration as described in [Application template preparation](templates.md). If you do not need SSO, the plugin is unnecessary; keep the child's own sign-in method.


### Build the child and create an instance in the management interface

Run this in the child application's root directory:

```bash
pnpm build --tar
```

Wait for the full build to succeed, then locate `storage/exports/dist.tar.gz` in that project. The build environment must be compatible with the Host's operating system, CPU architecture, libc, and Node.js version. Keep local databases, uploads, secrets, and instance-specific configuration out of the archive.

Keep Main running, sign in, and complete these steps:

1. Open environment management under **Multi-app** and prepare a deployment environment using the managed Host. Select the in-process mode that supports archives, check the connection, and save.
2. Open **Templates** and create a template, such as `Inventory`.
3. Upload the child's `dist.tar.gz`, check the detected package name and version, and publish that version.
4. Open **Instances**, enter a name and unique identifier, such as `Inventory demo` and `inventory-demo`, and select the published version and deployment environment.
5. Submit creation. If the environment requires approval, complete it, then wait for deployment to finish.

Do not use Main's `main` identifier for an instance. Check the actual version, runtime state, and access URL after creation. See [Template and instance management](management.md) for subsequent operations.

## Check the instance runtime

Confirm successful deployment in Main's instance details, then open the instance URL and sign in using the configured method.

For local accounts, an administrator with instance configuration permission can reveal the initial administrator credentials in the instance details. Use those credentials to sign in to the child and change the initial password. For SSO through Main, grant the user access to the instance before checking single sign-on. See [Application access](management.md).

Check that the child page loads and its expected features work. With the standard application template, you should see the default homepage. Access to business features is governed by the child's business permissions.

## Start again

Keep Main's configuration, database, and `storage/` after stopping. Next time, run this in Main's root directory:

```bash
pnpm dev
```

Start explicitly stopped instances from the management interface. The Host runs hosted instances, so the child's source project does not need a development server running alongside Main.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Commercial packages return 401, 403, or no version | Check login expiry, package permissions, and version availability |
| Third-party packages return 404 from the commercial registry | Check the default registry; scope the commercial registry to `@nocobase`, then run `pnpm install` in the existing application |
| No deployment environment is available or the Host is not running | Check `releases.host.enabled`, ports, and startup logs; run the connection check in environment management |
| Upload or deployment fails | Check the archive version and target environment compatibility, then inspect instance operations; do not repeatedly create the same instance |
| Child source changes do not appear in the instance | Build and publish a new version, then upgrade the selected instance; hosted instances do not hot-reload local source |

## Next steps

Continue with [Application development](../../developing-apps/overview.md), or see [Deployment environments](environments.md) to prepare for a server deployment.
