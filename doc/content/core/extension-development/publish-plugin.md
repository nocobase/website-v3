---
title: Publish a plugin
description: Local plugins build and deploy with the App. Publish to a private npm registry when other applications need to share them.
---

**A plugin can stay in an App without ever being published.** Local plugins live under `packages/` and connect through workspace dependencies and runtime registration. The App build builds its local dependencies, collects the plugin artifacts needed for delivery under `dist/vendor/`, and prepares deployment dependencies. Build and deploy the App normally; setting up an npm registry is unnecessary for this workflow.

Consider publishing when several Apps or teams need the same plugin and want to choose versions and schedule upgrades independently. This guide continues the announcements example from [Write your first plugin](write-your-first-plugin.md): publish it to a team's private npm registry, then install it in another App.

The source can remain in the original App's workspace after publication. That App can continue using local source while other Apps use published versions.

This article covers package publication. To also publish frontend components or blocks as source assets for Agents to obtain, modify and compose, distribute them through shadcn UI Registry; see [Publish UI source assets](frontend-components.md#optionally-distribute-ui-source-assets). Packages and source assets can be released independently. Component reuse alone does not require a Registry.

## Use an agent

If your team already has a registry, replace the address below with its actual URL:

```text
Prepare this App's announcements plugin as @my-company/app-plugin-announcements.
Check and build it, then publish version 0.1.0 to https://npm.example.com/.
Install, register and verify that version in another App.
```

If there is no registry yet, have the agent help set one up first. Supply credentials through package-manager login or CI credential settings, not in the request or plugin source. The manual steps follow.

## Without an agent

### 1. Prepare a private npm registry

If your team has a private npm registry, use its address and account and proceed to the next step. Otherwise, [Verdaccio](https://www.verdaccio.org/docs/docker/) provides a way to host one. This example runs the complete workflow locally at `http://localhost:4873/`.

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

This configuration hosts only `@my-company/*`. Authenticated users can read packages; the user named `publisher` can publish them. It does not proxy other npm packages, which the App continues to obtain from their configured registries.

Run the service from that directory, keeping packages and accounts in a Docker volume:

```bash
docker run -d --name team-npm --restart unless-stopped \
  -p 127.0.0.1:4873:4873 \
  -v "$PWD/config.yaml:/verdaccio/conf/config.yaml:ro" \
  -v team-npm-storage:/verdaccio/storage \
  verdaccio/verdaccio:6
```

Create the publishing account, entering `publisher` as the username, followed by a password and email when prompted:

```bash
npm adduser --registry http://localhost:4873/ --auth-type=legacy
```

Create accounts for consumers as needed. Once the accounts are ready, set `max_users` to `-1` and run `docker restart team-npm` to close self-registration. Existing accounts can still sign in. See [Verdaccio authentication](https://www.verdaccio.org/docs/authentication/) for account configuration.

This setup is accessible only from the local machine. For team use, provide an HTTPS endpoint and replace every `http://localhost:4873/` in this guide with that address; `localhost` on another machine will not reach this server. Keep backups of the configuration and volume, and retain them when replacing the container.

### 2. Configure the registry and sign in

Append this line to `.npmrc` at the **root of the App maintaining the plugin**:

```ini
@my-company:registry=http://localhost:4873/
```

Keep existing settings, particularly the `@nocobase` registry. Your own organization scope lets team plugins and NocoBase dependencies resolve to their respective registries.

Creating an account also signs in that machine. On another development machine, run:

```bash
npm login --registry http://localhost:4873/ --auth-type=legacy
npm whoami --registry http://localhost:4873/
```

Publish with an account that has publishing permission: `publisher` in this example. Login credentials belong in user configuration, not project commits.

### 3. Prepare the package

Continue in the App maintaining the plugin. Keep the directory `packages/app-plugin-announcements/` and change the package name to `@my-company/app-plugin-announcements`.

If continuing from the previous guide's `@nocobase/app-plugin-announcements`, update these locations together:

| Location | Change |
| --- | --- |
| Plugin `package.json` | Set `name` to the new package name, `version` to `0.1.0`, and remove `private: true` |
| Client and Server plugin definitions | Set `packageName` to the same new name |
| Plugin tests and documentation | Update package names and the translation namespace used in tests |
| App `package.json` | Rename the local dependency key, keeping `workspace:*` |
| App plugin registration files | Update the imports to the new package name, retaining registration |

Run `pnpm install` to synchronize workspace links and the lockfile. For a new plugin intended for sharing, use the full package name at creation time; see [Create a plugin](create-plugin.md#names-and-common-options).

`private: true` prevents publishing to any npm registry, including a private one. Removing it does not make a package publicly accessible; the registry's permission rules determine who can read or publish. See [npm's private field](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#private).

Review the remaining plugin `package.json` fields:

| Field | What to check |
| --- | --- |
| `publishConfig.registry` | Add `http://localhost:4873/` as the explicit publication target |
| `publishConfig.access` | Remove the scaffold's `public` value for this example; Verdaccio manages access through its configuration |
| `exports`, `imports` | Preserve local development entries and package-local aliases |
| `publishConfig.exports`, `publishConfig.imports` | Preserve the scaffold's mappings to `dist/`; pnpm applies them when packing |
| `files` | Include `dist/`, plus Skills or other runtime resources when provided |
| Dependency declarations | Declare Server dependencies, shared runtimes and Client peers with versions compatible with consumers |

**Add the registry to the existing `publishConfig`; do not replace it with an object containing only `registry`.** See [Plugin structure](plugin-structure.md#packagejson-metadata-dependencies-and-public-exports) for development and published entry mappings.

If the plugin depends on another workspace package, consumers must also be able to install that package. Packing converts `workspace:*` to a version requirement; it does not bundle the other package's implementation. Publish shared dependencies first.

Complete the README and changelog with the plugin's capabilities, entries to register, compatible versions and required configuration. The published package must work outside its original App, without importing that App's private source or depending on its file paths.

### 4. Check and pack

Run from the **App root**:

```bash
pnpm --filter @my-company/app-plugin-announcements check
pnpm --filter @my-company/app-plugin-announcements pack \
  --pack-destination ./artifacts
```

`check` runs linting, formatting checks, type checking, tests and the plugin build. `pack` creates the publication archive without uploading it. These commands write the `.tgz` under the App's `artifacts/` directory; use the actual path printed by the command. See [pnpm pack](https://pnpm.io/cli/pack) for packing rules.

Inspect the contents and the packaged manifest:

```bash
tar -tzf artifacts/my-company-app-plugin-announcements-0.1.0.tgz
tar -xOf artifacts/my-company-app-plugin-announcements-0.1.0.tgz package/package.json
```

Check that:

- Public entries such as `./client` and `./server` point to compiled files included in the archive.
- Client package-local aliases resolve, and translations and other runtime resources are included.
- The archive contains no App configuration, credentials or local data. Keep generated archives out of source control.

The announcements package should include `dist/client/`, `dist/server/` and `dist/shared/`. Working in the original App is not sufficient verification: test the published package in another App too.

### 5. Publish to the private registry

Commit the reviewed changes and use your team's release branch. From the App root, preview publication, then publish:

```bash
pnpm --filter @my-company/app-plugin-announcements publish --dry-run
pnpm --filter @my-company/app-plugin-announcements publish
```

This publishes only the selected plugin to its `publishConfig.registry`. pnpm checks the Git state and release branch; address its messages when those conditions are not met. `--dry-run` uploads nothing, and publication uses the `latest` tag by default. See [pnpm publish](https://pnpm.io/cli/publish).

Query the exact version after publication:

```bash
npm view @my-company/app-plugin-announcements@0.1.0 version \
  --registry http://localhost:4873/
```

The result should be `0.1.0`. Publication makes that version available for other Apps to install; it does not change deployed applications.

### 6. Install in another App

Enter the **root of another App created with create-app**. It has no local announcements plugin source and does not need a copy of the original App's `packages/`.

First edit **`.npmrc` at this App's root**, creating it if necessary, and append the registry for your team's scope:

```ini
@my-company:registry=http://localhost:4873/
```

Replace the address with the private registry URL reachable by the consumer. Preserve existing default registry and `@nocobase` settings. Neither the publishing App's `.npmrc` nor the plugin's `publishConfig.registry` automatically configures this App's installation registry.

Sign in on the current machine with an account that can read packages. Skip this if already signed in to the same registry:

```bash
npm login --registry http://localhost:4873/ --auth-type=legacy
npm whoami --registry http://localhost:4873/
```

`plugin register` invokes the package manager from the App root, where pnpm reads this `.npmrc`. The registration command therefore needs no `--registry` argument; it currently does not provide that option.

If pnpm's release-age policy blocks the newly published package, add your own scope to the existing list in `pnpm-workspace.yaml`:

```yaml
minimumReleaseAgeExclude:
  - '@my-company/*'
```

Preserve all other settings and existing entries. This exception applies only to packages your team controls; see [Verdaccio's pnpm guide](https://www.verdaccio.org/docs/setup-pnpm/).

Preview the installation plan, then install and register the exact version:

```bash
pnpm nocobase plugin register @my-company/app-plugin-announcements \
  --version 0.1.0 --dry-run
pnpm nocobase plugin register @my-company/app-plugin-announcements \
  --version 0.1.0
```

Before installation, the preview primarily describes the installation plan. Once installed, the command reads public entries, writes Client and Server registrations, and synchronizes Skills. Do not use `--no-install` here: the consumer needs to fetch the package from the registry.

Start the App, verify its announcement page and API, then build:

```bash
pnpm dev
# Run in another terminal
pnpm build
```

Follow [Write your first plugin](write-your-first-plugin.md#6-register-in-the-app-and-view-the-result) to check navigation, announcement content, language switching and the API. Then deploy the App through its usual process; see [Choose a deployment method](../deployment/choose-a-deployment-method.md).

Development and CI build environments need registry read access. The App build retains registry addresses but does not copy authentication tokens from the project's configuration into deployment artifacts. Supply CI authentication through user-level npm configuration or protected credential settings. If the deployment process installs dependencies again, that installation step also needs read access.

### 7. Publish subsequent versions

After changing and verifying the plugin, increment its version, update the changelog, and repeat the check and publication steps. Do not overwrite published versions.

Consumers upgrade and verify the plugin when needed; see [Manage plugins](../developing-apps/manage-plugins.md#update-plugins). They still need to rebuild and deploy their Apps: deployed applications do not switch versions automatically. The App maintaining the plugin can continue using local source through `workspace:*`.
