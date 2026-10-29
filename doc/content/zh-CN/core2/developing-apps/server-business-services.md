---
title: 服务端业务服务
description: 组织应用的业务规则，通过 ServiceProvider 注册依赖，并在 HTTP、命令和任务中复用。
---

三者分工明确：业务服务负责一项操作的业务规则，路由负责把 HTTP 请求转换为对服务的调用，Provider 负责组织依赖。简单的计算直接写成函数即可；当多个入口要复用同一段逻辑，或者操作需要数据库、事务和其他服务时，再提取为服务类。

## 文件怎样组织

`server/providers/` 是模板已有的注册入口，业务类可以和相关的 Provider 放在一起。规模变大后，也可以自行创建 `server/services/`，把实现移到那里，Provider 仍留在 `server/providers/`。目录本身没有自动扫描或注册的规则，真正决定是否接入的是 import 路径和 `server/providers/index.ts`。

本篇保留项目示例原有的 `server/providers/tutorial-project-service.ts`，方便与数据库篇和页面篇配合阅读。

## 示例前提

项目与任务示例沿用默认模板 `1.0.0-beta.78`，使用 `tutorialTasks` 和 `tutorialProjects` 两张表。运行前需要先按 [建表与数据初始化](data-models-and-migrations.md#准备示例应用) 准备一个独立的应用，其中包括有访问权限的 `nocobase/app-tutorials` 私有仓库；它不能直接接在当前入门教程的 `tasks` 示例之后运行。没有该仓库的访问权限，也可以阅读代码和职责说明。

## 编写业务服务

新建 `server/providers/tutorial-project-service.ts`。完整代码如下，展开后可以直接复制：

<details>
<summary>项目业务服务</summary>

```ts
import { randomUUID } from 'node:crypto';
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export interface ProjectView {
  id: string;
  name: string;
  createdAt: string;
}
export interface TaskProjectView {
  id: string;
  projectId: string | null;
  updatedAt: string;
}
export class ProjectUnavailableError extends Error {
  constructor() {
    super('The selected project is unavailable.');
  }
}
export class TaskUnavailableError extends Error {
  constructor() {
    super('The task is unavailable.');
  }
}
const projectView = (row: Record<string, unknown>): ProjectView => ({
  id: String(row.id),
  name: String(row.name),
  createdAt: new Date(row.createdAt as string | Date).toISOString(),
});

export class TutorialProjectService {
  constructor(private readonly database: DatabaseManager) {}

  async list(
    policy: RepositoryPolicy,
    input: { page: number; pageSize: number },
  ) {
    const projects = this.database
      .repository('tutorialProjects')
      .withPolicy(policy);
    const rows = await projects.findMany({
      select: (s) => s.fields('id', 'name', 'createdAt'),
      limit: input.pageSize,
      offset: (input.page - 1) * input.pageSize,
      sort: (s) => [s.field('createdAt').desc(), s.field('id').desc()],
    });
    return {
      data: rows.map(projectView),
      meta: { ...input, total: await projects.count() },
    };
  }

  async create(
    policy: RepositoryPolicy,
    input: { name: string },
  ): Promise<ProjectView> {
    const result = await this.database
      .repository('tutorialProjects')
      .withPolicy(policy)
      .createOne({
        select: (s) => s.fields('id', 'name', 'createdAt'),
        values: { id: randomUUID(), name: input.name, createdAt: new Date() },
      });
    return projectView(result.record);
  }

  async assignTask(
    policies: { tasks: RepositoryPolicy; projects: RepositoryPolicy },
    taskId: string,
    projectId: string | null,
  ): Promise<TaskProjectView> {
    return this.database.transaction(async (connection) => {
      const tasks = connection
        .repository('tutorialTasks')
        .withPolicy(policies.tasks);
      const task = await tasks.findOne({
        filter: { id: taskId },
        select: (s) => s.fields('id'),
      });
      if (!task) throw new TaskUnavailableError();
      if (projectId !== null) {
        const project = await connection
          .repository('tutorialProjects')
          .withPolicy(policies.projects)
          .findOne({
            filter: { id: projectId },
            select: (s) => s.fields('id'),
          });
        if (!project) throw new ProjectUnavailableError();
      }
      const result = await tasks.updateOne({
        select: (s) => s.fields('id', 'projectId', 'updatedAt'),
        filter: { id: taskId },
        values: { projectId, updatedAt: new Date() },
      });
      return {
        id: taskId,
        projectId: result.record.projectId as string | null,
        updatedAt: new Date(
          result.record.updatedAt as string | Date,
        ).toISOString(),
      };
    });
  }
}
```

</details>

`list()` 先用 `withPolicy()` 限定可读的记录，再进行分页、排序和总数统计。排序中包含唯一的 `id`，这样多个项目创建时间相同时，翻页顺序也保持稳定。它只返回明确选择的字段，并把时间转换为 ISO 字符串。

`create()` 由服务器生成 ID 和创建时间，调用方只提供名称。创建项目并不会给创建者增加新的权限；之后能否查询到它，仍取决于角色中配置的查看权限和数据范围。

`assignTask()` 在同一个事务中读取任务、检查目标项目，然后更新任务。两类记录分别使用各自的策略：能修改某条任务，不代表能选择任意项目；能在项目列表中看到某个项目，也不代表能在这个操作中选择它。解除关联时不需要查找目标项目，但仍然需要“修改项目归属”的操作权限和任务范围。

服务抛出的 `ProjectUnavailableError` 和 `TaskUnavailableError` 属于业务错误，稍后由路由转换为 API 错误。Repository 自身产生的权限错误、记录不存在等错误交给框架处理，不必把所有异常统一捕获成“请求成功”或“参数错误”。

## 注册与调用

用 `createServiceToken<TutorialProjectService>()` 声明依赖契约，在 `ServiceProvider.register()` 中通过 `container.singleton()` 注册创建函数。创建函数从 `databaseManagerToken` 取得应用数据库，路由再通过同一个 Token 解析出服务。完整的 `server/providers/tutorial-projects.ts` 和入口注册代码见 [认证、权限与数据范围](authentication-and-permissions.md)。这个 Provider 同时声明了本例的业务操作，不能只复制服务注册部分而漏掉授权配置。

Provider 的三个生命周期方法各有分工：`register()` 描述依赖如何创建，`boot()` 处理需要其他服务就绪后才能做的工作，`shutdown()` 释放该 Provider 自己创建的执行器或订阅。使用数据库服务并不意味着拥有数据库连接的生命周期，因此不应关闭共享的数据库。完整机制见 [ServiceProvider 与服务生命周期](../extension-development/service-provider.md) 和 [服务容器](../framework/services/container.md)。

较新版本默认模板的 `server/providers/index.ts` 中还有 `SubmissionProvider`，追加自己的 Provider 时请保留它。它负责 Repository 写入的幂等配置和回执清理，并不是可以被业务示例替换掉的占位项。

## 请求状态通过参数传递

单例服务会被多个请求共用，所以不要把当前用户、权限策略、事务连接或请求输入保存到服务的字段中。上例把 `RepositoryPolicy` 和已校验的参数作为方法参数传入；策略必须来自可信的授权结果，不能直接使用客户端提交的对象。

身份和策略由 HTTP 路由负责取得。CLI、任务和定时执行没有浏览器请求，需要自行定义执行者和允许的数据范围。复用服务既不会自动获得原请求的身份，也不会自动变成管理员。如果任务需要延后执行，还要决定执行时是否重新检查权限。

## 事务与外部效果

`assignTask()` 使用事务回调提供的连接完成读取和更新。不要在回调中混用事务之外的 Repository，也不要把事务连接保存到单例的字段中。

事务保证这一组数据库操作一起提交或一起回滚，但本例没有实现版本前置条件。两个人先后修改同一条任务时，后一次成功的写入会覆盖前一次。如果需要冲突保护，请另外加入并验证版本条件，见 [事务与数据一致性](transactions-and-consistency.md)。

发送邮件、投递任务等外部效果不会随数据库回滚。通常的做法是先提交，再触发外部效果；如果需要保证提交后最终一定投递，应把待投递的记录和业务变更一起持久化，并设计恢复流程。后台执行的接入方式见 [后台任务与定时执行](background-tasks.md)。

## 验证

- 列表和总数使用相同的策略，分页只返回允许的字段。
- 目标项目不可选时，任务原有的关联保持不变。
- 不同请求传入不同的策略时，服务之间不会共享用户状态。
- CLI 或任务调用时，遵守各自的执行身份和数据范围。

除了规则测试，还应使用真实的数据库和权限服务验证事务及数据范围；项目示例完整的接口测试见 [路由与 HTTP 接口](apis-and-services.md)。
