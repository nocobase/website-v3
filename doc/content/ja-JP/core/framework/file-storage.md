---
title: ファイルストレージとドライバー
---

`@nocobase/drive` はストレージのドライバーを提供します。ホストは `@nocobase/app-server/drive` の `driveManagerToken` でマネージャーを公開します。ファイルプラグインは、レコード、アップロード、ダウンロード、アクセス制御を加えます。

## ディスクを設定する

```ts
// server/config/drive.ts
import { defineAppConfig } from '@nocobase/app-server/config';
import type { AppDriveConfig } from '@nocobase/drive';

export default defineAppConfig<AppDriveConfig>(({ paths }) => ({
  default: 'local',
  disks: {
    local: {
      driver: 'fs',
      location: paths.storage('files'),
      visibility: 'private',
    },
  },
}));
```

`default` はディスクを選び、`disks` は利用できるディスクを宣言します。マネージャーを解決し、`drive.use('local')` でディスクを選んで、そのファイルのメソッドを呼び出します。業務の設定がディスク名を参照することがあるため、ディスクの名前を変えるときはそれらの参照も更新してください。

| ドライバー | 主な設定 | 用途 |
| --- | --- | --- |
| `fs` | `location`、`visibility`、任意の `url` | ローカルまたはマウントした共有のファイルシステム |
| `s3` | バケット、リージョン、認証情報、任意のエンドポイント | S3 と互換サービス |
| `oss` | バケット、リージョン、認証情報 | Alibaba Cloud OSS。サポートされている RAM Role の設定を含む |

サーバーの認証情報は、ブラウザーではなく、設定と環境変数で渡してください。ファイルのキーは業務の層で生成して検証し、ユーザーの生の入力をファイルシステムの絶対パスとして扱わないでください。

## アプリとプラグインでのファイルの操作

アプリがディスクの設定を提供します。アプリとプラグインは、同じマネージャーのトークンを解決します。このヘルパーは、業務で生成したテキストを既定のディスクに書き込みます。

```ts
import { driveManagerToken } from '@nocobase/app-server/drive';
import type { ServiceResolver } from '@nocobase/service-provider';

export async function writeOrderExport(
  container: ServiceResolver,
  key: string,
  content: string,
): Promise<string> {
  const disk = container.resolve(driveManagerToken).use();
  await disk.put(key, content);
  return key;
}
```

`key` は、たとえば `exports/orders/<id>.csv` のようにサーバーで生成し、あとで探せるようディスク名とファイルのキーを保持します。`get(key)` は内容を読み取り、`delete(key)` はファイルを削除します。エクスポートを作成する前に、業務操作を認可してください。

このヘルパーはストレージのオブジェクトを書き込むだけです。ファイルプラグインのレコードも公開の URL も作成しません。アップロード、レコード、アクセスの一連の流れには、ファイルプラグインを使います。プラグインは、リクエストごとにマネージャーを作成するのではなく、ホストのディスクの設定を再利用します。

## ストレージとアクセス

`visibility: 'private'` は、OS の権限を設定したり、公開された HTTP のディレクトリを保護したりはしません。`url` は URL を組み立てるだけで、ダウンロードのエンドポイントはマウントしません。既定のファイルシステムのドライバーには、署名付きのダウンロードやアップロードの URL が組み込まれていません。

非公開のファイルには、ファイルプラグインの認可されたダウンロードの API を使うか、独自のルートで身元とリソースのチェックを強制します。オブジェクトストレージの署名はドライバーに依存し、すべてのディスクが同じ機能を持っているわけではありません。

## デプロイとテスト

ホストは、起動時に設定されたファイルシステムのディレクトリを用意します。単独の呼び出し側は、自分でストレージを用意します。複数のインスタンスには、共有のボリュームかオブジェクトストレージが必要です。

`storage/files` は業務データです。データベースのファイルのメタデータと一緒にバックアップしてください。メタデータを削除してもオブジェクトは削除されず、その逆も同様です。再試行と孤立したファイルの片付けを計画してください。テストでは、実際のファイルではなく一時的なディスクやフェイクを使います。アプリレベルの機能については [プラグインを使う](../using-plugins/overview.md) を参照してください。

## インターフェースと実装

- [ディスクの設定](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive/src/types.ts)
- [ファイルシステムの組み込み](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive/skills/nocobase-drive/references/fs.md)
- [ホストのドライブの Provider](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/drive/provider.ts)
- [ホストのサービスの取り決め](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/drive/token.ts)
