---
title: 使用 Kubernetes 部署
description: 使用 Agent 或手动步骤在 Kubernetes 中部署应用、执行数据库更新、验证与发布，并将部署清单整理为 Helm Chart。
---

## 部署前准备

准备一个可用的 Kubernetes 集群，并在管理机上安装、配置 `kubectl`。先确认连接的是目标集群，再查看节点架构及已有的入口和存储配置：

```bash
kubectl config current-context
kubectl get nodes -L kubernetes.io/arch
kubectl get ingressclass
kubectl get storageclass
```

确认集群后，准备应用及其依赖的部署资源：

- **应用配置**：按[多实例部署](multi-instance-deployment.md)完成应用适配，并配置应用所需的数据库、Redis 和文件存储。
- **应用镜像**：适配完成后，按[使用 Docker 部署](../tutorials/deploy-with-docker.md#构建-docker-镜像)构建与节点架构匹配的镜像，并推送到镜像仓库。
- **访问入口**：确保集群已安装 Ingress Controller，并准备应用使用的域名和 TLS 证书。
- **共享存储**：使用文件系统存储时，准备支持 `ReadWriteMany`（RWX）的 StorageClass。

> [!TIP]
> StorageClass 定义 Kubernetes 如何创建存储卷，包括使用哪种存储服务。`ReadWriteMany`（RWX）表示同一个卷可被多个节点同时挂载并读写，让不同节点上的应用副本共享上传文件。常见的后端有 NFS、CephFS 和云文件存储，具体支持情况取决于存储服务和驱动；可向集群管理员确认可用的 StorageClass 名称。

下文以命名空间和应用名 `my-app`、镜像 `registry.example.com/team/my-app:1`、访问地址 `https://apps.example.com/main/` 为例。部署时替换实际镜像和域名；如调整资源名称，保持各清单引用一致。`<…>` 表示必填占位符，使用时需连同尖括号一起替换。

## 使用 Agent

### 生成部署配置

在能读取应用项目、执行命令并使用 `kubectl` 的环境中打开开发 Agent。已有部署先备份原配置；密码、密钥和仓库令牌通过本地文件或已有 Secret 提供，不写进提示词。

说明部署目标，让 Agent 先检查现有配置，再与你确认所需资源：

```text
请阅读这份 Kubernetes 部署指南，结合当前项目准备双副本部署方案：
https://docs.nocobase.com/zh-CN/core/deployment/deploy-with-kubernetes/

先检查项目配置，与我确认目标环境、镜像、依赖服务、存储和访问方式。按指南准备部署清单；如与项目实际情况不符，先说明差异，不要直接套用。

将 Kubernetes 资源清单保存在部署目录，并在该目录根部编写 README.md，注明上述指南地址，记录环境参数及可复用的部署、更新、备份、回退和验证步骤。保留已有数据和密钥，不记录敏感值。

先生成文件供我审核，未经确认不要操作集群或修改业务数据。
```

### 执行部署与验收

确认方案后，将以下提示词交给 Agent 执行部署和验收：

```text
部署方案已确认，请读取部署目录中的 README.md 和资源清单，按其中记录的指南执行以下工作：

1. 核对目标集群、命名空间、镜像和配置，完成计划中的备份；缺少必要条件或需要超出已确认的变更范围时，先向我确认。
2. 使用本次应用镜像执行数据库更新 Job，成功后再启动或滚动更新应用。失败或超时时停止后续变更，报告问题，不擅自重复迁移。
3. 按指南验收 HTTPS 访问、登录、数据与文件读写、跨副本业务功能，并在测试环境验证 Pod 重建后的数据和文件持久性。无法执行的检查标为未验证，不以健康检查通过代替业务验收。
4. 输出部署和验收报告，列出目标环境、实际镜像、各检查项的结果与依据，以及待处理问题，明确区分通过、失败和未验证。
5. 将实际调整同步到资源清单和 README.md，保留指南地址和可复用的操作步骤。后续更新先读取并复用这些文件。
```

### 生成 Helm Chart

生成 Helm Chart 是可选步骤。需要将现有部署清单整理成可复用的模板时，可让 Agent 完成转换：

```text
请读取部署目录中的 README.md 及其指南，将现有 Kubernetes 资源清单整理为 Helm Chart，沿用当前配置和外部服务。

先说明 Helm 将管理哪些资源、哪些依赖继续独立维护，以及已有部署如何交接。保留数据和密钥，并保证数据库更新成功后才发布应用。

完成 Chart、环境参数和本地校验，将安装、升级、回退及验收步骤补充到 README.md，报告校验结果和未验证项。
先提交 Chart 和交接方案供我确认，未经授权不要接管资源或操作集群。
```

## 部署目录与文件

部署文件统一保存在管理机的 `my-app-k8s` 目录中：

```tree
my-app-k8s/
├── .gitignore       # 排除本地敏感文件
├── configmap.yml    # 内嵌非敏感的 config.yaml
├── secrets.env      # 密码、密钥等环境变量，不提交 Git
├── files-pvc.yml    # 业务文件共享卷
├── db-job.yml       # 数据库更新 Job
├── app.yml          # 应用 Deployment 和 Service
└── ingress.yml      # 域名、HTTPS 和入口路由
```

`config.yaml` 内嵌在 `configmap.yml` 中，无需单独创建。创建并进入部署目录，后续命令均在此执行：

```bash
mkdir -p "$HOME/my-app-k8s"
cd "$HOME/my-app-k8s"
```

在 `.gitignore` 中加入 `secrets.env`：

```text title=".gitignore"
secrets.env
```

## 创建命名空间与镜像拉取凭据

先为应用创建命名空间 `my-app`，后续清单中的资源都部署到这里：

```bash
kubectl create namespace my-app
```

在同一命名空间中创建 Secret `registry-pull`，供 Kubernetes 拉取私有镜像。将占位符替换为实际的仓库地址、用户名和访问令牌，账号需具有该镜像的拉取权限：

```bash
kubectl -n my-app create secret docker-registry registry-pull \
  --docker-server='<镜像仓库地址>' \
  --docker-username='<仓库用户名>' \
  --docker-password='<仓库访问令牌>'
```

Job 和 Deployment 通过 `imagePullSecrets` 引用 `registry-pull`。

## 挂载运行配置与文件存储

### 使用 ConfigMap 挂载非敏感配置

创建 `configmap.yml`，将应用的非敏感配置写入 `data.config.yaml`。数据库密码、应用密钥等通过下一节的 Secret 提供。

在现有应用配置中确认以下设置：

- 将各受管理数据库连接的 `migrations.autoRun` 和 `seeds.autoRun` 设为 `false`，由后续 Job 单独执行数据库更新。配置位置见[多实例部署的发布流程](multi-instance-deployment.md#启动多个实例)。
- 使用下文共享卷时，将业务文件对应的磁盘路径（例如 `drive.disks.local.location`）设为 `/app/files`；使用对象存储时保留原有配置。具体配置见[文件存储与驱动](../framework/file-storage.md#配置磁盘)。

示例仅展示 `server` 和 `app`；请用已准备好的数据库连接和共享服务配置替换末尾的占位注释，保持四个空格的缩进。

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
    # <在此补充数据库连接和共享服务的非敏感配置>
```

```bash
kubectl apply -f configmap.yml
```

Job 和 Deployment 将这份配置只读挂载到 `/run/nocobase/config.yaml`，由 `APP_CONFIG_FILE` 指定读取路径。

### 使用 Secret 注入敏感环境变量

在部署目录中创建 `secrets.env`，使用应用支持的[环境变量](../reference/configuration.md#环境变量)填写敏感配置。每行填写一个 `变量名=值`，不加 `export`，也不用引号包裹值：

```text title="secrets.env"
DB_PASSWORD=<数据库密码>
SECRETS_KEYS=<密钥版本>:<密钥值>
INITIAL_ADMIN_PASSWORD=<初始管理员密码>
```

`DB_PASSWORD` 对应 `main` 数据库连接。部署已有应用时，`SECRETS_KEYS` 应保留原有的密钥版本和值，包括仍用于解密旧数据的密钥。

保存文件后，在 `my-app` 命名空间中创建或更新 Secret `my-app-secrets`：

```bash
kubectl -n my-app create secret generic my-app-secrets \
  --from-env-file=secrets.env --dry-run=client -o yaml | kubectl apply -f -
```

Job 和 Deployment 通过 `envFrom.secretRef` 引用 `my-app-secrets`，在容器启动时将其中的条目注入为环境变量。`secrets.env` 只用于创建或更新 Secret，不需要挂载到容器中。

不要将 `secrets.env` 或导出的 Secret 内容提交到版本库。

### 配置业务文件共享卷

使用文件系统保存业务文件时，各个应用副本需要访问同一份文件。后续 Job 和 Deployment 会将共享卷统一挂载到 `/app/files`。

如果业务文件已全部使用对象存储，可跳过本小节，但需删除后续 Job 和 Deployment 中 `files` 的卷及挂载。

创建 `files-pvc.yml`，用持久卷声明（PVC）申请共享存储。选择支持多节点同时读写（RWX）的 StorageClass，并按需调整 `storage` 容量：

```yaml title="files-pvc.yml"
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-app-files
  namespace: my-app
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: "<支持 RWX 的 StorageClass 名称>"
  resources:
    requests:
      storage: 10Gi
```

创建 PVC 并查看绑定状态：

```bash
kubectl apply -f files-pvc.yml
kubectl -n my-app get pvc my-app-files
```

绑定成功后，PVC 的状态为 `Bound`。如果 StorageClass 采用延迟绑定，PVC 会暂时显示 `Pending`，等后续 Job 创建使用该卷的 Pod 后再绑定。

启动应用前，将已有业务文件迁入共享卷，并确保应用容器有权读写其中的文件。

## 使用 Job 执行数据库更新

创建 `db-job.yml`，使用与应用相同的镜像和配置，独立执行数据库迁移和数据初始化：

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

`--connection main` 指定更新 `main` 数据库连接；需要更新所有受管理连接时可改为 `--all`。`backoffLimit: 0` 用于关闭失败后的自动重试。

创建 Job，等待执行完成并查看日志：

```bash
kubectl create -f db-job.yml
kubectl -n my-app wait --for=condition=complete job/my-app-db --timeout=600s
kubectl -n my-app logs job/my-app-db
```

**确认 Job 为 `Complete` 后，再部署应用。** 等待超时不会终止 Job，应先检查状态和日志，不要直接重复提交。

## 创建 Deployment 和 Service

### 应用副本与资源配置

创建 `app.yml`，运行两个应用副本，并通过 Service 提供集群内访问入口：

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

创建资源并等待应用就绪：

```bash
kubectl apply -f app.yml
kubectl -n my-app rollout status deployment/my-app --timeout=600s
kubectl -n my-app get pods -l app=my-app -o wide
```

应看到两个 `READY` 为 `1/1` 的应用 Pod。

### 健康探针与优雅终止

`readinessProbe` 访问 `/main/api/healthz`，检查应用能否响应请求，只有通过检查的 Pod 才会接收 Service 流量。修改应用访问前缀时，同步调整探针路径；该接口不能代替业务功能验证。

`NOCOBASE_STRICT_STARTUP=true` 让应用在启动失败时退出，由 Kubernetes 重启。

`terminationGracePeriodSeconds: 60` 为应用保留最多 60 秒的退出时间，超时仍未退出的容器会被强制结束。

## 配置 Ingress 和 HTTPS

在 `my-app` 命名空间准备 TLS Secret。已有可用的 Secret 时直接引用；需要导入证书时，执行：

```bash
kubectl -n my-app create secret tls my-app-tls \
  --cert='<TLS 证书链文件路径>' \
  --key='<TLS 私钥文件路径>'
```

> [!TIP]
> Ingress 描述“哪个域名和路径转发到哪个服务”，Ingress Controller 负责让这些规则在负载均衡器或代理上生效。IngressClass 则指定这条 Ingress 由哪个控制器、采用哪套配置处理。
>
> 例如，管理员为公网入口提供了名为 `public` 的 IngressClass，就填写 `ingressClassName: public`。实际名称可通过 `kubectl get ingressclass` 的 `NAME` 列查看，再向管理员确认应使用哪一个；它不是应用名称，也不是访问域名。

创建 `ingress.yml`，将 `<IngressClass 名称>` 替换为实际 IngressClass 名称，并使用 `config.yaml` 中 `app.publicOrigin` 对应的域名：

```yaml title="ingress.yml"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  namespace: my-app
spec:
  ingressClassName: "<IngressClass 名称>"
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

将应用域名解析到 Ingress 的入口地址，并启用 HTTP 到 HTTPS 的跳转。转发请求时保留 `/main` 前缀，不重写为 `/`。

Host 和协议头转发、Cookie、WebSocket、上传大小及长连接超时等设置，遵循所用 Ingress Controller 的配置方式。

## 验证访问与 Pod 重建

检查 Service 后端、应用日志和公网入口：

```bash
kubectl -n my-app get endpointslices -l kubernetes.io/service-name=my-app
kubectl -n my-app logs -l app=my-app --all-containers=true --prefix --tail=100
curl --fail https://apps.example.com/main/api/healthz
```

健康接口返回 `ok: true` 后，打开 `https://apps.example.com/main/`，按[多实例验证清单](multi-instance-deployment.md#验证跨实例访问和业务处理)验证业务功能。

在测试环境创建一条业务记录并上传文件，再从 Pod 列表中选择一个应用 Pod 删除：

```bash
kubectl -n my-app delete pod '<选定的应用 Pod 名称>'
kubectl -n my-app rollout status deployment/my-app --timeout=600s
kubectl -n my-app get pods -l app=my-app -o wide
```

Deployment 应自动补齐副本，入口仍可访问，原有数据和上传文件仍可读取。验证时不要删除 PVC 或命名空间。

## 扩缩容与发布更新

### 调整副本数量

例如扩展到四个副本：

```bash
kubectl -n my-app scale deployment/my-app --replicas=4
kubectl -n my-app rollout status deployment/my-app --timeout=600s
```

缩回两个副本时使用 `--replicas=2`。手动调整后，同步更新 `app.yml` 的 `spec.replicas`，避免下次应用清单时恢复旧数量。由 GitOps 或 HPA 管理副本数时，修改对应的配置。

### 更新镜像和配置

数据库变更应以增量、向后兼容为原则，确保迁移后旧副本仍能正常读写。滚动更新期间，新旧版本也需兼容配置、共享状态和任务消息。

先按[发布应用新版本](publish-app-release.md)完成版本检查，并独立备份数据库、业务文件和发布前的部署文件，包括 `configmap.yml`、`secrets.env` 和 `app.yml`。准备新镜像，例如 `registry.example.com/team/my-app:2`。

发布过程串行执行。先查看上一次 Job，确认它已结束，且没有仍在运行的 Pod 后再继续；未结束时不要删除或重建：

```bash
kubectl -n my-app describe job my-app-db
```

配置有变化时，更新原资源；名称保持不变：

- 非敏感配置：修改 `configmap.yml` 中的 `config.yaml`，执行 `kubectl apply -f configmap.yml`。
- 敏感变量：修改 `secrets.env`，执行：

```bash
kubectl -n my-app create secret generic my-app-secrets \
  --from-env-file=secrets.env --dry-run=client -o yaml | kubectl apply -f -
```

Job 和 Deployment 的配置引用无需修改。ConfigMap 更新后，已挂载的配置文件也会异步更新，变更内容需兼容仍在运行的旧副本。

将 `db-job.yml` 的镜像改为新版本，删除已结束的旧 Job，再以同一名称创建并执行数据库更新。应用副本继续服务，无需缩容停服：

```bash
kubectl -n my-app delete job my-app-db --cascade=foreground
kubectl create -f db-job.yml
kubectl -n my-app wait --for=condition=complete job/my-app-db --timeout=600s
kubectl -n my-app logs job/my-app-db
```

Job 成功后，若镜像有更新，修改 `app.yml` 的镜像并保持计划中的副本数量。应用清单后，Deployment 会滚动替换旧副本：

```bash
kubectl apply -f app.yml
kubectl -n my-app rollout status deployment/my-app --timeout=600s
```

如果只修改了 ConfigMap 或 Secret，而 `app.yml` 未变，Deployment 不会自动更新。此时执行滚动重启，让所有副本重新加载配置；仅需重启应用时也使用这组命令：

```bash
kubectl -n my-app rollout restart deployment/my-app
kubectl -n my-app rollout status deployment/my-app --timeout=600s
```

滚动更新完成后，验证业务访问和后台任务处理是否正常。

### 查看发布状态与回退

查看 Deployment 的发布状态和历史修订号（revision）：

```bash
kubectl -n my-app rollout status deployment/my-app --timeout=600s
kubectl -n my-app rollout history deployment/my-app
```

`rollout undo` 只恢复 Deployment 的 Pod 模板，不会恢复 ConfigMap、Secret、数据库或 PVC 中的数据。回退前需确认目标镜像仍可获取、与当前数据兼容，相关密码和令牌仍有效。

需要回退配置时，先从备份恢复 `configmap.yml` 和 `secrets.env`，按[更新镜像和配置](#更新镜像和配置)中的命令更新同名 ConfigMap 和 Secret。

需要回退应用版本时，从发布历史中选择目标修订号，替换命令中的占位符：

```bash
kubectl -n my-app rollout undo deployment/my-app --to-revision='<目标修订号>'
kubectl -n my-app rollout status deployment/my-app --timeout=600s
```

如果只回退配置、不更换应用版本，恢复配置后执行滚动重启，不使用 `rollout undo` 代替配置恢复。

回退后同步更新 `app.yml` 或 GitOps 配置，避免下次部署覆盖回退结果。需要恢复数据库或业务文件时，按[回退时的数据处理](../tutorials/deploy-with-docker.md#回退时的数据处理)准备匹配的恢复方案。

## 编写 Helm Chart

本节为可选步骤。使用前文的资源清单即可完成部署；需要通过 Helm 复用配置、管理发布版本时，再创建 Chart。

在管理机上安装 Helm（3 或更高版本），再基于前文的部署清单创建 Chart。以下方案让 Helm 管理 Deployment、Service 和 Ingress，通过发布前的 Job 更新数据库；命名空间、ConfigMap、Secret 和 PVC 继续独立维护，需在安装 Chart 前准备好。

### 初始化目录结构

在部署目录中创建 Chart，并复制已按实际环境调整的清单：

```bash
cd "$HOME/my-app-k8s"
mkdir -p charts/my-app/templates
cp app.yml charts/my-app/templates/app.yaml
cp db-job.yml charts/my-app/templates/db-job.yaml
cp ingress.yml charts/my-app/templates/ingress.yaml
```

新增的文件按以下结构保存，原有配置、凭据和存储清单留在 Chart 外：

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

创建 `charts/my-app/Chart.yaml`：

```yaml title="charts/my-app/Chart.yaml"
apiVersion: v2
name: my-app
type: application
version: 0.1.0
```

`version` 是 Chart 的版本，不是应用镜像版本；修改模板后相应递增。

### 将部署清单改为模板

创建 `charts/my-app/values.yaml`，集中保存默认参数。以下仍以共享 PVC 为例；使用对象存储时，保留已调整的清单，省略 `existingClaim` 及对应的 `files` 卷和挂载。

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
  className: "<IngressClass 名称>"
  host: apps.example.com
  path: /main
  tlsSecret: my-app-tls
```

将三个模板中的以下字段值替换为 Helm 表达式，其他配置保持不变。一次 Chart 安装称为一个 Release；本例 Release 名为 `my-app`，同一应用后续升级保持名称和命名空间不变。

| 字段 | 模板值 |
| --- | --- |
| 所有资源的 `metadata.namespace` | `{{ .Release.Namespace \| quote }}` |
| 应用资源名、`app` 标签、选择器和 Ingress 的 Service 名称 | `{{ .Release.Name \| quote }}` |
| 数据库 Job 的 `metadata.name` | `{{ printf "%s-db" .Release.Name \| quote }}` |
| Deployment 的 `spec.replicas` | `{{ .Values.replicaCount }}` |
| Job 和 Deployment 的容器 `image` | `{{ .Values.image \| quote }}` |
| `imagePullSecrets` 中的名称 | `{{ .Values.imagePullSecret \| quote }}` |
| `envFrom.secretRef.name` | `{{ .Values.existingSecret \| quote }}` |
| 配置卷的 `configMap.name` | `{{ .Values.existingConfigMap \| quote }}` |
| 文件卷的 `persistentVolumeClaim.claimName` | `{{ .Values.existingClaim \| quote }}` |
| 就绪探针的 `httpGet.path` | `{{ .Values.healthPath \| quote }}` |
| Ingress 的 `ingressClassName` | `{{ .Values.ingress.className \| quote }}` |
| Ingress 的规则域名和 TLS 域名 | `{{ .Values.ingress.host \| quote }}` |
| Ingress 的转发路径 | `{{ .Values.ingress.path \| quote }}` |
| Ingress 的 TLS `secretName` | `{{ .Values.ingress.tlsSecret \| quote }}` |

在 Deployment 的 Pod 模板中增加配置修订号注解，保留原有标签：

```yaml
spec:
  template:
    metadata:
      labels:
        app: {{ .Release.Name | quote }}
      annotations:
        nocobase.com/config-revision: {{ .Values.configRevision | quote }}
```

外部 ConfigMap 或 Secret 内容变化时，递增 `configRevision`，使 Helm 升级触发副本滚动更新。域名、路径和应用配置也需保持一致；修改访问前缀时同时调整 `healthPath`。

复制默认参数为生产环境配置，再修改镜像、域名、IngressClass 和外部资源名称：

```bash
cp charts/my-app/values.yaml values-prod.yaml
```

不要把密码、密钥或令牌写入 `values.yaml`、环境参数文件或 `--set`；Helm 会将参数保存在 Release 记录中。Chart 只引用已有 Secret 的名称，敏感值仍按前文方式独立维护。

### 配置数据库迁移流程

将 `templates/db-job.yaml` 的 `metadata` 改为：

```yaml
metadata:
  name: {{ printf "%s-db" .Release.Name | quote }}
  namespace: {{ .Release.Namespace | quote }}
  annotations:
    helm.sh/hook: pre-install,pre-upgrade
    helm.sh/hook-delete-policy: before-hook-creation
```

`pre-install` 和 `pre-upgrade` 让 Helm 在安装或更新应用资源前执行 Job，并等待它成功完成。普通 Job 与 Deployment 一起提交，即使使用 `--wait-for-jobs`，也不能保证先完成迁移。

保留前文 Job 的数据库命令、`backoffLimit: 0` 和挂载配置，并与 Deployment 共用 `.Values.image` 及相同的配置、密钥和文件存储。各受管理连接的 `migrations.autoRun`、`seeds.autoRun` 仍为 `false`。

发布前先准备或更新外部 ConfigMap、Secret 和文件存储；它们不能作为本 Chart 的普通模板等待安装，否则首次运行的 Hook Job 无法使用这些资源。更新后的配置与数据库结构都必须兼容仍在服务的旧副本。

`before-hook-creation` 会在下一次执行前删除同名旧 Job，并不会判断旧任务是否仍在运行。因此每次安装、升级或重试前，都必须确认上一次 Job 及其 Pod 已结束；同一应用的发布串行执行。此策略保留本次 Job 及其日志，供发布后检查。

### 验证、安装与升级

先进行本地检查与渲染，不连接集群：

```bash
helm lint charts/my-app -f values-prod.yaml --strict
helm template my-app charts/my-app -n my-app -f values-prod.yaml > rendered.yaml
```

检查 `rendered.yaml`：Job 与应用镜像相同，外部资源引用和命名空间正确，Service 只选择应用 Pod，迁移 Job 带有发布前 Hook 注解。不要通过 `kubectl apply` 提交渲染结果，否则不会执行 Helm 的 Hook 顺序。

**已有手动部署时，先处理资源交接。** 对比现有 Deployment、Service 和 Ingress 与渲染结果，保持名称、选择器及后端引用一致。仅在确认它们属于本应用、未由其他 Helm Release 或 GitOps 管理，并已备份后，添加 Helm 归属信息：

```bash
kubectl -n my-app get deployment/my-app service/my-app ingress/my-app -o yaml
kubectl -n my-app label deployment/my-app service/my-app ingress/my-app \
  app.kubernetes.io/managed-by=Helm
kubectl -n my-app annotate deployment/my-app service/my-app ingress/my-app \
  meta.helm.sh/release-name=my-app \
  meta.helm.sh/release-namespace=my-app
```

全新安装跳过交接命令。若归属信息已存在且不同，先核实管理关系，不强行覆盖或删除重建。交接后，应用资源统一通过 Helm 管理，不再用原来的 `kubectl apply -f app.yml`、`rollout undo` 等命令直接修改；外部配置、凭据和存储仍独立维护。

安装或升级前，完成数据库、文件和配置备份，确认目标命名空间中的配置、凭据及存储已准备好，并检查旧 Job：

```bash
kubectl -n my-app get job my-app-db
kubectl -n my-app get pods -l job-name=my-app-db
```

首次安装时 Job 不存在是正常情况。已有 Job 时，必须确认它为 `Complete` 或 `Failed`，且关联 Pod 已终止；仍在运行或终止中的任务不能被下一次发布删除。

条件满足后，安装或升级 Release：

```bash
helm upgrade --install my-app charts/my-app -n my-app \
  -f values-prod.yaml --wait --timeout 10m
kubectl -n my-app logs job/my-app-db
kubectl -n my-app rollout status deployment/my-app --timeout=600s
helm status my-app -n my-app
```

等待失败或超时不会撤销已经执行的迁移，也不保证 Job 已停止。先查看 Job、Pod 和日志，解决问题后再决定是否重试；不要跳过 Hook 或直接重复发布。成功后按[验证访问与 Pod 重建](#验证访问与-pod-重建)验收业务功能。

后续发布修改 `values-prod.yaml` 的镜像；外部配置有变化时，先更新对应资源，再递增 `configRevision`。重新校验、备份并检查旧 Job 后，执行同一条 `helm upgrade --install` 命令，不需要另行创建迁移 Job。

需要回退时，先查看 Helm 发布历史：

```bash
helm history my-app -n my-app
```

先确认数据库更新任务已结束、目标版本与当前数据兼容，必要时先恢复外部配置，再指定目标修订号：

```bash
helm rollback my-app '<目标修订号>' -n my-app --wait --timeout 10m
```

`helm rollback` 不会撤销数据库迁移、恢复外部 ConfigMap、Secret 或业务文件；本例也不会在回退时重新执行迁移 Hook。回退后同步 Chart、环境参数和外部配置，并重新验收。不要通过卸载重装代替回退，卸载也不会自动清理本例的 Hook Job 或外部存储。

将 Chart、环境参数和操作步骤保存在部署目录，在 `README.md` 中注明指南地址、外部依赖、资源交接方式及安装、升级、回退和验收命令。后续发布复用这些文件，敏感值不进入 Chart 或版本库。

## 常见部署问题

| 现象 | 检查与处理 |
| --- | --- |
| `ImagePullBackOff` | 检查镜像名、标签、节点架构、仓库网络及同命名空间的 `imagePullSecrets`。 |
| PVC 或 Pod 长时间 `Pending` | 用 `kubectl -n my-app describe pvc my-app-files` 或 `kubectl -n my-app describe pod '<Pod 名称>'` 查看事件，核对 StorageClass、卷绑定、资源和调度约束。 |
| `EACCES` / `permission denied` | 确认容器的运行用户（本示例为 UID/GID `1000`）能读取配置文件、读写数据目录。如果存储驱动不支持通过 `fsGroup` 设置卷权限，需要在存储端配置相应权限。 |
| Job 失败或等待超时 | 用 `kubectl -n my-app logs 'job/<Job 名称>'` 查看日志，并检查 Pod 事件。超时后 Job 可能仍在执行，不重复提交；失败时不继续部署新副本。 |
| `CrashLoopBackOff` / `OOMKilled` | 用 `kubectl -n my-app logs '<Pod 名称>' --previous` 查看上次退出日志，结合事件排查配置、探针和资源上限。 |
| Service 没有可用后端 | 核对 Service 选择器、Pod 标签和就绪状态，并确认探针路径与应用访问前缀一致。 |
| Ingress 返回 404、502 或跳转错误 | 核对 IngressClass、Service 端口、DNS、TLS 和 `app.publicOrigin`，确认转发时保留 `/main`。 |
