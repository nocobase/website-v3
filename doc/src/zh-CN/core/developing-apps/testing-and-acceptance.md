---
title: 测试与验收
description: 为数据库、接口和页面选择合适的测试方式，用真实权限与浏览器流程验证业务结果。
---

测试要证明业务行为：数据确实保存、非法输入没有写入、权限不能绕过、失败后用户可以继续操作。类型检查和构建通过只能证明其中一部分，不能替代真实数据库与用户操作的验证。

本篇以[搭建第一个应用](../tutorials/build-your-first-feature.md)中的 npm 示例为参照，使用默认模板 `1.0.0-beta.81`、`tasks` 接口和对应测试目录。项目专题中的历史示例使用另一套表名与测试配置，运行时按对应章节的基线操作。

## 使用 Agent

```text
请检查任务应用的数据保存、角色权限和页面操作是否正确，补齐必要的自动化测试。
用独立测试数据验证，保留现有业务数据；发现问题就修好，最后说明通过和未验证的部分。
```

## 不使用 Agent

### 按行为选择测试层次

| 要证明的行为 | 推荐方式 | 不足以证明它的方式 |
| --- | --- | --- |
| 纯函数的计算或转换 | 单元测试 | 启动整个应用但不检查边界值 |
| 字段、约束、关联、事务 | 真实测试数据库 | mock Repository 后断言返回值 |
| 迁移保留旧数据并可按设计回滚 | `describeMigration()` | 只导入迁移文件或只测空库 |
| 登录、授权、参数和持久化 | 启动真实应用的接口测试 | 直接调用绕过中间件的业务函数 |
| 表单、加载、错误与重试 | 实际组件加应用测试环境 | 把 `useApiClient`、翻译和权限 hooks 全部替换 |
| 历史导航、焦点、真实跨页面流程 | 浏览器测试 | jsdom 中断言没有布局的元素位置 |

使用能够证明行为的最小层次。权限与持久化需要真实服务；可控的网络失败可以在组件测试中替换传输边界，但这类测试不证明服务端权限正确。

### 组织测试文件与运行环境

新业务测试按被测代码放在 `tests/` 下，不放在被测源码旁边：

```text
tests/
├── cli/          # Application commands (when needed)
├── client/       # Pages, components and client behavior
├── database/     # Repositories and migrations
├── fixtures/     # Test data and fixture resources
├── helpers/      # Shared test helpers
├── playwright/   # Browser flows against a running app
├── project/      # Configuration, source rules and builds
├── server/       # APIs, services and permissions
└── setup/        # Test environment setup
```

当前模板在 `vitest.config.ts` 中配置两个测试项目：`node` 发现 `tests/{server,database,cli,project}/` 中的测试，`client` 发现 `tests/client/`，并提供 React／jsdom 环境。`tests/playwright/` 使用单独的 Playwright 配置。保留已有别名、setup 与数据库隔离约定；不要只新建目录却漏配发现规则。

在应用目录运行：

```bash
pnpm test
```

它运行上述 Vitest 测试，不包含浏览器测试。旧项目仍使用 `tests/logic/`、`tests/components/` 或 `vitest.tutorial.config.ts` 时，应按那个版本的配置执行；升级模板时再同步目录与发现规则，避免漏跑或重复执行。

### 选择真实数据库和应用 fixture

`@nocobase/app-testing` 的常用入口是 `/server`、`/client` 和 `/cli`。没有独立的 `/database` 或 `/playwright` 导出。

| 工具 | 使用场景 | 注意事项 |
| --- | --- | --- |
| `createDatabaseTest()` | 不启动应用的 Repository 与事务测试 | 提供所需迁移；插件 Provider 不会自动接入 |
| `describeMigration()` | 升级、回滚、重新应用迁移 | 用旧数据验证，不修改已合并迁移 |
| `createAppTest()` | 真实路由、插件、登录和授权 | 使用隔离测试存储；通常一个文件共享应用 |
| `createTestApp()` | 需要自己控制应用生命周期 | 在 `finally` 中关闭应用 |
| `renderWithApp()` | 使用实际应用客户端服务的组件 | 保留真实 hooks、路由与翻译，控制必要传输边界 |

数据库 fixture 根据 `NOCOBASE_TEST_DB_DIALECT` 选择方言，未指定时默认 SQLite。测试不要自己硬编码 `:memory:` 或某个驱动来绕开 fixture；模型断言使用 `expectCollection()`，避免用某一方言的内部表证明通用模型。

需要验证生产数据库的约束、查询或性能时，再在对应数据库和有代表性的数据量上运行。SQLite 中的小样本通过，不等于其他数据库的执行计划和性能已验证。

### 通过真实接口验证持久化

下面是可以放入 `tests/server/tasks-persistence.test.ts` 的最小例子，前提是应用已经实现任务接口。它启动应用、通过真实登录取得会话、创建任务，再重新查询，而不是 mock 数据库返回值：

```ts
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'tutorial-test-secret-at-least-32-characters',
      advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
    logging: { enabled: false },
  },
});

test('persists a task through the real API', async ({ testApp }) => {
  expect((await testApp.request('/tasks')).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const title = `Persistence ${randomUUID()}`;
  const created = await admin.fetch('/tasks', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify({ title }),
  });
  expect(created.status).toBe(201);
  const { data: task } = (await created.json()) as { data: { id: string } };

  const list = await admin.fetch(`/tasks?q=${encodeURIComponent(title)}`);
  expect(list.status).toBe(200);
  expect(await list.json()).toMatchObject({
    data: expect.arrayContaining([
      expect.objectContaining({ id: task.id, title }),
    ]),
  });
});
```

固定密钥与管理员凭据仅属于这个隔离测试配置。fixture 在进程内提供请求接口，不会启动可供浏览器访问的服务端端口。已有 `tests/server/tasks.test.ts` 已覆盖类似行为时，直接扩展现有测试，不再复制一份。

这个例子证明未登录拒绝和管理员创建后可读取，尚未证明普通用户的数据范围。权限测试还需创建独立用户和明确角色，通过真实登录执行允许与拒绝请求，并检查失败后的数据库状态。

### 验证迁移和事务

迁移测试先应用历史迁移并写入一条旧任务，再应用新迁移，检查原字段、新字段默认值和约束；然后按设计回滚并重新应用。完整代码见[数据模型与迁移](data-models-and-migrations.md)。`down()` 删除的新字段数据不会被自动恢复，应作为预期的数据损失明确验证。

事务测试要在一次事务中先写入，再制造后续失败，最后在事务外重新读取，证明早先写入也被回滚。只断言抛出了异常，不能证明数据库没有部分变更。

### 验证组件和交互

导入真正的页面或组件，使用 `renderWithApp()` 提供客户端环境。保留实际翻译、API client、路由与权限 hooks。当前示例的 `tests/client/tasks.test.tsx` 通过 `tests/helpers/authenticated-client.tsx` 连接真实测试应用、数据库和登录会话；模板中的 `tests/client/page-harness.test.tsx` 展示通用页面测试工具。

需要稳定复现提交中、网络失败或重试时，可用 `answerApi()` 控制 HTTP 响应。jsdom 缺失的 `ResizeObserver` 等能力也可在该边界补足，但应在真实浏览器验证布局；不要借此替换正在验证的业务逻辑。

优先断言用户看见和操作的行为：字段错误及焦点、输入保留、重复提交阻止、失败后重试、成功后更新列表。不要只检查内部函数调用次数或把整页快照当作验收。

### 验证浏览器流程与权限

先启动独立的测试应用，并使用它自己的测试管理员账号：

```bash
pnpm exec playwright install chromium
TUTORIAL_ORIGIN=http://127.0.0.1:13000 \
TUTORIAL_USERNAME='your-test-admin' TUTORIAL_PASSWORD='your-test-password' \
pnpm test:e2e
```

当前示例的 `tests/playwright/tasks.test.ts` 使用英文界面，`TUTORIAL_ORIGIN` 只填协议、主机和实际端口，脚本会拼接 `/main`。它不同于历史项目示例的 `APP_URL`；若改变应用基础路径，需要同时调整测试脚本。安装 Chromium 只需在首次运行时执行。

测试会创建测试用户和任务，部分账号会保留；不要指向生产应用，也不要把凭据写入源码、截图或报告。

验收至少包括：

- 正常用户完成操作，刷新或重新读取后结果仍正确。
- 只给页面访问权限时，接口仍因缺少业务权限被拒绝。
- 只有业务操作权限但没有页面权限时，不能进入页面；直接 API 的结果按业务权限判定。
- 数据范围外的任务和项目不泄露，列表总数也遵守范围。
- 检查普通账号全部直接与继承授权，避免因另一个角色放行而误判。
- 提交中、网络失败、对象已删除、权限撤销和浏览器后退等状态得到相应反馈。

初始化权限变更还应运行 `tests/server/authorization-assignment-safety.test.ts`，检查隔离应用里实际产生的默认授权。它不能替代逐个业务操作的权限测试。

## 按影响范围执行检查

例如只修改任务接口时，先运行服务端测试；修改页面交互时，再运行组件及浏览器测试：

```bash
pnpm test --project node tests/server/tasks.test.ts
pnpm test --project client tests/client/tasks.test.tsx
```

同时对改动文件运行格式和 lint，选覆盖改动的 TypeScript 项目检查类型。构建、迁移和部署相关变更再检查相应产物与运行路径。不要每次小改动都机械执行整应用 `pnpm check`，也不要把零测试、跳过测试或缺失环境写成通过。

## 交付验收记录

记录改动范围、执行的命令与结果、实际验证的用户角色和流程、未验证项及原因。截图帮助读者理解界面，断言证明行为；例行测试不应只保存截图却没有结果判断。

文档修改通常检查格式、链接和文档站构建即可；应用代码未改动时，不需要为了更新文字重复运行全部业务测试。需要再次验证时，依据新改动、失败或尚未覆盖的风险扩大范围。
