---
title: 既存のデータベースを接続する
description: 外部で管理されているスキーマに接続し、メタデータとリレーションを補い、命名とアクセス権限を確認します。
---

CRM や ERP など、別のシステムがスキーマを所有している場合は、`schemaManagement: 'external'` で接続します。フレームワークは既存の構造を読み取り、アプリが管理するメタデータを重ねます。この接続では、マイグレーション、シード、Builder の DDL は実行されません。

`external` はスキーマの所有者を定めるもので、読み取り専用の権限ではありません。レコードへのアクセスは、引き続きデータベースの認証情報とアプリの認可に依存します。このガイドは Examples テンプレートの `externalCrm` の構成に沿っています。

## 既存のスキーマを確認する

テーブル、列、主キー、業務上の意味を、データベースの所有者と確認します。この例では、次の物理オブジェクトがすでに存在するものとします。

- `crm_customers`：`id`、`display_name`、`email`。
- `crm_orders`：`id`、`order_no`、`customer_id`。`customer_id` は顧客の ID を参照します。

メタデータのファイルでこれらのテーブルを作成することはできません。Examples テンプレートの `ExternalCrmProvider` はローカルの SQLite のデモ用データベースを用意するだけで、実際の外部システムでの通常のスキーマ作成の手順ではありません。

## 外部の接続を設定する

`server/config/database.ts` のファクトリーの `connections` に、既存の接続を残したまま次の接続のエントリーをマージします。

```ts
externalCrm: {
  dialect: 'sqlite',
  filename: paths.storage('external-crm.sqlite'),
  schemaManagement: 'external',
  naming: { underscored: true, tablePrefix: 'crm_' },
},
```

`paths` は既存の設定ファクトリーから来ています。SQLite はローカルの例です。実際のシステムに合ったダイアレクトをインストールし、実際の接続パラメーターを使ってください。認証情報はソース管理ではなく、アプリの環境設定に置きます。

`tablePrefix: 'crm_'` と `underscored: true` により、`crm_orders` はコレクション `orders` に、`customer_id` はフィールド `customerId` に対応します。メタデータと Repository はこれらの論理名を使います。照会を書く前に対応を確認してください。

## メタデータを追加する

アプリのランタイムでは、外部の接続のメタデータは既定で `database/<connection>/metadata/` に置かれるため、この例ではメタデータの保存先を明示する必要はありません。単独の `@nocobase/db` スクリプトでは明示的に設定する必要があります。[接続、設定、ダイアレクト](../framework/database/connections.md) を参照してください。

`database/externalCrm/metadata/customers.json` を作成します。

```json
{
  "version": 1,
  "name": "customers",
  "title": "CRM customers",
  "fields": {
    "displayName": {
      "title": "Display name"
    },
    "email": {
      "title": "Email address"
    }
  }
}
```

`database/externalCrm/metadata/orders.json` を作成します。

```json
{
  "version": 1,
  "name": "orders",
  "title": "CRM orders",
  "fields": {
    "orderNo": {
      "title": "Order number"
    }
  },
  "relations": {
    "customer": {
      "type": "belongsTo",
      "target": "customers",
      "foreignKey": "customerId",
      "targetKey": "id",
      "title": "Customer"
    }
  }
}
```

タイトルと説明は、スキーマにない情報を補います。`customer` リレーションは既存のフィールドを記述するもので、列や外部キーを作成したり、過去のレコードを修復したりはしません。`foreignKey` と `targetKey` は、スキーマの論理名に合わせます。

これらの手書きの JSON ファイルは、コミットするソースのアセットです。生成された `collections/<collection>/metadata.json` の成果物を入力に使ったり、設定を残すために生成されたファイルを編集したりしないでください。

## コレクションの情報を更新する

```bash
pnpm nocobase collections generate --connection externalCrm
pnpm nocobase collections generate --connection externalCrm --check
```

`database/externalCrm/collections/` 以下に生成される成果物は、物理的なスキーマとメタデータを組み合わせたものです。変更後に生成し直し、論理名、フィールド、リレーションを確認します。動作中のアプリも再読み込みしてください。JSON を編集しても、すべてのキャッシュが自動で更新されるとは限りません。

外部の所有者がスキーマを変更したら、もう一度確認します。足りないフィールドは、外部の接続にアプリのマイグレーションを追加するのではなく、その所有者と解決してください。

## 業務サービスから照会する

この関数には、選んだ注文のフィールドと顧客のリレーションのフィールドを許可する、認可から得たポリシーが必要です。

```ts
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export async function listCrmOrders(
  database: DatabaseManager,
  policy: RepositoryPolicy,
) {
  return database.connection('externalCrm').repository('orders')
    .withPolicy(policy)
    .findMany({
      select: (s) => s.fields('id', 'orderNo')
        .include('customer', (customer) => customer.fields('id', 'displayName')),
      sort: (s) => [s.field('id').asc()],
      limit: 20,
    });
}
```

読み取り専用のアクセスにするには、データベースの認証情報と、公開するアプリの操作の両方を制限します。`include()` はリレーションへのアクセスを付与しません。注文と顧客で別々の業務上の範囲が必要な場合は、別々のポリシーで照会します。[データの照会と操作](querying-data.md) を参照してください。

HTTP で公開するには、[HTTP ルートと API](apis-and-services.md) に従い、Repository API の宣言で `connection: 'externalCrm'`、操作、ポリシーを明示的に設定します。接続やメタデータのファイルだけでは、エンドポイントは自動で公開されません。

## 確認する

物理名と論理名の対応を確認し、実際のフィールドとリレーションを照会します。リレーション先がない場合や、外部で削除されたレコードをテストし、意図した書き込みの制限を実際の認証情報で確認します。Builder の DDL が拒否され、この接続でアプリのマイグレーションやシードが実行されないことを確認します。低レベルのクライアントでスキーマの所有権を回避しないでください。

SQLite は流れを示すだけです。デプロイの前に、対象のデータベースで型、主キー、アクセス、スキーマの変更を検証してください。トランザクションの範囲については [複数のデータベース接続](multiple-databases.md) を参照してください。
