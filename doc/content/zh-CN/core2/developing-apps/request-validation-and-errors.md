---
title: 请求校验与错误处理
description: 声明接口输入与响应契约，将业务错误转换为稳定的 API 错误，并验证失败时的数据行为。
---

校验负责把外部输入转换为业务可接受的值；权限检查决定是否允许操作；服务再判断当前业务状态是否允许变化。这三类检查各有职责，不能互相代替。

下列片段来自[项目接口示例](apis-and-services.md)，运行前需完成该页列出的历史应用、数据模型和服务。这里只集中解释输入与错误约定，不新增另一套接口。

## 声明输入 schema

```ts
import { z } from 'zod';

export const listInput = z.strictObject({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const createInput = z.strictObject({
  name: z.string().trim().min(1).max(120),
});
export const assignInput = z.strictObject({
  projectId: z.uuid().nullable(),
});
```

查询参数由字符串转换为整数，给出默认值并限制分页大小；名称先去除空格，再检查长度。`strictObject()` 拒绝额外字段，防止把整个表单对象直接作为可写字段。`null` 表示解除项目关联，缺少 `projectId` 则不符合本例合同。

这里使用 `z.uuid()` 是因为项目和任务 ID 的合同是 UUID；应用用户 ID 等其他标识不能照搬这一限制。输入 schema 本身不会检查数据库记录是否存在或用户是否有权选择它。

## 使用校验后的值

把 schema 交给 `apiValidator('query' | 'param' | 'json', schema)`，处理函数只读取相应的 `c.req.valid(...)`。完整写法见[路由与 HTTP 接口](apis-and-services.md)。该校验同时声明 API 文档输入；只在处理函数里调用 `zod.parse()` 不会完成这项接入。

JSON 请求发送 `Content-Type: application/json`。身份、操作权限、中间件顺序和参数验证都应在业务写入之前完成；再校验输入不能补救已经发生的写入。

## 响应与错误合同

输入先经过 `apiValidator()`，业务代码只读取验证后的值。客户端不应自由指定服务端生成的 ID、创建时间或不属于该操作的字段。输出显式选择字段，分页列表与总数使用相同的权限策略和筛选条件。

| 情况 | 本例的处理 |
| --- | --- |
| 查询成功 | `200`，返回 `{ data, meta }`，其中 `meta` 包含分页信息 |
| 新建成功 | `201`，返回 `{ data }` |
| 修改成功 | `200`，返回 `{ data }`，只包含该操作的结果字段 |
| 输入不合法 | `400`，标准 API 错误；可定位的错误附带字段信息 |
| 未登录或操作被拒绝 | 分别返回 `401` 或 `403`，不执行业务写入 |
| 任务不存在或不在本次可操作范围 | `404`，不透露范围外记录的详情 |
| 目标项目不存在或不可选 | `400`，统一的项目字段错误，保留原关联 |

错误使用 `ApiError` 和统一处理器表达，不手写一套错误 JSON，也不要把失败包装成 `200`。已知业务错误可转换为明确的 API 错误；未知异常交给标准错误处理，不能一律伪装成“输入有误”。

## 把业务错误转换为 API 错误

在项目路由中，`router`、`ApiError`、`apiErrorHandler` 以及两种业务错误已声明或导入；下面是该文件的错误处理片段：

```ts
router.onError((error, c) =>
    apiErrorHandler(
      error instanceof ProjectUnavailableError
        ? new ApiError({
            status: 'INVALID_ARGUMENT',
            reason: 'PROJECT_UNAVAILABLE',
            domain: 'tutorialProjects',
            message: error.message,
            fieldViolations: [
              {
                field: 'projectId',
                description: 'Choose an available project.',
              },
            ],
          })
        : error instanceof TaskUnavailableError
          ? new ApiError({
              status: 'NOT_FOUND',
              reason: 'TASK_NOT_FOUND',
              domain: 'tutorialProjects',
              message: error.message,
            })
          : error,
      c,
    ),
  );
```

`reason` 和 `domain` 是客户端判断错误类型的稳定标识；`message` 和字段 `description` 面向开发者，不能直接当成页面的本地化提示。客户端按稳定标识映射文案，把 `fieldViolations` 定位到字段，见[数据请求与状态管理](data-requests-and-state.md)。

只转换本业务认识的错误。`apiErrorHandler()` 会处理已知 API/Repository 错误，并把未知异常继续交给外层应用处理为不泄露内部信息的 `500`；不要把所有异常包装为 `400`。排查时使用响应中的 `requestId` 对照服务端日志。

## 声明响应不等于过滤响应

`describeRoute()` 中的 `dataResponse()`、`listResponse()` 和 `apiErrorResponse()` 描述 API 合同。它们不会代替输出字段选择或在运行时自动删除敏感字段。服务要显式选取允许字段，并将日期等转换为约定格式。修改接口时同步 schema、实际响应和测试。

## 验证失败路径

至少检查缺少字段、空字符串、额外字段、无效 ID、负数或过大页码；再检查不存在和范围外记录。每次拒绝后读取数据库，确认没有意外写入。参数校验通过但业务规则不满足，也应返回有意义的错误。未知异常必须保持为服务器失败，不能显示为一次成功保存。

完整测试见[路由与 HTTP 接口](apis-and-services.md)，标准错误与输入协议见[请求校验与响应处理](../framework/http/validation.md)。
