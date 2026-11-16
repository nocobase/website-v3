---
title: "ファイルを Alibaba Cloud OSS などのオブジェクトストレージに保存できますか？"
---

はい。Core のストレージライブラリはネイティブの `oss` ドライバーと、S3 互換サービス向けの `s3` ドライバーを提供します。ファイルプラグインはその上でファイルレコード、アップロード、ダウンロード、アクセス制御を提供します。[ファイルストレージとドライバー](../core/framework/file-storage.md)、[ファイル管理](../core/using-plugins/data-and-files/file-management.md)を参照してください。

Alibaba Cloud OSS を使う場合は、`drive.disks` に `driver: oss` のディスクを追加し、Bucket、Region、サーバー側の認証情報を設定します。`drive.default` または業務機能のファイル設定でそのディスクを選びます。認証には AccessKey、または実行条件を満たす ECS 環境の RAM Role を使用できます。設定項目とネットワーク要件は [OSS ドライバーの設定](https://github.com/nocobase/nocobase/blob/2d79f24347b38e9286ffc5eac0ba451d7dae2841/packages/libs/drive/skills/nocobase-drive/references/oss.md)を参照してください。

鍵はサーバー側の設定で管理します。Bucket のアクセスポリシーとアプリのファイル権限をそれぞれ設定し、アップロード、ダウンロード、権限のないユーザーからのアクセスを検証してください。既定のディスクを変更しても、対象となる新しいファイル操作の保存先が変わるだけで、既存ファイルやレコードは自動で移行されません。移行にはオブジェクトのコピーとレコード更新も必要です。
