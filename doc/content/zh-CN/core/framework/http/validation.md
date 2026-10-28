---
title: 请求校验与响应处理
---

接口在业务逻辑之前验证外部输入，并用稳定的响应结构报告结果。TypeScript 类型只约束开发代码，无法代替运行时校验。

## 验证输入

```ts
import { Hono } from 'hono';
import { z } from 'zod';
import { apiValidator, defineApiRoutes } from '@nocobase/app-server/router';

const input = z.object({ title: z.string().trim().min(1).max(120) });
export default defineApiRoutes(() => {
  const router = new Hono();
  router.post('/example/normalize', apiValidator('json', input), (context) => {
    const value = context.req.valid('json');
    return context.json({ data: { title: value.title } });
  });
  return router;
});
```

示例只规范化文本，不保存数据。`apiValidator()` 接收 Standard Schema 兼容校验器；使用 `context.req.valid()` 取得已验证值。其他输入位置采用相应的参数、查询或表单校验。

范围、长度、允许字段与业务状态都要明确。格式校验通过后仍需身份、权限以及业务一致性检查；不能把用户输入的 ownerId 直接当作当前用户。

## 成功与失败

自定义接口可以统一返回 `{ data, meta }`，并为分页等含义建立稳定约定。`ApiClient.request()` 保留整个响应体，不自动解包 `data`。

```ts
import { ApiError } from '@nocobase/app-server/router';

throw new ApiError({
  status: 'NOT_FOUND',
  reason: 'ORDER_NOT_FOUND',
  domain: 'orders',
  message: 'The requested order was not found.',
});
```

框架把 `ApiError` 转为包含 `error` 的标准失败响应。`status` 对应 HTTP 分类，`domain` 和 `reason` 是稳定的机器标识；面向开发者的 `message` 不能作为客户端分支条件。用户提示使用翻译后的文本，字段问题可通过 `fieldViolations` 报告。

## 流式响应与中断

已经开始发送的流不能再改为普通 JSON 错误。流协议需要自身约定结束与错误语义，并清理取消后的资源。超时响应也不自动撤销已经发生的数据库提交或外部请求。

测试覆盖合法输入、空值、边界长度、错误类型、未授权与不存在的记录。只有成功测试不能证明接口边界完整。完整业务示例见[业务服务与 HTTP 接口](../../developing-apps/apis-and-services.md)。

## 接口与实现

- [API error contract](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/api-error.ts)
- [Validation and OpenAPI](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/openapi/index.ts)
