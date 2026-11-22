// 首页 Core 段：四条核心特色各一张图，左侧点/滑特色、右侧换图（880 宽，与 Studio 段统一窗口比例与克制配色）。
//   blocks  20 多项现成、可靠的基础能力：对照 Core 系统设置界面（左侧能力导航 + 文件存储读写自检与企业 SSO）
//   arch    架构统一，长期稳定迭代：新建应用目录（Core 提供 vs Agent 编写）与随底座发布的开发技能
//   ai      业务系统自带 AI 能力：业务 Agent 调度、AI 知识库与关键操作由人确认
//   ops     开源、持续维护，业务系统独立运行：应用底座状态、定时任务与代码配置来源、独立运行与命令行升级
// 写进 content/pages/home.html 的 <!-- CORETPL --> 标记之间（<template id="crv-…">），样式写在 src/styles/site.css 的 /* HOME-CORE */ 标记之间；
// 同一批图也写成 content/pages/snips/crv*.html。
// 用法（在 homepage 目录下）：node scripts/figs/home-core.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENT, STYLES } from '../../src/lib/paths.mjs';

const T = (zh, en) => `<t-zh>${zh}</t-zh><t-en>${en}</t-en>`;
const I = n => `<i data-lucide="${n}"></i>`;

function win(crumbs, body, right = '', attrs = '') {
  const cr = typeof crumbs === 'string'
    ? crumbs
    : crumbs.map((c, i) => (i === crumbs.length - 1 ? `<b>${T(...c)}</b>` : `<span>${T(...c)}</span>` + I('chevron-right'))).join('');
  return `<div class="sv-win"${attrs}><div class="sv-top"><span class="sv-brand"><img src="https://static-docs.nocobase.com/logo-nocobase.png" alt="NocoBase"><span>Core</span></span>` +
    `<i class="sep"></i>${cr}<span class="r">${right}<span class="st-av">${T('管', 'A')}</span></span></div><div class="sv-body cr-body">${body}</div></div>`;
}

// 左侧精简系统设置菜单：直观呈现 Core 现成内置的能力分组；live=true 时高亮的 3 项可点击并在它们之间轮播
function coreNav(active, live = false) {
  const LIVE = new Set(['wf', 'roles', 'files']);
  const item = (k, ic, zh, en) => {
    const on = k === active;
    if (live && LIVE.has(k)) {
      return `<button type="button" class="cr-ni cr-ni-btn${on ? ' on' : ''}" data-cr-tab="${k}" aria-pressed="${on}">${I(ic)}<span>${T(zh, en)}</span><i class="cr-dot"></i></button>`;
    }
    return `<span class="cr-ni${on ? ' on' : ''}">${I(ic)}${T(zh, en)}</span>`;
  };
  const grp = (zh, en) => `<small class="cr-ng">${T(zh, en)}</small>`;
  return '<aside class="cr-nav">' +
    grp('账号与权限', 'Accounts & access') +
    item('users', 'users', '用户', 'Users') +
    item('roles', 'shield-check', '角色与权限', 'Roles & permissions') +
    item('auth', 'key-round', '登录与认证', 'Sign-in & SSO') +
    grp('流程与自动化', 'Workflows') +
    item('wf', 'workflow', '流程管理', 'Workflows') +
    item('sched', 'clock', '定时任务', 'Schedules') +
    grp('消息与 AI', 'Messages & AI') +
    item('notify', 'bell', '通知', 'Notifications') +
    item('ai', 'bot', '业务 Agent', 'Business agents') +
    item('kb', 'book-open', '知识库索引', 'Knowledge index') +
    grp('数据与系统', 'Data & system') +
    item('db', 'database', '数据库', 'Database') +
    item('files', 'folder-open', '文件存储', 'File storage') +
    item('sys', 'layers', '应用底座', 'Core runtime') +
  '</aside>';
}

// ---------- 1. 20 多项现成、可靠的基础能力（流程管理流程图 / 角色权限矩阵 / 文件存储与 SSO 动态切换） ----------
function mtxRow(zh, en, c1, c2, c3, c4, szh, sen) {
  const cell = (v, accent) => v
    ? `<td class="c"><i class="cr-ok${accent ? ' br' : ''}">✓</i></td>`
    : '<td class="c"><i class="cr-no">—</i></td>';
  return `<tr><td><b>${T(zh, en)}</b></td>${cell(c1)}${cell(c2)}${cell(c3)}${cell(c4, true)}<td><span class="cr-scope">${T(szh, sen)}</span></td></tr>`;
}

const viewWf =
  '<div class="cr-view on" data-cr-view="wf" aria-hidden="false">' +
    '<div class="st-ph"><div><h4>' + T('合同审批流', 'Contract approval flow') + '</h4></div>' +
      '<span class="r"><span class="st-tag on">' + T('运行中', 'Active') + '</span></span></div>' +
    '<div class="st-card cr-wf-canvas">' +
      '<div class="cr-wf-node cr-wf-n1"><span class="cr-wf-ic">' + I('zap') + '</span><b>' + T('合同提交', 'Contract submitted') + '</b></div>' +
      '<div class="cr-wf-line"></div>' +
      '<div class="cr-wf-cond cr-wf-n2"><span class="cr-wf-ic">' + I('git-branch') + '</span><b>' + T('金额 ≥ 50 万？', 'Amount ≥ $500k?') + '</b></div>' +
      '<div class="cr-wf-fork"><em>' + T('是', 'Yes') + '</em><em>' + T('否', 'No') + '</em></div>' +
      '<div class="cr-wf-split">' +
        '<div class="cr-wf-node cr-wf-n3"><span class="cr-wf-ic br">' + I('user-check') + '</span><b>' + T('销售总监审批', 'Director approval') + '</b></div>' +
        '<div class="cr-wf-node"><span class="cr-wf-ic">' + I('bot') + '</span><b>' + T('自动核对通过', 'Auto-approved') + '</b></div>' +
      '</div>' +
      '<div class="cr-wf-merge"></div>' +
      '<div class="cr-wf-node cr-wf-n4"><span class="cr-wf-ic">' + I('bell') + '</span><b>' + T('归档并通知财务', 'Archive &amp; notify finance') + '</b></div>' +
    '</div>' +
  '</div>';

const viewRoles =
  '<div class="cr-view" data-cr-view="roles" aria-hidden="true">' +
    '<div class="st-ph"><div><h4>' + T('角色与权限矩阵', 'Roles &amp; permission matrix') + '</h4><p>' + T('页面、按钮、接口与行级数据范围统一授权，人与业务 Agent 共用同一套权限。', 'Pages, actions, APIs, and row-level scopes under one model shared by people and agents.') + '</p></div>' +
      '<span class="r"><span class="cr-src">RBAC + Scope</span></span></div>' +
    '<div class="cr-rtabs"><span class="on">' + T('销售经理', 'Sales manager') + '</span><span>' + T('销售代表', 'Sales rep') + '</span><span>' + T('财务审批', 'Finance') + '</span><span>' + T('销售 Agent', 'Sales agent') + '</span></div>' +
    '<div class="st-card"><table class="st-tbl cr-mtx"><thead><tr><th>' + T('业务模块', 'Module') + '</th><th class="c">' + T('查看', 'Read') + '</th><th class="c">' + T('新建', 'Create') + '</th><th class="c">' + T('编辑', 'Edit') + '</th><th class="c">' + T('审批', 'Approve') + '</th><th>' + T('数据范围', 'Data scope') + '</th></tr></thead><tbody>' +
      mtxRow('客户档案', 'Customers', 1, 1, 1, 0, '本部门及下属', 'Dept & sub-depts') +
      mtxRow('商机与报价', 'Deals & quotes', 1, 1, 1, 1, '本部门及下属', 'Dept & sub-depts') +
      mtxRow('合同审批', 'Contracts', 1, 1, 0, 1, '金额 ≤ 200 万', 'Amount ≤ $2M') +
      mtxRow('财务回款', 'Billing', 1, 0, 0, 0, '仅本人负责客户', 'Own accounts only') +
      mtxRow('销售 Agent', 'Sales agents', 1, 1, 0, 0, '继承发起人范围', 'Inherits caller scope') +
    '</tbody></table></div>' +
    '<div class="cr-footbar"><span>' + I('shield-check') + T('前端界面隐藏与后端接口鉴权同步生效，权限不漂移', 'UI visibility and server-side checks enforced from the same rules') + '</span><em>' + T('统一校验', 'Enforced') + '</em></div>' +
  '</div>';

const viewFiles =
  '<div class="cr-view" data-cr-view="files" aria-hidden="true">' +
    '<div class="st-ph"><div><h4>' + T('文件存储', 'File storage') + '</h4><p>' + T('查看生效的存储配置、读写连通状态，以及各业务模块的下载权限。', 'Effective storage settings, read/write checks, and per-feature access rules.') + '</p></div>' +
      '<span class="r"><span class="st-btn">' + I('refresh-cw') + T('重新检查', 'Check again') + '</span></span></div>' +
    '<div class="st-card"><table class="st-tbl"><thead><tr><th>' + T('名称', 'Name') + '</th><th>' + T('类型与位置', 'Location') + '</th><th>' + T('访问控制', 'Visibility') + '</th><th>' + T('使用模块', 'Features') + '</th><th>' + T('状态', 'Status') + '</th></tr></thead><tbody>' +
      '<tr><td><b>local</b> <span class="cr-src">' + T('默认', 'Default') + '</span></td><td>' + T('本地磁盘 · storage/', 'Local disk · storage/') + '</td><td>' + T('私有', 'Private') + '</td><td>' + T('6 个模块', '6 features') + '</td><td><span class="st-tag on">' + T('读写正常', 'Read &amp; write OK') + '</span></td></tr>' +
      '<tr><td><b>s3</b></td><td>' + T('S3 兼容存储', 'S3-compatible') + '</td><td>' + T('私有', 'Private') + '</td><td>' + T('0 个模块', '0 features') + '</td><td><span class="st-tag">' + T('待配置 Bucket', 'Bucket not set') + '</span></td></tr>' +
    '</tbody></table></div>' +
    '<div class="cr-cols2">' +
      '<div class="st-card cr-pane"><div class="sv-ch"><b>' + T('连通性检查', 'Storage check') + '</b><span>' + T('2 分钟前', '2 min ago') + '</span></div>' +
        '<div class="cr-list">' +
          '<div>' + I('circle-check') + '<span>' + T('写入临时文件', 'Write temporary file') + '</span><em class="mono">nocobase-check/</em></div>' +
          '<div>' + I('circle-check') + '<span>' + T('读回并比对内容', 'Read back &amp; verify') + '</span><em class="mono">' + T('12 字节一致', '12 bytes match') + '</em></div>' +
          '<div>' + I('circle-check') + '<span>' + T('生成流式下载链接', 'Create download stream') + '</span><em>' + T('经权限校验', 'Auth checked') + '</em></div>' +
          '<div>' + I('circle-check') + '<span>' + T('清理临时文件', 'Delete temporary file') + '</span><em>' + T('不碰业务数据', 'Business files untouched') + '</em></div>' +
        '</div></div>' +
      '<div class="st-card cr-pane"><div class="sv-ch"><b>' + T('企业 SSO 与权限', 'Enterprise SSO &amp; access') + '</b><span>' + T('安全默认', 'Secure defaults') + '</span></div>' +
        '<div class="cr-sso">' +
          '<div class="cr-chips"><span class="on">' + T('飞书', 'Feishu') + '</span><span>' + T('钉钉', 'DingTalk') + '</span><span>' + T('企业微信', 'WeCom') + '</span><span>Okta</span><span>Entra ID</span><span>OIDC</span></div>' +
          '<p>' + T('自动生成回调地址与配置代码，密钥只放环境变量、不录入后台；按身份标识匹配账号，人与 Agent 共用同一套权限。', 'Generates callback URLs and config code; secrets stay in env vars, never in the UI. People and agents share one permission model.') + '</p>' +
        '</div></div>' +
    '</div>' +
  '</div>';

const blocksCrumb =
  '<span>' + T('系统设置', 'System settings') + '</span>' + I('chevron-right') +
  '<b class="cr-crumb" data-cr-crumb="wf">' + T('流程管理', 'Workflows') + '</b>' +
  '<b class="cr-crumb" data-cr-crumb="roles" hidden>' + T('角色与权限', 'Roles &amp; permissions') + '</b>' +
  '<b class="cr-crumb" data-cr-crumb="files" hidden>' + T('文件存储', 'File storage') + '</b>';

const blocks = win(blocksCrumb,
  '<div class="cr-shell">' +
    coreNav('wf', true) +
    '<div class="cr-main">' +
      '<div class="cr-msw" role="group">' +
        '<button type="button" class="on" data-cr-tab="wf" aria-pressed="true">' + T('流程管理', 'Workflows') + '</button>' +
        '<button type="button" data-cr-tab="roles" aria-pressed="false">' + T('角色权限', 'Roles') + '</button>' +
        '<button type="button" data-cr-tab="files" aria-pressed="false">' + T('文件存储', 'Storage') + '</button>' +
      '</div>' +
      '<div class="cr-views">' + viewWf + viewRoles + viewFiles + '</div>' +
    '</div>' +
  '</div>', '', ' data-live="core-blocks" data-tab="wf"');

// ---------- 2. 架构统一，长期稳定迭代 ----------
function rpRow(depth, icon, name, zh, en, who = null) {
  const tag = who === 'core'
    ? `<em class="cr-who">${T('Core 提供', 'From Core')}</em>`
    : who === 'biz'
      ? `<em class="cr-who biz">${T('Agent 编写', 'By agents')}</em>`
      : '';
  return `<div class="cr-rprow d${depth}">${I(icon)}<code class="mono">${name}</code><span>${T(zh, en)}</span>${tag}</div>`;
}
const arch = win([['项目结构', 'Project structure'], ['crm-app', 'crm-app']],
  '<div class="cr-arch">' +
    '<div class="st-card cr-pane"><div class="sv-ch">' + I('folder-git-2') + '<b>crm-app</b><span>' + T('新建应用的统一目录', 'Standard app layout') + '</span></div>' +
      '<div class="cr-tree">' +
        rpRow(0, 'file-text', 'AGENTS.md', '架构规范：业务代码放哪、哪些不能改', 'Rules: where business code goes', 'core') +
        rpRow(0, 'folder', '.agents/skills/', '开发技能，随底座发布并同步', 'Dev skills shipped with Core', 'core') +
        rpRow(1, 'sparkles', 'nocobase-app-development', '页面、接口、数据、迁移、测试', 'Pages, APIs, data, tests') +
        rpRow(1, 'sparkles', 'plugin-authorization', '权限与数据范围', 'Permissions &amp; scopes') +
        rpRow(1, 'sparkles', 'plugin-workflow', '流程、审批与定时任务', 'Workflows &amp; schedules') +
        rpRow(0, 'folder', 'client/', '业务页面与交互', 'Business pages &amp; UI', 'biz') +
        rpRow(0, 'folder', 'server/', '业务接口与服务', 'Business APIs &amp; services', 'biz') +
        rpRow(0, 'folder', 'database/main/', '表结构迁移与初始数据', 'Migrations &amp; seed data', 'biz') +
        rpRow(0, 'folder', 'tests/', '自动化测试', 'Automated tests', 'biz') +
        rpRow(0, 'package', 'package.json', '以 @nocobase/* 引入底层能力', 'Core packages as @nocobase/*', 'core') +
      '</div></div>' +
    '<div class="st-card cr-pane"><div class="sv-ch">' + I('sparkles') + '<b>nocobase-app-development</b><span>SKILL.md</span></div>' +
      '<div class="cr-skill-body">' +
        '<p class="cr-sub">' + T('不同的人、模型和会话，开工前先读同一份规范和技能。', 'Every developer, model, and session reads the same rules and skills first.') + '</p>' +
        '<table class="st-tbl cr-sktbl"><thead><tr><th>' + T('开发任务', 'Task') + '</th><th>' + T('对应参考', 'Reference') + '</th></tr></thead><tbody>' +
          '<tr><td>' + T('页面、路由与界面文字', 'Pages, routes &amp; UI') + '</td><td class="mono">ui-workflow.md</td></tr>' +
          '<tr><td>' + T('新增服务端接口', 'Add a server endpoint') + '</td><td class="mono">server-routes.md</td></tr>' +
          '<tr><td>' + T('读写数据与表结构迁移', 'Data &amp; schema migrations') + '</td><td class="mono">migrations.md</td></tr>' +
          '<tr><td>' + T('测试与验收验证', 'Testing &amp; verification') + '</td><td class="mono">testing.md</td></tr>' +
        '</tbody></table>' +
        '<div class="cr-rules">' +
          '<div>' + I('check') + '<span>' + T('权限、通知、登录、文件直接复用底座能力，不由 AI 从零重写', 'Reuse Core for auth, permissions, files, and alerts—never rewrite from scratch') + '</span></div>' +
          '<div>' + I('check') + '<span>' + T('每个新增接口统一经过底座的身份验证与权限检查', 'Every new endpoint runs through Core auth and permission checks') + '</span></div>' +
        '</div>' +
      '</div></div>' +
  '</div>');

// ---------- 3. 业务系统自带 AI 能力（AI 员工嵌入真实业务页面与业务流程，克制单色） ----------
const VERA_FACE =
  '<svg viewBox="0 0 36 36" aria-hidden="true">' +
    '<circle cx="18" cy="18" r="18" fill="currentColor" opacity="0.1"/>' +
    '<path d="M9.5 31c1.2-5 4.4-7.5 8.5-7.5s7.3 2.5 8.5 7.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    '<circle cx="18" cy="14.5" r="5.2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="M12.6 13.8c.5-3.6 2.8-5.6 5.4-5.6s4.9 2 5.4 5.6c-1.8-.9-3.7-1.2-5.4-1.2s-3.6.3-5.4 1.2Z" fill="currentColor" opacity="0.18"/>' +
    '<circle cx="16.2" cy="14.8" r="0.8" fill="currentColor"/><circle cx="19.8" cy="14.8" r="0.8" fill="currentColor"/>' +
    '<path d="M16.5 17c.9.7 2.1.7 3 0" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>' +
  '</svg>';

function supRow(zh, en, m_zh, m_en, grade, st_zh, st_en, warn = false) {
  return `<tr class="${warn ? 'cr-sup-w' : ''}"><td><b>${T(zh, en)}</b><small>${T(m_zh, m_en)}</small></td><td><span class="cr-grd${warn ? ' w' : ''}">${grade}</span></td><td><span class="st-tag${warn ? '' : ' on'}">${T(st_zh, st_en)}</span></td></tr>`;
}

const ai = win([['采购管理', 'Procurement'], ['供应商季度考核', 'Quarterly supplier review']],
  '<div class="cr-ai-biz">' +
    '<div class="cr-biz-main">' +
      '<div class="st-card cr-pane">' +
        '<div class="sv-ch">' + I('building-2') + '<b>' + T('Q3 供应商考核台账', 'Q3 supplier scorecard') + '</b><span>' + T('126 家 · 2 家异常', '126 total · 2 flagged') + '</span></div>' +
        '<table class="st-tbl cr-suptbl"><thead><tr><th>' + T('供应商', 'Supplier') + '</th><th>' + T('评级', 'Grade') + '</th><th>' + T('流程状态', 'Status') + '</th></tr></thead><tbody>' +
          supRow('华东精密制造', 'East Precision Mfg', '合格率 99.4% · 零延期', '99.4% QA · 0 delays', 'A', '自动续签', 'Auto-renew') +
          supRow('星河电子科技', 'StarRiver Tech', '合格率 98.1% · 零延期', '98.1% QA · 0 delays', 'A', '自动续签', 'Auto-renew') +
          supRow('宏达塑胶工业', 'Hongda Plastics', '合格率 91.2% · 延期 4 次', '91.2% QA · 4 delays', 'D', '待确认暂停', 'Hold pending', true) +
          supRow('联创包装材料', 'Lianchuang Pack', '合格率 92.8% · 延期 2 次', '92.8% QA · 2 delays', 'D', '待确认暂停', 'Hold pending', true) +
        '</tbody></table>' +
      '</div>' +
      '<div class="st-card cr-flowbar">' +
        '<div class="cr-fb-hd">' + I('workflow') + '<b>' + T('当前业务流程', 'Active workflow') + '</b><span>' + T('季度自动触发', 'Quarterly auto-run') + '</span></div>' +
        '<div class="cr-fb-steps">' +
          '<span class="done">' + I('circle-check') + T('汇总质检与交期', 'Collect QA data') + '</span>' +
          '<i>→</i>' +
          '<span class="cur"><b class="cr-fdot"></b>' + T('AI 员工 Vera 评估起草', 'Vera scores &amp; drafts') + '</span>' +
          '<i>→</i>' +
          '<span>' + T('经理确认', 'Manager OK') + '</span>' +
          '<i>→</i>' +
          '<span>' + T('总监审批', 'Director') + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<aside class="st-card cr-vera">' +
      '<div class="cr-vera-hd">' +
        '<span class="cr-face">' + VERA_FACE + '</span>' +
        '<div><b>Vera <em>' + T('采购 AI 员工', 'Procurement AI') + '</em></b><span>' + T('已读取当前页 126 条记录', 'Reading 126 records on page') + '</span></div>' +
      '</div>' +
      '<div class="cr-vera-body">' +
        '<div class="cr-vera-pill">' + I('sparkles') + T('步骤 ② · 等待你确认后流转下一步', 'Step 2 · Ready to advance on approval') + '</div>' +
        '<p class="cr-vera-msg">' + T('已对照《供应商考核办法》完成本季度评分。<b>宏达塑胶、联创包装</b>连续两季评为 D 级，我已起草暂停新订单审批并附上 6 份质检记录。',
          'Scored all Q3 suppliers against your policy. <b>Hongda</b> and <b>Lianchuang</b> hit Grade D twice—I drafted hold requests with 6 QA logs attached.') + '</p>' +
        '<div class="cr-vera-chk">' +
          '<div>' + I('circle-check') + T('核算 126 家合格率与交期', 'Calculated 126 QA &amp; delivery scores') + '</div>' +
          '<div>' + I('circle-check') + T('生成 2 份暂停新订单审批单', 'Drafted 2 order-hold approvals') + '</div>' +
          '<div>' + I('book-open') + T('引用知识库《供应商考核办法》v4', 'Cited Supplier Policy v4 from KB') + '</div>' +
        '</div>' +
        '<div class="cr-vera-acts"><span class="st-btn p">' + I('check') + T('确认并流转审批', 'Confirm &amp; route') + '</span><span class="st-btn">' + T('查看明细', 'Details') + '</span></div>' +
      '</div>' +
      '<div class="cr-vera-ft">' + I('cpu') + T('模型自选（含本地） · 权限与当前账号一致', 'BYO / local models · same user permissions') + '</div>' +
    '</aside>' +
  '</div>');

// ---------- 4. 开源、持续维护，业务系统独立运行（一眼看懂的三方关系图：开源持续升级 + Studio 运行解耦 + 业务系统独立运行） ----------
const ops = win([['架构与部署', 'Architecture & runtime'], ['开源、持续维护与独立运行', 'Open source & standalone']],
  '<div class="cr-arch-ops">' +
    '<div class="cr-ops-left">' +
      '<div class="st-card cr-ops-src">' +
        '<div class="cr-ops-hd">' + I('code-xml') + '<b>NocoBase Core</b><span class="cr-rtag on">' + T('开源可审查', 'Open Source') + '</span></div>' +
        '<p class="cr-ops-sub">' + T('GitHub 持续维护，安全修复与新能力随版本升级', 'Maintained on GitHub with ongoing fixes &amp; upgrades') + '</p>' +
        '<div class="cr-ops-ver"><code class="mono">v3.1</code><span class="cr-tarr">→</span><code class="mono on">v3.2</code><span class="cr-ops-cmd mono">nocobase upgrade</span></div>' +
      '</div>' +
      '<div class="st-card cr-ops-studio">' +
        '<div class="cr-ops-hd">' + I('git-branch') + '<b>NocoBase Studio</b><span class="cr-rtag">' + T('仅开发期', 'Dev only') + '</span></div>' +
        '<p class="cr-ops-sub">' + T('只在开发与发版时使用，不参与生产运行', 'Used only to build and ship—never in production traffic') + '</p>' +
      '</div>' +
    '</div>' +
    '<div class="cr-ops-links" aria-hidden="true">' +
      '<div class="cr-ops-arr on"><span>' + T('平滑升级底座', 'Upgrades Core') + '</span><i>→</i></div>' +
      '<div class="cr-ops-arr off"><span>' + T('运行无依赖', 'Decoupled') + '</span><i>✕</i></div>' +
    '</div>' +
    '<div class="st-card cr-ops-app">' +
      '<div class="cr-ops-hd">' + I('server') + '<b>' + T('你的业务系统', 'Your business app') + '</b><span class="st-tag on">' + T('独立运行', 'Standalone') + '</span></div>' +
      '<div class="cr-ops-layers">' +
        '<div class="cr-ops-layer cr-ly-biz">' + I('folder-git-2') + '<div><b>' + T('业务源码归你所有', 'Your business source') + '</b><span>' + T('存在企业 Git 仓库 · 标准代码无锁定', 'In your Git repo · standard code, no lock-in') + '</span></div></div>' +
        '<div class="cr-ops-layer cr-ly-core">' + I('layers') + '<div><b>' + T('NocoBase Core 底座', 'NocoBase Core layer') + '</b><span>' + T('随版本升级，不动业务代码', 'Upgrades cleanly without touching app code') + '</span></div></div>' +
        '<div class="cr-ops-layer cr-ly-db">' + I('database') + '<div><b>' + T('企业自有服务器与数据库', 'Your servers &amp; database') + '</b><span>' + T('纯内网 · PostgreSQL / MySQL / Oracle / 国产库', 'Air-gapped · PostgreSQL, MySQL, Oracle &amp; more') + '</span></div></div>' +
      '</div>' +
      '<div class="cr-ops-live"><i class="cr-ldot"></i><span>' + T('日常业务请求直接访问应用，完全不经过工作台', 'Live traffic hits your app directly—never through Studio') + '</span></div>' +
    '</div>' +
  '</div>');

const FIGS = [['blocks', blocks], ['arch', arch], ['ai', ai], ['ops', ops]];

const CSS = `/* HOME-CORE */
/* 首页 Core 段：与 Studio 相同的 880 宽窗口与克制配色（由 homepage/scripts/figs/home-core.mjs 写入，改样式请改脚本） */
.cr-body { padding: 14px 16px 16px; }
.cr-shell { display: grid; grid-template-columns: 164px minmax(0, 1fr); gap: 14px; align-items: start; }
.cr-nav { display: flex; flex-direction: column; gap: 1px; padding: 10px 8px; background: var(--card); border: 1px solid var(--rule); border-radius: 10px; }
.cr-ng { padding: 8px 8px 3px; font-size: 10.5px; font-weight: 500; color: var(--muted); }
.cr-ng:first-child { padding-top: 2px; }
.cr-ni { display: flex; align-items: center; gap: 7px; height: 27px; padding: 0 8px; border-radius: 6px; font-size: 12px; color: var(--ink-2); white-space: nowrap; }
.cr-ni svg.lucide { width: 13px; height: 13px; color: var(--muted); flex: none; }
.cr-ni-btn { position: relative; overflow: hidden; width: 100%; border: 0; background: none; font: inherit; font-size: 12px; text-align: left; cursor: pointer; transition: background 0.15s, color 0.15s; }
.cr-ni-btn:hover { background: var(--paper-2); color: var(--ink); }
.cr-ni-btn .cr-dot { margin-left: auto; width: 5px; height: 5px; border-radius: 50%; background: var(--rule-2); flex: none; transition: background 0.15s; }
.cr-ni.on { background: var(--brand-tint); color: var(--brand); font-weight: 550; }
.cr-ni.on svg.lucide { color: var(--brand); }
.cr-ni.on .cr-dot { background: var(--brand); }
.cr-ni-btn.on::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--brand); transform-origin: left; animation: crBar 2.4s linear; }
@keyframes crBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.cr-main { display: grid; gap: 12px; min-width: 0; }
.cr-msw { display: none; }
.cr-views { display: grid; min-width: 0; }
.cr-view { grid-area: 1 / 1; display: grid; gap: 11px; align-content: start; min-width: 0; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.2s ease; }
.cr-view.on { opacity: 1; visibility: visible; pointer-events: auto; }
.cr-footbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 12px; border: 1px solid var(--rule); border-radius: 9px; background: var(--card); font-size: 11.5px; color: var(--muted); }
.cr-footbar > span { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
.cr-footbar svg.lucide { width: 13px; height: 13px; color: var(--muted); flex: none; }
.cr-footbar em { font-style: normal; padding: 1px 7px; border-radius: 4px; background: var(--paper-2); color: var(--ink-2); font-size: 10.5px; font-weight: 550; white-space: nowrap; }
/* 流程管理：极简视觉流程图（少字、强图形结构） */
.cr-wf-canvas { padding: 20px 24px; background: radial-gradient(var(--rule-2) 0.85px, transparent 0.85px) 0 0 / 16px 16px, var(--paper); display: grid; justify-items: center; align-content: center; min-height: 318px; }
.cr-wf-node,
.cr-wf-cond { display: inline-flex; align-items: center; gap: 9px; min-width: 196px; padding: 9px 14px; border: 1px solid var(--rule-2); border-radius: 10px; background: var(--card); box-shadow: 0 1px 2px oklch(0.25 0.05 266 / 0.04); transition: border-color 0.25s; }
.cr-wf-cond { border-radius: 999px; background: var(--card); padding: 8px 16px; }
.cr-wf-node b,
.cr-wf-cond b { font-size: 12.5px; font-weight: 600; color: var(--ink); white-space: nowrap; }
.cr-wf-ic { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 6px; background: var(--paper-2); color: var(--ink-2); flex: none; }
.cr-wf-ic.br { background: var(--brand-tint); color: var(--brand); }
.cr-wf-ic svg.lucide { width: 13px; height: 13px; }
.cr-wf-line { width: 1px; height: 22px; background: var(--rule-2); position: relative; }
.cr-wf-line::after { content: ""; position: absolute; left: -3px; bottom: 0; width: 6px; height: 6px; border-right: 1px solid var(--muted); border-bottom: 1px solid var(--muted); transform: rotate(45deg); }
.cr-wf-fork { width: 54%; height: 24px; border-top: 1px solid var(--rule-2); border-left: 1px solid var(--rule-2); border-right: 1px solid var(--rule-2); position: relative; margin-top: 12px; display: flex; justify-content: space-between; align-items: flex-start; }
.cr-wf-fork::before { content: ""; position: absolute; left: 50%; top: -13px; width: 1px; height: 13px; background: var(--rule-2); }
.cr-wf-fork em { font-style: normal; font-size: 10.5px; color: var(--muted); background: var(--paper); padding: 0 5px; transform: translate(-50%, -55%); }
.cr-wf-fork em:last-child { transform: translate(50%, -55%); }
.cr-wf-split { width: 100%; max-width: 440px; display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.cr-wf-split .cr-wf-node { width: 100%; min-width: 0; justify-content: center; }
.cr-wf-merge { width: 54%; height: 22px; border-bottom: 1px solid var(--rule-2); border-left: 1px solid var(--rule-2); border-right: 1px solid var(--rule-2); position: relative; margin-bottom: 12px; }
.cr-wf-merge::after { content: ""; position: absolute; left: 50%; bottom: -13px; width: 1px; height: 13px; background: var(--rule-2); }
.cr-view.on .cr-wf-n1 { animation: wfStep 2.4s ease infinite 0s; }
.cr-view.on .cr-wf-n2 { animation: wfStep 2.4s ease infinite 0.55s; }
.cr-view.on .cr-wf-n3 { animation: wfStep 2.4s ease infinite 1.1s; }
.cr-view.on .cr-wf-n4 { animation: wfStep 2.4s ease infinite 1.65s; }
@keyframes wfStep { 0%, 28%, 100% { border-color: var(--rule-2); } 10%, 20% { border-color: var(--brand); } }
@media (prefers-reduced-motion: reduce) { .cr-ni-btn.on::after, .cr-view.on [class*="cr-wf-n"] { animation: none; } }
/* 角色与权限矩阵：克制单色 */
.cr-rtabs { display: flex; flex-wrap: wrap; gap: 6px; }
.cr-rtabs span { height: 26px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--rule); background: var(--card); font-size: 11.5px; color: var(--ink-2); display: inline-flex; align-items: center; }
.cr-rtabs span.on { border-color: var(--ink); background: var(--ink); color: var(--card); font-weight: 550; }
.cr-mtx th.c, .cr-mtx td.c { text-align: center; width: 48px; padding-inline: 6px; }
.cr-mtx td { padding-block: 7px; }
.cr-ok { font-style: normal; font-weight: 700; font-size: 12px; color: var(--ink); }
.cr-ok.br { color: var(--brand); }
.cr-no { font-style: normal; color: var(--rule-2); font-size: 12px; }
.cr-scope { display: inline-flex; align-items: center; height: 20px; padding: 0 7px; border-radius: 5px; background: var(--paper-2); font-size: 11px; color: var(--ink-2); white-space: nowrap; }
.cr-src { display: inline-flex; align-items: center; height: 18px; padding: 0 6px; border-radius: 4px; border: 1px solid var(--rule); background: var(--paper); font: 500 10.5px/1 var(--f-mono); color: var(--ink-2); vertical-align: 1px; margin-left: 4px; }
.cr-cols2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.cr-pane { display: flex; flex-direction: column; overflow: hidden; }
.cr-list { display: grid; padding: 4px 12px 8px; }
.cr-list > div { display: flex; align-items: center; gap: 7px; padding: 6px 0; border-top: 1px solid var(--rule); font-size: 12px; color: var(--ink); }
.cr-list > div:first-child { border-top: 0; }
.cr-list svg.lucide { width: 14px; height: 14px; color: var(--pass); flex: none; }
.cr-list em { margin-left: auto; font-style: normal; font-size: 11px; color: var(--muted); white-space: nowrap; }
.cr-sso { padding: 10px 12px 12px; display: grid; gap: 9px; }
.cr-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.cr-chips span { padding: 2px 8px; border-radius: 5px; border: 1px solid var(--rule); background: var(--paper); font-size: 11.5px; color: var(--ink-2); }
.cr-chips span.on { border-color: var(--brand); background: var(--brand-tint); color: var(--brand); font-weight: 600; }
.cr-sso p { font-size: 12px; line-height: 1.6; color: var(--ink-2); }
/* 统一架构 */
.cr-arch { display: grid; grid-template-columns: 1.15fr 1fr; gap: 12px; align-items: stretch; }
.cr-tree { padding: 6px 12px 10px; display: grid; gap: 1px; }
.cr-rprow { display: flex; align-items: center; gap: 7px; padding: 5px 0; border-top: 1px solid var(--rule); font-size: 12px; }
.cr-rprow:first-child { border-top: 0; }
.cr-rprow.d1 { padding-left: 20px; color: var(--ink-2); }
.cr-rprow svg.lucide { width: 13px; height: 13px; color: var(--muted); flex: none; }
.cr-rprow code { font-size: 11.5px; color: var(--ink); white-space: nowrap; }
.cr-rprow span { font-size: 11.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cr-who { margin-left: auto; font-style: normal; padding: 1px 6px; border-radius: 4px; background: var(--paper-2); color: var(--ink-2); font-size: 10.5px; white-space: nowrap; }
.cr-who.biz { background: var(--brand-tint); color: var(--brand); }
.cr-skill-body { padding: 10px 12px 12px; display: grid; gap: 10px; flex: 1; align-content: start; }
.cr-sub { font-size: 12px; color: var(--ink-2); line-height: 1.55; }
.cr-sktbl td, .cr-sktbl th { padding: 6px 8px; font-size: 11.5px; }
.cr-rules { display: grid; gap: 6px; padding-top: 4px; }
.cr-rules > div { display: flex; align-items: flex-start; gap: 7px; font-size: 12px; line-height: 1.5; color: var(--ink-2); }
.cr-rules svg.lucide { width: 13px; height: 13px; color: var(--pass); margin-top: 3px; flex: none; }
/* 业务系统自带 AI：AI 员工嵌入真实业务页面与业务流程 */
.cr-body:has(> .cr-ai-biz),
.cr-body:has(> .cr-arch-ops) { align-content: stretch; }
.cr-ai-biz { display: grid; grid-template-columns: minmax(0, 1.15fr) 316px; gap: 12px; align-items: stretch; height: 100%; }
.cr-biz-main { display: grid; grid-template-rows: minmax(0, 1fr) auto; gap: 10px; min-width: 0; }
.cr-suptbl td { padding-block: 8px; }
.cr-suptbl tr.cr-sup-w td { background: oklch(0.52 0.2 266 / 0.035); }
.cr-grd { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 6px; background: var(--paper-2); font: 650 11.5px/1 var(--f-mono); color: var(--ink); }
.cr-grd.w { background: var(--human-tint); color: var(--human-ink); }
.cr-flowbar { padding: 10px 12px 11px; display: grid; gap: 8px; }
.cr-fb-hd { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--muted); }
.cr-fb-hd svg.lucide { width: 13px; height: 13px; color: var(--brand); }
.cr-fb-hd b { font-weight: 600; color: var(--ink); }
.cr-fb-hd span { margin-left: auto; font-size: 11px; }
.cr-fb-steps { display: flex; align-items: center; gap: 5px; flex-wrap: nowrap; }
.cr-fb-steps > span { display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 7px; border-radius: 6px; border: 1px solid var(--rule); background: var(--paper); font-size: 10.5px; color: var(--muted); white-space: nowrap; }
.cr-fb-steps > span.done { color: var(--ink-2); }
.cr-fb-steps > span.done svg.lucide { width: 11px; height: 11px; color: var(--pass); }
.cr-fb-steps > span.cur { border-color: var(--brand); background: var(--brand-tint); color: var(--brand); font-weight: 600; }
.cr-fdot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--brand); }
.cr-fb-steps > i { font-style: normal; font-size: 11px; color: var(--rule-2); }
.cr-vera { display: flex; flex-direction: column; overflow: hidden; border-color: var(--rule-2); }
.cr-vera-hd { display: flex; align-items: center; gap: 10px; padding: 11px 13px; border-bottom: 1px solid var(--rule); background: var(--card); }
.cr-face { display: inline-flex; width: 34px; height: 34px; color: var(--brand); flex: none; }
.cr-face svg { width: 100%; height: 100%; display: block; }
.cr-vera-hd b { display: flex; align-items: baseline; gap: 6px; font-size: 13.5px; font-weight: 650; color: var(--ink); }
.cr-vera-hd em { font-style: normal; font-size: 11px; font-weight: 500; color: var(--brand); }
.cr-vera-hd span { display: block; margin-top: 1px; font-size: 11px; color: var(--muted); }
.cr-vera-body { flex: 1; padding: 12px 13px; display: flex; flex-direction: column; gap: 10px; background: var(--paper); }
.cr-vera-pill { display: inline-flex; align-items: center; gap: 5px; align-self: flex-start; padding: 2px 8px; border-radius: 5px; background: var(--human-tint); color: var(--human-ink); font-size: 11px; font-weight: 550; }
.cr-vera-pill svg.lucide { width: 11.5px; height: 11.5px; }
.cr-vera-msg { font-size: 12px; line-height: 1.65; color: var(--ink); }
.cr-vera-msg b { font-weight: 600; }
.cr-vera-chk { display: grid; gap: 5px; padding: 8px 10px; border: 1px solid var(--rule); border-radius: 8px; background: var(--card); }
.cr-vera-chk > div { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--ink-2); }
.cr-vera-chk svg.lucide { width: 12px; height: 12px; color: var(--pass); flex: none; }
.cr-vera-acts { display: flex; align-items: center; gap: 7px; margin-top: auto; padding-top: 2px; }
.cr-vera-acts .st-btn { height: 29px; font-size: 12px; }
.cr-vera-ft { display: flex; align-items: center; gap: 6px; padding: 8px 13px; border-top: 1px solid var(--rule); background: var(--card); font-size: 10.5px; color: var(--muted); }
.cr-vera-ft svg.lucide { width: 12px; height: 12px; flex: none; }
/* 开源、持续维护，业务系统独立运行：一目了然的三方架构图 */
.cr-arch-ops { display: grid; grid-template-columns: 274px 96px minmax(0, 1fr); align-items: stretch; height: 100%; padding: 14px; border: 1px solid var(--rule); border-radius: 10px; background: radial-gradient(var(--rule-2) 0.85px, transparent 0.85px) 0 0 / 16px 16px, var(--paper); }
.cr-ops-left { display: grid; grid-template-rows: 1fr 1fr; gap: 14px; }
.cr-ops-src,
.cr-ops-studio { padding: 14px 15px; display: flex; flex-direction: column; justify-content: center; gap: 8px; }
.cr-ops-src { border-color: var(--rule-2); box-shadow: 0 1px 2px oklch(0.25 0.05 266 / 0.04); }
.cr-ops-studio { border-style: dashed; border-color: var(--rule-2); background: oklch(1 0 0 / 0.72); }
.cr-ops-hd { display: flex; align-items: center; gap: 8px; }
.cr-ops-hd svg.lucide { width: 15px; height: 15px; color: var(--brand); flex: none; }
.cr-ops-studio .cr-ops-hd svg.lucide { color: var(--muted); }
.cr-ops-hd b { font-size: 13.5px; font-weight: 650; color: var(--ink); }
.cr-ops-hd .cr-rtag,
.cr-ops-hd .st-tag { margin-left: auto; }
.cr-rtag { padding: 1px 7px; border-radius: 5px; background: var(--paper-2); font-size: 10.5px; font-weight: 550; color: var(--ink-2); white-space: nowrap; }
.cr-rtag.on { background: var(--brand-tint); color: var(--brand); }
.cr-ops-sub { font-size: 12px; line-height: 1.55; color: var(--ink-2); }
.cr-ops-studio .cr-ops-sub { color: var(--muted); }
.cr-ops-ver { display: flex; align-items: center; gap: 6px; padding-top: 4px; flex-wrap: wrap; }
.cr-ops-ver code { padding: 1px 6px; border-radius: 4px; background: var(--paper-2); font-size: 11px; color: var(--ink-2); }
.cr-ops-ver code.on { background: var(--brand-tint); color: var(--brand); font-weight: 600; }
.cr-ops-cmd { margin-left: auto; font-size: 10.5px; color: var(--muted); }
.cr-tarr { font-size: 12px; color: var(--muted); }
.cr-ops-links { display: grid; grid-template-rows: 1fr 1fr; gap: 14px; align-items: center; }
.cr-ops-arr { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.cr-ops-arr::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; border-top: 1.5px solid var(--brand); }
.cr-ops-arr.off::before { border-top: 1.5px dashed var(--rule-2); }
.cr-ops-arr span { position: relative; z-index: 1; padding: 0 5px; background: var(--paper); font-size: 10px; font-weight: 550; color: var(--brand); white-space: nowrap; transform: translateY(-9px); }
.cr-ops-arr.off span { color: var(--muted); }
.cr-ops-arr i { position: relative; z-index: 1; font-style: normal; width: 20px; height: 20px; border-radius: 50%; display: inline-grid; place-items: center; font-size: 11px; font-weight: 700; transform: translateY(-7px); }
.cr-ops-arr.on i { background: var(--brand); color: #fff; }
.cr-ops-arr.off i { background: var(--card); border: 1px solid var(--rule-2); color: var(--muted); font-size: 9.5px; }
.cr-ops-app { padding: 15px 16px; display: flex; flex-direction: column; gap: 12px; border-color: var(--brand); box-shadow: 0 2px 10px -4px oklch(0.52 0.2 266 / 0.16); }
.cr-ops-layers { flex: 1; display: grid; gap: 9px; align-content: center; }
.cr-ops-layer { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--rule); border-radius: 9px; background: var(--paper); }
.cr-ops-layer.cr-ly-biz { background: var(--card); border-color: var(--rule-2); }
.cr-ops-layer.cr-ly-core { background: oklch(0.52 0.2 266 / 0.045); border-color: oklch(0.52 0.2 266 / 0.25); }
.cr-ops-layer svg.lucide { width: 16px; height: 16px; color: var(--ink-2); flex: none; }
.cr-ops-layer.cr-ly-core svg.lucide { color: var(--brand); }
.cr-ops-layer > div { min-width: 0; }
.cr-ops-layer b { display: block; font-size: 12.5px; font-weight: 600; color: var(--ink); line-height: 1.3; }
.cr-ops-layer span { display: block; margin-top: 2px; font-size: 11px; color: var(--muted); line-height: 1.4; }
.cr-ops-live { display: flex; align-items: center; gap: 7px; padding: 8px 11px; border-radius: 8px; background: var(--paper-2); font-size: 11px; font-weight: 500; color: var(--ink-2); }
.cr-ldot { width: 7px; height: 7px; border-radius: 50%; background: var(--pass); flex: none; }
/* 手机端克制等高、缩小比例与字号 */
@media (max-width: 640px) {
  .stv-mobile-fig .cr-body { padding: 9px 10px 10px; }
  .stv-mobile-fig .cr-nav { display: none; }
  .stv-mobile-fig .cr-shell,
  .stv-mobile-fig .cr-cols2,
  .stv-mobile-fig .cr-arch,
  .stv-mobile-fig .cr-ai-grid { grid-template-columns: minmax(0, 1fr); gap: 7px; }
  .stv-mobile-fig .cr-main { gap: 7px; }
  .stv-mobile-fig .cr-src { height: 15px; padding: 0 4px; font-size: 9px; }
  .stv-mobile-fig .st-tbl th:nth-child(n+2):not(:last-child),
  .stv-mobile-fig .st-tbl td:nth-child(n+2):not(:last-child) { display: none; }
  /* 1. 基础能力（移动端分段条切换流程 / 权限矩阵 / 文件存储，全部收齐在 344px 内） */
  .stv-mobile-fig .cr-msw { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; padding: 3px; border-radius: 8px; background: var(--paper-2); border: 1px solid var(--rule); }
  .stv-mobile-fig .cr-msw button { height: 24px; border: 0; border-radius: 6px; background: transparent; font: 550 10.5px/1 var(--f-sans); color: var(--ink-2); cursor: pointer; white-space: nowrap; }
  .stv-mobile-fig .cr-msw button.on { background: var(--card); color: var(--ink); box-shadow: 0 1px 2px oklch(0.25 0.05 266 / 0.08); }
  .stv-mobile-fig .cr-view { display: none; opacity: 1; visibility: visible; pointer-events: auto; gap: 6px; }
  .stv-mobile-fig .cr-view.on { display: grid; }
  .stv-mobile-fig .cr-footbar { padding: 5px 8px; font-size: 9.5px; border-radius: 7px; }
  .stv-mobile-fig .cr-footbar em { display: none; }
  /* 移动端流程图 */
  .stv-mobile-fig .cr-wf-canvas { padding: 12px 10px; min-height: 0; }
  .stv-mobile-fig .cr-wf-node,
  .stv-mobile-fig .cr-wf-cond { min-width: 138px; padding: 6px 10px; gap: 6px; border-radius: 8px; }
  .stv-mobile-fig .cr-wf-cond { border-radius: 999px; }
  .stv-mobile-fig .cr-wf-node b,
  .stv-mobile-fig .cr-wf-cond b { font-size: 10.5px; }
  .stv-mobile-fig .cr-wf-ic { width: 19px; height: 19px; border-radius: 5px; }
  .stv-mobile-fig .cr-wf-ic svg.lucide { width: 10.5px; height: 10.5px; }
  .stv-mobile-fig .cr-wf-line { height: 14px; }
  .stv-mobile-fig .cr-wf-fork { height: 16px; margin-top: 8px; }
  .stv-mobile-fig .cr-wf-fork::before { top: -9px; height: 9px; }
  .stv-mobile-fig .cr-wf-fork em { font-size: 9.5px; }
  .stv-mobile-fig .cr-wf-split { gap: 8px; }
  .stv-mobile-fig .cr-wf-merge { height: 14px; margin-bottom: 8px; }
  .stv-mobile-fig .cr-wf-merge::after { bottom: -9px; height: 9px; }
  /* 移动端角色权限矩阵 */
  .stv-mobile-fig .cr-rtabs { gap: 4px; }
  .stv-mobile-fig .cr-rtabs span { height: 21px; padding: 0 7px; font-size: 9.5px; }
  .stv-mobile-fig .st-tbl.cr-mtx th,
  .stv-mobile-fig .st-tbl.cr-mtx td { display: table-cell; padding: 4px 5px; font-size: 10px; }
  .stv-mobile-fig .st-tbl.cr-mtx th:nth-child(n+2):not(:last-child),
  .stv-mobile-fig .st-tbl.cr-mtx td:nth-child(n+2):not(:last-child) { display: table-cell; }
  .stv-mobile-fig .st-tbl.cr-mtx th.c,
  .stv-mobile-fig .st-tbl.cr-mtx td.c { width: 32px; padding-inline: 2px; }
  .stv-mobile-fig .st-tbl.cr-mtx th:last-child,
  .stv-mobile-fig .st-tbl.cr-mtx td:last-child { display: none; }
  .stv-mobile-fig .st-tbl.cr-mtx tbody tr:nth-child(n+5) { display: none; }
  /* 移动端文件存储 */
  .stv-mobile-fig .cr-view[data-cr-view="files"] .st-ph { display: none; }
  .stv-mobile-fig .cr-list { padding: 2px 9px 4px; }
  .stv-mobile-fig .cr-list > div { padding: 3.5px 0; font-size: 10px; gap: 5px; }
  .stv-mobile-fig .cr-list > div:nth-child(n+3) { display: none; }
  .stv-mobile-fig .cr-list svg.lucide { width: 11px; height: 11px; }
  .stv-mobile-fig .cr-list em { font-size: 9.5px; }
  .stv-mobile-fig .cr-sso { padding: 5px 9px 6px; gap: 4px; }
  .stv-mobile-fig .cr-chips { gap: 4px; }
  .stv-mobile-fig .cr-chips span { padding: 1px 5px; font-size: 9.5px; }
  .stv-mobile-fig .cr-sso p { display: none; }
  /* 2. 统一架构 */
  .stv-mobile-fig .cr-tree { padding: 3px 9px 5px; }
  .stv-mobile-fig .cr-rprow { padding: 4px 0; font-size: 10.5px; gap: 5px; }
  .stv-mobile-fig .cr-rprow.d1 { display: none; }
  .stv-mobile-fig .cr-rprow svg.lucide { width: 11px; height: 11px; }
  .stv-mobile-fig .cr-rprow code { font-size: 10.5px; }
  .stv-mobile-fig .cr-rprow span { font-size: 10px; }
  .stv-mobile-fig .cr-who { font-size: 9.5px; padding: 1px 5px; }
  .stv-mobile-fig .cr-skill-body { padding: 6px 9px 7px; gap: 5px; }
  .stv-mobile-fig .cr-sub,
  .stv-mobile-fig .cr-sktbl { display: none; }
  .stv-mobile-fig .cr-rules { gap: 4px; padding-top: 0; }
  .stv-mobile-fig .cr-rules > div { font-size: 10px; line-height: 1.4; gap: 5px; }
  .stv-mobile-fig .cr-rules svg.lucide { width: 11px; height: 11px; margin-top: 2px; }
  /* 3. 业务系统自带 AI（移动端：上方精简供应商异常表 + 下方嵌入式 Vera 流程操作卡） */
  .stv-mobile-fig .cr-body:has(> .cr-ai-biz),
  .stv-mobile-fig .cr-body:has(> .cr-arch-ops) { align-content: start; }
  .stv-mobile-fig .cr-ai-biz { grid-template-columns: minmax(0, 1fr); gap: 7px; height: auto; }
  .stv-mobile-fig .cr-biz-main { gap: 6px; }
  .stv-mobile-fig .cr-suptbl tbody tr:nth-child(2),
  .stv-mobile-fig .cr-suptbl tbody tr:nth-child(4) { display: none; }
  .stv-mobile-fig .cr-suptbl td { padding-block: 4.5px; }
  .stv-mobile-fig .cr-flowbar { display: none; }
  .stv-mobile-fig .cr-vera-hd { padding: 7px 9px; gap: 8px; }
  .stv-mobile-fig .cr-face { width: 26px; height: 26px; }
  .stv-mobile-fig .cr-vera-hd b { font-size: 11px; }
  .stv-mobile-fig .cr-vera-hd em { font-size: 9.5px; }
  .stv-mobile-fig .cr-vera-hd span { font-size: 9.5px; }
  .stv-mobile-fig .cr-vera-body { padding: 8px 9px; gap: 6px; }
  .stv-mobile-fig .cr-vera-pill { font-size: 9.5px; padding: 1px 6px; }
  .stv-mobile-fig .cr-vera-msg { font-size: 10px; line-height: 1.48; }
  .stv-mobile-fig .cr-vera-chk { display: none; }
  .stv-mobile-fig .cr-vera-acts { gap: 6px; padding-top: 0; }
  .stv-mobile-fig .cr-vera-acts .st-btn { height: 23px; font-size: 10px; }
  .stv-mobile-fig .cr-vera-ft { display: none; }
  /* 4. 开源、持续维护，业务系统独立运行（移动端：上下直观关系图） */
  .stv-mobile-fig .cr-arch-ops { grid-template-columns: minmax(0, 1fr); gap: 6px; padding: 8px; height: auto; }
  .stv-mobile-fig .cr-ops-left { grid-template-rows: auto; grid-template-columns: 1fr 1fr; gap: 6px; }
  .stv-mobile-fig .cr-ops-src,
  .stv-mobile-fig .cr-ops-studio { padding: 7px 8px; gap: 4px; }
  .stv-mobile-fig .cr-ops-hd { gap: 5px; }
  .stv-mobile-fig .cr-ops-hd svg.lucide { width: 12px; height: 12px; }
  .stv-mobile-fig .cr-ops-hd b { font-size: 10.5px; }
  .stv-mobile-fig .cr-rtag { font-size: 8.5px; padding: 0 4px; }
  .stv-mobile-fig .cr-ops-sub { font-size: 9.5px; line-height: 1.35; }
  .stv-mobile-fig .cr-ops-ver { display: none; }
  .stv-mobile-fig .cr-ops-links { display: none; }
  .stv-mobile-fig .cr-ops-app { padding: 8px 9px; gap: 6px; }
  .stv-mobile-fig .cr-ops-layers { gap: 5px; }
  .stv-mobile-fig .cr-ops-layer { padding: 5px 8px; gap: 7px; border-radius: 7px; }
  .stv-mobile-fig .cr-ops-layer svg.lucide { width: 12px; height: 12px; }
  .stv-mobile-fig .cr-ops-layer b { font-size: 10.5px; }
  .stv-mobile-fig .cr-ops-layer span { font-size: 9px; margin-top: 1px; }
  .stv-mobile-fig .cr-ops-live { padding: 5px 8px; font-size: 9.5px; border-radius: 6px; }
}
/* /HOME-CORE */
`;

function subn(re, rep, s) {
  let n = 0;
  const out = s.replace(re, () => (n++, rep));
  return [out, n];
}
function replaceOnce(s, a, b) {
  const i = s.indexOf(a);
  return i < 0 ? s : s.slice(0, i) + b + s.slice(i + a.length);
}

const CSS_RE = /\/\* HOME-CORE \*\/\n[\s\S]*?\/\* \/HOME-CORE \*\/\n/g;
const tpls = FIGS.map(([k, v]) => `<template id="crv-${k}">${v}</template>`).join('');

const p = join(CONTENT, 'pages', 'home.html');
let s = readFileSync(p, 'utf8'), n;
[s, n] = subn(/<!-- CORETPL -->[\s\S]*?<!-- \/CORETPL -->/g, '<!-- CORETPL -->' + tpls + '<!-- /CORETPL -->', s);
if (n !== 1) throw new Error('content/pages/home.html 里没有 <!-- CORETPL --> 标记');
writeFileSync(p, s, 'utf8');

const snipdir = join(CONTENT, 'pages', 'snips');
const capitalize = k => k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();
for (const [k, v] of FIGS) writeFileSync(join(snipdir, `crv${capitalize(k)}.html`), v, 'utf8');

const cp = join(STYLES, 'site.css');
let c = readFileSync(cp, 'utf8');
[c, n] = subn(CSS_RE, CSS, c);
if (!n) {
  if (!c.includes('/* /HOME-STUDIO */\n')) throw new Error('src/styles/site.css 里没有 /* /HOME-STUDIO */ 标记');
  c = replaceOnce(c, '/* /HOME-STUDIO */\n', '/* /HOME-STUDIO */\n' + CSS);
}
writeFileSync(cp, c, 'utf8');
console.log('core templates', `{${FIGS.map(([k, v]) => `'${k}': ${[...v].length}`).join(', ')}}`);
