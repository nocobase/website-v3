# 第二批界面示意：NocoReach 数据源、NocoCRM 渠道与客户时间线、Studio 会话联动与发布、伙伴。
# 依赖 gen_wow.py（导入时会顺带重新生成前两批图）。
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_wow import *

CH = lambda icon: f'<span class="ag wf"><i data-lucide="{icon}"></i></span>'
DASH = ' style="background:transparent;box-shadow:inset 0 0 0 1px var(--rule-2)"'
def mc(items): return '<div class="mini-chips">' + ''.join(f'<span{"" if b else DASH}>{T(z, e)}</span>' for z, e, b in items) + '</div>'
def li(items): return '<ul>' + ''.join(f'<li>{T(z, e)}</li>' for z, e in items) + '</ul>'
WRAP = 'white-space:normal;overflow:visible'

# ======================= NocoReach：能接入的数据 =======================
cat = [
    ('chart-line', '网站分析', 'Web analytics',
     [('GA4', 'GA4', 1), ('Plausible', 'Plausible', 0), ('Umami', 'Umami', 0), ('Matomo', 'Matomo', 0), ('PostHog', 'PostHog', 0), ('百度统计', 'Baidu Tongji', 0)],
     [('找出流量和转化突然变化的页面与来源', 'Spot pages and sources whose traffic or conversion suddenly moved'), ('把关键事件下降拆到具体页面和步骤', 'Trace a drop in key events to the page and step')]),
    ('search', '搜索引擎', 'Search engines',
     [('Search Console', 'Search Console', 1), ('Google Trends', 'Google Trends', 1), ('关键词与排名', 'Keywords &amp; ranks', 1), ('Bing Webmaster', 'Bing Webmaster', 0), ('百度搜索资源平台', 'Baidu Webmaster', 0)],
     [('点击下降时，分清是排名、季节还是标题不匹配', 'When clicks drop, tell rank, season, and title mismatch apart'), ('找出排在 8–15 位、补一把就能上首页的页面', 'Find pages at positions 8–15 that one push could bring to page one')]),
    ('bot', 'AI 搜索', 'AI answers',
     [('ChatGPT', 'ChatGPT', 1), ('Google AI 概览', 'Google AI Overviews', 1), ('Perplexity', 'Perplexity', 0), ('Gemini', 'Gemini', 0), ('Copilot', 'Copilot', 0)],
     [('记录每个问题的回答提到了谁、引用了哪些网站', 'Record who each answer mentions and which sites it cites'), ('别人出现、你没有的问题，变成选题和对比页', 'Turn questions where others appear and you don’t into topics')]),
    ('file-text', '网站与文档', 'Site &amp; docs',
     [('站点地图与全站抓取', 'Sitemap &amp; crawl', 1), ('站点审计', 'Site audit', 1), ('Docusaurus', 'Docusaurus', 0), ('VitePress', 'VitePress', 0), ('WordPress', 'WordPress', 0), ('Ghost', 'Ghost', 0)],
     [('找出过期、单薄、缺语言版本的页面', 'Find stale, thin, or untranslated pages'), ('重复标题、死链、缺描述，整批交给技术修复', 'Batch duplicate titles, dead links, and missing descriptions into one fix')]),
    ('github', '开源项目与下载', 'Open source &amp; downloads',
     [('GitHub', 'GitHub', 1), ('npm', 'npm', 1), ('PyPI', 'PyPI', 1), ('Docker Hub', 'Docker Hub', 1), ('GitLab', 'GitLab', 0), ('Gitee', 'Gitee', 0)],
     [('Star、Fork、下载量的涨跌和来源：哪次发布、哪篇内容、哪个帖子带来了关注', 'Stars, forks, and downloads—their trends and sources: which release, post, or thread drove interest'), ('Issue 和讨论里反复出现的需求、用法和对比，变成选题和内容', 'Recurring needs, use cases, and comparisons in issues and discussions become topics and content')]),
    ('messages-square', '社区', 'Community',
     [('Discourse', 'Discourse', 1), ('Discord', 'Discord', 1), ('Slack', 'Slack', 1), ('Reddit', 'Reddit', 1), ('Hacker News', 'Hacker News', 1), ('GitHub Discussions', 'GitHub Discussions', 0), ('Stack Overflow', 'Stack Overflow', 0)],
     [('读完文档和相关 Issue，给没人回的问题起草回复', 'Read the docs and issues, then draft replies to unanswered questions'), ('每周汇总高频问题，缺文档的直接开任务', 'Summarize recurring questions weekly; open tasks where docs are missing')]),
    ('share-2', '社交与内容平台', 'Social &amp; content',
     [('X', 'X', 1), ('YouTube', 'YouTube', 1), ('LinkedIn', 'LinkedIn', 0), ('微信公众号', 'WeChat', 0), ('知乎', 'Zhihu', 0), ('B 站', 'Bilibili', 0), ('小红书', 'Xiaohongshu', 0), ('Product Hunt', 'Product Hunt', 0)],
     [('跟踪提及和语气，负面讨论第一时间提醒', 'Track mentions and tone; flag negative threads right away'), ('表现好的内容，改写成适合其他平台的版本', 'Adapt content that performs well for other platforms')]),
    ('swords', '竞品', 'Competitors',
     [('竞品网站与博客', 'Competitor sites &amp; blogs', 1), ('竞品 GitHub', 'Competitor GitHub', 1), ('竞品搜索流量', 'Competitor search traffic', 1), ('价格页', 'Pricing pages', 0), ('G2 · Capterra', 'G2 · Capterra', 0)],
     [('每条变化都附上它对你意味着什么', 'Every change comes with what it means for you'), ('对比页过时了，直接开任务更新', 'When a comparison page falls behind, open a task to update it')]),
    ('handshake', '线索与收入', 'Leads &amp; revenue',
     [('NocoCRM', 'NocoCRM', 0), ('HubSpot', 'HubSpot', 0), ('Salesforce', 'Salesforce', 0), ('Stripe', 'Stripe', 0), ('产品注册数据', 'Product sign-ups', 0), ('邮件订阅', 'Newsletter', 0)],
     [('不只看流量：哪些页面和内容带来线索与付费', 'Beyond traffic: which pages and content bring leads and revenue'), ('带来成交的主题优先做，效果对比加上线索数', 'Prioritize topics that close deals; add leads to the before/after')]),
]
cat_html = '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">' + ''.join(
    f'<div class="pnl" style="gap:9px;align-content:start"><div class="h">{ic(i)}{T(a, b)}</div>{mc(p)}'
    f'<div class="rvw" style="padding:8px 10px;gap:4px;border-left-width:2px"><div class="h" style="font-size:11.5px">{ic("sparkles")}{T("AI 在这里做什么", "What AI does here")}</div>{li(w)}</div></div>'
    for i, a, b, p, w in cat) + '</div>'
save('reachCatalog', solo(
    f'<div class="sx-h"><div><h5>{T("可以接入的数据", "Data you can connect")}</h5><p>{T("常用平台都能连接。连接之后，Agent 每天读一遍，找出值得做的事。", "Connect the platforms you already use. Agents read them every day and find what’s worth doing.")}</p></div>'
    f'<span class="r"><span class="mini-chips"><span>{T("内置连接", "Built-in")}</span><span{DASH}>{T("通过 MCP 或 API 接入", "Via MCP or API")}</span></span></span></div>'
    f'{cat_html}'
    f'<div class="sg" style="display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center"><span style="color:var(--agent)">{ic("plug")}</span>'
    f'<p>{T("没有你用的平台？接一个 MCP 服务器、填一个 API，或者上传 CSV；也可以在 Studio 里让 Coding Agent 写一个连接器——NocoReach 开源，连接器就是你仓库里的代码。", "Don’t see your platform? Add an MCP server, an API, or a CSV—or have a coding agent in Studio write a connector. NocoReach is open source; connectors are code in your repo.")}</p>'
    f'<span class="b sm">{ic("plus")}{T("添加数据源", "Add a source")}</span></div>'))

sig = [('Search Console', 'Search Console', '安装页点击 31 → 12，排名没变', 'Install page clicks 31 → 12, rank unchanged', '标题不再匹配“docker compose”类查询', 'Title no longer matches “docker compose” queries', '改进现有页面', 'Improve page', '搜索点击', 'Clicks'),
       ('GA4', 'GA4', '/pricing 浏览 2,560，关键事件率只有站均的 1/4', '/pricing: 2,560 views, a quarter of the site’s event rate', '价格页没有通往试用的入口', 'No path from pricing to a trial', '改进现有页面', 'Improve page', '关键事件率', 'Event rate'),
       ('AI 搜索', 'AI search', '“best open source CRM” 的回答引用 3 家竞品，没有你', '“best open source CRM” cites 3 competitors, not you', '缺一篇被引用站点常见的对比页', 'Missing the kind of comparison page AI cites', '写博客', 'Blog post', '回答里是否出现', 'Mentioned in answers'),
       ('GitHub', 'GitHub', '本周新增 Star 少了 37%，Fork 和 npm 下载却在涨', 'New stars down 37% this week while forks and npm downloads rise', '用的人在增加，新来的人在减少：最近没有新内容带来访问', 'Usage is growing but newcomers are falling—nothing new is driving visits', '选题与大纲', 'Topic and outline', '新增 Star', 'New stars'),
       ('GitHub Issues', 'GitHub Issues', '一个月里 9 个 Issue 问怎么接企业微信', '9 issues in a month ask how to connect WeCom', '有真实需求，搜索里也有人在找，但你没有内容', 'Real demand that people also search for, and you have no content', '写博客', 'Blog post', '搜索点击与 Star', 'Clicks &amp; stars'),
       ('论坛', 'Forum', '5 个主题 3 天没人回复', '5 topics unanswered for 3 days', '其中 3 个文档里已有答案', '3 are answered in the docs', '社区回复草稿', 'Community replies', '首次回复时间', 'Time to first reply'),
       ('竞品', 'Competitors', 'Budibase 上线 AI 功能页', 'Budibase launched an AI feature page', '你的对比页还是去年的功能表', 'Your comparison page lists last year’s features', '竞品对比', 'Competitor comparison', '对比页点击', 'Comparison clicks'),
       ('GitHub Releases', 'GitHub Releases', 'v2.2.26 发布', 'v2.2.26 released', '8 个语言站的更新说明还没写', 'Release notes missing on 8 language sites', '写更新说明', 'Release notes', '上线时间', 'Time to publish'),
       ('站点审计', 'Site audit', '411 页描述太短', '411 pages with short descriptions', '来自同一个模板，一次就能修好', 'One template causes all of them', '技术修复', 'Technical fix', '收录与点击', 'Indexing &amp; clicks')]
sig_rows = ''.join(f'<tr><td><b style="font-weight:600">{T(a, b)}</b></td><td class="w">{T(c, d)}</td><td class="w"><span style="color:var(--agent-ink)">{T(e, f)}</span></td><td>{tag("violet", g, h)}</td><td style="color:var(--muted)">{T(i, j)}</td></tr>' for a, b, c, d, e, f, g, h, i, j in sig)
save('reachSignalMap', solo(
    f'<div class="sx-h"><div><h5>{T("数据怎么变成工作", "How data becomes work")}</h5><p>{T("每个信号都写清：来自哪里、AI 怎么判断、交给哪个剧本、上线后看什么。", "Every signal says where it came from, how AI read it, which playbook takes it, and what to watch after release.")}</p></div></div>'
    f'<div class="tblw"><table class="tbl"><thead><tr><th>{T("来源", "Source")}</th><th>{T("发现了什么", "What changed")}</th><th>{T("AI 的判断", "AI’s read")}</th><th>{T("剧本", "Playbook")}</th><th>{T("上线后看", "Then watch")}</th></tr></thead><tbody>{sig_rows}</tbody></table></div>'))

hl = [('Search Console', 'Search Console', '数据比今天晚 2 天，这是 Google 的正常延迟；分析已按截至日期对齐。', 'Data runs 2 days behind, which is normal for Google; the analysis aligns to that date.', tag('green', '正常', 'OK')),
      ('GA4', 'GA4', '10-12 起 sign_up 事件不再上报。Agent 对照最近的部署，判断是埋点脚本被删，已开技术修复任务 T-31。', 'sign_up stopped reporting on Oct 12. The agent matched it to a deploy that removed the tag and opened fix task T-31.', tag('amber', '已开任务', 'Task opened')),
      ('Discord', 'Discord', '授权已过期。重新授权后，缺的 6 天数据会自动补齐。', 'Authorization expired. Reconnect and the missing 6 days backfill automatically.', '<span class="b sm">' + T('重新授权', 'Reconnect') + '</span>'),
      ('Reddit', 'Reddit', '接口限流，已自动改为每 6 小时同步一次。', 'Rate-limited; sync moved to every 6 hours automatically.', tag('green', '正常', 'OK')),
      ('关键词与排名', 'Keywords &amp; ranks', '本月用量 82%。50 个关键词里有 9 个长期没有曝光，建议移出。', '82% of this month’s quota used. 9 of 50 keywords never get impressions—suggest dropping them.', tag('violet', '有建议', 'Suggestion'))]
save('reachHealth', solo(
    f'<div class="sx-h"><div><h5>{T("数据健康", "Data health")}</h5><p>{T("Agent 每天先检查数据本身，再做分析。", "Agents check the data itself before analyzing it.")}</p></div><span class="r">{tag("grey", "今天 06:40", "Today 06:40")}</span></div>'
    '<div class="rows">' + ''.join(f'<div style="grid-template-columns:minmax(0,1fr) auto"><b>{T(a, b)}</b><small style="grid-column:1;{WRAP}">{T(c, d)}</small><span style="grid-row:1/3;grid-column:2">{r}</span></div>' for a, b, c, d, r in hl) + '</div>'))

# ======================= NocoCRM：渠道与客户时间线 =======================
tlc = [
    ('10-08', CH('globe'), T('<b>网站表单</b>李总：想了解企业版，40 家门店，需要私有化部署', '<b>Web form</b> Mr. Li: interested in Enterprise, 40 stores, needs self-hosting'), '', tag('grey', '表单', 'Form')),
    ('10-08', AGT('radar'), T('<b>线索跟进</b>研究了公司和来源，评为 A 级，分配给陈思', '<b>Lead follow-up</b> researched the company and source, graded A, routed to Ava'), T('依据：门店规模、官网招聘、已有试用账号', 'Basis: store count, careers page, existing trial account'), AI('A 级', 'Grade A')),
    ('10-08', YOU('陈', 'A'), T('<b>你</b> 改了两句，发出首封邮件', '<b>You</b> edited two lines and sent the first email'), T('草稿由 Agent 起草，从你的邮箱发出', 'Drafted by the agent, sent from your mailbox'), tag('grey', '邮件', 'Email'), True),
    ('10-09', CH('message-circle'), T('<b>WhatsApp</b>李总：下周三能来门店看一下吗？顺便讲讲私有化。', '<b>WhatsApp</b> Mr. Li: can you visit a store next Wednesday and cover self-hosting?'), T('Agent 建好周三拜访任务，回复已起草', 'Agent booked the Wednesday visit and drafted a reply'), tag('grey', 'WhatsApp', 'WhatsApp')),
    ('10-10', CH('mail'), T('<b>邮件</b>预算 Q4 批；需要 SSO 和审计日志；也在看另一家', '<b>Email</b> Budget approved in Q4; needs SSO and audit logs; also evaluating another vendor'), T('提取 3 条事实写入商机，附原文；预计成交日与人填的 Q3 冲突，交给你决定', '3 facts written to the deal with quotes; close date conflicts with your Q3—sent to you'), AI('3 条事实', '3 facts')),
    ('10-15', CH('calendar'), T('<b>会议</b>门店评审会，上传了录音', '<b>Meeting</b> store review; recording uploaded'), T('任务助手写好纪要和 3 个下一步', 'Task assistant wrote the notes and 3 next steps'), tag('grey', '日历', 'Calendar')),
    ('10-16', AGT('stamp'), T('<b>审批助手</b>15% 折扣：建议有条件同意', '<b>Approval review</b> 15% discount: approve on conditions'), T('销售经理按建议批准', 'The sales manager approved as recommended'), tag('green', '已批准', 'Approved')),
    ('10-21', AGT('bell'), T('<b>商机跟进</b>合同发出 3 天没有回音，起草了一条提醒', '<b>Deal follow-up</b> no reply 3 days after the contract—drafted a nudge'), T('超过 24 小时，选用已审核的 WhatsApp 模板', 'Past 24 hours, so it used an approved WhatsApp template'), tag('grey', 'WhatsApp', 'WhatsApp')),
    ('10-24', YOU('陈', 'A'), T('<b>你</b> 标记赢单，填写合同日期', '<b>You</b> marked it won and entered the contract date'), '', tag('green', '赢单', 'Won'), True),
]
facts = [('预算', 'Budget', 'Q4 批', 'Q4 approval', '10-10 邮件原文', 'Oct 10 email, quoted'), ('需求', 'Needs', 'SSO、审计日志', 'SSO, audit logs', '10-10 邮件原文', 'Oct 10 email, quoted'), ('决策人', 'Decision maker', '李总 · 运营副总', 'Mr. Li · VP Ops', '邮件签名', 'Email signature'), ('门店数', 'Stores', '40', '40', '网站表单', 'Web form')]
facts_html = '<div class="ck2">' + ''.join(f'<div style="grid-template-columns:minmax(0,1fr) auto"><b>{T(a, b)} · {T(c, d)}</b><small style="grid-column:1">{T(e, f)}</small><span class="aisg" style="grid-row:1/3;grid-column:2">AI</span></div>' for a, b, c, d, e, f in facts) + '</div>'
save('crmTimeline', solo(
    f'<div class="sx-h"><div><h5>{T("华岳酒店 · 门店运营平台", "Huayue Hotels · Store ops platform")}</h5><p>{T("客户时间线：表单、邮件、WhatsApp、会议和审批都在这里", "Account timeline: forms, email, WhatsApp, meetings, and approvals in one place")}</p></div><span class="r">{tag("green", "赢单 · ¥ 420,000", "Won · ¥ 420,000")}</span></div>'
    f'<div class="duo2" style="grid-template-columns:minmax(0,1fr) 300px;align-items:start"><div class="tl">' + ''.join(tl_row(*r) for r in tlc) + '</div>'
    f'<div style="display:grid;gap:10px"><div class="rvw"><div class="h">{ic("sparkles")}{T("这家客户现在的情况", "Where this account stands")}</div><p style="font-size:12.5px;color:var(--ink-2)">{T("合同已签，首期 10 家门店 11 月上线。李总关心 SSO 对接进度，下次沟通前确认 IT 联系人。", "Signed; the first 10 stores go live in November. Mr. Li cares about SSO—confirm the IT contact before the next call.")}</p><small style="font-size:11px;color:var(--muted)">{T("10-24 更新 · 依据 14 条往来", "Updated Oct 24 · from 14 interactions")}</small></div>'
    f'<div class="sx-sec">{T("AI 写入的字段", "Fields written by AI")}</div>{facts_html}'
    f'<div class="sx-sec">{T("往来", "Interactions")}</div><div class="kv" style="--n:3"><div><small>{T("邮件", "Email")}</small><b>8</b></div><div><small>WhatsApp</small><b>23</b></div><div><small>{T("会议", "Meetings")}</small><b>2</b></div></div></div></div>'))

mails = [('周晓 · Kestrel', 'Ethan Zhou · Kestrel', 'Re: 部署方案与 SLA', 'Re: Deployment plan &amp; SLA', '10:42', 1), ('李总 · 华岳酒店', 'Mr. Li · Huayue', '预算与需求', 'Budget and requirements', '09:15', 0), ('Ahmed · Gulf Trading', 'Ahmed · Gulf Trading', 'Quotation request', 'Quotation request', T('昨天', 'Yday'), 0), ('林佳 · 明川教育', 'Lina Park · Mingchuan', T('3 天未回复', 'No reply in 3 days'), T('3 天未回复', 'No reply in 3 days'), T('周一', 'Mon'), 0)]
mail_list = '<div class="rows">' + ''.join(f'<div style="grid-template-columns:minmax(0,1fr) auto{";background:var(--brand-tint)" if on else ""}"><b>{T(a, b)}</b><small style="grid-column:1">{T(c, d)}</small><time style="grid-column:2">{t}</time></div>' for a, b, c, d, t, on in mails) + '</div>'
save('crmMail', solo(
    f'<div class="sx-h"><h5>{T("邮箱", "Mailbox")}</h5><span class="r"><span class="seg"><span class="on">{T("与客户的往来", "With customers")}</span><span>{T("全部", "All")}</span></span></span></div>'
    f'<div class="duo2" style="grid-template-columns:190px minmax(0,1fr);align-items:start">{mail_list}<div style="display:grid;gap:10px">'
    f'<div class="pnl"><div class="h"><span class="av">{T("李", "L")}</span>{T("李总 · 华岳酒店", "Mr. Li · Huayue Hotels")}<span class="r">{T("已关联商机", "Linked deal")}</span></div><p>{T("预算 Q4 批下来。我们需要 SSO 和审计日志，另外也在看另一家的方案……", "Budget gets approved in Q4. We need SSO and audit logs, and we’re also looking at another vendor…")}</p></div>'
    f'<div class="rvw" style="padding:10px 12px"><div class="h">{ic("sparkles")}{T("Agent 从这封邮件读到", "What the agent read")}</div><div class="mini-chips"><span>{T("预算时间：Q4", "Budget: Q4")}</span><span>{T("需求：SSO、审计日志", "Needs: SSO, audit logs")}</span><span>{T("在比较竞品", "Evaluating a competitor")}</span></div>'
    f'<div class="draft" style="background:var(--human-tint)"><small>{T("需要你决定", "Needs your call")}</small>{T("预计成交日你填的是 Q3，客户说预算 Q4 才批。改成 Q4？", "You set the close date to Q3; the customer says budget lands in Q4. Change it?")}</div></div>'
    f'<div class="cmsg"><div class="ai-draft" style="max-width:100%"><small>{ic("sparkles")}{T("回复草稿 · 已存入你的草稿箱", "Draft reply · saved to your drafts")}</small>{T("李总您好，SSO 和审计日志都在企业版里，附上对接说明。另外整理了一页对比，方便您内部评估……", "Hi Mr. Li—SSO and audit logs are both in Enterprise; the integration guide is attached, plus a one-page comparison for your evaluation…")}</div></div>'
    f'<div class="acts" style="margin:0"><span class="b p sm">{T("改成 Q4", "Change to Q4")}</span><span class="b sm">{T("打开草稿", "Open draft")}</span><span class="note">{T("使用你的签名和模板", "Uses your signature and templates")}</span></div></div></div>'))

wa_list = [('李总', 'Mr. Li', '华岳酒店 · 等你回复', 'Huayue · awaiting you', '10:42', 1), ('+971 50 ••• 218', '+971 50 ••• 218', '未关联 · AI 已识别', 'Unlinked · AI matched', '10:05', 0), ('周晓', 'Ethan Zhou', 'Kestrel · 已回复', 'Kestrel · replied', T('昨天', 'Yday'), 0), ('王思', 'Sienna Wang', '超过 24 小时', 'Past 24 hours', T('周一', 'Mon'), 0)]
wa_rows = '<div class="rows">' + ''.join(f'<div style="grid-template-columns:minmax(0,1fr) auto{";background:var(--brand-tint)" if on else ""}"><b>{T(a, b)}</b><small style="grid-column:1">{T(c, d)}</small><time style="grid-column:2">{t}</time></div>' for a, b, c, d, t, on in wa_list) + '</div>'
save('crmWhatsApp', solo(
    f'<div class="sx-h"><h5>WhatsApp</h5><span class="r">{tag("green", "销售团队号码 · 已连接", "Sales number · connected")}</span></div>'
    f'<div class="duo2" style="grid-template-columns:190px minmax(0,1fr);align-items:start"><div style="display:grid;gap:8px">{wa_rows}'
    f'<div class="sg" style="padding:9px 11px"><p style="font-size:11.5px"><b style="font-size:12px">+971 50 ••• 218</b><br>{T("名片照片里是 Ahmed · Gulf Trading 采购经理", "The card photo shows Ahmed, purchasing at Gulf Trading")}</p><div class="acts" style="margin:0;gap:6px"><span class="b p sm">{T("新建线索", "New lead")}</span></div></div></div>'
    f'<div class="pnl"><div class="h"><span class="av">{T("李", "L")}</span>{T("李总 · 华岳酒店", "Mr. Li · Huayue Hotels")}<span class="r">{T("已关联商机", "Linked deal")}</span></div><div class="cmsg">'
    f'<div class="in">{ic("mic")} {T("语音 0:42 · 已转文字：下周三下午方便来门店吗？想顺便听听私有化怎么部署。", "Voice 0:42 · transcribed: could you come by a store next Wednesday afternoon? We’d like to hear how self-hosting works.")}<br><small>10:40</small></div>'
    f'<div class="in">{T("另外，合同能不能按季度付款？", "Also, can we pay the contract quarterly?")}<br><small>10:42</small></div>'
    f'<div class="ai-draft"><small>{ic("sparkles")}{T("商机跟进起草 · 待你确认", "Drafted by deal follow-up · needs you")}</small>{T("没问题，周三 14:00 到。私有化部署方案提前发您。季度付款我跟财务确认后答复您。", "Sure—Wednesday 2 pm. I’ll send the self-hosting plan ahead. On quarterly payments, I’ll check with finance and get back to you.")}</div></div>'
    f'<div class="ck2"><div><span class="bx on"></span><b>{T("新建任务：周三 14:00 门店拜访", "Task: Wed 2 pm store visit")}</b><small>{T("任务助手当天早上准备要点", "Prep notes the morning of")}</small></div><div><span class="bx"></span><b>{T("付款条件审批：按季度付款", "Approval: quarterly payments")}</b><small>{T("超出标准条款，需要销售经理审批", "Outside standard terms—needs the sales manager")}</small></div></div>'
    f'<div class="acts" style="margin:0"><span class="b p sm">{T("发送并执行勾选项", "Send &amp; apply")}</span><span class="b sm">{T("修改", "Edit")}</span></div></div></div>'))

# Studio 的首屏、我的 Agent、Agent 团队、技能见文件末尾

# ======================= Studio：发布 =======================
SHIELD = f'<span style="color:var(--human-ink)">{ic("shield-check")}</span>'
envs = (f'<div class="flow" style="--n:3">'
    f'<div><span class="st"><span class="bal">1</span>{T("预览 · 每个 PR 一个", "Preview · one per PR")}</span><div class="pnl" style="gap:8px">'
    f'<div class="ck2"><div style="grid-template-columns:minmax(0,1fr) auto"><b>#221 {T("客户分级", "Customer tiers")}</b><small style="grid-column:1">CRM-135 · a1b2c3d</small>{tag("green", "运行中", "Running")}</div><div style="grid-template-columns:minmax(0,1fr) auto"><b>#223 {T("报价单导出", "Quote export")}</b><small style="grid-column:1">{T("10 分钟没人访问，已休眠", "Idle 10 min, asleep")}</small>{tag("grey", "休眠", "Asleep")}</div></div>'
    f'<p style="font-size:11.5px;color:var(--muted)">{T("CI 随 PR 创建，合并或关闭后连同数据删除", "Created by CI with the PR; removed with its data on merge or close")}</p></div></div>'
    f'<div><span class="st"><span class="bal">2</span>{T("预发", "Staging")}</span><div class="pnl" style="gap:8px"><div class="h">1.8.0-rc.2<span class="r">a1b2c3d</span></div>'
    f'<div class="kv" style="--n:2"><div><small>{T("包含任务", "Tasks")}</small><b>6</b></div><div><small>{T("已运行", "Running for")}</small><b>{T("46 小时", "46 h")}</b></div></div>'
    f'<div class="rvw" style="padding:8px 10px"><div class="h" style="font-size:11.5px">{ic("activity")}{T("运维 Agent", "Ops agent")}</div><p style="font-size:12px">{T("没有新增错误；2 个数据迁移已在有数据的环境里跑过。", "No new errors; both migrations ran against real data.")}</p></div></div></div>'
    f'<div><span class="st hu-s"><span class="bal">3</span>{T("生产 · 受保护", "Production · protected")}</span><div class="pnl" style="gap:8px"><div class="h">{SHIELD}1.7.3<span class="r">{T("10-09 上线", "Live since Oct 9")}</span></div>'
    f'<div class="sg on" style="padding:9px 11px"><b style="font-size:12.5px">{T("发布请求：1.8.0", "Release request: 1.8.0")}</b><p style="font-size:11.5px">{T("与预发同一份镜像 · 等王磊、陈思批准", "Same image as staging · waiting for Leo or Ava")}</p></div>'
    f'<p style="font-size:11.5px;color:var(--muted)">{T("Agent 不能直接发布到受保护的环境，只能提出请求", "Agents can’t deploy here—only request")}</p></div></div></div>')
pend = [('CRM-135', '客户分级与负责人变更审批', 'Customer tiers and owner-change approval', '预发 ✓ a1b2c3d', 'Staging ✓ a1b2c3d'), ('CRM-141', '报价单导出模板', 'Quote export template', '预发 ✓ a1b2c3d', 'Staging ✓ a1b2c3d'), ('CRM-152', '导入时按手机号去重', 'Import de-dup by phone', '已合并 · 还没进预发', 'Merged · not on staging yet')]
pend_rows = ''.join(f'<tr><td class="id">{i}</td><td class="w">{T(a, b)}</td><td>{tag("green" if "✓" in c else "grey", c, d)}</td></tr>' for i, a, b, c, d in pend)
hist = [('1.7.3', T('10-09 · 王磊批准', 'Oct 9 · approved by Leo'), tag('green', '运行中', 'Live')), ('1.7.2', T('10-02 · 回滚到 1.7.1 后修复再发', 'Oct 2 · rolled back, fixed, re-released'), tag('grey', '已替换', 'Replaced')), ('1.7.1', T('09-26 · 陈思批准', 'Sep 26 · approved by Ava'), tag('grey', '已替换', 'Replaced'))]
hist_rows = ''.join(f'<tr><td class="id">{v}</td><td class="w">{w}</td><td>{t}</td><td><span class="b sm">{T("回滚到此版", "Roll back")}</span></td></tr>' for v, w, t in hist)
save('studioEnvs', bare('git-pull-request', 'Base Studio', '发布 · NocoCRM', 'Releases · NocoCRM',
    f'<div class="sx-h"><div><h5>NocoCRM</h5><p>{T("仓库 northwind/nococrm · 3 个环境 · CI 已配置", "Repo northwind/nococrm · 3 environments · CI configured")}</p></div><span class="r"><span class="b sm">{ic("settings-2")}{T("变量", "Variables")}</span><span class="b sm">{ic("scroll-text")}{T("日志", "Logs")}</span></span></div>'
    f'{envs}'
    f'<div class="duo2"><div style="display:grid;gap:8px"><div class="sx-sec">{T("已合并、未发布到生产", "Merged, not in production")}<span class="r">6</span></div><div class="tblw"><table class="tbl"><tbody>{pend_rows}</tbody></table></div></div>'
    f'<div style="display:grid;gap:8px"><div class="sx-sec">{T("生产的发布记录", "Production history")}</div><div class="tblw"><table class="tbl"><tbody>{hist_rows}</tbody></table></div></div></div>', user='王'))

save('studioReleaseReq', solo(
    f'<div class="sx-h"><div><h5>{T("发布 NocoCRM 1.8.0 到生产", "Release NocoCRM 1.8.0 to production")}</h5><p>{T("项目经理提出 · 等你批准", "Requested by the project manager · needs your approval")}</p></div><span class="r">{tag("amber", "等你处理", "Waiting for you")}</span></div>'
    f'<div class="kv"><div><small>{T("版本", "Version")}</small><b>1.8.0</b></div><div><small>{T("镜像", "Image")}</small><b>sha256:9f2c…</b></div><div><small>{T("提交", "Commit")}</small><b>a1b2c3d</b></div><div><small>CI</small><b style="color:var(--pass-ink)">{T("构建通过", "Passed")}</b></div></div>'
    f'<div class="mini-chips"><span>CRM-135</span><span>CRM-141</span><span>CRM-144</span><span>CRM-147</span><span>CRM-149</span><span>CRM-150</span></div>'
    f'<div class="rvw"><div class="h">{ic("sparkles")}{T("发布前检查 · 运维 Agent", "Pre-release check · ops agent")}</div><ul>'
    f'<li>{T("与预发运行的是同一份镜像，预发 46 小时没有新增错误", "Same image staging has run for 46 hours with no new errors")}</li>'
    f'<li>{T("2 个数据迁移都可回退，已在预发的真实数据上验证", "Both migrations are reversible and verified on staging data")}</li>'
    f'<li>{T("生产需要的 14 个变量都已设置", "All 14 variables production needs are set")}</li>'
    f'<li>{T("建议 22:00 后发布，那时访问量最低；发布前先备份数据库", "Release after 22:00 when traffic is lowest; back up the database first")}</li></ul>'
    f'<div class="draft"><small>{T("发布说明 · 按 6 个任务起草", "Release notes · drafted from 6 tasks")}</small>{T("新增客户分级与负责人变更审批；报价单可按模板导出；修复导入时日期格式错误……", "Adds customer tiers and owner-change approval; quotes export from templates; fixes date parsing on import…")}</div></div>'
    f'<div class="acts" style="margin:0"><span class="b p sm">{T("批准发布", "Approve")}</span><span class="b sm">{ic("clock")}{T("22:00 发布", "Release at 22:00")}</span><span class="b sm">{T("驳回", "Reject")}</span><span class="note">{T("出问题可一键回到 1.7.3", "One click back to 1.7.3 if needed")}</span></div>'))

# ======================= 伙伴：一位顾问的一周 =======================
pw = [('华岳酒店', 'Huayue Hotels', 'NocoCRM · 门店分级与巡店', 'NocoCRM · store tiers &amp; visits', 'amber', '等你验收', 'To accept'),
      ('蓝湾医疗', 'Lanwan Health', 'NocoITAM · 二期上线', 'NocoITAM · phase 2 release', 'amber', '等你批准发布', 'Approve release'),
      ('明川教育', 'Mingchuan Edu', T('招生系统 · 从 Core 开发', 'Admissions · built on Core'), '', 'violet', 'Agent 开发中', 'Agents building'),
      ('森和精工', 'Senhe Precision', T('质检看板 · 运维与升级', 'QA dashboard · ops &amp; upgrades'), '', 'green', '升级方案已就绪', 'Upgrade plan ready')]
pw_rows = '<div class="rows">' + ''.join(f'<div style="grid-template-columns:minmax(0,1fr) auto"><b>{T(a, b)}</b><small style="grid-column:1">{c if not d else T(c, d)}</small><span style="grid-row:1/3;grid-column:2">{tag(e, f, g)}</span></div>' for a, b, c, d, e, f, g in pw) + '</div>'
save('partnerWeek', solo(
    f'<div class="sx-h"><div><h5>{T("王磊 · 本周", "Leo Wang · this week")}</h5><p>{T("一位实施顾问，4 个客户项目同时推进", "One consultant, four client projects at once")}</p></div></div>'
    f'<div class="stat" style="--n:3"><div><small>{T("Agent 完成的步骤", "Steps done by agents")}</small><b style="color:var(--agent-ink)">146</b></div><div><small>{T("你做的决定", "Your decisions")}</small><b class="warn">19</b></div><div><small>{T("上线的版本", "Releases shipped")}</small><b class="ok">3</b></div></div>'
    f'{pw_rows}'))

# ======================= Studio：首屏「我的任务」 =======================
SB_ITEMS = [('circle-user', '我的任务', 'My Tasks', '2'), ('message-square', '我的 Agent', 'My Agent', ''), ('layout-dashboard', '仪表盘', 'Dashboard', ''),
            ('g', '开发', 'Build'), ('list-checks', '任务', 'Tasks', ''), ('folder', '项目', 'Projects', ''), ('book-open', '知识库', 'Knowledge', ''),
            ('g', '测试', 'Testing'), ('clipboard-list', '测试计划', 'Test plans', ''), ('flask-conical', '功能与用例', 'Features &amp; cases', ''),
            ('g', '发布', 'Release'), ('boxes', '应用', 'Apps', ''), ('server', '部署环境', 'Environments', ''),
            ('g', 'Agent 团队', 'Agent team'), ('bot', 'Agents', 'Agents', ''), ('monitor', '运行环境', 'Runtimes', ''), ('sparkles', '技能', 'Skills', '')]
def ssb(active):
    h = '<aside class="sb"><div class="brand"><img src="assets/logo.png" alt=""><span>Studio</span></div>'
    for it in SB_ITEMS:
        if it[0] == 'g': h += f'<div class="grp">{T(it[1], it[2])}</div>'; continue
        i, z, e, c = it
        h += f'<a class="it{" on" if z == active else ""}">{ic(i)}{T(z, e)}{f"<em>{c}</em>" if c else ""}</a>'
    return h + '</aside>'
def mrow(si, tid, zh, en, pj, wz, we, kind='', on=False):
    if kind == 'wait': w = f'<span class="w">{T(wz, we)}</span>'
    elif kind == 'run': w = f'<span class="spin"></span><span style="color:var(--agent-ink)">{T(wz, we)}</span>'
    else: w = f'<span>{T(wz, we)}</span>'
    return f'<div class="mr{" on" if on else ""}"><span class="si {si}"></span><div class="mc"><div class="m1"><span class="id">{tid}</span><b>{T(zh, en)}</b></div><div class="m2"><span class="pj">{pj}</span>·{w}</div></div></div>'
PM = f'<span class="ag wf">{ic("workflow")}</span>'
AGI = f'<span class="ag">{ic("bot")}</span>'
lst = (f'<div class="mtl"><div class="mg you">{T("等你处理", "Waiting for you")}<span class="n">2</span></div>'
    + mrow('review', 'CRM-135', '客户分级与负责人变更审批', 'Customer tiers &amp; owner approval', 'NocoCRM', '等你验收', 'Ready to accept', 'wait')
    + mrow('blocked', 'SUP-88', '夜间工单自动分派', 'Night ticket routing', 'NocoSupport', '等你回答：夜间工单交给哪个班组？', 'Question: which shift takes night tickets?', 'wait')
    + f'<div class="mg" style="color:var(--agent-ink)">{T("Agent 进行中", "Agents working")}<span class="n">14</span><span class="spin" style="margin-left:auto;width:11px;height:11px;border-width:1.5px"></span></div>'
    + mrow('progress', 'CRM-144', '商机阶段看板', 'Deal stage board', 'NocoCRM', 'Codex · GPT-5.5 正在开发', 'Codex · GPT-5.5 building', 'run', True)
    + mrow('progress', 'SUP-91', '退款工单 SLA 提醒', 'Refund ticket SLA alerts', 'NocoSupport', 'Claude · Sonnet 5.5 正在测试', 'Claude · Sonnet 5.5 testing', 'run')
    + mrow('progress', 'HR-45', '试用期转正提醒', 'Probation review reminders', 'NocoHR', 'Claude · Opus 5.5 正在评审', 'Claude · Opus 5.5 reviewing', 'run')
    + mrow('progress', 'ITAM-22', '保修到期续保提醒', 'Warranty renewal alerts', 'NocoITAM', 'OpenCode · DeepSeek V4 正在修复', 'OpenCode · DeepSeek V4 fixing', 'run')
    + f'<div class="mmore">{T("还有 10 个 · 9 台运行环境在跑", "10 more · running on 9 runtimes")}</div>'
    + '</div>')
STEP_IC = {'done': f'<span style="color:var(--pass)">{ic("circle-check")}</span>', 'run': '<span class="spin" style="width:13px;height:13px"></span>', 'todo': f'<span style="color:var(--rule-2)">{ic("circle")}</span>'}
steps5 = [('done', '梳理阶段规则与 6 个验收场景', 'Stage rules and 6 acceptance scenarios', 'Claude · Opus 5.5'),
          ('done', '阶段字段与数据迁移', 'Stage fields and migration', 'Codex · GPT-5.5'),
          ('run', '看板拖拽与阶段变更权限 · Server 03 · 已改 7 个文件', 'Drag-and-drop and stage permissions · Server 03 · 7 files changed', 'Codex · GPT-5.5'),
          ('run', '为 6 个验收场景写测试', 'Tests for the 6 scenarios', 'Claude · Sonnet 5.5'),
          ('todo', '代码评审与 NocoBase 检查', 'Code review and NocoBase checks', 'Claude · Opus 5.5')]
steps_html = '<div style="display:grid;gap:7px">' + ''.join(f'<div style="display:grid;grid-template-columns:16px minmax(0,1fr) auto;gap:8px;align-items:center;font-size:13px{";color:var(--muted)" if k == "todo" else ""}">{STEP_IC[k]}<span>{T(z, e)}</span><span class="mn" style="font-size:12px{";color:var(--muted)" if k == "todo" else ""}">{a}</span></div>' for k, z, e, a in steps5) + '</div>'
logs = [(f'<span class="av">{T("王", "L")}</span>', T('<b>王磊</b> 在「我的 Agent」里说清需求，建好任务并开始执行', '<b>Leo</b> scoped it in My Agent, created the task, and pressed Start'), '18:20', False),
        (AGI, T('<b>Claude · Opus 5.5</b> 按技能《需求澄清规范》写好 6 个验收场景', '<b>Claude · Opus 5.5</b> wrote 6 acceptance scenarios per the scoping skill'), '18:34', False),
        (PM, T('<b>项目经理</b> 第 2、3 步交给 <span class="mn">@Codex · GPT-5.5</span>，第 4 步并行交给 <span class="mn">@Claude · Sonnet 5.5</span>', '<b>Project manager</b> gave steps 2–3 to <span class="mn">@Codex · GPT-5.5</span> and step 4 in parallel to <span class="mn">@Claude · Sonnet 5.5</span>'), '18:36', False),
        (AGI, T('<b>Codex · GPT-5.5</b> 正在开发看板拖拽，测试 31/38 通过', '<b>Codex · GPT-5.5</b> is building drag-and-drop; tests 31/38 passing'), T('现在', 'now'), True)]
SPIN_S = ' <span class="spin" style="width:11px;height:11px;border-width:1.5px;vertical-align:-1px"></span>'
log_html = '<div class="log">' + ''.join(f'<div class="le">{a}<div>{b}{SPIN_S if run else ""}</div><span class="t">{t}</span></div>' for a, b, t, run in logs) + '</div>'
det = (f'<div class="mtd"><div class="mt1"><span class="id">CRM-144</span><span>NocoCRM</span><span class="r"><span class="tag blue"><span class="si progress"></span>{T("进行中", "In progress")}</span></span></div>'
    f'<h5>{T("商机阶段看板", "Deal stage board")}</h5>'
    f'<div class="mtn" style="border-left-color:var(--agent)"><div class="h" style="color:var(--agent-ink)">{ic("bot")}{T("Agent 团队正在做 · 第 3 / 5 步", "Agent team at work · step 3 of 5")}<span class="r" style="margin-left:auto;font-weight:400;color:var(--muted)">{T("2 个 Agent 并行", "2 agents in parallel")}</span></div>{steps_html}'
    f'<p class="t2" style="color:var(--muted);font-size:12.5px">{T("预计今晚 23:40 交给你验收。不用盯着，有问题会来问你。", "Expected for your review at 23:40 tonight. No need to watch—it’ll ask if it needs you.")}</p></div>'
    f'<div class="fields"><span><span class="k">{T("负责人", "Owner")}</span><span class="av">{T("王", "L")}</span>{T("王磊", "Leo Wang")}</span><span><span class="k">{T("执行人", "Executor")}</span>{PM}{T("项目经理", "Project manager")}</span><span><span class="k">{T("子任务", "Subtasks")}</span>2 / 5</span></div>'
    f'<div class="mtt"><span class="on">{T("动态", "Activity")}</span><span>{T("描述", "Description")}</span><span>{T("子任务 5", "Subtasks 5")}</span><span>{T("代码与部署", "Code &amp; deploys")}</span><span>{T("运行 9", "Runs 9")}</span></div>{log_html}</div>')
top = f'<div class="wtop"><b>{T("我的任务", "My Tasks")}</b><span class="vsw"><span class="on">{T("分栏", "Split")}</span><span>{T("表格", "Table")}</span><span>{T("看板", "Board")}</span><span>{T("Agent 队列", "Agent queue")}</span></span><span class="r"><span class="tag violet"><span class="spin" style="width:10px;height:10px;border-width:1.5px"></span>{T("14 个任务在推进", "14 tasks moving")}</span><span class="b">{T("新建任务", "New task")}</span><span class="av">{T("王", "L")}</span></span></div>'
foot = (f'<div class="foot"><ol class="parts" style="flex-direction:column;gap:6px"><li><span class="bal">1</span>{T("各个项目的任务汇成一张列表", "Every project’s tasks in one list")}</li><li><span class="bal">2</span>{T("Agent 团队 7×24 小时开发、测试、评审、修复", "Agents build, test, review, and fix around the clock")}</li><li><span class="bal">3</span>{T("只有需要判断的事才轮到你", "Only the calls come to you")}</li></ol>'
    f'<table class="tb"><tbody><tr><td><small>{T("Agent 进行中", "Agents working")}</small><span class="dot d-ag"></span>14</td><td><small>{T("今晚预计交付", "Due tonight")}</small>6</td><td class="okc"><small>{T("本周完成", "Done this week")}</small>41 ✓</td><td class="wait"><small>{T("等你处理", "Waiting for you")}</small>2</td></tr></tbody></table></div>')
save('studioHero', f'<div class="win mtw">{ssb("我的任务")}{top}{lst}{det}</div>{foot}')

# ======================= Studio：我的 Agent 页面（照线上：会话列表 · 对话 · 会话的任务） =======================
SEGC = {'d': 'done', 'r': 'review', 's': 'started', 'k': 'blocked', 'b': 'backlog'}
def sstat(k, n=1):
    if k == 'need': return f'<span class="need">{T("等你 ", "You ")}{n}</span>'
    if k == 'run': return f'<span class="sst run">{T("进行中", "Active")}</span>'
    if k == 'done': return f'<span class="sst done">{T("已完成", "Done")}</span>'
    return ''
def ntask(n): return T(f'{n} 个任务', f'{n} task' + ('' if n == 1 else 's')) if n else T('没有任务', 'No tasks')
sl = [('今天', 'Today', [('客户批量导入去重', 'Customer import de-dup', '09:46', 'NocoCRM', 'rsb', 'need', 1), ('导入预览性能', 'Import preview speed', '10:02', 'NocoCRM', 's', 'run', 0),
                         ('商机阶段看板', 'Deal stage board', '08:30', 'NocoCRM', 'rs', 'need', 0), ('拆分 Q4 权限需求', 'Split the Q4 permission work', '08:05', 'Studio', 'ddssb', 'run', 0)]),
      ('更早', 'Earlier', [('夜间工单分派规则', 'Night ticket routing', T('昨天', 'Yday'), 'NocoSupport', 'kb', 'need', 0), ('按岗位生成入职清单', 'Onboarding lists by role', T('周一', 'Mon'), 'NocoHR', 'ddd', 'done', 0),
                           ('Runner 磁盘满排查', 'Runner disk-full check', T('周一', 'Mon'), 'Studio', '', '', 0), ('折扣审批规则是怎么定的？', 'How do discount approvals work?', T('周一', 'Mon'), 'NocoCRM', '', '', 0)])]
srows = ''.join(f'<div class="hs-g">{T(g, ge)}</div>' + ''.join(
    f'<div class="hs-it{" on" if on else ""}"><div class="hs-t"><b>{T(a, b)}</b><time>{t}</time></div><div class="hs-m"><span class="pj">{pj}</span><span>·</span><span>{ntask(len(bar))}</span>'
    + (f'<span class="lb">' + ''.join(f'<i class="{SEGC[c]}"></i>' for c in bar) + '</span>' if bar else '') + f'<span class="st-s">{sstat(st)}</span></div></div>'
    for a, b, t, pj, bar, st, on in rows) for g, ge, rows in sl)
scol = (f'<section class="hs"><div class="hs-h">{T("我的 Agent", "My Agent")}<span class="b p">{ic("plus")}{T("新会话", "New")}</span></div><div class="hs-q">{ic("search")}{T("搜索会话", "Search sessions")}</div>'
        f'<div class="hs-f"><span class="on">{T("全部", "All")}</span><span>{T("等你确认 3", "Needs you 3")}</span><span>{T("进行中 2", "Active 2")}</span></div>{srows}'
        f'<div class="hs-arch">{ic("laptop")}{T("我的电脑", "My computer")}<span style="margin-left:14px;font:inherit">{T("已归档", "Archived")}</span></div></section>')
lt = [('CRM-152', '导入时按手机号去重', 'De-dup imports by phone'), ('CRM-153', '重复客户合并工具', 'Duplicate merge tool'), ('CRM-160', '导入结果报告', 'Import result report')]
HST = {'review': T('待验收', 'To accept'), 'progress': T('进行中', 'In progress'), 'backlog': T('待规划', 'To plan')}
lst_st = ['review', 'progress', 'backlog']
NOTE = lambda icon, zh, en, t: f'<div class="hnote">{ic(icon)}<span>{T(zh, en)}</span><time>{t}</time></div>'
ccol = (f'<div class="hc"><div class="wtop"><b>{T("客户批量导入去重", "Customer import de-dup")}</b><span class="m">Claude Code · Opus 5.5 · NocoCRM · {T("王磊的 Mac", "Leo’s Mac")} <i class="on-dot"></i></span></div>'
    f'<div class="hmsgs" style="justify-content:flex-end"><div class="day">{T("周二", "Tuesday")}</div>'
    f'<div class="hm me"><div class="hb">{T("客户批量导入要支持去重：同一个手机号只留一条。先看看现有的导入逻辑，说明改动范围。", "Bulk import needs de-dup: one record per phone number. Look at the current import logic and tell me the scope.")}</div><span class="hw">09:45</span></div>'
    f'<div class="hm"><span class="ag">{ic("bot")}</span><div class="body"><div class="who"><b>Claude Code</b>09:46</div><div class="tool">{ic("chevron-right")}<span>{T("执行了 4 条命令", "Ran 4 commands")}</span></div>'
    f'<div class="tx">{T("导入在 <code>server/import/customers.ts</code>，预览在 <code>import-preview.tsx</code>。改动范围：", "Import is in <code>server/import/customers.ts</code>, preview in <code>import-preview.tsx</code>. Scope:")}<ul><li>{T("预览阶段按手机号（去掉空格和区号）找出重复", "Find duplicates by phone (spaces and country code stripped) during preview")}</li><li>{T("重复行默认合并到已有客户，预览里标出“将合并”", "Merge duplicates into existing customers by default, marked in the preview")}</li><li>{T("导入完成后给出结果报告", "Report the result after import")}</li></ul></div>'
    f'<div class="hcard"><div class="ch">{ic("list-checks")}{T("已创建 3 个任务", "Created 3 tasks")}<span class="r">NocoCRM</span></div>'
    + ''.join(f'<div class="trow2">{ic("square-check")}<span class="id">{i}</span><b>{T(a, b)}</b><span class="hst {k}">{HST[k]}</span></div>' for (i, a, b), k in zip(lt, lst_st))
    + f'<div class="cf"><span class="b done">{ic("check")}{T("已交给 Agent 团队", "Handed to the agent team")}</span></div></div></div></div>'
    + NOTE('play', '项目经理开始执行 CRM-152、CRM-153', 'Project manager started CRM-152 and CRM-153', '09:47')
    + NOTE('circle-check', 'CRM-152 完成，测试 38/38 通过，等你验收', 'CRM-152 done, tests 38/38, ready to accept', '22:40')
    + f'<div class="day">{T("周三", "Wednesday")}</div>'
    + NOTE('undo-2', 'CRM-153 被陈思退回：合并后保留最早的创建时间', 'Ava sent CRM-153 back: keep the earliest created date', '10:05')
    + f'<div class="hm me"><div class="hb">{T("153 按陈思说的改。", "Fix 153 the way Ava said.")}</div><span class="hw">10:12</span></div>'
    f'<div class="hm"><span class="ag">{ic("bot")}</span><div class="body"><div class="who"><b>Claude Code</b>10:12</div><div class="tx">{T("已把意见补进 CRM-153 的描述，团队接着改了。", "Added her note to CRM-153; the team is on it.")}</div></div></div>'
    f'</div><div class="hcomp"><div class="hbox"><div class="t ph">{T("回复，或说下一件事… 用 # 提到任务", "Reply, or start the next thing… # to mention a task")}</div><div class="f"><span class="c">{ic("cpu")}Opus 5.5</span><span class="c">{ic("brain")}High</span><span class="c">{ic("shield")}{T("完整权限", "Full access")}</span><span class="b p lg" style="margin-left:auto">{ic("arrow-up")}</span></div></div></div></div>')
WHO = [T('测试 38/38 · 预览已就绪', 'Tests 38/38 · preview up'), f'<span class="spin"></span><span>Codex · GPT-5.5 · Server 02 {T("正在修改", "revising")}</span>', T('等 CRM-152 合并后开始', 'Starts after CRM-152 merges')]
SI2 = {'review': 'review', 'progress': 'progress', 'backlog': 'backlog'}
rcol = (f'<aside class="hp"><div class="wtop"><b>{T("任务", "Tasks")} <span class="n">3</span></b><span class="r hsum">{T("1 待验收 · 1 进行中 · 1 待规划", "1 to accept · 1 active · 1 to plan")}</span></div><div class="hp-b"><div>'
    + ''.join(f'<div class="ht"><div class="ht1"><span class="si {SI2[k]}"></span><b>{T(a, b)}</b><span class="hst {k}">{HST[k]}</span></div><div class="ht2"><span class="id">{i}</span><span class="w">{w}</span></div></div>' for (i, a, b), k, w in zip(lt, lst_st, WHO))
    + f'</div><div class="hp-sec"><p class="hd">{T("会话", "Session")}</p><dl class="hkv2"><dt>{T("电脑", "Machine")}</dt><dd>{T("王磊的 Mac", "Leo’s Mac")} <i class="on-dot"></i></dd><dt>Agent</dt><dd>Claude Code 0.89</dd><dt>{T("模式", "Mode")}</dt><dd>{T("完整权限", "Full access")}</dd><dt>{T("项目", "Project")}</dt><dd>NocoCRM</dd><dt>{T("目录", "Folder")}</dt><dd class="mono">~/code/crm</dd></dl></div>'
    f'<div class="hp-sec"><p class="hd">{T("用量", "Usage")}</p><p style="font-size:12px;color:var(--ink-2)">{T("上下文 52,929 / 1,000,000 · 5.3%", "Context 52,929 / 1,000,000 · 5.3%")}</p></div></div></aside>')
save('studioLinked', f'<div class="win hwin">{ssb("我的 Agent")}{scol}{ccol}{rcol}</div>')

# ======================= Studio：Agent 团队的规模与范围 =======================
agents = [('workflow', '项目经理', 'Project manager', 'Claude · Opus 5.5', '拆分任务、安排每一步、提问、交付验收', 'Splits tasks, assigns steps, asks, hands over', T('编排 24 个任务', 'Orchestrating 24'), '—'),
          ('bot', 'Codex · GPT-5.5', 'Codex · GPT-5.5', '', '功能开发与修复', 'Features and fixes', '8', '61'),
          ('bot', 'Claude · Opus 5.5', 'Claude · Opus 5.5', '', '需求梳理、方案与代码评审', 'Scoping, design, code review', '5', '38'),
          ('bot', 'Claude · Sonnet 5.5', 'Claude · Sonnet 5.5', '', '测试与回归', 'Testing and regression', '6', '52'),
          ('bot', 'OpenCode · DeepSeek V4', 'OpenCode · DeepSeek V4', '', '文档、翻译与小改动', 'Docs, translation, small changes', '3', '27'),
          ('bot', 'Claude · Haiku 5.5', 'Claude · Haiku 5.5', '', '截图对比与验收清单', 'Screenshot diffs, acceptance lists', '2', '36')]
ag_rows = ''.join(f'<tr><td><span style="display:inline-flex;align-items:center;gap:8px"><span class="ag{" wf" if i == "workflow" else ""}">{ic(i)}</span><b style="font-weight:600">{T(a, b)}</b></span></td><td class="w" style="color:var(--ink-2)">{T(d, e)}</td><td style="font-family:var(--f-mono);color:var(--agent-ink)">{n}</td><td style="font-family:var(--f-mono)">{done}</td></tr>' for i, a, b, m, d, e, n, done in agents)
ag_rows += f'<tr><td colspan="4" style="color:var(--muted)">{T("还有 6 个 Agent：Codex · GPT-5.5 mini、Gemini CLI 等", "6 more agents, including Codex · GPT-5.5 mini and Gemini CLI")}</td></tr>'
SLOT = lambda used, cap: '<span style="display:inline-flex;gap:3px">' + ''.join(f'<i style="width:9px;height:9px;border-radius:2px;background:{"var(--agent)" if k < used else "var(--paper-2)"};box-shadow:inset 0 0 0 1px {"transparent" if k < used else "var(--rule-2)"}"></i>' for k in range(cap)) + '</span>'
# 运行环境：每台机器每个槽位上跑着哪个 Agent、在做哪个任务
rts = [('Server 01', 'Team', 4, [('Codex', 'CRM-144'), ('Claude Code', 'SUP-91'), ('Claude Code', 'HR-45'), ('PM', '')]),
       ('Server 02', 'Team', 4, [('Codex', 'CRM-147'), ('OpenCode', 'REACH-14'), ('Codex', 'ITAM-22'), ('Claude Code', 'HR-48')]),
       ('Server 03', 'Team', 4, [('Codex', 'CRM-144'), ('Claude Code', 'SUP-93'), ('Gemini CLI', 'ITAM-25'), ('Codex', 'PLT-31')]),
       ('Server 04', 'Team', 4, [('Claude Code', 'HR-50'), ('Codex', 'CRM-149'), ('OpenCode', 'SUP-90')]),
       ('Server 05', 'Team', 4, [('Codex', 'REACH-15'), ('Claude Code', 'PLT-29'), ('Gemini CLI', 'ITAM-26'), ('Codex', 'CRM-150')]),
       ('Server 06', 'Team', 4, [('OpenCode', 'SUP-94'), ('Claude Code', 'PLT-33')]),
       (T('王磊的 Mac', 'Leo’s Mac'), 'Personal', 2, [('Claude Code', 'CRM-153'), ('Codex', 'CRM-160')]),
       (T('陈思的 MacBook', 'Ava’s MacBook'), 'Personal', 2, [('Claude Code', 'REACH-16')]),
       (T('林悦的工作站', 'Lina’s workstation'), 'Personal', 2, None)]
TOOL_C = {'Codex': 'var(--ink)', 'Claude Code': 'oklch(0.64 0.15 45)', 'OpenCode': 'var(--info-ink)', 'Gemini CLI': 'var(--agent)'}
def slot(a, t, fs):
    if a == 'PM':
        return f'<div style="display:flex;align-items:center;gap:6px;font-size:{fs}px;line-height:1.5;white-space:nowrap;color:var(--agent-ink)"><span style="display:inline-grid;color:var(--agent)">{ic("workflow")}</span><span style="font-weight:500">{T("项目经理", "PM agent")}</span><span style="margin-left:auto;color:var(--muted)">{T("编排", "planning")}</span></div>'
    return f'<div style="display:flex;align-items:center;gap:6px;font-size:{fs}px;line-height:1.5;white-space:nowrap;overflow:hidden"><i style="width:7px;height:7px;border-radius:2px;flex:none;background:{TOOL_C[a]}"></i><span style="font-weight:500">{a}</span><span style="margin-left:auto;font:{fs - 0.5}px var(--f-mono);color:var(--muted)">{t}</span></div>'
def idle(fs, text=None):
    return f'<div style="display:flex;align-items:center;gap:6px;font-size:{fs}px;line-height:1.5;color:var(--muted)"><i style="width:7px;height:7px;border-radius:2px;flex:none;box-shadow:inset 0 0 0 1px var(--rule-2)"></i>{text or T("空闲", "Idle")}</div>'
def rt_card(n, k, c, xs, fs=11, pad='7px 9px'):
    head = f'<div style="display:flex;align-items:center;gap:5px;font-size:{fs + 0.5}px;font-weight:600;white-space:nowrap">{ic("server") if k == "Team" else ic("laptop")}<span style="overflow:hidden;text-overflow:ellipsis">{n}</span><span style="margin-left:auto;font:500 {fs - 0.5}px var(--f-mono);color:var(--muted)">{len(xs or [])}/{c}</span></div>'
    rows = [idle(fs, T('离线 · 3 小时前', 'Offline · 3h ago'))] if xs is None else [slot(a, t, fs) for a, t in xs] + [idle(fs) for _ in range(c - len(xs))]
    return f'<div class="pnl" style="gap:2px;padding:{pad};align-content:start">{head}<div style="display:grid;gap:1px;margin-top:3px">{"".join(rows)}</div></div>'
rt_html = '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">' + ''.join(rt_card(*r, fs=12, pad='9px 11px') for r in rts) + '</div>'
scope = [('NocoCRM', 7), ('NocoSupport', 5), ('NocoHR', 4), ('NocoITAM', 3), ('NocoReach', 3), ('Studio Platform', 2)]
scope_html = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px"><b style="font-size:12.5px">' + T('工作范围', 'Scope') + '</b>' + ''.join(f'<span class="chip">{p} <b style="font-family:var(--f-mono);color:var(--agent-ink)">{n}</b></span>' for p, n in scope) + f'<span style="color:var(--muted)">{T("6 个项目 · 24 个任务步骤同时在跑", "6 projects · 24 task steps running at once")}</span></div>'
save('studioFleet', solo(
    f'<div class="sx-h"><div><h5>{T("Agent 团队", "Agent team")}</h5><p>{T("23:40 · 大家下班了，团队还在推进", "23:40 · the people have gone home; the team keeps going")}</p></div><span class="r"><span class="b sm">{ic("plus")}{T("添加运行环境", "Add runtime")}</span></span></div>'
    f'<div class="stat" style="--n:5"><div><small>{T("启用的 Agent", "Agents enabled")}</small><b>12</b><span class="d">{T("6 种编码工具 × 多家模型", "6 tools × several models")}</span></div><div><small>{T("运行环境", "Runtimes")}</small><b>9</b><span class="d">{T("6 台团队服务器 · 3 台成员电脑", "6 team servers · 3 member machines")}</span></div>'
    f'<div><small>{T("正在并行", "Running in parallel")}</small><b style="color:var(--agent-ink)">24</b><span class="d">{T("共 32 个槽位", "of 32 slots")}</span></div><div><small>{T("涉及项目", "Projects")}</small><b>6</b></div><div><small>{T("今天完成的步骤", "Steps done today")}</small><b class="ok">214</b></div></div>'
    f'<div class="duo2" style="grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);align-items:start"><div class="tblw"><table class="tbl"><thead><tr><th>Agent</th><th>{T("擅长", "Good at")}</th><th>{T("正在做", "Now")}</th><th>{T("今天", "Today")}</th></tr></thead><tbody>{ag_rows}</tbody></table></div>'
    f'<div style="display:grid;gap:8px"><div class="sx-sec">{T("运行环境", "Runtimes")}<span class="r">{T("每行一个并行槽位", "one row per slot")}</span></div>{rt_html}</div></div>{scope_html}'))

# ======================= Studio：NocoBase 开发技能 =======================
offi = [('nocobase-create-app', '创建与配置应用：项目结构、数据库、本地预览', 'Create and configure apps: structure, database, local preview'),
        ('nocobase-app-plugin-development', '业务插件开发：目录约定、UI 组件、服务端资源与 Registry', 'Business plugins: layout, UI components, server resources, Registry'),
        ('nocobase3-capability-usage', '能力使用规范：哪些用平台、哪些自己写、放在哪里、谁来管（15 篇）', 'Capability usage: what to use from the platform, what to write, where, who owns it (15 guides)'),
        ('nocobase-app-installer', '部署：生产安装、离线服务器、升级与回滚', 'Deploy: production installs, offline servers, upgrade and rollback'),
        ('nocobase-localization', '多语言：界面文案与文档的翻译规范', 'Localization: rules for UI copy and docs')]
team = [('requirements-clarify', '需求澄清规范：口头需求 → 数据、规则和验收场景', 'Scoping: verbal needs → data, rules, acceptance scenarios'), ('code-review', '代码评审规范：越权、迁移、兼容性逐项看', 'Code review: permissions, migrations, compatibility'), ('release-checklist', '发布检查清单：备份、变量、迁移回退方案', 'Release checklist: backup, variables, migration rollback')]
def sk_rows(lst, active=None):
    return ''.join(f'<div style="display:grid;gap:1px;padding:8px 10px;border-radius:8px{";background:var(--brand-tint)" if n == active else ""}"><code style="font:12px var(--f-mono);color:var(--ink)">{n}</code><span style="font-size:11.5px;color:var(--muted)">{T(z, e)}</span></div>' for n, z, e in lst)
cap = ['权限|Permissions', '数据模型与迁移|Data model &amp; migrations', '工作流与审批|Workflows &amp; approvals', '页面与导航|Pages &amp; navigation', '后台任务与队列|Background jobs', '通知与收件箱|Notifications', 'AI 集成|AI', '集成与凭证|Integrations &amp; secrets', '文件与附件|Files', '审计与操作记录|Audit trail', '部署与升级|Deploy &amp; upgrade', '…']
md = (f'<div class="md"><span class="hd">## {T("新增接口", "New endpoints")}</span>\n'
      f'- {T("每个接口声明需要的权限；没声明的，任何人和 Agent 都调不到", "Every endpoint declares its permission; undeclared means no person or agent can call it")}\n'
      f'- {T("数据范围用权限集表达，不在代码里判断角色", "Express data scope with permission sets, never role checks in code")}\n'
      f'- <span class="hl">{T("Agent 用和人一样的角色，不另开接口或后门", "Agents use the same roles as people—no side doors")}</span>\n'
      f'<span class="hd">## {T("不要自己写", "Don’t build")}</span>\n'
      f'- {T("登录、会话、API 密钥：用 authentication 包", "Sign-in, sessions, API keys: use the authentication package")}</div>')
save('studioSkills', solo(
    f'<div class="sx-h"><div><h5>{T("技能", "Skills")}</h5><p>{T("Agent 每一步怎么做，都写在这里；写出来的代码由检查把关。", "How agents do every step lives here; checks hold the code to it.")}</p></div><span class="r">{tag("green", "与 Core 版本配套", "Matched to your Core version")}</span></div>'
    f'<div style="display:grid;grid-template-columns:330px minmax(0,1fr);gap:14px;align-items:start"><div style="display:grid;gap:2px">'
    f'<div class="sx-sec" style="padding:0 10px 4px">{ic("badge-check")}{T("NocoBase 官方开发技能", "Official NocoBase skills")}</div>{sk_rows(offi, "nocobase3-capability-usage")}'
    f'<div class="sx-sec" style="padding:10px 10px 4px">{T("团队技能", "Team skills")}</div>{sk_rows(team)}</div>'
    f'<div style="display:grid;gap:10px"><div class="pnl" style="gap:8px"><div class="h">nocobase3-capability-usage<span class="r">{T("15 篇 · 按需求读对应的一篇", "15 guides · read the one you need")}</span></div><div class="mini-chips">' + ''.join(f'<span>{T(*c.split("|")) if "|" in c else c}</span>' for c in cap) + '</div>'
    f'<div style="font-size:12px;color:var(--muted)">{T("权限应该如何开发和使用", "How to build and use permissions")}</div>{md}</div>'
    f'<div class="duo2"><div class="pnl" style="gap:6px"><div class="h">{ic("shield-check")}{T("由检查强制执行", "Enforced by checks")}</div><div class="ck2"><div style="grid-template-columns:minmax(0,1fr) auto"><b>{T("权限", "Permissions")}</b><small style="grid-column:1">{T("新接口都声明了权限", "New endpoints declare permissions")}</small><span class="tag green" style="grid-row:1/3;grid-column:2">{T("通过", "Pass")}</span></div><div style="grid-template-columns:minmax(0,1fr) auto"><b>{T("只改业务部分", "Business code only")}</b><small style="grid-column:1">{T("没有修改 Core", "Core untouched")}</small><span class="tag green" style="grid-row:1/3;grid-column:2">{T("通过", "Pass")}</span></div></div></div>'
    f'<div class="pnl" style="gap:6px"><div class="h">{ic("activity")}{T("本周", "This week")}</div><div class="kv" style="--n:2"><div><small>{T("被 Agent 读取", "Read by agents")}</small><b>412</b></div><div><small>{T("拦下的违规", "Violations caught")}</small><b style="color:var(--risk-ink)">7</b></div></div><p style="font-size:11.5px">{T("Codex · GPT-5.5 在 CRM-144 读了：权限、数据模型、页面与导航", "Codex · GPT-5.5 on CRM-144 read: permissions, data model, pages")}</p></div></div></div></div>'))


# ======================= 首页小图（640 宽）：我的 Agent、Agent 团队、开发技能 =======================
sm_sess = [('客户批量导入去重', 'Customer import de-dup', '09:46', 'NocoCRM', 'rsb', 'need', 1), ('商机阶段看板', 'Deal stage board', '08:30', 'NocoCRM', 'rs', 'need', 0),
           ('拆分 Q4 权限需求', 'Split the Q4 permission work', '08:05', 'Studio', 'ddssb', 'run', 0), ('按岗位生成入职清单', 'Onboarding lists by role', T('周一', 'Mon'), 'NocoHR', 'ddd', 'done', 0)]
sm_rows = ''.join(f'<div class="hs-it{" on" if on else ""}" style="margin:0 0 2px"><div class="hs-t"><b>{T(a, b)}</b><time>{t}</time></div><div class="hs-m"><span class="pj">{pj}</span><span>·</span><span>{ntask(len(bar))}</span><span class="lb">' + ''.join(f'<i class="{SEGC[c]}"></i>' for c in bar) + f'</span><span class="st-s">{sstat(st)}</span></div></div>' for a, b, t, pj, bar, st, on in sm_sess)
sm_tasks = ''.join(f'<div class="ht"><div class="ht1"><span class="si {SI2[k]}"></span><b>{T(a, b)}</b><span class="hst {k}">{HST[k]}</span></div><div class="ht2"><span class="id">{i}</span><span class="w">{w}</span></div></div>' for (i, a, b), k, w in zip(lt, lst_st, WHO))
sm_notes = (NOTE('circle-check', 'CRM-152 完成，测试 38/38 通过', 'CRM-152 done, tests 38/38', '22:40') + NOTE('undo-2', 'CRM-153 被退回，团队接着改', 'CRM-153 sent back; team revising', '10:05')).replace('padding-left: 34px', '')
save('homeMyAgent', solo(
    f'<div class="sx-h"><h5>{T("我的 Agent", "My Agent")}</h5><span class="r"><span class="b p sm">{ic("plus")}{T("新会话", "New")}</span></span></div>'
    f'<div style="display:grid;grid-template-columns:250px minmax(0,1fr);gap:14px;align-items:start"><div>{sm_rows}</div>'
    f'<div style="display:grid;gap:8px"><div class="sx-sec">{T("客户批量导入去重 · 任务 3", "Customer import de-dup · 3 tasks")}</div><div>{sm_tasks}</div><div style="display:grid;gap:6px" class="smn">{sm_notes}</div></div></div>'))
sm_rt = rts[:4] + rts[6:8]
sm_rt_html = '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">' + ''.join(rt_card(*r, fs=12, pad='10px 12px') for r in sm_rt) + f'</div><p style="font-size:12px;color:var(--muted)">{T("还有 3 台运行环境 · 6 个项目的任务同时在推进", "3 more runtimes · tasks from 6 projects moving at once")}</p>'
save('homeFleet', solo(
    f'<div class="sx-h"><div><h5>{T("Agent 团队", "Agent team")}</h5><p>{T("23:40 · 大家下班了，团队还在推进", "23:40 · the people have gone home; the team keeps going")}</p></div></div>'
    f'<div class="stat" style="--n:4"><div><small>{T("启用的 Agent", "Agents")}</small><b>12</b></div><div><small>{T("运行环境", "Runtimes")}</small><b>9</b></div><div><small>{T("正在并行", "In parallel")}</small><b style="color:var(--agent-ink)">24</b></div><div><small>{T("涉及项目", "Projects")}</small><b>6</b></div></div>'
    f'{sm_rt_html}'))
# 首页「受治理的工程」（1120 宽）：一次改动从方案到上线要过的每一道关
GV_WHO = {'a': ('d-ag', ''), 'h': ('d-hu', ''), 's': ('d-ok', '')}
gv_steps = [
    ('方案', 'Approach', 'a', 'Claude · Opus 5.5', 'Claude · Opus 5.5', 'studio-approach', '把需求写成 3 条规则、6 个验收场景', '3 rules and 6 acceptance scenarios, written down', 'h', '王磊确认方案', 'Leo confirms the plan'),
    ('开发', 'Build', 'a', 'Codex · GPT-5.5', 'Codex · GPT-5.5', 'studio-development', '编写业务功能，权限、工作流等直接用 Core', 'Builds the business features; permissions and workflows come from Core', 's', '构建与规范检查通过', 'Build and lint pass'),
    ('评审', 'Review', 'a', 'Claude · Opus 5.5', 'Claude · Opus 5.5', 'studio-review', '逐项看权限、数据迁移与兼容性', 'Permissions, migrations, compatibility, item by item', 's', '评审意见全部关闭', 'Review comments closed'),
    ('测试', 'Test', 'a', 'Claude · Sonnet 5.5', 'Claude · Sonnet 5.5', None, '按 6 个验收场景写测试，迁移在数据副本上演练', 'Writes tests for all 6 scenarios; rehearses the migration on a data copy', 's', '46/46 通过才能合并', 'Merge only at 46/46'),
    ('验收', 'Accept', 'h', '陈思', 'Ava Chen', None, '在独立预览环境里，按 6 个场景逐一走过', 'Walks all 6 scenarios in an isolated preview', 'h', '陈思验收通过', 'Ava accepts'),
    ('发布', 'Release', 'h', '王磊 → 运维 Agent', 'Leo → ops agent', None, '发布前自动备份，出问题可一键回滚', 'Backup before deploy; one-click rollback', 'h', '王磊批准上线', 'Leo approves release'),
]
GV_BASIS = {3: ('flask-conical', 'Studio 测试模块', 'Studio Testing'), 4: ('eye', 'crm-import.preview', 'crm-import.preview'), 5: ('archive', '快照 db-0412', 'Snapshot db-0412')}
def gv_step(k, st):
    zh, en, who, wz, we, skill, oz, oe, gk, gz, ge = st
    basis = f'<code class="gv-sk">{skill}</code>' if skill else f'<span class="gv-bs">{ic(GV_BASIS[k][0])}{T(GV_BASIS[k][1], GV_BASIS[k][2])}</span>'
    gate = f'<div class="gv-gate {"hu" if gk == "h" else "ok"}">{ic("user-check" if gk == "h" else "shield-check")}<span>{T(gz, ge)}</span></div>'
    return (f'<div class="gv-st"><div class="gv-t"><span class="bal">{k + 1}</span><b>{T(zh, en)}</b><span class="gv-ok">{ic("circle-check")}</span></div>'
            f'<div class="gv-who"><span class="dot {GV_WHO[who][0]}"></span>{T(wz, we)}</div>{basis}<p>{T(oz, oe)}</p>{gate}</div>')
save('homeGovern', solo(
    f'<div class="sx-h"><div><h5>{T("CRM-152 · 客户导入去重", "CRM-152 · Customer import de-dup")}</h5><p>{T("NocoCRM · 一次改动从方案到上线，要过的每一道关", "NocoCRM · every gate one change passes, from plan to production")}</p></div><span class="r">{tag("green", "v1.8.0 已上线", "v1.8.0 live")}</span></div>'
    f'<div class="gv-flow">{"".join(gv_step(k, st) for k, st in enumerate(gv_steps))}</div>'
    f'<div class="gv-band">{ic("git-branch")}<code class="gv-sk">studio-workflow</code><span>{T("规定整条流程：每个任务独立分支、独立预览环境，按顺序过关，不能跳步", "Defines the whole flow: own branch and preview per task, gates in order, no skipping")}</span>'
    f'<span class="gv-trace">{ic("history")}{T("每一步都留痕：谁做的、用哪个模型、依据哪条技能", "Every step logged: who, which model, which skill")}</span></div>'))

print('more snips done')
