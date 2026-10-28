---
title: 数据模型与迁移
description: 用迁移管理字段、关系与约束，区分结构变更、初始化数据和生成的 Collection 文件。
---

数据模型决定应用保存什么，以及数据库必须保证哪些规则。在 NocoBase 应用中，用迁移记录结构变化，用 Repository 访问数据；`database/main/collections/` 是生成的模型快照，不是手写模型的入口。

本篇以“任务可以属于一个项目”为例，说明如何设计字段、关系与约束，并在已有数据上演进模型。可以直接查阅各部分约定；要运行示例，再按下方说明准备应用。

## 结构、初始数据与业务记录

| 要做的事 | 放在哪里 | 处理原则 |
| --- | --- | --- |
| 增加字段、关系、索引或约束 | `database/main/migrations/` | 新增迁移，明确对旧数据的影响 |
| 随版本补齐历史数据 | 迁移 | 明确转换规则，不猜测业务归属 |
| 写入应用运行必需的初始数据 | `database/main/seeds/` | 与用户日常创建的记录区分，不反复覆盖用户修改 |
| 提供可选演示数据 | 标记为 sample 的 seed | 由使用者明确选择是否载入 |
| 创建或修改日常业务记录 | 业务服务和接口 | 校验输入与权限，再通过 Repository 读写 |
| 查看解析后的 Collection | `database/main/collections/` | 由工具生成和校验，不手动编辑 |

项目名称是用户填写的业务数据，因此本例不添加项目种子。业务角色也不能为了让示例可用而自动分配给所有已登录用户。

## 设计字段和关系时先回答什么

先明确必填和唯一是否是业务规则、历史记录是否能满足新规则、关联对象删除时如何处理，再选择字段和约束。不要仅根据表单当前长什么样来决定数据库结构。

例如，“项目名称必填”不意味着名称必须唯一；“任务可以归入项目”也不意味着旧任务必须立即有项目。数据库外键保证引用有效，接口校验负责名称内容等输入规则，权限检查负责当前用户是否可以使用这个项目。这些检查不能互相替代。

## 准备示例应用

项目专题沿用独立的历史示例：`tutorialTasks` 保存任务，`tutorialProjects` 保存项目，任务使用 `completed` 表示完成状态。当前[入门示例](../tutorials/build-your-first-feature.md)则使用 `tasks` 和三阶段 `status`，两者不是同一套代码。运行本专题时使用下方指定的旧标签和配套配置；不要直接把这些迁移应用到入门示例的数据库。

<details>
<summary>获取并配置本文的示例应用</summary>

本篇接着 [app-tutorials 的 `04-task-due-date` 阶段](https://github.com/nocobase/app-tutorials/tree/04-task-due-date)开发，基于默认模板 `1.0.0-beta.78`。仓库为私有，需要访问权限。已经完成这一阶段的读者可以在原项目中继续；从头开始时，在一个新目录获取这一阶段：

```bash
git clone --branch 04-task-due-date https://github.com/nocobase/app-tutorials.git team-tasks
cd team-tasks
git switch -c feat/task-projects
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
```

使用 Node.js 24 和 pnpm 11。已有项目不必重新初始化配置，也不要把已有数据库配给更早版本的代码。以下代码和命令均在应用根目录使用；本篇验证的数据库为 SQLite。

</details>

## 示例：项目与任务的关系

本次只引入最小的项目模型：

- `tutorialProjects.id`：项目 ID，字符串主键，与任务现有的 ID 类型保持一致。
- `tutorialProjects.name`：项目名称，必填，最长 120 个字符；允许不同项目使用相同名称。
- `tutorialProjects.createdAt`：创建时间，由创建项目的业务代码提供。
- `tutorialTasks.projectId`：可空的项目 ID。一个项目可以有多个任务，一条任务最多属于一个项目。

任务保存项目 ID，读取时再取得项目名称。这样项目改名不需要逐条更新任务，也不会因同名项目而混淆归属。

旧任务没有可靠的项目归属，因此新字段先允许为空，表示“尚未归入项目”。迁移不猜测归属，也不创建一个默认项目接收所有历史任务。对于已经被任务引用的项目，本例拒绝删除；业务上可以先转移或解除关联，再删除项目。

## 使用 Agent

在应用目录中把本篇作为参考交给 Agent，再描述下面的需求。字段、接口和组件的具体约定见手动步骤，由 Agent 结合项目指引处理。

```text
请给现有任务应用增加“项目”，这一轮先只完成数据存储，不增加页面和接口。

每个项目需要有名称和创建时间，名称必填。
一个项目可以包含多个任务，每个任务最多属于一个项目，也可以不属于任何项目。
原有任务继续保留，暂时不关联项目。

任务不能关联到不存在的项目；还有任务归属的项目不能被删除。
后续读取任务时，需要能够同时获取它所属的项目信息。
请按项目已有的数据变更指引实现，不清空数据库，也不改写以前已经执行过的数据变更。

请用独立测试数据验证这些规则，以及旧任务是否仍能正常使用。
同时说明撤销这次变更会失去哪些数据，只在测试环境验证撤销和重新应用。
这一轮不添加示例项目，也不改变用户权限。
完成后告诉我改了什么、验证了什么。
```

检查 Agent 的结果时，除了看新增表和字段，还要看已有数据是否保留、约束是否真正生效，以及测试是否使用了真实数据库。可以对照下面的实现。

## 不使用 Agent

### 编写自包含的迁移

新建 `database/main/migrations/202610240004_add_task_projects.ts`：

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610240004_add_task_projects',
  async up({ builder }) {
    await builder.createCollection('tutorialProjects', (collection) => {
      collection.string('id', {
        length: 36,
        primaryKey: true,
        nullable: false,
      });
      collection.string('name', { length: 120, nullable: false });
      collection.datetime('createdAt', { nullable: false });
    });
    await builder.alterCollection('tutorialTasks', (collection) => {
      collection.string('projectId', { length: 36, nullable: true });
      collection.foreignKey('projectId', {
        name: 'fk_tutorial_tasks_project',
        references: { collection: 'tutorialProjects', fields: ['id'] },
        onDelete: 'restrict',
      });
      collection.index('projectId', { name: 'idx_tutorial_tasks_project' });
    });
    await builder.addField('tutorialTasks', {
      name: 'project',
      type: 'belongsTo',
      target: 'tutorialProjects',
      targetKey: 'id',
      foreignKey: 'projectId',
      constraints: false,
    });
  },
  async down({ builder }) {
    await builder.dropField('tutorialTasks', 'project');
    await builder.dropConstraint('tutorialTasks', 'fk_tutorial_tasks_project');
    await builder.dropIndex('tutorialTasks', 'idx_tutorial_tasks_project');
    await builder.dropField('tutorialTasks', 'projectId');
    await builder.dropCollection('tutorialProjects');
  },
});
```

文件名去掉 `.ts` 后与 `name` 一致，并排在已有任务迁移之后。迁移中的表、字段和约束直接写在文件里，不从不断演进的业务服务或模型文件导入。

`up()` 先创建项目表，再扩展任务表。`down()` 按依赖关系反向移除，保留任务原有字段和记录，但会删除项目数据及任务的项目归属。它是结构上的逆操作，不是恢复业务数据的备份。

### 区分字段、关联和约束

这份迁移为同一个业务关系定义了三个部分：

- **字段 `projectId`**：真正保存到任务表中的项目 ID。`nullable: true` 使旧任务和未归入项目的新任务继续有效。
- **关联 `project`**：告诉 Repository 如何从任务读取项目，`foreignKey` 指向上面已经存在的字段，`targetKey` 指向项目的主键。它不会另外保存一份项目名称。
- **外键约束**：由数据库保证非空的 `projectId` 必须指向存在的项目，并通过 `onDelete: 'restrict'` 拒绝删除仍被引用的项目。

这里已经显式创建并命名了外键，所以关联声明使用 `constraints: false`，避免再次创建约束；这不等于数据库没有外键。显式命名也让 `down()` 能准确移除该约束。

`projectId` 上的普通索引用于后续按项目筛选任务，不设唯一索引，因为同一个项目可以拥有多条任务。索引服务于查询，外键保证引用有效，二者承担不同职责。

字段声明也不替代接口的输入校验。例如，`nullable: false` 不会拒绝空白名称，各数据库对字符串长度的处理也可能不同；接口仍需要检查去除首尾空格后的名称和长度。

### 应用迁移与生成 Collection

先检查当前应用配置指向的数据库，再运行：

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

在已经运行过上一阶段的数据库中，计划应包含这份新迁移；在新建数据库中，计划还会包含此前尚未执行的应用及插件迁移、种子。`db apply` 先执行待运行的迁移，再执行待运行的种子，不只处理当前新增文件。

再次运行相同命令，已经成功执行的迁移不会重复执行。已有数据库中的任务保留标题、完成状态、负责人和截止日期，新增的 `projectId` 为 `null`。

命令会刷新 `database/main/collections/` 下的模型快照。可以查看：

```text
database/main/collections/
├── tutorialProjects/
│   ├── collection.json
│   ├── metadata.json
│   └── schema.json
└── tutorialTasks/
    ├── collection.json
    ├── metadata.json
    └── schema.json
```

这些文件用于查看数据库实际解析出的模型，是可再生成的缓存。不要手动修改它们，也不要从迁移中导入它们。验证缓存与数据库是否一致：

```bash
pnpm nocobase collections generate --check
```

## 用真实数据库验证

新增 `tests/database/tutorial-tasks-projects.test.ts`。下面的测试先应用较早的迁移并插入一条旧任务，再应用本次迁移，检查模型与数据，最后回滚并重新应用。`describeMigration()` 管理隔离数据库和清理，不操作你的开发数据库。

<details>
<summary>完整迁移测试</summary>

```ts
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';
import { describeMigration } from '@nocobase/app-testing/server';
import metadata from '../../package.json' with { type: 'json' };

describeMigration('202610240004_add_task_projects', {
  sources: [
    {
      packageName: metadata.name,
      directory: fileURLToPath(
        new URL('../../database/main/migrations/', import.meta.url),
      ),
    },
  ],
  before: async ({ connection }) => {
    await connection.repository('tutorialTasks').createOne({
      values: {
        id: 'existing-task',
        title: 'Prepare the launch checklist',
        completed: true,
        assigneeId: 'existing-assignee',
        dueDate: '2026-11-01',
        updatedAt: new Date('2026-10-24T00:00:00Z'),
      },
    });
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('tutorialProjects').toHaveField('name', {
      type: 'string',
      nullable: false,
    });
    await expectCollection('tutorialTasks').toHaveField('projectId', {
      type: 'string',
      nullable: true,
    });
    await expectCollection('tutorialTasks').toHaveIndex(['projectId']);
    await expectCollection('tutorialTasks').toHaveForeignKey(
      ['projectId'],
      'tutorialProjects',
      { referencedFields: ['id'], onDelete: 'restrict' },
    );
    const tasks = connection.repository('tutorialTasks');
    expect(
      await tasks.findOne({ filter: { id: 'existing-task' } }),
    ).toMatchObject({
      title: 'Prepare the launch checklist',
      completed: true,
      assigneeId: 'existing-assignee',
      dueDate: '2026-11-01',
      projectId: null,
    });
    const projects = connection.repository('tutorialProjects');
    await projects.createOne({
      values: {
        id: 'launch-project',
        name: 'Product launch',
        createdAt: new Date('2026-10-24T00:00:00Z'),
      },
    });
    await tasks.updateOne({
      filter: { id: 'existing-task' },
      values: { projectId: 'launch-project' },
    });
    expect(
      await tasks.findOne({
        filter: { id: 'existing-task' },
        select: (s) =>
          s
            .fields('id', 'projectId')
            .include('project', (p) => p.fields('id', 'name')),
      }),
    ).toMatchObject({
      project: { id: 'launch-project', name: 'Product launch' },
    });
    await expect(
      tasks.updateOne({
        filter: { id: 'existing-task' },
        values: { projectId: 'missing-project' },
      }),
    ).rejects.toThrow();
    await expect(
      projects.deleteOne({ filter: { id: 'launch-project' } }),
    ).rejects.toThrow();
    expect(
      await tasks.findOne({ filter: { id: 'existing-task' } }),
    ).toMatchObject({
      projectId: 'launch-project',
    });
  },
  down: async ({ connection, expectCollection }) => {
    await expectCollection('tutorialProjects').not.toExist();
    await expectCollection('tutorialTasks').not.toHaveField('projectId');
    const collection = await connection.collections.get('tutorialTasks');
    expect(collection?.fields.some((field) => field.name === 'project')).toBe(
      false,
    );
    expect(
      await connection
        .repository('tutorialTasks')
        .findOne({ filter: { id: 'existing-task' } }),
    ).toMatchObject({
      title: 'Prepare the launch checklist',
      completed: true,
      assigneeId: 'existing-assignee',
      dueDate: '2026-11-01',
    });
  },
});
```

</details>

运行本章测试，再运行已有任务的数据库和接口测试：

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/database/tutorial-tasks-projects.test.ts
pnpm exec vitest run --config vitest.tutorial.config.ts
```

本章测试应出现在结果中，不能把“没有发现测试”当作通过。测试会验证：

- 升级后旧任务的业务字段保留，`projectId` 为空。
- 索引和外键实际存在，任务能关联项目并通过 Repository 读取项目名称。
- 不存在的项目 ID 被拒绝，仍被任务引用的项目不能删除，失败后原关联保留。
- 回滚移除新增模型但保留原任务，随后可以重新应用迁移。

测试中的 `repository()` 直接用于隔离数据库验证。正式接口必须检查调用者权限，再使用带有相应策略的 Repository；外键只能证明项目存在，不能证明当前用户可以访问或选择该项目。

## 模型继续演进时

**已经合并或发布的迁移保持不变。** 新增字段、修改约束或修复历史迁移时，再添加一份迁移。修改已执行文件不会让 `db apply` 自动重跑它，也不能靠重置数据库验证真实升级是否保留了数据。

如果以后要求每条任务必须有项目，先确定旧任务的归属，完成数据补齐并验证没有空值，再用后续迁移改为非空。补齐现有数据属于迁移；不要用种子反复覆盖用户已修改的任务。

种子用于应用运行所必需的初始数据。本章的项目是用户创建的业务记录，因此不添加种子。若需要演示内容，应明确使用可选的 sample seed，让新安装是否载入示例数据成为显式选择。

## 继续阅读

[业务服务与 HTTP 接口](apis-and-services.md)说明怎样把数据操作开放给页面：校验输入、检查项目与任务的权限，并把业务错误转换为一致的 API 错误。[应用开发概览](overview.md)介绍这些部分如何连起来。
