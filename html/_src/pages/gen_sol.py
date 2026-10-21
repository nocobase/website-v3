# 用 HTML 画 NocoCRM / NocoITAM 的界面示意，输出到 snips/，由 wrap.py 的 {{SNIP:名称:宽度}} 嵌入页面。
import os
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'snips'); os.makedirs(out, exist_ok=True)

def T(zh, en=None): return zh if en is None else f'<t-zh>{zh}</t-zh><t-en>{en}</t-en>'
def ic(name): return f'<i data-lucide="{name}"></i>'
BOT = '<span class="ag"><i data-lucide="bot"></i></span>'
def AV(zh, en): return f'<span class="av">{T(zh[0], en[0])}</span>'
def tag(cls, zh, en=None): return f'<span class="tag {cls}">{T(zh, en)}</span>'
AI = lambda zh, en: f'<span class="aisg">{ic("sparkles")}{T(zh, en)}</span>'

def side(brand_icon, brand, items, active, foot=True):
    h = f'<aside class="sx-side"><div class="sx-brand"><span class="mk">{ic(brand_icon)}</span>Noco<span>{brand}</span></div>'
    for it in items:
        if it[0] == 'g': h += f'<div class="g">{T(it[1], it[2])}</div>'; continue
        key, icon, zh, en = it[:4]
        cnt = it[4] if len(it) > 4 else ''
        em = ''
        if cnt: em = f'<em>{ic("chevron-right")}</em>' if cnt == '>' else (f'<em class="hot">{cnt[1:]}</em>' if cnt.startswith('!') else f'<em>{cnt}</em>')
        h += f'<a class="it{" on" if key == active else ""}">{ic(icon)}{T(zh, en)}{em}</a>'
    if foot is True: foot = T('<b>AI 自由构建</b><br>NocoBase 保障可靠', '<b>AI builds freely.</b><br>NocoBase keeps it reliable.')
    if foot: h += f'<div class="foot">{foot}</div>'
    return h + '</aside>'

def win(sidebar, crumb_zh, crumb_en, body, user='陈'):
    top = f'<div class="sx-top"><b>{T(crumb_zh, crumb_en)}</b><span class="r"><span class="ai">{ic("sparkles")}</span><span class="av">{T(user, "A")}</span></span></div>'
    return f'<div class="sx">{sidebar}<div class="sx-main">{top}<div class="sx-body">{body}</div></div></div>'

def solo(body): return f'<div class="sx solo"><div class="sx-main"><div class="sx-body">{body}</div></div></div>'

def bare(brand_icon, brand, crumb_zh, crumb_en, body, user='陈'):
    top = f'<div class="sx-top"><span class="sx-brand" style="padding:0"><span class="mk">{ic(brand_icon)}</span>Noco<span>{brand}</span></span><span>/</span><b>{T(crumb_zh, crumb_en)}</b><span class="r"><span class="ai">{ic("sparkles")}</span><span class="av">{T(user, "A")}</span></span></div>'
    return f'<div class="sx solo"><div class="sx-main">{top}<div class="sx-body">{body}</div></div></div>'

def save(name, html): open(os.path.join(out, name + '.html'), 'w', encoding='utf-8').write(html)

# ======================= NocoCRM =======================
CRM_NAV = [
    ('overview', 'layout-dashboard', '概览', 'Overview'), ('inbox', 'inbox', '收件箱', 'Inbox', '21'), ('tasks', 'list-checks', '任务', 'Tasks'), ('approvals', 'stamp', '审批', 'Approvals', '!2'),
    ('g', '记录', 'Records'), ('leads', 'radar', '线索', 'Leads'), ('opps', 'target', '商机', 'Opportunities'), ('companies', 'building-2', '公司', 'Companies'), ('contacts', 'user', '联系人', 'Contacts'), ('reports', 'chart-column', '报表', 'Reports'),
    ('g', '集成', 'Integrations'), ('mail', 'mail', '邮箱', 'Mailbox'), ('wa', 'message-circle', 'WhatsApp', 'WhatsApp'),
    ('g', 'Agent 团队', 'Agent team'), ('work', 'workflow', 'Agent 工作', 'Agent work'), ('guide', 'notebook-pen', '业务指导', 'Business guidance'), ('agents', 'bot', 'Agent', 'Agents'), ('skills', 'sparkles', '技能', 'Skills'), ('models', 'cpu', '模型', 'Models'), ('usage', 'gauge', '用量', 'Usage'),
]
crm_side = lambda a: side('handshake', 'CRM', CRM_NAV, a)

# 概览
attn = [('clock', '新线索', 'New leads', '还没有跟进', 'No follow-up yet', '4', 0), ('pause', '停滞的线索', 'Stalled leads', '14 天没有联系', 'No contact for 14+ days', '1', 0), ('hourglass', '沉默的公司', 'Quiet companies', '14 天没有往来', 'No contact for 14+ days', '1', 0),
        ('calendar-clock', '即将成交', 'Closing soon', '7 天内预计成交', 'Expected within 7 days', '2', 0), ('circle-alert', '已过预计成交日', 'Past close date', '需要更新或放弃', 'Update it or let it go', '1', 1), ('user-x', '缺少联系人', 'No contacts', '商机没有关联联系人', 'Deals without contacts', '1', 0)]
attn_html = '<div class="attn">' + ''.join(f'<div class="{"hot" if h else ""}"><span class="i">{ic(i)}</span><b>{T(a, b)}</b><small>{T(c, d)}</small><span class="c">{n}</span></div>' for i, a, b, c, d, n, h in attn) + '</div>'
convs = [('今天最该处理什么', 'What matters most today', '销售专家：先清掉两个等你决策的审批，它们卡着同事的下一步……', 'Sales Expert: clear the two approvals waiting on you first—they’re blocking…', '09:12'),
         ('北辰能源这条线索怎么跟', 'How to follow up Beichen Energy', '销售专家：值得，而且要快。对方要私有化部署和统一身份认证……', 'Sales Expert: worth it, and soon. They need self-hosting and SSO…', '昨天|Yesterday'),
         ('本月预测', 'This month’s forecast', '销售专家：按预计成交日，本月 commit 3 单，合计 ¥160.5 万……', 'Sales Expert: by close date, 3 commit deals worth ¥1.605M this month…', '周一|Mon')]
def tm(t): return T(*t.split('|')) if '|' in t else t
conv_html = '<div class="rows">' + ''.join(f'<div><span class="ag"><i data-lucide="message-square"></i></span><b>{T(a, b)}</b><small>{T(c, d)}</small><time>{tm(t)}</time></div>' for a, b, c, d, t in convs) + '</div>'
save('crmOverview', win(crm_side('overview'), '概览', 'Overview',
    f'<div class="sx-h"><h5>{T("下午好，陈思", "Good afternoon, Ava")}</h5></div>'
    f'<div class="ask"><span class="ph">{T("问任何事……", "Ask anything…")}</span><div class="f"><span class="mdl">{ic("cpu")}DeepSeek V4</span><span class="go">{ic("arrow-up")}</span></div></div>'
    f'<div class="chips"><span class="chip">{ic("sparkles")}{T("有个商机过了预计成交日：更新还是放弃？", "A deal is past its close date: update it or let it go?")}</span><span class="chip">{ic("sparkles")}{T("有个商机快到成交日：会不会滑单？", "A deal is due soon: might it slip?")}</span><span class="chip">{ic("sparkles")}{T("4 条新线索还没联系：先找谁？", "4 new leads not contacted: who first?")}</span></div>'
    f'<div class="sx-sec">{ic("triangle-alert")}{T("需要关注", "Needs attention")}</div>{attn_html}'
    f'<div class="sx-sec">{T("最近的对话", "Recent conversations")}<span class="r">{T("全部", "View all")}</span></div>{conv_html}'))

# 商机看板
stages = [
    ('初步接触', 'Initial contact', [('蓝湾医疗 / 患者随访应用', 'Lanwan Health / Patient follow-up app', '¥ 86,000', '周', 'E', 1), ('森和精工 / 质检看板（专业版）', 'Senhe Precision / QA dashboard (Pro)', '¥ 64,000', '林', 'M', 1)]),
    ('资格确认', 'Qualification', [('Kestrel Logistics / 调度协同', 'Kestrel Logistics / Dispatch hub', '$ 48,000', '王', 'L', 1), ('明川教育 / 招生平台', 'Mingchuan Edu / Admissions', '¥ 120,000', '林', 'M', 0)]),
    ('方案验证', 'Validation', [('云桥科技 / 集成商年度授权 ×3', 'Yunqiao Tech / Partner license ×3', '¥ 200,000', '王', 'L', 1)]),
    ('提案', 'Proposal', [('华岳酒店 / 门店运营平台', 'Huayue Hotels / Store ops platform', '¥ 420,000', '陈', 'A', 1), ('北辰能源 / 生产管理（企业版）', 'Beichen Energy / Production (Ent.)', '¥ 280,000', '林', 'M', 1)]),
    ('谈判', 'Negotiation', [('Aurora Retail / 经销商门户', 'Aurora Retail / Dealer portal', '$ 168,000', '陈', 'A', 1)]),
    ('合同', 'Contract', [('蓝湾医疗 / 院内流程平台', 'Lanwan Health / Hospital workflows', '¥ 45,000', '周', 'E', 0)]),
]
kb = '<div class="kb" style="--cols:6">'
for zh, en, cards in stages:
    kb += f'<div class="kb-col"><header>{T(zh, en)}<span class="n">{len(cards)}</span></header>'
    for tz, te, amt, a, ae, ai in cards:
        kb += f'<div class="kc"><b>{T(tz, te)}</b>' + (f'<div class="tgs">{AI("AI 建议", "AI suggestion")}</div>' if ai else '') + f'<div class="m"><span class="av" style="width:18px;height:18px;font-size:10px">{T(a, ae)}</span><span class="amt">{amt}</span></div></div>'
    kb += '</div>'
kb += '</div>'
save('crmPipeline', bare('handshake', 'CRM', '商机', 'Opportunities',
    f'<div class="sx-h"><h5>{T("商机", "Opportunities")}</h5><span class="n">34</span><span class="r"><span class="seg"><span class="on">{T("团队", "Team")}</span><span>{T("我的", "Mine")}</span></span><span class="seg"><span>{T("列表", "List")}</span><span class="on">{T("看板", "Board")}</span></span><span class="b dk sm">{ic("plus")}{T("新建商机", "New deal")}</span></span></div>{kb}'))

# 收件箱里的 AI 建议
sugs = [
    ('商机', 'Deal', '华岳酒店 / 门店运营平台', 'Huayue Hotels / Store ops platform', '推进到谈判 · 把握较大', 'Advance to Negotiation · Likely', '报价已发、POC 通过、折扣在审批，可以推进到谈判阶段。', 'Quote sent, POC passed, discount in approval—ready for negotiation.', '5h', 1),
    ('审批', 'Approval', '北辰能源 企业版折扣特批', 'Beichen Energy enterprise discount', '有条件同意', 'Approve on conditions', '案例合作有价值，但 18% 超出标准较多，建议以 15% 为上限批准。', 'Valuable case study, but 18% is well over standard—cap it at 15%.', '2d', 0),
    ('线索', 'Lead', '周晓 / Kestrel Logistics', 'Ethan Zhou / Kestrel Logistics', '跟进 · A 级', 'Follow up · Grade A', '需求明确，要私有化和统一身份认证，适合企业版，值得尽快跟进。', 'Clear need for self-hosting and SSO—an Enterprise fit worth pursuing now.', '2d', 0),
]
sg_html = ''.join(f'<div class="sg{" on" if on else ""}"><div class="t">{tag("grey", a, b)}<b>{T(c, d)}</b><time>{t}</time></div><div class="t">{AI(e, f)}</div><p>{T(g, h)}</p><div class="acts"><span class="b p sm">{ic("check")}{T("采纳", "Accept")}</span><span class="b sm">{T("忽略", "Ignore")}</span><span class="b sm">{T("查看依据", "Why?")}</span></div></div>' for a, b, c, d, e, f, g, h, t, on in sugs)
save('crmInbox', solo(f'<div class="sx-h"><h5>{T("收件箱", "Inbox")}</h5><span class="r"><span class="seg"><span class="on">{T("AI 建议 9", "AI suggestions 9")}</span><span>{T("通知 12", "Notifications 12")}</span></span></span></div>{sg_html}'))

# Agent 工作
trig = [('新建线索', 'A lead is created', '来自表单、AI 整理或助手；不含导入与示例数据', 'From the form, AI capture, or the assistant', 1), ('每日检查', 'The daily check', '每天 09:00，最多 20 条：新线索未及时联系、线索沉默、培育到期', 'Daily at 09:00, up to 20: uncontacted, gone quiet, nurture due', 1),
        ('任务完成', 'A task is completed', '记录了结果，或任务标记完成', 'Outcome recorded or task marked done', 1), ('客户来信', 'The customer writes', '对方邮件进入时间线，或 WhatsApp 沉默 30 分钟', 'A mail arrives, or WhatsApp goes quiet for 30 min', 1), ('线索合并', 'Leads are merged', '保留的线索重新跟进', 'The kept lead is followed up anew', 0)]
tg_html = ''.join(f'<div class="tg"><div><b>{T(a, b)}</b><small>{T(c, d)}</small></div><span class="sw{"" if on else " off"}"></span></div>' for a, b, c, d, on in trig)
tabs = [('L', '线索跟进', 'Lead follow-up', 1), ('O', '商机跟进', 'Opportunity follow-up', 0), ('A', '审批助手', 'Approval review', 0), ('T', '任务助手', 'Task assistant', 0), ('C', '公司情报', 'Company research', 0)]
tabs_html = '<div class="tabs">' + ''.join(f'<span class="{"on" if on else ""}"><span class="lt">{l}</span>{T(a, b)}</span>' for l, a, b, on in tabs) + '</div>'
stats = [('运行', 'Runs', '128', ''), ('采纳', 'Accepted', '86', 'ok'), ('忽略', 'Ignored', '19', ''), ('待处理', 'Waiting', '3', 'warn'), ('失败', 'Failed', '0', ''), ('采纳率', 'Acceptance', '82%', 'ok')]
stat_html = '<div class="stat" style="--n:6">' + ''.join(f'<div><small>{T(a, b)}</small><b class="{c}">{v}</b></div>' for a, b, v, c in stats) + '</div>'
save('crmAgentWork', win(crm_side('work'), 'Agent 工作', 'Agent work',
    f'<div class="sx-h"><h5>{T("Agent 工作", "Agent work")}</h5></div>{tabs_html}'
    f'<div class="duo2"><div class="pnl"><div class="h">{BOT}{T("线索跟进", "Lead follow-up")}{tag("green", "已开启", "On")}</div><p>{T("读线索及其任务、评论和邮件，建议继续跟进、培育、转化或判为无效，给出等级和下一步；也会把粘贴的文字整理成新线索，并提出重复线索的合并方案。", "Reads a lead with its tasks, comments, and mail, and recommends following up, nurturing, converting, or closing it, with a grade and next step. It also turns pasted text into leads and proposes merges for duplicates.")}</p><p style="color:var(--muted)">{T("它只提建议：负责人在收件箱里决定是否采纳。", "It only suggests: the owner decides in the inbox.")}</p><div class="kv" style="--n:2"><div><small>{T("模型", "Model")}</small><b>DeepSeek V4 Flash</b></div><div><small>{T("技能", "Skill")}</small><b>lead-follow-up</b></div></div></div>'
    f'<div class="pnl"><div class="h">{T("什么时候运行", "When it runs")}<span class="r">{T("自动运行", "Runs on its own")}</span><span class="sw"></span></div><div>{tg_html}</div></div></div>'
    f'<div class="sx-sec">{T("运行情况 · 近 30 天", "How it did · last 30 days")}</div>{stat_html}'))

# 审批助手
save('crmApproval', solo(
    f'<div class="sx-h"><div><h5>{T("北辰能源 企业版折扣特批", "Beichen Energy enterprise discount")}</h5><p>{T("北辰能源 / 生产管理平台（企业版 + 实施）· 申请人 林悦", "Beichen Energy / Production platform (Ent. + services) · by Maya Lin")}</p></div><span class="r">{tag("amber", "等你审批", "Waiting for you")}</span></div>'
    f'<div class="kv"><div><small>{T("合同金额", "Contract")}</small><b>¥ 280,000</b></div><div><small>{T("申请折扣", "Discount")}</small><b>18%</b></div><div><small>{T("销售经理权限", "Manager limit")}</small><b>10%</b></div><div><small>{T("预计成交", "Close date")}</small><b>{T("11 月 2 日", "Nov 2")}</b></div></div>'
    f'<div class="rvw"><div class="h">{ic("sparkles")}{T("审批助手 · 只有你能看到", "Approval review · visible only to you")}</div><div class="q">{T("建议有条件同意：以 15% 为上限批准", "Recommend: approve with a 15% cap")}</div><ul><li>{T("客户同意作为行业案例，有合作价值", "The customer agreed to be an industry case study")}</li><li>{T("18% 超出标准 8 个点，15% 时毛利仍在目标线以上", "18% is 8 points over standard; margin stays on target at 15%")}</li><li>{T("近 6 个月同类特批 3 次，最高批到 15%", "3 similar exceptions in 6 months, capped at 15%")}</li><li>{T("申请人没有说明付款节奏，建议补充", "Payment schedule isn’t stated—ask for it")}</li></ul><div class="draft"><small>{T("起草的审批意见", "Drafted comment")}</small>{T("同意以 15% 折扣成交，前提是客户确认案例合作，并在合同中写明付款节奏。", "Approved at 15%, provided the customer confirms the case study and the contract states the payment schedule.")}</div></div>'
    f'<div class="acts" style="margin-top:0"><span class="b p sm">{T("有条件同意", "Approve on conditions")}</span><span class="b sm">{T("同意", "Approve")}</span><span class="b sm">{T("驳回", "Reject")}</span><span class="b sm">{T("要求补充", "Ask for more")}</span></div>'))

# 沟通：WhatsApp
save('crmChat', solo(
    f'<div class="sx-h"><h5>WhatsApp</h5><span class="r"><span class="seg"><span class="on">{T("全部", "All")}</span><span>{T("未关联", "Unlinked")}</span></span></span></div>'
    f'<div class="duo2" style="grid-template-columns:200px minmax(0,1fr)"><div class="rows">'
    + ''.join(f'<div><span class="av">{T(a[0], b[0])}</span><b>{T(a, b)}</b><small>{T(c, d)}</small><time>{tm(t)}</time></div>' for a, b, c, d, t in [('周晓', 'Ethan Zhou', '等待回复', 'Awaiting reply', '10:42'), ('林佳', 'Lina Park', '等待回复', 'Awaiting reply', '09:15'), ('Ahmed', 'Ahmed', '未关联', 'Unlinked', '昨天|Yday'), ('王思', 'Sienna Wang', '已回复', 'Replied', '周一|Mon')])
    + f'</div><div class="pnl"><div class="h"><span class="av">{T("周", "E")}</span><span class="who">{T("周晓", "Ethan Zhou")}<small>{T("星海物流", "Kestrel Logistics")}</small></span><span class="r">{T("关联线索", "Linked lead")}</span></div><div class="cmsg"><div class="in">{T("下周三下午方便来仓库过一下方案吗？", "Could you come by the warehouse Wednesday afternoon to walk through the plan?")}<br><small>10:40</small></div><div class="in">{T("另外麻烦提前把运维服务的 SLA 发我。", "Also, please send the ops SLA ahead of time.")}<br><small>10:42</small></div><div class="ai-draft"><small>{ic("sparkles")}{T("销售专家起草 · 待你确认", "Drafted by Sales Expert · needs you")}</small>{T("没问题，周三 14:00 到。SLA 和部署方案今晚发您邮箱。", "Sure—Wednesday 2 pm works. I’ll email the SLA and deployment plan tonight.")}</div></div></div></div>'))

# 报表
save('crmReports', solo(
    f'<div class="sx-h"><h5>{T("报表", "Reports")}</h5><span class="r"><span class="b sm">{ic("sparkles")}{T("让 AI 分析并写成报告", "Analyze and write a report")}</span></span></div>'
    f'<div class="stat"><div><small>{T("在途金额", "Open pipeline")}</small><b>{T("¥ 332.6万", "¥ 3.33M")}</b></div><div><small>{T("加权金额", "Weighted")}</small><b>{T("¥ 204.8万", "¥ 2.05M")}</b></div><div><small>{T("赢单率", "Win rate")}</small><b class="ok">58%</b></div><div><small>{T("本月新线索", "New leads")}</small><b>14</b></div></div>'
    f'<div class="duo2"><div class="pnl"><div class="h">{T("商机漏斗", "Opportunity funnel")}</div><div class="bars">'
    + ''.join(f'<div><span>{T(a, b)}</span><i style="--w:{w}%;--c:oklch(0.62 0.15 285)"></i><span>{T(vz, ve)}</span></div>' for a, b, w, vz, ve in [('初步接触', 'Initial', 92, '¥15.3万', '¥153k'), ('资格确认', 'Qualify', 78, '¥25.2万', '¥252k'), ('方案验证', 'Validate', 60, '¥20万', '¥200k'), ('提案', 'Proposal', 48, '¥111.6万', '¥1.12M'), ('谈判', 'Negotiate', 34, '¥156万', '¥1.56M'), ('合同', 'Contract', 18, '¥4.5万', '¥45k')])
    + f'</div></div><div class="pnl"><div class="h">{T("近六个月赢单", "Won, last six months")}</div><div class="cols">'
    + ''.join(f'<div><i style="--h:{h}px"></i>{T(m, e)}</div>' for h, m, e in [(10, '5月', 'May'), (9, '6月', 'Jun'), (70, '7月', 'Jul'), (12, '8月', 'Aug'), (84, '9月', 'Sep'), (16, '10月', 'Oct')])
    + f'</div><div class="kv" style="--n:3"><div><small>{T("已赢单", "Won")}</small><b>{T("¥ 8.8万", "¥ 88k")}</b></div><div><small>Commit</small><b>{T("¥ 160.5万", "¥ 1.61M")}</b></div><div><small>{T("加权预测", "Weighted")}</small><b>{T("¥ 121万", "¥ 1.21M")}</b></div></div></div></div>'))

# ======================= NocoITAM =======================
ITAM_NAV = [
    ('todo', 'layout-dashboard', '待办', 'To-do', '31'), ('inbox', 'inbox', '收件箱', 'Inbox', '13'),
    ('g', '资产', 'Assets'), ('devices', 'laptop', '设备', 'Devices'), ('acc', 'mouse', '配件', 'Accessories'), ('cons', 'printer', '耗材', 'Consumables'), ('lic', 'key', '授权', 'Licenses'),
    ('g', '业务', 'Operations'), ('po', 'shopping-cart', '采购', 'Procurement'), ('rep', 'wrench', '维修', 'Repairs'), ('disp', 'recycle', '报废', 'Disposal'), ('aud', 'clipboard-check', '盘点', 'Audits'), ('rpt', 'chart-column', '报表', 'Reports'),
    ('g', 'Agent 团队', 'Agent team'), ('work', 'workflow', 'Agent 工作', 'Agent work'), ('guide', 'notebook-pen', '业务指导', 'Business guidance'), ('skills', 'sparkles', '技能', 'Skills'),
]
itam_side = lambda a: side('monitor-smartphone', 'ITAM', ITAM_NAV, a)

att2 = [('triangle-alert', '超量使用', 'Over-allocated', 'Office LTSC 2024 · 4/3', 'Office LTSC 2024 · 4/3', '1', 1), ('shield-alert', '保修 30 天内到期', 'Warranty ends ≤30d', '最早 11-05 · SG-LT-001 等', 'From Nov 5 · SG-LT-001 +3', '4', 0), ('refresh-cw', '7 天内自动续订', 'Auto-renews ≤7d', 'Zoom Workplace Pro · 25/27', 'Zoom Workplace Pro · 25/27', '1', 0),
        ('ticket-x', '已结束仍占席位', 'Ended, still seated', 'Zoom Workplace Pro', 'Zoom Workplace Pro', '1', 0), ('package-minus', '低于水位的配件', 'Low accessories', 'MX Master 3S · 3/5', 'MX Master 3S · 3/5', '1', 0), ('clipboard-x', '超过 365 天未盘点', 'Not audited 365d+', 'SG-LT-001 等 31 台', '31 devices', '31', 0)]
att2_html = '<div class="attn">' + ''.join(f'<div class="{"hot" if h else ""}"><span class="i">{ic(i)}</span><b>{T(a, b)}</b><small>{T(c, d)}</small><span class="c">{n}</span></div>' for i, a, b, c, d, n, h in att2) + '</div>'
def kc(title, lines, tags_html='', bar=None):
    h = f'<div class="kc"><b>{title}</b>'
    if tags_html: h += f'<div class="tgs">{tags_html}</div>'
    for l in lines: h += f'<div class="m">{l}</div>'
    if bar is not None: h += f'<div class="bar"><i style="--w:{bar}%"></i></div>'
    return h + '</div>'
board = [
    ('待审批', 'Approvals', '4', [kc('PO-000045', [T('研发新员工 MacBook Air', 'MacBook Air for new engineers'), '<span>CNY</span><span class="amt">35,996</span>'], tag('red', '待你审批', 'Needs you') + AI('有条件同意', 'Approve on conditions')), kc('DP-000003', [T('销毁 · 1 台打印机', 'Destroy · 1 printer'), '<span>CNY</span><span class="amt">1,776</span>'], tag('red', '待你审批', 'Needs you') + AI('建议驳回', 'Reject'))]),
    ('人员变动', 'Joiners &amp; leavers', '3', [kc(T('孙浩 · 前端工程师', 'Sun Hao · Front-end'), [T('10-21 入职 · 还有 4 天', 'Starts Oct 21 · in 4 days'), T('已配备 0 / 8', 'Equipped 0 / 8')], tag('green', '入职', 'Joiner'), 0), kc(T('陈杰 · IT 支持', 'Chen Jie · IT support'), [T('10-16 离职', 'Leaves Oct 16'), T('已回收 3 / 10', 'Collected 3 / 10')], tag('red', '离职', 'Leaver'), 30)]),
    ('采购中', 'Purchasing', '7', [kc('PO-000038', [T('北桥 IT 供应', 'Northbridge IT'), '<span>CNY</span><span class="amt">2,990</span>'], tag('blue', '已下单', 'Ordered') + tag('red', '到货逾期 3 天', '3 days late')), kc('PO-000047', [T('北桥 IT 供应', 'Northbridge IT'), '<span>CNY</span><span class="amt">2,899</span>'], tag('blue', '已批准', 'Approved'))]),
    ('设备跟进', 'Device follow-up', '4', [kc('DE-000005', [T('借出 · 赵敏', 'On loan · Zhao Min'), T('预计 10-09 归还', 'Due back Oct 9')], tag('orange', '逾期未还', 'Overdue')), kc('RP-000001', [T('电池鼓包，需更换', 'Swollen battery'), T('预计 10-20 取回', 'Back Oct 20')], tag('grey', '维修中', 'In repair'))]),
    ('MDM 核对', 'MDM checks', '9', [kc(T('使用人不一致', 'Assignee mismatch'), [T('SG-LT-011 · MDM：李娜', 'SG-LT-011 · MDM: Li Na'), T('台账：张伟', 'Register: Zhang Wei')], AI('已整理方案', 'Plan ready')), kc(T('台账未登记', 'Not in register'), [T('Intune 新增 3 台', '3 new in Intune')], AI('已整理方案', 'Plan ready'))]),
]
board_html = '<div class="kb">' + ''.join(f'<div class="kb-col"><header>{T(a, b)}<span class="n">{n}</span></header>{"".join(cs)}</div>' for a, b, n, cs in board) + '</div>'
save('itamTodo', win(itam_side('todo'), '待办', 'To-do',
    f'<div class="sx-h"><h5>{T("待办", "To-do")}</h5><span class="r"><span class="seg"><span class="on">{T("看板", "Board")}</span><span>{T("列表", "List")}</span></span><span class="seg"><span class="on">{T("全部", "All")}</span><span>{T("我负责的", "Mine")}</span></span></span></div>'
    f'<div class="sx-sec">{ic("triangle-alert")}{T("需要关注", "Needs attention")}</div>{att2_html}{board_html}', user='吴'))

# 设备台账
devs = [('SG-LT-001', 'MacBook Pro 14 M3', 'green', '使用中', 'In use', '李娜', 'Li Na', '技术部', 'Engineering', '3 楼', 'Floor 3', '10-15 23:10'),
        ('SG-LT-004', 'MacBook Pro 14 M3', 'orange', '维修中', 'In repair', '王芳', 'Wang Fang', '销售部', 'Sales', '3 楼', 'Floor 3', '08-20 22:10'),
        ('SG-LT-005', 'MacBook Pro 14 M3', 'blue', '借出中', 'On loan', '赵敏', 'Zhao Min', '销售部', 'Sales', '3 楼', 'Floor 3', '—'),
        ('SG-LT-007', 'Latitude 5440', 'grey', '库存中', 'In stock', '—', '—', '—', '—', '仓库', 'Store', '10-15 22:10'),
        ('SG-LT-010', 'MacBook Air 13 M3', 'green', '使用中', 'In use', '赵敏', 'Zhao Min', '销售部', 'Sales', '3 楼', 'Floor 3', '10-15 23:10'),
        ('SG-MON-002', 'Dell U2724D', 'green', '使用中', 'In use', '刘洋', 'Liu Yang', '技术部', 'Engineering', '3 楼', 'Floor 3', '—'),
        ('SG-PR-003', 'HP LaserJet M428', 'red', '待报废', 'Pending disposal', '—', '—', '行政', 'Admin', '2 楼', 'Floor 2', '—')]
rows = ''.join(f'<tr><td class="id">{a}</td><td>{m}</td><td>{tag(c, s1, s2)}</td><td>{T(p1, p2)}</td><td>{T(d1, d2)}</td><td>{T(l1, l2)}</td><td class="id" style="color:var(--muted)">{sync}</td></tr>' for a, m, c, s1, s2, p1, p2, d1, d2, l1, l2, sync in devs)
save('itamDevices', bare('monitor-smartphone', 'ITAM', '设备', 'Devices',
    f'<div class="sx-h"><h5>{T("设备", "Devices")}</h5><span class="n">86</span><span class="r"><span class="b sm">{ic("refresh-cw")}{T("MDM 核对", "MDM check")}</span><span class="b dk sm">{ic("plus")}{T("创建设备", "New device")}</span></span></div>'
    f'<div class="chips"><span class="chip">{T("全部 86", "All 86")}</span><span class="chip">{T("使用中 69", "In use 69")}</span><span class="chip">{T("库存中 11", "In stock 11")}</span><span class="chip">{T("维修中 3", "In repair 3")}</span><span class="chip">{T("借出中 1", "On loan 1")}</span><span class="chip">{T("保修 30 天内到期 4", "Warranty ≤30d 4")}</span></div>'
    f'<div class="tblw"><table class="tbl"><thead><tr><th>{T("编号", "Tag")}</th><th>{T("型号", "Model")}</th><th>{T("状态", "Status")}</th><th>{T("去向", "Assignee")}</th><th>{T("部门", "Department")}</th><th>{T("位置", "Location")}</th><th>{T("MDM 最后同步", "Last MDM sync")}</th></tr></thead><tbody>{rows}</tbody></table></div>', user='吴'))

# 入职配备
kit = [('MacBook Pro 14 M3', T('库存可补：SG-LT-031', 'From stock: SG-LT-031'), tag('green', '库存', 'Stock'), 1), ('Dell U2724D ×2', T('库存可补：SG-MON-014、015', 'From stock: SG-MON-014, 015'), tag('green', '库存', 'Stock'), 1),
       ('Figma Professional', T('闲置席位可分配（10/12）', 'Idle seat available (10/12)'), tag('blue', '席位', 'Seat'), 1), ('Microsoft 365', T('分配席位（35/40）', 'Assign a seat (35/40)'), tag('blue', '席位', 'Seat'), 1),
       ('IntelliJ IDEA Ultimate', T('没有空余席位，需采购 1 个', 'No spare seat; buy 1'), tag('amber', '缺口', 'Gap'), 0), ('MX Master 3S', T('低于水位（3/5），需补货', 'Below threshold (3/5)'), tag('amber', '缺口', 'Gap'), 0)]
kit_html = '<div class="ck2">' + ''.join(f'<div><span class="bx{" on" if on else ""}"></span><b>{a}</b><small>{b}</small>{t}</div>' for a, b, t, on in kit) + '</div>'
save('itamOnboard', solo(
    f'<div class="sx-h"><div><h5>{T("孙浩 · 前端工程师", "Sun Hao · Front-end engineer")}</h5><p>{T("10 月 21 日入职 · 研发部 · 按「研发标准配置」", "Starts Oct 21 · Engineering · “Engineering standard kit”")}</p></div><span class="r">{tag("green", "入职", "Joiner")}</span></div>'
    f'<div class="rvw"><div class="h">{ic("sparkles")}{T("资产管家整理的配备方案", "Kit plan from the asset steward")}</div><p style="font-size:12.5px;color:var(--ink-2)">{T("8 项里 6 项可以用库存和闲置席位补上，2 项需要采购；系统外还要开通 VPN 和代码仓库权限。", "6 of 8 items come from stock and idle seats; 2 need purchasing. Outside the system: VPN and repo access.")}</p></div>'
    f'{kit_html}<div class="acts" style="margin-top:0"><span class="b p sm">{ic("check")}{T("整批确认 4 项", "Confirm 4 items")}</span><span class="b sm">{ic("file-plus")}{T("为缺口起草采购单", "Draft a PO for the gaps")}</span></div>'))

# 审批助手
save('itamApproval', solo(
    f'<div class="sx-h"><div><h5>PO-000037 · {T("销售部显示器扩容", "Monitors for Sales")}</h5><p>{T("北桥 IT 供应 · 申请人 吴静 · 5 台 Dell U2724D", "Northbridge IT · by Wu Jing · 5 × Dell U2724D")}</p></div><span class="r">{tag("amber", "等你审批", "Waiting for you")}</span></div>'
    f'<div class="kv"><div><small>{T("金额", "Amount")}</small><b>CNY 16,495</b></div><div><small>{T("同型号库存", "Same model in stock")}</small><b>3</b></div><div><small>{T("历史单价", "Past unit price")}</small><b>CNY 3,199</b></div><div><small>{T("本季度预算剩余", "Budget left")}</small><b>CNY 42,000</b></div></div>'
    f'<div class="rvw"><div class="h">{ic("sparkles")}{T("审批助手", "Approval assistant")}</div><div class="q">{T("建议有条件同意：只买差的 2 台", "Recommend: approve only the 2 still needed")}</div><ul><li>{T("库存里有 3 台同型号显示器，可以先领用", "3 matching monitors are in stock and can be issued now")}</li><li>{T("本次单价比上次高 3%，可以请供应商按上次价格报价", "Unit price is 3% above last time—ask for last price")}</li><li>{T("近一年同类扩容申请 4 次，都按「先用库存」批准", "4 similar requests in a year, all approved stock-first")}</li></ul><div class="draft"><small>{T("起草的审批意见", "Drafted comment")}</small>{T("同意采购 2 台，其余 3 台从库存领用；请按上次单价确认报价。", "Approved for 2 units; issue the other 3 from stock. Please confirm at last price.")}</div></div>'
    f'<div class="acts" style="margin-top:0"><span class="b p sm">{T("有条件同意", "Approve on conditions")}</span><span class="b sm">{T("同意", "Approve")}</span><span class="b sm">{T("驳回", "Reject")}</span><span class="b sm">{T("要求补充", "Ask for more")}</span></div>'))

# MDM 核对方案
mdm = [(1, T('SG-LT-011 使用人不一致', 'SG-LT-011 assignee mismatch'), T('MDM：李娜 · 台账：张伟 → 交给设备负责人，按 MDM 更新', 'MDM: Li Na · Register: Zhang Wei → device owner; update to MDM'), tag('grey', '设备负责人', 'Owner')),
       (1, T('3 台设备台账未登记', '3 devices not in register'), T('Intune 新增 · 序列号已匹配型号 → 交给资产管理员登记', 'New in Intune, models matched → asset admin to register'), tag('grey', '资产管理员', 'Asset admin')),
       (0, T('SG-LT-019 失联 41 天', 'SG-LT-019 silent for 41 days'), T('拿不准是否已离职交还，留给人判断', 'Unclear whether it was returned—left for a person'), tag('amber', '需要你判断', 'Needs you'))]
mdm_html = '<div class="ck2">' + ''.join(f'<div><span class="bx{" on" if on else ""}"></span><b>{a}</b><small>{b}</small>{t}</div>' for on, a, b, t in mdm) + '</div>'
save('itamMdm', solo(
    f'<div class="sx-h"><div><h5>{T("MDM 核对方案", "MDM reconciliation plan")}</h5><p>{T("Intune 10-16 02:00 同步 · 发现 5 处差异", "Intune sync Oct 16 02:00 · 5 differences")}</p></div><span class="r">{AI("MDM 跟进", "MDM follow-up")}</span></div>'
    f'{mdm_html}<div class="acts" style="margin-top:0"><span class="b p sm">{ic("check")}{T("执行勾选的 2 项", "Run 2 selected")}</span><span class="b sm">{T("查看全部差异", "All differences")}</span></div>'))

# 报表
save('itamReports', solo(
    f'<div class="sx-h"><h5>{T("报表 · 概览", "Reports · Overview")}</h5><span class="r"><span class="b sm">{ic("sparkles")}{T("AI 报表解读", "Explain with AI")}</span><span class="b sm">{ic("download")}CSV</span></span></div>'
    f'<div class="stat"><div><small>{T("设备", "Devices")}</small><b>85</b></div><div><small>{T("账面价值", "Book value")}</small><b>{T("¥ 38.2万", "¥ 382k")}</b></div><div><small>{T("在用率", "Utilization")}</small><b class="ok">82%</b></div><div><small>{T("授权超量", "Over-allocated")}</small><b class="bad">1</b></div></div>'
    f'<div class="duo2"><div class="pnl"><div class="h">{T("按状态", "By status")}</div><div class="bars">'
    + ''.join(f'<div><span>{T(a, b)}</span><i style="--w:{w}%"></i><span>{v}</span></div>' for a, b, w, v in [('使用中', 'In use', 100, '69'), ('库存中', 'In stock', 16, '11'), ('维修中', 'In repair', 5, '3'), ('借出中', 'On loan', 2, '1'), ('待报废', 'Pending disposal', 2, '1')])
    + f'</div></div><div class="pnl"><div class="h">{T("授权合规", "License compliance")}</div><div class="bars">'
    + ''.join(f'<div><span>{T(a, b)}</span><i style="--w:{w}%;--c:{c}"></i><span>{v}</span></div>' for a, b, w, c, v in [('合规', 'Compliant', 100, 'var(--pass)', '6'), ('闲置', 'Idle', 50, 'var(--human)', '3'), ('超量', 'Over', 17, 'var(--risk-ink)', '1')])
    + '</div></div></div>'))


# ======================= NocoReach =======================
REACH_NAV = [
    ('ins', 'sparkles', '洞察', 'Insights'), ('opp', 'lightbulb', '机会', 'Opportunities', '!2'), ('tasks', 'list-checks', '任务', 'Tasks', '!15'), ('res', 'chart-no-axes-column', '成效', 'Results'),
    ('site', 'globe', '网站与产品', 'Site & product', '>'), ('search', 'search', '搜索与市场', 'Search & market', '>'), ('comm', 'messages-square', '社区', 'Community', '>'), ('team', 'bot', 'AI 团队', 'AI team', '>'), ('set', 'settings-2', '设置', 'Settings', '>'),
]
reach_side = lambda a: side('chart-no-axes-column', 'Reach', REACH_NAV, a, foot=T('<b>在数据里找到机会，</b><br>NocoReach 把它做完。', '<b>Find the opportunities in your data.</b><br>NocoReach gets them done.'))

def spark(pts, color='var(--risk-ink)'):
    w, h = 140, 26; mx, mn = max(pts), min(pts); n = len(pts) - 1
    xy = ' '.join(f'{i * w / n:.1f},{h - 2 - (v - mn) / ((mx - mn) or 1) * (h - 4):.1f}' for i, v in enumerate(pts))
    return f'<svg viewBox="0 0 {w} {h}" width="100%" height="{h}" preserveAspectRatio="none" style="display:block;margin-top:6px"><polyline fill="none" stroke="{color}" stroke-width="1.4" points="{xy}"/></svg>'

mets = [('搜索点击', 'Search clicks', '12,490', '↓ 5.5%', [9, 7, 8, 6, 9, 8, 7, 9, 6, 8, 9, 7], 0), ('搜索曝光', 'Impressions', '758,828', '↓ 20%', [9, 8, 9, 7, 8, 6, 7, 6, 7, 5, 6, 6], 0), ('会话', 'Sessions', '55,197', '↓ 13%', [8, 9, 7, 8, 9, 7, 6, 8, 7, 6, 7, 6], 0),
        ('关键事件', 'Key events', '22,354', '↓ 16%', [7, 8, 6, 9, 7, 6, 8, 6, 5, 7, 6, 8], 0), ('新增 Star', 'New stars', '+356', '↓ 37%', [5, 6, 4, 6, 5, 4, 5, 6, 4, 3, 5, 9], 0), ('下载量', 'Downloads', '43,573', '↑ 4%', [5, 6, 6, 7, 6, 7, 8, 7, 8, 8, 9, 9], 1)]
met_html = '<div class="stat" style="--n:6">' + ''.join(f'<div><small>{T(a, b)}</small><b>{v}</b><span class="d" style="color:{"var(--pass-ink)" if up else "var(--risk-ink)"}">{d}</span>{spark(pts, "var(--pass)" if up else "var(--risk-ink)")}</div>' for a, b, v, d, pts, up in mets) + '</div>'
todo = [('给 /tutorials 索引页补教程清单', 'Add the tutorial list to /tutorials', 'amber', '正文仅 72 字', '72 chars of body', '网站内容 · 近 28 天仍有 265 次曝光', 'Website content · still 265 impressions in 28 days'),
        ('给 Docker 安装页改标题和摘要', 'Rewrite the Docker install page title', 'red', '↓ 61%', '↓ 61%', 'Search Console · 搜索点击从 31 降到 12', 'Search Console · clicks down from 31 to 12'),
        ('/es/api/auth 平均排名 8.5，接近首页', '/es/api/auth at position 8.5, near page one', 'blue', '排名 8.5', 'Position 8.5', 'Search Console · 曝光 1,461，只有 1 次点击', 'Search Console · 1,461 impressions, 1 click'),
        ('/cn/commercial 访问多、关键事件少', '/cn/commercial: many visits, few key events', 'amber', '转化偏低', 'Low conversion', 'GA4 · 浏览 2,560，关键事件率不足站均四分之一', 'GA4 · 2,560 views, under a quarter of the site’s event rate')]
todo_html = '<div class="rows">' + ''.join(f'<div style="grid-template-columns:minmax(0,1fr) auto"><b>{T(a, b)} {tag(c, d, e)}</b><small style="grid-column:1">{T(f, g)}</small><span class="acts" style="grid-row:1/3;grid-column:2;margin:0"><span class="b sm">{T("交给 Agent", "Hand off to agent")}</span><span class="b sm">{T("忽略", "Ignore")}</span></span></div>' for a, b, c, d, e, f, g in todo) + '</div>'
situ = [('Google 关注度 ↓ 36%', 'Google interest ↓ 36%', 'Trends · 与 NocoDB、Baserow、Budibase 同期对比', 'Trends · vs NocoDB, Baserow, Budibase'), ('53 个页面超过一年没更新', '53 pages not updated in a year', '网站内容 · 共 458 页', 'Website content · 458 pages'),
        ('5 个论坛主题没人回复', '5 forum topics without replies', '论坛 · 近 14 天新增 23 个主题', 'Forum · 23 new topics in 14 days'), ('竞品近 7 天更新 12 次', '12 competitor updates in 7 days', '竞品 · Budibase 6、Retool 4、NocoDB 1', 'Competitors · Budibase 6, Retool 4, NocoDB 1'), ('跟踪 50 个关键词，14 个在前 10', '50 keywords tracked, 14 in the top 10', '排名跟踪 · 本周 3 升 1 降', 'Rank tracking · 3 up, 1 down this week')]
situ_html = '<div class="rows">' + ''.join(f'<div style="grid-template-columns:8px minmax(0,1fr)"><span style="grid-row:1/3;width:7px;height:7px;border-radius:50%;background:var(--human)"></span><b>{T(a, b)}</b><small>{T(c, d)}</small></div>' for a, b, c, d in situ) + '</div>'
save('reachInsights', win(reach_side('ins'), '洞察', 'Insights',
    f'<div class="sx-h"><div><h5>{T("洞察", "Insights")}</h5><p>{T("近 28 天 · 数据截至 10-13 · 今天 06:53 完成分析", "Last 28 days · data through Oct 13 · analyzed today 06:53")}</p></div><span class="r"><span class="b sm">{ic("refresh-cw")}{T("重新分析", "Update analysis")}</span></span></div>'
    f'<div class="sg" style="background:var(--human-tint);border-color:transparent;grid-template-columns:auto 1fr auto;display:grid;align-items:center;gap:10px"><span style="color:var(--human-ink)">{ic("bell")}</span><span style="font-size:12.5px;color:var(--human-ink)"><b style="font-size:12.5px">{T("15 件事等你处理", "15 things need you")}</b> · {T("发布 v2.2.26 更新说明 · 等你开始　内容选题：nocobase github · 等你审核", "Release notes v2.2.26 · waiting to start　Topic: nocobase github · review")}</span><span style="font-size:12px;color:var(--human-ink)">{T("查看全部", "View all")}</span></div>'
    f'<div class="sx-sec">{T("关键指标", "Key metrics")}</div>{met_html}'
    f'<div class="duo2" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)"><div class="pnl"><div class="h">{T("今天的变化", "Today’s changes")}<span class="tag grey">36</span><span class="r">{T("待办 5 · 观察中 7", "To do 5 · Watching 7")}</span></div>{todo_html}</div><div class="pnl"><div class="h">{T("当前形势", "Current situation")}</div>{situ_html}</div></div>'))

steps = [('Agent 修改', 'Agent change', 0), ('你审阅并发布', 'Review &amp; publish (you)', 1), ('上线', 'Live', 0), ('观察效果', 'Watch', 0)]
steps_html = '<div class="chips">' + f'<span style="color:var(--muted)">{ic("chevron-right")}</span>'.join(f'<span class="chip" style="{"background:var(--agent-tint);color:var(--agent-ink);border-color:transparent" if h else ""}">{T(a, b)}</span>' for a, b, h in steps) + '</div>'
opps = [('O-29', '给 /tutorials 索引页补教程清单', 'Add the tutorial list to /tutorials', '正文仅 72 字，近 28 天仍有 265 次曝光', 'Only 72 chars, still 265 impressions', 'amber', '正文 72 字', '72 chars', '网站内容', 'Website content', 1),
        ('O-28', '给 Docker 安装页改标题摘要', 'Rewrite the Docker page title', '搜索点击从 31 降到 12', 'Clicks down from 31 to 12', 'red', '↓ 61%', '↓ 61%', 'Search Console', 'Search Console', 0),
        ('O-27', '回复 4 个无人回应的论坛主题', 'Reply to 4 unanswered forum topics', '最早的已经等了 5 天', 'The oldest has waited 5 days', 'orange', '4 个主题', '4 topics', '论坛', 'Forum', 0)]
olist = '<div style="display:grid;gap:8px;align-content:start">' + ''.join(f'<div class="sg{" on" if on else ""}"><b><span class="id" style="color:var(--muted);font-weight:400;font-size:12px">{i}</span> {T(a, b)}</b><p>{T(c, d)}</p><div class="t">{tag(tc, e, f)}{tag("grey", g, h)}</div></div>' for i, a, b, c, d, tc, e, f, g, h, on in opps) + '</div>'
odet = (f'<div class="pnl" style="gap:12px"><div class="t" style="display:flex;gap:6px">{tag("amber", "正文 72 字", "72 chars of body")}{tag("grey", "网站内容", "Website content")}</div>'
        f'<div><b style="font-size:16px"><span class="id" style="color:var(--muted);font-weight:400;font-size:13px">O-29</span> {T("给 /tutorials 索引页补教程清单", "Add the tutorial list to /tutorials")}</b><p style="color:var(--muted);font-size:12px">{T("10-16 首次发现 · 来自 10-16 的每日分析", "First found Oct 16 · from the Oct 16 analysis")}</p></div>'
        f'<div><p style="font-size:11.5px;color:var(--muted)">{T("发生了什么", "What changed")}</p><p>{T("文档教程索引页内容太少：正文仅 72 字，近 28 天仍有 265 次搜索曝光。", "The docs tutorial index is thin: 72 characters of body text, yet 265 search impressions in 28 days.")}</p></div>'
        f'<div class="rvw" style="padding:10px 12px"><div class="h">{ic("sparkles")}{T("AI 建议", "AI suggestion")}</div><p style="font-size:12.5px">{T("补齐全部教程条目，每条一句摘要并链到具体文档，再按角色或场景给出推荐阅读顺序。", "List every tutorial with a one-line summary linking to its doc, and add a reading order by role or scenario.")}</p></div>'
        f'<div class="kv" style="--n:3"><div><small>{T("负责人", "Owner")}</small><b>{T("陈思（你）", "Ava Chen (you)")}</b></div><div><small>{T("执行者", "Executor")}</small><b>Agent</b></div><div><small>{T("剧本", "Playbook")}</small><b>{T("改进现有页面", "Improve existing page")}</b></div></div>{steps_html}'
        f'<div class="acts" style="margin:0"><span class="b p sm">{T("交给 Agent", "Hand off to agent")}</span><span class="b sm">{T("忽略", "Ignore")}</span><span class="note">{T("Agent 先修改；你看过结果之前，不会发布任何内容", "The agent changes it first; nothing is published until you’ve seen the result")}</span></div>'
        f'<p style="font-size:11.5px;color:var(--muted)">{T("局限：只有该页曝光数字，没有查询词和跳出情况。", "Limitation: page impressions only—no queries or bounce data.")}</p></div>')
save('reachOpp', bare('chart-no-axes-column', 'Reach', '机会', 'Opportunities',
    f'<div class="sx-h"><div><h5>{T("机会", "Opportunities")}</h5><p>{T("数据变化里值得做的事：交给 Agent，或者忽略。", "Things worth doing in what changed: hand them to the agent or dismiss them.")}</p></div></div>'
    f'<div class="tabs"><span class="on">{T("待办 2", "To do 2")}</span><span>{T("观察中 7", "Watching 7")}</span><span>{T("已处理 35", "Handled 35")}</span></div>'
    f'<div class="duo2" style="grid-template-columns:330px minmax(0,1fr)">{olist}{odet}</div>'))

pb = [('调研分析', 'Research', [('变化排查', 'Change investigation'), ('竞品对比', 'Competitor comparison'), ('关键词研究', 'Keyword research'), ('社区问题汇总', 'Community question summary')]),
      ('内容创作', 'Content', [('社区回复草稿', 'Draft community replies'), ('选题与大纲', 'Topic and outline'), ('新文档页', 'New docs page'), ('写博客', 'Write blog post'), ('写更新说明', 'Write release notes')]),
      ('内容优化', 'Optimization', [('改进现有页面', 'Improve existing page'), ('同步多语言版本', 'Sync language versions')]),
      ('网站技术', 'Technical', [('技术修复', 'Technical fix')])]
pb_html = ''.join(f'<div class="sx-sec" style="font-size:11.5px;color:var(--muted);font-weight:500">{T(a, b)}</div><div class="chips">' + ''.join(f'<span class="chip">{T(x, y)}<span class="tag grey" style="height:16px;font-size:10px;padding:0 5px">{T("内置", "Built-in")}</span></span>' for x, y in items) + '</div>' for a, b, items in pb)
save('reachPlaybooks', solo(
    f'<div class="sx-h"><div><h5>{T("剧本", "Playbooks")}</h5><p>{T("每类工作怎么做：Agent 走哪些步骤，你在哪一步审阅。", "How each kind of work is done: the agent’s steps and where you review.")}</p></div><span class="r"><span class="b dk sm">{ic("plus")}{T("新建剧本", "New playbook")}</span></span></div>{pb_html}'
    f'<div class="pnl"><div class="h">{T("改进现有页面 · 步骤", "Improve existing page · steps")}</div>{steps_html}<p>{T("Agent 读页面、搜索数据和项目知识，写出修改方案并在仓库里改好；你审阅后发布，上线后第 7 天和第 28 天自动对比效果。", "The agent reads the page, search data, and project knowledge, then makes the change in your repository. You review and publish; results are compared on day 7 and day 28.")}</p></div>'))

tasks = [('T-10', '围绕「open source workflow automation」写内容', 'Content for “open source workflow automation”', 'amber', '等你审核', 'Needs review', '写博客', 'Blog post'),
         ('T-3', '给三篇博客页补内链与摘要', 'Internal links and summaries for 3 posts', 'amber', '等你发布', 'Review &amp; publish', '改进现有页面', 'Improve page'),
         ('T-9', '把社区高频报错做成排查指引页', 'Turn common errors into a troubleshooting page', 'amber', '等你审核', 'Needs review', '新文档页', 'New docs page'),
         ('T-27', '回复 4 个无人回应的论坛主题', 'Reply to 4 unanswered forum topics', 'violet', 'Agent 进行中', 'Agent working', '社区回复草稿', 'Community replies'),
         ('T-15', '修复 411 个页面描述太短', 'Fix 411 pages with short descriptions', 'grey', '待开始', 'To do', '技术修复', 'Technical fix')]
trows = ''.join(f'<tr><td class="id">{i}</td><td class="w">{T(a, b)}</td><td>{tag(c, d, e)}</td><td>{T(f, g)}</td></tr>' for i, a, b, c, d, e, f, g in tasks)
save('reachTasks', solo(
    f'<div class="sx-h"><div><h5>{T("任务", "Tasks")}</h5><p>{T("Agent 按剧本完成的工作，需要你确认时停下来。", "Work the agent completes by playbook; it stops when it needs you.")}</p></div></div>'
    f'<div class="chips"><span class="chip" style="background:var(--human-tint);color:var(--human-ink);border-color:transparent">{T("等我处理 15", "Waiting for me 15")}</span><span class="chip">{T("进行中 24", "Current 24")}</span><span class="chip">{T("已完成", "Done")}</span></div>'
    f'<div class="tblw"><table class="tbl"><thead><tr><th>{T("编号", "No.")}</th><th>{T("任务", "Task")}</th><th>{T("状态", "Status")}</th><th>{T("剧本", "Playbook")}</th></tr></thead><tbody>{trows}</tbody></table></div>'))

res = [('T-8', '给 /tw 站首页改写标题与描述', 'Rewrite /tw homepage title and description', '第 28 天', 'Day 28', '+42%', 'ok'), ('T-6', '把插件分享主题做成文档专题页', 'Plugin-sharing topic as a docs page', '第 7 天', 'Day 7', '+18%', 'ok'), ('T-4', '改写 Airtable 替代品博客摘要', 'Airtable alternatives post summary', '第 28 天', 'Day 28', '±2%', ''), ('T-1', '给 /ja 站首页改写标题与描述', 'Rewrite /ja homepage title and description', '等你发布', 'Waiting to publish', '—', '')]
rrows = ''.join(f'<tr><td class="id">{i}</td><td class="w">{T(a, b)}</td><td>{T(c, d)}</td><td style="font-family:var(--f-mono);color:{"var(--pass-ink)" if k == "ok" else "var(--muted)"}">{v}</td></tr>' for i, a, b, c, d, v, k in res)
save('reachResults', solo(
    f'<div class="sx-h"><div><h5>{T("成效", "Results")}</h5><p>{T("上线了什么，改过的页面之后怎么变化。", "What went live and how the changed pages moved afterward.")}</p></div><span class="r">{tag("grey", "近 90 天", "Last 90 days")}</span></div>'
    f'<div class="stat" style="--n:3"><div><small>{T("已上线", "Live")}</small><b>6</b><span class="d">{T("另有 3 个等待上线", "3 more waiting")}</span></div><div><small>{T("上升", "Went up")}</small><b class="ok">4</b><span class="d">{T("下降 0 · 无明显变化 2", "Down 0 · flat 2")}</span></div><div><small>{T("改过页面的搜索点击", "Clicks on changed pages")}</small><b class="ok">+27%</b><span class="d">{T("上线前后同样天数对比", "Same days before vs. after")}</span></div></div>'
    f'<div class="tblw"><table class="tbl"><thead><tr><th>{T("任务", "Task")}</th><th></th><th>{T("对比", "Checked")}</th><th>{T("搜索点击", "Clicks")}</th></tr></thead><tbody>{rrows}</tbody></table></div>'))

src = [('网站与产品', 'Site &amp; product', [('GA4 流量', 'GA4 traffic', 1), ('网站内容 458 页', 'Website content · 458 pages', 1), ('站点审计', 'Site audit', 1), ('GitHub', 'GitHub', 1), ('npm · PyPI · Docker 下载', 'npm · PyPI · Docker downloads', 1)]),
       ('搜索与市场', 'Search &amp; market', [('Search Console', 'Search Console', 1), ('关键词与排名跟踪', 'Keywords &amp; rank tracking', 0), ('Google Trends', 'Google Trends', 1), ('竞品', 'Competitors', 1), ('AI 搜索', 'AI search', 1)]),
       ('社区', 'Community', [('论坛（Discourse）', 'Forum (Discourse)', 1), ('Hacker News', 'Hacker News', 1), ('Reddit', 'Reddit', 0), ('X', 'X', 1), ('Discord', 'Discord', 2), ('Slack', 'Slack', 2), ('YouTube', 'YouTube', 0)])]
def st(k): return tag('green', '正常', 'OK') if k == 1 else (tag('amber', '需要处理', 'Needs attention') if k == 0 else tag('grey', '未连接', 'Not connected'))
src_html = ''.join(f'<div class="sx-sec" style="font-size:11.5px;color:var(--muted);font-weight:500">{T(a, b)}</div><div class="attn" style="--cols:2">' + ''.join(f'<div style="grid-template-columns:minmax(0,1fr) auto;padding:7px 10px"><b>{T(x, y)}</b><span style="grid-row:1;grid-column:2">{st(k)}</span></div>' for x, y, k in items) + '</div>' for a, b, items in src)
save('reachSources', solo(
    f'<div class="sx-h"><div><h5>{T("数据源", "Data sources")}</h5><p>{T("连接得越多，能发现的信号越多。", "The more you connect, the more signals you can find.")}</p></div><span class="r"><span class="b dk sm">{ic("sparkles")}{T("从网站自动发现", "Discover from website")}</span></span></div>'
    f'<div class="sg" style="grid-template-columns:auto 1fr;display:grid;gap:10px;align-items:center"><span style="color:var(--agent)">{ic("wand-sparkles")}</span><p>{T("输入网站地址，AI 读首页和链接，找出文档站、GitHub 仓库、社区论坛等可以连接的数据；你确认之前不会导入或产生费用。", "Enter your website and AI finds the docs site, GitHub repo, forum, and more you can connect. Nothing is imported or charged until you confirm.")}</p></div>{src_html}'))

qs = [('open source workflow automation tool', '390', 0, 'Budibase'), ('internal tool builder', '260', 0, 'Retool · Appsmith'), ('self-hosted business apps', '170', 1, 'NocoBase · Budibase'), ('relational data crm', '90', 0, '—')]
qrows = ''.join(f'<tr><td class="w">{q}</td><td style="font-family:var(--f-mono)">{v}</td><td>{tag("green", "出现", "Appears") if us else tag("amber", "未出现", "Not appearing")}</td><td>{b}</td></tr>' for q, v, us, b in qs)
save('reachAiSearch', solo(
    f'<div class="sx-h"><div><h5>{T("AI 搜索", "AI search")}</h5><p>{T("人们在 ChatGPT 和 Google AI 概览里问什么，回答里有没有我们。", "What people ask ChatGPT and Google AI Overviews, and whether answers mention us.")}</p></div></div>'
    f'<div class="stat"><div><small>{T("AI 里的问题", "Questions in AI")}</small><b>41</b></div><div><small>{T("我们出现", "We appear")}</small><b>4</b><span class="d">10%</span></div><div><small>{T("机会：别人出现、我们没有", "Others appear, we don’t")}</small><b class="warn">5</b></div><div><small>{T("没有提到品牌", "No brand mentioned")}</small><b>32</b></div></div>'
    f'<div class="tblw"><table class="tbl"><thead><tr><th>{T("问题", "Question")}</th><th>{T("搜索量", "Volume")}</th><th>{T("我们", "Us")}</th><th>{T("提到的品牌", "Brands mentioned")}</th></tr></thead><tbody>{qrows}</tbody></table></div>'))
print('snips:', sorted(os.listdir(out)))
