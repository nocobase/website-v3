---
title: 核心概念
description: Studio 里的人、需求和任务、项目与代码仓库、Agent 与运行环境、技能、知识库和项目记忆、预览与部署环境，以及它们之间的关系。
---

<figure class="map" aria-label="Studio 的核心概念及其关系">
<div class="row"><div class="box human"><b>人</b><span>任务负责人、项目负责人、管理员：提出需求，回答提问，验收，批准上线</span></div></div>
<div class="down">需求整理成任务</div>
<div class="row"><div class="box brand"><b>任务</b><span>属于某个项目，代码在项目的代码仓库里</span></div></div>
<div class="down">调度 Agent 安排</div>
<div class="row c2"><div class="box agent"><b>Agent 团队</b><span>调度 Agent 分派，执行 Agent 设计、开发、测试、评审</span></div><div class="box"><b>运行环境</b><span>团队服务器和成员电脑，Agent 在这里工作</span></div></div>
<div class="down">做事时读，学到的写回去</div>
<div class="row"><div class="box"><b>技能 · 知识库 · 项目记忆</b><span>做事的方法 · 业务资料 · Agent 学到的经验</span></div></div>
<div class="down">合并后部署</div>
<div class="row"><div class="box"><b>部署环境</b><span>预览 · 预发布 · 生产</span></div></div>
</figure>

## 人

| 角色 | 是谁 | 做什么 |
| --- | --- | --- |
| 任务负责人 | 每个任务有一位，默认是提出需求的人 | 回答 Agent 的提问，验收结果 |
| 项目负责人 | 每个项目有一位 | 管理项目的设置、技能和知识库，通常也负责批准上线 |
| 管理员 | 系统角色「管理员」或「所有者」 | 接入共享运行环境，启用 Agent，管理成员、部署环境和系统设置 |

每位成员都有一个系统角色：「成员」「管理员」或「所有者」，也可以使用自定义的角色，见 [成员与角色](../admin/members-and-roles.md)。任务负责人和项目负责人不是系统角色，团队里的每位成员都可能是。

## 需求和任务

人提出的是需求。需求可以先在「我的会话」里和 Agent 讨论清楚，由 Agent 整理成任务；也可以直接填写成任务。任务放进项目，是 Studio 里推进工作的单位。

每个任务有：

- **负责人**：对结果负责的人，Agent 需要人决定时找负责人，做完交给负责人验收。
- **执行者**：任务开始执行后，执行者是调度 Agent，由它安排执行 Agent 去做。成员也可以自己执行一个任务。
- **项目、优先级、标签、截止日期**：运行环境先领取紧急任务的工作。
- **子任务和前置任务**：前置任务没完成时，任务先不开始；完成后自动接着推进。

每个任务都处在下面六个状态之一：

<div class="states" aria-label="任务状态"><span class="st-pill"><span class="si backlog"></span>待规划</span><span class="arrow">→</span><span class="st-pill"><span class="si progress"></span>进行中</span><span class="arrow">⇄</span><span class="st-pill"><span class="si blocked"></span>阻塞中</span><span class="arrow">·</span><span class="st-pill"><span class="si review"></span>待验收</span><span class="arrow">→</span><span class="st-pill"><span class="si done"></span>已完成</span><span class="st-pill"><span class="si cancel"></span>已取消</span></div>

| 状态 | 含义 |
| --- | --- |
| 待规划 | 还没开始，Agent 不会动它 |
| 进行中 | Agent 团队正在推进 |
| 阻塞中 | 等任务负责人决定一件事 |
| 待验收 | 已经交付，等任务负责人验收 |
| 已完成 | 验收通过；任务关联的 PR 全部合并后，自动变为已完成 |
| 已取消 | 不做了 |

人可以把任务改到任何状态。调度 Agent 只在进行中、阻塞中和待验收之间移动任务，执行 Agent 不改状态。

## 项目与代码仓库

项目把相关的任务和代码放在一起。新建项目时，可以新建代码仓库、选择已有的仓库，或者以后再添加。新建的仓库默认用 NocoBase 应用模板初始化，得到一个建在 Core 上的应用；也可以按提示词初始化，或者留空。

- 新项目的第一个任务是“初始化项目”，项目里的其他任务都等它完成后再开始。
- Studio 通过管理员添加的 Git 连接，访问 GitHub、GitLab 或 Gitee 上的仓库。成员连接自己的 Git 账号后，Agent 为成员开的 PR、成员在 Studio 里的合并，都以成员本人的身份进行。
- 执行 Agent 的分支默认叫 `agent/任务编号`，这个分支上的 PR 自动关联到任务。

> [!NOTE] 分支保护要在代码托管平台上设置
> Studio 不替你保护分支。请在 GitHub、GitLab 或 Gitee 上为默认分支开启保护规则。

## Agent 与运行环境

运行环境是 Agent 工作的机器：团队服务器、虚拟机，或者成员自己的电脑。运行环境上报它装好并登录了的编码工具和模型，每个“编码工具 · 模型”组合就是一个 Agent，例如 Claude · Opus 5.5。管理员写好它「擅长什么」并启用后，它就加入 Agent 团队，成为执行 Agent。调度 Agent 是 Studio 内置的，由管理员选一个启用的 Agent 来运行。

| | 共享运行环境 | 个人运行环境 |
| --- | --- | --- |
| 谁来接入 | 管理员 | 每位成员 |
| 执行谁的任务 | 所有人的 | 只执行它的主人自己发起的任务 |
| 适合 | 团队服务器，全天在线 | 成员自己的机器，用自己的编码工具和订阅 |

Agent 团队怎样分工、怎样同时推进多个任务，见 [Agent 团队怎样工作](agent-team.md)。

> [!WARNING] 运行环境不是安全边界
> Agent 在运行环境上，以运行 `nocobase-runner` 的系统用户的身份工作，能读写这个用户能访问的一切。请用专用的系统用户、容器或虚拟机来运行它。

## 我的任务和我的会话

每位成员有两种方式跟进工作：

| | 我的任务 | 我的会话 |
| --- | --- | --- |
| 以什么为单位 | 任务 | 一段会话 |
| 里面有什么 | 你负责、执行或关注的任务，等你处理的排在最前面 | 你和 Agent 的讨论，这段会话里建的任务，以及它们的进展 |
| 适合 | 每天处理等你做的决定：回答提问、验收 | 需求还没想清楚时先讨论；一段会话里建的几个任务，在一处跟进 |

::figure my-tasks-list+sessions-list pair | 左：「我的任务」按任务跟进；右：「我的会话」按会话跟进

会话里可以和你自己的 Agent 对话，也可以和 Agent 团队里的 Agent 对话，见 [我的会话](../use/sessions.md)。会话只有你自己能看到。不论和谁对话，会话里的 Agent 都以你的身份和权限在 Studio 里做事，例如建任务、发评论。

## 技能、知识库和项目记忆

技能、知识库和项目记忆把方法和经验沉淀在团队里。Agent 做事时先读它们，换人、换 Agent 都能无障碍交接，提出新需求时也不用从头交代背景。

| | 保存什么 | 谁来写 | 在哪里 |
| --- | --- | --- | --- |
| 技能 | 做事的方法：怎样拆分步骤、写方案、开发、评审、写交付报告 | Studio 内置了几项，团队可以补充自己的，用在全局、某个项目或某个工作目录上 | 「Agent 管理 › 技能」 |
| 知识库 | 业务资料：业务规则、产品说明、技术约定 | 人写和上传，Agent 只读 | 「开发 › 知识库」 |
| 项目记忆 | Agent 在工作中学到的经验：人纠正或确认过的做法、踩过的坑、代码里看不出原因的决定 | Agent 自己写，随任务的 PR 一起评审、合并 | 「开发 › 项目记忆」，存在代码仓库的 `.nb-studio/memory/` |

## 预览与部署环境

代码仓库的 CI 连接到 Studio 之后：

- 每个 PR 部署一个预览，使用示例数据和自动生成的管理员账号，验收时可以亲自试一遍。
- 合并后，CI 把改动部署到预发布环境，任务上标出它已经部署到的环境。
- 受保护的环境（通常是生产环境）每次部署都要审批人批准；出了问题，可以回滚到上一个版本。

见 [连接 CI](../setup/ci.md) 和 [部署环境](../admin/environments.md)。

## 权限

成员能做什么，由角色决定。Agent 代表发起工作的人做事，权限不超过这个人；调度 Agent 和它安排的每一步，都代表任务负责人。合并 PR、批准部署到受保护的环境、管理成员，只能由人来做。见 [任务状态与权限](../reference/statuses-and-permissions.md)。
