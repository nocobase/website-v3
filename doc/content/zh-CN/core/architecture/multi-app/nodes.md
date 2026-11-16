---
title: 配置主应用与运行节点
---

## 配置主应用访问地址

在主应用的 `config.yml` 中设置浏览器实际使用的 origin：

```yaml
app:
  publicOrigin: https://apps.example.com
server:
  host: 0.0.0.0
  port: 13230
```

`publicOrigin` 只包含协议、主机和端口，不含 `/main` 或子应用路径。主应用入口通常为 `https://apps.example.com/main/`，托管实例通过同一 origin 下的独立路径访问。监听地址 `0.0.0.0` 不能用作浏览器地址。

初次创建实例前确定稳定地址。已有实例时更换域名或协议会影响回调和身份绑定，需要同时处理实例配置与登录接入，不能只修改反向代理。

## 部署配置

### 完整配置示例

以下内容合并到**主应用**的 `config.yml`，与访问地址、数据库和密钥配置一起使用。不要添加重复的 `drive` 或 `deployment` 段。这是使用默认 `storage/` 根目录的本地存储示例；模板已经提供这些默认值，未修改的项可以省略。

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

`drive` 与 `deployment` 是同级配置。前者定义存储磁盘，后者引用磁盘并管理部署工作目录和运行节点。子应用项目的 `deploy.yml` 用于提交部署，不放在这里；见[开发与部署子应用](development.md)。

### 配置字段说明

| 字段 | 默认值或要求 | 用途 |
| --- | --- | --- |
| `deployment.dataDir` | 应用存储根目录下的 `deployment/` | 保存节点目录绑定、本机产物缓存和部署日志 |
| `deployment.artifacts.disk` | `deploymentArtifacts` | 引用 `drive.disks` 中已配置的私有磁盘，不跟随 `drive.default` |
| `deployment.artifacts.prefix` | `archives` | 构建产物在磁盘中的键前缀，实际键为 `<prefix>/<sha256>.tar.gz` |
| `deployment.defaultNode` | `local` | 默认运行节点标识；有启用节点时，必须指向其中一个 |
| `deployment.nodes` | 默认包含启用的 `local` | 以稳定节点标识为键的配置映射 |
| `nodes.<id>.name` | 非空名称 | 界面显示名称 |
| `nodes.<id>.enabled` | 显式布尔值；默认节点为 `true` | 是否由 Main 启动该节点 |
| `nodes.<id>.approvalRequired` | 省略或 `false` 表示不要求审批 | 是否要求另一位有权限的管理员审批部署操作 |
| `nodes.<id>.type` | 当前仅支持 `local` | 运行节点类型 |
| `nodes.<id>.local.host` | 默认节点为 `0.0.0.0` | 节点监听地址，不是浏览器访问地址 |
| `nodes.<id>.local.port` | 默认节点为 `13231` | 节点内部服务端口，各节点与 Main 之间不能冲突 |
| `nodes.<id>.local.directory` | 默认节点位于应用存储根目录下的 `deployment/hosts/local` | 节点的代码版本、持久数据和控制状态目录 |

表中 `nodes.<id>` 均位于 `deployment` 下。`prefix` 使用字母、数字、下划线、短横线及分隔目录的 `/`，不能以 `/` 开头或结尾，也不能包含 `..`。

### Drive 构建产物存储

默认磁盘使用 `fs`，原始归档保存在 `storage/deployment/artifacts/archives/`。所引用磁盘必须设置 `visibility: private`，支持配置对象形式的 `fs`、`s3` 和 `oss` 驱动；不能引用不存在的磁盘、未填写 bucket 的对象存储占位项或公开磁盘。

要把**后续上传**写入 S3，可以合并以下配置，并将 bucket、region 改为实际值：

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

此例通过服务器上的 AWS 凭据链提供认证；`credentials: {}` 不表示匿名上传。使用角色或服务器秘密配置提供凭据，不写入前端或版本库。使用 OSS 时，同样先配置私有 `oss` 磁盘，再通过 `deployment.artifacts.disk` 引用它。修改后检查配置并重启 Main。

上传先在本地完成大小、摘要和包结构校验，再写入 Drive。部署时 Main 按产物记录中的磁盘与完整键读取归档，校验后生成本地缓存供节点使用。因此使用对象存储后，Main 和节点仍需要本地可写磁盘空间。

**更改磁盘或前缀不会搬迁旧产物。** 旧版本继续引用原来的磁盘名称和存储键，须保留相应配置与对象。也不要直接将同名磁盘指向空目录或另一个 bucket。当前没有自动存储迁移或全局产物垃圾清理功能。

## 运行节点

### 配置默认运行节点

主应用启动时自动启动节点进程并登记状态。修改配置后运行 `pnpm nocobase config check`，再重启主应用。节点端口用于内部控制与转发，应通过网络规则限制不需要的访问；用户始终从主应用入口访问实例。

`APP_DEPLOYMENT_NODE_ENABLED`、`APP_DEPLOYMENT_NODE_PORT` 和 `APP_DEPLOYMENT_NODE_BIND` 分别覆盖 `local` 节点的启用状态、端口和监听地址，不作用于其他节点。

### 配置多个本地运行节点

在同一个 `deployment.nodes` 下添加另一个节点：

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

该片段与 `local` 平级。每个启用节点使用不同端口，且端口不能与主应用冲突；存储目录不能相同或互相嵌套。`defaultNode` 必须指向启用的节点。

配置会与默认值合并。如果只使用其他节点，需要显式设置 `deployment.nodes.local.enabled: false`。设置 `approvalRequired: true` 后，相关部署操作需要另一位有权限的管理员审批。

当前仅支持 `type: local`。多个本地节点仍运行在同一台机器上，不提供跨机器高可用。

### 查看节点状态与运行要求

进入**系统设置 → 部署管理 → 运行节点**，查看节点配置、连接状态和运行平台。节点定义由主应用配置管理，不能通过该页面或项目 CLI 新建。

创建实例前检查节点可用，以及目标版本的操作系统、架构、libc、Node.js 和数据库驱动是否兼容。节点不可用时查看主应用与节点日志；刷新状态只重新检查，不会替你启动失败的节点。

### 停用运行节点

先确认节点上的实例是否仍在使用，为停机和数据保存安排维护窗口，然后设置该节点 `enabled: false` 并重启主应用。如果它是默认节点，同时调整 `defaultNode`。

停用或移除配置不会自动迁移实例，也不会删除原来的实例记录和数据。节点标识绑定其持久化目录，不要通过改标识或复用另一个节点目录来“迁移”。恢复原节点时保持标识和目录一致。

## 配置 HTTPS 与反向代理

为 `apps.example.com` 配置 DNS 和有效证书，将该 origin 的请求转发到主应用 `13230` 端口。代理应保留 `/main/` 和各子应用路径，并支持 WebSocket Upgrade。

不要只代理 `/main/`，否则主应用可以登录但子应用会返回 404。不要将子应用直接转发到任意节点端口，主应用负责根据实例归属路由。确保代理转发的主机和协议与 `app.publicOrigin` 一致，并保持证书校验。

完成后分别验证主应用、一个子应用、SSO 回调和应用中使用的实时连接。

## 在开发和内网环境使用 HTTP

只有受控的开发、内网或 VPN 场景才应添加 HTTP 回调例外。在主应用 `config.yml` 中填写精确 origin：

```yaml
app:
  publicOrigin: http://192.168.1.10:13230
sso:
  insecureRedirectOrigins:
    - http://192.168.1.10:13230
```

列表中不写路径、通配符或 `0.0.0.0`；协议、地址和端口须与实际回调一致。独立应用使用另一个 origin 时，需要单独列出它。

直接编辑 YAML 数组，检查配置并重启主应用，再重新发起原来失败的创建或接入操作。该选项不放在子应用配置中，也不替代客户端的精确回调注册。HTTP 会传输登录及客户端凭据，公网访问应使用 HTTPS。

## 部署目录结构

### 主应用部署目录

下面是默认布局。`<nodeId>`、`<instanceId>`、`<deploymentId>` 和 `<sha256>` 分别表示节点、实例、部署操作和产物摘要；日志标记文件仅在相应情况出现。

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

| 位置 | 内容 |
| --- | --- |
| `host-directories.json` | 节点标识与持久目录的绑定；用于防止错误复用目录 |
| `artifacts/archives/` | 默认 Drive 磁盘上的原始归档；使用对象存储时原文件位于对应 bucket |
| `cache/artifacts/incoming/` | 上传校验的临时文件，正常流程结束时清理 |
| `cache/artifacts/archives/` | 从 Drive 读取并校验的归档缓存，供本机节点使用 |
| `logs/<instanceId>/<deploymentId>.jsonl` | 一次部署及其恢复尝试的事件日志 |
| `.incomplete`、`.truncated` | 日志捕获不完整或达到归档上限的标记，不能当作完整日志忽略 |

包、版本、实例和部署记录的元数据保存在 **Main 的数据库**中，不在这些归档或日志文件里。数据库的位置由数据库配置决定，不能只备份 `storage/deployment/`。

### 节点目录与实例数据

| 节点内的路径 | 内容与维护方式 |
| --- | --- |
| `config.yml` | Main 生成的 App Host 配置；修改源头是 Main 的配置文件，不直接编辑此文件 |
| `revisions/<instanceId>/<sha256>/` | 展开的应用代码及运行依赖 |
| `revisions/<instanceId>/.active-revision`、`.lifecycle.json` | 当前版本及生命周期状态，不是可随意删除的缓存 |
| `volumes/<instanceId>/configs/` | 按修订保存的实例配置，可能包含秘密信息 |
| `volumes/<instanceId>/storage/` | 实例默认的持久数据目录，包括本地数据库、文件等；外部存储仍以实例配置为准 |
| `control/` | 节点所有权与操作回执，用于执行协调和恢复，不手工删除锁或操作记录 |
| `output/` | 节点监督器捕获的子进程输出 |
| `logs/` | App Host 自身日志，与 Main 的部署事件日志不同 |

代码版本和持久数据分开存放。保留旧代码不代表保存了当时的数据库，也不意味着可以一键回滚。通过管理界面或 CLI 修改实例配置，使运行状态和平台记录保持一致。

### 配置项与目录的对应关系

| 配置项 | 决定的位置 |
| --- | --- |
| `drive.disks.<disk>.location`（`fs`） | 原始归档的磁盘根目录，内部再加 `deployment.artifacts.prefix` |
| 对象存储磁盘的 bucket 等设置 | 原始归档的对象存储位置 |
| `deployment.dataDir` | `host-directories.json`、`cache/artifacts/`、部署事件 `logs/` 的根目录 |
| `deployment.nodes.<id>.local.directory` | 该节点的 `revisions/`、`volumes/`、`control/`、`output/`、`logs/` 的根目录 |

这三类位置独立配置。修改 `dataDir` 不会同时移动 Drive 原文件或节点数据；修改磁盘设置也不会移动实例数据。

模板通过应用路径生成默认值，`APP_STORAGE_DIR` 可以改变默认存储根目录。示例显式写入的 `storage/...` 是相对路径，按应用启动工作目录解析，不会自动改写为新的存储根目录。运维时可使用明确的绝对路径，并保持启动目录稳定。

已有节点的标识与绝对目录绑定。直接改变目录可能触发 `HOST_DIRECTORY_IDENTITY_CHANGED`，不能删除绑定文件来绕过检查。路径变更需要单独安排数据迁移和验证，重启不会自动搬运文件。

子应用项目中的 `storage/deployment/` 是项目 CLI 保存提交回执的位置，与 Main 的同名目录职责不同。排查结果未知的部署时，也要保留项目侧回执。

<a id="持久化存储与备份"></a>

## 持久化与备份

### 必须保存的数据

备份应覆盖 Main 数据库、Main 的 `config.yml` 和加密密钥、仍在引用的 Drive 原始归档，以及各节点的完整持久目录。`host-directories.json`、实例配置和控制状态也应保留，不能只保存业务文件。

实例使用外部数据库、文件服务或对象存储时，将它们一起纳入备份范围。安排维护窗口或使用数据库支持的一致性备份方式，使数据库、文件和实例配置能够对应恢复；在线复制一个正在写入的目录不等于可恢复备份。

升级和配置应用中的“已备份”只是确认，不执行备份。定期验证恢复后的数据、实例状态和登录，而不是只确认备份文件存在。

### 可重建的缓存

`cache/artifacts/archives/` 可在 Drive 原文件仍可读、凭据有效时重新下载并校验。清理前停止或等待相关上传、部署和恢复任务完成，避免删除正在使用的归档或 `incoming/` 文件。

缓存重建不恢复实例业务数据。如果原文件已经丢失，缓存可能是剩余副本，不能先清理它再尝试恢复。不要把整个 `revisions/` 当作缓存删除，因为其中还包含当前版本和生命周期状态。

### 删除与清理边界

删除实例应通过平台或项目 CLI 发起，默认保留持久数据；明确选择清理数据并确认后才会移除相应本地数据。外部数据库、对象存储等资源不能假定会被一并删除，需要按实际配置单独核对。

删除版本通过构建产物管理完成，遵守实例引用和保留规则；不要直接删除共享归档或通过普通附件入口绕过检查。停用节点不会自动删除节点记录和数据。

部署事件日志不会随实例删除而自动清理。日志有单次归档大小限制，但当前没有跨部署的自动保留期清理；按审计需求归档，再安排清理。`output/`、节点日志和部署事件日志应分别管理，不把它们的清理策略套到 `control/` 或实例数据上。
