---
title: 通知与推送
description: 配置邮件和手机推送：邀请邮件、找回密码、离开页面时的提醒都靠它们。站内的提醒不用配置。
---

Studio 的提醒有三种：

| 提醒 | 需要配置 | 用在 |
| --- | --- | --- |
| 站内提醒 | 不需要 | 收件箱、「我的任务」上的数量、提示音、桌面通知 |
| 邮件 | 配置邮件通道 | 邀请成员、找回密码 |
| 推送通知 | 配置 HTTPS 和推送密钥 | Studio 页面没打开时，手机或电脑也能收到提醒 |

成员怎样打开提示音、桌面通知，怎样在手机上订阅推送，见 [收件箱与提醒](../use/inbox.md)。

## 邮件

在 `config.yml` 的 `notification.channels` 下，加一个名为 `system-email` 的邮件通道。用 SMTP：

```yaml
notification:
  channels:
    inbox:
      type: in-app
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      auth:
        user: notifications@example.com
        pass: <SMTP 密码>
      from: notifications@example.com
```

也可以用 Resend：`type: resend`，填写 `apiKey` 和 `from`。密码不想写进文件时，用环境变量提供，例如 `SMTP_PASSWORD`。

配置好后重启 Studio：

- 邀请成员时，邀请邮件会发出去。没有配置时，邀请结果显示「邮件未发送」，可以复制邀请链接自己发。
- 找回密码：确认 `config.yml` 里 `auth.passwordReset` 打开，`emailChannel` 指向 `system-email`，登录页上的“忘记密码”才能用。

## 推送通知

推送通知要求：

- Studio 通过 HTTPS 访问，`APP_PUBLIC_ORIGIN` 是对外的地址。局域网里的 `http://` 地址不行。
- 一把长期不变的推送私钥：32 字节的 P-256 私钥，用 base64url 或 64 位十六进制表示，写在 `config.yml` 的 `push.privateKey`，或者用环境变量 `WEB_PUSH_PRIVATE_KEY`。`push.contact` 填一个联系邮箱，例如 `mailto:admin@example.com`。

没有私钥时，成员无法订阅推送。

> [!WARNING] 推送私钥要长期保存
> 换了推送私钥，所有已订阅的设备都要重新订阅。把它和 `SECRETS_KEYS` 一起保存在安全的地方、一起备份，不要提交到代码仓库。

## 其他通道

`notification.channels` 还支持飞书、钉钉的群机器人（`feishu-webhook`、`dingtalk-webhook`）等通道。Studio 现在的提醒只用到站内、邮件和推送。
