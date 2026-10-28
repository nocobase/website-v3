---
title: 路由与请求上下文
---

HTTP 接口通过路由贡献接入应用，路由工厂在应用启动期间取得服务，处理器在每次请求到达时读取输入和身份。

## API 与根路径

```ts
import { Hono } from 'hono';
import { defineApiRoutes } from '@nocobase/app-server/router';

export default defineApiRoutes(() => {
  const router = new Hono();
  router.get('/example/ping', (context) => context.json({ data: { ok: true } }));
  return router;
});
```

把该声明加入应用 `server/routes/index.ts` 的路由数组，或插件的 `routes`。无额外基础路径时，示例地址为 `/api/example/ping`。这是不读取业务数据的公开探测示例。

`defineApiRoutes()` 挂载到 API 前缀；`defineRootRoutes()` 挂载到应用根路径，适合需要自己协议边界的入口。部署在子路径时还要加应用基础路径，不要在每个插件中硬编码域名和部署前缀。

## 每次请求的上下文

Hono Context 提供 `req.param()`、`req.query()`、请求体和响应方法。路径与查询参数最初是字符串；类型声明不代表外部输入已验证。

应用服务从路由工厂参数 `app` 的容器解析。用户身份由认证集成放入请求上下文，字段名和取得方式以该集成为准；不要凭空假设每个 Hono 请求都有 `user`。

## 授权与接口暴露

路由的身份检查和数据策略需要显式接入。前端隐藏菜单不保护接口。对于 Repository 风格接口，可使用 [`defineRepositoryApiRoutes()`](repository-routes.md) 明确列出 Collection、actions 与完整 policy；它不会自动公开全部数据表，也不会创建数据库结构。声明、注册、权限策略与客户端调用见 [Repository 数据接口](repository-routes.md)。

API 重复路径和方法会在启动检查中报错。使用 `describeRoute` 等来自 `@nocobase/app-server/router` 的描述工具登记 OpenAPI，避免跨依赖副本混用元数据。

见[请求校验与响应](validation.md)、[API Client](api-client.md)及[插件服务端接口](../../extension-development/server-apis.md)。

## 接口与实现

- [Route declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/routes.ts)
- [Repository routes](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/README.md)
