---
title: "ファイルと成果物のストレージ"
description: "ローカルファイル、S3 互換サービス、リリース成果物の保存先を設定します。"
---

`drive.disks` で保存先を定義し、`drive.default` でアップロード用ディスクを選びます。ディスク名は任意で、`driver` が接続方式を決めます。

| ドライバー | 用途 |
| --- | --- |
| `fs` | ローカルファイルシステム |
| `s3` | Amazon S3 または S3 互換サービス |

必要な設定を `config.yml` に統合し、バケット、リージョン、認証情報を置き換えます。`docker compose up -d --force-recreate studio` で反映してください。

## ローカルファイル（fs）

既定はローカル保存です。Docker では `/app/storage` を永続化したディレクトリにマウントします。

```yaml
drive:
  default: local
  disks:
    local:
      driver: fs
      location: /app/storage
      visibility: private
```

`location` はコンテナ内のディレクトリで、Studio プロセスから書き込める必要があります。別の方式でデプロイする場合は、永続化した保存先を指定してください。

## S3

この例は Amazon S3 を使います。S3 互換サービスの場合は、必要に応じて `endpoint` と `forcePathStyle` を追加します。

```yaml
drive:
  default: s3
  disks:
    s3:
      driver: s3
      bucket: example-studio-files
      region: us-east-1
      supportsACL: false
      visibility: private
      credentials:
        accessKeyId: replace-with-access-key-id
        secretAccessKey: replace-with-access-key-secret
```

| 設定 | 意味 |
| --- | --- |
| `bucket`、`region` | バケット名とリージョン |
| `endpoint` | S3 互換サービスの URL。Amazon S3 では省略可能 |
| `forcePathStyle` | サービスが必要とする場合、パス形式でバケットにアクセス |
| `supportsACL` | オブジェクト ACL への対応。ACL 無効のバケットは `false` |
| `credentials` | アクセスキー。`{}` で AWS SDK の既定の認証情報チェーンを使用 |

バケット自体も非公開にしてください。`visibility: private` ではバケットポリシーは変わりません。

## 単一ファイルのアップロードサイズ

タスク、コメント、エージェント会話の添付ファイルは、保存先ディスクの `maxFileSizeMb` を使います。既定は 20 MiB で、正の整数を指定します。以下はローカルディスクを 50 MiB にする例です。

```yaml
drive:
  disks:
    local:
      maxFileSizeMb: 50
```

S3 では対応するディスクに `maxFileSizeMb` を追加します。ディスクごとに異なる上限を設定できます。どのディスクでも無効な値があると Studio は起動しません。この項目は他のファイル API の制限やリリース成果物の上限を置き換えません。

変更後は Studio を再起動し、ページを再読み込みします。リバースプロキシの上限にはファイルと multipart フォームの両方が収まる必要があります。`api.bodyLimit` を設定している場合は、その上限も満たしてください。ファイルサイズだけで上限に達しないよう余裕を持たせます。

## リリース成果物

ファイルアップロードとビルド成果物は別設定です。`drive.default` を変えても、成果物の保存先は変わりません。成果物の既定値は `/app/storage/releases/artifacts` です。

上記の S3 ディスクに保存する場合：

```yaml
releases:
  artifact:
    disk: s3
    prefix: releases/artifacts
```

`disk` は `drive.disks` の項目名、`prefix` は省略可能なオブジェクトキーの接頭辞です。成果物のディスクは非公開にします。名前で参照する成果物用ディスクには `fs` または `s3` を使います。

Studio とプレビュー Host の両方から成果物にアクセスできる必要があります。ブラウザー用の直接ダウンロードリンクを生成するファイルディスクは、ブラウザーからも接続できるアドレスにしてください。

成果物の上限は既定で 256 MiB です。`releases.maxArtifactSizeMB` で変更できます。大きなアップロードには、リバースプロキシと `api.bodyLimit` の制限も適用されます。

## 保存先を変更して確認する

ディスクの変更では既存ファイルを移行しません。先にファイルをコピーし、キーを維持してから切り替えます。プレフィックスを追加しても、過去の成果物は移動しません。オブジェクトストレージを使う場合も、Studio の `storage` は永続化してください。

1. タスクやナレッジベースにテストファイルをアップロードし、再読み込みしてダウンロードします。
2. ビルドを実行し、成果物のアップロード成功を確認します。
3. PR プレビューを開き、成果物を取得して起動できることを確認します。
