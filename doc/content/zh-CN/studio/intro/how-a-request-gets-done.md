---
title: 一个需求怎样完成
description: 以“供应商评分与分级”为例，看一个需求从提出到上线：Agent 团队怎样推进，人在哪些关键处做决策，做决策时手上有什么依据。
---

采购团队在 Studio 里有一个“供应商管理”项目，应用建在 NocoBase Core 上。采购主管周航不写代码。这次采购部要给供应商分级，周航提出了这样一个需求：

> 按交付准时率、质量合格率和价格给供应商评分，分为 A、B、C 三级；C 级供应商下单前需要采购经理审批。

<ol class="flow">
<li class="human"><div class="step"><div class="step-head"><strong>提出</strong><span class="who human">周航</span><span class="who agent">我的 Agent</span></div><p>用业务语言说清分级规则，回答 Agent 的问题；Agent 整理成任务和验收场景。</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>分派</strong><span class="who agent">调度 Agent</span></div><p>先请擅长设计的 Agent 写方案，再把开发交给擅长开发的 Agent。</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>回答提问</strong><span class="who human">周航</span></div><p>方案里发现一条现有的审批规则，C 级供应商的小额订单要不要审批，由周航拍板。</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>开发</strong><span class="who agent">执行 Agent</span></div><p>在任务自己的分支上基于 Core 开发，写测试，开 PR。</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>检查与评审</strong><span class="who sys">代码仓库的 CI</span><span class="who agent">执行 Agent</span></div><p>CI 跑检查和测试，再换一家厂商的模型评审代码。</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>验收</strong><span class="who human">周航</span></div><p>看交付报告、验收标准和截图，在预览里试一遍，通过就合并。</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>上线</strong><span class="who human">项目负责人</span></div><p>合并后部署到预发布环境；发布到生产由人批准，出了问题可以回滚。</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>沉淀</strong><span class="who agent">执行 Agent</span></div><p>学到的经验记进项目记忆，下次开工前先读。</p></div></li>
</ol>

## 提出

周航打开「我的会话」，和自己的 Agent 聊这件事。Agent 先看了现有的供应商模块，问了两个问题：三个指标在评分里各占多少，没有历史订单的新供应商算哪一级。周航当场定下：准时率和合格率各占 40%，价格占 20%；新供应商先按 B 级，满三个月后按评分重新定级。

Agent 把这些规则写进任务描述和验收场景，放进“供应商管理”项目。周航点「开始执行 1 个任务」，任务进入「进行中」。

::figure req-session | 周航和自己的 Agent 讨论需求，规则确认后，Agent 建好任务

任务负责人是周航，执行者是调度 Agent。这段会话之后一直挂着这个任务和它的进展，周航随时可以回来问“现在怎么样了”。

周航也可以不经过讨论，直接点「新建任务」填写，见 [提出需求](../use/raise-a-request.md)。

## 分派

调度 Agent 读任务描述、知识库里的《采购审批制度》和项目的技能。这次改动涉及数据结构和审批，它没有直接安排开发，先请擅长设计的 Agent 写一份简短方案。

::figure req-dispatch | 调度 Agent 交出一步，写清做什么、读什么、做到什么程度算完成

调度 Agent 按每个 Agent 擅长什么分派工作，自己不写代码。同一时间只有一个步骤修改代码，评审和调查以只读方式同时进行。

## 回答提问

写方案时，Agent 发现《采购审批制度》里已经有一条规则：订单金额超过 5 万元，需要采购经理审批。C 级供应商的小额订单要不要审批，需求里没有说，这要在业务上拍板。

调度 Agent 把任务移到「阻塞中」，在“需要你”卡片里写清要周航决定什么。周航在「我的任务」的“等你处理”里看到它，点「回复」：C 级供应商的订单不论金额都要审批，其他供应商仍按金额。调度 Agent 收到回复，把开发交给擅长功能开发的 Agent。

::figure req-blocked | 需要人决定的事，写在“需要你”卡片里，交给任务负责人

## 开发

执行 Agent 在运行环境上、这个任务自己的工作目录里开发，分支默认是 `agent/PUR-23`。它直接使用 Core 的数据、权限和审批能力，只开发供应商评分与分级这部分业务，并按验收场景写测试。提交后它开出 PR，Studio 自动把 PR 关联到任务。

任务做到哪里，任务页最上方随时写着：哪个 Agent 在做、做了多久、在哪台机器上，接下来做什么。

::figure req-now | 任务页最上方：现在谁在做，接下来做什么

## 检查与评审

代码仓库的 CI 运行代码规范、类型、测试和构建检查。检查失败时，Studio 唤醒调度 Agent 安排修复；连续 3 次修复后仍然失败，通知任务负责人。

检查通过后，调度 Agent 把代码交给另一家厂商的 Agent 评审；没有在线的，就换同一家的另一个模型。写代码的模型不评审自己的代码。

::figure req-checks | 检查失败后修复，再由另一家厂商的模型评审

## 验收

PR 通过检查和评审后，调度 Agent 把任务移到「待验收」，附上交付报告：原来的情况、确定的方案、改了什么、怎么验证的、遗留问题和建议，最后是验收标准。开发的 Agent 为每个验收场景附上了截图。

::figure req-accept | 验收时看交付报告、验收标准和截图

这个项目的 CI 为每个 PR 部署了一个预览环境。周航在任务页打开预览，用初始管理员登录，给一家 C 级供应商下了一笔 1 万元的订单，确认它进入了采购经理的审批。

::figure req-preview | PR 的预览环境，可以亲自试一遍

结果符合预期，周航点「合并」，任务变为「已完成」。如果有地方不对，就点「退回修改」写明原因，调度 Agent 会安排修改，改完再交回来。

## 上线

合并后，代码仓库的 CI 把改动部署到预发布（staging）环境，任务上标出它已经部署到的环境。

生产（production）环境受保护。发布新版本时，部署申请进入审批人的收件箱，写明要部署的版本、它来自的提交和 CI 日志。这个项目的审批人是项目负责人，批准后才部署到生产。出了问题，可以回滚到上一个版本。

已经完成、但还没上线的任务，列在项目的「已合并未发布」里。

> [!NOTE] 预览和部署需要连接 CI
> 代码仓库的 CI 连接到 Studio 之后，PR 才有预览，合并和发布才会部署到各个环境。见 [连接 CI](../setup/ci.md)。

## 沉淀

这个任务的讨论、决定、代码、测试和每一次运行，都留在任务和代码仓库里。执行 Agent 还把工作中学到的经验记进项目记忆，例如周航确认的“C 级供应商的订单不论金额都要采购经理审批”。项目记忆存在代码仓库里，随这次的 PR 一起评审、合并。

下次周航提出“按等级调整付款周期”，Agent 开工前先读项目记忆，再结合知识库和已有的测试接着做，周航不用从头交代背景。换一个人负责，或者换一个 Agent 来做，都能无障碍交接。

## 周航做了什么

周航用业务语言说清要什么，和自己的 Agent 定下评分规则，在开发前回答了一个问题，在预览里试了一遍，然后合并。写方案、写代码、写测试、修复检查和评审，都由 Agent 团队完成。Agent 工作时，周航随时可以在任务里发评论补充要求，见 [跟进进展](../use/follow-progress.md)。
