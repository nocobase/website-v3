---
title: アプリの設定（config.yml）
description: config.yml を変更し、クライアントとサーバーのコードによる設定を理解し、上書き、検証、公開フィールドを備えた設定セクションを追加します。
---

`config.yml` には、アプリのタイトル、データベースの接続、既定のロケール、ログレベルなど、現在のアプリの環境の設定が入っています。`client/config/` と `server/config/` には、コードの既定値と、コードで組み立てる必要がある設定を定義します。

このガイドでは、まず既存の設定を変更し、次に `reports.pageSize` を追加して、宣言、上書き、業務での利用、クライアントからのアクセスをつなぎます。例は Examples テンプレートに沿っており、プロジェクトとタスクのチュートリアルは必要ありません。管理ページや管理者が管理する業務の設定は、それぞれの業務モジュールに属します。

## 設定の置き場所

| 場所 | 役割 |
| --- | --- |
| `config.example.yml` | コミットする例。新しい環境で用意すべき値を見つけやすくする |
| `config.yml` | 現在の環境の上書き。認証情報を含むことがあり、コミットしない |
| `client/config/` | クライアントの既定値と、認証のクライアントプラグインなどのコードによる設定 |
| `server/config/` | サーバーのセクションの既定値、環境変数との対応、検証、公開するフィールド |
| 各側の `config/index.ts` | `defaultAppConfigs()` でそのセクションをまとめ、ランタイムに渡す |
| `server/config.ts` | 設定サービスを作成し、設定ファイルを選んで読み込む |

`server/config.ts` はローダーで、`server/config/` にはセクションの定義が入っています。テンプレートの `server/runtime.ts` と `client/runtime.ts` は、すでにそれぞれの設定の入口を接続しています。通常は、ランタイムを変えるのではなく、セクションとその `index.ts` を管理します。

`config.example.yml` に載っているのはよく使う設定の一部で、利用できるすべてのフィールドではありません。設定は、アプリと組み込まれたモジュールが一緒に定義します。完全なオプションは [設定リファレンス](../reference/configuration.md) と各モジュールのドキュメントを参照してください。新しいアプリでは、`pnpm nocobase config init --dialect sqlite` でローカルの設定とキーを初期化します。既存のアプリでは、現在の設定を必要に応じて編集します。[アプリを作成する](../../getting-started/develop-your-first-app.md#アプリを作成して起動する) を参照してください。

## 既存の設定を変更する

初期化済みのアプリで、データベース、キーなどの設定は残したまま、次の値を `config.yml` にマージします。トップレベルのキーを重複させず、既存のセクションを更新します。

```yaml
client:
  app:
    title: My Reports

i18n:
  defaultLocale: zh-CN

logging:
  level: info
```

Examples は `client/config/app.ts` でタイトルの既定値を `NocoBase` にし、設定ファイルで `NocoBase Examples` に上書きしています。これを `My Reports` に変えると、テンプレートのクライアントの ServiceProvider が起動時にブラウザーのタブのタイトルをそれに設定します。サイドバーのアプリ名とバージョンは別の公開情報から来るため、1 つのタイトルを変えてもアプリのすべての文言が置き換わるわけではありません。

`i18n.defaultLocale` は既定の言語を選びます。利用できる言語は、引き続きロケールのリソースに依存します。ユーザーやブラウザーの既存の設定が優先されることがあります。[多言語化](localization.md) を参照してください。`logging.level` はログレベルを選びます。完全な動作は [ログ](../framework/support/logging.md) を参照してください。

### 上書きの優先順位

サーバーの優先順位は、低いものから順に、コードの既定値、設定ファイル、明示的に対応付けた環境変数です。ブラウザーに送られるクライアントの設定は、クライアントのコードの既定値を上書きします。アプリのベースパスや API の URL など、ホストが管理する値はランタイムが計算します。

プレーンなオブジェクトは再帰的にマージされ、配列とスカラー値は置き換えられます。環境変数には宣言された対応付けが必要で、それに従って解析されます。任意の変数名が設定のパスになるわけではありません。YAML 内の `${NAME}` は展開されません。宣言された変数を使うか、自分のフィールドに対応付けを追加してください。

たとえば `APP_SERVER_PORT` は `server.port` に対応します。設定すると、ファイル内のその値を上書きします。有効な値を確認するときは、アプリの起動時の環境を調べてください。

## クライアントの設定

Examples の `client/config/` には 3 つのセクションがあります。

| ファイル | 内容 |
| --- | --- |
| `app.ts` | アプリのタイトルなど、クライアントの既定値 |
| `api.ts` | API Client の既定の URL。アプリのベースパスとあわせて解決される |
| `auth.ts` | ユーザー名、API キー、デバイス認可のための認証のクライアントプラグイン |

アプリのタイトルの既定値は、次のように宣言できます。

```ts
// client/config/app.ts
import { defineAppConfig, type AppConfigFactory } from '@nocobase/app-client';

const app: AppConfigFactory<{ title: string }> = defineAppConfig(() => ({
  title: 'NocoBase',
}));

export default app;
```

`client/config/index.ts` は、すでに `app`、`api`、`auth` を `defaultAppConfigs({ ... })` に渡しています。追加のセクションはそこでインポートして登録し、明示的に宣言された戻り値の型があればそれも更新します。

クライアントの `defineAppConfig()` はファクトリー関数を受け取ります。組み立てたプラグインのインスタンスやコールバックは TypeScript に置きます。環境によって変わるシリアライズ可能な値は、`config.yml` の `client` セクションで上書きできます。

クライアントの ServiceProvider でタイトルを読み取ります。

```ts
// Inside a client ServiceProvider:
const title = this.app.config.get<string>('app.title', 'NocoBase');
```

ページやフックでは、`useClientApplication().config` で同じサービスを取得します。参照するパスは `app.title` で、ファイルの `client.` の接頭辞は付けません。API の URL は、マウント先のパスに応じてホストが制御します。`client.api.baseURL` を、任意の外部サービスの上書きとして扱わないでください。独立した外部 API へのアクセスは、別に設定します。

## サーバーの設定

`server/config/` には、フレームワークとプラグインの両方の設定がまとめられています。たとえば `server.ts`、`api.ts`、`database.ts`、`logging.ts` は実行時の機能を、`auth.ts`、`users.ts`、`notification.ts`、`knowledge.ts` は組み込まれたモジュールを設定します。個々のオプションは各モジュールのドキュメントで扱い、このガイドでは共通の組み込み方を扱います。

モジュールに専用のファクトリーがある場合は、`defineApiConfig()`、`defineAppDatabaseConfig()`、`defineAuthConfig()` などを優先して使い、その既定値、対応付け、検証を保ちます。アプリが所有するセクションには、`@nocobase/app-server/config` の `defineAppConfig()` を使います。

サーバーの `defineAppConfig()` は次の宣言に対応しています。

| フィールド | 役割 |
| --- | --- |
| `defaults` | 既定値。またはパスなどの実行時の情報から既定値を計算する関数 |
| `env` | セクション内のフィールドへの環境変数の対応付け。型と説明付き |
| `validate` | マージ後の最終的な値の検証。フィールドのエラーは `context.error()` で報告する |
| `public` | ブラウザーに送ってよい末端のパス |

クライアントとサーバーのファクトリーは同じ名前ですが、インターフェースは異なります。サーバーの `env`、`validate`、`public` のオブジェクト形式は、クライアントのファクトリーには適用されません。

新しいセクションは `server/config/index.ts` で登録し、`app.config.get()` で読み取ります。登録のキーがセクション名を決めます。ファイルを追加しても登録されず、YAML のキーを追加しても業務の動作は実装されません。組み込みのオプションは [設定リファレンス](../reference/configuration.md) を参照してください。

## 設定をクライアントに公開する

ブラウザーが読み取る設定には、別々の 2 種類があります。

| 取得元 | クライアントでのアクセス方法 |
| --- | --- |
| クライアントのコードの既定値と、ファイルの `client` セクション | `config.get('app.title')` などのパス |
| サーバーの `public` 宣言で公開されたフィールドと、ランタイムが公開する情報 | `config.public.get(...)` |

ランタイムは、既定のロケールと、アプリのパッケージの表示名とバージョンを公開します。クライアントの `config` オブジェクトでは次のようにします。

```ts
// config is the client application's configuration service.
const title = config.get<string>('app.title', 'NocoBase');
const defaultLocale = config.public.get('i18n.defaultLocale');
```

アプリが所有するサーバーのセクションでは、公開する末端のパスを明示的に宣言します。下の例では、`public: ['pageSize']` は `reports` オブジェクト全体ではなく、`reports.pageSize` だけを公開します。公開された設定はサーバーでのパスのままで、`config.get()` では読み取りません。

`client` セクションも公開されたフィールドも、ブラウザーに届きます。データベースのパスワード、セッションのシークレット、メールの認証情報は、サーバー専用の設定に置いてください。型の宣言は TypeScript でパスを確認するだけで、フィールドを公開するものではありません。

## 独自の設定を追加する

レポートの既定の 1 ページあたりの件数を、`1` から `100` の範囲で追加します。これは独立した設定の例で、業務の動作が変わるのは、既存のレポートがこの値をページネーションに使ってからです。

### 定義して登録する

`server/config/reports.ts` を追加します。

```ts
// server/config/reports.ts
import {
  defineAppConfig,
  envInteger,
  type AppConfigFactory,
} from '@nocobase/app-server/config';

export interface ReportsConfig {
  pageSize: number;
}

const reports: AppConfigFactory<ReportsConfig> = defineAppConfig({
  defaults: { pageSize: 20 },
  env: {
    REPORTS_PAGE_SIZE: envInteger('pageSize', {
      description: 'Default report page size, from 1 to 100.',
    }),
  },
  public: ['pageSize'],
  validate(value, context) {
    const size = value.pageSize;
    if (
      typeof size !== 'number' ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > 100
    ) {
      context.error('pageSize', 'Must be an integer from 1 to 100.');
    }
  },
});

export default reports;
```

既存の `server/config/index.ts` に、ほかのセクションはすべて残したまま 3 つの変更を加えます。

1. `import reports from './reports.js';` をインポートします。
2. 明示的な戻り値の型に `reports: ReturnType<typeof reports>` を追加します。
3. `defaultAppConfigs({ ... })` に渡すオブジェクトに `reports` を追加します。

登録のキーは `reports` なので、設定のキーは `reports.pageSize`、環境変数は `REPORTS_PAGE_SIZE` になります。検証は、どちらの取得元から来た最終的な値も確認します。検証の処理でデータを書き込んだり、ネットワークにリクエストしたりしてはいけません。

`config.example.yml` に、このセクションと既定値 `20` を記載します。現在の環境では `config.yml` で上書きできます。

```yaml
reports:
  pageSize: 30
```

### 業務での利用につなぐ

明示的に指定されたページあたりの件数を優先し、なければアプリの既定値を読み取るヘルパーを追加します。

```ts
// server/services/report-options.ts
import type { AppConfigAccessor } from '@nocobase/app-server/config';

export function resolveReportPageSize(
  config: AppConfigAccessor,
  requested?: number,
): number {
  const size = requested ?? config.get<number>('reports.pageSize');
  if (
    typeof size !== 'number' ||
    !Number.isInteger(size) ||
    size < 1 ||
    size > 100
  ) {
    throw new Error('Report page size must be an integer from 1 to 100.');
  }
  return size;
}
```

レポートの業務サービスでは、`resolveReportPageSize(app.config, requestedPageSize)` で照会の `limit` を取得します。ヘルパーの通常のエラーは、入力や組み込みが正しくないことを報告します。HTTP の境界では、引き続きリクエストのパラメーターを検証し、失敗をプロジェクトのレスポンスの取り決めに変換します。[リクエストの検証とエラー処理](request-validation-and-errors.md) を参照してください。設定の検証は、リクエストの検証の代わりにはなりません。

### 公開された値をクライアントで読み取る

クライアントの TypeScript プロジェクトに含まれる宣言ファイルで、公開設定の型を拡張します。

```ts
// client/types/public-config.d.ts
import '@nocobase/app-client';

declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    reports: { pageSize?: number };
  }
}
```

ページでは、フックを使って公開された既定値を取得できます。

```ts
// client/hooks/use-report-page-size.ts
import { useClientApplication } from '@nocobase/app-client';

export function useReportPageSize(): number | undefined {
  return useClientApplication().config.public.get('reports.pageSize');
}
```

この値はページネーションの状態の初期化に使います。その後のユーザーの選択はページの状態に属します。`undefined` が返る場合は、サーバーのセクションの登録、`public` の宣言、現在のページが再読み込みされているかを確認してください。そのサーバーの設定を `client` に重複させないでください。

## 設定を確認して変更を反映する

編集後、宣言を確認し、現在のアプリの設定をチェックします。

```bash
pnpm nocobase config env
pnpm nocobase config variables --json
pnpm nocobase config check --no-connect
```

`config env` は環境変数の対応付けを一覧表示し、`config variables` は環境変数の型、説明などのメタデータを報告し、`config check --no-connect` はオフラインで検証します。単に `config check` を実行すると、既定で SQLite 以外のデータベースへの接続も試みます。設定の検証に通っても、データベースや外部サービスが使えることは確認されません。

`reports` を登録し、アプリの既存の設定が有効であることを確認したら、開発環境で上書きと拒否を確認します。下の一時的な環境変数の書き方は POSIX シェル用です。

```bash
pnpm nocobase config set reports.pageSize=30
REPORTS_PAGE_SIZE=40 pnpm nocobase config check --no-connect --json
REPORTS_PAGE_SIZE=0 pnpm nocobase config check --no-connect --json
```

1 つ目のコマンドはファイルに `30` を書き込みます。2 つ目はそのプロセスで有効な値 `40` で通過し、ファイルは `30` のままになるはずです。3 つ目は 0 以外で終了し、無効な `reports.pageSize` を示すはずです。`config set` はファイルを編集するだけで、別に動いているアプリのプロセスを再読み込みはしません。

上書きがない場合の既定値 `20`、クライアントで公開された値が一致すること、公開していないフィールドが含まれないこと、明示的に指定されたページあたりの件数の検証も確認します。開発中のアプリで実際のページと照会を確認する前に、分離した設定のテストでこれらを確認してください。

変更がどう反映されるかは、それを使う側によって異なります。

- **`config.yml` や起動時の環境を編集した場合：** 設定をチェックし、アプリを再起動して、クライアントのページを再読み込みします。部分的な再読み込みは、モジュールが対応している場合にだけ使います。
- **`client/config/` や `server/config/` の TypeScript を編集した場合：** プロジェクトの開発の流れで再読み込みします。本番ではコードをビルドし直してリリースします。
- **初期化時にだけ使う値：** たとえば `users.initialAdmin` は、空のユーザーテーブルを初期化するときに読み取られます。変更しても既存のアカウントはリセットされません。
- **ユーザーが保存した設定がある既定値：** 保存されたテーマの選択が優先されることがあります。保存された設定のないセッションで確認してください。

実行時の再読み込みに対応していても、データベースの接続、コンシューマー、すべてのサービスが自動で作り直されるわけではありません。操作と完全なオプションについては、[CLI リファレンス](../reference/cli.md) と [設定リファレンス](../reference/configuration.md) を参照してください。

このガイドで確認したテンプレートのソース：[設定の例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/config.example.yml)、[クライアントの設定の入口](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/client/config/index.ts)、[サーバーの設定の入口](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/server/config/index.ts)。
