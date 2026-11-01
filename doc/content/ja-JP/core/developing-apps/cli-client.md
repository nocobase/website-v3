---
title: アプリの CLI クライアントを提供する
description: app-cli-client でアプリに単独の CLI を用意し、サーバーの業務 API に接続して、テストし、配布用にパッケージ化します。
---

アプリには、`nocobase-examples` のような単独の CLI を持たせられます。ユーザーは自分の PC からサインインし、アプリのソースコードやデータベースの設定なしに、サーバー側の業務操作を実行できます。エージェントも同じインターフェースを使えます。

`@nocobase/app-cli-client` は、サインイン、コマンドの発見、HTTP の呼び出しを提供します。業務のコマンドはサーバーのコマンドマニフェストで決まり、その業務ロジックはサーバーで実行されます。

## 提供すべきとき

| シナリオ | 入口 |
| --- | --- |
| アプリの環境でデータをエクスポートしたり保守を実行したりする | [アプリのコマンド](application-commands.md)。たとえば `pnpm nocobase app statuses export` |
| プラグインのローカルの保守用や開発用のコマンドを使う | [プラグインのコマンド](plugin-commands.md)。たとえば `pnpm nocobase notice-cli preview` |
| ユーザー、自動化、エージェントが、ネットワーク経由で動作中のアプリにアクセスする | 単独の CLI。たとえば `nocobase-examples user options` |

単独の CLI は、業務 API の記述からコマンドを導き出します。`cli/commands/` にファイルを追加しても、リモートの業務コマンドとしては公開されません。

## サーバーを準備する

このガイドでは、既存の Examples テンプレートの設定と、その `user options` コマンドを使います。データベースを初期化した動作中の Examples アプリと、ユーザー管理のオプションを読み取れるアカウントが必要です。

サーバーには、`package.json` の名前に加えて、次の組み込みが必要です。

- **API ドキュメントとコマンドマニフェスト。** `describeRoute()` などの公開のルートの宣言が、入力、レスポンス、身元の要件を記述します。CLI はアプリのマニフェストを読み取ります。既定では `/api/cli/manifest` です。
- **呼び出し元の身元。** Examples では現在、認証、ユーザー、認可とともに、Agents プラグインを使って呼び出し元の解決を CLI サービスに接続しています。独自のアプリには、対応する組み込みが必要です。既定のテンプレートにすべてが含まれているとは考えないでください。
- **ブラウザーでのサインイン。** Examples は、デバイス認可、Bearer のセッション、`/device` の確認ページを設定し、`nocobase-cli` のクライアント ID を許可しています。ID を変更する場合は、クライアントとサーバーの許可リストの両方を更新します。

[Examples の認証設定](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/server/config/auth.ts) と [Agents の CLI の身元の組み込み](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/plugins/app-plugin-agents/server/cli/surface.ts) を参照してください。マニフェストでの表示とエンドポイントの認可は、目的が異なります。業務 API は、引き続きリクエストごとに権限とデータ範囲を確認する必要があります。

## クライアントの名前を設定する

Examples の `package.json` にはすでにこの設定があります。独自のアプリでは、既存の `nocobase` オブジェクトに `cli` をマージし、ほかのフィールドは残して、互換性のある `@nocobase/app-cli-client` のバージョンを `devDependencies` に追加します。

```json
{
  "nocobase": {
    "cli": {
      "bin": "nocobase-examples",
      "displayName": "NocoBase Examples",
      "auth": {
        "clientId": "nocobase-cli"
      }
    }
  }
}
```

`bin` はユーザーが入力するコマンドで、`displayName` はヘルプとメッセージに表示されます。`auth.clientId` は、サーバーのデバイス認可で受け付けられる必要があります。予約されている `nocobase` や `nocobase-runner` という名前は使わず、自分のアプリの名前を選んでください。

`envPrefix`、`stateDir`、`skills` などのオプションは任意です。すべてのフィールドは [CLI の設定リファレンス](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-cli/README.md#the-applications-own-cli-cli-build-and-cli-link) を参照してください。まず接続と業務の呼び出しを確認しましょう。

## ローカルでクライアントをリンクして使う

Examples アプリのルートで次を実行します。

```bash
pnpm nocobase cli link
pnpm exec nocobase-examples --help
```

`cli link` は、ローカル開発用にプロジェクトの `node_modules/.bin` にエントリーを作成します。サーバーを起動したり、サーバーのサインインやコマンドマニフェストを設定したりはしません。

サーバーを起動した状態で、下の例の URL を、デプロイのベースパスを含む実際のアドレスに置き換えます。

```bash
pnpm exec nocobase-examples login --server https://your-app.example.com
pnpm exec nocobase-examples whoami
pnpm exec nocobase-examples docs
pnpm exec nocobase-examples user options --help
pnpm exec nocobase-examples user options --json
```

`login` は認可コードを表示してブラウザーでの確認を開き、そのサーバーのログインプロファイルを保存します。有効な身元の確認には `whoami` を、業務コマンドの発見には `docs` を、引数の確認にはコマンドごとの `--help` を使います。

`user options` は、ユーザープラグインの既存の読み取り専用のエンドポイントで、ユーザー管理で割り当てられるロールの範囲とロールを返します。利用できるコマンドは、サーバーのバージョンと呼び出し元のマニフェストによって異なります。コマンド名があるだけではアクセスは付与されません。環境を分けるには `--profile` を使います。自動化やほかのログイン方法については `login --help` を参照してください。

## 独自の業務コマンドを公開する

まず [HTTP ルートと API](apis-and-services.md) の説明に従って HTTP API を実装、登録、検証します。CLI は、`cli/commands/` に重複した実装を置かずに、同じ API の記述を使います。

ユーザープラグインは、`/options` ルートの `describeRoute()` のメタデータに `cliRoute({ command: 'user options' })` を展開しています。同じように、下のメタデータを取得して既存の宣言に `...cliMetadata` を展開します。

```ts
import { cliRoute } from '@nocobase/app-server/router';

// Merge into the existing describeRoute({ ... }) metadata.
const cliMetadata = cliRoute({ command: 'user options' });
```

これはメタデータであり、完全なエンドポイントではありません。検証、レスポンスの宣言、認証、業務処理はルートに残します。完全な [ユーザープラグインのルート](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/plugins/app-plugin-users/server/routes/index.ts) を参照してください。

`cliRoute()` では、名前、位置引数、フラグ、例をカスタマイズできます。カスタマイズしない場合、名前は API の記述から導き出されます。`cliRoute(false)` はルートを CLI のマニフェストから除外しますが、HTTP のエンドポイントは無効にしません。すべてのオプションは [CLI ルートの取り決め](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/router/cli/types.ts) を参照してください。

API を変更したら、CLI のヘルプ、引数、結果、失敗時の動作を確認し、権限の異なるアカウントでサーバーの認可をテストします。

## ビルドして配布する

ローカルでの呼び出しが動いたら、アプリのルートでビルドします。

```bash
pnpm nocobase cli build --help
pnpm nocobase cli build --universal --json
```

`--universal` は Node.js を同梱しないアーカイブを作成します。ユーザーには Node.js 24 以降が必要です。`--targets` を指定しない場合は、そのユニバーサルなアーカイブだけがビルドされます。ランタイムを同梱するアーカイブには、`--help` でサポートされているターゲットを選びます。

出力は既定でアプリの `storage/runners/dist/` に置かれ、チャネル、製品、バージョンごとにアーカイブとマニフェストが整理されます。正確なパスはビルドの結果から読み取ってください。`cli build` はクライアントをパッケージ化するだけで、成果物のアップロードやアプリのデプロイは行いません。ダウンロードサイトや既存のリリースの手順で配布してください。

引き渡す前に、別のディレクトリに展開し、その `bin/nocobase-examples` を使って、対象のアプリに対するヘルプ、サインイン、`whoami`、認可された業務コマンドを確認します。CLI のアーカイブは、`pnpm build` で作成されるアプリのデプロイとは別に確認します。

## トラブルシューティング

| 症状 | 確認すること |
| --- | --- |
| `pnpm exec` でコマンドが見つからない | `nocobase.cli.bin`、インストールされた依存関係、`cli link` の成功 |
| サインインを完了できない | サーバーのアドレス、デバイス認可、クライアント ID、確認ページ |
| サインイン後にコマンドマニフェストがない | `/api/cli/manifest` と、呼び出し元の身元の組み込み |
| 業務コマンドが見つからない | サーバーのバージョン、API ドキュメント、CLI からの除外、身元による絞り込み |
| 一覧にあるコマンドが拒否される | アカウントの権限、データ範囲、エンドポイントの検証 |

これらのローカルとリモートの入口の共通の概要は、[CLI リファレンス](../reference/cli.md) を参照してください。
