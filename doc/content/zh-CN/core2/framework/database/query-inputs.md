---
title: 查询输入与构造器
description: 用 @nocobase/repository-input 构造可序列化的查询与写入输入，了解三种输入方式、变量的用法，以及服务端还需要做的校验。
---

`@nocobase/repository-input` 提供在前后端都能使用的查询输入契约。构造器把代码中的表达转换为可以序列化的数据，而数据库的执行和授权仍然在服务端完成。

## 构造输入

```ts
import { buildFilter, buildSelect, buildSort } from '@nocobase/repository-input';

export const orderQuery = {
  filter: buildFilter((f) => f.string('status').eq('paid')),
  select: buildSelect((s) => s.fields('id', 'orderNo', 'amount')),
  sort: buildSort((s) => s.field('id').asc()),
};
const json = JSON.stringify(orderQuery);
```

`buildFilter`、`buildSelect`、`buildSort`、`buildAggregate` 接受相应的 AST 或同步回调，返回独立的 JSON 快照。Filter 还支持简单的等值对象。构造输入的过程不会连接数据库，也不会验证调用方是否有权读取这些字段。

## 三种输入方式

| 方式 | 适用场景 |
| --- | --- |
| 等值简写 | 简单的标量条件 |
| Builder 回调 | 在开发代码中组合出易读的条件 |
| JSON AST | 保存、传输或动态生成的条件 |

函数不能直接通过 JSON 传输，需要先用 build 工具把它物化。异步回调、循环引用的对象、非法的数字以及出现在不支持位置上的函数都会被拒绝；日期会转换为 ISO 字符串，bigint 会转换为十进制字符串。数值 Filter 中原生的 bigint 仍然不是合法的 JSON 值。

## 变量与写入输入

`context` 为查询中的变量提供值，它不是事务连接，也不是权限对象。哪些变量来自可信的身份、哪些来自经过校验的用户输入，由服务端决定。

`buildCreateValues` 和 `buildUpdateValues` 用于物化写入的构造器；完整的远程 Repository 请求，可以使用 API Client 导出的 `build*Options`。不要使用 `internal/*` 入口，它们供框架内部共享实现。

## 服务端校验

对于保存下来的查询，服务端仍要核对 Collection、字段类型、关系深度、分页范围和授权策略。不能因为输入是由官方 Builder 生成的，就允许任意的数据访问。精确的数值需要与字段的能力匹配，例如大整数和 DECIMAL 使用字符串来保留精度。

测试可以比较 Builder 与 AST 的执行结果，但只比较 JSON 的结构，无法验证数据库层面的语义。相关主题：[API Client](../http/api-client.md)、[过滤、排序与分页](filtering-pagination.md)。

## 接口与实现

- [Portable input builders](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/repository-input/README.md)
- [Repository input contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/signatures/inputs.md)
