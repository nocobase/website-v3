---
title: Create a plugin
description: Use @nocobase/create-plugin in an existing App to create a local plugin, generating the scaffold, choosing capabilities and connecting the workspace with an Agent or by hand.
---

First prepare an App with [Create an app](../getting-started/create-app.md) and install its dependencies. The plugin is generated under this App's `packages/` directory and is developed and built together with the application.

You can have an Agent create the plugin for you, or run `pnpm create @nocobase/plugin@beta` yourself. Both use `@nocobase/create-plugin`.

## With an Agent

Plugin development guidance is provided by the App's `@nocobase/app-skills` dependency and synchronized to `.agents/skills/nocobase-app-plugin-development/SKILL.md`; no global installation is needed. If the file is missing, first check whether the installed packages include the Skill: if they do, run `pnpm nocobase skills sync`; if not, update to a compatible version following [Upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md), rather than updating one framework package on its own.

Open the Agent in the application directory and just tell it the plugin's name and purpose, for example:

```text
Create a plugin called demo-tools to extend this application's command-line tools.
Start with the basic structure and check that it builds successfully.
```

The Agent generates the plugin with `@nocobase/create-plugin`, choosing capabilities for its purpose, handling dependencies and checking the result. Replace the name and purpose in the example with your own needs; there is no need to describe each command option and file change.

## Without an Agent

Run all the commands below in the App root, with the Node.js and pnpm versions the application requires. Both the generator and the App CLI must support App workspaces; `@beta` selects the generator's beta release channel. This guide uses `demo-tools` with only the `cli` capability as the example, so no database or web server needs to be running.

### What the generator does

Based on the chosen capabilities, `@nocobase/create-plugin` generates a plugin package you can keep developing and connects it to the current App's workspace.

| Work | What is done automatically |
| --- | --- |
| Plugin scaffold | Generates the package declaration, development guidance, TypeScript, lint and build configuration |
| Capability code | Generates the directories, declarations, examples or drafts chosen with `--with`, plus related tests |
| Public entries | Generates Client, Server, CLI or component exports for the capabilities, and configures export mappings for source and build output |
| Dependencies | Decides dependency categories for the chosen capabilities and resolves versions from the packages already installed in the App |
| Workspace connection | Puts the plugin under the App's `packages/`, and adds the necessary workspace configuration and the App's local dependency on it |
| Installation | Installs dependencies and updates the lockfile by default; `--no-install` defers this step |

After creation, you still implement the business logic, complete the tests, and register the plugin with the App according to the runtime entries it provides. The generator does not create business pages, APIs or permission rules automatically, nor does it publish the plugin or run database migrations.

### Choose plugin capabilities

Basic usage:

```bash
pnpm create @nocobase/plugin@beta <name> --with <capability>
```

`--with` chooses **which code capabilities to generate**; it neither installs an existing plugin nor enables a business feature. Choose at least one capability, or use `--empty` to generate only the package's basic structure. Combine several capabilities by repeating `--with`; do not join them with commas.

#### Client capabilities

| `--with` value | What is generated | What you still implement |
| --- | --- | --- |
| `client.routes` | A route declaration scaffold in `client/routes.ts`, with tests | Page components, route paths, navigation and access conditions; business pages are not generated |
| `client.components` | An example component `client/components/plugin-component.tsx`, its public export and tests | The reusable component's actual interface, props and interactions |
| `client.service-providers` | A ServiceProvider scaffold in `client/providers/`, with tests | Browser-side service registration and lifecycle handling |
| `client.react-providers` | `client/contexts.ts`, a Provider component, declarations in `client/react-providers/`, and tests | The data and state in the React context, and how the component tree is composed |
| `client.locales` | Language files and an aggregating entry in `client/locales/` | The actual translations and their use in components |

A ServiceProvider is for application services and lifecycle, while a React Provider is for context in the component tree; choose each as needed. With client code, the generator also creates `components.json` and `client/styles.css` to prepare the shadcn configuration and style entry; the UI components you need must still be installed or written for your business.

#### Server capabilities

| `--with` value | What is generated | What you still implement |
| --- | --- | --- |
| `server.service-providers` | `server/services/`, `server/providers/`, `server/tokens.ts` and tests | Service interfaces, business logic and service registration |
| `server.routes` | A route declaration scaffold in `server/routes/index.ts`, with tests | Methods, paths, input validation, authentication and authorization, and responses of API or Root Routes |
| `server.jobs` | An example Job in `server/jobs/`, a Provider that manages the executor, and tests | Job logic, where jobs are submitted, and retry and idempotency requirements |
| `server.locales` | Language files and an aggregating entry in `server/locales/` | The actual translations used on the server |

`server.routes` does not generate CRUD APIs automatically, and does not require choosing `server.service-providers` at the same time; combine them when you need a separate business service. `server.jobs` already includes the Provider that manages the job executor; the job backend is configured by the App, and when to submit jobs is up to you.

#### Database, CLI and Skills

| `--with` value | What is generated | What you still implement |
| --- | --- | --- |
| `database` | `.ts.example` drafts in `database/migrations/` and `database/seeds/`, server resource declarations and tests; a database task manifest is generated at build time | The actual table structures and migration and seed logic; drafts become database tasks only after you complete them and rename them to `.ts` |
| `cli` | `cli/index.ts`, an example `info` command, the `./cli` export and tests | The actual commands, arguments, results and error handling |
| `skills` | A draft `skills/<plugin-skill-name>/SKILL.md`, included in the package's distributed files | Explaining to Agents that use the plugin when to trigger it, its public capabilities, prerequisites and how to verify |

`skills` is for application Agents that use the plugin. The `AGENTS.md` at the plugin root is for developers and Agents maintaining the plugin's source; it is a basic file and needs no extra `skills` choice. Complete the Skill draft from the real implementation before synchronizing it to applications.

#### How runtime entries are generated

The generator derives the entries from the capabilities, so there is no need to specify `--with client` or `--with server`:

| Chosen capabilities | Runtime entries generated automatically |
| --- | --- |
| Any of `client.routes`, `client.service-providers`, `client.react-providers`, `client.locales` | `client/index.ts`, `client/plugin.ts` and the `./client` export |
| Any `server.*` capability, or `database` | `server/index.ts`, `server/plugin.ts` and the `./server` export |
| `cli` | `cli/index.ts` and the `./cli` export |
| Only `client.components` | The components' public exports, without a client plugin registration entry |
| Only `skills`, or `--empty` | No runtime entries |

**Generating** these entries and **registering** them in the App are two separate steps. When you only reference public components, importing from the package is enough; when the plugin provides Client, Server or CLI contributions, register the corresponding entries.

#### Common combinations

The examples below are independent of each other; pick by feature.

Only reusable components:

```bash
pnpm create @nocobase/plugin@beta feature-card --with client.components
```

A business module that needs pages, services, APIs and data of its own:

```bash
pnpm create @nocobase/plugin@beta orders \
  --with client.routes \
  --with server.service-providers \
  --with server.routes \
  --with database
```

Utility commands with usage guidance for Agents:

```bash
pnpm create @nocobase/plugin@beta audit-tools --with cli --with skills
```

Only the package's basic structure:

```bash
pnpm create @nocobase/plugin@beta shared-tools --empty
```

`--empty` generates no business capability directories and cannot be combined with `--with`. `--with all` chooses every capability the current generator version supports, which is useful for viewing the full scaffold; for real development, you usually choose the capabilities you need explicitly.

### 1. Preview the generation plan

```bash
pnpm create @nocobase/plugin@beta demo-tools --with cli --dry-run --json
```

A dry run generates no plugin files, does not change the App and does not install the App's dependencies, although `pnpm create` itself may still download and cache the generator. In the returned JSON, `ok` should be `true` and `status` should be `success-noop`. Check these fields in particular:

| Field | What you should see |
| --- | --- |
| `result.project` | `kind` is `application`, and `root` is the current App root |
| `result.plugin` | The package name `@nocobase/app-plugin-demo-tools`, with the target directory `packages/app-plugin-demo-tools/` under the App |
| `result.requestedCapabilities`, `result.capabilities` | The requested capabilities and the normalized selection |
| `result.derivedStructure` | Whether client or server plugin entries are generated; both are `false` in this example |
| `result.files` | File paths and why each is generated, including `cli/index.ts`, `cli/info.ts` and their tests |
| `result.projectEdits` | The application files to be changed, such as `package.json`, and `pnpm-workspace.yaml` when needed |
| `result.dependencies` | The plugin dependencies resolved from the packages installed in the current application |
| `result.nextSteps` | Suggestions for installing, checking and registering next; follow them according to the capabilities you actually chose |

The generator recognizes the App by `nocobase.templateKind: "app"` in the application's `package.json`. It reads the existing workspace and installed dependencies, and checks paths, names and versions before generating files, which is why the application's dependencies must be installed first.

### 2. Create the plugin and connect the workspace

Run the creation for real with the same name and capabilities:

```bash
pnpm create @nocobase/plugin@beta demo-tools --with cli
```

The generator does the following:

- Generates `packages/app-plugin-demo-tools/`, including the package declaration, CLI implementation, tests and development configuration; local plugins default to `private: true`.
- Makes sure the application's pnpm workspace includes the plugin directory, keeping existing settings and adding `packages/*` only when needed.
- Adds `"@nocobase/app-plugin-demo-tools": "workspace:*"` to `dependencies` in the application's `package.json`.
- Decides external dependency versions from the packages installed in the application, keeps workspace references for local workspace packages that actually exist, then installs dependencies and updates the lockfile.

`workspace:*` makes the application use the local plugin package. The generator does not write all of the plugin's external dependencies as `workspace:*`, nor does it pick the latest versions at random; it bases them on the versions the application actually installs, so the generated plugin does not end up with missing packages or incompatible versions.

### 3. Check the result

```bash
pnpm --filter @nocobase/app-plugin-demo-tools check
```

Once the check passes, the plugin scaffold has been generated and is a local dependency of the App. For what each file does, see [Plugin structure](plugin-structure.md).

Installing dependencies lets the application resolve the package, while runtime registration decides which capabilities the application loads. The generator does not register runtime entries automatically; later, register the Client, Server or CLI entries the plugin actually provides with `pnpm nocobase plugin register <full package name> --no-install`. For the full implementation, registration and acceptance process, see [Write your first plugin](write-your-first-plugin.md).

### Names and common options

The short name `demo-tools` generates the package name `@nocobase/app-plugin-demo-tools` by default. Your own plugin can use a full package name to keep your organization's scope, for example:

```bash
pnpm create @nocobase/plugin@beta @my-company/app-plugin-audit-tools --with cli
```

The directory is still `packages/app-plugin-audit-tools/`, and registration uses the full package name. The feature part of the name starts with a lowercase letter and uses only lowercase letters, digits and single hyphens. The generator refuses existing directories and conflicting package names. Local plugins need not be published; when publishing, check `private`, the package name, exports, compatibility and the published contents.

| Option | Purpose |
| --- | --- |
| `--dir <directory>` | Explicitly chooses an existing App, for example passing `--dir ./my-app` from the parent directory |
| `--dry-run --json` | Previews generated files, application changes and dependency versions read-only, for people or Agents to check |
| `--json` | Outputs structured results; installation logs go to stderr |
| `--no-install` | Generates files without installing; run `pnpm install` in the App root before registering |
| `--display-name <name>`, `--description <text>` | Sets the plugin's display name and description; quote values that contain spaces |
| `--help`, `-h` | Shows the capabilities and options the current version supports |
| `--version` | Shows the generator's version |

#### JSON output

`--json` can be combined with a real creation or with `--dry-run`, so Agents and scripts can read it. On success, check `ok: true` and `result`; on failure, the command exits with a nonzero code and explains the cause and suggestions in `error.code`, `error.message` and `error.suggestions`. Installation logs go to stderr, and the generator's stdout always contains a single JSON result document.

`--dry-run` is only a preview, while `--no-install` really writes the plugin and App files and only defers dependency installation; the two do different things.

### Common issues

| Symptom | What to do |
| --- | --- |
| The App cannot be found | Run in the application root generated by create-app, or point to it with `--dir`; confirm dependencies are installed and the generator version supports App workspaces |
| The error says it is looking for `packages/plugins` | An old generator that only supports the source repository may have been resolved. Check the actual version with `pnpm create @nocobase/plugin@beta --version`, check the package manager's cache and release-age limits, pick a version that supports App workspaces and dry-run again; do not create `packages/plugins` in the App to get around the error. This tutorial was verified with `@nocobase/create-plugin@0.1.0-beta.26` |
| Missing dependencies, or incompatible dependency versions | Install the App's dependencies first, fix the required versions as the error says, then preview again |
| The target directory, package name or application dependency already exists | Check the existing implementation or use a non-conflicting name; do not overwrite an existing plugin |
| Workspace rules exclude the plugin directory | Check the exclusion rules in `pnpm-workspace.yaml`, adjust them as the project needs, then preview again |
| Files were generated but installation failed | Keep the generated result, fix the installation error, then rerun `pnpm install` in the App root; there is no need to create again |
| You want to add a capability to an existing plugin | The generator only creates new packages and does not modify existing plugins incrementally; add the implementation, declarations, exports, dependencies and tests as described in [Plugin structure](plugin-structure.md), then check the App's registration |
| Route or database capabilities were chosen, but there is no business feature | What is generated is only a declaration scaffold or draft; you still implement pages, APIs or migrations, then connect and verify them |
| The package is installed but the command does not exist | Check the `./cli` export and the registration in the application's `cli/plugins.ts`, and call it from the App root |

The next guide, [Plugin structure](plugin-structure.md), explains what the generated files do; then follow [Write your first plugin](write-your-first-plugin.md) to implement and connect it. For everyday installation, updates and removal, see [Manage plugins](../developing-apps/manage-plugins.md).
