---
title: 设备领用与审批
metaDescription: 员工提交领用申请，需要审批的交资产管理员审批，IT 支持发放并登记到台账；流程和通知用 Core 现成的工作流和通知插件。
---

这一步做[设计文档](https://github.com/nocobase/docs-examples-v3/blob/main/apps/itam-lite/docs/design.md)第 2 步：员工提交领用申请，笔记本、手机，以及名下设备已到上限的人的申请交资产管理员审批，之后 IT 支持发放，台账自动登记使用人。

## 1. 提需求

```prompt
按 docs/design.md 做第 2 步：设备领用与审批。审批用 Core 的工作流，通知发站内信；需要审批的类别和每人设备上限，管理员可以调整。
先建好员工、IT 支持、资产管理员三个角色，谁能看到哪些记录第 3 步再做。
验收：笔记本申请要资产管理员批准，IT 支持发放后，台账里这台设备变为在用、使用人是申请人；显示器申请直接进入待发放；每一步相关的人都收到站内信。
```

Agent 做完的内容：

| 部分 | 用到的 Core 能力 |
| --- | --- |
| 领用流程：草稿 → 待审批 / 待发放 → 已发放，另有驳回、撤回 | 工作流（`@nocobase/lifecycle`）：状态只能按声明的流转改变，每一步记录谁、何时，页面过期时拒绝覆盖别人的决策 |
| 审批规则：需要审批的类别、个人设备上限 | 工作流参数，管理员在「系统设置 › 流程管理」里调整，提交申请时读取 |
| 站内信：待审批、待发放、已批准、已驳回、已发放 | 通知插件和站内信插件；作为流程的后续动作执行，失败自动重试 |
| 员工、IT 支持、资产管理员三个角色 | 权限插件：每个动作是一项独立的业务权限 |
| 「领用申请」页面、侧边栏「收件箱」入口、「流程管理」页面 | 模板自带的流程图和流程管理组件 |

审批、通知、权限都是 Core 现成的能力，由 NocoBase 维护和测试。Agent 只写设备领用的业务规则，所以快，也可靠。能力清单见 [NocoBase Core](../core/index.md#通用能力不必从零开发)，工作流所在的包见 [核心包与工具包索引](../core/reference/packages.md)，通知见 [通知](../core/using-plugins/notifications/notification.md)。需要多级审批、会签、转交时，有商业审批插件授权的可以改用 [审批](../core/using-plugins/collaboration/approval.md)。

## 2. 准备三个账号

在「系统设置 › 用户管理」里新建三个用户，在「角色」里各选一个：

| 用户 | 角色 |
| --- | --- |
| Alice Wang | 员工 |
| Ben Zhou | IT 支持 |
| Cathy Liu | 资产管理员 |

## 3. 走一遍流程

用不同的浏览器（或无痕窗口）分别登录：

1. **Alice** 打开「领用申请 › 新建申请」，选笔记本，写明用途，提交。申请进入「待审批」。再提交一个显示器申请，它直接进入「待发放」。

   ![提交领用申请](https://static-docs.nocobase.com/20261030-itam-lite-requests-new-request.webp)

2. **Cathy** 打开「收件箱」，点开消息进入申请，点「批准」。

   ![资产管理员收到待审批的站内信](https://static-docs.nocobase.com/20261030-itam-lite-requests-inbox-approval.webp)

3. **Ben** 在「收件箱」里打开「可以发放了」的消息，点「发放」，选一台在库的笔记本。

   ![IT 支持选择设备发放](https://static-docs.nocobase.com/20261030-itam-lite-requests-issue-device.webp)

4. 打开「设备台账」，这台笔记本变为「在用」，使用人是 Alice。Alice 收到「设备已发放」的站内信。

## 4. 调整审批规则

管理员打开「系统设置 › 流程管理」，点「设备领用」，左边是流程图，右边是审批规则。勾选台式机并保存后，新提交的台式机申请就进入待审批；已经提交的申请不受影响。

![流程定义和审批规则](https://static-docs.nocobase.com/20261030-itam-lite-requests-workflow-definition.webp)

「执行记录」里每个申请一条，能看到它走过的每一步、谁操作的，以及每条站内信的发送结果。

![一个申请的执行记录](https://static-docs.nocobase.com/20261030-itam-lite-requests-workflow-execution.webp)

## 5. 提交

```bash
git add -A && git commit -m "feat: add device requests with approval"
```

**完成的标志**：笔记本申请经资产管理员批准、IT 支持发放后，台账里设备变为在用、使用人是申请人；显示器申请直接进入待发放；Cathy、Ben、Alice 都收到了对应的站内信；流程管理里能看到流程图、审批规则和执行记录。
