---
title: 通知とプッシュ
description: 招待メール、パスワードの再設定、ページを離れている間のリマインダーが依存する、メールとプッシュ通知を設定します。アプリ内のリマインダーは設定不要です。
---

Studio は 3 つの方法で人に知らせます。

| リマインダー | 必要な設定 | 用途 |
| --- | --- | --- |
| アプリ内のリマインダー | なし | 受信トレイ、**My issues** の件数、音によるリマインダー、デスクトップ通知 |
| メール | 通知チャネルと認証用の送信設定 | 招待とパスワードの再設定 |
| プッシュ通知 | HTTPS とプッシュ用のキー | Studio を開いていなくても、スマートフォンや PC に届くリマインダー |

メンバーが音によるリマインダーとデスクトップ通知をオンにし、スマートフォンでプッシュ通知を登録する方法については、[受信トレイとリマインダー](../use/inbox.md) を参照してください。

## 招待メール

招待には、既定で `system-email` という名前の通知チャネルを使います。次の内容を `config.yml` の対応するノードにマージします。

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

パスワードは、下に示すように `SMTP_PASSWORD` で渡します。送信元アドレスをメールプロバイダーで認可し、プロバイダーが求めるポートと TLS の設定を使ってください。

Resend を使う場合は、`system-email` チャネル全体を `type: resend` と `from` に置き換えます。`RESEND_API_KEY` を渡し、SMTP のフィールドは削除します。

メールを設定しない場合、管理者は招待リンクをコピーして共有できます。[メンバーを招待する](../setup/invite.md) を参照してください。

## パスワード再設定メール

パスワードの再設定には、独立した `auth.email` の送信設定を使います。招待と同じ SMTP アカウントを使えますが、2 つの送信設定はそれぞれ設定してください。

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

パスワードは `AUTH_EMAIL_PASSWORD` で渡します。メール内のリンクが Studio インスタンスに届くよう、`APP_PUBLIC_ORIGIN` を設定します。たとえば `https://studio.example.com` です。

Resend を使う場合は、`auth.email` オブジェクト全体を `provider: resend` と `from` に置き換えます。`AUTH_EMAIL_API_KEY` を渡し、SMTP のフィールドは削除します。

組み込みの再設定機能には、パスワードによるサインイン、`auth.passwordReset.enabled: true`、有効な送信設定が必要です。

## シークレットを渡して設定を反映する

デプロイの `.env` に追加します。

```dotenv
SMTP_PASSWORD=<invitation-email-smtp-password>
AUTH_EMAIL_PASSWORD=<password-reset-smtp-password>
```

`docker-compose.yml` の `services.studio.environment` に、次のエントリを追加します。

```yaml
SMTP_PASSWORD: ${SMTP_PASSWORD:?set SMTP_PASSWORD in .env}
AUTH_EMAIL_PASSWORD: ${AUTH_EMAIL_PASSWORD:?set AUTH_EMAIL_PASSWORD in .env}
```

Compose の `.env` は、変数を自動ではコンテナに渡しません。Compose で宣言してください。`config.yml` 内の `${NAME}` も展開されません。

変更したら、Studio のコンテナを作り直します。

```bash
docker compose up -d --force-recreate studio
```

## 配信を確認する

1. 自分が管理する、まだ登録していないテスト用のメールボックスに招待を送ります。メールが届き、リンクが正しい Studio インスタンスを開くことを確認します。
2. サインアウトし、既存のアカウントでパスワードの再設定をリクエストします。
3. メールのリンクから新しいパスワードを設定し、サインインできることを確認します。

リクエストを送信できても、配信されたとは限りません。送信元の認可、SMTP の接続、迷惑メールフォルダー、Studio のログを確認してください。パスワードと再設定用のリンクは公開のログに残さないでください。

## 旧設定から移行する

- 通知チャネルは `type: smtp` を使います。以前の `provider: smtp` は互換性のための別名として残っています。
- パスワード再設定の送信設定は `auth.email` に設定し、`auth.passwordReset.emailChannel` は削除します。後者は互換性のためだけに残っています。
- 招待用に `notification.channels.system-email` を残します。`SMTP_PASSWORD` と `AUTH_EMAIL_PASSWORD` で 2 つの送信設定をそれぞれ設定します。

## プッシュ通知

プッシュ通知には次のものが必要です。

- Studio が HTTPS で提供され、`APP_PUBLIC_ORIGIN` が公開アドレスに設定されていること。ローカルネットワークの `http://` アドレスでは動作しません。
- ずっと変わらないプッシュ用の秘密鍵。32 バイトの P-256 秘密鍵を base64url または 64 文字の 16 進数で、`config.yml` の `push.privateKey` か環境変数 `WEB_PUSH_PRIVATE_KEY` に設定します。`push.contact` には `mailto:admin@example.com` などの連絡先を設定します。

秘密鍵がないと、メンバーはプッシュ通知を登録できません。

> [!WARNING] プッシュ用のキーはずっと保持する
> プッシュ用の秘密鍵を変更すると、登録済みのすべてのデバイスで登録し直す必要があります。`SECRETS_KEYS` と一緒に安全な場所に保管してまとめてバックアップし、リポジトリには絶対にコミットしないでください。
