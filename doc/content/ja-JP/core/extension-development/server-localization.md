---
title: サーバーの多言語化
description: プラグインの Server のリソースを宣言し、リクエストとバックグラウンドジョブで正しい名前空間と言語を使います。
---

プラグインは、Server の文言を `server/locales/` で管理し、`server/plugin.ts` の `locales` で提供します。Client のページは別の [Client のリソース](localization.md) を使います。Client のプラグインを登録しても、Server のリソースは登録されません。

## エージェントを使う場合

```text
このプラグインの API のフィードバックとバックグラウンドのメッセージに、Server の翻訳を追加してください。
安定したエラーコードは保ち、プラグインのパッケージの完全な名前空間を明示的に指定してください。
リクエストは現在の言語で、バックグラウンドのメッセージは受信者ごとの言語で翻訳してください。
対応しているリソースをそろえ、対象のアプリで、2 つのリクエストの言語と、
好みの言語が異なる受信者へのメッセージを確認してください。
```

## Server のリソースを宣言する

プラグインの作成時に `server.locales` を選びます。既存のプラグインでは、その実装を保ったまま、リソース、ローダー、Server の宣言を追加します。以下のパスはプラグインのルートからの相対パスです。

```text
server/
├── locales/
│   ├── en-US.ts
│   ├── zh-CN.ts
│   ├── …
│   └── index.ts
└── plugin.ts
```

英語がキーの構造を定義し、ほかの言語は完全なリソースの型を使います。ローダーは各言語を動的にインポートします。[英語でキーを定義する](localization.md#英語でキーを定義する) の規約を再利用し、ファイルは `server/locales/` に置き、Server が所有するリソースの型を使います。Client のリソースはインポートしないでください。

`server/plugin.ts` の `packageName`、`baseDir`、既存の提供内容は保ちます。`server/locales/index.ts` がエクスポートするローダーのコレクションを `locales` に割り当てます。ファイルを追加するだけでは登録されません。アプリが Server の入口も登録する必要があります。[プラグインの宣言と公開のエクスポート](plugin-declarations.md#server) を参照してください。

<span id="server-copy-has-separate-resources"></span>

## リクエストの文言を翻訳する

以下は、Server の入口とリソースが登録済みであることを前提としています。リクエストの組み込みについては [ルートと HTTP の API](server-apis.md) を、バックグラウンドの入口については [バックグラウンドジョブとエグゼキューター](background-jobs.md) を参照してください。

たとえば、すべての Server の言語に `messages.ready` を追加し、アプリにマウントされたリクエストのハンドラーで使います。

```ts
import { getRequestTranslator } from '@nocobase/i18n/server';

// Inside a handler mounted by the App, with the plugin's Server locales registered:
const t = getRequestTranslator(context, '@nocobase/app-plugin-notice-i18n');
return context.json({ data: { message: t('messages.ready') } });
```

アプリは、リクエストの言語を、セッションの好みの設定、`Accept-Language`、その既定値から決めます。Hono はソースの所有関係からプラグインの名前空間を推測しないため、パッケージ名を指定してください。

プログラムでの判定には安定した `ApiError.reason` を保ち、翻訳したユーザー向けの文言は `localizedMessage` で渡します。翻訳した文はエラーコードではありません。

ジョブ、メール、通知には現在のリクエストがありません。受信者のロケールを選び、`i18n.ensureLocaleLoaded(locale)` を呼び出してから、`i18n.getFixedT(namespace, locale)` を呼び出します。始めたユーザーの言語を、すべての受信者に使い回さないでください。

## 組み込みを確認する

実際の Server のプラグインを登録したテスト用のアプリを使います。同じエンドポイントを、対応している異なる言語でリクエストし、エラーコードとレスポンスの構造が変わらないまま、文言が翻訳されることを確認します。アプリへの組み込みとリクエストの言語の例については、[サーバーの多言語化](../developing-apps/server-localization.md) を参照してください。

好みの言語が異なる受信者に対してバックグラウンドジョブを実行し、メッセージの生成前にリソースが読み込まれることを確認します。変更可能な「現在の言語」のフィールドを、リクエストやジョブの間で共有しないでください。

プラグインの型チェック、関連する Server のテスト、アプリのビルドを実行します。リソースの型で確認できるのはキーがそろっていることだけです。Server の登録、実際のリクエスト、エラーのフィードバック、バックグラウンドのメッセージは、対象のアプリで確認してください。アプリの言語の設定とモジュールの上書きについては、[アプリのサーバーの多言語化](../developing-apps/server-localization.md) で説明しています。
