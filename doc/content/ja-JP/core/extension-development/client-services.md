---
title: クライアントのサービス
description: プラグインの Client のサービスを提供し、Token で共有して、変更の購読を React につなぎます。
---

複数のページでお知らせのリストを更新する必要がある場合、プラグインは変更の通知を提供できます。サービスは「保存済み」の通知を発行し、ページはデータを読み込んでフィードバックを表示します。この例では、1 つのブラウザーのアプリのインスタンスでリビジョン番号を保持します。保存、リクエストのキャッシュ、ブラウザー間の同期は実装しません。

アプリでの整理については [クライアントのサービス](../developing-apps/client-business-services.md) を、共通の仕組みについては [サービスコンテナ](../framework/services/container.md) を参照してください。この記事では、プラグインでの登録、公開の取り決め、React での購読を扱います。

## 前提条件とファイル

既存の `@nocobase/app-plugin-announcements` に Client のサービスを追加します。Context とデータベースの章は前提ではありません。パスはプラグインのルートからの相対パスです。新しいプラグインでは `client.service-providers` を選べます。既存のプラグインには、次のファイルと宣言をマージします。`@nocobase/service-provider`、React、Client のランタイムの互換性のある peer は保ってください。

## エージェントを使う場合

```text
お知らせのプラグインに Client の変更通知のサービスを追加し、元の Token で 1 つのインスタンスを共有してください。
ページへの通知は保存に成功したあとだけにし、失敗やキャンセルのあとには通知しないでください。
安定したスナップショットを返す useSyncExternalStore の Hook を用意し、アンマウント時に購読を解除し、
アプリの停止時には自分が所有するリスナーを解放してください。
Client の提供内容は保ち、実際の登録をテストしてください。
```

## サービスと Token を定義する

`client/services/changes.ts` を追加します。このディレクトリは実装を整理するもので、登録はしません。小さな例なので、取り決め、Token、実装を 1 つにまとめています。大きなプラグインでは分けてもかまいません。

```ts
import { createServiceToken, type ServiceToken } from '@nocobase/service-provider';

export interface AnnouncementChanges {
  getSnapshot(): number;
  subscribe(listener: () => void): () => void;
  notifySaved(): void;
}
export const announcementChangesToken: ServiceToken<AnnouncementChanges> =
  createServiceToken<AnnouncementChanges>('@nocobase/app-plugin-announcements/changes');

export class DefaultAnnouncementChanges implements AnnouncementChanges {
  private revision: number = 0;
  private readonly listeners: Set<() => void> = new Set();

  public readonly getSnapshot = (): number => this.revision;
  public readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  public notifySaved(): void {
    this.revision += 1;
    for (const listener of this.listeners) listener();
  }
  public dispose(): void {
    this.listeners.clear();
  }
}
```

`getSnapshot()` は通知があるまで同じ数を返し、React が変更を検出できるようにします。`subscribe()` は購読を解除する関数を返します。`dispose()` を呼び出すのは所有する Provider だけで、利用側の取り決めには含まれません。

## Provider で登録して解放する

`client/providers/announcements.ts` を追加するか、既存のものにマージします。

```ts
import type { ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';
import {
  DefaultAnnouncementChanges,
  announcementChangesToken,
} from '../services/changes.js';

export class AnnouncementChangesProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-announcements/changes';
  private changes: DefaultAnnouncementChanges | undefined;
  public override register(): void {
    this.app.container.singleton(announcementChangesToken, () => {
      this.changes = new DefaultAnnouncementChanges();
      return this.changes;
    });
  }
  public override async shutdown(): Promise<void> {
    this.changes?.dispose();
    this.changes = undefined;
  }
}
```

非公開の参照には、この Provider が実際に作成したインスタンスだけを記録します。停止時に、クリーンアップのためだけに未使用のサービスを解決することはなく、アプリの共有の API Client やほかのプラグインのリソースも解放しません。

`client/providers/index.ts` のコンストラクターの配列に `AnnouncementChangesProvider` を追加し、`client/plugin.ts` がその配列を `serviceProviders` として提供していることを確認します。ほかの Provider は保ちます。配列の中でクラスをインスタンス化したり、同じ Token に 2 つ目の実装を登録したりしないでください。共通の登録とライフサイクルのルールは [ServiceProvider](service-provider.md) で扱います。

## React から購読する

`client/hooks/use-announcement-revision.ts` を追加します。

```ts
import { useSyncExternalStore } from 'react';
import { useService } from '@nocobase/app-client';
import { announcementChangesToken } from '../services/changes.js';

export function useAnnouncementRevision(): number {
  const changes = useService(announcementChangesToken);
  return useSyncExternalStore(changes.subscribe, changes.getSnapshot, changes.getSnapshot);
}
```

`useService()` はインスタンスを解決するだけです。`useSyncExternalStore()` が購読し、利用側がアンマウントされたときに購読を解除します。ページは、リビジョンが変わったときに既存のデータのロジックで再読み込みでき、キャンセルや古いレスポンスの扱いも保てます。[データのリクエストと状態管理](../developing-apps/data-requests-and-state.md) を参照してください。

保存の入口で同じコンテナから `announcementChangesToken` を解決し、実際の保存が成功したあとに `notifySaved()` を呼び出します。`finally` の中で通知したり、通知を永続化の証拠として扱ったりしないでください。この章には書き込みのエンドポイントはありません。既存の認可された業務の API を使ってください。ほかのブラウザーやプロセスでの更新には、別の Server の通知の仕組みが必要です。

## 取り決めを公開してアプリに組み込む

`client/index.ts` のプラグインの既定のエクスポートは保ち、次を追加します。

```ts
export { announcementChangesToken } from './services/changes.js';
export type { AnnouncementChanges } from './services/changes.js';
export { useAnnouncementRevision } from './hooks/use-announcement-revision.js';
```

利用側は、公開の入口から元の Token や Hook をインポートし、アプリの `client/plugins.ts` でファクトリーを登録します。同じ文字列で Token を作り直さないでください。Hook をインポートしても、そのサービスは登録されません。パッケージのパスとコンパイル後の対応付けについては [公開のエクスポート](plugin-declarations.md#公開のエクスポート) を参照してください。

## 動作を確認する

動作のテストは `tests/client/service-provider.test.tsx` に置き、ほかの有効なテストは保ったまま、ひな形のアサーションを更新します。

```tsx
import { act, screen } from '@testing-library/react';
import { renderWithApp } from '@nocobase/app-testing/client';
import type { ReactElement } from 'react';
import { expect, it, vi } from 'vitest';
import plugin from '../../client/index.js';
import { announcementChangesToken } from '../../client/services/changes.js';
import { useAnnouncementRevision } from '../../client/hooks/use-announcement-revision.js';

function Revision({ id }: { id: string }): ReactElement {
  return <output data-testid={id}>{useAnnouncementRevision()}</output>;
}
it('shares revisions and releases listeners', async () => {
  const view = await renderWithApp(<><Revision id="a" /><Revision id="b" /></>, {
    plugins: [plugin()],
  });
  const changes = view.app.container.resolve(announcementChangesToken);
  act(() => changes.notifySaved());
  expect(screen.getByTestId('a').textContent).toBe('1');
  expect(screen.getByTestId('b').textContent).toBe('1');
  const listener = vi.fn();
  const stop = changes.subscribe(listener);
  stop();
  act(() => changes.notifySaved());
  expect(listener).not.toHaveBeenCalled();
  changes.subscribe(listener);
  view.unmount();
  await view.app.shutdown();
  changes.notifySaved();
  expect(listener).not.toHaveBeenCalled();
});
```

実際の保存の入口で、成功、失敗、キャンセルも確認してください。リビジョンが変わるのは書き込みが成功したときだけです。2 つの利用側が同じ通知を受け取り、アンマウントされた利用側は更新されなくなり、停止時には所有するリスナーが解放されます。

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

Context が持つ表示の設定とこのサービスの状態は、所有者が別です。同じリビジョンを別の Context にコピーする必要はありません。
