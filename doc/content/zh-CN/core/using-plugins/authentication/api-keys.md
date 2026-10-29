---
title: "API 密钥"
description: "签发和撤销 API 密钥，并限制外部调用的权限范围。"
---

`@nocobase/app-plugin-api-keys` 为脚本和外部系统提供 API 密钥认证。请求使用 `x-api-key`，以密钥所属用户的身份执行；带范围的密钥还会受到自身范围限制。

## 接入与配置

除 Client、Server 插件注册和数据库迁移外，还要在服务端认证配置中加入 `/server` 导出的 `apiKey()`，在客户端认证配置中加入 `/client` 导出的 `apiKeyClient()`。默认模板已组合这些配置，先检查再补充。

只注册服务端插件会创建密钥表，但不会启用 Better Auth 密钥端点；只加 `apiKey()` 而不执行插件迁移则缺少数据表。插件不注册密钥管理页，应用可使用认证客户端或 `/api/apiKeys` 构建个人管理页。

## 创建与使用

用户必须通过交互登录后的会话管理自己的密钥。密钥本身不能创建、修改或删除其他密钥。带范围的密钥可通过以下接口管理：

| 接口 | 用途 |
| --- | --- |
| `GET /api/apiKeys/scopeOptions` | 获取可选权限组、预设和有效期信息 |
| `POST /api/apiKeys` | 创建密钥，返回一次性的明文 secret |
| `GET /api/apiKeys` | 查看自己的密钥及范围，不返回 secret |
| `POST /api/apiKeys/:keyId/rotate` | 轮换 secret，旧值立即失效 |
| `DELETE /api/apiKeys/:keyId` | 撤销密钥 |

例如，应用挂载在 `/main` 时，可使用密钥读取其 API 文档：

```bash
curl -H 'x-api-key: <your-key>' https://app.example.com/main/api/swagger
```

将 `<your-key>` 替换为实际密钥，并按应用部署位置调整地址。读取 API 文档成功不代表已获准调用其中每个接口。

## 示例：给报表脚本只读访问

1. 由应用声明报表业务对应的密钥权限组和记录范围。
2. 用户登录密钥管理页，选择已被授予的只读能力和有效期，保存创建时返回的 secret。
3. 脚本通过 `x-api-key` 调用报表接口。
4. 验证允许的查询成功，写入、超范围记录和撤销后的请求被拒绝。

带范围密钥的有效权限是“用户当前权限与密钥范围的交集”。范围不会授予用户原本没有的权限。使用 `auth.required()` 的业务接口需要明确允许 scoped keys，并通过授权系统或相应范围检查执行操作；未接入的接口拒绝这类密钥。

## 使用边界

无范围密钥继承所属用户的权限，不能把它描述成默认只读。用户失去权限或被停用后，密钥也受到影响。`apiKeys.maxScopedKeyDays` 可限制带范围密钥的有效期；轮换后需要更新调用方保存的 secret。

相关文档：[身份认证](sign-in.md)、[权限管理](../authorization/permissions.md)、[管理插件](../../developing-apps/manage-plugins.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-api-keys)。
