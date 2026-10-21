# 首页 Solutions：六款应用各一张专属图，组合成 <template>，插到首页 Solutions 段里。
# 已上线的 NocoCRM、NocoITAM、NocoReach 取自各自内页成品 HTML 里最核心的图；还没上线的三款在这里直接画。
# 用法（在 _src 目录下）：python3 pages/gen_home_sol.py ..
import re, sys, os
root = sys.argv[1]
rd = lambda f: open(os.path.join(root, f), encoding='utf-8').read()
T = lambda zh, en: '<t-zh>%s</t-zh><t-en>%s</t-en>' % (zh, en)

def balanced(s, k):
    depth = 0
    for m in re.finditer(r'<div\b|</div>', s[k:]):
        depth += 1 if m.group(0) == '<div' else -1
        if depth == 0:
            return s[k:k + m.end()]

def wow_body(page):
    """内页「wow」段大图里 .sx-body 的内容（不含外层）"""
    s = rd(page)
    i = s.find('<section class="sec wow')
    sec = s[i:s.find('</section>', i)]
    body = balanced(sec, sec.find('<div class="sx-body">'))
    return body[len('<div class="sx-body">'):-len('</div>')]

def section_fig(page, label, cls='<div class="sx-body">'):
    s = rd(page)
    i = s.find('class="label"><b><t-zh>' + label)
    sec = s[s.rfind('<section', 0, i):s.find('</section>', i)]
    return balanced(sec, sec.find(cls))

def top(icon, app, crumb_zh, crumb_en, right=''):
    return ('<div class="sx-top"><span class="sx-brand" style="padding:0"><span class="mk"><i data-lucide="%s"></i></span>Noco<span>%s</span></span><span>/</span><b>%s</b>'
            '<span class="r">%s<span class="ai"><i data-lucide="sparkles"></i></span><span class="av">%s</span></span></div>') % (icon, app, T(crumb_zh, crumb_en), right, T('陈', 'A'))

def win(icon, app, czh, cen, body, right=''):
    return '<div class="sx solo">' + '<div class="sx-main">' + top(icon, app, czh, cen, right) + '<div class="sx-body">' + body + '</div></div></div>'

# NocoCRM：一支 7×24 小时的销售 Agent 团队——「Agent 做了 37 件事，你只拍板 6 件」
# 底部一行：今天在岗的 6 个 Agent 各做了几件事（合计 37，和右侧数字对上）
ROSTER = [('公司研究 Agent', 'Research Agent', 'building-2', 4), ('线索跟进 Agent', 'Lead Agent', 'radar', 12), ('商机跟进 Agent', 'Deal Agent', 'bell', 5),
          ('任务助手 Agent', 'Task Agent', 'list-checks', 9), ('审批辅助 Agent', 'Approval Agent', 'stamp', 3), ('销售专家 Agent', 'Sales Expert Agent', 'message-square', 4)]
crm_roster = ('<div class="sx-sec" style="color:var(--agent-ink)"><i data-lucide="bot" style="color:var(--agent)"></i>' + T('今天在岗的 6 个 Agent', '6 agents on duty today') + '<span class="r">' + T('合计 37 件', '37 tasks in total') + '</span></div>'
  '<div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px">' + ''.join(
    '<div style="display:grid;grid-template-columns:24px minmax(0,1fr);gap:2px 8px;align-items:center;padding:9px 10px;border:1px solid var(--rule);border-radius:9px">'
    '<span class="ag" style="grid-row:span 2;width:24px;height:24px"><i data-lucide="%s"></i></span><b style="font-size:12px;font-weight:600;color:var(--agent-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">%s</b>'
    '<span style="font-size:11.5px;color:var(--muted)">%s</span></div>' % (ic, T(zh, en), T('今天 %d 件' % n, '%d today' % n)) for zh, en, ic, n in ROSTER) + '</div>')
crm = win('handshake', 'CRM', 'Agent 工作', 'Agent work', wow_body('solution-crm.html'),
          '<span class="tag violet"><span class="spin" style="width:10px;height:10px;border-width:1.5px"></span>' + T('6 个 Agent 在岗', '6 agents on duty') + '</span>')

# NocoITAM：省下的每一笔钱，都说得清来龙去脉
# 底部补一条「等你确认」：Agent 只提建议，负责人确认后才执行
def ask(id_, zh, en, dzh, den, save):
    return ('<div class="sg on" style="grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:2px 12px;padding:10px 12px">'
            '<div style="display:grid;gap:2px;min-width:0"><b><span class="id" style="color:var(--muted);font-weight:400;font-size:12px">%s</span> %s</b><p>%s<span style="margin-left:8px;font-family:var(--f-mono);color:var(--pass-ink)">%s</span></p></div>'
            '<div class="acts" style="margin:0;flex-wrap:nowrap"><span class="b p sm">%s</span><span class="b sm">%s</span></div></div>') % (id_, T(zh, en), T(dzh, den), save, T('同意', 'Approve'), T('改一改', 'Edit'))
itam_ask = ('<div class="sx-sec"><i data-lucide="user-check"></i>' + T('等你确认', 'Waiting on you') + '<span class="r">' + T('确认后才会执行', 'Nothing runs until you confirm') + '</span></div>'
  '<div class="duo2" style="gap:12px">' +
  ask('PO-000052', '设计部申请 3 台显示器', '3 monitors for Design', '库存有 2 台同型号，建议只买 1 台', '2 same-model units in stock; buy just 1', T('少花 ¥ 3,198', 'Saves ¥3,198')) +
  ask('Adobe CC', '5 个席位 90 天未登录', '5 seats unused for 90 days', '下月续订前回收，续订减少 5 个', 'Reclaim before next month’s renewal', T('少花 ¥ 6,450/年', 'Saves ¥6,450/yr')) +
  '</div>')
itam = win('monitor-smartphone', 'ITAM', '价值', 'Value', re.sub(r'<tr><td class="id">DP-000003</td>.*?</tr>', '', wow_body('solution-itam.html'), flags=re.S) + itam_ask,
           '<span class="tag grey">' + T('本季度', 'This quarter') + '</span>')

# NocoReach：找到机会 → Agent 做完 → 上线后自动复盘（闭环在上，下面是今天的机会和已上线的成效）
loop = wow_body('solution-reach.html')
opp = section_fig('solution-reach.html', '机会')
cards = [balanced(opp, m.start()) for m in re.finditer(r'<div class="sg(?: on)?">', opp)][:2]
hand = '<div class="acts" style="margin:0;flex-wrap:nowrap"><span class="b p sm"><i data-lucide="bot"></i>' + T('交给 Agent', 'Hand to agent') + '</span><span class="b sm">' + T('忽略', 'Dismiss') + '</span></div>'
def compact(c):
    # 只留标题和一句说明，按钮放右侧，一行一个机会
    b = re.search(r'<b>.*?</b>', c, re.S).group(0)
    d = re.search(r'<p>.*?</p>', c, re.S).group(0)
    on = ' on' if c.startswith('<div class="sg on"') else ''
    return ('<div class="sg%s" style="grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:2px 12px;padding:10px 12px"><div style="display:grid;gap:2px;min-width:0">%s%s</div>' % (on, b, d)) + hand + '</div>'
cards = [compact(c) for c in cards]
res = section_fig('solution-reach.html', '成效')
stat = balanced(res, res.find('<div class="stat"'))
rows = re.findall(r'<tr><td class="id">.*?</tr>', res, re.S)[:2]
tbl = re.search(r'<thead>.*?</thead>', res, re.S).group(0)
reach_body = (loop +
  '<div class="duo2" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px">' +
    '<div class="pnl" style="gap:8px;align-content:start;background:var(--paper)"><div class="h"><i data-lucide="lightbulb"></i>' + T('今天找到的机会', 'Today’s opportunities') + '<span class="r">' + T('待办 2 · 观察中 7', 'To do 2 · Watching 7') + '</span></div>' + ''.join(cards) + '</div>' +
    '<div class="pnl" style="gap:10px;align-content:start;background:var(--paper)"><div class="h"><i data-lucide="chart-line" style="color:var(--pass)"></i>' + T('上线后的成效', 'After launch') + '<span class="r">' + T('第 7 / 28 天自动对比', 'Auto-checked on day 7 / 28') + '</span></div>' + stat +
      '<div class="tblw"><table class="tbl">' + tbl + '<tbody>' + ''.join(rows) + '</tbody></table></div></div>' +
  '</div>')
reach = win('chart-no-axes-column', 'Reach', '洞察', 'Insights', reach_body, '<span class="tag amber">' + T('15 件事等你处理', '15 items need you') + '</span>')

# ---------- 还没上线的三款：没有内页可取，按前三款的思路画——Agent 做了什么，留给人拍板的是哪几件 ----------
BOT = '<span class="ag"><i data-lucide="bot"></i></span>'
def av(zh, en): return '<span class="av">%s</span>' % T(zh, en)
def who_agent(zh, en): return '<span class="cell">' + BOT + '<span style="color:var(--agent-ink);font-weight:500">' + T(zh, en) + '</span></span>'
def who_person(zh, en, i_zh, i_en): return '<span class="cell">' + av(i_zh, i_en) + T(zh, en) + '</span>'
def stat4(items):
    return '<div class="stat" style="--n:%d">' % len(items) + ''.join(
        '<div><small>%s</small><b%s>%s</b><span class="d">%s</span></div>' % (k, (' class="%s"' % c) if c else (' style="color:var(--agent-ink)"' if c is None else ''), v, d)
        for k, v, d, c in items) + '</div>'
def decide(id_, zh, en, dzh, den, btns):
    # 紧凑排法：文字在左，按钮竖排在右，每张卡只占两三行高
    acts = ''.join('<span class="b sm%s" style="justify-content:center">%s</span>' % (' p' if i == 0 else '', T(*b)) for i, b in enumerate(btns))
    return ('<div class="sg on" style="grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:2px 12px;padding:9px 12px"><div style="display:grid;gap:2px;min-width:0">'
            '<b><span class="id" style="color:var(--muted);font-weight:400;font-size:12px">%s</span> %s</b><p>%s</p></div>'
            '<div style="display:grid;gap:5px">%s</div></div>') % (id_, T(zh, en), T(dzh, den), acts)
def table(head, rows):
    return ('<div class="tblw"><table class="tbl"><thead><tr>' + ''.join('<th>%s</th>' % T(*h) for h in head) + '</tr></thead><tbody>' +
            ''.join('<tr>' + ''.join(rows_i) + '</tr>' for rows_i in rows) + '</tbody></table></div>')
def td(x, cls=''): return '<td%s>%s</td>' % ((' class="%s"' % cls) if cls else '', x)
def tag(c, zh, en): return '<span class="tag %s">%s</span>' % (c, T(zh, en))
SPIN = '<span class="spin" style="width:10px;height:10px;border-width:1.5px"></span>'

# NocoSupport：夜里进来的工单，早上已经处理完——值班交接，只有超出授权的 3 件留给人
sup_body = (
  '<div class="sx-h"><div><h5>' + T('早上好，周航', 'Morning, Ethan') + '</h5><p>' + T('客服 Agent 夜间值班交接 · 23:00 – 08:00', 'Overnight handoff from the support agents · 11 pm – 8 am') + '</p></div></div>' +
  stat4([(T('夜里收到', 'Received overnight'), '47', T('邮件、表单与在线客服', 'Email, forms, and live chat'), ''),
         (T('Agent 已解决', 'Resolved by agents'), '35', T('常规咨询直接闭环', 'Routine requests closed'), 'ok'),
         (T('回复草稿待发', 'Drafts ready'), '9', T('上班后由你的团队发出', 'Your team sends them at 9 am'), None),
         (T('升级给你', 'Escalated to you'), '3', T('超出授权的才找你', 'Only what’s beyond policy'), 'warn')]) +
  '<div class="duo2" style="grid-template-columns:minmax(0,1fr) 420px;gap:14px;align-items:start">' +
    '<div style="display:grid;gap:8px"><div class="sx-sec" style="color:var(--agent-ink)"><i data-lucide="bot" style="color:var(--agent)"></i>' + T('客服 Agent 夜里处理的工单（节选）', 'Handled overnight by the support agents (excerpt)') + '</div>' +
      table([('工单', 'Ticket'), ('客户问题', 'Issue'), ('Agent 怎么处理', 'What the agent did'), ('结果', 'Result')], [
        [td('#2412', 'id'), td(T('月度报表导出超时', 'Monthly export times out'), 'w'), td(T('检索知识库，发去分批导出步骤，客户已确认', 'Found the KB fix, sent batch-export steps; confirmed'), 'w'), td(tag('green', '已解决', 'Resolved'))],
        [td('#2409', 'id'), td(T('SSO 登录账号被锁定', 'Locked out of SSO'), 'w'), td(T('核验身份后按授权流程解锁', 'Verified identity, unlocked per policy'), 'w'), td(tag('green', '已解决', 'Resolved'))],
        [td('#2405', 'id'), td(T('修改增值税发票抬头', 'Change invoice entity'), 'w'), td(T('核对资质，更新抬头并重开发票', 'Checked documents, reissued the invoice'), 'w'), td(tag('green', '已解决', 'Resolved'))],
        [td('#2403', 'id'), td(T('报表统计时区偏差', 'Report time zone is off'), 'w'), td(T('定位到账号时区设置，起草回复', 'Traced to account time zone; reply drafted'), 'w'), td(tag('violet', '草稿待发', 'Draft ready'))],
        [td('#2401', 'id'), td(T('申请新增 5 个子账号', 'Add 5 sub-accounts'), 'w'), td(T('已追问人员名单，等客户回复', 'Asked for the user list; waiting'), 'w'), td(tag('grey', '等客户', 'Waiting'))]]) +
    '</div>' +
    '<div class="pnl" style="gap:8px;align-content:start;background:var(--paper)"><div class="h"><i data-lucide="user-check" style="color:var(--human-ink)"></i>' + T('升级给你的 3 件', '3 escalated to you') + '<span class="r">' + T('都附好了依据', 'Context attached') + '</span></div>' +
      decide('#2381', '重复扣款退款 ¥3,200', 'Refund a ¥3,200 double charge', '超过自动退款额度 ¥1,000；Agent 已核对支付流水，确认重复扣款。', 'Above the ¥1,000 auto-refund limit; the agent matched the payment logs.', [('批准退款', 'Approve refund'), ('驳回', 'Decline')]) +
      decide('#2396', '投诉：两次延误交付', 'Complaint: two late deliveries', '客户要求补偿；Agent 起草了致歉信和延长 1 个月服务的方案。', 'Customer wants compensation; the agent drafted an apology and a 1-month extension.', [('查看草稿', 'Review draft'), ('改一改', 'Edit')]) +
      decide('#2399', '要求周末现场支持', 'Weekend on-site request', '超出合同 SLA；Agent 建议按次收费 ¥2,000。', 'Outside the contract SLA; the agent suggests a ¥2,000 one-off fee.', [('同意', 'Approve'), ('拒绝', 'Decline')]) +
    '</div>' +
  '</div>')
support = win('headset', 'Support', '值班交接', 'Handoff', sup_body, '<span class="tag violet">' + SPIN + T('客服 Agent 值班中', 'Support agents on duty') + '</span>')

# NocoProject：目标交给 Agent 拆解推进，风险提前冒出来——项目推进表 + Agent 发现的风险 + 等你验收的交付物
def prog(p):
    return '<span class="usage"><i style="--w:%d%%"></i><span>%d%%</span></span>' % (p, p)
proj_body = (
  '<div class="sx-h"><div><h5>' + T('东南亚出海 · 第 3 周', 'SEA Expansion · Week 3') + '</h5><p>' + T('目标：10 月底前签下 3 家渠道伙伴 · 负责人 王磊', 'Goal: sign 3 channel partners by end of October · Owner Leo Wang') + '</p></div><span class="r">' + tag('grey', '里程碑 2 / 5', 'Milestone 2 of 5') + '</span></div>' +
    table([('任务', 'Task'), ('执行', 'Owner'), ('进度', 'Progress'), ('截止', 'Due'), ('状态', 'Status')], [
      [td(T('当地竞品定价调研', 'Local competitor pricing'), 'w'), td(who_agent('调研 Agent', 'Research Agent')), td(prog(100)), td('10/08', 'id'), td(tag('green', '已完成', 'Done'))],
      [td(T('潜在代理商名单（20 家）', 'Distributor shortlist (20)'), 'w'), td(who_agent('调研 Agent', 'Research Agent')), td(prog(60)), td('10/12 → 10/14', 'id'), td(tag('red', '晚 2 天', '2 days late'))],
      [td(T('分销合作协议初稿', 'Distribution agreement draft'), 'w'), td(who_agent('文书 Agent', 'Docs Agent')), td(prog(100)), td('10/15', 'id'), td(tag('amber', '待你验收', 'Needs sign-off'))],
      [td(T('渠道政策与返点方案', 'Channel policy and rebates'), 'w'), td(who_person('王磊', 'Leo Wang', '王', 'L')), td(prog(30)), td('10/18', 'id'), td(tag('blue', '进行中', 'In progress'))],
      [td(T('首轮伙伴接洽邮件', 'First outreach emails'), 'w'), td(who_agent('文书 Agent', 'Docs Agent')), td(prog(0)), td('10/20', 'id'), td(tag('grey', '等名单', 'Blocked'))]]) +
    '<div class="duo2" style="gap:14px;align-items:start">' +
      '<div class="rvw"><div class="h"><i data-lucide="triangle-alert"></i>' + T('调研 Agent 提前发现风险', 'Research Agent flagged a risk') + '</div>' +
        '<div class="q" style="font-size:14px">' + T('代理商名单晚 2 天，会推迟 10/20 的首轮接洽', 'The shortlist is 2 days late and will push back outreach on 10/20') + '</div>' +
        '<ul><li>' + T('已确认 4 家，另外 16 家还在核实联系人', '4 confirmed; 16 still verifying contacts') + '</li><li>' + T('建议：先给已确认的 4 家发接洽邮件，其余并行补齐', 'Suggestion: email the 4 confirmed now, fill in the rest in parallel') + '</li></ul>' +
        '<div class="acts" style="margin-top:2px"><span class="b p sm">' + T('采纳调整', 'Apply change') + '</span><span class="b sm">' + T('查看影响', 'See impact') + '</span></div></div>' +
      decide('MKT-58', '待你验收：分销合作协议初稿', 'For your sign-off: agreement draft', '文书 Agent 标出 3 处需要你拍板的条款：独家区域、首年最低提货额、争议仲裁地。', 'Docs Agent flagged 3 clauses for you: exclusivity, first-year minimum, and governing law.', [('打开文档', 'Open draft'), ('退回修改', 'Request changes')]) +
    '</div>')
project = win('folder-kanban', 'Project', '东南亚出海', 'SEA Expansion', proj_body, '<span class="tag violet">' + SPIN + T('2 个 Agent 推进中', '2 agents working') + '</span>')

# NocoHR：新人入职前一天，一切已经就绪——入职 Agent 办好的清单，只有一项等人批；右边是 7×24 的制度问答
def check(zh, en, dzh, den, t):
    return ('<div style="display:grid;grid-template-columns:18px minmax(0,1fr) auto;gap:10px;align-items:start;padding:9px 0;border-top:1px solid var(--rule)">'
            '<i data-lucide="circle-check" style="width:16px;height:16px;margin-top:2px;color:var(--pass)"></i><div><b style="font-size:13px;font-weight:600">%s</b>'
            '<small style="display:block;font-size:11.5px;color:var(--muted)">%s</small></div><span class="id">%s</span></div>') % (T(zh, en), T(dzh, den), t)
def ask_me(i_zh, i_en, zh, en):
    return ('<div style="display:flex;justify-content:flex-end;gap:8px;align-items:flex-start"><span style="max-width:84%%;padding:7px 11px;border-radius:10px 10px 3px 10px;background:var(--paper-2);border:1px solid var(--rule);font-size:12.5px">%s</span>%s</div>') % (T(zh, en), av(i_zh, i_en))
def ask_ag(zh, en, extra):
    return ('<div style="display:flex;gap:8px;align-items:flex-start">' + BOT + '<div style="display:grid;gap:5px;max-width:88%%"><span style="padding:7px 11px;border-radius:3px 10px 10px 10px;background:var(--agent-tint);font-size:12.5px">%s</span>%s</div></div>') % (T(zh, en), extra)
hr_body = (
  '<div class="sx-h"><div><h5>' + T('赵一鸣 · 明天入职', 'Liam Zhao · starts tomorrow') + '</h5><p>' + T('研发部 · 高级后端工程师 · 导师 周航', 'Engineering · Senior Backend Engineer · Buddy Ethan Zhou') + '</p></div><span class="r">' + tag('green', '5 项已就绪', '5 ready') + tag('amber', '1 项等你', '1 needs you') + '</span></div>' +
  '<div class="duo2" style="grid-template-columns:minmax(0,1fr) 400px;gap:14px;align-items:start">' +
    '<div class="pnl" style="gap:0;align-content:start"><div class="h" style="padding-bottom:8px">' + BOT + '<span style="color:var(--agent-ink)">' + T('入职 Agent', 'Onboarding Agent') + '</span><span style="font-weight:400;color:var(--muted)">' + T('已办好', 'has handled') + '</span></div>' +
      check('合同与入职资料核对完成', 'Contract and paperwork checked', '身份证、学历、离职证明逐项核对', 'ID, degree, and release letter verified', '10-07') +
      check('企业邮箱、Git、VPN 账号已开通', 'Email, Git, and VPN accounts ready', '按研发岗位模板开通，权限与组内一致', 'Provisioned from the engineering template', '10-07') +
      check('门禁已录入，工位 B-12 已分配', 'Badge set up, desk B-12 assigned', '首日指引清单已发到个人邮箱', 'Day-one guide sent to his personal email', '10-08') +
      check('导师与首周日程已确认', 'Buddy and first-week plan confirmed', '周航确认带教；周一 9:30 欢迎会已发日历', 'Ethan confirmed; Monday 9:30 welcome sent', '10-09') +
      '<div class="sg on" style="margin-top:10px;gap:4px;padding:10px 12px"><b>' + T('开发机：标准 16G 内存不够用', 'Laptop: the standard 16 GB isn’t enough') + '</b><p>' + T('他要在本地跑多容器联调，需要高配开发机 ¥18,000；库房有 1 台现货，批准后今天就能配好。', 'He runs multi-container setups locally; a ¥18,000 high-spec laptop is in stock and can be set up today.') + '</p>' +
        '<div class="acts" style="margin-top:4px"><span class="b p sm">' + T('批准调配', 'Approve') + '</span><span class="b sm">' + T('维持标准配置', 'Keep standard') + '</span></div></div>' +
    '</div>' +
    '<div class="pnl" style="gap:10px;align-content:start;background:var(--paper)"><div class="h"><i data-lucide="messages-square"></i>' + T('制度问答 · 7×24', 'Policy Q&amp;A · 24/7') + '<span class="r">' + T('本月 214 问 · 转人工 9', '214 this month · 9 to HR') + '</span></div>' +
      ask_me('梅', 'M', '年假还剩几天？能和调休连着用吗？', 'How much leave do I have left? Can I combine it with comp days?') +
      ask_ag('你今年还剩 6 天年假、2 天调休，可以连着用。连休 5 天以上需提前 2 周提交申请。', 'You have 6 days of leave and 2 comp days left, and yes, you can combine them. Breaks over 5 days need 2 weeks’ notice.',
             '<div class="mini-chips"><span>' + T('来源：《休假管理制度》第 4 条', 'Source: Leave Policy §4') + '</span></div>') +
      ask_me('李', 'R', '想了解一下明年的调薪规则', 'How do raises work next year?') +
      ask_ag('薪酬问题涉及个人信息，已转给 HR 何晴，她今天内回复你。', 'Pay questions involve personal data, so I’ve passed this to Claire in HR. She’ll reply today.',
             '<div>' + tag('amber', '已转人工', 'Handed to HR') + '</div>') +
    '</div>' +
  '</div>')
hr = win('users', 'HR', '入职', 'Onboarding', hr_body, '<span class="tag violet">' + SPIN + T('入职与制度问答 Agent', 'Onboarding & policy agents') + '</span>')

tpls = ''.join('<template id="tpl-%s">%s</template>' % (k, v) for k, v in (('crm', crm), ('itam', itam), ('reach', reach), ('support', support), ('project', project), ('hr', hr)))
p = os.path.join(root, 'homepage.html')
s = open(p, encoding='utf-8').read()
s, n = re.subn(r'<!-- SOLTPL -->.*?<!-- /SOLTPL -->', lambda m: '<!-- SOLTPL -->' + tpls + '<!-- /SOLTPL -->', s, flags=re.S)
if not n:
    anchor = '<div class="apptabs" role="tablist" aria-label="Solutions" id="apptabs"></div>'
    assert s.count(anchor) == 1
    s = s.replace(anchor, anchor + '\n      <!-- SOLTPL -->' + tpls + '<!-- /SOLTPL -->')
open(p, 'w', encoding='utf-8').write(s)
print('templates', len(crm), len(itam), len(reach), len(support), len(project), len(hr))
