---
title: "配置文件存储并使用附件"
metaDescription: 配置本地目录或私有 S3 存储桶，在客户详情上传、预览和下载附件，按客户权限控制访问并清理超时暂存文件。
---

销售把客户发来的需求材料附在客户记录上，有权跟进的同事就能在客户详情中预览和下载。你可以在已有客户详情页和客户权限的应用中接入附件，也可以运行 [CRM 完整示例](https://github.com/nocobase/doc-demo-crm/tree/main) 体验。

**学习模块**

- [文件存储与驱动](../../core/framework/file-storage.md)
- [文件插件](../../core/using-plugins/data-and-files/file-management.md)

## 选择并配置文件存储

文件内容可以保存在本地目录或 S3 存储桶中。应用用磁盘名称（如 `local`、`s3`）标识存储位置，在每条文件记录中保存磁盘名称和文件键，以便下载或清理时找到原文件。

### 使用本地存储：指定私有文件目录

CRM 示例默认使用 `local` 磁盘，可以直接开始上传。[服务端配置](https://github.com/nocobase/doc-demo-crm/blob/main/server/config/drive.ts)中的 `driver: 'fs'` 表示使用文件系统，`location: paths.storage()` 指向应用的存储目录，默认是项目下的 `storage/`。

如果是新部署，想将文件写入挂载卷，可以在项目根目录的 `config.yml` 中指定绝对路径。将下面的路径换成应用进程可读写的持久化目录，并将其放在网站公开目录之外。多个实例使用本地磁盘时，都需要挂载同一份文件。

```yaml
drive:
  default: local
  disks:
    local:
      driver: fs
      location: /srv/crm/files
      visibility: private
```

### 使用 S3 对象存储：配置存储桶、区域和访问凭据

先准备一个私有存储桶，保持阻止公开访问，并为应用运行身份授予读取、写入和删除附件对象的权限。在 `config.yml` 中填写实际桶名和桶所在区域。下面使用桶策略控制访问，`supportsACL: false` 让上传请求省略对象 ACL。

```yaml
drive:
  default: s3
  disks:
    s3:
      driver: s3
      bucket: your-crm-bucket
      region: us-east-1
      credentials: {}
      visibility: private
      supportsACL: false
```

`credentials: {}` 让 AWS SDK 从服务端运行环境获取凭据。可以给应用分配 IAM 角色，也可以通过部署环境注入 `AWS_ACCESS_KEY_ID` 和 `AWS_SECRET_ACCESS_KEY`；临时密钥还需要 `AWS_SESSION_TOKEN`。[AWS 凭据配置说明](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html)

使用 S3 兼容服务时，在同一个 `s3` 配置块中添加服务商提供的 `endpoint`，填写该服务要求的签名区域。如果服务要求用路径访问桶（`https://主机/桶名`），再设置 `forcePathStyle: true`。

### 指定客户附件上传使用的磁盘

在 CRM 示例中，`drive.default` 决定新上传的客户附件和新生成的报价文档写入哪块磁盘。切换时保留旧磁盘的名称、目录或桶以及访问凭据。已有记录仍按原磁盘读取，修改默认值不会搬迁文件。在自己的应用中接入时，让[附件上传路由](https://github.com/nocobase/doc-demo-crm/blob/main/server/routes/customer-files.ts)使用这个磁盘名。

保存配置并重启应用。以管理员身份打开 **系统设置 → 系统 → 文件存储**，选择目标磁盘，点击 **检查**。临时文件的写入、读取和删除都成功后，再到 **数据与文件 → 文件与报价文档** 核对客户附件使用的磁盘名。如果桶策略按前缀授权，检查用的临时文件位于 `nocobase-check/`，示例附件位于 `objects/`。请分别确认应用有权读写和删除这两个前缀下的对象。[文件存储与驱动](../../core/framework/file-storage.md)

## 在客户详情中上传和管理附件

### 设置上传限制和客户访问权限

在自己的应用中开发附件功能时，可以向开发 Agent 提出以下需求。使用完整示例时，可直接体验下一节的上传操作。

```prompt
给客户详情加一个“附件”页签，让销售上传需求材料，每次最多保存 10 个文件，每个不超过 5 MB。负责人和有权跟进该客户的主管可以添加和移除附件，只读共享的同事可以预览和下载。

点击保存才把附件关联到客户。客户移交或附件移除后，原来能打开的链接也要按最新权限检查。管理员可以清理超过 24 小时仍未关联客户的上传文件。
```

预览和下载都通过应用读取文件。每次请求都要检查当前用户对所属客户的访问权限，私有桶和私有目录只解决文件的存放问题。[CRM 文件服务](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/customer-files.ts)

### 上传、保存、预览和下载附件

1. 用销售 Alex 的账号打开其负责的 **Northstar Manufacturing → 附件**。示例账号和负责人设置见[配置用户与角色](roles-and-permissions.md#配置用户与角色)。
2. 创建 `Customer requirements.txt`，写入一条容易核对的需求。点击 **添加附件**，选择文件，上传完成后点击 **保存**。取消会放弃本次选择；保存失败时可保留选择并重试。
3. 在附件列表核对文件名、大小和上传人。点击文件名预览需求，再点击 **下载**，确认下载的内容与原文一致。如果刚从本地存储切换到 S3，再打开一个切换前已保存的附件，确认旧文件也能下载。

![客户详情中的需求附件](/assets/guides/customer-attachments.png)

## 验证附件访问权限并清理超时暂存文件

- 用有权主管 Morgan 和只读共享用户分别打开同一客户。两人都可以预览和下载，只有有编辑权限的人可以添加和移除附件。未获共享的销售 Taylor 和未登录访客都无法用下载链接读取文件。
- 保留一个下载链接，将客户移交给另一位销售。原负责人失去客户访问权限后，再打开该链接应被拒绝。移除附件后，原上传人也无法通过旧链接读取文件或重新关联它。
- 以管理员身份进入 **系统设置 → 数据与文件 → 文件与报价文档**。在清理列表中选择一条超过 24 小时且从未关联客户的暂存上传，确认删除后刷新列表。已保存的客户附件和已签发的报价文档应仍可下载。

## 小结与下一步

现在销售可以在客户详情使用附件，下载权限随客户归属和共享关系生效。如果还需要从已确认的报价生成固定格式的 DOCX，继续查看[用模板生成单据文件](template-print.md)。
