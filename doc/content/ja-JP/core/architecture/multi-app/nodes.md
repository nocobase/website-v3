---
title: Main と実行ノードの設定
---

## Main のアクセス URL を設定する

Main の `config.yml` に、ブラウザーが実際に使う origin を設定します。

```yaml
app:
  publicOrigin: https://apps.example.com
server:
  host: 0.0.0.0
  port: 13230
```

`publicOrigin` はプロトコル、ホスト、必要なポートだけで、`/main` を含めません。Main は通常 `/main/`、子アプリは同じ origin の個別パスを使います。`0.0.0.0` は待受アドレスであり、アクセス URL ではありません。

インスタンス作成前に安定した URL を決めてください。後からドメインやプロトコルを変更すると、コールバックや ID の紐付けにも影響するため、プロキシだけでなくログイン設定を調整します。

## デプロイ設定

### 完全な設定例

以下を **Main** の `config.yml` に、アクセス URL、DB、暗号鍵の設定と合わせて設定します。既存の `drive`、`deployment` キーを重複させないでください。既定の `storage/` を使うローカル保存の例であり、テンプレートが提供する既定値は変更しなければ省略できます。

```yaml
drive:
  disks:
    deploymentArtifacts:
      driver: fs
      location: storage/deployment/artifacts
      visibility: private

deployment:
  dataDir: storage/deployment
  artifacts:
    disk: deploymentArtifacts
    prefix: archives
  defaultNode: local
  nodes:
    local:
      name: Local Host
      enabled: true
      approvalRequired: false
      type: local
      local:
        host: 0.0.0.0
        port: 13231
        directory: storage/deployment/hosts/local
```

`drive` と `deployment` は同じ階層です。Drive が保存先を定義し、Deployment がディスクを参照して作業ディレクトリと実行ノードを管理します。子プロジェクトの `deploy.yml` はデプロイ要求用であり、ここには置きません。[子アプリの開発とデプロイ](development.md)を参照してください。

### 設定フィールド

| フィールド | 既定値・要件 | 用途 |
| --- | --- | --- |
| `deployment.dataDir` | アプリの保存先配下の `deployment/` | ノードとディレクトリの対応、成果物キャッシュ、デプロイログ |
| `deployment.artifacts.disk` | `deploymentArtifacts` | `drive.disks` 内の非公開ディスク。`drive.default` とは独立 |
| `deployment.artifacts.prefix` | `archives` | 保存キーの接頭辞。実際は `<prefix>/<sha256>.tar.gz` |
| `deployment.defaultNode` | `local` | 既定ノード。有効ノードがあればそのいずれかを指定 |
| `deployment.nodes` | 既定では有効な `local` を含む | 安定したノード ID をキーにする設定 |
| `nodes.<id>.name` | 空でない名前 | 表示名 |
| `nodes.<id>.enabled` | 明示する真偽値。既定ノードは `true` | Main が起動するか |
| `nodes.<id>.approvalRequired` | 省略・`false` では承認不要 | 別の権限を持つ管理者の承認を要求するか |
| `nodes.<id>.type` | 現在は `local` のみ | ノードの種類 |
| `nodes.<id>.local.host` | 既定ノードは `0.0.0.0` | 内部の待受アドレス |
| `nodes.<id>.local.port` | 既定ノードは `13231` | Main や他のノードと競合しない内部ポート |
| `nodes.<id>.local.directory` | 既定ノードは保存先配下の `deployment/hosts/local` | コード、永続データ、制御状態の保存先 |

`nodes.<id>` はすべて `deployment` 配下です。`prefix` は英数字、下線、ハイフン、区切りの `/` を使います。先頭・末尾の `/` や `..` は使えません。

### Drive に成果物を保存する

既定の `fs` は `storage/deployment/artifacts/archives/` に原本を保存します。`visibility: private` が必須で、設定オブジェクト形式の `fs`、`s3`、`oss` を使えます。存在しないディスク、bucket 未設定の仮設定、公開ディスクは使えません。

**以後のアップロード**を S3 に保存する例です。実際の bucket と region に置き換えてマージします。

```yaml
drive:
  disks:
    buildObjects:
      driver: s3
      bucket: application-builds
      region: us-east-1
      visibility: private
      supportsACL: false
      credentials: {}

deployment:
  artifacts:
    disk: buildObjects
    prefix: archives
```

この例はサーバーの AWS 資格情報チェーンを使います。`credentials: {}` は匿名アクセスではありません。ロールや秘密設定で資格情報を提供し、クライアントやソース管理へ含めません。OSS も非公開ディスクを設定して `deployment.artifacts.disk` で選びます。変更後は設定検証と Main の再起動を行います。

アップロードはサイズ、摘要、構造をローカルで検証してから Drive に保存します。デプロイ時は記録されたディスクとキーで原本を読み、検証済みキャッシュをノードに渡します。そのためオブジェクトストレージでもローカルの書き込み領域は必要です。

**ディスクや prefix の変更は既存成果物を移行しません。** 旧版が参照するディスク設定とオブジェクトを維持してください。同名ディスクを空の保存先や別 bucket に向ける変更も避けます。自動移行と全体の成果物ガベージコレクションは提供されません。

## 実行ノード

### 既定の実行ノードを設定する

Main が起動時にプロセスを開始します。変更後は `pnpm nocobase config check` を実行して Main を再起動します。ノードのポートは内部制御・転送用なので、不要なネットワークアクセスを制限してください。

`APP_DEPLOYMENT_NODE_ENABLED`、`APP_DEPLOYMENT_NODE_PORT`、`APP_DEPLOYMENT_NODE_BIND` は `local` の有効状態、ポート、待受アドレスを上書きします。他のノードには作用しません。

### 複数のローカル実行ノードを設定する

同じ `deployment.nodes` に、`local` と並ぶ項目を追加します。

```yaml
    local-2:
      name: Local Host 2
      enabled: true
      approvalRequired: true
      type: local
      local:
        host: 0.0.0.0
        port: 13232
        directory: storage/deployment/hosts/local-2
```

有効なノードは Main とも他のノードとも異なるポートを使います。保存先は同一や入れ子にできません。`defaultNode` は有効なノードを指定します。

設定は既定値とマージされます。他のノードだけを使うなら `deployment.nodes.local.enabled: false` を明示します。`approvalRequired: true` の操作には別の権限を持つ管理者の承認が必要です。

現在は `type: local` のみ対応します。同一マシン上の複数ノードは、マシン間の高可用性を提供しません。

### ノードの状態と実行要件を確認する

**System settings → Deployment management → Runtime nodes** で設定、接続状態、実行プラットフォームを確認します。ノードは Main の設定で定義し、画面やプロジェクト CLI からは作成しません。

デプロイ前に OS、CPU、libc、Node.js、データベースドライバーの互換性を確認します。利用不可の場合は Main とノードのログを調べます。状態の更新は確認だけで、失敗したプロセスを起動する操作ではありません。

### 実行ノードを停止対象にする

依存するインスタンスを確認し、保守時間とデータ保全を準備します。ノードを `enabled: false` にして Main を再起動し、必要なら `defaultNode` も変更します。

設定の無効化・削除でインスタンスは移行されず、記録やデータも削除されません。ノード ID は永続ディレクトリに結び付いています。ID の変更や他ノードのディレクトリ再利用で移行しないでください。復旧時は元の ID と保存先を使います。

## HTTPS とリバースプロキシを設定する

DNS と有効な証明書を用意し、origin 全体を Main の `13230` に転送します。`/main/` と子アプリのパスを維持し、WebSocket Upgrade に対応させます。

`/main/` だけを転送すると子アプリが 404 になります。子アプリを任意のノードへ直接転送せず、Main のルーティングを使います。ホストとプロトコルを `app.publicOrigin` に合わせ、証明書検証を維持してください。

Main、子アプリ、SSO コールバック、リアルタイム接続を確認します。

## 開発・内部ネットワークで HTTP を使う

管理された開発、内部ネットワーク、VPN に限定して、Main に正確な origin を追加します。

```yaml
app:
  publicOrigin: http://192.168.1.10:13230
sso:
  insecureRedirectOrigins:
    - http://192.168.1.10:13230
```

パス、ワイルドカード、`0.0.0.0` は含めません。独立アプリが別の origin を使う場合は、それも個別に追加します。

YAML 配列を直接編集し、検証して Main を再起動してから、失敗した作成・接続操作を再試行します。子アプリ側の設定ではなく、クライアントの正確なコールバック登録も別途必要です。HTTP はログイン情報やクライアント秘密情報も送信するため、公開時は HTTPS を使います。

## デプロイのディレクトリ構造

### Main のデプロイディレクトリ

既定の構造です。プレースホルダーはノード、インスタンス、操作、成果物摘要を表し、ログのマーカーファイルは該当時のみ作成されます。

```text
storage/deployment/
├── host-directories.json
├── artifacts/
│   └── archives/<sha256>.tar.gz
├── cache/artifacts/
│   ├── incoming/
│   └── archives/<sha256>.tar.gz
├── logs/<instanceId>/
│   ├── <deploymentId>.jsonl
│   ├── <deploymentId>.jsonl.incomplete
│   └── <deploymentId>.jsonl.truncated
└── hosts/<nodeId>/
    ├── config.yml
    ├── revisions/<instanceId>/
    │   ├── .active-revision
    │   ├── .lifecycle.json
    │   └── <sha256>/
    ├── volumes/<instanceId>/
    │   ├── configs/config.<revision>.yml
    │   └── storage/
    ├── control/
    │   ├── owner.json
    │   └── operations/<scopeId>/<operationId>.json
    ├── output/
    └── logs/
```

| 場所 | 内容 |
| --- | --- |
| `host-directories.json` | ノード ID と永続保存先の対応。誤った再利用を防ぐ |
| `artifacts/archives/` | 既定 Drive の原本。オブジェクトストレージでは bucket に保存 |
| `cache/artifacts/incoming/` | アップロード検証中の一時ファイル。通常の処理終了時に除去 |
| `cache/artifacts/archives/` | Drive から読み込んだ検証済みアーカイブ |
| `logs/<instanceId>/<deploymentId>.jsonl` | 1 回のデプロイと回復試行のイベント |
| `.incomplete`、`.truncated` | 捕捉の不完全・容量上限の印。完全なログとして扱わない |

パッケージ、バージョン、インスタンス、操作のメタデータは **Main の DB** に保存します。DB の場所は DB 設定で決まり、`storage/deployment/` だけでは十分なバックアップになりません。

### ノードとインスタンスのデータ

| ノード内のパス | 内容と扱い |
| --- | --- |
| `config.yml` | 自動生成される App Host 設定。直接編集せず Main の設定を変更 |
| `revisions/<instanceId>/<sha256>/` | 展開済みコードと依存関係 |
| `revisions/<instanceId>/.active-revision`、`.lifecycle.json` | 現在版とライフサイクル状態。使い捨てキャッシュではない |
| `volumes/<instanceId>/configs/` | 修訂別の設定。秘密情報を含む場合がある |
| `volumes/<instanceId>/storage/` | 既定の永続データ。外部 DB やファイルは実際の設定に従う |
| `control/` | 所有権と操作控え。調整・回復に使うためロックや記録を手動削除しない |
| `output/` | 監督プロセスが記録する子プロセスの出力 |
| `logs/` | App Host 自身のログ。Main の操作イベントとは別 |

古いコードの保持は当時の DB の保持や一括ロールバックを意味しません。設定変更は UI や CLI を使い、プラットフォームの記録と実行状態を一致させます。

### 設定と保存先の対応

| 設定 | 対象 |
| --- | --- |
| `drive.disks.<disk>.location`（`fs`） | 原本保存先。この下に `deployment.artifacts.prefix` を追加 |
| オブジェクトストレージの bucket など | 原本のリモート保存先 |
| `deployment.dataDir` | `host-directories.json`、`cache/artifacts/`、操作 `logs/` のルート |
| `deployment.nodes.<id>.local.directory` | ノードの `revisions/`、`volumes/`、`control/`、`output/`、`logs/` のルート |

これらは独立しています。`dataDir` の変更では Drive やノードのデータは移動しません。ディスク変更でもインスタンスデータは移動しません。

既定値はアプリの保存先から生成され、`APP_STORAGE_DIR` で既定ルートを変更できます。一方、例に明示した `storage/...` は起動時の作業ディレクトリ基準で、新しいルートには自動変換されません。必要なら絶対パスを使い、起動ディレクトリを安定させます。

ノード ID は絶対保存先に結び付きます。変更で `HOST_DIRECTORY_IDENTITY_CHANGED` になっても、対応ファイルを消して回避しないでください。移行と検証を別途計画します。再起動でファイルは移動しません。

子プロジェクトの `storage/deployment/` は CLI の送信控え用で、Main の同名ディレクトリとは別です。結果不明の操作調査ではこちらも保持します。

<a id="永続ストレージとバックアップ"></a>

## 永続化とバックアップ

### 保持するデータ

Main の DB、`config.yml`、暗号鍵、参照中の Drive 原本、ノードの永続ディレクトリ全体を保存します。業務ファイルに加えて `host-directories.json`、インスタンス設定、制御状態も対象です。

外部 DB、ファイルサービス、オブジェクトストレージも含めます。保守時間や DB の整合性バックアップ機能を使い、データとファイル、設定を一緒に復元できるようにします。書き込み中のディレクトリコピーだけでは復元可能性を保証しません。

更新時のバックアップ確認はバックアップを実行しません。ファイルの存在だけでなく、復元後のデータ、状態、ログインを定期的に確認します。

### 再構築できるキャッシュ

`cache/artifacts/archives/` は原本と資格情報が有効なら再取得・検証できます。クリーンアップ前に関連するアップロード、デプロイ、回復を停止または完了させ、使用中のファイルを削除しないでください。

キャッシュの再構築は業務データを復元しません。原本が失われた場合、キャッシュが残存コピーかもしれません。先に削除しないでください。`revisions/` 全体には状態もあるため、キャッシュ扱いで消しません。

### 削除とクリーンアップの境界

インスタンス削除は Main または CLI から行います。既定では永続データを保持し、明示した消去と確認で対象ローカルデータを削除します。外部 DB やオブジェクトまで消えるとは限らず、設定に応じて別途確認します。

版の削除は成果物管理で参照と保持規則に従います。共有原本を直接削除したり、通常添付管理から確認を回避したりしません。ノード無効化も記録やデータを削除しません。

デプロイイベントはインスタンス削除では自動除去されません。1 操作のログには上限がありますが、全操作を横断する自動保持期間のクリーンアップはありません。監査要件に従って保存後に整理します。`output/`、ノードログ、操作ログを別々に管理し、そのクリーンアップ規則を `control/` やデータへ適用しないでください。
