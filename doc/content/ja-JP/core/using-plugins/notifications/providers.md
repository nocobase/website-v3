---
title: "通知チャネル"
description: "SMTP、Resend、Feishu、DingTalk の通知チャネルを設定します。"
---

## 機能

`@nocobase/app-plugin-notification-providers` は、[通知](notification.md) に SMTP、Resend、Feishu、DingTalk のチャネルを追加します。Server のランタイムの入口だけを持ち、設定のページや個人のメールボックスの画面はありません。

### チャネルの種類

| `type` | 用途 | メッセージ |
| --- | --- | --- |
| `smtp` | SMTP のメール | メールの受信者、件名、テキストまたは HTML |
| `resend` | Resend のメール | メールの受信者、件名、テキストまたは HTML |
| `feishu-webhook` | Feishu のボット | テキストと、任意の完全な HTTP(S) の移動先の URL |
| `dingtalk-webhook` | DingTalk のボット | テキストと、任意の完全な HTTP(S) の移動先の URL |

複数のチャネルが、それぞれ独立した認証情報で同じ種類を共有できます。`type` を優先してください。古い別名の `provider` を両方指定する場合は、一致している必要があります。

## シナリオと例

### 例：業務の通知と運用のアラートを分ける

`system-email` と `ops-feishu` を設定し、`notification.send()` でそれらの名前の下に完全なメッセージを用意します。

メールはアドレスまたはアドレスの配列を受け付けます。Webhook では、設定が宛先を決めるため `to` は拒否されます。プラグインはユーザー ID をアドレスに解決しません。Feishu と DingTalk には公式の HTTPS の Webhook のホストが必要で、リダイレクトはたどりません。

**開発用のプロンプト**（アプリのディレクトリで作業するコーディングエージェント向け）：

```text
Notification Providers を使って、業務のメールと運用の Feishu のアラートを分けてください。
サーバーの非公開の認証情報と明示的な環境変数の対応付けで、system-email と ops-feishu を
設定してください。メールの受信者を指定し、ボットの宛先は to なしで Webhook の設定に任せてください。
制御した受信者とテスト用のグループで、配信と失敗を検証してください。
個人のメールボックスの画面は追加しないでください。
```

**完了の条件**：テストのメールとアラートがそれぞれ別の宛先に届き、認証情報の失敗がログに表示されること。

## 主な仕組みと実装

以下は、この例での組み込みの領域と、想定される画面の変化です。開発作業を記述したもので、実際のファイル構成はアプリに合わせてください。

| 組み込みの領域 | コードまたは設定の変更 | 画面と動作の変化 |
| --- | --- | --- |
| サーバーのプラグインと通知の設定 | Server のプロバイダーと名前付きのインスタンスを登録する | ページを追加せずに送信の手段を有効にする |
| 設定のファクトリーと非公開の環境 | SMTP や Webhook の認証情報を明示的に対応付ける | 名前が実際の認証情報のパスと一致する |
| 業務のメッセージの組み立て | チャネルごとにメールやボットのペイロードを組み立てる | 各メッセージが意図した宛先に届く |

### チャネルを設定する

通知の Server プラグインのあとに登録し、名前付きのチャネルを追加します。

```yaml
notification:
  channels:
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      from: notifications@example.com
```

これは構造を示すだけです。実際の認証は、サーバーの非公開の設定で提供してください。YAML は `${...}` を展開しません。テンプレートの `defineMailChannelsConfig` は `SMTP_PASSWORD` を `channels.system-email.auth.pass` に対応付けます。ほかの名前や認証情報のパスには、明示的な環境変数の対応付けが必要です。

## AI 開発の制約と検証

### プラグイン固有の開発の制約

- チャネルの名前と type を区別してください。YAML は環境変数のプレースホルダーを認証情報に展開しません。
- テストを通すために無効にするのではなく、公式の Webhook のホストとリダイレクトの検証を保ってください。
- 制御したテスト用の宛先を使い、認証の失敗、受信者の形式、配信のログを確認してください。

### 検証と拡張

業務の流れか信頼できるサーバーの呼び出しで送信し、[通知のログ](notification.md) を調べます。設定に成功しても、配信に成功したことにはなりません。

追加の実装には `ChannelInstance` と `registry.registerChannelType()` を使います。[アプリ内通知](in-app.md) と [Web プッシュ](web-push.md) は別のプラグインで提供されます。個人のメールボックスを接続するには [メール](mail.md) を使います。

これらはあなたの組み込みの検収の要件であり、実機での検証が完了したことを示すものではありません。実際の変更、実行したチェック、未検証の項目をエージェントに報告させてください。プロジェクトのガイダンス、スキル、共通のチェックについては [アプリの開発を続ける](../../getting-started/develop-with-an-agent.md) と [テストと検収](../../developing-apps/testing-and-acceptance.md) を参照してください。

出典：[公開のプラグインの入口と実装](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-providers)。
