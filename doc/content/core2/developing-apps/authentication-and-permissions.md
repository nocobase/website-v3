---
title: Authentication, permissions and data scopes
description: Connect authentication to application APIs, declare business actions, and apply authorization results to data access and field restrictions.
---

The server has to answer three separate questions: who is calling? Is this action allowed? Which records and fields may it touch? Page entries and buttons can reflect permissions, but APIs must perform the checks independently.

## Three layers of checks

| Check | Implementation in this example |
| --- | --- |
| Authentication | `auth.required()` from `authenticationToken`; requests without sign-in get `401` |
| Action authorization | `authz.middleware()` builds the request's authorization context, then `authorize()` decides; denied requests get `403` |
| Data and field scopes | The `RepositoryPolicy` from the authorization decision is passed to the service and bound to every Repository operation |

For plugin installation, role management pages and the like, start from [Using plugins](../using-plugins/overview.md); this guide focuses on how the application connects to them.

## Prerequisites

The projects-and-tasks example stays on default template `1.0.0-beta.78` and uses the `tutorialTasks` and `tutorialProjects` tables. Before running it, follow [Create tables and initialize data](data-models-and-migrations.md#prepare-the-example-application) to prepare a separate application, which includes access to the private `nocobase/app-tutorials` repository; it cannot be run directly after the current getting-started `tasks` example. Without access to that repository, you can still read the code and the explanation of responsibilities.

First implement `TutorialProjectService` from [Server business services](server-business-services.md). The original example already has the authentication, authorization and users plugins and `TutorialTasksProvider`; the steps below only add the project capabilities.

## Declare business actions and register the service

Create `server/providers/tutorial-projects.ts`:

<details>
<summary>Provider and permission declarations</summary>

```ts
import metadata from '../../package.json' with { type: 'json' };
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  createServiceToken,
  ServiceProvider,
} from '@nocobase/service-provider';
import { defineCompositeResource } from '@nocobase/authorization/core';
import {
  authorizationToken,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import { TutorialProjectService } from './tutorial-project-service.js';

export const tutorialProjectServiceToken =
  createServiceToken<TutorialProjectService>('app/tutorial-projects');
const projects = defineDatabasePermission((p) =>
  p.collection('tutorialProjects').read(['id', 'name', 'createdAt']),
);
const tasks = defineDatabasePermission((p) =>
  p
    .collection('tutorialTasks')
    .read(['id', 'projectId', 'updatedAt'])
    .update(['projectId', 'updatedAt']),
);
export const projectPermissions = defineCompositeResource(
  'tutorial.projects',
  (r) =>
    r
      .title({ key: 'projects.title', ns: metadata.name })
      .action('read', (a) =>
        a
          .title({ key: 'projects.read', ns: metadata.name })
          .grant('projects', projects),
      )
      .action('create', (a) =>
        a
          .title({ key: 'projects.create', ns: metadata.name })
          .grant('projects', projects.create(['id', 'name', 'createdAt'])),
      )
      .action('assignTask', (a) =>
        a
          .title({ key: 'projects.assignTask', ns: metadata.name })
          .grant('tasks', tasks)
          .grant('projects', projects),
      ),
);

export default class TutorialProjectsProvider extends ServiceProvider<Application> {
  public readonly name = 'app/tutorial-projects';
  public override register(): void {
    this.app.container.singleton(
      tutorialProjectServiceToken,
      () =>
        new TutorialProjectService(
          this.app.container.resolve(databaseManagerToken),
        ),
    );
  }
  public override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'tutorialProjects',
      title: { key: 'projects.title', ns: metadata.name },
    });
    const resource = authz.compositeResources.define(projectPermissions);
    authz.ui.place(resource, { section: 'tutorial' });
  }
}
```

</details>

`register()` only registers how the service is created; the database is resolved from the container and the instance created only when the service is actually used. `boot()` registers the project collection and three business actions: view projects, create projects and change a task's project. The last action carries two data scopes, `tasks` and `projects`, which restrict which tasks may be changed and which projects may be chosen.

This registration only tells permission management which capabilities the application offers; it does not create roles or grant permissions to users. The task collection is already registered by `TutorialTasksProvider`, and the new Provider comes after it, reusing the existing tutorial permission section.

Update `server/providers/index.ts`, keeping the existing Provider:

```ts
import TutorialProjectsProvider from './tutorial-projects.js';
import TutorialTasksProvider from './tutorial-tasks.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  TutorialTasksProvider,
  TutorialProjectsProvider,
];

export default serviceProviders;
```

Add the following to the application text object in `client/locales/en-US.ts`:

```ts
projects: {
  title: 'Projects',
  read: 'View projects',
  create: 'Create projects',
  assignTask: 'Change task project',
},
```

Add the corresponding Chinese text in `client/locales/zh-CN.ts`:

```ts
projects: {
  title: '项目',
  read: '查看项目',
  create: '新建项目',
  assignTask: '修改任务项目',
},
```

These are object property fragments to merge into the existing language objects. Do not overwrite other text, and do not edit `client/locales/system/`.

## Check authorization in the endpoints

[Routes and HTTP APIs](apis-and-services.md) has the complete route code ready to copy. It works in this order:

1. Mount `auth.required()` and `authz.middleware()` only on this file's business paths.
2. Use the request's `c.get('authz')` to call `authorize()` for the specific action on `tutorial.projects`.
3. When the decision is a denial, or lacks the data policy the action needs, return `403` immediately.
4. Pass the task policy and the project policy from `decision.conditions.database` to the service separately.
5. The service first looks up records within the policy scope, then performs the update; the paginated list and its total apply the same policy.

Viewing projects and changing a task's project are different actions. Changing the assignment must satisfy both the task scope and the project scope; the project view scope cannot stand in for it, and checking only whether the task is writable is not enough. The security declaration in `describeRoute()` is only API documentation metadata and cannot replace the middleware and policies above.

## Show the capabilities in the permission editor

Append the following entry to the `permissionWorkspaceSelection.business` array in `client/pages/settings/permission-workspace.ts`, keeping the existing task entry:

```ts
{
  type: 'composite',
  id: 'tutorial.projects',
  actions: ['read', 'create', 'assignTask'],
  scopeTitles: {
    tutorialTasks: { key: 'tasks.title' },
    tutorialProjects: { key: 'projects.title' },
  },
},
```

The server declares the permission capabilities, while this client configuration decides which business actions the permission editor shows. Without this step, the API still checks permissions, but administrators cannot configure them in the current editor.

## Configure roles and data scopes

Administrators create or edit roles in **System settings → Permission management**: find **Projects** in the existing task business section and select **View projects**, **Create projects** or **Change task project**. For changing assignments, configure the task and project data scopes separately. Then assign the role to specific test users in **Users**.

![Project business permissions: View projects, Create projects and Change task project selected, with separate data scopes for tasks and projects](/assets/core/developing-apps/apis-and-services/project-permissions.png)

The screenshot shows an unsaved **Project coordinator** role under **Business operations → Projects**, using **All Records** for demonstration. When granting access for real, choose scopes that fit the role's responsibilities, save, and then assign the role to specific users.

Users who need the existing task page also need that page's access permission and the relevant task action permissions. Page permissions do not authorize APIs automatically, and project actions do not grant user administration.

The tests in this guide use the real authorization service to create roles and assign them to isolated test accounts. In a real application, roles are configured by administrators; do not write business permissions into the `member` role that every signed-in user inherits by default.

## Verify with ordinary users

| Scenario | Expected result |
| --- | --- |
| Not signed in | `401`, nothing written |
| Signed in without the permission to change assignments | `403` |
| Action permitted, but the task does not exist or is outside the task scope | The same `404` either way, revealing no hidden records |
| Task changeable, but the target project does not exist or is outside the selectable scope | The same `400 PROJECT_UNAVAILABLE` either way, with the existing association unchanged |
| Both scopes allow it | The change succeeds; reading again confirms it was saved |
| Requesting again after the action is revoked from the role | Rejected, without reusing the earlier authorization result |

An administrator succeeding does not prove ordinary users' data scopes are correct. Download the [complete endpoint test](/assets/core/downloads/tutorial-tasks-project-api.test.ts) and run it with the historical example setup from [Routes and HTTP APIs](apis-and-services.md); the test uses real authentication, real permission services and an isolated database.

For stable API error identifiers and field feedback, see [Request validation and error handling](request-validation-and-errors.md).
