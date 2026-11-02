---
title: "通知とプッシュ"
description: "招待メール、パスワード再設定メール、端末へのプッシュ通知を設定します。"
---

Studio の通知には 3 種類あります。

| 通知 | 必要な設定 | 用途 |
| --- | --- | --- |
| アプリ内の通知 | なし | 受信トレイ、My issues の件数、通知音、デスクトップ通知 |
| メール | 通知チャネルと認証用の送信設定 | 招待、パスワード再設定 |
| プッシュ通知 | HTTPS とプッシュ用キー | Studio を開いていない端末への通知 |

メンバーによる通知音、デスクトップ通知、携帯端末のプッシュ購読は[受信トレイと通知](../use/inbox.md)を参照してください。

## 招待メール

招待には既定で `system-email` 通知チャネルを使います。`config.yml` の対応する項目に以下を追加します。

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

パスワードは、後述の `SMTP_PASSWORD` で渡します。送信元アドレスをメールサービスで認可し、指定のポートと TLS 設定を使ってください。

Resend を使う場合は、`system-email` 全体を `type: resend` と `from` に置き換えます。`RESEND_API_KEY` を渡し、SMTP の項目は削除します。

メール未設定でも、管理者は招待リンクをコピーして共有できます。[メンバーを招待する](../setup/invite.md)を参照してください。

## パスワード再設定メール

パスワード再設定は、独立した `auth.email` の送信設定を使います。招待と同じ SMTP アカウントを利用できますが、両方の送信設定が必要です。

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

パスワードは `AUTH_EMAIL_PASSWORD` で渡します。`APP_PUBLIC_ORIGIN` に `https://studio.example.com` などを設定し、メールのリンクが Studio に届くようにしてください。

Resend の場合は、`auth.email` 全体を `provider: resend` と `from` に置き換えます。`AUTH_EMAIL_API_KEY` を渡し、SMTP の項目は削除します。

標準の再設定機能には、パスワードでのサインイン、`auth.passwordReset.enabled: true`、有効な送信設定が必要です。

## シークレットを渡して設定を反映する

デプロイ先の `.env` に追加します。

```dotenv
SMTP_PASSWORD=<invitation-email-smtp-password>
AUTH_EMAIL_PASSWORD=<password-reset-smtp-password>
```

`docker-compose.yml` の `services.studio.environment` に追加します。

```yaml
SMTP_PASSWORD: ${SMTP_PASSWORD:?set SMTP_PASSWORD in .env}
AUTH_EMAIL_PASSWORD: ${AUTH_EMAIL_PASSWORD:?set AUTH_EMAIL_PASSWORD in .env}
```

Compose の `.env` は、変数を自動でコンテナに渡しません。Compose 内で明示してください。`config.yml` 内の `${NAME}` も展開されません。

変更後は Studio コンテナを再作成します。

```bash
docker compose up -d --force-recreate studio
```

## 送信を確認する

1. 自分で管理し、まだ登録していないテスト用メールアドレスに招待します。メールが届き、正しい Studio が開くことを確認します。
2. サインアウトし、既存アカウントのパスワード再設定を依頼します。
3. メールのリンクから新しいパスワードを設定し、サインインを確認します。

リクエストの送信だけでは配信成功を確認できません。送信元の認可、SMTP 接続、迷惑メール、Studio のログを調べてください。パスワードや再設定リンクを公開ログに残さないでください。

## 旧設定から移行する

- 通知チャネルには `type: smtp` を使います。旧 `provider: smtp` は互換用の別名です。
- 再設定メールは `auth.email` に設定し、`auth.passwordReset.emailChannel` は削除します。後者は互換用にのみ残っています。
- 招待用の `notification.channels.system-email` は残します。`SMTP_PASSWORD` と `AUTH_EMAIL_PASSWORD` は、それぞれの送信元を独立して設定します。

## プッシュ通知

以下が必要です。

- HTTPS で公開した Studio と、その公開アドレスを指定した `APP_PUBLIC_ORIGIN`。LAN 内の `http://` アドレスでは使えません。
- 長期保存する 32 バイトの P-256 秘密鍵。base64url または 64 桁の 16 進数で `push.privateKey` か `WEB_PUSH_PRIVATE_KEY` に設定します。`push.contact` には `mailto:admin@example.com` などの連絡先を指定します。

秘密鍵がない場合、メンバーはプッシュ通知を購読できません。

> [!WARNING] プッシュ用キーを保管する
> 秘密鍵を変更すると、すべての端末で再購読が必要です。`SECRETS_KEYS` と一緒に安全に保管・バックアップし、リポジトリにはコミットしないでください。

![メンバーの通知設定](https://static-docs.nocobase.com/studio-en-guide-preferences-20261031.png)
