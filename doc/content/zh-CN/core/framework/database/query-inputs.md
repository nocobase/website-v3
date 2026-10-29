---
title: 查询输入与构造器
---

`@nocobase/repository-input` 提供可在前后端使用的查询输入契约。构造器将代码表达转换为可序列化数据，数据库执行和授权仍在服务端完成。

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

`buildFilter`、`buildSelect`、`buildSort`、`buildAggregate` 接受对应 AST 或同步回调，返回独立的 JSON 快照。Filter 还支持简单等值对象。构造输入不连接数据库，也不验证调用方是否有权读取字段。

## 三种输入方式

| 方式 | 适用位置 |
| --- | --- |
| 等值简写 | 简单标量条件 |
| Builder 回调 | 开发代码中的可读组合 |
| JSON AST | 保存、传输、动态生成 |

函数不能直接通过 JSON 传输，先用 build 工具物化。异步回调、循环对象、非法数字和不支持位置的函数会被拒绝；日期转 ISO 字符串，bigint 转十进制字符串。数值 Filter 的原生 bigint 仍不是合法 JSON 值。

## 变量与写入输入

`context` 为查询变量提供值，不是事务连接或权限对象。服务端决定哪些变量来自可信身份，哪些来自经校验的用户输入。

`buildCreateValues` 和 `buildUpdateValues` 物化写入构造器；完整远程 Repository 请求可使用 API Client 导出的 `build*Options`。不要使用供框架内部共享实现的 `internal/*` 入口。

## 服务端验证

保存的查询仍要核对 Collection、字段类型、关系深度、分页范围和授权策略。不能因为输入由官方 Builder 生成就允许任意数据访问。精确数值需要匹配字段能力，例如大整数和 DECIMAL 使用字符串保留精度。

测试可以比较 Builder 与 AST 的执行结果，但仅比较 JSON 形状不能验证数据库语义。相关主题：[API Client](../http/api-client.md)、[过滤与分页](filtering-pagination.md)。

## 接口与实现

- [Portable input builders](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/repository-input/README.md)
- [Repository input contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/signatures/inputs.md)
