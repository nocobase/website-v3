---
title: UI 组件库
status: 待补充正文
description: NocoBase 发布的业务组件和区块。Agent 安装时把源码复制进应用，之后归应用所有，可以改，不会被自动更新。
---

> [!PENDING] 正文待编写
> 下表来自 NocoBase 仓库 `v3-develop` 分支的 `ui-library/registry/`。每个组件的预览见 [ui.nocobase.com](https://ui.nocobase.com)。

## 计划包含

- 组件库是什么：shadcn 方式发布，安装即复制源码
- 安装在哪里：组件在 `client/components/`，区块在 `client/extensions/nocobase-<名称>/`
- 默认模板已经预装了哪些
- 升级：组件不会自动更新，需要时由 Agent 按三方合并的方式更新
- 每个组件依赖哪个插件

## 组件和区块

| 分组 | 组件 / 区块 | 依赖的插件 |
| --- | --- | --- |
| 通用 | 页面框架 `page-container`、`page-header`，弹窗与抽屉 `route-dialog`、`route-drawer`、`route-child-page`，`data-table`、`kanban`、`property-fields`、`rich-text-editor`、`markdown-view`、`long-text`、`comment-thread`、`attachment-list`、`record-link`、`settings-dialog`、`flow-diagram`、`setup-readiness` | — |
| 登录 | `auth-forms`、`auth-methods`、`auth-centered-layout`、`auth-split-layout`、`device-approval` | 认证 |
| 权限 | `permission-editor`、`role-list`、`default-access-editor` | 权限 |
| 流程 | `lifecycle-diagram`、`workflow-management`（「流程管理」页面） | 记录生命周期 |
| 审批 | `approval-ui` | 审批 <span class="tag pro">商业版</span> |
| 任务中心 | `task-center-ui` | 任务中心 <span class="tag pro">商业版</span> |
| 收件箱 | `inbox`、`inbox-button` | 站内信 |
| Agent | `agent-chat`、`agent-queue`、`agent-run-history`、`agent-composer`、`agent-picker` | Agents |
| 项目 | `issue-table`、`issue-card`、`issue-detail`、`project-detail`、`plan-card` | 项目 |

插件也可以发布自己的组件，例如文件插件的 `component-ui`、通知插件的 `logs-ui`。
