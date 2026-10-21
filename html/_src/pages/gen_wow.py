# 解决方案页的场景大图：Agent 的一天、事件链、岗位说明书、价值看板、从数据到上线的闭环等。
# 依赖 gen_sol.py 的绘图函数（导入时会顺带重新生成基础图）。
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_sol import *

def tl_row(time, who, body, sub='', right='', me=False):
    return f'<div class="{"me" if me else ""}"><time>{time}</time>{who}<div class="tx">{body}{f"<small>{sub}</small>" if sub else ""}</div><div class="r">{right}</div></div>'
AGT = lambda icon='bot': f'<span class="ag"><i data-lucide="{icon}"></i></span>'
YOU = lambda zh, en: f'<span class="av">{T(zh, en)}</span>'

# ======================= NocoCRM =======================
day = [
    ('07:30', AGT('building-2'), T('<b>公司情报</b> 发现北辰能源完成 C 轮融资 8 亿元，附 2 个来源', '<b>Company research</b> found Beichen Energy closed an ¥800M Series C, with 2 sources'), T('建议本周约对方 CFO 谈企业版扩容', 'Suggests meeting their CFO this week about expansion'), AI('建议', 'Suggestion')),
    ('08:00', AGT('radar'), T('<b>线索跟进</b> 完成每日检查：20 条线索，3 条该跟进、1 条转培育', '<b>Lead follow-up</b> ran the daily check: 20 leads, 3 to follow up, 1 to nurture'), T('每条附等级、理由和下一步', 'Each with a grade, reasons, and next step'), AI('4 条建议', '4 suggestions')),
    ('08:30', AGT('list-checks'), T('<b>任务助手</b> 为 10:00 的方案评审会准备好要点', '<b>Task assistant</b> prepped the 10:00 solution review'), T('目标、对方是谁、要问的 5 个问题、风险', 'Goal, attendees, 5 questions to ask, risks'), tag('green', '已就绪', 'Ready')),
    ('09:05', YOU('陈', 'A'), T('<b>你</b> 采纳 3 条线索建议，忽略 1 条', '<b>You</b> accepted 3 lead suggestions, ignored 1'), '', tag('grey', '1 分钟', '1 min'), True),
    ('10:42', AGT('message-circle'), T('<b>线索跟进</b> 读到客户 WhatsApp：想下周三看方案', '<b>Lead follow-up</b> read a WhatsApp message: wants a demo next Wednesday'), T('等级 B → A，建好拜访任务，起草回复', 'Grade B → A, visit task created, reply drafted'), AI('等你确认', 'Needs you')),
    ('11:30', YOU('陈', 'A'), T('<b>你</b> 改了一句措辞，发出回复', '<b>You</b> tweaked one line and sent the reply'), '', tag('grey', '30 秒', '30 sec'), True),
    ('14:10', AGT('stamp'), T('<b>审批助手</b> 审阅 18% 折扣申请：对照标准、历史同类与毛利', '<b>Approval review</b> checked an 18% discount against standards, history, and margin'), T('建议以 15% 为上限批准，已起草审批意见', 'Recommends a 15% cap, comment drafted'), AI('有条件同意', 'Approve on conditions')),
    ('14:15', YOU('陈', 'A'), T('<b>你</b> 按建议有条件同意', '<b>You</b> approved on conditions'), '', tag('grey', '2 分钟', '2 min'), True),
    ('18:20', AGT('list-checks'), T('<b>任务助手</b> 整理评审会结果，更新商机阶段为「提案」', '<b>Task assistant</b> wrote up the review and moved the deal to Proposal'), '', tag('green', '已完成', 'Done')),
]
day_html = '<div class="tl">' + ''.join(tl_row(*d) for d in day) + '</div>'
save('crmDay', solo(
    f'<div class="sx-h"><div><h5>{T("周二 · 陈思的一天", "Tuesday · a day for Ava")}</h5><p>{T("销售 Agent 团队的工作记录，按时间排列", "The sales agent team’s log, in order")}</p></div></div>'
    f'<div class="duo2" style="grid-template-columns:minmax(0,1fr) 260px;align-items:start">{day_html}'
    f'<div style="display:grid;gap:10px"><div class="bigstat"><small>{T("Agent 完成的工作", "Work done by agents")}</small><b class="ag-c">37</b><span>{T("调研、检查、准备、起草、审阅", "Research, checks, prep, drafts, reviews")}</span></div><div class="bigstat"><small>{T("你做的决定", "Decisions you made")}</small><b class="hu-c">6</b><span>{T("每个都附依据，平均 1 分钟", "Each with evidence, ~1 min each")}</span></div><div class="bigstat"><small>{T("被遗漏的线索", "Leads that slipped")}</small><b class="ok-c">0</b><span>{T("新线索、来信和到期任务都有人跟", "Every new lead, message, and due task covered")}</span></div></div></div>'))

# 事件链：客户来信 → Agent 判断 → 建议 → 记录更新
chain = (
    f'<div class="flow" style="--n:4">'
    f'<div><span class="st"><span class="bal">1</span>{T("客户来信", "The customer writes")}</span><div class="pnl"><div class="h"><span class="av">{T("周", "E")}</span><span class="who">{T("周晓", "Ethan Zhou")}<small>{T("星海物流", "Kestrel Logistics")}</small></span><span class="r wa"><svg class="wa-logo" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>WhatsApp</span></div><div class="cmsg"><div class="in">{T("我们老板看了报价，想下周三来仓库看一下方案，能不能也讲讲私有化部署？", "My boss saw the quote and wants a walkthrough at the warehouse next Wednesday. Can you cover self-hosting too?")}<br><small>10:42</small></div></div></div></div>'
    f'<div><span class="st ag-s"><span class="bal">2</span>{T("线索跟进 Agent 判断", "Lead follow-up reasons")}</span><div class="rvw"><div class="h">{ic("sparkles")}{T("依据", "Based on")}</div><div class="mini-chips"><span>{T("线索详情", "Lead details")}</span><span>{T("12 条 WhatsApp", "12 WhatsApp messages")}</span><span>{T("5 封往来邮件", "5 emails")}</span><span>{T("任务与结果", "Tasks and outcomes")}</span><span>{T("附件", "Attachments")}</span><span>{T("公司情报", "Company research")}</span><span>{T("业务指导", "Business guidance")}</span></div><div class="h" style="margin-top:4px">{ic("lightbulb")}{T("判断", "Reasoning")}</div><ul><li>{T("决策人主动要求见面，意向明显升高", "The decision-maker asked to meet—intent is up")}</li><li>{T("要私有化部署，符合企业版", "Wants self-hosting—an Enterprise fit")}</li><li>{T("报价已发 9 天，正处在窗口期", "Quote sent 9 days ago—in the window")}</li></ul></div></div>'
    f'<div><span class="st hu-s"><span class="bal">3</span>{T("建议进入你的收件箱", "Suggestion in your inbox")}</span><div class="sg on"><div class="t">{tag("grey", "线索", "Lead")}<b>{T("周晓 / 星海物流", "Ethan Zhou / Kestrel")}</b></div><div class="t">{AI("跟进 · B → A 级", "Follow up · B → A")}</div><p>{T("建好周三 14:00 仓库拜访，带私有化部署方案；回复已起草。", "Book Wednesday 2 pm at the warehouse with the self-hosting plan; reply drafted.")}</p><div class="acts"><span class="b p sm">{ic("check")}{T("采纳", "Accept")}</span><span class="b sm">{T("修改", "Edit")}</span></div></div></div>'
    f'<div><span class="st ok-s"><span class="bal">4</span>{T("采纳后自动生效", "Accepted, it’s done")}</span><div class="pnl" style="gap:8px"><div class="ck2 plain"><div><span class="bx on"></span><b>{T("线索等级 B → A", "Lead grade B → A")}</b><small>{T("理由写进记录", "Reason logged on the record")}</small></div><div><span class="bx on"></span><b>{T("新建任务：周三 14:00 拜访", "Task: Wed 2 pm visit")}</b><small>{T("任务助手当天早上准备要点", "Prepped that morning by the task assistant")}</small></div><div><span class="bx on"></span><b>{T("回复已发出", "Reply sent")}</b><small>{T("发件人是你，内容你确认过", "From you, reviewed by you")}</small></div></div></div></div>'
    '</div>')
save('crmChain', solo(f'<div class="sx-h"><div><h5>{T("客户的一条消息，接下来发生了什么", "One message from a customer, and what happens next")}</h5><p>{T("10:42 收到 · 10:43 建议就绪 · 你看一眼就能处理", "Received 10:42 · suggestion ready 10:43 · handled at a glance")}</p></div></div>{chain}'))

# Agent 团队：岗位卡
team = [
    ('message-square', '销售专家', 'Sales Expert', '懂销售的对话助手：查数据、判断进展、准备下一步', 'Talks sales: looks things up, reads the situation, preps the next step', ['随时对话|Any time'], '312', '—'),
    ('radar', '线索跟进', 'Lead follow-up', '给每条线索打等级、给下一步，整理粘贴的文字，合并重复线索', 'Grades every lead with a next step, captures pasted text, merges duplicates', ['新建线索|New lead', '每日 09:00|Daily 09:00', '客户来信|Customer writes', '任务完成|Task done'], '128', '82%'),
    ('target', '商机跟进', 'Opportunity follow-up', '对照审批标准看条件，建议推进、继续、暂停或输单', 'Checks terms against standards; advance, continue, pause, or lose', ['每日检查|Daily check', '商机变化|Deal changes'], '96', '77%'),
    ('stamp', '审批助手', 'Approval review', '为审批人对比标准、成本、历史决定和风险，起草意见', 'For approvers: standards, cost, past decisions, risk, drafted comment', ['提交审批|Approval submitted'], '23', '91%'),
    ('list-checks', '任务助手', 'Task assistant', '任务当天早上准备要点，结束后整理结果', 'Preps each task that morning and writes up the outcome', ['任务当天|Task morning', '任务完成|Task done'], '64', '88%'),
    ('building-2', '公司情报', 'Company research', '补全新公司资料，每天盯住在谈公司的融资、招聘、高管变动', 'Fills in new companies; watches active accounts for funding, hiring, new execs', ['新建公司|New company', '每天早上|Every morning'], '41', '73%'),
]
def chips(lst): return '<div class="mini-chips">' + ''.join(f'<span>{T(*c.split("|"))}</span>' for c in lst) + '</div>'
team_html = '<div class="attn" style="--cols:3;gap:10px">' + ''.join(
    f'<div style="display:grid;grid-template-columns:30px minmax(0,1fr);gap:6px 10px;align-items:start;padding:12px 14px"><span class="i" style="grid-row:span 3;width:30px;height:30px;background:var(--agent-tint)">{ic(i)}</span><b style="font-size:13.5px;white-space:normal">{T(a, b)}</b><small style="white-space:normal;font-size:12px;line-height:1.5">{T(c, d)}</small><div style="grid-column:2">{chips(trg)}</div><div style="grid-column:1/3;display:flex;gap:14px;padding-top:8px;border-top:1px solid var(--rule);font-size:11.5px;color:var(--muted)"><span>{T("本月运行", "Runs")} <b style="font-size:12.5px;color:var(--ink)">{runs}</b></span><span>{T("采纳率", "Accepted")} <b style="font-size:12.5px;color:var(--pass-ink)">{acc}</b></span></div></div>'
    for i, a, b, c, d, trg, runs, acc in team) + '</div>'
save('crmTeam', solo(f'<div class="sx-h"><div><h5>{T("销售 Agent 团队", "Sales agent team")}</h5><p>{T("每个 Agent 都有岗位、运行时机和技能，表现看得见", "Every agent has a job, triggers, and skills—and a track record")}</p></div><span class="r"><span class="b sm">{ic("plus")}{T("新建 Agent", "New agent")}</span></span></div>{team_html}'))

# 公司动态
sig = [('北辰能源', 'Beichen Energy', '融资', 'Funding', 'violet', '完成 C 轮融资 8 亿元，用于新建两座生产基地', 'Closed an ¥800M Series C to build two new plants', '建议：本周约 CFO 谈企业版扩容', 'Suggest: meet the CFO this week about expansion', '36氪 · 公司公告', 'Press · company release'),
       ('华岳酒店', 'Huayue Hotels', '高管变动', 'New executive', 'blue', '新任 CIO 上任，来自某连锁零售集团', 'Appointed a new CIO from a retail chain', '建议：发一封介绍信，附零售客户案例', 'Suggest: send an intro with a retail case study', 'LinkedIn', 'LinkedIn'),
       ('Kestrel Logistics', 'Kestrel Logistics', '大规模招聘', 'Hiring at scale', 'green', '华南区招聘 40 名调度员', 'Hiring 40 dispatchers in South China', '调度协同需求在扩大，商机可加速', 'Dispatch needs are growing—time to accelerate', '招聘网站', 'Job boards'),
       ('明川教育', 'Mingchuan Edu', '风险', 'Risk', 'red', '被曝预算冻结至明年 Q2', 'Reported budget freeze until next Q2', '建议：商机转暂停，每月保持联系', 'Suggest: pause the deal, check in monthly', '行业媒体', 'Trade press')]
sig_html = ''.join(f'<div class="sg"><div class="t"><b>{T(a, b)}</b>{tag(tc, c, d)}<time>{T("今天", "Today")}</time></div><p>{T(e, f)}</p><div class="t">{AI(g, h)}<span style="margin-left:auto">{T(i, j)}</span></div></div>' for a, b, c, d, tc, e, f, g, h, i, j in sig)
save('crmSignals', solo(f'<div class="sx-h"><div><h5>{T("今天早上，你关注的公司", "Your accounts this morning")}</h5><p>{T("公司情报 Agent · 07:30 · 附来源", "Company research · 07:30 · with sources")}</p></div></div>{sig_html}'))

# 会前准备
save('crmBrief', solo(
    f'<div class="sx-h"><div><h5>{T("10:00 方案评审会 · 华岳酒店", "10:00 Solution review · Huayue Hotels")}</h5><p>{T("任务助手 · 今天 08:30 准备 · 只有你和参与人能看到", "Task assistant · prepped 08:30 · visible to you and attendees")}</p></div><span class="r">{tag("green", "已就绪", "Ready")}</span></div>'
    f'<div class="kv" style="--n:3"><div><small>{T("要达成", "Goal")}</small><b>{T("确认试点范围与时间", "Agree pilot scope and dates")}</b></div><div><small>{T("商机", "Deal")}</small><b>¥ 420,000 · {T("提案", "Proposal")}</b></div><div><small>{T("对方", "Attendees")}</small><b>{T("CIO、运营总监", "CIO, Ops Director")}</b></div></div>'
    f'<div class="rvw"><div class="h">{ic("message-circle-question")}{T("要问的问题", "Questions to ask")}</div><ul><li>{T("新 CIO 对私有化部署的要求和时间表？", "The new CIO’s self-hosting requirements and timeline?")}</li><li>{T("试点门店选哪 3 家，谁来验收？", "Which 3 pilot stores, and who signs off?")}</li><li>{T("POC 里提到的工单 SLA，是否写进合同？", "Does the POC’s ticket SLA go into the contract?")}</li></ul></div>'
    f'<div class="duo2"><div class="pnl"><div class="h">{ic("paperclip")}{T("要带的材料", "Bring")}</div><p>{T("POC 报告 · 零售客户案例 · 部署架构图", "POC report · retail case study · deployment diagram")}</p></div><div class="pnl"><div class="h" style="color:var(--risk-ink)">{ic("triangle-alert")}{T("风险", "Risks")}</div><p>{T("折扣审批还没批；对方 CIO 刚上任，决策链可能变化", "Discount not yet approved; new CIO may change who decides")}</p></div></div>'))

# 业务指导
GUIDE_ZH = """<span class="hd">## 我们是谁</span>
为制造业提供生产管理软件，客户以 500 人以上工厂为主。

<span class="hd">## 版本与价格</span>
专业版 ¥ 9.8 万；企业版 ¥ 28 万起，含实施。

<span class="hd">## 折扣与审批</span>
<span class="hl">销售经理可批 10% 以内；超过 10% 需销售总监审批。</span>
标杆客户、可做案例的，最高 15%。

<span class="hd">## 跟进节奏</span>
新线索 24 小时内首次联系；报价后 7 天内跟进。"""
GUIDE_EN = """<span class="hd">## Who we are</span>
Production software for manufacturers, mostly plants of 500+ people.

<span class="hd">## Editions and prices</span>
Professional ¥98k; Enterprise from ¥280k incl. services.

<span class="hd">## Discounts and approvals</span>
<span class="hl">Sales managers approve up to 10%; above that goes to the sales director.</span>
Reference customers willing to be a case study: up to 15%.

<span class="hd">## Follow-up cadence</span>
First contact within 24h; follow up within 7 days of a quote."""
save('crmGuide', solo(
    f'<div class="sx-h"><div><h5>{T("业务指导", "Business guidance")}</h5><p>{T("每次对话、跟进、审阅和准备都会读这里", "Read by every conversation, follow-up, review, and prep")}</p></div><span class="r"><span class="b p sm">{T("保存", "Save")}</span></span></div>'
    f'<div class="md">{T(GUIDE_ZH, GUIDE_EN)}</div>'
    f'<p style="font-size:12px;color:var(--muted)">{ic("sparkles")} {T("改完立即生效：下一次审批助手就按 10% / 15% 的规则判断。", "Takes effect immediately: the next approval review uses the 10% / 15% rule.")}</p>'))

# 用 Studio 改整个 CRM
save('crmCustom', solo(
    f'<div class="sx-h"><div><h5>{T("让 Agent 改 CRM 本身", "Have agents change the CRM itself")}</h5><p>{T("在 NocoBase Studio 里提需求 · 源码在你的仓库", "Ask in NocoBase Studio · source in your repository")}</p></div></div>'
    f'<div class="cmsg"><div class="out">{T("给客户加上续约日期和续约提醒：到期前 60 天提醒负责人，并让商机跟进 Agent 一起检查续约。", "Add a renewal date to customers and remind owners 60 days before—and have the opportunity agent check renewals too.")}</div></div>'
    f'<div class="rvw"><div class="h">{ic("git-pull-request")}{T("PR #57 · 客户续约提醒", "PR #57 · Customer renewal reminders")}</div><div class="mini-chips"><span>{T("新增字段：续约日期", "Field: renewal date")}</span><span>{T("数据迁移", "Migration")}</span><span>{T("定时任务：到期前 60 天", "Scheduled job: 60 days out")}</span><span>{T("技能更新：opportunity-follow-up", "Skill: opportunity-follow-up")}</span></div>'
    f'<div class="ev" style="display:flex;gap:14px;font-size:12px;flex-wrap:wrap"><span>{ic("circle-check")} {T("测试 38/38", "Tests 38/38")}</span><span>{ic("shield-check")} {T("权限检查通过", "Permissions OK")}</span><span>{ic("eye")} {T("预览环境已就绪", "Preview ready")}</span></div></div>'
    f'<div class="acts" style="margin:0"><span class="b p sm">{T("在预览中验收", "Verify in preview")}</span><span class="b sm">{T("查看改动", "View changes")}</span></div>'))

# ======================= NocoITAM =======================
val = [('PO-000037', T('销售部显示器 5 台', '5 monitors for Sales'), T('库存有 3 台同型号，只买 2 台', '3 in stock—bought only 2'), '¥ 9,597'),
       ('PO-000045', T('研发新员工 MacBook Air', 'MacBook Air for new engineers'), T('改用在库 MacBook Pro 14', 'Used an in-stock MacBook Pro 14'), '¥ 17,998'),
       ('Figma', T('12 个席位里 4 个 60 天未使用', '4 of 12 seats idle for 60 days'), T('回收后续订减少 4 个', 'Reclaimed before renewal'), T('¥ 7,680/年', '¥7,680/yr')),
       ('Zoom Pro', T('已结束的旧订阅仍占 2 个席位', 'Ended plan still holding 2 seats'), T('取消旧订阅，席位并入年付', 'Cancelled, merged into annual plan'), T('¥ 2,160/年', '¥2,160/yr')),
       ('DP-000003', T('打印机申请报废', 'Printer disposal request'), T('才用 20 个月，建议先报修', 'Only 20 months old—repair first'), '¥ 1,776')]
vrows = ''.join(f'<tr><td class="id">{a}</td><td class="w">{b}</td><td class="w">{AI("", "")[:0]}{c}</td><td style="font-family:var(--f-mono);color:var(--pass-ink);text-align:right">{d}</td></tr>' for a, b, c, d in val)
save('itamValue', solo(
    f'<div class="sx-h"><div><h5>{T("本季度，Agent 替 IT 做了什么", "What agents did for IT this quarter")}</h5><p>{T("每一项都由负责人确认后执行", "Every item was confirmed by its owner")}</p></div></div>'
    f'<div class="stat" style="--n:4"><div class="bigstat"><small>{T("少花的钱", "Spend avoided")}</small><b class="ok-c">{T("¥ 3.9 万", "¥39k")}</b><span>{T("先用库存和闲置，再采购", "Stock and idle seats first")}</span></div><div class="bigstat"><small>{T("回收的闲置席位", "Idle seats reclaimed")}</small><b class="ag-c">11</b><span>{T("续订前提醒，不再白付", "Flagged before renewal")}</span></div><div class="bigstat"><small>{T("自动整理的 MDM 差异", "MDM differences sorted")}</small><b>41</b><span>{T("拿不准的 3 处留给人", "3 uncertain left for people")}</span></div><div class="bigstat"><small>{T("新人入职准备", "New-hire prep")}</small><b>{T("6 分钟", "6 min")}</b><span>{T("从 2 天缩短到 6 分钟确认", "From 2 days to a 6-minute review")}</span></div></div>'
    f'<div class="tblw"><table class="tbl"><thead><tr><th>{T("来源", "Source")}</th><th>{T("发生了什么", "What happened")}</th><th>{T("Agent 的建议", "Agent’s suggestion")}</th><th style="text-align:right">{T("少花", "Saved")}</th></tr></thead><tbody>{vrows}</tbody></table></div>'))

# 一张采购单的旅程
jour = (
    f'<div class="flow" style="--n:5">'
    f'<div><span class="st"><span class="bal">1</span>{T("提交申请", "Request")}</span><div class="pnl"><b style="font-size:13px">PO-000037</b><p>{T("销售部要 5 台 27 寸显示器", "Sales needs 5 × 27″ monitors")}</p><p style="font-family:var(--f-mono);font-size:12px">CNY 16,495</p></div></div>'
    f'<div><span class="st ag-s"><span class="bal">2</span>{T("审批助手核对", "Assistant checks")}</span><div class="rvw"><ul><li>{T("库存同型号 3 台", "3 identical in stock")}</li><li>{T("单价比上次高 3%", "Price 3% above last")}</li><li>{T("同类申请 4 次都先用库存", "4 similar requests: stock first")}</li></ul></div></div>'
    f'<div><span class="st hu-s"><span class="bal">3</span>{T("你来批", "You approve")}</span><div class="sg on"><div class="t">{AI("有条件同意", "Approve on conditions")}</div><p>{T("只买 2 台，按上次单价", "Buy 2, at last price")}</p><div class="acts"><span class="b p sm">{T("同意", "Approve")}</span></div></div></div>'
    f'<div><span class="st"><span class="bal">4</span>{T("下单与到货", "Order &amp; receive")}</span><div class="pnl"><p>{T("2 台到货自动入库，生成资产编号", "2 arrive, auto-registered with tags")}</p><div class="mini-chips"><span>SG-MON-021</span><span>SG-MON-022</span></div></div></div>'
    f'<div><span class="st ok-s"><span class="bal">5</span>{T("领用到人", "Assigned")}</span><div class="pnl"><p>{T("3 台库存 + 2 台新到，5 人当天领用", "3 from stock + 2 new, 5 people same day")}</p><b style="color:var(--pass-ink);font-size:13px">{T("少花 ¥ 9,597", "¥9,597 saved")}</b></div></div>'
    '</div>')
save('itamJourney', solo(f'<div class="sx-h"><div><h5>{T("一张采购单的旅程", "The life of a purchase request")}</h5><p>{T("每一笔采购，先看库存、闲置和历史", "Every purchase checks stock, idle assets, and history first")}</p></div></div>{jour}'))

# 离职回收
off = [(1, 'MacBook Pro 14 · SG-LT-006', T('维修中，取回后入库', 'In repair—return to stock when back'), tag('grey', '设备', 'Device')),
       (1, 'Dell U2724D · SG-MON-009', T('工位上，行政协助回收', 'At desk—admin to collect'), tag('grey', '设备', 'Device')),
       (1, 'Microsoft 365 · JetBrains', T('释放 2 个席位，可分给下周入职的孙浩', 'Free 2 seats—reassign to Sun Hao next week'), tag('blue', '席位', 'Seats')),
       (0, T('停用 VPN、Git、企业邮箱账号', 'Disable VPN, Git, and email accounts'), T('系统外事项，需 IT 手动处理', 'Off-system—IT to handle'), tag('amber', '系统外', 'Off-system')),
       (0, T('更换机房门禁与共享密钥', 'Rotate server room access and shared keys'), T('他持有 2 个共享密钥', 'Held 2 shared secrets'), tag('red', '安全', 'Security'))]
save('itamOffboard', solo(
    f'<div class="sx-h"><div><h5>{T("陈杰 · IT 支持 · 10 月 16 日离职", "Chen Jie · IT support · leaves Oct 16")}</h5><p>{T("资产管家列出该收的每一项，以及怎么处理", "The asset steward lists everything to collect, and how")}</p></div><span class="r">{tag("red", "离职", "Leaver")}</span></div>'
    + '<div class="ck2">' + ''.join(f'<div><span class="bx{" on" if on else ""}"></span><b>{a}</b><small>{b}</small>{t}</div>' for on, a, b, t in off) + '</div>'
    + f'<div class="acts" style="margin:0"><span class="b p sm">{ic("check")}{T("整批回收 3 项", "Collect 3 items")}</span><span class="b sm">{T("生成交接清单", "Handover list")}</span></div>'))

# 型号资料 AI 补全
save('itamCatalog', solo(
    f'<div class="sx-h"><div><h5>{T("创建型号", "New model")}</h5><p>{T("输入制造商和型号，AI 查资料填好表单，你核对后保存", "Enter maker and model; AI looks it up and fills the form for you to check")}</p></div></div>'
    f'<div class="kv" style="--n:2"><div><small>{T("制造商", "Manufacturer")}</small><b>Dell</b></div><div><small>{T("型号", "Model")}</small><b>U2724D</b></div></div>'
    f'<div class="rvw"><div class="h">{ic("sparkles")}{T("AI 整理 · 3 个来源", "AI filled · 3 sources")}</div><div class="kv" style="--n:3"><div><small>{T("分类", "Category")}</small><b>{T("显示器", "Monitor")}</b></div><div><small>{T("尺寸 / 分辨率", "Size / resolution")}</small><b>27″ · 2560×1440</b></div><div><small>{T("接口", "Ports")}</small><b>USB-C 90W · HDMI · DP</b></div><div><small>{T("保修", "Warranty")}</small><b>{T("3 年", "3 years")}</b></div><div><small>{T("参考价", "Ref. price")}</small><b>CNY 3,199</b></div><div><small>{T("折旧年限", "Depreciation")}</small><b>{T("5 年", "5 years")}</b></div></div></div>'
    f'<div class="acts" style="margin:0"><span class="b p sm">{T("核对无误，保存", "Looks right—save")}</span><span class="b sm">{T("查看来源", "Sources")}</span></div>'))

# ======================= NocoReach =======================
loop = (
    f'<div class="flow" style="--n:5">'
    f'<div><span class="st"><span class="bal">1</span>{T("数据变化", "Signal")}</span><div class="pnl"><p>{T("Search Console：Docker 安装页搜索点击 31 → 12", "Search Console: Docker install page clicks 31 → 12")}</p><b style="color:var(--risk-ink);font-size:20px">↓ 61%</b></div></div>'
    f'<div><span class="st ag-s"><span class="bal">2</span>{T("AI 判断是机会", "AI flags it")}</span><div class="rvw"><p style="font-size:12.5px">{T("排名没变、点击率降了：标题和摘要已经不匹配人们在搜什么。", "Rank held but CTR fell: the title and snippet no longer match what people search.")}</p><div class="mini-chips"><span>{T("剧本：改进现有页面", "Playbook: improve page")}</span></div></div></div>'
    f'<div><span class="st ag-s"><span class="bal">3</span>{T("Agent 去做", "Agent does it")}</span><div class="pnl"><p>{T("读查询词和页面，改标题、摘要、补 Docker Compose 示例，同步 8 个语言版本", "Reads queries and the page; rewrites title and snippet, adds a Compose example, syncs 8 languages")}</p><b style="font-size:13px">PR #212</b></div></div>'
    f'<div><span class="st hu-s"><span class="bal">4</span>{T("你看过再发布", "You publish")}</span><div class="sg on"><p>{T("对比改动、打开预览，确认后发布", "Review the diff and preview, then publish")}</p><div class="acts"><span class="b p sm">{T("发布", "Publish")}</span></div></div></div>'
    f'<div><span class="st ok-s"><span class="bal">5</span>{T("第 28 天对比", "Day 28")}</span><div class="pnl"><p>{T("同样 28 天，上线前后", "Same 28 days, before vs. after")}</p><b style="color:var(--pass-ink);font-size:20px">12 → 34</b><p style="color:var(--pass-ink);font-weight:600">+183%</p></div></div>'
    '</div>')
save('reachLoop', solo(f'<div class="sx-h"><div><h5>{T("从数据，到上线，再回到数据", "From data, to live, and back to data")}</h5><p>{T("一个机会的完整闭环", "One opportunity, start to finish")}</p></div></div>{loop}'))

save('reachDiff', solo(
    f'<div class="sx-h"><div><h5>T-28 · {T("给 Docker 安装页改标题摘要", "Docker install page title and snippet")}</h5><p>{T("Agent 已完成修改 · 等你审阅并发布", "Changes ready · waiting for your review")}</p></div><span class="r">{tag("amber", "等你发布", "Review &amp; publish")}</span></div>'
    f'<div class="duo2" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);align-items:start"><div style="display:grid;gap:10px">'
    f'<div class="diff"><div class="h">docs/get-started/installation/docker.md · title / description</div>'
    f'<div class="del">- title: Docker</div><div class="add">+ title: {T("用 Docker 安装 NocoBase（含 Docker Compose 示例）", "Install NocoBase with Docker (Docker Compose example)")}</div>'
    f'<div class="del">- description: {T("Docker 安装方式。", "Docker installation.")}</div><div class="add">+ description: {T("5 分钟用 Docker Compose 启动 NocoBase：数据库选择、数据持久化、升级与常见报错。", "Run NocoBase with Docker Compose in 5 minutes: database choice, persistence, upgrades, and common errors.")}</div></div>'
    f'<div class="diff"><div class="h">{T("正文 · 新增 2 节", "Body · 2 sections added")}</div><div class="add">+ ## {T("Docker Compose 示例", "Docker Compose example")}</div><div class="add">+ ## {T("常见报错：端口占用、数据库连接失败", "Common errors: port in use, database connection")}</div></div></div>'
    f'<div style="display:grid;gap:10px"><div class="pnl"><div class="h">{ic("sparkles")}{T("为什么这样改", "Why")}</div><p>{T("近 28 天带来曝光的查询里，62% 含“docker compose”，原标题没有覆盖。", "62% of queries driving impressions include “docker compose”, which the old title missed.")}</p></div>'
    f'<div class="pnl"><div class="h">{ic("languages")}{T("多语言同步", "Languages synced")}</div><div class="mini-chips"><span>EN</span><span>中文</span><span>日本語</span><span>ES</span><span>PT</span><span>RU</span><span>FR</span><span>DE</span></div></div>'
    f'<div class="acts" style="margin:0"><span class="b p sm">{ic("eye")}{T("打开预览", "Preview")}</span><span class="b sm">{T("发布", "Publish")}</span><span class="b sm">{T("退回修改", "Send back")}</span></div></div></div>'))

save('reachReply', solo(
    f'<div class="sx-h"><div><h5>{T("4 个无人回复的论坛主题", "4 unanswered forum topics")}</h5><p>{T("社区回复草稿 · Agent 读了文档和相关 Issue", "Draft community replies · agent read docs and related issues")}</p></div></div>'
    f'<div class="pnl"><div class="h"><span class="av">{T("K", "K")}</span>{T("关联字段保存后显示为空？", "Relation field is empty after saving?")}<span class="r">{T("等了 5 天", "Waiting 5 days")}</span></div><p>{T("多对一字段保存成功，但列表里显示为空，刷新也一样……", "Many-to-one saves fine, but the list shows it empty, even after refresh…")}</p></div>'
    f'<div class="cmsg"><div class="ai-draft" style="max-width:100%"><small>{ic("sparkles")}{T("回复草稿 · 等你确认", "Draft reply · needs you")}</small>{T("这是因为列表区块没有勾选关联字段的显示字段。在区块设置里选择「标题字段」即可，详见文档《关联字段》第 3 节。如果用的是 v2.2.20 之前的版本，还需要升级，相关修复见 #6123。", "The list block doesn’t have a title field set for the relation. Pick one under block settings—see “Relation fields”, section 3. On versions before v2.2.20 you’ll also need to upgrade; the fix is in #6123.")}</div></div>'
    f'<div class="acts" style="margin:0"><span class="b p sm">{T("确认并发布回复", "Approve &amp; post")}</span><span class="b sm">{T("修改", "Edit")}</span><span class="note">{T("另外 3 个草稿已备好", "3 more drafts ready")}</span></div>'))

comp = [('Retool', T('7 天新增 4 页：AI 应用模板、定价页改版', '4 new pages in 7 days: AI app templates, pricing redesign'), T('建议：对比我们的 AI 员工文档，补一篇模板指南', 'Suggest: compare with our AI employee docs; add a templates guide')),
        ('Budibase', T('发布 6 篇博客，3 篇围绕“开源工作流自动化”', '6 posts, 3 on “open source workflow automation”'), T('这个词我们排第 14，已加入关键词研究', 'We rank #14 for it—added to keyword research')),
        ('NocoDB', T('发布 2026.09.1：支持整个账号的 MCP', 'Released 2026.09.1: account-wide MCP'), T('观察中：关注社区里的讨论', 'Watching: track community discussion'))]
save('reachCompetitors', solo(
    f'<div class="sx-h"><div><h5>{T("竞品这周在做什么", "What competitors did this week")}</h5><p>{T("网站新页面、博客、发布、搜索流量与 GitHub Star", "New pages, posts, releases, search traffic, and GitHub stars")}</p></div></div>'
    + ''.join(f'<div class="sg"><div class="t"><b>{a}</b><time>{T("本周", "This week")}</time></div><p>{b}</p><div class="t">{AI("", "")[:0]}<span class="aisg">{ic("sparkles")}{c}</span></div></div>' for a, b, c in comp)))

# ======================= 解决方案总览：Agent 岗位说明书 =======================
save('solJob', solo(
    f'<div class="sx-h"><div style="display:flex;gap:10px;align-items:center"><span class="i" style="display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:var(--agent-tint);color:var(--agent)">{ic("radar")}</span><div><h5>{T("线索跟进", "Lead follow-up")}</h5><p>NocoCRM · {T("岗位说明书", "Job description")}</p></div></div><span class="r">{tag("green", "在岗", "On duty")}</span></div>'
    f'<div class="jobcard">'
    f'<div class="row2"><span>{T("职责", "Job")}</span><span>{T("给每条线索打等级，建议继续跟进、培育、转化或判为无效，并写清下一步。", "Grade every lead and recommend follow-up, nurture, convert, or close—with the next step.")}</span></div>'
    f'<div class="row2"><span>{T("什么时候工作", "When it works")}</span>{chips(["新建线索|New lead", "每日 09:00|Daily 09:00", "客户来信|Customer writes", "任务完成|Task done", "公司变更|Company changes"])}</div>'
    f'<div class="row2"><span>{T("能看什么", "Can read")}</span><span>{T("线索、任务、评论、往来邮件与 WhatsApp——和负责人的权限一样", "Leads, tasks, comments, email, and WhatsApp—same permissions as the owner")}</span></div>'
    f'<div class="row2"><span>{T("能做什么", "Can do")}</span><span>{T("只提建议；采纳后才修改记录、建任务、发消息", "Suggest only; records, tasks, and messages change after you accept")}</span></div>'
    f'<div class="row2"><span>{T("怎么做", "How")}</span><span>{T("技能 lead-follow-up · 业务指导 · 模型 DeepSeek V4", "Skill lead-follow-up · business guidance · model DeepSeek V4")}</span></div>'
    f'<div class="row2"><span>{T("表现", "Track record")}</span><span>{T("本月运行 128 次 · 采纳 86 · 忽略 19 · 采纳率 82%", "128 runs this month · 86 accepted · 19 ignored · 82%")}</span></div>'
    f'</div>'))
print('wow snips done')
