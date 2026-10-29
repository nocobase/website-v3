---
title: 请求校验与错误处理
description: 声明接口的输入与响应约定，把业务错误转换为稳定的 API 错误，并验证失败时的数据行为。
---

一次请求要经过三类检查：校验把外部输入转换为业务可以接受的值；权限检查决定是否允许这次操作；服务再判断当前的业务状态是否允许发生变化。三者各有职责，不能互相代替。

下面的片段来自 [项目接口示例](apis-and-services.md)，运行前需要先完成该页列出的历史应用、数据模型和服务。本篇只集中解释输入和错误的约定，不另建一套接口。

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

查询参数从字符串转换为整数，带有默认值，并限制每页的条数；名称先去除首尾空格，再检查长度。`strictObject()` 会拒绝多余的字段，防止把整个表单对象直接当作可写字段提交。`null` 表示解除项目关联；缺少 `projectId` 则不符合本例的约定。

这里使用 `z.uuid()`，是因为本例约定项目和任务的 ID 都是 UUID；应用中的用户 ID 等其他标识不能照搬这一限制。另外，输入 schema 本身不会检查数据库中的记录是否存在，也不会检查用户是否有权选择它。

## 使用校验后的值

把 schema 交给 `apiValidator('query' | 'param' | 'json', schema)`，处理函数中只读取相应的 `c.req.valid(...)`。完整写法见 [路由与 HTTP 接口](apis-and-services.md)。这个校验同时声明了 API 文档中的输入；只在处理函数里调用 `zod.parse()`，无法完成这项接入。

JSON 请求需要发送 `Content-Type: application/json`。身份、操作权限、中间件顺序和参数校验，都应该在业务写入之前完成；写入已经发生之后再校验输入，无法补救。

## 响应与错误的约定

输入先经过 `apiValidator()`，业务代码只读取校验后的值。客户端不应自由指定由服务端生成的 ID、创建时间，或不属于本次操作的字段。输出时显式选择字段；分页列表和总数使用相同的权限策略和筛选条件。

| 情况 | 本例的处理 |
| --- | --- |
| 查询成功 | `200`，返回 `{ data, meta }`，其中 `meta` 包含分页信息 |
| 新建成功 | `201`，返回 `{ data }` |
| 修改成功 | `200`，返回 `{ data }`，只包含本次操作的结果字段 |
| 输入不合法 | `400`，标准 API 错误；能定位到字段的错误附带字段信息 |
| 未登录，或操作被拒绝 | 分别返回 `401` 或 `403`，不执行业务写入 |
| 任务不存在，或不在本次可操作的范围内 | `404`，不透露范围外记录的任何详情 |
| 目标项目不存在或不可选 | `400`，统一的项目字段错误，原有关联保持不变 |

错误统一用 `ApiError` 和标准处理器表达：不要手写另一套错误 JSON，也不要把失败包装成 `200`。已知的业务错误可以转换为明确的 API 错误；未知的异常交给标准错误处理，不能一律伪装成“输入有误”。

## 把业务错误转换为 API 错误

在项目路由文件中，`router`、`ApiError`、`apiErrorHandler` 和两种业务错误都已经声明或导入。下面是该文件中错误处理的片段：

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

`reason` 和 `domain` 是客户端判断错误类型的稳定标识；`message` 和字段的 `description` 面向开发者，不能直接当作页面上的本地化提示。客户端应按稳定标识映射文案，并根据 `fieldViolations` 把错误定位到字段，见 [数据请求与状态管理](data-requests-and-state.md)。

只转换本业务认识的错误。`apiErrorHandler()` 会处理已知的 API 错误和 Repository 错误，并把未知异常继续交给外层的应用处理，最终返回一个不泄露内部信息的 `500`。不要把所有异常都包装成 `400`。排查问题时，用响应中的 `requestId` 对照服务端日志。

## 声明响应不等于过滤响应

`describeRoute()` 中的 `dataResponse()`、`listResponse()` 和 `apiErrorResponse()` 描述的是 API 约定，它们既不会代替输出字段的选择，也不会在运行时自动删除敏感字段。服务需要显式选取允许输出的字段，并把日期等值转换为约定的格式。修改接口时，同步更新 schema、实际响应和测试。

## 验证失败路径

至少检查以下输入：缺少字段、空字符串、多余字段、无效的 ID、负数或过大的页码；再检查不存在的记录和范围外的记录。每次请求被拒绝后都读取数据库，确认没有发生意外写入。参数校验通过、但业务规则不满足时，也应返回有意义的错误。未知异常必须保持为服务端失败，不能显示成一次成功的保存。

完整的测试见 [路由与 HTTP 接口](apis-and-services.md)，标准错误和输入协议见 [请求校验与响应处理](../framework/http/validation.md)。
