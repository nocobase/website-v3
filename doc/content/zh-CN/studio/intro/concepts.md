---
title: 核心概念
description: 理解 Studio 中项目、任务、会话、Agent、运行环境与团队知识的关系，以及代码改动如何关联到交付版本。
---

Studio 以项目组织任务和代码。人负责决策与验收，Agent 团队完成开发。技能、知识库和项目记忆供团队共同使用。

<figure class="map concept-map" aria-label="项目组织任务与代码，Agent 和运行环境提供执行能力，技能与资料提供共同背景">
<div class="row"><div class="box brand"><b>项目</b><span>组织相关任务、代码仓库与团队资料</span></div></div>
<div class="down">任务与代码关联到同一项目</div>
<div class="row c2"><div class="box human"><b>任务</b><span>需求、负责人、进展与交付结果</span></div><div class="box"><b>代码仓库</b><span>代码、PR 与版本</span></div></div>
<div class="down">Agent 团队执行任务，提交代码改动</div>
<div class="row c2"><div class="box agent"><b>Agent</b><span>调度 Agent 分派，执行 Agent 完成步骤</span></div><div class="box agent"><b>运行环境</b><span>提供编码工具、模型与执行资源</span></div></div>
<div class="row"><div class="box knowledge"><b>技能 · 知识库 · 项目记忆</b><span>为 Agent 提供开发规范、业务资料与项目经验</span></div></div>
</figure>

## 项目与代码仓库

**项目**组织相关任务、成员、代码仓库和资料。项目负责人管理设置、共享资料和版本交付。

**代码仓库**保存应用代码，一个项目可关联多个仓库。新建仓库默认基于 NocoBase Core 初始化，也可接入已有仓库。

![「供应商管理」项目汇总任务进展，并提供知识库、成员和发布入口](https://static-docs.nocobase.com/studio-zh-project-overview-20261030-v3.png)

见 [新建项目](../setup/new-project.md)与 [项目设置](../project/settings.md)。

## 任务与负责人

**任务**记录一项工作的需求、验收标准、讨论和交付结果，例如「供应商评分与分级」。子任务用于拆分工作，前置任务表示依赖。

每个任务有一位**负责人**，负责回答问题、确认取舍和验收。调度 Agent 组织执行，设计、开发和评审的结果都保留在任务中。

任务有六种状态，常见流转如下：

<div class="states" aria-label="主要流转：待规划到进行中，进行中与待验收可往返，验收后已完成"><span class="st-pill"><span class="si backlog"></span>待规划</span><span class="arrow">→</span><span class="st-pill"><span class="si progress"></span>进行中</span><span class="arrow">⇄</span><span class="st-pill"><span class="si review"></span>待验收</span><span class="arrow">→</span><span class="st-pill"><span class="si done"></span>已完成</span></div>
<div class="states" aria-label="进行中与阻塞中可往返，未完成的任务可以取消"><span class="st-pill"><span class="si progress"></span>进行中</span><span class="arrow">⇄</span><span class="st-pill"><span class="si blocked"></span>阻塞中</span><span class="arrow">·</span><span>未完成的任务</span><span class="arrow">→</span><span class="st-pill"><span class="si cancel"></span>已取消</span></div>

「阻塞中」等待负责人决策，「待验收」等待确认交付结果。这些事项会排在「我的任务」前面。

![负责人在「我的任务」中查看交付报告并验收](https://static-docs.nocobase.com/studio-zh-req-accept-20261030-v3.png)

任务负责人是一项职责，不是系统角色。Agent 代表发起人工作，受其权限约束。见 [任务状态与权限](../reference/statuses-and-permissions.md)。

## 会话

**会话**用于与 Agent 讨论需求、创建任务和跟进结果。一个会话可关联多个任务，任务进展会回到会话中。

会话仅本人可见。任务按项目权限与团队共享。

![在会话中确认业务规则，Agent 整理为任务，右侧显示任务进展](https://static-docs.nocobase.com/studio-zh-req-session-20261030-v3.png)

见 [我的会话](../use/sessions.md)。

## Agent 与运行环境

| 概念 | 职责 |
| --- | --- |
| 调度 Agent | 分派步骤，读取结果，向负责人提问或提交验收。 |
| 执行 Agent | 对应一个「编码工具 · 模型」组合，完成设计、开发、测试或评审。 |
| 运行环境 | 提供机器、编码工具和模型，执行 Agent 的工作。 |

![团队按「擅长什么」配置多个 Agent，并为调度 Agent 指定首选和备选](https://static-docs.nocobase.com/studio-zh-agent-team-20261030-v3.png)

一个运行环境可提供多个 Agent，同一个 Agent 也可在多台机器上执行。共享环境承接团队任务，个人环境只承接本人发起的任务。

![运行环境列出可用机器、编码工具及共享范围](https://static-docs.nocobase.com/studio-zh-shared-runtimes-20261030-v3.png)

一次执行产生一条**运行记录**，保存过程、结果和用量。一个任务通常包含多次运行。

见 [Agent 团队怎样工作](agent-team.md)与 [接入共享运行环境](../setup/shared-runtimes.md)。

## 技能、知识库和项目记忆

| 概念 | 保存什么 | 示例 |
| --- | --- | --- |
| [技能](../project/skills.md) | 开发方法和执行要求。 | 设计步骤、评审要点、交付报告格式。 |
| [知识库](../project/knowledge-base.md) | 团队编写或上传的业务资料。 | 供应商评分表、采购审批制度。 |
| [项目记忆](../project/project-memory.md) | 已确认的规则、经验和决策原因。 | C 级供应商的订单不论金额都需采购经理审批。 |

技能可用于全局、项目或代码仓库。项目记忆由 Agent 整理，随任务 PR 评审和合并，供后续任务复用。

![项目记忆保留已确认的业务规则和资料来源](https://static-docs.nocobase.com/studio-zh-project-memory-20261030-v3.png)

## PR、环境与版本

**PR**（合并请求）关联任务与代码改动。Agent 提交代码，完成检查与评审；负责人验收后合并。

**预览和测试环境**中的应用以 Studio 子进程运行，用于验证改动。

| 环境 | 用途 |
| --- | --- |
| PR 预览 | 由 CI 为 PR 创建，验证尚未合并的改动。 |
| 测试环境 | 运行合并后的代码，验证多项改动的组合结果。 |

**生产环境**建议自行构建镜像，部署到团队自己的基础设施。Studio 不承接生产环境部署，只记录生产版本。

**版本**对应一次发布，来自仓库中符合版本线的 tag。Studio 关联版本包含的任务和制品。

![发布页面关联版本、任务，以及测试和生产状态](https://static-docs.nocobase.com/studio-zh-releases-20261030-v3.png)

任务完成后，可通过版本和部署记录跟踪是否上线。见 [发布概览](../release/overview.md)。
