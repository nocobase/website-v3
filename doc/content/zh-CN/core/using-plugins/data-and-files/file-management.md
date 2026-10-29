---
title: "文件"
description: "接入文件上传、元数据、内容访问与文件预览。"
---

`@nocobase/app-plugin-file` 提供文件 Repository、上传接口构建工具和客户端服务，复用应用的数据库与 Drive 存储。应用可以据此实现头像、附件或资料库。

## 接入前准备

注册 Client 和 Server 插件后，还需要应用完成三项配置：

1. 配置上传使用的 Drive disk，参阅[文件存储](../../framework/file-storage.md)。
2. 用迁移创建业务文件 Collection。
3. 用 `/server` 导出的 `defineFileRepositoryApiRoutes()` 声明资源名、Collection、disk、内容路径、允许的操作和 `policy`。

插件自身不创建文件表、不注册业务页面，也不提供统一的“文件管理中心”。文件 Collection 必须具备 `id`、`disk`、`key`、`filename`、`ext`、`mimeType`、`size`、`createdAt`、`updatedAt`；`contentUrl` 在响应时生成，无需对应数据库列。

## 上传与访问

以应用自行声明的 `attachments` 资源为例：

| 能力 | 声明后可用的入口 |
| --- | --- |
| 单文件上传 | `POST /api/attachments/uploadOne` |
| 多文件上传 | `POST /api/attachments/uploadMany` |
| 元数据查询 | `POST /api/attachments/findMany` 等已声明的 Repository 操作 |
| 文件内容 | 配置的 `accessPath`，例如 `/uploads/attachments/<uuid>.<ext>` |

只暴露 `actions` 中明确声明的操作。上传同样受到 `policy.create` 限制：`create: false` 会禁止上传。上传请求不接受任意附加业务字段；必填业务字段应由服务端策略默认值等方式提供。

客户端使用 `/client` 的 `clientFileRepositoryManagerToken`，通过 `manager.repository('attachments')` 取得文件操作对象。服务端对应入口为 `/server` 的 `serverFileRepositoryManagerToken`。

## 示例：订单附件

应用创建订单附件 Collection，声明上传和查询操作，在订单详情中使用文件客户端上传，保存业务关联，并展示返回的文件记录。上传、列表、缩略图和预览界面可以从 NocoBase UI Library 安装 `component-ui` 组件源码后由应用维护。

DOCX、XLSX、PPTX 预览可在浏览器本地渲染。旧 Office 格式及 OpenDocument 的在线预览回退依赖互联网可访问的文件 URL，不能假设它可读取需要应用会话的私有文件。

## 内容访问与删除边界

当前路由工具生成的 `accessPath` 内容入口不做身份认证，也不受 Repository `policy` 保护。需要私有附件时，应用必须另外设计受保护的内容访问，不能仅配置列表权限后就认为文件内容已隔离。

`stream` 直接返回文件流；`redirect` 跳转到存储 URL，需要 disk 支持生成公开或签名 URL。更换默认 disk 不会搬迁历史文件。`deleteOne` 删除的是元数据，不自动删除物理文件；业务清理需单独处理。

验证上传大小限制、拒绝写入、元数据与物理文件一致性、内容访问和预览回退。相关文档：[Repository 数据接口](../../framework/http/repository-routes.md)、[管理插件](../../developing-apps/manage-plugins.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-file)。
