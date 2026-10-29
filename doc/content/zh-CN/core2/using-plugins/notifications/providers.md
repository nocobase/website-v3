---
title: "通知渠道"
description: "配置 SMTP、Resend、飞书和钉钉通知渠道。"
---

## 提供的能力

`@nocobase/app-plugin-notification-providers` 为 [通知](notification.md) 提供 SMTP、Resend、飞书机器人和钉钉机器人等渠道。它只有 Server 运行时入口，不提供配置页面，也不提供用户邮箱工作台。

### 选择渠道类型

| `type` | 使用场景 | 消息要求 |
| --- | --- | --- |
| `smtp` | 通过 SMTP 服务器发送邮件 | 原始邮箱地址，以及 subject、text 或 html |
| `resend` | 通过 Resend 发送邮件 | 原始邮箱地址，以及 subject、text 或 html |
| `feishu-webhook` | 向飞书机器人的 Webhook 发送消息 | text，可选完整的 HTTP(S) target URL |
| `dingtalk-webhook` | 向钉钉机器人的 Webhook 发送消息 | text，可选完整的 HTTP(S) target URL |

同一种类型可以配置多个命名渠道，分别使用不同的凭据。新增配置时请使用 `type`；旧的 `provider` 别名仍然兼容，但两者同时出现时必须一致。

## 使用场景与示例

### 示例：把业务通知和运维告警分开

把 `system-email` 配置为邮件渠道，把 `ops-feishu` 配置为飞书渠道。业务调用 `notification.send()` 时，分别在 `messages['system-email']` 和 `messages['ops-feishu']` 中提供完整的消息。

邮件可以传入单个邮箱或邮箱数组；机器人 Webhook 不接受 `to`，发送目标由配置的 Webhook 决定。插件不负责把用户 ID 转换成邮箱。飞书和钉钉渠道会校验官方的 HTTPS Webhook 主机，并且不会跟随重定向。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```prompt
请使用通知渠道插件，将业务邮件与运维飞书告警分开。
配置 system-email 与 ops-feishu 两个具名渠道，凭据来自服务端私有配置，显式处理环境变量映射。
邮件提供邮箱收件人，机器人使用配置中的 Webhook，不传 to。
使用受控收件人与测试群验证实际投递及失败结果，不额外开发个人邮箱页面。
```

**完成的标志**：测试邮件和告警分别到达指定的目标；凭据错误导致的失败，可以在日志中定位。

## 重要原理与实现

下表列出实现本例时的接入位置和预期的界面变化。这些是开发说明，具体的文件名沿用当前应用的结构。

| 接入位置 | 代码或配置的变化 | 界面与行为的变化 |
| --- | --- | --- |
| `server/plugins.ts` 与通知配置 | 注册 Server 渠道插件和命名的渠道实例 | 不新增页面，服务端可以选择投递实现 |
| 配置工厂和私密的环境配置 | 显式映射 SMTP 或 Webhook 的凭据 | 配置名称与实际读取的路径一致 |
| 业务通知的构造 | 按渠道分别准备邮件消息或机器人消息 | 两类消息分别投递到各自的目标 |

### 配置渠道

在通知插件之后注册本插件的 Server 入口，并在 `notification.channels` 下添加命名渠道：

```yaml
notification:
  channels:
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      from: notifications@example.com
```

这个示例只展示配置的结构，实际的 SMTP 认证信息需要通过服务端的私有配置提供。YAML 中的值都是字面量，不会自动展开 `${...}`。默认模板的 `defineMailChannelsConfig` 会把 `SMTP_PASSWORD` 映射到 `channels.system-email.auth.pass`；如果使用自定义的渠道名称或凭据路径，需要显式配置环境变量映射。

## AI 开发的约束与验证

### 本插件的开发约束

- 区分渠道名称和 `type`；YAML 不会自动展开环境变量，不能把占位表达式当作有效的凭据。
- 保留官方 Webhook 主机和重定向的校验；不要为了让测试通过而关闭提供方的校验。
- 实际检查认证失败、收件人格式和投递日志；使用测试目标，避免把验收消息发给业务用户。

### 验证与扩展

通过真实的业务或服务端发送来验证渠道，并检查 [通知](notification.md) 的日志。同时确认配置可读、认证可用、收件人格式正确；不要仅凭配置保存成功就判断发送成功。

需要新的渠道时，通过 `ChannelInstance` 和 `registry.registerChannelType()` 扩展；通用的扩展实现属于插件开发的范畴。本插件不包含站内信和 Web Push，它们分别由 [站内信](in-app.md) 和 [浏览器推送](web-push.md) 提供。如果需要连接用户自己的邮箱，请参阅 [邮件](mail.md)。

以上检查是接入后的验收要求，并不表示本文已经完成了运行验证。请让 Agent 报告实际的改动、执行过的检查和未验证的部分；项目指引、Skills 和通用的检查流程见 [和 Agent 一起开发](../../developing-apps/develop-with-an-agent.md) 与 [测试与验收](../../developing-apps/testing-and-acceptance.md)。

源码依据：[插件的公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-providers)。
