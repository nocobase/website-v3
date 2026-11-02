---
title: 测试
description: 编写组件、接口、命令和数据库测试，通过 Playwright、Agent 和人工操作验证 UI 与完整业务流程。
---

## 应用可以测试哪些内容

一个功能开发完成后，需要确认它在正常操作、权限受限和执行失败时都能得到预期结果。例如商品管理功能，既要检查创建和发布能否成功，也要检查只读账号能否被阻止修改、保存失败后能否重试。

测试既要检查代码的处理结果，也要验证实际应用中的操作流程：

| 测试范围 | 主要验证内容 | 商品管理示例 |
| --- | --- | --- |
| client | 测试环境中的组件交互、请求内容与状态反馈 | 提交正确的名称和价格；失败后保留输入 |
| server | 接口、业务规则、身份与权限 | 创建商品默认保存为草稿；只读用户不能发布 |
| cli | 命令执行、输出与失败处理 | 导出已发布商品；目标文件存在时拒绝覆盖 |
| database | 数据操作、约束、事务、迁移与初始数据 | 写入失败后回滚；迁移能够执行和撤销 |
| UI | 真实浏览器中的页面表现与完整业务流程 | 登录、创建草稿、发布并刷新，确认结果保留 |

前四类通过 Vitest 和 app-testing 编写测试。UI 测试可以由 Playwright 执行固定脚本，也可以由 Agent 自主操作或由人验证。它们相互补充：组件测试检查表单如何处理请求，服务端测试检查权限和写入，UI 测试确认用户能否在实际应用中完成整个流程。

## 测试工具与套件

### Vitest

Vitest 负责发现和运行测试，提供 `test`、`expect`、`vi.fn()` 等工具，分别用于定义用例、检查结果和记录或模拟函数调用。它也支持监听文件变化和生成覆盖率报告。通用用法见 [Vitest 文档](https://vitest.dev/guide/)。

对于不依赖应用环境的函数，可以直接导入并测试；涉及页面、插件、数据库或应用命令时，再使用 app-testing 准备相应环境。同一个 Vitest 用例可以同时使用 Vitest 的断言和 app-testing 的辅助工具。

### Playwright

Playwright 在真实浏览器中打开已启动的应用，执行登录、填写表单、点击按钮、刷新页面等操作。它适合验证页面、接口、会话与数据库共同参与的完整流程。

Playwright 使用独立的测试运行器，不由 app-testing 提供。示例中的 `pnpm test` 运行 Vitest，`pnpm test:e2e` 运行 Playwright，两者需要分别执行。

### app-testing

`@nocobase/app-testing` 是 NocoBase 的应用测试辅助套件。它提供三个导入入口：

| 入口 | 主要工具 | 可以完成的测试 |
| --- | --- | --- |
| `@nocobase/app-testing/client` | `renderWithApp()`、`answerApi()` | 在客户端应用环境中渲染组件，控制接口响应，验证页面交互 |
| `@nocobase/app-testing/server` | `createAppTest()` | 启动带隔离数据库的服务端应用，验证接口、权限和持久化 |
| `@nocobase/app-testing/server` | `createDatabaseTest()`、`describeMigration()` | 单独验证数据库操作、表结构和迁移回滚 |
| `@nocobase/app-testing/cli` | `createTestAppConfig()`、`bindTestAppCommand()`、`runAppCommand()` | 为命令准备测试配置，执行命令并读取结果和输出 |

这些工具减少了创建应用、准备数据库和清理资源的重复代码。商品是否允许发布、只读用户是否被拒绝等业务结果，仍需要在用例中明确断言。

## 组织与运行测试

### 测试目录与配置

测试文件按维度组织在 `tests/` 目录下：

```text
tests/
├── database/     # 数据库测试
├── server/       # 服务端测试
├── client/       # 页面交互测试
├── cli/          # 应用命令测试
└── playwright/   # 浏览器测试
```

`vitest.config.ts` 配置前四类测试：`client` project 运行页面测试，`node` project 运行服务端、命令和数据库测试。`playwright.config.ts` 单独配置浏览器测试。

### 运行测试与查看结果

在应用根目录执行以下命令。这些命令由默认应用模板的 `package.json` 定义；已有项目以自身脚本配置为准。

```bash
# 运行 Vitest 测试
pnpm test

# 监听文件变化并重新运行测试
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage

# 运行浏览器测试，需要先启动测试应用
pnpm test:e2e
```

执行后检查终端中的文件数、用例数与失败项。失败信息会指出断言位置以及预期值和实际值。没有发现用例或跳过了用例，不代表这些功能已经通过验证。

功能修改后，先运行受影响维度的测试，再检查调用它的页面、接口或命令；涉及认证、共享服务或数据结构的改动，还需重新验证关键完整流程。修复缺陷时，增加能够复现问题的用例，并在修复后保留为回归测试。

## 使用 Vitest 编写测试

下面使用同一个商品管理 App 展示具体方法。源码和安装步骤见[示例源码与运行](#示例源码与运行)，各节代码为关键摘录，完整的数据准备和辅助函数在对应源码中。

每个测试用例都应包含环境或数据准备、执行操作、检查结果三个部分。先确定要验证的行为，再选择对应的测试维度。独立函数可以直接使用 Vitest；依赖应用服务、页面或数据库的测试，使用 app-testing 准备环境。

### database：数据与迁移

database 测试验证数据操作、约束、事务、迁移和初始数据。测试不依赖完整应用时，可以只加载需要的迁移与数据，减少与其他模块的耦合。

**准备数据库并验证数据操作**

从 `@nocobase/app-testing/server` 导入 `createDatabaseTest()`，通过 `migrations` 指定迁移来源，再使用用例上下文中的 `connection` 操作测试数据库。这些辅助能力由 `@nocobase/db-testing` 提供，并通过 app-testing 的 server 入口重导出。

`createDatabaseTest()` 默认使用 `isolation: 'schema'`，每个用例重置测试数据库结构，再运行传入的迁移与 Seed，结束后清理连接和数据库。它不会自动安装应用及插件；需要初始数据时通过 `seeds` 显式指定来源，依赖插件服务时改用 `createAppTest()`。

写入后重新查询，检查字段值和记录数量。验证约束时，既要确认非法写入失败，也要确认原有记录未被改变。验证事务时，在多步操作中触发失败，再查询数据库，确认没有留下部分写入。

**验证迁移与初始数据**

使用 `describeMigration()` 指定迁移来源，并分别在 `up`、`down` 回调中检查结果。辅助工具执行迁移、回滚和重新应用，`up` 中的断言会执行两次；业务断言仍需检查预期的表结构、字段和数据变化。

初始数据应验证首次执行的结果，以及重复执行是否符合预期，例如不重复插入、不覆盖用户修改。如果初始化过程依赖认证、授权等插件服务，应使用 server 测试环境加载完整应用。

**选择测试数据库**

`NOCOBASE_TEST_DB_DIALECT` 选择测试方言，未设置时使用 SQLite。切换方言前，需要安装兼容版本的驱动，并配置该驱动要求的测试服务与连接参数；测试账号应具备创建和清理隔离数据库或 schema 的权限。例如，完成 PostgreSQL 测试环境配置后，可运行：

```bash
NOCOBASE_TEST_DB_DIALECT=postgres pnpm test --project node tests/database/catalog-data.test.ts
```

此命令展示切换方式，本文商品示例实际验证的是 SQLite。具体连接配置见[数据库测试环境说明](https://github.com/nocobase/nocobase/blob/6cc8acf0c9062e99c759ed0a9ca1d038c4145705/packages/app/app-skills/skills/nocobase-app-development/references/testing/database/repository.md)。同一环境选择也适用于使用套件隔离数据库的 server 和 cli 测试。

**示例：商品数据的事务与迁移**

数据库测试只加载商品迁移：

```ts
import path from 'node:path';
import { createDatabaseTest } from '@nocobase/app-testing/server';
import metadata from '../../package.json' with { type: 'json' };

const test = createDatabaseTest({
  migrations: [{
    packageName: metadata.name,
    directory: path.resolve(import.meta.dirname, '../../database/main/migrations'),
  }],
});
```

下面在事务中写入后主动抛错，最终记录数应为零：

```ts
test('rolls back every product write when the transaction fails', async ({
  connection,
}) => {
  await expect(
    connection.transaction(async (transaction) => {
      await transaction
        .repository('catalogProducts')
        .createOne({
          values: {
            id: 'rollback',
            name: 'Uncommitted',
            priceCents: 100,
            published: false,
          },
        });
      throw new Error('Simulated downstream failure');
    }),
  ).rejects.toThrow('Simulated downstream failure');
  expect(await connection.repository('catalogProducts').count()).toBe(0);
});
```

迁移测试检查字段存在，并在回滚后确认表已移除：

```ts
describeMigration('202610310001_create_catalog', {
  sources: [
    {
      packageName: 'testing-acceptance',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('catalogProducts').toHaveField('published', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('catalogProducts').not.toExist();
    await expectCollection('catalogCategories').not.toExist();
  },
});
```

```bash
pnpm test --project node tests/database/catalog.test.ts tests/database/catalog-data.test.ts
```

[数据操作测试](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/database/catalog-data.test.ts) · [迁移测试](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/database/catalog.test.ts)。初始数据验证放在服务端测试中：执行 sample Seed、修改商品名称、再次执行 Seed，确认不增加记录，也不覆盖修改。应用启动默认不填充商品。

### server：接口与业务规则

server 测试验证接口响应、业务规则、身份认证、权限和持久化。独立计算可以直接调用函数；依赖插件或应用服务的行为，应加载实际应用进行测试。

**创建测试应用**

从 `@nocobase/app-testing/server` 导入 `createAppTest()`，通过 `createServer` 传入应用的服务端创建函数，通过 `config` 设置测试需要的配置。它返回带应用上下文的 Vitest `test`：

| 上下文 | 用途 |
| --- | --- |
| `request` | 向应用 API 发送请求 |
| `testApp` | 访问测试应用，包括通过 `fetch` 调用 Web 路由 |
| `app` | 访问应用及其服务容器 |
| `connection` | 查询测试数据库，检查操作后的数据 |

请求在进程内执行，不需要启动一个供外部访问的 HTTP 服务。默认同一文件内的用例共享应用和数据库；需要逐用例隔离时设置 `scope: 'test'`。`connections` 默认隔离 `main`；应用有多个自有连接时应全部列出，未列出的连接仍沿用应用配置。套件在作用域结束时关闭应用并清理测试数据库。

**验证响应、业务结果和权限**

准备数据后发送真实请求，同时检查状态码、响应内容和持久化结果。正常操作之外，还应覆盖非法输入、记录不存在、状态冲突等业务分支；支持请求重试的接口还需检查是否重复写入。

权限测试分别使用未登录、已登录但未授权、已授权的身份。通过真实认证机制建立会话，再检查允许和拒绝的操作；有数据范围限制时，还应检查列表、总数、详情和导出是否一致。客户端隐藏按钮不能替代这些断言。

共享数据库中的测试应准备各自的数据，避免依赖其他用例的执行顺序。

**示例：商品创建与权限控制**

示例加载实际应用，配置独立的认证环境：

```ts
import { createAppTest } from '@nocobase/app-testing/server';
import { DEFAULT_ADMIN_CREDENTIALS, signIn } from '@nocobase/app-plugin-authentication/testing';
import { expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  server: { basePath: '/shop' },
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'catalog-test-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
      emailAndPassword: { disableSignUp: false },
    },
  },
});
```

在此环境中，测试创建商品、重复发送同一操作键并查询数据库，确认不会重复写入；普通用户只有显式授权后才能读取，创建和发布仍返回 `403`。下面将创建与重试的关键断言放在一个用例中，展示如何取得测试上下文并登录。`post()` 和 `key()` 是源码中的请求辅助函数，分别构造 JSON 请求和生成操作键：

```ts
test('creates a draft without duplicating retries', async ({ testApp, connection, request }) => {
  expect((await request('/products')).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const values = { name: 'Catalog test lamp', priceCents: 3500 };
  const operation = key();
  const created = await admin.fetch('/products', post(values, operation));
  expect(created.status).toBe(201);
  const { data } = await created.json();
  expect(data).toMatchObject({ ...values, published: false });
  const repeated = await admin.fetch('/products', post(values, operation));
  expect(repeated.headers.get('Idempotency-Replayed')).toBe('true');
  expect(await connection.repository('catalogProducts').count({
    filter: { name: values.name },
  })).toBe(1);
});
```

```bash
pnpm test --project node tests/server/catalog.test.ts
```

[完整测试、会话准备与权限断言](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/server/catalog.test.ts)。

### client：组件交互与状态

client 测试验证用户操作后，组件是否发出正确请求，以及页面是否显示预期状态。适合检查表单输入、按钮操作、数据展示、错误提示和重试行为。

**渲染应用组件**

从 `@nocobase/app-testing/client` 导入 `renderWithApp()`，将实际组件放入带应用服务、路由和翻译能力的客户端环境。通过 `namespace`、`namespaces` 和 `locale` 配置组件需要的翻译。组件使用应用上下文时，应在这个环境中测试，避免用替代组件绕过实际逻辑。

`renderWithApp()` 在用例结束时关闭客户端应用。Testing Library 用来查找界面元素，`userEvent` 用来模拟输入和点击，Vitest 的 `expect()` 用来检查结果。

**控制请求并检查页面反馈**

通过 `fetch: answerApi(handler)` 控制接口响应。处理函数可以读取请求的 `method`、`path` 和 `json`，返回指定状态码与响应体的 `Response`。配合 `vi.fn()` 记录调用，可以检查请求内容和发送次数。

分别覆盖请求等待中、成功和失败的状态：等待中检查是否阻止重复操作；成功后检查数据和反馈是否更新；失败后检查错误提示、输入保留及重试行为。异步界面变化应等待后再断言，延迟响应应在测试结束前释放。

模拟响应可以验证页面如何处理结果，不能证明服务端完成了写入或权限检查。这些行为需要 server 测试，真实浏览器的完整操作流程则由 playwright 测试验证。

**示例：商品表单的提交与反馈**

商品表单使用真实组件，通过受控响应验证请求和页面状态。以下摘录中的 `respond` 由不同用例提供，`metadata` 和 `locales` 来自应用：

```tsx
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';

const requests = vi.fn((call: ApiCall) =>
  call.method === 'POST' && call.path === 'products'
    ? respond()
    : new Response(null, { status: 404 }),
);
await renderWithApp(<ProductForm onCreated={onCreated} />, {
  namespace: metadata.name,
  namespaces: { [metadata.name]: locales },
  locale: 'en-US',
  fetch: answerApi(requests),
});
```

成功用例检查请求中的名称和价格、输入清空以及回调次数；失败用例检查输入保留和重试；延迟用例检查提交中按钮禁用。运行：

```bash
pnpm test --project client tests/client/product-form.test.tsx
```

[完整测试与辅助函数](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/client/product-form.test.tsx)。

![创建商品草稿后的页面。](/assets/core/testing-acceptance/testing-products-draft.png)

![保存失败时保留输入并提示重试。](/assets/core/testing-acceptance/testing-products-failure.png)

![请求等待中，按钮禁用。](/assets/core/testing-acceptance/testing-products-pending.png)

### cli：应用命令

cli 测试验证参数处理、退出状态、标准输出、错误信息，以及命令产生的数据或文件变化。结果检查应覆盖实际副作用，例如读回导出的文件，而不仅是命令有没有抛错。

**准备命令执行环境**

从 `@nocobase/app-testing/cli` 导入辅助工具，根据命令是否需要启动应用选择环境：

| 命令依赖 | 准备方式 |
| --- | --- |
| 只处理参数或文件 | 使用 `bindAppCommand()` 绑定临时应用根目录和命令 ID，再用 `runAppCommand()` 执行 |
| 依赖应用服务或数据库 | 使用 `createTestAppConfig()` 创建隔离配置，准备测试数据，通过 `bindTestAppCommand()` 绑定实际命令类，再执行 |

测试自行创建的临时文件需要清理；应用配置使用 `config.dispose()` 清理。下方商品导出展示第二种方式，不启动应用的写法见[文件命令完整示例](https://github.com/nocobase/nocobase/blob/6cc8acf0c9062e99c759ed0a9ca1d038c4145705/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/files.md)。

**执行命令并检查结果**

使用 `runAppCommand(Command, args)` 执行命令。返回值包含 `exitCode`、`stdout`、`stderr` 等信息。成功时 `exitCode` 可以是 `undefined`，检查时用 `exitCode ?? 0` 归一化。命令支持 JSON 输出时，可通过 `json()` 读取结构化结果。检查成功输出的同时，查询数据库或读取生成文件，确认内容符合预期。支持试运行的命令还需确认未产生写入。

对非法参数、目标已存在或执行失败等情况，检查退出状态、错误内容以及已有数据是否保持完整。JSON 模式下已处理的错误可能不在 `run.error` 中，应同时检查退出码和错误响应。

命令输出捕获涉及进程级状态，应顺序执行相关测试。使用 `withApp()` 的命令会在结束后关闭应用；测试创建的配置仍需在 `finally` 中调用 `config.dispose()` 清理。

**示例：导出已发布商品**

示例命令从真实数据库导出已发布商品。测试先准备一条已发布商品和一条草稿，再绑定实际命令；`config` 由 `createTestAppConfig()` 创建，`createApp` 和 `runtime` 来自应用入口：

```ts
const Command = bindTestAppCommand(ExportProducts, {
  rootDir, config, id: 'app:products:export', createApp,
  loadRuntime: () => resolveStandaloneAppRuntime(runtime, {
    rootDir,
    configPath: config.path,
    consoleLogStream: 'stderr',
    env: { APP_STORAGE_DIR: path.join(config.directory, 'storage') },
  }),
});
```

`consoleLogStream: 'stderr'` 避免日志混入 JSON 输出，临时配置和存储路径保持一致。执行后应返回一条导出记录，生成文件不包含草稿：

```ts
const run = await runAppCommand(Command, ['--output', file, '--json']);
expect(run.exitCode ?? 0).toBe(0);
expect(run.json()).toMatchObject({
  ok: true, result: { count: 1, written: true },
});
```

测试还检查试运行不生成文件、目标文件已存在时返回错误且原内容不变，并在 `finally` 中释放配置。

```bash
pnpm test --project node tests/cli/export.test.ts
```

[完整命令测试](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/cli/export.test.ts) · [导出命令实现](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/cli/commands/products/export.ts)。

手动执行导出前，停止使用同一存储的应用进程。此示例按单进程运行，输出目录需要已存在；超过 500 条公开商品时命令拒绝导出。

```bash
pnpm nocobase app products export --output ./products.json --dry-run --json
pnpm nocobase app products export --output ./products.json --json
```

## UI 测试

UI 测试打开实际应用，检查页面、接口、会话与数据共同参与的结果。测试前准备可访问的应用、对应角色的账号和可区分的测试数据，明确操作后的数据清理方式。

| 执行方式 | 适合的场景 | 验证记录 |
| --- | --- | --- |
| Playwright | 稳定流程的重复验证与回归测试 | 测试用例、执行报告和 Trace |
| Agent 自主验证 | 开发过程中针对改动检查界面，发现问题后修复并复测 | 实际操作、观察结果、问题与复测记录 |
| 人工验证 | 结合真实工作场景检查流程、业务术语和使用体验 | 场景、预期结果、实际结果和使用者反馈 |

三种方式都应检查关键流程、角色差异和必要的异常状态。需要确认数据持久化时，刷新或重新进入页面检查保存结果。界面入口受到限制，并不能证明服务端拒绝越权，还需要结合接口权限测试。

### 使用 Playwright 自动验证

playwright 测试在真实浏览器中验证完整的用户路径，覆盖页面、接口、会话和数据库之间的配合。适合验证登录、提交、跳转、刷新和跨页面操作后的结果。

**准备应用、账号与数据**

先启动独立的测试应用，配置浏览器测试访问的地址，并准备具有不同权限的账号。通过真实登录流程建立会话，使用可区分的测试数据，并明确测试结束后清理还是保留数据，避免重复运行互相影响。

浏览器测试访问的是已启动的服务，不能直接使用 server 测试中的进程内请求环境。所需浏览器可通过 Playwright 安装，例如 `pnpm exec playwright install chromium`。

**操作页面并验证结果**

优先按角色、标签和可见名称定位元素，使用 `fill()`、`click()` 等操作模拟用户行为，再通过 Playwright 的断言等待预期状态。

关键流程应包含正常路径和必要的异常路径。可以控制网络响应复现暂时失败或延迟，检查提示、重试和重复提交；这类受控场景应与真实接口完成的正常流程区分。

**查看失败信息与测试报告**

失败时先检查用例名称、断言位置和实际结果。需要进一步定位时，可以启用 HTML 报告并保留失败用例的 Trace：

```bash
pnpm test:e2e --reporter=html --trace=retain-on-failure
```

应用地址和账号仍需按项目配置准备。报告输出到 `playwright-report/`；Trace 可用于检查操作前后的页面状态与网络请求。配置方式见 [Playwright 报告](https://playwright.dev/docs/test-reporters)和 [Trace Viewer](https://playwright.dev/docs/trace-viewer-intro)。

**示例：创建并发布商品**

先按[示例源码与运行](#示例源码与运行)中的步骤启动应用。`pnpm setup` 创建编辑员和只读账号，凭据保存在本地 `storage/demo.json`。本示例通过 `APP_URL` 指定包含基础路径的完整应用地址；将下面的地址替换为实际地址：

```bash
pnpm exec playwright install chromium
APP_URL='http://<host>:13320/main' pnpm test:e2e tests/playwright/products.test.ts
```

用例读取本地凭据并通过真实登录建立会话，创建唯一名称的商品，刷新确认草稿存在，再发布并再次刷新：

```ts
await page.getByLabel('Product name', { exact: true }).fill(name);
await page.getByLabel('Price in cents', { exact: true }).fill('2400');
await page.getByRole('button', { name: 'Create draft', exact: true }).click();
await expect(page.getByText('Draft created.', { exact: true })).toBeVisible();
await page.reload();
const row = page.getByRole('row').filter({ hasText: name });
await expect(row).toContainText('Draft');
await row.getByRole('button', { name: 'Publish', exact: true }).click();
await expect(row).toContainText('Published');
await page.reload();
await expect(row).toContainText('Published');
```

![发布后刷新，商品仍为 Published。](/assets/core/testing-acceptance/testing-products-published.png)

只读账号看不到创建和发布操作，直接请求创建接口也返回 `403`。另一用例注入失败和延迟，验证输入保留、重试与提交中状态，页面效果见[client 测试](#client组件交互与状态)。

![只读账号可以查看商品，没有创建和发布操作。](/assets/core/testing-acceptance/testing-products-viewer.png)

测试保留创建的商品供检查，应在专门的测试实例运行。[完整浏览器测试](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/playwright/products.test.ts)。

### Agent 自主验证

Agent 自主验证是开发过程中的浏览器检查：Agent 根据本次改动和页面实际状态选择操作，观察结果，发现问题后修复，再重新操作确认。它可以借助浏览器自动化工具执行，但不要求先把每条路径写成长期维护的 Playwright 用例。

**在开发过程中主动检查**

NocoBase 应用开发 Skill 的[前端工作流](https://github.com/nocobase/nocobase/blob/139e754fd526313ec36b8a31c5f99ee45a06467f/packages/app/app-skills/skills/nocobase-app-development/references/frontend/ui-workflow.md)要求：对运行时可见的改动，检查变化的元素和受影响交互；对新增页面，验证实际操作、数据保存与刷新、权限以及相关空状态和错误状态。

因此，在遵循该 Skill 且具备浏览器工具与登录会话的开发环境中，页面验证应作为开发收尾的一部分。Agent 应根据改动主动选择检查范围，而不是等使用者逐一列出点击步骤。浏览器控制能力来自 Agent 所在环境，app-testing 本身不提供这一能力。

**操作、定位与复测**

以修改商品创建表单为例，Agent 应打开商品页，填写字段并提交，检查反馈和列表结果，再刷新确认数据保留。如果改动涉及权限，再切换到只读账号检查操作入口。涉及提交状态时，还要检查等待、失败和重试过程；相关页面状态见 [client 示例](#client组件交互与状态)。

发现按钮无响应、数据未更新或页面报错时，结合页面状态、控制台错误、网络请求及服务端日志定位原因。修复后重新执行原来的复现步骤，并检查受影响的相邻操作。只看页面截图，不能证明表单提交、持久化或权限流程已经正确。

**保留实际验证结果**

Agent 的交付说明应列出实际访问的页面、使用的角色、执行的操作、观察到的结果，以及发现问题后的复测情况，并保留必要的关键状态截图。

没有可用浏览器、应用无法启动或缺少登录会话时，应明确记录阻碍和未验证项。对本次发现且需要持续防止回归的问题，再补充相应的固定测试用例。

### 人工验证

人工验证由开发者、测试人员或业务使用者直接操作应用，重点判断业务流程、操作入口和反馈是否符合实际工作需要。Agent 的验证记录可以作为参考，使用者仍应独立检查自己关心的场景。

**按角色走通业务流程**

准备需要验证的应用版本、环境、账号和数据。使用实际业务角色的账号，不要只用管理员账号测试。在每个场景开始前明确前置条件、操作和预期结果，再按日常使用顺序完成整个流程，包括跨页面操作和角色之间的交接。

以商品管理为例，可以记录以下场景。表中的结果是预期，实际执行后还需要填写观察到的结果：

| 角色与前置条件 | 操作 | 预期结果 |
| --- | --- | --- |
| 编辑员已登录 | 创建商品，然后刷新页面 | 商品仍存在，状态为草稿 |
| 编辑员拥有一个草稿商品 | 发布商品，再打开公开目录 | 状态变为已发布，公开目录中可以找到商品 |
| 只读账号已登录 | 打开商品页面并查看记录 | 可以查看，没有创建或发布入口 |

执行时检查页面反馈与实际数据是否一致，并使用不同账号核对可见数据是否符合各自的职责。

每个场景记录“操作、预期结果、实际结果、通过或失败”。发现问题时，补充应用版本、角色、相关数据和复现步骤，必要时附截图或错误信息，让开发者能够复现。

**检查交互体验与异常处理**

在正常流程之外，尝试用户可能遇到的操作和中断：

| 场景 | 检查重点 |
| --- | --- |
| 缺少必填项或输入无效内容 | 提示是否指出问题，用户是否知道如何修正 |
| 取消、返回或重新进入页面 | 状态是否符合预期，未保存内容是否得到妥善处理 |
| 重复点击或请求较慢 | 是否有等待反馈，是否产生重复提交或重复记录 |
| 请求失败后重试 | 输入是否保留，错误是否易懂，恢复后能否继续操作 |
| 使用项目要求的屏幕尺寸或键盘操作 | 内容是否完整，焦点顺序和操作入口是否可用 |

失败与延迟应在可控的测试环境中复现，例如使用浏览器开发工具调整网络条件，并在测试后恢复。示例中的确定性失败和延迟由自动化用例控制，具体方式见 [client 测试](#client组件交互与状态)和 [playwright 测试](#使用-playwright-自动验证)。

邀请实际使用者检查业务术语、操作顺序和反馈是否符合日常工作需要。把新增发现补充到测试场景中；对于能够稳定复现、需要反复检查的问题，再补成自动化用例。

修改后先复测原问题，再走一遍相关的正常流程和其他受影响角色的操作。应用版本、配置、数据库或浏览器环境变化后，需要在目标环境重新检查关键场景，并更新记录。

## 示例源码与运行

[商品管理示例 App](https://github.com/nocobase/docs-examples-v3/tree/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance)存放在 `nocobase/docs-examples-v3`，本页链接固定到同一提交。使用 Node.js 24 和 pnpm 11.7.0：

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 3e886903c7965530dd6ca50c7840d6ae991f2799
cd apps/testing-acceptance
pnpm install --frozen-lockfile
pnpm setup
pnpm dev
```

打开开发命令打印的完整应用地址，进入 **Products**。从 `storage/demo.json` 读取编辑员或只读账号的邮箱和密码登录。`setup` 保留已有配置和账号，重新运行不会重置数据；不要提交生成的凭据、配置和数据库。

编辑员填写 **Product name** 和 **Price in cents** 后点击 **Create draft**，再点击行内 **Publish**。页面显示前 50 条商品；公开目录只显示已发布商品，HTTP CSV 按当前账号的数据权限导出，CLI JSON 只导出公开商品。数据在刷新和重启后保留。

[README](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/README.md) 提供局域网访问、部署构建、全部测试命令及“文档用法—源码—验证结果”的对应关系。测试采用 SQLite，未验证其他数据库、其他浏览器引擎或多进程运行。依赖版本、实际执行记录和截图生成方法也记录在 README 中。
