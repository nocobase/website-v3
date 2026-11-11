---
title: Application development
description: Use the project-owned development Skill, develop Main and children separately, and verify login and permissions.
---

Pages, APIs, and databases still follow [Developing apps](../../developing-apps/overview.md). Usually, reuse Main's management and identity capabilities while keeping business features in children.

## Use the development Skill and assign responsibilities

After creation, follow the root or App `AGENTS.md` links to `skills/nocobase-multi-app-development/SKILL.md`. It covers workspace boundaries, child development, and platform integration without requiring every business feature to become a plugin.

Scenario Skills are workspace-owned source read through explicit links, not assumed automatic discovery. Framework and commercial plugin Skills come from each App's installed packages and synchronize into its own `.agents/skills/` and `.claude/skills/`. After changing dependencies, run at the root:

```bash
pnpm install
pnpm skills:sync
```

Synchronization does not manage root `skills/`, nor require a template runtime dependency in either App. Do not edit generated plugin Skill copies. Following the [plugin responsibilities](overview.md), read `nocobase-app-plugin-multi-app`, `nocobase-app-plugin-identity-provider`, or `nocobase-app-plugin-platform-sso` inside the App being changed. Resolve installation, version compatibility, and download access before proceeding if guidance is missing.

## Develop Main, Sub, and independent children separately

| Work                                       | Location                                                         |
| ------------------------------------------ | ---------------------------------------------------------------- |
| Platform workbench and provisioning rules  | Pages, services, and authorization in `apps/main/`               |
| Child business pages, APIs, and migrations | `apps/sub/` or the independent child's repository                |
| Platform login and child role mapping      | The child's server, client, config factories, and authentication |
| Child versions and deployment              | Child archives and template versions managed by Main             |

Main does not import Sub's business source. Sub must not borrow Main's components or services through relative imports. A separate repository does not prevent Host management.

Describe the business change naturally to a Coding Agent:

```prompt
Add stock alerts to this child application. Ordinary members can view them, and inventory leads can adjust the thresholds. Keep the existing login and permission management.
```

The child still owns its pages, APIs, and migrations. SSO integration registers server, client, and config factories and merges native authentication and custom user fields rather than replacing them. Environment variables alone do not install or register a plugin. Template integration points include `apps/sub/server/plugins.ts`, `apps/sub/server/config/auth.ts`, and `apps/sub/client/plugins.ts`.

Map platform `reader` and `editor` to minimum business permissions. Remove obsolete SSO-derived grants on downgrade while preserving independently assigned legitimate roles. Inspect every effective grant source; do not make members unrestricted child administrators.

Use application-relative routes and runtime URLs rather than hard-coded `/main` or instance prefixes. Preserve merged migration names, ownership, and contents; add new migrations for changes. Keep development databases, storage, and secrets separate from running instances.

For Main-specific eligibility or provisioning limits, use the public `multiAppProvisioningPolicyToken` with the real operator and business permissions. A supplied `ownerRef` is not authorization. Demo initialization is not a production provisioning policy.

## Develop with local accounts and verify platform integration

Business development can use HTTP local accounts before SSO integration. From a new workspace's root:

```bash
pnpm setup:main
pnpm --dir=apps/sub nocobase config init
pnpm --dir=apps/sub nocobase config set server.port=13232 app.publicOrigin=http://127.0.0.1:13232
```

Set strong administrator passwords and validate both App configurations. Install drivers and initialize each App separately if using another database. Main's HTTP helper disables the managed Host; do not run it over an HTTPS setup you intend to retain.

Start in two terminals:

```bash
APP_SERVER_PORT=13230 pnpm dev:main
APP_SERVER_PORT=13232 APP_VITE_DEV_PORT=5174 pnpm dev:sub
```

Use each process's actual printed `Local:` URL, including the Hono port and application path, not Vite's internal port. Sibling directories do not imply shared configuration, data, or ports.

For SSO and hosted instances, use the trusted HTTPS workflow in [Quickstart](quickstart.md). Check ordinary users, unauthorized users, downgrade and revocation, recovery login, deep links, and direct business API denial. An accessible HTTP login page is not successful SSO.

Run lint, typecheck, tests, and builds for each changed App, for example `pnpm --dir=apps/sub test` and `pnpm --dir=apps/sub build --tar`. Root structural checks do not compile Apps. Publish a real new artifact before [selectively upgrading instances](management.md), and verify that another instance remains unaffected.
