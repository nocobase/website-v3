---
title: "邮件"
description: "连接用户邮箱，收发邮件、同步历史，并组合邮件工作台。"
---

## 提供的能力

`@nocobase/app-plugin-mail` 面向用户自己连接的邮箱，提供账户授权、邮件同步、阅读、撰写、发送、草稿、附件和发送记录等能力。系统验证码和业务通知的邮件投递，请使用 [通知渠道](providers.md)；需要读取用户的邮箱，或以用户连接的账户发信时，才使用本插件。

个人邮箱的连接页和邮件工作台由应用挂载；系统通知邮件则由通知渠道处理。

## 使用场景与示例

### 示例：在客户详情中查看往来邮件

1. 用户连接邮箱，并选择首次同步的起始日期。
2. 等待同步完成，确认目标邮件已经进入本地数据。
3. 应用通过 `MailClient.listMessages({ participant: 'alice@example.com' })` 查询往来邮件，或者用 `participant: '@example.com'` 匹配一个确切的域名。
4. 使用邮件组件展示记录；需要发信时，让用户选择一个可以发送的身份，并核对真实的发送结果。

`participant` 精确匹配 From、To、Cc 中的实际地址；按域名匹配时不包含子域名。它不会扩大用户的邮箱权限，也不会临时去查询尚未同步的远端历史。按关键字模糊搜索请使用单独的 `q`。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```prompt
请使用邮件插件，在客户详情中展示当前用户与客户的往来邮件。
组合 Mail 配置并接入个人邮箱连接页、邮件工作台，保留原有认证与权限。
按客户真实邮箱使用 participant 查询已同步邮件，支持加载与失败状态。
发送时选择可用身份，并用具体 submission ID 关联业务记录。
用测试邮箱验证同步、收发及无权邮箱隔离，不将结果未知的发送自动重复提交。
```

**完成的标志**：客户详情中展示了该用户已同步的相应邮件，发送结果能关联到准确的记录，其他用户的邮箱无法访问。

## 重要原理与实现

下表列出实现本例时的接入位置和预期的界面变化。这些是开发说明，具体的文件名沿用当前应用的结构。

| 接入位置 | 代码或配置的变化 | 界面与行为的变化 |
| --- | --- | --- |
| `server/config/mail.ts` 与应用配置的组合 | 接入 `mailConfig` 和命名的提供方 | 邮箱授权和同步使用真实的配置 |
| 客户端路由与邮箱页面 | 组合 `MailAccountsPage` 和 `MailWorkspacePage` | 用户能连接自己的邮箱并打开工作台 |
| 客户详情与发信回调 | 按 `participant` 查询，记录 submission ID | 只展示已同步且有权读取的邮件，发送结果可以追踪 |

### 接入与配置

注册 Client 和 Server 插件，并执行迁移。此外还要显式组合 Mail 配置，插件的注册命令不会替应用修改配置组合：

```ts
// server/config/mail.ts
import { mailConfig } from '@nocobase/app-plugin-mail/server';
export default mailConfig;
```

在应用的 `defaultAppConfigs()` 中，以 `mail` 为键接入上面的工厂，并更新相应的配置类型。然后在 `mail.providers` 中配置命名的实例。插件内置了 Gmail、Microsoft 365 和 IMAP/SMTP 的实现，但这并不意味着这些外部服务已经配置好了。

OAuth、SMTP 等凭据保存在服务端的私有配置中。使用 OAuth 时，请配置对应提供方的回调地址，并把 `mail.oauthReturnUrl` 指向应用自己的个人邮箱连接页；它的默认值是应用的根路径。

### 接入邮件页面

插件不会自动注册邮件页面。应用可以从 `/client` 使用：

- `MailAccountsPage`：连接和管理个人邮箱。
- `MailWorkspacePage`：邮件工作台，通过 `accountsHref` 指向账户页。
- `MailClient`、`mailClientToken`：供自定义页面调用 `/api/mail`。
- `/client/components`：撰写器、邮件列表、会话、标签、签名等可复用的界面。

个人账户页需要身份认证和 `page:mail.workspace/access` 权限。管理员查看所有用户邮箱信息的页面，不能代替用户自己连接账户的流程。

## AI 开发的约束与验证

### 本插件的开发约束

- 管理员的邮箱概览不能代替用户授权连接；查询时保留邮箱权限检查，`participant` 不会扩大访问范围。
- 把按地址和域名的精确匹配与按 `q` 的模糊搜索区分开；不要把尚未同步的邮件说成“远端查询不到的数据”。
- 检查 OAuth 的返回路径、同步范围和发送状态；发送结果未知时，先核实具体的 submission，避免重复发信。

### 验证与扩展

请检查授权回调、首次同步、收发、草稿和附件，并区分“已提交”“失败”和“结果未知”三种发送状态。如果需要把发送结果关联到业务记录，应使用撰写器返回的具体 submission ID，而不要取“最新的一条历史记录”。

服务端使用 `/server` 导出的 `mailServiceToken`；自定义的提供方通过 `mailProviderRegistryToken` 注册。不同提供方的能力各不相同，界面应按实际能力展示。升级已有邮件数据时，请检查对应版本的迁移要求：参与人索引或 IMAP 位置的迁移，可能需要一个停止写入的维护窗口。

相关文档：[通知渠道](providers.md)、[身份认证](../authentication/sign-in.md)、[管理插件](../../developing-apps/manage-plugins.md)。

以上检查是接入后的验收要求，并不表示本文已经完成了运行验证。请让 Agent 报告实际的改动、执行过的检查和未验证的部分；项目指引、Skills 和通用的检查流程见 [和 Agent 一起开发](../../developing-apps/develop-with-an-agent.md) 与 [测试与验收](../../developing-apps/testing-and-acceptance.md)。

源码依据：[插件的公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-mail)。
