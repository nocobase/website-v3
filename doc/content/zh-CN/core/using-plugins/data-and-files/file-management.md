---
title: "文件"
description: "接入文件上传、元数据、内容访问与文件预览。"
---

## 提供的能力

`@nocobase/app-plugin-file` 提供文件 Repository、上传接口构建工具和客户端服务，复用应用的数据库与 Drive 存储。应用可以据此实现头像、附件或资料库。

文件表、业务关联、存储 disk 和页面由应用提供；插件负责文件操作的公共能力。

## 使用场景与示例

### 示例：订单附件

应用创建订单附件 Collection，声明上传和查询操作，在订单详情中使用文件客户端上传，保存业务关联，并展示返回的文件记录。上传、列表、缩略图和预览界面可以从 NocoBase UI Library 安装 `@nocobase/file-component-ui` 组件源码后由应用维护。

DOCX、XLSX、PPTX 预览可在浏览器本地渲染。旧 Office 格式及 OpenDocument 的在线预览回退依赖互联网可访问的文件 URL，不能假设它可读取需要应用会话的私有文件。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```prompt
请在订单详情中增加私有附件，可以上传、查看列表和预览。
只有有权访问这张订单的人才能查看附件信息或下载文件，复制下载链接也不能绕过权限。
沿用现有存储配置；预览失败时说明原因，不把私有文件交给需要公开地址的在线预览服务。
请说明删除附件记录后如何处理实际文件，并检查拒绝上传、越权下载和预览失败的情况。
```

**完成的标志**：有权用户能上传和读取订单附件，无权用户既不能查元数据也不能直接下载内容。

## 重要原理与实现

| 接入位置 | 代码或配置变化 | 界面与行为变化 |
| --- | --- | --- |
| 数据库迁移与 Drive 配置 | 声明附件字段及存储位置 | 上传文件有持久的元数据与存储归属 |
| 服务端文件路由与订单关联 | 声明动作、策略及受保护的私有内容访问 | 列表和下载遵循业务权限 |
| 订单详情与 UI 组件 | 接入上传、列表和预览，处理失败 | 页面出现附件区域及明确操作反馈 |

### 接入前准备

注册 Client 和 Server 插件后，还需要应用完成三项配置：

1. 配置上传使用的 Drive disk，参阅[文件存储](../../framework/file-storage.md)。
2. 用迁移创建业务文件 Collection。
3. 用 `/server` 导出的 `defineFileRepositoryApiRoutes()` 声明资源名、Collection、disk、内容路径、允许的操作和 `policy`。

插件自身不创建文件表、不注册业务页面，也不提供统一的“文件管理中心”。文件 Collection 必须具备 `id`、`disk`、`key`、`filename`、`ext`、`mimeType`、`size`、`createdAt`、`updatedAt`；`contentUrl` 在响应时生成，无需对应数据库列。

### 上传与访问

以应用自行声明的 `attachments` 资源为例：

| 能力 | 声明后可用的入口 |
| --- | --- |
| 单文件上传 | `POST /api/attachments/uploadOne` |
| 多文件上传 | `POST /api/attachments/uploadMany` |
| 元数据查询 | `POST /api/attachments/findMany` 等已声明的 Repository 操作 |
| 文件内容 | 配置的 `accessPath`，例如 `/uploads/attachments/<uuid>.<ext>` |

只暴露 `actions` 中明确声明的操作。上传同样受到 `policy.create` 限制：`create: false` 会禁止上传。上传请求不接受任意附加业务字段；必填业务字段应由服务端策略默认值等方式提供。

客户端使用 `/client` 的 `clientFileRepositoryManagerToken`，通过 `manager.repository('attachments')` 取得文件操作对象。服务端对应入口为 `/server` 的 `serverFileRepositoryManagerToken`。

## AI 开发的约束与验证

### 本插件的开发约束

- 检查内容路由和元数据接口各自的授权；默认 accessPath 不受 Repository policy 保护。
- 上传只接受约定的字段，业务归属由服务端处理；不要相信客户端任意订单 ID。
- 验证大小限制、失败后的元数据与对象状态、私有下载及删除策略，不能把 deleteOne 当作物理清理。

### 内容访问与删除边界

当前路由工具生成的 `accessPath` 内容入口不做身份认证，也不受 Repository `policy` 保护。需要私有附件时，应用必须另外设计受保护的内容访问，不能仅配置列表权限后就认为文件内容已隔离。

`stream` 直接返回文件流；`redirect` 跳转到存储 URL，需要 disk 支持生成公开或签名 URL。更换默认 disk 不会搬迁历史文件。`deleteOne` 删除的是元数据，不自动删除物理文件；业务清理需单独处理。

验证上传大小限制、拒绝写入、元数据与物理文件一致性、内容访问和预览回退。相关文档：[Repository 数据接口](../../framework/http/repository-routes.md)、[管理插件](../../developing-apps/manage-plugins.md)。

以上是接入后的验收步骤；示例基线和实测范围见[版本与验证说明](../overview.md#示例版本与验证范围)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-file)。
