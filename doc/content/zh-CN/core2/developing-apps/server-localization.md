---
title: 服务端多语言
description: 组织服务端语言资源，在 HTTP 请求和后台任务中按正确的语言生成文案。
---

页面上的文字通常放在 `client/locales/`；服务端生成的邮件、通知和导出内容则放在 `server/locales/`。两边各自加载资源：客户端有某个 key，不代表服务端也能使用它。

本篇按默认模板 `1.0.0-beta.84` 中 `server/locales/` 的结构和运行时的接入方式编写，不依赖历史项目教程。

## 添加应用文案

在 `server/locales/en-US.ts` 已有的对象中增加报表相关文案，保留其他键和已有的类型导出。下面展示的是只包含本例文案的文件：

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

在 `server/locales/zh-CN.ts` 中补齐对应的键：

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

`LocaleResource` 约束的是键的结构，不要求各语言的字符串相同；插值变量的名称也必须保持一致。不要把用户名或报表名拼进翻译 key，而应作为参数传入。

## 检查资源入口

模板的 `server/locales/index.ts` 已经声明了两种语言的 loader：

```ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};
export default locales;
```

`server/runtime.ts` 已把这个入口作为 `locales` 接入应用，通常不需要新增 Provider。添加语言时，补充资源文件和 loader 即可；只安装一个包含某种语言的插件，并不会给应用增加这种语言。默认语言通过配置设置，见 [应用配置（config.yml）](configuration-and-settings.md)。前端和服务端的语言列表分别维护，向用户提供某种语言时，应同时检查两边。

## 在请求中使用当前语言

模板的 `server/app.ts` 在会话中间件之后挂载了 `i18nHttpMiddleware`。它按“会话语言 → `Accept-Language` → 默认语言”的顺序确定语言并加载资源。路由中直接使用 `getRequestTranslator(c)` 即可，不需要为每个接口创建新的翻译实例。

下面是一个只预览文案的公开接口，不读取、也不生成真实的报表。保存为 `server/routes/report-message-preview.ts`，再按 [路由与 HTTP 接口](apis-and-services.md) 加入 `server/routes/index.ts`：

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

传入 `name=Q3`，并带上 `Accept-Language: zh-CN` 请求 `<APP_BASE_PATH>/api/report-message-preview`；在没有已保存的会话语言覆盖的情况下，会返回“报表 Q3 已准备好。”。测试这个路由时，也要安装真实的 i18n 中间件；如果直接在裸 Hono 上调用、没有接入中间件，就拿不到请求翻译器。

`security: []` 只是文档上的声明，这个示例本身没有认证中间件。如果改为读取真实的报表，必须补上认证和数据授权。

## 在后台按接收人的语言生成文案

后台任务没有 HTTP 请求，不能依赖当前请求的翻译器，也不应该修改共享实例的全局语言。正确的做法是：按接收人的语言加载资源，再创建一个固定语言的翻译函数。例如，按需创建 `server/services/report-message.ts`：

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

Provider 从 `@nocobase/app-server/i18n` 的 `i18nToken` 取得 `I18nRuntime`，注入到服务中，或者传给这个函数。命名空间使用应用 `package.json` 中的 `name`，而不是部署路径或某个用户输入。`services/` 是自行组织的目录，其中的文件需要通过普通 import 使用。

`recipientLocale` 来自接收人的语言偏好，不受支持的语言会经 `resolveLocale()` 回退。务必先调用 `ensureLocaleLoaded()`，再调用 `getFixedT()`；否则尚未加载的资源可能回退为默认文案，甚至直接显示 key。由于语言是固定的，可以并发地为不同接收人生成内容，彼此之间不会互相切换语言。

## 覆盖插件文案与处理错误

应用可以在服务端语言对象的 `overrides` 下，按插件包名覆盖该插件的服务端文案。不要修改 `node_modules/`，也不要把客户端页面的覆盖误放到服务端。

API 错误应保持稳定的 `reason` 和 `domain`；面向开发者的 `message` 不作为用户界面上的文案。客户端按这些标识翻译错误；必要时，服务端可以另外提供 `localizedMessage`，但不能依靠翻译后的字符串判断错误类型，见 [请求校验与错误处理](request-validation-and-errors.md)。

## 验证

运行 `pnpm nocobase locales check` 和类型检查。然后用真实的资源检查：中英文的插值、请求头与会话语言的优先级、不受支持语言的回退，以及并发为不同语言的接收人生成内容。语言检查不能代替运行时验证；也不要通过 mock 翻译函数来掩盖缺失的 key。

客户端的语言选择和文案组织见 [多语言](localization.md)，插件服务端资源的声明见 [插件服务端多语言](../extension-development/server-localization.md)。
