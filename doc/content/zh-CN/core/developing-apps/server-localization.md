---
title: 服务端多语言
description: 组织服务端语言资源，在 HTTP 请求和后台任务中按正确语言生成文案。
---

页面文字通常放在 `client/locales/`；服务端生成的邮件、通知和导出内容放在 `server/locales/`。两边独立加载资源，客户端有某个 key，不代表服务端也能使用。

本篇按默认模板 `1.0.0-beta.84` 的 `server/locales/` 与运行时接入方式编写，不依赖历史项目教程。

## 添加应用文案

在 `server/locales/en-US.ts` 的已有对象中增加报表文案，保留其他键及已有类型导出。以下展示只含本例文案的文件：

```ts
import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  reports: {
    ready: 'Report {{name}} is ready.',
    subject: 'Your report: {{name}}',
  },
};
export type AppServerResource = LocaleResource<typeof enUS>;
export default enUS;
```

在 `server/locales/zh-CN.ts` 中补齐对应键：

```ts
import type { AppServerResource } from './en-US.js';

const zhCN = {
  reports: {
    ready: '报表 {{name}} 已准备好。',
    subject: '你的报表：{{name}}',
  },
} satisfies AppServerResource;
export default zhCN;
```

`LocaleResource` 约束键结构，不要求各语言的字符串相同。插值变量名也需要保持一致。不要把用户名或报表名拼进翻译 key，应作为参数传入。

## 检查资源入口

模板的 `server/locales/index.ts` 已声明两种语言的 loader：

```ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};
export default locales;
```

`server/runtime.ts` 已把这个入口作为 `locales` 接入应用，通常不必新增 Provider。添加语言时补充资源文件和 loader；只安装包含某语言的插件不会给应用增加该语言。默认语言通过配置设置，见[应用配置（config.yml）](configuration-and-settings.md)。前后端语言列表分别维护，面向用户提供语言时应一起检查。

## 在请求中使用当前语言

模板的 `server/app.ts` 在会话中间件之后挂载 `i18nHttpMiddleware`。它按会话语言、`Accept-Language`、默认语言解析并加载资源。路由直接使用 `getRequestTranslator(c)`，不需要为每个接口创建新翻译实例。

下面是只预览文案的公开接口，不读取或生成真实报表。保存为 `server/routes/report-message-preview.ts`，再按[HTTP 路由与接口](apis-and-services.md)加入 `server/routes/index.ts`：

```ts
import { Hono } from 'hono';
import { z } from 'zod';
import {
  apiErrorHandler, apiValidator, dataResponse,
  defineApiRoutes, describeRoute, apiErrorResponses,
} from '@nocobase/app-server/router';
import { getRequestTranslator } from '@nocobase/i18n/server';

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
        200: dataResponse(z.object({ message: z.string() })),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', z.strictObject({
      name: z.string().trim().min(1).max(80),
    })),
    (c) => c.json({
      data: {
        message: getRequestTranslator(c)(
          'reports.ready', { name: c.req.valid('query').name },
        ),
      },
    }),
  );
  return router;
});
```

传入 `name=Q3` 并以 `Accept-Language: zh-CN` 请求 `<APP_BASE_PATH>/api/report-message-preview`，无既有会话语言覆盖时返回“报表 Q3 已准备好。”。测试路由时也要安装真实 i18n 中间件；直接在裸 Hono 上调用而未接入中间件，会缺少请求翻译器。

`security: []` 只是文档声明。这个示例本身没有认证中间件；改成读取真实报表时，必须补充认证和数据授权。

## 在后台按接收人语言生成文案

后台任务没有 HTTP 请求，不能依赖当前请求的翻译器，也不应改变共享实例的全局语言。按接收人的语言加载资源，再创建固定语言的翻译函数。例如，按需创建 `server/services/report-message.ts`：

```ts
import metadata from '../../package.json' with { type: 'json' };
import type { I18nRuntime } from '@nocobase/i18n';

export async function renderReportMessage(
  i18n: I18nRuntime,
  recipientLocale: string,
  name: string,
) {
  const locale = i18n.resolveLocale(recipientLocale);
  await i18n.ensureLocaleLoaded(locale);
  const t = i18n.getFixedT(metadata.name, locale);
  return {
    locale,
    subject: t('reports.subject', { name }),
    message: t('reports.ready', { name }),
  };
}
```

Provider 从 `@nocobase/app-server/i18n` 的 `i18nToken` 取得 `I18nRuntime`，注入服务或传给该函数。命名空间使用应用 `package.json` 的 `name`，不是部署路径或某个用户输入。`services/` 是自行组织的目录，文件需通过普通导入使用。

`recipientLocale` 来自接收人的偏好；不支持的语言经 `resolveLocale()` 回退。先 `ensureLocaleLoaded()`，再 `getFixedT()`，否则尚未加载的资源可能回退为默认文案或 key。固定语言允许并发为不同接收人生成内容，不会互相切换语言。

## 覆盖插件文案与处理错误

应用可以在服务端语言对象的 `overrides` 下按插件包名覆盖服务端文案。不要修改 `node_modules/`，也不要把客户端页面的覆盖误放到服务端。

API 错误保持稳定的 `reason` 与 `domain`；面向开发者的 `message` 不作为用户界面文案。客户端按标识翻译错误，必要时服务端可提供独立的 `localizedMessage`，但不能靠翻译后的字符串判断错误类型，见[请求校验与错误处理](request-validation-and-errors.md)。

## 验证

运行 `pnpm nocobase locales check` 与类型检查。再用真实资源检查中英文插值、请求头与会话语言优先级、不支持语言的回退，以及并发给不同语言接收人生成内容。语言检查不能代替运行时验证，不要通过 mock 翻译函数掩盖缺失 key。

客户端的语言选择和文案组织见[多语言](localization.md)，插件资源声明见[插件客户端多语言](../extension-development/localization.md)。
