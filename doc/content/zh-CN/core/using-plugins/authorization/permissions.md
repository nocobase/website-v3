---
title: "权限管理"
description: "配置权限集、页面与业务操作权限，并在服务端落实数据访问。"
---

`@nocobase/app-plugin-authorization` 提供应用授权服务、权限集、页面和设置项权限，以及数据库字段、记录和关联访问策略。适合控制“谁能打开某个页面、执行某个业务操作、访问哪些数据”。

## 接入与入口

在身份认证之后注册 Client 和 Server 插件，执行迁移与种子数据。应用在 `server/config/authorization.ts` 中组合配置，通过 `/server` 的 `authorizationToken` 使用授权服务。

插件提供 `/api/authorization` 接口、`AuthorizationClient` 和 `useCan` 等客户端能力，不直接注册权限管理页面。应用接入自己的管理页，并声明可分配的业务能力。

## 配置权限

| 对象 | 控制内容 |
| --- | --- |
| 权限集 | 将一组授权分配给用户等主体 |
| `page` | 页面访问，例如打开订单页 |
| `settings` | 设置项的读取、创建、修改等管理操作 |
| `composite` | 业务动作及其依赖的数据、字段和操作 |
| `database.collection` | 已接入权限模型的 Collection 及其数据策略 |

资源和操作需要先由应用或插件声明，才能正确授权。业务 Collection 必须通过授权服务注册；单纯存在于数据库中不等于已接入权限模型。

默认配置的 `root` 权限集具有 unrestricted 权限，应与普通业务角色分开。当前实现将 Member 作为新建普通账号的显式角色分配，不能把它理解成所有登录用户永远隐式拥有的权限。

## 示例：订单查看与修改

1. 应用声明“查看订单”和“修改订单”业务能力，明确所需字段与记录范围。
2. 给客服角色授予查看，给订单负责人授予相应修改能力。
3. 页面用路由 `authz` 和 `useCan` 呈现入口、按钮；API 在服务端重新检查操作。
4. 查询通过 `authz.database.policyFor(...)` 或 `authorizeRepository(...)` 等公开接口落实记录与字段策略。
5. 用不同角色检查列表、详情、关联数据和直接 API 请求。

只检查“有查看订单权限”后直接执行不受限制的数据库查询，会丢失记录和字段限制。菜单隐藏、按钮禁用也不能代替服务端授权。

## 数据范围扩展

需要统一或细化记录范围时，按业务分别配置：

- [默认数据范围](default-access.md)：为已经具备操作权限的主体增加共同记录范围。
- [共享规则](sharing-rules.md)：为指定主体追加特定记录范围。
- [限制规则](restriction-rules.md)：收窄指定主体仍可访问的记录。

这些规则不会创建操作权限。管理界面中的分组只是展示组织，也不会改变授权结果。相关安装操作见[管理插件](../../developing-apps/manage-plugins.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authorization)。
