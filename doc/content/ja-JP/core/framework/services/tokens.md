---
title: サービスの取り決めとトークン
---

サービスの取り決めは利用側が何をできるかを定め、トークンはコンテナの中でその実装を見つけます。両方を公開のモジュールからエクスポートすると、アプリ、プラグイン、テストは、非公開のクラスをインポートせずに取り決めを共有できます。

## 固定の入口

```ts
import { createServiceToken } from '@nocobase/service-provider';

export interface TitleService {
  normalize(value: string): string;
}

export const titleServiceToken =
  createServiceToken<TitleService>('@example/orders/title-service');
```

利用側が `TitleService` に依存していれば、実装は変えられます。取り決めとトークンは、提供側の公開のクライアントまたはサーバーの入口から再エクスポートし、利用側ではそのパッケージを依存関係として宣言します。

## 名前は識別子ではない

`createServiceToken()` を呼び出すたびに、新しいオブジェクトが作られます。文字列が同じでも、トークンが同じになるわけではありません。作り直すのではなく、元のエクスポートされたトークンをインポートしてください。

重複したインストール、非公開の深いインポート、バンドルによって、実行時のコピーが複数できることがあります。共有の依存関係は peer の範囲でそろえ、重複とパッケージの exports を確認してください。

## 取り決めの設計

業務データを返し、非同期の動作、エラー、リソースの所有を明記します。すべてのメソッドで Application 全体、Hono の Context、コンポーネントのインスタンスを要求すると、サービスがホストに結び付いてしまいます。

クライアントとサーバーでデータの型は共有できますが、トークンがネットワーク越しに解決されることはありません。ブラウザーのサービスは、API クライアントでリモートの操作を実装します。共有のインターフェースが、サーバーの非公開の依存関係をブラウザーのバンドルに引き込んではいけません。

## 進化と代わりのもの

必須の新しいメソッドや、戻り値の意味の変更は利用側に影響するため、バージョンとテストを調整する必要があります。コンテナは重複した結び付けを拒否します。動いている登録を上書きするのではなく、組み立ての段階でテスト用の代わりのものを選んでください。

続けて [コンテナ](container.md)、[クライアントのサービス](integration.md#クライアントのサービス)、[サーバーのサービス](integration.md#サーバーのサービス) を読んでください。

## インターフェースと実装

- [トークンの識別](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/token.ts)
- [コンテナの結び付け](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/container.ts)
