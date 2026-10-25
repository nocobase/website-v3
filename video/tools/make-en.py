#!/usr/bin/env python3
"""英文版：从中文版 src/film.js 生成 src/film-en.js（skill nocobase-video · languages.md 的「替换脚本」做法）。

- 每条替换写明应当命中的次数，命中次数不对就报错，不会悄悄漏掉或多换。
- 英文文案按《NocoBase Product Definition and Messaging》（../NocoBase Product Definition and Messaging.md）：
  品牌表达、定义、核心特色用原句或缩写，术语按它的术语表；屏幕放不下时先缩短说法。
- 人名按技能的英文固定角色表，原来的头像不变（NBFilm 的 avatars 参数）；金额 ¥ → $，数字不变。
- 时间表不动：打字按中文版的时长打完，键盘音效次数照旧，所以事件表和中文版逐条相同，配乐和混音直接沿用。
- 生成的文件不要手改，要改就改这个脚本。最后检查代码里（注释和段落名 K.beat 之外）没有剩下中文。
用法（在 video 目录下）：python3 tools/make-en.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = (ROOT / 'src/film.js').read_text(encoding='utf-8')
s = src
errors = []


def r(old, new, n=1):
    """把 old 换成 new；old 必须正好出现 n 次"""
    global s
    k = s.count(old)
    if k != n:
        errors.append(f'{k}× (expected {n}): {old[:70]}')
        return
    s = s.replace(old, new)


# ---------------------------------------------------------------- 人物：英文固定角色表，头像沿用中文版的
r("const K = NBFilm({ T }),",
  "const K = NBFilm({ T, avatars: { 'Owen Hart': '周航', 'Ethan Walker': '王磊', 'Maya Brooks': '林悦', 'Marcus Lee': '陈宇', 'Olivia Hayes': '孙悦', 'Emily Carter': '何静' } }),")
r("avatar('周航')", "avatar('Owen Hart')", 3)
r("avatar('王磊')", "avatar('Ethan Walker')", 2)
r("avatar('林悦')", "avatar('Maya Brooks')", 2)

# ---------------------------------------------------------------- 开场
r("const ASKQ = '你在用 AI 开发业务系统吗？';", "const ASKQ = 'Building business systems with AI?';")
r("const PROMPT = '帮我做一个供应商管理系统';", "const PROMPT = 'Build me a supplier management system';")
r("TB = { cc: 'CC', cx: 'CX', oc: 'OC', cu: 'CU', pm: '调' }", "TB = { cc: 'CC', cx: 'CX', oc: 'OC', cu: 'CU', pm: 'C' }")
# 提示词在中文版的时长里打完（12 个字 × 0.06 秒），键盘音效照旧 12 次
r("K.typeOn(ptx, PROMPT, T.type, 0.05);", "K.typeOn(ptx, PROMPT, T.type, 12 * 0.05 / PROMPT.length);")
r("for (let k = 0; k < PROMPT.length; k++) K.sfx('key'", "for (let k = 0; k < 12; k++) K.sfx('key'")
r("['ok', '已在本地运行  localhost:3000']", "['ok', 'Running locally  localhost:3000']")
r("K.modeHTML('01', '单独使用 Coding Agent')", "K.modeHTML('01', 'Coding agents alone')")
r('<span class="h1 split">AI 写代码很快，</span><span class="h2 split">但构建可靠的业务系统依然不简单。</span>',
  '<span class="h1 split">AI writes code fast.</span><span class="h2 split">Building reliable business systems is still hard.</span>')

# ---------------------------------------------------------------- 四个问题（标题按英文标准文稿，说明是缩写）
r("{ t: '底层能力要从零建设', d: '权限、工作流引擎、审批等底层模块从零开发，边界情况多，维护工作量大。', by: 'NocoBase Core', fix: '现成的基础能力，由 NocoBase 持续维护和升级' }",
  "{ t: 'Every project rebuilds the foundation', d: 'Permissions, workflow engines, and approvals are hard to design from scratch.', by: 'NocoBase Core', fix: 'Ready-made building blocks, maintained by NocoBase' }")
r("{ t: '架构随机漂移，逐渐失控', d: '换人、换模型甚至换会话，AI 都可能随机发挥，系统越来越难维护。', by: 'NocoBase Core', fix: '统一的项目结构和开发规范' }",
  "{ t: 'Architecture drifts out of control', d: 'Switch developers, models, or even sessions, and the AI may improvise.', by: 'NocoBase Core', fix: 'One architecture, one set of standards' }")
r("{ t: '并行任务很多，人确认不过来', d: 'Agent 交过来的改动也越来越多，人看不过来，又不敢放手。', by: 'NocoBase Studio', fix: '统一调度 Agent 团队，人有理有据做决策' }",
  "{ t: 'Parallel work outpaces human review', d: 'Agents hand back more changes than anyone can review.', by: 'NocoBase Studio', fix: 'One agent team, decisions backed by evidence' }")
r("{ t: '知识和经验难以沉淀和共享', d: '需求背景、业务资料、项目经验散落在不同电脑的不同会话里。', by: 'NocoBase Studio', fix: '技能、知识库和项目记忆，换人、换 Agent 都能交接' }",
  "{ t: 'Know-how is hard to capture and share', d: 'Context, documents, and lessons are scattered across chat sessions.', by: 'NocoBase Studio', fix: 'Skills, knowledge base, and project memory' }")
r("const WARN = ['并发审批冲突', '越权查看其他部门', '流程回退丢数据'];", "const WARN = ['Approvals collide', 'Cross-team data leaks', 'Rollbacks lose data'];")
r("['cc', '王磊 · Claude Code', '供应商分级', ['src/',", "['cc', 'Ethan · Claude Code', 'Supplier tiers', ['src/',")
r("['cx', '陈宇 · Codex', '对接 ERP', ['app/',", "['cx', 'Marcus · Codex', 'ERP sync', ['app/',")
r("['cu', '新会话 · Cursor', '资质提醒', ['lib/',", "['cu', 'New session · Cursor', 'Expiry alerts', ['lib/',")
r("const IL3 = [['PUR-23', '分级规则', 'cx'], ['PUR-24', '季度重算', 'cc'], ['PUR-31', 'ERP 同步', 'cu'], ['PUR-33', '资质提醒', 'cx'], ['PUR-36', '移动端审批', 'cc']];",
  "const IL3 = [['PUR-23', 'Tier rules', 'cx'], ['PUR-24', 'Quarterly recalc', 'cc'], ['PUR-31', 'ERP sync', 'cu'], ['PUR-33', 'Expiry alerts', 'cx'], ['PUR-36', 'Mobile approvals', 'cc']];")
r("const IL4 = [['王磊的 Mac · 会话', '3 天前', '《采购管理办法》摘录'], ['陈宇的电脑 · 会话', '2 周前', 'ERP 接口说明'], ['已关闭的会话', '1 个月前', '评分权重的讨论']];",
  "const IL4 = [['Ethan’s Mac', '3 days ago', 'Procurement Policy'], ['Marcus’s PC', 'Last week', 'ERP API notes'], ['Closed chat', 'Last month', 'Scoring weights']];")
r('<span class="ws2">等你看</span>', '<span class="ws2">To review</span>')
r('<small>待你看的改动</small>', '<small>Changes to review</small>')
r('<small>林悦 · 刚接手</small><span>财务复核为什么是 50 万？</span>', '<small>Maya Brooks · just joined</small><span>Why does finance review start at $500,000?</span>')

# ---------------------------------------------------------------- 供应商（虚构）与部门
r("['SUP-0412', '华东精工', '生产部', '机加工 · 精密零件', '2026-11-20', '¥1,280,000']", "['SUP-0412', 'Eastline Precision', 'Production', 'Machining · precision parts', '2026-11-20', '$1,280,000']")
r("['SUP-0398', '鑫源电子', '研发部', '电子料 · 传感器', '2027-03-08', '¥640,000']", "['SUP-0398', 'Brightsource', 'R&D', 'Electronics · sensors', '2027-03-08', '$640,000']")
r("['SUP-0377', '明川包装', '生产部', '包材 · 纸箱', '2026-11-05', '¥86,000']", "['SUP-0377', 'Clearwater Packaging', 'Production', 'Packaging · cartons', '2026-11-05', '$86,000']")
r("['SUP-0365', '恒泰物流', '行政部', '物流 · 城配', '2027-01-15', '¥320,000']", "['SUP-0365', 'Steadfast Logistics', 'Admin', 'Logistics · local delivery', '2027-01-15', '$320,000']")
r("['SUP-0351', '盛达化工', '生产部', '原料 · 树脂', '2026-12-02', '¥560,000']", "['SUP-0351', 'Summit Chemicals', 'Production', 'Materials · resins', '2026-12-02', '$560,000']")

# ---------------------------------------------------------------- 能力看板（名称按官网 Core 页的英文）
CAPS = [
    ("['数据建模', 'database', '#1677ff', `<div class=\"c-er\">${[['供应商', 3], ['资质', 2], ['合同', 3]]",
     "['Data modeling', 'database', '#1677ff', `<div class=\"c-er\">${[['Supplier', 3], ['License', 2], ['Contract', 3]]"),
    ("['权限控制', 'shield', '#059669', `<div class=\"c-mx\"><span></span><em>查看</em><em>编辑</em><em>审批</em>",
     "['Permissions', 'shield', '#059669', `<div class=\"c-mx\"><span></span><em>View</em><em>Edit</em><em>Approve</em>"),
    ("<span>采购主管</span>${cY}${cY}${cY}<span>采购员</span>${cY}${cY}${cN}<span>${ZH('供应商 Agent')}</span>",
     "<span>Manager</span>${cY}${cY}${cY}<span>Buyer</span>${cY}${cY}${cN}<span>Supplier agent</span>"),
    ("['工作流', 'git-branch', '#1677ff', `<div class=\"c-wn\"><div class=\"c-wd\"><em>触发</em>提交准入申请</div><i class=\"c-wc\"></i><div class=\"c-wd\"><em>条件</em>合同额 > 50 万</div><i class=\"c-wc\"></i><div class=\"c-wd\"><em>人工</em>财务复核</div></div>`]",
     "['Workflows', 'git-branch', '#1677ff', `<div class=\"c-wn\"><div class=\"c-wd\"><em>Trigger</em>Onboarding request</div><i class=\"c-wc\"></i><div class=\"c-wd\"><em>If</em>Contract > $500K</div><i class=\"c-wc\"></i><div class=\"c-wd\"><em>Manual</em>Finance review</div></div>`]"),
    ("['审批', 'list-checks', '#d97706', `<div class=\"c-ap\"><div class=\"c-r\"><b>准入审批</b><span class=\"c-tg c-am\">待审批</span></div><div class=\"c-r c-mu\">华东精工 · ${ZH('¥1,280,000')}</div>",
     "['Approvals', 'list-checks', '#d97706', `<div class=\"c-ap\"><div class=\"c-r\"><b>Onboarding</b><span class=\"c-tg c-am\">Pending</span></div><div class=\"c-r c-mu\">Eastline · $1,280,000</div>"),
    ('<span class="c-bt c-pr">同意</span><span class="c-bt">驳回</span><span class="c-bt">转交</span>',
     '<span class="c-bt c-pr">Approve</span><span class="c-bt">Reject</span><span class="c-bt">Pass on</span>'),
    ("['用户与组织', 'users', '#4f46e5', `<div class=\"c-og\">${[['采购部', 12, ['周', '#1677ff'], ['陈', '#0891b2']], ['生产部', 38, ['孙', '#059669'], ['赵', '#d97706']], ['财务部', 6, ['何', '#7c3aed'], ['钱', '#e11d48']]]",
     "['Users & orgs', 'users', '#4f46e5', `<div class=\"c-og\">${[['Purchasing', 12, ['O', '#1677ff'], ['M', '#0891b2']], ['Production', 38, ['O', '#059669'], ['J', '#d97706']], ['Finance', 6, ['E', '#7c3aed'], ['G', '#e11d48']]]"),
    ('<span class="c-mu">${k} 人</span>', '<span class="c-mu">${k} people</span>'),
    ("['身份认证', 'key-round', '#4f46e5', `<div class=\"c-au\"><span class=\"c-bt\">账号密码登录</span><span class=\"c-bt c-pr\">${ZH('OIDC')} 单点登录</span><div class=\"c-r c-mu\">会话管理 · ${ZH('API Key')}</div></div>`]",
     "['Authentication', 'key-round', '#4f46e5', `<div class=\"c-au\"><span class=\"c-bt\">Password sign-in</span><span class=\"c-bt c-pr\">OIDC single sign-on</span><div class=\"c-r c-mu\">Sessions · API keys</div></div>`]"),
    ("['数据源', 'cable', '#0d9488', `<div class=\"c-ds\">${[['主数据库', 'PostgreSQL', ''], ['ERP', 'SQL Server', '外部'], ['MES', 'MySQL', '外部']]",
     "['Data sources', 'cable', '#0d9488', `<div class=\"c-ds\">${[['Main DB', 'PostgreSQL', ''], ['ERP', 'SQL Server', 'External'], ['MES', 'MySQL', 'External']]"),
    ("['文件管理', 'folder-open', '#d97706', `<div class=\"c-fl\">${[['营业执照.pdf', '1.2 MB'], ['质检报告.pdf', '860 KB']]",
     "['Files', 'folder-open', '#d97706', `<div class=\"c-fl\">${[['business-license.pdf', '1.2 MB'], ['qa-report.pdf', '860 KB']]"),
    ("${ic('eye')}在线预览 · ${ZH('S3')} 兼容存储", "${ic('eye')}Online preview · S3-compatible"),
    ("['消息通知', 'bell', '#ef4444', `<div class=\"c-nt\"><div class=\"c-ts\">${ic('bell')}<span>明川包装 · 资质 30 天后到期</span></div><div class=\"c-r\">${['站内信', '邮件', '飞书', '钉钉']",
     "['Notifications', 'bell', '#ef4444', `<div class=\"c-nt\"><div class=\"c-ts\">${ic('bell')}<span>Clearwater · expires in 30 days</span></div><div class=\"c-r\">${['In-app', 'Email', 'Webhook']"),
    ("['邮件互通', 'mail', '#0891b2', `<div class=\"c-ml\">${[['华东精工', '回复：年度报价单', '10:12'], ['鑫源电子', '资质文件已更新', '09:40']]",
     "['Email', 'mail', '#0891b2', `<div class=\"c-ml\">${[['Eastline', 'Re: annual quote', '10:12'], ['Brightsource', 'New license', '09:40']]"),
    ("${ic('link')}往来邮件自动关联供应商", "${ic('link')}Mail linked to each supplier"),
    ("['定时任务', 'alarm-clock', '#ea580c', `<div class=\"c-cr\"><div class=\"c-r\"><b class=\"c-hm\">09:00</b><span>每天 · 资质到期检查</span></div>",
     "['Scheduled jobs', 'alarm-clock', '#ea580c', `<div class=\"c-cr\"><div class=\"c-r\"><b class=\"c-hm\">09:00</b><span>Daily · expiry check</span></div>"),
    ('<span class="c-mu">最近 6 次 · 成功</span>', '<span class="c-mu">Last 6 runs · OK</span>'),
    ("['流程图', 'workflow', '#7c3aed', `<div class=\"c-sg\"><div class=\"c-bar\">${['申请', '财务复核', '准入']",
     "['Stages', 'workflow', '#7c3aed', `<div class=\"c-sg\"><div class=\"c-bar\">${['Request', 'Finance', 'Onboarded']"),
    ('<div class="c-r c-mu">华东精工 · 财务复核中</div>', '<div class="c-r c-mu">Eastline · in finance review</div>'),
    ("['模板打印', 'printer', '#e11d48', `<div class=\"c-pt\"><div class=\"c-pg\"><b>采购合同</b>", "['Doc templates', 'printer', '#e11d48', `<div class=\"c-pt\"><div class=\"c-pg\"><b>Contract</b>"),
    ('<span class="c-mu">绑定字段<br>自动生成</span>', '<span class="c-mu">Bound fields<br>filled in</span>'),
    ("['看板', 'kanban', '#0d9488', `<div class=\"c-kb\">${[['待准入', 2], ['合作中', 3], ['暂停', 1]]", "['Kanban', 'kanban', '#0d9488', `<div class=\"c-kb\">${[['Pending', 2], ['Active', 3], ['Paused', 1]]"),
    ("['后台任务', 'timer', '#475569', `<div class=\"c-bg\"><div class=\"c-r\"><b>导出供应商清单</b>", "['Async tasks', 'timer', '#475569', `<div class=\"c-bg\"><div class=\"c-r\"><b>Export suppliers</b>"),
    ("${ZH('2,176 / 3,200')} 条 · 后台运行", "2,176 / 3,200 rows · running"),
    ("['开放 API', 'braces',", "['Open API', 'braces',"),
    ("['AI 员工', 'sparkles', '#7c3aed', `<div class=\"c-ae\"><span class=\"c-bo\">${ic('bot')}</span><div class=\"c-bu\">3 家供应商的资质下月到期，清单已经整理好。</div></div>`]",
     "['AI employees', 'sparkles', '#7c3aed', `<div class=\"c-ae\"><span class=\"c-bo\">${ic('bot')}</span><div class=\"c-bu\">3 suppliers’ certificates expire next month. The list is ready.</div></div>`]"),
    ("['知识库', 'book-open', '#7c3aed', `<div class=\"c-kn\">${[['《供应商准入制度》', 1], ['《采购管理办法》', 0], ['《质量协议模板》', 0]]",
     "['Knowledge base', 'book-open', '#7c3aed', `<div class=\"c-kn\">${[['Onboarding Policy', 1], ['Procurement Policy', 0], ['Quality Agreement', 0]]"),
    ("'<span class=\"c-tg c-pu\">已引用</span>'", "'<span class=\"c-tg c-pu\">Cited</span>'"),
    ("['模型接入', 'shuffle',", "['Models', 'shuffle',"),
    ("['通义千问', '#615ced'], ['Kimi', '#27272a'], ['本地模型', '#a1a1aa']", "['Qwen', '#615ced'], ['Kimi', '#27272a'], ['Local models', '#a1a1aa']"),
    ("['处理记录', 'history', '#475569', `<div class=\"c-ml\">${[['周航', '修改准入状态', '10:12'], ['供应商 Agent', '读取资质文件', '09:40']]",
     "['Records', 'history', '#475569', `<div class=\"c-ml\">${[['Owen Hart', 'Updated status', '10:12'], ['Supplier agent', 'Read files', '09:40']]"),
    ("${ic('history')}谁做的、改了什么，都有记录", "${ic('history')}Who did what, all on record"),
    ("['界面与配置', 'layout-grid',", "['UI & settings', 'layout-grid',"),
    ("['多语言', 'languages', '#4f46e5', `<div class=\"c-lg\"><div class=\"c-seg\"><span class=\"c-on\">中文</span><span>${ZH('English')}</span></div><div class=\"c-r\"><b>供应商</b><span class=\"c-mu\">${ZH('Suppliers')}</span></div><div class=\"c-r\"><b>资质到期</b><span class=\"c-mu\">${ZH('Expiring')}</span></div></div>`]",
     "['Languages', 'languages', '#4f46e5', `<div class=\"c-lg\"><div class=\"c-seg\"><span class=\"c-on\">English</span><span>Deutsch</span></div><div class=\"c-r\"><b>Suppliers</b><span class=\"c-mu\">Lieferanten</span></div><div class=\"c-r\"><b>Expiring</b><span class=\"c-mu\">Ablaufend</span></div></div>`]"),
    ("['主题定制', 'palette',", "['Themes', 'palette',"),
    ("${ic('sun')}浅色</span><span>${ic('moon')}深色</span></div><div class=\"c-r c-mu\">紧凑 · 舒适 · 品牌色</div>",
     "${ic('sun')}Light</span><span>${ic('moon')}Dark</span></div><div class=\"c-r c-mu\">Compact · cozy · brand</div>"),
    ("['部署与升级', 'server', '#475569', `<div class=\"c-dp\"><div class=\"c-r\"><span class=\"c-ln2\">测试</span>", "['Deployment', 'server', '#475569', `<div class=\"c-dp\"><div class=\"c-r\"><span class=\"c-ln2\">Test</span>"),
    ('<span class="c-ln2">生产</span>', '<span class="c-ln2">Prod</span>'),
    ('<div class="c-r c-mu">部署 · 升级 · 回滚</div>', '<div class="c-r c-mu">Deploy · upgrade · roll back</div>'),
]
for a, b in CAPS:
    r(a, b)

# ---------------------------------------------------------------- 统一架构
r("const ARCH = [['cc', '王磊 · Claude Code', '供应商分级', 'tiering'], ['cx', '陈宇 · Codex', '对接 ERP', 'erp'], ['cu', '新会话 · Cursor', '资质提醒', 'qualifications']];",
  "const ARCH = [['cc', 'Ethan · Claude Code', 'Supplier tiers', 'tiering'], ['cx', 'Marcus · Codex', 'ERP sync', 'erp'], ['cu', 'New session · Cursor', 'Expiry alerts', 'qualifications']];")
r("['项目脚手架', '架构规范', '开发技能']", "['Project scaffolding', 'Architecture standards', 'Dev skills']")
r("['nocobase-app-development', '开发规范', '评审规范']", "['nocobase-app-development', 'Dev standards', 'Review standards']")
r("pill('', 'run', '结构一致 · 3 / 3')", "pill('', 'run', 'Consistent structure · 3 / 3')")
r("f + ' · 按开发规范开发'", "f + ' · to the standards'")
r("K.agentAs('agtA', 'Cursor', '资质提醒 · 按开发规范开发', 'done'", "K.agentAs('agtA', 'Cursor', 'Expiry alerts · to the standards', 'done'")

# ---------------------------------------------------------------- Studio 控制台（菜单按官网英文版的 Studio 侧栏）
r("it('mine', 'list-todo', '我的任务', 2)}${it('agent', 'message-square', '我的会话')}${it('dash', 'layout-dashboard', '仪表盘')}",
  "it('mine', 'list-todo', 'My tasks', 2)}${it('agent', 'message-square', 'My sessions')}${it('dash', 'layout-dashboard', 'Dashboard')}")
r("<div class=\"grp\">开发</div>${it('task', 'square-check', '任务')}${it('proj', 'folder-kanban', '项目')}${it('kb', 'book-open', '知识库')}${it('mem', 'brain', '项目记忆')}",
  "<div class=\"grp\">Build</div>${it('task', 'square-check', 'Tasks')}${it('proj', 'folder-kanban', 'Projects')}${it('kb', 'book-open', 'Knowledge')}${it('mem', 'brain', 'Project memory')}")
r("<div class=\"grp\">质量</div>${it('qa', 'shield-check', '质量报告')}${it('cases', 'list-checks', '功能与用例')}",
  "<div class=\"grp\">Quality</div>${it('qa', 'shield-check', 'Quality reports')}${it('cases', 'list-checks', 'Features & cases')}")
r("<div class=\"grp\">发布</div>${it('apps', 'box', '应用')}${it('env', 'server', '部署环境')}",
  "<div class=\"grp\">Release</div>${it('apps', 'box', 'Apps')}${it('env', 'server', 'Environments')}")
r("<div class=\"grp\">Agent 管理</div>${it('agents', 'bot', 'Agent')}${it('runners', 'cpu', '运行环境')}${it('skills', 'wand-sparkles', '技能')}",
  "<div class=\"grp\">Agent team</div>${it('agents', 'bot', 'Agents')}${it('runners', 'cpu', 'Runtimes')}${it('skills', 'wand-sparkles', 'Skills')}")

# 我的会话
r("const TASKS = [['PUR-23', '分级规则与评分', 'cx', 'Codex · Server 02'], ['PUR-24', '每季度自动重算', 'cc', 'Claude Code · Server 03'], ['PUR-25', '分级看板', 'oc', 'OpenCode · Server 05']];",
  "const TASKS = [['PUR-23', 'Tier rules & scoring', 'cx', 'Codex · Server 02'], ['PUR-24', 'Quarterly recalculation', 'cc', 'Claude Code · Server 03'], ['PUR-25', 'Tier board', 'oc', 'OpenCode · Server 05']];")
r("const ASK = '供应商要按 A/B/C 分级：质量、交期、价格打分，每季度重算。';", "const ASK = 'Tier suppliers A/B/C on quality, delivery, and price. Recalculate every quarter.';")
# 消息在中文版的时长里打完（32 个字 × 0.03 秒），发送时刻不变
r("K.typeOn(inp, ASK, ty, 0.03);", "K.typeOn(inp, ASK, ty, 32 * 0.03 / ASK.length);")
r("const sent = ty + ASK.length * 0.03 + 0.2;", "const sent = ty + 32 * 0.03 + 0.2;")
r('<div class="phd ahd"><b>供应商分级</b><small>Claude Code · Opus 5.5 · 周航的电脑<i></i></small></div>', '<div class="phd ahd"><b>Supplier tiers</b><small>Claude Code · Opus 5.5 · Owen’s computer<i></i></small></div>')
r('<div class="mt">读了知识库《采购管理办法》和 2 条项目记忆。拆成 3 个任务：</div>', '<div class="mt">Read the Procurement Policy and 2 project memories. Here are 3 tasks:</div>')
r("${ic('check')}已交给 Agent 团队 · 调度 Agent 分派到 3 台机器", "${ic('check')}Handed to the agent team · the coordinator picked 3 machines")
r("回复，或说下一件事…", "Reply, or start the next thing…", 2)
r("<span><b>周航</b><small>业务负责人 · 定规则、验收</small></span>", "<span><b>Owen Hart</b><small>Business owner · sets rules, accepts</small></span>")
r("<span><b>王磊</b><small>技术负责人 · 批准上线</small></span>", "<span><b>Ethan Walker</b><small>Tech lead · approves releases</small></span>")
r("<span><b>调度 Agent</b><small>拆分、分派、提问、交付</small></span>", "<span><b>Coordinator agent</b><small>Splits, assigns, asks, delivers</small></span>")
r('<div class="ah">任务<small id="aN">0</small></div><div class="aE" id="aE">这段对话还没有任务</div>', '<div class="ah">Tasks<small id="aN">0</small></div><div class="aE" id="aE">No tasks in this chat yet</div>')
r("pill('aS' + k, 'idle', '待规划')", "pill('aS' + k, 'idle', 'To plan')")

# 任务
r("const PLAN = [['梳理分级规则与 6 个验收场景', 'cc', 'Claude · Opus 5.5', 'done'], ['分级字段与数据迁移', 'cx', 'Codex · GPT-5.5', 'done'],",
  "const PLAN = [['Tier rules & 6 acceptance scenarios', 'cc', 'Claude · Opus 5.5', 'done'], ['Tier field & data migration', 'cx', 'Codex · GPT-5.5', 'done'],")
r("['评分计算与季度重算', 'cx', 'Codex · GPT-5.5', 'run'], ['为 6 个验收场景写测试', 'cc', 'Claude · Sonnet 5.5', 'run'], ['代码评审（换一家模型）', 'cc', 'Claude · Opus 5.5', 'todo']];",
  "['Scoring & quarterly recalculation', 'cx', 'Codex · GPT-5.5', 'run'], ['Tests for the 6 scenarios', 'cc', 'Claude · Sonnet 5.5', 'run'], ['Code review (another vendor’s model)', 'cc', 'Claude · Opus 5.5', 'todo']];")
r("['pm', '调度 Agent', '把第 2–4 步分给 Codex 和 Claude', '18:36'],", "['pm', 'Coordinator', 'Assigned steps 2–4 to Codex and Claude', '18:36'],")
r("['cx', 'Codex', '评分计算完成，提交 PR #231', '21:08'],", "['cx', 'Codex', 'Scoring done, opened PR #231', '21:08'],")
r("['cc', 'Claude · Sonnet', '6 个场景的测试 46/46 通过', '22:14'],", "['cc', 'Claude · Sonnet', 'Tests for 6 scenarios: 46/46 passing', '22:14'],")
r("['cc', 'Claude · Opus', '评审：1 处要改，新接口少了权限检查', '22:51', 'am'],", "['cc', 'Claude · Opus', 'Review: 1 fix, a new endpoint lacks a permission check', '22:51', 'am'],")
r("['cx', 'Codex', '已修改，评审通过', '23:18', 'ok'],", "['cx', 'Codex', 'Fixed, review passed', '23:18', 'ok'],")
r("['pm', '调度 Agent', '交给周航验收 · 附报告、清单和截图', '23:40'],", "['pm', 'Coordinator', 'To Owen for acceptance, with report, checklist, screenshots', '23:40'],")
r('<b>分级规则与评分</b>${pill(\'tSt\', \'upd\', \'进行中\')}', '<b>Tier rules & scoring</b>${pill(\'tSt\', \'upd\', \'In progress\')}')
r("<span><small>负责人</small>${avatar('Owen Hart')}周航</span><span><small>执行</small>${tool('pm')}调度 Agent</span><span><small>项目</small>供应商管理</span>",
  "<span><small>Owner</small>${avatar('Owen Hart')}Owen Hart</span><span><small>Agent</small>${tool('pm')}Coordinator</span><span><small>Project</small>Supplier management</span>")
r('<b>执行计划</b><small id="plN">第 3 / 5 步 · 2 个 Agent 并行</small>', '<b>Plan</b><small id="plN">Step 3 of 5 · 2 agents in parallel</small>')
r("${ic('eye')}预览 · pur-23</span><span id=\"ciC\">${ic('circle-dashed')}CI 运行中</span>", "${ic('eye')}Preview</span><span id=\"ciC\">${ic('circle-dashed')}CI running</span>")
r('<div class="ach">动态</div>', '<div class="ach">Activity</div>')

# 我的任务：有据决策
r("<span><b>周航</b><small>采购主管 · 我的任务</small></span><em class=\"gc\" id=\"gZ\">等你处理 2</em>", "<span><b>Owen Hart</b><small>Procurement manager · My tasks</small></span><em class=\"gc\" id=\"gZ\">Needs you 2</em>")
r('<b>评分权重</b><small><span class="m">PUR-23</span> · <span class="w" id="dqs">等你决定：质量和交期，哪个更重要？</span></small>', '<b>Scoring weights</b><small><span class="m">PUR-23</span> · <span class="w" id="dqs">Your call: quality or delivery first?</span></small>')
r("${K.btnO('', '质量优先', 'qaY')}${K.btnO('', '交期优先')}", "${K.btnO('', 'Quality first', 'qaY')}${K.btnO('', 'Delivery first')}")
r('<b>供应商分级</b><small><span class="m">PUR-23</span> · <span class="w" id="dz0s">等你验收 · Agent 建议通过</span></small>', '<b>Supplier tiers</b><small><span class="m">PUR-23</span> · <span class="w" id="dz0s">Awaiting acceptance · agent recommends it</span></small>')
r("[['file-text', '验收报告'], ['list-checks', '清单 6 / 6'], ['image', '截图 6 张']]", "[['file-text', 'Report'], ['list-checks', 'Checklist 6 / 6'], ['image', '6 screenshots']]")
r("['A ≥ 85 分，B ≥ 70 分，其余为 C', '每季度 1 日自动重算', '生产部只看到本部门供应商']", "['A ≥ 85, B ≥ 70, the rest C', 'Recalculated on the 1st of each quarter', 'Production sees only its own suppliers']")
r("[['华东精工', 'A', 92.4], ['明川包装', 'B', 76.5], ['盛达化工', 'C', 64.0]]", "[['Eastline Precision', 'A', 92.4], ['Clearwater Packaging', 'B', 76.5], ['Summit Chemicals', 'C', 64.0]]")
r("${K.btnO('', '退回')}${K.btnD('check', '验收通过', 'accBtn')}", "${K.btnO('', 'Send back')}${K.btnD('check', 'Accept', 'accBtn')}")
r("<span><b>王磊</b><small>技术负责人 · 我的任务</small></span><em class=\"gc\" id=\"gW\">等你处理 2</em>", "<span><b>Ethan Walker</b><small>Tech lead · My tasks</small></span><em class=\"gc\" id=\"gW\">Needs you 2</em>")
r('<b>供应商管理 v1.1 上线生产</b><small><span class="m">PUR-23/24/25</span> · <span class="w" id="dw0s">等你批准 · 周航已验收 · 测试与评审通过</span></small>', '<b>Supplier management v1.1 to production</b><small><span class="m">PUR-23/24/25</span> · <span class="w" id="dw0s">Your approval · accepted, tests passed</span></small>')
r("${K.btnO('', '暂缓')}${K.btnD('rocket', '批准上线', 'wlBtn')}", "${K.btnO('', 'Hold')}${K.btnD('rocket', 'Approve release', 'wlBtn')}")
r('<b>资产领用归还</b><small><span class="m">ITAM-22</span> · NocoITAM · <span class="w">等你确认方案：新增数据表</span></small>', '<b>Asset checkout & return</b><small><span class="m">ITAM-22</span> · NocoITAM · <span class="w">Confirm the plan: a new table</span></small>')
r('<b>NocoCRM v1.9 上线生产</b><small><span class="m">CRM-150</span> · NocoCRM · <span class="w">等你批准 · 陈思已验收</span></small>', '<b>NocoCRM v1.9 to production</b><small><span class="m">CRM-150</span> · NocoCRM · <span class="w">Your approval · Ava accepted</span></small>')
r('<div class="gh more">进行中 14 · 已完成 41</div>', '<div class="gh more">In progress 14 · Done 41</div>')

# 项目记忆
r("const MEMS = [['生产部只看本部门供应商', 'fb', '孙悦确认：数据范围按部门划分，供应商 Agent 同样只读', '第 1 天'],", "const MEMS = [['Production sees only its suppliers', 'fb', 'Olivia: data scoped by department; the supplier agent reads only', 'Day 1'],")
r("['评分权重：质量优先', 'fb', '周航确认：分级打分时质量权重最高，其次是交期和价格', '第 2 周'],", "['Scoring weights: quality first', 'fb', 'Owen confirmed: quality weighs most, then delivery and price', 'Week 2'],")
r("['交付记录以 ERP 为准', 'pj', '交付与质检数据只从 ERP 读取，本系统不修改（陈宇）', '第 3 周'],", "['ERP is the source for deliveries', 'pj', 'Delivery and QA data come from ERP and are never changed here', 'Week 3'],")
r("['ERP 接口说明', 'rf', '字段含义和调用频率限制，见 IT 部 Wiki 的「ERP 接口」页', '第 3 周'],", "['ERP API notes', 'rf', 'Field meanings and rate limits: see the IT wiki page “ERP API”', 'Week 3'],")
r("['财务复核的 50 万阈值', 'pj', '来自《采购管理办法》第 12 条，调整前先和何静确认', '第 4 周'],", "['Finance review starts at $500,000', 'pj', 'From Procurement Policy §12. Check with Emily before changing', 'Week 4'],")
r("['新部门先配数据范围', 'fb', '刘博文确认：新部门上线前先配好权限范围，再开放页面', '第 6 周']];", "['New departments: scope data first', 'fb', 'Ryan confirmed: set permissions before opening new pages', 'Week 6']];")
r("const MTY = { fb: '反馈', pj: '项目', rf: '参考' };", "const MTY = { fb: 'Feedback', pj: 'Project', rf: 'Reference' };")
r("<div class=\"phd\"><b>项目记忆</b><small>${ZH('Agent 在任务中记下的经验，下次开工前先读')}</small></div>", "<div class=\"phd\"><b>Project memory</b><small>What agents learned on tasks, read before the next one starts</small></div>")
r("<span class=\"m-sel\"><small>项目</small>供应商管理${ic('chevron-down')}</span><span class=\"m-sel\"><small>仓库</small>", "<span class=\"m-sel\"><small>Project</small>Supplier management${ic('chevron-down')}</span><span class=\"m-sel\"><small>Repo</small>")
r("${ic('search')}搜索记忆</span><span class=\"m-st\">来自 <code>main@7c41e2a</code> · 12 条</span>", "${ic('search')}Search memories</span><span class=\"m-st\">From <code>main@7c41e2a</code> · 12 memories</span>")
r("<b>PUR-61 · 外协加工厂纳入分级</b><small>林悦接手 · ${tool('cc')}${ZH('Claude Code 开工前读了 12 条项目记忆')}</small>", "<b>PUR-61 · Tier outsourced plants too</b><small>Maya took over · ${tool('cc')}Claude Code read 12 memories first</small>")
r("${ZH('用到 2 条：外协厂也按质量优先打分，交付数据从 ERP 读取。')}", "Used 2: score outsourced plants quality-first; deliveries come from ERP.")
r("${ic('book-open')}知识库 2 篇${ic('wand-sparkles')}技能 4 个 · 一起带上", "${ic('book-open')}Knowledge: 2 docs${ic('wand-sparkles')}Skills: 4 · carried along")

# ---------------------------------------------------------------- 一年
r("const YEAR = [[2, '供应商分级'], [3, '对接 ERP'], [6, '新增生产二部'], [8, '外协厂纳入分级'], [14, '移动端审批'], [26, 'Core 升级'], [39, '负责人交接'], [48, '年度供应商评估']];",
  "const YEAR = [[2, 'Supplier tiers'], [3, 'ERP sync'], [6, 'New plant'], [8, 'Outsourced plants'], [14, 'Mobile approvals'], [26, 'Core upgrade'], [39, 'New tech lead'], [48, 'Annual supplier review']];")

# ---------------------------------------------------------------- 权限的列表
r("S.acl.viewers = [{ n: '周航', role: '采购主管', av: '周', all: true }, { n: '孙悦', role: '生产部', av: '孙', dept: '生产部' },",
  "S.acl.viewers = [{ n: 'Owen Hart', role: 'Manager', av: 'O', all: true }, { n: 'Olivia Hayes', role: 'Production', av: 'O', dept: 'Production' },")
r("{ n: '供应商 Agent', role: '业务 Agent · 生产部', av: ic('bot'), dept: '生产部' }];", "{ n: 'Supplier agent', role: 'Business agent · Production', av: ic('bot'), dept: 'Production' }];")
r("S.acl.text = { viewAs: '查看身份', cols: ['编号', '供应商', '品类', '资质到期', '合同额'], all: '全部部门', only: (d) => '仅' + d, count: '家供应商',",
  "S.acl.text = { viewAs: 'View as', cols: ['No.', 'Supplier', 'Category', 'Certificate expiry', 'Contract value'], all: 'All departments', only: (d) => d + ' only', count: 'suppliers',")
r("shown: '可编辑', masked: '只读', locked: '其他部门 · 无权查看' };", "shown: 'Editable', masked: 'Read-only', locked: 'Other department · no access' };")

# ---------------------------------------------------------------- 品牌
r("<div id=\"bPos\">用 ${ZH('AI')} 持续开发和运行业务系统</div>", "<div id=\"bPos\">Building, running, and evolving business systems with AI</div>")
r("${ZH('Agent 写代码、做执行')}", "Agents write the code and do the work")
r("</span>提供底座和治理能力</span>", "</span>provides the foundation and governance</span>")
r("${ic('user-round')}人来做决策</span>", "${ic('user-round')}People make the decisions</span>")

# ---------------------------------------------------------------- Core
r("S.stack.html({ chips: ['权限控制', '工作流与审批', '消息通知'], focusChip: '权限控制', more: '等 20+ 项基础能力', codeLabel: '供应商管理', codeBy: '业务代码 · AI 编写 · 4,860 行',",
  "S.stack.html({ chips: ['Permissions', 'Workflows', 'Notifications'], focusChip: 'Permissions', more: '20+ building blocks', baseSub: 'Application foundation', codeLabel: 'Supplier management', codeBy: 'Business logic · written by AI · 4,860 lines',")
r("K.chapHTML('chC', 'Core', ZH('让 Agent 专心写业务') + '，' + NB('底座已经就绪。'))", "K.chapHTML('chC', 'Core', 'Let agents focus on your business logic. ' + NB('The foundation is ready.'))")
r("K.ftlH('ftP', 'NocoBase Core · 基础能力', '权限控制', '数据范围按部门划分，Agent 继承负责人的权限', 'ftl ctr')",
  "K.ftlH('ftP', 'NocoBase Core · Building blocks', 'Permissions', 'Data is scoped by department, and each agent inherits the permissions of the person it works for', 'ftl ctr')")
r("<span class=\"hu\"><b>按部门划分数据范围</b>人和 Agent 用同一套角色与权限</span><span class=\"ag\"><b>供应商 Agent</b>和孙悦同样的范围 · 只读 · 不能修改准入状态</span>",
  "<span class=\"hu\"><b>Data scoped by department</b>People and agents share one set of roles and permissions</span><span class=\"ag\"><b>Supplier agent</b>Same scope as Olivia · read-only · can’t change onboarding status</span>")
r('<span class="k">Agent 编写</span><span class="r"></span><span class="f">server/workflows/<b>1,240 行</b></span>', '<span class="k">Written by agents</span><span class="r"></span><span class="f">server/workflows/<b>1,240 lines</b></span>')
r("K.ftl('ftW', 'NocoBase Core · 基础能力', '工作流与审批', '超出授权，交给人批准')", "K.ftl('ftW', 'NocoBase Core · Building blocks', 'Workflows<br>& approvals', 'Anything beyond its authority<br>goes to a person')")
r("</span>Agent 提建议，人做决定 · 每一次流转都有记录</div>", "</span>Agents propose, people decide · every step on record</div>")
r("K.typeOn($('#wfStrip .r'), '合同超过 50 万，转财务复核', at + 0.95, 0.045);", "K.typeOn($('#wfStrip .r'), 'Over $500,000 goes to finance review', at + 0.95, 0.03);")
r("$('#n1s').textContent = 'SUP-0412 华东精工 · 建议准入';", "$('#n1s').textContent = 'SUP-0412 Eastline · recommended';")
r("t.textContent = '何静 · 已批准';", "t.textContent = 'Emily Carter · approved';")
r("<div class=\"nt\">供应商 Agent 提交准入建议</div><div class=\"ns\" id=\"n1s\">业务 Agent · 依据《供应商准入规则》</div>", "<div class=\"nt\">Agent proposes onboarding</div><div class=\"ns\" id=\"n1s\">Supplier agent · Onboarding Rules</div>")
r("<div class=\"nt\">资质核对</div><div class=\"ns\">营业执照 · ISO 9001 · 有效期</div></div><span class=\"bd pill p-em\" id=\"n2b\">✓ 资质齐全</span>", "<div class=\"nt\">Certificate check</div><div class=\"ns\">License · ISO 9001 · dates</div></div><span class=\"bd pill p-em\" id=\"n2b\">✓ All valid</span>")
r(">合同额 &gt; ¥500,000 ?</div>", ">Contract &gt; $500,000 ?</div>")
r("color:var(--emerald)\">否</div>", "color:var(--emerald)\">No</div>")
r("color:var(--amber)\">是</div>", "color:var(--amber)\">Yes</div>")
r("<div class=\"nt\">采购主管审批</div><div class=\"ns\">人工审批</div>", "<div class=\"nt\">Manager approval</div><div class=\"ns\">By a person</div>")
r("<div class=\"nt\">财务复核</div><div class=\"ns\">人工复核 · 何静</div>", "<div class=\"nt\">Finance review</div><div class=\"ns\">By Emily Carter</div>")
r(">待复核</span>", ">Pending</span>")
r("<div class=\"nt\">准入生效 · 通知供应商</div><div class=\"ns\">写入准入记录 · 邮件通知</div></div><span class=\"bd pill p-em\" id=\"n4b\">✓ 完成</span>", "<div class=\"nt\">Supplier onboarded</div><div class=\"ns\">Saved · email sent</div></div><span class=\"bd pill p-em\" id=\"n4b\">✓ Done</span>")
r('<div id="cbCnt"><b id="cbN">0</b><i class="pl">+</i><span>项基础能力</span></div>', '<div id="cbCnt"><b id="cbN">0</b><i class="pl">+</i><span>building blocks</span></div>')
r("K.tcard('tWall', NB('基础能力') + '不用从头开发和验证', 336)}<div id=\"tWsub\">${ZH('Core 提供 20 多项基础能力，Agent 只专注于业务开发')}</div>",
  "K.tcard('tWall', NB('Proven building blocks') + ', ready to use', 336)}<div id=\"tWsub\">Core provides 20+ building blocks, so agents can focus on business logic.</div>")
r("K.ftlH('aT', 'NocoBase Core', '为 Agent 提供统一的架构和规范', 'Core 提供项目脚手架、架构规范和开发技能，换人、换模型，项目架构都能保持统一、受控。', 'hubT')",
  "K.ftlH('aT', 'NocoBase Core', 'One architecture, one set of standards', 'The architecture stays consistent and under control as people and models change.', 'hubT')")

# ---------------------------------------------------------------- Studio 的页头
r("K.chapHTML('chS', 'Studio', ZH('Agent 自主推进') + '，' + NB(ZH('团队掌控全局。')))", "K.chapHTML('chS', 'Studio', 'Agents keep the work moving. ' + NB('Your team stays in control.'))")
r("K.ftlH('cT0', 'NocoBase Studio', '一支持续推进的 Agent 团队', '接入多台机器上的 Agent 统一调度，24 小时同步推进多个项目和大量任务。', 'hubT')",
  "K.ftlH('cT0', 'NocoBase Studio', 'An agent team that keeps work moving', 'Agents across many machines, scheduled centrally, move work forward around the clock.', 'hubT')")
r("K.ftlH('cT1', 'NocoBase Studio', '各项进展一目了然', '项目进展、任务推进过程都清晰可见。', 'hubT')", "K.ftlH('cT1', 'NocoBase Studio', 'Progress at a glance', 'Project progress and task activity are all clearly visible.', 'hubT')")
r("K.ftlH('cT2', 'NocoBase Studio', '有理有据做决策', 'Agent 附上报告、清单、截图和建议，不懂代码的业务专家也可以直接拍板。', 'hubT')",
  "K.ftlH('cT2', 'NocoBase Studio', 'Decisions backed by evidence', 'Agents attach the evidence, so even business experts who don’t code can make the call.', 'hubT')")
r("K.ftlH('cT3', 'NocoBase Studio', '方法、经验、知识沉淀在团队里', '技能保存做事的方法，知识库保存业务资料，项目记忆保存 Agent 自主学到的经验。', 'hubT')",
  "K.ftlH('cT3', 'NocoBase Studio', 'Know-how stays with the team', 'Skills hold methods, the knowledge base holds documents, and project memory holds lessons.', 'hubT')")

# Studio 的动作
r("K.agentAs('agtS', '调度 Agent', '分派 3 个任务',", "K.agentAs('agtS', 'Coordinator agent', 'Assigning 3 tasks',", 2)
r("pill('aS' + k, 'upd', '进行中')", "pill('aS' + k, 'upd', 'In progress')")
r("K.agentAs('agtS', 'Codex · GPT-5.5', '评分计算与季度重算',", "K.agentAs('agtS', 'Codex · GPT-5.5', 'Scoring & recalculation',")
r("$('#plN').textContent = '第 4 / 5 步 · 测试进行中';", "$('#plN').textContent = 'Step 4 of 5 · testing';")
r("K.agentAs('agtS', 'Claude · Sonnet 5.5', '为 6 个验收场景写测试',", "K.agentAs('agtS', 'Claude · Sonnet 5.5', 'Tests for the 6 scenarios',")
r("${ic('circle-check')}CI 通过`", "${ic('circle-check')}CI passed`")
r("$('#plN').textContent = '第 5 / 5 步 · 评审中';", "$('#plN').textContent = 'Step 5 of 5 · in review';")
r("K.agentAs('agtS', 'Claude · Opus 5.5', '代码评审（换一家模型）',", "K.agentAs('agtS', 'Claude · Opus 5.5', 'Code review (another vendor’s model)',", 2)
r("clk('<b>23:40</b> · 同事们下班了，Agent 还在推进',", "clk('<b>23:40</b> · The team is offline. Agents keep going',")
r("$('#plN').textContent = '5 / 5 步完成 · 交给周航验收'; $('#tSt').outerHTML = pill('tSt', 'wait', '待验收');", "$('#plN').textContent = '5 of 5 done · to Owen for acceptance'; $('#tSt').outerHTML = pill('tSt', 'wait', 'To accept');")
r("K.agentAs('agtS', '调度 Agent', '整理验收材料',", "K.agentAs('agtS', 'Coordinator agent', 'Preparing the evidence',", 2)
r("$('#dqs').textContent = '已决定：质量优先 · Agent 按此调整，并记进项目记忆';", "$('#dqs').textContent = 'Decided: quality first · saved to project memory';")
r("$('#gZ').textContent = '等你处理 1';", "$('#gZ').textContent = 'Needs you 1';")
r("$('#dz0s').textContent = '已验收 · 交给王磊批准上线';", "$('#dz0s').textContent = 'Accepted · to Ethan for release';")
r("$('#gZ').textContent = '等你处理 0';", "$('#gZ').textContent = 'Needs you 0';")
r("$('#gW').textContent = '等你处理 3';", "$('#gW').textContent = 'Needs you 3';")
r("$('#dw0s').textContent = '已批准 · v1.1 已上线生产';", "$('#dw0s').textContent = 'Approved · v1.1 is live';")
r("$('#gW').textContent = '等你处理 2';", "$('#gW').textContent = 'Needs you 2';")
r("K.agentAs('agtS', 'Claude Code', '开工前读项目记忆',", "K.agentAs('agtS', 'Claude Code', 'Reading project memory',", 2)

# ---------------------------------------------------------------- 一年、落版
r("K.tcard('tY', '系统在统一架构下' + NB('长期稳定迭代'), 176)", "K.tcard('tY', 'One architecture, ' + NB('evolving steadily for years'), 176)")
r('<div id="yCnt">第 <b id="yW">1</b> 周 · 版本 <b id="yV">v1.0</b></div>', '<div id="yCnt">Week <b id="yW">1</b> · Version <b id="yV">v1.0</b></div>')
r('<i></i>第 ${w} 周</span>', '<i></i>Week ${w}</span>')
r('<small>第 ${d} 周</small>', '<small>Week ${d}</small>')
r('<div id="eZh" class="split">构建可靠的业务系统</div><div id="endTags">开源免费 · 私有部署 · 模型与 Agent 自由选择</div>',
  '<div id="eZh" class="split">Build reliable business systems</div><div id="endTags">Free and open source · Self-hosted · Your choice of models and agents</div>')

# ---------------------------------------------------------------- 写出，检查没有剩下中文（注释和段落名除外）
r("// AI + NocoBase · the NocoBase 3 brand film, v3.1 (118 s, 16:9, Chinese).",
  "// AI + NocoBase · the NocoBase 3 brand film, v3.1 (118 s, 16:9, English) — GENERATED by tools/make-en.py from src/film.js; edit the script, not this file.")
left = []
for i, line in enumerate(s.split('\n'), 1):
    code = re.sub(r"(^|\s)//.*$", "", line)
    if 'avatars: {' in code:   # 头像表的值是中文版的人名（找原来的画像用）
        code = re.sub(r"avatars: \{[^}]*\}", "", code)
    if 'K.beat(' in code:
        code = re.sub(r"K\.beat\('[^']*'", "", code)
    if re.search(r'[一-鿿＀-￯　-〿]', code):
        left.append(f'{i}: {code.strip()[:120]}')
if errors or left:
    print('make-en: ' + str(len(errors)) + ' replacement(s) missed, ' + str(len(left)) + ' line(s) still Chinese')
    for e in errors: print('  miss  ' + e)
    for l in left: print('  left  ' + l)
    sys.exit(1)
(ROOT / 'src/film-en.js').write_text(s, encoding='utf-8')
print('src/film-en.js written')
