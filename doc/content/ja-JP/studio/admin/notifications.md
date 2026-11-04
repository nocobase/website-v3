---
title: "通知とプッシュ"
description: "招待メール、パスワード再設定メール、端末へのプッシュ通知を設定します。"
---

Studio の通知には 3 種類あります。

| 通知 | 必要な設定 | 用途 |
| --- | --- | --- |
| アプリ内の通知 | なし | 受信トレイ、My issues の件数、通知音、デスクトップ通知 |
| メール | `mailers` の送信サービス | 招待、パスワード再設定 |
| プッシュ通知 | HTTPS とプッシュ用キー | Studio を開いていない端末への通知 |

メンバーによる通知音、デスクトップ通知、携帯端末のプッシュ購読は[受信トレイと通知](../use/inbox.md)を参照してください。

## 招待メール

招待とパスワード再設定は、`mailers` の既定の送信サービスを共有します。以下の SMTP 設定を `config.yml` の対応する項目に統合します。

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
    from: "Studio <notifications@example.com>"
```

パスワードは、後述の `MAILERS_SYSTEM_PASSWORD` で渡します。送信元アドレスをメールサービスで認可し、指定のポートと TLS 設定を使ってください。

Resend を使う場合は、`mailers.system` を `provider: resend` と `from` に置き換え、SMTP の項目を削除します。`.env` と Compose の両方で `MAILERS_SYSTEM_API_KEY` を設定し、API キーを渡します。

招待は `mailers.default` を使います。別の設定済みサービスを使う場合は、その名前を `users.invitations.mailer` に指定します。メール未設定でも、管理者は招待リンクをコピーして共有できます。[メンバーを招待する](../setup/invite.md)を参照してください。

## パスワード再設定メール

パスワード再設定も `mailers.default` を使います。パスワードでのサインインと再設定を有効にします。

```yaml
auth:
  emailAndPassword:
    enabled: true
    autoSignIn: false
    disableSignUp: true
  passwordReset:
    enabled: true
```

`APP_PUBLIC_ORIGIN` に `https://studio.example.com` など、メンバーがアクセスできる Studio の URL を設定します。再設定に別の設定済みサービスを使う場合は、その名前を `auth.email.mailer` に指定します。

## シークレットを渡して設定を反映する

デプロイ先の `.env` に追加します。

```dotenv
MAILERS_SYSTEM_PASSWORD=<smtp-password>
```

`docker-compose.yml` の `services.studio.environment` に追加します。

```yaml
MAILERS_SYSTEM_PASSWORD: ${MAILERS_SYSTEM_PASSWORD:?set MAILERS_SYSTEM_PASSWORD in .env}
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

## プッシュ通知

以下が必要です。

- HTTPS で公開した Studio と、その公開アドレスを指定した `APP_PUBLIC_ORIGIN`。LAN 内の `http://` アドレスでは使えません。
- 長期保存する 32 バイトの P-256 秘密鍵。base64url または 64 桁の 16 進数で `push.privateKey` か `WEB_PUSH_PRIVATE_KEY` に設定します。`push.contact` には `mailto:admin@example.com` などの連絡先を指定します。

秘密鍵がない場合、メンバーはプッシュ通知を購読できません。

> [!WARNING] プッシュ用キーを保管する
> 秘密鍵を変更すると、すべての端末で再購読が必要です。`SECRETS_KEYS` と一緒に安全に保管・バックアップし、リポジトリにはコミットしないでください。

![メンバーの通知設定](https://static-docs.nocobase.com/studio-en-guide-preferences-20261031.png)
