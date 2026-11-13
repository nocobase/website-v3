---
title: Quickstart
description: Create a main application and an independent child application, configure hosting, publish the first version, and open the deployed instance.
---

First create the main application that provides the workbench and management features. Then package an independently developed child application and deploy it as a hosted instance. You can use an Agent or follow the manual steps.

## Prepare your environment and commercial package access

Prepare Node.js 24 or later, pnpm 11.11.0, and an account with download access to the [commercial multi-app packages](overview.md#prerequisites). The commands below use a POSIX shell such as Bash; on Windows, use WSL.

Sign in to the commercial registry on the machine where installation will run. Use your account's read token as the password:

```bash
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
npm whoami --registry=https://pkg-v3.nocobase.com/
npm view @nocobase/app-template-multi-app@beta version \
  --@nocobase:registry=https://pkg-v3.nocobase.com/
```

Confirm that the template version query succeeds before creating a project. Keep the read token only in your user-level npm configuration, not in the project or a conversation. For authentication or download failures, see [Troubleshooting](#troubleshooting).

## Arrange your project directories

The examples place both projects in a `demo` directory:

| Project directory | Purpose |
| --- | --- |
| `demo/platform/` | Main application, providing the workbench and application management |
| `demo/customer-demo/` | Child application, providing customer management pages |

This layout is only an example. The main and child applications are independent projects and can live in different locations and separate Git repositories. Deployment needs only the child's build archive; its source does not need to be inside the main application.

## Create a multi-app environment with an Agent

Complete registry sign-in on the machine and under the user account where the Agent runs. A remote Agent does not automatically inherit your local credentials.

Install the application creation Skill, select your Agent when prompted, and reopen the Agent session:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

### Create and start the main application

Open an Agent session in the example `demo` directory and request the main application:

```prompt
Create a NocoBase 3 multi-app platform in the platform directory.
Before you start, confirm the database configuration, access URL, and deployment environment with me. Then configure an administrator account and the runtime needed to host child applications. Start the platform and give me the access URL and sign-in instructions.
```

Once complete, you should have a running multi-app platform, its access URL, and administrator sign-in instructions. After signing in, you can use the workbench and application management pages. The runtime for hosted child applications should also be configured, ready for you to create and deploy a child.

### Create a child application

Open an Agent session in the example `demo` directory and request the child application:

```prompt
Create an independent NocoBase 3 customer management application in the customer-demo directory. I will host it on the multi-app platform later.
It needs to support creating, editing, searching for, and deleting customers, with a customer name, contact person, phone number, and follow-up notes.
Before you start, confirm the database configuration and whether to use single sign-on through the main application.
```

The Agent creates the child's source in `customer-demo`; it is not yet deployed to the main application. Next, build a deployment archive, then upload it, publish a version, and create an instance through the main application.

### Build the child application and create the first instance

Continue in the child application's directory:

```prompt
Build this customer management application into a deployment archive I can upload to the multi-app platform. Confirm the target runtime environment first, then tell me the archive path and application version.
```

Once you have `storage/exports/dist.tar.gz`, [upload it, publish a version, and create an instance](#build-the-child-application-and-create-an-instance-in-the-management-interface) in the main application. Do not repeat creation, configuration, or build steps that the Agent has already completed.

After deployment succeeds and the current user has been granted access, the child appears on the main application's workbench. Click its card to open it.

![View and open child applications from the main application's workbench](/assets/core/multi-app/workbench.png)

## Create a multi-app environment manually

### Create the main application

Run the following in the example `demo` directory. `platform` must be a new or empty directory:

```bash
NOCOBASE_REGISTRY=https://pkg-v3.nocobase.com/ \
  pnpm create @nocobase/app@beta platform \
  --template multi-app --template-tag beta
cd platform
pnpm nocobase config init
```

`multi-app` generates the complete main application source, without creating any child applications. Follow the initialization prompts to select a database and enter its connection settings. Non-interactive execution requires an explicit `--dialect`. If a driver is missing, install it as directed and initialize again. See [Database configuration](../../reference/database-configuration.md).

### Configure and start the main application

Before the first start, check `users.initialAdmin` in `config.yml` and set an administrator username, email, and unique password. For example, enter the password securely in Bash and write it to the configuration:

```bash
read -r -s -p 'Initial administrator password: ' INITIAL_ADMIN_PASSWORD
printf '\n'
export INITIAL_ADMIN_PASSWORD
pnpm nocobase config set --from-env users.initialAdmin.password=INITIAL_ADMIN_PASSWORD
unset INITIAL_ADMIN_PASSWORD
```

Protect the generated configuration and keys, and do not commit them to Git. The initial administrator is created only when the user table is empty. Changing this configuration later does not reset an existing account's password.

The main application's Host, which runs child instances, is disabled by default. The following example runs everything locally on one machine, with the main application on port `13230` and the Host on `13231`. Check that both ports are available, then run this in the main application's root directory:

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

Open the `Local:` URL printed in the terminal: `http://127.0.0.1:13230/main/` with these settings. Sign in with the administrator you just configured. The main application keeps its `/main` path and forwards child application paths to the Host. The browser does not access the Host's internal port directly.

To connect from another machine, adjust the listening address and set `app.publicOrigin` and `releases.host.publicUrl` to the origin your browser uses: the scheme, host, and port, without a path. A local HTTP environment that uses SSO also needs a [callback exception](environments.md#add-a-deployment-environment).

### Create a deployment environment

Sign in to the main application, open **Deploy environments**, and select **Add environment**:

1. Enter a name and identifier, such as `Local Host` and `local`.
2. Select the managed Host and a runtime mode that supports deployment archives. For a local setup on one machine, use **In process**.
3. Set the public URL pattern to a browser-accessible address, such as `http://127.0.0.1:13230/{appId}/`, so each instance has its own path.
4. Check the connection and configuration as prompted, then save the environment.

You can reuse an existing available environment. Enabling the Host starts the runtime service; it does not create a deployment environment record automatically.

![Deployment environments show the runtime mode, public URL pattern, and Host status](/assets/core/multi-app/environments.png)

### Create and configure a child application

Keep the main application running. Open another terminal and run this in the example `demo` directory:

```bash
pnpm create @nocobase/app@beta customer-demo \
  --template default --template-tag beta
cd customer-demo
pnpm nocobase config init
pnpm nocobase config check
```

The main and child applications do not share business tables. Even when they use the same database server, allocate separate databases or isolated namespaces.

An ordinary Default application does not automatically integrate with the main application's SSO. If you keep local sign-in, you can build the default homepage to try the hosting workflow. If you need single sign-on and application switching, first complete the [child's SSO integration](templates.md#prepare-a-child-application-archive).

Develop business features in the child project. Create customer management or other pages as needed, then build and deploy the application.

### Build the child application and create an instance in the management interface

Run this in the child application's root directory:

```bash
pnpm build --tar
```

A successful build produces `storage/exports/dist.tar.gz`. The target operating system, CPU architecture, libc, and Node.js version must be compatible with the Host. When building for another machine, specify the target as described in [Build the deployment archive](../../tutorials/deploy-with-app-installer.md#build-the-deployment-archive). Keep local databases, uploaded files, keys, and instance-specific configuration out of the archive.

Keep the main application running and complete these steps in its management interface:

1. Open **Templates**, create a template such as `Customer management`, and select the deployment environment you prepared.
2. Upload `dist.tar.gz` from the template's action menu, check the application package name and version, and publish the version.
3. In the template's **Published versions** tab, select **Create with this version** for the target version.
4. Enter an instance name and unique identifier, such as `Customer demo` and `customer-demo`. Confirm the version and environment, then submit.
5. If approval is required, obtain it and wait for deployment to finish. Check the actual version, runtime state, and access URL in the instance details.

Do not use `main` as the instance identifier: the main application already uses that path. Uploading saves the archive, publishing makes a version available for instance creation, and creating an instance deploys and runs it. These are three separate operations.

![Choose a published template version to create an instance](/assets/core/multi-app/template-versions.png)

## Check the instance runtime

Confirm that the instance is running in its details page, then open its access URL.

- **Local sign-in:** an administrator with instance configuration permission can view the initial administrator credentials, sign in to the child, and change the initial password.
- **Platform SSO:** first grant the user membership in the instance's **Access** tab. Then open it from the workbench and verify sign-in, business permissions, and [application switching](management.md#open-and-switch-applications-from-the-workbench). Main application administrators do not automatically receive child application membership either.

Check that the homepage loads and the expected features work. Either the Default homepage or a custom customer management page can verify the hosting workflow. You do not need to run a development server in the child's source directory at the same time.

![The customer instance details show the deployed version, runtime state, and application entry](/assets/core/multi-app/instance-details.png)

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Commercial packages return 401, 403, or no version | For `401`, check sign-in status first. For `403` or a missing package, check download permissions, the package name, and the version. `NOCOBASE_REGISTRY` only selects the registry the creator uses to download the template; it does not authenticate you |
| Third-party dependencies or the creator fail to download | Configure the commercial registry only for the `@nocobase` scope. Other dependencies use public npm or your mirror. `NOCOBASE_REGISTRY` does not control the registry the outer pnpm command uses to download the creator |
| pnpm refuses to install a recently published package | After confirming that you trust the version, set `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` for this creation command |
| The main application is accessible, but no deployment environment is available | Check the Host configuration and startup logs, then create and check a deployment environment in the interface |
| Upload or deployment fails | Check the archive's target platform and the operation records; do not repeatedly create instances with the same name |
| The child application is missing from the workbench | Check that the instance is running, its entry is enabled, and the current user has membership |
| SSO works, but the child has no application switcher | Check that the layout renders `AppSwitcher` and that the instance has been upgraded to a version containing it |

## Next steps

Continue with [Manage hosted applications](management.md) for version updates, start and stop operations, configuration, and failure handling.
