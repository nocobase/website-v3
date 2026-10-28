---
title: API Client
---

API Client 统一处理应用的 HTTP 地址、凭证和请求格式。应用组件优先取得运行时已经配置的客户端，避免在每个页面重新拼接服务端地址。

## 获取与调用

React 组件或 Hook 中使用 `useApiClient()`；普通服务通过参数注入，或从 `apiClientToken` 解析。示例假设服务端提供 `/orders` 并返回 `{ data: [...] }`：

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

`path` 相对于客户端配置的 API 地址。默认请求方法是 GET，默认 `credentials` 为 `include`；跨域时仍受浏览器 Cookie 与 CORS 策略限制。

## 请求与返回约定

| 需求 | 方式 |
| --- | --- |
| 查询参数 | `query`，使用标量或支持的数组值 |
| JSON 请求体 | `json` |
| FormData 等请求体 | `body`，与 `json` 互斥 |
| 取消 | `signal` |
| 完整响应体 | `request<T>()` |
| 字节流 | `stream()` |
| Repository 协议 | `repository(name)` |

泛型描述预期响应，不做运行时数据校验。服务端错误通过 `ApiClientError` 处理；页面应区分拒绝、无权限、取消和可重试失败，而不是全部显示“网络错误”。

## 远程 Repository

远程 Repository 提供查询输入构造器，但需要服务端显式开放对应资源和 actions。它与直接操作数据库的 Repository 运行在不同位置，授权由服务端执行。不要将数据库服务、凭据或私有连接模块导入客户端。

服务端通过 `defineRepositoryApiRoutes()` 声明接口，客户端使用 `api.repository(name)` 调用；`name` 对应暴露名称，可以与 Collection 名不同。查询也使用 POST，远程 Repository 自动解开响应的 `data` 包装。完整示例见 [Repository 数据接口](repository-routes.md)。

## 状态与重试

API Client 不代替页面的请求状态管理。避免较早请求覆盖较新搜索结果；使用取消、请求标识或合适的数据请求状态库。修改类请求只在确定幂等语义后重试，超时不证明服务端未执行。

独立脚本可直接依赖 `@nocobase/api-client` 并用 `createApiClient({ baseURL })` 创建客户端。应用中的类型与入口也由 `@nocobase/app-client` 重新导出。相关契约见[参考](../../reference/api.md)。

## 接口与实现

- [API Client](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/api-client/README.md)
- [Client hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/src/hooks.ts)
