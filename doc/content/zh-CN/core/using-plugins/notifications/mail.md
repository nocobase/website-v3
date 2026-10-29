---
title: "邮件"
description: "连接用户邮箱，收发邮件、同步历史并组合邮件工作台。"
---

`@nocobase/app-plugin-mail` 面向用户连接的邮箱，提供账户授权、邮件同步、阅读、撰写、发送、草稿、附件及发送记录。系统验证码和业务通知的邮件投递使用[通知渠道](providers.md)；需要读取用户邮箱或以用户连接的账户发信时使用本插件。

## 接入与配置

注册 Client、Server 插件并执行迁移。还要显式组合 Mail 配置，插件注册命令不会替应用修改配置组合：

```ts
// server/config/mail.ts
import { mailConfig } from '@nocobase/app-plugin-mail/server';
export default mailConfig;
```

在应用 `defaultAppConfigs()` 中以 `mail` 键接入上述工厂，并更新相应配置类型。然后在 `mail.providers` 中配置具名实例；内置 Gmail、Microsoft 365 和 IMAP/SMTP 实现不意味着这些外部服务已配置好。

OAuth、SMTP 等凭据保存在服务端私有配置。使用 OAuth 时配置对应提供方的回调，并将 `mail.oauthReturnUrl` 指向应用自己的个人邮箱连接页；默认值是应用根路径。

## 接入邮件页面

插件不自动注册邮件页面。应用从 `/client` 使用：

- `MailAccountsPage`：个人邮箱连接与管理。
- `MailWorkspacePage`：邮件工作台；通过 `accountsHref` 指向账户页。
- `MailClient`、`mailClientToken`：供自定义页面调用 `/api/mail`。
- `/client/components`：组合器、邮件列表、会话、标签、签名等可复用界面。

个人账户页需要身份认证和 `page:mail.workspace/access`。管理员查看全用户邮箱信息的页面不能代替用户自己的账户连接流程。

## 示例：在客户详情中查看往来邮件

1. 用户连接邮箱并选择首次同步的日期边界。
2. 等待同步完成，确认目标邮件已经进入本地数据。
3. 应用通过 `MailClient.listMessages({ participant: 'alice@example.com' })` 查询往来邮件，或用 `participant: '@example.com'` 匹配一个精确域名。
4. 使用邮件组件展示记录；需要发信时让用户选择可发送的身份，核对真实发送结果。

`participant` 精确匹配 From、To、Cc 的实际地址，域名不包含子域名，不会扩展用户的邮箱权限，也不会临时查询尚未同步的远端历史。关键字模糊搜索使用独立的 `q`。

## 验证与扩展

检查授权回调、首次同步、收发、草稿和附件，并区分已提交、失败与结果未知。若需把发送结果关联到业务记录，应使用组合器返回的具体 submission ID，避免取“最新一条历史记录”。

服务端使用 `/server` 的 `mailServiceToken`；自定义提供方通过 `mailProviderRegistryToken` 注册。不同提供方能力不同，界面应按能力展示。已有邮件数据升级时，检查相应版本的迁移要求，参与人索引或 IMAP 位置迁移可能需要停写维护窗口。

相关文档：[通知渠道](providers.md)、[身份认证](../authentication/sign-in.md)、[管理插件](../../developing-apps/manage-plugins.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-mail)。
