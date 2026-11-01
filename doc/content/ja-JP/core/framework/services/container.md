---
title: サービスコンテナ
---

サービスコンテナは、利用側と組み立てを切り離します。利用側はインターフェースとトークンに依存し、アプリの組み立てが実装を選びます。クライアントとサーバーの両方がこの仕組みを使い、それぞれ独立したインスタンスを持ちます。

## 登録と解決

```ts
import { ServiceContainer, createServiceToken } from '@nocobase/service-provider';

interface Titles { normalize(value: string): string }
const titlesToken = createServiceToken<Titles>('example.titles');
const container = new ServiceContainer();
container.singleton(titlesToken, () => ({ normalize: (value) => value.trim() }));

const titles = container.resolve(titlesToken);
console.log(titles.normalize('  Order  ')); // Order
```

この単独の例は独自のコンテナを作成します。アプリのコードでは、ページ、リクエスト、プラグインごとにグローバルなコンテナを作成するのではなく、既存の `app.container` を使います。

| メソッド | 動作 |
| --- | --- |
| `instance(token, value)` | 既存の値を結び付ける |
| `singleton(token, factory)` | 最初の解決時に同期で作成し、インスタンスを再利用する |
| `resolve(token)` | 解決する。依存関係がない場合や循環している場合は例外を投げる |
| `has(token)` | 作成せずに結び付けがあるかを確認する |
| `resolveIfCreated(token)` | 既存のインスタンス、または `undefined` を返す |

## 依存関係を与える

シングルトンのファクトリーはリゾルバーを受け取ります。そこで依存関係を解決し、業務のコンストラクターに渡すと、テストではアプリのオブジェクトなしに代わりのものを渡せます。

ファクトリーは同期です。接続などの非同期のリソースは、Promise をサービスとして結び付けるのではなく、ServiceProvider のライフサイクルのフックで確立します。

## 範囲と失敗

シングルトンは 1 つのコンテナ内で 1 つという意味で、デプロイ全体やすべてのブラウザーのウィンドウで 1 つという意味ではありません。リクエストごとの範囲は自動では作られないため、身元、トランザクション、キャンセルのシグナルは明示的に渡します。

重複した結び付けと循環した依存関係は失敗します。失敗したファクトリーは、自動で再試行せずに失敗の状態を保ちます。復旧できる接続には、サービスの中で明示的な復旧の方針が必要です。

登録については [ServiceProvider](../../extension-development/service-provider.md) を、パッケージをまたぐ識別については [サービスの取り決めとトークン](tokens.md) を参照してください。

## インターフェースと実装

- [コンテナ](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/container.ts)
