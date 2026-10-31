---
title: 测试与验收
description: 按应用目录组织客户端、服务端、数据库、命令行与浏览器测试，并完成构建检查和功能验收。
---

应用测试围绕实际改动组织：组件测试验证交互，服务端测试验证接口与权限，数据库测试验证结构与记录，命令行测试验证命令行为，浏览器测试验证完整操作。选择能覆盖问题的测试层，再补充必要的应用集成和人工验收。

本文以默认应用模板的测试配置为基础。已有项目保留自己的配置、别名和初始化文件；示例中的业务文件需要先按对应章节创建。

## 测试目录与运行命令

测试集中放在应用根目录的 `tests/`，与源代码的职责对应。按需创建目录，用例命名为 `*.test.ts` 或 `*.test.tsx`：

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

第三条命令用于下文创建的数据库测试。其他文件也可以按实际路径筛选；无需为每一类测试再创建一份配置。

`@nocobase/app-testing` 提供以下公开入口：

| 入口 | 主要工具 | 用途 |
| --- | --- | --- |
| `/client` | `renderWithApp()`、`answerApi()` | 渲染依赖应用服务的组件，控制 HTTP 响应 |
| `/server` | `createAppTest()`、`createTestApp()` | 在隔离数据库上启动应用，验证真实接口与插件集成 |
| `/server` | `createDatabaseTest()`、`describeMigration()` | 不启动完整应用，验证数据库行为和迁移 |
| `/cli` | `bindAppCommand()`、`runAppCommand()`、`createTestAppConfig()`、`bindTestAppCommand()` | 执行命令、捕获输出，按需提供隔离应用配置 |

没有 `/database` 或 `/playwright` 入口。浏览器测试直接使用 `@playwright/test`。

> [!NOTE]
> 默认模板允许 Vitest 没有找到测试时正常退出，`test:e2e` 也带有 `--pass-with-no-tests`。命令退出成功不等于功能已通过验收：检查测试报告中的文件名、用例数和跳过项。要求必须运行测试的 CI 可以关闭相应选项。

## 客户端测试

将测试放在 `tests/client/`，导入真正的页面、组件、Hook 或服务。测试组件依赖应用服务时，使用 `renderWithApp()` 提供客户端运行时、路由、API Client 和多语言环境；用 `answerApi()` 控制接口响应。

按页面的实际行为准备断言：

| 场景 | 验证内容 |
| --- | --- |
| 加载与空数据 | 加载状态可见；空数据有明确提示，不显示上一次结果 |
| 提交成功 | 请求方法、路径和数据正确；成功反馈与列表更新正确 |
| 请求失败与重试 | 错误提示可理解；重试时清除旧错误，成功后恢复操作 |
| 提交尚未完成 | 按钮禁用或防止重复请求，不提前显示成功 |
| 路由与筛选 | URL 参数、分页与返回操作保持一致 |
| 权限与会话 | 无权限时入口正确处理；会话失效时提示重新登录 |
| 多语言 | 使用真实语言资源，至少检查应用支持的主要语言 |

保留真实的 `useApiClient()`、翻译和路由逻辑，在 HTTP 边界提供响应。`answerApi()` 接收 `/api/` 以下的路径，例如 `tasks`；需要指定状态码时返回 `Response`。未知请求应明确失败，避免所有请求都返回成功而掩盖路径错误。

在测试内部调用 `renderWithApp()`，它会在用例结束时关闭客户端应用。沿用模板的 React 测试环境与 DOM 清理，不重复包裹另一套 Router，也不关闭严格翻译检查来绕过缺失文案。点击等操作放在 `waitFor()` 外，等待时只做断言。

客户端业务服务可以先直接构造实例验证方法，再用真实容器检查注册、订阅和资源释放。需要验证 React Provider 时导入实际组件；这与服务容器里的 ServiceProvider 是两层不同的集成，见[客户端服务](client-business-services.md)和 [UI 组件与交互](pages-and-interactions.md)。

完整的请求、重试和防重复提交示例见[客户端测试示例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/client/page.md)。默认模板的 `tests/client/page-harness.test.tsx` 还展示了权限、日期格式和路由弹窗。使用受控响应的组件测试不证明服务端授权或数据库持久化正确，这两部分继续用下面的真实应用测试验证。

## 服务端测试

服务方法的计算和分支可以直接测试；涉及插件注册、登录、权限、迁移或接口中间件时，使用 `createAppTest()` 启动真实应用。

下面以默认模板已有的用户接口演示测试夹具。前提是应用保留认证、授权、用户插件及默认管理员策略。创建 `tests/server/users.test.ts`：

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

测试配置中的密钥与管理员仅供隔离测试使用。夹具安装应用及插件的迁移和 Seed，提供临时存储，并自动关闭应用。请求在进程内执行，不监听 HTTP 端口；`request('/users')` 会交给应用 API 路由。

`createAppTest()` 默认在同一文件内共享应用和数据库。需要每个用例独立安装时设置 `scope: 'test'`；共享模式下使用各用例自己的记录，不依赖执行顺序。应用有多个自有连接时，在 `connections` 中全部列出，例如 `['main', 'analytics']`，未列出的连接仍沿用应用配置。

这两个用例只演示登录边界。测试自己的业务接口时，换成真实路由，并覆盖：

- 未登录、已登录但未授权、已授权三种身份；公开接口按自己的访问策略判断。
- 参数非法、对象不存在、状态不允许等分支，以及实际返回的错误结构。
- 写入后重新查询，确认记录与关联数据已保存；失败时检查没有部分写入。
- 列表、详情和统计都遵守数据范围；普通用户无法访问其他用户的数据。

页面入口隐藏不能替代接口权限验证。修改默认角色或授权 Seed 时，也运行模板的 `tests/server/authorization-assignment-safety.test.ts`。完整身份与权限例子见[服务端测试示例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/server/routes.md)。

## 数据库与命令行测试

### 数据库

数据库用例放在 `tests/database/`。使用 `describeMigration()` 检查迁移，用 `createDatabaseTest()` 检查查询、约束、Seed 结果和事务；二者均从 `@nocobase/app-testing/server` 导入。

例如，完成[建表与数据初始化](data-models-and-migrations.md)中的 `appStatuses` 示例后，创建 `tests/database/app-statuses.test.ts`：

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

`describeMigration()` 在真实数据库中应用迁移、回退、再次应用，`up` 断言会执行两次。`createDatabaseTest()` 默认每个用例重置结构并重新运行传入的迁移和 Seed，结束后清理数据库。它不会自动加载应用插件；如果资源依赖插件表，补齐所需资源来源，或使用完整应用夹具。

上例验证建表回退和首次初始化。Seed 还应验证已有记录与重复执行时的行为，例如保留管理员改过的名称；事务要在主动触发失败后重新读取，确认写入全部回滚。已有迁移包含数据转换时，先准备旧数据，再检查升级结果。

`NOCOBASE_TEST_DB_DIALECT` 选择测试方言，默认 SQLite。验证目标数据库时，安装匹配驱动并配置该驱动需要的测试服务，再运行相同用例。例如：

```bash
NOCOBASE_TEST_DB_DIALECT=postgres pnpm test --project node tests/database/app-statuses.test.ts
```

测试服务需允许创建和清理隔离数据库或 schema；SQLite 通过不代表 PostgreSQL 等其他方言已验证。连接设置见[数据库测试示例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/database/repository.md)，事务断言思路见[事务与数据一致性](transactions-and-consistency.md)。

### 命令行

命令测试放在 `tests/cli/`，导入 `cli/commands/` 中实际的命令类。根据命令需要的能力选择夹具：

| 命令行为 | 测试方式 |
| --- | --- |
| 解析参数、操作文件，不启动应用 | `bindAppCommand()` 绑定临时应用根目录与命令 ID，再用 `runAppCommand()` 执行 |
| 需要真实应用服务或数据库 | `createTestAppConfig()` 准备隔离配置，`bindTestAppCommand()` 绑定命令，再执行并在 `finally` 中调用 `config.dispose()` |

检查 `runAppCommand()` 返回的 `error`、`result`、`stdout`、`stderr` 和 `json()`；成功时 `exitCode` 可以是 `undefined`，用 `exitCode ?? 0` 归一化。失败用例还要断言非零退出码及约定的错误代码。

以[编写应用命令](application-commands.md)的状态字典导出为例，验证正常导出和文件内容、预览不写文件、空字典、已有文件不被覆盖，以及失败后的资源释放。只检查帮助输出或命令被发现，不能证明导出正常。

命令输出捕获涉及进程级状态，应顺序执行；数据库命令还要提供实际需要的迁移和 Seed。完整例子见[文件命令测试](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/files.md)和[数据库命令测试](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/command.md)。

## 浏览器测试与功能验收

浏览器测试放在 `tests/playwright/`。默认模板提供 Playwright 配置和命令，但需要按应用功能添加用例。先启动独立测试应用，使用 `pnpm dev` 输出的完整 `Local:` 地址，包括 `/main/` 等基础路径。进程内服务端夹具不能直接作为浏览器访问地址。

下面的登录检查假设应用保留默认英文登录页，登录后首页有一级标题。创建 `tests/playwright/sign-in.test.ts`，界面不同则调整定位条件：

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

在终端或 CI 环境中设置测试应用的 `APP_URL`、`E2E_USERNAME` 和 `E2E_PASSWORD` 后运行：

```bash
pnpm exec playwright install chromium
pnpm test:e2e tests/playwright/sign-in.test.ts
```

Chromium 首次使用时安装即可。`APP_URL` 例如 `http://127.0.0.1:13000/main/`，以实际应用地址为准；代码使用相对路径 `login`，避免丢失部署基础路径。使用专门的测试账号和数据，凭据通过环境传入。多个用例需要复用登录时，可参考[保存与复用会话的示例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/playwright/login.md)。

登录检查只是起点。业务验收还应验证一次完整操作：从页面进入、填写并提交、确认成功、刷新后重新读取，再用无权限账号检查拒绝行为。按改动补充浏览器后退、网络失败、移动布局、键盘焦点和弹窗滚动检查。自动化断言覆盖行为，人工验收检查排版、可读性和操作体验。

## 构建检查与交付标准

开发时先运行受影响的测试文件，修复失败后再扩大到相关测试组。交付应用代码前，结合改动和项目要求检查：

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

默认模板的 `pnpm check` 聚合包检查、lint、格式、类型、Vitest 和构建；浏览器测试仍需单独执行。只改文档时检查文档自身的链接与构建即可，无需重复执行全部业务测试。

提交验收结果时记录实际执行的命令、测试文件与结果、数据库方言、用户角色和关键流程。明确跳过项和未验证项，例如只测 SQLite、未运行浏览器测试或未检查部署产物，不把它们记为通过。

**完成的标志**：改动涉及的行为、数据和权限都有相应验证；类型检查与构建按项目要求通过；需要浏览器确认的流程已完成验收，剩余限制有明确记录。
