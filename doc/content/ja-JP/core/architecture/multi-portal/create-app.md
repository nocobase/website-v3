---
title: マルチポータルアプリの作成
metaDescription: 商用レジストリにログインし、マルチポータルアプリを作成、設定、起動します。
---

業務ポータルの実行環境となるマルチポータルアプリを作成し、起動します。テンプレートにはプラグイン登録、ワークベンチ、ポータル管理が含まれますが、業務ポータルやサンプルデータはプリインストールされません。

## 環境と商用パッケージへのアクセス

Node.js 24 以降、pnpm 11、マルチポータルの商用パッケージをダウンロードできるアカウントを用意します。コマンドは Bash などの POSIX シェル向けです。Windows では WSL を使用できます。

自身のターミナルで商用レジストリにログインします。有効なログインがあれば再利用できます。

```bash
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
npm whoami --registry=https://pkg-v3.nocobase.com/
npm view @nocobase/app-template-multi-portal@beta version --registry=https://pkg-v3.nocobase.com/
```

プロンプトに従ってアカウント情報を入力し、パスワードにはレジストリの読み取りトークンを使用します。認証情報は npm のユーザー設定で管理し、プロジェクトや Git に保存しないでください。ログイン成功だけではダウンロード権限を確認できないため、パッケージのバージョン取得も確認します。

テンプレート、管理プラグイン、ジェネレーターは商用レジストリから取得します。サードパーティ依存関係は公開 npm または設定済みの公開ミラーを使用します。デフォルトの registry 全体を商用レジストリに変更しないでください。

## Agent でアプリを作成

Agent がコマンドを実行するマシンとユーザー環境で、前述の商用レジストリへのログインを完了してください。ローカルの npm ログインはリモートの Agent に自動共有されません。読み取りトークンをチャットに貼り付けないでください。

グローバルの `nocobase-create-app` Skill をインストールし、案内に従って使用する Agent を選びます。

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

Agent のセッションを開き直して Skill を読み込みます。プロジェクトを置く親ディレクトリで Agent を開き、名前、場所、データベース、アクセス方法を伝えます。未定の項目は先に相談できます。

```prompt
ローカル開発用の NocoBase 3 マルチポータルアプリを my-portals ディレクトリに作成してください。
データベースとアクセス方法を先に確認し、起動後に URL と初回ログイン情報を教えてください。
```

作成 Skill は商用マルチポータルテンプレートに対応しています。パッケージ権限を確認し、`multi-portal` を選んで依存関係のインストール、設定、起動を行います。完了後はディレクトリと URL を確認し、ログインして管理者のワークベンチとポータル管理を開きます。ポータル一覧が空でも正常です。作成成功のメッセージだけではログイン確認になりません。

生成されたアプリのディレクトリで開発を続け、アプリの `AGENTS.md`、`.agents/rules/multi-portal.md`、プロジェクト Skills を使用します。現在のセッションでこれらが読み込まれていない場合は、アプリのディレクトリで開き直してから[業務ポータルの作成](develop.md#業務ポータルの作成)に進みます。

以下の手動手順は別の選択肢です。Agent が作成、設定、起動を完了していれば、繰り返す必要はありません。

## 手動でアプリを作成

### アプリの作成

親ディレクトリで実行します。`my-portals` は新規または空のディレクトリである必要があります。

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 \
NOCOBASE_REGISTRY=https://pkg-v3.nocobase.com/ \
npm_config_registry=https://registry.npmjs.org \
pnpm create @nocobase/app@beta my-portals \
  --template=multi-portal --template-tag=beta
cd my-portals
```

`multi-portal` は `@nocobase/app-template-multi-portal` を選択します。作成ツールはソース生成、依存関係のインストール、開発用 Skills の同期を行います。`PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` はこのコマンドで公開直後の beta パッケージを利用できるようにします。公開ミラーを使う場合は公開 registry の URL を置き換えます。

Create-app `0.1.0-beta.36` 以降では商用パッケージとサードパーティ依存関係の取得先を分けてインストールできます。プロジェクトの `.npmrc` は `@nocobase:registry` の URL を保持し、認証情報はユーザー設定に残ります。作成後はプロジェクトの `AGENTS.md`、`.agents/rules/multi-portal.md`、同期された Skills に従います。

### データベースとアクセス先の設定

アプリのルートで設定を初期化します。

```bash
pnpm nocobase config init
```

データベースを選び、接続情報を設定します。非対話環境では `--dialect` を明示します。ドライバーが不足している場合は、コマンドの案内に従ってインストールしてから再実行します。詳細は[データベースを選択してアプリを作成](../../reference/database-configuration.md)を参照してください。初期化は `config.yml` とアプリの秘密鍵を生成します。ファイル全体を文書中の断片で置き換えないでください。

LAN、ドメイン、プロキシ経由でアクセスする場合は、ブラウザーで使うプロトコル、ホスト、ポートを `app.publicOrigin` に設定します。`/main` などのパスは含めません。次のプレースホルダーを実際の LAN IP とアプリのポートに置き換えます。

```bash
pnpm nocobase config set 'app.publicOrigin=http://<LAN_IP>:<PORT>'
pnpm nocobase config check
```

設定の問題を解決してから起動します。データベースやネイティブドライバーの動作確認には、アプリの起動と初期化の成功も必要です。

### アプリの起動

```bash
pnpm dev
```

出力された `Local:` の URL を、アプリのベースパスを含めて開きます。LAN アクセスには `APP_SERVER_HOST=0.0.0.0 APP_SERVER_PORT=<PORT> pnpm dev` を使用し、設定済みのポートと一致させます。ポート競合で別のポートが選択された場合は、`app.publicOrigin` を更新して再起動します。

`users.initialAdmin` で設定された管理者としてログインします。既定値はユーザー名 `nocobase`、パスワード `admin123` です。初回ログイン後に変更してください。

ログインすると管理者のワークベンチと **システム設定 → ポータル管理**を利用できます。新しいアプリにはまだ業務ポータルがないため、一覧が空でも正常です。

## よくある問題

| 現象 | 対応 |
| --- | --- |
| 商用パッケージが 401、403、またはバージョン取得不可 | ログイン期限、パッケージ権限、指定バージョンを確認 |
| サードパーティの取得が商用レジストリで 404 | デフォルト registry を修正し、商用設定を `@nocobase` に限定して、既存アプリで `pnpm install` を実行 |
| LAN でログインできない | `app.publicOrigin` をブラウザーの origin に合わせる |

## 次のステップ

[業務ポータルの作成](develop.md#業務ポータルの作成)に進み、最初のポータルを生成、インストール、拡張します。
