---
title: Quickstart
description: Create a Main/Sub workspace, prepare HTTPS, explicitly initialize a hosted instance, and check business access.
---

## Version prerequisites and workspace creation

Prepare Node.js 24 or newer, pnpm 11.11.0, and compatible [commercial plugins](overview.md) with a license and package-download access.

> [!NOTE]
> These commands require a released create-app supporting `multi-app`, an available `@nocobase/app-template-multi-app`, and compatible commercial packages in your registry. If those releases are unavailable, an older CLI or a different template cannot substitute for this workflow. Source availability does not establish package publication.

Log in through a secure terminal using authorized registry credentials, not tokens in command arguments, source, or plans. Reuse an existing valid login when available:

```bash
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
pnpm create @nocobase/app platform --template=multi-app --registry=https://pkg-v3.nocobase.com/
cd platform
```

The result should contain `apps/main/`, `apps/sub/`, a root lockfile, and `skills/`. Dependencies install once at the root, followed by per-App driver checks and package Skill synchronization. Creation does not write runtime configuration.

If installation fails, keep the directory, resolve registry access and compatible versions, then run `pnpm install` and `pnpm skills:sync` at its root. Do not regenerate over it or replace missing commercial packages with another repository's source links.

## Configure each App and prepare trusted HTTPS

Prepare an existing, operator-authorized trusted HTTPS entry such as `https://platform.example.com`. Its proxy must forward Main and managed child paths to Main, support WebSocket upgrades, and preserve the public Host and HTTPS information. Setup does not create DNS, certificates, a proxy, or a tunnel. See [Deployment and operations](deployment.md) for ports and persistence.

From the workspace root, run:

```bash
pnpm --dir=apps/sub nocobase config init
EXAMPLE_MODE=sso EXAMPLE_PUBLIC_ORIGIN=https://platform.example.com pnpm setup:main
```

This example uses the CLI's default SQLite initialization, not a database requirement. For another database, install its driver and initialize with the matching dialect inside each affected App before running Main's helper. The helper retains existing database configuration.

Before first start, inspect each App's `config.yml` and set its administrator username, email, and a unique strong password. Preserve generated `secrets.keys`; do not copy placeholder keys. Changing initial-admin settings later does not reset an existing account.

```bash
pnpm --dir=apps/main nocobase config check
pnpm --dir=apps/sub nocobase config check
```

Main's helper defaults to `127.0.0.1:13230`. SSO mode enables Secure cookies and the private Host at `127.0.0.1:13231`. Check port availability and use effective settings if you change them. [Application development](development.md) covers HTTP local accounts, which are not a substitute for HTTPS SSO.

## Build Sub and explicitly initialize instances

Build both Apps separately:

```bash
pnpm --dir=apps/sub build --tar
pnpm --dir=apps/main build --tar
```

Both must finish successfully, including each `dist` production dependency installation. Root `pnpm build` checks workspace structure only. Each App writes its own `storage/exports/dist.tar.gz`; also test extracted artifacts outside source before release as described in [Deployment](deployment.md).

At the root, create a plan using Sub's actual version. Review an existing plan rather than overwriting it:

```bash
node --input-type=module <<'NODE'
import { readFile, writeFile } from 'node:fs/promises';
const { version } = JSON.parse(await readFile('apps/sub/package.json', 'utf8'));
const plan = {
  artifacts: [{ version, path: './apps/sub/storage/exports/dist.tar.gz' }],
  instances: [{ id: 'reagents-demo', name: 'Reagent management demo', version }]
};
await writeFile('demo-plan.json', JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
NODE

pnpm demo --initialize --plan "$PWD/demo-plan.json"
```

The archive version must match the plan. Archive paths resolve relative to the plan file, not the invoking directory. One real version is enough; no fixed pair of demonstration releases is required. Never relabel an archive as a different version.

Only explicit initialization publishes artifacts, provisions missing instances, and grants the configured unrestricted administrator membership in newly created demonstration instances. Existing instances retain their selected versions and data; rerunning a plan does not upgrade them. Installation, development startup, and ordinary `pnpm demo` do not initialize instances.

## Grant access and verify business behavior

After initialization finishes, open the configured HTTPS origin with Main's `/main/` path and sign in using your configured administrator. Inspect the actual template version and instance runtime result, not just an accepted request or target version.

1. Prepare an ordinary platform user and explicitly grant instance membership through **Access authorization**.
2. Enter the child from the workbench as that user, checking real browser sign-in and business reads/writes.
3. Test direct-entry denial without membership, then unauthorized business API denial as a restricted member.
4. Retain a local recovery administrator and check the child's application-relative `/login?auth=local` route.

Platform membership is distinct from child permissions; see [Single sign-on and access](single-sign-on.md). Manually created instances still need explicit grants.

For later starts from the source workspace, keep the same configuration, data, and build output:

```bash
pnpm demo
```

Do not initialize or recreate instances merely to restart. Check that explicitly stopped instances cannot wake through requests, explicit start retains data, ordinary idle wake works, and state survives Main/Host restart. Create another instance to test isolation. Prepare a real new artifact separately before testing selective upgrades through [Template and instance management](management.md).
