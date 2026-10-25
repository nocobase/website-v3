# 首页 Studio 段：四条核心特色各一张图，左侧点特色、右侧换图。一张图只讲一件事，只画和这件事有关的那部分界面。
#   team      一支持续推进的 Agent 团队：运行环境 + 调度 Agent 的分派记录
#   progress  各项进展一目了然：我的任务（不带左侧菜单）：分组的任务列表 + 一个任务的执行计划和动态
#   decide    有理有据做决策：一个等业务专家验收的任务，附报告、清单、截图和建议
#   memory    方法、经验、知识沉淀在团队里：技能、知识库（人写和上传的资料，Agent 只读）、项目记忆，以及换人接手时自动带上
# 界面字段对照 nocobase-studio 仓库（运行环境、我的任务、技能、知识库、项目记忆的中文文案）。
# 写进 homepage.html 的 <!-- STUDIOTPL --> 标记之间（<template id="stv-…">），样式写在 /* HOME-STUDIO */ 标记之间。
# 用法（在 _src 目录下）：python3 pages/gen_home_studio.py ..
import os, re, sys
root = sys.argv[1]
T = lambda zh, en: '<t-zh>%s</t-zh><t-en>%s</t-en>' % (zh, en)
I = lambda n: '<i data-lucide="%s"></i>' % n
AG = {'cc': 'CC', 'cx': 'CX', 'oc': 'OC', 'pm': None}
def ag(k): return '<span class="st-a %s">%s</span>' % (k, AG[k] or T('调', 'C'))
def av(zh, en): return '<span class="st-av">%s</span>' % T(zh, en)
def si(k): return '<span class="si %s"></span>' % k
SPIN = '<span class="st-spin"></span>'

def win(crumbs, body, right=''):
    # 窗口只留顶栏和内容：Studio 标识 + 面包屑，不画侧栏
    cr = ''.join(('<b>%s</b>' if i == len(crumbs) - 1 else '<span>%s</span>' + I('chevron-right')) % T(*c) for i, c in enumerate(crumbs))
    return ('<div class="sv-win"><div class="sv-top"><span class="sv-brand"><img src="assets/logo.png" alt="NocoBase"><span>Studio</span></span>'
            '<i class="sep"></i>%s<span class="r">%s<span class="st-av">%s</span></span></div><div class="sv-body">%s</div></div>') % (cr, right, T('王', 'L'), body)
def head(zh, en, pzh, pen, right=''):
    return '<div class="st-ph"><div><h4>%s</h4><p>%s</p></div>%s</div>' % (T(zh, en), T(pzh, pen), ('<span class="r">%s</span>' % right) if right else '')

# ---------- 一支持续推进的 Agent 团队 ----------
# 运行环境表与真实页面一致：名称（个人 / 团队 · 系统）、状态（在线 当前/最大并发）、各编码工具的运行数（当前/上限）
def rt(icon, zh, en, os_, team, state, tools):
    st = ('<span class="st-tag on">%s %s</span>' % (T('在线', 'Online'), state)) if state else ('<span class="st-tag">%s</span>' % T('离线 · 3 小时前', 'Offline · 3h ago'))
    tl = ''.join('<span class="st-tag nd">%s%s <b>%s</b></span>' % (SPIN if u else '', name, '%d/%d' % (u, lim)) for name, u, lim in tools)
    return ('<tr><td><b>%s%s</b><small>%s · %s</small></td><td>%s</td><td><div class="st-tags">%s</div></td></tr>' %
            (I(icon), T(zh, en), T('团队', 'Team') if team else T('个人', 'Personal'), os_, st, tl))
def dispatch(t, id_, zh, en, where_zh, where_en, k):
    return ('<div class="sv-dp"><time>%s</time><div><b><span class="id">%s</span>%s</b><p>%s%s</p></div></div>' %
            (t, id_, T(zh, en), ag(k), T(where_zh, where_en)))
team = win([('运行环境', 'Runtimes')],
  head('运行环境', 'Runtimes', '23:40 · 同事们都下班了，9 台运行环境上的 Agent 仍在推进 4 个项目的 24 个任务',
       '23:40 · The team is offline. Agents on 9 runtimes are still moving 24 issues across 4 projects',
       '<span class="sv-night">' + I('moon') + T('24 小时在线', 'On around the clock') + '</span>') +
  '<div class="sv-team">' +
    '<div class="st-card"><table class="st-tbl"><thead><tr><th>' + T('名称', 'Name') + '</th><th>' + T('状态', 'Status') + '</th><th>' + T('编码工具 · 当前 / 上限', 'Tools · running / limit') + '</th></tr></thead><tbody>' +
      rt('server', 'Server 01', 'Server 01', 'linux', 1, '4/4', [('Codex', 2, 2), ('Claude Code', 2, 2)]) +
      rt('server', 'Server 02', 'Server 02', 'linux', 1, '4/4', [('Claude Code', 2, 2), ('OpenCode', 2, 2)]) +
      rt('server', 'Server 03', 'Server 03', 'linux', 1, '3/4', [('Codex', 2, 2), ('Claude Code', 1, 2)]) +
      rt('laptop', '王磊的 Mac', 'Leo’s Mac', 'macOS', 0, '2/2', [('Claude Code', 1, 1), ('Codex', 1, 1)]) +
      rt('laptop', '林悦的工作站', 'Maya’s workstation', 'linux', 0, '', [('Claude Code', 0, 1)]) +
    '</tbody></table><div class="st-more">' + I('chevron-right') + T('另有 4 台运行环境 · 11 个任务在跑', '4 more runtimes · 11 issues running') + '</div></div>' +
    '<div class="st-card sv-dps"><div class="sv-ch">' + ag('pm') + '<b>' + T('调度 Agent', 'Coordinator') + '</b><span>' + T('统一分派', 'Assigns the work') + '</span></div>' +
      dispatch('23:38', 'CRM-144', '第 4 步：写测试', 'Step 4: write tests', 'Server 02 上的 Claude Code', 'Claude Code on Server 02', 'cc') +
      dispatch('23:36', 'SUP-91', '修复评审意见', 'Fix review comments', 'Server 01 上的 Codex', 'Codex on Server 01', 'cx') +
      dispatch('23:31', 'HR-45', '代码评审（换一家模型）', 'Code review by another model', 'Server 04 上的 Claude Code', 'Claude Code on Server 04', 'cc') +
      dispatch('23:20', 'ITAM-12', '资产盘点导入', 'Asset audit import', 'Server 03 上的 Codex', 'Codex on Server 03', 'cx') +
      dispatch('23:12', 'CRM-147', '方案设计', 'Solution design', 'Server 02 上的 OpenCode', 'OpenCode on Server 02', 'oc') +
    '</div>' +
  '</div>')

# ---------- 各项进展一目了然 ----------
# 「我的任务」页，去掉左侧菜单：左边按「等你处理 / 进行中 / 已完成」分组的任务，每条写着现在哪个 Agent 在做什么；
# 右边是选中任务的执行计划（每一步由谁做、做到哪）和动态。样式沿用 studio-ui.css 里的 st-*
def li(s_, zh, en, day, id_, nzh, nen, on=False, wait=False, run=False):
    note = (SPIN + '<span class="run">%s</span>' if run else '<span class="%s">%s</span>' % ('w' if wait else '', '%s')) % T(nzh, nen)
    return ('<div class="st-li%s">%s<b>%s</b><time>%s</time><div class="s2"><span class="id">%s</span>·%s</div></div>' %
            (' on' if on else '', si(s_), T(zh, en), T('10月%d日' % day, 'Oct %d' % day), id_, note))
def grp(head_icon, zh, en, n, items, open_=True):
    return ('<div class="st-card st-grp"><div class="st-gh">%s%s<span class="st-cnt">%s</span>%s</div>%s</div>' %
            (head_icon, T(zh, en), n, I('chevron-down' if open_ else 'chevron-right'), ''.join(items)))
def who(k, name):
    return '<span class="who">%s%s</span>' % (ag(k), name)
def step(s_, zh, en, k, name, small=None, off=False):
    return ('<div class="st-step%s">%s<span>%s%s</span>%s</div>' %
            (' off' if off else '', SPIN if s_ == 'run' else si(s_), T(zh, en), ('<small>%s</small>' % T(*small)) if small else '', who(k, name)))
def le(badge, zh, en, t):
    return '<div class="st-le">%s<div>%s</div><time>%s</time></div>' % (badge, T(zh, en), t)
progress = win([('我的任务', 'My issues')],
  '<div class="st-flt"><h4>' + T('我的任务', 'My issues') + '</h4>' +
    '<span class="q">' + I('search') + T('搜索任务…', 'Search issues…') + '</span><span>' + T('全部项目', 'All projects') + I('chevron-down') + '</span><span>' + T('任意执行者', 'Any executor') + I('chevron-down') + '</span>' +
    '<span class="st-btn p">' + I('plus') + T('新建任务', 'New issue') + '</span></div>' +
  '<div class="sv-tasks">' +
    '<div class="st-list">' +
      grp('<i data-lucide="hand" class="hand"></i>', '等你处理', 'Needs you', 2, [
        li('review', '客户分级与负责人变更审批', 'Customer tiers &amp; owner-change approval', 20, 'CRM-135', '等你验收', 'Waiting for your sign-off', wait=True),
        li('blocked', '夜间工单自动分派', 'Overnight ticket routing', 20, 'SUP-88', '等你回答：交给哪个班组？', 'Question: which shift gets them?', wait=True)]) +
      grp(si('progress'), '进行中', 'In progress', 14, [
        li('progress', '商机阶段看板', 'Deal stage board', 21, 'CRM-144', 'Codex 开发中', 'Codex building', on=True, run=True),
        li('progress', '退款工单 SLA 提醒', 'Refund ticket SLA alerts', 21, 'SUP-91', 'Claude Code 测试中', 'Claude Code testing', run=True),
        li('progress', '报价单审批流', 'Quote approval flow', 22, 'CRM-147', 'OpenCode 设计方案中', 'OpenCode designing', run=True)]) +
      grp(si('done'), '已完成', 'Done', 41, [], open_=False) +
    '</div>' +
    '<div class="st-card st-det"><div class="st-dh">' + I('chevron-up') + I('chevron-down') + '<span>3 / 16</span><span class="id">CRM-144</span>·<span>NocoCRM</span>' +
      '<span class="r"><span class="st-pill">' + si('progress') + T('进行中', 'In progress') + I('chevron-down') + '</span><span>' + I('star') + T('关注', 'Star') + '</span><span>' + I('messages-square') + T('问 Agent', 'Ask agent') + '</span></span></div>' +
      '<div class="st-db"><h5>' + T('商机阶段看板', 'Deal stage board') + '</h5>' +
        '<div class="st-meta"><span><span class="k">' + T('负责人', 'Owner') + '</span>' + av('王', 'L') + T('王磊', 'Leo Walker') + '</span><span><span class="k">' + T('执行者', 'Executor') + '</span>' + ag('pm') + T('调度 Agent', 'Coordinator') + '</span><span><span class="k">' + T('预计', 'ETA') + '</span>' + T('今晚 23:40', 'Tonight 23:40') + '</span></div>' +
        '<div class="st-box"><div class="h">' + I('list-checks') + T('执行计划', 'Plan') + '<span class="r">' + T('第 3 / 5 步 · 2 个 Agent 并行', 'Step 3 of 5 · 2 agents in parallel') + '</span></div>' +
          step('done', '梳理阶段规则与 6 个验收场景', 'Stage rules and 6 acceptance scenarios', 'cc', 'Claude Code') +
          step('done', '阶段字段与数据迁移', 'Stage field and data migration', 'cx', 'Codex') +
          step('run', '看板拖拽与阶段变更权限', 'Drag-and-drop and stage permissions', 'cx', 'Codex', ('已改 7 个文件', '7 files changed')) +
          step('run', '为 6 个验收场景写测试', 'Tests for the 6 scenarios', 'cc', 'Claude Code', ('31 / 38 通过', '31 / 38 passing')) +
          step('backlog', '代码评审（换一家模型）', 'Code review by another model', 'cc', 'Claude Code', off=True) +
        '</div>' +
        '<div class="st-log">' +
          le(ag('pm'), '<b>调度 Agent</b> 把第 2、3 步交给 Codex，第 4 步并行交给 Claude Code', '<b>Coordinator</b> gave steps 2–3 to Codex and step 4 to Claude Code in parallel', '18:36') +
          le(ag('cx'), '<b>Codex</b> 正在开发看板拖拽，已改 7 个文件' + SPIN, '<b>Codex</b> is building drag-and-drop; 7 files changed' + SPIN, T('现在', 'now')) +
        '</div>' +
      '</div></div>' +
  '</div>')

# ---------- 有理有据做决策 ----------
# 一个等业务负责人验收的任务：交付报告、验收清单（附截图）、截图、Agent 的建议，下面是通过 / 退回。
# 和首屏演示里的「客户分级」是同一件事：规则、测试数（35）、验收场景、验收人（王磊）都要一致
def chk(zh, en, shot=True):
    return '<div class="sv-ck">%s<span>%s</span>%s</div>' % (si('done'), T(zh, en), ('<span class="st-chip">' + I('image') + T('截图', 'Screenshot') + '</span>') if shot else '')
# 截图放进「截图」卡片：每张是缩小的界面截图（顶上一条窗口栏），下方写对应的验收场景。
# 截图里的界面一律用灰色，不出现蓝色按钮，免得和真正要点的「验收通过」抢眼
def thumb(inner, cap_zh, cap_en, cls=''):
    return ('<figure class="sv-th"><div class="sv-img%s"><div class="bar"><i></i><i></i><i></i></div><div class="pg">%s</div></div><figcaption>%s</figcaption></figure>'
            % (cls, inner, T(cap_zh, cap_en)))
th_list = thumb('<div class="sv-sh">' + T('客户', 'Customers') + '</div>' + ''.join(
  '<div class="sv-sr"><span>%s</span><em>%s</em><i class="%s">%s</i></div>' % (T(a, b), m, c, c.upper()) for a, b, m, c in
  [('华东能源', 'East Energy', '¥ 1,050,000', 'a'), ('启明医疗', 'Qiming Health', '¥ 999,000', 'b'), ('远航物流', 'Voyage Logistics', '¥ 386,000', 'b')]),
  '场景 1、2 · 100 万的边界', 'Scenarios 1–2 · the ¥1M line')
th_dlg = thumb('<div class="sv-dlg"><b>' + T('更换负责人需要审批', 'Owner change needs approval') + '</b><span>' + T('A 级客户 · 华东能源', 'Tier A · East Energy') + '</span>' +
  '<div class="sv-bt"><i>' + T('取消', 'Cancel') + '</i><i class="p">' + T('提交审批', 'Submit') + '</i></div></div>',
  '场景 4 · 触发审批', 'Scenario 4 · approval asked', ' dim')
gallery = ('<div class="st-box sv-gal"><div class="h">' + I('images') + T('截图', 'Screenshots') + '<span class="r">' + T('4 张', '4 images') + '</span></div>' +
  '<div class="sv-ths">' + th_list + th_dlg + '</div></div>')
decide = win([('我的任务', 'My issues'), ('CRM-135', 'CRM-135')],
  '<div class="sv-dh"><div><h4>' + T('客户分级与负责人变更审批', 'Customer tiers &amp; owner-change approval') + '</h4>' +
    '<div class="st-meta"><span><span class="k">' + T('负责人', 'Owner') + '</span>' + av('王', 'L') + T('王磊 · 销售总监', 'Leo Walker · Sales director') + '</span><span><span class="k">' + T('执行者', 'Executor') + '</span>' + ag('pm') + T('调度 Agent', 'Coordinator') + '</span></div></div>' +
    '<span class="st-pill sv-wait">' + si('review') + T('等你验收', 'Waiting for your sign-off') + '</span></div>' +
  '<div class="sv-dec">' +
    '<div class="sv-main">' +
      '<div class="st-box"><div class="h">' + I('file-text') + T('交付报告', 'Delivery report') + '<span class="r">' + T('测试 35/35 通过 · 代码评审已通过', 'Tests 35/35 · code review passed') + '</span></div>' +
        '<p class="sv-p">' + T('按近 12 个月的合同额把客户分为 A、B、C 三级：满 100 万为 A 级，20 万到 100 万为 B 级，每月 1 日自动重算。更换 A 级客户的负责人，需要销售经理审批。',
                               'Customers are tiered by the last 12 months of contract value: A from $1M, B from $200k, recalculated on the 1st. Changing a Tier A owner needs the sales manager’s approval.') + '</p></div>' +
      '<div class="st-box"><div class="h">' + I('list-checks') + T('验收清单', 'Acceptance checklist') + '<span class="r">' + T('6 / 6 通过', '6 / 6 passed') + '</span></div>' +
        chk('合同额 100 万分到 A 级', '$1M lands in Tier A') + chk('99.9 万分到 B 级', '$999k lands in Tier B') + chk('每月 1 日自动重算等级', 'Tiers recalculate on the 1st', False) +
        chk('更换 A 级客户负责人时提交审批', 'Changing a Tier A owner asks for approval') + chk('审批通过后通知新负责人', 'The new owner is told once approved', False) + chk('没有权限的销售看不到审批按钮', 'Reps without access never see the button') +
      '</div>' +
    '</div>' +
    '<div class="sv-side">' +
      gallery +
      '<div class="st-box sv-adv"><div class="h">' + ag('pm') + T('Agent 的建议', 'Agent’s recommendation') + '</div>' +
        '<p>' + T('建议通过。重算后 A 级客户从 212 家变为 236 家，名单已附上。',
                  'Approve. After recalculation Tier A grows from 212 to 236 customers; the list is attached.') + '</p>' +
        '<div class="sv-act"><span class="st-btn p">' + I('check') + T('验收通过', 'Approve') + '</span><span class="st-btn">' + I('undo-2') + T('退回修改', 'Send back') + '</span></div></div>' +
    '</div>' +
  '</div>')

# ---------- 方法、经验、知识沉淀在团队里 ----------
def skill(name, zh, en, ver, scope_zh, scope_en):
    return '<div class="sv-it"><span class="st-chip mono">%s</span><span>%s</span><em>%s · %s</em></div>' % (name, T(zh, en), ver, T(scope_zh, scope_en))
def doc(icon, zh, en, note_zh, note_en, ok=False):
    return '<div class="sv-it">%s<span>%s</span><em>%s%s</em></div>' % (I(icon), T(zh, en), (I('badge-check') if ok else ''), T(note_zh, note_en))
def mem(zh, en, typ_zh, typ_en, k, who):
    return '<div class="sv-mem"><p>%s</p><span>%s%s<em>%s</em></span></div>' % (T(zh, en), ag(k), who, T(typ_zh, typ_en))
def col(icon, zh, en, szh, sen, body):
    return '<div class="st-card sv-kc"><div class="sv-kh">%s<div><b>%s</b><span>%s</span></div></div>%s</div>' % (I(icon), T(zh, en), T(szh, sen), body)
memory = win([('项目', 'Projects'), ('NocoCRM 定制', 'NocoCRM custom')],
  '<div class="sv-know">' +
    col('sparkles', '技能', 'Skills', '做事的方法', 'How the work is done',
        skill('studio-development', '开发规范', 'Development rules', 'v12', '全局', 'Global') +
        skill('studio-review', '评审规范', 'Review rules', 'v7', '全局', 'Global') +
        skill('studio-testing', '测试规范', 'Testing rules', 'v5', '全局', 'Global') +
        skill('crm-fields', 'CRM 字段与命名', 'CRM fields &amp; naming', 'v3', '本项目', 'This project') +
        '<p class="sv-note">' + T('每次运行自动带上：全局 → 项目 → 工作目录', 'Every run carries them: global → project → workdir') + '</p>') +
    col('book-open', '知识库', 'Knowledge base', '业务资料', 'Business material',
        doc('file-text', '折扣审批规则', 'Discount approval rules', '已核实', 'Verified', True) +
        doc('file-text', '客户分级口径', 'Customer tier definitions', 'v4', 'v4') +
        doc('file-text', '销售流程说明', 'Sales process', 'v2', 'v2') +
        doc('file', '合同模板.pdf', 'Contract template.pdf', '文件', 'File') +
        '<div class="sv-prop">' + av('王', 'L') + '<p>' + T('王磊上传了《2026 年价格政策.pdf》', 'Leo uploaded 2026 pricing policy.pdf') + '<span class="up">' + T('已提取文字，Agent 工作时可以查阅', 'Text extracted, ready for agents to read') + '</span></p></div>') +
    col('lightbulb', '项目记忆', 'Project memory', 'Agent 学到的经验', 'What agents learned',
        mem('测试前先跑数据迁移，否则阶段字段为空，6 个场景会有 2 个失败。', 'Run the migration before tests, or the stage field is empty and 2 of 6 scenarios fail.', '项目', 'Project', 'cx', 'Codex · CRM-144') +
        mem('客户手机号导入前去掉 +86 前缀，否则查重会漏掉。', 'Strip +86 from phone numbers before import, or dedupe misses them.', '项目', 'Project', 'cc', 'Claude Code · CRM-152') +
        mem('评审时一并检查暗色模式，客户反馈过两次对比度问题。', 'Check dark mode in every review; the customer has flagged contrast twice.', '反馈', 'Feedback', 'cc', 'Claude Code · CRM-139') +
        '<p class="sv-note">' + T('写在仓库的 .nb-studio/memory，下次开工前先读', 'Kept in the repo’s .nb-studio/memory and read before each issue') + '</p>') +
  '</div>' +
  '<div class="sv-hand">' + I('repeat') + '<b>' + T('CRM-160 换人接手', 'CRM-160 changes hands') + '</b>' +
    '<span>' + av('林', 'M') + T('林悦', 'Maya') + I('arrow-right') + ag('cx') + 'Codex</span>' +
    '<span class="r">' + T('自动带上 4 个技能、14 篇资料、9 条项目记忆，不用从头交代', 'Arrives with 4 skills, 14 documents and 9 memories. Nothing to re-explain') + '</span></div>')

FIGS = (('team', team), ('progress', progress), ('decide', decide), ('memory', memory))

CSS = r'''/* HOME-STUDIO */
/* 首页 Studio 段：左侧四条特色，右侧换图（由 _src/pages/gen_home_studio.py 写入，改样式请改脚本） */
.stv { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 48px; align-items: start; }
.stv-tabs { display: grid; gap: 4px; }
.stv-tab { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 4px 10px; padding: 14px 16px 15px; border: 0; border-left: 2px solid var(--rule-2); background: none; text-align: left; cursor: pointer; color: var(--ink-2); font: inherit; }
.stv-tab:hover { color: var(--ink); }
.stv-tab svg.lucide { width: 18px; height: 18px; margin-top: 3px; color: var(--muted); }
.stv-tab b { font-size: 17px; line-height: 1.5; font-weight: 600; }
.stv-tab p { grid-column: 2; display: none; font-size: 15px; line-height: 1.75; color: var(--ink-2); text-wrap: pretty; }
.stv-tab[aria-selected="true"] { border-left-color: var(--brand); color: var(--ink); background: oklch(1 0 0 / 0.55); }
.stv-tab[aria-selected="true"] svg.lucide { color: var(--brand); }
.stv-tab[aria-selected="true"] p { display: block; }
.stv-tab:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
@media (max-width: 1000px) {
  .stv { grid-template-columns: minmax(0, 1fr); gap: 28px; }
}
.sv-win { display: flex; flex-direction: column; background: var(--card); border: 1px solid var(--rule-2); border-radius: 12px; overflow: hidden; font-size: 13px; line-height: 1.5; color: var(--ink); text-align: left; box-shadow: 0 1px 2px oklch(0.25 0.05 266 / 0.05), 0 12px 28px -14px oklch(0.25 0.06 266 / 0.2); }
.sv-top { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 14px; border-bottom: 1px solid var(--rule); font-size: 12.5px; color: var(--muted); flex: none; }
.sv-top > svg.lucide { width: 13px; height: 13px; }
.sv-top b { font-weight: 500; color: var(--ink); }
.sv-top i.sep { width: 1px; height: 14px; margin: 0 4px; background: var(--rule); }
.sv-top .r { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.sv-top .st-av { width: 24px; height: 24px; }
.sv-brand { display: inline-flex; align-items: center; gap: 8px; }
.sv-brand img { height: 14px; width: auto; }
.sv-brand span { font-size: 12px; color: var(--muted); border-left: 1px solid var(--rule-2); padding-left: 8px; line-height: 1; }
.sv-body { flex: 1; display: grid; gap: 14px; align-content: start; padding: 16px 18px 18px; background: var(--paper); }
.sv-body .st-ph h4 { font-size: 18px; line-height: 1.35; font-weight: 650; }
.sv-body .st-ph p { font-size: 12.5px; }
.sv-ch { display: flex; align-items: center; gap: 7px; padding: 10px 12px; border-bottom: 1px solid var(--rule); font-size: 12px; color: var(--muted); }
.sv-ch b { font-size: 12.5px; font-weight: 600; color: var(--ink); }
.sv-ch .st-a { width: 20px; height: 20px; }
/* 运行环境 */
.sv-night { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 13px; background: var(--deep); color: var(--on-deep); font-size: 12px; white-space: nowrap; }
.sv-night svg.lucide { width: 13px; height: 13px; color: var(--deep-accent); }
.sv-team { display: grid; grid-template-columns: minmax(0, 1fr) 268px; gap: 12px; align-items: start; }
.sv-team .st-tbl td b svg.lucide { width: 13px; height: 13px; margin-right: 6px; vertical-align: -1px; color: var(--muted); }
.sv-team .st-tag b { font-weight: 600; color: var(--ink); }
.sv-dp { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 8px; padding: 9px 12px; border-top: 1px solid var(--rule); }
.sv-ch + .sv-dp { border-top: 0; }
.sv-dp time { font: 11px/20px var(--f-mono); color: var(--muted); }
.sv-dp b { display: block; font-size: 12.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sv-dp .id { margin-right: 6px; font: 11px var(--f-mono); color: var(--muted); }
.sv-dp p { display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 11.5px; color: var(--ink-2); white-space: nowrap; }
.sv-dp p .st-a { width: 16px; height: 16px; font-size: 8px; }
/* 我的任务 */
.sv-body > .st-flt h4 { margin-right: 6px; font-size: 18px; line-height: 1.35; font-weight: 650; }
.sv-body > .st-flt .st-btn { margin-left: auto; }
.sv-tasks { display: grid; grid-template-columns: 276px minmax(0, 1fr); gap: 12px; align-items: start; }
.sv-tasks .st-det { align-self: stretch; }
/* 等你验收 */
.sv-dh { display: flex; align-items: flex-start; gap: 12px; }
.sv-dh h4 { font-size: 18px; line-height: 1.35; font-weight: 650; margin-bottom: 6px; }
.sv-dh .st-pill { margin-left: auto; }
.sv-wait { border-color: var(--human); background: var(--human-tint); color: var(--on-human); }
.sv-dec { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 12px; align-items: start; }
.sv-main { display: grid; gap: 10px; }
.sv-p { font-size: 12.5px; line-height: 1.65; color: var(--ink); }
.sv-ck { display: grid; grid-template-columns: 14px minmax(0, 1fr) auto; gap: 9px; align-items: center; min-height: 30px; padding: 3px 0; border-top: 1px solid var(--rule); font-size: 12.5px; }
.sv-ck:first-of-type { border-top: 0; }
.sv-ck .st-chip { height: 20px; font-size: 11px; }
.sv-side { display: grid; gap: 10px; }
.sv-ths { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.sv-th { display: grid; gap: 5px; margin: 0; min-width: 0; }
.sv-th figcaption { font-size: 11px; line-height: 1.4; color: var(--muted); }
.sv-img { position: relative; height: 86px; border: 1px solid var(--rule); border-radius: 6px; background: var(--card); overflow: hidden; }
.sv-img .bar { display: flex; align-items: center; gap: 3px; height: 11px; padding: 0 6px; border-bottom: 1px solid var(--rule); background: var(--paper-2); }
.sv-img .bar i { width: 4px; height: 4px; border-radius: 50%; background: var(--rule-2); }
.sv-img .pg { height: calc(100% - 11px); padding: 5px 7px; font-size: 8.5px; line-height: 1.3; color: var(--ink-2); }
.sv-sh { padding-bottom: 3px; border-bottom: 1px solid var(--rule); font-weight: 600; }
.sv-sr { display: grid; grid-template-columns: minmax(0, 1fr) auto 13px; gap: 4px; align-items: center; padding: 3px 0; border-bottom: 1px solid var(--rule); white-space: nowrap; }
.sv-sr span { overflow: hidden; text-overflow: ellipsis; }
.sv-sr em { font-style: normal; font-family: var(--f-mono); font-size: 7.5px; color: var(--muted); }
.sv-sr i { display: grid; place-items: center; height: 11px; border-radius: 3px; background: var(--paper-2); font: 600 7.5px/1 var(--f-mono); font-style: normal; color: var(--ink-2); }
.sv-img.dim .pg { display: grid; place-items: center; background: oklch(0.25 0.05 266 / 0.07); }
.sv-dlg { display: grid; gap: 2px; width: 94%; padding: 6px 7px; border: 1px solid var(--rule); border-radius: 4px; background: var(--card); box-shadow: 0 2px 6px oklch(0.25 0.05 266 / 0.08); }
.sv-dlg b { font-size: 9px; font-weight: 600; color: var(--ink); }
.sv-dlg span { color: var(--muted); white-space: nowrap; }
.sv-bt { display: flex; justify-content: flex-end; gap: 3px; margin-top: 4px; }
.sv-bt i { font-style: normal; padding: 1px 5px; border: 1px solid var(--rule-2); border-radius: 3px; background: var(--card); }
.sv-bt i.p { border-color: var(--muted); background: var(--muted); color: var(--card); }
.sv-adv { border-color: var(--human); }
.sv-adv > .h { color: var(--ink); font-weight: 600; }
.sv-adv > .h .st-a { width: 18px; height: 18px; }
.sv-adv p { font-size: 12.5px; line-height: 1.65; }
.sv-act { display: flex; gap: 8px; margin-top: 10px; }
.sv-act .st-btn { height: 32px; }
/* 技能、知识库、项目记忆 */
.sv-know { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; align-items: stretch; }
.sv-kc { display: flex; flex-direction: column; }
.sv-kh { display: flex; align-items: center; gap: 10px; padding: 12px 12px 10px; border-bottom: 1px solid var(--rule); }
.sv-kh > svg.lucide { width: 18px; height: 18px; padding: 6px; box-sizing: content-box; border-radius: 8px; background: var(--brand-tint); color: var(--brand); }
.sv-kh b { display: block; font-size: 13.5px; font-weight: 600; }
.sv-kh span { display: block; font-size: 11.5px; color: var(--muted); }
.sv-it { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 8px; align-items: center; padding: 9px 12px; border-top: 1px solid var(--rule); font-size: 12.5px; }
.sv-kh + .sv-it { border-top: 0; }
.sv-it > svg.lucide { width: 14px; height: 14px; color: var(--muted); }
.sv-it .st-chip { grid-row: span 2; align-self: start; margin-top: 1px; }
.sv-it > span:not(.st-chip) { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sv-it em { grid-column: 2; display: inline-flex; align-items: center; gap: 4px; font-style: normal; font-size: 11px; color: var(--muted); }
.sv-it em svg.lucide { width: 12px; height: 12px; color: var(--pass-ink); }
.sv-it .st-chip.mono { font-size: 10.5px; }
.sv-note { margin-top: auto; padding: 9px 12px 11px; border-top: 1px dashed var(--rule); font-size: 11px; color: var(--muted); }
.sv-prop { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 8px; margin: auto 10px 10px; padding: 9px 10px; border: 1px solid var(--rule); border-radius: 8px; background: var(--paper); font-size: 12px; }
.sv-prop p span { display: block; margin-top: 2px; font-size: 11px; color: var(--human-ink); }
.sv-prop p span.up { color: var(--muted); }
.sv-prop .st-av { width: 18px; height: 18px; font-size: 9px; }
.sv-mem { display: grid; gap: 5px; padding: 10px 12px; border-top: 1px solid var(--rule); }
.sv-kh + .sv-mem { border-top: 0; }
.sv-mem p { font-size: 12.5px; line-height: 1.55; }
.sv-mem span { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--muted); }
.sv-mem em { margin-left: auto; padding: 0 6px; border-radius: 4px; background: var(--paper-2); font-style: normal; font-size: 10.5px; line-height: 18px; color: var(--ink-2); }
.sv-mem .st-a { width: 16px; height: 16px; font-size: 8px; }
.sv-hand { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 10px; background: var(--deep); color: var(--on-deep); font-size: 12.5px; }
.sv-hand > svg.lucide { width: 15px; height: 15px; color: var(--deep-accent); }
.sv-hand > span { display: inline-flex; align-items: center; gap: 6px; color: var(--on-deep-2); }
.sv-hand > span svg.lucide { width: 13px; height: 13px; }
.sv-hand .st-av { background: oklch(1 0 0 / 0.12); border-color: transparent; color: var(--on-deep); }
.sv-hand .r { margin-left: auto; color: var(--on-deep); }
/* /HOME-STUDIO */
'''

tpls = ''.join('<template id="stv-%s">%s</template>' % (k, v) for k, v in FIGS)
p = os.path.join(root, 'homepage.html')
s = open(p, encoding='utf-8').read()
s, n = re.subn(r'<!-- STUDIOTPL -->.*?<!-- /STUDIOTPL -->', lambda m: '<!-- STUDIOTPL -->' + tpls + '<!-- /STUDIOTPL -->', s, flags=re.S)
assert n == 1, 'homepage.html 里没有 <!-- STUDIOTPL --> 标记'
s, n = re.subn(r'/\* HOME-STUDIO \*/\n.*?/\* /HOME-STUDIO \*/\n', lambda m: CSS, s, flags=re.S)
if not n:
    # 放在 STUDIO-UI 之后，同等优先级的规则才能覆盖它
    assert s.count('/* /STUDIO-UI */\n') == 1
    s = s.replace('/* /STUDIO-UI */\n', '/* /STUDIO-UI */\n' + CSS, 1)
open(p, 'w', encoding='utf-8').write(s)
# Studio 页每条特色一节，用同一批图：写成 snips/stvTeam.html 等，正文里用 {{SNIP:stvTeam:1120}} 引用；
# 样式同步到 assets/site.css 的 STUDIO-UI 之后（和首页一样，同等优先级的规则才能覆盖它）
snipdir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'snips')
for k, v in FIGS:
    open(os.path.join(snipdir, 'stv%s.html' % k.capitalize()), 'w', encoding='utf-8').write(v)
cp = os.path.join(root, 'assets', 'site.css')
c = open(cp, encoding='utf-8').read()
c, n = re.subn(r'/\* HOME-STUDIO \*/\n.*?/\* /HOME-STUDIO \*/\n', lambda m: CSS, c, flags=re.S)
if not n:
    assert c.count('/* /STUDIO-UI */\n') == 1
    c = c.replace('/* /STUDIO-UI */\n', '/* /STUDIO-UI */\n' + CSS, 1)
open(cp, 'w', encoding='utf-8').write(c)
print('templates', {k: len(v) for k, v in FIGS})
