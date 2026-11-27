---
title: 先用 Core，再接入 Studio
metaDescription: "了解 NocoBase Core 与 Studio 的两阶段接力方式：探索期用本地 Coding Agent 和 Core 快速做出 MVP，交付试用、反馈涌来后零迁移接入 Studio 并行打磨并投产。"
---

用 NocoBase 3 开发一个真实业务系统，不必一上来就搭建完整的团队协作和审批流程，也不用担心先轻后重会带来迁移成本。

推荐采用**两阶段接力**的推进方式：探索期在本地用 Coding Agent 和 NocoBase Core 快速对齐需求、做出最小可用版本（MVP）；交付业务同事试用、修改意见成批涌来后，再将同一个代码仓库零迁移成本接入 NocoBase Studio，交由 Agent 团队并行打磨、按流程把关质量并投产。

## 两阶段推进全貌

<figure class="two-stage-flow" aria-label="阶段一先理清业务并用本地 Coding Agent 与 Core 快速出 MVP，预览试用后零迁移接入 Studio 进入阶段二并行打磨与持续演进">
<div class="ts-stage">
<p class="ts-head"><b>阶段一 · 快速成型</b><span>本地 Coding Agent + Core</span></p>
<div class="ts-steps">
<div class="ts-card"><div class="ts-top"><span class="ts-pill human">业务与产品</span></div><b>理清业务边界</b><p>摸清痛点、核心数据、业务规则、角色权限与首版范围，避免 AI 在模糊需求上反复返工。</p></div>
<div class="ts-card"><div class="ts-top"><span class="ts-pill brand">开发 + Core</span></div><b>本地快速出 MVP</b><p>直接复用权限、认证、流程等底座能力，用 Claude Code、Codex 等专注写业务，边出界面边对齐。</p></div>
</div>
</div>
<div class="ts-link"><span>预览试用<br>接入仓库</span><svg viewBox="0 0 36 16" fill="none" aria-hidden="true"><path d="M2 8h28M24 2.5L31 8l-7 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
<div class="ts-stage ts-stage-studio">
<p class="ts-head"><b>阶段二 · 并行打磨与投产</b><span>无缝接入 Studio</span></p>
<div class="ts-steps">
<div class="ts-card"><div class="ts-top"><span class="ts-pill agent">Studio + Agent 团队</span></div><b>并行消化反馈并控质</b><p>将一线反馈拆成多任务并行推进，通过自动检查、跨模型评审和预览验收防止改坏已有功能。</p></div>
<div class="ts-card"><div class="ts-top"><span class="ts-pill pass">正式投产</span></div><b>上线并持续演进模块</b><p>应用上线后独立运行，沉淀知识库与项目记忆，沿同一节奏继续扩展更多业务模块。</p></div>
</div>
</div>
</figure>

## 阶段一：用 Core 快速出 MVP

项目刚启动时，需求变化最快、最需要高频讨论。这个阶段的目标不是铺开重流程，而是用最短路径把核心业务跑起来。

### 先理清业务，再让 Agent 动手

AI 写代码的速度很快，但如果业务边界没想清楚，只会把返工放大。在写第一行代码前，先花时间梳理清楚四件事：

- 核心业务对象和它们之间的关系；
- 关键业务规则和状态流转；
- 涉及哪些角色，各自能看什么、能做什么；
- 第一版只做哪些功能，哪些暂缓。

把这些内容整理成一份简短的需求或设计文档（方法见[先写一份系统设计文档](../guides/write-a-design-doc.md)），后续每次和 Agent 对话都有共同基准。

### 在本地用 Core 快速成型

由开发在自己电脑上，用熟悉的 Claude Code、Codex 或 Cursor，基于 NocoBase Core 的默认模板初始化应用并开发 MVP（操作见[用 Core 开发第一个应用](develop-your-first-app.md)）：

- **复用底座，专注业务**：用户、权限、登录认证、数据库、流程与审批等 30 多项基础能力开箱可用，Agent 只需要写企业自己的业务逻辑。
- **高频对齐，快速定型**：本地边聊边改，一边出可运行的页面和接口，一边和产品或业务负责人现场确认，省去提单、排期、来回转述的等待。
- **从第一天起保持架构规范**：虽然节奏像原型探索，但 Core 自带统一的目录结构、开发规范和随包发布的 Skill，写出来的不是一次性 Demo，而是可以直接演进为生产系统的标准工程。

## 什么时候切入 Studio

MVP 跑通后，可以先部署到测试或预览环境（见[选择部署方式](../core/deployment/choose-a-deployment-method.md)），开放给一部分一线业务同事真实试用。这时往往会出现一个明显的转折点。

### 切入的信号

当出现以下任意一种情况时，说明项目已经从“个人探索期”进入“团队迭代期”，适合切入 Studio：

- **反馈成批涌来**：一线试用后提出几十甚至上百条改进意见，靠一个人按顺序在本地会话里改不过来。
- **需要多人或多模块并行**：多个开发者或业务线要同时推进不同功能，本地多开终端难以跟踪进展与上下文。
- **进入投产前控质阶段**：系统即将正式上线，担心改新需求把已有功能改坏，需要自动检查、跨模型独立评审和统一的验收记录。
- **业务同事要直接参与**：希望业务负责人自己在界面上提需求、回答规则提问、看预览做验收，不再依赖开发居中转述。

### 零迁移成本接入现有仓库

从 Core 切入 Studio 不需要重写代码或调整架构。Studio 管理的正是同一个基于 Core 的 Git 仓库，工程结构、Skill 与运行方式完全一致。

只需要准备好 Studio（可先按[安装并使用 Studio](collaborate-with-studio.md) 在本机体验，或按[安装概览](../studio/setup/index.md) 为团队部署），新建项目时选择关联已有代码仓库、不重新初始化，即可直接接手继续开发（操作见[把项目接入 Studio](../guides/bring-into-studio.md)）。

## 阶段二：用 Studio 并行打磨与持续演进

接入 Studio 后，项目从个人本地快跑切换为团队可控的持续交付节奏。

### 多任务并行推进与流程把关

- **多任务并行吞吐**：把一线试用收集到的反馈拆分成独立任务，调度 Agent 按专长分派给 Agent 团队，在各自独立分支上并行开发。
- **正规流程稳住质量**：每次代码改动都经过自动检查、不同模型交叉评审，并附上交付报告与可操作的预览环境，再交给人验收合并（流程见[安装并使用 Studio](collaborate-with-studio.md)），有效避免并行修改把已有功能改乱。
- **关键节点由人拍板**：需要业务规则取舍时，任务自动停在「等你处理」中向负责人提问；合并代码与发布版本始终由人决定。

### 投产后持续演进更多模块

首版验证通过后即可正式部署上线。业务应用上线后独立运行，日常业务请求不经过 Studio。

随着系统持续运行，已确认的业务规则和踩过的坑会沉淀到 Studio 的知识库与项目记忆中。后续团队可以沿用同一套节奏，在原有应用上持续并行扩展新的业务模块，新加入的成员或 Agent 也能直接接手。

## 为什么先用 Core，再接入 Studio

| 维度 | 阶段一：本地 Coding Agent + Core | 阶段二：NocoBase Studio |
| --- | --- | --- |
| 核心目标 | 探索需求边界，尽快做出可运行的 MVP | 承接大量并行反馈，控质投产并持续演进 |
| 工作节奏 | 本地边聊边改，分钟级高频对齐 | 按任务拆分、多分支并行推进、按流程验收 |
| 主要参与者 | 业务/产品 + 开发者（本地 Coding Agent） | 业务人员 + 开发者 + 24 小时 Agent 团队 |
| 核心优势 | 起步零负担、方向调整最快，同时底座保证架构规范 | 并行吞吐高、评审与检查兜底、经验沉淀在团队里 |

## 真实节奏参考

> [!NOTE] 一个跨国复杂报价系统的实际推进节奏
> 某大型制造企业构建一套包含 400+ 配置参数、各国标准与商务条款的跨国报价系统时，正是按这一节奏落地的：
>
> - **前 3 天**：产品经理深入一线走访销售与方案人员，梳理核心参数、报价规则与首版范围。
> - **接下来 1 周**：开发在本地用 Coding Agent + NocoBase Core 搭出可运行的 MVP，一边演示一边与产品高频对齐定型。
> - **MVP 完成后**：部署预览环境给一线试用，意见迅速涌来；将仓库零迁移接入 Studio。
> - **再经过 1 周**：Studio 调度 Agent 团队并行消化数百条一线反馈，走完检查、跨模型评审与验收，复杂报价首版正式投产。
> - **后续约 2 个月**：沿同一套 Studio 节奏持续并行推进，逐步长出商机、方案、报价、订单、看板、资料库与 AI 助手等 10+ 业务模块。
>
> 具体周期取决于业务复杂度：轻量内部工具可能 1 天就走完阶段一，核心大系统则可按模块分批推进。

## 什么情况不必按两阶段走

两阶段接力适合大多数从 0 起步的业务系统，但并非唯一路径：

- **只用 Core，暂不上 Studio**：个人工具、小型应用、单人低频维护，或团队已有成熟的代码评审与项目管理流程，可以一直只使用 Core 开发和部署。
- **直接从 Studio 起步**：团队已经部署好 Studio，或者需要立刻让业务部门提交排队需求、通过标准流程启动新项目时，可以直接在 Studio 中[创建首个项目](../studio/setup/new-project.md)（Studio 会用同一个 Core 默认模板自动初始化仓库）。

## 下一步

- 开始阶段一，在本地跑起你的第一个业务应用：[用 Core 开发第一个应用](develop-your-first-app.md)
- 一条命令在本机安装免费的 Studio 社区版，并走完第一个需求交付：[安装并使用 Studio](collaborate-with-studio.md)
- 跟随一个从 Core 开发到接入 Studio 的完整项目教程：[基于 NocoBase 3 开发可靠的企业应用](../guides/build-reliable-enterprise-apps.md)
