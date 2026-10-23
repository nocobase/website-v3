// AI + NocoBase · the NocoBase 3 brand film, v2 · one business system's year (141 s, 16:9, Chinese). DIRECTION.md has the
// brief, the shot list and the copy; this file only places them on the timeline.
// The film says one thing: AI writes code fast, but an enterprise needs a system that stays reliable for years. One supplier
// system carries it through a year, and the year's three stretches are the three values: day one, a higher start (Core: let
// the agents write only the business, the foundation is ready); every change, well governed (Studio: the team makes the
// decisions, the agent team does the execution, and what the agents learn stays in the project's memory); the years after,
// built to last (an upgrade, a handover, a year on, owned).
// The rail under every scene names the three stretches; the badge beside it names the version and the day.
// Built on the house kit (NBFilm) and specimens (NBSpec); the Studio console is this film's own, in the product's style.
(function () {
  // ---------------------------------------------------------------- cue sheet (seconds) · 120 BPM, a bar is 2 s
  // Bar lines: brand 12, act one 20, Core 24, permissions 32, approval 38, the capability board 44 (whole board 48, its line 50),
  // act two 54, Studio 56, the console's pages 60 / 68 / 76 / 84, the versions 92, the project memory 100, act three 108, the
  // recap 128, the end card 134.
  const T = {
    term: 0.3, type: 0.6, enter: 1.4, build: [1.6, 1.85, 2.1, 2.35, 2.6, 2.85, 3.1], run: 3.5, pull: 3.9,   // O1 · AI writes code fast
    tA: 4.3, year: 4.8, yc: [5.3, 5.75, 6.2, 6.65, 7.1, 7.55, 8.0, 8.45], tB: 6.0, out0: 10.7,               // O2 · a system lives for years
    base: 11.55, land: 12.0, pos: 13.2, roles: 14.4, brandOut: 18.9,                                          // B1 · brand
    a1: 20.0, bub1: 20.3, core0: 23.38, coreLand: 24.0, rack1: 26.6, slabC: 28.0, fchips: 28.2, agents: 28.7, dive: 31.1,
    p2: 32.0, p3: 38.0, wall: 44.0, wPull: 47.4, wRev: 48.0, wLine: 49.8, v10: 51.0,                        // act one · day one
    a2: 54.0, st0: 55.38, stLand: 56.0, rack2: 58.6, c1: 60.0, c2: 68.0, c3: 76.0, c4: 84.0, mont: 92.0, mem: 100.0,  // act two
    a3: 108.0, u: 110.4, h: 116.2, y: 122.0,                                                                 // act three · for years
    recap: 128.0, end0: 133.3, endLand: 134.0, done: 141.0,
  };
  const K = NBFilm({ T }), S = NBSpec(K), { tl, $, $$, ic, ZH, NB, esc, fmt, avatar } = K;

  // ---------------------------------------------------------------- story data
  const PROMPT = '帮我做一个供应商管理系统';
  const P = {  // the people
    zh: { name: '周航', role: '采购主管', av: '周' }, wl: { name: '王磊', role: '技术负责人', av: '王' }, ly: { name: '林悦', role: '技术负责人', av: '林' },
    cy: { name: '陈宇', role: 'IT', av: '陈' }, hj: { name: '何静', role: '财务', av: '何' }, sy: { name: '孙悦', role: '生产', av: '孙' }, lb: { name: '刘博文', role: '安全', av: '刘' },
  };
  const BUILD = [['src/db/**', 18, 2140], ['src/api/**', 42, 6380], ['src/auth/**', 12, 1920], ['src/pages/**', 36, 5860],
    ['src/components/**', 58, 4730], ['src/services/**', 31, 3910], ['tests/**', 24, 3460]];
  const BUILT = BUILD.reduce((a, [, f, n]) => ({ files: a.files + f, lines: a.lines + n }), { files: 0, lines: 0 });
  // the year ahead, as the opening draws it: [day, what the business asks for]
  // the year ahead, as the opening draws it: a release every week (the dots), and some of what the business asks for along
  // the way: [week, request]
  const YEAR = [[2, '供应商分级'], [3, '对接 ERP'], [6, '新增生产二部'], [8, '外协厂纳入分级'], [14, '移动端审批'], [26, 'Core 升级'], [39, '负责人交接'], [48, '年度供应商评估']];
  const YW = 1140, yx = (w) => Math.round(YW * Math.pow(w / 52, 0.6));   // 52 weeks on a line, the early weeks given more room
  const STEPS = ['第一天 · 起点高', '每一次迭代 · 有章法', '之后很多年 · 走得远'];
  const SUPP = [  // fictional suppliers: no, name, department, category, qualification expiry, contract value
    ['SUP-0412', '华东精工', '生产部', '机加工 · 精密零件', '2026-11-20', '¥1,280,000'],
    ['SUP-0398', '鑫源电子', '研发部', '电子料 · 传感器', '2027-03-08', '¥640,000'],
    ['SUP-0377', '明川包装', '生产部', '包材 · 纸箱', '2026-11-05', '¥86,000'],
    ['SUP-0365', '恒泰物流', '行政部', '物流 · 城配', '2027-01-15', '¥320,000'],
    ['SUP-0351', '盛达化工', '生产部', '原料 · 树脂', '2026-12-02', '¥560,000'],
  ];
  const pill = (id, k, text) => `<span class="stt s-${k}"${id ? ` id="${id}"` : ''}><i></i><em>${text}</em></span>`;
  const tool = (k) => `<span class="tool ${k}">${{ cc: 'CC', cx: 'CX', oc: 'OC', pm: '调' }[k]}</span>`;
  const check = `<svg class="ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

  // the capability board: 24 of Core's capabilities under the website's names (core.html: Core plugins, built-in capabilities),
  // each card a small screen of what it already does in this supplier system. It sums up act one: the first column is what
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
    ['AI 知识库', 'book-open', '#7c3aed', `<div class="c-kn">${[['《供应商准入制度》', 1], ['《采购管理办法》', 0], ['《质量协议模板》', 0]].map(([n, c]) => `<div class="c-r">${ic('file-text')}<b>${n}</b>${c ? '<span class="c-tg c-pu">已引用</span>' : ''}</div>`).join('')}</div>`],
    ['模型接入', 'shuffle', '#7c3aed', `<div class="c-md">${[['Claude', '#d97757'], ['GPT', '#10a37f'], ['DeepSeek', '#4d6bfe'], ['通义千问', '#615ced'], ['Kimi', '#27272a'], ['本地模型', '#a1a1aa']].map(([n, c]) => `<span style="--c:${c}"><i></i>${ZH(n)}</span>`).join('')}</div>`],
    ['开发指引', 'book-marked', '#1677ff', `<div class="c-gd">${['数据建模', '权限', '工作流'].map((n) => `<div class="c-r"><span class="c-mdb">MD</span><b>${n}指引</b></div>`).join('')}<div class="c-r c-mu">人和 ${ZH('Agent')} 按同一套指引开发</div></div>`],
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

  // ---------------------------------------------------------------- the Studio console (five pages, video scale, 1.0×)
  const nav = () => {
    const it = (k, i, n, em) => `<div class="it" data-k="${k}">${ic(i)}${n}${em ? `<em id="navN">${em}</em>` : ''}</div>`;
    return `<aside class="ssd"><div class="slg">${K.LOGO.markStatic(18)}NocoBase<em>Studio</em></div>
      ${it('mine', 'list-todo', '我的任务', 2)}${it('agent', 'message-square', '我的 Agent')}${it('dash', 'layout-dashboard', '仪表盘')}
      <div class="grp">开发</div>${it('task', 'square-check', '任务')}${it('proj', 'folder-kanban', '项目')}${it('kb', 'book-open', '知识库')}${it('mem', 'brain', '项目记忆')}
      <div class="grp">质量</div>${it('qa', 'shield-check', '质量报告')}${it('cases', 'list-checks', '功能与用例')}
      <div class="grp">发布</div>${it('apps', 'box', '应用')}${it('env', 'server', '部署环境')}
      <div class="grp">Agent 团队</div>${it('agents', 'bot', 'Agents')}${it('runners', 'cpu', '运行环境')}${it('skills', 'wand-sparkles', '技能')}</aside>`;
  };
  // the pages in order: My Agent (the goal), the task (the agent team at work), My tasks (the decisions), the release, the
  // project memory. The page ids keep their components' styles (sp0 My Agent, sp5 the task, sp3 decisions, sp4 release, sp6 memory)
  const PAGE_NAV = ['agent', 'task', 'mine', 'apps', 'mem'];
  const VW = 1046, page = (k) => ({ x: -k * VW, y: 0, scale: 1 });

  // S2 · My Agent: 周航, who runs purchasing and does not code, says what he wants; the task gets its people and its agents
  const TASKS = [['PUR-23', '分级规则与评分'], ['PUR-24', '每季度自动重算'], ['PUR-25', '分级看板']];
  const ASK = '供应商要按 A/B/C 分级：质量、交期、价格打分，每季度重算。';
  const pageAgent = () => `<div class="spn" id="sp0" style="left:0">
      <div class="phd ahd"><b>供应商分级</b><small>Claude Code · Opus 5.5 · 周航的电脑<i></i></small></div>
      <div class="achat"><div class="msgs">
          <div class="mu" id="aU">${ZH(ASK)}</div>
          <div class="ma" id="aA">${tool('cc')}<div><div class="mt">读了代码和项目记忆，改动在供应商评分和准入流程。拆成 3 个任务：</div>
            <div class="mtk">${TASKS.map(([id, n], k) => `<div id="aT${k}"><span>${id}</span>${n}</div>`).join('')}</div>
            <div class="hand" id="aH">${ic('check')}已交给 Agent 团队 · 调度 Agent 开始安排</div></div></div></div>
        <div class="ainp"><span class="ph" id="aIn">回复，或说下一件事…</span><span class="snd">${ic('arrow-up')}</span></div></div>
      <div class="atk"><div class="ppl" id="aPpl"><div class="pp">${avatar('周航')}<span><b>周航</b><small>业务负责人 · 定规则、验收</small></span></div>
          <div class="pp">${avatar('王磊')}<span><b>王磊</b><small>技术负责人 · 批准上线</small></span></div>
          <div class="pp">${tool('pm')}<span><b>调度 Agent</b><small>拆分、分派、提问、交付</small></span></div></div>
        <div class="ah">任务<small id="aN">0</small></div><div class="aE" id="aE">这段对话还没有任务</div>
        ${TASKS.map(([id, n], k) => `<div class="tk" id="aK${k}"><b>${n}</b><div class="tl2"><span>${id}</span>${pill('aS' + k, 'idle', '待规划')}</div></div>`).join('')}</div></div>`;

  // S3 · the task: the coordinator (调度 Agent) hands each step to the agent that is good at it; tests and a review by another vendor's model
  const PLAN = [['梳理分级规则与 6 个验收场景', 'cc', 'Claude · Opus 5.5', 'done'], ['分级字段与数据迁移', 'cx', 'Codex · GPT-5.5', 'done'],
    ['评分计算与季度重算', 'cx', 'Codex · GPT-5.5', 'run'], ['为 6 个验收场景写测试', 'cc', 'Claude · Sonnet 5.5', 'run'], ['代码评审（换一家模型）', 'cc', 'Claude · Opus 5.5', 'todo']];
  const LOG = [
    ['pm', '调度 Agent', '把第 2–4 步分给 Codex 和 Claude', '18:36'],
    ['cx', 'Codex', '评分计算完成，提交 PR #231', '21:08'],
    ['cc', 'Claude · Sonnet', '6 个场景的测试 46/46 通过', '22:14'],
    ['cc', 'Claude · Opus', '评审：1 处要改，新接口少了权限检查', '22:51', 'am'],
    ['cx', 'Codex', '已修改，评审通过', '23:18', 'ok'],
    ['pm', '调度 Agent', '交给周航验收 · 附验收清单与预览', '23:40'],
  ];
  const pageTask = () => `<div class="spn" id="sp5" style="left:${VW}px">
      <div class="phd"><span class="id">PUR-23</span><b>分级规则与评分</b>${pill('tSt', 'upd', '进行中')}<span class="sp1"></span><small id="tClk"><b>18:36</b></small></div>
      <div class="tmeta"><span><small>负责人</small>${avatar('周航')}周航</span><span><small>执行</small>${tool('pm')}调度 Agent</span><span><small>项目</small>供应商管理</span></div>
      <div class="plan"><div class="plh"><b>执行计划</b><small id="plN">第 3 / 5 步 · 2 个 Agent 并行</small></div>
        ${PLAN.map(([n, t, who, st], k) => `<div class="pr ${st}" id="pl${k}"><span class="pc">${check}<i></i></span><span class="pn">${ZH(n)}</span><span class="pw">${tool(t)}${ZH(who)}</span><span class="ps" id="plS${k}">${k === 3 ? '<b id="tN">31</b> / 46' : ''}</span></div>`).join('')}
        <div class="pchips"><span>${ic('git-pull-request')}PR #231</span><span>${ic('git-branch')}agent/pur-23</span><span class="bl">${ic('eye')}预览 · pur-23</span><span id="ciC">${ic('circle-dashed')}CI 运行中</span></div></div>
      <div class="act"><div class="ach">动态</div>${LOG.map(([t, who, x, tm, c], k) => `<div class="ar ${c || ''}" id="lg${k}">${tool(t)}<span><b>${ZH(who)}</b> ${ZH(x)}</span><time>${tm}</time></div>`).join('')}</div></div>`;

  // S4 · decisions go to the right people: 周航 answers a question and accepts the feature; the release lands on 王磊's list
  const pageMine = () => `<div class="spn" id="sp3" style="left:${VW * 2}px">
      <div class="col2" id="dZ"><div class="ch2">${avatar('周航')}<span><b>周航</b><small>采购主管 · 我的任务</small></span><em class="gc" id="gZ">等你处理 2</em></div>
        <div class="tr4" id="dq"><b>评分权重</b><small><span class="m">PUR-23</span> · <span class="w" id="dqs">等你决定：质量和交期，哪个更重要？</span></small>
          <div class="qa" id="dqA">${K.btnO('', '质量优先', 'qaY')}${K.btnO('', '交期优先')}</div></div>
        <div class="tr4 sel" id="dz0"><b>供应商分级</b><small><span class="m">PUR-23</span> · <span class="w" id="dz0s">等你验收：在预览里走一遍 6 个场景</span></small>
          <div class="acc">${['A ≥ 85 分，B ≥ 70 分，其余为 C', '每季度 1 日自动重算', '生产部只看到本部门供应商'].map((x) => `<div>${ic('circle-check')}${ZH(x)}</div>`).join('')}</div>
          <div class="prev"><div class="pvh"><i></i><i></i><i></i>preview · pur-23</div>
            ${[['华东精工', 'A', 92.4], ['明川包装', 'B', 76.5], ['盛达化工', 'C', 64.0]].map(([n, t, s]) => `<div class="pvr"><span>${n}</span><span><span class="tier t${t}">${t}</span></span><span class="sc">${s}</span></div>`).join('')}</div>
          <div class="acts" id="accActs">${K.btnO('', '退回')}${K.btnD('check', '验收通过', 'accBtn')}</div></div>
        <div class="gh more">进行中 9 · 已完成 23</div></div>
      <div class="col2" id="dW"><div class="ch2">${avatar('王磊')}<span><b>王磊</b><small>技术负责人 · 我的任务</small></span><em class="gc" id="gW">等你处理 2</em></div>
        <div class="tr4 nw" id="dw0"><b>供应商管理 v1.1 上线生产</b><small><span class="m">PUR-23/24/25</span> · <span class="w">等你批准 · 周航已验收 · 测试与评审通过</span></small></div>
        <div class="tr4"><b>资产领用归还</b><small><span class="m">ITAM-22</span> · NocoITAM · <span class="w">等你确认方案：新增数据表</span></small></div>
        <div class="tr4"><b>NocoCRM v1.9 上线生产</b><small><span class="m">CRM-150</span> · NocoCRM · <span class="w">等你批准 · 陈思已验收</span></small></div>
        <div class="gh more">进行中 14 · 已完成 41</div></div>
      ${K.cursorSVG('curS3')}</div>`;

  // S5–S6 · release: the app's environments, a person approves production, every version can be rolled back; then a season
  // of versions grows on the same page
  const APPS = [['供', '供应商管理', 'v1.0', 'run', '运行中', 1], ['采', '采购申请', 'v2.3', 'run', '运行中'], ['合', '合同管理', 'v1.4', 'upd', '部署中'],
    ['N', 'NocoCRM', 'v1.8', 'run', '运行中'], ['N', 'NocoSupport', 'v1.4', 'run', '运行中'], ['N', 'NocoHR', 'v1.2', 'run', '运行中']];
  const VERS = [  // the versions after v1.1, one a week: version, week, what changed, who asked
    ['v1.2', '第 3 周', '交付与质检记录从 ERP 读取', '陈宇'], ['v1.3', '第 4 周', '超过 50 万的合同加财务复核', '何静'], ['v1.4', '第 5 周', '资质到期前 30 天提醒', '孙悦'],
    ['v1.5', '第 6 周', '新增生产二部的权限', '刘博文'], ['v1.6', '第 7 周', '供应商评分看板', '周航']];
  const hrow = (id, v, d, what, who, st) => `<div class="hr" id="${id}"><b>${v}</b><span>${d} · ${ZH(what)}</span><small>${who}</small><span class="hs" id="${id}s">${st}</span></div>`;
  const rollBtn = (id) => K.btnO('rotate-ccw', '回滚到此版', id);
  const pageApps = () => `<div class="spn" id="sp4" style="left:${VW * 3}px">
      <div class="apl"><div class="phd"><b>应用</b><small>6</small></div>
        ${APPS.map(([L, n, v, k, s, on]) => `<div class="ar${on ? ' on' : ''}"><i class="la">${L}</i><span class="an2"><b>${ZH(n)}</b><small${on ? ' id="arV"' : ''}>${v}</small></span>${pill(on ? 'arS' : '', k, s)}</div>`).join('')}</div>
      <div class="rls"><div class="rh2"><b>供应商管理</b><small id="rhS">发布 v1.1 · 3 个任务 · PUR-23/24/25</small></div>
        <div class="lanes2">${[['测试', 'v1.1', 'CI 自动部署 · 46/46', 'run'], ['预发布', 'v1.1', '周航已验收', 'run'], ['生产', 'v1.0', '等王磊批准 v1.1', 'wait']]
          .map(([n, v, s, k], j) => `<div class="ln2${k === 'wait' ? ' w' : ''}" id="ln${j}"><div class="l1"><b>${n}</b>${pill(j === 2 ? 'lnS' : '', k, k === 'wait' ? '待批准' : '运行中')}</div><div class="l2"${j === 2 ? ' id="lnV"' : ''}>${v}</div><small${j === 2 ? ' id="lnT"' : ''}>${s}</small></div>`).join(`<i class="lar">${ic('arrow-right')}</i>`)}</div>
        <div class="apv2" id="apv"><div class="ap1">${avatar('王磊', '王')}<span><b>王磊</b> · 技术负责人 · 生产环境审批人</span></div>
          <div class="ap3"><div>${ic('circle-check')}测试 46/46 · 评审通过</div><div>${ic('circle-check')}周航已验收 · 6 个场景</div><div>${ic('circle-check')}与预发布运行同一份构建</div><div>${ic('circle-check')}生产需要的变量都已设置</div></div>
          <div class="ap4"><span id="apSt"></span>${K.btnO('', '暂缓', 'apNo')}${K.btnD('rocket', '批准上线', 'apBtn')}</div></div>
        <div class="hist"><div class="hh2">版本记录<small id="hhN">2 个版本</small></div>
          ${VERS.slice().reverse().map((x, j) => hrow('hm' + (VERS.length - 1 - j), x[0], x[1], x[2], x[3] + '提出 · 王磊批准', '')).join('')}
          ${hrow('hr0', 'v1.1', '第 2 周', '供应商分级与季度重算', '周航验收 · 王磊批准', pill('', 'idle', '待发布'))}
          ${hrow('hr1', 'v1.0', '第 1 天', '第一版上线', '王磊批准', pill('', 'run', '当前'))}</div></div>
      ${K.cursorSVG('curS4')}</div>`;
  // S7 · the project memory (Studio's page of the same name): what the agents learned, kept in the repository and merged with
  // each task's PR; the next task reads it before it starts. [name, type, description, when]; six of the twelve on screen
  const MEMS = [['生产部只看本部门供应商', 'fb', '孙悦确认：数据范围按部门划分，供应商 Agent 同样只读', '第 1 天'],
    ['评分权重：质量优先', 'fb', '周航确认：分级打分时质量权重最高，其次是交期和价格', '第 2 周'],
    ['交付记录以 ERP 为准', 'pj', '交付与质检数据只从 ERP 读取，本系统不修改（陈宇）', '第 3 周'],
    ['ERP 接口说明', 'rf', '字段含义和调用频率限制，见 IT 部 Wiki 的「ERP 接口」页', '第 3 周'],
    ['财务复核的 50 万阈值', 'pj', '来自《采购管理办法》第 12 条，调整前先和何静确认', '第 4 周'],
    ['新部门先配数据范围', 'fb', '刘博文确认：新部门上线前先配好权限范围，再开放页面', '第 6 周']];
  const MTY = { fb: '反馈', pj: '项目', rf: '参考' };
  const pageMem = () => `<div class="spn" id="sp6" style="left:${VW * 4}px">
      <div class="phd"><b>项目记忆</b><small>${ZH('Agent 在任务中记下的经验，下次开工前先读')}</small></div>
      <div class="m-fl"><span class="m-sel"><small>项目</small>供应商管理${ic('chevron-down')}</span><span class="m-sel"><small>仓库</small><code>acme/supplier-app</code>${ic('chevron-down')}</span>
        <span class="m-sr">${ic('search')}搜索记忆</span><span class="m-st">来自 <code>main@7c41e2a</code> · 刚刚检查 · 12 条</span></div>
      <div class="m-tab">${[['全部', 12], ['反馈', 5], ['项目', 4], ['参考', 3]].map(([n, k], j) => `<span${j ? '' : ' class="on"'}>${n}<em>${k}</em></span>`).join('')}</div>
      <div class="m-grid">${MEMS.map(([n, ty, d, day], k) => `<div class="m-cd" id="mm${k}"><div class="m-h"><b>${ZH(n)}</b><span class="m-ty">${MTY[ty]}</span></div><p>${ZH(d)}</p><small>${day}</small></div>`).join('')}</div>
      <div class="m-run" id="mRun">${tool('cc')}<div><div class="m-r1"><b>PUR-61 · 外协加工厂纳入分级</b><small>${ZH('Claude · Opus 5.5')} · 开工前读了 12 条项目记忆</small></div>
        <div class="m-r2" id="mR2">${ZH('用到 2 条：外协厂也按质量优先打分，交付数据从 ERP 读取。')}</div></div></div></div>`;
  const studioHTML = () => `<div class="lt win" id="stc">${nav()}<div class="svp"><div class="scam" id="scam">${pageAgent()}${pageTask()}${pageMine()}${pageApps()}${pageMem()}</div></div></div>`;

  // ---------------------------------------------------------------- act three: the upgrade, the handover, a year
  const upHTML = () => `<div class="ugd" id="ugd"><div class="ugB" id="ugB"><div class="ugl"><b>供应商管理</b><span>业务代码 · Agent 编写</span></div>
        <div class="ugc"><div><b>export const</b> tiers = { A: 85, B: 70 }</div><div><b>export const</b> admission = { review: 'finance', over: 500_000 }</div><div><b>export const</b> erp = { source: 'erp_deliveries', readonly: true }</div></div>
        <div class="ugk">${ic('lock')}不改动底座</div></div>
      <div class="ugV"><i></i><span>调用</span><i></i></div>
      <div class="ugS"><div class="ugC" id="ugC0"><b>NocoBase Core</b><em>3.0</em></div><div class="ugC nw" id="ugC1"><b>NocoBase Core</b><em>3.1</em></div></div></div>
    <div class="ugt lt win" id="ugt"><div class="uth"><span class="id">CORE-8</span><b>升级到 Core 3.1</b>${pill('ugSt', 'upd', '进行中')}</div>
      <div class="utm">${tool('pm')}调度 Agent 安排 · ${tool('cx')}Codex · GPT-5.5 适配 · ${tool('cc')}Claude 评审</div>
      ${[['按变更说明适配 2 处', '只动业务代码里调用 Core 的地方'], ['测试 58/58 通过 · 评审通过', '换一家模型评审'], ['王磊批准上线', '供应商管理 v2.0 · 运行在 Core 3.1']]
        .map(([a, b], k) => `<div class="utr" id="ut${k}"><span class="pc">${check}<i></i></span><span><b>${ZH(a)}</b><small>${ZH(b)}</small></span></div>`).join('')}</div>`;
  const handHTML = () => `<div class="hov lt win" id="hov"><div class="hvh">技术负责人</div>
      <div class="hvrow"><div class="hp" id="hpA">${avatar('王磊')}<b>王磊</b><small>第 1–39 周</small></div><i class="har" id="har">${ic('arrow-right')}</i>
        <div class="hp" id="hpB">${avatar('林悦')}<b>林悦</b><small>第 39 周起</small></div></div>
      <div class="hvs">${[['需求', '140 项'], ['测试', '640 项'], ['发布记录', '39 次']].map(([a, b]) => `<span><small>${a}</small><b>${b}</b></span>`).join('')}</div>
      <div class="hvf">随项目留下，换人也看得到</div></div>
    <div class="kbp lt win" id="kbp"><div class="kbh">${ic('book-open')}知识库</div>
      ${[['《供应商准入规则》', 'v5 · 更新于第 36 周'], ['分级与评分说明', '第 2 周起 · 6 次修订']].map(([a, b], k) => `<div class="kbr" id="kb${k}">${ic('file-text')}<b>${a}</b><small>${b}</small></div>`).join('')}
      <div class="kbh sk">${ic('brain')}项目记忆<small>31 条 · ${ZH('Agent 在任务中记下')}</small></div>
      <div class="kbm" id="kbm">${['评分权重：质量优先', '交付记录以 ERP 为准', '财务复核的 50 万阈值'].map((x) => `<span>${ZH(x)}</span>`).join('')}<span class="mo">+28</span></div>
      <div class="kbh sk">${ic('wand-sparkles')}团队技能</div>
      <div class="kbs" id="kbs">${['需求澄清规范', '开发规范', '评审规范', '发布清单'].map((x) => `<span>${x}</span>`).join('')}</div>
      <div class="kbq" id="kbq">${avatar('林悦')}<span>合同到期提醒，要不要按品类区分？</span></div>
      <div class="kba" id="kba">${tool('cc')}<span>${ZH('按《准入规则》v5：机加工和原料类提前 60 天，其余 30 天。已拆成 2 个任务。')}</span></div></div>`;
  const yearHTML = () => `<div class="yn">${[['yN0', '52', '周'], ['yN1', '186', '项需求上线'], ['yN2', 'v2.26', '当前版本']].map(([id, v, l]) => `<div class="yv"><b id="${id}">${v}</b><span>${l}</span></div>`).join('')}</div>
    <div class="ytags">${[['server', '部署在你自己的服务器'], ['github', '代码开源'], ['shuffle', '自选模型与 Agent']].map(([i, t], k) => `<span id="yt${k}">${ic(i)}${t}</span>`).join('')}</div>`;
  const RECAP = [['第一天', '起点高', 'NocoBase Core', '让 Agent 专心写业务，通用底座已经就绪'], ['每一次迭代', '有章法', 'NocoBase Studio', '让团队专心做决策，执行交给 Agent 团队'],
    ['之后很多年', '走得远', '开源 · 私有部署', '系统长期稳定迭代，代码和数据归你所有']];

  // ---------------------------------------------------------------- the stage
  function build() {
    const A_LINES = [['u', ''], ...BUILD.map(([f, c, n]) => ['w', f, n, c]), ['ok', '已在本地运行  localhost:3000']];
    // the supplier list for the permissions proof, and who looks at it
    S.acl.rows = SUPP.map(([no, n, dept, cat, exp, amt]) => [no, n, dept, cat, exp, amt]);
    S.acl.viewers = [{ n: '周航', role: '采购主管', av: '周', all: true }, { n: '孙悦', role: '生产部', av: '孙', dept: '生产部' },
      { n: '供应商 Agent', role: '业务 Agent · 生产部', av: ic('bot'), dept: '生产部' }];
    S.acl.text = { viewAs: '查看身份', cols: ['编号', '供应商', '品类', '资质到期', '合同额'], all: '全部部门', only: (d) => '仅' + d, count: '家供应商',
      shown: '可编辑', masked: '只读', locked: '其他部门 · 无权查看' };
    $('#stage').innerHTML = `${K.canvasHTML()}
      <section class="scene" id="s1"><div id="s1cam" class="cam"><div id="s1w" style="position:absolute;inset:0">
        ${S.term.html('termA', 'left:420px;top:150px;width:600px;height:420px', '~/supplier-app — coding agent', A_LINES, { br: 'main' })}</div></div>
        <div class="ttl2" id="tTop"><span class="h1 split">AI 写代码很快，</span><span class="h2 split">但企业要的是长期可靠的系统。</span></div>
        <div id="year"><i class="yl" id="yl"></i>
          ${[1, 13, 26, 39, 52].map((w) => `<span class="yt" style="left:${yx(w)}px"><i></i>第 ${w} 周</span>`).join('')}
          ${Array.from({ length: 52 }, (_, k) => `<i class="yw" style="left:${yx(k + 1)}px"></i>`).join('')}
          ${YEAR.map(([d, t], k) => `<span class="yc ${k % 2 ? 'lo' : 'hi'}" id="yc${k}" style="left:${yx(d)}px"><span class="yb"><small>第 ${d} 周</small><span>${ZH(t)}</span></span><b class="stem"></b><i class="dt"></i></span>`).join('')}</div></section>
      <section class="scene" id="sT">${K.lockHTML('lockA', 84)}
        <div id="bPos">用 ${ZH('AI')} 开发和运行业务系统的开源平台</div>
        <div id="bRoles"><span class="rp" id="rp0">${ic('bot')}${ZH('Agent 写代码、做执行')}</span><span class="rp nb" id="rp1"><span class="lk">${K.LOGO.markStatic(18)}<span class="en">NocoBase</span></span>提供底座和流程</span><span class="rp" id="rp2">${ic('user-round')}人来做决策</span></div></section>
      <section class="scene" id="a1"><div class="dayl">第 1 天</div>${K.bubHTML({ ...P.zh, msg: '建立供应商档案，跟踪资质到期，通过审批后才能合作。' }, 'b1')}</section>
      <section class="scene" id="s3">${S.stack.html({ chips: ['数据与文件', '权限', '工作流与审批'], focusChip: '数据与文件', codeLabel: '供应商管理', codeBy: '业务代码 · Agent 编写',
        code: ['<b>export interface</b> Supplier { id: string; code: string; dept: string }', '<b>export const</b> admission = { review: \'finance\', over: 500_000 }',
          '<b>export const</b> scopes = { buyer: \'department\', lead: \'all\', supplierAgent: \'department\' }', '<b>export const</b> reminders = { qualification: { before: \'30d\' } }',
          '<b>export const</b> pages = [\'suppliers\', \'admissions\', \'qualifications\']'] })}
        ${K.chapHTML('chC', 'Core', ZH('让 Agent 专心写业务') + '，' + NB('通用底座已经就绪'))}
        <div id="agents">你的 ${ZH('Coding Agent')}：<b>Claude Code · Codex · Cursor · OpenCode · …</b></div></section>
      <section class="scene" id="sW"><div class="persp" id="cbView" style="perspective:1600px"><div id="cbRig">${CAPS.map(capHTML).join('')}</div></div>
        <div id="cbCnt"><b id="cbN">0</b><i class="pl">+</i><span>项企业级能力</span></div><div id="cbShade"></div>
        ${K.tcard('tWall', '第一版就是' + NB('企业级'), 336)}<div id="tWsub">${ZH('业务系统要用的通用能力，Agent 都不用再写一遍')}</div></section>
      <section class="scene pf3" id="pP">${K.ftlH('ftP', '第一版就是企业级', '权限', 'Agent 和员工，同一套权限', 'ftl ctr')}
        <div class="dwin lt win">${S.acl.body()}<div class="dfoot" id="aclFoot"><span class="ic">${ic('shield-check')}</span><span class="hu"><b>按部门划分数据范围</b>人和 Agent 用同一套角色与权限</span><span class="ag"><b>供应商 Agent</b>和孙悦同样的范围 · 只读 · 不能修改准入状态</span></div>${K.cursorSVG('cur0')}</div></section>
      <section class="scene pf2" id="pW"><div class="canvas2"></div><div class="wfv"><div class="cam" id="wfCam"><div class="wbox">${wfBody()}</div></div></div>
        <div class="strip sm" id="wfStrip"><span class="k">Agent 编写</span><span class="r"></span><span class="f">server/workflows/<b>1,240 行</b></span></div>
        ${K.ftl('ftW', '第一版就是企业级', '审批', '超出授权，交给人批准')}
        <div class="wfoot" id="wfFoot"><span class="ic">${ic('git-branch')}</span>Agent 提建议，人做决定 · 每一次流转都有记录</div></section>
      <section class="scene" id="sS"><div id="stcW" style="position:absolute;inset:0">${studioHTML()}</div>
        ${K.chapHTML('chS', 'Studio', ZH('让团队专心做决策') + '，' + NB(ZH('执行交给 Agent 团队')))}
        ${K.ftlH('cT0', '第 2 周 · 周一', '交代目标', '用业务语言说清规则，Agent 拆成任务', 'hubT')}
        ${K.ftlH('cT1', '第 2 周 · 周一', '执行交给 Agent 团队', '按擅长分工，测试和评审全天推进', 'hubT')}
        ${K.ftlH('cT2', '第 2 周 · 周二', '做决定与验收', '取舍和验收，由业务负责人来定', 'hubT')}
        ${K.ftlH('cT3', '第 2 周 · 周二', '批准上线', '技术负责人批准后上线，每个版本都能回滚', 'hubT')}
        ${K.ftlH('cT4', '第 3 → 7 周', '每周一版，都按同一套流程', '需求一直在来，每一版都经过测试、评审、验收和批准', 'hubT')}
        ${K.ftlH('cT5', '第 8 周', 'Agent 越做越懂这个系统', '人确认过的做法、决定的原因都记进项目记忆，下次开工先读', 'hubT')}</section>
      <section class="scene" id="y0">${K.tcard('tY', ZH('之后很多年，') + NB('系统长期稳定迭代'), 366)}</section>
      <section class="scene" id="yU">${K.ftlH('yT0', '第 26 周', 'Core 升级，业务不用重写', '升级作为一个任务交给 Agent，测试通过、批准后上线', 'hubT')}${upHTML()}</section>
      <section class="scene" id="yH">${K.ftlH('yT1', '第 39 周', '换了负责人，工作接着做', '知识库、项目记忆和团队技能都在，新同事和 Agent 都能接手', 'hubT')}${handHTML()}</section>
      <section class="scene" id="yY">${K.ftlH('yT2', '第 52 周', '一年后，系统还在稳定迭代', '代码、数据和运行环境，始终在你自己手里', 'hubT')}${yearHTML()}</section>
      <section class="scene" id="rcp">${RECAP.map(([a, b, c, d], k) => `<div class="rc" id="rc${k}" style="left:${96 + k * 434}px"><small>${a}</small><b>${b}</b><em>${ZH(c)}</em><p>${ZH(d)}</p></div>`).join('')}
        <i class="rsep" style="left:504px"></i><i class="rsep" style="left:938px"></i></section>
      <section class="scene" id="sE"><div id="sEw" class="cam">${K.lockHTML('lockE', 76)}
        <div id="eZh" class="split">构建可靠的业务系统</div><div id="endTags">开源 · 私有部署 · 自选模型与 Agent</div><div id="endBeta">NOCOBASE 3.0 BETA</div></div></section>
      <div class="rail2" id="rail2">${STEPS.map((s, k) => `${k ? '<b></b>' : ''}<span class="rs" id="rs${k}"><i>${ic('check')}</i>${s}</span>`).join('')}</div>
      <div class="ver" id="ver"><span class="dot"></span><b>供应商管理</b><em id="verV">开发中</em><small id="verD">第 1 天</small></div>
      ${K.blackHTML()}`;
    $$('#pP .dr .amt').forEach((e) => { e.style.fontSize = '15.5px'; e.style.color = '#52525b'; });
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

  // ---------------------------------------------------------------- the rail and the version badge
  const rail = (k, t, done = k) => K.call(() => STEPS.forEach((_, j) => { const e = $('#rs' + j); e.classList.toggle('done', j < done); e.classList.toggle('cur', j === k); }), t);
  const ver = (v, d, t, pop = true) => {
    K.call(() => { $('#verV').textContent = v; $('#verD').textContent = d; }, t);
    if (pop) { tl.fromTo('#ver', { scale: 1 }, { scale: 1.06, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.inOut', transformOrigin: '100% 50%' }, t); K.ring('#ver', t); }
  };

  // ---------------------------------------------------------------- the film
  function film() {
    gsap.set('.scene, .ftl, .hubT, #agents, .chap, #rail2, #ver', { autoAlpha: 0 });
    gsap.set('#termA .ln', { autoAlpha: 0 });
    gsap.set('.cam, #wfCam, #scam', { transformOrigin: '0 0' });
    gsap.set('#grid', { '--gs': '32px', '--gx': '16px', '--gy': '5px' });
    gsap.set('#b1', { xPercent: -50 });
    K.ambient('neutral', 0, 0);
    opening();
    brand();
    actOne();
    actTwo();
    actThree();
    closing();
  }

  // ===== O1–O2 · AI writes a system in seconds; a business system has to last a year and more
  function opening() {
    K.beat('开场', 0); K.cue('open', 0);
    K.show('#s1', 0);
    const ptx = $('#termA .ln.u .tx'); ptx.textContent = PROMPT;
    const pl = K.box($('#termA .ln.u'), $('#s1w')), pw = ptx.offsetWidth; ptx.textContent = '';
    K.camTo('#s1cam', K.camV([pl.x + 30 + pw / 2, pl.cy], [720, 405], 1.7), 0, 0);
    tl.fromTo('#termA', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, T.term);
    S.term.lineIn('termA', 0, T.type - 0.05);
    K.typeOn(ptx, PROMPT, T.type, 0.06);
    for (let k = 0; k < PROMPT.length; k++) K.sfx('key', T.type + k * 0.06, { i: k });
    K.sfx('enter', T.enter);
    K.camTo('#s1cam', K.ID, T.enter + 0.05, 1.1);
    BUILD.forEach((_, k) => S.term.lineIn('termA', 1 + k, T.build[k]));
    S.term.count('termA', 0, BUILT.lines, T.build[0], T.run - T.build[0], BUILT.files);
    S.term.lineIn('termA', 1 + BUILD.length, T.run); K.sfx('ok', T.run, { g: -8 }); K.cue('run1', T.run);
    // the terminal steps back and the year comes in front of it
    tl.to('#termA', { x: -330, y: -96, scale: 0.6, opacity: 0.12, filter: 'blur(3px)', duration: 0.9, ease: 'power3.inOut' }, T.pull);
    tl.to('#termA', { opacity: 0, duration: 0.6, ease: 'power1.in' }, T.tA + 0.5);
    K.cue('title', T.tA);
    tl.fromTo($$('#tTop .h1 .ch, #tTop .h1 .sp'), { yPercent: 45, opacity: 0, filter: 'blur(8px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out', stagger: 0.035 }, T.tA);
    tl.fromTo('#yl', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power3.inOut' }, T.year); K.cue('year', T.year);
    tl.fromTo('#year .yt', { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'expo.out' }, T.year + 0.4);
    // a release every week: each week's dot comes up as the line reaches it (the inverse of the line's power3.inOut)
    const reach = (f) => (f < 0.5 ? Math.cbrt(f / 4) : 1 - Math.cbrt(2 * (1 - f)) / 2) * 1.2;
    $$('#year .yw').forEach((e, k) => tl.fromTo(e, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2.5)' }, T.year + reach(yx(k + 1) / YW)));
    YEAR.forEach((_, k) => {
      const t = T.yc[k];
      tl.fromTo('#yc' + k + ' .yb', { autoAlpha: 0, y: 14, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'expo.out' }, t);
      tl.fromTo('#yc' + k + ' .stem', { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'power2.out', transformOrigin: '50% 100%' }, t);
      tl.fromTo('#yc' + k + ' .dt', { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, t);
      K.sfx('pop', t, { i: k, g: k < 3 ? -2 : -7 }); K.cue('chip', t, { i: k });
    });
    K.cue('tB', T.tB);
    tl.fromTo($$('#tTop .h2 .ch, #tTop .h2 .sp'), { yPercent: 45, opacity: 0, filter: 'blur(8px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out', stagger: 0.035 }, T.tB);
    tl.to('#year', { x: -40, duration: T.out0 - T.year, ease: 'sine.inOut' }, T.year);
    tl.to(['#tTop', '#year', '#termA'], { autoAlpha: 0, filter: 'blur(8px)', duration: 0.5, ease: 'power2.in', stagger: 0.05 }, T.out0);
    K.hide('#s1', T.out0 + 0.7);
  }

  // ===== B1 · the brick lands; the line; the division of work
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

  // ===== act one · day one, a higher start: Core
  function actOne() {
    K.beat('第一天 · 起点高', T.a1); K.cue('a1', T.a1);
    // the rail and the badge come up and stay to the recap
    tl.fromTo(['#rail2', '#ver'], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.1 }, T.a1 - 0.4);
    rail(0, T.a1);
    // A1 · the request
    K.show('#a1', T.a1);
    tl.fromTo('#a1 .dayl', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, T.bub1 - 0.1);
    tl.fromTo('#b1', { autoAlpha: 0, y: 24, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out' }, T.bub1);
    K.sfx('pop', T.bub1, { g: -6 });
    tl.to('#a1', { autoAlpha: 0, y: -16, filter: 'blur(6px)', duration: 0.5, ease: 'power2.in' }, T.core0 - 0.45);
    K.hide('#a1', T.core0 + 0.1);

    // A2 · chapter: Core — the letters land; the stack rises out of focus behind them; the business code lands on Core
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
    tl.fromTo('#slF .fchip', { opacity: 0.2 }, { opacity: 1, stagger: 0.1, duration: 0.3, ease: 'power2.out' }, T.fchips);
    tl.fromTo('#agents', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, T.agents);
    // out: dive into the foundation, into the first two things it already has
    tl.to(['#chC', '#agents'], { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, T.dive - 0.3);
    const fb = K.stageBoxLater('#slF .lbl');
    K.call(() => { const f = fb(); $('#zoomer').style.transformOrigin = `${f.cx}px ${f.cy}px`; }, T.dive - 0.02);
    tl.to('#zoomer', { scale: 3.0, autoAlpha: 0, duration: 0.8, ease: 'power3.in' }, T.dive);
    K.mb(T.dive + 0.2, T.dive + 0.85);
    K.sfx('whoosh', T.dive + 0.35, { i: 1 }); K.cue('dive', T.dive);
    K.hide('#s3', T.p2);

    // A3–A4 · the first version is enterprise-grade: permissions, then approval
    proofPerm(T.p2, T.p3);
    proofFlow(T.p3, T.wall);

    // A5 · the capability board, summing up: the approval pulls back into it; close in, the cards switch on column by column
    // (the first column in eighths, the rest in sixteenths) while the count climbs to 20+; pull back to all 24 on one
    // screen; the line over the dimmed board (the first version is enterprise-grade) as v1.0 goes live; a whip pan into Studio
    K.beat('20+ 企业级能力', T.wall); K.cue('wall', T.wall);
    K.show('#sW', T.wall - 0.2);
    const LIT = CAPS.map((_, i) => i < 4 ? T.wall + 0.25 + i * 0.25 : T.wall + 1.25 + (i - 4) * 0.125);
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
    tl.to('#cbRig', { scale: 1.015, duration: T.a2 - T.wPull - 0.9, ease: 'none' }, T.wPull + 0.9);
    // the line
    tl.to('#cbCnt', { autoAlpha: 0, y: -8, duration: 0.35, ease: 'power2.in' }, T.wLine - 0.15);
    tl.to('#cbRig', { autoAlpha: 0.38, filter: 'blur(3px)', duration: 0.55, ease: 'power2.inOut' }, T.wLine);
    tl.fromTo('#cbShade', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.55 }, T.wLine);
    K.tcardIn('#tWall', T.wLine + 0.15);
    tl.fromTo('#tWsub', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, T.wLine + 0.7);
    // the first version is live, on day one
    ver('v1.0', '第 1 天', T.v10); K.sfx('ok', T.v10, { g: -2 }); K.cue('v10', T.v10);
    // out: whip pan to the left, into Studio
    tl.to('#sW', { x: -1500, duration: 0.4, ease: 'power3.in' }, T.a2 - 0.4);
    K.mb(T.a2 - 0.4, T.a2 + 0.05);
    K.sfx('whoosh', T.a2 - 0.4, { i: 4 }); K.cue('whip', T.a2 - 0.4);
    K.hide('#sW', T.a2 + 0.05);
    tl.set('#sW', { x: 0 }, T.a2 + 0.06);
  }

  // ---------------------------------------------------------------- A3 · 权限 — one list, three viewers; the agent sees what a colleague sees
  function proofPerm(at, next) {
    K.beat('权限', at); K.cue('p2', at);
    const s = '#pP', win = '#pP .dwin';
    K.show(s, at - 0.05);
    K.gridTo(K.ID, at);
    tl.fromTo(win, { autoAlpha: 0, scale: 1.12, transformOrigin: '50% 10%' }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'expo.out' }, at - 0.05);
    K.ftlIn('#ftP', at + 0.15);
    tl.to(win, { scale: 1.03, duration: next - at - 0.8, ease: 'sine.inOut' }, at + 0.8);
    S.acl.init();
    const k1 = at + 1.4, k2 = at + 3.1;
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
    K.beat('审批', at); K.cue('p3', at);
    const s = '#pW', q = (sel) => K.box($(sel), $('#pW .wbox'));
    K.show(s, at - 0.05);
    const n1 = q('#n1'), k = 1.08, C = [180, 235], SC = [560, 392];
    tl.fromTo('#wfCam', K.camV([n1.cx, n1.cy], [952, 450], k * 2.5 / 1.5), { ...K.camV(C, SC, k), duration: 0.9, ease: 'power3.out' }, at - 0.05);
    K.ftlIn('#ftW', at + 0.45);
    tl.fromTo('#wfStrip', { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, at + 0.7);
    K.typeOn($('#wfStrip .r'), '合同超过 50 万，转财务复核', at + 0.95, 0.045);
    const e = (dt) => at + 1.1 + dt, lit = (id) => S.wf.litOnly('#pW', id);
    K.call(() => { lit('#n1')(); $('#n1s').textContent = 'SUP-0412 华东精工 · 建议准入'; }, e(0));
    K.cls('#v1', 'on', e(0.45)); K.call(lit('#n2'), e(0.5));
    K.cls('#n2b', 'on', e(0.9)); K.cls('#v2', 'on', e(1.2)); K.call(lit('#dia'), e(1.4));
    tl.to('#wfCam', { ...K.camV(C, SC, k * 1.03), duration: 5.0, ease: 'sine.inOut' }, e(0.9));
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

  // ===== act two · every change, well governed: Studio — one console, five pages; the camera only slides page to page
  function actTwo() {
    K.beat('每一次迭代 · 有章法', T.a2); K.cue('a2', T.a2);
    rail(1, T.a2); ver('v1.0', '第 2 周', T.a2 + 0.3, false);
    const title = (id, t0, t1) => {
      K.show(id, t0);
      tl.fromTo($$(id + ' .fi'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, t0);
      tl.fromTo($$(id + ' .fzh'), { autoAlpha: 0, y: 16, filter: 'blur(6px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out' }, t0 + 0.05);
      tl.fromTo($$(id + ' .r2 > *'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, t0 + 0.25);
      if (t1) { tl.to(id, { autoAlpha: 0, y: -10, duration: 0.3, ease: 'power2.in' }, t1); tl.set(id, { y: 0 }, t1 + 0.31); }
    };
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
    gsap.set(['#aA', '#aH', '#aU', '#sp0 .mtk > div', '#sp0 .tk', '#sp5 .ar', '#hm0', '#hm1', '#hm2', '#hm3', '#hm4', '#sp6 .m-cd', '#mRun', '#mR2'], { autoAlpha: 0 });
    gsap.set('#dw0', { autoAlpha: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0 });
    gsap.set(['#hm0', '#hm1', '#hm2', '#hm3', '#hm4'], { height: 0 });
    K.chapterIn('chS', T.stLand, { i: 2 });
    tl.to('#stcW', { autoAlpha: 0.6, duration: 0.8, ease: 'power1.out' }, T.stLand + 0.4);
    tl.to('#stcW', { scale: 0.96, duration: T.rack2 - T.stLand, ease: 'sine.inOut' }, T.stLand);
    K.rack('chS', T.rack2, '#stcW');
    tl.to('#stcW', { scale: 1, duration: 1.2, ease: 'power3.inOut' }, T.rack2 + 0.1);
    tl.to('#chS .czh', { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, T.c1 - 0.5);

    // S2 · My Agent: 周航 says what he wants in business language; the task has its people, the agents take it
    K.beat('交代目标', T.c1); K.cue('c1', T.c1);
    title('#cT0', T.c1 + 0.1, T.c2 - 0.35);
    const ty = T.c1 + 0.5, inp = $('#aIn');
    K.call(() => { inp.classList.add('typed'); }, ty);
    K.typeOn(inp, ASK, ty, 0.05);
    const sent = ty + ASK.length * 0.05 + 0.25;
    K.call(() => { inp.classList.remove('typed'); inp.textContent = '回复，或说下一件事…'; }, sent);
    K.sfx('enter', sent, { g: -6 });
    tl.fromTo('#aU', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, sent);
    tl.fromTo('#aA', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' }, sent + 0.5);
    tl.fromTo('#sp0 .mtk > div', { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.22, ease: 'power2.out' }, sent + 0.85);
    tl.to('#aE', { autoAlpha: 0, duration: 0.2 }, sent + 0.85);
    [0, 1, 2].forEach((k) => {
      tl.fromTo('#aK' + k, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, sent + 0.9 + k * 0.22);
      K.call(() => { $('#aN').textContent = String(k + 1); }, sent + 0.9 + k * 0.22);
    });
    const hand = sent + 1.7;
    tl.fromTo('#aH', { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, hand); K.sfx('ok', hand, { g: -6 });
    [0, 1, 2].forEach((k) => { K.call(() => { $('#aS' + k).outerHTML = pill('aS' + k, 'upd', '进行中'); }, hand + 0.2 + k * 0.15); K.ring('#aK' + k, hand + 0.2 + k * 0.15); });
    K.ring('#aPpl', hand + 0.8);

    // S3 · the task: steps handed to agents, two in parallel; tests climb; another vendor's model reviews; the night goes on
    K.beat('Agent 团队执行', T.c2); K.cue('c2', T.c2);
    slide(1, T.c2);
    title('#cT1', T.c2 + 0.2, T.c3 - 0.35);
    const lg = (k, t) => { tl.fromTo('#lg' + k, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, t); K.sfx('pop', t, { i: k, g: -14 }); };
    const clk = (s, t) => K.call(() => { $('#tClk').innerHTML = s; }, t);
    const st = (k, cls, t) => K.call(() => { $('#pl' + k).className = 'pr ' + cls; }, t);
    lg(0, T.c2 + 0.6);
    const tn = { v: 31 };
    clk('<b>21:08</b>', T.c2 + 1.6); st(2, 'done', T.c2 + 1.6); lg(1, T.c2 + 1.6); K.call(() => { $('#plN').textContent = '第 4 / 5 步 · 测试进行中'; }, T.c2 + 1.6);
    tl.to(tn, { v: 46, duration: 1.2, ease: 'power1.out', onUpdate: () => { $('#tN').textContent = Math.round(tn.v); } }, T.c2 + 1.9);
    clk('<b>22:14</b>', T.c2 + 3.1); st(3, 'done', T.c2 + 3.1); lg(2, T.c2 + 3.1); K.call(() => { $('#ciC').innerHTML = `${ic('circle-check')}CI 通过`; $('#ciC').className = 'ok'; lucide.createIcons(); }, T.c2 + 3.1);
    st(4, 'run', T.c2 + 3.3); K.call(() => { $('#plN').textContent = '第 5 / 5 步 · 评审中'; }, T.c2 + 3.3);
    clk('<b>22:51</b>', T.c2 + 4.0); lg(3, T.c2 + 4.0); K.cue('review', T.c2 + 4.0);
    clk('<b>23:18</b>', T.c2 + 5.0); st(4, 'done', T.c2 + 5.0); lg(4, T.c2 + 5.0); K.sfx('ok', T.c2 + 5.0, { g: -8 }); K.cue('fixed', T.c2 + 5.0);
    clk('<b>23:40</b> · 同事们下班了，Agent 还在推进', T.c2 + 6.0); lg(5, T.c2 + 6.0); K.ring('#tClk', T.c2 + 6.0);
    K.call(() => { $('#plN').textContent = '5 / 5 步完成 · 交给周航验收'; $('#tSt').outerHTML = pill('tSt', 'wait', '待验收'); }, T.c2 + 6.0);

    // S4 · decisions: 周航 answers the question and accepts the feature; the release lands on 王磊's list
    K.beat('做决定与验收', T.c3); K.cue('c3', T.c3); ver('v1.0', '第 2 周', T.c3 + 0.3, false);
    slide(2, T.c3);
    title('#cT2', T.c3 + 0.2, T.c4 - 0.35);
    K.ring('#dq', T.c3 + 0.8, '217,119,6');
    const q1 = K.cursorTo('#curS3', '#qaY', T.c3 + 1.1, 0.7);
    K.cls('#qaY', 'hot', q1); K.sfx('click', q1, { i: 6 });
    K.call(() => { $('#dqs').textContent = '已决定：质量优先 · Agent 按此调整，并记进项目记忆'; $('#dqs').className = 'p'; $('#dqA').style.display = 'none'; $('#gZ').textContent = '等你处理 1'; }, q1 + 0.15);
    K.ring('#dq', q1 + 0.15, '16,185,129');
    $('#dqA').style.display = 'none';   // measured in the layout after the answer
    const a2 = K.cursorMove('#curS3', '#accBtn', q1 + 1.0, 0.75);
    $('#dqA').style.display = '';
    K.cls('#accBtn', 'hot', a2); K.sfx('click', a2, { i: 7 });
    K.call(() => { $('#dz0s').textContent = '已验收 · 交给王磊批准上线'; $('#dz0s').className = 'p'; $('#accActs').style.visibility = 'hidden'; $('#gZ').textContent = '等你处理 0'; }, a2 + 0.15);
    K.ring('#dz0', a2 + 0.15, '16,185,129'); K.sfx('ok', a2 + 0.2, { g: -8 });
    tl.to('#curS3', { autoAlpha: 0, duration: 0.25 }, a2 + 0.4);
    const rel = a2 + 0.9;
    tl.fromTo('#dw0', { autoAlpha: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0 }, { autoAlpha: 1, height: 52, paddingTop: 10, paddingBottom: 10, marginTop: 7, duration: 0.5, ease: 'power3.out' }, rel);
    K.call(() => { $('#gW').textContent = '等你处理 3'; }, rel);
    K.ring('#dw0', rel + 0.3, '217,119,6'); K.sfx('pop', rel + 0.3, { g: -6 });

    // S5 · release: test and staging are green; 王磊 approves production; v1.0 stays one click away
    K.beat('批准上线', T.c4); K.cue('c4', T.c4);
    slide(3, T.c4);
    title('#cT3', T.c4 + 0.2, T.mont - 0.35);
    tl.fromTo('#sp4 .ln2, #sp4 .lar', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.45, ease: 'expo.out' }, T.c4 + 0.4);
    K.ring('#ln2', T.c4 + 1.0, '217,119,6'); K.ring('#apv', T.c4 + 1.2, '217,119,6');
    const ap = K.cursorTo('#curS4', '#apBtn', T.c4 + 1.5, 0.75);
    K.cls('#apBtn', 'hot', ap); K.sfx('click', ap, { i: 8 });
    K.call(() => { $('#apBtn').style.display = 'none'; $('#apNo').style.display = 'none'; $('#apSt').innerHTML = pill('', 'upd', '部署到生产中'); $('#lnS').outerHTML = pill('lnS', 'upd', '部署中'); }, ap + 0.12);
    tl.to('#curS4', { autoAlpha: 0, duration: 0.25 }, ap + 0.3);
    const lv = ap + 1.3;
    K.call(() => {
      $('#apSt').innerHTML = pill('', 'run', '已上线 · v1.1'); $('#lnS').outerHTML = pill('lnS', 'run', '运行中'); $('#lnV').textContent = 'v1.1'; $('#lnT').textContent = '王磊批准 · 刚刚';
      $('#ln2').classList.remove('w'); $('#hr0s').innerHTML = pill('', 'run', '当前'); $('#hr1s').innerHTML = rollBtn('rbBtn'); $('#arV').textContent = 'v1.1'; $('#hhN').textContent = '2 个版本';
      lucide.createIcons();
    }, lv);
    K.ring('#ln2', lv, '16,185,129'); K.ring('#hr0', lv, '16,185,129'); K.sfx('ok', lv, { g: -2 }); K.cue('live', lv);
    ver('v1.1', '第 2 周', lv);
    K.ring('#hr1', lv + 1.5, '59,130,246');

    // S6 · a season of versions: the approval folds away and the history grows, each version tested, accepted, approved
    K.beat('一版接一版', T.mont); K.cue('mont', T.mont);
    title('#cT4', T.mont + 0.2, T.mem - 0.35);
    tl.to('#apv', { autoAlpha: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, borderWidth: 0, duration: 0.5, ease: 'power3.inOut' }, T.mont + 0.1);
    K.call(() => { $('#rhS').textContent = '生产环境 · 第 1 天以来的每一次发布'; }, T.mont + 0.2);
    VERS.forEach(([v, d], j) => {
      const t = T.mont + 0.9 + j * 1.25, prev = j ? '#hm' + (j - 1) + 's' : '#hr0s';
      tl.fromTo('#hm' + j, { autoAlpha: 0, height: 0 }, { autoAlpha: 1, height: 42, duration: 0.45, ease: 'power3.out' }, t);
      K.call(() => {
        $(prev).innerHTML = rollBtn(); $('#hm' + j + 's').innerHTML = pill('', 'run', '当前');
        $('#lnV').textContent = v; $('#arV').textContent = v; $('#lnT').textContent = '王磊批准 · ' + d; $('#hhN').textContent = (j + 3) + ' 个版本';
        $$('#ln0 .l2, #ln1 .l2').forEach((e) => { e.textContent = v; });
        lucide.createIcons();
      }, t + 0.05);
      K.ring('#hm' + j, t + 0.1, '16,185,129');
      ver(v, d, t + 0.1);
      K.sfx('pop', t, { i: j, g: -7 }); K.cue('ver', t, { i: j });
    });

    // S7 · the project memory: what the agents learned on the way, each one from a task's PR; the next task reads it first
    K.beat('项目记忆', T.mem); K.cue('mem', T.mem);
    slide(4, T.mem);
    title('#cT5', T.mem + 0.2, T.a3 - 0.6);
    MEMS.forEach((_, k) => {
      const t = T.mem + 0.55 + k * 0.16;
      tl.fromTo('#mm' + k, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' }, t);
      K.cue('memc', t, { i: k });
    });
    ver('v1.6', '第 8 周', T.mem + 0.2, false);
    const rd = T.mem + 2.6;
    tl.fromTo('#mRun', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, rd); K.sfx('pop', rd, { g: -8 });
    [1, 2].forEach((k, j) => { const t = rd + 0.9 + j * 0.45; K.ring('#mm' + k, t, '59,130,246'); K.cls('#mm' + k, 'm-use', t); K.cue('memu', t, { i: j }); });
    tl.fromTo('#mR2', { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' }, rd + 1.9); K.sfx('ok', rd + 1.9, { g: -8 });
    // out: the console steps back and dissolves
    tl.to('#stc', { scale: 0.92, autoAlpha: 0, duration: 0.7, ease: 'power2.inOut', transformOrigin: '50% 50%' }, T.a3 - 0.6);
    K.hide('#sS', T.a3 + 0.15);
  }

  // ===== act three · the years after, built to last: an upgrade, a handover, a year
  function actThree() {
    K.beat('之后很多年 · 走得远', T.a3); K.cue('a3', T.a3);
    rail(2, T.a3);
    const title = (id, t0, t1) => {
      K.show(id, t0);
      tl.fromTo($$(id + ' .fi'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, t0);
      tl.fromTo($$(id + ' .fzh'), { autoAlpha: 0, y: 16, filter: 'blur(6px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out' }, t0 + 0.05);
      tl.fromTo($$(id + ' .r2 > *'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, t0 + 0.25);
      tl.to(id, { autoAlpha: 0, y: -10, duration: 0.3, ease: 'power2.in' }, t1);
    };
    // Y1 · the line
    K.show('#y0', T.a3 - 0.05);
    K.tcardIn('#tY', T.a3 + 0.05, { stagger: 0.03 });
    K.tcardOut('#tY', T.u - 0.6);
    K.hide('#y0', T.u);

    // Y2 · week 26: Core 3.1 slides in under the business code, which stays where it is
    K.beat('Core 升级', T.u); K.cue('up0', T.u); ver('v1.24', '第 26 周', T.u, false);
    K.show('#yU', T.u - 0.05);
    title('#yT0', T.u + 0.05, T.h - 0.35);
    gsap.set('#ugC1', { autoAlpha: 0, x: 120 });
    tl.fromTo('#ugd', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, T.u + 0.2);
    tl.fromTo('#ugt', { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: 'expo.out' }, T.u + 0.8);
    const ut = (k, t) => { K.cls('#ut' + k, 'on', t); K.sfx('ok', t, { g: -10 }); };
    ut(0, T.u + 1.5);
    const sw = T.u + 2.2;
    tl.to('#ugB', { y: -14, duration: 0.4, ease: 'power2.out' }, sw);
    tl.to('#ugC0', { x: -120, autoAlpha: 0, duration: 0.5, ease: 'power3.in' }, sw + 0.1);
    tl.to('#ugC1', { x: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out' }, sw + 0.45);
    tl.to('#ugB', { y: 0, duration: 0.25, ease: 'power2.in' }, sw + 1.0);
    K.mb(sw + 0.1, sw + 1.0);
    K.sfx('whoosh', sw + 0.2, { i: 9, g: -10 }); K.sfx('clack', sw + 1.25, { i: 2, g: -4 }); K.cue('up', sw + 1.25);
    ut(1, T.u + 3.7);
    ut(2, T.u + 4.5);
    K.call(() => { $('#ugSt').outerHTML = pill('ugSt', 'run', '已上线'); }, T.u + 4.5);
    ver('v2.0', '第 26 周', T.u + 4.5);
    tl.to('#yU', { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, T.h - 0.35);
    K.hide('#yU', T.h);

    // Y3 · week 39: a new technical lead; the knowledge base, the project memory and the team's skills stay, so the work goes on
    K.beat('负责人交接', T.h); K.cue('hand', T.h); ver('v2.13', '第 39 周', T.h + 0.2, false);
    K.show('#yH', T.h - 0.05);
    title('#yT1', T.h + 0.05, T.y - 0.35);
    tl.fromTo('#hov', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, T.h + 0.2);
    tl.fromTo('#har', { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'expo.out' }, T.h + 0.9);
    tl.fromTo('#hpB', { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'expo.out' }, T.h + 1.1);
    tl.to('#hpA', { opacity: 0.45, duration: 0.6 }, T.h + 1.3);
    K.sfx('pop', T.h + 1.1, { g: -8 });
    tl.fromTo('#kbp', { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: 'expo.out' }, T.h + 1.4);
    tl.fromTo('#kbp .kbr, #kbm > span, #kbs span', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'expo.out' }, T.h + 1.8);
    tl.fromTo('#kbq', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' }, T.h + 3.1); K.sfx('pop', T.h + 3.1, { g: -10 });
    tl.fromTo('#kba', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' }, T.h + 3.9);
    K.ring('#kb0', T.h + 4.0); K.sfx('ok', T.h + 3.9, { g: -10 });
    tl.to('#yH', { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, T.y - 0.35);
    K.hide('#yH', T.y);

    // Y4 · week 52: a year on; the system is yours
    K.beat('一年', T.y); K.cue('yr', T.y);
    K.show('#yY', T.y - 0.05);
    title('#yT2', T.y + 0.05, T.recap - 0.5);
    tl.fromTo('#yY .yv', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.25, ease: 'expo.out' }, T.y + 0.4);
    const n0 = { v: 1 }, n1 = { v: 1 }, n2 = { v: 0 };   // 52 weeks, a release every week, 186 requests shipped, v2.0 since the Core upgrade
    tl.to(n0, { v: 52, duration: 1.5, ease: 'power2.out', onUpdate: () => { $('#yN0').textContent = Math.round(n0.v); } }, T.y + 0.4);
    tl.to(n1, { v: 186, duration: 1.5, ease: 'power2.out', onUpdate: () => { $('#yN1').textContent = Math.round(n1.v); } }, T.y + 0.65);
    tl.to(n2, { v: 26, duration: 1.5, ease: 'power2.out', onUpdate: () => { $('#yN2').textContent = 'v2.' + Math.round(n2.v); } }, T.y + 0.9);
    ver('v2.26', '第 52 周', T.y + 2.4);
    tl.fromTo('#yY .ytags span', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.25, ease: 'expo.out' }, T.y + 2.8);
    [0, 1, 2].forEach((k) => K.sfx('pop', T.y + 2.8 + k * 0.25, { i: k, g: -12 }));
    rail(-1, T.y + 4.4, 3); K.sfx('ok', T.y + 4.4, { g: -6 });
    tl.to(['#rail2', '#ver'], { autoAlpha: 0, y: 8, duration: 0.5, ease: 'power2.in' }, T.recap - 0.5);
    tl.to('#yY', { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, T.recap - 0.4);
    K.hide('#yY', T.recap);
  }

  // ===== the recap, then the end card
  function closing() {
    K.beat('收束', T.recap); K.cue('recap', T.recap);
    K.show('#rcp', T.recap - 0.1);
    gsap.set('#rcp .rsep', { autoAlpha: 0 });
    [0, 1, 2].forEach((k) => {
      const a = T.recap + 0.2 + k * 0.5;
      tl.fromTo(`#rc${k} small`, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, a);
      tl.fromTo(`#rc${k} b`, { autoAlpha: 0, y: 16, filter: 'blur(6px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out' }, a + 0.08);
      tl.fromTo(`#rc${k} em, #rc${k} p`, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'expo.out' }, a + 0.3);
      K.sfx('pop', a, { i: k, g: -12 }); K.cue('col', a, { i: k });
    });
    tl.to('#rcp .rsep', { autoAlpha: 1, duration: 0.6, stagger: 0.2 }, T.recap + 1.2);
    tl.to('#rcp', { autoAlpha: 0, filter: 'blur(6px)', duration: 0.5, ease: 'power2.in' }, T.end0 - 0.6);
    K.hide('#rcp', T.end0);
    K.cue('turn', T.endLand - 2);

    K.beat('落版', T.endLand); K.cue('end', T.endLand);
    K.gridTo(K.ID, T.end0 - 0.1);
    K.show('#sE', T.end0 - 0.1);
    tl.fromTo('#glowEnd', { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 0.45, scale: 0.8, duration: 0.8, ease: 'sine.inOut' }, T.end0 - 0.1);
    K.logoLand('lockE', { mode: 'whole', land: T.endLand, base: T.end0, capTop: 286, drop: 64, fall: 0.2, i: 3 });
    tl.to('#glowEnd', { autoAlpha: 1, scale: 1, duration: 2.2, ease: 'expo.out' }, T.endLand);
    tl.fromTo($$('#eZh .ch'), { yPercent: 40, opacity: 0, filter: 'blur(6px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.3, ease: 'power3.out', stagger: K.stag(0.045) }, T.endLand + 0.6);
    tl.fromTo(['#endTags', '#endBeta'], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.3, ease: 'power3.out' }, T.endLand + 1.8);
    tl.fromTo('#sEw', { scale: 1 }, { scale: 1.025, transformOrigin: '50% 50%', duration: T.done - T.endLand, ease: 'sine.inOut' }, T.endLand);
    tl.to('#black', { opacity: 1, duration: 0.9, ease: 'power1.in' }, T.done - 0.9);
  }

  K.run(build, film);
})();
