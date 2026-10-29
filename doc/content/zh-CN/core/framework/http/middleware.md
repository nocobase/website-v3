---
title: 中间件
---

中间件处理多个接口共用的请求行为，例如身份解析、请求约束和响应头。它应围绕明确的路径与顺序注册，业务流程仍留在服务中。

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

在应用组装阶段调用 `app.addHttpMiddleware(responseHeaders)`；应在应用启动和路由注册之前完成。插件也可以在允许注册贡献的阶段接入自身中间件。

注册回调收到应用根 Router，因此 `/api/*` 是相对于应用的路径。宿主负责外部基础路径适配。仅作用于一个路由模块的逻辑，可以直接在该模块返回的 Hono Router 上使用 `use()`。

## 执行顺序

中间件先执行 `await next()` 前的代码，后续处理器结束后再执行其后的代码。需要拒绝请求时直接返回响应或抛框架 API 错误，不再调用后续处理器。

身份必须先于依赖身份的授权检查。避免读取请求体后又让下游按另一种方式重复消费，尤其是流式上传；需要共享的解析结果可通过明确的上下文契约传递。

## 限制与异常

通用请求大小、超时和限流可通过 `api` 配置统一设置。进程内限流计数不是多实例全局计数，反向代理后的客户端地址也要按实际部署核对。

中间件不应把未知异常包装成成功响应。日志记录请求标识、耗时和结果，避免记录 Cookie、Authorization 或完整敏感请求体。

测试应覆盖匹配与不匹配路径、拒绝时不继续执行、异常响应和多中间件顺序。见[请求校验](validation.md)与[配置项参考](../../reference/configuration.md)。

## 接口与实现

- [Middleware declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/routes.ts)
- [Routing lifecycle](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [API limits](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/api-limits.ts)
