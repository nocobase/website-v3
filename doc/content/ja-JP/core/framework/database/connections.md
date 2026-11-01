---
title: 接続とデータベースのダイアレクト
---

接続は、論理的なデータベースの機能を、データベースと名前空間に結び付けます。1 つのマネージャーが、それぞれ独立したダイアレクト、トランザクション、モデルの解決を持つ複数の接続を所有できます。

## 独立した接続

```ts
import { createDatabaseManager } from '@nocobase/db';
import sqlite from '@nocobase/db-sqlite';

const db = createDatabaseManager({
  default: 'main',
  connections: { main: sqlite({ filename: ':memory:' }) },
});
try {
  await db.connect();
  const connection = db.connection('main');
  console.log(connection.dialect);
} finally {
  await db.destroy();
}
```

メモリ上の SQLite は分離したテストに向いており、閉じると消えます。本番のアプリでは、リクエストごとにプールを作成するのではなく、既存のマネージャーを解決します。

コアのマネージャーはダイアレクトのパッケージをスキャンしません。独立した利用側は、ファクトリーまたは `drivers` のレジストリーを提供します。アプリのランタイムは、マネージャーを作成する前に、設定されたインストール済みの公式のダイアレクトを非同期で読み込みます。

## アプリの設定と複数の接続

`database.default` と `database.connections.<name>` を使い、リソースは `database/<name>/` の下に置きます。`db.connection('analytics')` と `db.repository('events', 'analytics')` は名前付きの接続を選び、省略すると既定の接続を使います。

接続は分散トランザクションのコーディネーターではありません。その接続のトランザクションが、別の接続の作業をアトミックにコミットすることはありません。

## 管理対象のデータベースと外部のデータベース

`schemaManagement: managed` は、フレームワークによるスキーマの管理を許可します。`external` はフレームワークの DDL とマイグレーションを制限し、補足のメタデータを必要とします。アプリは `database/<connection>/metadata/` を管理できます。これはデータの操作を読み取り専用にするものではなく、アクセスは引き続きデータベースの認証情報と業務のポリシーで制御されます。

## ダイアレクトの違いと診断

SQLite のファイル名、ネットワークのアドレス、Oracle の serviceName、TLS、ネイティブの依存関係は、選んだダイアレクトに合わせて設定します。接続性を確認する前に、インストールされたドライバー、フィールド、環境変数の優先順位を確認してください。ダイアレクトを変えても、既存のデータが修復されたり移行されたりはしません。

`config check --no-connect` は設定だけを確認し、接続のチェックでもマイグレーションは実行されません。[設定](../../reference/configuration.md) と [データベースの対応状況](../../reference/compatibility.md) を参照してください。

アプリの接続を追加するには [複数のデータベース接続](../../developing-apps/multiple-databases.md) を、外部の設定、メタデータのファイル、更新の手順については [既存のデータベースを接続する](../../developing-apps/existing-databases.md) を参照してください。

## インターフェースと実装

- [マネージャーの作成](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/database/create-database-manager.md)
- [接続の設定](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/database/types.ts)
