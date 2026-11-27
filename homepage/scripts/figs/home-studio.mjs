// 首页 Studio 段：五条核心特色各一张图，左侧点特色、右侧换图。一张图只讲一件事，只画和这件事有关的那部分界面。
//   team      一支 24 小时工作的 Agent 团队：运行环境 + 调度 Agent 的分派记录
//   decide    随时随地的人机协作与决策：桌面端验收详情 + 手机画面，附报告、清单、截图和测试环境
//   workflow  按流程推进，关键节点由人把关：项目工作流程（多流程并存、人把关两头/AI 执行中间、退回闭环）+ 不可移除的常驻技能
//   quality   全自动质量测试，问题闭环修复：四种触发、多机并行、成熟工具多维实测、报告与跟进任务自动闭环
//   memory    方法、经验、知识沉淀在团队里：技能、知识库、项目记忆，以及换人、换模型自动带上
// 界面字段对照 nocobase-studio 仓库（运行环境、我的任务、工作流程、质量、技能、知识库、项目记忆的中文文案）。
// 写进 content/pages/home.html 的 <!-- STUDIOTPL --> 标记之间（<template id="stv-…">），样式写在 src/styles/site.css 的 /* HOME-STUDIO */ 标记之间（首页也加载 site.css）；同一批图也写成 content/pages/snips/stv*.html。
// 用法（在 html 目录下）：node scripts/figs/home-studio.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENT, STYLES } from '../../src/lib/paths.mjs';

const T = (zh, en) => `<t-zh>${zh}</t-zh><t-en>${en}</t-en>`;
const I = n => `<i data-lucide="${n}"></i>`;
const AG = { cc: 'CC', cx: 'CX', oc: 'OC', pm: null };
const ag = k => `<span class="st-a ${k}">${AG[k] || T('调', 'C')}</span>`;
const av = (zh, en) => `<span class="st-av">${T(zh, en)}</span>`;
const si = k => `<span class="si ${k}"></span>`;
const SPIN = '<span class="st-spin"></span>';

function win(crumbs, body, right = '', attrs = '') {
  // 窗口只留顶栏和内容：Studio 标识 + 面包屑，不画侧栏
  const cr = crumbs.map((c, i) => (i === crumbs.length - 1 ? `<b>${T(...c)}</b>` : `<span>${T(...c)}</span>` + I('chevron-right'))).join('');
  return `<div class="sv-win"${attrs}><div class="sv-top"><span class="sv-brand"><img src="https://static-docs.nocobase.com/logo-nocobase.png" alt="NocoBase"><span>Studio</span></span>` +
    `<i class="sep"></i>${cr}<span class="r">${right}<span class="st-av">${T('王', 'L')}</span></span></div><div class="sv-body">${body}</div></div>`;
}
function head(zh, en, pzh, pen, right = '') {
  return `<div class="st-ph"><div><h4>${T(zh, en)}</h4><p>${T(pzh, pen)}</p></div>${right ? `<span class="r">${right}</span>` : ''}</div>`;
}

// ---------- 一支持续推进的 Agent 团队 ----------
// 运行环境表与真实页面一致：名称（个人 / 团队 · 系统）、状态（在线 当前/最大并发）、各编码工具的运行数（当前/上限）
function rt(icon, zh, en, os_, team, state, tools) {
  const st = state
    ? `<span class="st-tag on">${T('在线', 'Online')} <em class="sv-num" data-tm-vals="${state}">${state.split('|')[0]}</em></span>`
    : `<span class="st-tag">${T('离线 · 3 小时前', 'Offline · 3h ago')}</span>`;
  const tl = tools.map(([name, u, lim, vals]) => `<span class="st-tag nd">${u ? SPIN : ''}${name} <b${vals ? ` data-tm-vals="${vals}"` : ''}>${u}/${lim}</b></span>`).join('');
  return `<tr><td><b>${I(icon)}${T(zh, en)}</b><small>${team ? T('团队', 'Team') : T('个人', 'Personal')} · ${os_}</small></td><td>${st}</td><td><div class="st-tags">${tl}</div></td></tr>`;
}
function dispatch(t, id_, zh, en, where_zh, where_en, k, live = false) {
  return `<div class="sv-dp${live ? ' is-live' : ''}"><time data-tm-vals="${t}">${t.split('|')[0]}</time><div><b><span class="id">${id_}</span>${T(zh, en)}</b><p>${ag(k)}${T(where_zh, where_en)}</p></div></div>`;
}
const CLOCK_SVG =
  '<svg class="sv-clock" viewBox="0 0 20 20" aria-hidden="true">' +
    '<circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.55"/>' +
    '<line class="sv-ck-h" x1="10" y1="10" x2="10" y2="5.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    '<line class="sv-ck-m" x1="10" y1="10" x2="10" y2="3.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' +
    '<circle cx="10" cy="10" r="1.2" fill="currentColor"/>' +
  '</svg>';
const TM_HOURS = '23:40|00:25|02:10|04:35|06:50|09:05|14:20|19:45';
const team = win([['运行环境', 'Runtimes']],
  head('运行环境', 'Runtimes',
    '<span class="mono" data-tm-vals="' + TM_HOURS + '">23:40</span> · 9 台运行环境上的 Agent 持续推进 4 个项目的 <b data-tm-vals="24|26|22|19|21|25|28|23">24</b> 个任务',
    '<span class="mono" data-tm-vals="' + TM_HOURS + '">23:40</span> · Agents on 9 runtimes are moving <b data-tm-vals="24|26|22|19|21|25|28|23">24</b> issues across 4 projects',
    '<span class="sv-night">' + CLOCK_SVG + '<time class="mono" data-tm-vals="' + TM_HOURS + '">23:40</time> · ' + T('24 小时运转', 'Running 24/7') + '</span>') +
  '<div class="sv-team">' +
    '<div class="st-card"><table class="st-tbl"><thead><tr><th>' + T('名称', 'Name') + '</th><th>' + T('状态', 'Status') + '</th><th>' + T('编码工具 · 当前 / 上限', 'Tools · running / limit') + '</th></tr></thead><tbody>' +
      rt('server', 'Server 01', 'Server 01', 'linux', 1, '4/4|4/4|3/4|4/4|3/4|4/4|4/4|3/4', [['Codex', 2, 2, '2/2|2/2|1/2|2/2|1/2|2/2|2/2|1/2'], ['Claude Code', 2, 2, '2/2|2/2|2/2|2/2|2/2|2/2|2/2|2/2']]) +
      rt('server', 'Server 02', 'Server 02', 'linux', 1, '4/4|3/4|4/4|3/4|4/4|4/4|3/4|4/4', [['Claude Code', 2, 2, '2/2|2/2|2/2|1/2|2/2|2/2|2/2|2/2'], ['OpenCode', 2, 2, '2/2|1/2|2/2|2/2|2/2|2/2|1/2|2/2']]) +
      rt('server', 'Server 03', 'Server 03', 'linux', 1, '3/4|4/4|2/4|3/4|4/4|3/4|4/4|3/4', [['Codex', 2, 2, '2/2|2/2|1/2|2/2|2/2|1/2|2/2|2/2'], ['Claude Code', 1, 2, '1/2|2/2|1/2|1/2|2/2|2/2|2/2|1/2']]) +
      rt('laptop', '王磊的 Mac', 'Leo’s Mac', 'macOS', 0, '2/2|1/2|2/2|1/2|2/2|2/2|2/2|1/2', [['Claude Code', 1, 1, '1/1|1/1|1/1|0/1|1/1|1/1|1/1|1/1'], ['Codex', 1, 1, '1/1|0/1|1/1|1/1|1/1|1/1|1/1|0/1']]) +
      rt('laptop', '林悦的工作站', 'Maya’s workstation', 'linux', 0, '', [['Claude Code', 0, 1]]) +
    '</tbody></table><div class="st-more">' + I('chevron-right') + T('另有 4 台运行环境 · <b data-tm-vals="11|14|11|8|8|12|15|12">11</b> 个任务在跑', '4 more runtimes · <b data-tm-vals="11|14|11|8|8|12|15|12">11</b> issues running') + '</div></div>' +
    '<div class="st-card sv-dps"><div class="sv-ch">' + ag('pm') + '<b>' + T('调度 Agent', 'Coordinator') + '</b><span>' + T('统一分派', 'Assigns the work') + '</span></div>' +
      dispatch('23:38|00:24|02:09|04:33|06:48|09:04|14:18|19:44', 'CRM-144', '第 4 步：写测试', 'Step 4: write tests', 'Server 02 上的 Claude Code', 'Claude Code on Server 02', 'cc', true) +
      dispatch('23:36|00:21|02:05|04:29|06:42|08:59|14:12|19:38', 'SUP-91', '修复评审意见', 'Fix review comments', 'Server 01 上的 Codex', 'Codex on Server 01', 'cx') +
      dispatch('23:31|00:16|01:58|04:20|06:35|08:51|14:05|19:30', 'HR-45', '代码评审（换一家模型）', 'Code review by another model', 'Server 04 上的 Claude Code', 'Claude Code on Server 04', 'cc') +
      dispatch('23:20|00:08|01:49|04:12|06:24|08:44|13:56|19:21', 'ITAM-12', '资产盘点导入', 'Asset audit import', 'Server 03 上的 Codex', 'Codex on Server 03', 'cx') +
      dispatch('23:12|23:56|01:40|04:01|06:15|08:36|13:45|19:10', 'CRM-147', '方案设计', 'Solution design', 'Server 02 上的 OpenCode', 'OpenCode on Server 02', 'oc') +
    '</div>' +
  '</div>', '', ' data-live="team" data-step="0"');

// ---------- 各项进展一目了然 ----------
// 「我的任务」页，去掉左侧菜单：左边按「等你处理 / 进行中 / 已完成」分组的任务，每条写着现在哪个 Agent 在做什么；
// 右边是选中任务的执行计划（每一步由谁做、做到哪）和动态。样式沿用 studio-ui.css 里的 st-*
function li(s_, zh, en, day, id_, nzh, nen, { on = false, wait = false, run = false } = {}) {
  const note = run ? SPIN + `<span class="run">${T(nzh, nen)}</span>` : `<span class="${wait ? 'w' : ''}">${T(nzh, nen)}</span>`;
  return `<div class="st-li${on ? ' on' : ''}">${si(s_)}<b>${T(zh, en)}</b><time>${T(`10月${day}日`, `Oct ${day}`)}</time><div class="s2"><span class="id">${id_}</span>·${note}</div></div>`;
}
function grp(head_icon, zh, en, n, items, open_ = true) {
  return `<div class="st-card st-grp"><div class="st-gh">${head_icon}${T(zh, en)}<span class="st-cnt">${n}</span>${I(open_ ? 'chevron-down' : 'chevron-right')}</div>${items.join('')}</div>`;
}
function who(k, name) {
  return `<span class="who">${ag(k)}${name}</span>`;
}
function step(s_, zh, en, k, name, small = null, off = false) {
  return `<div class="st-step${off ? ' off' : ''}">${s_ === 'run' ? SPIN : si(s_)}<span>${T(zh, en)}${small ? `<small>${T(...small)}</small>` : ''}</span>${who(k, name)}</div>`;
}
function le(badge, zh, en, t) {
  return `<div class="st-le">${badge}<div>${T(zh, en)}</div><time>${t}</time></div>`;
}
const progress = win([['我的任务', 'My issues']],
  '<div class="st-flt"><h4>' + T('我的任务', 'My issues') + '</h4>' +
    '<span class="q">' + I('search') + T('搜索任务…', 'Search issues…') + '</span><span>' + T('全部项目', 'All projects') + I('chevron-down') + '</span><span>' + T('任意执行者', 'Any executor') + I('chevron-down') + '</span>' +
    '<span class="st-btn p">' + I('plus') + T('新建任务', 'New issue') + '</span></div>' +
  '<div class="sv-tasks">' +
    '<div class="st-list">' +
      grp('<i data-lucide="hand" class="hand"></i>', '等你处理', 'Needs you', 2, [
        li('review', '客户分级与负责人变更审批', 'Customer tiers &amp; owner-change approval', 20, 'CRM-135', '等你验收', 'Waiting for your sign-off', { wait: true }),
        li('blocked', '夜间工单自动分派', 'Overnight ticket routing', 20, 'SUP-88', '等你回答：交给哪个班组？', 'Question: which shift gets them?', { wait: true })]) +
      grp(si('progress'), '进行中', 'In progress', 14, [
        li('progress', '商机阶段看板', 'Deal stage board', 21, 'CRM-144', 'Codex 开发中', 'Codex building', { on: true, run: true }),
        li('progress', '退款工单 SLA 提醒', 'Refund ticket SLA alerts', 21, 'SUP-91', 'Claude Code 测试中', 'Claude Code testing', { run: true }),
        li('progress', '报价单审批流', 'Quote approval flow', 22, 'CRM-147', 'OpenCode 设计方案中', 'OpenCode designing', { run: true })]) +
      grp(si('done'), '已完成', 'Done', 41, [], false) +
    '</div>' +
    '<div class="st-card st-det"><div class="st-dh">' + I('chevron-up') + I('chevron-down') + '<span>3 / 16</span><span class="id">CRM-144</span>·<span>NocoCRM</span>' +
      '<span class="r"><span class="st-pill">' + si('progress') + T('进行中', 'In progress') + I('chevron-down') + '</span><span>' + I('star') + T('关注', 'Star') + '</span><span>' + I('messages-square') + T('问 Agent', 'Ask agent') + '</span></span></div>' +
      '<div class="st-db"><h5>' + T('商机阶段看板', 'Deal stage board') + '</h5>' +
        '<div class="st-meta"><span><span class="k">' + T('负责人', 'Owner') + '</span>' + av('王', 'L') + T('王磊', 'Leo Walker') + '</span><span><span class="k">' + T('执行者', 'Executor') + '</span>' + ag('pm') + T('调度 Agent', 'Coordinator') + '</span><span><span class="k">' + T('预计', 'ETA') + '</span>' + T('今晚 23:40', 'Tonight 23:40') + '</span></div>' +
        '<div class="st-box"><div class="h">' + I('list-checks') + T('执行计划', 'Plan') + '<span class="r">' + T('第 3 / 5 步 · 2 个 Agent 并行', 'Step 3 of 5 · 2 agents in parallel') + '</span></div>' +
          step('done', '梳理阶段规则与 6 个验收场景', 'Stage rules and 6 acceptance scenarios', 'cc', 'Claude Code') +
          step('done', '阶段字段与数据迁移', 'Stage field and data migration', 'cx', 'Codex') +
          step('run', '看板拖拽与阶段变更权限', 'Drag-and-drop and stage permissions', 'cx', 'Codex', ['已改 7 个文件', '7 files changed']) +
          step('run', '为 6 个验收场景写测试', 'Tests for the 6 scenarios', 'cc', 'Claude Code', ['31 / 38 通过', '31 / 38 passing']) +
          step('backlog', '代码评审（换一家模型）', 'Code review by another model', 'cc', 'Claude Code', null, true) +
        '</div>' +
        '<div class="st-log">' +
          le(ag('pm'), '<b>调度 Agent</b> 把第 2、3 步交给 Codex，第 4 步并行交给 Claude Code', '<b>Coordinator</b> gave steps 2–3 to Codex and step 4 to Claude Code in parallel', '18:36') +
          le(ag('cx'), '<b>Codex</b> 正在开发看板拖拽，已改 7 个文件' + SPIN, '<b>Codex</b> is building drag-and-drop; 7 files changed' + SPIN, T('现在', 'now')) +
        '</div>' +
      '</div></div>' +
  '</div>');

// ---------- 随时随地，有理有据做决策 ----------
// 左：桌面端验收详情（测试环境入口 + 交付摘要 + 验收清单 + 操作按钮）；右：手机画面（同一条待验收任务，随时在手机上确认）
function chk(zh, en, note_zh = '', note_en = '') {
  return `<div class="sv-ck">${si('done')}<span>${T(zh, en)}</span>${note_zh ? `<span class="st-chip">${T(note_zh, note_en)}</span>` : ''}</div>`;
}
const decideDesktop = win([['我的任务', 'My issues'], ['CRM-135', 'CRM-135']],
  '<div class="sv-dh"><div><h4>' + T('客户分级与负责人变更审批', 'Customer tiers &amp; owner-change approval') + '</h4>' +
    '<div class="st-meta"><span><span class="k">' + T('负责人', 'Owner') + '</span>' + av('王', 'L') + T('王磊', 'Leo Walker') + '</span>' +
    '<span>' + T('测试 35/35 通过 · 跨模型评审通过', 'Tests 35/35 · cross-model review passed') + '</span></div></div>' +
    '<span class="st-pill sv-wait">' + si('review') + T('等你验收', 'Waiting on you') + '</span></div>' +
  '<div class="sv-env">' + I('globe') + '<div class="sv-env-t"><b>' + T('可操作的测试环境已就绪', 'Live test environment ready') + '</b><span class="mono">preview-crm-135.internal.app</span></div>' +
    '<span class="st-btn">' + T('打开测试环境', 'Open preview') + I('arrow-up-right') + '</span></div>' +
  '<div class="st-box"><div class="h">' + I('file-text') + T('交付摘要与影响', 'Summary &amp; impact') + '<span class="r">' + T('重算结果已附名单', 'Recalculated list attached') + '</span></div>' +
    '<p class="sv-p">' + T('按近 12 个月合同额将客户分为 A、B、C 三级（满 100 万为 A 级，每月 1 日重算）；更换 A 级客户负责人需销售经理审批。重算后 A 级客户由 212 家增至 236 家。',
      'Customers tier into A/B/C by 12-month contract value (A from $1M, recalculated on the 1st); changing a Tier A owner requires sales manager approval. Tier A grows from 212 to 236.') + '</p></div>' +
  '<div class="st-box"><div class="h">' + I('list-checks') + T('验收清单', 'Acceptance checklist') + '<span class="r">' + T('6 / 6 通过', '6 / 6 passed') + '</span></div>' +
    chk('合同额 100 万分到 A 级，99.9 万分到 B 级', '$1M lands in Tier A; $999k in Tier B', '已附截图', 'Screenshot') +
    chk('每月 1 日自动重算客户等级并记录变更', 'Recalculates tiers on the 1st with audit log') +
    chk('更换 A 级客户负责人时触发销售经理审批', 'Changing a Tier A owner triggers approval', '已附截图', 'Screenshot') +
    chk('无权限销售看不到审批按钮', 'Reps without access never see the button', '已验证', 'Verified') +
  '</div>' +
  '<div class="sv-act-bar"><span class="st-btn p">' + I('check') + T('验收通过', 'Approve') + '</span><span class="st-btn">' + I('undo-2') + T('退回修改', 'Send back') + '</span>' +
    '<span class="r">' + T('批准后发布到生产 · 可回滚', 'Ships on approval · rollback ready') + '</span></div>');

const decidePhone =
  '<div class="sv-phone" aria-hidden="true">' +
    '<div class="sv-ph-bar"><span>09:05</span><i class="sv-ph-notch"></i><span>5G</span></div>' +
    '<div class="sv-ph-hd"><img src="https://static-docs.nocobase.com/logo-nocobase.png" alt=""><span>' + T('待你处理', 'Needs you') + '</span><em>1</em></div>' +
    '<div class="sv-ph-body">' +
      '<div class="sv-ph-card">' +
        '<div class="sv-ph-meta"><span class="id">CRM-135</span><span class="sv-ph-st">' + T('等你验收', 'To verify') + '</span></div>' +
        '<b>' + T('客户分级与负责人变更审批', 'Customer tiers &amp; approval') + '</b>' +
        '<ul class="sv-ph-list">' +
          '<li>' + I('circle-check') + T('自动测试 35/35 通过', '35/35 tests passed') + '</li>' +
          '<li>' + I('circle-check') + T('跨模型评审已通过', 'Cross-model review passed') + '</li>' +
          '<li>' + I('circle-check') + T('6 项验收清单通过', '6/6 checklist passed') + '</li>' +
        '</ul>' +
        '<p class="sv-ph-adv">' + T('Agent 建议通过：重算后 A 级客户 212 → 236 家。', 'Agent recommends approving: Tier A 212 → 236.') + '</p>' +
        '<div class="sv-ph-link">' + I('globe') + T('打开测试环境', 'Open preview') + I('arrow-up-right') + '</div>' +
      '</div>' +
      '<div class="sv-ph-acts">' +
        '<span class="st-btn p">' + I('check') + T('验收通过', 'Approve') + '</span>' +
        '<span class="st-btn">' + T('退回修改', 'Send back') + '</span>' +
      '</div>' +
    '</div>' +
  '</div>';

const decide = '<div class="sv-dec-wrap">' + decideDesktop + decidePhone + '</div>';

// ---------- 方法、经验、知识沉淀在团队里 ----------
function skill(name, zh, en, ver, scope_zh, scope_en) {
  return `<div class="sv-it"><span class="st-chip mono">${name}</span><span>${T(zh, en)}</span><em>${ver} · ${T(scope_zh, scope_en)}</em></div>`;
}
function doc(icon, zh, en, note_zh, note_en, ok = false) {
  return `<div class="sv-it">${I(icon)}<span>${T(zh, en)}</span><em>${ok ? I('badge-check') : ''}${T(note_zh, note_en)}</em></div>`;
}
function mem(zh, en, typ_zh, typ_en, k, who) {
  return `<div class="sv-mem"><p>${T(zh, en)}</p><span>${ag(k)}${who}<em>${T(typ_zh, typ_en)}</em></span></div>`;
}
function col(icon, zh, en, szh, sen, body) {
  return `<div class="st-card sv-kc"><div class="sv-kh">${I(icon)}<div><b>${T(zh, en)}</b><span>${T(szh, sen)}</span></div></div>${body}</div>`;
}
const memory = win([['项目', 'Projects'], ['NocoCRM 定制', 'NocoCRM custom']],
  '<div class="sv-know">' +
    col('sparkles', '技能', 'Skills', '做事的方法', 'How the work is done',
      skill('studio-development', '开发规范', 'Development rules', 'v12', '全局', 'Global') +
      skill('studio-review', '评审规范', 'Review rules', 'v7', '全局', 'Global') +
      skill('studio-testing', '测试规范', 'Testing rules', 'v5', '全局', 'Global') +
      skill('crm-fields', 'CRM 字段与命名', 'CRM fields &amp; naming', 'v3', '本项目', 'This project') +
      '<p class="sv-note">' + T('每次运行自动带上：全局 → 项目 → 工作目录', 'Every run carries them: global → project → workdir') + '</p>') +
    col('book-open', '知识库', 'Knowledge base', '业务资料', 'Business material',
      doc('file-text', '折扣审批规则', 'Discount approval rules', '已核实', 'Verified', true) +
      doc('file-text', '客户分级口径', 'Customer tier definitions', 'v4', 'v4') +
      doc('file-text', '销售流程说明', 'Sales process', 'v2', 'v2') +
      doc('file', '合同模板.pdf', 'Contract template.pdf', '文件', 'File') +
      '<div class="sv-prop">' + av('王', 'L') + '<p>' + T('王磊上传了《2026 年价格政策.pdf》', 'Leo uploaded 2026 pricing policy.pdf') + '<span class="up">' + T('已提取文字，Agent 工作时可以查阅', 'Text extracted, ready for agents to read') + '</span></p></div>') +
    col('lightbulb', '项目记忆', 'Project memory', 'Agent 学到的经验', 'What agents learned',
      mem('测试前先跑数据迁移，否则阶段字段为空，6 个场景会有 2 个失败。', 'Run the migration before tests, or the stage field is empty and 2 of 6 scenarios fail.', '项目', 'Project', 'cx', 'Codex · CRM-144') +
      mem('客户手机号导入前去掉 +86 前缀，否则查重会漏掉。', 'Strip +86 from phone numbers before import, or dedupe misses them.', '项目', 'Project', 'cc', 'Claude Code · CRM-152') +
      mem('评审时一并检查暗色模式，客户反馈过两次对比度问题。', 'Check dark mode in every review; the customer has flagged contrast twice.', '反馈', 'Feedback', 'cc', 'Claude Code · CRM-139') +
      '<p class="sv-note">' + T('写在仓库的 .nb-studio/memory，下次开工前先读', 'Kept in the repo’s .nb-studio/memory and read before each issue') + '</p>') +
  '</div>');

// ---------- 按流程推进，关键节点由人把关 ----------
// 对照 Studio 真实「项目 › 工作流程」界面（quality-canvas-zh-CN / en-US）：
// 项目子页签 + 分段流程切换（精简流程 默认 / 标准流程 / 🔒 质量测试）+ 右侧「+ 新建流程」+ 虚线浅蓝 AI 流程画布（含编号步骤胶囊、并行维度卡、规则/配置按钮、两侧人工门禁卡与底部虚线说明）+ 常驻技能表
function wfGate(tone, roleZh, roleEn, ic, actZh, actEn) {
  return `<div class="sv-wf-gate"><span class="sv-wf-role ${tone}"><i></i>${T(roleZh, roleEn)}</span><div class="sv-wf-act">${I(ic)}<b>${T(actZh, actEn)}</b></div></div>`;
}
function wfPill(num, zh, en) {
  return `<div class="sv-wf-pill"><i>${num}</i><span>${T(zh, en)}</span></div>`;
}
function wfDim(zh, en, custom = false) {
  return `<span class="sv-wf-dim${custom ? ' cust' : ''}"><i></i>${T(zh, en)}</span>`;
}
function wfSkillRow(slug, ver, scopeZh, scopeEn, descZh, descEn) {
  return `<tr><td class="mono sv-wf-sname">${slug} · ${ver}</td><td class="sv-wf-scope">${T(scopeZh, scopeEn)}</td><td class="sv-wf-sd">${T(descZh, descEn)}</td><td class="sv-wf-op"><span>${T('查看', 'View')}</span><span>${T('移除', 'Remove')}</span></td></tr>`;
}

const wfPanelStandard =
  '<div class="sv-wf-pane on" role="tabpanel" data-wf-panel="standard">' +
    '<div class="sv-wf-flow">' +
      wfGate('bl', '需求方 / 负责人', 'Requester / Lead', 'play', '需求确认', 'Confirm scope') +
      '<span class="sv-wf-arr" aria-hidden="true">→</span>' +
      '<div class="sv-wf-box">' +
        '<div class="sv-wf-bhd">' +
          '<span class="sv-wf-bic">' + I('bot') + '</span><b>' + T('标准流程', 'Standard') + '</b>' +
          '<code class="mono">standard-flow · v12</code>' +
          '<span class="sv-wf-bacts"><span class="sv-wf-mb">' + I('file-text') + T('查看规则', 'View rules') + '</span><span class="sv-wf-mb">' + T('编辑步骤', 'Edit steps') + '</span></span>' +
        '</div>' +
        '<div class="sv-wf-steps">' +
          wfPill(1, '方案评估', 'Approach') + '<span class="sv-wf-sa" aria-hidden="true">→</span>' +
          wfPill(2, '编码实现', 'Implement') + '<span class="sv-wf-sa" aria-hidden="true">→</span>' +
          '<div class="sv-wf-par">' +
            '<div class="sv-wf-parh"><span class="sv-wf-pn"><i>3</i>' + T('质量门禁', 'Quality gates') + '</span><em>' + T('2 项必过', '2 required') + '</em></div>' +
            '<div class="sv-wf-dims">' +
              wfDim('跨模型只读评审', 'Cross-model review') +
              wfDim('CI 自动检查', 'CI checks') +
            '</div>' +
          '</div>' + '<span class="sv-wf-sa" aria-hidden="true">→</span>' +
          wfPill(4, '提交交付', 'Hand off') +
        '</div>' +
        '<p class="sv-wf-bn">' + T('适合核心功能、跨模块改造与数据迁移；每次运行自动加载下方常驻技能。', 'For core features, refactors, and migrations; loads resident skills on every run.') + '</p>' +
      '</div>' +
      '<span class="sv-wf-arr" aria-hidden="true">→</span>' +
      wfGate('gr', '需求方 / 负责人', 'Requester / Lead', 'file-check-2', '交付验收', 'Accept &amp; merge') +
    '</div>' +
    '<div class="sv-wf-cap"><span>' + T('需求方退回修改时自动回到 AI 执行阶段；关键节点始终由人把关', 'Rejected deliveries return automatically to AI execution; people stay at the gates') + '</span></div>' +
  '</div>';

const wfPanelQuality =
  '<div class="sv-wf-pane" role="tabpanel" data-wf-panel="quality" hidden>' +
    '<div class="sv-wf-flow">' +
      wfGate('bl', '发起人 / 定时', 'Initiator / Schedule', 'play', '发起测试', 'Start a test') +
      '<span class="sv-wf-arr" aria-hidden="true">→</span>' +
      '<div class="sv-wf-box">' +
        '<div class="sv-wf-bhd">' +
          '<span class="sv-wf-bic">' + I('bot') + '</span><b>' + T('质量测试', 'Quality test') + '</b>' +
          '<span class="sv-wf-lock">' + I('lock') + T('插件托管', 'Plugin managed') + '</span>' +
          '<code class="mono">quality-flow · v1</code>' +
          '<span class="sv-wf-bacts"><span class="sv-wf-mb">' + I('file-text') + T('查看规则', 'View rules') + '</span><span class="sv-wf-mb">' + T('配置维度', 'Configure dimensions') + I('arrow-up-right') + '</span></span>' +
        '</div>' +
        '<div class="sv-wf-steps">' +
          wfPill(1, '确定范围', 'Set the scope') + '<span class="sv-wf-sa" aria-hidden="true">→</span>' +
          '<div class="sv-wf-par">' +
            '<div class="sv-wf-parh"><span class="sv-wf-pn"><i>2</i>' + T('多维度并行测试', 'Test dimensions in parallel') + '</span><em>' + T('已启用 6 项', '6 enabled') + '</em></div>' +
            '<div class="sv-wf-dims">' +
              wfDim('功能', 'Functional') +
              wfDim('权限', 'Permissions') +
              wfDim('安全', 'Security') +
              wfDim('性能', 'Performance') +
              wfDim('代码质量', 'Code quality') +
              wfDim('Accessibility · 自定义', 'Accessibility · Custom', true) +
            '</div>' +
          '</div>' + '<span class="sv-wf-sa" aria-hidden="true">→</span>' +
          wfPill(3, '汇总与跟进', 'Summarize &amp; follow up') +
        '</div>' +
        '<p class="sv-wf-bn">' + T('支持日常、发版、项目与自定义四类测试；测试不修改业务代码。', 'Supports daily, release, project and custom tests; a test never changes product code.') + '</p>' +
      '</div>' +
      '<span class="sv-wf-arr" aria-hidden="true">→</span>' +
      wfGate('gr', '发起人', 'Initiator', 'file-check-2', '报告验收', 'Accept the report') +
    '</div>' +
    '<div class="sv-wf-cap"><span>' + T('由质量插件自动触发与托管，不可在任务中手动选用；问题在跟进任务中单独闭环，不退回本次测试', 'Started and managed by the quality plugin, never chosen in an issue; problems close in follow-up issues') + '</span></div>' +
  '</div>';

const wfPanelSimple =
  '<div class="sv-wf-pane" role="tabpanel" data-wf-panel="simple" hidden>' +
    '<div class="sv-wf-flow">' +
      wfGate('bl', '需求方', 'Requester', 'play', '发起任务', 'Start issue') +
      '<span class="sv-wf-arr" aria-hidden="true">→</span>' +
      '<div class="sv-wf-box">' +
        '<div class="sv-wf-bhd">' +
          '<span class="sv-wf-bic">' + I('bot') + '</span><b>' + T('精简流程', 'Simple') + '</b>' +
          '<span class="sv-wf-def">' + T('默认', 'Default') + '</span>' +
          '<code class="mono">simple-flow · v6</code>' +
          '<span class="sv-wf-bacts"><span class="sv-wf-mb">' + I('file-text') + T('查看规则', 'View rules') + '</span><span class="sv-wf-mb">' + T('编辑步骤', 'Edit steps') + '</span></span>' +
        '</div>' +
        '<div class="sv-wf-steps sv-wf-steps-sm">' +
          wfPill(1, '编码实现', 'Implement') + '<span class="sv-wf-sa" aria-hidden="true">→</span>' +
          wfPill(2, 'CI 检查与评审', 'CI &amp; review') + '<span class="sv-wf-sa" aria-hidden="true">→</span>' +
          wfPill(3, '提交交付', 'Hand off') +
        '</div>' +
        '<p class="sv-wf-bn">' + T('适合文案调整、轻量修复与小需求快速交付；同样自动加载下方常驻技能。', 'For small fixes and lightweight changes; still loads resident skills on every run.') + '</p>' +
      '</div>' +
      '<span class="sv-wf-arr" aria-hidden="true">→</span>' +
      wfGate('gr', '需求方', 'Requester', 'file-check-2', '验收合并', 'Accept &amp; merge') +
    '</div>' +
    '<div class="sv-wf-cap"><span>' + T('轻量改动直接走精简流程快速交付；涉及复杂改动时可随时切换为标准流程', 'Fast path for small changes; switch to Standard anytime a design approach is needed') + '</span></div>' +
  '</div>';

const workflow = win([['项目', 'Projects'], ['NocoCRM', 'NocoCRM'], ['工作流程', 'Workflow']],
  '<div class="sv-ptabs">' +
    '<span>' + T('概览', 'Overview') + '</span>' +
    '<span>' + T('任务 12', 'Issues 12') + '</span>' +
    '<span class="on">' + T('工作流程', 'Workflow') + '</span>' +
    '<span>' + T('质量', 'Quality') + '</span>' +
    '<span>' + T('知识库', 'Knowledge') + '</span>' +
    '<span>' + T('记忆', 'Memory') + '</span>' +
    '<span>' + T('发布', 'Releases') + '</span>' +
    '<span>' + T('设置', 'Settings') + '</span>' +
  '</div>' +
  '<div class="sv-wf-head">' +
    '<div><h4>' + T('工作流程', 'Workflow') + '</h4><p>' + T('本项目任务从启动到合并的完整流转：AI 执行流程前后的人工步骤，以及每次运行都加载的技能。', 'How an issue in this project moves from start to merge: people’s steps around the agent’s workflow, and the skills every run gets.') + '</p></div>' +
  '</div>' +
  '<div class="sv-wf-bar">' +
    '<div class="sv-wf-seg" role="tablist" aria-label="Workflow">' +
      '<button type="button" role="tab" class="sv-wf-tab" data-wf-tab="simple" aria-selected="false" tabindex="-1">' + T('精简流程', 'Simple') + '<em>' + T('默认', 'Default') + '</em></button>' +
      '<button type="button" role="tab" class="sv-wf-tab" data-wf-tab="standard" aria-selected="true" tabindex="0">' + T('标准流程', 'Standard') + '</button>' +
      '<button type="button" role="tab" class="sv-wf-tab" data-wf-tab="quality" aria-selected="false" tabindex="-1">' + I('lock') + T('质量测试', 'Quality test') + '</button>' +
    '</div>' +
    '<span class="st-btn p sv-wf-new">' + I('plus') + T('新建流程', 'New workflow') + '</span>' +
  '</div>' +
  '<div class="st-card sv-wf-canvas">' + wfPanelStandard + wfPanelQuality + wfPanelSimple + '</div>' +
  '<div class="sv-wf-sec">' +
    '<div class="sv-wf-sh"><div><b>' + T('常驻技能', 'Resident skills') + '</b><span>' + T('此作用域内的每次运行都会加载这些技能，与流程无关。修改从各任务的下一轮运行起生效。', 'Every run in this scope gets these skills, whatever its workflow. Changes apply on the next run.') + '</span></div>' +
      '<span class="sv-wf-add">' + I('plus') + T('添加技能', 'Add skill') + '</span></div>' +
    '<div class="st-card sv-wf-skills"><table class="st-tbl sv-wf-stbl"><thead><tr><th>' + T('技能', 'Skill') + '</th><th>' + T('作用域', 'Scope') + '</th><th>' + T('说明', 'Description') + '</th><th class="r">' + T('操作', 'Actions') + '</th></tr></thead><tbody>' +
      wfSkillRow('studio-development', 'v10', '整个项目', 'The whole project', '开发与验证规范：编码实现、本地验证、CI 失败处理、评审与交付标准', 'Development standard for agents: implement, verify, handle CI failures, review &amp; deliver') +
      wfSkillRow('studio-approach', 'v3', '整个项目', 'The whole project', '方案设计规范：实现前如何撰写设计方案、边界拆解与影响评估', 'How to write a design approach, scope breakdown, and impact plan before coding') +
      wfSkillRow('studio-review', 'v4', '整个项目', 'The whole project', '代码评审规范：缺陷、安全与简洁性分级（must fix / should fix）与合并门禁', 'PR review standard: defects, security, severity tiers, and merge-blocking rules') +
    '</tbody></table></div>' +
  '</div>', '', ' data-live="studio-workflow" data-wf="standard"');

// ---------- 全自动质量测试，问题闭环修复 ----------
// 四种触发 + 闭环流程条 + 6 张覆盖七个维度的工具实测卡片（明确通过/有问题/未验证）+ 自动登记跟进任务闭环条
function qCard(titleZh, titleEn, toolZh, toolEn, stClass, stZh, stEn, valZh, valEn, descZh, descEn, barPct, barClass) {
  return `<div class="st-card sv-qc">` +
    `<div class="sv-qch"><div><b>${T(titleZh, titleEn)}</b><small>${T(toolZh, toolEn)}</small></div><span class="sv-qst ${stClass}">${T(stZh, stEn)}</span></div>` +
    `<div class="sv-qval">${T(valZh, valEn)}</div>` +
    `<div class="sv-qbar"><i class="${barClass}" style="width:${barPct}%"></i></div>` +
    `<p class="sv-qdesc">${T(descZh, descEn)}</p>` +
  `</div>`;
}
const quality = win([['项目', 'Projects'], ['NocoCRM', 'NocoCRM'], ['质量', 'Quality']],
  '<div class="sv-q-head">' +
    '<div><h4>' + T('质量测试与闭环', 'Automated quality runs') + '</h4><p>' + T('四种触发共用一套引擎，多台测试机按维度并行实测，问题自动转为跟进任务', 'One engine across four triggers, parallel runners per dimension, and automatic follow-up fixes') + '</p></div>' +
    '<div class="sv-q-ctrl">' +
      '<div class="sv-q-seg"><span>' + T('每日', 'Daily') + '</span><span class="on">' + T('发布', 'Release') + '</span><span>' + T('项目', 'Project') + '</span><span>' + T('自定义', 'Custom') + '</span></div>' +
      '<span class="st-btn p">' + I('play') + T('运行测试', 'Run test') + '</span>' +
    '</div>' +
  '</div>' +
  '<div class="sv-q-loop">' +
    '<span><b>1</b>' + T('定时 / 发版触发', 'Trigger run') + '</span><i>→</i>' +
    '<span><b>2</b>' + T('多机并行实测', 'Parallel runners') + '</span><i>→</i>' +
    '<span><b>3</b>' + T('自动汇总报告', 'Auto reports') + '</span><i>→</i>' +
    '<span class="hi"><b>4</b>' + T('问题转跟进任务修复', 'Auto follow-up fixes') + '</span><i>→</i>' +
    '<span><b>5</b>' + T('下次测试再验证', 'Retest & verify') + '</span>' +
  '</div>' +
  '<div class="sv-q-grid">' +
    qCard('功能与冒烟', 'Features & smoke', 'Playwright · Vitest', 'Playwright · Vitest', 'ok', '通过', 'Passed', '42 / 42', '42 / 42', '核心业务与 P0 冒烟场景全部通过', 'All core & P0 smoke scenarios passed', 100, 'ok') +
    qCard('权限', 'Permissions', '多身份权限引擎', 'Role-matrix engine', 'err', '有问题', 'Issues', '1 处读越权', '1 read leak', '非成员接口越权 · 已建跟进 #QM-41', 'Non-member read leak · Filed #QM-41', 82, 'err') +
    qCard('安全', 'Security', 'OWASP ZAP · gitleaks · audit', 'OWASP ZAP · gitleaks · audit', 'ok', '通过', 'Passed', '0 高危', '0 critical', '依赖漏洞、密钥与主被动扫描全过', 'Audit, secrets & active/passive scans clean', 100, 'ok') +
    qCard('性能', 'Performance', 'Lighthouse · 采样 · SQL', 'Lighthouse · API · SQL', 'err', '有问题', 'Issues', '1 条慢 SQL', '1 slow SQL', 'P95 210 ms · 已建优化 #QM-42', 'P95 210 ms · Filed #QM-42', 88, 'warn') +
    qCard('代码质量', 'Code quality', 'jscpd · sonarjs · knip', 'jscpd · sonarjs · knip', 'ok', '通过', 'Passed', '重复率 1.8%', '1.8% dup', '0 循环依赖 · 覆盖率 86%', '0 circular deps · 86% coverage', 100, 'ok') +
    qCard('UX 防错', 'UX safeguards', 'Playwright · 可用性检查', 'Playwright · UX checks', 'warn', '未验证', 'Unverified', '缺测试账号', 'Missing role', '不凑数通过，缺条件明确标出', 'Flagged honestly instead of false pass', 62, 'warn') +
  '</div>' +
  '<div class="sv-q-foot">' +
    '<span class="sv-q-fl">' + I('refresh-cw') + '<b>' + T('自动闭环', 'Closed loop') + '</b></span>' +
    '<span class="st-chip bl">' + SPIN + T('QM-41 权限越权 · Agent 修复中', 'QM-41 Permission leak · Agent fixing') + '</span>' +
    '<span class="st-chip">' + si('done') + T('QM-42 慢 SQL · 跨模型评审通过', 'QM-42 Slow SQL · Review passed') + '</span>' +
    '<span class="st-chip o">' + T('1 项待确认 · 等人拍板', '1 ambiguous rule · Human call') + '</span>' +
  '</div>');

const FIGS = [['team', team], ['decide', decide], ['workflow', workflow], ['quality', quality], ['memory', memory], ['progress', progress]];

const CSS = `/* HOME-STUDIO */
/* 首页 Studio 段：左侧四条特色，右侧换图（由 homepage/scripts/figs/home-studio.mjs 写入，改样式请改脚本） */
.stv { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 48px; align-items: start; }
.stv-tabs { display: grid; gap: 4px; }
.stv-tab { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 4px 10px; padding: 13px 16px 14px; border: 0; border-left: 2px solid var(--rule-2); background: none; text-align: left; cursor: pointer; color: var(--ink-2); font: inherit; }
.stv-tab:hover { color: var(--ink); }
.stv-tab svg.lucide { width: 17px; height: 17px; margin-top: 3px; color: var(--muted); }
.stv-tab b { font-size: 16px; line-height: 1.48; font-weight: 600; }
.stv-tab p { grid-column: 2; display: none; font-size: 14px; line-height: 1.7; color: var(--ink-2); text-wrap: pretty; }
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
.sv-night { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px 0 7px; border-radius: 13px; background: var(--deep); color: var(--on-deep); font-size: 12px; white-space: nowrap; }
.sv-night time { font-size: 11.5px; color: var(--on-deep); font-variant-numeric: tabular-nums; }
.sv-clock { width: 16px; height: 16px; color: var(--on-deep); flex: none; }
.sv-ck-h { transform-origin: 10px 10px; animation: svClock 16s linear infinite; }
.sv-ck-m { transform-origin: 10px 10px; animation: svClock 2.2s linear infinite; }
@keyframes svClock { to { transform: rotate(360deg); } }
.sv-num { font-style: normal; font-variant-numeric: tabular-nums; }
.is-tick { animation: svTick 0.35s ease; }
@keyframes svTick { 0% { opacity: 0.35; } 100% { opacity: 1; } }
.sv-team { display: grid; grid-template-columns: minmax(0, 1fr) 268px; gap: 12px; align-items: start; }
.sv-team .st-tbl td b svg.lucide { width: 13px; height: 13px; margin-right: 6px; vertical-align: -1px; color: var(--muted); }
.sv-team .st-tag b { font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }
.sv-dp { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 8px; padding: 9px 12px; border-top: 1px solid var(--rule); border-left: 2px solid transparent; transition: background 0.2s, border-color 0.2s; }
.sv-dp.is-live { background: oklch(0.52 0.2 266 / 0.055); border-left-color: var(--brand); }
@media (prefers-reduced-motion: reduce) { .sv-ck-h, .sv-ck-m, .is-tick { animation: none; } }
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
/* 等你验收：左桌面端 + 右手机画面 */
.sv-dec-wrap { display: grid; grid-template-columns: minmax(0, 1fr) 272px; gap: 16px; align-items: stretch; }
.sv-dh { display: flex; align-items: flex-start; gap: 12px; }
.sv-dh h4 { font-size: 17px; line-height: 1.35; font-weight: 650; margin-bottom: 5px; }
.sv-dh .st-pill { margin-left: auto; }
.sv-wait { border-color: var(--human); background: var(--human-tint); color: var(--on-human); }
.sv-env { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border: 1px solid var(--rule); border-radius: 10px; background: var(--card); }
.sv-env > svg.lucide { width: 16px; height: 16px; color: var(--brand); flex: none; }
.sv-env-t { min-width: 0; flex: 1; }
.sv-env-t b { display: block; font-size: 12.5px; font-weight: 600; color: var(--ink); }
.sv-env-t span { display: block; font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sv-env .st-btn { height: 28px; font-size: 12px; }
.sv-p { font-size: 12.5px; line-height: 1.65; color: var(--ink); }
.sv-ck { display: grid; grid-template-columns: 14px minmax(0, 1fr) auto; gap: 9px; align-items: center; min-height: 28px; padding: 3px 0; border-top: 1px solid var(--rule); font-size: 12px; }
.sv-ck:first-of-type { border-top: 0; }
.sv-ck .st-chip { height: 20px; font-size: 11px; }
.sv-act-bar { display: flex; align-items: center; gap: 8px; padding-top: 2px; }
.sv-act-bar .st-btn { height: 32px; }
.sv-act-bar .r { margin-left: auto; font-size: 11.5px; color: var(--muted); }
/* 手机验收画面 */
.sv-phone { display: flex; flex-direction: column; border: 3px solid var(--ink); border-radius: 28px; background: var(--paper); overflow: hidden; box-shadow: 0 1px 2px oklch(0.25 0.05 266 / 0.06), 0 14px 30px -16px oklch(0.25 0.06 266 / 0.25); text-align: left; }
.sv-ph-bar { display: flex; align-items: center; justify-content: space-between; height: 28px; padding: 0 16px; background: var(--card); font: 600 11px/1 var(--f-mono); color: var(--ink-2); }
.sv-ph-notch { width: 62px; height: 11px; border-radius: 999px; background: var(--ink); }
.sv-ph-hd { display: flex; align-items: center; gap: 8px; padding: 9px 14px; background: var(--card); border-bottom: 1px solid var(--rule); font-size: 12.5px; font-weight: 600; color: var(--ink); }
.sv-ph-hd img { height: 12.5px; width: auto; }
.sv-ph-hd em { margin-left: auto; font-style: normal; min-width: 19px; height: 19px; padding: 0 5px; border-radius: 9px; background: var(--human-tint); color: var(--human-ink); font-size: 11px; font-weight: 600; display: inline-grid; place-items: center; }
.sv-ph-body { flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 12px; }
.sv-ph-card { background: var(--card); border: 1px solid var(--rule); border-radius: 12px; padding: 12px 13px; display: grid; gap: 9px; }
.sv-ph-meta { display: flex; align-items: center; justify-content: space-between; font-size: 11px; }
.sv-ph-st { padding: 2px 7px; border-radius: 5px; background: var(--human-tint); color: var(--human-ink); font-weight: 600; }
.sv-ph-card b { font-size: 13.5px; line-height: 1.4; font-weight: 650; color: var(--ink); }
.sv-ph-list { display: grid; gap: 6px; font-size: 11.5px; color: var(--ink-2); }
.sv-ph-list li { display: flex; align-items: center; gap: 7px; }
.sv-ph-list svg.lucide { width: 13.5px; height: 13.5px; color: var(--pass); flex: none; }
.sv-ph-adv { font-size: 11.5px; line-height: 1.55; color: var(--muted); padding-top: 7px; border-top: 1px solid var(--rule); }
.sv-ph-link { display: flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 8px; background: var(--paper); border: 1px solid var(--rule); font-size: 11.5px; font-weight: 550; color: var(--brand); }
.sv-ph-link svg.lucide { width: 13px; height: 13px; }
.sv-ph-link svg.lucide:last-child { margin-left: auto; }
.sv-ph-acts { margin-top: auto; display: grid; gap: 7px; }
.sv-ph-acts .st-btn { width: 100%; justify-content: center; height: 34px; font-size: 12.5px; border-radius: 8px; }
.sv-adv { border-color: var(--human); }
.sv-adv > .h { color: var(--ink); font-weight: 600; }
.sv-adv > .h .st-a { width: 18px; height: 18px; }
.sv-adv p { font-size: 12.5px; line-height: 1.65; }
.sv-act { display: flex; gap: 8px; margin-top: 10px; }
.sv-act .st-btn { height: 32px; }
/* 工作流程与常驻技能（对照 Studio 真实「项目 › 工作流程」画布） */
.sv-win[data-live="studio-workflow"] .sv-body { gap: 9px; padding: 11px 16px 13px; background: var(--card); }
.sv-ptabs { display: flex; align-items: center; gap: 14px; border-block-end: 1px solid var(--rule); padding-block-end: 6px; font-size: 11px; color: var(--muted); overflow: clip; }
.sv-ptabs span { position: relative; white-space: nowrap; padding-block-end: 6px; margin-block-end: -7px; }
.sv-ptabs span.on { color: var(--ink); font-weight: 600; border-block-end: 2px solid var(--ink); }
.sv-wf-head h4 { font-size: 14.5px; line-height: 1.3; font-weight: 650; color: var(--ink); }
.sv-wf-head p { margin-block-start: 1px; font-size: 11px; line-height: 1.45; color: var(--muted); }
.sv-wf-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.sv-wf-seg { display: inline-flex; align-items: center; gap: 2px; padding: 2.5px; border-radius: 8px; border: 1px solid var(--rule); background: var(--paper-2); }
.sv-wf-tab { position: relative; display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 9px; border: 0; border-radius: 6px; background: transparent; font: inherit; font-size: 11.5px; color: var(--ink-2); white-space: nowrap; cursor: pointer; transition: background 0.15s, color 0.15s; }
.sv-wf-tab:hover { color: var(--ink); }
.sv-wf-tab[aria-selected="true"] { background: var(--card); color: var(--ink); font-weight: 600; box-shadow: 0 1px 2px oklch(0.25 0.05 266 / 0.08); }
.sv-wf-tab[aria-selected="true"]::after { content: ""; position: absolute; inset: auto 8px 0; border-block-end: 2px solid var(--brand); }
.sv-wf-tab em { font-style: normal; padding: 0 5px; border-radius: 999px; background: var(--brand-tint); color: var(--brand); font-size: 9.5px; font-weight: 600; line-height: 15px; }
.sv-wf-tab svg.lucide { width: 11.5px; height: 11.5px; color: var(--muted); }
.sv-wf-tab[aria-selected="true"] svg.lucide { color: var(--ink); }
.sv-wf-new { height: 27px; padding: 0 10px; font-size: 11.5px; border-radius: 7px; }
.sv-wf-canvas { padding: 12px 13px 10px; background: var(--paper); border-radius: 10px; }
.sv-wf-pane { display: grid; gap: 9px; align-content: space-between; min-block-size: 174px; }
.sv-wf-pane[hidden] { display: none; }
.sv-wf-flow { display: grid; grid-template-columns: minmax(104px, max-content) 12px minmax(0, 1fr) 12px minmax(104px, max-content); gap: 4px; align-items: center; }
.sv-wf-gate { padding: 8px 10px; border: 1px solid var(--rule); border-radius: 9px; background: var(--card); box-shadow: 0 1px 2px oklch(0.25 0.05 266 / 0.04); display: grid; gap: 6px; justify-items: start; }
.sv-wf-role { display: inline-flex; align-items: center; gap: 4px; height: 18px; padding: 0 6px; border-radius: 999px; font-size: 9.5px; font-weight: 550; white-space: nowrap; }
.sv-wf-role i { width: 4.5px; height: 4.5px; border-radius: 50%; background: currentColor; flex: none; }
.sv-wf-role.bl { background: var(--brand-tint); color: var(--brand); }
.sv-wf-role.gr { background: var(--pass-tint); color: var(--pass-ink); }
.sv-wf-act { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--ink); white-space: nowrap; }
.sv-wf-act svg.lucide { width: 11.5px; height: 11.5px; color: var(--ink-2); flex: none; }
.sv-wf-act b { font-weight: 600; }
.sv-wf-arr { text-align: center; font-size: 11.5px; color: var(--muted); }
.sv-wf-box { padding: 9px 11px 8px; border: 1.5px dashed oklch(0.66 0.14 266 / 0.48); border-radius: 10px; background: oklch(0.974 0.012 266); display: grid; gap: 8px; min-inline-size: 0; }
.sv-wf-bhd { display: flex; align-items: center; gap: 6px; flex-wrap: nowrap; min-inline-size: 0; }
.sv-wf-bic { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 6px; background: var(--card); border: 1px solid oklch(0.86 0.03 266); color: var(--brand); flex: none; }
.sv-wf-bic svg.lucide { width: 11.5px; height: 11.5px; }
.sv-wf-bhd b { font-size: 12px; font-weight: 650; color: var(--ink); white-space: nowrap; }
.sv-wf-lock { display: inline-flex; align-items: center; gap: 3px; height: 18px; padding: 0 6px; border-radius: 5px; background: var(--paper-2); border: 1px solid var(--rule); font-size: 9.5px; font-weight: 550; color: var(--ink-2); white-space: nowrap; }
.sv-wf-lock svg.lucide { width: 10px; height: 10px; color: var(--muted); }
.sv-wf-def { display: inline-flex; align-items: center; height: 18px; padding: 0 6px; border-radius: 5px; background: var(--brand-tint); font-size: 9.5px; font-weight: 600; color: var(--brand); white-space: nowrap; }
.sv-wf-bhd code { font-size: 10px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sv-wf-bacts { margin-inline-start: auto; display: inline-flex; align-items: center; gap: 5px; flex: none; }
.sv-wf-mb { display: inline-flex; align-items: center; gap: 3px; height: 21px; padding: 0 7px; border-radius: 5px; border: 1px solid var(--rule); background: var(--card); font-size: 10px; font-weight: 500; color: var(--ink-2); white-space: nowrap; }
.sv-wf-mb svg.lucide { width: 10.5px; height: 10.5px; color: var(--muted); }
.sv-wf-steps { display: flex; align-items: center; gap: 5px; min-inline-size: 0; }
.sv-wf-steps-sm { justify-content: center; padding-block: 10px; }
.sv-wf-pill { display: inline-flex; align-items: center; gap: 5px; height: 27px; padding: 0 9px 0 5px; border-radius: 999px; border: 1px solid var(--rule); background: var(--card); font-size: 11px; font-weight: 550; color: var(--ink); white-space: nowrap; flex: none; box-shadow: 0 1px 1px oklch(0.25 0.05 266 / 0.03); }
.sv-wf-pill i,
.sv-wf-pn i { display: inline-grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; background: var(--brand-tint); color: var(--brand); font: 650 10px/1 var(--f-mono); flex: none; }
.sv-wf-sa { font-size: 10.5px; color: var(--muted); flex: none; }
.sv-wf-par { flex: 1; min-inline-size: 0; padding: 6px 8px 7px; border: 1px solid var(--rule); border-radius: 8px; background: var(--card); display: grid; gap: 5px; box-shadow: 0 1px 1px oklch(0.25 0.05 266 / 0.03); }
.sv-wf-parh { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.sv-wf-pn { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; color: var(--ink); white-space: nowrap; }
.sv-wf-parh em { font-style: normal; padding: 0 5px; border-radius: 4px; background: var(--paper-2); font-size: 9.5px; color: var(--muted); line-height: 16px; white-space: nowrap; }
.sv-wf-dims { display: flex; flex-wrap: wrap; gap: 4px; }
.sv-wf-dim { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 6px; border-radius: 5px; border: 1px solid var(--rule); background: var(--paper); font-size: 10px; color: var(--ink-2); white-space: nowrap; }
.sv-wf-dim i { width: 4px; height: 4px; border-radius: 50%; background: var(--brand); flex: none; }
.sv-wf-dim.cust { border-style: dashed; background: var(--card); }
.sv-wf-bn { padding-block-start: 6px; border-block-start: 1px solid oklch(0.87 0.02 266 / 0.6); font-size: 10.5px; line-height: 1.4; color: var(--muted); }
.sv-wf-cap { display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--muted); text-align: center; }
.sv-wf-cap::before,
.sv-wf-cap::after { content: ""; flex: 1; border-block-start: 1px dashed var(--rule); }
.sv-wf-cap span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sv-wf-sec { display: grid; gap: 7px; }
.sv-wf-sh { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
.sv-wf-sh b { display: block; font-size: 13px; font-weight: 650; color: var(--ink); line-height: 1.3; }
.sv-wf-sh span:not(.sv-wf-add) { display: block; font-size: 10.5px; color: var(--muted); line-height: 1.4; }
.sv-wf-add { display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--rule-2); background: var(--card); font-size: 11px; font-weight: 500; color: var(--ink); white-space: nowrap; flex: none; }
.sv-wf-add svg.lucide { width: 11px; height: 11px; color: var(--muted); }
.sv-wf-skills { overflow: clip; }
.sv-wf-stbl th { padding: 6px 10px; font-size: 10.5px; background: var(--paper); color: var(--ink-2); }
.sv-wf-stbl th.r { text-align: right; }
.sv-wf-stbl td { padding: 6.5px 10px; font-size: 11px; }
.sv-wf-sname { font-weight: 550; color: var(--ink); white-space: nowrap; font-size: 11px !important; }
.sv-wf-scope { color: var(--muted); white-space: nowrap; font-size: 10.5px !important; }
.sv-wf-sd { color: var(--ink-2); font-size: 11px !important; }
.sv-wf-op { text-align: right; white-space: nowrap; color: var(--ink-2); font-size: 10.5px !important; }
.sv-wf-op span + span { margin-inline-start: 8px; color: var(--muted); }
/* 全自动质量测试与闭环 */
.sv-q-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.sv-q-head h4 { font-size: 17px; line-height: 1.3; font-weight: 650; }
.sv-q-head p { margin-top: 2px; font-size: 12px; color: var(--muted); }
.sv-q-ctrl { display: flex; align-items: center; gap: 8px; flex: none; }
.sv-q-seg { display: inline-flex; border: 1px solid var(--rule); border-radius: 7px; background: var(--card); overflow: hidden; }
.sv-q-seg span { padding: 0 9px; height: 28px; display: inline-flex; align-items: center; font-size: 11.5px; color: var(--ink-2); border-left: 1px solid var(--rule); white-space: nowrap; }
.sv-q-seg span:first-child { border-left: 0; }
.sv-q-seg span.on { background: var(--brand-tint); color: var(--brand); font-weight: 600; }
.sv-q-ctrl .st-btn { height: 28px; font-size: 12px; }
.sv-q-loop { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 7px 11px; border: 1px solid var(--rule); border-radius: 8px; background: var(--card); font-size: 11.5px; color: var(--ink-2); }
.sv-q-loop span { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
.sv-q-loop span.hi { color: var(--brand); font-weight: 600; }
.sv-q-loop b { display: inline-grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; background: var(--paper-2); color: var(--ink-2); font: 600 10px/1 var(--f-mono); }
.sv-q-loop span.hi b { background: var(--brand); color: var(--on-brand); }
.sv-q-loop i { font-style: normal; color: var(--muted); }
.sv-q-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }
.sv-qc { padding: 10px 11px; display: grid; gap: 6px; align-content: start; }
.sv-qch { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; }
.sv-qch b { display: block; font-size: 12.5px; font-weight: 600; line-height: 1.3; }
.sv-qch small { display: block; font-size: 10.5px; color: var(--muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sv-qst { flex: none; padding: 1px 6px; border-radius: 5px; font-size: 10.5px; font-weight: 600; white-space: nowrap; }
.sv-qst.ok { background: var(--pass-tint); color: var(--pass-ink); }
.sv-qst.err { background: oklch(0.95 0.04 22); color: oklch(0.48 0.16 22); }
.sv-qst.warn { background: var(--human-tint); color: var(--human-ink); }
.sv-qval { font-size: 17px; font-weight: 700; line-height: 1.2; color: var(--ink); font-variant-numeric: tabular-nums; }
.sv-qbar { height: 5px; border-radius: 999px; background: var(--paper-2); overflow: hidden; }
.sv-qbar i { display: block; height: 100%; border-radius: 999px; }
.sv-qbar i.ok { background: var(--pass); }
.sv-qbar i.err { background: oklch(0.58 0.18 22); }
.sv-qbar i.warn { background: var(--human); }
.sv-qdesc { font-size: 11px; line-height: 1.45; color: var(--ink-2); }
.sv-q-foot { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; padding: 8px 11px; border: 1px solid var(--rule); border-radius: 9px; background: var(--card); }
.sv-q-fl { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--ink); margin-right: 2px; }
.sv-q-fl svg.lucide { width: 13px; height: 13px; color: var(--brand); }
.sv-q-foot .st-chip { height: 22px; font-size: 11px; }
.sv-q-foot .st-chip .st-spin { width: 10px; height: 10px; border-width: 1.4px; }
.sv-q-foot .st-chip .si { width: 11px; height: 11px; }
.sv-q-foot .st-chip .si.done::after { left: 2.5px; top: 1px; width: 2.4px; height: 4.8px; }
.sv-q-foot .st-chip.o { background: var(--human-tint); color: var(--human-ink); margin-left: auto; }
/* 技能、知识库、项目记忆 */
.sv-body:has(> .sv-know) { align-content: stretch; }
.sv-know { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; align-items: stretch; height: 100%; }
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
/* 手机端克制等高、缩小比例与字号（单屏完整呈现，免缩放、免横向拖拽） */
@media (max-width: 640px) {
  .stv-mobile-fig .sv-win { height: 344px; font-size: 10.5px; line-height: 1.4; border-radius: 10px; }
  .stv-mobile-fig .sv-top { height: 32px; gap: 6px; padding: 0 10px; font-size: 10.5px; white-space: nowrap; }
  .stv-mobile-fig .sv-brand { gap: 6px; }
  .stv-mobile-fig .sv-brand img { height: 11px; }
  .stv-mobile-fig .sv-brand span { font-size: 10px; padding-left: 6px; }
  .stv-mobile-fig .sv-top .st-av { width: 18px; height: 18px; font-size: 9px; }
  .stv-mobile-fig .sv-top > span:not(.sv-brand):not(.r),
  .stv-mobile-fig .sv-top > svg.lucide { display: none; }
  .stv-mobile-fig .sv-top b { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .stv-mobile-fig .sv-body { padding: 9px 10px 10px; gap: 7px; overflow: hidden; align-content: start; }
  .stv-mobile-fig .sv-body .st-ph { align-items: center; gap: 8px; }
  .stv-mobile-fig .sv-body .st-ph h4,
  .stv-mobile-fig .sv-dh h4,
  .stv-mobile-fig .st-db h5 { font-size: 13px; line-height: 1.3; margin-bottom: 2px; }
  .stv-mobile-fig .sv-body .st-ph p { display: none; }
  .stv-mobile-fig .st-btn { height: 24px; padding: 0 8px; font-size: 10.5px; border-radius: 6px; gap: 4px; }
  .stv-mobile-fig .st-btn svg.lucide { width: 11px; height: 11px; }
  .stv-mobile-fig .st-card,
  .stv-mobile-fig .st-box { border-radius: 8px; }
  .stv-mobile-fig .st-box { padding: 7px 9px; }
  .stv-mobile-fig .st-box > .h { margin-bottom: 4px; font-size: 10.5px; gap: 5px; }
  .stv-mobile-fig .st-box > .h svg.lucide { width: 12px; height: 12px; }
  .stv-mobile-fig .sv-ch { padding: 5px 9px; font-size: 10.5px; gap: 5px; }
  .stv-mobile-fig .sv-ch b { font-size: 11px; }
  .stv-mobile-fig .sv-ch .st-a { width: 16px; height: 16px; }
  .stv-mobile-fig .st-tbl th { padding: 4px 8px; font-size: 10px; }
  .stv-mobile-fig .st-tbl td { padding: 5px 8px; font-size: 10.5px; }
  .stv-mobile-fig .st-tbl td b { font-size: 11px; }
  .stv-mobile-fig .st-tbl td small { font-size: 9.5px; }
  .stv-mobile-fig .st-tag { height: 17px; padding: 0 5px; font-size: 10px; }
  .stv-mobile-fig .st-pill { height: 20px; padding: 0 6px; font-size: 10px; gap: 4px; }
  .stv-mobile-fig .st-chip { height: 17px; padding: 0 5px; font-size: 9.5px; }
  .stv-mobile-fig .st-meta { font-size: 10px; gap: 2px 10px; }
  .stv-mobile-fig .st-av { width: 16px; height: 16px; font-size: 8.5px; }
  .stv-mobile-fig .st-a { width: 15px; height: 15px; font-size: 7.5px; border-radius: 4px; }
  /* 1. 运行环境与调度 */
  .stv-mobile-fig .sv-night { height: 22px; padding: 0 8px 0 6px; font-size: 10px; gap: 4px; }
  .stv-mobile-fig .sv-clock { width: 13px; height: 13px; }
  .stv-mobile-fig .sv-night time { font-size: 9.5px; }
  .stv-mobile-fig .sv-team { grid-template-columns: minmax(0, 1fr); gap: 7px; }
  .stv-mobile-fig .sv-team .st-tbl th:nth-child(2),
  .stv-mobile-fig .sv-team .st-tbl td:nth-child(2) { display: none; }
  .stv-mobile-fig .sv-team .st-tbl tbody tr:nth-child(n+3) { display: none; }
  .stv-mobile-fig .st-more { padding: 5px 9px; font-size: 10px; }
  .stv-mobile-fig .st-tags { flex-wrap: wrap; }
  .stv-mobile-fig .sv-dp { padding: 5px 9px; gap: 6px; grid-template-columns: 32px minmax(0, 1fr); }
  .stv-mobile-fig .sv-dp time { font-size: 9.5px; line-height: 16px; }
  .stv-mobile-fig .sv-dp b { font-size: 10.5px; }
  .stv-mobile-fig .sv-dp .id { font-size: 9.5px; }
  .stv-mobile-fig .sv-dp p { font-size: 10px; margin-top: 1px; gap: 4px; }
  .stv-mobile-fig .sv-dp p .st-a { width: 13px; height: 13px; font-size: 7px; }
  .stv-mobile-fig .sv-dp:nth-of-type(n+4) { display: none; }
  /* 2. 任务进展 */
  .stv-mobile-fig .sv-body > .st-flt { display: none; }
  .stv-mobile-fig .sv-tasks { grid-template-columns: minmax(0, 1fr); }
  .stv-mobile-fig .sv-tasks .st-list { display: none; }
  .stv-mobile-fig .st-dh { height: 30px; padding: 0 9px; font-size: 10px; gap: 5px; }
  .stv-mobile-fig .st-dh > span:nth-child(n+4):not(.r),
  .stv-mobile-fig .st-dh .r > span:not(.st-pill) { display: none; }
  .stv-mobile-fig .st-db { padding: 8px 9px 9px; gap: 6px; }
  .stv-mobile-fig .st-step { padding: 3.5px 0; font-size: 10.5px; gap: 6px; }
  .stv-mobile-fig .st-step small { font-size: 9.5px; }
  .stv-mobile-fig .st-step .who { font-size: 10px; gap: 4px; }
  .stv-mobile-fig .st-log { gap: 4px; }
  .stv-mobile-fig .st-le { font-size: 10px; gap: 6px; grid-template-columns: 16px minmax(0, 1fr) auto; }
  .stv-mobile-fig .st-le:nth-child(n+2) { display: none; }
  /* 3. 等你验收 */
  .stv-mobile-fig .sv-dec-wrap { grid-template-columns: minmax(0, 1fr); }
  .stv-mobile-fig .sv-phone { display: none; }
  .stv-mobile-fig .sv-dh { gap: 8px; }
  .stv-mobile-fig .sv-env { padding: 6px 8px; gap: 7px; border-radius: 8px; flex-wrap: nowrap; }
  .stv-mobile-fig .sv-env > svg.lucide { width: 13px; height: 13px; }
  .stv-mobile-fig .sv-env-t b { font-size: 10.5px; }
  .stv-mobile-fig .sv-env-t span { font-size: 9.5px; }
  .stv-mobile-fig .sv-env .st-btn { height: 22px; font-size: 10px; padding: 0 7px; }
  .stv-mobile-fig .sv-p { font-size: 10.5px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .stv-mobile-fig .sv-ck { min-height: 22px; padding: 2px 0; font-size: 10.5px; gap: 6px; }
  .stv-mobile-fig .sv-ck:nth-of-type(n+5) { display: none; }
  .stv-mobile-fig .sv-act-bar { padding-top: 0; gap: 6px; }
  .stv-mobile-fig .sv-act-bar .st-btn { height: 25px; }
  .stv-mobile-fig .sv-act-bar .r { display: none; }
  /* 4. 技能、知识库、项目记忆（2+1 紧凑布局，三块同屏可见） */
  .stv-mobile-fig .sv-body:has(> .sv-know) { align-content: start; }
  .stv-mobile-fig .sv-know { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; height: auto; }
  .stv-mobile-fig .sv-know > .sv-kc:nth-child(3) { grid-column: 1 / -1; }
  .stv-mobile-fig .sv-kh { padding: 6px 8px; gap: 6px; }
  .stv-mobile-fig .sv-kh > svg.lucide { width: 12px; height: 12px; padding: 4px; border-radius: 6px; }
  .stv-mobile-fig .sv-kh b { font-size: 11px; }
  .stv-mobile-fig .sv-kh span { display: none; }
  .stv-mobile-fig .sv-it { grid-template-columns: auto minmax(0, 1fr); padding: 4.5px 8px; font-size: 10px; gap: 1px 5px; }
  .stv-mobile-fig .sv-it > svg.lucide { width: 11px; height: 11px; }
  .stv-mobile-fig .sv-it .st-chip { display: none; }
  .stv-mobile-fig .sv-it em { grid-column: 1 / -1; font-size: 9.5px; }
  .stv-mobile-fig .sv-kc:nth-child(1) .sv-it:nth-of-type(n+5),
  .stv-mobile-fig .sv-kc:nth-child(2) .sv-it:nth-of-type(n+5) { display: none; }
  .stv-mobile-fig .sv-note,
  .stv-mobile-fig .sv-prop { display: none; }
  .stv-mobile-fig .sv-mem { padding: 5.5px 8px; gap: 3px; }
  .stv-mobile-fig .sv-mem p { font-size: 10.5px; line-height: 1.4; }
  .stv-mobile-fig .sv-mem span { font-size: 9.5px; gap: 4px; }
  .stv-mobile-fig .sv-mem em { font-size: 9.5px; line-height: 15px; }
  .stv-mobile-fig .sv-mem .st-a { width: 13px; height: 13px; font-size: 7px; }
  .stv-mobile-fig .sv-mem:nth-of-type(n+4) { display: none; }
  /* 5. 工作流程与常驻技能（手机紧凑视图） */
  .stv-mobile-fig .sv-ptabs,
  .stv-mobile-fig .sv-wf-head,
  .stv-mobile-fig .sv-wf-new,
  .stv-mobile-fig .sv-wf-bacts,
  .stv-mobile-fig .sv-wf-bn,
  .stv-mobile-fig .sv-wf-cap,
  .stv-mobile-fig .sv-wf-add,
  .stv-mobile-fig .sv-wf-sh span { display: none; }
  .stv-mobile-fig .sv-wf-tab { height: 22px; padding: 0 7px; font-size: 10px; }
  .stv-mobile-fig .sv-wf-canvas { padding: 7px 8px; }
  .stv-mobile-fig .sv-wf-pane { min-block-size: 0; gap: 6px; }
  .stv-mobile-fig .sv-wf-flow { grid-template-columns: minmax(0, 1fr); gap: 5px; }
  .stv-mobile-fig .sv-wf-gate,
  .stv-mobile-fig .sv-wf-arr { display: none; }
  .stv-mobile-fig .sv-wf-box { padding: 7px 8px; gap: 6px; }
  .stv-mobile-fig .sv-wf-bhd code { display: none; }
  .stv-mobile-fig .sv-wf-steps { flex-wrap: wrap; gap: 4px; }
  .stv-mobile-fig .sv-wf-sa { display: none; }
  .stv-mobile-fig .sv-wf-pill { height: 22px; font-size: 9.5px; padding: 0 7px 0 4px; }
  .stv-mobile-fig .sv-wf-par { flex: 1 1 100%; padding: 5px 7px; }
  .stv-mobile-fig .sv-wf-pn { font-size: 10px; }
  .stv-mobile-fig .sv-wf-dim { height: 17px; font-size: 9px; padding: 0 5px; }
  .stv-mobile-fig .sv-wf-sec { gap: 4px; }
  .stv-mobile-fig .sv-wf-sh b { font-size: 11px; }
  .stv-mobile-fig .sv-wf-stbl th:nth-child(2),
  .stv-mobile-fig .sv-wf-stbl td:nth-child(2),
  .stv-mobile-fig .sv-wf-stbl th:nth-child(4),
  .stv-mobile-fig .sv-wf-stbl td:nth-child(4) { display: none; }
  .stv-mobile-fig .sv-wf-stbl tbody tr:nth-child(n+3) { display: none; }
  .stv-mobile-fig .sv-wf-stbl td { padding: 4px 7px; }
  .stv-mobile-fig .sv-wf-sname { font-size: 9.5px !important; }
  .stv-mobile-fig .sv-wf-sd { font-size: 9.5px !important; }
  /* 6. 全自动质量测试（手机紧凑视图） */
  .stv-mobile-fig .sv-q-head p,
  .stv-mobile-fig .sv-q-ctrl .st-btn,
  .stv-mobile-fig .sv-q-loop { display: none; }
  .stv-mobile-fig .sv-q-head h4 { font-size: 13px; }
  .stv-mobile-fig .sv-q-seg span { height: 22px; padding: 0 6px; font-size: 9.5px; }
  .stv-mobile-fig .sv-q-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
  .stv-mobile-fig .sv-qc { padding: 7px 8px; gap: 4px; }
  .stv-mobile-fig .sv-qch b { font-size: 11px; }
  .stv-mobile-fig .sv-qch small { font-size: 9px; }
  .stv-mobile-fig .sv-qst { font-size: 9px; padding: 1px 4px; }
  .stv-mobile-fig .sv-qval { font-size: 13px; }
  .stv-mobile-fig .sv-qdesc { font-size: 9.5px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
  .stv-mobile-fig .sv-q-foot { padding: 6px 8px; gap: 5px; }
  .stv-mobile-fig .sv-q-foot .st-chip:nth-of-type(n+3) { display: none; }
}
/* /HOME-STUDIO */
`;

// 把 s 里所有 re 的匹配都换成 CSS 片段等固定文本，返回 [新文本, 替换次数]（同 Python 的 re.subn）
function subn(re, rep, s) {
  let n = 0;
  const out = s.replace(re, () => (n++, rep));
  return [out, n];
}
const count = (s, sub) => s.split(sub).length - 1;
// 只换第一处（同 Python 的 str.replace(a, b, 1)）
function replaceOnce(s, a, b) {
  const i = s.indexOf(a);
  return i < 0 ? s : s.slice(0, i) + b + s.slice(i + a.length);
}
const CSS_RE = /\/\* HOME-STUDIO \*\/\n[\s\S]*?\/\* \/HOME-STUDIO \*\/\n/g;

const tpls = FIGS.map(([k, v]) => `<template id="stv-${k}">${v}</template>`).join('');
const p = join(CONTENT, 'pages', 'home.html');
let s = readFileSync(p, 'utf8'), n;
[s, n] = subn(/<!-- STUDIOTPL -->[\s\S]*?<!-- \/STUDIOTPL -->/g, '<!-- STUDIOTPL -->' + tpls + '<!-- /STUDIOTPL -->', s);
if (n !== 1) throw new Error('content/pages/home.html 里没有 <!-- STUDIOTPL --> 标记');
writeFileSync(p, s, 'utf8');
// Studio 页每条特色一节，用同一批图：写成 snips/stvTeam.html 等，正文里用 {{SNIP:stvTeam:1120}} 引用；
// 样式同步到 src/styles/site.css 的 STUDIO-UI 之后（和首页一样，同等优先级的规则才能覆盖它）
const snipdir = join(CONTENT, 'pages', 'snips');
const capitalize = k => k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();
for (const [k, v] of FIGS) writeFileSync(join(snipdir, `stv${capitalize(k)}.html`), v, 'utf8');
const cp = join(STYLES, 'site.css');
let c = readFileSync(cp, 'utf8');
[c, n] = subn(CSS_RE, CSS, c);
if (!n) {
  if (count(c, '/* /STUDIO-UI */\n') !== 1) throw new Error('src/styles/site.css 里 /* /STUDIO-UI */ 标记不是恰好一处');
  c = replaceOnce(c, '/* /STUDIO-UI */\n', '/* /STUDIO-UI */\n' + CSS);
}
writeFileSync(cp, c, 'utf8');
// 长度按字符数算（同 Python 的 len），不是 UTF-16 码元数
console.log('templates', `{${FIGS.map(([k, v]) => `'${k}': ${[...v].length}`).join(', ')}}`);
