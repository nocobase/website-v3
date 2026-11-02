---
title: 任务状态与权限
description: 查询任务状态、常见流转和人及 Agent 的操作范围。
---

## 任务状态

<div class="states" aria-label="待规划到进行中，进行中与待验收可往返，最终已完成"><span class="st-pill"><span class="si backlog"></span>待规划</span><span class="arrow">→</span><span class="st-pill"><span class="si progress"></span>进行中</span><span class="arrow">⇄</span><span class="st-pill"><span class="si review"></span>待验收</span><span class="arrow">→</span><span class="st-pill"><span class="si done"></span>已完成</span></div>
<div class="states" aria-label="进行中与阻塞中可往返，未完成任务可取消"><span class="st-pill"><span class="si progress"></span>进行中</span><span class="arrow">⇄</span><span class="st-pill"><span class="si blocked"></span>阻塞中</span><span class="arrow">·</span><span>未完成任务</span><span class="arrow">→</span><span class="st-pill"><span class="si cancel"></span>已取消</span></div>

| 状态 | 含义 |
| --- | --- |
| 待规划 | 尚未开始，不自动执行 |
| 进行中 | Agent 团队推进工作 |
| 阻塞中 | 等待信息、决策或恢复条件 |
| 待验收 | 已交付，等待负责人验收 |
| 已完成 | 已验收，或关联 PR 全部合并 |
| 已取消 | 不再继续 |

状态固定，项目不能增删或改名。有任务编辑权限的人可调整状态。调度 Agent 只在进行中、阻塞中和待验收之间推进；执行 Agent 不修改任务状态。

待规划任务需要先「开始」，交由调度 Agent 推进。仅在评论中 @ Agent 不会绕过开始操作。

## 常用权限

| 操作 | 成员默认范围 | 管理员默认范围 |
| --- | --- | --- |
| 查看和处理任务 | 有权访问的项目和相关任务 | 全部 |
| 项目设置、项目知识 | 自己负责的项目 | 全部 |
| 删除项目、任务 | 不允许 | 允许 |
| 运行环境 | 接入并维护个人环境 | 管理共享环境 |
| Git 连接、组织密钥 | 不允许管理 | 允许管理 |
| 邀请、角色分配 | 不允许 | 允许 |
| 停用账号、重置他人密码 | 不允许 | 由所有者管理 |

项目可见性和具体业务操作共同决定访问范围。自定义角色可调整默认授权，见[成员与角色](../admin/members-and-roles.md)。

## Agent 权限

Agent 受代表成员的权限和 Agent 可用操作共同限制。任务工作通常代表任务负责人，会话代表发起会话的成员。

执行 Agent 可提交分支、推送和创建 PR。它不能验收或合并 PR，也不能管理成员和角色。知识库只读，项目记忆随任务 PR 维护。

预览发布受仓库检查来源限制；选择 Agent 自检时，Agent 可发布任务 PR 的预览。详情见[检查与 CI](../configure/checks.md)。
