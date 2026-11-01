---
title: データベースの概要
---

`@nocobase/db` は、論理モデル、データアクセス、スキーマの進化、トランザクションを提供します。ダイアレクトのパッケージが特定のデータベースに接続し、アプリのランタイムが設定、リソースの発見、ライフサイクルを担います。

## 入口を選ぶ

| 入口 | 役割 |
| --- | --- |
| DatabaseManager / Connection | 名前付き・既定の接続、破棄、トランザクション |
| CollectionBuilder | テーブル、フィールド、リレーションのメタデータ、インデックス、スキーマの変更 |
| Repository | 論理モデルへのアクセス、リレーション、コーデック、ポリシー |
| Query | テーブル指向の照会、集合単位の埋め戻し、専用のレポート |
| Collections / SchemaInspector | 論理的な解決と物理的な調査 |
| Migrator / Seeder | 追跡されるスキーマの履歴と初期データ |

業務コードは通常 Repository から始めます。マイグレーションでは、スキーマには Builder を、集合単位の埋め戻しには Query を使います。ドライバー固有の機能が、自動的に移植可能な公開 API になるわけではありません。

## アプリのデータベースを使う

```ts
import { databaseManagerToken } from '@nocobase/db';

// Inside a server route factory or ServiceProvider:
const database = app.container.resolve(databaseManagerToken);
const orders = database.repository('orders');
```

設定済みのサービスを再利用します。独立したスクリプトやテストではマネージャーを作成できますが、終わったら破棄する必要があります。[接続とダイアレクト](connections.md) を参照してください。

## アプリとプラグインの組み込みの境界

アプリは接続を設定し、リソースを `database/<connection>/migrations/` と `seeds/` に置きます。プラグインは通常 `database/migrations/` と `seeds/` を提供し、`server/plugin.ts` でリソースのパスを宣言して、ホストが発見して実行できるようにします。どちらも `defineMigration()`、`defineSeed()` とそのコンテキストを使い、リソースの場所によってデータベースの意味が変わることはありません。

業務サービスはホストの `DatabaseManager` を再利用し、必要に応じて名前付きの接続を明示的に選びます。プラグインは、リクエストごとに接続を作成したり、自分の終了時に共有のマネージャーを破棄したりしてはいけません。接続をまたぐ照会とトランザクションの境界は、明示的に設計してください。トランザクションが自動ですべてのデータベースにまたがることはありません。データベースの操作はサーバーで実行され、クライアントは API を使います。

実装の手順については、[テーブルと初期データ](../../developing-apps/data-models-and-migrations.md)、[複数のデータベース接続](../../developing-apps/multiple-databases.md)、[プラグインのデータベースのリソース](../../extension-development/database-and-migrations.md) を参照してください。この章では、モデル、操作、トランザクション、リソースの実行の仕組みを説明します。

## 論理モデルと物理モデル

コレクションは、物理的なスキーマと補足のメタデータを組み合わせます。論理名は物理名と異なることがあります。Repository は論理的な対応を理解します。Query は物理的なテーブル名と列名を扱い、コレクションのフィールドの対応やテーブルの接頭辞は読まないため、埋め戻しでは対象を明示的に指定する必要があります。

リレーションのメタデータとタイトルは、物理的な制約の代わりにはなりません。生成された `database/<connection>/collections/` のファイルはスナップショットで、スキーマの変更は引き続きマイグレーションで行います。

## この章の例

例では、`id`、`orderNo`、`title`、`status`、`amount`、`customerId` を持つ `orders` を使います。[テーブルとフィールド](schema.md) で基本のモデルを作成し、[リレーション](relations.md) で顧客と両方向のリレーションを追加します。照会は、既存のモデルと、呼び出し元が認可を済ませたサーバー側のコードを前提にしています。

## 権限と進化

データベースのサービスは HTTP の身元を推測しません。認可から得たポリシーを Repository に結び付けてください。ユーザーのフィルターは、アクセス制御の代わりにはなりません。

スキーマ、データアクセス、リレーション、トランザクション、マイグレーションの順に読み進めてください。シグネチャーについては [データベースの API 索引](../../reference/api.md) を、ダイアレクトの条件については [互換性](../../reference/compatibility.md) を参照してください。

## インターフェースと実装

- [データベースの概念](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/overview.md)
- [データベースの API](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/README.md)
