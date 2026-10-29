---
title: 测试与验收
description: 按应用目录组织客户端、服务端、数据库、命令行与浏览器测试，并完成构建检查和功能验收。
---

应用的测试围绕实际改动来组织：组件测试验证交互，服务端测试验证接口和权限，数据库测试验证结构和记录，命令行测试验证命令行为，浏览器测试验证完整的操作流程。先选择能覆盖问题的测试层，再补充必要的应用集成测试和人工验收。

本文以默认应用模板的测试配置为基础。已有项目请保留自己的配置、别名和初始化文件；示例中用到的业务文件，需要先按对应的章节创建。

## 测试目录与运行命令

测试集中放在应用根目录的 `tests/` 中，与源代码的职责一一对应。按需创建目录，测试用例命名为 `*.test.ts` 或 `*.test.tsx`：

```tree
my-app/
├── tests/
│   ├── client/          # 页面、组件、Hook 与客户端服务
│   ├── server/          # HTTP 接口、业务服务与权限
│   ├── database/        # 迁移、Seed、查询与事务
│   ├── cli/             # 应用命令
│   ├── project/         # 项目配置与构建产物
│   ├── fixtures/        # 测试数据与示例应用
│   ├── helpers/         # 共享测试辅助函数
│   ├── setup/           # 测试环境初始化
│   └── playwright/      # 浏览器测试（按需）
├── vitest.config.ts
└── playwright.config.ts
```

默认模板的 Vitest 配置包含两个 project：`client` 使用基于 jsdom 的应用测试环境，发现 `tests/client/` 下的用例；`node` 发现 `tests/server/`、`tests/database/`、`tests/cli/` 和 `tests/project/` 下的用例。浏览器测试由 Playwright 单独执行。

在应用根目录运行：

```bash
pnpm test
pnpm test --project client
pnpm test --project node tests/database/app-statuses.test.ts
pnpm test:watch
pnpm test:coverage
```

第三条命令用于运行下文创建的数据库测试。其他文件也可以按实际路径筛选，不需要为每一类测试再建一份配置。

`@nocobase/app-testing` 提供以下公开入口：

| 入口 | 主要工具 | 用途 |
| --- | --- | --- |
| `/client` | `renderWithApp()`、`answerApi()` | 渲染依赖应用服务的组件，控制 HTTP 响应 |
| `/server` | `createAppTest()`、`createTestApp()` | 在隔离的数据库上启动应用，验证真实的接口和插件集成 |
| `/server` | `createDatabaseTest()`、`describeMigration()` | 不启动完整应用，验证数据库行为和迁移 |
| `/cli` | `bindAppCommand()`、`runAppCommand()`、`createTestAppConfig()`、`bindTestAppCommand()` | 执行命令、捕获输出，并按需提供隔离的应用配置 |

没有 `/database` 或 `/playwright` 入口，浏览器测试直接使用 `@playwright/test`。

> [!NOTE]
> 默认模板允许 Vitest 在没有找到测试时正常退出，`test:e2e` 也带有 `--pass-with-no-tests`。因此，命令成功退出并不代表功能已经通过验收：请检查测试报告中的文件名、用例数和跳过项。要求必须实际运行测试的 CI，可以关闭相应的选项。

## 客户端测试

测试放在 `tests/client/` 中，导入真正的页面、组件、Hook 或服务。被测组件依赖应用服务时，用 `renderWithApp()` 提供客户端运行时、路由、API Client 和多语言环境，用 `answerApi()` 控制接口的响应。

按页面的实际行为准备断言：

| 场景 | 验证内容 |
| --- | --- |
| 加载与空数据 | 加载状态可见；数据为空时有明确提示，不显示上一次的结果 |
| 提交成功 | 请求的方法、路径和数据正确；成功反馈和列表更新正确 |
| 请求失败与重试 | 错误提示易于理解；重试时清除旧错误，成功后恢复操作 |
| 提交尚未完成 | 按钮被禁用，或能防止重复请求；不会提前显示成功 |
| 路由与筛选 | URL 参数、分页与返回操作保持一致 |
| 权限与会话 | 没有权限时正确处理入口；会话失效时提示重新登录 |
| 多语言 | 使用真实的语言资源，至少检查应用支持的主要语言 |

保留真实的 `useApiClient()`、翻译和路由逻辑，只在 HTTP 边界上提供响应。`answerApi()` 接收 `/api/` 之后的路径，例如 `tasks`；需要指定状态码时，返回一个 `Response`。对未知的请求应明确失败，以免所有请求都返回成功、掩盖了路径错误。

在测试内部调用 `renderWithApp()`，它会在用例结束时关闭客户端应用。沿用模板的 React 测试环境和 DOM 清理，不要再包一层 Router，也不要为了绕过缺失的文案而关闭严格的翻译检查。点击等操作放在 `waitFor()` 之外，`waitFor()` 中只做断言。

客户端业务服务可以先直接构造实例来验证方法，再用真实的容器检查注册、订阅和资源释放。需要验证 React Provider 时，导入实际的组件；这与服务容器中的 ServiceProvider 是两层不同的集成，见 [客户端业务服务](client-business-services.md) 和 [UI 组件与交互](pages-and-interactions.md)。

完整的请求、重试和防重复提交示例见 [客户端测试示例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/client/page.md)。默认模板中的 `tests/client/page-harness.test.tsx` 还演示了权限、日期格式和路由弹窗。使用受控响应的组件测试并不能证明服务端授权或数据库持久化是正确的，这两部分要继续用下面的真实应用测试来验证。

## 服务端测试

服务方法中的计算和分支可以直接测试；涉及插件注册、登录、权限、迁移或接口中间件时，用 `createAppTest()` 启动真实的应用。

下面用默认模板已有的用户接口演示测试夹具，前提是应用保留了认证、授权、用户插件以及默认的管理员策略。创建 `tests/server/users.test.ts`：

```ts
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createAppTest } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
  },
});

test('rejects an anonymous request', async ({ request }) => {
  expect((await request('/users')).status).toBe(401);
});

test('reads the administrator after sign-in', async ({ testApp }) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch(
    `/users?q=${encodeURIComponent(admin.user.email)}`,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    data: expect.arrayContaining([
      expect.objectContaining({ id: admin.user.id }),
    ]),
  });
});
```

```bash
pnpm test --project node tests/server/users.test.ts
```

测试配置中的密钥和管理员只用于隔离的测试。夹具会安装应用和插件的迁移与 Seed，提供临时存储，并在结束后自动关闭应用。请求在进程内执行，不监听 HTTP 端口；`request('/users')` 会交给应用的 API 路由处理。

`createAppTest()` 默认在同一个文件中共享应用和数据库。如果需要为每个用例独立安装，请设置 `scope: 'test'`；在共享模式下，各用例应使用自己的记录，不依赖执行顺序。应用有多个自有连接时，在 `connections` 中全部列出，例如 `['main', 'analytics']`；未列出的连接仍沿用应用配置。

这两个用例只演示登录的边界。测试你自己的业务接口时，换成真实的路由，并覆盖以下情况：

- 未登录、已登录但未授权、已授权三种身份；公开接口则按自己的访问策略判断。
- 参数非法、对象不存在、状态不允许等分支，以及实际返回的错误结构。
- 写入后重新查询，确认记录和关联数据都已保存；失败时，检查没有发生部分写入。
- 列表、详情和统计都遵守数据范围；普通用户无法访问其他用户的数据。

隐藏页面入口不能代替接口的权限验证。修改默认角色或授权 Seed 时，也要运行模板中的 `tests/server/authorization-assignment-safety.test.ts`。完整的身份与权限示例见 [服务端测试示例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/server/routes.md)。

## 数据库与命令行测试

### 数据库

数据库用例放在 `tests/database/` 中。用 `describeMigration()` 检查迁移，用 `createDatabaseTest()` 检查查询、约束、Seed 的结果和事务；两者都从 `@nocobase/app-testing/server` 导入。

例如，完成 [建表与数据初始化](data-models-and-migrations.md) 中的 `appStatuses` 示例后，创建 `tests/database/app-statuses.test.ts`：

```ts
import { fileURLToPath } from 'node:url';
import {
  createDatabaseTest,
  describeMigration,
} from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import packageMetadata from '../../package.json' with { type: 'json' };

const migrations = [{
  packageName: packageMetadata.name,
  directory: fileURLToPath(
    new URL('../../database/main/migrations/', import.meta.url),
  ),
}];
const seeds = [{
  packageName: packageMetadata.name,
  directory: fileURLToPath(
    new URL('../../database/main/seeds/', import.meta.url),
  ),
}];

describeMigration('202611040001_create_app_statuses', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    await expectCollection('appStatuses').toHaveField('code', {
      type: 'string',
      nullable: false,
    });
    await expectCollection('appStatuses').toHaveField('title', {
      type: 'string',
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('appStatuses').not.toExist();
  },
});

const test = createDatabaseTest({ migrations, seeds });

test('installs the default statuses', async ({ connection }) => {
  const statuses = connection.repository('appStatuses');
  for (const record of [
    { code: 'draft', title: 'Draft' },
    { code: 'published', title: 'Published' },
  ]) {
    await expect(
      statuses.findOne({ filter: { code: record.code } }),
    ).resolves.toMatchObject(record);
  }
});
```

`describeMigration()` 在真实数据库上依次应用迁移、回退、再次应用，所以 `up` 中的断言会执行两次。`createDatabaseTest()` 默认在每个用例中重置结构，重新运行传入的迁移和 Seed，结束后清理数据库。它不会自动加载应用的插件；如果资源依赖插件的表，请补齐所需的资源来源，或者使用完整的应用夹具。

上例验证了建表、回退和首次初始化。Seed 还应验证面对已有记录以及重复执行时的行为，例如是否保留了管理员改过的名称；事务则要在主动触发失败后重新读取数据，确认写入全部回滚。如果已有的迁移包含数据转换，请先准备旧数据，再检查升级的结果。

`NOCOBASE_TEST_DB_DIALECT` 用于选择测试的方言，默认为 SQLite。要验证目标数据库，请安装对应的驱动，配置该驱动需要的测试服务，然后运行相同的用例。例如：

```bash
NOCOBASE_TEST_DB_DIALECT=postgres pnpm test --project node tests/database/app-statuses.test.ts
```

测试服务需要允许创建和清理隔离的数据库或 schema。在 SQLite 上通过，并不代表 PostgreSQL 等其他方言也已验证。连接设置见 [数据库测试示例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/database/repository.md)，事务断言的思路见 [事务与数据一致性](transactions-and-consistency.md)。

### 命令行

命令测试放在 `tests/cli/` 中，导入 `cli/commands/` 中实际的命令类。根据命令需要的能力选择夹具：

| 命令行为 | 测试方式 |
| --- | --- |
| 解析参数、操作文件，不启动应用 | 用 `bindAppCommand()` 绑定临时的应用根目录和命令 ID，再用 `runAppCommand()` 执行 |
| 需要真实的应用服务或数据库 | 用 `createTestAppConfig()` 准备隔离的配置，用 `bindTestAppCommand()` 绑定命令，执行后在 `finally` 中调用 `config.dispose()` |

检查 `runAppCommand()` 返回的 `error`、`result`、`stdout`、`stderr` 和 `json()`。成功时 `exitCode` 可能是 `undefined`，可以用 `exitCode ?? 0` 统一处理。失败的用例还要断言非零的退出码和约定的错误代码。

以 [编写应用命令](application-commands.md) 中导出状态字典的命令为例，需要验证正常导出及文件内容、预览时不写文件、字典为空、已有文件不被覆盖，以及失败后资源被释放。只检查帮助输出或命令能被发现，不能证明导出功能正常。

捕获命令输出涉及进程级的状态，因此这些测试应按顺序执行；数据库命令还要提供它实际需要的迁移和 Seed。完整的示例见 [文件命令测试](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/files.md) 和 [数据库命令测试](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/command.md)。

## 浏览器测试与功能验收

浏览器测试放在 `tests/playwright/` 中。默认模板提供了 Playwright 的配置和命令，但具体的用例需要按应用功能添加。先启动一个独立的测试应用，使用 `pnpm dev` 输出的完整 `Local:` 地址，包括 `/main/` 等基础路径。进程内的服务端夹具不能直接作为浏览器的访问地址。

下面的登录检查假设应用保留了默认的英文登录页，并且登录后的首页有一个一级标题。创建 `tests/playwright/sign-in.test.ts`；如果界面不同，请调整定位条件：

```ts
import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('signs in and keeps the session after reload', async ({ page }) => {
  const entry = process.env.APP_URL;
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  if (!entry || !username || !password) {
    throw new Error('Set APP_URL, E2E_USERNAME and E2E_PASSWORD.');
  }
  const appUrl = new URL(`${entry.replace(/\/+$/, '')}/`);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(new URL('login', appUrl).href);
  await page.getByLabel('Username or email').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(
    (url) => !url.pathname.replace(/\/$/, '').endsWith('/login'),
  );
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const session = await page.request.get(
    new URL('api/auth/get-session', appUrl).href,
  );
  expect(session.status()).toBe(200);
  await expect(session.json()).resolves.toMatchObject({
    user: { id: expect.any(String) },
  });
  expect(pageErrors).toEqual([]);
});
```

在终端或 CI 环境中设置测试应用的 `APP_URL`、`E2E_USERNAME` 和 `E2E_PASSWORD`，然后运行：

```bash
pnpm exec playwright install chromium
pnpm test:e2e tests/playwright/sign-in.test.ts
```

Chromium 只需在首次使用时安装。`APP_URL` 形如 `http://127.0.0.1:13000/main/`，以实际的应用地址为准；代码中使用相对路径 `login`，以免丢失部署的基础路径。请使用专门的测试账号和数据，凭据通过环境变量传入。多个用例需要复用登录状态时，可以参考 [保存与复用会话的示例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/playwright/login.md)。

登录检查只是起点。业务验收还应验证一次完整的操作：从页面进入，填写并提交，确认成功，刷新后重新读取，再用没有权限的账号检查拒绝行为。根据改动，再补充浏览器后退、网络失败、移动端布局、键盘焦点和弹窗滚动等检查。自动化断言覆盖的是行为，人工验收则检查排版、可读性和操作体验。

## 构建检查与交付标准

开发过程中，先运行受影响的测试文件，修复失败后再扩大到相关的测试组。交付应用代码之前，结合改动内容和项目要求，进行以下检查：

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

默认模板的 `pnpm check` 汇总了包检查、lint、格式、类型、Vitest 和构建，但浏览器测试仍需单独执行。如果只修改了文档，检查文档自身的链接和构建即可，不必重复执行全部业务测试。

提交验收结果时，记录实际执行的命令、测试文件及结果、数据库方言、用户角色和关键流程。明确列出跳过项和未验证项，例如只测试了 SQLite、没有运行浏览器测试或没有检查部署产物，不要把它们记为通过。

**完成的标志**：改动涉及的行为、数据和权限都有相应的验证；类型检查和构建按项目要求通过；需要在浏览器中确认的流程已完成验收，剩余的限制都有明确记录。
