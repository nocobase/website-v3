---
title: プラグインの宣言と公開のエクスポート
description: プラグインの Client、Server、CLI の提供内容を宣言し、公開の入口を用意して、アプリやほかのプラグインと組み合わせます。
---

プラグインのページ、API、サービス、コマンドは、その提供内容の宣言を通じてアプリに入ります。アプリやほかのプラグインが直接使うコンポーネント、型、サービスには、パッケージの公開のエクスポートも必要です。

ファイルの役割は [プラグインの構成](plugin-structure.md) で説明しています。この記事では、実行時の入口、提供内容の宣言、公開のエクスポート、利用側をつなぎます。ページと API の一通りの手順については [最初のプラグインを書く](write-your-first-plugin.md) を参照してください。

例では、Client のルートとロケール、Server のルートと ServiceProvider、任意の CLI の入口を持つ `@nocobase/app-plugin-announcements` プラグインを使います。初めて作成する場合は、次を選びます。

```bash
pnpm create @nocobase/plugin@beta announcements \
  --with client.routes --with client.locales \
  --with server.routes --with server.service-providers --with cli
```

プラグインがすでにある場合は、その実装を保ったまま、必要なモジュールを追加します。作り直さないでください。以下のプラグインのファイルのパスは `packages/app-plugin-announcements/` からの相対パスです。アプリの登録のファイルはアプリのルートにあります。

## 実行時の入口

1 つのパッケージは最大 3 つの実行時の入口を提供でき、アプリはそれぞれを別々に登録します。

| ランタイム | プラグインの公開のパス | 既定のエクスポート | アプリの登録のファイル |
| --- | --- | --- | --- |
| Client | `@nocobase/app-plugin-announcements/client` | `defineClientPlugin()` が返すファクトリー | `client/plugins.ts` |
| Server | `@nocobase/app-plugin-announcements/server` | `defineServerPlugin()` が返す宣言のオブジェクト | `server/plugins.ts` |
| CLI | `@nocobase/app-plugin-announcements/cli` | `defineCliPlugin()` が返す宣言のオブジェクト | `cli/plugins.ts` |

Client のファクトリーは、`announcements()` のように登録時に呼び出します。インポートした Server と CLI のオブジェクトは、そのまま登録します。これらの入口は、それぞれアプリの `defineClientPlugins()`、`defineServerPlugins()`、`defineCliPlugins()` に入ります。

Client と Server の宣言は通常 `plugin.ts` に置き、隣の `index.ts` から再エクスポートします。

```ts
export { default } from './plugin.js';
```

CLI の宣言は `cli/index.ts` に直接置き、別の `cli/plugin.ts` は必要ありません。

ローカルのプラグインがアプリの解決可能な workspace の依存関係になったら、アプリのルートで登録をプレビューして適用します。

```bash
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
```

コマンドが変更した 3 つの実行時の登録のファイルを確認し、アプリの既存のプラグインは保ってください。依存関係のインストールでパッケージがインポート可能になり、実行時の登録で宣言された機能が読み込まれます。両方の手順が必要です。運用の流れについては [プラグインを管理する](../developing-apps/manage-plugins.md) を参照してください。

プラグインが 3 つの入口をすべて提供する必要はありません。コンポーネントだけのパッケージは通常のインポートで使え、スキルだけのパッケージには実行時の入口がないこともあります。データベースのリソースを宣言するには Server の入口が必要です。入口は、パッケージが提供する機能の分だけ追加します。

## 提供内容の宣言

### Client

`client/plugin.ts` は、お知らせのページのルートとロケールリソースをまとめます。

```ts
import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';
import locales from './locales/index.js';
import routes from './routes.js';

const announcements: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-announcements',
  routes,
  locales,
});

export default announcements;
```

`routes` はプラグインのルートの宣言から、`locales` はその言語のローダーのコレクションから来ます。ページのコンポーネントと個々の言語のファイルは、それぞれのローダーの中で遅延読み込みのままにできます。新しいページはルートの宣言に追加し、そのページのためにプラグインを登録し直す必要はありません。

Client のプラグインは `serviceProviders` と `reactProviders` も宣言できます。前者は Client のサービスを登録し、後者は React の Provider をマウントします。ページとコンポーネントの実装については、[ページ、ルート、メニュー](pages-and-menus.md) と [コンポーネントとスタイル](frontend-components.md) を参照してください。

### Server

`server/plugin.ts` は、API とサービスの提供内容をまとめます。

```ts
import path from 'node:path';
import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';
import serviceProviders from './providers/index.js';
import routes from './routes/index.js';

const announcements: AppServerPlugin = defineServerPlugin({
  packageName: '@nocobase/app-plugin-announcements',
  baseDir: path.resolve(import.meta.dirname, '..'),
  serviceProviders,
  routes,
});

export default announcements;
```

`serviceProviders` には Provider のコンストラクターが、`routes` にはルートの宣言が入ります。このモジュールで Provider をインスタンス化したり、データベースに接続したり、ジョブを始めたりしないでください。それはアプリのコンテナとライフサイクルが管理します。

Server のプラグインは、ロケールとデータベースのリソースも宣言できます。対応するファイルを用意してから、これらのフィールドを追加します。

| フィールド | 宣言 | 組み込み |
| --- | --- | --- |
| `locales` | `server/locales/index.ts` からローダーのコレクションをインポートする | プラグインの言語のリソースをアプリに渡す |
| `database` | `{ migrations: './database/migrations', seeds: './database/seeds' }` | マイグレーションとシードのリソースのディレクトリを渡す |

データベースのパスは、絶対パスの `baseDir` からの相対パスとして解決されます。上の式は、ソースではプラグインのルートを、コンパイル後はプラグインの `dist/` ディレクトリを指し、コンパイル済みのデータベースのリソースはそこに置かれます。ひな形のビルドのスクリプトとリソースのマニフェストは保ってください。ディレクトリを作成しても登録はされず、リソースを宣言、ビルドしてもマイグレーションは実行されません。[データベースのリソースとマイグレーション](database-and-migrations.md) を参照してください。

バックグラウンドジョブのエグゼキューターは、その ServiceProvider で登録します。ファイルを `server/jobs/` に置いても自動では見つかりません。ルートの実装については [ルートと HTTP の API](server-apis.md) を、サービスの登録と起動については [ServiceProvider とサービスのライフサイクル](service-provider.md) を参照してください。

### CLI

`cli` の機能を選ぶと `cli/info.ts` が生成されます。`cli/index.ts` はそれをプラグインのコマンドとして宣言します。

```ts
import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';
import PluginInfo from './info.ts';

const announcements: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-announcements',
  commands: { info: PluginInfo },
});

export default announcements;
```

アプリがこの入口を登録したら、`pnpm nocobase announcements info` を実行します。コマンドのモジュールはコマンドのクラスをエクスポートし、実行時に業務の操作を行い、必要なときだけアプリの機能を起動します。開発用のコマンド、ビルドのフック、コマンドのテストについては [コマンドラインの拡張](extend-command-line.md) で扱います。

## プラグインの設定

プラグインは設定の取り決めを提供し、アプリが値を選んでランタイムに組み込みます。再利用できる Server の設定では、プラグインの公開の入口から設定のファクトリーとその型をエクスポートします。アプリは `server/config/<module>.ts` でそれを呼び出し、結果を `server/config/index.ts` の `defaultAppConfigs()` に追加します。ファクトリーは既定値、環境変数の対応付け、検証、公開のフィールドを持ち、アプリは `config.yml` やそのほかの対応している取得元で、環境ごとの値を上書きします。

たとえば、認証のプラグインは `defineAuthConfig()` をエクスポートし、アプリはそれを使って `auth` のセクションを作成します。新しいプラグインも同じ形にし、セクション名と組み込みの手順を説明できます。`defineServerPlugin()` の実行時の提供内容は、設定のセクションの登録の代わりにはなりません。独自の `config` フィールドを作って、自動で読み込まれることを期待しないでください。

Client のファクトリーは、そのプラグインが定義するオプションを受け取れます。ファクトリーのオプションは、Server の設定やブラウザーから見える公開の値とは分けて説明します。シークレットは、コンポーネントの Props や Client の設定で渡さず、Server に置いてください。定義と上書きについては [アプリの設定（config.yml）](../developing-apps/configuration-and-settings.md) を参照してください。

## 公開のエクスポート

### 入口をパッケージのパスに対応付ける

`index.ts` はエクスポートするシンボルを選び、`package.json` の `exports` は利用側がインポートできるパッケージのパスを選びます。次のマニフェストの抜粋は、3 つの実行時の入口を対応付けます。ほかのエクスポート、依存関係、ビルドの設定を保ったまま、既存のマニフェストにマージしてください。

```json
{
  "exports": {
    "./client": { "types": "./client/index.ts", "import": "./client/index.ts" },
    "./server": { "types": "./server/index.ts", "import": "./server/index.ts" },
    "./cli": { "types": "./cli/index.ts", "import": "./cli/index.ts" }
  },
  "publishConfig": {
    "exports": {
      "./client": { "types": "./dist/client/index.d.ts", "import": "./dist/client/index.js" },
      "./server": { "types": "./dist/server/index.d.ts", "import": "./dist/server/index.js" },
      "./cli": { "types": "./dist/cli/index.d.ts", "import": "./dist/cli/index.js" }
    }
  }
}
```

開発では workspace のパッケージのソースの入口を使います。公開したパッケージと、アプリのビルドが集めたローカルのパッケージは、対応するコンパイル後のエクスポートの対応付けを使います。エクスポートを追加するときは、そのソースをコンパイルの対象に含め、宣言した `.js` と `.d.ts` のファイルが存在することを確認します。

Client の入口はブラウザー互換のコードをエクスポートし、Server の入口は Node.js の機能を使えます。両端で共有するデータの型は別の共有のモジュールに置き、必要に応じてサブパスを公開します。サーバーの依存関係をブラウザーに持ち込むような、混在したルートの入口は避けてください。

### サービスを公開する

[業務のサービスと ServiceProvider](server-services.md) のお知らせのプレビューのサービスを使います。まずそこで説明しているとおりに `AnnouncementPreviewService`、`AnnouncementPreview`、元の Token と Provider を定義し、Provider を Server の宣言に含めます。プレビューは `{ text, length }` を返します。このセクションでは実装を繰り返さず、利用側に向けた入口を扱います。

`server/index.ts` のプラグインの既定のエクスポートは保ち、次を追加します。

```ts
export { default } from './plugin.js';
export { announcementPreviewToken } from './tokens.js';
export type { AnnouncementPreview, AnnouncementPreviewService } from './tokens.js';
```

利用側は `@nocobase/app-plugin-announcements/server` から Token と型をインポートします。既定のエクスポートはプラグインを登録し、名前付きのエクスポートで呼び出しができるようになります。Provider と実装は非公開のままでかまいません。Token をエクスポートしても、その実装は登録されません。アプリは引き続き Server のプラグインを登録します。

[クライアントのサービス](client-services.md) も同様に、独自の Token、Provider、公開の入口を使います。2 つのコンテナは独立したままです。コンポーネントのエクスポートとスタイルの前提条件については [コンポーネントとスタイル](frontend-components.md#コンポーネントを公開する) を、編集可能なソースの配布については [UI のソースアセット](frontend-components.md#必要に応じて-ui-のソースアセットを配布する) を参照してください。

## プラグイン間の連携

### 依存関係を宣言して登録を済ませる

レポートのプラグインが、お知らせのプレビューのサービスを必要としているとします。まず、お知らせのプラグインへの依存を宣言します。アプリが提供し、サービスの同一性を共有する必要があるプラグインには、互換性のある peer の依存関係を使います。ローカルの workspace では、利用側のマニフェストに次を含められます。

```json
{
  "peerDependencies": {
    "@nocobase/app-plugin-announcements": "workspace:^"
  }
}
```

`workspace:^` は同じ workspace のパッケージを参照します。その workspace の外や公開時には、パッケージのツールが生成する実際のバージョンの範囲を使います。`@nocobase/service-provider` などの共有のランタイムの peer は、ひな形のとおりに保ちます。通常の実行時の依存関係と開発ツールは、それぞれの分類のままにします。

アプリは互換性のあるバージョンをインストールし、お知らせの Server のプラグインと、利用側が必要とする実行時の入口を登録する必要があります。npm の依存関係によって、アプリの `server/plugins.ts` が更新されたり、サービスが登録されたりすることはありません。利用側が、アプリが明示的に呼び出す関数をエクスポートするだけなら、追加の実行時の入口は必要ありません。

### 公開のサービスを呼び出す

利用側の `server/services/announcement-preview.ts` で、公開の Token を使ってサービスを解決します。

```ts
import { announcementPreviewToken, type AnnouncementPreview } from '@nocobase/app-plugin-announcements/server';
import type { ServiceContainer } from '@nocobase/service-provider';

export function previewAnnouncement(
  container: ServiceContainer,
  text: string,
): AnnouncementPreview {
  return container.resolve(announcementPreviewToken).preview(text);
}
```

アプリか利用側のルートが、現在の `app.container` をこの関数に渡します。お知らせのプラグインは、公開のパス、元の Token、インターフェースの意味を保ったまま、プレビューの実装を内部で変更できます。利用側が実装のファイルの場所を知る必要はありません。

サービスは登録の完了後に呼び出します。利用側の Provider は、`register()` で自分のファクトリーを登録し、依存関係はそのファクトリーの中か、それ以降のライフサイクルの段階で解決します。非同期の初期化が必要な依存関係には、適切なライフサイクルの段階と、アプリでの宣言の順序も必要です。パッケージの依存関係で Provider の起動の順序が自動で決まることはありません。[アプリの起動とライフサイクル](../framework/runtime/lifecycle.md) を参照してください。

元の Token は公開の入口からインポートします。同じ文字列で別の Token を作ったり、パッケージをまたぐ相対インポートでほかのプラグインの非公開の実装を参照したりしないでください。同一性のルールについては [サービスの取り決めとトークン](../framework/services/tokens.md) を参照してください。

### 公開の入口を確認する

プラグインのテストで公開の入口をインポートし、登録したサービスが動くこと、登録がない場合ははっきりと失敗することを確認します。次に、対象のアプリで実際のページ、API、コマンドを確認し、そのあとプラグインとアプリをビルドします。

```bash
pnpm --filter @nocobase/app-plugin-announcements typecheck
pnpm --filter @nocobase/app-plugin-announcements test
pnpm --filter @nocobase/app-plugin-announcements build
pnpm nocobase announcements info --json
pnpm build
```

ソースのインポートだけでなく、コンパイル後の成果物の公開のパス、宣言、リソースも確認します。登録の成功や `info` の結果が証明するのは、その入口が動くことだけで、業務の機能のテストの代わりにはなりません。確認と引き渡しのチェックについては [テストと検証](testing-and-verification.md) と [ビルドと公開](publish-plugin.md) を参照してください。
