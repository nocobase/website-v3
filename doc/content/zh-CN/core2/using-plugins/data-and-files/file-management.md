---
title: "文件"
description: "接入文件上传、元数据、内容访问与文件预览。"
---

## 提供的能力

`@nocobase/app-plugin-file` 提供文件 Repository、上传接口的构建工具和客户端服务，复用应用的数据库与 Drive 存储。应用可以基于它实现头像、附件或资料库等功能。

文件表、业务关联、存储 disk 和页面由应用提供；插件负责文件操作的公共能力。

## 使用场景与示例

### 示例：订单附件

应用创建一个订单附件 Collection，声明上传和查询操作，在订单详情中使用文件客户端上传，保存与订单的业务关联，并展示返回的文件记录。上传、列表、缩略图和预览界面，可以从 NocoBase UI Library 安装 `component-ui` 组件的源码后，由应用自行维护。

DOCX、XLSX、PPTX 的预览可以在浏览器本地渲染。旧版 Office 格式和 OpenDocument 的在线预览回退，依赖一个能从互联网访问的文件 URL，因此不能假设它可以读取需要应用会话才能访问的私有文件。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```prompt
请使用文件插件，为订单详情增加私有附件上传、列表和预览。
通过迁移创建附件 Collection，配置 Drive disk，声明必要操作和 policy。
元数据和文件内容都必须校验当前用户对订单的访问权限，不能将默认公开内容路由当作私有下载。
明确删除元数据与清理物理文件的策略，验证拒绝上传、越权下载和预览失败。
```

**完成的标志**：有权限的用户能够上传和读取订单附件；无权限的用户既不能查询元数据，也不能直接下载文件内容。

## 重要原理与实现

下表列出实现本例时的接入位置和预期的界面变化。这些是开发说明，具体的文件名沿用当前应用的结构。

| 接入位置 | 代码或配置的变化 | 界面与行为的变化 |
| --- | --- | --- |
| 数据库迁移与 Drive 配置 | 声明附件字段和存储位置 | 上传的文件有持久的元数据和明确的存储归属 |
| 服务端的文件路由与订单关联 | 声明操作、策略，以及受保护的私有内容访问 | 列表和下载遵循业务权限 |
| 订单详情与 UI 组件 | 接入上传、列表和预览，并处理失败 | 页面上出现附件区域和明确的操作反馈 |

### 接入前的准备

注册 Client 和 Server 插件之后，应用还需要完成三项配置：

1. 配置上传所用的 Drive disk，参阅 [文件存储与驱动](../../framework/file-storage.md)。
2. 用迁移创建业务文件 Collection。
3. 用 `/server` 导出的 `defineFileRepositoryApiRoutes()` 声明资源名、Collection、disk、内容路径、允许的操作和 `policy`。

插件自身不会创建文件表、不会注册业务页面，也不提供统一的“文件管理中心”。文件 Collection 必须包含 `id`、`disk`、`key`、`filename`、`ext`、`mimeType`、`size`、`createdAt`、`updatedAt` 这些字段；`contentUrl` 在响应时生成，不需要对应的数据库列。

### 上传与访问

以应用自行声明的 `attachments` 资源为例：

| 能力 | 声明后可用的入口 |
| --- | --- |
| 单文件上传 | `POST /api/attachments/uploadOne` |
| 多文件上传 | `POST /api/attachments/uploadMany` |
| 元数据查询 | `POST /api/attachments/findMany` 等已声明的 Repository 操作 |
| 文件内容 | 配置的 `accessPath`，例如 `/uploads/attachments/<uuid>.<ext>` |

只有在 `actions` 中明确声明的操作才会暴露。上传同样受 `policy.create` 的限制：`create: false` 会禁止上传。上传请求不接受任意附加的业务字段；必填的业务字段，应通过服务端策略的默认值等方式提供。

客户端使用 `/client` 导出的 `clientFileRepositoryManagerToken`，通过 `manager.repository('attachments')` 取得文件操作对象；服务端对应的入口是 `/server` 导出的 `serverFileRepositoryManagerToken`。

## AI 开发的约束与验证

### 本插件的开发约束

- 内容路由和元数据接口的授权要分别检查；默认的 `accessPath` 不受 Repository `policy` 的保护。
- 上传只接受约定的字段，业务归属由服务端处理；不要信任客户端随意提交的订单 ID。
- 验证大小限制、失败后元数据与存储对象的状态、私有下载和删除策略；不能把 `deleteOne` 当作物理清理。

### 内容访问与删除的边界

当前路由工具生成的 `accessPath` 内容入口不做身份认证，也不受 Repository `policy` 的保护。如果需要私有附件，应用必须另外设计受保护的内容访问方式；不能只配置了列表权限，就认为文件内容已经隔离。

`stream` 直接返回文件流；`redirect` 会跳转到存储的 URL，要求 disk 支持生成公开 URL 或签名 URL。更换默认 disk 并不会搬迁历史文件。`deleteOne` 删除的只是元数据，不会自动删除物理文件；业务上的清理需要单独处理。

请验证上传大小限制、拒绝写入、元数据与物理文件的一致性、内容访问以及预览回退。相关文档：[Repository 数据接口](../../framework/http/repository-routes.md)、[管理插件](../../developing-apps/manage-plugins.md)。

以上检查是接入后的验收要求，并不表示本文已经完成了运行验证。请让 Agent 报告实际的改动、执行过的检查和未验证的部分；项目指引、Skills 和通用的检查流程见 [和 Agent 一起开发](../../developing-apps/develop-with-an-agent.md) 与 [测试与验收](../../developing-apps/testing-and-acceptance.md)。

源码依据：[插件的公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-file)。
