---
title: Upgrade NocoBase Core
description: Upgrade the NocoBase Core an application uses, with an Agent or by merging the newer template yourself, keeping business code and verifying data and permissions.
---

This guide explains how to upgrade the NocoBase Core and related dependencies your application uses. The upgrade happens in the application's source project; once verified, [deploy the application](../deployment/choose-a-deployment-method.md) the way you did before.

## What an upgrade changes

A project created with create-app contains both NocoBase package dependencies and framework code copied into the project, such as the application entries, routing, layouts, configuration and testing tools. So an upgrade must merge the newer template's code and dependency changes while keeping the features you developed yourself.

That is why you should neither just update every `@nocobase/*` package nor overwrite the existing project with a newly created application. Each package's version changes independently, so follow the dependency combination of the target template.

The `package.json` at the application root contains configuration like this:

```json
{
  "nocobase": {
    "templateKind": "app",
    "templatePackage": "@nocobase/app-template-default",
    "defaultTemplateVersion": "1.0.0-beta.81"
  }
}
```

`templatePackage` is the template the application came from, and `defaultTemplateVersion` is the template version already merged into the application. The application's own `version` is for versioning the business application and does not represent the Core version; editing these fields alone does not perform an upgrade.

## Before you upgrade

- Tidy up and commit existing changes to Git and note the current commit. Do the upgrade on a separate branch.
- Confirm the target version and read its release notes, including compatibility with Node.js, the package manager, databases and custom plugins.
- Prepare a restorable database backup, keep the runtime configuration, secrets and file storage, and note the matching build of the old version.
- Rehearse in a separate verification environment. To verify old data, restore the database and file backups there, and make sure the environment cannot connect to the production database or send real business notifications.

The new version may run migrations automatically when it starts, so finish backups, migration checks and any necessary data preparation before its first start.

Then choose one of the two paths below; both end with the verification and deployment steps in this guide.

## With an Agent

Open a coding Agent in the application root. The application's own upgrade guidance is at `.agents/skills/nocobase-app-upgrade/SKILL.md` and is synchronized with dependency installation; first confirm the Agent can read it and the project's `AGENTS.md`. The prompt only needs to state the upgrade goal, the features to keep and the verification requirements.

If the Skill is missing, install dependencies from the project's lockfile first; if scripts did not run during installation, then run:

```bash
pnpm nocobase skills sync
```

You can use the prompt below, changing the goal to an explicit version or keeping "the newer release on the current release channel":

```text
Please upgrade the NocoBase Core used by this application to the newer release on its current release channel.

First inspect the project and give me a concrete plan without editing it:
- State the current and target versions. If already at the target, say no upgrade is needed; do not downgrade.
- Explain affected features, dependencies, configuration and plugins, and which changes need my decision.
- Explain how existing business features, themes, permissions and data will be preserved, and how to recover if something goes wrong.
- Identify irreversible data changes or historical records that need repair, explaining their cause and impact.

After I confirm the plan, follow the project's upgrade guidance and make changes on a separate branch.
Do not overwrite the application, clear the database or treat a version-number change alone as a completed upgrade.
Verify old data, sign-in, ordinary-user permissions and task operations in a separate test environment.
Report the before-and-after versions, adjustments, verification results and remaining work.
This task prepares and verifies the upgraded project; confirm production deployment separately.
```

When confirming the plan, focus on whether your features are kept, whether removed plugins are still in use, and whether the database can be restored. After the Agent finishes, review the actual differences and verification results before moving on to deployment.

## Migrate the old global plugin development Skill

If you previously installed `nocobase-app-plugin-development` globally, include its migration in the upgrade plan. The target version must provide both the project-level Skill and a compatible synchronization command; do not assume a project Skill with the same name overrides the global one.

1. Upgrade dependencies according to the target template, then run `pnpm nocobase skills sync`.
2. Confirm that the App's `.agents/skills/nocobase-app-plugin-development/` contains the complete guidance and its referenced files.
3. Check the current Agent's global installation locations and remove the old installation with this exact name and its related links. If it contains custom content, back it up first to a location the Agent does not scan; for a symbolic link, remove only the link itself, not the project or source it points to.
4. Start a new Agent session and confirm it uses the files in the project.

If the project-level Skill is not available yet or synchronization fails, keep the existing global installation and fix the prerequisites first. Global files are not protected by the App's Git branch, so record their backup and recovery separately; neither dependency installation nor synchronization deletes them automatically. If the application is already upgraded but the global copy has not been cleaned up, you can still do this migration afterwards without changing the version number again.

## Without an Agent

### 1. Confirm the baseline and the target version

Run these in the root of the application source. The later commands use variables from the same Bash session:

```bash
git status --short
git rev-parse HEAD
node -p "JSON.stringify(require('./package.json').nocobase, null, 2)"

TEMPLATE=$(node -p "require('./package.json').nocobase.templatePackage")
BASE=$(node -p "require('./package.json').nocobase.defaultTemplateVersion")
npm view "$TEMPLATE" dist-tags --json
```

If the working tree has changes, tidy them up and commit first. If the template source or baseline fields are missing, confirm them from the project history first; do not guess from `templateKind: app` whether the project came from Default or Examples, and do not guess a baseline and carry on.

Beta applications usually stay on the `beta` channel, and stable applications usually use `latest`. `latest` is just a release tag; it is not guaranteed to be newer than `beta`, nor to point to a stable release. Other prerelease channels need to be confirmed separately.

Taking a beta application as the example, resolve the target version once and pin it:

```bash
TARGET=$(npm view "$TEMPLATE@beta" version)
printf 'Template: %s\nBase: %s\nTarget: %s\n' "$TEMPLATE" "$BASE" "$TARGET"
```

To use a specific version, set `TARGET` directly to the confirmed full version number. Compare the baseline and target by semantic versioning rules: if they are equal, no upgrade is needed; if the target is older, stop, because downgrading implicitly is not allowed. Once you have confirmed the target is newer, create a branch:

```bash
git switch -c "chore/upgrade-core-$TARGET"
```

### 2. Get the templates for both versions

Download them into a temporary directory, not into the application source:

```bash
WORK=$(mktemp -d)

for VERSION in "$BASE" "$TARGET"; do
  ARCHIVE=$(npm pack "$TEMPLATE@$VERSION" --silent --pack-destination "$WORK")
  mkdir -p "$WORK/$VERSION"
  tar -xzf "$WORK/$ARCHIVE" -C "$WORK/$VERSION" --strip-components=1
done

diff -rq "$WORK/$BASE" "$WORK/$TARGET"
```

`diff` returning `1` means differences were found, which is the expected result. This compares the two published templates; comparing the current project directly with the new template would make it impossible to tell which differences come from your own business development.

### 3. Merge code and dependencies item by item

For each changed file, look at the baseline template, the target template and the project's version together. For example, to look at the routing changes:

```bash
diff -u "$WORK/$BASE/client/routes.ts" "$WORK/$TARGET/client/routes.ts"
diff -u "$WORK/$BASE/client/routes.ts" client/routes.ts
```

The first diff shows the template's own change, and the second shows the project's existing customization. Merge the template's new behavior into your code while keeping business content such as the task routes, the system settings entry and the permission declarations.

| Content | How to merge |
| --- | --- |
| Ordinary framework files | Take the target version for files you never customized; merge files changed on both sides item by item |
| `package.json` | Adjust dependencies and scripts to the target template, keeping the application name, business version, custom dependencies and scripts; do not overwrite the whole file |
| Plugin registration | Check `client/plugins.ts`, `server/plugins.ts` and `cli/plugins.ts` together, and keep the plugins the application uses |
| Configuration and themes | Merge the configuration example and framework changes, keeping the actual configuration, secrets, application identity and custom themes |
| Database migrations and Seeds | Keep files that have already run with their original content and paths; make corrections through new migrations |
| Agent guidance | Merge the application's customizations in `AGENTS.md` and `.agents/rules/`; resynchronize `.agents/skills/` with the command |

When the target template removes a file or dependency, first check whether business code, configuration or tests still use it. For NocoBase packages confirmed safe to remove, run `pnpm nocobase package remove <package>` while the package is still declared as a dependency, to clean up the dependency, Skills and plugin registration; references in business code must be handled yourself. For older projects whose CLI does not support this command yet, follow the compatibility steps in the project's upgrade Skill.

Package upgrades in the target template may also bring migrations inside plugins. Besides the application file differences, read the upgrade notes of the relevant packages and check whether data needs preparing, APIs need adapting, or removed capabilities need replacing.

### 4. Install dependencies and synchronize Skills

After merging the source, update `nocobase.defaultTemplateVersion` to the target version pinned for this upgrade, then run:

```bash
pnpm install
pnpm dedupe
pnpm nocobase skills sync
```

Review and keep the lockfile changes. `pnpm dedupe` tidies duplicate dependencies within compatible ranges; on conflicts, locate the source with `pnpm why <package>` and resolve it according to the target template and the constraints of your custom dependencies. Do not get around conflicts by deleting the lockfile or updating every dependency to the latest version.

### 5. Check the database and run migrations

First complete the static checks and automated tests in the next section. After confirming the current configuration points to the separate verification environment, and before starting the new version for the first time, run two read-only checks with the target version's CLI:

```bash
pnpm nocobase db apply --dry-run --json
pnpm nocobase db repair --dry-run --json
```

The first lists the migrations and Seeds waiting to run, and the second checks whether the checksums of executed records have changed. The migration preview neither executes migration contents nor checks checksums, so the two checks cannot replace each other. They check the default connection by default; for an application with several connections, add `--connection <name>` for each connection actually in use, and use the same scope when executing later.

If the checksum check proposes corrections, verify each one against the release notes first; do not treat actually running `db repair` as a mandatory step. It changes the checksums of all mismatched records in the selected connection, without rerunning migrations or repairing business data. When a change cannot be explained, stop and follow the database guidance in the project's upgrade Skill; do not edit historical files, reset the database or ignore the error.

After confirming that backups can be restored and that the checksum check and any necessary data preparation are done, apply the migrations in the separate verification environment:

```bash
pnpm nocobase db apply --json
```

Migrations in production are arranged by the deployment process; do not connect a development project directly to the production database to run these operations.

## Verify the upgrade

A Core upgrade can affect the whole application. For this guide's example, check the project's existing scripts, and add the separate tests for the task feature as described in [Build your first app](../tutorials/build-your-first-app.md):

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

These commands run in the source project, and tests must use an isolated database. If the existing test configuration needs adapting to new tools, fix the configuration and keep the test coverage; skipping failing tests does not count as passing.

Once the database is prepared, run `pnpm dev` and verify with the printed `Local:` address:

- Administrators can sign in, the task page and system settings work, and the language and custom theme are as expected.
- Old tasks keep their titles, assignees, completion states and due dates; creating, completing/reopening, filtering and paging all work.
- Ordinary users can only reach authorized pages and data; read-only users still cannot write, and calling the API directly cannot bypass permissions.
- Data survives refreshes and restarts; the plugin features, background jobs or external integrations involved in this upgrade pass their checks.

Accept the upgrade against the features your application actually has. After configuring a test address and account for a separate application, run the browser tests with `pnpm test:e2e`; for the preparation, see [Build your first app](../tutorials/build-your-first-app.md). Note that `pnpm test` does not include browser tests.

## Deploy and roll back

After verification, commit the source and the lockfile, record the baseline, target version, merge decisions and verification results, rebuild, and release with your existing deployment method:

- [Deploy with Docker](../tutorials/deploy-with-docker.md#publish-a-new-release)
- [Deploy with PM2 (app-installer)](../tutorials/deploy-with-app-installer.md#publish-a-new-release)

Keep the configuration and data backups that match the old build. Rolling back code does not undo database migrations automatically; if the old version cannot work with the upgraded schema, restore the matching database and files, and deal with business writes that happened after the backup.

If the release notes require correcting historical checksums, put the backup, the correction, the migrations and recovery from failure into one maintenance process. With app-installer, do not run `db repair` yourself first and then rely on a normal upgrade's automatic recovery: the data the installer backs up afterwards may already contain the new checksums, which the old runtime may not accept. External databases also need their own backup and recovery arrangements.

## What this guide verifies

This guide explains how to merge templates and check an upgrade. The current getting-started example has been checked against the `1.0.0-beta.81` template dependencies published on npmjs.org and has passed its tests and build; that does not mean an upgrade from every older version to this one has been verified. For an actual cross-version upgrade, still check the target version's notes and verify old data, permissions and rollback in a separate environment.
