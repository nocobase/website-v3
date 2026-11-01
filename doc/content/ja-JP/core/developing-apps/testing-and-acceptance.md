---
title: テストと検収
description: アプリを中心にクライアント、サーバー、データベース、コマンドライン、ブラウザーのテストを整理し、ビルドのチェックと機能の検収を完了します。
---

テストは、変更する動作を中心に整理します。コンポーネントのテストは操作を、サーバーのテストは API と権限を、データベースのテストはスキーマとレコードを、コマンドのテストは CLI の動作を、ブラウザーのテストはユーザーの一連の流れを対象にします。動作を検証できるテストの層を選び、必要に応じてアプリへの組み込みと手動のチェックを加えます。

このガイドでは、既定のアプリテンプレートのテスト設定を使います。既存のプロジェクトの設定、エイリアス、セットアップファイルは残してください。例で参照される業務ファイルは、先にリンク先のガイドで作成しておきます。

## テストのディレクトリとコマンド

テストはアプリのルートの `tests/` ディレクトリに置き、ソースコードの責任ごとに整理します。ディレクトリは必要に応じて作成し、テストには `*.test.ts` または `*.test.tsx` という名前を付けます。

```tree
my-app/
├── tests/
│   ├── client/          # Pages, components, Hooks and client services
│   ├── server/          # HTTP APIs, business services and permissions
│   ├── database/        # Migrations, Seeds, queries and transactions
│   ├── cli/             # Application commands
│   ├── project/         # Project configuration and build artifacts
│   ├── fixtures/        # Test data and fixture applications
│   ├── helpers/         # Shared test helpers
│   ├── setup/           # Test environment setup
│   └── playwright/      # Browser tests (optional)
├── vitest.config.ts
└── playwright.config.ts
```

既定のテンプレートの Vitest の設定には 2 つのプロジェクトがあります。`client` は jsdom ベースのアプリ環境を使い、`tests/client/` のテストを見つけます。`node` は `tests/server/`、`tests/database/`、`tests/cli/`、`tests/project/` のテストを見つけます。Playwright はブラウザーのテストを別に実行します。

アプリのルートで実行します。

```bash
pnpm test
pnpm test --project client
pnpm test --project node tests/database/app-statuses.test.ts
pnpm test:watch
pnpm test:coverage
```

3 つ目のコマンドは、下で作成するデータベースのテストを対象にしています。ほかのファイルは実際のパスで選びます。カテゴリーごとに設定ファイルを用意する必要はありません。

`@nocobase/app-testing` は次の公開の入口を提供しています。

| 入口 | 主なヘルパー | 用途 |
| --- | --- | --- |
| `/client` | `renderWithApp()`、`answerApi()` | アプリのサービスを使うコンポーネントをレンダリングし、HTTP のレスポンスを制御する |
| `/server` | `createAppTest()`、`createTestApp()` | 分離したデータベースでアプリを起動し、実際の API とプラグインの組み込みをテストする |
| `/server` | `createDatabaseTest()`、`describeMigration()` | アプリ全体を起動せずに、データベースの動作とマイグレーションをテストする |
| `/cli` | `bindAppCommand()`、`runAppCommand()`、`createTestAppConfig()`、`bindTestAppCommand()` | コマンドを実行して出力を取得し、必要に応じて分離したアプリの設定を用意する |

`/database` や `/playwright` の入口はありません。ブラウザーのテストは `@playwright/test` を直接使います。

> [!NOTE]
> 既定のテンプレートでは、Vitest はテストが見つからなくても正常終了し、`test:e2e` には `--pass-with-no-tests` が含まれています。正常終了しても検収できたことにはなりません。レポートのファイル名、テスト数、スキップされたケースを確認してください。テストの実行を必須にする CI では、対応するオプションを無効にできます。

## クライアントのテスト

テストは `tests/client/` に置き、実際のページ、コンポーネント、フック、サービスをインポートします。アプリのサービスを使うコンポーネントでは、`renderWithApp()` がクライアントのランタイム、ルーター、API Client、翻訳の環境を用意し、`answerApi()` が API のレスポンスを制御します。

ページの動作に合ったアサーションを選びます。

| シナリオ | 確認すること |
| --- | --- |
| 読み込みと空のデータ | 読み込み中であることがわかる。空の結果には明確なメッセージがあり、古いデータを表示しない |
| 送信の成功 | リクエストのメソッド、パス、ペイロードが正しい。確認の表示と一覧の更新が正しい |
| 失敗と再試行 | エラーが理解できる。再試行で古いエラーが消え、成功後に操作が戻る |
| 送信中 | ボタンが無効になるか、重複したリクエストが防がれる。成功が早く表示されない |
| ルートとフィルター | URL のパラメーター、ページネーション、戻る操作の整合性が保たれる |
| 権限とセッション | 使えない操作が正しく扱われる。セッションが切れるとサインインを求める |
| 多言語化 | 少なくともアプリが主にサポートする言語で、実際の言語リソースが動作する |

`useApiClient()`、翻訳、ルーティングは実物のままにし、レスポンスは HTTP の境界で用意します。`answerApi()` は `tasks` のような `/api/` 以下のパスを受け取ります。ステータスコードを選ぶときは `Response` を返します。想定外のリクエストは明示的に失敗させ、間違ったパスがたまたま成功のレスポンスを受け取らないようにします。

`renderWithApp()` はテストの中で呼び出します。ケースが終わるとクライアントのアプリを終了します。テンプレートの React の環境と DOM の後片付けは残し、コンポーネントを別の Router で包まず、厳格な翻訳のチェックは有効のままにします。クリックは `waitFor()` の外で行い、そのコールバックはアサーションにだけ使います。

クライアントの業務サービスでは、まずインスタンスを作成してメソッドをテストし、次に実際のコンテナを使って登録、購読、リソースの後片付けを確認します。React の Provider をテストするときは、実際の React コンポーネントをインポートします。その組み込みは、サービスコンテナの ServiceProvider とは異なります。[クライアントのサービス](client-business-services.md) と [UI コンポーネントと操作](pages-and-interactions.md) を参照してください。

[クライアントのテスト例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/client/page.md) には、リクエスト、再試行、重複送信の完全なチェックが含まれています。テンプレートの `tests/client/page-harness.test.tsx` では、権限、日付の書式、ルートのダイアログも示しています。レスポンスを制御したコンポーネントのテストでは、サーバーの認可やデータベースへの保存は確認できません。それらの境界には、実際のアプリのテストを使います。

## サーバーのテスト

サービスの計算と分岐は直接テストします。動作がプラグインの登録、サインイン、認可、マイグレーション、HTTP のミドルウェアに依存する場合は、`createAppTest()` で実際のアプリを起動します。

この例では、既定のテンプレートのユーザー API を使ってフィクスチャーを示します。認証、認可、ユーザーのプラグインと、既定の管理者のポリシーがそのまま残っていることを前提にしています。`tests/server/users.test.ts` を作成します。

```ts
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createAppTest } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
  },
});

test('rejects an anonymous request', async ({ request }) => {
  expect((await request('/users')).status).toBe(401);
});

test('reads the administrator after sign-in', async ({ testApp }) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch(
    `/users?q=${encodeURIComponent(admin.user.email)}`,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    data: expect.arrayContaining([
      expect.objectContaining({ id: admin.user.id }),
    ]),
  });
});
```

```bash
pnpm test --project node tests/server/users.test.ts
```

シークレットと管理者の設定は、分離したテスト専用です。フィクスチャーは、アプリとプラグインのマイグレーションとシードをインストールし、一時的なストレージを用意し、アプリを自動で終了します。リクエストは HTTP ポートを待ち受けずにプロセス内で実行され、`request('/users')` はアプリの API ルートに届きます。

既定では、`createAppTest()` はファイル内で 1 つのアプリとデータベースを共有します。ケースごとに別のアプリをインストールするには、`scope: 'test'` を設定します。状態を共有する場合は、ケースごとに専用のレコードを使い、テストの順序に依存しないようにします。アプリが所有する接続は、`['main', 'analytics']` のようにすべて `connections` に列挙します。列挙しない接続は、アプリの設定のままになります。

この 2 つのケースは、サインインの境界を示すだけです。業務 API では、実際のルートに置き換えて、次を網羅します。

- 匿名の呼び出し元、認証済みだが権限のない呼び出し元、権限のある呼び出し元。公開のルートは、それぞれのアクセスポリシーに照らして評価します。
- 無効な引数、存在しないレコード、許可されていない状態。実際のエラーレスポンスの構造も含めます。
- 書き込み後に改めて読み取り、レコードと関連データが保存されていることを確認する。失敗後に部分的な書き込みがないこと。
- 一覧、詳細、統計でのデータ範囲。一般ユーザーがほかのユーザーのデータにアクセスできないこと。

ページの入口を隠しても、API の認可は確認できません。初期のロールや認可のシードを変更するときは、テンプレートの `tests/server/authorization-assignment-safety.test.ts` も実行します。身元と権限の完全なケースについては、[サーバーのテスト例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/server/routes.md) を参照してください。

## データベースとコマンドラインのテスト

### データベース

データベースのテストは `tests/database/` に置きます。マイグレーションには `describeMigration()` を、照会、制約、シードの結果、トランザクションには `createDatabaseTest()` を使います。どちらも `@nocobase/app-testing/server` からインポートします。

[テーブルを作成してデータを初期化する](data-models-and-migrations.md) の `appStatuses` の例を自分のアプリに追加したら、`tests/database/app-statuses.test.ts` を作成します。単独の Database basics アプリには、より完全なテストがすでに含まれているので、それを使う場合はそのまま残してください。ここでは最小限の形を示します。

```ts
import { fileURLToPath } from 'node:url';
import {
  createDatabaseTest,
  describeMigration,
} from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import packageMetadata from '../../package.json' with { type: 'json' };

const migrations = [{
  packageName: packageMetadata.name,
  directory: fileURLToPath(
    new URL('../../database/main/migrations/', import.meta.url),
  ),
}];
const seeds = [{
  packageName: packageMetadata.name,
  directory: fileURLToPath(
    new URL('../../database/main/seeds/', import.meta.url),
  ),
}];

describeMigration('202611040001_create_app_statuses', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    await expectCollection('appStatuses').toHaveField('code', {
      type: 'string',
      nullable: false,
    });
    await expectCollection('appStatuses').toHaveField('title', {
      type: 'string',
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('appStatuses').not.toExist();
  },
});

const test = createDatabaseTest({ migrations, seeds });

test('installs the default statuses', async ({ connection }) => {
  const statuses = connection.repository('appStatuses');
  for (const record of [
    { code: 'draft', title: 'Draft' },
    { code: 'published', title: 'Published' },
  ]) {
    await expect(
      statuses.findOne({ filter: { code: record.code } }),
    ).resolves.toMatchObject(record);
  }
});
```

`describeMigration()` は、実際のデータベースでマイグレーションを適用し、ロールバックし、もう一度適用します。その `up` のアサーションは 2 回実行されます。既定では、`createDatabaseTest()` は各ケースの前にスキーマをリセットして、指定したマイグレーションとシードを実行し、終わったらデータベースを片付けます。アプリのプラグインは自動では読み込みません。プラグインのテーブルに依存する場合は、前提となるリソースの取得元を指定するか、アプリ全体のフィクスチャーを使います。

この例では、スキーマのロールバックと初期のインストールを検証します。既存のレコードがある場合や繰り返し実行した場合のシードもテストしてください。たとえば、管理者が編集したタイトルが保たれることです。トランザクションでは、失敗を起こしてから読み直し、すべての書き込みがロールバックされたことを確認します。データのマイグレーションでは、アップグレードの結果を確認する前に古いレコードを用意します。

`NOCOBASE_TEST_DB_DIALECT` はテストのダイアレクトを選び、既定は SQLite です。別のデータベースで検証するには、対応するドライバーをインストールし、そのドライバーが必要とするテスト用のサーバーを設定して、同じケースを実行します。たとえば：

```bash
NOCOBASE_TEST_DB_DIALECT=postgres pnpm test --project node tests/database/app-statuses.test.ts
```

テスト用のサーバーでは、分離したデータベースやスキーマの作成と片付けが許可されている必要があります。SQLite で合格しても、PostgreSQL やほかのダイアレクトでの動作は検証されません。接続の設定については [データベースのテスト例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/database/repository.md) を、トランザクションのアサーションについては [トランザクションとデータの整合性](transactions-and-consistency.md) を参照してください。

### コマンドライン

コマンドのテストは `tests/cli/` に置き、`cli/commands/` から実際のコマンドのクラスをインポートします。コマンドが必要とするものに応じてフィクスチャーを選びます。

| コマンドの動作 | テストのセットアップ |
| --- | --- |
| アプリを開かずに引数を解析したりファイルを扱ったりする | `bindAppCommand()` で一時的なアプリのルートとコマンド ID を結び付け、`runAppCommand()` で実行する |
| 実際のアプリのサービスやデータベースを使う | `createTestAppConfig()` で分離した設定を用意し、`bindTestAppCommand()` で結び付けて実行し、`finally` で `config.dispose()` を呼び出す |

`runAppCommand()` が返す `error`、`result`、`stdout`、`stderr`、`json()` を確認します。成功時の `exitCode` は `undefined` のことがあるため、`exitCode ?? 0` で正規化します。失敗のケースでは、0 以外の終了コードと、ドキュメントに記載されたエラーコードをアサートします。

[アプリのコマンドを書く](application-commands.md) のステータスのエクスポートでは、通常のエクスポートとファイルの内容、書き込まないドライラン、空の辞書、既存のファイルの保持、失敗後のリソースの後片付けを検証します。コマンドの発見やヘルプの出力だけでは、エクスポートが動作することは証明できません。

出力の取得はプロセス全体の状態を使うため、コマンドのケースは順番に実行します。データベースのコマンドには、実際のマイグレーションとシードの取得元も必要です。完全な [ファイルのコマンドのテスト](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/files.md) と [データベースのコマンドのテスト](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/command.md) を参照してください。

## ブラウザーテストと機能の検収

ブラウザーのテストは `tests/playwright/` に置きます。既定のテンプレートには Playwright の設定とコマンドが用意されているので、アプリの実際の機能のケースを追加します。先にテスト専用のアプリを起動し、`pnpm dev` が表示する完全な `Local:` の URL を使います。`/main/` などのベースパスも含めます。プロセス内のサーバーのフィクスチャーでは、ブラウザーからアクセスできる URL は用意されません。

このサインインのチェックは、既定の英語のログインページと、サインイン後のホームページにレベル 1 の見出しがあることを前提にしています。`tests/playwright/sign-in.test.ts` を作成し、画面が異なる場合はロケーターを調整します。

```ts
import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('signs in and keeps the session after reload', async ({ page }) => {
  const entry = process.env.APP_URL;
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  if (!entry || !username || !password) {
    throw new Error('Set APP_URL, E2E_USERNAME and E2E_PASSWORD.');
  }
  const appUrl = new URL(`${entry.replace(/\/+$/, '')}/`);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(new URL('login', appUrl).href);
  await page.getByLabel('Username or email').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(
    (url) => !url.pathname.replace(/\/$/, '').endsWith('/login'),
  );
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const session = await page.request.get(
    new URL('api/auth/get-session', appUrl).href,
  );
  expect(session.status()).toBe(200);
  await expect(session.json()).resolves.toMatchObject({
    user: { id: expect.any(String) },
  });
  expect(pageErrors).toEqual([]);
});
```

シェルまたは CI の環境で、テスト用のアプリの `APP_URL`、`E2E_USERNAME`、`E2E_PASSWORD` を設定してから実行します。

```bash
pnpm exec playwright install chromium
pnpm test:e2e tests/playwright/sign-in.test.ts
```

初回は Chromium をインストールします。`APP_URL` はたとえば `http://127.0.0.1:13000/main/` です。アプリの実際のアドレスを使ってください。コードは相対パス `login` を解決して、デプロイの接頭辞を保ちます。テスト専用のアカウントとデータを使い、認証情報は環境変数で渡します。ケース間でサインインを再利用するには、[セッションの保存の例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/playwright/login.md) を参照してください。

サインインは出発点にすぎません。業務の検収では、一連の操作を網羅すべきです。ページに移動し、データを入力して送信し、成功を確認し、再読み込みして改めて読み取り、権限のないアカウントで拒否されることを確認します。変更に応じて、戻る操作、ネットワークの失敗、モバイルのレイアウト、キーボードのフォーカス、ダイアログのスクロールのチェックを加えます。自動のアサーションは動作を、手動の検収はレイアウト、読みやすさ、操作の質を確認します。

## ビルドのチェックと引き渡しの基準

開発中は、まず影響を受けるファイルを実行し、失敗を解決したら関連するテストのグループに広げます。アプリのコードを引き渡す前に、変更とプロジェクトの要件に合ったチェックを行います。

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

既定のテンプレートの `pnpm check` は、パッケージのチェック、lint、フォーマット、型、Vitest、ビルドをまとめて行います。ブラウザーのテストは別に実行します。ドキュメントだけの変更では、アプリのテストをすべて繰り返さず、ドキュメントのリンクとビルドを確認します。

実際に実行したコマンド、テストファイルと結果、データベースのダイアレクト、ユーザーのロール、主要な流れを記録します。SQLite でしかテストしていない、ブラウザーのテストを実行していない、デプロイの成果物を確認していないなど、スキップしたことと検証していないことは明記します。それらのチェックを合格として報告しないでください。

**完了の目安**：変更した動作、データ、権限の境界に対応する検証があり、必要な型とビルドのチェックに合格し、ブラウザーが必要な流れが検収され、残っている制約が記録されていること。
