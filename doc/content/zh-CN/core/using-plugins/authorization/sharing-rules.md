---
title: "共享规则"
description: "配置共享规则，明确记录范围与操作授权的边界。"
---

`@nocobase/app-plugin-authz-sharing-rules` 共享规则为指定用户、团队等主体追加记录范围。它适合交接、跨团队协作或指定记录的临时共享；接收方仍需拥有相关业务操作权限。

## 接入与配置

在[权限管理](permissions.md)基础上注册本插件的 Client、Server 入口，执行迁移；还要将工厂加入应用的 `server/config/authorization.ts`：

```ts
import { sharingRules } from '@nocobase/app-plugin-authz-sharing-rules/server';

// 合并到现有授权配置，保留其他已启用的扩展。
plugins: [sharingRules()]
```

运行时注册负责语言资源和数据库迁移，配置工厂才负责安装规则能力与 HTTP 接口。漏掉工厂时，仅安装包不会使规则生效。

## 配置与使用规则

规则需要指定主体、目标资源、操作和记录选择。选择只能是指定记录 ID 或已注册的 `recordAccess`，不支持 `all`。需要向所有已具备操作权限的人开放共同记录时，使用默认数据范围。

规则管理接口位于 `/api/authorization/sharingRules`，提供列表、创建、更新和删除，以及选项、主体或记录选择所需的接口。应用负责管理页面，插件不自动注册页面。访问需要 `settings:authorization.sharing-rules` 的相应 `read`、`create`、`update` 或 `delete` 权限。

应用通过受保护的接口保存规则。可信服务端代码也可以使用授权服务上的 `sharingRules` API；自行封装 HTTP 接口时，需要保留权限检查与输入校验。

## 业务示例

例如销售甲需要把客户 A 交给销售乙协作。先确保乙具备客户读取操作，再创建面向乙的共享规则，为读取动作选择客户 A。乙获得该客户的读取范围，但不会因此获得修改权限或客户所有关联数据的权限。

先确认主体拥有目标操作，再配置范围；最后分别检查允许记录、范围外记录和直接 API 调用。业务查询必须落实授权服务返回的数据策略，规则才会影响实际查询。

## 使用边界

规则不会授予页面、操作或字段权限，也不会自动打开关联记录。默认范围和共享范围合并后，仍受限制规则约束。unrestricted 身份跳过这些范围规则，因此不能只用超级管理员验证普通用户的结果。

相关文档：[权限管理](permissions.md)、[默认数据范围](default-access.md)、[共享规则](sharing-rules.md)、[限制规则](restriction-rules.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authz-sharing-rules)。
