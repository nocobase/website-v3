---
title: ディレクトリとファイルの規約
description: アプリ、プラグイン、UI のソースアセットの入口、任意のディレクトリ、生成されるファイル、管理の責任を調べます。
---

概要は [プロジェクトの構成](../developing-apps/project-structure.md) を参照してください。このリファレンスでは、パスと役割、保守のルールを対応付けます。ファイル名は規約を示す例です。任意のディレクトリは、テンプレートと機能に合わせて調整してください。

## アプリのディレクトリ

```tree
my-app/
├── .agents/
│   ├── rules/                    # プロジェクトが所有するルール
│   └── skills/                   # 依存関係から同期したスキル（生成）
├── cli/
│   ├── commands/                 # アプリのコマンド（任意）
│   └── plugins.ts                # CLI のプラグインの登録
├── client/
│   ├── pages/                    # 業務のページ
│   ├── layouts/                  # ページのレイアウト
│   ├── components/               # UI コンポーネント
│   ├── hooks/                    # 共有の操作と状態のロジック
│   ├── locales/                  # 翻訳
│   ├── theme/                    # テーマとスタイル
│   ├── routes.ts                 # ルート、メニュー、ナビゲーション
│   ├── plugins.ts                # Client のプラグインの登録
│   └── runtime.ts                # Client の組み立て
├── database/
│   └── main/
│       ├── migrations/           # スキーマとメタデータの変更
│       ├── seeds/                # 初期データ
│       ├── metadata/             # 外部の接続のメタデータ（任意）
│       └── collections/          # 解決済みのモデルのスナップショット（生成）
├── packages/                     # workspace のパッケージ（任意）
├── public/                       # 静的アセット
├── server/
│   ├── routes/                   # HTTP のルートと index.ts での登録
│   ├── services/                 # 業務の実装（任意）
│   ├── providers/                # サービスの登録とライフサイクル
│   ├── config/                   # 既定値、検証、環境変数の対応付け
│   ├── plugins.ts                # Server のプラグインの登録
│   └── runtime.ts                # Server の組み立て
├── tests/                        # テスト、フィクスチャー、ヘルパー
├── storage/                      # 実行時のデータ（生成）
├── dist/                         # ビルドの出力（生成）
├── node_modules/                 # インストール済みの依存関係（生成）
├── AGENTS.md                     # プロジェクトのガイダンスの入口
├── config.example.yml            # 設定の例
├── config.yml                    # ローカル / デプロイの設定
├── components.json               # shadcn の設定
├── package.json                  # スクリプト、依存関係、アプリのメタデータ
├── pnpm-lock.yaml                # 解決済みの依存関係のバージョン
└── pnpm-workspace.yaml           # workspace のパッケージのディレクトリ
```

サービスのディレクトリ、コマンド、ローカルのパッケージ、外部のデータベースのメタデータは、必要なときだけ作成します。空のディレクトリは不要です。テンプレートのレイアウト、テーマ、実行時の入口はアプリが所有するソースです。アップグレードの際も、業務のためのカスタマイズを保ってください。

## 実装と登録

| 内容 | 実装 | 組み込み |
| --- | --- | --- |
| ページ | `client/pages/` | `client/routes.ts` |
| コンポーネントと Hooks | `client/components/`、`client/hooks/` | ページ、レイアウト、コンポーネントからインポートする |
| HTTP の API | `server/routes/` | `server/routes/index.ts` と実行時のルートの宣言 |
| 業務のサービス | 任意のクライアント / サーバーの `services/` ディレクトリ | それぞれの側の ServiceProvider と provider のインデックス |
| 実行時の設定 | `server/config/<section>.ts` | `server/config/index.ts` |
| アプリのコマンド | `cli/commands/` | `app` 名前空間のもとで、ファイルのパスによって読み込まれる |
| プラグイン | インストールしたパッケージか `packages/app-plugin-<name>/` | `client/plugins.ts`、`server/plugins.ts`、`cli/plugins.ts` のうち、実際に提供される入口 |

`runtime.ts` がランタイムを組み立てます。テンプレートがすでに集約の入口をつないでいる場合、業務のコードを追加するには通常その入口を更新するだけで済みます。依存関係のインストールとプラグインの登録は別の作業です。[プラグインを管理する](../developing-apps/manage-plugins.md) を参照してください。

## データベースのリソース

アプリは、リソースを接続ごとに `database/<connection>/` に整理します。すべてのリソースが `main` に属するわけではありません。

- `migrations/` は実行可能な変更の履歴です。実行済みのマイグレーションは保ち、その後のスキーマの変更には新しいマイグレーションを追加します。
- `seeds/` は初期データを管理します。必須のデータとサンプルを区別してください。
- `metadata/` には、外部のデータベースのタイトル、説明、リレーションをソース管理で保持できます。
- `collections/` は生成される確認用のスナップショットで、マイグレーションの入力ではありません。編集せず、`pnpm nocobase collections generate` で再生成してください。

プラグインの `database/migrations/` と `database/seeds/` は、その宣言を通じて提供されるリソースです。パスと接続の所有については [データベースのリソースとマイグレーション](../extension-development/database-and-migrations.md) を参照してください。

## ローカルプラグイン、共有パッケージ、UI アセット

```tree
packages/
├── app-plugin-orders/            # 実行時のプラグイン
│   ├── client/
│   │   ├── components/
│   │   ├── react-providers/      # React の Context の組み込み
│   │   ├── providers/            # Client の ServiceProvider
│   │   ├── plugin.ts
│   │   └── index.ts              # 公開の Client の入口
│   ├── server/
│   │   ├── services/
│   │   ├── providers/            # Server の ServiceProvider
│   │   ├── tokens.ts             # 公開のサービスの取り決め
│   │   ├── plugin.ts
│   │   └── index.ts              # 公開の Server の入口
│   ├── cli/
│   ├── database/
│   ├── skills/
│   ├── tests/
│   ├── AGENTS.md
│   └── package.json
├── orders-ui/                    # 独立した UI Registry のパッケージ
│   ├── registry/
│   ├── registry.json
│   ├── public/r/                 # ビルドしたアイテムの JSON（生成）
│   └── package.json
└── shared-domain/                # 内部の共有コード（任意）
    └── package.json
```

プラグインは、必要に応じて Client、Server、CLI、データベース、スキルを提供します。すべてのディレクトリが必須なわけではありません。[プラグインの構成](../extension-development/plugin-structure.md) を参照してください。

アプリとプラグインは、shadcn のプリミティブを使い、モジュール化された画面には NocoBase UI Library を参照しながら、フロントエンドのコンポーネントを自由に整理できます。エージェント向けに編集可能なソースを配布する場合は、アセットを独立した Registry のパッケージで管理します。一緒に配布するファイル間の相対インポートは、インストール先でも有効である必要があります。プラグインの機能には、隣のプラグインの非公開の実装への相対インポートではなく、公開のパッケージの入口か、利用側が渡すデータを使ってください。

## エージェント向けガイダンスの管理

| パス | 対象と保守 |
| --- | --- |
| アプリの `AGENTS.md` と `.agents/rules/` | 現在のアプリを保守するエージェント向け。アプリが保守する |
| プラグインの `AGENTS.md` | プラグインのソースを保守するエージェント向け。プラグインが保守する |
| プラグインの `skills/<name>/SKILL.md` | アプリでそのプラグインを使うエージェント向け。プラグインと一緒に配布される |
| アプリの `.agents/skills/` | 依存関係から同期したコピー。元のパッケージを更新してから、もう一度同期する |

`pnpm nocobase skills sync` は、依存関係が提供するガイダンスを更新します。[プラグインのスキル](../extension-development/write-plugin-skills.md) を参照してください。

## 生成されるファイルと設定

- `dist/`：再現可能なアプリのビルドの出力です。直接保守せず、そのソースを修正してください。
- `node_modules/`：インストールされた依存関係です。パッケージマネージャーとロックファイルで更新します。
- `storage/`：データベース、アップロードされたファイル、そのほかの業務データを含むことがあります。生成されるからといって、捨ててよいわけではありません。
- `config.example.yml`：実際の認証情報を含まない、コミットする設定の例です。
- `config.yml`：環境ごとの設定です。実際のキーやパスワードはソース管理に入れないでください。
- `pnpm-lock.yaml`：インストールを再現するため、ロックファイルはコミットします。

このリファレンスは、Core `015404ecd0db` のテンプレートとプラグインの宣言、および検証した beta.83 の既定のアプリに基づいています。[設定リファレンス](configuration.md) と [Core のパッケージ一覧](packages.md) を参照してください。
