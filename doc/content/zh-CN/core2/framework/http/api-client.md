---
title: API Client
description: 了解如何取得并调用已配置的 API Client、请求与返回的约定、远程 Repository，以及请求状态与重试的处理。
---

API Client 统一处理应用的 HTTP 地址、凭证和请求格式。应用中的组件应优先使用运行时已经配置好的客户端，避免在每个页面中重新拼接服务端地址。

## 获取与调用

在 React 组件或 Hook 中使用 `useApiClient()`；普通服务通过参数注入，或者从 `apiClientToken` 解析。示例假设服务端提供 `/orders` 接口，并返回 `{ data: [...] }`：

```ts
import type { ApiClient } from '@nocobase/app-client';

type Order = { id: string; title: string };
export async function loadOrders(api: ApiClient, signal?: AbortSignal) {
  const response = await api.request<{ data: Order[] }>({
    method: 'GET',
    path: '/orders',
    query: { limit: 20 },
    signal,
  });
  return response.data;
}
```

`path` 是相对于客户端配置的 API 地址的路径。默认的请求方法是 GET，默认的 `credentials` 为 `include`；跨域请求仍然受浏览器 Cookie 和 CORS 策略的限制。

## 请求与返回的约定

| 需求 | 用法 |
| --- | --- |
| 查询参数 | `query`，值为标量或支持的数组 |
| JSON 请求体 | `json` |
| FormData 等其他请求体 | `body`，与 `json` 不能同时使用 |
| 取消请求 | `signal` |
| 取得完整响应体 | `request<T>()` |
| 读取字节流 | `stream()` |
| Repository 协议 | `repository(name)` |

泛型只描述预期的响应类型，不做运行时的数据校验。服务端返回的错误通过 `ApiClientError` 处理；页面应区分请求被拒绝、没有权限、已取消和可以重试的失败，而不是一律显示“网络错误”。

## 远程 Repository

远程 Repository 提供查询输入的构造器，但需要服务端显式开放对应的资源和 actions。它与直接操作数据库的 Repository 运行在不同的位置，授权由服务端执行。不要把数据库服务、凭据或私有的连接模块导入客户端。

服务端通过 `defineRepositoryApiRoutes()` 声明接口，客户端使用 `api.repository(name)` 调用；`name` 对应的是暴露的名称，可以与 Collection 的名称不同。查询同样使用 POST 请求，远程 Repository 会自动解开响应中的 `data` 包装。完整示例见 [Repository 数据接口](repository-routes.md)。

## 请求状态与重试

API Client 不能代替页面的请求状态管理。要避免较早发出的请求覆盖较新的搜索结果，可以使用取消、请求标识或合适的数据请求状态库。修改数据的请求，只有在确认具备幂等语义后才能重试；超时并不能证明服务端没有执行。

独立脚本可以直接依赖 `@nocobase/api-client`，用 `createApiClient({ baseURL })` 创建客户端。`@nocobase/app-client` 也重新导出了应用中用到的类型和入口。相关的接口约定见 [API 参考](../../reference/api.md)。

## 接口与实现

- [API Client](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/api-client/README.md)
- [Client hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/src/hooks.ts)
