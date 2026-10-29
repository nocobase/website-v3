---
title: "默认数据范围"
description: "配置默认数据范围，明确记录范围与操作授权的边界。"
---

`@nocobase/app-plugin-authz-default-access` 默认数据范围为已经拥有某个操作权限的主体，增加一份共同可访问的记录范围。它与权限集自己的范围合并，不是只有“未设置范围”时才生效的兜底设置。

## 接入与配置

在[权限管理](permissions.md)基础上注册本插件的 Client、Server 入口，执行迁移；还要将工厂加入应用的 `server/config/authorization.ts`：

```ts
import { defaultAccess } from '@nocobase/app-plugin-authz-default-access/server';

// 合并到现有授权配置，保留其他已启用的扩展。
plugins: [defaultAccess()]
```

运行时注册负责语言资源和数据库迁移，配置工厂才负责安装规则能力与 HTTP 接口。漏掉工厂时，仅安装包不会使规则生效。

## 配置与使用规则

一个资源最多有一条默认范围规则，可在其中分别配置操作。选择支持全部记录、指定记录 ID，或应用已注册的 `recordAccess`。作用于复合业务动作时，需要用 `scopeKey` 指明该动作的数据范围。

规则管理接口位于 `/api/authorization/defaultAccess`，提供列表、创建、更新和删除，以及选项、主体或记录选择所需的接口。应用负责管理页面，插件不自动注册页面。访问需要 `settings:authorization.default-access` 的相应 `read`、`create`、`update` 或 `delete` 权限。

应用通过受保护的接口保存规则。可信服务端代码也可以使用授权服务上的 `defaultAccess` API；自行封装 HTTP 接口时，需要保留权限检查与输入校验。

## 业务示例

例如客服原本只能查看自己负责的客户。应用可把“公开客户”定义为记录选择，为客户读取操作配置默认范围；客服随后可以读取自己的客户及公开客户。没有客户读取权限的人仍不能读取。

先确认主体拥有目标操作，再配置范围；最后分别检查允许记录、范围外记录和直接 API 调用。业务查询必须落实授权服务返回的数据策略，规则才会影响实际查询。

## 使用边界

规则不会授予页面、操作或字段权限，也不会自动打开关联记录。默认范围和共享范围合并后，仍受限制规则约束。unrestricted 身份跳过这些范围规则，因此不能只用超级管理员验证普通用户的结果。

相关文档：[权限管理](permissions.md)、[默认数据范围](default-access.md)、[共享规则](sharing-rules.md)、[限制规则](restriction-rules.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authz-default-access)。
