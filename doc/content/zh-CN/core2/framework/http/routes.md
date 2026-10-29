---
title: 路由与请求上下文
description: 了解 HTTP 路由如何挂载到 API 前缀或应用根路径，请求上下文提供哪些内容，以及授权和接口暴露的边界。
---

HTTP 接口以路由贡献的形式接入应用：路由工厂在应用启动期间取得服务，处理器在每次请求到达时读取输入和身份。

## API 前缀与根路径

```ts
import { Hono } from 'hono';
import { defineApiRoutes } from '@nocobase/app-server/router';

export default defineApiRoutes(() => {
  const router = new Hono();
  router.get('/example/ping', (context) => context.json({ data: { ok: true } }));
  return router;
});
```

把这个声明加入应用 `server/routes/index.ts` 中的路由数组，或插件的 `routes`。没有额外的基础路径时，示例接口的地址是 `/api/example/ping`。这是一个不读取业务数据的公开探测接口。

`defineApiRoutes()` 挂载在 API 前缀下；`defineRootRoutes()` 挂载在应用根路径下，适合需要自定义协议边界的入口。应用部署在子路径下时，还要加上应用的基础路径；不要在每个插件中硬编码域名和部署前缀。

## 每次请求的上下文

Hono Context 提供 `req.param()`、`req.query()`、请求体以及各种响应方法。路径参数和查询参数最初都是字符串；声明了类型，并不代表外部输入已经过校验。

应用服务通过路由工厂参数 `app` 的容器解析。用户身份由认证集成放入请求上下文，字段名和获取方式以该集成为准；不要假设每个 Hono 请求都自带 `user`。

## 授权与接口暴露

路由的身份检查和数据策略需要显式接入。在前端隐藏菜单并不能保护接口。对于 Repository 风格的接口，可以使用 [`defineRepositoryApiRoutes()`](repository-routes.md) 明确列出 Collection、actions 和完整的 policy；它不会自动公开所有数据表，也不会创建数据库结构。声明、注册、权限策略和客户端调用见 [Repository 数据接口](repository-routes.md)。

API 的路径和方法重复时，启动检查会报错。请使用 `describeRoute` 等来自 `@nocobase/app-server/router` 的描述工具登记 OpenAPI 文档，避免混用不同依赖副本中的元数据。

另见 [请求校验与响应处理](validation.md)、[API Client](api-client.md) 和插件开发中的 [路由与 HTTP 接口](../../extension-development/server-apis.md)。

## 接口与实现

- [Route declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/routes.ts)
- [Repository routes](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/README.md)
