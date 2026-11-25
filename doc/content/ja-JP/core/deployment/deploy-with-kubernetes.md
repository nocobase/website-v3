---
title: Kubernetes でデプロイする
description: Agent または手動操作で Kubernetes にアプリをデプロイし、データベース更新、検証、リリースを行い、デプロイ用マニフェストを Helm Chart にまとめる方法。
minimumEdition: enterprise
---

## デプロイ前の準備

利用できる Kubernetes クラスターを用意し、管理用マシンに `kubectl` をインストールして設定します。まず接続先が対象のクラスターであることを確認し、ノードのアーキテクチャと既存の入口・ストレージ設定を調べます。

```bash
kubectl config current-context
kubectl get nodes -L kubernetes.io/arch
kubectl get ingressclass
kubectl get storageclass
```

クラスターを確認したら、アプリとその依存サービスに必要なリソースを準備します。

- **アプリの設定**：[複数インスタンスでのデプロイ](multi-instance-deployment.md)に従ってアプリを対応させ、必要なデータベース、Redis、ファイルストレージを設定します。
- **アプリイメージ**：対応が完了したら、[Docker でデプロイする](../tutorials/deploy-with-docker.md#docker-イメージをビルドする)に従い、ノードのアーキテクチャに合ったイメージをビルドしてレジストリにプッシュします。
- **外部からのアクセス**：クラスターに Ingress Controller がインストールされていることを確認し、アプリのドメインと TLS 証明書を準備します。
- **共有ストレージ**：ファイルシステムにファイルを保存する場合は、`ReadWriteMany`（RWX）に対応した StorageClass を用意します。

> [!TIP]
> StorageClass は、利用するストレージサービスなど、Kubernetes がストレージボリュームを作成する方法を定義します。`ReadWriteMany`（RWX）は、複数のノードが同じボリュームを同時にマウントして読み書きできることを表します。これにより、異なるノード上のアプリレプリカでアップロードファイルを共有できます。代表的なバックエンドには NFS、CephFS、クラウドのファイルストレージがあります。対応状況はサービスとドライバーによるため、利用できる StorageClass 名をクラスター管理者に確認してください。

以下では、名前空間とアプリ名に `my-app`、イメージに `registry.example.com/team/my-app:1`、アクセス先に `https://apps.example.com/main/` を使用します。デプロイ時は実際のイメージとドメインに置き換えてください。リソース名を変更する場合は、各マニフェストの参照も一致させます。`<…>` は入力が必要なプレースホルダーです。山括弧を含めて置き換えてください。

## Agent を使う

### デプロイ設定を生成する

アプリのプロジェクトを読み取り、コマンドと `kubectl` を実行できる環境で開発用 Agent を起動します。既存のデプロイがある場合は、元の設定を先にバックアップしてください。パスワード、キー、レジストリのトークンはローカルファイルや既存の Secret で提供し、プロンプトには記載しません。

デプロイの目的を伝え、既存の設定を調べてから必要なリソースを確認してもらいます。

```text
次の Kubernetes デプロイガイドを読み、現在のプロジェクトに合わせてレプリカ数2のデプロイ計画を作成してください。
https://docs.nocobase.com/ja-JP/core/deployment/deploy-with-kubernetes/

まずプロジェクトの設定を調べ、対象環境、イメージ、依存サービス、ストレージ、アクセス方法を私に確認してください。ガイドに沿ってマニフェストを準備し、プロジェクトの実態と合わない点があれば、そのまま適用せずに違いを説明してください。

Kubernetes のリソースマニフェストをデプロイ用ディレクトリに保存し、その直下に README.md を作成してください。上記のガイドの URL、環境別パラメーター、再利用できるデプロイ・更新・バックアップ・ロールバック・検証の手順を記録してください。既存のデータとキーを維持し、機密値は記録しないでください。

まずレビュー用のファイルを生成してください。私が承認するまで、クラスターの操作や業務データの変更は行わないでください。
```

### デプロイと検証を実行する

計画を確認したら、次のプロンプトで Agent にデプロイと検証を依頼します。

```text
デプロイ計画を承認しました。デプロイ用ディレクトリの README.md とリソースマニフェストを読み、そこに記載されたガイドに従って次の作業を実行してください。

1. 対象のクラスター、名前空間、イメージ、設定を確認し、計画したバックアップを完了してください。必要な条件が不足している場合や、承認済みの変更範囲を超える必要がある場合は、先に私に確認してください。
2. 今回のアプリイメージでデータベース更新 Job を実行し、成功してからアプリを起動またはローリングアップデートしてください。失敗やタイムアウトの場合は後続の変更を止め、問題を報告してください。許可なくマイグレーションを再実行しないでください。
3. ガイドに従って HTTPS アクセス、ログイン、データとファイルの読み書き、レプリカ間の業務機能を検証してください。テスト環境では、Pod 再作成後のデータとファイルの永続性も確認してください。実行できないチェックは未検証とし、ヘルスチェックの成功を業務機能の検証の代わりにしないでください。
4. デプロイと検証のレポートを作成し、対象環境、実際のイメージ、各チェックの結果と根拠、未解決の問題を記載してください。成功、失敗、未検証を明確に区別してください。
5. 実際の調整をリソースマニフェストと README.md に反映し、ガイドの URL と再利用できる操作手順を残してください。以降の更新では、まずこれらのファイルを読み、再利用してください。
```

### Helm Chart を生成する

Helm Chart の生成は任意です。既存のデプロイ用マニフェストを再利用可能なテンプレートにまとめたい場合は、Agent に変換を依頼できます。

```text
デプロイ用ディレクトリの README.md とそこに記載されたガイドを読み、現在の設定と外部サービスを維持したまま、既存の Kubernetes マニフェストを Helm Chart にまとめてください。

まず、Helm が管理するリソース、独立して管理し続ける依存リソース、既存のデプロイからの引き継ぎ方法を説明してください。データとキーを維持し、データベース更新が成功してからアプリをリリースするようにしてください。

Chart と環境別パラメーターを作成してローカルで検証し、インストール、アップグレード、ロールバック、検証の手順を README.md に追加してください。検証結果と未検証の項目も報告してください。
まず Chart と引き継ぎ計画を私に提示し、承認を待ってください。許可なくリソースの管理を引き継いだり、クラスターを操作したりしないでください。
```

## デプロイ用ディレクトリとファイル

デプロイ用ファイルは、管理用マシンの `my-app-k8s` ディレクトリにまとめます。

```tree
my-app-k8s/
├── .gitignore       # ローカルの機密ファイルを除外
├── configmap.yml    # 機密情報を含まない config.yaml を埋め込む
├── secrets.env      # パスワードやキーなどの環境変数。Git にコミットしない
├── files-pvc.yml    # 業務ファイル用の共有ボリューム
├── db-job.yml       # データベース更新 Job
├── app.yml          # アプリの Deployment と Service
└── ingress.yml      # ドメイン、HTTPS、入口のルーティング
```

`config.yaml` は `configmap.yml` に埋め込むため、別ファイルとして作成する必要はありません。デプロイ用ディレクトリを作成して移動し、以降のコマンドはそこで実行します。

```bash
mkdir -p "$HOME/my-app-k8s"
cd "$HOME/my-app-k8s"
```

`.gitignore` に `secrets.env` を追加します。

```text title=".gitignore"
secrets.env
```

## 名前空間とイメージ取得用の認証情報を作成する

アプリ用の名前空間 `my-app` を作成します。以降のマニフェストにあるリソースは、この名前空間にデプロイします。

```bash
kubectl create namespace my-app
```

同じ名前空間に `registry-pull` という Secret を作成し、Kubernetes がプライベートイメージを取得できるようにします。プレースホルダーを実際のレジストリのアドレス、ユーザー名、アクセストークンに置き換えてください。アカウントには対象イメージの取得権限が必要です。

```bash
kubectl -n my-app create secret docker-registry registry-pull \
  --docker-server='<イメージレジストリのアドレス>' \
  --docker-username='<レジストリのユーザー名>' \
  --docker-password='<レジストリのアクセストークン>'
```

Job と Deployment は、`imagePullSecrets` で `registry-pull` を参照します。

## 実行設定とファイルストレージをマウントする

### ConfigMap で機密情報を含まない設定をマウントする

`configmap.yml` を作成し、機密情報を含まないアプリ設定を `data.config.yaml` に記述します。データベースのパスワードやアプリのキーなどは、次の節の Secret で提供します。

既存のアプリ設定で、次の項目を確認してください。

- 管理対象の各データベース接続で `migrations.autoRun` と `seeds.autoRun` を `false` にします。データベース更新は、後述の Job で個別に実行します。設定箇所は[複数インスタンスのリリース手順](multi-instance-deployment.md#複数のインスタンスを起動する)を参照してください。
- 以下の共有ボリュームを使う場合は、業務ファイルを保存するディスクのパス（例：`drive.disks.local.location`）を `/app/files` にします。オブジェクトストレージを使う場合は既存の設定を維持します。詳細は[ファイルストレージとドライバー](../framework/file-storage.md#ディスクを設定する)を参照してください。

この例では `server` と `app` のみを示しています。末尾のプレースホルダーコメントを、準備したデータベース接続と共有サービスの設定に置き換え、スペース4つのインデントを維持してください。

```yaml title="configmap.yml"
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-app-config
  namespace: my-app
data:
  config.yaml: |
    server:
      host: 0.0.0.0
      port: 13000
    app:
      publicOrigin: https://apps.example.com
      sampleData: false
    # <機密情報を含まないデータベース接続と共有サービスの設定をここに追加>
```

```bash
kubectl apply -f configmap.yml
```

Job と Deployment は、この設定を `/run/nocobase/config.yaml` に読み取り専用でマウントします。読み取り先は `APP_CONFIG_FILE` で指定します。

### Secret で機密情報を環境変数に注入する

デプロイ用ディレクトリに `secrets.env` を作成し、アプリが対応する[環境変数](../reference/configuration.md#環境変数)で機密情報を設定します。1行につき `変数名=値` を記述し、`export` や値を囲む引用符は付けません。

```text title="secrets.env"
DB_PASSWORD=<データベースのパスワード>
SECRETS_KEYS=<キーのバージョン>:<キーの値>
INITIAL_ADMIN_PASSWORD=<初期管理者のパスワード>
```

`DB_PASSWORD` は `main` データベース接続に対応します。既存アプリをデプロイする場合、`SECRETS_KEYS` には元のキーのバージョンと値を維持してください。既存データの復号に必要なキーも残します。

ファイルを保存したら、`my-app` 名前空間の Secret `my-app-secrets` を作成または更新します。

```bash
kubectl -n my-app create secret generic my-app-secrets \
  --from-env-file=secrets.env --dry-run=client -o yaml | kubectl apply -f -
```

Job と Deployment は `envFrom.secretRef` で `my-app-secrets` を参照し、コンテナーの起動時に各項目を環境変数として注入します。`secrets.env` は Secret の作成・更新にのみ使うため、コンテナーへのマウントは不要です。

`secrets.env` やエクスポートした Secret の内容をバージョン管理にコミットしないでください。

### 業務ファイル用の共有ボリュームを設定する

業務ファイルをファイルシステムに保存する場合、各アプリレプリカが同じファイルにアクセスできる必要があります。後述の Job と Deployment は、共有ボリュームを `/app/files` にマウントします。

業務ファイルがすべてオブジェクトストレージに保存されている場合は、この節を省略できます。その場合、後述の Job と Deployment から `files` のボリュームとマウントも削除してください。

`files-pvc.yml` を作成し、PersistentVolumeClaim（PVC）で共有ボリュームを要求します。複数ノードからの同時読み書き（RWX）に対応した StorageClass を選び、必要に応じて `storage` の容量を変更します。

```yaml title="files-pvc.yml"
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-app-files
  namespace: my-app
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: "<RWX 対応の StorageClass 名>"
  resources:
    requests:
      storage: 10Gi
```

PVC を作成し、バインド状態を確認します。

```bash
kubectl apply -f files-pvc.yml
kubectl -n my-app get pvc my-app-files
```

バインドが完了すると、PVC の状態は `Bound` になります。StorageClass が遅延バインドを使う場合は、後述の Job がそのボリュームを使う Pod を作成するまで、一時的に `Pending` のままになります。

アプリを起動する前に、既存の業務ファイルを共有ボリュームへ移行し、アプリのコンテナーが読み書きできることを確認してください。

## Job でデータベースを更新する

`db-job.yml` を作成します。アプリと同じイメージと設定を使い、マイグレーションとデータ初期化を個別に実行します。

```yaml title="db-job.yml"
apiVersion: batch/v1
kind: Job
metadata:
  name: my-app-db
  namespace: my-app
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      imagePullSecrets:
        - name: registry-pull
      securityContext:
        fsGroup: 1000
      containers:
        - name: migrate
          image: registry.example.com/team/my-app:1
          command: ["node", "dist/cli/index.js"]
          args: ["db", "apply", "--connection", "main"]
          envFrom:
            - secretRef:
                name: my-app-secrets
          env:
            - name: APP_CONFIG_FILE
              value: /run/nocobase/config.yaml
          volumeMounts:
            - name: config
              mountPath: /run/nocobase
              readOnly: true
            - name: files
              mountPath: /app/files
      volumes:
        - name: config
          configMap:
            name: my-app-config
        - name: files
          persistentVolumeClaim:
            claimName: my-app-files
```

`--connection main` は `main` データベース接続を更新します。管理対象の接続をすべて更新する場合は、`--all` に置き換えます。`backoffLimit: 0` は失敗後の自動再試行を無効にします。

Job を作成して完了を待ち、ログを確認します。

```bash
kubectl create -f db-job.yml
kubectl -n my-app wait --for=condition=complete job/my-app-db --timeout=600s
kubectl -n my-app logs job/my-app-db
```

**Job が `Complete` になったことを確認してから、アプリをデプロイしてください。** 待機がタイムアウトしても Job は停止しません。まず状態とログを確認し、そのまま再実行しないでください。

## Deployment と Service を作成する

### アプリレプリカとリソースの設定

`app.yml` を作成し、2つのアプリレプリカを実行します。Service を通してクラスター内からアクセスできるようにします。

```yaml title="app.yml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      terminationGracePeriodSeconds: 60
      imagePullSecrets:
        - name: registry-pull
      securityContext:
        fsGroup: 1000
      containers:
        - name: app
          image: registry.example.com/team/my-app:1
          ports:
            - name: http
              containerPort: 13000
          envFrom:
            - secretRef:
                name: my-app-secrets
          env:
            - name: NOCOBASE_STRICT_STARTUP
              value: "true"
            - name: APP_CONFIG_FILE
              value: /run/nocobase/config.yaml
          readinessProbe:
            httpGet:
              path: /main/api/healthz
              port: http
          volumeMounts:
            - name: config
              mountPath: /run/nocobase
              readOnly: true
            - name: files
              mountPath: /app/files
      volumes:
        - name: config
          configMap:
            name: my-app-config
        - name: files
          persistentVolumeClaim:
            claimName: my-app-files
---
apiVersion: v1
kind: Service
metadata:
  name: my-app
  namespace: my-app
spec:
  selector:
    app: my-app
  ports:
    - port: 13000
      targetPort: http
```

リソースを作成し、アプリの準備が整うまで待機します。

```bash
kubectl apply -f app.yml
kubectl -n my-app rollout status deployment/my-app --timeout=600s
kubectl -n my-app get pods -l app=my-app -o wide
```

`READY` が `1/1` のアプリ Pod が2つ表示されることを確認してください。

### ヘルスプローブと正常終了

`readinessProbe` は `/main/api/healthz` にアクセスし、アプリが応答できるかを確認します。チェックに通過した Pod だけが Service のトラフィックを受け取ります。アプリのアクセスパスのプレフィックスを変更した場合は、プローブのパスも変更してください。このエンドポイントだけでは業務機能の検証はできません。

`NOCOBASE_STRICT_STARTUP=true` を設定すると、起動に失敗したアプリは終了し、Kubernetes が再起動します。

`terminationGracePeriodSeconds: 60` は、アプリの終了に最大60秒の猶予を与えます。この時間を過ぎても終了しないコンテナーは強制終了されます。

## Ingress と HTTPS を設定する

`my-app` 名前空間に TLS Secret を準備します。利用できる既存の Secret があれば参照し、証明書を取り込む場合は次を実行します。

```bash
kubectl -n my-app create secret tls my-app-tls \
  --cert='<TLS 証明書チェーンのファイルパス>' \
  --key='<TLS 秘密鍵のファイルパス>'
```

> [!TIP]
> Ingress は「どのドメインとパスへのアクセスを、どのサービスに転送するか」を記述します。Ingress Controller は、そのルールをロードバランサーやプロキシに反映します。IngressClass は、その Ingress をどのコントローラーと設定で処理するかを指定します。
>
> たとえば、管理者が公開用の入口として `public` という IngressClass を用意している場合は、`ingressClassName: public` と記述します。実際の名前は `kubectl get ingressclass` の `NAME` 列で確認し、どれを使うか管理者に確認してください。ここに指定するのはアプリ名やアクセス先のドメインではありません。

`ingress.yml` を作成し、`<IngressClass 名>` を実際の名前に置き換えます。ドメインは `config.yaml` の `app.publicOrigin` に対応するものを使います。

```yaml title="ingress.yml"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  namespace: my-app
spec:
  ingressClassName: "<IngressClass 名>"
  tls:
    - hosts:
        - apps.example.com
      secretName: my-app-tls
  rules:
    - host: apps.example.com
      http:
        paths:
          - path: /main
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 13000
```

```bash
kubectl apply -f ingress.yml
kubectl -n my-app get ingress my-app
```

アプリのドメインが Ingress の入口アドレスを指すように設定し、HTTP から HTTPS へのリダイレクトを有効にします。リクエストの転送時は `/main` プレフィックスを維持し、`/` に書き換えないでください。

Host やプロトコルのヘッダー転送、Cookie、WebSocket、アップロードサイズ、長時間接続のタイムアウトは、利用する Ingress Controller の設定方法に従って設定します。

## アクセスと Pod 再作成を検証する

Service のバックエンド、アプリのログ、公開用の入口を確認します。

```bash
kubectl -n my-app get endpointslices -l kubernetes.io/service-name=my-app
kubectl -n my-app logs -l app=my-app --all-containers=true --prefix --tail=100
curl --fail https://apps.example.com/main/api/healthz
```

ヘルスチェックの応答が `ok: true` になったら、`https://apps.example.com/main/` を開き、[インスタンス間の検証項目](multi-instance-deployment.md#インスタンス間のアクセスと業務処理を検証する)に沿って業務機能を検証します。

テスト環境で業務レコードを1件作成してファイルをアップロードし、Pod の一覧からアプリ Pod を1つ選んで削除します。

```bash
kubectl -n my-app delete pod '<選択したアプリ Pod 名>'
kubectl -n my-app rollout status deployment/my-app --timeout=600s
kubectl -n my-app get pods -l app=my-app -o wide
```

Deployment によってレプリカ数が自動的に補充され、入口へのアクセスと、既存データおよびアップロードしたファイルの読み取りが引き続きできることを確認します。検証中に PVC や名前空間を削除しないでください。

## スケーリングとリリース更新

### レプリカ数を変更する

たとえば、レプリカ数を4つに増やします。

```bash
kubectl -n my-app scale deployment/my-app --replicas=4
kubectl -n my-app rollout status deployment/my-app --timeout=600s
```

2つに戻す場合は `--replicas=2` を指定します。手動で変更した後は `app.yml` の `spec.replicas` も更新し、次回マニフェストを適用したときに元の数へ戻らないようにします。GitOps や HPA がレプリカ数を管理している場合は、その設定を変更します。

### イメージと設定を更新する

データベースの変更は差分更新と後方互換性を基本とし、マイグレーション後も旧レプリカが読み書きできるようにします。ローリングアップデート中は、新旧バージョンで設定、共有状態、タスクメッセージの互換性も必要です。

まず[アプリの新しいバージョンをリリースする](publish-app-release.md)に従ってバージョンの変更内容を確認します。データベース、業務ファイル、リリース前のデプロイ用ファイルを独立してバックアップしてください。対象には `configmap.yml`、`secrets.env`、`app.yml` を含めます。新しいイメージ（例：`registry.example.com/team/my-app:2`）も準備します。

リリースは同時に実行しないでください。前回の Job が終了し、実行中の Pod が残っていないことを確認してから進めます。終了していない Job は削除・再作成しません。

```bash
kubectl -n my-app describe job my-app-db
```

設定に変更がある場合は、名前を変えずに既存のリソースを更新します。

- 機密情報を含まない設定：`configmap.yml` の `config.yaml` を編集し、`kubectl apply -f configmap.yml` を実行します。
- 機密情報の変数：`secrets.env` を編集し、次を実行します。

```bash
kubectl -n my-app create secret generic my-app-secrets \
  --from-env-file=secrets.env --dry-run=client -o yaml | kubectl apply -f -
```

Job と Deployment の設定参照は変更不要です。ConfigMap を更新すると、マウントされた設定ファイルも非同期に更新されます。変更後の内容は、まだ動いている旧レプリカと互換性が必要です。

`db-job.yml` のイメージを新しいバージョンに変更します。終了済みの旧 Job を削除し、同じ名前でデータベース更新を実行します。アプリレプリカは引き続きリクエストを処理するため、縮小して停止する必要はありません。

```bash
kubectl -n my-app delete job my-app-db --cascade=foreground
kubectl create -f db-job.yml
kubectl -n my-app wait --for=condition=complete job/my-app-db --timeout=600s
kubectl -n my-app logs job/my-app-db
```

Job が成功したら、イメージの更新が必要な場合は `app.yml` を変更し、予定したレプリカ数を維持します。マニフェストを適用すると、Deployment が旧レプリカを順に置き換えます。

```bash
kubectl apply -f app.yml
kubectl -n my-app rollout status deployment/my-app --timeout=600s
```

ConfigMap または Secret だけを変更し、`app.yml` が変わらない場合、Deployment は自動更新されません。すべてのレプリカが設定を再読み込みするよう、ローリング再起動を実行します。アプリの再起動だけが必要な場合も同じコマンドを使います。

```bash
kubectl -n my-app rollout restart deployment/my-app
kubectl -n my-app rollout status deployment/my-app --timeout=600s
```

ローリングアップデートの完了後、業務機能とバックグラウンドタスクが正常に動作することを確認します。

### リリース状態を確認してロールバックする

Deployment のリリース状態とリビジョン履歴を確認します。

```bash
kubectl -n my-app rollout status deployment/my-app --timeout=600s
kubectl -n my-app rollout history deployment/my-app
```

`rollout undo` が復元するのは Deployment の Pod テンプレートだけです。ConfigMap、Secret、データベース、PVC 内のデータは復元しません。ロールバック前に、対象イメージが引き続き取得可能で、現在のデータと互換性があり、関連するパスワードやトークンも有効であることを確認してください。

設定を戻す必要がある場合は、バックアップから `configmap.yml` と `secrets.env` を復元し、[イメージと設定を更新する](#イメージと設定を更新する)のコマンドで同名の ConfigMap と Secret を更新します。

アプリのバージョンを戻す場合は、履歴から対象のリビジョン番号を選び、コマンドのプレースホルダーを置き換えます。

```bash
kubectl -n my-app rollout undo deployment/my-app --to-revision='<対象のリビジョン番号>'
kubectl -n my-app rollout status deployment/my-app --timeout=600s
```

アプリのバージョンを変えずに設定だけを戻す場合は、設定を復元してからローリング再起動を実行します。設定の復元を `rollout undo` で代用しないでください。

ロールバック後は `app.yml` または GitOps の設定も更新し、次回のデプロイで元に戻らないようにします。データベースや業務ファイルの復元が必要な場合は、[ロールバック時のデータの扱い](../tutorials/deploy-with-docker.md#ロールバック時のデータを扱う)に従って整合性の取れた復元計画を準備してください。

## Helm Chart を作成する

この節は任意です。前述のリソースマニフェストだけでデプロイできます。Helm で設定を再利用し、リリースのバージョンを管理したい場合に Chart を作成してください。

管理用マシンに Helm 3 以降をインストールし、前述のマニフェストを基に Chart を作成します。この構成では、Helm が Deployment、Service、Ingress を管理し、リリース前の Job でデータベースを更新します。名前空間、ConfigMap、Secret、PVC は引き続き独立して管理するため、Chart のインストール前に準備しておく必要があります。

### ディレクトリ構成を作成する

デプロイ用ディレクトリに Chart を作成し、実際の環境に合わせて調整済みのマニフェストをコピーします。

```bash
cd "$HOME/my-app-k8s"
mkdir -p charts/my-app/templates
cp app.yml charts/my-app/templates/app.yaml
cp db-job.yml charts/my-app/templates/db-job.yaml
cp ingress.yml charts/my-app/templates/ingress.yaml
```

追加するファイルは次の構成で保存します。既存の設定、認証情報、ストレージのマニフェストは Chart の外に残します。

```tree
my-app-k8s/
├── charts/
│   └── my-app/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── app.yaml
│           ├── db-job.yaml
│           └── ingress.yaml
├── values-prod.yaml
└── README.md
```

`charts/my-app/Chart.yaml` を作成します。

```yaml title="charts/my-app/Chart.yaml"
apiVersion: v2
name: my-app
type: application
version: 0.1.0
```

`version` は Chart のバージョンであり、アプリイメージのバージョンではありません。テンプレートを変更したら、このバージョンも引き上げます。

### デプロイ用マニフェストをテンプレートに変換する

`charts/my-app/values.yaml` を作成し、デフォルトのパラメーターをまとめます。ここでも共有 PVC を例にします。オブジェクトストレージを使う場合は、調整済みのマニフェストを維持し、`existingClaim` と対応する `files` ボリュームおよびマウントを省略してください。

```yaml title="charts/my-app/values.yaml"
image: registry.example.com/team/my-app:1
replicaCount: 2
imagePullSecret: registry-pull
existingConfigMap: my-app-config
existingSecret: my-app-secrets
existingClaim: my-app-files
configRevision: "1"
healthPath: /main/api/healthz
ingress:
  className: "<IngressClass 名>"
  host: apps.example.com
  path: /main
  tlsSecret: my-app-tls
```

3つのテンプレートにある次のフィールドの値を Helm の式に置き換え、他の設定は変更しません。Chart をインストールした単位をリリース（Release）と呼びます。この例のリリース名は `my-app` です。同じアプリを更新するときは、名前と名前空間を維持します。

| フィールド | テンプレートの値 |
| --- | --- |
| すべてのリソースの `metadata.namespace` | `{{ .Release.Namespace \| quote }}` |
| アプリのリソース名、`app` ラベル、セレクター、Ingress の Service 名 | `{{ .Release.Name \| quote }}` |
| データベース更新 Job の `metadata.name` | `{{ printf "%s-db" .Release.Name \| quote }}` |
| Deployment の `spec.replicas` | `{{ .Values.replicaCount }}` |
| Job と Deployment のコンテナーの `image` | `{{ .Values.image \| quote }}` |
| `imagePullSecrets` の名前 | `{{ .Values.imagePullSecret \| quote }}` |
| `envFrom.secretRef.name` | `{{ .Values.existingSecret \| quote }}` |
| 設定用ボリュームの `configMap.name` | `{{ .Values.existingConfigMap \| quote }}` |
| ファイル用ボリュームの `persistentVolumeClaim.claimName` | `{{ .Values.existingClaim \| quote }}` |
| readiness probe の `httpGet.path` | `{{ .Values.healthPath \| quote }}` |
| Ingress の `ingressClassName` | `{{ .Values.ingress.className \| quote }}` |
| Ingress ルールのドメインと TLS のドメイン | `{{ .Values.ingress.host \| quote }}` |
| Ingress の転送パス | `{{ .Values.ingress.path \| quote }}` |
| Ingress の TLS `secretName` | `{{ .Values.ingress.tlsSecret \| quote }}` |

Deployment の Pod テンプレートに設定リビジョンのアノテーションを追加し、既存のラベルを維持します。

```yaml
spec:
  template:
    metadata:
      labels:
        app: {{ .Release.Name | quote }}
      annotations:
        nocobase.com/config-revision: {{ .Values.configRevision | quote }}
```

外部の ConfigMap または Secret の内容を変更したら、`configRevision` を増やし、Helm のアップグレードでレプリカのローリングアップデートが起きるようにします。ドメイン、パス、アプリ設定の整合性も維持してください。アクセスパスのプレフィックスを変更したら、`healthPath` も変更します。

デフォルトのパラメーターを本番環境用の設定としてコピーし、イメージ、ドメイン、IngressClass、外部リソース名を変更します。

```bash
cp charts/my-app/values.yaml values-prod.yaml
```

パスワード、キー、トークンを `values.yaml`、環境別のパラメーターファイル、`--set` に記載しないでください。Helm はそれらのパラメーターをリリースの記録に保存します。Chart では既存の Secret 名だけを参照し、機密値は前述の方法で独立して管理します。

### データベースのマイグレーション手順を設定する

`templates/db-job.yaml` の `metadata` を次のように変更します。

```yaml
metadata:
  name: {{ printf "%s-db" .Release.Name | quote }}
  namespace: {{ .Release.Namespace | quote }}
  annotations:
    helm.sh/hook: pre-install,pre-upgrade
    helm.sh/hook-delete-policy: before-hook-creation
```

`pre-install` と `pre-upgrade` により、Helm はアプリのリソースをインストールまたは更新する前に Job を実行し、成功するまで待機します。通常の Job と Deployment を同時に適用しても、`--wait-for-jobs` を指定するだけではマイグレーションが先に完了する保証はありません。

前述の Job のデータベースコマンド、`backoffLimit: 0`、マウント設定を維持し、Deployment と同じ `.Values.image`、設定、キー、ファイルストレージを使います。管理対象の各接続では、引き続き `migrations.autoRun` と `seeds.autoRun` を `false` にします。

リリース前に外部の ConfigMap、Secret、ファイルストレージを準備または更新します。これらをこの Chart の通常のテンプレートとしてインストールする構成にはしないでください。初回の Hook Job が実行される時点で、必要なリソースが利用できなくなるためです。更新後の設定とデータベース構造は、引き続き稼働する旧レプリカとの互換性が必要です。

`before-hook-creation` は次の実行前に同名の旧 Job を削除しますが、旧タスクがまだ実行中かどうかは判断しません。そのため、インストール、アップグレード、再試行のたびに、前回の Job とその Pod が終了していることを確認します。同じアプリのリリースは同時に実行しないでください。このポリシーでは、今回の Job とログをリリース後の確認用に残します。

### 検証、インストール、アップグレードを行う

まず、クラスターに接続せずにローカルで検証とレンダリングを行います。

```bash
helm lint charts/my-app -f values-prod.yaml --strict
helm template my-app charts/my-app -n my-app -f values-prod.yaml > rendered.yaml
```

`rendered.yaml` を確認します。Job とアプリのイメージが同じで、外部リソースの参照と名前空間が正しく、Service がアプリ Pod だけを選択し、マイグレーション Job にリリース前の Hook アノテーションがあることを確認してください。レンダリング結果を `kubectl apply` で適用すると、Helm の Hook 実行順序は適用されません。

**すでに手動でデプロイしている場合は、先にリソースの管理を引き継ぎます。** 既存の Deployment、Service、Ingress をレンダリング結果と比較し、名前、セレクター、バックエンドの参照を維持します。対象がこのアプリのリソースであり、他の Helm リリースや GitOps で管理されていないことを確認し、バックアップしたうえで、Helm の所有情報を追加します。

```bash
kubectl -n my-app get deployment/my-app service/my-app ingress/my-app -o yaml
kubectl -n my-app label deployment/my-app service/my-app ingress/my-app \
  app.kubernetes.io/managed-by=Helm
kubectl -n my-app annotate deployment/my-app service/my-app ingress/my-app \
  meta.helm.sh/release-name=my-app \
  meta.helm.sh/release-namespace=my-app
```

新規インストールの場合、引き継ぎコマンドは不要です。異なる所有情報がすでにある場合は、管理関係を確認し、強制上書きや削除・再作成は行いません。引き継ぎ後はアプリのリソースを Helm で管理し、元の `kubectl apply -f app.yml` や `rollout undo` などで直接変更しないでください。外部の設定、認証情報、ストレージは引き続き独立して管理します。

インストールやアップグレードの前に、データベース、ファイル、設定をバックアップします。対象の名前空間に設定、認証情報、ストレージが準備されていることを確認し、旧 Job を調べます。

```bash
kubectl -n my-app get job my-app-db
kubectl -n my-app get pods -l job-name=my-app-db
```

初回インストールでは Job が存在しなくても正常です。既存の Job がある場合は `Complete` または `Failed` で、関連する Pod も終了していることを確認してください。実行中または終了処理中のタスクを、次のリリースで削除してはいけません。

条件を満たしたら、リリースをインストールまたはアップグレードします。

```bash
helm upgrade --install my-app charts/my-app -n my-app \
  -f values-prod.yaml --wait --timeout 10m
kubectl -n my-app logs job/my-app-db
kubectl -n my-app rollout status deployment/my-app --timeout=600s
helm status my-app -n my-app
```

待機の失敗やタイムアウトによって、実行済みのマイグレーションが取り消されることはありません。Job が停止した保証もありません。Job、Pod、ログを確認し、問題を解決してから再試行するか判断してください。Hook を省略したり、そのまま再リリースしたりしないでください。成功後は[アクセスと Pod 再作成の検証](#アクセスと-pod-再作成を検証する)に従って業務機能を確認します。

以降のリリースでは、`values-prod.yaml` のイメージを変更します。外部設定の変更がある場合は、先に対象のリソースを更新し、`configRevision` を増やします。再検証、バックアップ、旧 Job の確認を済ませてから、同じ `helm upgrade --install` コマンドを実行します。マイグレーション Job を別途作成する必要はありません。

ロールバックが必要な場合は、まず Helm のリリース履歴を確認します。

```bash
helm history my-app -n my-app
```

データベース更新タスクが終了し、対象バージョンが現在のデータと互換性を持つことを確認します。必要に応じて外部設定を復元してから、対象のリビジョン番号を指定します。

```bash
helm rollback my-app '<対象のリビジョン番号>' -n my-app --wait --timeout 10m
```

`helm rollback` はデータベースのマイグレーションを取り消さず、外部の ConfigMap、Secret、業務ファイルも復元しません。この例では、ロールバック時にマイグレーション Hook を再実行することもありません。ロールバック後は Chart、環境別パラメーター、外部設定を同期し、再検証してください。ロールバックの代わりにアンインストールして再インストールしないでください。アンインストールしても、この例の Hook Job や外部ストレージは自動削除されません。

Chart、環境別パラメーター、操作手順をデプロイ用ディレクトリに保存します。`README.md` にはガイドの URL、外部依存、リソースの引き継ぎ方法、インストール・アップグレード・ロールバック・検証のコマンドを記載してください。以降のリリースではこれらのファイルを再利用し、機密値を Chart やバージョン管理に含めないようにします。

## よくあるデプロイの問題

| 症状 | 確認と対処 |
| --- | --- |
| `ImagePullBackOff` | イメージ名、タグ、ノードのアーキテクチャ、レジストリへの接続、同じ名前空間の `imagePullSecrets` を確認します。 |
| PVC や Pod が長時間 `Pending` のままになる | `kubectl -n my-app describe pvc my-app-files` または `kubectl -n my-app describe pod '<Pod 名>'` でイベントを確認し、StorageClass、ボリュームのバインド、リソース、スケジューリング制約を調べます。 |
| `EACCES` / `permission denied` | コンテナーの実行ユーザー（この例では UID/GID `1000`）が設定を読み取り、データディレクトリを読み書きできるか確認します。ストレージドライバーが `fsGroup` による権限設定に対応していない場合は、ストレージ側で設定します。 |
| Job が失敗する、または待機がタイムアウトする | `kubectl -n my-app logs 'job/<Job 名>'` でログを確認し、Pod のイベントも調べます。タイムアウト後も Job が実行中の場合があるため、再実行しないでください。失敗時は新しいレプリカをデプロイしません。 |
| `CrashLoopBackOff` / `OOMKilled` | `kubectl -n my-app logs '<Pod 名>' --previous` で前回のログを確認し、イベント、設定、プローブ、リソース上限を調べます。 |
| Service に利用できるバックエンドがない | Service のセレクター、Pod のラベルと準備状態を確認し、プローブのパスがアプリのアクセスパスのプレフィックスと一致しているか調べます。 |
| Ingress が 404、502、または誤ったリダイレクトを返す | IngressClass、Service のポート、DNS、TLS、`app.publicOrigin` を確認し、転送時に `/main` が維持されているか調べます。 |