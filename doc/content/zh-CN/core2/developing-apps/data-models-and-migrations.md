---
title: 建表与数据初始化
description: 使用 defineMigration、defineSeed 及各自的 Context 建表、初始化记录，并维护后续的结构与数据变更。
---

应用用 `defineMigration()` 描述建表和后续的结构变更，用 `defineSeed()` 安装初始记录。这两个函数都只是定义任务；真正执行时，框架会把当前任务的 Context 传给回调，提供建表、查询和记录操作所需的能力。

本篇先用一张独立的 `appStatuses` 状态表，串起“建表 → 初始化数据 → 执行与验证”的完整流程，不需要历史教程。后半部分的项目与任务案例保留原有的准备条件，用来说明如何修改已有结构。

## 目录与文件约定

```text
database/
└── main/
    ├── migrations/
    │   └── 202611040001_create_app_statuses.ts
    ├── seeds/
    │   └── 202611040002_default_app_statuses.ts
    └── collections/  # Generated; do not edit
```

`main` 是连接名称。迁移和 Seed 文件都默认导出一个任务定义，其 `name` 与文件名（去掉扩展名）一致，并且在同类任务的所有来源中保持唯一。在已有项目中新增任务时，使用排在现有任务之后的新名称。`collections/` 是生成的模型缓存，不是手写模型的入口。

| 要做的事 | 使用方式 |
| --- | --- |
| 建表，修改字段、关系、索引和约束 | Migration |
| 随版本转换或补齐历史记录 | Migration 中的数据操作 |
| 安装默认状态、分类等初始记录 | Seed |
| 用户日常创建和修改业务记录 | 服务端业务服务与接口 |

注意，迁移同样可以修改数据，不能简单理解为“迁移只管建表，所有写入都交给 Seed”。

## 使用 defineMigration 建表

创建 `database/main/migrations/202611040001_create_app_statuses.ts`：

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040001_create_app_statuses',
  async up({ builder }) {
    await builder.createCollection('appStatuses', (collection) => {
      collection.string('code', { length: 32 }).primary().notNull();
      collection.string('title', { length: 100 }).notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('appStatuses');
  },
});
```

`up()` 执行本次变更，`down()` 描述对应的回退。`builder.createCollection()` 声明逻辑集合及其结构，框架会按连接的方言创建物理表。`code` 是稳定的业务键，主键约束防止重复；`title` 保存可以修改的显示名称。

本例的 `down()` 会删除整张表和其中的记录，因此只应在隔离的数据库中验证回退。已发布的迁移保持不变，后续的修改通过新增文件完成。`transaction`、`irreversible` 和 `shouldRun()` 等选项见 [迁移机制](../framework/database/migrations.md)；简单的建表不需要先配置全部选项。

## 使用 Migration Context

`up(context)` 和 `down(context)` 接收 `MigrationContext`。上例中的 `{ builder }` 只是从 Context 中解构出需要的成员；需要处理历史数据时，再使用同一个 Context 中的 `query`。

| 成员 | 用途与边界 |
| --- | --- |
| `builder` | 创建和调整集合、字段、索引及约束 |
| `query` | 迁移中的数据读取、更新和批量回填，通常是数据操作的首选 |
| `repository(name)` | 需要 Collection 的字段编码、命名覆盖或关联写入时使用；依赖执行时的模型形状 |
| `connection` | 当前连接的名称、方言、能力和底层客户端入口；这是一个受限的接口 |
| `config` | 任务执行方提供的只读配置，通过 `get()` 读取 |
| `container` | 任务执行方提供的服务解析器；不代表完整的应用容器，也不代表所有业务服务都已启动 |
| `configuration`、`parameters` | 来源提供的可选适用性配置和目标参数；普通的应用迁移通常用不到 |

例如，可以在后续某个迁移的 `up({ query })` 中，对已经存在的 `appStatuses` 做一次明确的数据修正：

```ts
await query.updateTable('appStatuses')
  .set({ title: 'Draft' })
  .where('code', '=', 'draft')
  .where('title', '=', 'DRAFT')
  .execute();
```

这是回调内部的片段，前提是目标表已经存在。它只修正约定好的旧值，不会覆盖用户自定义的名称。迁移中的数据操作应基于明确的历史结构，不要导入会随业务代码变化的服务实现。

Migration Context 中的 `connection` 不是完整的 `DatabaseConnection`：不能调用 `connection.repository()`、`connection.builder`，也不能自行调用 `connection.transaction()`。请直接使用 Context 顶层的 `builder`、`query` 和 `repository()`，由执行器负责事务。`client()` 是底层的逃生入口，通常用不到，也不能用来绕过结构管理的限制。

只有当 Query 无法正确表达时，才在迁移中使用 `repository()`，并注明原因；不要让回退逻辑依赖已经变化的 Collection 模型。是否启用事务，还受任务选项和方言能力的约束，不要假设所有数据库的 DDL 都能回滚。

## 使用 defineSeed 初始化数据

创建 `database/main/seeds/202611040002_default_app_statuses.ts`：

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040002_default_app_statuses',
  async run({ repository }) {
    const statuses = repository('appStatuses');
    for (const record of [
      { code: 'draft', title: 'Draft' },
      { code: 'published', title: 'Published' },
    ]) {
      const existing = await statuses.findOne({
        filter: { code: record.code },
        select: (s) => s.fields('code'),
      });
      if (existing) continue;
      await statuses.createOne({ values: record });
    }
  },
});
```

`run()` 执行安装数据的逻辑。本例只补充缺失的记录，保留管理员已经修改过的名称。“先查询、再插入”本身并不能消除并发竞争，最终由主键约束兜底：发生冲突时，让任务失败并回滚，检查后再重试。如果需要“存在则更新”，可以使用 `upsertOne()`，但必须明确允许覆盖哪些字段。

Seed 没有与 Migration 的 `down()` 对应的回退函数，它也不是一个在每次启动时都覆盖配置的同步脚本。

## 使用 Seed Context

`run(context)` 接收 `SeedContext`。安装的记录按 Collection 语义描述，因此通常优先使用 `repository()`：

| 成员 | 用途与边界 |
| --- | --- |
| `repository(name)` | 读写初始记录，可以使用逻辑字段、字段编码和关联写入能力 |
| `query` | 处理 Repository 不适合表达的数据操作，例如访问没有对应 Collection 的表 |
| `connection` | 与 Migration 相同的受限连接接口，不是完整的运行时连接 |
| `config` | 读取任务执行方提供的配置 |
| `container` | 解析执行方允许提供的服务；独立执行器没有提供时为空 |

Seed Context 中没有 `builder`；需要新表或新字段时，请先写迁移。`repository()` 和 `query` 已经绑定到当前任务的连接，启用事务时也会使用当前事务。不要从外部的管理器另外取得 Repository 来写入，否则可能脱离任务的事务。

两种 Context 提供的 Repository 写入都不会触发运行时的 Repository 变更事件。安装或升级时，不能依赖尚未启动的业务监听器来补全数据。

## 执行与验证

确认配置指向的是本地示例数据库后，在应用根目录执行：

```bash
pnpm nocobase db apply --connection main --dry-run
pnpm nocobase db apply --connection main
pnpm nocobase collections generate --connection main --check
```

`db apply` 先运行待执行的迁移，再运行 Seed，其中也可能包含其他应用或插件的资源；`--dry-run` 只预览执行计划。已成功的任务会按历史记录跳过，修改已经执行过的文件并不能让它重新执行。Seed 的默认事务模式为 `auto`：失败时，本次的写入和成功记录会一起回滚，修复问题后再继续即可。

需要验证以下几点：首次执行能建表并写入两条默认记录；重复执行不会重复写入；初始化之前已经存在的自定义记录保持原名称；Seed 写入后抛出错误能够回滚并重试。迁移的回退应在隔离数据库中验证；目标数据库的 DDL、隔离级别和锁行为，需要用对应的方言测试。

## 修改已有结构与数据

已发布的任务保持不可变，字段、约束和历史数据的变化都通过新增迁移来表达。应先补齐旧数据，再收紧非空约束；需要永久保存的用户选择，不能被 Seed 反复覆盖。需要安装新的默认项时，再添加一个更晚的 Seed。

演示数据和必需数据要分开。普通 Seed 不会因为内容是演示记录就自动跳过；需要可选的示例数据时，请显式声明 `sample: true`，并按应用的 sample-data 配置和执行入口加载，详见 [初始数据机制](../framework/database/seeds.md)。测试用的 fixtures、日常导入和环境重置，都不要混进普通的初始化流程。

新增数据库连接见 [多数据库连接](multiple-databases.md)，由外部系统维护的结构见 [接入已有数据库](existing-databases.md)，业务事务见 [事务与数据一致性](transactions-and-consistency.md)，完整的迁移选项见 [迁移机制](../framework/database/migrations.md)。

## 进阶示例：为任务增加项目

下面保留原有的项目专题案例，演示字段、关联、约束和旧数据的保留。它是一个独立的历史应用，与前面的 `appStatuses` 示例没有依赖关系。

### 结构、初始数据与业务记录

| 要做的事 | 放在哪里 | 处理原则 |
| --- | --- | --- |
| 增加字段、关系、索引或约束 | `database/main/migrations/` | 新增迁移，并明确它对旧数据的影响 |
| 随版本补齐历史数据 | 迁移 | 明确转换规则，不猜测业务归属 |
| 写入应用运行必需的初始数据 | `database/main/seeds/` | 与用户日常创建的记录区分开，不反复覆盖用户的修改 |
| 提供可选的演示数据 | 标记为 sample 的 Seed | 由使用者明确选择是否载入 |
| 创建或修改日常业务记录 | 业务服务和接口 | 先校验输入和权限，再通过 Repository 读写 |
| 查看解析后的 Collection | `database/main/collections/` | 由工具生成和校验，不要手动编辑 |

项目名称是用户填写的业务数据，所以本例不添加项目 Seed。同样，也不能为了让示例可以直接使用，就把业务角色自动分配给所有已登录的用户。

### 设计字段和关系前先回答的问题

先弄清楚：必填和唯一是不是业务规则？历史记录能否满足新规则？关联对象被删除时该如何处理？然后再选择字段和约束。不要只根据表单当前的样子来决定数据库结构。

例如，“项目名称必填”并不意味着名称必须唯一；“任务可以归入项目”也不意味着旧任务必须立刻有项目。数据库外键保证引用有效，接口校验负责名称内容等输入规则，权限检查负责判断当前用户能否使用这个项目。这几类检查不能互相代替。

### 准备示例应用

项目专题沿用一个独立的历史示例：`tutorialTasks` 保存任务，`tutorialProjects` 保存项目，任务用 `completed` 表示完成状态。当前的 [入门示例](../tutorials/build-your-first-app-agent-first.md) 则使用 `tasks` 表和三阶段的 `status`，两者不是同一套代码。运行本专题时，请使用下文指定的旧标签和配套配置，不要把这些迁移直接应用到入门示例的数据库上。

<details>
<summary>获取并配置本文的示例应用</summary>

本篇接着 [app-tutorials 的 `04-task-due-date` 阶段](https://github.com/nocobase/app-tutorials/tree/04-task-due-date) 继续开发，基于默认模板 `1.0.0-beta.78`。该仓库为私有，需要访问权限。已经完成这一阶段的读者，可以在原项目中继续；从头开始时，在一个新目录中获取这一阶段的代码：

```bash
git clone --branch 04-task-due-date https://github.com/nocobase/app-tutorials.git team-tasks
cd team-tasks
git switch -c feat/task-projects
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
```

请使用 Node.js 24 和 pnpm 11。已有项目不必重新初始化配置，也不要把已有的数据库配给更早版本的代码。下文的代码和命令都在应用根目录中使用；本篇验证所用的数据库为 SQLite。

</details>

### 示例：项目与任务的关系

本次只引入一个最小的项目模型：

- `tutorialProjects.id`：项目 ID，字符串主键，与任务现有的 ID 类型保持一致。
- `tutorialProjects.name`：项目名称，必填，最长 120 个字符；允许不同的项目使用相同的名称。
- `tutorialProjects.createdAt`：创建时间，由创建项目的业务代码提供。
- `tutorialTasks.projectId`：可以为空的项目 ID。一个项目可以有多条任务，一条任务最多属于一个项目。

任务中保存项目 ID，读取时再取得项目名称。这样，项目改名时不需要逐条更新任务，也不会因为项目同名而混淆归属。

旧任务没有可靠的项目归属，因此新字段先允许为空，表示“尚未归入项目”。迁移不去猜测归属，也不创建一个默认项目来接收所有历史任务。对于已经被任务引用的项目，本例拒绝删除；业务上可以先转移或解除关联，再删除项目。

### 使用 Agent

在应用目录中把本篇作为参考交给 Agent，再描述下面的需求。字段、接口和组件的具体约定见后文的手动步骤，由 Agent 结合项目指引处理。

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

检查 Agent 的结果时，除了看新增的表和字段，还要看已有数据是否保留、约束是否真正生效，以及测试是否使用了真实的数据库。可以对照下面的实现进行检查。

### 不使用 Agent

#### 编写自包含的迁移

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

文件名去掉 `.ts` 后与 `name` 一致，并排在已有的任务迁移之后。迁移中的表、字段和约束都直接写在文件里，不从不断演进的业务服务或模型文件中导入。

`up()` 先创建项目表，再扩展任务表。`down()` 按依赖关系反向移除：任务原有的字段和记录会保留，但项目数据和任务的项目归属会被删除。它只是结构上的逆操作，并不是用来恢复业务数据的备份。

#### 区分字段、关联和约束

这份迁移为同一个业务关系定义了三个部分：

- **字段 `projectId`**：真正保存在任务表中的项目 ID。`nullable: true` 让旧任务和尚未归入项目的新任务继续有效。
- **关联 `project`**：告诉 Repository 如何从任务读取项目。`foreignKey` 指向上面已经存在的字段，`targetKey` 指向项目的主键。它不会再保存一份项目名称。
- **外键约束**：由数据库保证非空的 `projectId` 必须指向存在的项目，并通过 `onDelete: 'restrict'` 拒绝删除仍被引用的项目。

由于这里已经显式创建并命名了外键，关联声明中使用了 `constraints: false`，以免重复创建约束；这并不表示数据库中没有外键。显式命名也让 `down()` 能够准确地移除这个约束。

`projectId` 上的普通索引用于后续按项目筛选任务。这里不设唯一索引，因为同一个项目可以有多条任务。索引服务于查询，外键保证引用有效，两者各司其职。

字段声明也不能代替接口的输入校验。例如，`nullable: false` 不会拒绝空白的名称，各种数据库对字符串长度的处理也可能不同；接口仍需检查去除首尾空格后的名称及其长度。

#### 应用迁移并生成 Collection

先确认当前应用配置指向的数据库，再运行：

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

对于已经运行过上一阶段的数据库，执行计划中应包含这份新迁移；对于新建的数据库，计划还会包含此前尚未执行的应用迁移、插件迁移和 Seed。`db apply` 先执行待运行的迁移，再执行待运行的 Seed，并不只处理本次新增的文件。

再次运行相同的命令，已经成功执行的迁移不会重复执行。已有数据库中的任务会保留标题、完成状态、负责人和截止日期，新增的 `projectId` 为 `null`。

这些命令会刷新 `database/main/collections/` 下的模型快照，可以查看：

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

这些文件用于查看数据库实际解析出的模型，是可以重新生成的缓存。不要手动修改它们，也不要在迁移中导入它们。检查缓存与数据库是否一致：

```bash
pnpm nocobase collections generate --check
```

### 用真实数据库验证

新增 `tests/database/tutorial-tasks-projects.test.ts`。下面的测试先应用较早的迁移并插入一条旧任务，再应用本次迁移，检查模型和数据，最后回滚并重新应用。`describeMigration()` 负责管理隔离的数据库及其清理，不会操作你的开发数据库。

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

运行本章的测试，再运行已有任务的数据库测试和接口测试：

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/database/tutorial-tasks-projects.test.ts
pnpm exec vitest run --config vitest.tutorial.config.ts
```

本章的测试必须出现在测试结果中，不能把“没有发现测试”当作通过。这些测试会验证：

- 升级后，旧任务的业务字段都保留，`projectId` 为空。
- 索引和外键确实存在；任务可以关联项目，并能通过 Repository 读取项目名称。
- 不存在的项目 ID 会被拒绝，仍被任务引用的项目不能删除，失败后原有关联保持不变。
- 回滚会移除新增的模型但保留原有任务，之后可以重新应用迁移。

测试中的 `repository()` 是直接在隔离数据库上做验证。正式的接口必须先检查调用者的权限，再使用带有相应策略的 Repository；外键只能证明项目存在，不能证明当前用户可以访问或选择这个项目。

### 模型继续演进时

**已经合并或发布的迁移保持不变。** 新增字段、修改约束或者修复历史迁移时，都再添加一份新的迁移。修改已执行的文件不会让 `db apply` 自动重新运行它；靠重置数据库，也无法验证真实的升级是否保留了数据。

如果以后要求每条任务都必须有项目，应先确定旧任务的归属，补齐数据并验证没有空值，再通过后续迁移改为非空。补齐现有数据属于迁移的职责；不要用 Seed 反复覆盖用户修改过的任务。

Seed 用于应用运行所必需的初始数据。本章的项目是用户创建的业务记录，所以不添加 Seed。初始数据的文件组织和执行历史见上文的 [使用 defineSeed 初始化数据](#使用-defineseed-初始化数据)，演示数据的边界见 [初始数据机制](../framework/database/seeds.md)；不要假设普通 Seed 会按环境自动跳过。

### 继续阅读

[路由与 HTTP 接口](apis-and-services.md) 说明如何把数据操作开放给页面：校验输入，检查项目和任务两侧的权限，并把业务错误转换为一致的 API 错误。[应用开发概览](overview.md) 介绍这些部分如何串联起来。

迁移和初始数据按连接维护，新增连接见 [多数据库连接](multiple-databases.md)。如果已有的结构由其他系统管理，请使用 [接入已有数据库](existing-databases.md) 中的流程，把手写的 `metadata/` 与生成的 `collections/` 分开维护。
