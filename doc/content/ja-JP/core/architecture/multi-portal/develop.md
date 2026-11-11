---
title: 業務ポータルの開発
metaDescription: 業務ポータルを作成し、生成された構成と登録を理解して、ページ、サービス、データベースを拡張します。
---

設定済みで正常に起動する[マルチポータルアプリ](create-app.md)を用意し、商用レジストリへのログインを有効にしておきます。ポータルはプラグインランタイムを使うローカルパッケージで、アプリと一緒にビルド、デプロイされます。自社の業務ポータルを先に npm へ公開する必要はありません。

## 業務ポータルの作成

Agent またはコマンドのいずれかでポータルを生成し、その後インストールして確認します。

### Agent でポータルを作成

既存のマルチポータルアプリのルートで Agent を開きます。アプリの `AGENTS.md`、`.agents/rules/multi-portal.md`、プロジェクト内のアプリ開発とプラグイン開発の Skills を使用します。グローバルの `nocobase-create-app` Skill はアプリ全体の作成用です。この作業では既存プロジェクトの指針を使います。

```prompt
このアプリに inventory という名前の「在庫管理」ポータルを追加し、まず開ける基本のホームページを用意してください。
```

プロジェクトの指針に従い、Agent がジェネレーターでソース、依存関係、Client/Server 登録を整えます。完了後、`packages/app-portal-inventory/` が存在し、アプリ再起動後の管理画面に表示されることを確認します。生成だけではインストールされません。管理者でログインして以下のインストール手順を実行します。一般ユーザーの入口と権限は[ポータルへのアクセスと権限](access.md)に従って実装します。

Agent が生成済みなら、同じディレクトリを重複して作成しないよう、以下の生成コマンドは省略します。

### コマンドでポータルを作成

アプリのルートで実行します。

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/portal@beta inventory \
  --title 'Inventory management' --title-zh '库存管理'
```

`inventory` はポータル ID です。小文字で始まり、小文字と数字を単一のハイフンで区切った形式で、40 文字以内にします。例えば `inventory` や `quality-checks` です。生成されるパッケージ名は `@nocobase/app-portal-inventory` です。

| オプション | 用途 |
| --- | --- |
| `--title` | 既定の表示名。例では `Inventory management` |
| `--title-zh` | 簡体字中国語の表示名。例では `库存管理` |
| `--dry-run --json` | ファイルを書き込まず生成計画を確認 |

`--title` を省略すると ID から表示名を生成します。`--title-zh` を省略すると簡体字中国語にも既定の表示名を使用します。

`packages/app-portal-inventory/` を生成し、依存関係をインストールして Client と Server に登録します。生成されるのは最小のポータルで、在庫テーブル、サンプルレコード、CRUD ページは含みません。アプリの起動やデータベース変更も行いません。

生成後もポータルは未インストールです。依存関係のインストールに失敗したら、生成済みソースを保持して出力された復旧手順に従います。既存ディレクトリに対して生成をやり直さないでください。

### インストールと確認

生成後、開発サービスを起動または再起動して新しい登録を読み込みます。管理者としてログインします。

1. **システム設定 → ポータル管理**を開きます。
2. 未インストールの Inventory management を探します。
3. **インストール**を選び、データベース処理と起動を待ちます。
4. インストール済みになったら直接開くか、管理者ホームのワークベンチから開きます。

最小の在庫ホームページが表示され、再読み込み後も開けることを確認します。在庫業務の機能はまだありません。以下の手順でページ、サービス、データを拡張します。インストール失敗は[ポータルの管理](manage.md)で失敗段階を確認してください。

## アプリとポータルの役割

アプリは認証、権限、実行設定、データベース接続、デプロイを担当し、共通のサイドバー、アカウントメニュー、ヘッダーを提供します。ポータルは自分の入口、レイアウト、ナビゲーション、ページ、翻訳、業務サービス、データ定義を担当します。

アプリが `PortalLayoutHost` を提供し、ポータルは `PortalLayout` でナビゲーションとコンテンツを渡します。個別のメニューはポータル側で追加します。全ポータル共通の外枠を変更するときだけ、アプリの `client/layouts/portal-shell.tsx` を編集します。

## 変更するファイル

主要なファイルは次のとおりです。

```text
packages/app-portal-inventory/
├── portal.ts
├── client/
│   ├── plugin.ts
│   ├── routes.ts
│   ├── layout.tsx
│   ├── pages/overview.tsx
│   └── locales/
├── server/
│   ├── plugin.ts
│   └── providers/portal.ts
└── database/main/
    ├── migrations/
    └── seeds/portal_inventory_installation.ts
```

`portal.ts` は識別子と入口を宣言します。

```ts
import type { PortalDescriptor } from '@nocobase/app-plugin-multi-portal/shared';

const portal: PortalDescriptor = {
  id: 'inventory',
  namespace: '@nocobase/app-portal-inventory',
  entry: '/portals/inventory',
  icon: 'LayoutGrid',
  tone: 1,
};

export default portal;
```

表示名は ID ではなく、`client/locales/` の `title` から取得します。表示名を変える場合は翻訳を変更し、インストール記録や権限が参照する既存の ID、パッケージ名、ルート識別子は保持します。入口に `/main` などのデプロイ用ベースパスを含めません。

## ページとメニューの追加

Agent で開発を続ける場合は、必要な業務動作を伝えます。

```prompt
在庫管理ポータルに商品、倉庫、数量を記録する一覧を追加してください。管理者が追加・編集し、商品名で検索できるようにしてください。
```

この機能はページ、サービス、データにまたがります。Agent はアプリとポータルの既存規約に従います。以下のファイル説明を使って変更内容を確認し、最後の検証手順で実際の動作を確かめてください。

ホームは `client/pages/overview.tsx` を編集します。新しいページを `client/pages/` に置き、`client/routes.ts` で登録します。生成されるホームのルートは次のとおりです。

```ts
{
  name: 'inventoryOverview',
  path: '/portals/inventory',
  auth: 'required',
  authz: 'unrestricted',
  breadcrumb: { title: 'title' },
  componentLoader: () => import('./pages/overview.js'),
}
```

新しいページは `/portals/inventory/...` 配下に置き、`client/layout.tsx` の `navigation` にメニューを追加します。ルートはページの対応とアクセスを、ナビゲーションは入口の表示を担当します。両方を更新してください。ページはコンポーネントを default export し、ポータルの Layout を使用します。表示テキストはポータルの翻訳に追加します。

UI は shadcn/ui を使用し、パッケージ内の既存コンポーネントと NocoBase UI Library を優先します。[ページとメニュー](../../extension-development/pages-and-menus.md)、[国際化](../../extension-development/localization.md)を参照してください。既定のページは管理者専用です。一般ユーザーへの提供には[ポータルへのアクセスと権限](access.md)も必要です。

## サービスとデータベースの追加

業務ロジックはポータルの Server サービスに置き、HTTP エンドポイントはプラグインのルートとして登録します。各エンドポイントで認証、業務権限、インストール状態を個別に確認します。ページを隠すだけでは不十分です。[サーバー API](../../extension-development/server-apis.md)を参照してください。

ジェネレーターは `server/plugin.ts` に主接続を宣言します。

```ts
database: {
  connections: {
    main: {},
  },
},
```

テーブル定義のマイグレーションを `database/main/migrations/` に、必要な初期データを `database/main/seeds/` に追加します。生成されたインストール用 seed は保持し、起動のたびに管理者の選んだインストール状態を上書きしないでください。

複数の接続も使えます。アプリで接続とドライバーを設定してから、ポータルに同名の接続を宣言します。例えば `analytics: {}` を追加し、`database/analytics/migrations/` と `database/analytics/seeds/` にリソースを置きます。接続設定はアプリが所有します。必要なデータベース処理がすべて成功した後でポータルを有効にします。

複数接続をまたぐ原子的トランザクションではないため、一方の失敗で他方の完了済みマイグレーションが自動的にロールバックされることはありません。実行履歴を保持し、原因を修正して再試行します。[データベースとマイグレーション](../../extension-development/database-and-migrations.md)、[データベース接続](../../framework/database/connections.md)を参照してください。

## 検証と配布

アプリのルートで変更したポータルを検査し、アプリをビルドして統合を確認します。

```bash
pnpm --filter @nocobase/app-portal-inventory check
pnpm build
```

ホーム、新しいページ、メニューを確認し、管理者、権限を持つ業務ユーザー、権限のないユーザーでページと API を検証します。生成直後のパッケージには業務テストがない場合があるため、チェック成功だけでは業務動作の確認になりません。

ローカルポータルはアプリと一緒に配布します。`pnpm build --tar` でデプロイ用アーカイブを生成し、[アプリのリリース](../../deployment/publish-app-release.md)に従います。インストール、アンインストール、更新は[ポータルの管理](manage.md)を参照してください。
