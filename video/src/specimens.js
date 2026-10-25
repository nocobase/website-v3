// NocoBase UI specimens · window.NBSpec(K)
// The product surfaces the approved film shows, as HTML builders in NocoBase 3's style (shadcn: neutral zinc, black
// primary, pale status pills) and at video scale. Each takes its data as arguments; the defaults are the procurement story
// of the approved film (examples/ai-plus-nocobase), so a new film can reuse the story or bring its own.
// Styles live in src/nocobase-film.css under the same class names. Not a 100 % replica of the product: keep the style,
// make the meaning clear (the user's rule).
//   const S = NBSpec(K);  S.term.html(…)  S.chat.html(…)  S.app.html(…)  S.stack.html()  S.road.html()  S.er.body()
//   S.wf.body()  S.acl.body() / init() / view(k, t)  S.cards.html(i)  S.wall.html()  S.hub.html()
(function () {
  window.NBSpec = function (K) {
    const { ic, ZH, esc, fmt, avatar, tl, $, $$ } = K;

    // ---------------------------------------------------------------- the story (a procurement system, seven requests)
    const story = {
      prompt: '帮我做一个采购申请系统',
      reqs: [
        { name: '何静', role: '财务', av: '何', msg: '预算要从 SAP 取。', mod: 'src/integrations/sap/**', fc: 136, add: 36720 },
        { name: '周明远', role: '财务总监', av: '周', msg: '超过 5 万，必须我来批。', mod: 'src/approval/**', fc: 232, add: 70800 },
        { name: '刘博文', role: '安全', av: '刘', msg: '各部门只能看自己的申请。', mod: 'src/rbac/**', fc: 164, add: 44040 },
        { name: '陈宇', role: 'IT', av: '陈', msg: '员工要用飞书登录。', mod: 'src/auth/feishu/**', fc: 76, add: 24120 },
        { name: '孙悦', role: '采购', av: '孙', msg: '批完自动出采购单。', mod: 'src/documents/**', fc: 108, add: 31800 },
        { name: '郑欣', role: '审计', av: '郑', msg: '每一步都要留痕。', mod: 'src/audit/**', fc: 88, add: 22020 },
        { name: '赵强', role: '运维', av: '赵', msg: '上线出了问题，能回滚吗？', mod: 'scripts/deploy/**', fc: 44, add: 11940 },
      ],
      // the Coding Agent alone: what it writes for the first prompt. The scale is the reference film's: about 600,000
      // lines alone (374,400 at first, 615,840 after the seven requests) against about 60,000 with NocoBase (59,940)
      build: [['src/db/**', 152, 38520], ['src/api/**', 384, 77160], ['src/auth/**', 96, 24720], ['src/pages/**', 284, 57240],
        ['src/components/**', 472, 49860], ['src/services/**', 332, 67560], ['tests/**', 256, 59340]],
      built: { lines: 374400, files: 1976 },
      // the same prompt with NocoBase: only the business part
      withNB: [['u', '帮我做一个采购申请系统'], ['i', '读取 NocoBase 开发指引', '.agents/skills/'], ['nbl', '底座能力已就绪：数据模型 · 权限 · 工作流 · 数据源 · 身份认证 · 审计日志 …'], ['i', '只编写业务部分'],
        ['w', 'database/collections/**', 11160, 56], ['w', 'server/data-sources/**', 2790, 12], ['w', 'server/workflows/**', 6840, 24],
        ['w', 'server/acl/**', 2430, 16], ['w', 'client/pages/**', 31320, 124], ['ok', '业务代码 384 个文件 · +59,940 行']],
    };

    // ---------------------------------------------------------------- the Coding Agent's terminal (the only large dark surface)
    // lines: ['u', prompt] · ['w', path, lines, files] · ['ok', text] · ['warn', text] · ['nbl', NocoBase line] · ['i', text, grey]
    const lineHTML = ([k, a, b, c]) => {
      if (k === 'u') return `<div class="ln u"><span class="d">&gt;</span><span class="tx">${esc(a)}</span></div>`;
      if (k === 'w') return `<div class="ln"><span class="dot g"></span>Write(${esc(a)})${c ? `<span class="fc">${c} ${K.uiW('个文件', 'files', '個檔案')}</span>` : ''}<span class="n">+${fmt(b)}</span></div>`;
      if (k === 'ok') return `<div class="ln ok"><span class="d">✓</span>${esc(a)}</div>`;
      if (k === 'warn') return `<div class="ln warn"><span class="d">⚠</span>${esc(a)}</div>`;
      if (k === 'nbl') return `<div class="ln nbl"><span class="dot b"></span>${esc(a)}</div>`;
      return `<div class="ln"><span class="dot"></span>${esc(a)}${b ? `<span class="g">&nbsp;&nbsp;${esc(b)}</span>` : ''}</div>`;
    };
    const term = {
      html: (id, style, title, lines, stat = {}) => `<div class="term${stat.sm ? ' sm' : ''}" id="${id}" style="${style}">
        <div class="tbar"><div class="tls"><i></i><i></i><i></i></div><span class="tt">${title}</span></div>
        <div class="tbody"><div class="tscroll">${lines.map(lineHTML).join('')}</div></div>
        <div class="tstat"><span>${stat.br || 'feat/purchase'}</span><span class="fl">${stat.files || 0} ${K.uiW('个文件', 'files', '個檔案')}</span><span class="rv"${stat.rv ? '' : ' style="opacity:0"'}>${K.uiW('待评审', 'To review', '待審查')}</span>
          <span class="cnt${stat.good ? ' good' : ''}"><b>+${fmt(stat.lines || 0)}</b>${K.uiW('行', ' lines')}</span></div></div>`,
      // line k slides in at `at`; past `cap` visible lines the body scrolls up one line (27 px)
      lineIn: (id, k, at, flash, cap) => {
        const el = $$(`#${id} .ln`)[k];
        if (cap && k >= cap) tl.to(`#${id} .tscroll`, { y: -(k - cap + 1) * 27, duration: 0.3, ease: 'power2.out' }, at);
        tl.fromTo(el, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.28, ease: 'power2.out' }, at);
        if (flash) tl.fromTo(el, { backgroundColor: 'rgba(127,178,255,.2)' }, { backgroundColor: 'rgba(127,178,255,0)', duration: 1.4, ease: 'power1.out' }, at);
      },
      // the line counter in the status bar, and the file count
      count: (id, from, to, at, dur, files) => {
        const o = { v: from }, b = $(`#${id} .cnt b`), f = $(`#${id} .fl`);
        tl.to(o, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => { b.textContent = '+' + fmt(o.v); } }, at);
        if (files !== undefined) K.call(() => { f.textContent = files + (K.uiW(' 个文件', ' files', ' 個檔案')); }, at + dur * 0.4);
      },
    };

    // ---------------------------------------------------------------- the requests: a group chat at the start, the same rows as a checklist at the end
    const chat = {
      row: (r, i, p) => `<div class="row" id="${p}${i}">${avatar(r.name, r.av)}<span class="tx">${ZH(r.msg)}</span><span class="rl">${ZH(r.role)}</span><span class="ck">${ic('check')}</span></div>`,
      html: (id, style, right, o = {}) => `<div class="chat" id="${id}" style="${style || ''}"><div class="chd"><span class="hash">#</span><b>${o.title || '采购申请系统 · 需求群'}</b>${right || ''}</div>
        <div class="cbody">${(o.reqs || story.reqs).map((r, i) => chat.row(r, i, o.prefix || id + '-')).join('')}</div></div>`,
      members: (reqs = story.reqs, n = 12) => `<span class="stack">${reqs.slice(0, 5).map((r) => avatar(r.name, r.av)).join('')}</span><small>${n} 人</small>`,
      // tick every row, one every `gap` s; `counter` (e.g. '#done small') shows "n/N 已满足"; logs a 'check' cue per row
      checkAll: (prefix, at, gap = 0.2, counter, n = story.reqs.length) => {
        for (let i = 0; i < n; i++) {
          const t = at + i * gap;
          tl.fromTo(`#${prefix}${i} .ck`, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, t);
          tl.fromTo('#' + prefix + i, { backgroundColor: 'rgba(16,185,129,.09)' }, { backgroundColor: 'rgba(16,185,129,0)', duration: 1.3, immediateRender: false }, t);
          if (counter) K.call(() => { $(counter).textContent = `${i + 1}/${n} 已满足`; }, t);
          K.cue('check', t, { i });
        }
        return at + (n - 1) * gap;
      },
    };

    // ---------------------------------------------------------------- the app the agent built: a purchase dashboard (local, or live in production)
    const app = {
      html: (prod, id, style) => {
        const side = [['layout-dashboard', '概览看板', 1], ['file-text', '采购申请', 0, 12], ['building-2', '供应商', 0]]
          .map(([i, n, on, em]) => `<div class="it${on ? ' on' : ''}">${ic(i)}${n}${em ? `<em>${em}</em>` : ''}</div>`).join('');
        const cfg = [['database', '数据模型'], ['shield', '权限角色'], ['git-branch', '工作流']].map(([i, n]) => `<div class="it">${ic(i)}${n}</div>`).join('');
        const rows = [
          ['REQ-0143', '王磊 · 研发部', 'GPU 服务器 1 台', '¥86,000', prod ? ['c', '已批准'] : ['a', '待核对']],
          ['REQ-0142', '孙浩 · 生产部', '数控刀具一批', '¥12,400', ['b', '部门审批中']],
          ['REQ-0141', '赵倩 · 行政部', '办公椅 30 把', '¥21,000', ['c', '已批准']],
          ['REQ-0140', '李雯 · 市场部', '展会物料', '¥18,600', ['c', '已批准']],
          ['REQ-0138', '张伟 · 研发部', '测试服务器 2 台', '¥46,800', ['c', '已批准']],
        ].map(([no, who, what, amt, [k, st]]) => `<tr><td class="no">${no}</td><td>${who}</td><td>${what}</td><td class="amt">${amt}</td><td><span class="st ${k}">${st}</span></td></tr>`).join('');
        const bars = [38, 52, 44, 61, 57, 72, 66, 84].map((h, i) => `<i class="${i < 7 ? 'dim' : ''}" style="height:${h}%"></i>`).join('');
        return `<div class="appw"${id ? ` id="${id}"` : ''}${style ? ` style="${style}"` : ''}><div class="app lt win">
          <div class="bar"><div class="tls"><i></i><i></i><i></i></div>
            <div class="tab"><span class="sq">${ic('shopping-cart')}</span>采购申请系统</div>
            <div class="addr">${prod ? '<span class="env prod">生产</span><span class="host">apps.example.com</span>/purchase/' : '<span class="env">本地</span><span class="host">localhost:3000</span>/dashboard'}</div>
            ${prod ? '<div class="live"><i></i>LIVE</div>' : ''}</div>
          <div class="body"><aside class="side"><div class="brand"><span class="sq">${ic('shopping-cart')}</span>采购申请系统</div>
              <div class="grp">业务</div>${side}<div class="grp">配置</div>${cfg}</aside>
            <main><div class="crumb">采购管理 /<b>概览看板</b><span class="btn">+ 新建申请</span></div>
              <div class="kpis">
                <div class="kpi"><div class="k">本月采购额</div><div class="v">¥1,286,400</div><div class="d">↑ 12%</div></div>
                <div class="kpi"><div class="k">预算执行率</div><div class="v">68%</div><div class="d">正常</div></div>
                <div class="kpi"><div class="k">待审批</div><div class="v">12 件</div><div class="d" style="color:#b45309">3 件超 5 万</div></div>
                <div class="kpi"><div class="k">平均审批时长</div><div class="v">5.2 小时</div><div class="d">↓ 62%</div></div></div>
              <div class="row2"><div class="panel"><div class="ph">最近申请<span>共 141 条</span></div><table class="reqs">${rows}</table></div>
                <div class="panel"><div class="ph">采购趋势<span>近 8 个月</span></div><div class="bars">${bars}</div>
                  <div class="axis">${['2', '3', '4', '5', '6', '7', '8', '9'].map((m) => `<span>${m}</span>`).join('')}</div></div></div>
            </main></div></div></div>`;
      },
    };

    // ---------------------------------------------------------------- 3D map · Build: the business code lands on the foundation (two layers)
    const stack = {
      Zs: { slF: 0, slC: 214 },
      html: (o = {}) => {
        const chips = o.chips || ['数据源', '工作流与审批', '权限'], more = o.more ?? '等 20+ 项底座能力', focusChip = o.focusChip || chips[0];
        const code = (o.code || ['<b>export interface</b> PurchaseRequest { id: string; amount: number; costCenter: string }', '<b>export const</b> approvalRule = { threshold: 50_000, approver: \'finance_director\' }',
          '<b>export const</b> scopes = { applicant: \'own\', deptHead: \'department\', finance: \'all\' }', '<b>export const</b> budgetSource = { system: \'SAP\', table: \'cost_center_budgets\', readonly: true }',
          '<b>export const</b> dashboard = { kpis: [\'monthly_spend\', \'budget_rate\', \'pending\'] }']).map((l) => `<div class="code">${l}</div>`).join('');
        const sh = '<i class="shade"></i>';
        const slab = (id, top, front) => `<div class="slab" id="${id}"><div class="tp">${top}${sh}</div><div class="fr">${front}${sh}</div><div class="rs">${sh}</div><div class="ls">${sh}</div></div>`;
        return `<div id="zoomer" style="position:absolute;inset:0"><div id="floor"></div><div class="persp"><div id="rig"><div id="tilt"><div id="spin">
          ${slab('slF', '', `<div class="lbl"><b>${o.base || 'NocoBase Core'}</b><span>${o.baseSub || '应用底座'}</span></div><div class="chips">` + chips.map((c) => `<div class="fchip"${c === focusChip ? ' id="chipFocus"' : ''}>${c}</div>`).join('') + (more ? `<span class="more">${more}</span>` : '') + '</div>')}
          ${slab('slC', code, `<div class="lbl"><b>${o.codeLabel || '业务代码'}</b><span>${o.codeBy || 'AI 编写'}</span></div>`)}
        </div></div></div></div></div>`;
      },
    };

    // ---------------------------------------------------------------- 3D map · Run: your servers, three environment pads, Hub as the control band above
    // light, neutral materials; production turns the foundation's blue as the app lands on it (tween '--lit' on #pad2)
    const road = {
      PADX: [-440, 0, 440],
      html: (o = {}) => {
        const pads = o.pads || [['测试', 'host-03'], ['预发布', 'host-02'], ['生产', 'host-01']], steps = o.steps || ['发布', '审批', '部署', '回滚'];
        const blk = K.blk, X = road.PADX;
        return `<div id="zoomR" style="position:absolute;inset:0"><div id="floorR"></div><div class="persp" id="perspR"><div id="rigR"><div id="tiltR"><div id="spinR">
          ${blk('bSrv', 'srv', '--w:1440px;--d:340px;--h:28px;left:-720px;top:-165px', '', `<div class="srvl"><b>${o.ground || '你的服务器'}</b><span>${o.groundSub || '私有部署'}</span></div>`)}
          ${pads.map(([n, h], k) => blk('pad' + k, 'pad' + (k === pads.length - 1 ? ' prod' : ''), `--w:380px;--d:200px;--h:24px;left:${X[k] - 190}px;top:-100px`, '', `<div class="padl"><b>${n}</b><span>${h}</span></div>`)).join('')}
          ${X.map((x, k) => `<i class="post" id="post${k}" style="left:${x - 1}px"></i>`).join('')}
          ${blk('bHub', 'hubb', '--w:1440px;--d:30px;--h:58px;left:-720px;top:-162px', `<div class="lbl"><b>NocoBase Hub</b><span>部署与运维</span></div><div class="hbis">${steps.map((x, k) => `<span class="hbi" id="hbi${k}">${x}</span>`).join('')}</div>`)}
          <div id="app3">${blk('aF', 'af', '--w:200px;--d:130px;--h:50px;left:-100px;top:-78px', `<div class="lbl"><b>${o.app || '采购申请系统'}</b></div>`)}${blk('aC', 'ac', '--w:200px;--d:130px;--h:16px;left:-100px;top:-78px', '')}</div>
        </div></div></div></div></div>`;
      },
      // the resting pose of the map (call before placing tweens)
      pose: () => {
        gsap.set('#tiltR', { rotationX: 56 }); gsap.set('#spinR', { rotation: -5 }); gsap.set('#rigR', { scale: 0.86 });
        gsap.set('#bSrv', { z: 0 }); ['pad0', 'pad1', 'pad2'].forEach((id) => gsap.set('#' + id, { z: 28 }));
        gsap.set('#bHub', { z: 232 }); gsap.set('#aC', { z: 57 });
      },
      // the app drops onto the first pad, then hops pad to pad; landings = [drop end, hop1 end, hop2 end] (put them on beats)
      travel: ({ appIn, hop1, hop2, drop = 0.24, hop = 0.5, OX = 72, PT = 52 }) => {
        const X = road.PADX, a = { x: X[0] + OX, z: PT + 340 };
        const put = () => gsap.set('#app3', { x: a.x, z: a.z });
        gsap.set('#app3', { x: a.x, y: 30, z: a.z, autoAlpha: 0 });
        const light = (k, t) => K.call(() => $$('#bHub .hbi').forEach((e, j) => e.classList.toggle('on', j === k)), t);
        const land = [appIn + drop, hop1 + hop, hop2 + hop];
        light(0, appIn - 0.35);  // 发布
        tl.set('#app3', { autoAlpha: 1 }, appIn);
        tl.to(a, { z: PT, duration: drop, ease: 'power2.in', onUpdate: put }, appIn);
        K.mb(appIn, appIn + drop + 0.02);
        light(2, land[0]);
        [[1, hop1], [2, hop2]].forEach(([k, t0]) => {
          const o = { p: 0 }, x0 = X[k - 1] + OX, x1 = X[k] + OX;
          tl.to(o, { p: 1, duration: hop, ease: 'power1.inOut', onUpdate: () => { a.x = x0 + (x1 - x0) * o.p; a.z = PT + 130 * Math.sin(Math.PI * o.p); put(); } }, t0);
          K.mb(t0 + 0.05, t0 + hop);
          light(2, land[k]);
        });
        light(1, hop2 - 0.4);  // 审批, before production
        tl.to('#pad2', { '--lit': 1, duration: 0.45, ease: 'power2.out' }, land[2]);
        tl.to('#pad2 .padl b', { color: '#ffffff', duration: 0.45 }, land[2]); tl.to('#pad2 .padl span', { color: 'rgba(255,255,255,.72)', duration: 0.45 }, land[2]);
        K.cls('#pad2', 'on', land[2]);
        land.forEach((t, i) => { K.sfx('clack', t, { i: 3 + i, g: i < 2 ? -9 : 0 }); K.cue('hop', t, { i }); });
        return land;
      },
    };

    // ---------------------------------------------------------------- proof bodies: the ER card, the workflow canvas, the permissions table
    const tbl = (cls, style, name, zh, fields) => `<div class="tb ${cls}" style="${style}"><div class="th"><span class="tn">${name}</span><span class="tz">${zh}</span></div><div class="tf">` +
      fields.map(([f, t, k]) => `<div class="tr"><span>${k ? `<b class="${k.toLowerCase()}">${k}</b>` : ''}${f}</span><span class="ft">${t}</span></div>`).join('') + '</div></div>';
    const er = {
      tbl,
      // data model + an external data source (SAP budgets); CSS classes switch it on step by step (.tb.on, .erl.on, .sap.on …)
      body: () => `<svg class="erl" viewBox="0 0 781 461" fill="none" stroke-width="1.5">
          <g stroke="rgba(22,119,255,.5)"><path d="M230 83.5 C 252 83.5, 252 159.5, 274 159.5"/><path d="M506 84.5 C 528 84.5, 528 108.5, 550 108.5"/></g>
          <g fill="rgba(22,119,255,.65)" font-family="JetBrains Mono, monospace" font-size="11"><text x="234" y="77">1</text><text x="262" y="153">N</text><text x="510" y="78">1</text><text x="538" y="102">N</text></g></svg>` +
        tbl('', 'left:30px;top:26px', 'suppliers', '供应商', [['id', 'uuid', 'PK'], ['name', 'varchar'], ['category', 'varchar'], ['qualified', 'boolean']]) +
        tbl('core', 'left:274px;top:26px', 'purchase_requests', '采购申请', [['id', 'uuid', 'PK'], ['request_no', 'varchar', 'UQ'], ['applicant_id', 'uuid', 'FK'], ['supplier_id', 'uuid', 'FK'], ['cost_center', 'varchar', 'FK'], ['amount', 'numeric']]) +
        tbl('', 'left:550px;top:26px', 'approvals', '审批记录', [['id', 'uuid', 'PK'], ['request_id', 'uuid', 'FK'], ['approver', 'varchar'], ['decision', 'varchar']]) +
        `<svg class="erl sapl" viewBox="0 0 781 461" fill="none" stroke-width="1.5"><path class="sapp" d="M390 232 V258" stroke="#a1a1aa" stroke-dasharray="4 4"/></svg>
        <div class="link-lab late sapll" style="left:400px;top:235px">cost_center</div>
        <div class="sap"><div class="sh"><span>外部系统 · SAP ERP</span><span class="ro">只读接入</span></div>` +
        tbl('on', '', 'cost_center_budgets', '成本中心预算', [['cost_center', 'varchar', 'PK'], ['fiscal_year', 'int'], ['budget', 'numeric']]) + '</div>',
    };
    const wf = {
      // an approval flow: trigger → agent check → condition → two approvals → document; one node lit at a time (.lit)
      body: () => `<div class="nd" id="n1" style="left:220px;top:28px;width:340px"><span class="ic2 t-blue">${ic('zap')}</span><div><div class="nt">提交采购申请</div><div class="ns" id="n1s">purchase_requests:afterCreate</div></div></div>
        <div class="vl" id="v1" style="left:389px;top:82px;height:24px"><i></i></div>
        <div class="nd" id="n2" style="left:220px;top:106px;width:340px"><span class="ic2 t-pu">${ic('bot')}</span><div><div class="nt">预算核对 Agent</div><div class="ns">业务 Agent · 核对 SAP 预算</div></div><span class="bd pill p-em" id="n2b">✓ 预算充足</span></div>
        <div class="vl" id="v2" style="left:389px;top:160px;height:22px"><i></i></div>
        <div class="dia" id="dia" style="left:372px;top:182px"><span class="ic2">${ic('git-branch')}</span></div>
        <div class="dlab" style="left:390px;top:228px;transform:translateX(-50%)">金额 &gt; ¥50,000 ?</div>
        <svg class="br" id="brNo" style="left:0;top:260px" width="781" height="34" fill="none" stroke-width="1.5"><path d="M390 0 V12 H280 V34" stroke="#d4d4d8"/></svg>
        <svg class="br" id="brYes" style="left:0;top:260px" width="781" height="34" fill="none" stroke-width="1.5"><path d="M390 0 V12 H500 V34" stroke="#d4d4d8"/></svg>
        <div class="blab" id="blNo" style="left:335px;top:266px;transform:translate(-50%,-50%);color:var(--emerald)">否</div>
        <div class="blab" style="left:445px;top:266px;transform:translate(-50%,-50%);color:var(--amber)">是</div>
        <div class="nd" id="n3a" style="left:180px;top:294px;width:200px"><span class="ic2 t-gray">${ic('user-check')}</span><div><div class="nt">部门负责人审批</div><div class="ns">人工审批</div></div></div>
        <div class="nd" id="n3b" style="left:400px;top:294px;width:200px"><span class="ic2 t-am">${ic('wallet')}</span><div><div class="nt">财务总监审批</div><div class="ns">人工终审</div></div></div>
        <span class="pill p-am late" id="cfoTag" style="position:absolute;left:612px;top:311px">待审批</span>
        <svg class="br" id="brM" style="left:0;top:348px" width="781" height="40" fill="none" stroke-width="1.5"><path d="M280 0 V20 H500 V0 M390 20 V40" stroke="#d4d4d8"/></svg>
        <div class="nd" id="n4" style="left:220px;top:388px;width:340px"><span class="ic2 t-em">${ic('file-text')}</span><div><div class="nt">生成采购单 · 通知申请人</div><div class="ns">按模板生成 PDF · 飞书通知</div></div><span class="bd pill p-em" id="n4b">✓ 完成</span></div>`,
      // light one node (or none) inside `root`
      litOnly: (root, id) => () => { $$(`${root} .nd, ${root} .dia`).forEach((n) => n.classList.remove('lit')); if (id) $(id).classList.add('lit'); },
      // take the "yes" branch: dark stroke, the other side dimmed
      takeYes: () => { $('#brYes path').setAttribute('stroke', '#18181b'); $('#brNo').classList.add('dim'); $('#blNo').style.opacity = '.35'; $('#n3a').classList.add('dim'); },
    };
    const acl = {
      rows: [['REQ-0143', '王磊', '研发部', 'GPU 服务器 1 台', '¥86,000', '¥79,200'], ['REQ-0142', '孙浩', '生产部', '数控刀具一批', '¥12,400', '¥10,900'],
        ['REQ-0140', '李雯', '市场部', '展会物料', '¥18,600', '¥15,800'], ['REQ-0138', '张伟', '研发部', '测试服务器 2 台', '¥46,800', '¥42,300'], ['REQ-0136', '林晨', '市场部', '广告投放', '¥64,000', '¥58,500']],
      viewers: [{ n: '周明远', role: '财务总监', av: '周', all: true }, { n: '王磊', role: '研发部', av: '王', dept: '研发部' }, { n: '李雯', role: '市场部', av: '李', dept: '市场部' }],
      // the copy, per language (a language version replaces this object)
      text: { viewAs: '查看身份', cols: ['申请号', '申请人', '采购内容', '金额', '底价'], all: '全部部门', only: (d) => '仅' + d, count: '条申请',
        shown: '底价可见', masked: '底价已脱敏', locked: '其他部门 · 无权查看' },
      // one list and who is looking at it. A "view as" switcher heads the list: a dark thumb under the viewer, and the
      // viewers again in white on a layer (#vsel) clipped to the thumb, so a name turns white exactly where the thumb covers
      // it. Rows out of a viewer's scope lock in place (hatched, a lock) instead of folding away, so every viewer leaves a
      // different pattern even at the same count; the target price blurs to dots for everyone but finance.
      body: () => {
        const X = acl.text, segs = (ids) => acl.viewers.map((v, k) => `<span class="vs"${ids ? ` id="vs${k}"` : ''}>${avatar(v.n, v.av)}<span class="vn"><b>${v.n}</b><small>${v.role}</small></span></span>`).join('');
        return `<div class="vbar"><span class="vlab">${ic('eye')}${X.viewAs}</span>
          <div class="vseg" id="vseg"><i class="vthumb" id="vthumb"></i>${segs(true)}<div class="vsel" id="vsel">${segs(false)}</div></div>
          <span class="vsum"><span id="dm0">${X.all}</span><i></i><span><b id="dmN">${acl.rows.length}</b> ${X.count}</span><i></i><em id="dmF">${X.shown}</em></span></div>
          <div class="dt2"><div class="dh">${X.cols.slice(0, 4).map((c) => `<span>${c}</span>`).join('')}<span class="fph">${X.cols[4]}<i class="eo">${ic('eye-off')}</i></span></div>` +
          acl.rows.map((r, j) => `<div class="dr" id="dr${j}"><span class="no">${r[0]}</span><span>${r[1]}<span class="dept">${r[2]}</span></span><span>${ZH(r[3])}</span>` +
            `<span class="amt">${r[4]}</span><span class="fp"><em class="fv">${r[5]}</em><em class="fm">••••••</em></span>` +
            `<span class="dl"><span class="ic">${ic('lock')}</span>${X.locked}</span></div>`).join('') + `</div>`;
      },
      // once the body is on the stage (in the film's build step): the thumb under the first viewer, every row open, prices shown
      init: () => {
        const seg = acl.viewers.map((_, k) => K.box($('#vs' + k), $('#vseg'))), W = $('#vsel').offsetWidth, th = { x: seg[0].x, w: seg[0].w };
        const paint = () => {
          const t = $('#vthumb'); t.style.transform = `translateX(${th.x.toFixed(2)}px)`; t.style.width = th.w.toFixed(2) + 'px';
          $('#vsel').style.clipPath = `inset(4px ${(W - th.x - th.w).toFixed(2)}px 4px ${th.x.toFixed(2)}px round 8px)`;  // GSAP does not tween clip-path
        };
        paint();
        gsap.set('.dt2 .dl, .dt2 .fm, .dt2 .eo', { autoAlpha: 0 });
        gsap.set($$('.dt2 .dr > span:not(.dl), .dt2 .fv'), { filter: 'blur(0px)' });  // blur tweens from a value, not from "none"
        acl.st = { seg, th, paint, was: acl.rows.map(() => true), masked: false };
      },
      // at t, switch to viewer k: the thumb slides (0.4 s), then the list answers row by row from the top (0.07 s apart)
      view: (k, t) => {
        const { seg, th, paint } = acl.st, v = acl.viewers[k], X = acl.text, vis = acl.rows.map((r) => v.all || r[2] === v.dept);
        tl.to(th, { x: seg[k].x, w: seg[k].w, duration: 0.4, ease: 'power3.inOut', onUpdate: paint }, t);
        acl.rows.forEach((_, j) => {
          const r = t + 0.12 + j * 0.07;
          if (vis[j] !== acl.st.was[j]) {
            tl.to($$(`#dr${j} > span:not(.dl)`), { opacity: vis[j] ? 1 : 0, filter: vis[j] ? 'blur(0px)' : 'blur(6px)', duration: 0.4, ease: 'power2.inOut' }, r);
            tl.to(`#dr${j} .dl`, { autoAlpha: vis[j] ? 0 : 1, duration: vis[j] ? 0.3 : 0.28, ease: 'power2.inOut' }, r + (vis[j] ? 0 : 0.16));
          }
          if (!v.all !== acl.st.masked) {
            tl.to(`#dr${j} .fv`, { opacity: v.all ? 1 : 0, filter: v.all ? 'blur(0px)' : 'blur(5px)', duration: 0.35, ease: 'power2.inOut' }, r);
            tl.to(`#dr${j} .fm`, { autoAlpha: v.all ? 0 : 1, duration: 0.3, ease: 'power2.inOut' }, r + 0.1);
          }
        });
        if (!v.all !== acl.st.masked) tl.to('.dt2 .eo', { autoAlpha: v.all ? 0 : 1, duration: 0.3 }, t + 0.12);
        tl.call(() => { $('#dm0').textContent = v.all ? X.all : X.only(v.dept); $('#dmN').textContent = vis.filter(Boolean).length; $('#dmF').textContent = v.all ? X.shown : X.masked; }, null, t + 0.15);
        acl.st.was = vis; acl.st.masked = !v.all;
      },
    };

    // ---------------------------------------------------------------- the rest of the foundation: capability cards, the model ring, the wall
    const MODELS = [['GPT', '#10a37f'], ['Claude', '#d97757'], ['Gemini', '#4285f4'], ['DeepSeek', '#4d6bfe'], ['通义千问', '#615ced'], ['Kimi', '#27272a'], ['本地模型', '#a1a1aa']];
    const chip = (icon, text, cls = '', small = '') => `<span class="chip ${cls}">${icon ? ic(icon) : ''}${text}${small ? `<small>${small}</small>` : ''}</span>`;
    const reqChip = (r) => `<div class="rq">${avatar(r.name, r.av)}<span>${ZH(r.msg.replace(/[。？]$/, ''))}</span><i class="ok">${ic('check')}</i></div>`;
    const cards = {
      MODELS,
      // [title, icon, accent, request index or null, body]
      list: [
        ['身份认证', 'key-round', '#4f46e5', 3, `<div class="authw"><div class="login">
            <div class="lh"><span class="sq">${ic('shopping-cart')}</span><b>采购申请系统</b></div>
            <div class="lb fs"><i>飞</i>使用飞书登录</div>
            <div class="lr"><div class="lb"><i class="wx">企</i>企业微信</div><div class="lb"><i class="so">${ic('building-2')}</i>企业 SSO</div></div>
            <div class="lo"><span>或</span></div><div class="ll">使用账号密码登录</div></div>
            <div class="proto">${['SAML 2.0', 'OIDC', 'LDAP'].map((p) => `<span>${ic('lock')}${p}</span>`).join('')}</div></div>`],
        ['AI 能力接入', 'sparkles', '#7c3aed', null, `<div class="kv2">
            <span class="k">模型</span><div class="v">${MODELS.map(([n, c]) => `<span class="mdl" style="--c:${c}"><i></i>${n}</span>`).join('')}<span class="hint">${ic('shuffle')}可随时替换</span></div>
            <span class="k">知识库</span><div class="v">${chip('book-open', '《采购制度》v2', '', '42 页')}${chip('book-open', '供应商准入规则')}</div>
            <span class="k">工具</span><div class="v">${chip('plug', 'SAP 预算', '', '只读')}${chip('plug', '供应商名录')}</div>
            <span class="k">权限</span><div class="v">${chip('eye', '只读', 'ok')}${chip('lock', '不能审批', 'no')}</div></div>`],
        ['业务 Agent 接入', 'bot', '#9333ea', null, `<div class="agent"><div class="agc"><span class="aga">${ic('bot')}</span><div class="agn"><b>预算核对 Agent</b><small>业务 Agent · 权限体系中的独立主体</small></div>
            <div class="ags">${chip('check', '读取预算', 'ok')}${chip('check', '标注申请', 'ok')}${chip('x', '审批', 'no')}</div></div>
            <div class="calls"><div class="call"><span class="via">MCP</span><code>purchase_requests.list(status: 待核对)</code><span class="res ok">${ic('check')}3 条</span></div>
              <div class="call"><span class="via">CLI</span><code>purchase_requests.annotate(REQ-0143)</code><span class="res ok">${ic('check')}已标注</span></div>
              <div class="call"><span class="via">MCP</span><code>purchase_requests.approve(REQ-0143)</code><span class="res no">${ic('x')}无权限</span></div></div></div>`],
        ['邮件', 'mail', '#0891b2', null, `<div class="inbox"><div class="ibh"><span class="seg"><b>全部</b><span>收到</span><span>已发送</span></span><small>${ic('refresh-cw')}已与 purchase@ 邮箱同步</small></div>
            <div class="ibr"><i class="av sup">${ic('building-2')}</i><b>供应商</b><span>回复：GPU 服务器报价单</span><em class="tg in">收到</em><time>10:12</time></div>
            <div class="ibr"><i class="av sup">${ic('building-2')}</i><b>发给 供应商</b><span>采购单 PO-0143</span><em class="tg out">自动发送</em><time>10:05</time></div>
            <div class="ibr">${avatar('王磊', '王')}<b>发给 王磊</b><span>申请进度：已进入采购</span><em class="tg out">自动发送</em><time>10:04</time></div>
            <div class="ibr">${avatar('周明远', '周')}<b>发给 周明远</b><span>待审批：REQ-0143 · ¥86,000</span><em class="tg out">自动发送</em><time>09:58</time></div></div>`],
        ['生成文件', 'file-text', '#dc2626', 4, `<div class="gen"><div class="pdf2"><div class="ph2"><b>采购单</b><span>PO-2026-0143</span></div>
            <div class="pm"><span>申请部门</span><b>研发部</b><span>供应商</span><b>供应商 A</b></div>
            <div class="pt"><i style="width:88%"></i><i style="width:64%"></i><i style="width:76%"></i></div>
            <div class="tot"><span>合计</span><b>¥86,000</b></div><div class="stamp">已审批</div></div>
            <div class="files">${[['pdf', 'PDF', '采购单 PO-0143', '刚刚'], ['doc', 'DOCX', '采购合同', '模板 v2'], ['pdf', 'PDF', '订单确认函', '模板 v1'], ['xls', 'XLSX', '9 月采购报表', '每月自动']]
              .map(([k, t, n, s]) => `<div class="fr"><span class="ft ${k}">${t}</span><b>${n}</b><small>${s}</small></div>`).join('')}<div class="fr pr">${ic('printer')}打印</div></div></div>`],
        ['测试与验证', 'flask-conical', '#059669', null, `<div class="tst">${[['采购审批流程', 126], ['权限边界', 184], ['SAP 数据源', 97]]
              .map(([n, k]) => `<div class="ts"><span class="nm">${ic('circle-check')}${n}</span><span class="pb"><i></i></span><span class="n">${k} passed</span></div>`).join('')}
            <div class="sum"><b>407</b><span>passed</span><span class="z">0 failed</span><span class="bdg">${ic('badge-check')}可作为发布依据</span></div></div>`],
        ['应用界面', 'layout-grid', '#1677ff', null, `<div class="kit">
            <div class="cell"><em>Button</em><div class="row1"><span class="btnp">提交申请</span><span class="btng">取消</span></div></div>
            <div class="cell"><em>Input</em><div class="inp2">${ic('search')}搜索申请…</div></div>
            <div class="cell"><em>Tag</em><div class="row1"><span class="pill p-em">已批准</span><span class="pill p-am">审批中</span><span class="pill p-gray">草稿</span></div></div>
            <div class="cell"><em>DatePicker</em><div class="cal">${Array.from({ length: 21 }, (_, k) => `<i${k === 10 ? ' class="on"' : k > 16 ? ' class="nx"' : ''}>${k < 17 ? k + 15 : k - 16}</i>`).join('')}</div></div>
            <div class="cell"><em>Avatar</em><div class="row1"><span class="stack">${['何静', '周明远', '陈宇', '孙悦'].map((n) => avatar(n, n[0])).join('')}</span><span class="more">+8</span></div></div>
            <div class="cell"><em>Chart</em><div class="mch">${[42, 58, 50, 70, 64, 88].map((h, k) => `<i style="height:${h}%"${k === 5 ? ' class="on"' : ''}></i>`).join('')}</div></div></div>`],
        ['审计日志', 'scroll-text', '#d97706', 5, `<div class="audit">${[
              ['10:02', 'pu', `<span class="who ag"><i class="gl">${ic('bot')}</i>预算核对 Agent</span>`, '读取 SAP 预算 · 成本中心 RD-01'],
              ['10:03', 'pu', `<span class="who ag"><i class="gl">${ic('bot')}</i>预算核对 Agent</span>`, '标注 REQ-0143 · 预算充足'],
              ['10:04', 'am', `<span class="who hu">${avatar('周明远', '周')}周明远</span>`, '批准 REQ-0143 · ¥86,000'],
              ['10:04', 'bl', `<span class="who wf"><i class="gl">${ic('git-branch')}</i>工作流</span>`, '生成采购单 PO-0143'],
              ['10:05', 'bl', `<span class="who wf"><i class="gl">${ic('git-branch')}</i>工作流</span>`, '发送采购单给供应商']]
            .map(([t, k, who, what]) => `<div class="ev"><time>${t}</time><i class="dot ${k}"></i>${who}<span class="what">${what}</span></div>`).join('')}</div>`],
      ],
      html: (i, card = cards.list[i]) => { const [n, icon, ac, rq, body] = card; return `<div class="mc lt win" id="mc${i}" style="--ac:${ac}"><div class="mh"><span class="mi">${ic(icon)}</span><div class="n">${n}</div>${rq !== null ? reqChip(story.reqs[rq]) : ''}</div><div class="mb">${body}</div></div>`; },
      ringHTML: () => `<div id="ring">${MODELS.map(([n, c], k) => `<span class="mdl rg" id="rg${k}" style="--c:${c}"><i></i>${n}</span>`).join('')}</div>`,
      // model tags on a tilted ring around the AI card: depth drives size, brightness, blur and stacking
      ringIn: (at, dur, R = { rx: 610, ry: 205, cx: K.W / 2, cy: 418 }) => {
        const n = MODELS.length, o = { a: 0, f: 0 };
        const place = () => $$('#ring .rg').forEach((e, k) => {
          const th = o.a + (k / n) * Math.PI * 2, x = R.cx + R.rx * Math.cos(th), y = R.cy + R.ry * Math.sin(th), d = (Math.sin(th) + 1) / 2;
          e.style.transform = `translate(${(x - e.offsetWidth / 2).toFixed(1)}px, ${(y - 16).toFixed(1)}px) scale(${(0.78 + 0.34 * d).toFixed(3)})`;
          e.style.opacity = ((0.35 + 0.65 * d) * o.f).toFixed(3); e.style.filter = `blur(${((1 - d) * 3).toFixed(2)}px)`; e.style.zIndex = d > 0.5 ? 20 : 1;
        });
        K.show('#ring', at);
        tl.fromTo(o, { a: -0.4 }, { a: 0.75, duration: dur + 0.2, ease: 'none', onUpdate: place }, at);
        tl.fromTo(o, { f: 0 }, { f: 1, duration: 0.15, onUpdate: place }, at);
        tl.to(o, { f: 0, duration: 0.14, onUpdate: place }, at + dur - 0.14);
        K.hide('#ring', at + dur);
      },
    };
    const WALL = [
      [['数据模型', 'database', 1], ['REST API', 'braces'], ['TypeScript 实体', 'file-code-2'], ['权限', 'shield', 1], ['行级隔离', 'rows-3'], ['字段脱敏', 'eye-off'], ['工作流', 'git-branch', 1], ['多级审批', 'list-checks'], ['异步任务', 'timer'], ['失败重试', 'rotate-cw']],
      [['数据源', 'cable', 1], ['PostgreSQL', 'database'], ['MySQL', 'database'], ['Oracle', 'database'], ['外部 REST API', 'globe'], ['身份认证', 'key-round', 1], ['飞书', 'message-circle'], ['企业微信', 'message-square'], ['SAML 2.0', 'lock'], ['OIDC', 'lock'], ['LDAP', 'users']],
      [['AI 能力接入', 'sparkles', 1], ['知识库', 'book-open'], ['模型可替换', 'shuffle'], ['业务 Agent 接入', 'bot', 1], ['CLI', 'terminal'], ['MCP', 'plug'], ['邮件', 'mail', 1], ['往来邮件同步', 'refresh-cw'], ['生成文件', 'file-text', 1], ['合同', 'file-check']],
      [['订单', 'receipt'], ['报表', 'chart-column'], ['打印', 'printer'], ['测试与验证', 'flask-conical', 1], ['回归测试', 'check-check'], ['发布依据', 'badge-check'], ['开发指引', 'book-marked', 1], ['Skills', 'wand-sparkles'], ['不绑定 Agent', 'unlink']],
      [['应用界面', 'layout-grid', 1], ['组件库', 'component'], ['交互规范', 'mouse-pointer-click'], ['审计日志', 'scroll-text', 1], ['操作追溯', 'history'], ['高危操作确认', 'shield-alert'], ['超时升级', 'alarm-clock'], ['节点重试', 'repeat'], ['模板', 'layout-template']],
      [['权限', 'shield', 1], ['角色', 'users'], ['数据范围', 'funnel'], ['工作流', 'git-branch', 1], ['长流程', 'route'], ['数据源', 'cable', 1], ['外部数据库', 'database'], ['身份认证', 'key-round', 1], ['企业 SSO', 'lock'], ['审计日志', 'scroll-text', 1]],
      [['生成文件', 'file-text', 1], ['邮件', 'mail', 1], ['AI 能力接入', 'sparkles', 1], ['知识库', 'book-open'], ['测试与验证', 'flask-conical', 1], ['开发指引', 'book-marked', 1], ['应用界面', 'layout-grid', 1], ['数据模型', 'database', 1], ['REST API', 'braces']],
    ];
    const wall = {
      rows: WALL,
      html: () => WALL.map((row, r) => `<div class="wrow" id="w${r}" style="top:${r * 84 + 20}px">${[...row, ...row, ...row].map(([n, i, k]) => `<div class="tile${k ? ' k' : ''}"><i>${ic(i)}</i>${n}</div>`).join('')}</div>`).join(''),
    };

    // ---------------------------------------------------------------- NocoBase Hub · 部署与运维: one console, three pages side by side, shown at 1.0×
    const hub = {
      apps: [['采购申请系统', '采', 'purchase', '/purchase', '生产', 'v1.1.0', 'host-01', 'run'], ['采购申请系统', '采', 'purchase-test', '/purchase', '测试', 'v1.2.0-rc.1', 'host-03', 'run'],
        ['合同管理', '合', 'contracts', '/contracts', '生产', 'v2.3.0', 'host-01', 'run'], ['NocoCRM', 'N', 'crm', '/crm', '生产', 'v1.8.2', 'host-02', 'run'],
        ['NocoSupport', 'N', 'support', '/support', '预发布', 'v1.4.1', 'host-02', 'stop'], ['资产管理', '资', 'assets', '/assets', '生产', 'v0.9.4', 'host-03', 'run']],
      logs: [['10:20:14', 'INFO', '部署 v1.1.0 完成 · 用时 42 秒'], ['10:20:15', 'INFO', '应用已启动 · 端口 13000'], ['10:21:02', 'INFO', 'POST /api/purchase_requests · 201 · 38 ms'],
        ['10:21:05', 'INFO', '工作流「采购审批」执行 #1182 · 已完成'], ['10:21:09', 'WARN', '邮件队列延迟 1.2 秒 · 已自动重试'], ['10:21:12', 'INFO', '预算核对 Agent · 读取 SAP 预算']],
      lanes: [['测试', 'host-03', '等待 CI', 'CI #482 自动部署'], ['预发布', 'host-02', '等待部署', '陈宇 已部署'], ['生产', 'host-01', '等待部署', '赵强 已部署']],
      rel: [['v1.1.0', 'b7e41c09a2', '今天 10:20'], ['v1.0.0', '46eb898f7f', '7 天前'], ['v0.9.2', '0a3fb90b51', '21 天前']],
      deps: [['v1.1.0', 'b7e41c09a2', '#ed9edf26', '今天 10:20'], ['v1.0.0', '46eb898f7f', '#f2228157', '7 天前']],
      // one card per app, like the head of the real Hub's app page
      appCard: ([n, L, slug, path, env, v, host, st], k) => `<div class="acard" id="ha${k}">
          <div class="ac1"><i class="la">${L}</i><div class="acn"><div class="acr"><b>${n}</b>${K.pillS('hs' + k, st)}</div><small>${slug} · ${path}</small></div></div>
          <div class="acm"><span>版本<b class="mono" id="hv${k}">${v}</b></span><span>环境<b>${env} · ${host}</b></span></div>
          <div class="aca">${K.btnO('external-link', '访问')}${K.btnO('rotate-cw', '重启')}${K.btnO(st === 'stop' ? 'play' : 'square', st === 'stop' ? '启动' : '停止', 'hss' + k)}<span class="sp1"></span>${K.btnO('scroll-text', '日志', 'hlog' + k)}</div></div>`,
      page1: () => `<div class="hpn" id="hp1"><div class="hin">
          <div class="phd"><b>应用</b><small>${hub.apps.length}</small><span class="sp1"></span>${K.btnO('refresh-cw', '刷新状态')}${K.btnD('upload', '上传构建包')}</div>
          <div class="agrid">${hub.apps.map(hub.appCard).join('')}</div>
          <div class="logd" id="hlogd"><div class="lgh"><span class="tabs"><b>运行日志</b><span>部署记录</span><span>配置</span></span><small>采购申请系统 · 生产 · host-01</small></div>
            <div class="lgb">${hub.logs.map(([t, lv, m]) => `<div class="lgl"><time>${t}</time><span class="lv ${lv === 'WARN' ? 'w' : ''}">${lv}</span><span>${ZH(m)}</span></div>`).join('')}</div></div>
          ${K.cursorSVG('cur1')}</div></div>`,
      page2: () => {
        const PERMS = [
          [`<i class="la sm">${ic('bot')}</i>Coding Agent`, ['部署', ''], ['—', 'no'], ['—', 'no']], [`<i class="la sm">${ic('git-merge')}</i>CI 流水线`, ['自动部署', ''], ['—', 'no'], ['—', 'no']],
          [`${avatar('陈宇', '陈')}陈宇 · IT`, ['部署', ''], ['部署', ''], ['审批', 'apv']], [`${avatar('赵强', '赵')}赵强 · 运维`, ['部署', ''], ['部署', ''], ['部署 · 需审批', 'need']]];
        return `<div class="hpn" id="hp2"><div class="hin">
          <div class="phd"><b>发布 v1.1.0</b><small>采购申请系统</small><span class="sp1"></span><span class="flow">测试${ic('chevron-right')}预发布${ic('chevron-right')}生产</span></div>
          <div class="lanes">${hub.lanes.map(([n, h, wait, done], k) =>
            `${k ? `<span class="lar">${ic('chevron-right')}</span>` : ''}<div class="lane" id="l${k}"><div class="lt2"><b>${n}</b><small>${h}</small></div>
              <div class="lv2"><span class="vold">v1.0.0</span><span class="vnew">v1.1.0</span></div>
              <div class="lw"><span class="w0">${wait}</span>${k === 2 ? '<span class="wa">待审批</span>' : ''}<span class="w1"><i></i>${ZH(done)}</span></div></div>`).join('')}</div>
          <div class="sec2">谁能部署到哪个环境</div>
          <div class="tbl perm2"><div class="th"><span>成员</span><span>测试</span><span>预发布</span><span>生产</span></div>` +
          PERMS.map(([who, ...cells], r) => `<div class="tr pr3" id="pr${r}"><span class="who">${who}</span>${cells.map(([t, k], c) => `<span><em class="pc ${k}" id="pc${r}${c}">${t}</em></span>`).join('')}</div>`).join('') +
          `</div><div class="apr3" id="h2appr"><span class="wa" id="h2tag">待审批</span><span class="t" id="h2t">赵强 申请部署 v1.1.0 到生产 · 审批人 陈宇</span>${K.btnD('', '批准', 'h2btn')}</div>
          ${K.cursorSVG('cur2')}</div></div>`;
      },
      // the app page, releases and deployments side by side: the whole rollback fits one still frame
      page3: () => `<div class="hpn" id="hp3"><div class="hin">
          <div class="ahd"><i class="la lg">采</i><div class="ahm"><div class="ah1"><b>采购申请系统</b>${K.pillS('h3st', 'run')}</div><small>purchase · /purchase</small></div>
            <span class="sp1"></span>${K.btnO('refresh-cw', '刷新状态')}${K.btnO('external-link', '访问')}${K.btnO('rotate-cw', '重启')}</div>
          <div class="ameta"><span>版本<b id="h3v">v1.1.0</b></span><span>启动方式<b>由 Hub 启动</b></span><span>环境<b>生产 · host-01</b></span></div>
          <div class="alert" id="h3alert"><span class="ic2">${ic('triangle-alert')}</span><span id="h3at">v1.1.0 · 审批通知发送失败</span><small id="h3as">近 5 分钟 · 12 次</small></div>
          <div class="atabs"><span class="on">版本与部署</span><span>运行日志</span><span>配置</span><span>设置</span></div>
          <div class="two3">
            <div class="col"><div class="sech"><b>构建包</b><small>${hub.rel.length}</small></div>
              <div class="tbl rel3"><div class="th"><span>版本</span><span>上传时间</span><span></span></div>` +
          hub.rel.map(([v, h, t], k) => `<div class="tr"><span class="vv"><b>${v}</b>${k === 0 ? '<em class="tg2 g" id="h3c0">当前</em><em class="tg2 b">最新上传</em>' : ''}${k === 1 ? '<em class="tg2 g" id="h3c1">当前</em>' : ''}<small>${h}</small></span>` +
            `<span>${t}</span><span class="ra">${K.btnO('play', '部署', k === 1 ? 'h3rb' : '')}</span></div>`).join('') +
          `</div></div>
            <div class="col"><div class="sech"><b>部署记录</b><small id="h3dn">${hub.deps.length}</small></div>
              <div class="tbl dep3"><div class="th"><span>版本</span><span>部署</span><span>状态</span></div>
                <div class="tr" id="h3new"><span class="vv"><b>v1.0.0</b><em class="tg2 g" id="h3nc">当前</em><small>46eb898f7f</small></span><span class="mono">#a41c3e20<small>赵强 · 回滚 · 刚刚</small></span>
                  <span>${K.pillS('h3ns', 'upd', '部署中')}</span></div>` +
          hub.deps.map(([v, h, id, t], k) => `<div class="tr"><span class="vv"><b>${v}</b>${k === 0 ? '<em class="tg2 g" id="h3dc">当前</em>' : ''}<small>${h}</small></span><span class="mono">${id}<small>已部署 · ${t}</small></span>` +
            `<span>${K.pillS('', 'run', '成功')}</span></div>`).join('') +
          `</div></div></div>
          ${K.cursorSVG('cur3')}</div></div>`,
      // the console: sidebar (200 px) + a viewport holding the pages side by side (#hcam slides by 1048 px per page)
      html: (o = {}) => `<div class="hcon lt win" id="hcon"><aside class="hsd"><div class="hlg"><i>${ic('server')}</i>NocoBase Hub</div>
            <span class="it on">${ic('layout-grid')}应用</span><span class="it">${ic('users')}用户管理</span><span class="it">${ic('shield')}角色与权限</span><span class="it">${ic('key-round')}API Keys</span>
            <div class="hh"><i></i>3 台 App Host 在线</div></aside>
          <div class="hvp"><div class="hcam" id="hcam">${(o.pages || [hub.page1, hub.page2, hub.page3]).map((p) => p()).join('')}</div></div></div>`,
      VW: 1048,
      page: (k) => ({ x: -k * 1048, y: 0, scale: 1 }),
    };

    return { story, term, chat, app, stack, road, er, wf, acl, cards, wall, hub, lineHTML, tbl, chip, reqChip };
  };
})();
