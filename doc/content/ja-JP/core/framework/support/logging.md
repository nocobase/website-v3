---
title: ログ
---

`@nocobase/logging` は、構造化された記録、取得元のラベル、出力先、ローテーションを提供します。アプリでは `@nocobase/app-server/logging` から `loggingToken` を解決します。

## 業務のコンテキスト

```ts
import { loggingToken } from '@nocobase/app-server/logging';
import type { ServiceResolver } from '@nocobase/service-provider';

export function orderLogger(container: ServiceResolver) {
  return container.resolve(loggingToken).getLogger('@example/orders');
}
```

返されたロガーを使います。たとえば `logger.info({ orderId }, 'Order submitted')` や `logger.error({ err: error, orderId }, 'Order submission failed')` です。すべてを文字列に埋め込むのではなく、検索できるフィールドをオブジェクトに入れます。

`getLogger(source)` に渡す取得元は `logger` フィールドになり、別のファイルを自動で選ぶわけではありません。引数なしの取得元は通常 `system` で、既定のファイル名の語幹は `app` のままです。

## アプリとプラグインで共有するログ

アプリやプラグインの Provider から `app.container` を `orderLogger()` に渡し、ロガーを業務サービスに注入します。`logger` フィールドで絞り込めるよう、固定のパッケージ名やモジュール名を使います。出力先、レベル、ローテーションはアプリが管理します。プラグインは、共有のログのサービスを設定し直したり閉じたりしません。

リクエスト、ジョブ、スケジュールでは、コンテキストが異なることがあります。必要に応じて業務の ID と相関 ID を明示的に渡してください。HTTP のコンテキストがバックグラウンドの作業に自動で付いていくことはありません。業務のテストでは、記録するロガーを代わりに注入して、フィールドとエラーの経路を確認できます。ファイルのローテーションは、出力の統合テストで確認します。

## 出力先

```yaml
logging:
  level: info
  file:
    enabled: true
    name: app
    retentionDays: 7
    maxFileSizeMB: 10
    maxTotalSizeMB: 500
  console:
    enabled: true
    pretty: false
  loggers:
    request:
      file:
        name: request
```

ファイルは常に JSON Lines です。`console.pretty` が影響するのはターミナルだけです。アプリのログは永続的な `storage/logs/` に置かれ、取得元の名前でディレクトリは変わりません。この例では、リクエストの記録を専用のファイルに振り分け、ほかの取得元は app のファイルを共有します。

ファイルは UTC の日付の境界と、セグメントの上限でローテーションします。保持日数と合計サイズの予算は、ディレクトリ内のログファイルが対象です。各ディレクトリは 1 つのプロセスが所有すべきで、ローテーションの状態はプロセス間で調整されません。ホストされたアプリでは、App Host の出力の方針と身元の結び付けが優先されます。

## 診断とデータの扱い

リクエストからタスクまでを追跡できるよう、相関 ID、業務レコードの ID、取得元、エラーのオブジェクトを残します。起動の詳細やリクエストの開始の情報には一時的に debug を使い、そのあとで適切なレベルに戻します。

パスワード、Cookie、トークン、個人のレコード全体、ファイルの内容を意図的にログに記録しないでください。組み込みの伏せ字の処理は、フィールドの慎重な選択の代わりにはなりません。診断のログには保持の方針が必要で、永続的な業務の監査記録の代わりにはなりません。

ホストは終了時に後片付けを待ちます。単独で使う場合は、ライフサイクルを自分で担います。デプロイ時はログのディレクトリを残し、ディスクの使用量を監視してください。

## インターフェースと実装

- [ログの設定と保証](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/logging/README.md)
- [ホストのサービスの取り決め](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/logging/token.ts)
