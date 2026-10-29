---
title: 中间件
description: 了解如何声明和接入 HTTP 中间件、中间件的执行顺序，以及请求限制和异常的处理方式。
---

中间件处理多个接口共用的请求行为，例如解析身份、限制请求和设置响应头。注册时应明确它作用的路径和执行顺序，业务流程仍然留在服务中。

## 声明与接入

```ts
import { defineHttpMiddleware } from '@nocobase/app-server/router';

export const responseHeaders = defineHttpMiddleware({
  name: 'example.response-headers',
  register(router) {
    router.use('/api/*', async (context, next) => {
      await next();
      context.header('X-Content-Type-Options', 'nosniff');
    });
  },
});
```

在应用组装阶段调用 `app.addHttpMiddleware(responseHeaders)`，并且要在应用启动和路由注册之前完成。插件也可以在允许注册贡献的阶段接入自己的中间件。

注册回调收到的是应用的根 Router，因此 `/api/*` 是相对于应用的路径，外部的基础路径由宿主负责适配。只作用于某一个路由模块的逻辑，可以直接在该模块返回的 Hono Router 上调用 `use()`。

## 执行顺序

中间件先执行 `await next()` 之前的代码，等后续的处理器结束后，再执行它之后的代码。需要拒绝请求时，直接返回响应或抛出框架的 API 错误，不再调用后续的处理器。

身份解析必须在依赖身份的授权检查之前完成。避免一个中间件读取了请求体，下游又以另一种方式重复读取，流式上传尤其如此；需要共享的解析结果，可以通过明确的上下文约定传递。

## 限制与异常

通用的请求大小、超时和限流，可以通过 `api` 配置统一设置。进程内的限流计数不是多实例之间的全局计数；部署在反向代理之后时，还要按实际部署核对客户端地址。

中间件不应把未知异常包装成成功响应。日志中记录请求标识、耗时和结果，避免记录 Cookie、Authorization 或包含敏感信息的完整请求体。

测试应覆盖：匹配和不匹配的路径、拒绝请求后不再继续执行、异常响应，以及多个中间件的执行顺序。另见 [请求校验与响应处理](validation.md) 和 [配置项参考](../../reference/configuration.md)。

## 接口与实现

- [Middleware declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/routes.ts)
- [Routing lifecycle](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [API limits](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/api-limits.ts)
