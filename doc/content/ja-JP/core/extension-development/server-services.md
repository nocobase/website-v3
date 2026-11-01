---
title: 業務のサービスと ServiceProvider
description: プラグインのサービスの実装、Token、Provider を整理し、取り決めを API、コマンド、ほかのプラグインに公開します。
---

この記事では、お知らせのプラグインに、HTTP、CLI、ほかのプラグインが共有するテキストのプレビューのサービスを追加します。`services/` が実装を、`tokens.ts` が公開の取り決めを持ち、`providers/` がそれらをアプリのコンテナに登録します。データベースや Client のコードは必要ありません。

依存性注入とライフサイクルについては [ServiceProvider](service-provider.md) を、トランザクションとリクエストの状態については [サーバー側のサービス](../developing-apps/server-business-services.md) を参照してください。この記事では、プラグインでの登録と公開しての利用を扱います。

## 前提条件とファイル

既存の `@nocobase/app-plugin-announcements` にこれらのファイルを追加します。パスはそのルートからの相対パスです。既存の内容にはマージし、サービスと API を保ってください。新しいプラグインでは `server.service-providers` を選べます。アプリとプラグインが実行時に同じものを共有できるよう、`@nocobase/service-provider` は互換性のある peer のままにします。

## エージェントを使う場合

```text
お知らせのテキストのプレビューを、プラグインの Server のサービスに切り出してください。
前後の空白を取り除いたテキストと、その Unicode のコードポイントの数を返します。
元の Token と ServiceProvider で遅延生成のシングルトンとして登録し、取り決めを API とコマンドに公開してください。
Server の提供内容は保ち、リクエスト、ユーザー、トランザクションの状態はシングルトンのフィールドに持たせないでください。
登録がない場合、同じインスタンスの共有、型宣言のビルドを確認してください。
```

## サービスの取り決めを定義する

`server/tokens.ts` に取り決めと Token を追加します。

```ts
import { createServiceToken, type ServiceToken } from '@nocobase/service-provider';

export interface AnnouncementPreview {
  readonly text: string;
  readonly length: number;
}
export interface AnnouncementPreviewService {
  preview(text: string): AnnouncementPreview;
}
export const announcementPreviewToken: ServiceToken<AnnouncementPreviewService> =
  createServiceToken<AnnouncementPreviewService>('@nocobase/app-plugin-announcements/preview');
```

各入口は、入力の型、長さ、権限を検証します。再利用する業務の制約は、引き続きサービスに置きます。この例は Unicode のコードポイントを数えます。これは JavaScript の文字列の長さとも、ユーザーが認識する文字の数とも異なります。

## サービスを実装する

`server/services/preview.ts` を追加します。

```ts
import type { AnnouncementPreview, AnnouncementPreviewService } from '../tokens.js';

export class DefaultAnnouncementPreviewService implements AnnouncementPreviewService {
  public preview(text: string): AnnouncementPreview {
    const normalized = text.trim();
    return { text: normalized, length: Array.from(normalized).length };
  }
}
```

この実装は HTTP の Context に依存しないため、コマンドやジョブからも使えます。データベースや外部のサービスへの依存を追加する場合は、Provider で既存のアプリのサービスを解決し、コンストラクターの引数で注入します。呼び出しごとのユーザーの身元、認可のポリシー、トランザクションは、メソッドの引数で渡します。別のグローバルなコンテナを作ったり、アプリのデータのポリシーを迂回したりしないでください。

## プラグインに登録する

`server/providers/preview.ts` を追加します。

```ts
import { ServiceProvider, type ServiceContainer } from '@nocobase/service-provider';
import { announcementPreviewToken } from '../tokens.js';
import { DefaultAnnouncementPreviewService } from '../services/preview.js';

export interface AnnouncementPreviewApplication {
  readonly container: ServiceContainer;
}
export class AnnouncementPreviewProvider extends ServiceProvider<AnnouncementPreviewApplication> {
  public readonly name: string = '@nocobase/app-plugin-announcements/preview';
  public override register(): void {
    this.app.container.singleton(announcementPreviewToken, () => new DefaultAnnouncementPreviewService());
  }
}
```

`server/providers/index.ts` のコンストラクターの配列に `AnnouncementPreviewProvider` を追加し、`server/plugin.ts` が `serviceProviders` でそれを提供していることを確認します。実装のファイルだけでは、サービスは登録されません。既存の Provider は保ち、配列に `new AnnouncementPreviewProvider(...)` を入れないでください。

この純粋な計算には、起動や停止のためのリソースは必要ありません。非同期の初期化にはライフサイクルのメソッドを使います。解放するのはプラグインが作成した購読や接続だけにし、起動の失敗も考慮します。段階と依存の順序については [アプリの起動とライフサイクル](../framework/runtime/lifecycle.md) を参照してください。

## サービスを公開して利用する

`server/index.ts` のプラグインの既定のエクスポートは保ち、公開の Token と型を追加します。

```ts
export { announcementPreviewToken } from './tokens.js';
export type { AnnouncementPreview, AnnouncementPreviewService } from './tokens.js';
```

アプリの `server/plugins.ts` で登録したあと、API やほかのプラグインは `@nocobase/app-plugin-announcements/server` から元の Token をインポートし、現在のアプリのコンテナを通じて呼び出します。同じ文字列で Token を作り直したり、パッケージをまたいで非公開の `server/services/preview.ts` をインポートしたりしないでください。

ルートの入力を検証したあと、`app.container.resolve(announcementPreviewToken).preview(text)` を呼び出し、結果を HTTP のレスポンスの取り決めに従って返します。宣言と保護については [ルートと HTTP の API](server-apis.md) を参照してください。

CLI は `this.withApp(async ({ app }) => ...)` の中で同じ Token を解決し、その結果を返します。アプリは Server の入口を登録する必要があります。CLI の入口だけを登録しても、このサービスは登録されません。純粋なプレビューには追加の `app.start()` の呼び出しは不要ですが、起動済みのリソースに依存するサービスは、その取り決めに従って起動が必要です。引数とエラーについては [コマンドラインの拡張](extend-command-line.md) を参照してください。

利用側は公開の入口からインターフェースを取得し、実装と Provider のクラスは非公開のままでかまいません。パッケージの依存関係、実行時の登録、呼び出しの順序については [プラグインの宣言と公開のエクスポート](plugin-declarations.md) で説明しています。

## 公開の取り決めと組み込みを確認する

次を `tests/server/service-provider.test.ts` に置き、関係する既存のアサーションとマージするか、置き換えます。

```ts
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';
import { announcementPreviewToken } from '../../server/index.js';
import { AnnouncementPreviewProvider } from '../../server/providers/preview.js';

it('registers one lazy service behind the public Token', () => {
  const container = new ServiceContainer();
  expect(() => container.resolve(announcementPreviewToken)).toThrow();
  new AnnouncementPreviewProvider({ container }).register();
  expect(container.resolveIfCreated(announcementPreviewToken)).toBeUndefined();
  const service = container.resolve(announcementPreviewToken);
  expect(service.preview('  欢迎 👋  ')).toEqual({ text: '欢迎 👋', length: 4 });
  expect(container.resolve(announcementPreviewToken)).toBe(service);
});
```

これで、公開の Token、遅延生成、同じインスタンスの共有を確認できます。実際の Server の宣言に Provider が含まれていることも確認し、対象のアプリで実際の HTTP か CLI の入口を呼び出してください。データベース、認可、トランザクションとの組み込みには、実際のアプリのテストが必要です。コンテナのテストでは、それらの動作は確認できません。

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

Client と Server のサービスは別々のコンテナで動きます。ブラウザーは、Server の実装をインポートするのではなく、API を通じてこのサービスを呼び出します。
