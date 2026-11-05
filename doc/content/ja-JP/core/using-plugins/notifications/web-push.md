---
title: "Web プッシュ"
description: "ブラウザーの購読、デバイスの設定、Web Push の配信を設定します。"
---

## 機能

`@nocobase/app-plugin-notification-web-push` は、ブラウザーのデバイスへの配信、VAPID の設定、購読、Service Worker、再利用できる設定の画面を追加します。配信と再試行は [通知](notification.md) が担います。

プラグインはデバイスとプッシュの機能を提供し、設定、インストールのマニフェスト、業務のきっかけはアプリが用意します。

## シナリオと例

### 例：注文のリマインダー

`webPushServiceToken.subscriptions.forUser(userId)` でデバイスを解決し、通知のメッセージを送ります。

```ts
messages: {
  webPush: {
    to: [{ id: deviceId, userId }],
    title: 'Order needs attention',
    body: 'Open the order for details.',
    url: '/main/orders/123',
    dedupeKey: 'order:123:pending',
  },
}
```

これは `notification.send()` の一部で、実際のデバイスとユーザーの ID を使います。受信トレイのルートの移動先とは異なり、プッシュの `url` には公開のアプリの接頭辞が含まれ、その範囲内にとどまる必要があります。

**開発用のプロンプト**（アプリのディレクトリで作業するコーディングエージェント向け）：

```text
Web Push を使って、サインインしたデバイスの設定と注文のリマインダーを追加してください。
PushPreferences を再利用し、VAPID と暗号化のキーを永続化し、Service Worker をアプリの
接頭辞の下で提供してください。ユーザーごとにデバイスを解決し、移動先にはマウントの接頭辞を含め、
サインアウト時の購読解除の失敗を扱ってください。購読、一時停止、期限切れ、拒否と、
テスト用のデバイスでの実際の受信をテストし、利用できない環境は報告してください。
```

**完了の条件**：購読したテスト用のデバイスにリマインダーが表示され、正しい注文が開き、一時停止したデバイスには届かなくなること。

## 主な仕組みと実装

以下は、この例での組み込みの領域と、想定される画面の変化です。開発作業を記述したもので、実際のファイル構成はアプリに合わせてください。

| 組み込みの領域 | コードまたは設定の変更 | 画面と動作の変化 |
| --- | --- | --- |
| プッシュの設定と通知チャネル | pushConfig、永続的なキー、web-push のチャネルを組み込む | ブラウザーの購読を有効にする |
| 個人の設定とサインアウト | PushPreferences と unsubscribeDevice を組み込む | デバイスを管理し、アカウントとの結び付きを扱う |
| 注文のメッセージ | デバイスの概要と、接頭辞付きの内部の URL を使う | システムの通知からアプリの注文が開く |

### 組み込み

1. Server プラグインを Authentication、Authorization、Notifications のあとに登録し、Client を登録してマイグレーションを適用します。
2. `/server` の `pushConfig` を、アプリの `push` の設定の下に組み込みます。
3. 永続的な `push.privateKey` / `WEB_PUSH_PRIVATE_KEY`、`push.contact` / `WEB_PUSH_CONTACT`、購読の暗号化用の `SECRETS_KEYS` を設定します。
4. `notification.channels.webPush: { type: 'web-push' }` を設定します。
5. ホストの API、ロケール、トースト、クエリーのコンテキストを持つ認証済みのページの中に、`/client` の `PushPreferences` をマウントします。

本番では HTTPS を使います。開発では localhost も使えます。VAPID のキーを生成し直すと、ブラウザーは購読し直す必要があります。Service Worker は、アプリのマウント先の下の `/push-worker.js` で提供されます。

### デバイスの設定

ユーザーは、デバイスの購読、一時停止、再開、テスト、削除を行います。インストールのマニフェストはアプリが用意し、iOS/iPadOS ではホーム画面へのインストールが必要です。

`/api/webPush` は `/key`、`/subscriptions`、`/subscriptions/:id/test` を公開します。レスポンスには所有するデバイスの概要が含まれ、購読のエンドポイントやキーは含まれません。サインアウトに `unsubscribeDevice(api, base, userId)` を組み込み、サインアウトを完了する前に失敗を処理します。

## AI 開発の制約と検証

### プラグイン固有の開発の制約

- 起動時に VAPID のキーを生成し直したり、デバイスの API で購読のエンドポイントや暗号化のキーを公開したりしないでください。
- マウントの接頭辞付きの内部の URL を使ってください。dedupeKey は表示中の通知を置き換えるもので、イベントの冪等性ではありません。
- 拒否された権限、一時停止したデバイスと期限切れのデバイス、実際の表示をテストしてください。キューで成功しても、ブラウザーが受信した証明にはなりません。

### 検証と境界

権限がない場合、購読がないか一時停止している場合、期限切れのデバイス、実際のブラウザーでの受信をテストします。キューに入ったテストは、表示されたことの証明にはなりません。HTTP 404/410 は無効な購読を削除し、それ以外の結果は通知の再試行のルールに従います。

`dedupeKey` は同じタグを持つ表示中の通知を置き換えるもので、業務の冪等性の代わりにはなりません。大きすぎるペイロードは拒否されます。プラグインは、オフラインのキャッシュや、アプリ固有のフォアグラウンドのリマインダーの調整を提供しません。

関連：[通知](notification.md)、[アプリ内通知](in-app.md)、[プラグインを管理する](../../developing-apps/manage-plugins.md)。

これらはあなたの組み込みの検収の要件であり、実機での検証が完了したことを示すものではありません。実際の変更、実行したチェック、未検証の項目をエージェントに報告させてください。プロジェクトのガイダンス、スキル、共通のチェックについては [アプリの開発を続ける](../../../getting-started/develop-your-first-app.md#改善して開発を続ける) と [テスト](../../developing-apps/testing-and-acceptance.md) を参照してください。

出典：[公開のプラグインの入口と実装](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-web-push)。
