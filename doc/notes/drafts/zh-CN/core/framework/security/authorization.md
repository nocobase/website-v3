---
title: 授权、权限集与数据范围
---

`@nocobase/authorization` 定义身份对资源执行操作时的授权判断。应用通常通过 `@nocobase/app-plugin-authorization/server` 的 `authorizationToken` 使用它；插件提供持久化、数据库执行约束、管理接口和 UI，基础库负责授权模型。

## 授权模型

| 概念 | 作用 |
| --- | --- |
| 身份 Identity | 已认证主体 `principal` 以及经过验证的团队等 `subjects` |
| 资源引用 | `{ type, id }`，例如 `report/orders` |
| 资源类型 | 定义操作、资源目录或动态记录，以及授权处理方式 |
| 权限集 Permission Set | 存储授权项，并分配给用户或其他主体 |
| 组合资源 Composite | 将一个业务操作展开为多个底层资源的授权项 |
| 数据范围 Data scope | 组合操作中的命名范围槽位，由记录选择填充 |
| Record access | 代码定义的记录选择方式，例如“本人负责的数据” |

定义权限集的值：

```ts
import { definePermissionSet } from '@nocobase/authorization/permission-sets';

export const ordersReader = definePermissionSet('orders-reader')
  .title('Orders reader')
  .grant({
    resource: { type: 'report', id: 'orders' },
    actions: [{ action: 'view' }],
  })
  .build();
```

这段代码只生成定义。接入时还需注册 `report` 资源类型和 `orders` 资源项，将权限集保存并分配给主体；基础库自身不附带存储或 HTTP 接口。

## 在请求中判断

使用已经验证的身份建立 `authz.for(identity)` 上下文。此上下文可以复用同一请求中的权限读取；不要跨用户全局缓存它，也不要信任请求体传入的用户 ID 或团队成员关系。

- `authorize(request)` 返回 `permit`、`deny` 或带条件的 `conditional`。
- `can(request)` 仅在无条件允许时返回 `true`。
- `require(request)` 在不能无条件允许时抛错。
- `snapshot()` 为客户端提供可见性信息，不能替代服务端检查。

`conditional` 必须由支持该条件的适配层转成数据约束。不能把“不是 deny”当成允许访问所有记录。未知资源或无法解释的条件应拒绝访问。

## 数据范围落地

默认访问范围、共享规则和限制规则可以参与记录选择。应用插件负责把这些约束接到数据库操作；仅安装基础库或在页面隐藏按钮，都不会自动限制 Repository 查询。

手写接口需要同时处理操作权限、可见字段和可访问记录。使用权限插件提供的数据访问集成；自行接入时要明确将策略传给 Repository，参见[数据操作](../database/repositories.md)。测试至少覆盖无权限、部分记录可见以及越权写入。

插件安装与配置属于[使用插件](../../using-plugins/overview.md)，资源类型、组合资源和条件解释器的开发属于这里的框架扩展。

## 接口与实现

- [Authorization model and decisions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/authorization/README.md)
