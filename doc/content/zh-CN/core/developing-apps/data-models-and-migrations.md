---
title: 建表与数据初始化
description: 使用 defineMigration、defineSeed 及各自的 Context 建表、初始化记录，并维护后续结构与数据变更。
---

应用通过 `defineMigration()` 描述建表和后续结构变更，通过 `defineSeed()` 安装初始记录。两个函数都只是定义任务；执行时，框架将当前任务的 Context 传给回调，提供建表、查询和记录操作所需的能力。

本篇先用独立的 `appStatuses` 状态表串起“建表 → 初始化数据 → 执行与验证”，无需历史教程。后面的项目与任务案例保留原有准备条件，说明怎样修改已有结构。

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

`main` 是连接名称。迁移和 Seed 文件默认导出任务定义，`name` 与文件名去掉扩展名后的部分一致，并在对应任务的所有来源中保持唯一。加入已有项目时，使用排在现有任务之后的新名称。`collections/` 是生成的模型缓存，不是手写模型的入口。

| 要做的事 | 使用方式 |
| --- | --- |
| 建表、修改字段、关系、索引和约束 | Migration |
| 随版本转换或补齐历史记录 | Migration 中的数据操作 |
| 安装默认状态、分类等初始记录 | Seed |
| 用户日常创建和修改业务记录 | 服务端业务服务与接口 |

迁移也能修改数据，不能简单理解成“迁移只建表，Seed 负责所有写入”。

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

`up()` 执行本次变更，`down()` 描述对应回退。`builder.createCollection()` 声明逻辑集合及其结构，框架按连接方言创建物理表。`code` 是稳定业务键，主键约束防止重复；`title` 保存可修改的显示名称。

本例的 `down()` 删除整张表和记录，因此只在隔离数据库中验证回退。已发布迁移保持不变，后续修改新增文件。`transaction`、`irreversible` 和 `shouldRun()` 等选项见[迁移机制](../framework/database/migrations.md)，简单建表无需先配置全部选项。

## 使用 Migration Context

`up(context)` 与 `down(context)` 接收 `MigrationContext`。上例的 `{ builder }` 是从 Context 中解构所需成员；需要处理历史数据时，再使用同一个 Context 中的 `query`。

| 成员 | 用途与边界 |
| --- | --- |
| `builder` | 创建和调整集合、字段、索引及约束 |
| `query` | 迁移中的数据读取、更新和批量回填，通常是数据操作的首选 |
| `repository(name)` | 需要 Collection 字段编码、命名覆盖或关联写入时使用；依赖执行时的模型形状 |
| `connection` | 当前连接的名称、方言、能力与底层客户端入口，是受限接口 |
| `config` | 任务执行方提供的只读配置，通过 `get()` 读取 |
| `container` | 任务执行方提供的服务解析器，不代表完整应用容器或所有业务服务已经启动 |
| `configuration`、`parameters` | 来源提供的可选适用性配置与目标参数；普通应用迁移通常不需要 |

例如在一个后续迁移的 `up({ query })` 中，可以对已存在的 `appStatuses` 做明确的数据修正：

```ts
await query.updateTable('appStatuses')
  .set({ title: 'Draft' })
  .where('code', '=', 'draft')
  .where('title', '=', 'DRAFT')
  .execute();
```

这是回调内部的片段，前提是目标表已经存在。它只修正约定的旧值，不覆盖所有用户自定义名称。迁移中的数据操作使用明确的历史结构，不导入随业务代码变化的服务实现。

Migration Context 的 `connection` 不是完整的 `DatabaseConnection`：不能写 `connection.repository()`、`connection.builder` 或自行调用 `connection.transaction()`。直接使用 Context 顶层的 `builder`、`query`、`repository()`，让执行器负责事务。`client()` 是低层逃生入口，通常不需要，也不能用于绕过结构管理限制。

只有 Query 无法正确表达的场景再用迁移中的 `repository()`，并说明原因；不要让回退逻辑依赖已经变化的 Collection 模型。事务是否启用还受任务选项和方言能力约束，不应假设所有数据库的 DDL 都能回滚。

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

`run()` 执行安装数据逻辑。本例只补充缺失记录，保留管理员已有的名称修改。先查询再插入本身不能消除并发竞争，主键约束提供最终保护；冲突时让任务失败并回滚，检查后重试。需要存在即更新时，可以使用 `upsertOne()`，但必须明确允许覆盖的字段。

Seed 没有与 Migration `down()` 对应的回退函数，也不是每次启动都覆盖配置的同步脚本。

## 使用 Seed Context

`run(context)` 接收 `SeedContext`。安装记录按 Collection 语义描述，通常优先使用 `repository()`：

| 成员 | 用途与边界 |
| --- | --- |
| `repository(name)` | 读写初始记录，使用逻辑字段、字段编码及关联写入能力 |
| `query` | Repository 不适合表达的数据操作，例如访问没有对应 Collection 的表 |
| `connection` | 与 Migration 相同的受限连接接口，不是完整的运行时连接 |
| `config` | 读取任务执行方提供的配置 |
| `container` | 解析执行方允许提供的服务；独立执行器未提供时为空 |

Seed Context 没有 `builder`，需要新表或字段时先写迁移。`repository()` 和 `query` 已绑定当前任务连接；启用事务时，它们也使用当前事务。不要从外部管理器取得另一个 Repository 来写入，否则可能离开任务事务。

两种 Context 提供的 Repository 写入都不触发运行时 Repository 变更事件。安装或升级不能依赖尚未启动的业务监听器来补全数据。

## 执行与验证

确认配置指向本地示例数据库后，在应用根目录执行：

```bash
pnpm nocobase db apply --connection main --dry-run
pnpm nocobase db apply --connection main
pnpm nocobase collections generate --connection main --check
```

`db apply` 先运行待执行的迁移，再运行 Seed，也可能包含其他应用或插件资源；`--dry-run` 只预览计划。成功任务按历史跳过，修改已执行文件不是重新执行的方式。默认 Seed 事务模式为 `auto`，失败时本次写入和成功历史一起回滚，修复问题后继续。

验证首次建表与两条默认记录、重复执行不重复写入、首次初始化前已有自定义记录时保持其名称，以及 Seed 写入后抛错能回滚并重试。迁移回退在隔离数据库中验证；目标数据库的 DDL、隔离与锁行为需使用对应方言测试。

## 修改已有结构与数据

已发布任务保持不可变，新增迁移表达字段、约束和历史数据变化。先补齐旧数据再收紧非空约束；需要永久保存的用户选择不能由 Seed 反复覆盖。新增安装默认项时，再添加更晚的 Seed。

演示数据与必需数据分开。普通 Seed 不会因为内容是演示记录就自动跳过；需要可选示例时，显式使用 `sample: true`，并按应用的 sample-data 配置和执行入口加载，详见[初始数据机制](../framework/database/seeds.md)。测试 fixtures、日常导入和环境重置不混入普通初始化流程。

新增连接见[多数据库连接](multiple-databases.md)，外部系统维护的结构见[接入已有数据库](existing-databases.md)，业务事务见[事务与数据一致性](transactions-and-consistency.md)。完整迁移选项见[迁移机制](../framework/database/migrations.md)。

## 进阶示例：为任务增加项目

下面保留原有项目专题案例，演示字段、关联、约束和旧数据保留。它是独立的历史应用，与前面的 `appStatuses` 示例无依赖关系。

### 结构、初始数据与业务记录

| 要做的事 | 放在哪里 | 处理原则 |
| --- | --- | --- |
| 增加字段、关系、索引或约束 | `database/main/migrations/` | 新增迁移，明确对旧数据的影响 |
| 随版本补齐历史数据 | 迁移 | 明确转换规则，不猜测业务归属 |
| 写入应用运行必需的初始数据 | `database/main/seeds/` | 与用户日常创建的记录区分，不反复覆盖用户修改 |
| 提供可选演示数据 | 标记为 sample 的 seed | 由使用者明确选择是否载入 |
| 创建或修改日常业务记录 | 业务服务和接口 | 校验输入与权限，再通过 Repository 读写 |
| 查看解析后的 Collection | `database/main/collections/` | 由工具生成和校验，不手动编辑 |

项目名称是用户填写的业务数据，因此本例不添加项目种子。业务角色也不能为了让示例可用而自动分配给所有已登录用户。

### 设计字段和关系时先回答什么

先明确必填和唯一是否是业务规则、历史记录是否能满足新规则、关联对象删除时如何处理，再选择字段和约束。不要仅根据表单当前长什么样来决定数据库结构。

例如，“项目名称必填”不意味着名称必须唯一；“任务可以归入项目”也不意味着旧任务必须立即有项目。数据库外键保证引用有效，接口校验负责名称内容等输入规则，权限检查负责当前用户是否可以使用这个项目。这些检查不能互相替代。

### 准备示例应用

项目专题沿用独立的历史示例：`tutorialTasks` 保存任务，`tutorialProjects` 保存项目，任务使用 `completed` 表示完成状态。当前[入门示例](../tutorials/build-your-first-feature-agent-first.md)则使用 `tasks` 和三阶段 `status`，两者不是同一套代码。运行本专题时使用下方指定的旧标签和配套配置；不要直接把这些迁移应用到入门示例的数据库。

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

### 示例：项目与任务的关系

本次只引入最小的项目模型：

- `tutorialProjects.id`：项目 ID，字符串主键，与任务现有的 ID 类型保持一致。
- `tutorialProjects.name`：项目名称，必填，最长 120 个字符；允许不同项目使用相同名称。
- `tutorialProjects.createdAt`：创建时间，由创建项目的业务代码提供。
- `tutorialTasks.projectId`：可空的项目 ID。一个项目可以有多个任务，一条任务最多属于一个项目。

任务保存项目 ID，读取时再取得项目名称。这样项目改名不需要逐条更新任务，也不会因同名项目而混淆归属。

旧任务没有可靠的项目归属，因此新字段先允许为空，表示“尚未归入项目”。迁移不猜测归属，也不创建一个默认项目接收所有历史任务。对于已经被任务引用的项目，本例拒绝删除；业务上可以先转移或解除关联，再删除项目。

### 使用 Agent

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

文件名去掉 `.ts` 后与 `name` 一致，并排在已有任务迁移之后。迁移中的表、字段和约束直接写在文件里，不从不断演进的业务服务或模型文件导入。

`up()` 先创建项目表，再扩展任务表。`down()` 按依赖关系反向移除，保留任务原有字段和记录，但会删除项目数据及任务的项目归属。它是结构上的逆操作，不是恢复业务数据的备份。

#### 区分字段、关联和约束

这份迁移为同一个业务关系定义了三个部分：

- **字段 `projectId`**：真正保存到任务表中的项目 ID。`nullable: true` 使旧任务和未归入项目的新任务继续有效。
- **关联 `project`**：告诉 Repository 如何从任务读取项目，`foreignKey` 指向上面已经存在的字段，`targetKey` 指向项目的主键。它不会另外保存一份项目名称。
- **外键约束**：由数据库保证非空的 `projectId` 必须指向存在的项目，并通过 `onDelete: 'restrict'` 拒绝删除仍被引用的项目。

这里已经显式创建并命名了外键，所以关联声明使用 `constraints: false`，避免再次创建约束；这不等于数据库没有外键。显式命名也让 `down()` 能准确移除该约束。

`projectId` 上的普通索引用于后续按项目筛选任务，不设唯一索引，因为同一个项目可以拥有多条任务。索引服务于查询，外键保证引用有效，二者承担不同职责。

字段声明也不替代接口的输入校验。例如，`nullable: false` 不会拒绝空白名称，各数据库对字符串长度的处理也可能不同；接口仍需要检查去除首尾空格后的名称和长度。

#### 应用迁移与生成 Collection

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

### 用真实数据库验证

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

### 模型继续演进时

**已经合并或发布的迁移保持不变。** 新增字段、修改约束或修复历史迁移时，再添加一份迁移。修改已执行文件不会让 `db apply` 自动重跑它，也不能靠重置数据库验证真实升级是否保留了数据。

如果以后要求每条任务必须有项目，先确定旧任务的归属，完成数据补齐并验证没有空值，再用后续迁移改为非空。补齐现有数据属于迁移；不要用种子反复覆盖用户已修改的任务。

种子用于应用运行所必需的初始数据。本章的项目是用户创建的业务记录，因此不添加种子。初始数据的文件组织、执行历史及演示数据的边界见[建表与数据初始化](data-models-and-migrations.md)，不要假设普通 Seed 会按环境自动跳过。

### 继续阅读

[路由与 HTTP 接口](apis-and-services.md)说明怎样把数据操作开放给页面：校验输入、检查项目与任务的权限，并把业务错误转换为一致的 API 错误。[应用开发概览](overview.md)介绍这些部分如何连起来。

迁移与初始数据按连接维护；新增连接见[多数据库连接](multiple-databases.md)。已有结构由其他系统管理时，使用[接入已有数据库](existing-databases.md)的流程，手写 `metadata/` 与生成的 `collections/` 分开维护。
