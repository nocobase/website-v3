---
title: API Client
---

API Client は、アプリの HTTP のアドレス、認証情報、リクエストの形式をまとめて扱います。コンポーネントは、サーバーの URL を個別に組み立てるのではなく、設定済みのランタイムのクライアントを使うべきです。

## クライアントを取得して呼び出す

React のコンポーネントやフックでは `useApiClient()` を使います。通常のサービスには注入するか、`apiClientToken` を解決します。この例は、`{ data: [...] }` を返すサーバーの `/orders` エンドポイントを前提にしています。

```ts
import type { ApiClient } from '@nocobase/app-client';

type Order = { id: string; title: string };
export async function loadOrders(api: ApiClient, signal?: AbortSignal) {
  const response = await api.request<{ data: Order[] }>({
    method: 'GET',
    path: '/orders',
    query: { limit: 20 },
    signal,
  });
  return response.data;
}
```

`path` は設定された API のアドレスからの相対パスです。既定は GET と `credentials: include` です。オリジンをまたぐ Cookie と CORS は、引き続きブラウザーのポリシーに従います。

## リクエストとレスポンスの取り決め

| 必要なこと | インターフェース |
| --- | --- |
| クエリーのパラメーター | `query`。サポートされているスカラー値や配列の値を使う |
| JSON のボディ | `json` |
| FormData などのボディ | `body`。`json` とは同時に使えない |
| キャンセル | `signal` |
| 解析済みのレスポンス全体 | `request<T>()` |
| バイトストリーム | `stream()` |
| Repository のプロトコル | `repository(name)` |

ジェネリクスは期待するレスポンスを記述するだけで、実行時のデータは検証しません。`ApiClientError` を処理し、拒否、権限の失敗、キャンセル、再試行できるエラーを区別してください。

## リモートの Repository

リモートの Repository は照会のビルダーを提供しますが、サーバーのリソースと操作が明示的に公開されている必要があります。データベースの Repository とは別に実行され、認可はサーバーに残ります。データベースのサービス、認証情報、非公開の接続のモジュールを、ブラウザーのコードにインポートしないでください。

サーバーは `defineRepositoryApiRoutes()` でエンドポイントを宣言し、クライアントは `api.repository(name)` を使います。この名前は公開を識別するもので、コレクション名と異なることがあります。読み取りにも POST を使い、リモートの Repository はレスポンスの `data` を取り出します。完全な例は [Repository のデータ API](repository-routes.md) を参照してください。

## 状態と再試行

API Client はページのリクエストの状態を管理しません。古い結果が新しい検索を置き換えないよう、キャンセル、リクエストの識別、リクエストの状態を扱うライブラリーを使ってください。変更の再試行は、冪等性の意味がわかっている場合にだけ行います。タイムアウトは、実行されなかったことの証明にはなりません。

独立したスクリプトでは、`@nocobase/api-client` に直接依存し、`createApiClient({ baseURL })` を呼び出せます。アプリの型と入口は `@nocobase/app-client` からも再エクスポートされています。[API リファレンス](../../reference/api.md) を参照してください。

## インターフェースと実装

- [API Client](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/api-client/README.md)
- [クライアントのフック](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/src/hooks.ts)
