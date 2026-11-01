---
title: ルートと HTTP の API
description: 検証、レスポンスの取り決め、アクセス制御、テストを備えたプラグインのエンドポイントを追加します。
---

プラグインの API は、リクエストを受け取り、入力とアクセスを検証してから、業務ロジックを呼び出します。この例ではお知らせのテキストをプレビューします。前後の空白を取り除き、テキストとその文字数を返すだけで、何も保存しません。

標準的なコレクションの照会や単純な書き込みには、[`defineRepositoryApiRoutes()`](../framework/http/repository-routes.md) を使い、その提供内容をプラグインの `routes` に追加します。この仕組みはアプリとプラグインで共通です。このガイドでは独自の業務のエンドポイントを示します。

## エージェントを使う場合

```text
このアプリに、お知らせのテキストをプレビューするエンドポイントを持つ notice-api プラグインを作成してください。
このリクエストで渡されたテキストだけを処理し、業務データを読み取らず、何も保存しないため、公開してかまいません。
長さを検証し、標準のレスポンスとエラーを使い、API のドキュメントとテストを用意してから、登録してください。
```

## プラグインを用意する

コマンドは既存のアプリのルートで実行します。ファイルのパスは `packages/app-plugin-notice-api/` からの相対パスです。その名前のプラグインがすでにある場合は、生成し直さずに確認してください。

```bash
pnpm create @nocobase/plugin@beta notice-api --with server.routes --with server.service-providers
```

アプリにすでにインストールされている互換性のあるバージョンを使って、プラグインの `dependencies` に `zod` を追加し、アプリのルートで `pnpm install` を実行します。ひな形は `hono` と実行時の取り決めを設定します。その Provider の集約、Server の宣言、公開の入口は保ってください。

## プレビューのサービスを用意する

`server/tokens.ts` を取り決めと Token で置き換えます。

```ts
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface NoticePreview {
  readonly text: string;
  readonly length: number;
}
export interface NoticeApiService {
  preview(text: string): NoticePreview;
}
export const noticeApiServiceToken: ServiceToken<NoticeApiService> =
  createServiceToken<NoticeApiService>(
    '@nocobase/app-plugin-notice-api/service',
  );
```

`server/services/notice-api.ts` を置き換えます。

```ts
import type { NoticePreview, NoticeApiService } from '../tokens.js';

export class DefaultNoticeApiService implements NoticeApiService {
  public preview(text: string): NoticePreview {
    const normalized = text.trim();
    return { text: normalized, length: Array.from(normalized).length };
  }
}
```

生成された Provider は、すでに `noticeApiServiceToken` をこの実装に結び付けています。ルートの中で別のコンテナを作らないでください。サービスは HTTP とは独立してテキストを処理します。[ServiceProvider](service-provider.md) を参照してください。数えるのは Unicode のコードポイントで、ユーザーが認識する文字の数ではありません。

## 入力、出力、ルートを宣言する

`server/routes/schemas.ts` を作成します。

```ts
import { z } from 'zod';
import type { NoticePreview } from '../tokens.js';

export const PreviewQuery: z.ZodObject<{ text: z.ZodString }> = z.object({
  text: z.string().trim().min(1).max(200),
});
export const PreviewSchema: z.ZodType<NoticePreview> = z.object({
  text: z.string(),
  length: z.number().int().nonnegative(),
});
```

入力は検証の前に前後の空白が取り除かれます。200 の上限には JavaScript の文字列の長さを使います。製品が見た目の文字単位で数える場合は、別のルールを定義してください。エクスポートするスキーマには、プラグインの `isolatedDeclarations` のビルドのために明示的な型が必要です。

`server/routes/index.ts` を置き換えます。

```ts
import type { ServiceContainer } from '@nocobase/service-provider';
export interface NoticeRoutesApplication {
  readonly container: ServiceContainer;
}
import {
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { noticeApiServiceToken } from '../tokens.js';
import { PreviewQuery, PreviewSchema } from './schemas.js';

export const apiRoutes: AppApiRouteContribution<NoticeRoutesApplication> =
  defineApiRoutes((app) => {
    const service = app.container.resolve(noticeApiServiceToken);
    const router = new Hono();
    router.onError(apiErrorHandler);
    router.get(
      '/noticeApi/preview',
      describeRoute({
        tags: ['NoticeApi'],
        summary: 'Preview notice text',
        operationId: 'noticeApiPreviewText',
        security: [],
        responses: {
          200: dataResponse(PreviewSchema),
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('query', PreviewQuery),
      (context) => {
        const { text } = context.req.valid('query');
        return context.json({ data: service.preview(text) });
      },
    );
    return router;
  });
const routes: readonly AppApiRouteContribution<NoticeRoutesApplication>[] = [
  apiRoutes,
];
export default routes;
```

`NoticeRoutesApplication` は、ルートが使うコンテナの機能だけを宣言します。実際のアプリはこれを満たし、テストでは小さく完全なフィクスチャーを渡せます。

| 部分 | 役割 |
| --- | --- |
| `defineApiRoutes()` | アプリが自分の API の接頭辞のもとにルートをマウントできるようにする |
| `describeRoute()` | この例の公開のアクセスを含む OpenAPI の宣言を追加する |
| `apiValidator()` | 入力を検証し、失敗したら標準の 400 を返す。ハンドラーは `req.valid()` を読み取る |
| `dataResponse()` | `{ data }` を記述する。レスポンスを生成するものではない |
| `apiErrorHandler` | ルーターを単独でテストする場合も、標準のエラーを使う |

宣言したパスは `/noticeApi/preview` です。既定の `/main` のデプロイの接頭辞では、`/main/api/noticeApi/preview?text=Hello` を開きます。`useApiClient()` を使う Client は、サーバーの URL を直接書かずに `path: 'noticeApi/preview'` をリクエストします。

## 提供内容を集約してアプリに組み込む

`server/routes/index.ts` がエクスポートする配列は、`server/plugin.ts` の `routes` を通じてアプリに届きます。`serviceProviders` はプラグインのサービスを登録します。アプリは公開の Server の入口をインポートし、API の接頭辞とリクエストの環境を渡します。ルートを追加するときは既存の提供内容を保ってください。ファイルだけでは集約の宣言になりません。

この例は単独で動くよう、プレビューのサービスを完全な形で持っています。公開の Token と複数の入口での再利用については [業務のサービスと ServiceProvider](server-services.md) を、共通のルールについては [リクエストの検証とエラー処理](../developing-apps/request-validation-and-errors.md) を参照してください。非同期の処理では、ハンドラーはルートのファクトリーの作成中ではなく、アプリの起動後に [バックグラウンドジョブの投入のサービス](background-jobs.md) を呼び出します。

## アクセスの境界を定義する

既存の認証、ロール、データのポリシーとの組み込みについては、[認証、権限、データ範囲](../developing-apps/authentication-and-permissions.md) を参照してください。

この例はユーザーや業務のレコードを読み取らず、状態も変えないため、匿名でのテキストのプレビューは意図したものです。`security: []` は API のドキュメントで認証を記述するもので、アクセスを強制するものではありません。それを行うのは Server のミドルウェアです。

内部向けのエンドポイントでは、`@nocobase/app-plugin-authentication` から元の `authenticationToken` をインポートし、対象のパスに `app.container.resolve(authenticationToken).required()` を設定して、`security: []` を削除します。認証のプラグインなど、追加した身元に関わるランタイムは、互換性のある peer の依存関係として宣言します。機密の操作には、明示的なリソースと操作の認可も必要です。認証、認可、入力の検証、業務ロジックの順に実行します。ページの認証で API を保護することはできません。

業務の失敗には、`NOT_FOUND` などのステータス、安定した `reason`、プラグインの `domain` を持つ `ApiError` を投げます。エラーの JSON を手で組み立てたり、スタックや認証情報を露出したりしないでください。保護された操作では、匿名、拒否、許可の各呼び出し元をテストします。

## テストして登録する

`tests/server/routes.test.ts` の空のルートのアサーションを置き換えます。

```ts
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';
import { apiRoutes } from '../../server/routes/index.js';
import { NoticeApiProvider } from '../../server/providers/notice-api.js';

async function createRouter() {
  const container = new ServiceContainer();
  new NoticeApiProvider({ container }).register();
  return apiRoutes.createRouter({ container });
}
describe('notice preview API', () => {
  it('previews public text without persisting it', async () => {
    const router = await createRouter();
    const response = await router.request(
      '/noticeApi/preview?text=%20Hello%20',
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { text: 'Hello', length: 5 },
    });
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Notice Tools', version: '1' },
    });
    expect(document.paths?.['/api/noticeApi/preview']?.get).toBeDefined();
  });
  it.each(['', '?text=', `?text=${'a'.repeat(201)}`])(
    'rejects invalid input %s',
    async (query) => {
      const router = await createRouter();
      const response = await router.request(`/noticeApi/preview${query}`);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { reason: 'INVALID_INPUT' },
      });
    },
  );
});
```

生成された `tests/server/service-provider.test.ts` も置き換え、プレビューの動作を確認します。プラグインに引き続き合っている、ほかの生成されたテストは残します。

```ts
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';
import { NoticeApiProvider } from '../../server/providers/notice-api.js';
import { noticeApiServiceToken } from '../../server/tokens.js';

describe('notice service', () => {
  it('registers a lazy singleton and normalizes text', () => {
    const container = new ServiceContainer();
    new NoticeApiProvider({ container }).register();
    expect(container.resolveIfCreated(noticeApiServiceToken)).toBeUndefined();
    const service = container.resolve(noticeApiServiceToken);
    expect(service.preview('  欢迎 👋  ')).toEqual({
      text: '欢迎 👋',
      length: 4,
    });
    expect(container.resolve(noticeApiServiceToken)).toBe(service);
  });
});
```

```bash
pnpm --filter @nocobase/app-plugin-notice-api format
pnpm --filter @nocobase/app-plugin-notice-api check
```

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-api --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-api --no-install
```

アプリを起動するか再起動します。上の URL は `{"data":{"text":"Hello","length":5}}` を返すはずです。入力がない、空白だけ、長すぎる場合は 400 を返します。サインインしたあと、`/main/api/swagger/docs` で宣言を確認します。必要に応じてデプロイの接頭辞を調整してください。

アプリの `pnpm build` を実行します。ルーターのテストでは、デプロイの接頭辞、アプリ全体のミドルウェア、実際のサインインは確認できません。それらはアプリで確認してください。[テストと検証](testing-and-verification.md) を参照してください。
