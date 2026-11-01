---
title: nb-studio コマンド
description: nb-studio は Studio のコマンドラインで、主に Claude Code や Codex など、あなたのエージェントのために作られています。インストールすると、エージェントがプロジェクトの照会、タスクの作成、進捗の追跡、Studio の設定を代わりに行えます。スクリプトや CI でも使います。
---

CLI には業務用のコマンドが組み込まれていません。サインインすると、使えるコマンドを Studio に問い合わせるため、コマンドは常に Studio のバージョンとあなたの権限に一致します。

## インストールとサインイン

最も簡単な方法：Studio 右上のアカウントメニューで **Use Studio in your agent** をクリックし、**Connect a local Coding Agent** のセットアップ手順をエージェントに渡します。エージェントが `nb-studio` をインストールし、ブラウザーでサインインを承認するよう求め、スキルをインストールします。[ローカルのコーディングエージェントから Studio を使う](../join/local-agent.md) を参照してください。

自分でインストールするには、Node.js 24 以降が必要です。

```bash
curl -fsSL https://studio.example.com/main/api/agents/dist/installScript | sh -s -- --token <download credential>
nb-studio login --server https://studio.example.com/main
```

ダウンロード用の認証情報はそのセットアップ手順に含まれており、30 分間有効です。`nb-studio login` はコードを表示して承認ページを開きます。コードを確認して **Approve** をクリックします。サインインは 7 日間有効で、使い続けている限り自動で更新されます。

| コマンド | 内容 |
| --- | --- |
| `nb-studio login --server <address>` | サインインします。ブラウザーのないマシンでは `--no-browser` を付け、別の場所でアドレスを開いて承認します |
| `nb-studio login --server <address> --api-key-stdin` | 標準入力から読み取った自分の API キーでサインインします |
| `nb-studio whoami` | サインインしている身元、サーバー、権限を表示します |
| `nb-studio skills install` | Claude Code と Codex に `nb-studio-cli` スキルをインストールします |
| `nb-studio docs` | 使えるコマンドとその使い方を一覧表示します |
| `nb-studio update` | Studio が提供するバージョンに、スキルとともに更新します |
| `nb-studio logout` | サインアウトします |

複数の Studio を使う場合は、サーバーごとにプロファイルになります：`nb-studio profile list` と `nb-studio profile use <name>`。CI ではサインインを省略し、環境変数 `NB_STUDIO_SERVER` と `NB_STUDIO_API_KEY` を使います。

## コマンドを探す

- `nb-studio docs` で使えるコマンドを一覧表示し、`nb-studio <command> --help` でコマンドのオプションを表示します。
- `--json` を付けると機械可読の出力になり、スクリプトやエージェントに向いています。
- 権限が足りない場合、コマンドは存在しないと言うのではなく、どの権限が必要かを示します。`nb-studio whoami --missing` は、権限が足りないコマンドを一覧表示します。

## 主なコマンドグループ

| グループ | 対象 |
| --- | --- |
| `issue`、`comment`、`attachment` | タスク：検索、表示、作成、ステータスの更新、コメント、添付ファイル |
| `project`、`label` | プロジェクト、その初期化とメンバー、ラベル |
| `project-manager` | コーディネーターエージェントの設定と、タスクをコーディネーターエージェントに引き渡して開始すること |
| `agent`、`runtime`、`skill`、`variable` | エージェント、ランタイムと登録用の認証情報、スキル、変数とシークレット |
| `run`、`report` | 実行、ダッシュボードの数値、使用量 |
| `kb`、`memory` | ナレッジベースとプロジェクトメモリー |
| `git`、`pr`、`commit` | Git 接続、リポジトリ、個人の認可、PR |
| `preview`、`app`、`deploy`、`env`、`release`、`build`、`registry` | プレビュー、アプリ、デプロイとデプロイリクエスト、デプロイ環境、リリース、CI、レジストリ |
| `inbox`、`follow-up` | 受信トレイとフォロー中のタスク |
| `session`、`conversation` | セッション |
| `user`、`access`、`api-key` | アカウントと招待、ロール、API キー |

## Web ページでしかできないこと

次の操作にはコマンドがありません。エージェントがこれらに遭遇すると、`nb-studio-cli` スキルが、Web ページのどこであなたに操作を依頼すればよいかを伝えます。

| 操作 | 場所 |
| --- | --- |
| `nb-studio login` を承認する | 開かれる承認ページ |
| サインイン、パスワードの再設定、招待の受諾 | サインインページと招待リンク |
| GitHub App の接続を追加する | **Settings › Integrations › Git** |
| 自分のパスワードを変更する | **Account settings › Account and security** |
| 言語、テーマ、音によるリマインダー | **Account settings › Preferences** |

また、タスクの検収、PR のマージ、デプロイリクエストの承認は人だけが行えます。エージェントの実行ではどれもできません。
