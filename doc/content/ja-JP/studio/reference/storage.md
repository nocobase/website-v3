---
title: ファイルと成果物のストレージ
description: ローカルファイル、S3 互換サービス、リリース成果物のストレージを設定します。
---

`drive.disks` はストレージの場所を定義します。`drive.default` は、ファイルのアップロードに使うディスクを選びます。ディスクの名前は自由に付けられ、`driver` が Studio の接続方法を決めます。

| ドライバー | 用途 |
| --- | --- |
| `fs` | ローカルのファイルシステム |
| `s3` | Amazon S3 または S3 互換サービス |

必要な設定を `config.yml` にマージし、例のバケット、リージョン、認証情報を置き換えます。`docker compose up -d --force-recreate studio` で変更を反映します。

## ローカルファイル（fs）

Studio は既定でローカルストレージを使います。Docker でデプロイする場合は、`/app/storage` を永続化されたディレクトリにマウントします。

```yaml
drive:
  default: local
  disks:
    local:
      driver: fs
      location: /app/storage
      visibility: private
```

`location` はコンテナ内のディレクトリで、Studio のプロセスが書き込める必要があります。その他のデプロイ方法では、永続化されたストレージのディレクトリを使います。

## S3

この例では Amazon S3 を使います。S3 互換サービスでは、そのサービスの要件に応じて `endpoint` と `forcePathStyle` を追加します。

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
| `endpoint` | S3 互換サービスの URL。Amazon S3 では省略できます |
| `forcePathStyle` | サービスが求める場合に、パス形式でバケットにアクセスします |
| `supportsACL` | オブジェクトの ACL に対応しているかどうか。ACL を無効にしたバケットでは `false` にします |
| `credentials` | アクセスキー。AWS SDK の既定の認証情報チェーンを使う場合は `{}` にします |

バケット自体も非公開にしてください。`visibility: private` はバケットポリシーを変更しません。

## リリース成果物

ファイルのアップロードとビルド成果物は別々の設定を使います。`drive.default` を変更しても、成果物のストレージは変わりません。成果物の既定の場所は `/app/storage/releases/artifacts` です。

上の S3 ディスクに成果物を保存するには：

```yaml
releases:
  artifact:
    disk: s3
    prefix: releases/artifacts
```

`disk` には `drive.disks` のエントリーの名前を指定し、`prefix` は任意のオブジェクトキーの接頭辞です。成果物用のディスクは非公開である必要があります。名前で参照する成果物用のディスクには、`fs` または `s3` を使います。

Studio とプレビューのホストは、成果物のストレージに到達できる必要があります。ファイルディスクがブラウザー向けの直接ダウンロードリンクを生成する場合は、そのアドレスにブラウザーからも到達できる必要があります。

成果物の上限は既定で 256 MiB で、`releases.maxArtifactSizeMB` で調整できます。大きなアップロードは、リバースプロキシと `API_BODY_LIMIT` によっても制限されます。

## ストレージの切り替えと確認

ディスクを変更しても、既存のファイルは移行されません。切り替える前に、キーを保ったままファイルをコピーしてください。接頭辞を追加しても、古い成果物は移動しません。オブジェクトストレージを使う場合も、Studio の `storage` ディレクトリは永続化しておいてください。

1. タスクかナレッジベースにテスト用のファイルをアップロードし、再読み込みしてからダウンロードします。
2. ビルドを実行し、成果物のアップロードが成功することを確認します。
3. PR プレビューを開き、成果物を読み込んで起動できることを確認します。
