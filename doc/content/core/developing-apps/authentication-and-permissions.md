---
title: Authentication, permissions and data scopes
description: Authenticate application endpoints, declare business operations and enforce authorization through record and field policies.
---

The server must establish who is calling, whether the operation is allowed, and which records and fields it may access. Pages and buttons can reflect permissions, but endpoints must enforce them independently.

## Three checks

| Check | Implementation in this example |
| --- | --- |
| Authentication | `auth.required()` from `authenticationToken`; unauthenticated requests receive `401` |
| Operation authorization | `authz.middleware()` creates the request authorization context, then `authorize()` decides; denied actions receive `403` |
| Record and field scopes | Pass the decision's `RepositoryPolicy` into the service and bind it to each Repository operation |

See [Using plugins](../using-plugins/overview.md) for plugin integration. This guide focuses on application code.

## Prerequisites

The project/task example retains default template `1.0.0-beta.78` and its `tutorialTasks`/`tutorialProjects` collections. Follow [Create tables and initialize data](data-models-and-migrations.md#prepare-the-example-application) to prepare a separate app, including access to the private `nocobase/app-tutorials` repository. It does not continue the current getting-started `tasks` example. You can still read the code and responsibility boundaries without repository access.

First implement `TutorialProjectService` from [historical project service source](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/core/developing-apps/server-business-services.md). The original example already has authentication, authorization and users plugins plus `TutorialTasksProvider`. The following adds project capabilities.

## Declare operations and register the service

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

`register()` binds the service factory. The container resolves the database and constructs the service when needed. `boot()` registers the project collection and three actions: view projects, create projects and change a task's project. The last action has separate `tasks` and `projects` scopes for editable tasks and selectable projects.

Registration only describes available capabilities; it creates no role assignments. `TutorialTasksProvider` already registers the task collection. Keep the new provider after it to reuse the existing tutorial permission section.

Update `server/providers/index.ts`, retaining the existing provider:

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

Add these properties to the application locale object in `client/locales/en-US.ts`:

```ts
projects: {
  title: 'Projects',
  read: 'View projects',
  create: 'Create projects',
  assignTask: 'Change task project',
},
```

Add the corresponding properties in `client/locales/zh-CN.ts`:

```ts
projects: {
  title: '项目',
  read: '查看项目',
  create: '新建项目',
  assignTask: '修改任务项目',
},
```

These are object-property fragments. Merge them into the existing locale objects; do not replace other copy or edit `client/locales/system/`.

## Enforce authorization in endpoints

[Historical project API example](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/core/developing-apps/apis-and-services.md) retains the complete route implementation. The sequence is:

1. Mount `auth.required()` and `authz.middleware()` on this contribution's business paths.
2. Use `c.get('authz')` to `authorize()` the specific action on `tutorial.projects`.
3. Return `403` for a denial or a missing policy required by the operation.
4. Pass the task and project policies from `decision.conditions.database` separately into the service.
5. Query within those scopes before updating. Apply matching policies to list rows and totals too.

Viewing projects and changing task assignments are different actions. Assignment requires both task and project scopes; a project-view policy or a task-write check alone is insufficient. `describeRoute()` security declarations describe the API and do not enforce middleware or policies.

## Expose capabilities in the permission editor

Append this entry to `permissionWorkspaceSelection.business` in `client/pages/settings/permission-workspace.ts`, keeping the existing task entry:

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

Server declarations define capabilities; this client configuration selects the business operations shown by the permission editor. Without it, the API enforces permissions that administrators cannot configure through the current editor.

## Configure roles and data scopes

An administrator can create or edit a role under System settings → Permission management. Find Projects in the existing task business section and select View projects, Create projects or Change task project. For assignment, configure task and project record scopes separately. Assign the role to named test users through Users.

![Project business permissions with View projects, Create projects and Change task project selected, including separate task and project scopes](/assets/core/developing-apps/apis-and-services/project-permissions.png)

The screenshot shows an unsaved **Project coordinator** role under **Business operations → Projects**. **All Records** is selected for this local demonstration. Choose scopes appropriate to the role's responsibilities, save the role, then assign it to specific users.

Users who need the existing task page also need its page permission and the relevant task actions. Page access does not authorize API calls, and project operations do not grant user-administration access.

The tests below create roles and assign them to isolated users through the real authorization service. Administrators configure roles in the actual application; do not add business grants to the inherited `member` role.

## Verify with ordinary users

| Scenario | Expected result |
| --- | --- |
| Unauthenticated | `401`, no write |
| Authenticated without assignment permission | `403` |
| Action allowed, task missing or outside task scope | The same `404`, without revealing hidden records |
| Task writable, target project missing or outside selection scope | The same `400 PROJECT_UNAVAILABLE`, preserving the old association |
| Both scopes allow the operation | Successful update, confirmed by reading it back |
| Request after revoking the action from the role | Denied, without reusing an earlier authorization decision |

Administrator success does not verify ordinary users' scopes. Download the [complete endpoint tests](/assets/core/downloads/tutorial-tasks-project-api.test.ts) and run them with the historical setup in [Historical project API example](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/core/developing-apps/apis-and-services.md). They use real authentication, authorization and isolated databases.

See [Request validation and error handling](request-validation-and-errors.md) for stable error identifiers and field feedback.
