---
title: React の Context と Provider
description: プラグインの表示の設定を定義し、React の Provider を提供して、共有の状態とマウントの範囲を確認します。
---

この記事では、お知らせのページにコンパクト表示の設定を追加し、`contexts.ts`、Provider のコンポーネント、`react-providers/` をつなぎます。状態は React が持ち、データベース、API、ServiceProvider は必要ありません。Context の一般的な使い方は [UI コンポーネントと操作](../developing-apps/pages-and-interactions.md) で、マウントと順序は [React の Provider の登録とマウント](../framework/runtime/react-providers.md) で扱います。

## 前提条件とファイル

[最初のプラグインを書く](write-your-first-plugin.md) の `@nocobase/app-plugin-announcements` を使います。必要なのはその Client の入口だけです。ファイルのパスはプラグインのルートからの相対パスで、コマンドはアプリのルートで実行します。既存のファイルと宣言にはマージし、ページ、ロケール、そのほかの提供内容を保ってください。

新しいプラグインでは `client.react-providers` を選べます。既存のプラグインでは、作り直さずにこれらのファイルを追加できます。`react` は互換性のある peer のままにし、ひな形の jsdom のテストの設定を使います。

## エージェントを使う場合

```text
お知らせのプラグインに、React Context で共有するコンパクト表示の設定を追加してください。
その Provider は reactProviders で提供し、既存のルートとロケールは保ってください。
この例の設定は永続化しません。再読み込みすると既定値に戻ります。
利用側の間で更新が伝わることは、Hooks を使うコンポーネントの関数を直接呼び出すのではなく、
実際の Client のプラグインの宣言をレンダリングして確認してください。
```

## Context を定義する

`client/contexts.ts` を追加するか、既存のものにマージします。何もしない既定値で組み込みの誤りを隠すのではなく、Provider がない場合は明示的に報告します。

```ts
import { createContext, useContext, type Context } from 'react';

export interface AnnouncementDisplay {
  readonly compact: boolean;
  readonly setCompact: (value: boolean) => void;
}
export const AnnouncementDisplayContext: Context<AnnouncementDisplay | undefined> =
  createContext<AnnouncementDisplay | undefined>(undefined);

export function useAnnouncementDisplay(): AnnouncementDisplay {
  const value = useContext(AnnouncementDisplayContext);
  if (!value) throw new Error('AnnouncementDisplayProvider is required.');
  return value;
}
```

## Provider を実装する

状態は `client/components/provider.tsx` で管理します。この Provider のインスタンスを利用する側は、その値を共有します。別のアプリや、さらに入れ子にした Provider は、別々の状態を持ちます。

```tsx
import { useMemo, useState, type PropsWithChildren, type ReactElement } from 'react';
import { AnnouncementDisplayContext, type AnnouncementDisplay } from '../contexts.js';

export function AnnouncementDisplayProvider({ children }: PropsWithChildren): ReactElement {
  const [compact, setCompact] = useState(false);
  const value = useMemo<AnnouncementDisplay>(
    () => ({ compact, setCompact }),
    [compact],
  );
  return (
    <AnnouncementDisplayContext.Provider value={value}>
      {children}
    </AnnouncementDisplayContext.Provider>
  );
}
```

この例は外部のリソースを持たないため、空の Effect は不要です。ブラウザーの購読を追加する場合は、Effect からクリーンアップを返し、開発時のマウントのチェックに対応させます。状態はブラウザー間で共有されず、再読み込みや Provider の再マウントでリセットされます。

## プラグインの提供内容を宣言して組み込む

React の Provider は `client/react-providers/index.ts` に集約します。

```ts
import {
  defineClientReactProviders,
  type AppClientReactProviderDefinition,
} from '@nocobase/app-client/plugins';
import { AnnouncementDisplayProvider } from '../components/provider.js';

const reactProviders: readonly AppClientReactProviderDefinition[] = defineClientReactProviders([
  {
    name: 'announcements-display',
    layer: 'extension',
    component: AnnouncementDisplayProvider,
  },
]);
export default reactProviders;
```

提供内容の名前には、`@` や `/` を含むパッケージのパスではなく、`announcements-display` のような安定した名前を使います。プラグインとの所有関係は、ランタイムが別に追跡します。順序は、Provider が実際にほかの Context に依存する場合にだけ、フレームワークのルールに従って宣言します。

`client/plugin.ts` でこの集約をインポートし、既存の `defineClientPlugin()` の宣言に `reactProviders` を追加します。`packageName`、`routes`、`locales`、既存のサービスは保ちます。`client/index.ts` のファクトリーのエクスポートもそのままにします。アプリの `client/plugins.ts` でそのファクトリーを登録すると、Provider がアプリのツリーと一緒にマウントされます。

コンポーネントは `useAnnouncementDisplay()` で `compact` と `setCompact` を読み取ります。お知らせのページは、`compact` をリストに渡し、プラグインの翻訳を使った既存の shadcn のコントロールから `setCompact()` を呼び出せます。ページを Provider の別のコピーで手動で囲まないでください。別々の状態ができてしまいます。

アプリやほかのプラグインに Hook を公開するには、既定のエクスポートを保ったまま、`client/index.ts` に次の名前付きエクスポートを追加します。

```ts
export { useAnnouncementDisplay } from './contexts.js';
```

Hook をインポートしても、その Provider はマウントされません。利用側がプラグインを登録する必要があります。[プラグインの宣言と公開のエクスポート](plugin-declarations.md) を参照してください。

## 共有の状態と組み込みを確認する

Provider の関数を直接呼び出すひな形のテストは置き換えます。Provider は Hooks を使うようになったため、React でレンダリングする必要があります。次を `tests/client/react-provider.test.tsx` として保存します。ここでのネイティブのボタンはテスト用の利用側で、本番の UI の例ではありません。

```tsx
import { fireEvent, screen } from '@testing-library/react';
import { renderWithApp } from '@nocobase/app-testing/client';
import type { ReactElement } from 'react';
import { expect, it } from 'vitest';
import plugin from '../../client/index.js';
import { useAnnouncementDisplay } from '../../client/contexts.js';

function Consumer({ id }: { id: string }): ReactElement {
  const { compact, setCompact } = useAnnouncementDisplay();
  return <button onClick={() => setCompact(!compact)}>{id}:{String(compact)}</button>;
}

it('shares display state through the registered plugin Provider', async () => {
  const view = await renderWithApp(<><Consumer id="a" /><Consumer id="b" /></>, {
    plugins: [plugin()],
  });
  fireEvent.click(screen.getByText('a:false'));
  expect(screen.getByText('a:true')).toBeDefined();
  expect(screen.getByText('b:true')).toBeDefined();
  view.unmount();
});
```

登録がない場合の失敗、再マウント後の既定値、追加した購読のクリーンアップも確認してください。`renderWithApp()` はすでにアプリとルーターの Context を提供しているため、Router を追加しないでください。

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

組み込みを追加または確認するときに登録のコマンドを実行し、既存のエントリーは保ちます。テストで確認できるのは、Context の組み込みと状態の更新です。表示の密度、ナビゲーション、テーマの動作は、実際のページでも確認してください。
