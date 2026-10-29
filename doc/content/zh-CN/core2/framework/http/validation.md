---
title: 请求校验与响应处理
description: 了解如何在运行时校验接口输入、约定成功与失败的响应结构，以及流式响应和请求中断的处理方式。
---

接口在执行业务逻辑之前校验外部输入，并用稳定的响应结构报告结果。TypeScript 类型只约束开发时的代码，无法代替运行时的校验。

## 校验输入

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

示例只规范化文本，不保存数据。`apiValidator()` 接收兼容 Standard Schema 的校验器，通过 `context.req.valid()` 取得校验后的值。其他位置的输入，分别使用相应的路径参数、查询参数或表单校验。

取值范围、长度、允许的字段和业务状态都要明确。格式校验通过后，仍然需要检查身份、权限和业务一致性；不能把用户提交的 ownerId 直接当作当前用户。

## 成功与失败

自定义接口可以统一返回 `{ data, meta }`，并为分页等含义建立稳定的约定。`ApiClient.request()` 会保留整个响应体，不会自动解包 `data`。

```ts
import { ApiError } from '@nocobase/app-server/router';

throw new ApiError({
  status: 'NOT_FOUND',
  reason: 'ORDER_NOT_FOUND',
  domain: 'orders',
  message: 'The requested order was not found.',
});
```

框架会把 `ApiError` 转换为包含 `error` 的标准失败响应。`status` 对应 HTTP 状态的分类，`domain` 和 `reason` 是稳定的机器标识；面向开发者的 `message` 不能用作客户端的分支条件。给用户的提示使用翻译后的文本，字段级的问题可以通过 `fieldViolations` 报告。

## 流式响应与中断

已经开始发送的流，无法再改成普通的 JSON 错误响应。流式协议需要自己约定结束和错误的语义，并在取消后清理资源。超时响应也不会自动撤销已经完成的数据库提交或外部请求。

测试应覆盖合法输入、空值、边界长度、错误的类型、未授权访问和不存在的记录。只有成功路径的测试，不能证明接口的边界是完整的。完整的业务示例见 [请求校验与错误处理](../../developing-apps/request-validation-and-errors.md)。

## 接口与实现

- [API error contract](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/api-error.ts)
- [Validation and OpenAPI](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/openapi/index.ts)
