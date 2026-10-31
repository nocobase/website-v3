---
title: 服务端业务服务
description: 组织应用业务规则，通过 ServiceProvider 注册依赖，并在 HTTP、命令和任务中复用。
---

业务服务负责一项操作的业务规则，路由负责把 HTTP 请求转换为调用，Provider 负责组织依赖。简单计算可以直接写函数；当多个入口复用逻辑，或操作需要数据库、事务和其他服务时，再提取服务类。

## 文件怎样组织

`server/providers/` 是模板已有的注册入口，业务类可以和相关 Provider 放在一起。规模变大时，也可以自行创建 `server/services/`，把实现移过去，Provider 仍留在 `server/providers/`。目录没有自动扫描或注册规则；导入路径与 `server/providers/index.ts` 才决定实际接入。

本篇保留项目示例原有的 `server/providers/tutorial-project-service.ts`，方便与数据库及页面文章一起使用。

## 示例前提

项目与任务示例沿用默认模板 `1.0.0-beta.78`，使用 `tutorialTasks` 和 `tutorialProjects`。运行需要先按[建表与数据初始化](data-models-and-migrations.md#准备示例应用)准备独立应用，包括有访问权限的 `nocobase/app-tutorials` 私有仓库；它不能直接接在当前入门教程的 `tasks` 示例之后。没有该仓库权限也可以阅读代码与职责说明。

## 编写业务服务

新建 `server/providers/tutorial-project-service.ts`。完整代码如下，展开后可直接复制：

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

`list()` 先通过 `withPolicy()` 限定可读记录，再分页、排序和统计总数。排序包含唯一的 `id`，避免多个项目创建时间相同时，翻页顺序不稳定。它只返回明确选择的字段，并把时间转换为 ISO 字符串。

`create()` 由服务器生成 ID 和创建时间，调用者只提供名称。项目创建不会赋予创建者新的权限；是否能再次查询它，仍取决于角色中配置的查看权限和数据范围。

`assignTask()` 在同一个事务中读取任务、检查目标项目，再更新任务。两类记录分别使用各自的策略：能修改某条任务，不代表能选择任何项目；能在项目列表里查看某个项目，也不代表能在这个操作中选择它。解除关联时不需要查找目标项目，但仍需要修改项目归属的操作权限和任务范围。

服务抛出的 `ProjectUnavailableError`、`TaskUnavailableError` 是业务错误，稍后由路由转换为 API 错误。Repository 自带的权限、记录不存在等错误交给框架处理，不用把所有异常统一捕获成“请求成功”或“参数错误”。

## 注册与调用

使用 `createServiceToken<TutorialProjectService>()` 声明依赖契约，在 `ServiceProvider.register()` 中用 `container.singleton()` 注册创建函数。创建函数从 `databaseManagerToken` 取得应用数据库；路由再通过同一个 token 解析服务。完整的 `server/providers/tutorial-projects.ts` 和入口注册代码见[认证、权限与数据范围](authentication-and-permissions.md)。该 Provider 同时声明本例业务操作，不能只复制服务注册而漏掉授权配置。

`register()` 描述依赖创建方式，`boot()` 处理需要其他服务就绪的工作，`shutdown()` 释放该 Provider 创建的执行器或订阅。使用数据库服务不代表拥有数据库连接的生命周期，不应关闭共享数据库。完整机制见[ServiceProvider](../extension-development/service-provider.md)和[服务容器与依赖注入](../framework/services/container.md)。

较新默认模板的 `server/providers/index.ts` 还包含 `SubmissionProvider`，追加自己的 Provider 时要保留。它负责 Repository 写入幂等配置和回执清理，不是可以被业务示例替换的占位项。

## 请求状态通过参数传递

单例服务会被多个请求共用。不要把当前用户、权限策略、事务连接或请求输入写入服务字段。上例把 `RepositoryPolicy` 与已校验参数传入方法；策略必须来自可信授权结果，不能直接使用客户端提交的对象。

HTTP 路由负责取得身份与策略。CLI、任务和定时执行没有浏览器请求，应自行定义执行者与允许的数据范围；复用服务不会自动获得原请求的身份，也不会自动成为管理员。任务需要延后执行时，还要决定执行时是否重新检查权限。

## 事务与外部效果

`assignTask()` 使用事务回调里的连接完成读取与更新。不要在回调中混用外部 Repository，也不要把事务连接保存到单例字段中。

事务让这组数据库操作共同提交或回退，但本例没有实现版本前置条件。两人依次修改同一任务时，后一次成功写入会覆盖前一次；需要冲突保护时应另行加入并验证版本条件，见[事务与数据一致性](transactions-and-consistency.md)。

邮件发送和任务投递不随数据库回滚。通常先提交，再触发外部效果；需要保证提交后最终一定投递时，应把待投递记录和业务变更一同持久化，并设计恢复过程。后台执行的接入见[后台任务与定时执行](background-tasks.md)。

## 验证

- 列表与总数使用相同策略，分页只返回允许的字段。
- 目标项目不可选时，任务原关联保持不变。
- 不同请求传入不同策略时，服务不会共享用户状态。
- CLI 或任务调用遵守各自的执行身份与范围。

规则测试之外，使用真实数据库和权限服务验证事务及数据范围；项目示例的完整接口测试在[历史项目接口示例](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/zh-CN/core/developing-apps/apis-and-services.md)。
