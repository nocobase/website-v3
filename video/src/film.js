// AI + NocoBase · the NocoBase 3 brand film, v3.1 (118 s, 16:9, Chinese). DIRECTION.md has the brief, the shot list and the
// copy; this file only places them on the timeline. The film follows 《NocoBase 产品定义与标准表述》: AI writes code fast, but
// building a reliable business system is still not simple (four problems, shown on one supplier system built by coding
// agents alone); NocoBase (the definition, the division of work); Core answers the first two problems (the foundation is
// ready; one structure and one set of rules); Studio answers the other two (an agent team, its progress, decisions on
// evidence, what the team learns kept); the system keeps shipping, week after week; the end card.
// The opening is labelled "01 — 单独使用 Coding Agent" until the brand. On screen, product claims are quoted from the
// standard document. Agents carry their badge (CC, CX, OC, CU, 调) and the agent chip; people act only through the cursor.
(function () {
  // ---------------------------------------------------------------- cue sheet (seconds) · 120 BPM, a bar is 2 s
  // Bar lines: problems 6, brand 30 (lands 30), Core 38, permissions 44, approval 49 (mid-bar), the capability board 54, one structure 62,
  // back to the problems 70, Studio 74, the console's pages 78 / 84 / 90 / 96, back to the problems 102, the year 106, the end card 112.
  // v3.1 is v3 (146 s) brought under 120 s by tightening every shot, none cut (DIRECTION.md §2 has the table).
  const T = {
    ask: 0.25, up: 1.25, term: 1.35, type: 1.6, enter: 2.3, build: [2.45, 2.65, 2.85, 3.05, 3.25, 3.45, 3.65], dock: 3.2, run: 3.95,   // O1
    pull: 4.3, tA: 4.45,                                                                                                    // O2
    p: [6.0, 10.5, 15.0, 19.5], tB: 24.0, out0: 27.3,                                                                       // P1–P5
    base: 29.55, land: 30.0, pos: 31.2, roles: 32.4, brandOut: 37.0,                                                       // B1
    core0: 37.38, coreLand: 38.0, rack1: 40.0, slabC: 41.3, fchips: 41.5, dive: 43.2,                                    // Core: the foundation
    p2: 44.0, p3: 49.0, wall: 54.0, wPull: 56.5, wRev: 57.0, wLine: 57.5, arch: 62.0, grid1: 70.0,                         // Core: two capabilities, all 20+, one structure
    st0: 73.38, stLand: 74.0, rack2: 76.0, c1: 78.0, c2: 84.0, c3: 90.0, c4: 96.0, grid2: 102.0,                           // Studio
    yr: 106.0, end0: 111.3, endLand: 112.0, done: 118.0,                                                                  // the year, the end card
  };
  const K = NBFilm({ T }), S = NBSpec(K), { tl, $, $$, ic, ZH, NB, esc, fmt, avatar } = K;
  window.__filmT = T;

  // ---------------------------------------------------------------- story data
  const ASKQ = '你在用 AI 开发业务系统吗？';
  const PROMPT = '帮我做一个供应商管理系统';
  const BUILD = [['src/db/**', 18, 2140], ['src/api/**', 42, 6380], ['src/auth/**', 12, 1920], ['src/pages/**', 36, 5860],
    ['src/components/**', 58, 4730], ['src/services/**', 31, 3910], ['tests/**', 24, 3460]];
  const BUILT = BUILD.reduce((a, [, f, n]) => ({ files: a.files + f, lines: a.lines + n }), { files: 0, lines: 0 });
  // a tool badge (the coding tool an agent runs on) and the agent names as Studio writes them
  const TB = { cc: 'CC', cx: 'CX', oc: 'OC', cu: 'CU', pm: '调' };
  const tool = (k) => `<span class="tool ${k}">${TB[k]}</span>`;
  const tb = (k) => `<span class="tb tb-${k}">${TB[k]}</span>`;
  const pill = (id, k, text) => `<span class="stt s-${k}"${id ? ` id="${id}"` : ''}><i></i><em>${text}</em></span>`;
  const check = `<svg class="ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

  // ---------------------------------------------------------------- the four problems (titles and lines quoted from the standard document)
  // A card is 760 × 330 in the middle of the frame while its problem plays, then shrinks to 0.72 into its cell of the 2×2.
  // fix: the answer, shortened from the document's solution, shown when the card comes back solved.
  const PROB = [
    { t: '底层能力要从零建设', d: '权限、工作流引擎、审批等底层模块从零开发，边界情况多，维护工作量大。', by: 'NocoBase Core', fix: '现成的基础能力，由 NocoBase 持续维护和升级' },
    { t: '架构随机漂移，逐渐失控', d: '换人、换模型甚至换会话，AI 都可能随机发挥，系统越来越难维护。', by: 'NocoBase Core', fix: '统一的项目结构和开发规范' },
    { t: '并行任务很多，人确认不过来', d: 'Agent 交过来的改动也越来越多，人看不过来，又不敢放手。', by: 'NocoBase Studio', fix: '统一调度 Agent 团队，人有理有据做决策' },
    { t: '知识和经验难以沉淀和共享', d: '需求背景、业务资料、项目经验散落在不同电脑的不同会话里。', by: 'NocoBase Studio', fix: '技能、知识库和项目记忆，换人、换 Agent 都能交接' },
  ];
  const PC = { x: 340, y: 292, k: 0.72, cells: [[159, 196], [734, 196], [159, 460], [734, 460]] };   // the focus spot and the 2×2
  const toCell = (k) => ({ x: PC.cells[k][0] - PC.x, y: PC.cells[k][1] - PC.y, scale: PC.k });
  // ① the agent writes the foundation itself: four modules, the lines pile up, edge cases surface
  const IL1 = [['src/auth/permissions/**', 6820], ['src/workflow/engine/**', 9410], ['src/approval/**', 5260]];
  const WARN = ['并发审批冲突', '越权查看其他部门', '流程回退丢数据'];
  // ② three people, three tools, three sessions: three shapes for one system
  const IL2 = [
    ['cc', '王磊 · Claude Code', '供应商分级', ['src/', 'services/tiering.ts', 'models/Tier.ts', 'utils/score.ts']],
    ['cx', '陈宇 · Codex', '对接 ERP', ['app/', 'modules/erp/index.js', 'modules/erp/sync.js', 'lib/http.js']],
    ['cu', '新会话 · Cursor', '资质提醒', ['lib/', 'handlers/qualify.ts', 'jobs/remind.ts', 'db/raw.sql']],
  ];
  // ③ one window per task, the changes waiting for a person pile up
  const IL3 = [['PUR-23', '分级规则', 'cx'], ['PUR-24', '季度重算', 'cc'], ['PUR-31', 'ERP 同步', 'cu'], ['PUR-33', '资质提醒', 'cx'], ['PUR-36', '移动端审批', 'cc']];
  // ④ what the team knows, scattered over machines and sessions; the new colleague's question finds no one
  const IL4 = [['王磊的 Mac · 会话', '3 天前', '《采购管理办法》摘录'], ['陈宇的电脑 · 会话', '2 周前', 'ERP 接口说明'], ['已关闭的会话', '1 个月前', '评分权重的讨论']];
  const probHTML = (p, k) => {
    let il = '';
    if (k === 0) il = `<div class="il il1">${S.term.html('pT0', 'left:0;top:0;width:448px;height:196px', '~/supplier-app — coding agent', IL1.map(([f, n]) => ['w', f, n]), { br: 'main', sm: 1 })}
        <div class="iw">${WARN.map((w, j) => `<span class="wn" id="pW${j}">${ic('triangle-alert')}${w}</span>`).join('')}</div></div>`;
    if (k === 1) il = `<div class="il il2">${IL2.map(([t, who, f, tree], j) => `<div class="tc" id="pC${j}"><div class="th">${tb(t)}<span>${ZH(who)}</span></div><b>${f}</b>
        <div class="tr"><span class="rt">${tree[0]}</span>${tree.slice(1).map((x) => `<span class="lf">${x}</span>`).join('')}</div></div>`).join('')}</div>`;
    if (k === 2) il = `<div class="il il3"><div class="ws">${IL3.map(([id, n, t], j) => `<div class="wn3" id="pX${j}" style="left:${j * 34}px;top:${j * 22}px"><div class="wt"><i></i><i></i><i></i><span>${id} ${n} — ${t === 'cc' ? 'claude' : t === 'cx' ? 'codex' : 'cursor'}</span></div>
        <div class="wb"><span class="ad">+${[128, 64, 210, 96, 152][j]}</span><span class="dl">−${[14, 9, 31, 6, 22][j]}</span><span class="ws2">等你看</span></div></div>`).join('')}</div>
        <div class="pend"><small>待你看的改动</small><b id="pN">3</b></div>${K.cursorSVG('curP')}</div>`;
    if (k === 3) il = `<div class="il il4">${IL4.map(([w, t, doc], j) => `<div class="ss" id="pS${j}"><div class="sh">${ic(j === 2 ? 'message-square-off' : 'laptop')}<b>${w}</b><small>${t}</small></div>
        <div class="dc">${ic('file-text')}${doc}</div></div>`).join('')}
        <div class="qb" id="pQ">${avatar('林悦')}<div><small>林悦 · 刚接手</small><span>财务复核为什么是 50 万？</span></div></div></div>`;
    return `<div class="pc" id="pc${k}"><div class="ph"><span class="no">0${k + 1}</span><b>${p.t}</b></div><p class="pd">${ZH(p.d)}</p>${il}
      <div class="fx" id="fx${k}"><span class="fk">${check}</span><div><span class="fb">${ZH(p.by)}</span><span class="ft">${ZH(p.fix)}</span></div></div></div>`;
  };

  const SUPP = [  // fictional suppliers: no, name, department, category, qualification expiry, contract value
    ['SUP-0412', '华东精工', '生产部', '机加工 · 精密零件', '2026-11-20', '¥1,280,000'],
    ['SUP-0398', '鑫源电子', '研发部', '电子料 · 传感器', '2027-03-08', '¥640,000'],
    ['SUP-0377', '明川包装', '生产部', '包材 · 纸箱', '2026-11-05', '¥86,000'],
    ['SUP-0365', '恒泰物流', '行政部', '物流 · 城配', '2027-01-15', '¥320,000'],
    ['SUP-0351', '盛达化工', '生产部', '原料 · 树脂', '2026-12-02', '¥560,000'],
  ];

  // the capability board: 24 of Core's capabilities under the website's names (core.html: Core plugins, built-in capabilities),
  // each card a small screen of what it already does in this supplier system. It sums up the foundation: the first column is what
  // the stack and the two proofs just showed. [name, icon, accent, body]
  const cY = `<i class="c-y">${ic('check')}</i>`, cN = '<i class="c-n">—</i>';
  const av = (ch, c) => `<i class="c-av" style="--c:${c}">${ch}</i>`;
  const CAPS = [
    ['数据建模', 'database', '#1677ff', `<div class="c-er">${[['供应商', 3], ['资质', 2], ['合同', 3]].map(([n, k]) => `<div class="c-e"><b>${n}</b>${'<i></i>'.repeat(k)}</div>`).join('<span class="c-ln"></span>')}</div>`],
    ['权限控制', 'shield', '#059669', `<div class="c-mx"><span></span><em>查看</em><em>编辑</em><em>审批</em>
      <span>采购主管</span>${cY}${cY}${cY}<span>采购员</span>${cY}${cY}${cN}<span>${ZH('供应商 Agent')}</span>${cY}${cN}${cN}</div>`],
    ['工作流', 'git-branch', '#1677ff', `<div class="c-wn"><div class="c-wd"><em>触发</em>提交准入申请</div><i class="c-wc"></i><div class="c-wd"><em>条件</em>合同额 > 50 万</div><i class="c-wc"></i><div class="c-wd"><em>人工</em>财务复核</div></div>`],
    ['审批', 'list-checks', '#d97706', `<div class="c-ap"><div class="c-r"><b>准入审批</b><span class="c-tg c-am">待审批</span></div><div class="c-r c-mu">华东精工 · ${ZH('¥1,280,000')}</div>
      <div class="c-r"><span class="c-bt c-pr">同意</span><span class="c-bt">驳回</span><span class="c-bt">转交</span></div></div>`],
    ['用户与组织', 'users', '#4f46e5', `<div class="c-og">${[['采购部', 12, ['周', '#1677ff'], ['陈', '#0891b2']], ['生产部', 38, ['孙', '#059669'], ['赵', '#d97706']], ['财务部', 6, ['何', '#7c3aed'], ['钱', '#e11d48']]]
      .map(([n, k, a1, a2]) => `<div class="c-r"><i class="c-tr"></i><b>${n}</b><span class="c-mu">${k} 人</span><span class="c-avs">${av(...a1)}${av(...a2)}</span></div>`).join('')}</div>`],
    ['身份认证', 'key-round', '#4f46e5', `<div class="c-au"><span class="c-bt">账号密码登录</span><span class="c-bt c-pr">${ZH('OIDC')} 单点登录</span><div class="c-r c-mu">会话管理 · ${ZH('API Key')}</div></div>`],
    ['数据源', 'cable', '#0d9488', `<div class="c-ds">${[['主数据库', 'PostgreSQL', ''], ['ERP', 'SQL Server', '外部'], ['MES', 'MySQL', '外部']]
      .map(([n, d, x]) => `<div class="c-r"><i class="c-dot"></i><b>${ZH(n)}</b><span class="c-tg">${d}</span>${x ? `<em>${x}</em>` : ''}</div>`).join('')}</div>`],
    ['文件管理', 'folder-open', '#d97706', `<div class="c-fl">${[['营业执照.pdf', '1.2 MB'], ['质检报告.pdf', '860 KB']].map(([n, z]) => `<div class="c-r"><span class="c-pdf">PDF</span><b>${n}</b><span class="c-mu">${z}</span></div>`).join('')}
      <div class="c-r c-mu">${ic('eye')}在线预览 · ${ZH('S3')} 兼容存储</div></div>`],
    ['消息通知', 'bell', '#ef4444', `<div class="c-nt"><div class="c-ts">${ic('bell')}<span>明川包装 · 资质 30 天后到期</span></div><div class="c-r">${['站内信', '邮件', '飞书', '钉钉'].map((c) => `<span class="c-tg">${c}</span>`).join('')}</div></div>`],
    ['邮件互通', 'mail', '#0891b2', `<div class="c-ml">${[['华东精工', '回复：年度报价单', '10:12'], ['鑫源电子', '资质文件已更新', '09:40']].map(([f, t, h]) => `<div class="c-r"><b>${f}</b><span>${t}</span><time>${h}</time></div>`).join('')}
      <div class="c-r c-mu">${ic('link')}往来邮件自动关联供应商</div></div>`],
    ['定时任务', 'alarm-clock', '#ea580c', `<div class="c-cr"><div class="c-r"><b class="c-hm">09:00</b><span>每天 · 资质到期检查</span></div><div class="c-r">${'<i class="c-rn"></i>'.repeat(6)}<span class="c-mu">最近 6 次 · 成功</span></div></div>`],
    ['流程图', 'workflow', '#7c3aed', `<div class="c-sg"><div class="c-bar">${['申请', '财务复核', '准入'].map((n, k) => `<span class="c-st c-s${k}"><i></i><em>${n}</em></span>`).join('')}</div><div class="c-r c-mu">华东精工 · 财务复核中</div></div>`],
    ['模板打印', 'printer', '#e11d48', `<div class="c-pt"><div class="c-pg"><b>采购合同</b><i></i><i></i><i></i><i class="c-s"></i></div><div class="c-pm"><span class="c-tg">DOCX</span><span class="c-tg">PDF</span><span class="c-mu">绑定字段<br>自动生成</span></div></div>`],
    ['看板', 'kanban', '#0d9488', `<div class="c-kb">${[['待准入', 2], ['合作中', 3], ['暂停', 1]].map(([n, k]) => `<div class="c-kc"><em>${n}</em>${'<i></i>'.repeat(k)}</div>`).join('')}</div>`],
    ['后台任务', 'timer', '#475569', `<div class="c-bg"><div class="c-r"><b>导出供应商清单</b><span class="c-mu">68%</span></div><div class="c-pb"><i></i></div><div class="c-r c-mu">${ZH('2,176 / 3,200')} 条 · 后台运行</div></div>`],
    ['开放 API', 'braces', '#475569', `<div class="c-api"><div class="c-r"><em class="c-g">GET</em><code>/api/suppliers</code><i class="c-sc">200</i></div><div class="c-r"><em class="c-p">POST</em><code>/api/admissions</code><i class="c-sc">201</i></div>
      <div class="c-r c-mu">${ic('key-round')}<code>API Key ••••4f2a</code></div></div>`],
    ['AI 员工', 'sparkles', '#7c3aed', `<div class="c-ae"><span class="c-bo">${ic('bot')}</span><div class="c-bu">3 家供应商的资质下月到期，清单已经整理好。</div></div>`],
    ['知识库', 'book-open', '#7c3aed', `<div class="c-kn">${[['《供应商准入制度》', 1], ['《采购管理办法》', 0], ['《质量协议模板》', 0]].map(([n, c]) => `<div class="c-r">${ic('file-text')}<b>${n}</b>${c ? '<span class="c-tg c-pu">已引用</span>' : ''}</div>`).join('')}</div>`],
    ['模型接入', 'shuffle', '#7c3aed', `<div class="c-md">${[['Claude', '#d97757'], ['GPT', '#10a37f'], ['DeepSeek', '#4d6bfe'], ['通义千问', '#615ced'], ['Kimi', '#27272a'], ['本地模型', '#a1a1aa']].map(([n, c]) => `<span style="--c:${c}"><i></i>${ZH(n)}</span>`).join('')}</div>`],
    ['处理记录', 'history', '#475569', `<div class="c-ml">${[['周航', '修改准入状态', '10:12'], ['供应商 Agent', '读取资质文件', '09:40']].map(([f, t, h]) => `<div class="c-r"><b>${ZH(f)}</b><span>${t}</span><time>${h}</time></div>`).join('')}
      <div class="c-r c-mu">${ic('history')}谁做的、改了什么，都有记录</div></div>`],
    ['界面与配置', 'layout-grid', '#1677ff', `<div class="c-ui"><div class="c-sd"><i class="c-on"></i><i></i><i></i><i></i></div><div class="c-mn"><div class="c-tb"><i></i><span></span></div>${'<i class="c-rw"></i>'.repeat(4)}</div></div>`],
    ['多语言', 'languages', '#4f46e5', `<div class="c-lg"><div class="c-seg"><span class="c-on">中文</span><span>${ZH('English')}</span></div><div class="c-r"><b>供应商</b><span class="c-mu">${ZH('Suppliers')}</span></div><div class="c-r"><b>资质到期</b><span class="c-mu">${ZH('Expiring')}</span></div></div>`],
    ['主题定制', 'palette', '#db2777', `<div class="c-th"><div class="c-r">${['#1677ff', '#059669', '#d97706', '#7c3aed', '#18181b'].map((c, k) => `<i class="c-sw${k ? '' : ' c-on'}" style="--c:${c}"></i>`).join('')}</div>
      <div class="c-seg"><span class="c-on">${ic('sun')}浅色</span><span>${ic('moon')}深色</span></div><div class="c-r c-mu">紧凑 · 舒适 · 品牌色</div></div>`],
    ['部署与升级', 'server', '#475569', `<div class="c-dp"><div class="c-r"><span class="c-ln2">测试</span><b>${ZH('v1.0')}</b><i class="c-y">${ic('check')}</i><span class="c-ar">${ic('arrow-right')}</span><span class="c-ln2">生产</span><b>${ZH('v1.0')}</b><i class="c-y">${ic('check')}</i></div>
      <div class="c-r c-mu">部署 · 升级 · 回滚</div></div>`],
  ];
  const CAP = { x0: 98, y0: 104, w: 194, h: 141, dx: 210, dy: 155 };   // six columns of four, the stage's 1440×810 minus the rail
  const capHTML = ([n, icon, ac, body], i) => `<div class="c-cbc" id="cb${i}" style="--ac:${ac};left:${CAP.x0 + Math.floor(i / 4) * CAP.dx}px;top:${CAP.y0 + (i % 4) * CAP.dy}px">
      <div class="c-gl"></div><div class="c-ch"><span class="c-ci">${ic(icon)}</span><span class="c-cn">${ZH(n)}</span><span class="c-ck">${ic('check')}</span></div><div class="c-cbb">${body}</div></div>`;

  // ---------------------------------------------------------------- Core · one structure for every agent
  const ARCH = [['cc', '王磊 · Claude Code', '供应商分级', 'tiering'], ['cx', '陈宇 · Codex', '对接 ERP', 'erp'], ['cu', '新会话 · Cursor', '资质提醒', 'qualifications']];
  const archHTML = () => `<div class="arw">${ARCH.map(([t, who, f], j) => `<div class="au" id="au${j}">${tb(t)}<span><b>${f}</b><small>${ZH(who)}</small></span></div>`).join('')}</div>
    <div class="prj lt win" id="prj"><div class="pjh">${ic('folder-git-2')}<b>supplier-app</b><small>main</small></div>
      <div class="pjs">${K.LOGO.markStatic(15)}<b>NocoBase Core</b>${['项目脚手架', '架构规范', '开发技能'].map((x) => `<span>${x}</span>`).join('')}</div>
      <div class="pjt"><div class="pr0">${ic('folder')}server/</div>
        ${ARCH.map(([t, , , m], j) => `<div class="pr1" id="pm${j}">${ic('folder')}<b>${m}/</b><span class="mods">${['collections', 'routes', 'workflows'].map((x) => `<i>${x}</i>`).join('')}</span><span class="by">${tb(t)}</span></div>`).join('')}
        <div class="pr0 sk">${ic('folder')}.agents/skills/<span class="mods">${['nocobase-app-development', '开发规范', '评审规范'].map((x) => `<i>${x}</i>`).join('')}</span></div></div>
      <div class="pjf"><span id="pjOk">${pill('', 'run', '结构一致 · 3 / 3')}</span></div></div>`;

  // ---------------------------------------------------------------- the Studio console (four pages, video scale, 1.0×)
  const nav = () => {
    const it = (k, i, n, em) => `<div class="it" data-k="${k}">${ic(i)}${n}${em ? `<em id="navN">${em}</em>` : ''}</div>`;
    return `<aside class="ssd"><div class="slg">${K.LOGO.markStatic(18)}NocoBase<em>Studio</em></div>
      ${it('mine', 'list-todo', '我的任务', 2)}${it('agent', 'message-square', '我的会话')}${it('dash', 'layout-dashboard', '仪表盘')}
      <div class="grp">开发</div>${it('task', 'square-check', '任务')}${it('proj', 'folder-kanban', '项目')}${it('kb', 'book-open', '知识库')}${it('mem', 'brain', '项目记忆')}
      <div class="grp">质量</div>${it('qa', 'shield-check', '质量报告')}${it('cases', 'list-checks', '功能与用例')}
      <div class="grp">发布</div>${it('apps', 'box', '应用')}${it('env', 'server', '部署环境')}
      <div class="grp">Agent 管理</div>${it('agents', 'bot', 'Agent')}${it('runners', 'cpu', '运行环境')}${it('skills', 'wand-sparkles', '技能')}</aside>`;
  };
  const PAGE_NAV = ['agent', 'task', 'mine', 'mem'];
  const VW = 1046, page = (k) => ({ x: -k * VW, y: 0, scale: 1 });

  // S2 · 我的会话: 周航 says what he wants; the agent reads the knowledge base and the project memory, splits it into tasks;
  // the coordinator hands them to agents on three machines
  const TASKS = [['PUR-23', '分级规则与评分', 'cx', 'Codex · Server 02'], ['PUR-24', '每季度自动重算', 'cc', 'Claude Code · Server 03'], ['PUR-25', '分级看板', 'oc', 'OpenCode · Server 05']];
  const ASK = '供应商要按 A/B/C 分级：质量、交期、价格打分，每季度重算。';
  const pageAgent = () => `<div class="spn" id="sp0" style="left:0">
      <div class="phd ahd"><b>供应商分级</b><small>Claude Code · Opus 5.5 · 周航的电脑<i></i></small></div>
      <div class="achat"><div class="msgs">
          <div class="mu" id="aU">${ZH(ASK)}</div>
          <div class="ma" id="aA">${tool('cc')}<div><div class="mt">读了知识库《采购管理办法》和 2 条项目记忆。拆成 3 个任务：</div>
            <div class="mtk">${TASKS.map(([id, n], k) => `<div id="aT${k}"><span>${id}</span>${n}</div>`).join('')}</div>
            <div class="hand" id="aH">${ic('check')}已交给 Agent 团队 · 调度 Agent 分派到 3 台机器</div></div></div></div>
        <div class="ainp"><span class="ph" id="aIn">回复，或说下一件事…</span><span class="snd">${ic('arrow-up')}</span></div></div>
      <div class="atk"><div class="ppl" id="aPpl"><div class="pp">${avatar('周航')}<span><b>周航</b><small>业务负责人 · 定规则、验收</small></span></div>
          <div class="pp">${avatar('王磊')}<span><b>王磊</b><small>技术负责人 · 批准上线</small></span></div>
          <div class="pp">${tool('pm')}<span><b>调度 Agent</b><small>拆分、分派、提问、交付</small></span></div></div>
        <div class="ah">任务<small id="aN">0</small></div><div class="aE" id="aE">这段对话还没有任务</div>
        ${TASKS.map(([id, n, t, w], k) => `<div class="tk" id="aK${k}"><b>${n}</b><div class="tl2"><span>${id}</span>${pill('aS' + k, 'idle', '待规划')}</div><div class="tw" id="aW${k}">${tool(t)}${ZH(w)}</div></div>`).join('')}</div></div>`;

  // S3 · the task: the coordinator hands each step to the agent that is good at it; tests and a review by another vendor's model
  const PLAN = [['梳理分级规则与 6 个验收场景', 'cc', 'Claude · Opus 5.5', 'done'], ['分级字段与数据迁移', 'cx', 'Codex · GPT-5.5', 'done'],
    ['评分计算与季度重算', 'cx', 'Codex · GPT-5.5', 'run'], ['为 6 个验收场景写测试', 'cc', 'Claude · Sonnet 5.5', 'run'], ['代码评审（换一家模型）', 'cc', 'Claude · Opus 5.5', 'todo']];
  const LOG = [
    ['pm', '调度 Agent', '把第 2–4 步分给 Codex 和 Claude', '18:36'],
    ['cx', 'Codex', '评分计算完成，提交 PR #231', '21:08'],
    ['cc', 'Claude · Sonnet', '6 个场景的测试 46/46 通过', '22:14'],
    ['cc', 'Claude · Opus', '评审：1 处要改，新接口少了权限检查', '22:51', 'am'],
    ['cx', 'Codex', '已修改，评审通过', '23:18', 'ok'],
    ['pm', '调度 Agent', '交给周航验收 · 附报告、清单和截图', '23:40'],
  ];
  const pageTask = () => `<div class="spn" id="sp5" style="left:${VW}px">
      <div class="phd"><span class="id">PUR-23</span><b>分级规则与评分</b>${pill('tSt', 'upd', '进行中')}<span class="sp1"></span><small id="tClk"><b>18:36</b></small></div>
      <div class="tmeta"><span><small>负责人</small>${avatar('周航')}周航</span><span><small>执行</small>${tool('pm')}调度 Agent</span><span><small>项目</small>供应商管理</span></div>
      <div class="plan"><div class="plh"><b>执行计划</b><small id="plN">第 3 / 5 步 · 2 个 Agent 并行</small></div>
        ${PLAN.map(([n, t, who, st], k) => `<div class="pr ${st}" id="pl${k}"><span class="pc">${check}<i></i></span><span class="pn">${ZH(n)}</span><span class="pw">${tool(t)}${ZH(who)}</span><span class="ps" id="plS${k}">${k === 3 ? '<b id="tN">31</b> / 46' : ''}</span></div>`).join('')}
        <div class="pchips"><span>${ic('git-pull-request')}PR #231</span><span>${ic('git-branch')}agent/pur-23</span><span class="bl">${ic('eye')}预览 · pur-23</span><span id="ciC">${ic('circle-dashed')}CI 运行中</span></div></div>
      <div class="act"><div class="ach">动态</div>${LOG.map(([t, who, x, tm, c], k) => `<div class="ar ${c || ''}" id="lg${k}">${tool(t)}<span><b>${ZH(who)}</b> ${ZH(x)}</span><time>${tm}</time></div>`).join('')}</div></div>`;

  // S4 · decisions on evidence: 周航 answers the question and accepts with the report, the checklist and the screenshots; 王磊 approves
  const pageMine = () => `<div class="spn" id="sp3" style="left:${VW * 2}px">
      <div class="col2" id="dZ"><div class="ch2">${avatar('周航')}<span><b>周航</b><small>采购主管 · 我的任务</small></span><em class="gc" id="gZ">等你处理 2</em></div>
        <div class="tr4" id="dq"><b>评分权重</b><small><span class="m">PUR-23</span> · <span class="w" id="dqs">等你决定：质量和交期，哪个更重要？</span></small>
          <div class="qa" id="dqA">${K.btnO('', '质量优先', 'qaY')}${K.btnO('', '交期优先')}</div></div>
        <div class="tr4 sel" id="dz0"><b>供应商分级</b><small><span class="m">PUR-23</span> · <span class="w" id="dz0s">等你验收 · Agent 建议通过</span></small>
          <div class="att">${[['file-text', '验收报告'], ['list-checks', '清单 6 / 6'], ['image', '截图 6 张']].map(([i, x]) => `<span>${ic(i)}${ZH(x)}</span>`).join('')}</div>
          <div class="acc">${['A ≥ 85 分，B ≥ 70 分，其余为 C', '每季度 1 日自动重算', '生产部只看到本部门供应商'].map((x) => `<div>${ic('circle-check')}${ZH(x)}</div>`).join('')}</div>
          <div class="prev"><div class="pvh"><i></i><i></i><i></i>preview · pur-23</div>
            ${[['华东精工', 'A', 92.4], ['明川包装', 'B', 76.5], ['盛达化工', 'C', 64.0]].map(([n, t, s]) => `<div class="pvr"><span>${n}</span><span><span class="tier t${t}">${t}</span></span><span class="sc">${s}</span></div>`).join('')}</div>
          <div class="acts" id="accActs">${K.btnO('', '退回')}${K.btnD('check', '验收通过', 'accBtn')}</div></div></div>
      <div class="col2" id="dW"><div class="ch2">${avatar('王磊')}<span><b>王磊</b><small>技术负责人 · 我的任务</small></span><em class="gc" id="gW">等你处理 2</em></div>
        <div class="tr4 nw" id="dw0"><b>供应商管理 v1.1 上线生产</b><small><span class="m">PUR-23/24/25</span> · <span class="w" id="dw0s">等你批准 · 周航已验收 · 测试与评审通过</span></small>
          <div class="acts" id="wlActs">${K.btnO('', '暂缓')}${K.btnD('rocket', '批准上线', 'wlBtn')}</div></div>
        <div class="tr4"><b>资产领用归还</b><small><span class="m">ITAM-22</span> · NocoITAM · <span class="w">等你确认方案：新增数据表</span></small></div>
        <div class="tr4"><b>NocoCRM v1.9 上线生产</b><small><span class="m">CRM-150</span> · NocoCRM · <span class="w">等你批准 · 陈思已验收</span></small></div>
        <div class="gh more">进行中 14 · 已完成 41</div></div>
      ${K.cursorSVG('curS3')}</div>`;

  // S5 · the project memory: what the agents learned, kept in the repository with each task's PR; the next task reads it first
  const MEMS = [['生产部只看本部门供应商', 'fb', '孙悦确认：数据范围按部门划分，供应商 Agent 同样只读', '第 1 天'],
    ['评分权重：质量优先', 'fb', '周航确认：分级打分时质量权重最高，其次是交期和价格', '第 2 周'],
    ['交付记录以 ERP 为准', 'pj', '交付与质检数据只从 ERP 读取，本系统不修改（陈宇）', '第 3 周'],
    ['ERP 接口说明', 'rf', '字段含义和调用频率限制，见 IT 部 Wiki 的「ERP 接口」页', '第 3 周'],
    ['财务复核的 50 万阈值', 'pj', '来自《采购管理办法》第 12 条，调整前先和何静确认', '第 4 周'],
    ['新部门先配数据范围', 'fb', '刘博文确认：新部门上线前先配好权限范围，再开放页面', '第 6 周']];
  const MTY = { fb: '反馈', pj: '项目', rf: '参考' };
  const pageMem = () => `<div class="spn" id="sp6" style="left:${VW * 3}px">
      <div class="phd"><b>项目记忆</b><small>${ZH('Agent 在任务中记下的经验，下次开工前先读')}</small></div>
      <div class="m-fl"><span class="m-sel"><small>项目</small>供应商管理${ic('chevron-down')}</span><span class="m-sel"><small>仓库</small><code>acme/supplier-app</code>${ic('chevron-down')}</span>
        <span class="m-sr">${ic('search')}搜索记忆</span><span class="m-st">来自 <code>main@7c41e2a</code> · 12 条</span></div>
      <div class="m-grid">${MEMS.map(([n, ty, d, day], k) => `<div class="m-cd" id="mm${k}"><div class="m-h"><b>${ZH(n)}</b><span class="m-ty">${MTY[ty]}</span></div><p>${ZH(d)}</p><small>${day}</small></div>`).join('')}</div>
      <div class="m-run" id="mRun">${avatar('林悦')}<div><div class="m-r1"><b>PUR-61 · 外协加工厂纳入分级</b><small>林悦接手 · ${tool('cc')}${ZH('Claude Code 开工前读了 12 条项目记忆')}</small></div>
        <div class="m-r2" id="mR2">${ZH('用到 2 条：外协厂也按质量优先打分，交付数据从 ERP 读取。')}</div>
        <div class="m-r3" id="mR3">${ic('book-open')}知识库 2 篇${ic('wand-sparkles')}技能 4 个 · 一起带上</div></div></div></div>`;
  const studioHTML = () => `<div class="lt win" id="stc">${nav()}<div class="svp"><div class="scam" id="scam">${pageAgent()}${pageTask()}${pageMine()}${pageMem()}</div></div></div>`;

  // ---------------------------------------------------------------- the year: a release every week, some of what the business asked for
  const YEAR = [[2, '供应商分级'], [3, '对接 ERP'], [6, '新增生产二部'], [8, '外协厂纳入分级'], [14, '移动端审批'], [26, 'Core 升级'], [39, '负责人交接'], [48, '年度供应商评估']];
  const YW = 1140, yx = (w) => Math.round(YW * Math.pow(w / 52, 0.6));

  // ---------------------------------------------------------------- the stage
  function build() {
    const A_LINES = [['u', ''], ...BUILD.map(([f, c, n]) => ['w', f, n, c]), ['ok', '已在本地运行  localhost:3000']];
    // the supplier list for the permissions proof, and who looks at it
    S.acl.rows = SUPP.map(([no, n, dept, cat, exp, amt]) => [no, n, dept, cat, exp, amt]);
    S.acl.viewers = [{ n: '周航', role: '采购主管', av: '周', all: true }, { n: '孙悦', role: '生产部', av: '孙', dept: '生产部' },
      { n: '供应商 Agent', role: '业务 Agent · 生产部', av: ic('bot'), dept: '生产部' }];
    S.acl.text = { viewAs: '查看身份', cols: ['编号', '供应商', '品类', '资质到期', '合同额'], all: '全部部门', only: (d) => '仅' + d, count: '家供应商',
      shown: '可编辑', masked: '只读', locked: '其他部门 · 无权查看' };
    $('#stage').innerHTML = `${K.canvasHTML()}${K.modeHTML('01', '单独使用 Coding Agent')}
      <section class="scene" id="s1">${K.tcard('tAsk', ASKQ, 343)}
        ${S.term.html('termA', 'left:420px;top:236px;width:600px;height:392px', '~/supplier-app — coding agent', A_LINES, { br: 'main' })}
        <div class="ttl3" id="tTop"><span class="h1 split">AI 写代码很快，</span><span class="h2 split">但构建可靠的业务系统依然不简单。</span></div></section>
      <section class="scene" id="sP">${PROB.map(probHTML).join('')}</section>
      <section class="scene" id="sT">${K.lockHTML('lockA', 84)}
        <div id="bPos">用 ${ZH('AI')} 持续开发和运行业务系统</div>
        <div id="bRoles"><span class="rp" id="rp0">${ic('bot')}${ZH('Agent 写代码、做执行')}</span><span class="rp nb" id="rp1"><span class="lk">${K.LOGO.markStatic(18)}<span class="en">NocoBase</span></span>提供底座和治理能力</span><span class="rp" id="rp2">${ic('user-round')}人来做决策</span></div></section>
      <section class="scene" id="s3">${S.stack.html({ chips: ['权限控制', '工作流与审批', '消息通知'], focusChip: '权限控制', more: '等 20+ 项基础能力', codeLabel: '供应商管理', codeBy: '业务代码 · AI 编写 · 4,860 行',
        code: ['<b>export const</b> tiers = { A: 85, B: 70 }', '<b>export const</b> admission = { review: \'finance\', over: 500_000 }',
          '<b>export const</b> scopes = { buyer: \'department\', lead: \'all\', supplierAgent: \'department\' }', '<b>export const</b> reminders = { qualification: { before: \'30d\' } }',
          '<b>export const</b> pages = [\'suppliers\', \'admissions\', \'qualifications\']'] })}
        ${K.chapHTML('chC', 'Core', ZH('让 Agent 专心写业务') + '，' + NB('底座已经就绪。'))}</section>
      <section class="scene pf3" id="pP">${K.ftlH('ftP', 'NocoBase Core · 基础能力', '权限控制', '数据范围按部门划分，Agent 继承负责人的权限', 'ftl ctr')}
        <div class="dwin lt win">${S.acl.body()}<div class="dfoot" id="aclFoot"><span class="ic">${ic('shield-check')}</span><span class="hu"><b>按部门划分数据范围</b>人和 Agent 用同一套角色与权限</span><span class="ag"><b>供应商 Agent</b>和孙悦同样的范围 · 只读 · 不能修改准入状态</span></div>${K.cursorSVG('cur0')}</div></section>
      <section class="scene pf2" id="pW"><div class="canvas2"></div><div class="wfv"><div class="cam" id="wfCam"><div class="wbox">${wfBody()}</div></div></div>
        <div class="strip sm" id="wfStrip"><span class="k">Agent 编写</span><span class="r"></span><span class="f">server/workflows/<b>1,240 行</b></span></div>
        ${K.ftl('ftW', 'NocoBase Core · 基础能力', '工作流与审批', '超出授权，交给人批准')}
        <div class="wfoot" id="wfFoot"><span class="ic">${ic('git-branch')}</span>Agent 提建议，人做决定 · 每一次流转都有记录</div></section>
      <section class="scene" id="sW"><div class="persp" id="cbView" style="perspective:1600px"><div id="cbRig">${CAPS.map(capHTML).join('')}</div></div>
        <div id="cbCnt"><b id="cbN">0</b><i class="pl">+</i><span>项基础能力</span></div><div id="cbShade"></div>
        ${K.tcard('tWall', NB('基础能力') + '不用从头开发和验证', 336)}<div id="tWsub">${ZH('Core 提供 20 多项基础能力，Agent 只专注于业务开发')}</div></section>
      <section class="scene" id="sA">${K.ftlH('aT', 'NocoBase Core', '为 Agent 提供统一的架构和规范', 'Core 提供项目脚手架、架构规范和开发技能，换人、换模型，项目架构都能保持统一、受控。', 'hubT')}
        ${K.agentChip('agtA', { cls: 'tr' })}${archHTML()}</section>
      <section class="scene" id="sS"><div id="stcW" style="position:absolute;inset:0">${studioHTML()}</div>
        ${K.chapHTML('chS', 'Studio', ZH('Agent 自主推进') + '，' + NB(ZH('团队掌控全局。')))}
        ${K.ftlH('cT0', 'NocoBase Studio', '一支持续推进的 Agent 团队', '接入多台机器上的 Agent 统一调度，24 小时同步推进多个项目和大量任务。', 'hubT')}
        ${K.ftlH('cT1', 'NocoBase Studio', '各项进展一目了然', '项目进展、任务推进过程都清晰可见。', 'hubT')}
        ${K.ftlH('cT2', 'NocoBase Studio', '有理有据做决策', 'Agent 附上报告、清单、截图和建议，不懂代码的业务专家也可以直接拍板。', 'hubT')}
        ${K.ftlH('cT3', 'NocoBase Studio', '方法、经验、知识沉淀在团队里', '技能保存做事的方法，知识库保存业务资料，项目记忆保存 Agent 自主学到的经验。', 'hubT')}
        ${K.agentChip('agtS', { cls: 'tr' })}</section>
      <section class="scene" id="sY">${K.tcard('tY', '系统在统一架构下' + NB('长期稳定迭代'), 176)}
        <div id="yCnt">第 <b id="yW">1</b> 周 · 版本 <b id="yV">v1.0</b></div>
        <div id="year"><i class="yl" id="yl"></i>
          ${[1, 13, 26, 39, 52].map((w) => `<span class="yt" style="left:${yx(w)}px"><i></i>第 ${w} 周</span>`).join('')}
          ${Array.from({ length: 52 }, (_, k) => `<i class="yw" style="left:${yx(k + 1)}px"></i>`).join('')}
          ${YEAR.map(([d, t], k) => `<span class="yc ${k % 2 ? 'lo' : 'hi'}" id="yc${k}" style="left:${yx(d)}px"><span class="yb"><small>第 ${d} 周</small><span>${ZH(t)}</span></span><b class="stem"></b><i class="dt"></i></span>`).join('')}</div>
</section>
      <section class="scene" id="sE"><div id="sEw" class="cam">${K.lockHTML('lockE', 76)}
        <div id="eZh" class="split">构建可靠的业务系统</div><div id="endTags">开源免费 · 私有部署 · 模型与 Agent 自由选择</div><div id="endBeta">NOCOBASE 3.0 BETA</div></div></section>
      ${K.blackHTML()}`;
  }

  // A4 · the admission flow: the agent proposes, the rules route it, a person decides
  function wfBody() {
    return `<div class="nd" id="n1" style="left:220px;top:28px;width:340px"><span class="ic2 t-pu">${ic('bot')}</span><div><div class="nt">供应商 Agent 提交准入建议</div><div class="ns" id="n1s">业务 Agent · 依据《供应商准入规则》</div></div></div>
      <div class="vl" id="v1" style="left:389px;top:82px;height:24px"><i></i></div>
      <div class="nd" id="n2" style="left:220px;top:106px;width:340px"><span class="ic2 t-pu">${ic('file-check')}</span><div><div class="nt">资质核对</div><div class="ns">营业执照 · ISO 9001 · 有效期</div></div><span class="bd pill p-em" id="n2b">✓ 资质齐全</span></div>
      <div class="vl" id="v2" style="left:389px;top:160px;height:22px"><i></i></div>
      <div class="dia" id="dia" style="left:372px;top:182px"><span class="ic2">${ic('git-branch')}</span></div>
      <div class="dlab" style="left:390px;top:228px;transform:translateX(-50%)">合同额 &gt; ¥500,000 ?</div>
      <svg class="br" id="brNo" style="left:0;top:260px" width="781" height="34" fill="none" stroke-width="1.5"><path d="M390 0 V12 H280 V34" stroke="#d4d4d8"/></svg>
      <svg class="br" id="brYes" style="left:0;top:260px" width="781" height="34" fill="none" stroke-width="1.5"><path d="M390 0 V12 H500 V34" stroke="#d4d4d8"/></svg>
      <div class="blab" id="blNo" style="left:335px;top:266px;transform:translate(-50%,-50%);color:var(--emerald)">否</div>
      <div class="blab" style="left:445px;top:266px;transform:translate(-50%,-50%);color:var(--amber)">是</div>
      <div class="nd" id="n3a" style="left:180px;top:294px;width:200px"><span class="ic2 t-gray">${ic('user-check')}</span><div><div class="nt">采购主管审批</div><div class="ns">人工审批</div></div></div>
      <div class="nd" id="n3b" style="left:400px;top:294px;width:200px"><span class="ic2 t-am">${ic('wallet')}</span><div><div class="nt">财务复核</div><div class="ns">人工复核 · 何静</div></div></div>
      <span class="pill p-am late" id="cfoTag" style="position:absolute;left:612px;top:311px">待复核</span>
      <svg class="br" id="brM" style="left:0;top:348px" width="781" height="40" fill="none" stroke-width="1.5"><path d="M280 0 V20 H500 V0 M390 20 V40" stroke="#d4d4d8"/></svg>
      <div class="nd" id="n4" style="left:220px;top:388px;width:340px"><span class="ic2 t-em">${ic('badge-check')}</span><div><div class="nt">准入生效 · 通知供应商</div><div class="ns">写入准入记录 · 邮件通知</div></div><span class="bd pill p-em" id="n4b">✓ 完成</span></div>`;
  }

  // ---------------------------------------------------------------- the film
  function film() {
    gsap.set('.scene, .ftl, .hubT, .chap, #mode, .agchip', { autoAlpha: 0 });
    gsap.set('#termA .ln', { autoAlpha: 0 });
    gsap.set('.cam, #wfCam, #scam', { transformOrigin: '0 0' });
    gsap.set('.pc', { transformOrigin: '0 0' });
    gsap.set('#grid', { '--gs': '32px', '--gx': '16px', '--gy': '5px' });
    K.ambient('neutral', 0, 0);
    opening();
    problems();
    brand();
    core();
    studio();
    year();
    endCard();
  }
  // a page header (K.ftlH): in, and out at t1
  const header = (id, t0, t1) => {
    K.show(id, t0);
    tl.fromTo($$(id + ' .fi'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, t0);
    tl.fromTo($$(id + ' .fzh'), { autoAlpha: 0, y: 16, filter: 'blur(6px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out' }, t0 + 0.05);
    tl.fromTo($$(id + ' .r2 > *'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, t0 + 0.25);
    if (t1) { tl.to(id, { autoAlpha: 0, y: -10, duration: 0.3, ease: 'power2.in' }, t1); tl.set(id, { y: 0 }, t1 + 0.31); }
  };
  // the agent chip: who is at work and on what; 'done' when it finishes
  const chipIn = (id, t) => tl.fromTo(id, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, t);
  const chipOut = (id, t) => tl.to(id, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, t);

  // ===== O1–O2 · the question, then a coding agent alone writes the system in seconds
  function opening() {
    K.beat('开场', 0); K.cue('open', 0);
    K.show('#s1', 0);
    K.openQuestion('tAsk', { at: T.ask, up: T.up, dock: T.dock });
    const ptx = $('#termA .ln.u .tx');
    tl.fromTo('#termA', { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, T.term);
    S.term.lineIn('termA', 0, T.type - 0.05);
    K.typeOn(ptx, PROMPT, T.type, 0.05); K.cue('type', T.type);
    for (let k = 0; k < PROMPT.length; k++) K.sfx('key', T.type + k * 0.05, { i: k });
    K.sfx('enter', T.enter); K.cue('enter', T.enter);
    BUILD.forEach((_, k) => S.term.lineIn('termA', 1 + k, T.build[k]));
    S.term.count('termA', 0, BUILT.lines, T.build[0], T.run - T.build[0], BUILT.files);
    S.term.lineIn('termA', 1 + BUILD.length, T.run); K.sfx('ok', T.run, { g: -8 }); K.cue('run1', T.run);
    // the terminal steps back; the first half of the line comes up top
    tl.to('#termA', { x: -330, y: -60, scale: 0.6, opacity: 0.14, filter: 'blur(3px)', duration: 0.9, ease: 'power3.inOut' }, T.pull); K.cue('pull', T.pull);
    tl.to('#termA', { opacity: 0, duration: 0.6, ease: 'power1.in' }, T.p[0] - 0.4);
    K.cue('title', T.tA);
    tl.fromTo($$('#tTop .h1 .ch, #tTop .h1 .sp'), { yPercent: 45, opacity: 0, filter: 'blur(8px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out', stagger: 0.035 }, T.tA);
  }

  // ===== P1–P5 · four problems, each played large in the middle, then put into its cell of the 2×2
  // A card's moments are written as v3's offsets (a 5 s card); PS scales them to the card's length (4.5 s).
  const PS = (T.p[1] - T.p[0]) / 5;
  function problems() {
    K.beat('四个问题', T.p[0]); K.cue('problems', T.p[0]);
    K.show('#sP', T.p[0] - 0.05);
    gsap.set('.pc', { autoAlpha: 0 });
    gsap.set('.fx', { autoAlpha: 0 });
    gsap.set('#pT0 .ln, .wn, .tc, .tc .rt, .tc .lf, .wn3, .ss, #pQ, #curP', { autoAlpha: 0 });
    PROB.forEach((_, k) => {
      const P = T.p[k], c = '#pc' + k;
      if (k) tl.to($$(PROB.slice(0, k).map((_, j) => '#pc' + j).join(',')), { opacity: 0.32, filter: 'blur(2px)', duration: 0.45, ease: 'power2.inOut' }, P - 0.1);
      tl.fromTo(c, { autoAlpha: 0, x: 0, y: 40, scale: 0.96, filter: 'blur(6px)' }, { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.7, ease: 'expo.out' }, P);
      K.sfx('pop', P, { i: k, g: -8 }); K.cue('prob', P, { i: k });
      const d = (x) => P + x * PS;
      if (k === 0) prob1(d); if (k === 1) prob2(d); if (k === 2) prob3(d); if (k === 3) prob4(d);
      // into its cell; the earlier cards come back to full
      const sh = d(4.2);
      tl.to(c, { ...toCell(k), duration: 0.75, ease: 'power3.inOut' }, sh);
      tl.to(c + ' .il', { opacity: 0.5, duration: 0.6 }, sh + 0.1);
      K.mb(sh, sh + 0.7); K.sfx('whoosh', sh + 0.08, { i: k, g: -14 });   // loud point (+0.22) lands just before the shrink's motion peak
      if (k) tl.to($$(PROB.slice(0, k).map((_, j) => '#pc' + j).join(',')), { opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power2.inOut' }, sh + 0.2);
    });
    // the whole line
    K.cue('tB', T.tB);
    tl.fromTo($$('#tTop .h2 .ch, #tTop .h2 .sp'), { yPercent: 45, opacity: 0, filter: 'blur(8px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out', stagger: 0.035 }, T.tB);
    tl.to('#sP', { scale: 1.015, duration: T.out0 - T.tB, ease: 'sine.inOut', transformOrigin: '50% 60%' }, T.tB);
    // out, before the brand: the cards, the line and the 01 chip
    tl.to(['#tTop', '#sP', '#mode'], { autoAlpha: 0, filter: 'blur(8px)', duration: 0.5, ease: 'power2.in', stagger: 0.05 }, T.out0);
    K.hide('#s1', T.out0 + 0.7);
    tl.set('#sP', { autoAlpha: 0, scale: 1, filter: 'none' }, T.out0 + 0.75);
  }
  function prob1(d) {
    IL1.forEach((_, j) => S.term.lineIn('pT0', j, d(0.7 + j * 0.4)));
    S.term.count('pT0', 0, IL1.reduce((a, [, n]) => a + n, 0), d(0.7), 1.6 * PS, 142);
    WARN.forEach((_, j) => {
      const t = d(2.2 + j * 0.5);
      tl.fromTo('#pW' + j, { autoAlpha: 0, x: 14 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'expo.out' }, t);
      K.ring('#pW' + j, t, '220,38,38'); K.sfx('pop', t, { i: j, g: -14 });
    });
  }
  function prob2(d) {
    IL2.forEach((_, j) => {
      const c = '#pC' + j, t = d(0.6 + j * 0.15);
      tl.fromTo(c, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, t);
      tl.fromTo(c + ' .rt', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, d(1.1 + j * 0.12));
      tl.fromTo($$(c + ' .lf'), { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.32 * PS, ease: 'power2.out' }, d(1.3 + j * 0.12));
    });
    // the three drift apart: every session its own shape
    tl.to('#pC0', { x: -12, y: 8, rotation: -2.5, duration: 1.4 * PS, ease: 'sine.inOut' }, d(2.7));
    tl.to('#pC1', { y: -8, rotation: 0.8, duration: 1.4 * PS, ease: 'sine.inOut' }, d(2.7));
    tl.to('#pC2', { x: 12, y: 10, rotation: 2.5, duration: 1.4 * PS, ease: 'sine.inOut' }, d(2.7));
    K.cls('#sP .il2', 'drift', d(2.8));
  }
  function prob3(d) {
    IL3.forEach((_, j) => { const t = d(0.6 + j * 0.38); tl.fromTo('#pX' + j, { autoAlpha: 0, y: 14, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'expo.out' }, t); K.sfx('pop', t, { i: j, g: -18 }); });
    const n = { v: 3 };
    tl.to(n, { v: 27, duration: 2.8 * PS, ease: 'power1.in', onUpdate: () => { $('#pN').textContent = Math.round(n.v); } }, d(0.8));
    K.ring('#sP .pend', d(3.4), '217,119,6');
    // the cursor goes from window to window
    const pos = [[150, 52], [190, 74], [256, 118], [86, 30], [222, 96]];
    tl.fromTo('#curP', { autoAlpha: 0, x: 330, y: 170 }, { autoAlpha: 1, x: pos[0][0], y: pos[0][1], duration: 0.5, ease: 'power3.inOut' }, d(1.3));
    pos.slice(1).forEach(([x, y], j) => tl.to('#curP', { x, y, duration: 0.3, ease: 'power3.inOut' }, d(1.9 + j * 0.45)));
  }
  function prob4(d) {
    IL4.forEach((_, j) => tl.fromTo('#pS' + j, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, d(0.6 + j * 0.3)));
    tl.fromTo('#pQ', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, d(1.9)); K.sfx('pop', d(1.9), { g: -10 });
    tl.to('#sP .ss', { opacity: 0.38, filter: 'blur(1.2px)', duration: 0.6, ease: 'power2.inOut', stagger: 0.08 }, d(2.7));
    K.cls('#pQ', 'lone', d(3.0));
  }

  // ===== B1 · the brick lands; the definition; the division of work
  function brand() {
    K.beat('品牌', T.land); K.cue('brand', T.land);
    K.show('#sT', T.base - 0.05);
    K.logoLand('lockA', { land: T.land, base: T.base, capTop: 286 });
    tl.fromTo('#glowEnd', { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 0.9, scale: 1, duration: 1.6, ease: 'expo.out' }, T.land);
    K.ambient('nb', T.land);
    tl.fromTo('#bPos', { autoAlpha: 0, y: 10, filter: 'blur(6px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out' }, T.pos);
    [0, 1, 2].forEach((k) => {
      const a = T.roles + k * 0.5;
      tl.fromTo('#rp' + k, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, a);
      K.sfx('pop', a, { i: k, g: -12 }); K.cue('role', a, { i: k });
    });
    K.ring('#rp1', T.roles + 1.6);
    tl.to('#glowEnd', { autoAlpha: 0, duration: 0.8 }, T.brandOut - 0.4);
    tl.to('#sT', { autoAlpha: 0, filter: 'blur(6px)', duration: 0.5, ease: 'power2.in' }, T.brandOut);
    K.hide('#sT', T.brandOut + 0.6);
  }

  // the 2×2 comes back; the cards of `ks` turn over to their answer, one tick each
  function solved(at, ks, out) {
    K.show('#sP', at - 0.05);
    tl.fromTo('#sP', { autoAlpha: 0, scale: 0.97, filter: 'blur(6px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.7, ease: 'expo.out', transformOrigin: '50% 55%', immediateRender: false }, at - 0.05);
    ks.forEach((k, j) => {
      const t = at + 0.75 + j * 0.6;
      tl.to('#pc' + k + ' .il', { opacity: 0.12, duration: 0.4 }, t - 0.1);
      tl.fromTo('#fx' + k, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, t);
      K.tick('#fx' + k + ' .fk', t + 0.15); K.cls('#pc' + k, 'ok', t); K.ring('#pc' + k, t, '22,119,255');
      K.sfx('ok', t + 0.15, { i: j, g: -4 }); K.cue('solve', t + 0.15, { i: k });
    });
    tl.to('#sP', { autoAlpha: 0, filter: 'blur(6px)', duration: 0.45, ease: 'power2.in' }, out);
    K.hide('#sP', out + 0.5);
    tl.set('#sP', { filter: 'none' }, out + 0.51);
  }

  // ===== Core · the foundation is ready; one structure for every agent
  function core() {
    K.beat('Core', T.coreLand); K.cue('core', T.coreLand);
    K.show('#s3', T.core0);
    const Z = S.stack.Zs;
    gsap.set('#spin', { rotation: -14 }); gsap.set('#rig', { scale: 1.0 });
    Object.entries(Z).forEach(([id, z]) => gsap.set('#' + id, { z }));
    tl.set('#zoomer', { autoAlpha: 0, filter: 'blur(10px)' }, T.core0);
    tl.set('#slC', { z: Z.slC + 380 }, T.core0);
    tl.set(K.faces('slC'), { opacity: 0 }, T.core0);
    K.chapterIn('chC', T.coreLand);
    tl.to('#zoomer', { autoAlpha: 0.6, duration: 0.9, ease: 'power1.out' }, T.coreLand + 0.55);
    tl.to('#spin', { rotation: 5, duration: T.dive - T.core0, ease: 'sine.inOut' }, T.core0);
    tl.to('#rig', { scale: 1.1, duration: T.dive - T.core0, ease: 'sine.out' }, T.core0);
    K.rack('chC', T.rack1, '#zoomer');
    tl.set(K.faces('slC'), { opacity: 1 }, T.slabC - 0.22);
    tl.to('#slC', { z: Z.slC, duration: 0.22, ease: 'power2.in' }, T.slabC - 0.22);
    K.mb(T.slabC - 0.24, T.slabC + 0.03);
    K.sfx('clack', T.slabC, { i: 1 }); K.cue('slab', T.slabC);
    tl.fromTo('#slF .fchip', { opacity: 0.2 }, { opacity: 1, stagger: 0.15, duration: 0.3, ease: 'power2.out' }, T.fchips);
    // out: dive into the foundation, into the first two things it already has
    tl.to(['#chC'], { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, T.dive - 0.3);
    const fb = K.stageBoxLater('#slF .lbl');
    K.call(() => { const f = fb(); $('#zoomer').style.transformOrigin = `${f.cx}px ${f.cy}px`; }, T.dive - 0.02);
    tl.to('#zoomer', { scale: 3.0, autoAlpha: 0, duration: 0.8, ease: 'power3.in' }, T.dive);
    K.mb(T.dive + 0.2, T.dive + 0.85);
    K.sfx('whoosh', T.dive + 0.35, { i: 1 }); K.cue('dive', T.dive);
    K.hide('#s3', T.p2);

    // two capabilities as this system uses them: permissions, then approval
    proofPerm(T.p2, T.p3);
    proofFlow(T.p3, T.wall);

    // A5 · the capability board, summing up: the approval pulls back into it; close in, the cards switch on column by column
    // (the first column in eighths, the rest two at a time in sixteenths) while the count climbs to 20+; pull back to all 24 on one
    // screen; the line over the dimmed board (基础能力不用从头开发和验证); a whip pan into one structure
    K.beat('20+ 基础能力', T.wall); K.cue('wall', T.wall);
    K.show('#sW', T.wall - 0.2);
    const LIT = CAPS.map((_, i) => i < 4 ? T.wall + 0.25 + i * 0.25 : T.wall + 1.125 + Math.floor((i - 4) / 2) * 0.125);
    const near = { scale: 1.4, y: -4, rotationX: 7 };   // close in: about four columns in frame, panned left to right
    gsap.set('#cbRig', { x: 240, rotationY: -12 });
    tl.fromTo('#cbRig', { ...near, scale: 2.2, autoAlpha: 0, filter: 'blur(8px)' },
      { ...near, autoAlpha: 1, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out' }, T.wall - 0.2);
    tl.to('#cbRig', { x: -240, rotationY: -6, duration: T.wPull - T.wall + 0.2, ease: 'sine.inOut' }, T.wall - 0.2);
    CAPS.forEach((_, i) => {
      const c = '#cb' + i, t = LIT[i];
      tl.fromTo(c, { opacity: 0.26, filter: 'grayscale(1)' }, { opacity: 1, filter: 'grayscale(0)', duration: 0.2, ease: 'power2.out' }, t);
      tl.fromTo(c, { scale: 1.07 }, { scale: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, t);
      tl.fromTo(c + ' .c-gl', { opacity: 1 }, { opacity: 0, duration: 0.7, ease: 'power2.out' }, t);
      tl.fromTo(c + ' .c-ck', { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'back.out(2.5)' }, t + 0.04);
      K.cue('cap', t);
    });
    const cbN = $('#cbN'), cnt = { t: T.wall };
    tl.fromTo('#cbCnt', { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' }, LIT[0] - 0.15);
    tl.fromTo(cnt, { t: T.wall }, { t: T.wLine, duration: T.wLine - T.wall, ease: 'none',
      onUpdate: () => { cbN.textContent = Math.min(20, LIT.filter((x) => x <= cnt.t + 1e-6).length); } }, T.wall);
    tl.fromTo('#cbCnt .pl', { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.5)' }, LIT[20]);
    K.sfx('pop', LIT[20], { g: -8 });
    // pull back: all of it on one screen, a slow push while it reads
    tl.to('#cbRig', { x: 0, y: 0, scale: 1, rotationX: 0, rotationY: 0, duration: 0.9, ease: 'power3.inOut' }, T.wPull);
    K.mb(T.wPull + 0.2, T.wPull + 0.7);
    K.sfx('whoosh', T.wPull + 0.15, { g: -6 }); K.cue('wRev', T.wRev);
    tl.to('#cbRig', { scale: 1.015, duration: T.arch - T.wPull - 0.9, ease: 'none' }, T.wPull + 0.9);
    // the line
    tl.to('#cbCnt', { autoAlpha: 0, y: -8, duration: 0.35, ease: 'power2.in' }, T.wLine - 0.15);
    tl.to('#cbRig', { autoAlpha: 0.38, filter: 'blur(3px)', duration: 0.55, ease: 'power2.inOut' }, T.wLine);
    tl.fromTo('#cbShade', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.55 }, T.wLine);
    K.tcardIn('#tWall', T.wLine + 0.15);
    tl.fromTo('#tWsub', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, T.wLine + 0.7);
    // out: whip pan to the left, into one structure
    tl.to('#sW', { x: -1500, duration: 0.4, ease: 'power3.in' }, T.arch - 0.4);
    K.mb(T.arch - 0.4, T.arch + 0.05);
    K.sfx('whoosh', T.arch - 0.4, { i: 4 }); K.cue('whip', T.arch - 0.4);
    K.hide('#sW', T.arch + 0.05);
    tl.set('#sW', { x: 0 }, T.arch + 0.06);

    // C2 · one structure: three people, three tools, one project shape
    K.beat('统一架构', T.arch); K.cue('arch', T.arch);
    K.show('#sA', T.arch - 0.05);
    header('#aT', T.arch + 0.05);
    gsap.set(['.au', '.pr1', '#pjOk', '.pjs span', '.pr1 .mods i'], { autoAlpha: 0 });
    tl.fromTo('#prj', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, T.arch + 0.5);
    tl.fromTo('.pjs span', { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.12, ease: 'power2.out' }, T.arch + 1.0);
    tl.fromTo('.au', { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.15, ease: 'expo.out' }, T.arch + 0.8);
    chipIn('#agtA', T.arch + 1.6);
    ARCH.forEach(([t, who, f], j) => {
      const a = T.arch + 2.0 + j * 1.5;
      K.agentAs('agtA', who.split(' · ')[1], f + ' · 按开发规范开发', 'run', a - 0.3);
      K.cls('#au' + j, 'on', a - 0.3); K.ring('#au' + j, a - 0.3, '22,119,255');
      tl.fromTo('#pm' + j, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.in' }, a - 0.24);
      tl.fromTo($$('#pm' + j + ' .mods i'), { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.3, stagger: 0.08, ease: 'back.out(2)' }, a + 0.05);
      K.sfx('clack', a, { i: j, g: -6 }); K.cue('mod', a, { i: j });
      K.call(() => $('#au' + j).classList.remove('on'), a + 1.25);
    });
    K.agentAs('agtA', 'Cursor', '资质提醒 · 按开发规范开发', 'done', T.arch + 5.6);
    tl.fromTo('#pjOk', { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, T.arch + 6.6);
    K.ring('#pjOk .stt', T.arch + 6.6, '16,185,129'); K.sfx('ok', T.arch + 6.6, { g: -6 });
    tl.to('#sA', { autoAlpha: 0, filter: 'blur(6px)', duration: 0.45, ease: 'power2.in' }, T.grid1 - 0.45);
    K.hide('#sA', T.grid1 + 0.05);

    // C3 · back to the problems: the first two solved by Core
    K.beat('Core 解决的问题', T.grid1); K.cue('grid1', T.grid1);
    solved(T.grid1, [0, 1], T.st0 - 0.6);
  }

  // ---------------------------------------------------------------- A3 · 权限 — one list, three viewers; the agent sees what a colleague sees
  function proofPerm(at, next) {
    K.beat('权限控制', at); K.cue('p2', at);
    const s = '#pP', win = '#pP .dwin';
    K.show(s, at - 0.05);
    K.gridTo(K.ID, at);
    tl.fromTo(win, { autoAlpha: 0, scale: 1.12, transformOrigin: '50% 10%' }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'expo.out' }, at - 0.05);
    K.ftlIn('#ftP', at + 0.15);
    tl.to(win, { scale: 1.03, duration: next - at - 0.8, ease: 'sine.inOut' }, at + 0.8);
    S.acl.init();
    const k1 = at + 1.2, k2 = at + 2.6;
    let tc = K.cursorTo('#cur0', '#vs1', k1 - 0.57, 0.55, { edge: true });
    S.acl.view(1, tc); K.sfx('click', tc, { i: 3 }); K.sfx('lock', tc + 0.15);
    tc = K.cursorMove('#cur0', '#vs2', k2 - 0.57, 0.55, { edge: true });
    S.acl.view(2, tc); K.sfx('click', tc, { i: 4 });
    K.cls('#aclFoot', 'ag', tc + 0.3); K.ring('#aclFoot', tc + 0.3, '217,119,6');
    tl.to('#cur0', { autoAlpha: 0, duration: 0.3 }, k2 + 0.5);
    K.hide(s, next);  // hard cut
  }

  // ---------------------------------------------------------------- A4 · 审批 — the editor canvas, full frame; it pulls back into the board
  function proofFlow(at, next) {
    K.beat('工作流与审批', at); K.cue('p3', at);
    const s = '#pW', q = (sel) => K.box($(sel), $('#pW .wbox'));
    K.show(s, at - 0.05);
    const n1 = q('#n1'), k = 1.08, C = [180, 235], SC = [560, 392];
    tl.fromTo('#wfCam', K.camV([n1.cx, n1.cy], [952, 450], k * 2.5 / 1.5), { ...K.camV(C, SC, k), duration: 0.9, ease: 'power3.out' }, at - 0.05);
    K.ftlIn('#ftW', at + 0.45);
    tl.fromTo('#wfStrip', { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, at + 0.7);
    K.typeOn($('#wfStrip .r'), '合同超过 50 万，转财务复核', at + 0.95, 0.045);
    const e = (dt) => at + 1.0 + dt * 0.8, lit = (id) => S.wf.litOnly('#pW', id);   // the flow at 0.8 of its v3 pace
    K.call(() => { lit('#n1')(); $('#n1s').textContent = 'SUP-0412 华东精工 · 建议准入'; }, e(0));
    K.cls('#v1', 'on', e(0.45)); K.call(lit('#n2'), e(0.5));
    K.cls('#n2b', 'on', e(0.9)); K.cls('#v2', 'on', e(1.2)); K.call(lit('#dia'), e(1.4));
    tl.to('#wfCam', { ...K.camV(C, SC, k * 1.03), duration: 4.0, ease: 'sine.inOut' }, e(0.9));
    K.call(S.wf.takeYes, e(1.8));
    K.call(() => { lit('#n3b')(); $('#cfoTag').classList.add('on'); }, e(2.2));
    K.call(() => { const t = $('#cfoTag'); t.className = 'pill p-em late on'; t.textContent = '何静 · 已批准'; }, e(3.0)); K.sfx('ok', e(3.0), { g: -4 });
    K.call(() => $('#brM path').setAttribute('stroke', '#18181b'), e(3.4));
    K.call(() => { lit('#n4')(); $('#n4b').classList.add('on'); }, e(3.6));
    tl.fromTo('#wfFoot', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, e(3.9));
    // out: the canvas pulls back and away while the board comes in around it
    tl.to(s, { scale: 0.7, autoAlpha: 0, filter: 'blur(6px)', duration: 0.55, ease: 'power2.in', transformOrigin: '50% 50%' }, next - 0.4);
    K.sfx('whoosh', next - 0.3, { i: 4, g: -6 });
    K.hide(s, next + 0.2);
    tl.set(s, { scale: 1, filter: 'none' }, next + 0.21);
  }

  // ===== Studio · one console, four pages; the camera only slides page to page
  function studio() {
    const navTo = (k, t) => K.call(() => $$('#stc .it').forEach((e) => e.classList.toggle('on', e.dataset.k === PAGE_NAV[k])), t);
    const slide = (k, t) => {
      tl.to('#scam', { ...page(k), duration: 0.7, ease: 'power3.inOut' }, t - 0.05);
      K.mb(t - 0.05, t + 0.6); K.sfx('whoosh', t, { i: 5 + k, g: -9 }); navTo(k, t + 0.1);
    };

    // S1 · chapter: Studio — the word lands; behind it, out of focus, the console
    K.beat('Studio', T.stLand); K.cue('studio', T.stLand);
    K.show('#sS', T.st0);
    tl.set('#stcW', { autoAlpha: 0, filter: 'blur(10px)', scale: 0.94, transformOrigin: '50% 55%' }, T.st0);
    tl.set('#scam', page(0), T.st0); navTo(0, T.st0);
    gsap.set(['#aA', '#aH', '#aU', '#sp0 .mtk > div', '#sp0 .tk', '#sp0 .tw', '#sp5 .ar', '#sp6 .m-cd', '#mRun', '#mR2', '#mR3'], { autoAlpha: 0 });
    gsap.set('#dw0', { autoAlpha: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0 });
    K.chapterIn('chS', T.stLand, { i: 2 });
    tl.to('#stcW', { autoAlpha: 0.6, duration: 0.8, ease: 'power1.out' }, T.stLand + 0.4);
    tl.to('#stcW', { scale: 0.96, duration: T.rack2 - T.stLand, ease: 'sine.inOut' }, T.stLand);
    K.rack('chS', T.rack2, '#stcW');
    tl.to('#stcW', { scale: 1, duration: 1.2, ease: 'power3.inOut' }, T.rack2 + 0.1);
    tl.to('#chS .czh', { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, T.c1 - 0.5);

    // S2 · 我的会话: the goal in business language; the tasks; the coordinator hands them to three machines
    K.beat('Agent 团队', T.c1); K.cue('c1', T.c1);
    header('#cT0', T.c1 + 0.1, T.c2 - 0.35);
    const ty = T.c1 + 0.4, inp = $('#aIn');
    K.call(() => { inp.classList.add('typed'); }, ty);
    K.typeOn(inp, ASK, ty, 0.03);
    const sent = ty + ASK.length * 0.03 + 0.2;
    K.call(() => { inp.classList.remove('typed'); inp.textContent = '回复，或说下一件事…'; }, sent);
    K.sfx('enter', sent, { g: -6 });
    tl.fromTo('#aU', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, sent);
    tl.fromTo('#aA', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' }, sent + 0.35);
    tl.fromTo('#sp0 .mtk > div', { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.18, ease: 'power2.out' }, sent + 0.6);
    tl.to('#aE', { autoAlpha: 0, duration: 0.2 }, sent + 0.6);
    [0, 1, 2].forEach((k) => {
      tl.fromTo('#aK' + k, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, sent + 0.65 + k * 0.18);
      K.call(() => { $('#aN').textContent = String(k + 1); }, sent + 0.65 + k * 0.18);
    });
    const hand = sent + 1.2;
    tl.fromTo('#aH', { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, hand); K.sfx('ok', hand, { g: -6 });
    chipIn('#agtS', hand - 0.1); K.agentAs('agtS', '调度 Agent', '分派 3 个任务', 'run', hand - 0.1);
    [0, 1, 2].forEach((k) => {
      const t = hand + 0.25 + k * 0.3;
      K.call(() => { $('#aS' + k).outerHTML = pill('aS' + k, 'upd', '进行中'); }, t);
      tl.fromTo('#aW' + k, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'expo.out' }, t);
      K.ring('#aK' + k, t); K.sfx('pop', t, { i: k, g: -14 });
    });
    K.agentAs('agtS', '调度 Agent', '分派 3 个任务', 'done', hand + 1.2);

    // S3 · the task: steps handed to agents, two in parallel; tests climb; another vendor's model reviews; the night goes on
    K.beat('各项进展', T.c2); K.cue('c2', T.c2);
    slide(1, T.c2);
    header('#cT1', T.c2 + 0.2, T.c3 - 0.35);
    const lg = (k, t) => { tl.fromTo('#lg' + k, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, t); K.sfx('pop', t, { i: k, g: -14 }); };
    const clk = (s, t) => K.call(() => { $('#tClk').innerHTML = s; }, t);
    const st = (k, cls, t) => K.call(() => { $('#pl' + k).className = 'pr ' + cls; }, t);
    const at = (x) => T.c2 + x;
    lg(0, at(0.45));
    K.agentAs('agtS', 'Codex · GPT-5.5', '评分计算与季度重算', 'run', at(0.45));
    const tn = { v: 31 };
    clk('<b>21:08</b>', at(1.15)); st(2, 'done', at(1.15)); lg(1, at(1.15)); K.call(() => { $('#plN').textContent = '第 4 / 5 步 · 测试进行中'; }, at(1.15));
    K.agentAs('agtS', 'Claude · Sonnet 5.5', '为 6 个验收场景写测试', 'run', at(1.2));
    tl.to(tn, { v: 46, duration: 1.0, ease: 'power1.out', onUpdate: () => { $('#tN').textContent = Math.round(tn.v); } }, at(1.35));
    clk('<b>22:14</b>', at(2.2)); st(3, 'done', at(2.2)); lg(2, at(2.2)); K.call(() => { $('#ciC').innerHTML = `${ic('circle-check')}CI 通过`; $('#ciC').className = 'ok'; lucide.createIcons(); }, at(2.2));
    st(4, 'run', at(2.35)); K.call(() => { $('#plN').textContent = '第 5 / 5 步 · 评审中'; }, at(2.35));
    K.agentAs('agtS', 'Claude · Opus 5.5', '代码评审（换一家模型）', 'run', at(2.35));
    clk('<b>22:51</b>', at(2.8)); lg(3, at(2.8)); K.cue('review', at(2.8));
    clk('<b>23:18</b>', at(3.5)); st(4, 'done', at(3.5)); lg(4, at(3.5)); K.sfx('ok', at(3.5), { g: -8 }); K.cue('fixed', at(3.5));
    K.agentAs('agtS', 'Claude · Opus 5.5', '代码评审（换一家模型）', 'done', at(3.5));
    clk('<b>23:40</b> · 同事们下班了，Agent 还在推进', at(4.2)); lg(5, at(4.2)); K.ring('#tClk', at(4.2));
    K.call(() => { $('#plN').textContent = '5 / 5 步完成 · 交给周航验收'; $('#tSt').outerHTML = pill('tSt', 'wait', '待验收'); }, at(4.2));
    K.agentAs('agtS', '调度 Agent', '整理验收材料', 'run', at(4.2));

    // S4 · decisions on evidence: 周航 answers and accepts; 王磊 approves the release
    K.beat('有据决策', T.c3); K.cue('c3', T.c3);
    slide(2, T.c3);
    header('#cT2', T.c3 + 0.2, T.c4 - 0.35);
    K.agentAs('agtS', '调度 Agent', '整理验收材料', 'done', T.c3 + 0.3);
    K.ring('#dq', T.c3 + 0.6, '217,119,6');
    const q1 = K.cursorTo('#curS3', '#qaY', T.c3 + 0.75, 0.55);
    K.cls('#qaY', 'hot', q1); K.sfx('click', q1, { i: 6 });
    K.call(() => { $('#dqs').textContent = '已决定：质量优先 · Agent 按此调整，并记进项目记忆'; $('#dqs').className = 'p'; $('#dqA').style.display = 'none'; $('#gZ').textContent = '等你处理 1'; }, q1 + 0.15);
    K.ring('#dq', q1 + 0.15, '16,185,129');
    $('#dqA').style.display = 'none';   // measured in the layout after the answer
    K.ring('#sp3 .att', q1 + 0.4, '22,119,255');
    const a2 = K.cursorMove('#curS3', '#accBtn', q1 + 0.8, 0.6);
    K.cls('#accBtn', 'hot', a2); K.sfx('click', a2, { i: 7 });
    K.call(() => { $('#dz0s').textContent = '已验收 · 交给王磊批准上线'; $('#dz0s').className = 'p'; $('#accActs').style.display = 'none'; $('#gZ').textContent = '等你处理 0'; }, a2 + 0.15);
    K.ring('#dz0', a2 + 0.15, '16,185,129'); K.sfx('ok', a2 + 0.2, { g: -8 });
    const rel = a2 + 0.5;
    tl.fromTo('#dw0', { autoAlpha: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0 }, { autoAlpha: 1, height: 96, paddingTop: 10, paddingBottom: 10, marginTop: 7, duration: 0.5, ease: 'power3.out' }, rel);
    K.call(() => { $('#gW').textContent = '等你处理 3'; }, rel);
    K.ring('#dw0', rel + 0.25, '217,119,6'); K.sfx('pop', rel + 0.25, { g: -6 });
    $('#dqA').style.display = '';
    gsap.set('#dw0', { autoAlpha: 1, height: 96, paddingTop: 10, paddingBottom: 10, marginTop: 7 });
    const ap = K.cursorMove('#curS3', '#wlBtn', rel + 0.5, 0.55);
    gsap.set('#dw0', { autoAlpha: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0 });
    K.cls('#wlBtn', 'hot', ap); K.sfx('click', ap, { i: 8 });
    K.call(() => { $('#dw0s').textContent = '已批准 · v1.1 已上线生产'; $('#dw0s').className = 'p'; $('#wlActs').style.display = 'none'; $('#gW').textContent = '等你处理 2'; }, ap + 0.2);
    tl.to('#dw0', { height: 52, duration: 0.35, ease: 'power3.inOut' }, ap + 0.2); K.ring('#dw0', ap + 0.2, '16,185,129'); K.sfx('ok', ap + 0.25, { g: -4 }); K.cue('live', ap + 0.25);
    tl.to('#curS3', { autoAlpha: 0, duration: 0.25 }, ap + 0.4);

    // S5 · the project memory: what the agents learned on the way; 林悦 takes the next task, the agent reads it first
    K.beat('沉淀', T.c4); K.cue('c4', T.c4);
    slide(3, T.c4);
    header('#cT3', T.c4 + 0.2, T.grid2 - 0.6);
    MEMS.forEach((_, k) => {
      const t = T.c4 + 0.45 + k * 0.13;
      tl.fromTo('#mm' + k, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' }, t);
      K.cue('memc', t, { i: k });
    });
    const rd = T.c4 + 1.9;
    tl.fromTo('#mRun', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, rd); K.sfx('pop', rd, { g: -8 });
    K.agentAs('agtS', 'Claude Code', '开工前读项目记忆', 'run', rd);
    [1, 2].forEach((k, j) => { const t = rd + 0.7 + j * 0.35; K.ring('#mm' + k, t, '59,130,246'); K.cls('#mm' + k, 'm-use', t); K.cue('memu', t, { i: j }); });
    tl.fromTo('#mR2', { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' }, rd + 1.5); K.sfx('ok', rd + 1.5, { g: -8 });
    tl.fromTo('#mR3', { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' }, rd + 2.0);
    K.agentAs('agtS', 'Claude Code', '开工前读项目记忆', 'done', rd + 1.5);
    // out: the console steps back and dissolves
    chipOut('#agtS', T.grid2 - 0.6);
    tl.to('#stc', { scale: 0.92, autoAlpha: 0, duration: 0.7, ease: 'power2.inOut', transformOrigin: '50% 50%' }, T.grid2 - 0.6);
    K.hide('#sS', T.grid2 + 0.15);

    // S6 · back to the problems: the other two solved by Studio; all four done
    K.beat('Studio 解决的问题', T.grid2); K.cue('grid2', T.grid2);
    solved(T.grid2, [2, 3], T.yr - 0.5);
  }

  // ===== R1 · a year of releases, a week at a time (the end card that follows says open source, your servers, your models)
  function year() {
    K.beat('长期稳定迭代', T.yr); K.cue('yr', T.yr);
    K.show('#sY', T.yr - 0.05);
    K.tcardIn('#tY', T.yr + 0.1);
    tl.fromTo('#yCnt', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, T.yr + 0.6);
    const y0 = T.yr + 0.7, dur = 3.0;
    tl.fromTo('#yl', { scaleX: 0 }, { scaleX: 1, duration: dur, ease: 'power2.inOut' }, y0);
    tl.fromTo('#year .yt', { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.3, ease: 'expo.out' }, y0 + 0.2);
    // each week's release dot comes up as the line reaches it (the line's power2.inOut, inverted)
    const reach = (f) => (f < 0.5 ? Math.sqrt(f / 2) : 1 - Math.sqrt((1 - f) / 2)) * dur;
    $$('#year .yw').forEach((e, k) => tl.fromTo(e, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2.5)' }, y0 + reach(yx(k + 1) / YW)));
    YEAR.forEach(([w], k) => {
      const t = y0 + reach(yx(w) / YW) + 0.05;
      tl.fromTo('#yc' + k + ' .yb', { autoAlpha: 0, y: 14, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'expo.out' }, t);
      tl.fromTo('#yc' + k + ' .stem', { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'power2.out', transformOrigin: '50% 100%' }, t);
      tl.fromTo('#yc' + k + ' .dt', { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, t);
      K.sfx('pop', t, { i: k, g: -10 }); K.cue('chip', t, { i: k });
    });
    // the week and the version follow the line
    const wk = { v: 1 };
    tl.to(wk, { v: 52, duration: dur, ease: 'power2.inOut', onUpdate: () => {
      const w = Math.max(1, Math.round(wk.v)); $('#yW').textContent = w;
      $('#yV').textContent = w < 26 ? 'v1.' + (w - 1) : 'v2.' + (w - 26);
    } }, y0);
    K.sfx('ok', y0 + dur, { g: -6 });
    tl.to('#sY .cam, #year', { x: -30, duration: T.end0 - y0, ease: 'sine.inOut' }, y0);
    tl.to('#sY', { autoAlpha: 0, filter: 'blur(6px)', duration: 0.5, ease: 'power2.in' }, T.end0 - 0.6);
    K.hide('#sY', T.end0);
    K.cue('turn', T.endLand - 2);
  }

  // ===== E1 · the end card
  function endCard() {
    K.beat('落版', T.endLand); K.cue('end', T.endLand);
    K.gridTo(K.ID, T.end0 - 0.1);
    K.show('#sE', T.end0 - 0.1);
    tl.fromTo('#glowEnd', { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 0.45, scale: 0.8, duration: 0.8, ease: 'sine.inOut' }, T.end0 - 0.1);
    K.logoLand('lockE', { mode: 'whole', land: T.endLand, base: T.end0, capTop: 286, drop: 64, fall: 0.2, i: 3 });
    tl.to('#glowEnd', { autoAlpha: 1, scale: 1, duration: 2.2, ease: 'expo.out' }, T.endLand);
    tl.fromTo($$('#eZh .ch'), { yPercent: 40, opacity: 0, filter: 'blur(6px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.3, ease: 'power3.out', stagger: K.stag(0.045) }, T.endLand + 0.6);
    tl.fromTo(['#endTags', '#endBeta'], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.3, ease: 'power3.out' }, T.endLand + 1.8);
    tl.fromTo('#sEw', { scale: 1 }, { scale: 1.025, transformOrigin: '50% 50%', duration: T.done - T.endLand, ease: 'sine.inOut' }, T.endLand);
    // no fade to black: the film ends on the end card, its last frame held
  }

  K.run(build, film);
})();
