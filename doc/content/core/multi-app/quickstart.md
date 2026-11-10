---
title: Quickstart
description: Run the multi-app example, create an instance, grant access, and check data isolation and selective upgrades.
---

Use the [app-example-multi-app example](https://github.com/nocobase/app-example-multi-app) to explore one platform managing several reagent-management instances. The reagent domain is only a demonstration; your applications can manage inventory, customers, purchasing, or other business needs.


## Start the example

Clone the example into a new directory:

```bash
git clone https://github.com/nocobase/app-example-multi-app.git
cd app-example-multi-app
pnpm install --frozen-lockfile
```

In the same directory, configure the entry point and build. Replace the domain with the actual address you prepared:

```bash
EXAMPLE_PUBLIC_ORIGIN=https://apps.example.com pnpm setup:local
pnpm build:templates
pnpm build --target linux-x64 --node-version 24 --tar
pnpm demo
```

`setup:local` configures the platform entry, App Host, and demo storage. `build:templates` builds the reagent template. `pnpm demo` starts the built platform and its managed App Host, then initializes the demonstration. Running only `pnpm dev` at the root does not perform this initialization.

After the terminal prints `Application templates demo is ready.`, open the configured HTTPS platform URL ending in `/main/`. A fresh environment defaults to username `nocobase` and password `admin123`; existing configuration may override them. Do not expose an environment using default credentials to untrusted visitors.

The configuration script disables Secure cookies for the demonstration. It is not a production security configuration; see [Deployment and operations](deployment.md).

To resume an existing environment, first ensure no other process uses the same database and storage, then run `pnpm demo`. Do not reconfigure addresses, delete data, or recreate instances merely to restart.

## Inspect templates and create an instance

First-time initialization provides one reagent template and these instances:

| Instance ID | Initial version | Initial state |
| --- | --- | --- |
| `teaching-reagents` | `1.3.11` | Running |
| `research-reagents` | `1.3.14` | Running |
| `browser-reagents` | `1.3.11` | Stopped |

Open the template details under **Application templates** and inspect the two published versions. Under **Application instances**, create another instance with a recognizable name and unique ID. Select its template, an explicit version, and the deployment environment.

Wait for completion, then check that the instance is running, its current version matches your selection, and its address opens. An accepted request or a deployment record alone does not mean the application is usable. See [Manage templates and instances](management.md).

## Grant access and enter the child application

1. Prepare an ordinary platform user.
2. Open **Access** for the new instance and grant that user reader or editor access.
3. Sign in to the platform as that user and open the instance from the workbench.
4. Check that platform sign-in reaches the child and that only the intended business operations are available.

Demo initialization explicitly gives the demo administrator editor membership in newly created demo instances. Instances you create manually still need membership assignments. Being a platform administrator does not replace membership.

For local recovery, reveal the initial administrator credentials in the instance's access area and use the child login URL with `?auth=local`. This does not retrieve a password that was subsequently changed.

## Check isolation and selective upgrades

Create distinct reagent records in two accessible instances. Refresh each and confirm that it only shows its own data. Stop and start one instance and check that its records remain.

Record both current versions, then upgrade only one instance to the template's other published version. After deployment completes, confirm that:

- The selected instance runs the target version and retains its records.
- The other instance keeps its version and data.
- A user without membership cannot enter through the application's direct URL.

The two demo versions illustrate version selection and isolation; they do not guarantee visible differences in business features.

The fixed [configuration script](https://github.com/nocobase/app-example-multi-app/blob/2e2df1793ec51372ca9b3890b37e9d4748732689/scripts/configure-local.mjs), [template builder](https://github.com/nocobase/app-example-multi-app/blob/2e2df1793ec51372ca9b3890b37e9d4748732689/scripts/build-templates.mjs), and [demo initializer](https://github.com/nocobase/app-example-multi-app/blob/2e2df1793ec51372ca9b3890b37e9d4748732689/scripts/prepare-demo.mjs) show the implementation. Continue with [Application development](development.md) when you are ready to build your own system.
