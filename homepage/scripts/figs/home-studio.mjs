// 首页 Studio 段：四条核心特色各一张图，左侧点特色、右侧换图。一张图只讲一件事，只画和这件事有关的那部分界面。
//   team      一支持续推进的 Agent 团队：运行环境 + 调度 Agent 的分派记录
//   progress  各项进展一目了然：我的任务（不带左侧菜单）：分组的任务列表 + 一个任务的执行计划和动态
//   decide    有理有据做决策：一个等业务专家验收的任务，附报告、清单、截图和建议
//   memory    方法、经验、知识沉淀在团队里：技能、知识库（人写和上传的资料，Agent 只读）、项目记忆，以及换人接手时自动带上
// 界面字段对照 nocobase-studio 仓库（运行环境、我的任务、技能、知识库、项目记忆的中文文案）。
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

const FIGS = [['team', team], ['progress', progress], ['decide', decide], ['memory', memory]];

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
