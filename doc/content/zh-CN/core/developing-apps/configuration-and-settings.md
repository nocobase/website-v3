---
title: 应用配置（config.yml）
description: 从 config.yml 修改现有配置，理解客户端与服务端代码配置，添加自己的配置分区并验证覆盖、校验和公开字段。
---

`config.yml` 保存当前应用环境的配置，例如应用标题、数据库连接、默认语言和日志级别。`client/config/` 与 `server/config/` 则定义代码默认值，以及需要通过代码构造的配置。

本篇先修改一个已有配置，再新增 `reports.pageSize`，串起配置声明、覆盖、业务读取和客户端使用。示例依据 Examples 模板，不依赖项目与任务教程。后台管理页面和管理员日常维护的业务设置，由相应业务模块负责。

## 配置放在哪里

| 位置 | 职责 |
| --- | --- |
| `config.example.yml` | 可提交的配置示例，帮助新环境了解需要填写的值 |
| `config.yml` | 当前环境的实际覆盖值；本地文件可能包含凭据，不提交到 Git |
| `client/config/` | 客户端默认配置、认证客户端插件等代码配置 |
| `server/config/` | 服务端各配置分区的默认值、环境变量映射、校验与公开字段 |
| 两端的 `config/index.ts` | 使用 `defaultAppConfigs()` 汇总本端配置，交给运行时 |
| `server/config.ts` | 创建配置服务、选择并加载配置文件 |

注意 `server/config.ts` 是加载入口，`server/config/` 是配置分区目录。模板的 `server/runtime.ts`、`client/runtime.ts` 已经接入各自的配置入口，通常只需维护分区及其 `index.ts`。

`config.example.yml` 展示的是部分常用配置，不是所有可用字段。应用和已接入模块共同提供配置声明，完整字段继续查[配置项参考](../reference/configuration.md)和各模块文档。首次创建应用时通过 `pnpm nocobase config init --dialect sqlite` 初始化本地配置及密钥；已有应用按实际需求修改原配置，见[创建应用](../getting-started/create-app.md)。

## 修改已有配置

在已经初始化的应用中，将下面的值合并进 `config.yml`，保留原有数据库、密钥及其他配置；已有同名分区时修改其字段，避免重复声明顶层键：

```yaml
client:
  app:
    title: My Reports

i18n:
  defaultLocale: zh-CN

logging:
  level: info
```

Examples 的 `client/config/app.ts` 默认标题为 `NocoBase`，配置文件原本将其覆盖为 `NocoBase Examples`。这里再改为 `My Reports` 后，模板的客户端 ServiceProvider 会在启动时将它用于浏览器标签页标题。侧边栏中的应用名称和版本来自另外的公开信息，不能假设改一个标题会替换所有位置的文案。

`i18n.defaultLocale` 设置默认语言，可选语言仍由语言资源决定；已有用户选择或浏览器偏好可能优先于默认值，见[多语言](localization.md)。`logging.level` 设置日志级别，完整日志行为见[日志](../framework/support/logging.md)。

### 覆盖顺序

服务端配置的优先级由低到高为：代码默认值、配置文件、已声明映射的环境变量。客户端自身的默认值由下发到浏览器的 `client` 配置覆盖；应用基础路径、API 地址等宿主管理的值还会由运行时计算。

普通对象递归合并，数组与标量由后者整体替换。环境变量必须在相应配置分区中声明映射，并按声明转换类型；任意起一个变量名不会自动生效。YAML 中的 `${NAME}` 不会自动展开，应使用已声明的环境变量，或为自己的字段添加映射。

例如，`APP_SERVER_PORT` 映射到 `server.port`。它存在时，修改文件中的 `server.port` 仍会被环境变量覆盖。检查最终值时，同时核对应用的启动环境。

## 客户端配置

Examples 的 `client/config/` 包含三个分区：

| 文件 | 内容 |
| --- | --- |
| `app.ts` | 应用标题等客户端默认值 |
| `api.ts` | API Client 的默认访问地址，结合应用基础路径生成 |
| `auth.ts` | 用户名登录、API Key、设备授权等认证客户端插件 |

例如，应用标题的代码默认值可以写成：

```ts
// client/config/app.ts
import { defineAppConfig, type AppConfigFactory } from '@nocobase/app-client';

const app: AppConfigFactory<{ title: string }> = defineAppConfig(() => ({
  title: 'NocoBase',
}));

export default app;
```

`client/config/index.ts` 已将 `app`、`api`、`auth` 传入 `defaultAppConfigs({ ... })`。新增客户端配置时，在这里导入并加入分区；若聚合入口显式声明了返回类型，也要同步类型。

客户端 `defineAppConfig()` 接收一个配置工厂函数。认证插件实例、回调函数等需要通过代码构造，保留在 TypeScript 中；可序列化且允许按环境修改的值，可以由 `config.yml` 的 `client` 分区覆盖。

在客户端 ServiceProvider 中读取标题：

```ts
// Inside a client ServiceProvider:
const title = this.app.config.get<string>('app.title', 'NocoBase');
```

页面或 Hook 可以通过 `useClientApplication().config` 取得同一配置服务。读取路径是 `app.title`，不带文件中的 `client.` 前缀。API 地址受宿主挂载路径管理，不应把 `client.api.baseURL` 当作可以任意覆盖的外部服务地址；独立外部 API 应另行组织访问配置。

## 服务端配置

`server/config/` 同时组织框架与插件的配置。例如，`server.ts`、`api.ts`、`database.ts`、`logging.ts` 处理运行基础能力，`auth.ts`、`users.ts`、`notification.ts`、`knowledge.ts` 等配置已接入的模块。各模块的具体选项由其文档说明，本篇重点介绍统一接入方式。

模块提供专用工厂时，优先使用它，例如 `defineApiConfig()`、`defineAppDatabaseConfig()`、`defineAuthConfig()`；它们可以保留模块自己的默认值、映射和校验规则。应用自有分区使用 `@nocobase/app-server/config` 的 `defineAppConfig()`。

服务端的 `defineAppConfig()` 支持以下声明：

| 字段 | 用途 |
| --- | --- |
| `defaults` | 默认值对象，或根据运行时路径等信息生成默认值的函数 |
| `env` | 环境变量到分区内字段的映射，以及类型和说明 |
| `validate` | 校验合并后的最终值，以 `context.error()` 报告字段问题 |
| `public` | 允许发送给浏览器的叶子字段路径 |

前后端的工厂虽然同名，接口并不相同；不要将服务端的 `env`、`validate`、`public` 对象写法直接套到客户端。

新增分区后，通过 `server/config/index.ts` 注册，再在服务端使用 `app.config.get()` 读取。注册对象的键决定分区名称；只新建文件不会自动接入，也不会因为 YAML 中新增了一个键就产生业务功能。内置配置项见[配置参考](../reference/configuration.md)。

## 向客户端公开配置

浏览器能读取两类配置，它们通过不同入口访问：

| 配置来源 | 客户端读取方式 |
| --- | --- |
| 客户端代码默认值与 `config.yml` 的 `client` 分区 | `config.get('app.title')` 等 |
| 服务端通过 `public` 声明的字段，以及运行时发布的公共信息 | `config.public.get(...)` |

运行时会发布默认语言以及应用包的显示名称、版本。例如，在客户端已经取得 `config` 对象时：

```ts
// config is the client application's configuration service.
const title = config.get<string>('app.title', 'NocoBase');
const defaultLocale = config.public.get('i18n.defaultLocale');
```

服务端自有分区按需使用 `public` 声明可公开的叶子字段。下面示例的 `public: ['pageSize']` 只公开 `reports.pageSize`，不会公开整个 `reports` 对象。公开配置保留服务端路径，不能改用 `config.get()` 读取。

`client` 分区和公开字段都会发送到浏览器，数据库密码、会话密钥和邮件凭据应留在服务端配置中。类型声明只帮助 TypeScript 检查路径，不会把字段自动公开。

## 添加自己的配置

以下新增一个报表默认分页大小，范围为 `1–100`。它是独立的配置接入示例；将读取结果用于已有报表的分页逻辑后，才会改变业务行为。

### 定义与注册

新增 `server/config/reports.ts`：

```ts
// server/config/reports.ts
import {
  defineAppConfig,
  envInteger,
  type AppConfigFactory,
} from '@nocobase/app-server/config';

export interface ReportsConfig {
  pageSize: number;
}

const reports: AppConfigFactory<ReportsConfig> = defineAppConfig({
  defaults: { pageSize: 20 },
  env: {
    REPORTS_PAGE_SIZE: envInteger('pageSize', {
      description: 'Default report page size, from 1 to 100.',
    }),
  },
  public: ['pageSize'],
  validate(value, context) {
    const size = value.pageSize;
    if (
      typeof size !== 'number' ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > 100
    ) {
      context.error('pageSize', 'Must be an integer from 1 to 100.');
    }
  },
});

export default reports;
```

在已有 `server/config/index.ts` 中完成三处修改，保留其他配置分区：

1. 导入 `import reports from './reports.js';`。
2. 在显式的返回类型中增加 `reports: ReturnType<typeof reports>`。
3. 在 `defaultAppConfigs({ ... })` 的参数对象中加入 `reports`。

这里注册的键是 `reports`，因此配置键路径为 `reports.pageSize`，环境变量为 `REPORTS_PAGE_SIZE`。校验针对最终值执行，既检查文件也检查环境覆盖；校验函数不应写入数据或发起网络请求。

在 `config.example.yml` 补充这个分区的说明及默认值 `20`。当前环境可以在 `config.yml` 中覆盖为：

```yaml
reports:
  pageSize: 30
```

### 接入业务读取

新增下面的辅助函数，让显式请求的分页大小优先，未指定时使用应用配置：

```ts
// server/services/report-options.ts
import type { AppConfigAccessor } from '@nocobase/app-server/config';

export function resolveReportPageSize(
  config: AppConfigAccessor,
  requested?: number,
): number {
  const size = requested ?? config.get<number>('reports.pageSize');
  if (
    typeof size !== 'number' ||
    !Number.isInteger(size) ||
    size < 1 ||
    size > 100
  ) {
    throw new Error('Report page size must be an integer from 1 to 100.');
  }
  return size;
}
```

在报表的业务服务中，以 `resolveReportPageSize(app.config, requestedPageSize)` 取得查询的 `limit`。函数中的普通错误表示输入或接入有问题；HTTP 边界仍需校验请求参数并转换为项目约定的响应，见[请求校验与错误处理](request-validation-and-errors.md)。配置校验只保证默认配置合法，不能代替请求校验。

### 在客户端使用公开值

在客户端 TypeScript 项目包含的声明文件中扩展公开配置类型：

```ts
// client/types/public-config.d.ts
import '@nocobase/app-client';

declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    reports: { pageSize?: number };
  }
}
```

页面可以通过一个 Hook 取得已公开的默认值：

```ts
// client/hooks/use-report-page-size.ts
import { useClientApplication } from '@nocobase/app-client';

export function useReportPageSize(): number | undefined {
  return useClientApplication().config.public.get('reports.pageSize');
}
```

将该值用于分页状态的初始化；用户之后主动选择的页大小仍由页面状态管理。返回 `undefined` 时检查服务端分区注册、`public` 声明及当前页面是否已刷新，而不是在 `client` 下再创建一份同名服务端配置。

## 检查配置与生效方式

修改后先检查当前应用的声明与最终配置：

```bash
pnpm nocobase config env
pnpm nocobase config variables --json
pnpm nocobase config check --no-connect
```

`config env` 列出环境变量映射，`config variables` 输出环境变量的类型、说明等元数据，`config check --no-connect` 离线检查配置。普通 `config check` 默认还会尝试连接非 SQLite 数据库；配置校验通过不等于数据库或外部服务已验证可用。

完成 `reports` 注册、且应用原有配置有效后，可以在开发环境验证覆盖与拒绝行为。下面的临时环境变量写法适用于 POSIX shell：

```bash
pnpm nocobase config set reports.pageSize=30
REPORTS_PAGE_SIZE=40 pnpm nocobase config check --no-connect --json
REPORTS_PAGE_SIZE=0 pnpm nocobase config check --no-connect --json
```

第一条将文件值写为 `30`；第二条应校验通过，该次进程的有效值为 `40`，文件仍保持 `30`；第三条应以非零状态退出，报告 `reports.pageSize` 超出范围。`config set` 修改配置文件，不会替代正在运行的应用进程完成重载。

验证还应覆盖：没有覆盖值时使用 `20`；客户端收到与服务端一致的公开值；未公开字段不会发送给浏览器；显式请求的页大小仍接受业务校验。可以先通过独立配置测试验证这些行为，再在开发应用中检查实际页面与查询结果。

修改配置后的生效方式取决于消费者：

- **修改 `config.yml` 或启动环境：** 通过检查后重启应用，并刷新客户端页面。已有实例是否支持局部重载，以相应模块的约定为准。
- **修改 `client/config/` 或 `server/config/` 的 TypeScript：** 开发时按项目开发流程重新加载；生产环境需要重新构建并发布代码。
- **只在初始化时读取的配置：** 例如 `users.initialAdmin`，只在空用户表初始化时使用，修改它不会重置已有账号。
- **存在用户偏好的默认配置：** 例如默认主题，已有选择可能优先生效，验证时使用没有保存该偏好的会话。

运行时支持配置重载，不意味着已经创建的数据库连接、消费者和所有服务都会自动重建。相关操作与完整参数见[命令行参考](../reference/cli.md)和[配置项参考](../reference/configuration.md)。

本文核对的模板来源：[配置示例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/config.example.yml)、[客户端配置入口](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/client/config/index.ts)、[服务端配置入口](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/server/config/index.ts)。
