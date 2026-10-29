---
title: 认证、权限与数据范围
description: 为应用接口接入身份认证，声明业务操作，并把授权结果落实到数据访问和字段限制上。
---

服务端需要回答三个不同的问题：谁在调用？是否允许这项操作？允许处理哪些记录和字段？页面入口和按钮可以反映权限，但接口必须独立完成检查。

## 三层检查

| 检查 | 本例的实现 |
| --- | --- |
| 身份认证 | 由 `authenticationToken` 提供的 `auth.required()`；未登录时返回 `401` |
| 操作授权 | `authz.middleware()` 建立请求的授权上下文，再调用 `authorize()`；被拒绝时返回 `403` |
| 数据与字段范围 | 把授权决策中的 `RepositoryPolicy` 传给服务，绑定到每一次 Repository 操作 |

插件安装、角色管理界面等内容，请统一从 [使用插件](../using-plugins/overview.md) 进入；本篇只关注应用如何接入。

## 示例前提

项目与任务示例沿用默认模板 `1.0.0-beta.78`，使用 `tutorialTasks` 和 `tutorialProjects` 两张表。运行前需要先按 [建表与数据初始化](data-models-and-migrations.md#准备示例应用) 准备一个独立的应用，其中包括有访问权限的 `nocobase/app-tutorials` 私有仓库；它不能直接接在当前入门教程的 `tasks` 示例之后运行。没有该仓库的访问权限，也可以阅读代码和职责说明。

请先实现 [服务端业务服务](server-business-services.md) 中的 `TutorialProjectService`。原示例已经具备认证、权限、用户插件和 `TutorialTasksProvider`，下文只新增项目相关的能力。

## 声明业务操作并注册服务

新建 `server/providers/tutorial-projects.ts`：

<details>
<summary>Provider 与权限声明</summary>

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

`register()` 只注册服务的创建方式，真正使用时才从容器解析数据库并创建实例。`boot()` 注册项目集合和三项业务操作：查看项目、新建项目、修改任务项目。最后一项包含 `tasks` 和 `projects` 两个数据范围，分别限制能修改哪些任务、能选择哪些项目。

这里的注册只是让权限管理知道应用提供了哪些能力，并不会自动创建角色或把权限分配给用户。任务集合已经由 `TutorialTasksProvider` 注册，新的 Provider 排在它之后，复用已有的教程权限分组。

更新 `server/providers/index.ts`，保留已有的 Provider：

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

在 `client/locales/en-US.ts` 的应用文案对象中添加：

```ts
projects: {
  title: 'Projects',
  read: 'View projects',
  create: 'Create projects',
  assignTask: 'Change task project',
},
```

在 `client/locales/zh-CN.ts` 中添加对应的中文文案：

```ts
projects: {
  title: '项目',
  read: '查看项目',
  create: '新建项目',
  assignTask: '修改任务项目',
},
```

这些都是对象属性片段，加入已有的语言对象即可。不要覆盖其他文案，也不要编辑 `client/locales/system/`。

## 在接口中检查授权

[路由与 HTTP 接口](apis-and-services.md) 中有完整、可复制的路由代码，其处理顺序如下：

1. 只在本文件的业务路径上挂载 `auth.required()` 和 `authz.middleware()`。
2. 用请求中的 `c.get('authz')`，针对 `tutorial.projects` 的具体 action 调用 `authorize()`。
3. 决策为拒绝，或者决策缺少这项操作所需的数据策略时，立即返回 `403`。
4. 把 `decision.conditions.database` 中的任务策略和项目策略分别传给服务。
5. 服务先在策略范围内查找记录，再执行更新；分页列表和总数也应用同一个策略。

“查看项目”和“修改任务归属”是两个不同的操作。修改归属需要同时满足任务和项目两侧的范围，不能用查看项目的范围代替，也不能只检查任务是否可写。`describeRoute()` 中的安全声明只是 API 文档的元数据，不能代替上面的中间件和策略。

## 在权限编辑器中展示能力

在 `client/pages/settings/permission-workspace.ts` 的 `permissionWorkspaceSelection.business` 数组中追加下面的条目，并保留已有的任务条目：

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

服务端负责声明权限能力，前端的这份配置则决定权限编辑器展示哪些业务操作。缺少这一步，API 虽然仍会检查权限，管理员却无法在当前编辑器中配置它。

## 配置角色与数据范围

管理员可以在“系统设置 → 权限管理”中创建或编辑角色：在现有的任务业务分组中找到“项目”，勾选“查看项目”“新建项目”或“修改任务项目”。对于修改归属，要分别配置任务和项目的数据范围。然后在“用户”管理中，把角色分配给明确的测试用户。

![项目业务权限：勾选查看项目、新建项目和修改任务项目，并分别设置任务与项目的数据范围](/assets/core/developing-apps/apis-and-services/project-permissions.png)

截图使用英文界面：**Business operations → Projects** 对应“业务操作 → 项目”，**Change task project** 对应“修改任务项目”。图中是一个尚未保存的 **Project coordinator** 角色配置，为了演示使用了 **All Records**；实际授权时应按职责选择范围，保存后再分配给指定用户。

需要访问原有任务页面的用户，还要具备该页面的访问权限和相应的任务操作权限。页面权限不会自动授权 API，项目操作也不会授予用户管理权限。

本篇的测试使用真实的授权服务，为隔离的测试账号创建并分配角色。实际应用中的角色由管理员配置；不要把业务权限写进所有已登录用户默认继承的 `member` 角色。

## 用普通用户验证

| 场景 | 预期结果 |
| --- | --- |
| 未登录 | `401`，不写入数据 |
| 已登录，但没有修改归属的操作权限 | `403` |
| 有操作权限，但任务不存在或不在任务范围内 | 相同的 `404`，不透露隐藏的记录 |
| 任务可以修改，但目标项目不存在或不在可选范围内 | 相同的 `400 PROJECT_UNAVAILABLE`，原有关联保持不变 |
| 两侧范围都允许 | 修改成功；再次读取，确认已保存 |
| 撤销角色中的这项操作后再次请求 | 被拒绝，不会沿用之前的授权结果 |

管理员能操作成功，并不代表普通用户的数据范围是正确的。下载 [完整的接口测试](/assets/core/downloads/tutorial-tasks-project-api.test.ts)，按 [路由与 HTTP 接口](apis-and-services.md) 中的历史示例配置运行；该测试使用真实的认证、权限服务和隔离的数据库。

API 错误的稳定标识和字段反馈见 [请求校验与错误处理](request-validation-and-errors.md)。
