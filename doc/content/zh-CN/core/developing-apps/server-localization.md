---
title: 服务端多语言
description: 配置服务端语言资源，在请求和后台消息中选择语言，覆盖插件文案并返回本地化错误提示。
---

服务端生成的邮件、通知和导出内容使用 `server/locales/`。它与 `client/locales/` 独立加载：页面上能翻译的 key，服务端仍需声明。

下面以“报表就绪通知”为例，分别按请求语言和接收人语言生成消息。[示例 App](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization) 可通过命令运行，安装方法见[示例源码与运行](#示例源码与运行)。它只生成文案，不读取真实报表或发送邮件。

## 添加和加载语言资源

### 定义文案与插值参数

在 `server/locales/en-US.ts` 的已有对象中增加 `reports`，保留其他文案和类型导出。以下先省略后文的插件覆盖配置：

```ts
import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  reports: {
    ready: 'Report {{name}} is ready.',
    subject: 'Your report: {{name}}',
    notReady: 'Report {{name}} is not ready yet.',
  },
};
export type AppServerResource = LocaleResource<typeof enUS>;
export default enUS;
```

在 `server/locales/zh-CN.ts` 中补齐相同的键：

```ts
import type { AppServerResource } from './en-US.js';

const zhCN = {
  reports: {
    ready: '报表 {{name}} 已准备好。',
    subject: '你的报表：{{name}}',
    notReady: '报表 {{name}} 尚未准备好。',
  },
} satisfies AppServerResource;
export default zhCN;
```

`LocaleResource` 约束键结构，译文可以不同。`{name}` 是插值参数；各语言保持相同的参数名，调用时传入报表名，不要把报表名拼进 key。类型检查不能代替插值结果检查。

[查看语言资源源码](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/locales)。运行 `pnpm demo request zh-CN` 会把 `Q3` 插入中文消息；改为 `pnpm demo request en-US "Sales summary"`，会得到 `Report Sales summary is ready.`。

### 注册语言与设置默认语言

默认模板的 `server/locales/index.ts` 已包含语言加载器：

```ts
import type { LocaleLoaders } from "@nocobase/i18n";
const locales: LocaleLoaders = {
  "en-US": () => import("./en-US.js"),
  "zh-CN": () => import("./zh-CN.js"),
};
export default locales;
```

`server/runtime.ts` 通过 `locales` 接入该入口。添加语言时，需要增加资源文件及其 loader。插件提供的翻译不会自动增加应用可选语言；前后端的资源列表也需要分别维护。

默认语言在应用的 `config.yml` 中设置，例如：

```yaml
i18n:
  defaultLocale: en-US
```

也可以使用 `APP_DEFAULT_LOCALE`，配置规则见[应用配置](configuration-and-settings.md)。默认语言决定没有匹配偏好时的回退，不会替换用户已保存的语言选择。

示例以 [App 入口](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/app.ts) 中的 `i18n.defaultLocale` 设置英文默认值，并注册真实的 `I18nProvider` 和语言资源。运行 `pnpm demo request fr-FR`，因为应用未声明法语，会返回英文消息。示例插件虽然提供日语资源，`pnpm demo request ja-JP` 仍回退到英文。

## 在 HTTP 请求中使用翻译

### 按当前请求语言生成文案

默认模板在 `server/app.ts` 中先挂载会话中间件，再挂载 `i18nHttpMiddleware`。后者解析请求语言并等待资源加载，路由随后用 `getRequestTranslator(c)` 取得应用的翻译函数，用 `getRequestLocale(c)` 读取实际语言。

以下是 [report-messages.ts](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/routes/report-messages.ts) 中报表预览接口的独立写法。放入 `server/routes/` 后，按[HTTP 路由与接口](apis-and-services.md)注册到 `server/routes/index.ts`：

```ts
import { Hono } from 'hono';
import { z } from 'zod';
import {
  apiErrorHandler, apiErrorResponses, apiValidator,
  dataResponse, defineApiRoutes, describeRoute,
} from '@nocobase/app-server/router';
import {
  getRequestLocale, getRequestTranslator,
} from '@nocobase/i18n/server';

export default defineApiRoutes(() => {
  const router = new Hono();
  router.onError(apiErrorHandler);
  router.get(
    '/report-message-preview',
    describeRoute({
      operationId: 'previewReportMessage',
      summary: 'Preview report wording',
      security: [],
      responses: {
        200: dataResponse(z.object({
          locale: z.string(), message: z.string(),
        })),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', z.strictObject({
      name: z.string().trim().min(1).max(80),
    })),
    (c) => c.json({
      data: {
        locale: getRequestLocale(c),
        message: getRequestTranslator(c)(
          'reports.ready', { name: c.req.valid('query').name },
        ),
      },
    }),
  );
  return router;
});
```

在已有应用中，请求 `<APP_BASE_PATH>/api/report-message-preview?name=Q3`，传入 `Accept-Language: zh-CN`。没有会话语言覆盖时，响应为：

```json
{
  "data": {
    "locale": "zh-CN",
    "message": "报表 Q3 已准备好。"
  }
}
```

示例命令 `pnpm demo request zh-CN` 会通过 `Application.fetch` 执行这个请求，不监听端口。该接口公开预览文案，`security: []` 是接口文档声明；若改为读取真实报表，还需按业务添加认证和数据授权。

### 会话语言、请求头与默认语言

已保存的会话语言优先。没有会话偏好时，中间件按 `Accept-Language` 的优先级寻找支持的语言；没有匹配项时使用默认语言。会话里已有不支持的语言值时，该值经运行时解析并回退，不再用请求头覆盖它。

运行 `pnpm demo session zh-CN`：[演示脚本](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/scripts/demo.ts) 先通过示例接口把英文保存到真实会话，再带着 Cookie 和中文请求头请求预览接口。结果仍是 `locale: "en-US"` 和 `Report Q3 is ready.`。去掉 Cookie 的新请求则使用中文。

示例的 `/demo-locale` 仅用于复现会话优先级，偏好保存在当前进程内。现有应用继续使用自己的语言切换入口，见[客户端多语言](localization.md)。

## 按接收人语言生成后台消息

### 获取运行时与固定语言翻译器

后台任务没有当前 HTTP 请求。让调用方传入接收人偏好，通过 `i18nToken` 注入运行时，再按这个语言生成文案。[report-message.ts](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/services/report-message.ts) 定义服务：

```ts
import metadata from "../../package.json" with { type: "json" };
import type { I18nRuntime } from "@nocobase/i18n";
import { createServiceToken } from "@nocobase/service-provider";

export class ReportMessageService {
  constructor(private readonly i18n: I18nRuntime) {}

  async render(recipientLocale: string, name: string) {
    const locale = this.i18n.resolveLocale(recipientLocale);
    await this.i18n.ensureLocaleLoaded(locale);
    const t = this.i18n.getFixedT(metadata.name, locale);
    return {
      locale,
      subject: t("reports.subject", { name }),
      message: t("reports.ready", { name }),
    };
  }
}
export const reportMessageToken =
  createServiceToken<ReportMessageService>("report-message");
```

`resolveLocale()` 将偏好解析为支持的语言；`ensureLocaleLoaded()` 加载资源；`getFixedT()` 将翻译函数绑定到命名空间和语言。顺序不能省略，否则尚未加载的译文可能回退为默认文案或 key。命名空间使用应用 `package.json` 的 `name`。

[ReportMessageProvider](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/providers/report-message.ts) 负责注入运行时：

```ts
import type { Application } from "@nocobase/app-server/application";
import { i18nToken } from "@nocobase/app-server/i18n";
import { ServiceProvider } from "@nocobase/service-provider";
import {
  ReportMessageService,
  reportMessageToken,
} from "../services/report-message.js";

export default class ReportMessageProvider extends ServiceProvider<Application> {
  readonly name = "report-message";
  override register() {
    this.app.container.singleton(
      reportMessageToken,
      (container) => new ReportMessageService(container.resolve(i18nToken)),
    );
  }
}
```

在已有应用的 `server/providers/index.ts` 中加入该 Provider，保留其他 Provider。`server/services/` 只是组织代码的目录，不会自动注册服务。示例的 [App 入口](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/app.ts) 已完成注册。

运行 `pnpm demo background zh-CN`，命令从容器取得服务，在没有请求上下文时输出：

```json
{
  "locale": "zh-CN",
  "subject": "你的报表：Q3",
  "message": "报表 Q3 已准备好。"
}
```

### 并发生成不同语言的消息

应用启动后，后台任务或命令可以复用服务，为不同接收人同时生成消息。以下调用方式见[演示脚本](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/scripts/demo.ts)：

```ts
import { reportMessageToken } from './server/services/report-message.js';

// app has completed app.start().
const service = app.container.resolve(reportMessageToken);
const messages = await Promise.all([
  service.render('en-US', 'Q3'),
  service.render('zh-CN', 'Q3'),
  service.render('fr-FR', 'Q3'),
]);
```

运行 `pnpm demo concurrent`，三条消息依次为 `Report Q3 is ready.`、`报表 Q3 已准备好。`、`Report Q3 is ready.`，实际语言依次为 `en-US`、`zh-CN`、`en-US`。

每次调用都显式固定接收人语言，不调用共享运行时的 `changeLanguage()`。这样多个任务和 HTTP 请求不会争用一个全局“当前语言”。接收人偏好应由业务数据提供，不应统一取触发任务的用户语言。

## 覆盖插件的服务端文案

在应用语言对象的 `overrides` 下，以插件的完整包名为键覆盖对应服务端文案。例如，给英文资源增加：

```ts
// Inside the default export of server/locales/en-US.ts:
overrides: {
  '@example/report-delivery': {
    delivery: {
      ready: 'Your report {{name}} is available in the customer portal.',
    },
  },
},
```

中文资源在相同位置增加 `ready: '报表 {{name}} 已可在客户门户中查看。'`。应用覆盖在插件资源加载后应用；未覆盖的键保留插件原文，不需要修改插件文件或 `node_modules/`。

请求处理器显式指定插件命名空间，Hono 不会根据文件位置推断它：

```ts
const t = getRequestTranslator(c, '@example/report-delivery');
return c.json({ data: {
  locale: getRequestLocale(c),
  message: t('delivery.ready', { name: c.req.valid('query').name }),
  channel: t('delivery.channel'),
} });
```

运行 `pnpm demo override zh-CN`，消息变为“报表 Q3 已可在客户门户中查看。”，未覆盖的 `delivery.channel` 仍为插件提供的“客户门户”。

[示例插件资源](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/report-delivery.ts)、[应用覆盖](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/locales)和[请求入口](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/routes/report-messages.ts)共同演示这个结果。`@example/report-delivery` 是示例内注册的资源插件；在自己的应用中替换为真实插件包名和键。插件声明方式见[插件服务端多语言](../extension-development/server-localization.md)。

## 处理面向用户的错误提示

API 错误的 `reason`、`domain` 和 HTTP 状态保持稳定，`message` 保留面向开发者的英文说明。需要由服务端返回用户提示时，在 `localizedMessage` 中提供实际语言和译文。

以下摘自 [report-not-ready 处理器](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/routes/report-messages.ts)，该处理器使用前面相同的查询参数校验和 `apiErrorHandler`：

```ts
import { ApiError } from '@nocobase/app-server/router';
import {
  getRequestLocale, getRequestTranslator,
} from '@nocobase/i18n/server';

// Inside the validated /report-not-ready handler:
throw new ApiError({
  status: 'FAILED_PRECONDITION',
  reason: 'REPORT_NOT_READY',
  domain: 'reports',
  message: 'The requested report is not ready.',
  localizedMessage: {
    locale: getRequestLocale(c)!,
    message: getRequestTranslator(c)(
      'reports.notReady', { name: c.req.valid('query').name },
    ),
  },
});
```

运行 `pnpm demo error zh-CN`，会故意触发报表未就绪状态，返回 HTTP 400、`reason: "REPORT_NOT_READY"`、`domain: "reports"`，以及：

```json
{
  "locale": "zh-CN",
  "message": "报表 Q3 尚未准备好。"
}
```

改为英文请求时，仅用户提示的语言变化；程序仍按稳定标识处理错误，不比较译文。客户端也可以按错误标识自行翻译，见[请求校验与错误处理](request-validation-and-errors.md)。

## 验证翻译与语言回退

在完整模板应用中，`pnpm nocobase locales check` 比较前后端语言文件是否对应，不检查 loader、翻译键或插值结果。`pnpm typecheck` 结合资源类型检查键结构。示例未安装模板 CLI，使用 `pnpm typecheck` 和 `pnpm test`。

运行时检查要使用真实资源和中间件：[示例测试](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/tests/localization.test.ts) 覆盖中英文插值、请求头优先级、会话隔离、默认语言回退、插件覆盖，以及并发请求和后台消息。还检查缺少中间件时的明确错误、非法输入，以及本地化前后保持一致的业务错误标识。

不支持的语言与缺失的 key 是两种情况：前者回退到应用默认语言；后者依次尝试默认语言和英文资源，均不存在时可能返回 key。测试通过独立的不完整资源复现缺失翻译，正常应用仍应补齐各语言。

## 示例源码与运行

[完整源码与 README](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization)包含版本要求、用法与源码对应关系，以及每个命令的预期结果。示例使用 Node.js 24、pnpm 11.7.0、App Server `3.0.0-beta.5` 和 I18n `2.0.0-beta.1`，依赖版本与默认模板 `1.0.0-beta.85` 对齐。

```sh
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 44cc65d121ea8cebf26fee77c924119cc57f4aad
cd apps/server-localization
pnpm install --frozen-lockfile
pnpm demo request zh-CN
pnpm test
```

这是直接组合 NocoBase Application 和 Provider 的最小示例，不是完整默认模板。命令在同一进程中执行请求或服务调用，结束时关闭应用，不需要浏览器、数据库或邮件服务。将代码用于已有应用时，保留模板的运行时、配置和中间件，仅合并语言资源、路由和 Provider 注册。
