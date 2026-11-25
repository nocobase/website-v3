// 首页 Core 段：四条核心特色各一张图，左侧点/滑特色、右侧换图（880 宽，与 Studio 段统一窗口比例与克制配色）。
//   blocks  30 多项现成、可靠的基础能力：对照 Core 系统设置界面（左侧能力导航 + 文件存储读写自检与企业 SSO）
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

// 左侧真实产品「系统设置」菜单（对照 NocoBase Core 真实截图：返回 + 5 大分组 16 项）；
// live=true 时 5 个代表性能力（流程管理、角色和权限、登录与认证、数据库、插件）可点击并在它们之间轮播
function coreNav(active, live = false) {
  const LIVE = new Set(['wf', 'roles', 'auth', 'db', 'plugins']);
  const item = (k, ic, zh, en) => {
    const on = k === active;
    if (live && LIVE.has(k)) {
      return `<button type="button" role="tab" class="cr-ni cr-ni-btn" data-cr-tab="${k}" aria-selected="${on}" tabindex="${on ? 0 : -1}">${I(ic)}<span>${T(zh, en)}</span><i class="cr-dot" aria-hidden="true"></i></button>`;
    }
    return `<span class="cr-ni${on ? ' on' : ''}">${I(ic)}<span>${T(zh, en)}</span></span>`;
  };
  const grp = (zh, en) => `<small class="cr-ng">${T(zh, en)}</small>`;
  return '<aside class="cr-side">' +
    '<div class="cr-side-top"><span class="sv-brand"><img src="https://static-docs.nocobase.com/logo-nocobase.png" alt="NocoBase"></span></div>' +
    '<nav class="cr-nav" role="tablist" aria-label="NocoBase Core" aria-orientation="vertical">' +
      '<span class="cr-back">' + I('arrow-left') + T('返回', 'Back') + '</span>' +
      grp('账号与权限', 'Accounts & access') +
      item('users', 'users', '用户管理', 'Users') +
      item('roles', 'shield-check', '角色和权限', 'Roles & permissions') +
      item('keys', 'key-round', 'API 密钥', 'API keys') +
      item('auth', 'lock-keyhole', '登录与认证', 'Sign-in & auth') +
      grp('流程与自动化', 'Workflows') +
      item('wf', 'workflow', '流程管理', 'Workflows') +
      item('sched', 'calendar-clock', '定时任务', 'Schedules') +
      grp('消息', 'Messages') +
      item('notify', 'bell', '通知', 'Notifications') +
      item('mail', 'mail', '邮箱', 'Mailbox') +
      grp('AI', 'AI') +
      item('agent', 'bot', 'Agent', 'Agents') +
      item('runtime', 'server', '运行环境', 'Runtimes') +
      item('skills', 'sparkles', '技能', 'Skills') +
      grp('系统', 'System') +
      item('files', 'hard-drive', '文件存储', 'File storage') +
      item('db', 'database', '数据库', 'Database') +
      item('plugins', 'blocks', '插件', 'Plugins') +
    '</nav>' +
  '</aside>';
}

// ---------- 1. 30 多项现成、可靠的基础能力（对照 Core 真实界面：流程管理 / 角色和权限 / 登录与认证 / 数据库 / 插件） ----------

// 1a. 流程管理 · 合同审批与履约（对照真实流程图与流程参数）
const WF_SVG =
  '<svg class="cr-wf-svg" viewBox="0 0 420 338" preserveAspectRatio="none" aria-hidden="true">' +
    '<defs><marker id="crWfArr" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="6" markerHeight="6" orient="auto">' +
      '<path d="M1 1.5 L6.5 4 L1 6.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</marker></defs>' +
    '<path d="M116 34 V44 Q116 50 110 50 H88 Q82 50 82 56 V79" marker-end="url(#crWfArr)"/>' +
    '<path d="M82 111 V142" marker-end="url(#crWfArr)"/>' +
    '<path d="M162 34 V44 Q162 50 168 50 H234 Q240 50 240 56 V75" marker-end="url(#crWfArr)"/>' +
    '<path d="M240 113 V149" marker-end="url(#crWfArr)"/>' +
    '<path d="M240 187 V223" marker-end="url(#crWfArr)"/>' +
    '<path class="cr-wf-alt" d="M276 113 V121 Q276 127 282 127 H352 Q358 127 358 133 V203 Q358 209 352 209 H282 Q276 209 276 215 V223" marker-end="url(#crWfArr)"/>' +
    '<path d="M240 261 V295" marker-end="url(#crWfArr)"/>' +
  '</svg>';

const viewWf =
  '<div class="cr-view on" role="tabpanel" data-cr-view="wf">' +
    '<div class="cr-ph"><div class="cr-ph-t"><h4>' + T('合同审批与履约', 'Contract approval &amp; fulfillment') + '</h4><span class="cr-ver mono">v1</span><span class="cr-meta">' + T('11 次执行（8 个进行中）', '11 runs (8 in progress)') + '</span></div>' +
      '<p>' + T('法务审核所有合同，超过金额阈值的再由财务审核，任一环节可退回修改。签署后进入履约期。', 'Legal reviews all contracts; amounts over the threshold also route to Finance before signing.') + '</p></div>' +
    '<div class="cr-wf-grid">' +
      '<div class="st-card cr-wf-box">' +
        '<div class="cr-card-hd">' + T('流程图', 'Flow diagram') + '</div>' +
        '<div class="cr-wf-stage">' +
          WF_SVG +
          '<div class="cr-wfn cr-wfn-start cr-wf-s1" style="left:32.9%;top:6.5%">' + I('play') + '<span>' + T('起草', 'Draft') + '</span></div>' +
          '<span class="cr-wfl" style="left:19.5%;top:18.3%">' + T('作废', 'Void') + '</span>' +
          '<span class="cr-wfl" style="left:57.1%;top:18.3%">' + T('提交审核', 'Submit') + '</span>' +
          '<div class="cr-wfn cr-wfn-void" style="left:19.5%;top:28.4%">' + I('circle-x') + '<span>' + T('已作废', 'Voided') + '</span></div>' +
          '<div class="cr-wfn cr-wfn-end" style="left:19.5%;top:45.6%">' + I('circle-dot') + '<span>' + T('结束', 'End') + '</span></div>' +
          '<div class="cr-wfn cr-wfn-step cr-wf-s2" style="left:57.1%;top:28.1%"><span class="cr-wfic">' + I('user-round') + '</span><b>' + T('法务审核', 'Legal review') + '</b></div>' +
          '<span class="cr-wfl" style="left:57.1%;top:39.3%">' + T('通过 · > 20 万', 'Pass · &gt; $200k') + '</span>' +
          '<div class="cr-wfn cr-wfn-step cr-wf-s3" style="left:57.1%;top:50.0%"><span class="cr-wfic">' + I('user-round') + '</span><b>' + T('财务审核', 'Finance review') + '</b></div>' +
          '<span class="cr-wfl" style="left:85.2%;top:50.0%">' + T('通过 · ≤ 20 万', 'Pass · ≤ $200k') + '</span>' +
          '<span class="cr-wfl" style="left:57.1%;top:60.9%">' + T('财务通过', 'Finance OK') + '</span>' +
          '<div class="cr-wfn cr-wfn-step cr-wf-s4" style="left:57.1%;top:71.9%"><span class="cr-wfic">' + I('user-round') + '</span><b>' + T('待签署', 'To sign') + '</b></div>' +
          '<span class="cr-wfl" style="left:57.1%;top:82.5%">' + T('双方签署', 'Signed') + '</span>' +
          '<div class="cr-wfn cr-wfn-step cr-wfn-ok cr-wf-s5" style="left:57.1%;top:92.6%"><span class="cr-wfic ok">' + I('file-check') + '</span><b>' + T('履约中', 'Active') + '</b></div>' +
        '</div>' +
      '</div>' +
      '<div class="st-card cr-wf-param">' +
        '<div class="cr-card-hd">' + T('流程参数', 'Parameters') + '</div>' +
        '<div class="cr-param-row"><span>' + T('超过多少金额需财务审核（元）', 'Finance review threshold') + '</span><b class="mono">' + T('200000', '$200,000') + '</b></div>' +
        '<p class="cr-param-hint">' + T('参数随流程定义在代码中声明；每张单据保留它创建时的参数值。', 'Declared in code with the workflow; each record keeps its value at creation.') + '</p>' +
      '</div>' +
    '</div>' +
  '</div>';

// 1b. 角色和权限（对照真实分栏：左侧角色列表 + 右侧权限配置与高危/敏感标记）
function roleIt(zh, en, slug, badge = '', on = false) {
  return `<div class="cr-role-it${on ? ' on' : ''}"><div><b>${T(zh, en)}</b><small class="mono">${slug}</small></div>${badge ? `<span class="cr-rbadge">${badge}</span>` : ''}</div>`;
}
function chk(zh, en, on = false, risk = '') {
  const r = risk === 'hi' ? `<em class="cr-risk">${T('高危', 'High')}</em>`
    : risk === 'med' ? `<em class="cr-risk w">${T('敏感', 'Sens.')}</em>` : '';
  return `<span class="cr-chk${on ? ' on' : ''}"><i></i>${T(zh, en)}${r}</span>`;
}
const viewRoles =
  '<div class="cr-view" role="tabpanel" data-cr-view="roles" hidden>' +
    '<div class="cr-ph"><div class="cr-ph-t"><h4>' + T('角色和权限', 'Roles &amp; permissions') + '</h4></div>' +
      '<p>' + T('设置每个角色可访问的页面和可执行的操作。', 'Configure which pages and actions each role can access.') + '</p></div>' +
    '<div class="cr-utabs"><span class="on">' + T('角色', 'Roles') + '</span><span>' + T('数据规则', 'Data rules') + '</span><span>' + T('权限检查', 'Access check') + '</span></div>' +
    '<div class="st-card cr-split cr-roles-split">' +
      '<div class="cr-split-l">' +
        '<div class="cr-sbar"><span class="cr-inp">' + I('search') + T('搜索角色名称', 'Search roles') + '</span><span class="cr-plus">' + I('plus') + '</span></div>' +
        '<div class="cr-rlist">' +
          roleIt('系统管理员', 'System admin', 'root', T('全部权限', 'Full')) +
          roleIt('部门经理', 'Dept manager', 'dept-manager') +
          roleIt('财务人员', 'Finance', 'finance', '', true) +
          roleIt('采购专员', 'Procurement', 'procurement') +
          roleIt('成员', 'Member', 'member', T('受保护', 'Protected')) +
          roleIt('法务', 'Legal', 'legal') +
          roleIt('销售', 'Sales', 'sales') +
        '</div>' +
      '</div>' +
      '<div class="cr-split-r">' +
        '<div class="cr-rh"><b>' + T('财务人员', 'Finance') + '</b><span class="mono">finance</span></div>' +
        '<div class="cr-stabs"><span>' + I('layout-grid') + T('页面访问', 'Pages') + '</span><span>' + I('layers') + T('业务操作', 'Actions') + '</span><span class="on">' + I('sliders-horizontal') + T('系统设置', 'Settings') + '</span><span>' + I('users') + T('成员', 'Members') + '</span></div>' +
        '<table class="st-tbl cr-ptbl"><thead><tr><th>' + T('设置页面', 'Settings page') + '</th><th>' + T('进入页面', 'Page access') + '</th><th>' + T('管理操作', 'Actions') + '</th></tr></thead><tbody>' +
          '<tr class="cr-pgrp"><td colspan="3">' + T('账号与权限', 'Accounts &amp; access') + ' <em>' + T('已开放 1/4 个页面', '1/4 pages open') + '</em></td></tr>' +
          '<tr><td><b>' + T('用户管理', 'Users') + '</b> <span class="cr-cnt">1/7</span></td><td>' + chk('查看用户', 'View users', true) + '</td><td><div class="cr-chks">' + chk('创建', 'Create') + chk('禁用', 'Disable', false, 'med') + chk('分配角色', 'Roles', false, 'hi') + '</div></td></tr>' +
          '<tr><td><b>' + T('角色和权限', 'Roles') + '</b> <span class="cr-cnt">0/17</span></td><td>' + chk('查看', 'View') + '</td><td><div class="cr-chks">' + chk('新建', 'New', false, 'hi') + chk('编辑', 'Edit', false, 'hi') + chk('删除', 'Delete', false, 'hi') + '</div></td></tr>' +
          '<tr><td><b>' + T('API 密钥', 'API keys') + '</b> <span class="cr-cnt">0/3</span></td><td>' + chk('查看', 'View') + '</td><td><div class="cr-chks">' + chk('管理系统密钥', 'System keys', false, 'hi') + '</div></td></tr>' +
          '<tr class="cr-pgrp"><td colspan="3">' + T('流程与自动化', 'Workflows &amp; automation') + ' <em>' + T('已开放 1/2 个页面', '1/2 pages open') + '</em></td></tr>' +
          '<tr><td><b>' + T('流程管理', 'Workflows') + '</b> <span class="cr-cnt">2/2</span></td><td>' + chk('查看定义与记录', 'View runs', true) + '</td><td><div class="cr-chks">' + chk('调整流程参数', 'Edit params', true) + '</div></td></tr>' +
          '<tr><td><b>' + T('定时任务', 'Schedules') + '</b> <span class="cr-cnt">0/2</span></td><td>' + chk('查看', 'View') + '</td><td><div class="cr-chks">' + chk('管理', 'Manage') + '</div></td></tr>' +
        '</tbody></table>' +
      '</div>' +
    '</div>' +
  '</div>';

// 1c. 登录与认证（对照真实登录方式表 + 待处理提示条 + 来源标签）
function authRow(zh, en, subZh, subEn, cfg, on, srcZh, srcEn, srcKind = '') {
  const st = on
    ? `<span class="cr-st on"><i></i>${T('已开启', 'Enabled')}</span>`
    : `<span class="cr-st"><i></i>${T('未配置', 'Not set')}</span>`;
  const src = srcZh
    ? `<span class="cr-src-pill ${srcKind}">${T(srcZh, srcEn)}</span>`
    : '<span class="cr-dash">—</span>';
  const act = on ? '' : `<span class="cr-mbtn">${T('如何开启', 'How to enable')}</span>`;
  return `<tr><td><b>${T(zh, en)}</b><small>${T(subZh, subEn)}</small></td><td><code class="cr-code">${cfg}</code></td><td>${st}</td><td>${src}</td><td class="r">${act}</td></tr>`;
}
const viewAuth =
  '<div class="cr-view" role="tabpanel" data-cr-view="auth" hidden>' +
    '<div class="cr-ph"><div class="cr-ph-t"><h4>' + T('登录与认证', 'Sign-in &amp; auth') + '</h4></div>' +
      '<p>' + T('配置写在应用代码里随部署生效；本页显示当前生效的值和来源，并提示待处理项。', 'Settings live in app config and apply on deploy; this page shows active values, sources, and items to review.') + '</p></div>' +
    '<div class="cr-warn">' + I('alert-triangle') + '<div><b>' + T('2 项需要处理', '2 items need attention') + '</b><span>' + T('找回密码未开启；未设置 app.publicOrigin，第三方登录回调地址无法确定。', 'Password reset is off; app.publicOrigin is unset for SSO callbacks.') + '</span></div></div>' +
    '<div class="cr-utabs"><span class="on">' + T('登录方式', 'Sign-in methods') + '</span><span>' + T('注册', 'Sign-up') + '</span><span>' + T('密码与找回', 'Password') + '</span><span>' + T('会话与安全', 'Sessions') + '</span></div>' +
    '<div class="st-card"><table class="st-tbl cr-atbl"><thead><tr><th>' + T('方式', 'Method') + '</th><th>' + T('配置项', 'Config') + '</th><th>' + T('状态', 'Status') + '</th><th>' + T('来源', 'Source') + '</th><th></th></tr></thead><tbody>' +
      authRow('账号密码', 'Password', '邮箱或用户名 + 密码', 'Email or username', 'emailAndPassword', true, 'config.yml', 'config.yml', 'cfg') +
      authRow('命令行登录', 'CLI login', '在浏览器批准 /device 请求', 'Approve /device in browser', 'deviceAuthorization()', true, '代码', 'Code', 'code') +
      authRow('API 密钥', 'API keys', '程序调用接口，不经过登录页', 'Programmatic API access', 'apiKey()', true, '代码', 'Code', 'code') +
      authRow('企业 SSO (OIDC)', 'Enterprise SSO', '飞书、钉钉、企微、Okta、Entra ID', 'Feishu, DingTalk, Okta, Entra ID', 'genericOAuth()', false, '', '') +
      authRow('两步验证', 'Two-factor (2FA)', '登录时再输入一次验证码', 'Verification code on sign-in', 'twoFactor()', false, '', '') +
      authRow('通行密钥', 'Passkeys', '用指纹、面容或安全密钥登录', 'Biometrics or security key', 'passkey()', false, '', '') +
    '</tbody></table></div>' +
  '</div>';

// 1d. 数据库（对照真实分栏：左侧连接选择与数据表列表 + 右侧字段结构表）
function tblIt(name, on = false) {
  return `<div class="cr-tbit${on ? ' on' : ''}">${I('table-2')}<span class="mono">${name}</span></div>`;
}
function fldRow(name, pk, type, raw, nul) {
  const b = pk ? `<span class="cr-pk">${I('key-round')}${T('主键', 'PK')}</span>` : '';
  return `<tr><td><span class="cr-fname mono">${name}</span>${b}</td><td><span class="mono">${type}</span> <small class="cr-raw mono">${raw}</small></td><td>${nul ? T('是', 'Yes') : T('否', 'No')}</td><td class="cr-dash">—</td></tr>`;
}
const viewDb =
  '<div class="cr-view" role="tabpanel" data-cr-view="db" hidden>' +
    '<div class="cr-ph"><div class="cr-ph-t"><h4>' + T('数据库', 'Database') + '</h4></div>' +
      '<p>' + T('查看应用的数据库连接、数据表和字段。', 'Inspect database connections, tables, and fields.') + '</p></div>' +
    '<div class="st-card cr-split cr-db-split">' +
      '<div class="cr-split-l">' +
        '<div class="cr-db-conn">' +
          '<small>' + T('数据库连接', 'Connection') + '</small>' +
          '<div class="cr-sel"><span class="mono">main</span>' + I('chevron-down') + '</div>' +
          '<div class="cr-db-meta"><span>sqlite · ' + T('由应用管理', 'App-managed') + '</span><em>' + T('默认', 'Default') + '</em></div>' +
        '</div>' +
        '<div class="cr-db-s"><span class="cr-inp">' + I('search') + T('按表名搜索', 'Search tables') + '</span><small>' + T('共 104 张表', '104 tables') + '</small></div>' +
        '<div class="cr-tlist">' +
          tblIt('account', true) +
          tblIt('agAgents') +
          tblIt('agConversations') +
          tblIt('agJobs') +
          tblIt('agModelServices') +
          tblIt('contracts') +
          tblIt('customers') +
        '</div>' +
      '</div>' +
      '<div class="cr-split-r">' +
        '<div class="cr-rh"><b class="mono">account</b><span class="cr-cnt-r">' + T('共 13 个字段', '13 fields') + '</span></div>' +
        '<div class="cr-db-bar"><span class="cr-inp">' + I('search') + T('按字段名、标题或类型搜索', 'Search fields or types') + '</span></div>' +
        '<table class="st-tbl cr-ftbl"><thead><tr><th>' + T('字段', 'Field') + '</th><th>' + T('类型', 'Type') + '</th><th>' + T('允许为空', 'Nullable') + '</th><th>' + T('引用', 'Ref') + '</th></tr></thead><tbody>' +
          fldRow('id', true, 'string', 'varchar(64)', false) +
          fldRow('accountId', false, 'string', 'varchar(320)', false) +
          fldRow('providerId', false, 'string', 'varchar(128)', false) +
          fldRow('userId', false, 'string', 'varchar(64)', false) +
          fldRow('accessToken', false, 'text', '', true) +
          fldRow('accessTokenExpiresAt', false, 'datetime', 'TEXT', true) +
          fldRow('createdAt', false, 'datetime', 'TEXT', false) +
        '</tbody></table>' +
      '</div>' +
    '</div>' +
  '</div>';

// 1e. 插件（对照真实插件清单：筛选胶囊 + 版本号 + 已启用标签 + 命令按钮）
function plgRow(zh, en, subZh, subEn, ver) {
  return `<tr><td><b>${T(zh, en)}</b><small>${T(subZh, subEn)}</small></td><td class="mono cr-ver-c">${ver}</td><td><span class="cr-st on">${T('已启用', 'Enabled')}</span></td><td class="r"><span class="cr-mbtn">${T('命令', 'CLI')}</span></td></tr>`;
}
const viewPlugins =
  '<div class="cr-view" role="tabpanel" data-cr-view="plugins" hidden>' +
    '<div class="cr-ph"><div class="cr-ph-t"><h4>' + T('插件', 'Plugins') + '</h4></div>' +
      '<p>' + T('查看应用加载了哪些插件；启用和停用通过应用代码生效，这里给出对应命令。', 'See which plugins are loaded; enable or disable via app code with the CLI command.') + '</p></div>' +
    '<div class="cr-pbar">' +
      '<div class="cr-fpills"><span class="on">' + T('全部 21', 'All 21') + '</span><span>' + T('已启用 18', 'Enabled 18') + '</span><span>' + T('未启用 3', 'Disabled 3') + '</span></div>' +
      '<span class="cr-inp">' + I('search') + T('搜索名称或包名', 'Search plugins') + '</span>' +
    '</div>' +
    '<div class="st-card"><table class="st-tbl cr-plgtbl"><thead><tr><th>' + T('插件', 'Plugin') + '</th><th>' + T('版本', 'Version') + '</th><th>' + T('状态', 'Status') + '</th><th></th></tr></thead><tbody>' +
      '<tr class="cr-pgrp"><td colspan="4">' + T('已启用 18', 'Enabled 18') + '</td></tr>' +
      plgRow('并发控制', 'Concurrency', '锁和并发限制', 'Locks and concurrency limits', '0.1.0-beta.4') +
      plgRow('登录与认证', 'Authentication', '登录方式、会话和账号安全', 'Sign-in, sessions, and security', '2.0.0-beta.25') +
      plgRow('角色和权限', 'Authorization', '角色、权限和授权检查', 'Roles, permissions, and checks', '1.0.0-beta.39') +
      plgRow('默认访问规则', 'Default access', '新角色默认能看什么', 'Default scope for new roles', '1.0.0-beta.22') +
      plgRow('数据库', 'Database', '查看数据表和数据', 'Inspect tables and data', '1.0.0-beta.21') +
      plgRow('用户管理', 'Users', '成员、资料和邀请', 'Members, profiles, and invites', '2.0.0-beta.22') +
      plgRow('通知', 'Notifications', '通知类型和个人接收设置', 'Types and personal channels', '2.0.0-beta.10') +
    '</tbody></table></div>' +
  '</div>';

const blocksCrumb =
  '<span class="cr-crumb" data-cr-crumb="wf"><span>' + T('系统设置', 'System settings') + '</span>' + I('chevron-right') + '<span>' + T('流程管理', 'Workflows') + '</span>' + I('chevron-right') + '<b>' + T('合同审批与履约', 'Contract approval') + '</b></span>' +
  '<span class="cr-crumb" data-cr-crumb="roles" hidden><span>' + T('系统设置', 'System settings') + '</span>' + I('chevron-right') + '<span>' + T('角色和权限', 'Roles &amp; permissions') + '</span>' + I('chevron-right') + '<b>' + T('编辑角色', 'Edit role') + '</b></span>' +
  '<span class="cr-crumb" data-cr-crumb="auth" hidden><span>' + T('系统设置', 'System settings') + '</span>' + I('chevron-right') + '<b>' + T('登录与认证', 'Sign-in &amp; auth') + '</b></span>' +
  '<span class="cr-crumb" data-cr-crumb="db" hidden><span>' + T('系统设置', 'System settings') + '</span>' + I('chevron-right') + '<span>' + T('数据库', 'Database') + '</span>' + I('chevron-right') + '<b>account</b></span>' +
  '<span class="cr-crumb" data-cr-crumb="plugins" hidden><span>' + T('系统设置', 'System settings') + '</span>' + I('chevron-right') + '<b>' + T('插件', 'Plugins') + '</b></span>';

const blocks =
  '<div class="sv-win cr-app" data-live="core-blocks" data-tab="wf">' +
    coreNav('wf', true) +
    '<div class="cr-stage">' +
      '<div class="sv-top cr-top">' +
        '<span class="cr-top-mbrand"><img src="https://static-docs.nocobase.com/logo-nocobase.png" alt="NocoBase"><span>Core</span></span>' +
        '<span class="cr-tog" aria-hidden="true">' + I('panel-left') + '</span>' +
        blocksCrumb +
        '<span class="r"><span class="cr-uico" aria-hidden="true">' + I('mail') + '</span><span class="cr-uico" aria-hidden="true">' + I('bot') + '</span><span class="st-av">SA</span></span>' +
      '</div>' +
      '<div class="cr-canvas">' +
        '<div class="cr-msw" role="tablist" aria-label="NocoBase Core">' +
          '<button type="button" role="tab" data-cr-tab="wf" aria-selected="true">' + T('流程管理', 'Workflows') + '</button>' +
          '<button type="button" role="tab" data-cr-tab="roles" aria-selected="false">' + T('角色权限', 'Roles') + '</button>' +
          '<button type="button" role="tab" data-cr-tab="auth" aria-selected="false">' + T('登录认证', 'Auth') + '</button>' +
          '<button type="button" role="tab" data-cr-tab="db" aria-selected="false">' + T('数据库', 'Database') + '</button>' +
          '<button type="button" role="tab" data-cr-tab="plugins" aria-selected="false">' + T('插件', 'Plugins') + '</button>' +
        '</div>' +
        '<div class="cr-views">' + viewWf + viewRoles + viewAuth + viewDb + viewPlugins + '</div>' +
      '</div>' +
    '</div>' +
  '</div>';

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

// ---------- 3. 业务系统自带 AI 能力（一目了然的三段式运行闭环：底座内置 AI 能力 → 业务 Agent 主动执行 → 关键决策由人拍板） ----------
const AI_ARR =
  '<svg viewBox="0 0 32 16" fill="none" aria-hidden="true">' +
    '<path d="M2 8h25M21.5 3L27.5 8l-6 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
  '</svg>';

const ai = win(
  [['内置 AI 能力', 'Built-in AI'], ['业务 Agent 运行闭环', 'How business agents work']],
  '<div class="cr-ai-flow">' +
    '<div class="cr-ai-col cr-ai-base">' +
      '<div class="cr-ai-ch"><em>01</em><b>' + T('Core 底座内置能力', 'Built into Core') + '</b></div>' +
      '<div class="cr-ai-stack">' +
        '<div class="st-card cr-ai-cap">' +
          '<div class="cr-ai-chd"><span class="cr-ai-ic">' + I('cpu') + '</span><b>' + T('模型接入', 'Model services') + '</b><span class="cr-rtag">' + T('自由选择', 'BYO / Local') + '</span></div>' +
          '<p>' + T('Claude、GPT、DeepSeek 或本地私有模型，统一密钥与用量统计', 'Cloud or self-hosted local models under one key &amp; usage layer') + '</p>' +
        '</div>' +
        '<div class="st-card cr-ai-cap">' +
          '<div class="cr-ai-chd"><span class="cr-ai-ic">' + I('book-open') + '</span><b>' + T('AI 知识库', 'AI knowledge base') + '</b><span class="cr-rtag">' + T('有版本', 'Versioned') + '</span></div>' +
          '<p>' + T('企业制度、SOP 与业务资料，按权限检索、回答注明来源', 'Policies, SOPs &amp; docs with scoped search and cited answers') + '</p>' +
        '</div>' +
        '<div class="st-card cr-ai-cap">' +
          '<div class="cr-ai-chd"><span class="cr-ai-ic">' + I('shield-check') + '</span><b>' + T('权限与审计', 'Permissions &amp; audit') + '</b><span class="cr-rtag">' + T('与人同权', 'Scoped') + '</span></div>' +
          '<p>' + T('继承负责人角色与数据范围，每次调用与执行全程留痕', 'Inherits the owner’s exact role &amp; data scope with full logs') + '</p>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="cr-ai-conn" aria-hidden="true"><span>' + T('驱动', 'Powers') + '</span>' + AI_ARR + '</div>' +
    '<div class="cr-ai-col cr-ai-agent">' +
      '<div class="cr-ai-ch"><em>02</em><b>' + T('业务 Agent 主动执行', 'Business agent executes') + '</b></div>' +
      '<div class="st-card cr-ai-run">' +
        '<div class="cr-ai-rhd">' +
          '<span class="cr-ai-bot">' + I('bot') + '</span>' +
          '<div><b>' + T('采购考核 Agent', 'Supplier Review Agent') + '</b><span>' + T('入驻采购系统 · 季末自动触发', 'Embedded in Procurement · Quarterly') + '</span></div>' +
          '<span class="st-tag on">' + T('在岗', 'On duty') + '</span>' +
        '</div>' +
        '<ol class="cr-ai-steps">' +
          '<li><span class="cr-ai-sdot">' + I('database') + '</span><div><b>' + T('读取业务数据', 'Reads business data') + '</b><p>' + T('汇总 126 家供应商质检合格率与延期记录', 'Aggregates QA &amp; delay records for 126 suppliers') + '</p></div></li>' +
          '<li><span class="cr-ai-sdot">' + I('book-open') + '</span><div><b>' + T('检索知识库制度', 'Checks KB policy') + '</b><p>' + T('对照《供应商考核办法》v4，识别 2 家连续 D 级', 'Matches Policy v4 and flags 2 repeat Grade-D suppliers') + '</p></div></li>' +
          '<li><span class="cr-ai-sdot">' + I('file-check-2') + '</span><div><b>' + T('起草业务动作', 'Drafts action &amp; evidence') + '</b><p>' + T('生成 2 份暂停新订单审批单并附上 6 份质检依据', 'Prepares 2 order-hold approvals with 6 QA logs attached') + '</p></div></li>' +
        '</ol>' +
      '</div>' +
    '</div>' +
    '<div class="cr-ai-conn cr-ai-conn-h" aria-hidden="true"><span>' + T('交给人', 'Hands off') + '</span>' + AI_ARR + '</div>' +
    '<div class="cr-ai-col cr-ai-human">' +
      '<div class="cr-ai-ch"><em>03</em><b>' + T('关键操作由人拍板', 'Human confirms') + '</b></div>' +
      '<div class="st-card cr-ai-dec">' +
        '<div class="cr-ai-dtop">' +
          '<span class="cr-ai-dpill">' + I('user-check') + T('待采购经理确认', 'Manager sign-off') + '</span>' +
        '</div>' +
        '<div class="cr-ai-dbody">' +
          '<h4>' + T('暂停 2 家 D 级供应商新订单', 'Hold new orders for 2 Grade-D suppliers') + '</h4>' +
          '<div class="cr-ai-ev">' +
            '<div><span>' + T('涉及对象', 'Targets') + '</span><b>' + T('宏达塑胶、联创包装', 'Hongda, Lianchuang') + '</b></div>' +
            '<div><span>' + T('附带依据', 'Evidence') + '</span><b>' + T('6 份质检记录 · 《考核办法》v4', '6 QA logs · Policy v4') + '</b></div>' +
            '<div><span>' + T('执行权限', 'Scope') + '</span><b>' + T('与采购经理账号一致', 'Same as manager role') + '</b></div>' +
          '</div>' +
          '<div class="cr-ai-dacts"><span class="st-btn p">' + I('check') + T('批准并流转审批', 'Approve &amp; route') + '</span><span class="st-btn">' + T('退回', 'Return') + '</span></div>' +
        '</div>' +
        '<div class="cr-ai-dft">' + I('lock-keyhole') + T('未获确认绝不写入 · 全程留痕可追溯', 'No write without approval · Full audit trail') + '</div>' +
      '</div>' +
    '</div>' +
  '</div>',
  '<span class="st-tag on">' + T('7×24 运行中', '24/7 Active') + '</span>',
);

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
/* 首页 Core 段与 Core 页首屏：对照真实 Core 系统设置界面（由 homepage/scripts/figs/home-core.mjs 写入，改样式请改脚本） */
.cr-body { padding: 14px 16px 16px; }
/* 1. 真实 Core 双栏应用壳：左侧通栏白底菜单 + 右侧顶栏面包屑与浅蓝渐变内容区 */
.sv-win.cr-app { display: grid; grid-template-columns: 182px minmax(0, 1fr); align-items: stretch; }
.cr-side { display: flex; flex-direction: column; background: var(--card); border-inline-end: 1px solid var(--rule); min-inline-size: 0; }
.cr-side-top { display: flex; align-items: center; block-size: 40px; padding-inline: 12px; border-block-end: 1px solid var(--rule); flex: none; }
.cr-side-top .sv-brand img { height: 15px; width: auto; display: block; }
.cr-nav { display: flex; flex-direction: column; gap: 1.5px; padding: 7px 8px 10px; }
.cr-back { display: flex; align-items: center; gap: 6px; block-size: 23px; padding-inline: 7px; margin-block-end: 2px; font-size: 11px; color: var(--muted); }
.cr-back svg.lucide { width: 12px; height: 12px; }
.cr-ng { padding: 7px 7px 2px; font-size: 10px; font-weight: 500; color: var(--muted); line-height: 1.25; }
.cr-ni { display: flex; align-items: center; gap: 7px; block-size: 23px; padding-inline: 7px; border-radius: 6px; font-size: 11.5px; color: var(--ink-2); white-space: nowrap; }
.cr-ni > span { min-inline-size: 0; overflow: hidden; text-overflow: ellipsis; }
.cr-ni svg.lucide { width: 12.5px; height: 12.5px; color: var(--muted); flex: none; }
.cr-ni-btn { position: relative; overflow: clip; inline-size: 100%; border: 0; background: none; font: inherit; font-size: 11.5px; text-align: left; cursor: pointer; transition: background 0.15s, color 0.15s; }
.cr-ni-btn:hover { background: var(--paper-2); color: var(--ink); }
.cr-ni-btn .cr-dot { margin-inline-start: auto; width: 4.5px; height: 4.5px; border-radius: 50%; background: var(--rule-2); flex: none; transition: background 0.15s; }
.cr-ni.on,
.cr-ni-btn[aria-selected="true"] { background: var(--brand-tint); color: var(--brand); font-weight: 550; }
.cr-ni.on svg.lucide,
.cr-ni-btn[aria-selected="true"] svg.lucide { color: var(--brand); }
.cr-ni-btn[aria-selected="true"] .cr-dot { background: var(--brand); }
.cr-ni-btn[aria-selected="true"]::before { content: ""; position: absolute; inset: 4px auto 4px 0; border-inline-start: 2px solid var(--brand); }
.cr-ni-btn[aria-selected="true"]::after { content: ""; position: absolute; inset: auto 0 0; border-block-end: 1.5px solid oklch(0.52 0.2 266 / 0.45); transform-origin: left; animation: crBar 3s linear; }
@keyframes crBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.cr-stage { display: flex; flex-direction: column; min-inline-size: 0; background: var(--paper); }
.cr-top { block-size: 40px; padding-inline: 14px; background: var(--card); gap: 7px; font-size: 12px; }
.cr-top-mbrand { display: none; }
.cr-tog { display: inline-flex; align-items: center; color: var(--muted); padding-inline-end: 4px; border-inline-end: 1px solid var(--rule); }
.cr-tog svg.lucide { width: 13px; height: 13px; }
.cr-crumb { display: inline-flex; align-items: center; gap: 5px; min-inline-size: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cr-crumb svg.lucide { width: 12px; height: 12px; color: var(--rule-2); flex: none; }
.cr-uico { display: inline-grid; place-items: center; width: 23px; height: 23px; border-radius: 50%; border: 1px solid var(--rule); color: var(--ink-2); }
.cr-uico svg.lucide { width: 11.5px; height: 11.5px; }
.cr-top .st-av { width: 23px; height: 23px; font-size: 10px; }
.cr-canvas { flex: 1; display: grid; align-content: start; gap: 10px; padding: 14px 18px 16px; background: radial-gradient(240px 140px at 96% 4%, oklch(0.52 0.2 266 / 0.085), transparent 70%), linear-gradient(180deg, oklch(0.955 0.018 266 / 0.52) 0%, var(--paper) 108px); min-inline-size: 0; }
.cr-msw { display: none; }
.cr-views { display: grid; min-inline-size: 0; }
.cr-view { display: grid; gap: 10px; align-content: start; min-inline-size: 0; }
.cr-view[hidden] { display: none; }
/* 真实页面头：粗体标题 + 一句说明 + 细底线二级导航 */
.cr-ph { display: grid; gap: 3px; }
.cr-ph-t { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.cr-ph h4 { font-size: 16.5px; line-height: 1.3; font-weight: 650; color: var(--ink); letter-spacing: -0.01em; }
.cr-ph p { font-size: 11.5px; line-height: 1.5; color: var(--muted); }
.cr-ver { display: inline-flex; align-items: center; height: 18px; padding: 0 5px; border-radius: 4px; background: var(--paper-2); border: 1px solid var(--rule); font-size: 10.5px; color: var(--ink-2); }
.cr-meta { font-size: 11px; color: var(--muted); }
.cr-utabs { display: flex; align-items: center; gap: 16px; border-block-end: 1px solid var(--rule); padding-block-end: 6px; font-size: 11.5px; color: var(--muted); }
.cr-utabs span { position: relative; padding-block-end: 6px; margin-block-end: -7px; white-space: nowrap; }
.cr-utabs span.on { color: var(--ink); font-weight: 600; border-block-end: 2px solid var(--ink); }
.cr-card-hd { padding: 9px 12px; font-size: 12px; font-weight: 600; color: var(--ink); border-block-end: 1px solid var(--rule); }
/* 1a. 流程管理：合同审批与履约（真实状态流程图 + 右侧流程参数卡） */
.cr-wf-grid { display: grid; grid-template-columns: minmax(0, 1fr) 222px; gap: 11px; align-items: start; }
.cr-wf-box { overflow: clip; }
.cr-wf-stage { position: relative; block-size: 342px; background: radial-gradient(var(--rule) 0.75px, transparent 0.75px) 0 0 / 15px 15px, var(--paper); overflow: clip; }
.cr-wf-svg { position: absolute; inset: 0; inline-size: 100%; block-size: 100%; color: var(--rule-2); pointer-events: none; }
.cr-wf-svg path { fill: none; stroke: currentColor; stroke-width: 1.25; }
.cr-wf-svg path.cr-wf-alt { stroke: oklch(0.72 0.04 262); }
.cr-wfn { position: absolute; transform: translate(-50%, -50%); display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; background: var(--card); border: 1px solid var(--rule-2); border-radius: 8px; box-shadow: 0 1px 2px oklch(0.25 0.05 266 / 0.04); transition: border-color 0.25s; }
.cr-wfn-start { height: 28px; padding: 0 16px; border-radius: 999px; font-size: 11.5px; font-weight: 550; color: var(--ink); }
.cr-wfn-start svg.lucide { width: 11px; height: 11px; color: var(--ink-2); }
.cr-wfn-void { height: 28px; padding: 0 12px; border-radius: 999px; border-style: dashed; border-color: oklch(0.75 0.1 25); background: var(--risk-tint); color: var(--risk-ink); font-size: 11.5px; font-weight: 550; box-shadow: none; }
.cr-wfn-void svg.lucide { width: 11.5px; height: 11.5px; }
.cr-wfn-end { height: 22px; padding: 0 8px; border: 0; background: transparent; box-shadow: none; font-size: 11px; color: var(--muted); gap: 4px; }
.cr-wfn-end svg.lucide { width: 11.5px; height: 11.5px; }
.cr-wfn-step { min-inline-size: 114px; height: 34px; padding: 0 12px 0 8px; }
.cr-wfn-step b { font-size: 11.5px; font-weight: 600; color: var(--ink); }
.cr-wfic { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 5px; background: var(--brand); color: var(--on-brand); flex: none; }
.cr-wfic.ok { background: var(--pass); }
.cr-wfic svg.lucide { width: 11.5px; height: 11.5px; }
.cr-wfl { position: absolute; transform: translate(-50%, -50%); padding: 1px 6px; border-radius: 4px; background: var(--paper-2); border: 1px solid var(--rule); font-size: 9.5px; color: var(--ink-2); white-space: nowrap; line-height: 1.4; }
.cr-view.on .cr-wf-s1 { animation: wfStep 3s ease infinite 0s; }
.cr-view.on .cr-wf-s2 { animation: wfStep 3s ease infinite 0.55s; }
.cr-view.on .cr-wf-s3 { animation: wfStep 3s ease infinite 1.1s; }
.cr-view.on .cr-wf-s4 { animation: wfStep 3s ease infinite 1.65s; }
.cr-view.on .cr-wf-s5 { animation: wfStep 3s ease infinite 2.2s; }
@keyframes wfStep { 0%, 26%, 100% { border-color: var(--rule-2); } 10%, 18% { border-color: var(--brand); } }
.cr-wf-param { padding-block-end: 12px; }
.cr-param-row { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; padding: 10px 11px 6px; font-size: 10.5px; color: var(--ink-2); }
.cr-param-row span { white-space: nowrap; }
.cr-param-row b { font-size: 11.5px; font-weight: 650; color: var(--ink); font-variant-numeric: tabular-nums; white-space: nowrap; }
.cr-param-hint { padding: 0 11px; font-size: 10.5px; line-height: 1.5; color: var(--muted); }
/* 1b & 1d 共用分栏卡片（角色列表 / 数据库表列表） */
.cr-split { display: grid; overflow: clip; }
.cr-roles-split { grid-template-columns: 152px minmax(0, 1fr); }
.cr-db-split { grid-template-columns: 162px minmax(0, 1fr); }
.cr-split-l { display: flex; flex-direction: column; gap: 6px; padding: 9px 8px; border-inline-end: 1px solid var(--rule); background: var(--card); min-inline-size: 0; }
.cr-split-r { display: flex; flex-direction: column; min-inline-size: 0; background: var(--card); }
.cr-sbar { display: flex; align-items: center; gap: 5px; }
.cr-inp { display: inline-flex; align-items: center; gap: 5px; flex: 1; min-inline-size: 0; height: 24px; padding: 0 7px; border: 1px solid var(--rule); border-radius: 6px; background: var(--paper); font-size: 10.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cr-inp svg.lucide { width: 11px; height: 11px; flex: none; }
.cr-plus { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 6px; background: var(--brand); color: var(--on-brand); flex: none; }
.cr-plus svg.lucide { width: 12px; height: 12px; }
.cr-rlist { display: grid; gap: 2px; }
.cr-role-it { display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 5px 7px; border-radius: 6px; }
.cr-role-it.on { background: var(--brand-tint); }
.cr-role-it b { display: block; font-size: 11px; font-weight: 550; color: var(--ink); line-height: 1.3; }
.cr-role-it.on b { color: var(--brand); }
.cr-role-it small { display: block; font-size: 9.5px; color: var(--muted); line-height: 1.25; }
.cr-rbadge { padding: 1px 5px; border-radius: 4px; background: var(--paper-2); border: 1px solid var(--rule); font-size: 9.5px; color: var(--ink-2); white-space: nowrap; }
.cr-rh { display: flex; align-items: baseline; gap: 7px; padding: 9px 12px 6px; }
.cr-rh b { font-size: 13px; font-weight: 650; color: var(--ink); }
.cr-rh span { font-size: 10.5px; color: var(--muted); }
.cr-cnt-r { margin-inline-start: auto; }
.cr-stabs { display: flex; align-items: center; gap: 12px; padding: 0 12px 6px; border-block-end: 1px solid var(--rule); font-size: 11px; color: var(--muted); }
.cr-stabs span { display: inline-flex; align-items: center; gap: 4px; position: relative; padding-block-end: 6px; margin-block-end: -7px; white-space: nowrap; }
.cr-stabs svg.lucide { width: 11.5px; height: 11.5px; }
.cr-stabs span.on { color: var(--brand); font-weight: 600; border-block-end: 2px solid var(--brand); }
.cr-ptbl th, .cr-ptbl td { padding: 5.5px 9px; font-size: 11px; }
.cr-ptbl td b { display: inline; font-size: 11px; font-weight: 550; }
.cr-cnt { font-size: 10px; color: var(--muted); margin-inline-start: 2px; }
.cr-pgrp td { padding: 4.5px 9px !important; background: var(--paper); font-size: 10.5px !important; font-weight: 600; color: var(--ink-2); }
.cr-pgrp em { font-style: normal; font-weight: 400; color: var(--muted); margin-inline-start: 4px; }
.cr-chks { display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: center; }
.cr-chk { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; color: var(--ink-2); white-space: nowrap; }
.cr-chk i { display: inline-grid; place-items: center; width: 11px; height: 11px; border-radius: 3px; border: 1px solid var(--rule-2); background: var(--card); flex: none; }
.cr-chk.on i { border-color: var(--brand); background: var(--brand); }
.cr-chk.on i::after { content: ""; width: 5px; height: 3px; border-left: 1.5px solid var(--on-brand); border-bottom: 1.5px solid var(--on-brand); transform: rotate(-45deg) translate(0.5px, -0.5px); }
.cr-risk { font-style: normal; padding: 0 4px; border-radius: 3px; background: var(--risk-tint); color: var(--risk-ink); font-size: 9px; font-weight: 600; line-height: 15px; }
.cr-risk.w { background: var(--human-tint); color: var(--human-ink); }
/* 1c. 登录与认证：提示条 + 登录方式表 */
.cr-warn { display: flex; align-items: flex-start; gap: 8px; padding: 7px 10px; border: 1px solid oklch(0.84 0.08 82); border-radius: 8px; background: var(--human-tint); color: var(--on-human); font-size: 11px; line-height: 1.45; }
.cr-warn svg.lucide { width: 13px; height: 13px; color: var(--human-ink); margin-block-start: 2px; flex: none; }
.cr-warn b { font-weight: 600; margin-inline-end: 6px; }
.cr-warn span { color: var(--human-ink); }
.cr-atbl th, .cr-atbl td,
.cr-plgtbl th, .cr-plgtbl td,
.cr-ftbl th, .cr-ftbl td { padding: 6px 10px; font-size: 11px; }
.cr-atbl td b, .cr-plgtbl td b { font-size: 11.5px; }
.cr-atbl td small, .cr-plgtbl td small { font-size: 10px; }
.cr-code { display: inline-block; padding: 1px 6px; border-radius: 4px; background: var(--paper-2); font: 500 10.5px/1.45 var(--f-mono); color: var(--ink-2); white-space: nowrap; }
.cr-st { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 999px; background: var(--paper-2); font-size: 10px; font-weight: 550; color: var(--muted); white-space: nowrap; }
.cr-st i { width: 5px; height: 5px; border-radius: 50%; border: 1.2px solid currentColor; flex: none; }
.cr-st.on { background: var(--pass-tint); color: var(--pass-ink); }
.cr-st.on i { background: var(--pass); border-color: var(--pass); }
.cr-src-pill { display: inline-flex; align-items: center; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10px; font-weight: 550; white-space: nowrap; }
.cr-src-pill.cfg { background: var(--info-tint); color: var(--info-ink); }
.cr-src-pill.code { background: var(--brand-tint); color: var(--brand); }
.cr-dash { color: var(--rule-2); }
.cr-mbtn { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 5px; border: 1px solid var(--rule-2); background: var(--card); font-size: 10.5px; font-weight: 500; color: var(--ink); white-space: nowrap; }
.cr-atbl td.r, .cr-plgtbl td.r { text-align: right; }
/* 1d. 数据库：左侧连接与表清单 + 右侧字段表 */
.cr-db-conn { display: grid; gap: 4px; padding-block-end: 6px; border-block-end: 1px solid var(--rule); }
.cr-db-conn small { font-size: 10px; font-weight: 600; color: var(--ink-2); }
.cr-sel { display: flex; align-items: center; justify-content: space-between; height: 24px; padding: 0 8px; border: 1px solid var(--rule-2); border-radius: 6px; background: var(--card); font-size: 11px; color: var(--ink); }
.cr-sel svg.lucide { width: 12px; height: 12px; color: var(--muted); }
.cr-db-meta { display: flex; align-items: center; gap: 5px; font-size: 9.5px; color: var(--muted); }
.cr-db-meta em { font-style: normal; padding: 0 4px; border-radius: 3px; background: var(--paper-2); color: var(--ink-2); font-weight: 550; }
.cr-db-s { display: grid; gap: 4px; }
.cr-db-s small { font-size: 10px; color: var(--muted); padding-inline: 2px; }
.cr-tlist { display: grid; gap: 1px; }
.cr-tbit { display: flex; align-items: center; gap: 6px; height: 24px; padding-inline: 7px; border-radius: 6px; font-size: 11px; color: var(--ink-2); }
.cr-tbit svg.lucide { width: 11.5px; height: 11.5px; color: var(--muted); flex: none; }
.cr-tbit.on { background: var(--brand-tint); color: var(--brand); font-weight: 600; }
.cr-tbit.on svg.lucide { color: var(--brand); }
.cr-db-bar { padding: 0 12px 8px; display: flex; }
.cr-fname { font-size: 11px; font-weight: 550; color: var(--ink); }
.cr-pk { display: inline-flex; align-items: center; gap: 2px; margin-inline-start: 5px; padding: 0 5px; border-radius: 4px; background: var(--paper-2); font-size: 9.5px; color: var(--ink-2); vertical-align: 1px; }
.cr-pk svg.lucide { width: 9.5px; height: 9.5px; color: var(--muted); }
.cr-raw { font-size: 10px; color: var(--muted); margin-inline-start: 3px; }
/* 1e. 插件：筛选胶囊 + 清单表 */
.cr-pbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.cr-pbar .cr-inp { flex: 0 1 170px; background: var(--card); }
.cr-fpills { display: flex; align-items: center; gap: 6px; }
.cr-fpills span { display: inline-flex; align-items: center; height: 23px; padding: 0 9px; border-radius: 999px; border: 1px solid var(--rule); background: var(--card); font-size: 11px; color: var(--ink-2); }
.cr-fpills span.on { border-color: var(--rule-2); background: var(--paper-2); color: var(--ink); font-weight: 600; }
.cr-ver-c { font-size: 10.5px !important; color: var(--ink-2); white-space: nowrap; }
.cr-src { display: inline-flex; align-items: center; height: 18px; padding: 0 6px; border-radius: 4px; border: 1px solid var(--rule); background: var(--paper); font: 500 10.5px/1 var(--f-mono); color: var(--ink-2); vertical-align: 1px; margin-inline-start: 4px; }
.cr-pane { display: flex; flex-direction: column; overflow: clip; }
@media (prefers-reduced-motion: reduce) { .cr-ni-btn[aria-selected="true"]::after, .cr-view.on [class*="cr-wf-s"] { animation: none; } }
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
/* 业务系统自带 AI：三段式运行闭环（Core 底座内置能力 → 业务 Agent 主动执行 → 关键决策由人拍板） */
.cr-body:has(> .cr-ai-flow),
.cr-body:has(> .cr-arch-ops) { align-content: stretch; }
.cr-ai-flow { display: grid; grid-template-columns: minmax(0, 1fr) 44px minmax(0, 1.14fr) 44px minmax(0, 1.02fr); align-items: stretch; height: 100%; padding: 14px; border: 1px solid var(--rule); border-radius: 10px; background: radial-gradient(var(--rule-2) 0.85px, transparent 0.85px) 0 0 / 16px 16px, var(--paper); }
.cr-ai-col { min-width: 0; display: flex; flex-direction: column; gap: 9px; }
.cr-ai-ch { display: flex; align-items: center; gap: 6px; padding-inline: 2px; }
.cr-ai-ch em { display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 5px; background: var(--brand-tint); font: 700 10px/1 var(--f-mono); color: var(--brand); flex: none; }
.cr-ai-human .cr-ai-ch em { background: var(--human-tint); color: var(--human-ink); }
.cr-ai-ch b { font-size: 12px; font-weight: 650; color: var(--ink); white-space: nowrap; }
.cr-ai-stack { flex: 1; display: grid; grid-template-rows: repeat(3, 1fr); gap: 8px; }
.cr-ai-cap { padding: 10px 11px; display: flex; flex-direction: column; justify-content: center; gap: 5px; background: var(--card); border-color: var(--rule-2); }
.cr-ai-chd { display: flex; align-items: center; gap: 6px; }
.cr-ai-ic { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 6px; background: var(--brand-tint); color: var(--brand); flex: none; }
.cr-ai-ic svg.lucide { width: 12.5px; height: 12.5px; }
.cr-ai-chd b { font-size: 12.5px; font-weight: 650; color: var(--ink); }
.cr-ai-chd .cr-rtag { margin-left: auto; }
.cr-ai-cap p { font-size: 11px; line-height: 1.5; color: var(--muted); }
.cr-ai-conn { align-self: center; display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--brand); padding-top: 22px; }
.cr-ai-conn span { font-size: 10px; font-weight: 600; white-space: nowrap; }
.cr-ai-conn svg { width: 32px; height: 14px; display: block; }
.cr-ai-conn-h { color: var(--human-ink); }
.cr-ai-run { flex: 1; display: flex; flex-direction: column; overflow: hidden; border-color: color-mix(in oklch, var(--brand) 36%, var(--rule)); box-shadow: 0 2px 12px -6px oklch(0.52 0.2 266 / 0.18); }
.cr-ai-rhd { display: flex; align-items: center; gap: 9px; padding: 11px 12px; border-bottom: 1px solid var(--rule); background: linear-gradient(180deg, var(--brand-tint) 0%, var(--card) 100%); }
.cr-ai-bot { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; background: var(--brand); color: var(--on-brand); flex: none; }
.cr-ai-bot svg.lucide { width: 15px; height: 15px; }
.cr-ai-rhd > div { min-width: 0; }
.cr-ai-rhd b { display: block; font-size: 13px; font-weight: 650; color: var(--ink); line-height: 1.3; }
.cr-ai-rhd > div span { display: block; margin-top: 1px; font-size: 10.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cr-ai-rhd .st-tag { margin-left: auto; flex: none; }
.cr-ai-steps { flex: 1; list-style: none; margin: 0; padding: 12px 12px 13px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; background: var(--card); }
.cr-ai-steps li { position: relative; display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 9px; align-items: start; }
.cr-ai-steps li:not(:last-child)::before { content: ""; position: absolute; left: 11.5px; top: 26px; bottom: -10px; width: 1px; background: var(--rule-2); }
.cr-ai-sdot { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 7px; background: var(--paper-2); border: 1px solid var(--rule); color: var(--brand); }
.cr-ai-sdot svg.lucide { width: 12.5px; height: 12.5px; }
.cr-ai-steps b { display: block; font-size: 12px; font-weight: 650; color: var(--ink); line-height: 1.35; }
.cr-ai-steps p { margin-top: 2px; font-size: 11px; line-height: 1.5; color: var(--ink-2); }
.cr-ai-dec { flex: 1; display: flex; flex-direction: column; overflow: hidden; border-color: oklch(0.82 0.08 82); box-shadow: 0 2px 12px -6px oklch(0.62 0.14 75 / 0.18); }
.cr-ai-dtop { padding: 10px 12px; border-bottom: 1px solid var(--rule); background: var(--human-tint); }
.cr-ai-dpill { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 650; color: var(--human-ink); }
.cr-ai-dpill svg.lucide { width: 13px; height: 13px; }
.cr-ai-dbody { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 10px; background: var(--card); }
.cr-ai-dbody h4 { font-size: 13px; font-weight: 650; line-height: 1.4; color: var(--ink); }
.cr-ai-ev { display: grid; gap: 6px; padding: 9px 10px; border: 1px solid var(--rule); border-radius: 8px; background: var(--paper); }
.cr-ai-ev > div { display: grid; gap: 1px; }
.cr-ai-ev span { font-size: 10px; font-weight: 500; color: var(--muted); }
.cr-ai-ev b { font-size: 11.5px; font-weight: 600; color: var(--ink); line-height: 1.4; }
.cr-ai-dacts { display: flex; align-items: center; gap: 7px; margin-top: auto; padding-top: 2px; }
.cr-ai-dacts .st-btn { height: 28px; font-size: 11.5px; }
.cr-ai-dacts .st-btn.p { flex: 1; justify-content: center; }
.cr-ai-dft { display: flex; align-items: center; gap: 5px; padding: 8px 12px; border-top: 1px solid var(--rule); background: var(--paper); font-size: 10.5px; font-weight: 500; color: var(--ink-2); }
.cr-ai-dft svg.lucide { width: 11.5px; height: 11.5px; color: var(--pass); flex: none; }
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
  .stv-mobile-fig .sv-win.cr-app { grid-template-columns: minmax(0, 1fr); }
  .stv-mobile-fig .cr-side { display: none; }
  .stv-mobile-fig .cr-top { block-size: 32px; padding-inline: 10px; gap: 6px; font-size: 10.5px; }
  .stv-mobile-fig .cr-top-mbrand { display: inline-flex; align-items: center; gap: 6px; padding-inline-end: 6px; border-inline-end: 1px solid var(--rule); flex: none; }
  .stv-mobile-fig .cr-top-mbrand img { height: 12px; width: auto; }
  .stv-mobile-fig .cr-top-mbrand span { font-size: 10px; color: var(--muted); }
  .stv-mobile-fig .cr-tog,
  .stv-mobile-fig .cr-uico,
  .stv-mobile-fig .cr-crumb > span,
  .stv-mobile-fig .cr-crumb > svg.lucide { display: none; }
  .stv-mobile-fig .cr-top .st-av { width: 18px; height: 18px; font-size: 8.5px; }
  .stv-mobile-fig .cr-canvas { padding: 8px 9px 9px; gap: 7px; }
  .stv-mobile-fig .cr-arch { grid-template-columns: minmax(0, 1fr); gap: 7px; }
  /* 1. 基础能力（移动端单行可横向滚动 5 项切换条，全部收齐在 344px 内） */
  .stv-mobile-fig .cr-msw { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; scroll-snap-type: inline proximity; padding: 3px; border-radius: 8px; background: var(--paper-2); border: 1px solid var(--rule); }
  .stv-mobile-fig .cr-msw::-webkit-scrollbar { display: none; }
  .stv-mobile-fig .cr-msw button { position: relative; flex: none; scroll-snap-align: start; height: 23px; padding: 0 9px; border: 0; border-radius: 6px; background: transparent; font: 550 10px/1 var(--f-sans); color: var(--ink-2); cursor: pointer; white-space: nowrap; }
  .stv-mobile-fig .cr-msw button[aria-selected="true"] { background: var(--card); color: var(--brand); }
  .stv-mobile-fig .cr-msw button[aria-selected="true"]::after { content: ""; position: absolute; inset: auto 6px 1px; border-block-end: 2px solid var(--brand); }
  .stv-mobile-fig .cr-ph,
  .stv-mobile-fig .cr-utabs,
  .stv-mobile-fig .cr-warn { display: none; }
  .stv-mobile-fig .cr-view { gap: 6px; }
  /* 移动端流程图 */
  .stv-mobile-fig .cr-wf-grid { grid-template-columns: minmax(0, 1fr); gap: 6px; }
  .stv-mobile-fig .cr-wf-param { display: none; }
  .stv-mobile-fig .cr-card-hd { padding: 5px 9px; font-size: 10.5px; }
  .stv-mobile-fig .cr-wf-stage { block-size: 222px; }
  .stv-mobile-fig .cr-wfn-start { height: 22px; padding: 0 10px; font-size: 9.5px; }
  .stv-mobile-fig .cr-wfn-void { height: 22px; padding: 0 8px; font-size: 9.5px; }
  .stv-mobile-fig .cr-wfn-end { font-size: 9px; }
  .stv-mobile-fig .cr-wfn-step { min-inline-size: 86px; height: 26px; padding: 0 8px 0 5px; gap: 4px; border-radius: 6px; }
  .stv-mobile-fig .cr-wfn-step b { font-size: 9.5px; }
  .stv-mobile-fig .cr-wfic { width: 15px; height: 15px; border-radius: 4px; }
  .stv-mobile-fig .cr-wfic svg.lucide { width: 9px; height: 9px; }
  .stv-mobile-fig .cr-wfl { font-size: 8px; padding: 0 4px; }
  /* 移动端分栏视图（角色 / 数据库）隐藏左侧列表、聚焦右侧主表 */
  .stv-mobile-fig .cr-roles-split,
  .stv-mobile-fig .cr-db-split { grid-template-columns: minmax(0, 1fr); }
  .stv-mobile-fig .cr-split-l { display: none; }
  .stv-mobile-fig .cr-rh { padding: 6px 9px 4px; }
  .stv-mobile-fig .cr-rh b { font-size: 11px; }
  .stv-mobile-fig .cr-stabs { padding: 0 9px 4px; gap: 8px; font-size: 9.5px; }
  .stv-mobile-fig .cr-db-bar { display: none; }
  .stv-mobile-fig .cr-ptbl th, .stv-mobile-fig .cr-ptbl td,
  .stv-mobile-fig .cr-atbl th, .stv-mobile-fig .cr-atbl td,
  .stv-mobile-fig .cr-ftbl th, .stv-mobile-fig .cr-ftbl td,
  .stv-mobile-fig .cr-plgtbl th, .stv-mobile-fig .cr-plgtbl td { padding: 4px 7px; font-size: 9.5px; }
  .stv-mobile-fig .cr-ptbl th:nth-child(2), .stv-mobile-fig .cr-ptbl td:nth-child(2),
  .stv-mobile-fig .cr-atbl th:nth-child(2), .stv-mobile-fig .cr-atbl td:nth-child(2),
  .stv-mobile-fig .cr-atbl th:nth-child(4), .stv-mobile-fig .cr-atbl td:nth-child(4),
  .stv-mobile-fig .cr-ftbl th:nth-child(4), .stv-mobile-fig .cr-ftbl td:nth-child(4),
  .stv-mobile-fig .cr-plgtbl th:nth-child(2), .stv-mobile-fig .cr-plgtbl td:nth-child(2) { display: none; }
  .stv-mobile-fig .cr-pbar { gap: 6px; }
  .stv-mobile-fig .cr-pbar .cr-inp { display: none; }
  .stv-mobile-fig .cr-fpills span { height: 20px; padding: 0 7px; font-size: 9.5px; }
  .stv-mobile-fig .cr-atbl tbody tr:nth-child(n+6),
  .stv-mobile-fig .cr-ftbl tbody tr:nth-child(n+7),
  .stv-mobile-fig .cr-plgtbl tbody tr:nth-child(n+7) { display: none; }
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
  /* 3. 业务系统自带 AI（移动端：精简三段竖排） */
  .stv-mobile-fig .cr-body:has(> .cr-ai-flow),
  .stv-mobile-fig .cr-body:has(> .cr-arch-ops) { align-content: start; }
  .stv-mobile-fig .cr-ai-flow { grid-template-columns: minmax(0, 1fr); gap: 7px; padding: 8px; height: auto; }
  .stv-mobile-fig .cr-ai-conn { display: none; }
  .stv-mobile-fig .cr-ai-ch { gap: 5px; }
  .stv-mobile-fig .cr-ai-ch b { font-size: 10.5px; }
  .stv-mobile-fig .cr-ai-stack { grid-template-rows: auto; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }
  .stv-mobile-fig .cr-ai-cap { padding: 6px 7px; gap: 2px; }
  .stv-mobile-fig .cr-ai-chd { gap: 4px; }
  .stv-mobile-fig .cr-ai-ic { width: 16px; height: 16px; border-radius: 4px; }
  .stv-mobile-fig .cr-ai-ic svg.lucide { width: 10px; height: 10px; }
  .stv-mobile-fig .cr-ai-chd b { font-size: 10px; }
  .stv-mobile-fig .cr-ai-chd .cr-rtag,
  .stv-mobile-fig .cr-ai-cap p { display: none; }
  .stv-mobile-fig .cr-ai-rhd { padding: 7px 9px; gap: 7px; }
  .stv-mobile-fig .cr-ai-bot { width: 22px; height: 22px; border-radius: 6px; }
  .stv-mobile-fig .cr-ai-bot svg.lucide { width: 12px; height: 12px; }
  .stv-mobile-fig .cr-ai-rhd b { font-size: 11px; }
  .stv-mobile-fig .cr-ai-rhd > div span { font-size: 9.5px; }
  .stv-mobile-fig .cr-ai-steps { padding: 7px 9px; gap: 6px; }
  .stv-mobile-fig .cr-ai-steps li { grid-template-columns: 18px minmax(0, 1fr); gap: 6px; }
  .stv-mobile-fig .cr-ai-steps li:not(:last-child)::before { left: 8.5px; top: 20px; bottom: -6px; }
  .stv-mobile-fig .cr-ai-sdot { width: 18px; height: 18px; border-radius: 5px; }
  .stv-mobile-fig .cr-ai-sdot svg.lucide { width: 10px; height: 10px; }
  .stv-mobile-fig .cr-ai-steps b { font-size: 10.5px; }
  .stv-mobile-fig .cr-ai-steps p { font-size: 9.5px; line-height: 1.4; }
  .stv-mobile-fig .cr-ai-dtop { padding: 6px 9px; }
  .stv-mobile-fig .cr-ai-dpill { font-size: 10px; }
  .stv-mobile-fig .cr-ai-dbody { padding: 8px 9px; gap: 6px; }
  .stv-mobile-fig .cr-ai-dbody h4 { font-size: 11px; }
  .stv-mobile-fig .cr-ai-ev { display: none; }
  .stv-mobile-fig .cr-ai-dacts .st-btn { height: 23px; font-size: 10px; }
  .stv-mobile-fig .cr-ai-dft { display: none; }
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
