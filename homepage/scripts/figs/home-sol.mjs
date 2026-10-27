// 首页 Solutions：六款应用各一张专属图，组合成 <template>，插到首页 Solutions 段里。
// 已上线的 NocoCRM、NocoITAM、NocoReach 取自各自内页（content/pages/solution-*.body.html，经 lib/pages.mjs 的 renderBilingual 展开）里最核心的图；还没上线的三款在这里直接画。
// 首页按 880 宽排（和 Studio 段的图同一字号），图要和 Studio 段的图差不多高，放不下的内容在这里删减，内页不受影响。
// 写进 content/pages/home.html 的 <!-- SOLTPL --> 标记之间（<template id="tpl-…">），同一批图也写成 content/pages/snips/sol*.html。
// 用法（在 html 目录下）：node scripts/figs/home-sol.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENT } from '../../src/lib/paths.mjs';
import { renderBilingual } from '../../src/lib/pages.mjs';

const here = join(CONTENT, 'pages');
const rd = page => renderBilingual(page.slice(0, -'.html'.length));
const T = (zh, en) => `<t-zh>${zh}</t-zh><t-en>${en}</t-en>`;

// 同 Python 的 str.rfind(sub, start, end)：只找完整落在 s[start:end] 里的位置
function rfind(s, sub, start, end) {
  if (end < 0) end += s.length;
  const k = s.lastIndexOf(sub, end - sub.length);
  return end - sub.length < 0 || k < start ? -1 : k;
}
// 同 Python 的 str.index：找不到就报错
function index(s, sub) {
  const k = s.indexOf(sub);
  if (k < 0) throw new Error(`substring not found: ${sub}`);
  return k;
}

function balanced(s, k) {
  let depth = 0;
  for (const m of s.slice(k).matchAll(/<div\b|<\/div>/g)) {
    depth += m[0] === '<div' ? 1 : -1;
    if (depth === 0) return s.slice(k, k + m.index + m[0].length);
  }
}

// 内页「wow」段大图里 .sx-body 的内容（不含外层）
function wow_body(page) {
  const s = rd(page);
  const i = s.indexOf('<section class="sec wow');
  const sec = s.slice(i, s.indexOf('</section>', i));
  const body = balanced(sec, sec.indexOf('<div class="sx-body">'));
  return body.slice('<div class="sx-body">'.length, -'</div>'.length);
}

// 删掉时间线里这些时刻的行（每行是 <time> 所在的那个 div）
function drop_tl(html, times) {
  for (const t of times) {
    const k = rfind(html, '<div class="', 0, index(html, `<time>${t}</time>`));
    const row = balanced(html, k);
    const j = html.indexOf(row);
    html = html.slice(0, j) + html.slice(j + row.length);
  }
  return html;
}

function section_fig(page, label, cls = '<div class="sx-body">') {
  const s = rd(page);
  const i = s.indexOf('class="label"><b><t-zh>' + label);
  const sec = s.slice(rfind(s, '<section', 0, i), s.indexOf('</section>', i));
  return balanced(sec, sec.indexOf(cls));
}

function top(icon, app, crumb_zh, crumb_en, right = '') {
  // NocoCRM and NocoITAM have their real logos (static-docs.nocobase.com/noco*-logo.svg); other apps an icon and their name.
  const brand = app === 'CRM' ? '<img class="crm-logo" src="https://static-docs.nocobase.com/nococrm-logo.svg" alt="NocoCRM">'
    : app === 'ITAM' ? '<img class="crm-logo" src="https://static-docs.nocobase.com/nocoitam-logo.svg" alt="NocoITAM">'
    : `<span class="mk"><i data-lucide="${icon}"></i></span>Noco<span>${app}</span>`;
  return `<div class="sx-top"><span class="sx-brand" style="padding:0">${brand}</span><span>/</span><b>${T(crumb_zh, crumb_en)}</b>` +
    `<span class="r">${right}<span class="ai"><i data-lucide="sparkles"></i></span><span class="av">${T('陈', 'A')}</span></span></div>`;
}

function win(icon, app, czh, cen, body, right = '') {
  // NocoITAM's figure takes its own green (`.itam-theme` in index.html).
  return `<div class="sx solo${app === 'ITAM' ? ' itam-theme' : ''}">` + '<div class="sx-main">' + top(icon, app, czh, cen, right) + '<div class="sx-body">' + body + '</div></div></div>';
}

// NocoCRM：一支 7×24 小时的销售 Agent 团队——「Agent 做了 37 件事，你只拍板 6 件」
// 底部一行：今天在岗的 6 个 Agent 各做了几件事（合计 37，和右侧数字对上）
const ROSTER = [['公司情报 Agent', 'Research Agent', 'building-2', 4], ['线索跟进 Agent', 'Lead Agent', 'radar', 12], ['商机跟进 Agent', 'Deal Agent', 'bell', 5],
  ['任务助手 Agent', 'Task Agent', 'list-checks', 9], ['审批助手 Agent', 'Approval Agent', 'stamp', 3], ['销售专家 Agent', 'Sales Expert Agent', 'message-square', 4]];
const crm_roster = '<div class="sx-sec" style="color:var(--agent-ink)"><i data-lucide="zap" style="color:var(--agent)"></i>' + T('今天在岗的 6 个 Agent', '6 agents on duty today') + '<span class="r">' + T('合计 37 件', '37 tasks in total') + '</span></div>' +
  '<div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px">' + ROSTER.map(([zh, en, ic, n]) =>
    '<div style="display:grid;grid-template-columns:24px minmax(0,1fr);gap:2px 8px;align-items:center;padding:9px 10px;border:1px solid var(--rule);border-radius:9px">' +
    `<span class="ag" style="grid-row:span 2;width:24px;height:24px"><i data-lucide="${ic}"></i></span><b style="font-size:12px;font-weight:600;color:var(--agent-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${T(zh, en)}</b>` +
    `<span style="font-size:11.5px;color:var(--muted)">${T(`今天 ${n} 件`, `${n} today`)}</span></div>`).join('') + '</div>';
const crm = win('handshake', 'CRM', 'Agent 工作', 'Agent work', drop_tl(wow_body('solution-crm.html'), ['08:30', '11:30', '18:20']),
  '<span class="tag violet"><span class="spin" style="width:10px;height:10px;border-width:1.5px"></span>' + T('6 个 Agent 在岗', '6 agents on duty') + '</span>');

// NocoITAM：省下的每一笔钱，都说得清来龙去脉
// 底部补一条「等你确认」：Agent 只提建议，负责人确认后才执行
function ask(id_, zh, en, dzh, den, save) {
  return '<div class="sg on" style="grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:2px 12px;padding:10px 12px">' +
    `<div style="display:grid;gap:2px;min-width:0"><b><span class="id" style="color:var(--muted);font-weight:400;font-size:12px">${id_}</span> ${T(zh, en)}</b><p>${T(dzh, den)}<span style="margin-left:8px;font-family:var(--f-mono);color:var(--pass-ink);white-space:nowrap">${save}</span></p></div>` +
    `<div class="acts" style="margin:0;flex-wrap:nowrap"><span class="b p sm">${T('同意', 'Approve')}</span><span class="b sm">${T('修改', 'Edit')}</span></div></div>`;
}
const itam_ask = '<div class="sx-sec"><i data-lucide="user-check"></i>' + T('等你确认', 'Waiting on you') + '<span class="r">' + T('确认后才会执行', 'Nothing runs until you confirm') + '</span></div>' +
  '<div class="duo2" style="gap:12px">' +
  ask('PO-000052', '设计部申请 3 台显示器', '3 monitors for Design', '库存有 2 台同型号，建议只买 1 台', '2 same-model units in stock; buy just 1', T('少花 ¥ 3,198', 'Saves ¥3,198')) +
  ask('Adobe CC', '5 个席位 90 天未登录', '5 seats unused for 90 days', '下月续订前回收，续订减少 5 个', 'Reclaim before next month’s renewal', T('少花 ¥ 6,450/年', 'Saves ¥6,450/yr')) +
  '</div>';
const itam = win('monitor-smartphone', 'ITAM', '价值', 'Value', wow_body('solution-itam.html').replace(/<tr><td class="id">(DP-000003|PO-000045|Zoom Pro)<\/td>[\s\S]*?<\/tr>/g, '') + itam_ask,
  '<span class="tag grey">' + T('本季度', 'This quarter') + '</span>');

// NocoReach: the Insights page itself, as the Reach page shows it (on static-docs, shot by homepage/scripts/reach-shoot.mjs into assets/reach/ and uploaded; drawn by homepage/content/reach/figs.html with the
// product's own stylesheet and the Acme example of the NocoReach film); today's daily analysis and the decisions it asks for
const reach = '<div class="sx solo" style="padding:0;overflow:hidden">' +
  T('<img src="https://static-docs.nocobase.com/insights-zh.webp" alt="NocoReach 洞察页" width="1280" height="720" style="display:block;width:100%;height:auto">',
    '<img src="https://static-docs.nocobase.com/insights-en.webp" alt="NocoReach Insights" width="1280" height="720" style="display:block;width:100%;height:auto">') + '</div>';

// ---------- 还没上线的三款：没有内页可取，按前三款的思路画——Agent 做了什么，留给人拍板的是哪几件 ----------
const BOT = '<span class="ag"><i data-lucide="bot"></i></span>';
const av = (zh, en) => `<span class="av">${T(zh, en)}</span>`;
const who_agent = (zh, en) => '<span class="cell">' + BOT + '<span style="color:var(--agent-ink);font-weight:500">' + T(zh, en) + '</span></span>';
const who_person = (zh, en, i_zh, i_en) => '<span class="cell">' + av(i_zh, i_en) + T(zh, en) + '</span>';
function stat4(items) {
  // c 是 class 名；空串不加；null 表示 Agent 的数字，用紫色
  return `<div class="stat" style="--n:${items.length}">` + items.map(([k, v, d, c]) =>
    `<div><small>${k}</small><b${c ? ` class="${c}"` : c === null ? ' style="color:var(--agent-ink)"' : ''}>${v}</b><span class="d">${d}</span></div>`).join('') + '</div>';
}
function decide(id_, zh, en, dzh, den, btns) {
  // 紧凑排法：文字在左，按钮竖排在右，每张卡只占两三行高
  const acts = btns.map((b, i) => `<span class="b sm${i === 0 ? ' p' : ''}" style="justify-content:center">${T(...b)}</span>`).join('');
  return '<div class="sg on" style="grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:2px 12px;padding:9px 12px"><div style="display:grid;gap:2px;min-width:0">' +
    `<b><span class="id" style="color:var(--muted);font-weight:400;font-size:12px">${id_}</span> ${T(zh, en)}</b><p>${T(dzh, den)}</p></div>` +
    `<div style="display:grid;gap:5px">${acts}</div></div>`;
}
function table(head, rows) {
  return '<div class="tblw"><table class="tbl"><thead><tr>' + head.map(h => `<th>${T(...h)}</th>`).join('') + '</tr></thead><tbody>' +
    rows.map(rows_i => '<tr>' + rows_i.join('') + '</tr>').join('') + '</tbody></table></div>';
}
const td = (x, cls = '') => `<td${cls ? ` class="${cls}"` : ''}>${x}</td>`;
const tag = (c, zh, en) => `<span class="tag ${c}">${T(zh, en)}</span>`;
const SPIN = '<span class="spin" style="width:10px;height:10px;border-width:1.5px"></span>';

// NocoSupport：夜里进来的工单，早上已经处理完——值班交接，只有超出授权的 3 件留给人
const sup_body =
  '<div class="sx-h"><div><h5>' + T('早上好，周航', 'Morning, Ethan') + '</h5><p>' + T('客服 Agent 夜间值班交接 · 23:00 – 08:00', 'Overnight handoff from the support agents · 11 pm – 8 am') + '</p></div></div>' +
  stat4([[T('夜里收到', 'Received overnight'), '47', T('邮件、表单与在线客服', 'Email, forms, and live chat'), ''],
    [T('Agent 已解决', 'Resolved by agents'), '35', T('常规咨询直接闭环', 'Routine requests closed'), 'ok'],
    [T('回复草稿待发', 'Drafts ready'), '9', T('上班后由你的团队发出', 'Your team sends them at 9 am'), null],
    [T('升级给你', 'Escalated to you'), '3', T('超出授权的才找你', 'Only what’s beyond policy'), 'warn']]) +
  '<div class="duo2" style="grid-template-columns:minmax(0,1fr) 420px;gap:14px;align-items:start">' +
    '<div style="display:grid;gap:8px"><div class="sx-sec" style="color:var(--agent-ink)"><i data-lucide="bot" style="color:var(--agent)"></i>' + T('客服 Agent 夜里处理的工单（节选）', 'Handled overnight by the support agents (excerpt)') + '</div>' +
      table([['工单', 'Ticket'], ['客户问题', 'Issue'], ['Agent 怎么处理', 'What the agent did'], ['结果', 'Result']], [
        [td('#2412', 'id'), td(T('月度报表导出超时', 'Monthly export times out'), 'w'), td(T('检索知识库，发去分批导出步骤，客户已确认', 'Found the KB fix, sent batch-export steps; confirmed'), 'w'), td(tag('green', '已解决', 'Resolved'))],
        [td('#2409', 'id'), td(T('SSO 登录账号被锁定', 'Locked out of SSO'), 'w'), td(T('核验身份后按授权流程解锁', 'Verified identity, unlocked per policy'), 'w'), td(tag('green', '已解决', 'Resolved'))],
        [td('#2403', 'id'), td(T('报表统计时区偏差', 'Report time zone is off'), 'w'), td(T('定位到账号时区设置，起草回复', 'Traced to account time zone; reply drafted'), 'w'), td(tag('violet', '草稿待发', 'Draft ready'))]]) +
    '</div>' +
    '<div class="pnl" style="gap:8px;align-content:start;background:var(--paper)"><div class="h"><i data-lucide="user-check" style="color:var(--human-ink)"></i>' + T('升级给你的 3 件', '3 escalated to you') + '<span class="r">' + T('都附好了依据', 'Context attached') + '</span></div>' +
      decide('#2381', '重复扣款退款 ¥3,200', 'Refund a ¥3,200 double charge', '超过自动退款额度 ¥1,000；Agent 已核对支付流水，确认重复扣款。', 'Above the ¥1,000 auto-refund limit; the agent matched the payment logs.', [['批准退款', 'Approve refund'], ['驳回', 'Decline']]) +
      decide('#2396', '投诉：两次延误交付', 'Complaint: two late deliveries', '客户要求补偿；Agent 起草了致歉信和延长 1 个月服务的方案。', 'Customer wants compensation; the agent drafted an apology and a 1-month extension.', [['查看草稿', 'Review draft'], ['修改', 'Edit']]) +
      '<p style="padding:2px 4px 0;font-size:12px;color:var(--muted)">' + T('另有 1 件：#2399 要求周末现场支持', '1 more: #2399 weekend on-site request') + '</p>' +
    '</div>' +
  '</div>';
const support = win('headset', 'Support', '值班交接', 'Handoff', sup_body, '<span class="tag violet">' + SPIN + T('客服 Agent 值班中', 'Support agents on duty') + '</span>');

// NocoProject：目标交给 Agent 拆解推进，风险提前冒出来——项目推进表 + Agent 发现的风险 + 等你验收的交付物
function prog(p) {
  return `<span class="usage"><i style="--w:${p}%"></i><span>${p}%</span></span>`;
}
const proj_body =
  '<div class="sx-h"><div><h5>' + T('东南亚出海 · 第 3 周', 'SEA Expansion · Week 3') + '</h5><p>' + T('目标：10 月底前签下 3 家渠道伙伴 · 负责人 王磊', 'Goal: sign 3 channel partners by end of October · Owner Leo Walker') + '</p></div><span class="r">' + tag('grey', '里程碑 2 / 5', 'Milestone 2 of 5') + '</span></div>' +
    table([['任务', 'Task'], ['执行', 'Owner'], ['进度', 'Progress'], ['截止', 'Due'], ['状态', 'Status']], [
      [td(T('潜在代理商名单（20 家）', 'Distributor shortlist (20)'), 'w'), td(who_agent('调研 Agent', 'Research Agent')), td(prog(60)), td('10/12 → 10/14', 'id'), td(tag('red', '晚 2 天', '2 days late'))],
      [td(T('分销合作协议初稿', 'Distribution agreement draft'), 'w'), td(who_agent('文书 Agent', 'Docs Agent')), td(prog(100)), td('10/15', 'id'), td(tag('amber', '待你验收', 'Needs sign-off'))],
      [td(T('渠道政策与返点方案', 'Channel policy and rebates'), 'w'), td(who_person('王磊', 'Leo Walker', '王', 'L')), td(prog(30)), td('10/18', 'id'), td(tag('blue', '进行中', 'In progress'))],
      [td(T('首轮伙伴接洽邮件', 'First outreach emails'), 'w'), td(who_agent('文书 Agent', 'Docs Agent')), td(prog(0)), td('10/20', 'id'), td(tag('grey', '等名单', 'Blocked'))]]) +
    '<div class="duo2" style="gap:14px;align-items:start">' +
      '<div class="rvw"><div class="h"><i data-lucide="triangle-alert"></i>' + T('调研 Agent 提前发现风险', 'Research Agent flagged a risk') + '</div>' +
        '<div class="q" style="font-size:14px">' + T('代理商名单晚 2 天，会推迟 10/20 的首轮接洽', 'The shortlist is 2 days late and will push back outreach on 10/20') + '</div>' +
        '<ul><li>' + T('已确认 4 家，另外 16 家还在核实联系人', '4 confirmed; 16 still verifying contacts') + '</li><li>' + T('建议：先给已确认的 4 家发接洽邮件，其余并行补齐', 'Suggestion: email the 4 confirmed now, fill in the rest in parallel') + '</li></ul>' +
        '<div class="acts" style="margin-top:2px"><span class="b p sm">' + T('采纳调整', 'Apply change') + '</span><span class="b sm">' + T('查看影响', 'See impact') + '</span></div></div>' +
      decide('MKT-58', '待你验收：分销合作协议初稿', 'For your sign-off: agreement draft', '文书 Agent 标出 3 处需要你拍板的条款：独家区域、首年最低提货额、争议仲裁地。', 'Docs Agent flagged 3 clauses for you: exclusivity, first-year minimum, and governing law.', [['打开文档', 'Open draft'], ['退回修改', 'Request changes']]) +
    '</div>';
const project = win('folder-kanban', 'Project', '东南亚出海', 'SEA Expansion', proj_body, '<span class="tag violet">' + SPIN + T('2 个 Agent 推进中', '2 agents working') + '</span>');

// NocoHR：新人入职前一天，一切已经就绪——入职 Agent 办好的清单，只有一项等人批；右边是 7×24 的制度问答
function check(zh, en, dzh, den, t) {
  return '<div style="display:grid;grid-template-columns:18px minmax(0,1fr) auto;gap:10px;align-items:start;padding:9px 0;border-top:1px solid var(--rule)">' +
    `<i data-lucide="circle-check" style="width:16px;height:16px;margin-top:2px;color:var(--pass)"></i><div><b style="font-size:13px;font-weight:600">${T(zh, en)}</b>` +
    `<small style="display:block;font-size:11.5px;color:var(--muted)">${T(dzh, den)}</small></div><span class="id">${t}</span></div>`;
}
function ask_me(i_zh, i_en, zh, en) {
  return `<div style="display:flex;justify-content:flex-end;gap:8px;align-items:flex-start"><span style="max-width:84%;padding:7px 11px;border-radius:10px 10px 3px 10px;background:var(--paper-2);border:1px solid var(--rule);font-size:12.5px">${T(zh, en)}</span>${av(i_zh, i_en)}</div>`;
}
function ask_ag(zh, en, extra) {
  return '<div style="display:flex;gap:8px;align-items:flex-start">' + BOT + `<div style="display:grid;gap:5px;max-width:88%"><span style="padding:7px 11px;border-radius:3px 10px 10px 10px;background:var(--agent-tint);font-size:12.5px">${T(zh, en)}</span>${extra}</div></div>`;
}
const hr_body =
  '<div class="sx-h"><div><h5>' + T('赵一鸣 · 明天入职', 'Liam Hayes · starts tomorrow') + '</h5><p>' + T('研发部 · 高级后端工程师 · 导师 周航', 'Engineering · Senior Backend Engineer · Buddy Ethan Cole') + '</p></div><span class="r">' + tag('green', '5 项已就绪', '5 ready') + tag('amber', '1 项等你', '1 needs you') + '</span></div>' +
  '<div class="duo2" style="grid-template-columns:minmax(0,1fr) 400px;gap:14px;align-items:start">' +
    '<div class="pnl" style="gap:0;align-content:start"><div class="h" style="padding-bottom:8px">' + BOT + '<span style="color:var(--agent-ink)">' + T('入职 Agent', 'Onboarding Agent') + '</span><span style="font-weight:400;color:var(--muted)">' + T('已办好', 'has handled') + '</span></div>' +
      check('合同与入职资料核对完成', 'Contract and paperwork checked', '身份证、学历、离职证明逐项核对', 'ID, degree, and release letter verified', '10-07') +
      check('企业邮箱、Git、VPN 账号已开通', 'Email, Git, and VPN accounts ready', '按研发岗位模板开通，权限与组内一致', 'Provisioned from the engineering template', '10-07') +
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
  '</div>';
const hr = win('users', 'HR', '入职', 'Onboarding', hr_body, '<span class="tag violet">' + SPIN + T('入职与制度问答 Agent', 'Onboarding & policy agents') + '</span>');

const tpls = [['crm', crm], ['itam', itam], ['reach', reach], ['support', support], ['project', project], ['hr', hr]].map(([k, v]) => `<template id="tpl-${k}">${v}</template>`).join('');
const p = join(here, 'home.html');
let s = readFileSync(p, 'utf8'), n = 0;
s = s.replace(/<!-- SOLTPL -->[\s\S]*?<!-- \/SOLTPL -->/g, () => (n++, '<!-- SOLTPL -->' + tpls + '<!-- /SOLTPL -->'));
if (!n) {
  const anchor = '<div class="apptabs" role="tablist" aria-label="Solutions" id="apptabs"></div>';
  if (s.split(anchor).length - 1 !== 1) throw new Error('content/pages/home.html 里 apptabs 锚点不是恰好一处');
  s = s.split(anchor).join(anchor + '\n      <!-- SOLTPL -->' + tpls + '<!-- /SOLTPL -->');
}
writeFileSync(p, s, 'utf8');
// Solution 页的应用列表用同一批图：写成 snips/solCrm.html 等，正文里用 {{SNIP:solCrm:880}} 引用
const snipdir = join(here, 'snips');
for (const [k, v] of [['Crm', crm], ['Itam', itam], ['Reach', reach], ['Support', support], ['Project', project], ['Hr', hr]])
  writeFileSync(join(snipdir, `sol${k}.html`), v, 'utf8');
// 长度按字符数算（同 Python 的 len），不是 UTF-16 码元数
const len = v => [...v].length;
console.log('templates', len(crm), len(itam), len(reach), len(support), len(project), len(hr));
