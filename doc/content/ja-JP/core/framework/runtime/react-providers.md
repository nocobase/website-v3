---
title: React の Provider の登録とマウント
---

React の Provider は、フォーム、テーマ、共有の操作の状態など、ページのツリーのコンテキストを提供します。`children` を受け取る React コンポーネントで、アプリのサービスを登録する ServiceProvider とは役割が異なります。

## Provider を宣言する

このモジュールをアプリの集約の入口に置くか、プラグインの `reactProviders` で提供します。

```tsx
import { createContext, useState, type PropsWithChildren } from 'react';
import { defineClientReactProviders } from '@nocobase/app-client/plugins';

export const CompactContext = createContext({
  compact: false,
  setCompact: (_value: boolean) => {},
});

function CompactProvider({ children }: PropsWithChildren) {
  const [compact, setCompact] = useState(false);
  return <CompactContext.Provider value={{ compact, setCompact }}>
    {children}
  </CompactContext.Provider>;
}

export default defineClientReactProviders([
  { name: 'orders.compact', layer: 'extension', component: CompactProvider },
]);
```

この例の設定はこの React のツリーの中にだけあり、再読み込みでリセットされます。保存が必要な場合は、ブラウザーのストレージや API を別に追加します。

## 順序とマウント

ランタイムは、`layer` と明示的な `before` / `after` の制約で、Provider を外側から内側へ並べます。別のコンテキストが実際に必要な場合は、固定の、衝突しない名前を使って順序を宣言します。

宣言を解決しても、コンポーネントは実行されません。Provider は、起動後にホストが `AppClientRoot` をレンダリングするときにマウントされます。エフェクトは購読を片付け、React の開発時の再マウントのチェックに耐える必要があります。

## サービスとの連携

アプリのサービスの登録とライフサイクルは ServiceProvider が担います。React の Provider はそれらのサービスを解決し、購読した状態をコンポーネント向けに合わせられます。レンダリング中に共有の接続を作成したり、`useService()` がオブジェクトの変化を購読すると考えたりしないでください。

コンテキストが使えること、更新後に再レンダリングされること、アンマウント時に後片付けされることをテストします。切り離されたページのツリーを作るのではなく、既存の集約の入口を拡張してください。

続けて [クライアントのサービス](../services/integration.md#クライアントのサービス) と [コンポーネントとスタイル](../../extension-development/frontend-components.md) を読んでください。

## インターフェースと実装

- [React の Provider の取り決め](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
