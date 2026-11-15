---
title: "nb-studio コマンド"
description: "Studio CLI をインストールし、サーバーが提供するコマンドを確認します。"
---

`nb-studio` はローカルのコーディングエージェント、スクリプト、CI から Studio を操作します。業務コマンドは接続先が提供し、サーバーのバージョンと実行者の権限に従います。

runner の登録、ログ、更新、削除は [nocobase-runner コマンド](../reference/runner.md)を参照してください。

## インストールとサインイン

アカウントメニューの **Use Studio in your agent** を開き、設定手順をローカルエージェントに渡します。[ローカルのエージェントを使う](../join/local-agent.md)を参照してください。Node.js 24 以降が必要です。

インストール後、`/main` を含むアドレスでサインインします。

```bash
nb-studio login --server https://studio.example.com/main
nb-studio whoami
nb-studio skills install
```

ブラウザーでコードを確認・承認する間は、ログインコマンドを実行したままにします。ブラウザーがないマシンでは `--no-browser` を付け、別の端末で承認 URL を開きます。

## コマンドを探す

```bash
nb-studio docs
nb-studio issue --help
nb-studio quality --help
nb-studio whoami --missing
```

`docs` で現在のコマンド、`--help` で引数を確認します。`whoami --missing` は、使えないコマンドを必要な権限ごとに表示します。`--json` で構造化された結果を取得できます。

| グループ | 用途 |
| --- | --- |
| `issue`、`comment`、`attachment` | タスク、議論、添付ファイル |
| `project`、`label` | プロジェクト、メンバー、ラベル |
| `project-manager`、`agent`、`runtime` | 割り当て、エージェント、ランタイム |
| `skill`、`variable`、`run` | スキル、変数、実行履歴 |
| `kb`、`memory` | ナレッジとプロジェクトメモリー |
| `git`、`pr`、`commit` | リポジトリ、PR、チェック |
| `quality` | Studio EE のプロジェクトテスト、レポート、コアシナリオ、指標、フォローアップ |
| `app`、`deploy`、`env`、`release`、`build` | アプリ、環境、成果物、リリース |
| `conversation` | Runner Agent の会話 |
| `user`、`access`、`api-key` | 許可された管理操作 |

## 複数の Studio を使う

```bash
nb-studio profile list
nb-studio profile use <profile-name>
nb-studio logout
```

スクリプトと CI は、ブラウザーでサインインせずに `NB_STUDIO_SERVER` と `NB_STUDIO_API_KEY` を使えます。キーは CI のシークレット管理に保存します。[API キー](../admin/api-keys.md)を参照してください。

## 更新する

```bash
nb-studio update --check
nb-studio update
```

現在の Studio から更新し、インストール済みのスキルも同期します。CLI のサインイン承認と Git の認可は、それぞれの Web ページで行います。エージェントの実行主体は、人に代わってタスクを検収したり PR をマージしたりできません。
