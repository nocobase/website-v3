---
title: "用户管理"
description: "接入用户管理、邀请、角色分配和个人偏好。"
---

`@nocobase/app-plugin-users` 提供用户查询、账号管理、邀请和个人偏好能力。登录身份、密码和会话由[身份认证](sign-in.md)提供，用户管理复用这些数据；角色与操作权限由[权限管理](../authorization/permissions.md)及应用业务定义。

## 接入与入口

在 Client 和 Server 注册插件，并将身份认证、权限管理放在它之前，执行应用的数据库迁移。通用操作见[管理插件](../../developing-apps/manage-plugins.md)。

插件只直接注册邀请接受页 `/invite/:token`。用户列表和管理页面由应用接入，可以复用 `@nocobase/app-plugin-users/client/user-client` 导出的 `UsersClient`。这里及下文的页面和 API 路径均相对于应用挂载路径；例如 `/main` 下的邀请页为 `/main/invite/:token`。

## 管理用户

| 需要完成的操作 | 公开能力 |
| --- | --- |
| 查找用户 | 分页列表，按名称、用户名、邮箱、状态及角色筛选 |
| 编辑账号 | 创建用户，修改名称、用户名、邮箱，启用或停用账号 |
| 管理访问 | 分配角色，重置密码，撤销会话 |
| 邀请加入 | 创建邀请、重发、撤销及接受邀请 |
| 保存个人设置 | 用个人偏好接口保存主题、语言等应用定义的值 |

管理 API 位于 `/api/users`。调用者需要已登录，并拥有 `user` 资源相应操作权限；创建用户同时要求 `create` 和 `assign-role`。插件不会因为某个页面被展示就授予其访问权限。

应用从 `UsersClient` 读取角色选项，再提交允许分配的角色，不应自行假设所有角色都可修改。服务端通过 `/server/tokens` 的 `userManagementServiceToken` 复用管理服务，通过 `userRoleScopeRegistryToken` 接入业务自己的角色范围。

## 示例：邀请成员加入应用

1. 在应用的用户管理页选择邀请，填写邮箱及允许分配的角色。
2. 创建邀请后检查每个地址的处理结果；有权获取链接的邀请者可复制返回的 `inviteUrl`。
3. 接收者打开邀请页。新用户填写姓名和密码；已有用户使用被邀请的邮箱登录后接受。
4. 在用户列表中检查账号及角色，再用该用户验证业务访问范围。

邀请邮件依赖可用的邮件投递配置。邮件发送失败不等于邀请创建失败；按响应判断是否可以转发邀请链接。重新生成链接会使旧链接失效。系统邀请邮件使用通知投递能力，不要求接入[用户邮箱](../notifications/mail.md)。

## 个人偏好与使用边界

React 页面可从 `/client/preferences` 使用 `useUserPreference(key, { defaultValue })`。例如应用可用 `theme.mode` 保存主题选择；插件只保存值，不实现主题切换本身。

停用账号、撤销会话和删除账号有不同含义。删除要求明确确认，保留用于历史归属的禁用身份，原邮箱和用户名仍被占用；业务资源清理由应用的角色范围钩子处理。验证时同时检查普通用户被拒绝的管理操作，以及邀请、禁用和会话撤销后的实际登录状态。

相关文档：[身份认证](sign-in.md)、[API 密钥](api-keys.md)、[权限管理](../authorization/permissions.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-users)。
