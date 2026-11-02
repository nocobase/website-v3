---
title: nocobase-runner コマンド
description: runner の登録と保守、ログの確認、ツール・環境変数・更新・作業ディレクトリの管理。
---

`nocobase-runner` は Studio の作業を受け取り、ランタイム上でコーディングツールを実行します。プロジェクトやタスクの管理には [nb-studio](cli.md)、runner の保守には本ページのコマンドを使います。

runner のマシンで、サービスを実行するシステムユーザーとして操作してください。`nocobase-runner --help`、または各コマンドの `--help` で現在のバージョンのオプションを確認できます。`logs` などの継続出力を行うコマンドを除き、`--json` で構造化された結果を取得できます。

## インストールと登録

初回は Studio の **Agent management › Runtimes** でインストールコマンドを生成します。手順は[ランタイムを接続する](../setup/shared-runtimes.md)を参照してください。専用のコンテナや仮想マシンをおすすめします。コーディングツールは runner のシステムユーザーの権限で動作します。

既存の runner を別の Studio に接続する場合や、認証情報の失効後に再接続する場合は、新しい一回限りの認証情報を使います。

```bash
nocobase-runner register --server https://studio.example.com/main --token '<registration-token>'
```

| オプション | 用途 |
| --- | --- |
| `--server` | `/main` などのアプリのパスを含む Studio の URL |
| `--token` | **Add runtime** で取得した一回限りの認証情報 |
| `--name` | runner の名前。既定はホスト名 |
| `--force` | 同じ Studio の有効な登録を置き換える。失効済みの登録には不要 |

登録後に runner を起動します。すでに動作中の場合は、一度停止して起動し直すと新しい接続が読み込まれます。1 台の runner を複数の Studio に接続できます。同時実行数とツール別の上限は、各 Studio のランタイム設定で管理します。

## 起動・停止・状態確認

```bash
nocobase-runner start
nocobase-runner status
nocobase-runner stop
```

`start` は既定でバックグラウンド実行です。`start --foreground` は現在のターミナルで実行します。`status` は接続先の Studio、プロセス、実行記録、接続ごとの同時実行設定を表示します。Studio でもランタイムが **Online** と表示されることを確認してください。

`stop` は実行中の作業を中断し、Studio に報告します。その後の割り当ては Studio が行います。停止を待つ時間は既定で 30 秒です。`stop --timeout 60` で延長できます。

## ログを確認する

| コマンド | 用途 |
| --- | --- |
| `nocobase-runner logs` | runner のログの末尾 100 行を表示 |
| `nocobase-runner logs --lines 200` | 表示行数を指定 |
| `nocobase-runner logs --follow` | 追加されるログを継続表示 |
| `nocobase-runner logs --run '<run-id>'` | 特定の実行のログを表示。ID は `status` で確認可能 |

runner のログの既定の保存先は `~/.nocobase-runner/logs/runner.log` です。

## ツールとモデルを設定する

既定では、エージェントに runner 付属の Node.js と pnpm を提供します。マシンの PATH 上のバージョンを使う場合は、次を実行します。

```bash
nocobase-runner config set agent-tools system
```

`config set agent-tools runner` で既定に戻せます。変更は新しく開始する作業に適用されます。Claude Code や Codex のインストールやサインインは、この設定では行いません。

モデルは通常、コーディングツールから自動検出します。報告する一覧を調整する場合は、次の `codex` とモデル ID を使用するツールとモデルに置き換えてください。

| コマンド | 用途 |
| --- | --- |
| `nocobase-runner config models codex show` | 手動の変更と内蔵の代替一覧を表示 |
| `nocobase-runner config models codex add '<model-id>'` | モデルを追加 |
| `nocobase-runner config models codex remove '<model-id>'` | モデルの報告を除外 |
| `nocobase-runner config models codex reset` | このツールの手動変更を解除 |

変更は次のハートビートで報告されます。追加は一覧を変更するだけです。使用するアカウントには、そのモデルへのアクセス権限が必要です。

## 環境変数

変数を runner に保存し、その変数を要求する作業に提供します。

```bash
nocobase-runner env set API_BASE_URL https://api.example.com --server https://studio.example.com/main
nocobase-runner env list --server https://studio.example.com/main
nocobase-runner env unset API_BASE_URL --server https://studio.example.com/main
```

`--server` を省略すると、登録済みのすべての接続が対象です。値はマシン内に保存され、Studio には名前だけが送られます。`env list` も値を表示しません。追加・変更は次のハートビートと後続の作業に反映されます。

機密値は標準入力から渡せます。たとえば、認証情報管理ツールが現在のシェルに `SERVICE_API_KEY` を設定している場合：

```bash
printf '%s' "$SERVICE_API_KEY" | nocobase-runner env set SERVICE_API_KEY --server https://studio.example.com/main
```

既存のシェル変数を渡す場合は、`start` または `service install` に `--pass-env NAME` を指定します。複数の変数には、このオプションを繰り返します。

| runner の環境変数 | 用途 |
| --- | --- |
| `NOCOBASE_RUNNER_HOME` | 状態、登録、キャッシュ、ログの保存先。既定は `~/.nocobase-runner` |
| `NOCOBASE_RUNNER_WORK_ROOT` | エージェントの作業ディレクトリ。既定は `~/.nocobase-runner-work`。HOME を変更した場合は、そのパスに `-work` を付加 |

状態と作業のディレクトリは重複できません。サービスのインストールと保守コマンドでは、同じディレクトリ設定を使ってください。

## バックグラウンドサービス

```bash
nocobase-runner service install --dry-run
nocobase-runner service install
nocobase-runner service uninstall
```

`service install` はユーザーサービスをインストールして起動します。macOS は launchd、Linux は systemd を使います。`--dry-run` は操作のプレビュー、`--label` はサービス名の指定です。Windows では WSL 内で Linux のコマンドを実行します。

サービスにはインストール時のシェルの PATH、プロキシ、CA、および `--pass-env` で指定した変数の値が保存されます。ターミナルで使えるツールをサービスが見つけられない場合や、変数を変更した場合は、正しいターミナルで `service install` を再実行してください。

`service uninstall` はサービスを停止して定義を削除します。runner のプログラムとデータは残ります。

## 更新とクリーンアップ

```bash
nocobase-runner update --check
nocobase-runner update
```

接続先の Studio が提供するバージョンに更新し、runner を再起動します。実行中の作業が中断される場合があります。複数の Studio に接続している場合は、`--server` で更新元を指定します。インストールスクリプトで導入した runner は、既定で自動更新が有効です。`update --auto off` で無効、`update --auto on` で有効にし、再起動して反映します。

作業ディレクトリと削除予定を確認してから、クリーンアップを実行します。

```bash
nocobase-runner gc
nocobase-runner gc --ended --apply
```

`gc` は既定ではプレビューのみです。`--apply` を指定すると削除します。`--ended` は Studio が完了と判断した作業、`--older-than 14d` は未使用期間、`--subject '<task-key>'` はタスクで絞り込みます。複数の条件を指定すると、すべてを満たすものが対象になります。

> [!WARNING] 作業ディレクトリが削除されます
> 完了した作業のディレクトリは、未コミットのファイルや未プッシュのコミットがあっても削除されます。それ以外のディレクトリに未プッシュの変更がある場合は `--force` が必要です。使用中のディレクトリは削除しません。プレビューを確認し、残す変更をリモートリポジトリにプッシュしてから実行してください。

自動クリーンアップは `nocobase-runner config set <key> <value>` で調整できます。

| 設定 | 既定値 | 用途 |
| --- | --- | --- |
| `min-free-disk` | `5G` | 確保する空き容量。`20G`、`10%`、`off` などを指定。クリーンアップ後も不足する場合は新しい作業を一時停止 |
| `artifact-ttl` | `24h` | 再生成できるファイルを削除するまでの未使用期間。`30m`、`2d`、`off` などを指定 |
| `artifact-patterns` | `node_modules,.next,.turbo` | 削除対象のディレクトリ名をカンマ区切りで指定。`default` で既定に戻す |

生成ファイルのクリーンアップではコードのチェックアウトを残し、一致するディレクトリだけを削除します。これらのディスクとクリーンアップの設定に再起動は不要です。

## 登録解除とアンインストール

1 つの Studio との接続を解除するには：

```bash
nocobase-runner stop
nocobase-runner unregister --server https://studio.example.com/main
```

`unregister` はローカルの接続記録と認証情報を削除します。Studio 内のランタイムは削除しません。他の接続を残す場合は、`start` で作業を再開してください。不要になったランタイムは、Studio で認証情報を失効させて削除します。

runner 全体をアンインストールする前に、削除範囲を確認します。

```bash
nocobase-runner uninstall --dry-run
nocobase-runner uninstall
```

`uninstall` は runner を停止し、サービスとインストールスクリプトで導入したプログラムを削除します。登録、キャッシュ、ログ、作業ディレクトリは残ります。`--purge` を付けると、これらのデータとエージェントの作業ディレクトリも削除します。`uninstall --purge --dry-run` で全範囲をプレビューできます。
