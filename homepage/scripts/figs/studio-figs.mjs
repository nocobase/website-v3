// Studio 页（以前也用于首页 Studio 段）的 Studio 界面图，按真实 Studio 截图的样式画（样式见 pages/studio-ui.css）。
// 生成四张图，写进 content/pages/snips/ 和页面里对应的标记之间：
//   studioHero  我的任务（分栏）：首页 Studio 段大图、Studio 页首屏
//   homeFleet   运行环境：首页「接入多路 Agent」
//   homeExpert  业务专家主导的一个任务：首页「不懂代码的业务专家」
//   homeGovern  一次改动要过的每一道关：首页「不是 Vibe Coding」
// 同时把 content/pages/studio-ui.css 同步到 src/styles/site.css 末尾（/* STUDIO-UI */ 标记之间；首页也加载 site.css，首页不再有自己的一份）。
// 目录默认是 homepage/，可用环境变量 NB_HOMEPAGE_DIR 指向别的目录（例如在临时副本里验证输出）。
// 用法（在 homepage 目录下）：node scripts/figs/studio-figs.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENT, STYLES } from '../../src/lib/paths.mjs';

const here = join(CONTENT, 'pages');
const T = (zh, en) => `<t-zh>${zh}</t-zh><t-en>${en}</t-en>`;
const I = (n) => `<i data-lucide="${n}"></i>`;
const AG = { cc: ['CC', 'Claude Code'], cx: ['CX', 'Codex'], oc: ['OC', 'OpenCode'], gm: ['GM', 'Gemini CLI'], pm: [T('调', 'C'), null] };
const ag = (k) => `<span class="st-a ${k}">${AG[k][0]}</span>`;
const who = (k, label = null) => '<span class="who">' + ag(k) + (label || AG[k][1]) + '</span>';
const av = (zh, en) => `<span class="st-av">${T(zh, en)}</span>`;
const si = (k) => `<span class="si ${k}"></span>`;

// ---------- Studio 侧栏（与首页首屏「我的 Agent」的侧栏一致） ----------
function side(active) {
  const it = (k, ic, zh, en, extra = '') => `<a class="it${k === active ? ' on' : ''}">${I(ic)}${T(zh, en)}${extra}</a>`;
  const g = (zh, en) => `<div class="grp">${T(zh, en)}</div>`;
  return (
    '<aside class="sb"><div class="brand"><img src="https://static-docs.nocobase.com/logo-nocobase.png" alt="NocoBase"><span>Studio</span></div>' +
    it('mine', 'circle-user-round', '我的任务', 'My issues', '<em>2</em>') + it('agent', 'messages-square', '我的会话', 'My sessions') + it('dash', 'layout-dashboard', '仪表盘', 'Dashboard') +
    g('开发', 'Build') + it('tasks', 'list-todo', '任务', 'Issues') + it('proj', 'folder-kanban', '项目', 'Projects') + it('kb', 'book-open', '知识库', 'Knowledge') +
    g('质量', 'Quality') + it('plans', 'clipboard-list', '质量报告', 'Quality reports') + it('cases', 'flask-conical', '功能与用例', 'Features &amp; cases') +
    g('发布', 'Release') + it('apps', 'boxes', '应用', 'Apps') + it('envs', 'server', '部署环境', 'Environments') +
    g('Agent 团队', 'Agent Team') + it('agents', 'bot', 'Agent', 'Agents') + it('rt', 'monitor-cog', '运行环境', 'Runtimes') + it('skills', 'sparkles', '技能', 'Skills') +
    '</aside>'
  );
}

function top(zh, en) {
  return (
    '<div class="st-top">' + I('panel-left') + '<i class="sep"></i><b>' + T(zh, en) + '</b><span class="r">' +
    '<span class="st-ib">' + I('messages-square') + '</span><span class="st-ib bd">' + I('inbox') + '</span><span class="st-av">' + T('王', 'L') + '</span></span></div>'
  );
}

// ---------- 我的任务（分栏） ----------
const SPIN = '<span class="st-spin"></span>';
function li(s, zh, en, date, id_, nzh, nen, { on = false, wait = false, run = false } = {}) {
  // Agent 正在做的：蓝色转圈 + 蓝字；等人的：琥珀色
  const note = run ? SPIN + `<span class="run">${T(nzh, nen)}</span>` : `<span class="${wait ? 'w' : ''}">${T(nzh, nen)}</span>`;
  return `<div class="st-li${on ? ' on' : ''}">${si(s)}<b>${T(zh, en)}</b><time>${date}</time><div class="s2"><span class="id">${id_}</span>·${note}</div></div>`;
}
function grp(headIcon, zh, en, n, items, open_ = true) {
  return `<div class="st-card st-grp"><div class="st-gh">${headIcon}${T(zh, en)}<span class="st-cnt">${n}</span>${I(open_ ? 'chevron-down' : 'chevron-right')}</div>${items.join('')}</div>`;
}
function step(s, zh, en, k, small = null, off = false) {
  return `<div class="st-step${off ? ' off' : ''}">${s === 'run' ? SPIN : si(s)}<span>${T(zh, en)}${small ? `<small>${T(...small)}</small>` : ''}</span>${who(k)}</div>`;
}
function le(badge, zh, en, t) {
  return `<div class="st-le">${badge}<div>${T(zh, en)}</div><time>${t}</time></div>`;
}

const tasks =
  '<div class="st-win mtw2">' + side('mine') + '<div class="st-main">' + top('我的任务', 'My issues') + '<div class="st-page">' +
  // 标题、搜索筛选、视图切换和新建按钮放在同一行，省出一行高度
  '<div class="st-flt"><h4 style="margin-right:10px;font-size:19px;line-height:1.3;font-weight:650">' + T('我的任务', 'My issues') + '</h4>' +
  '<span class="q">' + I('search') + T('搜索任务…', 'Search issues…') + '</span><span>' + T('全部项目', 'All projects') + I('chevron-down') + '</span><span>' + T('任意执行者', 'Any executor') + I('chevron-down') + '</span>' +
  '<span class="vw"><i class="on">' + I('columns-2') + '</i><i>' + I('list') + '</i><i>' + I('square-kanban') + '</i><i>' + I('bot') + '</i></span>' +
  '<span class="st-btn p" style="padding:0 11px;color:var(--on-brand)">' + I('plus') + T('新建任务', 'New issue') + '<kbd>C</kbd></span><span class="st-ib bd" style="padding:0;width:30px;height:30px">' + I('ellipsis') + '</span></div>' +
  '<div style="display:grid;grid-template-columns:292px minmax(0,1fr);gap:14px;align-items:start">' +
  '<div class="st-list">' +
  grp('<i data-lucide="hand" class="hand"></i>', '等你处理', 'Needs you', 2, [
    li('review', '客户分级与负责人变更审批', 'Customer tiers &amp; owner-change approval', T('10月20日', 'Oct 20'), 'CRM-135', '等你验收', 'Waiting for your sign-off', { wait: true }),
    li('blocked', '夜间工单自动分派', 'Overnight ticket routing', T('10月20日', 'Oct 20'), 'SUP-88', '等你回答：交给哪个班组？', 'Question: which shift gets them?', { wait: true }),
  ]) +
  grp(si('progress'), '进行中', 'In progress', 14, [
    li('progress', '商机阶段看板', 'Deal stage board', T('10月21日', 'Oct 21'), 'CRM-144', 'Codex 开发中', 'Codex building', { on: true, run: true }),
    li('progress', '退款工单 SLA 提醒', 'Refund ticket SLA alerts', T('10月21日', 'Oct 21'), 'SUP-91', 'Claude Code 测试中', 'Claude Code testing', { run: true }),
    li('progress', '试用期转正提醒', 'Probation review reminders', T('10月20日', 'Oct 20'), 'HR-45', 'Claude Code 评审中', 'Claude Code reviewing', { run: true }),
  ]) +
  grp(si('done'), '已完成', 'Done', 41, [], false) +
  '<div class="st-keys"><span><kbd>J</kbd><kbd>K</kbd>' + T('切换', 'Move') + '</span><span><kbd>S</kbd>' + T('关注', 'Star') + '</span><span><kbd>Enter</kbd>' + T('打开', 'Open') + '</span><span><kbd>/</kbd>' + T('搜索', 'Search') + '</span></div>' +
  '</div>' +
  '<div class="st-card st-det"><div class="st-dh">' + I('chevron-up') + I('chevron-down') + '<span>3 / 16</span><span class="id">CRM-144</span>·<span>NocoCRM</span>' +
  '<span class="r"><span class="st-pill">' + si('progress') + T('进行中', 'In progress') + I('chevron-down') + '</span><span>' + I('star') + T('关注', 'Star') + '</span><span>' + I('messages-square') + T('问 Agent', 'Ask agent') + '</span>' + I('ellipsis') + '</span></div>' +
  '<div class="st-db"><h5>' + T('商机阶段看板', 'Deal stage board') + I('pencil') + '</h5>' +
  '<div class="st-meta"><span><span class="k">' + T('负责人', 'Owner') + '</span>' + av('王', 'L') + T('王磊', 'Leo Walker') + '</span><span><span class="k">' + T('执行者', 'Executor') + '</span>' + ag('pm') + T('调度 Agent', 'Coordinator') + '</span><span><span class="k">' + T('预计', 'ETA') + '</span>' + T('今晚 23:40', 'Tonight 23:40') + '</span></div>' +
  '<div class="st-box"><div class="h">' + I('list-checks') + T('执行计划', 'Plan') + '<span class="r">' + T('第 3 / 5 步 · 2 个 Agent 并行', 'Step 3 of 5 · 2 agents in parallel') + '</span></div>' +
  step('done', '梳理阶段规则与 6 个验收场景', 'Stage rules and 6 acceptance scenarios', 'cc') +
  step('done', '阶段字段与数据迁移', 'Stage field and data migration', 'cx') +
  step('run', '看板拖拽与阶段变更权限', 'Drag-and-drop and stage permissions', 'cx', ['已改 7 个文件', '7 files changed']) +
  step('run', '为 6 个验收场景写测试', 'Tests for the 6 scenarios', 'cc', ['31 / 38 通过', '31 / 38 passing']) +
  step('backlog', '代码评审（换一家模型）', 'Code review by another vendor’s model', 'cc', null, true) +
  '</div>' +
  '<div class="st-chips"><span class="st-chip">' + I('git-pull-request') + 'PR #221</span><span class="st-chip">' + I('git-branch') + T('2 个分支', '2 branches') + '</span><span class="st-chip bl">' + I('rocket') + 'Preview · crm-144</span></div>' +
  '<div class="st-tabs"><span class="on">' + T('动态', 'Activity') + '</span><span>' + T('描述', 'Description') + '</span><span>' + T('子任务 5', 'Subtasks 5') + '</span><span>' + T('代码与部署', 'Code &amp; deploys') + '</span><span>' + T('运行 9', 'Runs 9') + '</span></div>' +
  '<div class="st-log">' +
  le(ag('pm'), '<b>调度 Agent</b> 把第 2、3 步交给 Codex，第 4 步并行交给 Claude Code', '<b>Coordinator</b> gave steps 2–3 to Codex and step 4 to Claude Code in parallel', '18:36') +
  le(ag('cx'), '<b>Codex</b> 正在开发看板拖拽，测试 31 / 38 通过' + SPIN, '<b>Codex</b> is building drag-and-drop; 31 / 38 tests passing' + SPIN, T('现在', 'now')) +
  '</div>' +
  '</div></div>' +
  '</div></div></div></div>';

// ---------- 运行环境 ----------
function rt(icon, nameZh, nameEn, os_, on, slots, tools, team) {
  const st = on ? `<span class="st-tag on">${T('在线', 'Online')} ${slots}</span>` : `<span class="st-tag">${T('离线 · 3 小时前', 'Offline · 3h ago')}</span>`;
  // 工具标签与真实页面一致：灰底，正在跑任务的是绿点，数字是任务数
  const tl = tools
    .map(([k, n]) => `<span class="st-tag${n ? ' nd' : ''}">${n ? SPIN : ''}${AG[k][1]}${n ? ` <b style="display:inline;font-size:11.5px;font-weight:600;color:var(--ink)">${n}</b>` : ''}</span>`)
    .join('');
  const sh = team ? T('团队', 'Team') : T('个人', 'Personal');
  return `<tr><td><b><i data-lucide="${icon}" style="width:13px;height:13px;margin-right:6px;vertical-align:-1px;color:var(--muted)"></i>${T(nameZh, nameEn)}</b><small>${os_} · ${sh}</small></td><td>${st}</td><td><div class="st-tags">${tl}</div></td></tr>`;
}
const fleet =
  '<div class="st-card" style="background:var(--paper);box-shadow:0 1px 2px oklch(0.25 0.05 266 / 0.05),0 12px 28px -14px oklch(0.25 0.06 266 / 0.2);border-color:var(--rule-2);border-radius:12px"><div class="st-page" style="padding:16px 16px 14px">' +
  '<div class="st-ph"><div><h4 style="font-size:19px">' + T('运行环境', 'Runtimes') + '</h4><p>' + T('23:40 · 同事们下班了，9 台运行环境上 24 个任务仍在并行', '23:40 · Your team is offline; 24 issues still running across 9 runtimes') + '</p></div>' +
  '<span class="r"><span class="st-btn p">' + I('plus') + T('添加运行环境', 'Add runtime') + '</span></span></div>' +
  '<div class="st-card"><table class="st-tbl"><thead><tr><th>' + T('名称', 'Name') + '</th><th>' + T('状态', 'Status') + '</th><th>' + T('工具 · 正在做的任务', 'Tools · issues running') + '</th></tr></thead><tbody>' +
  rt('server', 'Server 01', 'Server 01', 'linux · x64', 1, '4/4', [['cx', 2], ['cc', 2]], 1) +
  rt('server', 'Server 02', 'Server 02', 'linux · x64', 1, '4/4', [['cx', 2], ['oc', 1], ['cc', 1]], 1) +
  rt('server', 'Server 03', 'Server 03', 'linux · x64', 1, '4/4', [['cx', 2], ['cc', 1], ['gm', 1]], 1) +
  rt('server', 'Server 04', 'Server 04', 'linux · arm64', 1, '3/4', [['cc', 1], ['cx', 1], ['oc', 1]], 1) +
  rt('laptop', '王磊的 Mac', 'Leo’s Mac', 'darwin · arm64', 1, '2/2', [['cc', 1], ['cx', 1]], 0) +
  rt('laptop', '陈思的 MacBook', 'Ava’s MacBook', 'darwin · arm64', 1, '1/2', [['cc', 1], ['cx', 0]], 0) +
  rt('laptop', '林悦的工作站', 'Maya’s workstation', 'linux · x64', 0, '', [['cc', 0]], 0) +
  '</tbody></table><div class="st-more">' + I('chevron-right') + T('另有 2 台运行环境 · 6 个任务在跑', '2 more runtimes · 6 issues running') + '</div></div>' +
  '</div></div>';

// ---------- 业务专家主导的一个任务 ----------
function dec(zhK, enK, zh, en, ans) {
  return `<div class="st-dec">${si('done')}<span class="k">${T(zhK, enK)}</span><b>${T(zh, en)}</b>${ans}</div>`;
}
const expert =
  '<div class="st-card st-det" style="box-shadow:0 1px 2px oklch(0.25 0.05 266 / 0.05),0 12px 28px -14px oklch(0.25 0.06 266 / 0.2);border-color:var(--rule-2);border-radius:12px">' +
  '<div class="st-dh"><span class="id">CRM-162</span>·<span>NocoCRM</span><span class="r"><span class="st-pill">' + si('done') + T('已上线', 'Live') + I('chevron-down') + '</span></span></div>' +
  '<div class="st-db"><h5>' + T('供应商分级', 'Supplier tiering') + '</h5>' +
  '<div class="st-meta"><span><span class="k">' + T('负责人', 'Owner') + '</span>' + av('周', 'E') + T('周航 · 采购主管', 'Ethan Cole · Procurement lead') + '</span><span class="k">' + T('全程没看过一行代码', 'Never read a line of code') + '</span></div>' +
  '<div class="st-box"><div class="h">' + I('user-check') + T('他做的决定', 'His decisions') + '<span class="r">' + T('3 次，共约 10 分钟', '3 calls, about 10 minutes') + '</span></div>' +
  dec('回答提问', 'Question', '质量和交期，哪个更重要？', 'Quality or delivery: which matters more?', '<span class="st-chip bl">' + I('check') + T('质量优先', 'Quality first') + '</span>') +
  dec('预览验收', 'Preview', '用真实供应商核对分级结果', 'Checked tiers against real suppliers', '<span class="st-chip bl">' + I('check') + T('验收通过', 'Approved') + '</span>') +
  dec('确认上线', 'Release', '定在周五下班后上线', 'Ship Friday after hours', '<span class="st-chip">' + I('clock') + T('周五 19:00', 'Fri 19:00') + '</span>') +
  '</div>' +
  '<div class="st-box"><div class="h">' + I('list-checks') + T('交付报告 · Agent 完成', 'Delivery report · done by agents') + '</div>' +
  '<div class="st-chips">' +
  [
    ['git-branch', '代码与分支', 'Code &amp; branches'],
    ['flask-conical', '46 项测试通过', '46 tests passing'],
    ['shield-check', '换模型评审通过', 'Reviewed by another model'],
    ['rocket', '批准后发布', 'Approved &amp; deployed'],
  ]
    .map(([ic, zh, en]) => `<span class="st-chip">${I(ic)}${T(zh, en)}</span>`)
    .join('') +
  '</div>' +
  '<div class="st-foot" style="display:flex;align-items:center;gap:6px">' + ag('cx') + 'Codex · GPT-5.5 · ' + ag('cc') + 'Claude Code · Opus 5.5 · ' + T('10月17日 19:02', 'Oct 17, 19:02') + '</div></div>' +
  '</div></div>';

// ---------- 一次改动要过的每一道关 ----------
function stg(n, zh, en, whohtml, chip, dzh, den, gateIc, gzh, gen) {
  return `<div class="st-card st-stg"><div class="t"><span class="bal">${n}</span>${T(zh, en)}${si('done')}</div><div class="who">${whohtml}</div><div>${chip}</div><p>${T(dzh, den)}</p><div class="gate">${I(gateIc)}${T(gzh, gen)}</div></div>`;
}
const sk = (s) => `<span class="st-chip mono">${s}</span>`;
const bs = (ic, zh, en) => `<span class="st-chip">${I(ic)}${T(zh, en)}</span>`;
const agw = (k, m) => ag(k) + `<span>${m}</span>`; // 标识已说明是哪个编码工具，这里只写模型
const govern =
  '<div class="st-card" style="background:var(--card);box-shadow:0 1px 2px oklch(0.25 0.05 266 / 0.05),0 12px 28px -14px oklch(0.25 0.06 266 / 0.2);border-color:var(--rule-2);border-radius:12px">' +
  '<div class="st-dh"><span class="id">CRM-152</span>·<span>NocoCRM</span><span class="r"><span class="st-pill">' + si('done') + T('已上线 · v1.8.0', 'Live · v1.8.0') + '</span></span></div>' +
  '<div class="st-db" style="gap:14px;padding:14px 16px 16px"><div><h5>' + T('客户导入去重', 'Dedupe customer imports') + '</h5><p style="margin-top:2px;font-size:12.5px;color:var(--muted)">' + T('一次改动从方案到上线，要过的每一道关', 'Every gate one change passes on its way to production') + '</p></div>' +
  '<div class="st-flow">' +
  stg(1, '方案', 'Plan', agw('cc', 'Opus 5.5'), sk('studio-approach'), '梳理 3 条规则与 6 个验收场景', '3 rules and 6 acceptance scenarios', 'user-check', '新增字段由王磊确认', 'Leo confirmed the new field') +
  stg(2, '开发', 'Build', agw('cx', 'GPT-5.5'), sk('studio-development'), '写业务逻辑，权限与工作流复用 Core', 'Business logic on Core permissions and workflows', 'shield-check', '构建与类型检查通过', 'Build and type checks passed') +
  stg(3, '评审', 'Review', agw('cc', 'Opus 5.5'), sk('studio-review'), '按评审规范查缺陷、安全与测试', 'Defects, security, and tests, per the review skill', 'shield-check', '评审意见全部关闭', 'All comments resolved') +
  stg(4, '测试', 'Test', agw('cc', 'Sonnet 5.5'), bs('flask-conical', 'Studio 测试模块', 'Studio tests'), '按 6 个验收场景写测试，在 CI 中运行', 'Tests for 6 scenarios, run in CI', 'shield-check', '46 / 46 通过才交给人验收', '46 / 46 passing before sign-off') +
  stg(5, '验收', 'Accept', av('陈', 'A') + T('陈思', 'Ava Clarke'), bs('eye', 'crm-import.preview', 'crm-import.preview'), '在独立预览环境走查 6 个场景', 'Walked through 6 scenarios in preview', 'user-check', '陈思验收通过', 'Ava signed off') +
  stg(6, '发布', 'Ship', av('王', 'L') + T('王磊', 'Leo Walker'), bs('rocket', '部署申请 · 生产', 'Deploy request · production'), '生产发布需人批准，可回滚到上一版本', 'Production needs approval; roll back to the last release', 'user-check', '王磊批准上线', 'Leo approved release') +
  '</div>' +
  '<div class="st-band">' + I('git-branch') + sk('studio-workflow') + '<span>' + T('串起整条流程：每个任务独立分支、独立预览，按顺序过关，不能跳步', 'Ties it together: own branch and preview per issue, gates in order, no skipping') + '</span><span class="r">' + I('history') + T('谁做的、用哪个模型、谁批准的，全部留痕', 'Who did it, which model, who approved: all on record') + '</span></div>' +
  '</div></div>';

const FIGS = { studioHero: tasks, homeFleet: fleet, homeExpert: expert, homeGovern: govern };
for (const [k, v] of Object.entries(FIGS)) {
  writeFileSync(join(here, 'snips', k + '.html'), v, 'utf8');
}

const css = readFileSync(join(here, 'studio-ui.css'), 'utf8');
function putCss(s) {
  const block = '/* STUDIO-UI */\n' + css + '/* /STUDIO-UI */\n';
  let n = 0;
  // 用函数做替换值，避免 block 里的 $ 被当成替换模式
  const s2 = s.replace(/\/\* STUDIO-UI \*\/\n[\s\S]*?\/\* \/STUDIO-UI \*\/\n/g, () => (n++, block));
  return n ? s2 : null;
}

// 首页：Studio 段改为四条特色各一张图（scripts/figs/home-studio.mjs），这几张图已不在首页；这里只填页面上还有标记的图
let p = join(CONTENT, 'pages', 'home.html');
let s = readFileSync(p, 'utf8');
for (const [k, v] of Object.entries(FIGS)) {
  s = s.replace(new RegExp(`<!-- SNIP:${k} -->[\\s\\S]*?<!-- /SNIP:${k} -->`, 'g'), () => `<!-- SNIP:${k} -->${v}<!-- /SNIP:${k} -->`);
}
writeFileSync(p, s, 'utf8');

// 共用样式（首页也加载）
p = join(STYLES, 'site.css');
s = readFileSync(p, 'utf8');
const x = putCss(s);
s = x ? x : s.replace(/\n+$/, '') + '\n\n/* STUDIO-UI */\n' + css + '/* /STUDIO-UI */\n';
writeFileSync(p, s, 'utf8');

// Studio 页首屏由正文里的 {{SNIP:studioHero:1120}} 引用，改图后运行 pnpm build 重新生成页面
// 长度按码点计，与 Python 的 len() 一致
console.log('ok {' + Object.entries(FIGS).map(([k, v]) => `'${k}': ${[...v].length}`).join(', ') + '}');
