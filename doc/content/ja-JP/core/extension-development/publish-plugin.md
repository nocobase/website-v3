---
title: ビルドと公開
description: ローカルのプラグインはアプリと一緒にビルド、デプロイされます。ほかのアプリと共有する必要がある場合は、非公開の npm レジストリーに公開します。
---

**プラグインは、一度も公開せずにアプリの中に置いたままにできます。** ローカルのプラグインは `packages/` の下に置き、workspace の依存関係と実行時の登録でつながります。アプリのビルドは、ローカルの依存関係をビルドし、引き渡しに必要なプラグインの成果物を `dist/vendor/` に集め、デプロイ用の依存関係を用意します。アプリを通常どおりビルド、デプロイすればよく、この流れで npm のレジストリーを用意する必要はありません。

複数のアプリやチームが同じプラグインを必要とし、バージョンの選択やアップグレードの時期をそれぞれ決めたい場合に、公開を検討します。このガイドでは、[最初のプラグインを書く](write-your-first-plugin.md) のお知らせの例を続け、チームの非公開の npm レジストリーに公開してから、別のアプリにインストールします。

公開後も、ソースは元のアプリのワークスペースに置いたままにできます。そのアプリはローカルのソースを使い続け、ほかのアプリは公開されたバージョンを使えます。

この記事ではパッケージの公開を扱います。フロントエンドのコンポーネントやブロックも、エージェントが取得、変更、組み合わせできるソースアセットとして公開するには、shadcn の UI Registry で配布します。[UI のソースアセットを公開する](frontend-components.md#必要に応じて-ui-のソースアセットを配布する) を参照してください。パッケージとソースアセットは、それぞれ独立してリリースできます。コンポーネントを再利用するだけなら、Registry は必要ありません。

## エージェントを使う場合

チームにすでにレジストリーがある場合は、下のアドレスを実際の URL に置き換えます。

```text
このアプリのお知らせのプラグインを @my-company/app-plugin-announcements として準備してください。
確認とビルドを行ってから、バージョン 0.1.0 を https://npm.example.com/ に公開してください。
別のアプリでそのバージョンをインストール、登録し、確認してください。
```

まだレジストリーがない場合は、先にエージェントに用意を手伝ってもらいます。認証情報は、依頼やプラグインのソースではなく、パッケージマネージャーのログインか CI の認証情報の設定で渡してください。手動の手順は次のとおりです。

## エージェントを使わない場合

### 1. 非公開の npm レジストリーを用意する

チームに非公開の npm レジストリーがある場合は、そのアドレスとアカウントを使って次の手順に進みます。ない場合は、[Verdaccio](https://www.verdaccio.org/docs/docker/) でホストできます。この例では、`http://localhost:4873/` でローカルに一連の流れを実行します。

別のディレクトリに `config.yaml` を作成します。

```yaml
storage: /verdaccio/storage

auth:
  htpasswd:
    file: /verdaccio/storage/htpasswd
    max_users: 1000

packages:
  '@my-company/*':
    access: $authenticated
    publish: publisher
    unpublish: publisher
```

この設定は `@my-company/*` だけをホストします。認証されたユーザーはパッケージを読み取れ、`publisher` という名前のユーザーは公開できます。ほかの npm のパッケージはプロキシしないため、アプリは引き続き設定済みのレジストリーからそれらを取得します。

そのディレクトリでサービスを起動し、パッケージとアカウントは Docker のボリュームに保存します。

```bash
docker run -d --name team-npm --restart unless-stopped \
  -p 127.0.0.1:4873:4873 \
  -v "$PWD/config.yaml:/verdaccio/conf/config.yaml:ro" \
  -v team-npm-storage:/verdaccio/storage \
  verdaccio/verdaccio:6
```

公開用のアカウントを作成します。プロンプトが表示されたら、ユーザー名に `publisher` を入力し、続けてパスワードとメールアドレスを入力します。

```bash
npm adduser --registry http://localhost:4873/ --auth-type=legacy
```

必要に応じて、利用する人のアカウントも作成します。アカウントの準備ができたら、`max_users` を `-1` に設定して `docker restart team-npm` を実行し、自己登録を締め切ります。既存のアカウントは引き続きサインインできます。アカウントの設定については [Verdaccio の認証](https://www.verdaccio.org/docs/authentication/) を参照してください。

この構成にはローカルのマシンからしかアクセスできません。チームで使うには、HTTPS のエンドポイントを用意し、このガイドのすべての `http://localhost:4873/` をそのアドレスに置き換えます。別のマシンの `localhost` からはこのサーバーに届きません。設定とボリュームのバックアップを取り、コンテナを置き換えるときも残してください。

### 2. レジストリーを設定してサインインする

**プラグインを保守するアプリのルート**の `.npmrc` に次の行を追記します。

```ini
@my-company:registry=http://localhost:4873/
```

既存の設定、特に `@nocobase` のレジストリーは保ちます。自分の組織のスコープを使うと、チームのプラグインと NocoBase の依存関係が、それぞれのレジストリーから解決されます。

アカウントを作成すると、そのマシンでもサインインした状態になります。別の開発マシンでは、次を実行します。

```bash
npm login --registry http://localhost:4873/ --auth-type=legacy
npm whoami --registry http://localhost:4873/
```

公開する権限のあるアカウント（この例では `publisher`）で公開します。ログインの認証情報はユーザーの設定に置き、プロジェクトにコミットしないでください。

### 3. パッケージを準備する

プラグインを保守するアプリで続けます。ディレクトリ `packages/app-plugin-announcements/` はそのままにし、パッケージ名を `@my-company/app-plugin-announcements` に変更します。

前のガイドの `@nocobase/app-plugin-announcements` から続ける場合は、次の場所をまとめて更新します。

| 場所 | 変更 |
| --- | --- |
| プラグインの `package.json` | `name` を新しいパッケージ名に、`version` を `0.1.0` にし、`private: true` を削除する |
| Client と Server のプラグインの定義 | `packageName` を同じ新しい名前にする |
| プラグインのテストとドキュメント | パッケージ名と、テストで使う翻訳の名前空間を更新する |
| アプリの `package.json` | ローカルの依存関係のキーの名前を変え、`workspace:*` は保つ |
| アプリのプラグインの登録のファイル | インポートを新しいパッケージ名に更新し、登録は保つ |

`pnpm install` を実行して、workspace のリンクとロックファイルを同期します。共有するつもりの新しいプラグインでは、作成時に完全なパッケージ名を使ってください。[プラグインを作成する](create-plugin.md#名前とよく使うオプション) を参照してください。

`private: true` は、非公開のものも含め、どの npm レジストリーへの公開も防ぎます。削除してもパッケージが誰でもアクセスできるようになるわけではなく、誰が読み取りや公開をできるかはレジストリーの権限のルールで決まります。[npm の private フィールド](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#private) を参照してください。

プラグインの `package.json` の残りのフィールドを確認します。

| フィールド | 確認すること |
| --- | --- |
| `publishConfig.registry` | 明示的な公開先として `http://localhost:4873/` を追加する |
| `publishConfig.access` | この例ではひな形の `public` の値を削除する。アクセスは Verdaccio の設定で管理する |
| `exports`、`imports` | ローカルの開発用の入口とパッケージ内のエイリアスを保つ |
| `publishConfig.exports`、`publishConfig.imports` | ひな形の `dist/` への対応付けを保つ。pnpm がパッケージ化の際に適用する |
| `files` | `dist/` と、提供する場合はスキルやそのほかの実行時のリソースを含める |
| 依存関係の宣言 | Server の依存関係、共有のランタイム、Client の peer を、利用側と互換性のあるバージョンで宣言する |

**既存の `publishConfig` にレジストリーを追加します。`registry` だけを含むオブジェクトで置き換えないでください。** 開発用と公開用の入口の対応付けについては [プラグインの構成](plugin-structure.md#packagejsonメタデータ依存関係公開のエクスポート) を参照してください。

プラグインがほかの workspace のパッケージに依存している場合は、利用側がそのパッケージもインストールできる必要があります。パッケージ化で `workspace:*` はバージョンの要件に変換されますが、ほかのパッケージの実装は同梱されません。共有の依存関係を先に公開してください。

README と変更履歴に、プラグインの機能、登録する入口、互換性のあるバージョン、必要な設定を書きます。公開するパッケージは、元のアプリの非公開のソースをインポートしたり、そのファイルのパスに依存したりせずに、元のアプリの外で動く必要があります。

### 4. 確認してパッケージ化する

**アプリのルート**で実行します。

```bash
pnpm --filter @my-company/app-plugin-announcements check
pnpm --filter @my-company/app-plugin-announcements pack \
  --pack-destination ./artifacts
```

`check` は、リント、フォーマットのチェック、型チェック、テスト、プラグインのビルドを実行します。`pack` はアップロードせずに公開用のアーカイブを作成します。これらのコマンドは、アプリの `artifacts/` ディレクトリに `.tgz` を書き出します。コマンドが表示する実際のパスを使ってください。パッケージ化のルールについては [pnpm pack](https://pnpm.io/cli/pack) を参照してください。

内容とパッケージ化されたマニフェストを確認します。

```bash
tar -tzf artifacts/my-company-app-plugin-announcements-0.1.0.tgz
tar -xOf artifacts/my-company-app-plugin-announcements-0.1.0.tgz package/package.json
```

次を確認します。

- `./client` や `./server` などの公開の入口が、アーカイブに含まれるコンパイル済みのファイルを指している。
- Client のパッケージ内のエイリアスが解決でき、翻訳やそのほかの実行時のリソースが含まれている。
- アーカイブにアプリの設定、認証情報、ローカルのデータが含まれていない。生成されたアーカイブはソース管理に入れない。

お知らせのパッケージには、`dist/client/`、`dist/server/`、`dist/shared/` が含まれているはずです。元のアプリで動くことだけでは確認として不十分です。公開されたパッケージを別のアプリでもテストしてください。

### 5. 非公開のレジストリーに公開する

確認した変更をコミットし、チームのリリース用のブランチを使います。アプリのルートで、公開をプレビューしてから公開します。

```bash
pnpm --filter @my-company/app-plugin-announcements publish --dry-run
pnpm --filter @my-company/app-plugin-announcements publish
```

これは選んだプラグインだけを、その `publishConfig.registry` に公開します。pnpm は Git の状態とリリース用のブランチを確認します。条件を満たしていない場合は、そのメッセージに対処してください。`--dry-run` は何もアップロードせず、公開は既定で `latest` のタグを使います。[pnpm publish](https://pnpm.io/cli/publish) を参照してください。

公開後に、正確なバージョンを照会します。

```bash
npm view @my-company/app-plugin-announcements@0.1.0 version \
  --registry http://localhost:4873/
```

結果は `0.1.0` になるはずです。公開すると、そのバージョンをほかのアプリがインストールできるようになりますが、デプロイ済みのアプリは変わりません。

### 6. 別のアプリにインストールする

**create-app で作成した別のアプリのルート**に移ります。そのアプリにはお知らせのプラグインのローカルのソースはなく、元のアプリの `packages/` のコピーも必要ありません。

まず**このアプリのルートの `.npmrc`** を編集し（必要なら作成し）、チームのスコープのレジストリーを追記します。

```ini
@my-company:registry=http://localhost:4873/
```

アドレスは、利用側から届く非公開のレジストリーの URL に置き換えます。既存の既定のレジストリーと `@nocobase` の設定は保ちます。公開したアプリの `.npmrc` も、プラグインの `publishConfig.registry` も、このアプリのインストール元のレジストリーを自動では設定しません。

パッケージを読み取れるアカウントで、現在のマシンにサインインします。同じレジストリーにすでにサインインしている場合は省略します。

```bash
npm login --registry http://localhost:4873/ --auth-type=legacy
npm whoami --registry http://localhost:4873/
```

`plugin register` はアプリのルートでパッケージマネージャーを呼び出し、pnpm はこの `.npmrc` を読み取ります。そのため、登録のコマンドに `--registry` の引数は必要ありません。現在、そのオプションは用意されていません。

pnpm のリリース後の経過期間のポリシーで、公開したばかりのパッケージがブロックされる場合は、`pnpm-workspace.yaml` の既存の一覧に自分のスコープを追加します。

```yaml
minimumReleaseAgeExclude:
  - '@my-company/*'
```

ほかの設定と既存のエントリーはすべて保ちます。この例外は、チームが管理するパッケージにだけ適用します。[Verdaccio の pnpm のガイド](https://www.verdaccio.org/docs/setup-pnpm/) を参照してください。

インストールの計画をプレビューしてから、正確なバージョンをインストールして登録します。

```bash
pnpm nocobase plugin register @my-company/app-plugin-announcements \
  --version 0.1.0 --dry-run
pnpm nocobase plugin register @my-company/app-plugin-announcements \
  --version 0.1.0
```

インストールの前のプレビューは、主にインストールの計画を示します。インストールすると、コマンドは公開の入口を読み取り、Client と Server の登録を書き込み、スキルを同期します。ここでは `--no-install` を使わないでください。利用側はレジストリーからパッケージを取得する必要があります。

アプリを起動し、お知らせのページと API を確認してから、ビルドします。

```bash
pnpm dev
# Run in another terminal
pnpm build
```

[最初のプラグインを書く](write-your-first-plugin.md#6-アプリに登録して結果を確認する) に従って、ナビゲーション、お知らせの内容、言語の切り替え、API を確認します。そのあと、アプリを通常の手順でデプロイします。[デプロイ方法を選ぶ](../deployment/choose-a-deployment-method.md) を参照してください。

開発と CI のビルドの環境には、レジストリーの読み取りのアクセスが必要です。アプリのビルドはレジストリーのアドレスを残しますが、プロジェクトの設定にある認証のトークンをデプロイの成果物にコピーすることはありません。CI の認証は、ユーザーレベルの npm の設定か、保護された認証情報の設定で渡してください。デプロイの過程で依存関係をもう一度インストールする場合は、そのインストールの手順にも読み取りのアクセスが必要です。

### 7. 次のバージョンを公開する

プラグインを変更して確認したら、バージョンを上げ、変更履歴を更新し、確認と公開の手順を繰り返します。公開済みのバージョンを上書きしないでください。

利用側は、必要なときにプラグインをアップグレードして確認します。[プラグインを管理する](../developing-apps/manage-plugins.md#プラグインを更新する) を参照してください。その場合もアプリのビルドとデプロイは必要です。デプロイ済みのアプリが自動でバージョンを切り替えることはありません。プラグインを保守するアプリは、`workspace:*` でローカルのソースを使い続けられます。
