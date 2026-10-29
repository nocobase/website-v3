---
title: "通知渠道"
description: "配置 SMTP、Resend、飞书和钉钉通知渠道。"
---

`@nocobase/app-plugin-notification-providers` 为[通知](notification.md)提供 SMTP、Resend、飞书机器人和钉钉机器人渠道。它只有 Server 运行时入口，不提供配置页面或用户邮箱工作台。

## 配置渠道

将 Server 插件放在通知插件之后注册，并在 `notification.channels` 下添加命名渠道：

```yaml
notification:
  channels:
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      from: notifications@example.com
```

此示例只展示配置结构；实际 SMTP 认证需通过服务端私有配置提供。YAML 值是字面量，不会自动展开 `${...}`。默认模板的 `defineMailChannelsConfig` 将 `SMTP_PASSWORD` 映射到 `channels.system-email.auth.pass`；自定义渠道名称或凭据路径需要显式环境变量映射。

## 选择渠道类型

| `type` | 使用场景 | 消息要求 |
| --- | --- | --- |
| `smtp` | 通过 SMTP 服务器发送邮件 | 原生邮箱地址、subject、text 或 html |
| `resend` | 通过 Resend 发送邮件 | 原生邮箱地址、subject、text 或 html |
| `feishu-webhook` | 向飞书机器人 Webhook 发消息 | text，可选完整 HTTP(S) target URL |
| `dingtalk-webhook` | 向钉钉机器人 Webhook 发消息 | text，可选完整 HTTP(S) target URL |

一个类型可以配置多个命名渠道，分别使用不同凭据。新增配置使用 `type`；旧 `provider` 别名仍兼容，但两者同时出现时必须一致。

## 示例：业务通知与运维告警分开

将 `system-email` 配置为邮件渠道，将 `ops-feishu` 配置为飞书渠道。业务调用 `notification.send()` 时，分别在 `messages['system-email']` 和 `messages['ops-feishu']` 提供完整消息。

邮件可传单个邮箱或邮箱数组；机器人 Webhook 不接受 `to`，目标由配置的 Webhook 决定。插件不负责把用户 ID 换成邮箱。飞书、钉钉渠道校验官方 HTTPS Webhook 主机，且不跟随重定向。

## 验证与扩展

通过真实业务或服务端发送验证渠道，并检查[通知日志](notification.md)。同时确认配置可读、认证可用和收件人格式正确；不要仅凭配置保存成功判断发送成功。

需要新渠道时，通过 `ChannelInstance` 与 `registry.registerChannelType()` 扩展；通用扩展实现属于插件开发。本插件不包含站内信和 Web Push，它们分别由[站内信](in-app.md)和[浏览器推送](web-push.md)提供。需要连接用户自己的邮箱，参阅[邮件](mail.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-providers)。
