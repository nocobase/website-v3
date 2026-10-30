---
title: "邮件"
description: "连接用户邮箱，收发邮件、同步历史并组合邮件工作台。"
---

## 提供的能力

`@nocobase/app-plugin-mail` 面向用户连接的邮箱，提供账户授权、邮件同步、阅读、撰写、发送、草稿、附件及发送记录。系统验证码和业务通知的邮件投递使用[通知渠道](providers.md)；需要读取用户邮箱或以用户连接的账户发信时使用本插件。

个人邮箱连接和工作台由应用挂载；系统通知邮件通过通知渠道处理。

## 使用场景与示例

### 示例：在客户详情中查看往来邮件

1. 用户连接邮箱并选择首次同步的日期边界。
2. 等待同步完成，确认目标邮件已经进入本地数据。
3. 应用通过 `MailClient.listMessages({ participant: 'alice@example.com' })` 查询往来邮件，或用 `participant: '@example.com'` 匹配一个精确域名。
4. 使用邮件组件展示记录；需要发信时让用户选择可发送的身份，核对真实发送结果。

`participant` 精确匹配 From、To、Cc 的实际地址，域名不包含子域名，不会扩展用户的邮箱权限，也不会临时查询尚未同步的远端历史。关键字模糊搜索使用独立的 `q`。

**开发提示词**（交给当前应用目录中的 Agent）：

```text
请使用邮件插件，在客户详情中展示当前用户与客户的往来邮件。
组合 Mail 配置并接入个人邮箱连接页、邮件工作台，保留原有认证与权限。
按客户真实邮箱使用 participant 查询已同步邮件，支持加载与失败状态。
发送时选择可用身份，并用具体 submission ID 关联业务记录。
用测试邮箱验证同步、收发及无权邮箱隔离，不将结果未知的发送自动重复提交。
```

**完成标志**：客户详情展示该用户已同步的对应邮件，发送结果能关联到准确记录，其他用户邮箱不可访问。

## 重要原理与实现

以下是实现本例时的接入位置与预期界面变化；它们是开发说明，具体文件名沿用当前应用结构。

| 接入位置 | 代码或配置变化 | 界面与行为变化 |
| --- | --- | --- |
| server/config/mail.ts 与应用配置组合 | 接入 mailConfig 和具名提供方 | 邮箱授权与同步使用真实配置 |
| 客户端路由与邮箱页面 | 组合 MailAccountsPage、MailWorkspacePage | 用户能连接自己的邮箱并查看工作台 |
| 客户详情与发信回调 | 查询 participant，记录 submission ID | 只展示已同步且有权读取的邮件，发送结果可追踪 |

### 接入与配置

注册 Client、Server 插件并执行迁移。还要显式组合 Mail 配置，插件注册命令不会替应用修改配置组合：

```ts
// server/config/mail.ts
import { mailConfig } from '@nocobase/app-plugin-mail/server';
export default mailConfig;
```

在应用 `defaultAppConfigs()` 中以 `mail` 键接入上述工厂，并更新相应配置类型。然后在 `mail.providers` 中配置具名实例；内置 Gmail、Microsoft 365 和 IMAP/SMTP 实现不意味着这些外部服务已配置好。

OAuth、SMTP 等凭据保存在服务端私有配置。使用 OAuth 时配置对应提供方的回调，并将 `mail.oauthReturnUrl` 指向应用自己的个人邮箱连接页；默认值是应用根路径。

### 接入邮件页面

插件不自动注册邮件页面。应用从 `/client` 使用：

- `MailAccountsPage`：个人邮箱连接与管理。
- `MailWorkspacePage`：邮件工作台；通过 `accountsHref` 指向账户页。
- `MailClient`、`mailClientToken`：供自定义页面调用 `/api/mail`。
- `/client/components`：组合器、邮件列表、会话、标签、签名等可复用界面。

个人账户页需要身份认证和 `page:mail.workspace/access`。管理员查看全用户邮箱信息的页面不能代替用户自己的账户连接流程。

## AI 开发的约束与验证

### 本插件的开发约束

- 管理员邮箱概览不代替用户授权连接；查询保留邮箱权限，participant 不扩大访问范围。
- 精确地址与域名匹配和模糊 q 分开，不将未同步邮件描述成查询不到的远端数据。
- 检查 OAuth 返回路径、同步范围与发送状态，结果未知时先核实具体 submission，避免重复发信。

### 验证与扩展

检查授权回调、首次同步、收发、草稿和附件，并区分已提交、失败与结果未知。若需把发送结果关联到业务记录，应使用组合器返回的具体 submission ID，避免取“最新一条历史记录”。

服务端使用 `/server` 的 `mailServiceToken`；自定义提供方通过 `mailProviderRegistryToken` 注册。不同提供方能力不同，界面应按能力展示。已有邮件数据升级时，检查相应版本的迁移要求，参与人索引或 IMAP 位置迁移可能需要停写维护窗口。

相关文档：[通知渠道](providers.md)、[身份认证](../authentication/sign-in.md)、[管理插件](../../developing-apps/manage-plugins.md)。

上述检查是接入后的验收要求，不表示本文已完成运行验证。让 Agent 报告实际改动、执行过的检查和未验证项；项目指引、Skill 与通用检查流程见[使用 Agent 开发](../../getting-started/develop-with-an-agent.md)和[测试与验收](../../developing-apps/testing-and-acceptance.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-mail)。
