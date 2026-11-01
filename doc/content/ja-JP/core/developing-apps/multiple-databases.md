---
title: 複数のデータベース接続
description: 名前付きの接続を設定し、そのマイグレーションとシードを整理し、実行時に接続を明示的に選びます。
---

アプリでは複数のデータベース接続を使えます。Examples テンプレートは、アプリのデータを `main` に保存し、分析用のデータを `analytics` に分けて保存する例を示しています。両方のスキーマをアプリが管理します。接続名は `database/<connection>/` に対応するもので、モジュールやテナントを自動で分離するものではありません。

このガイドでは、既存のアプリに管理対象の接続を追加します。別のシステムが所有するデータベースについては、[既存のデータベースを接続する](existing-databases.md) を参照してください。

## 接続の設定を追加する

`server/config/database.ts` の既存の設定を残したまま、`analytics` を追加します。この最小限の完全な例には、2 つの SQLite 接続が含まれます。

```ts
import {
  connectionEnvironment,
  defineAppDatabaseConfig,
} from '@nocobase/app-server/database';

export default defineAppDatabaseConfig(
  ({ paths }) => ({
    default: 'main',
    connections: {
      main: {
        dialect: 'sqlite',
        filename: paths.storage('database.sqlite'),
        schemaManagement: 'managed',
      },
      analytics: {
        dialect: 'sqlite',
        filename: paths.storage('analytics.sqlite'),
        schemaManagement: 'managed',
      },
    },
  }),
  { env: connectionEnvironment('main') },
);
```

2 つの名前が誤って同じデータベースを指さないよう、別々のファイルを使います。これらは既定値で、デプロイの設定で上書きされることがあります。コマンドを実行する前に、解決された対象を確認してください。既存の接続、ドライバー、環境変数の対応が異なる場合は、変更をマージします。

`connectionEnvironment('main')` は、標準の環境変数をメインの接続にだけ結び付けます。別の接続には対応を明示的に宣言してください。`DB_HOST` などの変数が自動ですべての接続を設定するわけではありません。[接続、設定、ダイアレクト](../framework/database/connections.md) と [アプリの設定（config.yml）](configuration-and-settings.md) を参照してください。

## 接続ごとにリソースを整理する

```text
database/
├── main/
│   ├── migrations/
│   └── seeds/
└── analytics/
    ├── migrations/
    └── seeds/
```

ディレクトリは接続を作成しません。名前が設定と一致している必要があります。各接続は、独自のスキーマ、レコード、実行履歴を持ちます。分析用のデータにアクセスするためだけに `database.default` を変更しないでください。接続を明示していない既存の呼び出しも、対象が変わってしまいます。

`database/analytics/migrations/202611040003_create_analytics_events.ts` を作成します。

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040003_create_analytics_events',
  async up({ builder }) {
    await builder.createCollection('events', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('name', { length: 120 }).notNull();
      collection.datetime('createdAt').notNull();
      collection.index('createdAt');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('events');
  },
});
```

この小さな `events` のモデルは、Examples テンプレートの本格的な分析機能とは独立しています。初期レコードが必要な場合は、同じ接続の下にシードを置きます。[テーブルを作成してデータを初期化する](data-models-and-migrations.md) を参照してください。

## 明示した接続に変更を適用する

```bash
pnpm nocobase db apply --connection analytics --dry-run
pnpm nocobase db apply --connection analytics
pnpm nocobase collections generate --connection analytics --check
```

Examples テンプレートは、analytics に `migrations.autoRun` と `seeds.autoRun` を設定しています。このガイドでは、自動実行に頼らず、範囲がはっきりするよう明示的なコマンドを使います。先に実際の起動時の設定を確認してください。`--all` と `--connection` は同時に使えません。一括操作の前に、すべての接続の管理モードを把握してください。[コマンドラインリファレンス](../reference/cli.md) を参照してください。

## 業務サービスで接続を選ぶ

アプリのコンテナで解決した `DatabaseManager` と、その操作の認可結果から得たポリシーを、この関数に渡します。

```ts
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export async function listAnalyticsEvents(
  database: DatabaseManager,
  policy: RepositoryPolicy,
) {
  return database.connection('analytics').repository('events')
    .withPolicy(policy)
    .findMany({
      select: (s) => s.fields('id', 'name', 'createdAt'),
      sort: (s) => [s.field('createdAt').desc(), s.field('id').desc()],
      limit: 20,
    });
}
```

`database.repository('events', 'analytics')` も接続を明示的に選びます。省略すると既定の接続が使われ、テーブル名が同じ場合は特に見落としやすくなります。リクエストごとにマネージャーや接続プールを作成しないでください。

## 接続をまたぐ場合の境界

トランザクションが対象にするのは、その接続だけです。アプリと分析の両方のデータベースを更新するには、補償処理や非同期の同期を明示的に設計する必要があります。両方の書き込みをメインのトランザクションで囲んでも、アトミックにはなりません。接続をまたぐ組み合わせを、通常のコレクションのリレーションの照会として扱わないでください。各接続を照会し、業務ルールに従って結果を組み合わせます。

別の接続でも、業務上の認可は必要です。分析用のデータだからといって権限を回避することはできません。[トランザクションとデータの整合性](transactions-and-consistency.md) を参照してください。

## 確認する

analytics のマイグレーションが main を変更しないこと、テーブル名が同じでも明示した照会が正しいレコードを選ぶこと、アクセスの拒否、空のデータベース、接続の失敗が意図どおりに動作することを確認します。マイグレーションと型は、デプロイ先のダイアレクトでテストしてください。2 つの SQLite ファイルでの確認は、すべてのデータベースとの互換性を示すものではありません。
