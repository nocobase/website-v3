---
title: 通知与推送
description: 配置邀请邮件、密码重置邮件和设备推送。
---

Studio 的提醒有三种：

| 提醒 | 需要配置 | 用在 |
| --- | --- | --- |
| 站内提醒 | 不需要 | 收件箱、「我的任务」上的数量、提示音、桌面通知 |
| 邮件 | `mailers` 发件服务 | 邀请成员、找回密码 |
| 推送通知 | 配置 HTTPS 和推送密钥 | Studio 页面没打开时，手机或电脑也能收到提醒 |

成员怎样打开提示音、桌面通知，怎样在手机上订阅推送，见 [收件箱与提醒](../use/inbox.md)。

## 邀请邮件

邀请和密码重置共用 `mailers` 中的默认发件服务。在 `config.yml` 的对应节点中合并以下 SMTP 配置：

```yaml
mailers:
  default: system
  system:
    provider: smtp
    host: smtp.example.com
    port: 587
    secure: false
    auth:
      user: notifications@example.com
      pass: replace-with-smtp-password
    from: "Studio <notifications@example.com>"
```

将 SMTP 密码填入 `mailers.system.auth.pass`。发件地址需要获得邮件服务商授权，端口和 TLS 设置按服务商要求填写。

使用 Resend 时，用以下内容替换 `mailers` 配置，不要混用 SMTP 字段：

```yaml
mailers:
  default: system
  system:
    provider: resend
    apiKey: replace-with-resend-api-key
    from: "Studio <notifications@example.com>"
```

邀请默认使用 `mailers.default`。如需使用其他已配置的服务，将其名称填入 `users.invitations.mailer`。未配置邮件时，管理员仍可复制邀请链接，见[邀请成员](../setup/invite.md)。

## 密码重置邮件

密码重置也使用 `mailers.default`。启用密码登录和找回密码：

```yaml
app:
  publicOrigin: https://studio.example.com

auth:
  emailAndPassword:
    enabled: true
    autoSignIn: false
    disableSignUp: true
  passwordReset:
    enabled: true
```

设置 `app.publicOrigin`，例如 `https://studio.example.com`，让邮件链接指向成员可以访问的 Studio 地址。如需使用其他已配置的发件服务，将其名称填入 `auth.passwordReset.mailer`。

## 应用配置

保存 `config.yml`，并确保容器用户能读取该文件。然后重新创建 Studio 容器：

```bash
docker compose up -d --force-recreate studio
```

## 检查邮件发送

1. 向尚未注册的自有测试邮箱发送邀请，确认收到邮件，链接能打开当前 Studio。
2. 使用一个已有账号，在退出登录后点「忘记密码」，确认收到重置邮件。
3. 通过邮件设置新密码，确认可以重新登录。

页面提示已提交，不代表邮件已送达。未收到邮件时，检查发件地址授权、SMTP 连接、垃圾邮件和 Studio 日志。不要将包含密码或重置链接的日志贴到公共位置。

## 推送通知

推送通知要求：

- Studio 通过 HTTPS 访问，`app.publicOrigin` 是对外的地址。局域网里的 `http://` 地址不行。
- 一把长期不变的推送私钥：32 字节的 P-256 私钥，用 base64url 或 64 位十六进制表示，写在 `config.yml` 的 `push.privateKey`。`push.contact` 填一个联系邮箱，例如 `mailto:admin@example.com`。

没有私钥时，成员无法订阅推送。

> [!WARNING] 推送私钥要长期保存
> 换了推送私钥，所有已订阅的设备都要重新订阅。把它和 `secrets.keys` 一起保存在安全的地方、一起备份，不要提交到代码仓库。

## 其他通道

`notification.channels` 还支持飞书、钉钉的群机器人（`feishu-webhook`、`dingtalk-webhook`）等通道。Studio 现在的提醒只用到站内、邮件和推送。

![成员在偏好设置中启用提醒](https://static-docs.nocobase.com/studio-zh-notifications-20261111-normal-2x.webp)
