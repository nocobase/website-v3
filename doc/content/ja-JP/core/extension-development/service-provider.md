---
title: ServiceProvider とサービスのライフサイクル
description: Client と Server の両方で、サービスの取り決め、Token、登録、ライフサイクルを理解します。
---

ServiceProvider は、プラグインのサービスをアプリのコンテナにつなぎ、その起動とクリーンアップを担います。Client と Server は同じ基本の仕組みを使いますが、別々の環境で、別々のコンテナとインスタンスを持って動きます。

業務の動作は Service に、登録とリソースのライフサイクルは Provider に置きます。呼び出し元が 1 つだけの純粋な関数には、通常コンテナは必要ありません。複数の入口が動作を共有する場合、実装を差し替える必要がある場合、リソースのライフサイクルの管理が必要な場合に、ServiceProvider を使います。

ランタイムごとのプラグインへの組み込みについては [クライアントのサービス](client-services.md) と [業務のサービスと ServiceProvider](server-services.md) を、タスクのリソースについては [バックグラウンドジョブとエグゼキューター](background-jobs.md) を参照してください。この記事では、共通のコンテナとライフサイクルの考え方を説明します。React のコンポーネントの Context は [React の Context と Provider](react-context-and-providers.md) で別に扱います。

## エージェントを使う場合

```text
お知らせの機能の ServiceProvider を整理してください。Server には再利用できるテキストのプレビューのサービスを、
Client には共有のレイアウトの設定を置きます。それぞれを自分のコンテナに登録し、
Token と公開の入口を明確にして、遅延生成とインスタンスの再利用をテストしてください。
```

## プラグインを用意する

この例の名前は `notice-services` です。コマンドはアプリのルートで実行し、ファイルのパスは `packages/app-plugin-notice-services/` からの相対パスです。

```bash
pnpm create @nocobase/plugin@beta notice-services --with server.service-providers --with client.service-providers
```

ひな形は、両側の Provider、集約のファイル、宣言をつなぎます。サービスを実装する間も、それらのつながりは保ってください。

## Server：取り決め、Token、実装、登録

`server/tokens.ts` を置き換えます。

```ts
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface NoticePreview {
  readonly text: string;
  readonly length: number;
}
export interface NoticeServicesService {
  preview(text: string): NoticePreview;
}
export const noticeServicesServiceToken: ServiceToken<NoticeServicesService> =
  createServiceToken<NoticeServicesService>(
    '@nocobase/app-plugin-notice-services/service',
  );
```

`server/services/notice-services.ts` を置き換えます。

```ts
import type { NoticePreview, NoticeServicesService } from '../tokens.js';

export class DefaultNoticeServicesService implements NoticeServicesService {
  public preview(text: string): NoticePreview {
    const normalized = text.trim();
    return { text: normalized, length: Array.from(normalized).length };
  }
}
```

`server/providers/notice-services.ts` では、生成された登録のパターンを保ちます。

```ts
import {
  ServiceProvider,
  type ServiceContainer,
} from '@nocobase/service-provider';

import { DefaultNoticeServicesService } from '../services/notice-services.js';
import { noticeServicesServiceToken } from '../tokens.js';

export interface NoticeServicesProviderApplication {
  readonly container: ServiceContainer;
}

export class NoticeServicesProvider extends ServiceProvider<NoticeServicesProviderApplication> {
  public readonly name: string = '@nocobase/app-plugin-notice-services';

  public override register(): void {
    this.app.container.singleton(
      noticeServicesServiceToken,
      () => new DefaultNoticeServicesService(),
    );
  }
}
```

`singleton` は最初に解決したときに値を作り、1 つのアプリのコンテナの中では同じインスタンスを返します。`instance(token, value)` は既存の値を登録します。ファクトリーは同期的です。非同期の準備はライフサイクルのメソッドで行います。

`server/providers/index.ts` は Provider のコンストラクターをエクスポートし、`server/plugin.ts` がそれらを `serviceProviders` として提供します。その配列の中で Provider をインスタンス化したり、モジュールのインポート中に接続やタイマーを始めたりしないでください。

ルートやほかの Provider は `app.container.resolve(noticeServicesServiceToken)` で解決します。ほかのプラグインに機能を公開するには、`server/index.ts` の既定のエクスポートを保ち、次を追加します。

```ts
export { noticeServicesServiceToken } from './tokens.js';
export type { NoticeServicesService, NoticePreview } from './tokens.js';
```

利用側は `@nocobase/app-plugin-notice-services/server` から元の Token をインポートします。同じ文字列で Token を作り直すと、別のものとして扱われます。同じものが重複しないよう、共有の `@nocobase/service-provider` のランタイムは peer として宣言します。

## Client：独自のサービスとコンテナ

`client/services/preferences.ts` を作成します。

```ts
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface NoticePreferences {
  isCompact(): boolean;
  setCompact(value: boolean): void;
}
export const noticePreferencesToken: ServiceToken<NoticePreferences> =
  createServiceToken<NoticePreferences>(
    '@nocobase/app-plugin-notice-services/preferences',
  );

export class DefaultNoticePreferences implements NoticePreferences {
  private compact = false;
  public isCompact(): boolean {
    return this.compact;
  }
  public setCompact(value: boolean): void {
    this.compact = value;
  }
}
```

`client/providers/notice-services.ts` を置き換えます。

```ts
import type { ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';
import {
  DefaultNoticePreferences,
  noticePreferencesToken,
} from '../services/preferences.js';

export class NoticeServicesServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-notice-services';
  public override register(): void {
    this.app.container.singleton(
      noticePreferencesToken,
      () => new DefaultNoticePreferences(),
    );
  }
}
```

`client/providers/index.ts` と `client/plugin.ts` の登録は保ちます。既存の React のコンポーネントでは、`@nocobase/app-client` の `useService(noticePreferencesToken)` を呼び出します。通常の関数では、サービスを引数として受け取れます。グローバルなコンテナの変数は避けてください。

この設定は現在のブラウザーのアプリのインスタンスだけのもので、再読み込みするとリセットされます。`setCompact()` は React の再レンダリングを起こしません。リアクティブな UI には、状態、購読、React の Provider を使います。ServiceProvider はサービスを管理し、React の Provider はコンポーネントツリーに Context を提供します。永続的な設定には、Client と Server が状態を共有していると想定するのではなく、API を使ってください。

## ライフサイクルの役割

| 段階 | 適した作業 |
| --- | --- |
| `register()` | インスタンスと遅延生成のファクトリーを同期的に登録する。ネットワークやデータベースの処理はしない |
| `boot()` | 依存関係を確認し、非同期の準備を行う |
| `start()` | 自分が所有する購読、接続、コンシューマー、タイマーを始める |
| `ready()` | すべての Provider が起動したあと、内部の準備を完了する |
| `shutdown()` | 自分が所有するリソースを止め、クリーンアップの完了を待つ |

すべての Provider が 1 つの段階を終えてから、次の段階が始まります。停止は逆の順序で実行されます。Server のルートのファクトリーは `boot()` のあと、`start()` の前に実行されます。サービスは解決できますが、バックグラウンドの処理が始まっていると想定してはいけません。`ready()` は、外部の HTTP の待ち受けが開いていることを意味しません。

クリーンアップは、途中までの起動や、作成されていないサービスにも対応する必要があります。閉じるためだけに遅延生成の値を作らないよう、`resolveIfCreated()` を使います。解放するのは自分が所有するリソースだけにし、アプリの共有のデータベースやロガーは解放しません。この例は外部のリソースを持たないため、空のライフサイクルのメソッドは不要です。

## サービスの登録をテストする

生成された `tests/server/service-provider.test.ts` を置き換えます。

```ts
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';
import { NoticeServicesProvider } from '../../server/providers/notice-services.js';
import { noticeServicesServiceToken } from '../../server/tokens.js';

describe('notice service', () => {
  it('registers a lazy singleton and normalizes text', () => {
    const container = new ServiceContainer();
    new NoticeServicesProvider({ container }).register();
    expect(container.resolveIfCreated(noticeServicesServiceToken)).toBeUndefined();
    const service = container.resolve(noticeServicesServiceToken);
    expect(service.preview('  欢迎 👋  ')).toEqual({
      text: '欢迎 👋',
      length: 4,
    });
    expect(container.resolve(noticeServicesServiceToken)).toBe(service);
  });
});
```

```bash
pnpm --filter @nocobase/app-plugin-notice-services format
pnpm --filter @nocobase/app-plugin-notice-services check
```

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-services --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-services --no-install
```

アプリで Server の利用側と Client のページを動かし、アプリの `pnpm build` を実行します。コンテナのテストは組み込みのチェックの代わりにはなりません。Client のテストでは、`renderWithApp()` で実際のプラグインを登録できます。[テストと検証](testing-and-verification.md) を参照してください。
