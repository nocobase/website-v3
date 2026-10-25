---
title: 认证
status: 待补充正文
description: 登录、注册、找回密码和会话，基于 Better Auth；企业统一身份（OIDC）、社交登录、双因素认证、通行密钥等通过 Better Auth 的配置和插件接入。
---

> [!PENDING] 正文待编写
> 档案由脚本从 NocoBase 仓库 `v3-develop` 分支（商业插件为 `nocobase3-pro` 的 `develop` 分支）生成；正文按[文件](file.md)一页的写法补充。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/app-plugin-authentication` |
| 版本 | 2.0.0-beta.13 |
| 版本范围 | <span class="tag">开源</span> |
| 默认模板 | <span class="tag ok">已启用</span> 服务端、浏览器端 |
| 依赖的插件 | 无 |
| 自带页面 | 无；登录、注册、找回密码页面是应用自己的页面，模板已经写好 |
| UI 组件 | UI 组件库的 `auth-forms`、`auth-methods`、`auth-split-layout`、`auth-centered-layout`、`device-approval`，模板已预装登录页用到的几个 |
| 数据表 | 有，迁移随插件提供 |
| 命令 | 无 |
| 技能 | `nocobase-app-plugin-authentication` |
| 所属能力 | [用户与组织](../capabilities/users.md) |

## 计划包含

- 它怎样工作
- 默认模板里的登录、注册、找回密码、设备确认页面
- 关闭自助注册、密码策略、停用账号与重新登录
- 接入企业统一身份（OIDC）和社交登录：需要身份平台提供什么、回调地址
- 双因素认证、通行密钥、组织等 Better Auth 官方插件
- 部署时的对外地址 `app.publicOrigin`
- LDAP、SAML、钉钉、企业微信的现状（待确认）
- 怎样让 Agent 使用，怎样检查结果
- 管理员能调整什么、部署配置
- 限制与尚未支持
- 与 NocoBase 2 的对应
- 开发参考
