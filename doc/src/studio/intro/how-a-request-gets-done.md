---
title: 一个需求怎样完成
description: 以“供应商分级”为例，看一项需求从提出到验收的全过程：每一步谁来做，在 Studio 里看到什么。
---

采购团队在 Studio 里有一个“供应商管理”项目，应用建在 NocoBase Core 上。采购主管周航不写代码，他想给供应商分级：

> 按交付准时率、质量合格率和价格给供应商评分，分为 A、B、C 三级；C 级供应商下单前需要采购经理审批。

这项需求在 Studio 里走过下面几步。<span class="who human">人</span> 表示人做的事，<span class="who agent">Agent</span> 表示 Agent 做的事。

<ol class="flow">
<li class="human"><div class="step"><div class="step-head"><strong>提出需求</strong><span class="who human">周航</span><span class="who agent">我的 Agent</span></div><p>在会话里说清要什么，Agent 建好任务。</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>安排</strong><span class="who agent">调度 Agent</span></div><p>拆分步骤，把每一步交给合适的执行 Agent。</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>开发</strong><span class="who agent">执行 Agent</span></div><p>在独立分支上基于 Core 开发，写测试，开 PR。</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>检查与评审</strong><span class="who sys">代码仓库的 CI</span><span class="who agent">执行 Agent</span></div><p>检查失败就修复；通过后换一家厂商的模型评审。</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>回答提问</strong><span class="who human">周航</span></div><p>遇到业务判断，任务转为阻塞中，等周航回答。</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>验收</strong><span class="who human">周航</span></div><p>看交付报告，合并或退回修改。</p></div></li>
<li class="later"><div class="step"><div class="step-head"><strong>发布上线</strong><span class="tag wip">模块开发中</span></div><p>模块完善后补充。</p></div></li>
<li><div class="step"><div class="step-head"><strong>留下经验</strong><span class="who agent">执行 Agent</span></div><p>记录和项目记忆留在团队里，下次接着做。</p></div></li>
</ol>

## 提出需求

周航打开「我的会话」，选择「我的 Agent」，和自己电脑上的 Claude Code 聊这件事。Agent 先看了现有的供应商模块，再把需求整理成一个任务，放进“供应商管理”项目。周航点「开始执行」，任务进入「进行中」。

::figure req-session | 在「我的会话」里和自己的 Agent 讨论，Agent 建好任务

任务负责人是周航，执行者是调度 Agent。之后这段会话会一直挂着这个任务和它的进展，周航随时可以回来问“现在怎么样了”。

也可以不经过讨论，直接点「新建任务」。见 [提出需求](../daily/raise-a-request.md)。

## 调度 Agent 安排

调度 Agent 读任务描述、评论、知识库里的采购制度和项目的技能。这次改动涉及数据结构和审批，它先请一个擅长方案设计的执行 Agent 写出简短方案，再把开发交给擅长功能开发的执行 Agent。

::figure req-dispatch | 调度 Agent 在任务动态里交出一步，写清做什么、读什么、做到什么程度

每一步都写清做什么、读什么、做到什么程度算完成。同一时间只有一个步骤修改代码，评审和调查以只读方式并行。

## 开发

执行 Agent 在运行环境上的独立工作目录里工作，分支默认是 `agent/PUR-23`。它按 Core 的开发指引直接使用数据、权限和审批能力，只写供应商分级相关的业务代码，并按验收场景编写测试。提交后它开出 PR，Studio 自动把 PR 关联到任务。

::figure req-now | 任务页顶部的「现在」一行，随时说明任务在等什么

## 检查与评审

代码仓库自己的 CI 运行代码规范、类型、测试和构建检查。检查失败时，Studio 唤醒调度 Agent，安排 Agent 修复；连续几次修复仍然失败，会通知负责人。

检查通过后，调度 Agent 把代码交给另一家厂商的执行 Agent 评审；没有在线的，就换同一家的另一个模型。写代码的模型不评审自己的代码。

::figure req-checks | 检查失败后修复，再由另一家厂商的模型评审

## 回答提问

开发中遇到一个需要业务判断的问题：没有历史订单的新供应商算哪一级？调度 Agent 把任务转为「阻塞中」，在“需要你”卡片里写清问题。

周航在「我的任务」的“等你处理”里看到它，点「回复」写下答案。调度 Agent 收到回复后接着安排。

::figure req-blocked | 需要人判断的事，写在“需要你”卡片里交给任务负责人

## 验收

PR 通过检查和评审后，调度 Agent 把任务转为「待验收」，附上交付报告：改动前的情况、约定的方案、改了什么、怎么验证的，以及验收标准和截图。

周航对照验收标准确认结果，点「合并」，任务变为「已完成」。如果有地方不对，就点「退回修改」写明原因，调度 Agent 会安排修改后再交回来。

::figure req-accept | 验收时看交付报告，通过就合并

## 发布上线

> [!PENDING] 发布与部署
> 合并后的改动怎样进入测试环境和生产环境、由谁批准，会在“发布与部署”模块完善后补充。

## 留下经验，下次接着做

这项需求的讨论、决定、代码、测试和每一次运行都留在任务和仓库里。Agent 还会把工作中学到的东西记进项目记忆，例如周航确认的“新供应商默认 B 级”。项目记忆是写给 Agent 看的，周航不需要去读，也不需要整理。

下次周航提出“按等级调整付款周期”，Agent 开工前先读这些记忆，再结合知识库和已有的测试接着做，周航不用从头交代背景。

## 周航做了什么

整个过程里，周航只做了三件事：说清要什么、回答一个问题、验收结果。拆分步骤、写代码、写测试、修复检查、评审，都由 Agent 团队完成。

Agent 工作时，周航随时可以在任务里发评论补充要求、@ 某个 Agent 提问，或者把执行者改成自己接手。见 [跟进进展](../daily/follow-progress.md)。
