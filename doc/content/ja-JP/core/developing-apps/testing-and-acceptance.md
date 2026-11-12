---
title: テスト
description: コンポーネント、API、コマンド、データベースをテストし、Playwright、Agent、手動操作で UI と業務フロー全体を検証します。
---

## アプリケーションでテストする内容

機能を実装したら、通常の操作、権限が制限された状態、処理に失敗した場合のそれぞれで、期待する結果になることを確認します。たとえば商品管理では、作成と公開が成功することに加え、読み取り専用ユーザーが変更できないこと、保存に失敗しても再試行できることを確認します。

テストでは、コードの処理結果と、実際のアプリケーションでの操作フローの両方を検証します。

| テスト範囲 | 主な検証内容 | 商品管理の例 |
| --- | --- | --- |
| client | テスト環境でのコンポーネント操作、リクエスト内容、状態の表示 | 正しい商品名と価格を送信し、失敗時に入力を保持する |
| server | API、業務ルール、認証、権限 | 新規商品を下書きとして保存し、読み取り専用ユーザーの公開操作を拒否する |
| cli | コマンド実行、出力、エラー処理 | 公開済み商品をエクスポートし、既存ファイルの上書きを拒否する |
| database | データ操作、制約、トランザクション、マイグレーション、初期データ | 書き込み失敗時にロールバックし、マイグレーションを適用・取り消しできる |
| UI | 実際のブラウザーでの画面表示と業務フロー全体 | ログイン、下書き作成、公開、再読み込みを行い、結果が保持されることを確認する |

最初の 4 種類は Vitest と app-testing を使って記述します。UI テストは、Playwright のスクリプト、Agent の自律的な操作、手動操作で実施できます。コンポーネントテストでフォームのリクエスト処理、サーバーテストで権限と保存、UI テストで実際の操作フローの完了を確認することで、互いを補完します。

## テストツールとテスト支援スイート

### Vitest

Vitest はテストを検出・実行します。`test` でケースを定義し、`expect` で結果を検証し、`vi.fn()` で関数呼び出しを記録またはモックできます。ファイル変更の監視やカバレッジレポートの生成にも対応しています。一般的な使い方は [Vitest のドキュメント](https://vitest.dev/guide/)を参照してください。

アプリケーション環境に依存しない関数は、直接インポートしてテストできます。ページ、プラグイン、データベース、アプリケーションコマンドが関係する場合は、app-testing で環境を用意します。同じ Vitest のケース内で、Vitest のアサーションと app-testing のヘルパーを併用できます。

### Playwright

Playwright は起動済みのアプリケーションを実際のブラウザーで開き、ログイン、フォーム入力、ボタンのクリック、ページの再読み込みなどを行います。画面、API、セッション、データベースが連携する一連のフローの検証に適しています。

Playwright には独自のテストランナーがあり、app-testing が提供するものではありません。この例では `pnpm test` が Vitest、`pnpm test:e2e` が Playwright を実行するため、それぞれ実行します。

### app-testing

`@nocobase/app-testing` は NocoBase のアプリケーションテストを支援するスイートです。次の 3 つのインポート先を提供します。

| インポート先 | 主なヘルパー | 検証できる内容 |
| --- | --- | --- |
| `@nocobase/app-testing/client` | `renderWithApp()`、`answerApi()` | クライアントアプリケーション環境でコンポーネントを描画し、API 応答を制御して画面操作を検証する |
| `@nocobase/app-testing/server` | `createAppTest()` | 分離したデータベースでサーバーアプリケーションを起動し、API、権限、永続化を検証する |
| `@nocobase/app-testing/server` | `createDatabaseTest()`、`describeMigration()` | データ操作、スキーマ、マイグレーションのロールバックを単独で検証する |
| `@nocobase/app-testing/cli` | `createTestAppConfig()`、`bindTestAppCommand()`、`runAppCommand()` | テスト設定を用意してコマンドを実行し、結果と出力を読み取る |

これらのヘルパーは、アプリケーションの作成、データベースの準備、リソースの解放に必要な重複コードを減らします。商品の公開が許可されるか、読み取り専用ユーザーの操作が拒否されるかといった業務上の結果は、各ケースで明示的に検証する必要があります。

## テストの配置と実行

### ディレクトリと設定

テストファイルは、対象ごとに `tests/` 配下へ配置します。

```text
tests/
├── database/     # データベーステスト
├── server/       # サーバーテスト
├── client/       # 画面操作テスト
├── cli/          # アプリケーションコマンドテスト
└── playwright/   # ブラウザーテスト
```

`vitest.config.ts` で最初の 4 種類を設定します。`client` project は画面テスト、`node` project はサーバー、コマンド、データベースのテストを実行します。ブラウザーテストは `playwright.config.ts` で個別に設定します。

### テストの実行と結果の確認

アプリケーションのルートで次のコマンドを実行します。これらはデフォルトのアプリケーションテンプレートの `package.json` に定義されています。既存のプロジェクトでは、そのプロジェクトのスクリプト設定に従ってください。

```bash
# Vitest テストを実行
pnpm test

# ファイル変更を監視してテストを再実行
pnpm test:watch

# カバレッジレポートを生成
pnpm test:coverage

# ブラウザーテストを実行。先にテストアプリケーションを起動する
pnpm test:e2e
```

実行後は、ターミナルに表示されるファイル数、ケース数、失敗を確認します。エラーにはアサーションの位置、期待値、実際の値が表示されます。ケースが見つからなかった場合やスキップされた場合、その機能を検証できたことにはなりません。

機能の変更後は、影響する範囲のテストを先に実行し、それを利用するページ、API、コマンドも確認します。認証、共有サービス、データ構造の変更では、重要なフロー全体も再検証します。不具合を修正する際は、再現用のケースを追加し、修正後も回帰テストとして残します。

## Vitest でテストを記述する

以下では、同じ商品管理 App を使って各方法を説明します。ソースコードとインストール手順は[サンプルのソースコードと実行](#サンプルのソースコードと実行)を参照してください。コードは主要部分の抜粋であり、データの準備やヘルパー関数の全体はリンク先にあります。

各ケースには、環境やデータの準備、操作の実行、結果の検証を含めます。検証したい動作を決めてからテスト対象を選びます。独立した関数には Vitest を直接使い、アプリケーションサービス、画面、データベースに依存するテストでは app-testing で環境を用意します。

### database：データとマイグレーション

database テストでは、データ操作、制約、トランザクション、マイグレーション、初期データを検証します。アプリケーション全体が不要なら、必要なマイグレーションとデータだけを読み込み、他のモジュールへの依存を減らせます。

**データベースの準備とデータ操作の検証**

`@nocobase/app-testing/server` から `createDatabaseTest()` をインポートし、`migrations` でマイグレーションの読み込み元を指定します。ケースのコンテキストにある `connection` でテストデータベースを操作します。これらの機能は `@nocobase/db-testing` が提供し、app-testing の server エントリーポイントから再エクスポートされています。

`createDatabaseTest()` のデフォルトは `isolation: 'schema'` です。ケースごとにテストデータベースの構造をリセットして指定したマイグレーションと Seed を実行し、終了後に接続とデータベースを解放します。アプリケーションやプラグインは自動インストールされません。初期データが必要なら `seeds` で明示的に指定し、プラグインサービスが必要なら `createAppTest()` を使います。

書き込み後に再取得し、フィールド値とレコード数を確認します。制約のテストでは、不正な書き込みの失敗に加え、既存レコードが変わっていないことも確認します。トランザクションでは複数の操作の途中で失敗させ、部分的な書き込みが残っていないことを再取得して確認します。

**マイグレーションと初期データの検証**

`describeMigration()` でマイグレーションの読み込み元を指定し、`up` と `down` のコールバックで結果を確認します。ヘルパーが適用、ロールバック、再適用を行うため、`up` のアサーションは 2 回実行されます。期待する構造、フィールド、データ変更は業務に合わせて検証してください。

初期データは初回実行と再実行の両方を確認します。たとえば、レコードが重複しないことや、ユーザーの編集を上書きしないことを検証します。初期化が認証・認可などのプラグインサービスに依存する場合は、server テストでアプリケーション全体を読み込みます。

**テストデータベースの選択**

`NOCOBASE_TEST_DB_DIALECT` でテストの方言を選択します。未設定の場合は SQLite です。切り替える前に互換性のあるドライバーをインストールし、必要なテスト用サービスと接続パラメーターを設定します。テストアカウントには、分離したデータベースやスキーマを作成・削除する権限が必要です。たとえば PostgreSQL のテスト環境を設定した後、次のように実行できます。

```bash
NOCOBASE_TEST_DB_DIALECT=postgres pnpm test --project node tests/database/catalog-data.test.ts
```

このコマンドは切り替え方法の例です。商品サンプルで実際に検証したのは SQLite です。接続設定は[データベースのテスト環境](https://github.com/nocobase/nocobase/blob/6cc8acf0c9062e99c759ed0a9ca1d038c4145705/packages/app/app-skills/skills/nocobase-app-development/references/testing/database/repository.md)を参照してください。同じ環境選択は、スイートの分離データベースを使う server と cli のテストにも適用されます。

**例：商品データのトランザクションとマイグレーション**

データベーステストでは、商品のマイグレーションだけを読み込みます。

```ts
import path from 'node:path';
import { createDatabaseTest } from '@nocobase/app-testing/server';
import metadata from '../../package.json' with { type: 'json' };

const test = createDatabaseTest({
  migrations: [{
    packageName: metadata.name,
    directory: path.resolve(import.meta.dirname, '../../database/main/migrations'),
  }],
});
```

次のケースでは、トランザクション内で書き込んだ後に意図的にエラーを発生させます。最後のレコード数はゼロになるはずです。

```ts
test('rolls back every product write when the transaction fails', async ({
  connection,
}) => {
  await expect(
    connection.transaction(async (transaction) => {
      await transaction
        .repository('catalogProducts')
        .createOne({
          values: {
            id: 'rollback',
            name: 'Uncommitted',
            priceCents: 100,
            published: false,
          },
        });
      throw new Error('Simulated downstream failure');
    }),
  ).rejects.toThrow('Simulated downstream failure');
  expect(await connection.repository('catalogProducts').count()).toBe(0);
});
```

マイグレーションテストでは、フィールドの存在と、ロールバック後にテーブルが削除されたことを確認します。

```ts
describeMigration('202610310001_create_catalog', {
  sources: [
    {
      packageName: 'testing-acceptance',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('catalogProducts').toHaveField('published', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('catalogProducts').not.toExist();
    await expectCollection('catalogCategories').not.toExist();
  },
});
```

```bash
pnpm test --project node tests/database/catalog.test.ts tests/database/catalog-data.test.ts
```

[データ操作テスト](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/database/catalog-data.test.ts) · [マイグレーションテスト](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/database/catalog.test.ts)。初期データの検証はサーバーテストにあります。sample Seed を実行し、商品名を編集してから再実行し、レコードが増えず編集が保持されることを確認します。通常の起動では商品データを投入しません。

### server：API と業務ルール

server テストでは、API 応答、業務ルール、認証、権限、永続化を検証します。独立した計算は関数を直接呼び出してテストし、プラグインやアプリケーションサービスに依存する動作は実際のアプリケーションを読み込んで検証します。

**テストアプリケーションの作成**

`@nocobase/app-testing/server` から `createAppTest()` をインポートします。`createServer` にアプリケーションのサーバー作成関数、`config` にテスト用設定を渡すと、アプリケーションのコンテキストを持つ Vitest の `test` が返されます。

| コンテキスト | 用途 |
| --- | --- |
| `request` | アプリケーション API へリクエストを送る |
| `testApp` | テストアプリケーションへアクセスする。`fetch` で Web ルートも呼び出せる |
| `app` | アプリケーションとサービスコンテナーへアクセスする |
| `connection` | テストデータベースを取得し、操作後のデータを確認する |

リクエストはプロセス内で実行され、外部からアクセスできる HTTP サーバーは不要です。デフォルトでは同じファイルのケースがアプリケーションとデータベースを共有します。ケースごとに分離する場合は `scope: 'test'` を指定します。`connections` はデフォルトで `main` を分離します。アプリケーションが所有する接続が複数ある場合はすべて指定してください。未指定の接続はアプリケーションの設定を使い続けます。スコープの終了時にスイートがアプリケーションを閉じ、テストデータベースを削除します。

**応答、業務上の結果、権限の検証**

データを準備して実際のリクエストを送り、ステータスコード、応答内容、保存結果を確認します。通常の操作に加え、不正な入力、存在しないレコード、状態の競合も対象にします。再試行をサポートする API では、重複書き込みの有無も確認します。

権限テストでは、未ログイン、ログイン済みだが未許可、許可済みの各ユーザーを使います。実際の認証でセッションを確立し、許可される操作と拒否される操作を確認します。データ範囲の制限がある場合は、一覧、件数、詳細、エクスポートの一貫性も確認します。クライアントでボタンを隠すだけでは、これらの検証の代わりになりません。

データベースを共有するケースは各自のレコードを準備し、実行順序に依存しないようにします。

**例：商品の作成とアクセス制御**

サンプルは実際のアプリケーションを読み込み、テスト用の認証環境を設定します。

```ts
import { createAppTest } from '@nocobase/app-testing/server';
import { DEFAULT_ADMIN_CREDENTIALS, signIn } from '@nocobase/app-plugin-authentication/testing';
import { expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  server: { basePath: '/shop' },
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'catalog-test-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
      emailAndPassword: { disableSignUp: false },
    },
  },
});
```

テストでは商品を作成し、同じ操作キーでリクエストを繰り返してからデータベースを確認し、重複がないことを検証します。一般ユーザーは明示的に許可された場合だけ読み取りができ、作成と公開は引き続き `403` になります。次の抜粋では、作成と再試行のアサーションを 1 つのケースにまとめ、コンテキストの取得とログインを示しています。`post()` と `key()` はソース内のヘルパーで、それぞれ JSON リクエストの作成と操作キーの生成を行います。

```ts
test('creates a draft without duplicating retries', async ({ testApp, connection, request }) => {
  expect((await request('/products')).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const values = { name: 'Catalog test lamp', priceCents: 3500 };
  const operation = key();
  const created = await admin.fetch('/products', post(values, operation));
  expect(created.status).toBe(201);
  const { data } = await created.json();
  expect(data).toMatchObject({ ...values, published: false });
  const repeated = await admin.fetch('/products', post(values, operation));
  expect(repeated.headers.get('Idempotency-Replayed')).toBe('true');
  expect(await connection.repository('catalogProducts').count({
    filter: { name: values.name },
  })).toBe(1);
});
```

```bash
pnpm test --project node tests/server/catalog.test.ts
```

[テスト全体、セッション準備、権限のアサーション](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/server/catalog.test.ts)。

### client：コンポーネントの操作と状態

client テストでは、ユーザー操作後にコンポーネントが正しいリクエストを送信し、期待する状態を表示するかを確認します。フォーム入力、ボタン操作、データ表示、エラー表示、再試行の検証に適しています。

**アプリケーションコンポーネントの描画**

`@nocobase/app-testing/client` から `renderWithApp()` をインポートし、アプリケーションサービス、ルーティング、翻訳を備えた環境で実際のコンポーネントを描画します。`namespace`、`namespaces`、`locale` で必要な翻訳を設定します。アプリケーションコンテキストを使うコンポーネントは、この環境で検証し、実際のロジックを通らない代替コンポーネントに置き換えないでください。

`renderWithApp()` はケース終了時にクライアントアプリケーションを閉じます。Testing Library で要素を探し、`userEvent` で入力やクリックを再現し、Vitest の `expect()` で結果を確認します。

**リクエストの制御と画面の確認**

`fetch: answerApi(handler)` で API 応答を制御します。ハンドラーはリクエストの `method`、`path`、`json` を参照し、ステータスコードと本文を指定した `Response` を返せます。`vi.fn()` と組み合わせると、リクエスト内容や送信回数も確認できます。

待機中、成功、失敗をそれぞれ検証します。待機中は重複操作を防げるか、成功後はデータと表示が更新されるか、失敗後はエラー表示、入力保持、再試行が機能するかを確認します。非同期の画面更新を待ってからアサーションを行い、遅延させた応答はケース終了前に解放します。

モック応答で確認できるのは、画面が結果をどう処理するかです。サーバーでの保存や権限検証を証明するものではありません。それらは server テスト、実際のブラウザーでのフロー全体は Playwright で確認します。

**例：商品フォームの送信と表示**

商品フォームのテストは実際のコンポーネントを使い、応答を制御してリクエストと画面状態を確認します。次の `respond` は各ケースが渡し、`metadata` と `locales` はアプリケーションから読み込みます。

```tsx
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';

const requests = vi.fn((call: ApiCall) =>
  call.method === 'POST' && call.path === 'products'
    ? respond()
    : new Response(null, { status: 404 }),
);
await renderWithApp(<ProductForm onCreated={onCreated} />, {
  namespace: metadata.name,
  namespaces: { [metadata.name]: locales },
  locale: 'en-US',
  fetch: answerApi(requests),
});
```

成功ケースはリクエスト内の商品名と価格、入力のクリア、コールバック回数を確認します。失敗ケースは入力保持と再試行、遅延ケースは送信中のボタン無効化を確認します。

```bash
pnpm test --project client tests/client/product-form.test.tsx
```

[テスト全体とヘルパー関数](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/client/product-form.test.tsx)。

![商品の下書きを作成した後の画面。](/assets/core/testing-acceptance/testing-products-draft.png)

![保存に失敗しても入力を保持し、再試行を案内する。](/assets/core/testing-acceptance/testing-products-failure.png)

![リクエストの待機中はボタンが無効になる。](/assets/core/testing-acceptance/testing-products-pending.png)

### cli：アプリケーションコマンド

cli テストでは、引数の処理、終了ステータス、標準出力、エラー、データやファイルの変化を検証します。例外の有無だけでなく、エクスポートしたファイルを読み戻すなど、実際の副作用を確認します。

**コマンド実行環境の準備**

`@nocobase/app-testing/cli` からヘルパーをインポートし、アプリケーションを起動する必要があるかに応じて選択します。

| コマンドの依存先 | 準備方法 |
| --- | --- |
| 引数やファイルのみ | `bindAppCommand()` で一時的なアプリケーションルートとコマンド ID を関連付け、`runAppCommand()` で実行する |
| アプリケーションサービスやデータベース | `createTestAppConfig()` で分離設定を作成し、データを準備して、`bindTestAppCommand()` で実際のコマンドクラスを関連付けて実行する |

テストが作成した一時ファイルは後で削除し、アプリケーション設定は `config.dispose()` で解放します。以下の商品エクスポートは後者の方法です。アプリケーションを起動しない方法は[ファイル操作コマンドの完全な例](https://github.com/nocobase/nocobase/blob/6cc8acf0c9062e99c759ed0a9ca1d038c4145705/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/files.md)を参照してください。

**コマンドの実行と結果の確認**

`runAppCommand(Command, args)` で実行します。戻り値には `exitCode`、`stdout`、`stderr` などが含まれます。成功時の `exitCode` は `undefined` の場合があるため、`exitCode ?? 0` で正規化して確認します。JSON 出力をサポートするコマンドは `json()` で構造化された結果を取得できます。出力に加え、データベースや生成ファイルの内容も確認します。試行モードでは書き込みが発生していないことも検証します。

不正な引数、既存の出力先、実行失敗では、終了ステータス、エラー内容、既存データの保持を確認します。JSON モードで処理済みのエラーは `run.error` に含まれないことがあるため、終了コードとエラー応答の両方を確認します。

出力の取得はプロセス全体の状態に関係するため、これらのテストは順番に実行します。`withApp()` を使うコマンドは終了時にアプリケーションを閉じますが、テストが作成した設定は `finally` で `config.dispose()` を呼び出す必要があります。

**例：公開済み商品のエクスポート**

サンプルのコマンドは、実際のデータベースから公開済み商品を取得します。テストでは公開済み商品と下書きを 1 件ずつ用意して、実際のコマンドを関連付けます。`config` は `createTestAppConfig()` で作成し、`createApp` と `runtime` はアプリケーションのエントリーポイントから読み込みます。

```ts
const Command = bindTestAppCommand(ExportProducts, {
  rootDir, config, id: 'app:products:export', createApp,
  loadRuntime: () => resolveStandaloneAppRuntime(runtime, {
    rootDir,
    configPath: config.path,
    consoleLogStream: 'stderr',
    env: { APP_STORAGE_DIR: path.join(config.directory, 'storage') },
  }),
});
```

`consoleLogStream: 'stderr'` でログが JSON 出力に混ざるのを防ぎ、一時設定とストレージのパスを一致させます。実行結果は 1 件のエクスポートを示し、ファイルに下書きは含まれません。

```ts
const run = await runAppCommand(Command, ['--output', file, '--json']);
expect(run.exitCode ?? 0).toBe(0);
expect(run.json()).toMatchObject({
  ok: true, result: { count: 1, written: true },
});
```

試行モードでファイルが作成されないこと、出力先が存在する場合はエラーになり元の内容が保持されることも確認し、`finally` で設定を解放します。

```bash
pnpm test --project node tests/cli/export.test.ts
```

[コマンドテスト全体](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/cli/export.test.ts) · [エクスポートコマンドの実装](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/cli/commands/products/export.ts)。

手動でエクスポートする前に、同じストレージを使用するアプリケーションプロセスを停止します。この例は単一プロセスで実行し、出力先ディレクトリは事前に作成しておきます。公開商品が 500 件を超える場合、コマンドはエクスポートを拒否します。

```bash
pnpm nocobase app products export --output ./products.json --dry-run --json
pnpm nocobase app products export --output ./products.json --json
```

## UI テスト

UI テストでは実際のアプリケーションを開き、画面、API、セッション、データが連携した結果を確認します。アクセス可能なアプリケーション、必要なロールのアカウント、区別できるテストデータを準備し、実行後のデータの扱いを決めておきます。

| 実行方法 | 適した用途 | 検証記録 |
| --- | --- | --- |
| Playwright | 安定したフローの反復検証と回帰テスト | テストケース、レポート、トレース |
| Agent による自律検証 | 開発中に変更箇所を操作し、問題を修正して再確認する | 実際の操作、観察結果、問題と再検証の記録 |
| 手動検証 | 実際の業務に照らしてフロー、用語、使いやすさを確認する | シナリオ、期待結果、実際の結果、利用者のフィードバック |

いずれの方法でも、重要なフロー、ロールの違い、必要なエラー状態を確認します。永続化を確認する場合は、再読み込みや再アクセスで保存結果を確認します。画面上の操作制限だけではサーバーが不正アクセスを拒否することは証明できないため、API の権限テストも必要です。

### Playwright による自動検証

Playwright は実際のブラウザーで一連の操作を実行し、画面、API、セッション、データベースの連携を検証します。ログイン、送信、画面遷移、再読み込み、複数ページにまたがる操作に適しています。

**アプリケーション、アカウント、データの準備**

独立したテストアプリケーションを起動し、アクセス先を設定して、権限の異なるアカウントを準備します。実際のログインでセッションを確立し、区別できるデータを使います。繰り返し実行が互いに影響しないよう、終了後にデータを削除するか保持するかを決めます。

ブラウザーテストは起動済みのサービスへアクセスするため、server テストのプロセス内リクエスト環境を直接使うことはできません。必要なブラウザーは `pnpm exec playwright install chromium` などでインストールします。

**画面の操作と結果の検証**

要素はロール、ラベル、表示名を使って特定し、`fill()` や `click()` で操作します。その後、Playwright のアサーションで期待する状態を待ちます。

正常な経路に加え、必要な失敗経路も検証します。ネットワーク応答を制御して一時的な失敗や遅延を再現し、表示、再試行、重複送信を確認できます。こうした制御されたケースと、実際の API を使う正常フローは区別してください。

**失敗とレポートの確認**

まずケース名、アサーションの位置、実際の結果を確認します。詳しく調べる場合は HTML レポートを有効にし、失敗ケースのトレースを保持します。

```bash
pnpm test:e2e --reporter=html --trace=retain-on-failure
```

アプリケーションのアドレスとアカウントは、引き続きプロジェクトの設定に従って準備します。レポートは `playwright-report/` に出力され、トレースで操作前後の画面状態やネットワークリクエストを確認できます。[Playwright のレポート](https://playwright.dev/docs/test-reporters)と [Trace Viewer](https://playwright.dev/docs/trace-viewer-intro)を参照してください。

**例：商品の作成と公開**

[サンプルのソースコードと実行](#サンプルのソースコードと実行)の手順でアプリケーションを起動します。`pnpm run setup` が編集者と読み取り専用のアカウントを作成し、認証情報をローカルの `storage/demo.json` に保存します。この例では `APP_URL` にベースパスを含む完全な URL を指定します。次のアドレスを実際のものに置き換えてください。

```bash
pnpm exec playwright install chromium
APP_URL='http://<host>:13320/main' pnpm test:e2e tests/playwright/products.test.ts
```

ケースはローカルの認証情報を読み込んで実際にログインします。一意な名前の商品を作成し、再読み込みで下書きの存在を確認してから、公開して再度読み込みます。

```ts
await page.getByLabel('Product name', { exact: true }).fill(name);
await page.getByLabel('Price in cents', { exact: true }).fill('2400');
await page.getByRole('button', { name: 'Create draft', exact: true }).click();
await expect(page.getByText('Draft created.', { exact: true })).toBeVisible();
await page.reload();
const row = page.getByRole('row').filter({ hasText: name });
await expect(row).toContainText('Draft');
await row.getByRole('button', { name: 'Publish', exact: true }).click();
await expect(row).toContainText('Published');
await page.reload();
await expect(row).toContainText('Published');
```

![公開後に再読み込みしても Published のままになる。](/assets/core/testing-acceptance/testing-products-published.png)

読み取り専用アカウントには作成・公開の操作が表示されず、作成 API を直接呼んでも `403` になります。別のケースでは失敗と遅延を注入して、入力保持、再試行、送信中の状態を確認します。画面の状態は [client テスト](#clientコンポーネントの操作と状態)を参照してください。

![読み取り専用アカウントは商品を閲覧できるが、作成・公開はできない。](/assets/core/testing-acceptance/testing-products-viewer.png)

作成した商品は確認用に保持されるため、専用のテストインスタンスで実行してください。[ブラウザーテスト全体](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/playwright/products.test.ts)。

### Agent による自律検証

Agent による自律検証は、開発中に行うブラウザーでの確認です。Agent が変更内容と現在の画面状態に応じて操作を選び、結果を観察し、問題を修正して再度確認します。ブラウザー自動化ツールを利用できますが、すべての操作経路を先に保守対象の Playwright ケースへ書き起こす必要はありません。

**開発中の主体的な確認**

NocoBase アプリケーション開発 Skill の[フロントエンドワークフロー](https://github.com/nocobase/nocobase/blob/139e754fd526313ec36b8a31c5f99ee45a06467f/packages/app/app-skills/skills/nocobase-app-development/references/frontend/ui-workflow.md)では、実行時に見える変更について、変更した要素と関連操作を確認するよう定めています。新しいページでは、実際の操作、保存と再読み込み、権限、関連する空状態やエラー状態も検証します。

この Skill に従い、ブラウザーツールとログイン済みセッションが利用できる開発環境では、画面検証を開発完了前の作業に含めます。利用者がすべてのクリック手順を列挙するのを待つのではなく、Agent が変更内容から確認範囲を選びます。ブラウザー操作の能力は Agent の実行環境が提供するもので、app-testing 自体の機能ではありません。

**操作、原因の特定、再検証**

商品作成フォームの変更なら、商品ページを開き、入力・送信して表示と一覧を確認し、再読み込みで保存を確かめます。権限を変更した場合は、読み取り専用アカウントでも操作入口を確認します。送信状態を変更した場合は、待機、失敗、再試行も確認します。関連する状態は [client の例](#clientコンポーネントの操作と状態)を参照してください。

ボタンが反応しない、データが更新されない、画面にエラーが出る場合は、画面状態、コンソールエラー、ネットワークリクエスト、サーバーログを使って原因を特定します。修正後は元の再現手順を繰り返し、影響を受ける周辺操作も確認します。スクリーンショットだけでは、送信、永続化、権限の動作を証明できません。

**実際の検証結果を残す**

Agent の完了報告には、訪問したページ、使用したロール、実施した操作、観察結果、修正後の再確認を記載し、必要に応じて重要な状態のスクリーンショットを残します。

ブラウザーが使えない、アプリケーションが起動しない、ログインセッションがない場合は、障害と未検証項目を明示します。今回発見した問題のうち、継続して回帰を防ぐ必要があるものは、固定のテストケースにも追加します。

### 手動検証

手動検証では、開発者、テスト担当者、業務利用者がアプリケーションを直接操作し、フロー、操作入口、フィードバックが実際の仕事に適しているか判断します。Agent の記録を参考にできますが、利用者自身が必要な場面を確認することも重要です。

**ロールごとに業務フローを確認する**

対象のアプリケーションバージョン、環境、アカウント、データを用意します。管理者だけでなく、実際の業務ロールを持つアカウントを使ってください。各シナリオの前提条件、操作、期待結果を明確にしてから、ページ間の移動やロール間の引き継ぎも含め、日常の順序でフロー全体を操作します。

商品管理なら、次のような場面を記録できます。表は期待結果を示しており、実行後に観察した結果を別途記入します。

| ロールと前提条件 | 操作 | 期待結果 |
| --- | --- | --- |
| 編集者がログイン済み | 商品を作成して再読み込みする | 商品が残り、下書き状態になっている |
| 編集者が下書き商品を持っている | 公開してから公開カタログを開く | 公開済みに変わり、公開カタログで見つかる |
| 読み取り専用アカウントでログイン済み | 商品ページを開いてレコードを閲覧する | 閲覧でき、作成・公開の操作入口がない |

画面の表示と実際のデータが一致することを確認し、異なるアカウントで見えるデータがそれぞれの担当範囲に合っているかを確かめます。

各シナリオに「操作、期待結果、実際の結果、成功または失敗」を記録します。問題があれば、アプリケーションのバージョン、ロール、関連データ、再現手順を添え、必要に応じてスクリーンショットやエラー情報も残します。

**操作性とエラー処理の確認**

通常のフローに加え、ユーザーが行いそうな操作や中断も試します。

| 場面 | 確認する点 |
| --- | --- |
| 必須項目の不足や不正な入力 | 問題箇所が示され、修正方法が分かるか |
| キャンセル、戻る操作、ページへの再アクセス | 状態が適切で、未保存の入力が妥当に扱われるか |
| 連続クリックや遅いリクエスト | 待機中の表示があり、重複送信や重複レコードを防げるか |
| リクエスト失敗後の再試行 | 入力が保持され、エラーが理解でき、復旧後に操作を続けられるか |
| 必要な画面サイズやキーボード操作 | 内容が欠けず、フォーカス順と操作入口が使いやすいか |

失敗や遅延は、ブラウザー開発ツールでネットワーク条件を変えるなど、制御できるテスト環境で再現し、終了後に設定を戻します。サンプルの確定的な失敗と遅延は自動テストで制御しています。[client テスト](#clientコンポーネントの操作と状態)と [Playwright テスト](#playwright-による自動検証)を参照してください。

実際の利用者に、業務用語、操作順、フィードバックが日常業務に合っているか確認してもらいます。新たな発見はシナリオに追加し、安定して再現できて繰り返し確認する必要があるものは自動化します。

変更後は元の問題を再確認し、関連する正常フローと他の影響を受けるロールの操作も確認します。バージョン、設定、データベース、ブラウザー環境が変わった場合は、対象環境で重要なシナリオを再検証して記録を更新します。

## サンプルのソースコードと実行

[商品管理サンプル App](https://github.com/nocobase/docs-examples-v3/tree/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance)は `nocobase/docs-examples-v3` にあります。このページのリンクは同じ固定コミットを参照します。Node.js 24 と pnpm 11.11.0 を使用します。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 3e886903c7965530dd6ca50c7840d6ae991f2799
cd apps/testing-acceptance
npm pkg set packageManager=pnpm@11.11.0
pnpm install --frozen-lockfile
pnpm run setup
pnpm dev
```

開発コマンドに表示された完全な URL を開き、**Products** に移動します。`storage/demo.json` にある編集者または読み取り専用アカウントでログインしてください。`setup` は既存の設定とアカウントを保持し、再実行してもデータをリセットしません。生成された認証情報、設定、データベースはコミットしないでください。

編集者は **Product name** と **Price in cents** を入力して **Create draft** をクリックし、行内の **Publish** で公開します。ページは最初の 50 件を表示します。公開カタログは公開済み商品だけを表示し、HTTP CSV は現在のアカウントのデータ権限に従い、CLI JSON は公開商品だけを出力します。データは再読み込みや再起動後も保持されます。

[README](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/README.md)には、LAN アクセス、デプロイ用ビルド、すべてのテストコマンド、ドキュメントの用法とソース・検証結果の対応関係があります。検証済みのデータベースは SQLite です。他のデータベース、ブラウザーエンジン、複数プロセスでの実行は未検証です。依存バージョン、実行記録、スクリーンショットの作成方法も README に記載しています。
