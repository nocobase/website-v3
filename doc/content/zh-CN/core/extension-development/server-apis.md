---
title: 服务端接口
description: 为插件添加接口，说明输入校验、响应格式、访问控制和测试。
---

插件的服务端接口负责接收请求、检查输入和访问权限，再调用业务逻辑。本篇实现一个公告文本预览接口：接收文本，去掉两端空白，返回文本和字符数，不保存数据。

## 使用 Agent

```text
请在当前 App 中创建 notice-api 插件，提供公告文本预览接口。
接口只处理用户本次提交的文本，不读取或保存业务数据，可以公开访问。
检查输入长度，返回统一的响应和错误，补齐 API 文档与测试，再注册到 App。
```

## 准备插件

以下命令在已有 App 根目录执行，文件路径相对于 `packages/app-plugin-notice-api/`。已有同名插件时先检查其实现，不要重复创建。

```bash
pnpm create @nocobase/plugin@beta notice-api --with server.routes --with server.service-providers
```

在插件的 `package.json` 中把 `zod` 加到 `dependencies`，版本与当前 App 已安装的兼容版本保持一致，然后在 App 根目录运行 `pnpm install`。`hono` 和所需运行时由脚手架配置；保留生成的 Provider 聚合文件、Server 声明和公开入口。

## 提供预览服务

替换 `server/tokens.ts`，定义服务契约与 Token：

```ts
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface NoticePreview {
  readonly text: string;
  readonly length: number;
}
export interface NoticeApiService {
  preview(text: string): NoticePreview;
}
export const noticeApiServiceToken: ServiceToken<NoticeApiService> =
  createServiceToken<NoticeApiService>(
    '@nocobase/app-plugin-notice-api/service',
  );
```

替换 `server/services/notice-api.ts`：

```ts
import type { NoticePreview, NoticeApiService } from '../tokens.js';

export class DefaultNoticeApiService implements NoticeApiService {
  public preview(text: string): NoticePreview {
    const normalized = text.trim();
    return { text: normalized, length: Array.from(normalized).length };
  }
}
```

生成的 Provider 已经将 `noticeApiServiceToken` 绑定到这个实现，不需要在接口里创建第二个容器。服务只处理文本，不依赖 HTTP 请求；Provider 的作用见 [ServiceProvider](service-provider.md)。字符数按 Unicode 码点计算，不等同于用户感知的字形数量。

## 声明输入、响应和路由

新增 `server/routes/schemas.ts`：

```ts
import { z } from 'zod';
import type { NoticePreview } from '../tokens.js';

export const PreviewQuery: z.ZodObject<{ text: z.ZodString }> = z.object({
  text: z.string().trim().min(1).max(200),
});
export const PreviewSchema: z.ZodType<NoticePreview> = z.object({
  text: z.string(),
  length: z.number().int().nonnegative(),
});
```

输入先去掉两端空白，再检查长度。这里的 200 是 JavaScript 字符串长度上限；若业务按字形计数，应单独定义规则。导出的 schema 要有显式类型，避免插件生成声明文件时触发 `isolatedDeclarations` 错误。

替换 `server/routes/index.ts`：

```ts
import type { ServiceContainer } from '@nocobase/service-provider';
export interface NoticeRoutesApplication {
  readonly container: ServiceContainer;
}
import {
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { noticeApiServiceToken } from '../tokens.js';
import { PreviewQuery, PreviewSchema } from './schemas.js';

export const apiRoutes: AppApiRouteContribution<NoticeRoutesApplication> =
  defineApiRoutes((app) => {
    const service = app.container.resolve(noticeApiServiceToken);
    const router = new Hono();
    router.onError(apiErrorHandler);
    router.get(
      '/noticeApi/preview',
      describeRoute({
        tags: ['NoticeApi'],
        summary: 'Preview notice text',
        operationId: 'noticeApiPreviewText',
        security: [],
        responses: {
          200: dataResponse(PreviewSchema),
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('query', PreviewQuery),
      (context) => {
        const { text } = context.req.valid('query');
        return context.json({ data: service.preview(text) });
      },
    );
    return router;
  });
const routes: readonly AppApiRouteContribution<NoticeRoutesApplication>[] = [
  apiRoutes,
];
export default routes;
```

`NoticeRoutesApplication` 只声明路由真正使用的容器能力，真实 App 也满足这个接口，测试因此可以提供一个小而完整的对象。

| 部分 | 作用 |
| --- | --- |
| `defineApiRoutes()` | 将路由交给 App，统一挂载到 API 前缀下 |
| `describeRoute()` | 为接口生成 OpenAPI 描述；声明本例可公开访问 |
| `apiValidator()` | 校验输入，失败时返回标准的 400 错误；处理器只读 `req.valid()` |
| `dataResponse()` | 描述 `{ data }` 响应，并不代替实际返回值 |
| `apiErrorHandler` | 让路由单独测试时也使用 App 的标准错误格式 |

声明路径为 `/noticeApi/preview`。默认部署前缀为 `/main` 时，浏览器访问 `/main/api/noticeApi/preview?text=Hello`。Client 通过 `useApiClient()` 得到的客户端请求 `path: 'noticeApi/preview'`，不要写死服务器地址。

## 明确接口的访问边界

本例不读取用户或业务记录，也不写入状态，因此允许匿名文本预览。`security: []` 只声明文档中的认证要求，本身不会保护接口；实际保护来自服务端中间件。

内部接口应从 `@nocobase/app-plugin-authentication` 导入原始 `authenticationToken`，通过 `app.container.resolve(authenticationToken).required()` 为对应路径安装认证中间件，并移除 `security: []`。新增的身份敏感运行时（如认证插件）应声明为兼容的 peer 依赖。敏感操作还要用授权服务检查明确的资源和操作。顺序是认证、授权、输入校验、业务处理；页面要求登录不能代替这些检查。

业务失败使用 `ApiError`，例如资源不存在时设置 `status: 'NOT_FOUND'`、稳定的 `reason` 和插件自己的 `domain`。不要手工拼错误 JSON，也不要把异常栈或凭证返回给调用方。认证接口至少验证匿名、无权和有权三种情况。

## 测试并接入 App

替换脚手架断言路由为空的 `tests/server/routes.test.ts`：

```ts
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';
import { apiRoutes } from '../../server/routes/index.js';
import { NoticeApiProvider } from '../../server/providers/notice-api.js';

async function createRouter() {
  const container = new ServiceContainer();
  new NoticeApiProvider({ container }).register();
  return apiRoutes.createRouter({ container });
}
describe('notice preview API', () => {
  it('previews public text without persisting it', async () => {
    const router = await createRouter();
    const response = await router.request(
      '/noticeApi/preview?text=%20Hello%20',
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { text: 'Hello', length: 5 },
    });
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Notice Tools', version: '1' },
    });
    expect(document.paths?.['/api/noticeApi/preview']?.get).toBeDefined();
  });
  it.each(['', '?text=', `?text=${'a'.repeat(201)}`])(
    'rejects invalid input %s',
    async (query) => {
      const router = await createRouter();
      const response = await router.request(`/noticeApi/preview${query}`);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { reason: 'INVALID_INPUT' },
      });
    },
  );
});
```

同时替换生成的 `tests/server/service-provider.test.ts`，验证新的预览行为。保留其他仍符合实际能力的测试：

```ts
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';
import { NoticeApiProvider } from '../../server/providers/notice-api.js';
import { noticeApiServiceToken } from '../../server/tokens.js';

describe('notice service', () => {
  it('registers a lazy singleton and normalizes text', () => {
    const container = new ServiceContainer();
    new NoticeApiProvider({ container }).register();
    expect(container.resolveIfCreated(noticeApiServiceToken)).toBeUndefined();
    const service = container.resolve(noticeApiServiceToken);
    expect(service.preview('  欢迎 👋  ')).toEqual({
      text: '欢迎 👋',
      length: 4,
    });
    expect(container.resolve(noticeApiServiceToken)).toBe(service);
  });
});
```

```bash
pnpm --filter @nocobase/app-plugin-notice-api format
pnpm --filter @nocobase/app-plugin-notice-api check
```

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-api --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-api --no-install
```

启动或重启 App，访问上面的地址，应得到 `{"data":{"text":"Hello","length":5}}`。缺少 `text`、全是空白或超过长度上限时应返回 400。登录后查看 `/main/api/swagger/docs`，确认接口声明存在；实际地址随 App 部署前缀变化。

最后运行 App 的 `pnpm build`。单独路由测试不会验证部署前缀、App 的全局中间件或真实登录流程，这些需要在 App 中检查。更多验证方式见[测试与验证](testing-and-verification.md)。
