---
title: 通知与推送
description: 配置邮件和手机推送：邀请邮件、找回密码、离开页面时的提醒都靠它们。站内的提醒不用配置。
---

Studio 的提醒有三种：

| 提醒 | 需要配置 | 用在 |
| --- | --- | --- |
| 站内提醒 | 不需要 | 收件箱、「我的任务」上的数量、提示音、桌面通知 |
| 邮件 | 通知通道和身份验证发件配置 | 邀请成员、找回密码 |
| 推送通知 | 配置 HTTPS 和推送密钥 | Studio 页面没打开时，手机或电脑也能收到提醒 |

成员怎样打开提示音、桌面通知，怎样在手机上订阅推送，见 [收件箱与提醒](../use/inbox.md)。

## 邀请邮件

邀请邮件使用通知通道，默认名称为 `system-email`。在 `config.yml` 的对应节点中合并以下配置：

```yaml
users:
  invitations:
    emailChannel: system-email

notification:
  channels:
    inbox:
      type: in-app
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      secure: false
      auth:
        user: notifications@example.com
      from: "Studio <notifications@example.com>"
```

SMTP 密码使用 `SMTP_PASSWORD` 环境变量，传入方式见下文。发件地址需要获得邮件服务商授权。端口和 TLS 设置按服务商要求填写。

也可以将整个 `system-email` 改为 Resend 通道：使用 `type: resend` 和 `from`，通过 `RESEND_API_KEY` 传入密钥，不保留 SMTP 字段。

未配置邮件时，邀请结果显示「邮件未发送」，管理员仍可复制邀请链接。操作步骤见[邀请成员](../setup/invite.md)。

## 密码重置邮件

密码重置使用独立的 `auth.email` 发件配置。可以与邀请邮件使用同一个 SMTP 账号，但配置必须分别提供。

```yaml
auth:
  emailAndPassword:
    enabled: true
    autoSignIn: false
    disableSignUp: true
  passwordReset:
    enabled: true
  email:
    provider: smtp
    host: smtp.example.com
    port: 587
    secure: false
    auth:
      user: notifications@example.com
    from: "Studio <notifications@example.com>"
```

密码通过 `AUTH_EMAIL_PASSWORD` 传入。还需要设置 `APP_PUBLIC_ORIGIN`，例如 `https://studio.example.com`，让邮件中的链接指向成员可以访问的地址。

使用 Resend 时，将整个 `auth.email` 改为 `provider: resend` 和 `from`，通过 `AUTH_EMAIL_API_KEY` 传入密钥。不要混用 SMTP 字段。

只有同时启用密码登录、设置 `auth.passwordReset.enabled: true` 并配置有效发件方式，内置找回密码功能才可用。

## 传入密码并应用配置

在部署目录的 `.env` 中填写：

```dotenv
SMTP_PASSWORD=<邀请邮件的 SMTP 密码>
AUTH_EMAIL_PASSWORD=<密码重置邮件的 SMTP 密码>
```

在 `docker-compose.yml` 的 `services.studio.environment` 中增加：

```yaml
SMTP_PASSWORD: ${SMTP_PASSWORD:?set SMTP_PASSWORD in .env}
AUTH_EMAIL_PASSWORD: ${AUTH_EMAIL_PASSWORD:?set AUTH_EMAIL_PASSWORD in .env}
```

`.env` 不会自动把变量传进容器，必须在 Compose 中声明。`config.yml` 中的 `${NAME}` 也不会展开，不要用它代替密码。

修改完成后重新创建 Studio 容器：

```bash
docker compose up -d --force-recreate studio
```

## 检查邮件发送

1. 向尚未注册的自有测试邮箱发送邀请，确认收到邮件，链接能打开当前 Studio。
2. 使用一个已有账号，在退出登录后点「忘记密码」，确认收到重置邮件。
3. 通过邮件设置新密码，确认可以重新登录。

页面提示已提交，不代表邮件已送达。未收到邮件时，检查发件地址授权、SMTP 连接、垃圾邮件和 Studio 日志。不要将包含密码或重置链接的日志贴到公共位置。

## 从旧配置迁移

- 通知通道使用 `type: smtp`。旧的 `provider: smtp` 仍是兼容写法。
- 将密码重置使用的发件信息配置到 `auth.email`，移除 `auth.passwordReset.emailChannel`。旧字段仅供兼容，新部署使用独立发件配置。
- 保留 `notification.channels.system-email`，邀请邮件仍需要它。`SMTP_PASSWORD` 与 `AUTH_EMAIL_PASSWORD` 分别控制两个发件配置。

## 推送通知

推送通知要求：

- Studio 通过 HTTPS 访问，`APP_PUBLIC_ORIGIN` 是对外的地址。局域网里的 `http://` 地址不行。
- 一把长期不变的推送私钥：32 字节的 P-256 私钥，用 base64url 或 64 位十六进制表示，写在 `config.yml` 的 `push.privateKey`，或者用环境变量 `WEB_PUSH_PRIVATE_KEY`。`push.contact` 填一个联系邮箱，例如 `mailto:admin@example.com`。

没有私钥时，成员无法订阅推送。

> [!WARNING] 推送私钥要长期保存
> 换了推送私钥，所有已订阅的设备都要重新订阅。把它和 `SECRETS_KEYS` 一起保存在安全的地方、一起备份，不要提交到代码仓库。

## 其他通道

`notification.channels` 还支持飞书、钉钉的群机器人（`feishu-webhook`、`dingtalk-webhook`）等通道。Studio 现在的提醒只用到站内、邮件和推送。
