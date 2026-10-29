---
title: Create a plugin
description: Use @nocobase/create-plugin inside an existing App to generate a local plugin scaffold, select capabilities and connect the workspace, with or without an agent.
---

First [create an application](../getting-started/create-app.md) and install its dependencies. Plugins are generated under this App's `packages/` directory and developed and built with the application.

Ask an agent to create the plugin, or run `pnpm create @nocobase/plugin@beta` yourself. Both approaches use `@nocobase/create-plugin`.

## With Agent

Plugin development guidance ships with the App’s `@nocobase/app-skills` and synchronizes to `.agents/skills/nocobase-app-plugin-development/SKILL.md`; no global installation is needed. If missing, check whether the installed package contains the Skill. If it does, run `pnpm nocobase skills sync`; otherwise follow [Upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md) to a compatible release instead of updating one framework package in isolation.

Open your agent in the application directory and describe the plugin's name and purpose. For example:

```prompt
Create a plugin called demo-tools to extend this application's command-line tools.
Start with the basic structure and check that it builds successfully.
```

The agent uses `@nocobase/create-plugin` to generate the plugin, select capabilities for its purpose, handle dependencies and check the result. Replace the example name and purpose with your own requirements; you do not need to specify every command option or file change.

## Without Agent

Run the following commands from the App root, using the Node.js and pnpm versions required by the application. The generator and App CLI must support application workspaces; `@beta` selects the generator's beta release channel. This guide uses `demo-tools` with only the `cli` capability and needs no running database or Web server.

### What the generator does

`@nocobase/create-plugin` generates a plugin package for further development from the selected capabilities and connects it to the current App's workspace.

| Task | Generated or updated content |
| --- | --- |
| Package foundation | Manifest, development guidance, TypeScript, lint and build configuration |
| Capability code | Directories, declarations, examples or drafts, and relevant tests selected by `--with` |
| Public entries | Client, Server, CLI or component exports as needed, with mappings for source and compiled artifacts |
| Dependencies | Dependency categories for the selected capabilities and versions resolved from packages installed in this App |
| Workspace integration | A package under the App's `packages/`, necessary workspace settings and the App's local dependency |
| Installation | Dependency installation and lockfile updates by default; defer with `--no-install` |

After generation, implement the feature, complete its tests and register any runtime entries in the App. The tool does not implement business pages, endpoints or permission rules, publish the plugin, or run database migrations.

### Select plugin capabilities

Basic usage:

```bash
pnpm create @nocobase/plugin@beta <name> --with <capability>
```

`--with` selects **code capabilities to generate**. It does not install an existing plugin or enable a finished feature. Select at least one capability, or use `--empty` for the package foundation alone. Repeat `--with` to combine capabilities; do not join their names with commas.

#### Client capabilities

| `--with` value | Generated content | What you still implement |
| --- | --- | --- |
| `client.routes` | Route declaration scaffold in `client/routes.ts` and tests | Page components, paths, navigation and access conditions; business pages are not generated |
| `client.components` | Example `client/components/plugin-component.tsx`, public export and tests | The reusable component's UI, props and interactions |
| `client.service-providers` | ServiceProvider scaffold under `client/providers/` and tests | Browser-side service registration and lifecycle handling |
| `client.react-providers` | `client/contexts.ts`, a Provider component, `client/react-providers/` declarations and tests | React context data, state and component-tree composition |
| `client.locales` | Language files and an aggregation entry under `client/locales/` | Actual translations and their use in components |

A ServiceProvider handles application services and lifecycle; a React Provider supplies context to the component tree. Select each as needed. Client code also brings `components.json` and `client/styles.css` for shadcn configuration and styles. Install or implement the UI components your feature needs.

#### Server capabilities

| `--with` value | Generated content | What you still implement |
| --- | --- | --- |
| `server.service-providers` | `server/services/`, `server/providers/`, `server/tokens.ts` and tests | Service contracts, business logic and service registration |
| `server.routes` | Route declaration scaffold in `server/routes/index.ts` and tests | API or Root Route methods, paths, validation, authentication, authorization and responses |
| `server.jobs` | An example Job, an executor-owning Provider under `server/jobs/` and tests | Job logic, submission points, retry and idempotency requirements |
| `server.locales` | Language files and an aggregation entry under `server/locales/` | Actual translations used on the server |

`server.routes` does not generate CRUD endpoints or require `server.service-providers`; combine them when the feature needs a separate business service. `server.jobs` already includes the Provider managing its executor. The App configures the job backend; you implement when jobs are submitted.

#### Database, CLI and Skills

| `--with` value | Generated content | What you still implement |
| --- | --- | --- |
| `database` | `.ts.example` drafts under `database/migrations/` and `database/seeds/`, Server resource declarations and tests; database task manifests produced during build | Schema, migrations and seeds; complete the drafts and rename them to `.ts` before they become database tasks |
| `cli` | `cli/index.ts`, an example `info` command, the `./cli` export and tests | Actual commands, options, results and error handling |
| `skills` | A draft `skills/<plugin-skill-name>/SKILL.md`, included in package distribution | Guidance for agents consuming the plugin: triggers, public capabilities, prerequisites and verification |

`skills` targets the application agent consuming the plugin. The plugin root's `AGENTS.md` targets developers and agents maintaining its source; it is a foundation file and does not require selecting `skills`. Complete Skill drafts against the actual implementation before synchronizing them into the application.

#### How runtime entries are derived

The tool derives entries from capabilities. There is no additional `--with client` or `--with server` selection:

| Selected capabilities | Generated runtime entry |
| --- | --- |
| Any of `client.routes`, `client.service-providers`, `client.react-providers`, `client.locales` | `client/index.ts`, `client/plugin.ts` and the `./client` export |
| Any `server.*` capability, or `database` | `server/index.ts`, `server/plugin.ts` and the `./server` export |
| `cli` | `cli/index.ts` and the `./cli` export |
| Only `client.components` | Public component exports, without a Client plugin registration entry |
| Only `skills`, or `--empty` | No runtime entry |

**Generating** these entries and **registering** them in the App are separate steps. Consume public components through package imports. Register the corresponding entries when the plugin provides Client, Server or CLI contributions.

#### Common combinations

These are independent examples. Select the capabilities your feature needs.

Reusable components only:

```bash
pnpm create @nocobase/plugin@beta feature-card --with client.components
```

A business module with pages, services, endpoints and plugin-owned data:

```bash
pnpm create @nocobase/plugin@beta orders \
  --with client.routes \
  --with server.service-providers \
  --with server.routes \
  --with database
```

Tool commands with agent integration guidance:

```bash
pnpm create @nocobase/plugin@beta audit-tools --with cli --with skills
```

Package foundation only:

```bash
pnpm create @nocobase/plugin@beta shared-tools --empty
```

`--empty` generates no feature directories and cannot be combined with `--with`. `--with all` selects every capability supported by that tool version and is useful for exploring the complete scaffold. For development, explicitly select the capabilities you need.

### 1. Preview the generation plan

```bash
pnpm create @nocobase/plugin@beta demo-tools --with cli --dry-run --json
```

A dry run generates no plugin files, changes no App files and installs no App dependencies. `pnpm create` itself may still download and cache the generator. The JSON response should have `ok: true` and `status: "success-noop"`. Check these fields:

| Field | Expected result |
| --- | --- |
| `result.project` | `kind` is `application` and `root` is this App's root directory |
| `result.plugin` | Package name is `@nocobase/app-plugin-demo-tools`; destination is `packages/app-plugin-demo-tools/` inside the App |
| `result.requestedCapabilities`, `result.capabilities` | Requested capabilities and normalized selections |
| `result.derivedStructure` | Whether Client or Server plugin entries are generated; both are `false` for this example |
| `result.files` | Paths and generation reasons, including `cli/index.ts`, `cli/info.ts` and corresponding tests |
| `result.projectEdits` | Planned application edits, such as `package.json` and, when needed, `pnpm-workspace.yaml` |
| `result.dependencies` | Plugin dependencies resolved from packages installed in this application |
| `result.nextSteps` | Suggested installation, checks and registration; apply as appropriate for the actual capabilities |

The generator identifies an App through `nocobase.templateKind: "app"` in its `package.json`. It reads workspace settings and installed dependencies, checking paths, names and versions before writing files. Complete the application's dependency installation first.

### 2. Generate the plugin and connect the workspace

Create the plugin with the same name and capability:

```bash
pnpm create @nocobase/plugin@beta demo-tools --with cli
```

The generator:

- Creates `packages/app-plugin-demo-tools/` with a package manifest, CLI implementation, tests and development configuration. Local plugins default to `private: true`.
- Ensures the pnpm workspace includes the plugin directory while preserving existing settings, adding `packages/*` only when necessary.
- Adds `"@nocobase/app-plugin-demo-tools": "workspace:*"` to the application's `dependencies`.
- Resolves external dependency versions from the installed application, keeps workspace references for actual local packages, installs dependencies and updates the lockfile.

`workspace:*` makes the application use the local plugin package. The generator does not assign that protocol to every external dependency or arbitrarily pick the latest versions. It uses versions installed in the application to avoid unresolved packages and incompatible dependencies.

### 3. Check the generated scaffold

```bash
pnpm --filter @nocobase/app-plugin-demo-tools check
```

After checks pass, the scaffold exists and is a local App dependency. See [Plugin structure](plugin-structure.md) for each file's role.

Dependency installation makes the package resolvable; runtime registration determines which capabilities the application loads. The generator does not register runtime entries automatically. Later, use `pnpm nocobase plugin register <full-package-name> --no-install` to register the Client, Server or CLI entries the package actually provides. Follow [Write your first plugin](write-your-first-plugin.md) for implementation, registration and verification.

### Names and common options

The short name `demo-tools` generates `@nocobase/app-plugin-demo-tools` by default. Use a full package name to preserve your organization's scope:

```bash
pnpm create @nocobase/plugin@beta @my-company/app-plugin-audit-tools --with cli
```

The directory remains `packages/app-plugin-audit-tools/`; register using the full package name. The capability portion of the name starts with a lowercase letter and uses lowercase letters, digits and single hyphens. Existing directories and conflicting package names are rejected. Local plugins do not need publication. Before publishing later, review `private`, the package name, exports, compatibility and package contents.

| Option | Purpose |
| --- | --- |
| `--dir <directory>` | Select an existing App explicitly, such as `--dir ./my-app` from its parent directory |
| `--dry-run --json` | Preview generated files, application edits and dependency versions without writing, for human or agent review |
| `--json` | Return structured output; installation logs go to stderr |
| `--no-install` | Generate files without installing; run `pnpm install` from the App root before registration |
| `--display-name <name>`, `--description <text>` | Set the display name and description; quote values containing spaces |
| `--help`, `-h` | List capabilities and options supported by this version |
| `--version` | Show the generator version |

#### JSON output

Combine `--json` with generation or `--dry-run` for agents and scripts. Success returns `ok: true` and `result`. Failure returns a non-zero exit code with `error.code`, `error.message` and `error.suggestions`. Installation logs go to stderr so the generator’s stdout remains a single JSON result document.

`--dry-run` previews changes. `--no-install` writes plugin and App files but defers dependency installation; these options serve different purposes.

### Common problems

| Symptom | What to do |
| --- | --- |
| The App cannot be found | Run from an application generated by create-app, or select it with `--dir`; confirm installed dependencies and a generator version supporting App workspaces |
| An error looks for `packages/plugins` | An older generator supporting only the source repository may have been resolved. Check the actual version with `pnpm create @nocobase/plugin@beta --version`, review package-manager caching and release-age settings, select a version supporting App workspaces and repeat the dry run. Do not create `packages/plugins` in the App to bypass the error. This tutorial was verified with `@nocobase/create-plugin@0.1.0-beta.26` |
| Dependencies are missing or incompatible | Finish installing App dependencies, resolve the reported versions and preview again |
| The directory, package name or application dependency already exists | Inspect the existing implementation or choose a non-conflicting name; preserve existing plugins |
| Workspace rules exclude the destination | Review exclusions in `pnpm-workspace.yaml`, adjust them for your project and preview again |
| Files were generated but installation failed | Keep the generated result, resolve the installation error and rerun `pnpm install` from the App root; do not generate the plugin again |
| You want to add a capability to an existing plugin | The generator creates new packages rather than modifying existing ones; follow [Plugin structure](plugin-structure.md) to extend implementation, declarations, exports, dependencies and tests, then check App registration |
| Selecting routes or database capabilities did not produce a working feature | These options generate declarations or drafts; implement the pages, endpoints or migrations, then integrate and verify them |
| The package is installed but its command is missing | Check the `./cli` export and application `cli/plugins.ts` registration, and invoke it from the App root |

Continue with [Plugin structure](plugin-structure.md) for file responsibilities, then [Write your first plugin](write-your-first-plugin.md) for implementation and integration. For installation, updates and removal, see [Manage plugins](../developing-apps/manage-plugins.md).
