# Core、Studio 产品页的几张图，以及产品页共用的样式。
#   coreStack   Core 首屏：上面是 Agent 写的业务，下面是就绪的 Core（统一的项目结构和开发规范 + 基础能力）。
#               和首页 Core 段的图是同一张（首页由 homepage.html 里的 coreFig() 现场渲染），两处的数据要一起改。
#   coreRepo    Core「为 Agent 提供统一的架构和规范」：新建应用的目录（谁提供、谁编写）和 nocobase-app-development 技能。
#               目录、技能名和规则对照 NocoBase 3 应用模板的 AGENTS.md 与 .agents/skills/（nocobase-studio 仓库里就是一份）。
#   studioDash  Studio「各项进展一目了然」：仪表盘（交付的四个数字和模型用量）与一个任务的推进详情（现在、接下来、执行计划）。
#               字段对照 nocobase-studio 仓库 dev 分支的 client/pages/dashboard、agents 插件的用量页和任务页的「现在」一栏。
# 输出到 snips/，正文里用 {{SNIP:coreStack:1270}} 等引用；product-pages.css 同步到 assets/site.css 末尾（/* PRODUCT-PAGES */ 标记之间）。
# 用法（在 _src 目录下）：python3 pages/gen_product_figs.py ..
import os, re, sys
root = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
T = lambda zh, en: '<t-zh>%s</t-zh><t-en>%s</t-en>' % (zh, en)
I = lambda n: '<i data-lucide="%s"></i>' % n

# ---------- coreStack ----------
CAPS = [
    ('data', 'database', '数据建模', 'Data Model', '数据表、字段、关联关系与迁移', 'Tables, fields, relations &amp; migrations'),
    ('file', 'file', '文件管理', 'Files', '上传、多端存储、在线预览与权限', 'Storage providers, preview &amp; ACL'),
    ('org', 'users', '用户与组织', 'Users &amp; Org', '账号体系、部门架构与成员管理', 'Accounts, departments &amp; roles'),
    ('acl', 'key-round', '权限控制', 'Permissions', '页面、操作与数据范围，人与 Agent 同一套', 'Pages, actions &amp; records, for people and agents'),
    ('wf', 'workflow', '工作流与审批', 'Workflows', '多阶段流转、条件分支与审批', 'Stages, branching &amp; approvals'),
    ('ai', 'bot', 'AI 与 Agent', 'AI &amp; Agents', '模型接入、工具调用与 Agent 接口', 'Models, tools &amp; agent runtime'),
    ('kb', 'book-open', '知识库', 'Knowledge', '业务文档沉淀与受控检索', 'Domain docs &amp; scoped retrieval'),
    ('mail', 'mail', '邮件互通', 'Email', '收发邮件并自动关联业务记录', 'Two-way sync tied to records'),
    ('notify', 'bell', '消息通知', 'Notifications', '站内信、邮件与群消息', 'In-app, email &amp; group chats'),
    ('ext', 'plug', '外部集成', 'Integrations', 'API、API Key 与外部数据库', 'APIs, API keys &amp; external DBs'),
    ('ui', 'layout-dashboard', '界面与配置', 'UI &amp; Views', '页面布局、导航菜单与多语言', 'Pages, blocks, nav &amp; i18n'),
    ('audit', 'history', '处理记录', 'Records', '流程、审批与 Agent 运行都有记录', 'Workflow, approval &amp; agent-run history'),
    ('ops', 'wrench', '部署与升级', 'Deployment', '部署、升级与回滚', 'Deploys, upgrades &amp; rollback'),
]
CAPNAME = {c[0]: (c[2], c[3]) for c in CAPS}
MODS = [
    ('客户分级', 'Customer tiers', '按合同额分 A/B/C，每月重算', 'A/B/C by contract value, monthly', ['data', 'wf', 'acl']),
    ('折扣审批', 'Discount approval', '折扣超 15% 须经理审批', 'Over 15% needs a manager', ['wf', 'acl', 'notify']),
    ('续约提醒', 'Renewal reminders', '到期前 60 天起草续约方案', 'Drafts renewals 60 days out', ['ai', 'kb', 'mail']),
    ('供应商评分', 'Supplier scoring', '汇总交期与质检记录打分', 'Scores delivery and QA records', ['data', 'file', 'ext']),
]
core_stack = (
    '<div class="cx">'
    '<div class="cx-h"><b>' + I('bot') + T('你的业务 · Agent 编写', 'Your business logic · written by agents') + '</b></div>'
    '<div class="cx-mods">' + ''.join(
        '<div class="cx-mod" tabindex="0" data-m="%d" data-caps="%s"><div class="t"><b>%s</b></div><p>%s</p><div class="u">%s</div></div>'
        % (i, ' '.join(m[4]), T(m[0], m[1]), T(m[2], m[3]), ''.join('<span>%s</span>' % T(*CAPNAME[k]) for k in m[4]))
        for i, m in enumerate(MODS)) + '</div>'
    '<div class="plate cx-plate"><div class="plate-h"><b>' + I('layers') + 'NocoBase Core<em>' + T('已就绪', 'Ready') + '</em></b></div>'
    '<div class="cx-std"><div class="l"><b>' + I('ruler') + T('统一的项目结构和开发规范', 'One project structure and one set of standards') + '</b><span>' +
    T('换人、换模型，项目架构都能保持统一、受控', 'New people or new models, the architecture stays consistent and under control') + '</span></div>'
    '<div class="its"><span>' + I('folder-tree') + T('项目脚手架', 'Project scaffold') + '</span><span>' + I('file-check-2') + T('架构规范', 'Architecture rules') +
    '</span><span>' + I('sparkles') + T('开发技能', 'Dev skills') + '</span></div></div>'
    '<div class="caps">' + ''.join('<div data-cap="%s"><b>%s%s</b><span>%s</span></div>' % (k, I(ic), T(zh, en), T(dzh, den)) for k, ic, zh, en, dzh, den in CAPS) +
    '<div class="more"><b>' + I('plus') + T('20 多项基础能力', '20+ capabilities') + '</b><span>' + T('由 NocoBase 持续维护和升级', 'Maintained and upgraded by NocoBase') + '</span></div></div>'
    '</div></div>')

# ---------- coreRepo ----------
def node(depth, icon, name, zh, en, who=None, cls=''):
    tag = {'core': '<em class="rp-who fc">%s</em>' % T('Core 提供', 'From Core'),
           'biz': '<em class="rp-who wr">%s</em>' % T('Agent 编写', 'Written by agents')}.get(who, '')
    return ('<div class="rp-row d%d%s">%s<code>%s</code><span>%s</span>%s</div>' %
            (depth, (' ' + cls) if cls else '', I(icon), name, T(zh, en), tag))
repo = ('<div class="rp-card rp-tree"><div class="rp-h">' + I('folder-git-2') + '<b>crm-app</b><span>' + T('新建应用的目录', 'A new app, as created') + '</span>' +
    '<span class="r"><em class="rp-who fc">' + T('Core 提供', 'From Core') + '</em><em class="rp-who wr">' + T('Agent 编写', 'Written by agents') + '</em></span></div>' +
    node(0, 'file-text', 'AGENTS.md', '开发规则：业务代码放在哪里，哪些地方不能改', 'Rules: where business code goes and what to leave alone', 'core') +
    node(0, 'folder', '.agents/skills/', '开发技能，安装依赖时自动同步', 'Development skills, synced on every install', 'core') +
    node(1, 'sparkles', 'nocobase-app-development', '页面、接口、数据、迁移、测试', 'Pages, endpoints, data, migrations, tests') +
    node(1, 'sparkles', 'nocobase-app-plugin-authorization', '权限', 'Permissions') +
    node(1, 'sparkles', 'nocobase-app-plugin-notification', '通知', 'Notifications') +
    node(1, 'sparkles', 'nocobase-deployment', '部署', 'Deployment') +
    node(1, 'ellipsis', '', '每个插件各带一份技能', 'One skill for every plugin', cls='more') +
    node(0, 'folder', 'client/', '页面、组件和界面文字', 'Pages, components, and UI text', 'biz') +
    node(0, 'folder', 'server/', '接口与服务', 'Endpoints and services', 'biz') +
    node(0, 'folder', 'database/main/', '表结构变更与初始数据', 'Schema changes and required data', 'biz') +
    node(0, 'folder', 'tests/', '测试', 'Tests', 'biz') +
    node(0, 'package', 'package.json', 'Core 的基础能力以 @nocobase/* 包引入', 'Core’s building blocks come in as @nocobase/* packages', 'core') +
    '</div>')
ROUTES = [('页面、路由、组件、界面文字', 'Pages, routes, components, UI text', 'frontend/ui-workflow.md'),
          ('新增接口', 'Add an endpoint', 'server-routes.md'),
          ('读写数据', 'Read or write data', 'database-and-data.md'),
          ('修改表结构', 'Change the schema', 'migrations.md'),
          ('测试与验证', 'Test and verify', 'testing.md')]
RULES = [('权限、通知、登录、文件已有插件：先读它的技能，不要自己重写', 'Permissions, notifications, sign-in, and files already have plugins: read their skill before writing your own'),
         ('迁移合并后不再修改，每次修正都写成新的迁移', 'A merged migration never changes; every fix is a new migration'),
         ('每个接口自己负责身份验证和权限检查', 'Every endpoint owns its own authentication and permission checks')]
skill = ('<div class="rp-card rp-skill"><div class="rp-h">' + I('sparkles') + '<b>nocobase-app-development</b><span>SKILL.md</span></div>' +
    '<p class="rp-sub">' + T('Agent 先读这里，再按任务读对应的一篇', 'Agents start here, then read the one page their task needs') + '</p>' +
    '<table class="rp-tbl"><thead><tr><th>' + T('要做的事', 'Task') + '</th><th>' + T('读哪一篇', 'Reference') + '</th></tr></thead><tbody>' +
    ''.join('<tr><td>%s</td><td><code>%s</code></td></tr>' % (T(zh, en), f) for zh, en, f in ROUTES) + '</tbody></table>' +
    '<div class="rp-rules"><div class="h">' + I('file-check-2') + T('AGENTS.md 里的规则', 'Rules in AGENTS.md') + '</div>' +
    ''.join('<p>%s%s</p>' % (I('check'), T(zh, en)) for zh, en in RULES) + '</div></div>')
core_repo = '<div class="rp">' + repo + skill + '</div>'

# ---------- studioDash ----------
# 左：仪表盘（交付的四个数字 + 模型用量）；右：一个任务的推进详情（「现在」「接下来」、执行计划、动态）。
# 「现在」一栏的写法对照 Studio 的 issue progress 文案：「{Agent} 正在…」「已运行 N 分钟」「在 {执行机}」「接下来：…」。
def win(crumbs, body):
    cr = ''.join(('<b>%s</b>' if i == len(crumbs) - 1 else '<span>%s</span>' + I('chevron-right')) % T(*c) for i, c in enumerate(crumbs))
    return ('<div class="sv-win"><div class="sv-top"><span class="sv-brand"><img src="assets/logo.png" alt="NocoBase"><span>Studio</span></span>'
            '<i class="sep"></i>%s<span class="r"><span class="st-av">%s</span></span></div><div class="sv-body">%s</div></div>') % (cr, T('王', 'L'), body)
def stat(zh, en, val, dzh, den, good=True):
    return ('<div class="st-card db-stat"><small>%s</small><b>%s</b><span class="%s">%s</span></div>' %
            (T(zh, en), val, 'up' if good else '', T(dzh, den)))
def use(name, k, runs, inp, out, cost):
    return '<tr><td><span class="who"><span class="st-a %s">%s</span>%s</span></td><td>%s</td><td>%s</td><td>%s</td><td><b>%s</b></td></tr>' % (k, {'cc': 'CC', 'cx': 'CX', 'oc': 'OC'}[k], name, runs, inp, out, cost)
dash = win([('仪表盘', 'Dashboard')],
    '<div class="db-hd"><div><h4>' + T('仪表盘', 'Dashboard') + '</h4><p>' + T('交付进展如何、Agent 表现怎样，以及哪些工作卡住了。', 'How delivery goes, how the agents perform, and what is stuck.') + '</p></div>' +
      '<span class="db-seg"><i>' + T('7 天', '7 days') + '</i><i class="on">' + T('30 天', '30 days') + '</i><i>' + T('90 天', '90 days') + '</i></span></div>' +
    '<div class="db-stats">' +
      stat('完成任务', 'Issues completed', '168', '上一周期 137', 'vs 137 before') +
      stat('周期时间中位数', 'Median cycle time', T('1.6 天', '1.6 days'), '上一周期 2.3 天', 'vs 2.3 days before') +
      stat('Agent 完成占比', 'Completed by agents', '93%', '上一周期 88%', 'vs 88% before') +
      stat('单任务成本', 'Cost per issue', T('¥ 28', '$3.90'), '上一周期 ¥ 31', 'vs $4.30 before') +
    '</div>' +
    '<div class="st-card"><div class="sv-ch"><b>' + T('模型用量', 'Model usage') + '</b><span>' + T('Agent 运行消耗的 token，以及按当前价格估算的费用', 'Tokens used by agent runs, and the estimated cost at current prices') + '</span></div>' +
      '<table class="st-tbl db-use"><thead><tr><th>' + T('模型', 'Model') + '</th><th>' + T('运行次数', 'Runs') + '</th><th>' + T('输入', 'Input') + '</th><th>' + T('输出', 'Output') + '</th><th>' + T('估算费用', 'Est. cost') + '</th></tr></thead><tbody>' +
      use('Claude · Opus 5.5', 'cc', '412', '84.1M', '6.2M', T('¥ 2,140', '$296')) +
      use('Codex · GPT-5.5', 'cx', '538', '109.6M', '7.9M', T('¥ 1,860', '$258')) +
      use('Claude · Sonnet 5.5', 'cc', '366', '48.7M', '3.4M', T('¥ 610', '$85')) +
      use('OpenCode · DeepSeek V4', 'oc', '201', '35.2M', '2.6M', T('¥ 96', '$13')) +
      '<tr class="tot"><td>' + T('合计', 'Total') + '</td><td>1,517</td><td>277.6M</td><td>20.1M</td><td><b>' + T('¥ 4,706', '$652') + '</b></td></tr>' +
    '</tbody></table></div>')
AGN = {'cc': 'CC', 'cx': 'CX', 'pm': None}
def ag(k): return '<span class="st-a %s">%s</span>' % (k, AGN[k] or T('调', 'C'))
def si(k): return '<span class="si %s"></span>' % k
SPIN = '<span class="st-spin"></span>'
def step(state, zh, en, who=None, small=None):
    mark = SPIN if state == 'run' else si(state)
    tail = ('<span class="who">%s%s</span>' % (ag(who[0]), who[1])) if who else ('<span class="who db-me"><span class="st-av">%s</span>%s</span>' % (T('陈', 'A'), T('陈思', 'Ava')))
    return '<div class="st-step%s">%s<span>%s%s</span>%s</div>' % (' off' if state == 'backlog' else '', mark, T(zh, en), ('<small>%s</small>' % T(*small)) if small else '', tail)
def le(badge, zh, en, t):
    return '<div class="st-le">%s<div>%s</div><time>%s</time></div>' % (badge, T(zh, en), t)
task = win([('我的任务', 'My issues'), ('SUP-91', 'SUP-91')],
    '<div class="sv-dh"><div><h4>' + T('退款工单 SLA 提醒', 'Refund ticket SLA alerts') + '</h4>' +
      '<div class="st-meta"><span><span class="k">' + T('负责人', 'Owner') + '</span><span class="st-av">' + T('陈', 'A') + '</span>' + T('陈思', 'Ava Clarke') + '</span>' +
      '<span><span class="k">' + T('执行者', 'Executor') + '</span>' + ag('pm') + T('调度 Agent', 'Coordinator') + '</span>' +
      '<span><span class="k">' + T('项目', 'Project') + '</span>' + T('客服工单', 'Support desk') + '</span></div></div>' +
      '<span class="st-pill">' + si('progress') + T('进行中', 'In progress') + '</span></div>' +
    '<div class="db-now"><div class="h">' + I('activity') + T('现在', 'Now') + '</div>' +
      '<p>' + SPIN + T('<b>Claude Code</b> 正在为 4 个超时场景写测试', '<b>Claude Code</b> is writing tests for the 4 timeout scenarios') + '</p>' +
      '<p class="m">' + T('已运行 12 分钟 · 在 Server 03', 'Running for 12 minutes · on Server 03') + '</p>' +
      '<p class="nx">' + T('接下来：测试通过后换一个模型评审代码，再交给陈思验收。', 'Next: once the tests pass, a different model reviews the code, then it goes to Ava for sign-off.') + '</p></div>' +
    '<div class="st-box"><div class="h">' + I('list-checks') + T('执行计划', 'Plan') + '<span class="r">' + T('第 3 / 5 步', 'Step 3 of 5') + '</span></div>' +
      step('done', '梳理 SLA 规则与 4 个超时场景', 'SLA rules and 4 timeout scenarios', ('cc', 'Claude Code')) +
      step('done', '工单字段与超时提醒', 'Ticket fields and timeout alerts', ('cx', 'Codex')) +
      step('run', '为 4 个超时场景写测试', 'Tests for the 4 timeout scenarios', ('cc', 'Claude Code'), ('12 / 16 通过', '12 / 16 passing')) +
      step('backlog', '代码评审（换一个模型）', 'Code review by a different model', ('cc', 'Claude Code')) +
      step('backlog', '验收', 'Sign-off') +
    '</div>' +
    '<div class="st-log">' +
      le(ag('pm'), '<b>调度 Agent</b> 把第 3 步交给 Claude Code', '<b>Coordinator</b> gave step 3 to Claude Code', '14:08') +
      le(ag('cx'), '<b>Codex</b> 完成第 2 步，PR #318 已提交', '<b>Codex</b> finished step 2 and opened PR #318', '13:55') +
    '</div>')
studio_dash = '<div class="db">' + dash + task + '</div>'

snipdir = os.path.join(here, 'snips')
for name, html in (('coreStack', core_stack), ('coreRepo', core_repo), ('studioDash', studio_dash)):
    open(os.path.join(snipdir, name + '.html'), 'w', encoding='utf-8').write(html)

css = open(os.path.join(here, 'product-pages.css'), encoding='utf-8').read().strip() + '\n'
block = '/* PRODUCT-PAGES */\n' + css + '/* /PRODUCT-PAGES */\n'
cp = os.path.join(root, 'assets', 'site.css')
c = open(cp, encoding='utf-8').read()
c, n = re.subn(r'/\* PRODUCT-PAGES \*/\n.*?/\* /PRODUCT-PAGES \*/\n', lambda m: block, c, flags=re.S)
if not n:
    c = c.rstrip('\n') + '\n' + block
open(cp, 'w', encoding='utf-8').write(c)
print('snips', {'coreStack': len(core_stack), 'coreRepo': len(core_repo), 'studioDash': len(studio_dash)}, 'css', len(css))
