---
title: Build and publish
description: Local plugins can be built and deployed together with the App; publish to a private npm registry only when several applications need to share them.
---

**A plugin can be used in the App indefinitely without ever being published.** Local plugins live under `packages/` and connect to the application through workspace dependencies and runtime registration. The App build builds the local packages it depends on, collects the plugin output to deliver into `dist/vendor/`, and handles the dependencies deployment needs. Just build and deploy the App through the normal process; there is no need to set up an npm registry first.

Consider publishing when several Apps or teams need to share a plugin and want to choose versions and schedule upgrades independently. This guide continues with the announcements example from [Write your first plugin](write-your-first-plugin.md), publishing it to a team's private npm registry and then installing it in another App.

After publishing, the plugin's source can still be maintained in the original App's workspace: the original App keeps using the local source, while other Apps use the published versions.

This guide covers publishing plugin packages. If you also need to publish frontend components or blocks as source assets for Agents to take, change and combine as needed, distribute them through shadcn UI Registry as well; see [Optionally distribute UI source assets](frontend-components.md#optionally-distribute-ui-source-assets). Plugin packages and source assets can be published independently; reusing components does not require publishing a Registry.

## Build locally and deliver with the App

First check and build the plugin in the application root, then build the whole application:

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm build
```

Check the public entries, type declarations and actual resources in the plugin's `dist/`, then the local dependencies in the application output. Verify the pages, APIs or commands according to what the plugin provides; when migrations and Seeds are involved, confirm the compiled resources and checksum manifests are complete. Component styles are handled by the host build; for what to check, see [Components and styles](frontend-components.md#styles-and-theme-integration).

When the plugin is used only in the current App, it can be delivered following [Choose a deployment method](../deployment/choose-a-deployment-method.md) once the application is verified. The private registry flow below is for cases that need to distribute the plugin package independently.

## Use an Agent

When a private registry already exists, describe the request like this, replacing the address with the one your team actually uses:

```text
Prepare this App's announcements plugin as @my-company/app-plugin-announcements.
Check and build it, then publish version 0.1.0 to https://npm.example.com/.
Install, register and verify that version in another App.
```

If there is no private registry yet, have the Agent help set one up first. Sign-in details are provided through the package manager's login or CI credential configuration, never written into the request or the plugin source. The manual steps follow.

## Without an Agent

### 1. Prepare a private npm registry

If your team already has a private npm registry, use the address and account it provides and skip to the next step. If not, you can set one up with [Verdaccio](https://www.verdaccio.org/docs/docker/). The following demonstrates the complete flow with `http://localhost:4873/` on the local machine.

Create `config.yaml` in a separate directory:

```yaml
storage: /verdaccio/storage

auth:
  htpasswd:
    file: /verdaccio/storage/htpasswd
    max_users: 1000

packages:
  '@my-company/*':
    access: $authenticated
    publish: publisher
    unpublish: publisher
```

This configuration hosts only packages under `@my-company/*`: signed-in users can read them, and the user named `publisher` can publish them. It proxies no other npm packages, so the App's existing dependencies are still fetched from their own configured registries.

Start the service in that directory, keeping package and account data in a Docker volume:

```bash
docker run -d --name team-npm --restart unless-stopped \
  -p 127.0.0.1:4873:4873 \
  -v "$PWD/config.yaml:/verdaccio/conf/config.yaml:ro" \
  -v team-npm-storage:/verdaccio/storage \
  verdaccio/verdaccio:6
```

Create the publishing account, entering the username `publisher`, a password and an email when prompted:

```bash
npm adduser --registry http://localhost:4873/ --auth-type=legacy
```

Create accounts for consumers as needed. Once the accounts are ready, change `max_users` to `-1` and run `docker restart team-npm` to close self-registration; existing accounts can still sign in. For configuring accounts and package permissions, see [Verdaccio authentication](https://www.verdaccio.org/docs/authentication/).

This way of starting the service only allows access from the local machine. To share it within the team, serve it through an HTTPS entry and replace every `http://localhost:4873/` in this guide with the real address; on other machines, `localhost` does not point to this server. Keep and back up the configuration and the volume; deleting the container must not delete this data.

### 2. Configure the registry and sign in

Append the following to `.npmrc` in the **root of the App that maintains the plugin**:

```ini
@my-company:registry=http://localhost:4873/
```

Keep the existing configuration, especially the registry setting for `@nocobase`. Using your own organization's scope lets the team's plugins and NocoBase dependencies resolve to their correct registries.

The machine that created the account is already signed in; on other development machines, run:

```bash
npm login --registry http://localhost:4873/ --auth-type=legacy
npm whoami --registry http://localhost:4873/
```

Publish with an account that has publishing permission, `publisher` in this example. Sign-in credentials are stored in user-level configuration and must not go into project commits.

### 3. Prepare the package

The following steps still take place in the App that maintains the plugin. The announcements plugin's directory can stay `packages/app-plugin-announcements/`, with only the package name changed to `@my-company/app-plugin-announcements`.

If you kept `@nocobase/app-plugin-announcements` from the previous guide, change these places together:

| Location | Change |
| --- | --- |
| The plugin's `package.json` | Change `name` to the new package name, set `version` to `0.1.0`, and delete `private: true` |
| The plugin's Client and Server definitions | Change `packageName` to the same new package name |
| The plugin's tests and documentation | Update the package name, and the language resource namespace in tests |
| The App's `package.json` | Change the local dependency key to the new package name, still using `workspace:*` |
| The App's plugin registration files | Change the corresponding imports to the new package name and keep the registrations |

When done, run `pnpm install` to synchronize the workspace links and the lockfile. When creating a new plugin intended for sharing, you can use the full package name from the start; see [Create a plugin](create-plugin.md#names-and-common-options).

`private: true` means the package may not be published to any npm registry, private ones included. Removing it does not make the package public; who can read or publish is decided by the private registry's permission configuration. See [npm's private field](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#private).

Continue checking the plugin's `package.json`:

| Field | What to confirm before publishing |
| --- | --- |
| `publishConfig.registry` | Add it and set it to `http://localhost:4873/` to make the publishing target explicit |
| `publishConfig.access` | This example deletes the scaffold's `public` value, leaving access to the Verdaccio configuration |
| `exports`, `imports` | Keep the entries and in-package aliases used for local development |
| `publishConfig.exports`, `publishConfig.imports` | Keep the scaffold's mappings to `dist/`, which pnpm applies when packing |
| `files` | Include `dist/`; with Skills or other runtime resources, include their directories too |
| Dependency declarations | Server dependencies, shared runtimes and client peer dependencies are complete, with versions compatible with consumers |

**Add the registry address to the existing `publishConfig`; do not replace the whole thing with an object containing only `registry`.** For how local development entries relate to publishing entries, see [Plugin structure](plugin-structure.md#packagejson-metadata-dependencies-and-public-exports).

If the plugin depends on another workspace package, that package must also be installable by consumers. `workspace:*` is converted to a version requirement when packing, and does not bundle the other package's implementation; publish the shared packages it depends on first.

Complete the plugin's README and changelog, explaining its features, the entries to register, compatible versions and required configuration. The published package must work on its own outside the original App, without depending on the original App's private source or file paths.

### 4. Check and pack

Run in the **App root**:

```bash
pnpm --filter @my-company/app-plugin-announcements check
pnpm --filter @my-company/app-plugin-announcements pack \
  --pack-destination ./artifacts
```

`check` checks code, formatting, types and tests and builds the plugin; `pack` produces the publishing package without uploading it. These commands generate a `.tgz` file in `artifacts/` under the App root; the exact path is shown in the terminal output. For packing rules, see [pnpm pack](https://pnpm.io/cli/pack).

View the file list and the declarations in the package:

```bash
tar -tzf artifacts/my-company-app-plugin-announcements-0.1.0.tgz
tar -xOf artifacts/my-company-app-plugin-announcements-0.1.0.tgz package/package.json
```

Confirm in particular that:

- Public entries such as `./client` and `./server` point to compiled files that actually exist in the package.
- Client in-package aliases resolve, and language resources and other runtime files are complete.
- The package contains no App configuration, account credentials or local data; packing output must not be committed to the source repository.

For the announcements plugin, the package should contain `dist/client/`, `dist/server/` and `dist/shared/`. Checking that it runs in the original App is not enough; finally, verify the published package in another App.

### 5. Publish to the private registry

Confirm all changes are committed, and run this on the release branch your team agreed on. Still in the App root, preview first, then publish:

```bash
pnpm --filter @my-company/app-plugin-announcements publish --dry-run
pnpm --filter @my-company/app-plugin-announcements publish
```

Only the selected plugin is published, and the target is decided by the plugin's `publishConfig.registry`. pnpm checks the Git state and the release branch; when a condition is not met, follow its prompts first. `--dry-run` uploads nothing; a real publish uses the `latest` tag by default. See [pnpm publish](https://pnpm.io/cli/publish).

After publishing, query the specific version:

```bash
npm view @my-company/app-plugin-announcements@0.1.0 version \
  --registry http://localhost:4873/
```

It should return `0.1.0`. Publishing lets other Apps install this version, but does not change applications that are already deployed.

### 6. Install in another App

Go to the **root of another App created with create-app**. It contains no local source of the announcements plugin and does not need a copy of the original App's `packages/`.

First edit **`.npmrc` in this App's root** (create it if it does not exist), appending the registry configuration for the team's plugins:

```ini
@my-company:registry=http://localhost:4873/
```

Replace the address with a private registry address the consumer can reach, and keep the existing default registry and settings such as `@nocobase` in the file. The publishing App's `.npmrc` and the plugin's `publishConfig.registry` do not configure the installation registry for this App automatically.

On the current machine, sign in with an account that has read permission; if you are already signed in to the same registry, skip this step:

```bash
npm login --registry http://localhost:4873/ --auth-type=legacy
npm whoami --registry http://localhost:4873/
```

`plugin register` calls the package manager in the App root to install the plugin, and pnpm reads the `.npmrc` above, so the registration command needs no `--registry` argument, and the current command does not provide one.

If the release-age waiting policy in newer pnpm versions blocks installing a just-published package, append your own scope to the existing list in `pnpm-workspace.yaml`:

```yaml
minimumReleaseAgeExclude:
  - '@my-company/*'
```

Keep the other settings and existing entries in the file. This exception applies only to packages your team controls; see [Verdaccio's pnpm guide](https://www.verdaccio.org/docs/setup-pnpm/).

Preview the installation plan first, then install and register the specific version:

```bash
pnpm nocobase plugin register @my-company/app-plugin-announcements \
  --version 0.1.0 --dry-run
pnpm nocobase plugin register @my-company/app-plugin-announcements \
  --version 0.1.0
```

Before installation, the preview mainly shows the installation plan; after a real installation, the command reads the public entries, writes the Client and Server registrations, and synchronizes Skills. `--no-install` is not used here, because the consumer needs to fetch the plugin from the private registry.

Start the application, verify the announcements page and API, then build:

```bash
pnpm dev
# Run in another terminal
pnpm build
```

Check the menu, announcement content, language switching and API following [Write your first plugin](write-your-first-plugin.md#6-register-in-the-app-and-view-the-result). Then deploy in the App's usual way; see [Choose a deployment method](../deployment/choose-a-deployment-method.md).

Development machines and CI build environments both need read access to the private registry. The App build keeps registry addresses but does not copy authentication tokens from the project into the deployment output; CI provides authentication through user-level npm configuration or protected credential configuration. If the deployment process installs dependencies again, that installation step also needs read access.

### 7. Publish subsequent versions

After changing and verifying the plugin, increment the version and update the changelog, then repeat the check and publish flow; never overwrite a version that is already published.

Consumers upgrade the dependency and verify the features as needed; see [Manage plugins](../developing-apps/manage-plugins.md#update-plugins). After upgrading a plugin, the App must still be rebuilt and redeployed; deployed applications do not switch versions automatically. The App that originally maintains the plugin can keep using its local source through `workspace:*`.
