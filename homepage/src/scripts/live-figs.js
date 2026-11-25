/* 首页与产品页里界面示意的轻量动态交互（流畅持续、遵循 prefers-reduced-motion）：
   1. Studio「24 小时工作的 Agent 团队」([data-live="team"])：旋转时钟 + 24 小时时段、运行环境并发数字与调度记录持续流畅轮动。
   2. Core「30 多项现成的基础能力」([data-live="core-blocks"])：在流程管理（流程图）、角色与权限（权限矩阵）、文件存储之间持续流畅切换，也支持直接点击切换。 */
(function () {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var manualPause = new WeakMap();

  function inView(el) {
    if (!el || !el.isConnected) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 20 && r.top < window.innerHeight - 20;
  }

  /* ---------- 1. Studio 24 小时 Agent 团队 ---------- */
  function applyTeamStep(win, step) {
    win.dataset.step = String(step);
    win.querySelectorAll('[data-tm-vals]').forEach(function (el) {
      var vals = el.dataset.tmVals.split('|');
      var next = vals[step % vals.length];
      if (el.textContent !== next) {
        el.textContent = next;
        el.classList.remove('is-tick');
        void el.offsetWidth;
        el.classList.add('is-tick');
      }
    });
    var dps = win.querySelectorAll('.sv-dp');
    if (dps.length) {
      var activeIdx = step % dps.length;
      dps.forEach(function (dp, i) {
        dp.classList.toggle('is-live', i === activeIdx);
      });
    }
  }

  /* ---------- 2. Core 基础能力多视图切换（流程管理 / 角色和权限 / 登录与认证 / 数据库 / 插件） ---------- */
  var CORE_ORDER = ['wf', 'roles', 'auth', 'db', 'plugins'];

  function applyCoreTab(win, tab) {
    win.dataset.tab = tab;
    win.querySelectorAll('[data-cr-tab]').forEach(function (btn) {
      var on = btn.dataset.crTab === tab;
      btn.classList.toggle('on', on);
      if (btn.hasAttribute('aria-selected')) btn.setAttribute('aria-selected', String(on));
      if (btn.getAttribute('role') === 'tab') btn.tabIndex = on ? 0 : -1;
      if (btn.hasAttribute('aria-pressed')) btn.setAttribute('aria-pressed', String(on));
    });
    win.querySelectorAll('.cr-view[data-cr-view]').forEach(function (v) {
      var on = v.dataset.crView === tab;
      v.classList.toggle('on', on);
      v.hidden = !on;
    });
    win.querySelectorAll('.cr-crumb[data-cr-crumb]').forEach(function (c) {
      c.hidden = c.dataset.crCrumb !== tab;
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-cr-tab]');
    if (!btn) return;
    var win = btn.closest('[data-live="core-blocks"]');
    if (!win) return;
    applyCoreTab(win, btn.dataset.crTab);
    manualPause.set(win, Date.now() + 8000);
  });

  document.addEventListener('keydown', function (e) {
    var btn = e.target.closest && e.target.closest('[data-cr-tab][role="tab"]');
    if (!btn) return;
    var win = btn.closest('[data-live="core-blocks"]');
    if (!win) return;
    var idx = CORE_ORDER.indexOf(btn.dataset.crTab);
    if (idx < 0) return;
    var next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = CORE_ORDER[(idx + 1) % CORE_ORDER.length];
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = CORE_ORDER[(idx - 1 + CORE_ORDER.length) % CORE_ORDER.length];
    else if (e.key === 'Home') next = CORE_ORDER[0];
    else if (e.key === 'End') next = CORE_ORDER[CORE_ORDER.length - 1];
    if (!next) return;
    e.preventDefault();
    applyCoreTab(win, next);
    manualPause.set(win, Date.now() + 8000);
    var list = btn.closest('[role="tablist"]');
    var target = list && list.querySelector('[data-cr-tab="' + next + '"]');
    if (target) target.focus();
  });

  /* ---------- 3. Studio 工作流程画布切换（精简流程 / 标准流程 / 质量测试） ---------- */
  var WF_ORDER = ['standard', 'quality', 'simple'];

  function applyStudioWf(win, wf) {
    win.dataset.wf = wf;
    win.querySelectorAll('[data-wf-tab]').forEach(function (btn) {
      var on = btn.dataset.wfTab === wf;
      btn.setAttribute('aria-selected', String(on));
      btn.tabIndex = on ? 0 : -1;
    });
    win.querySelectorAll('[data-wf-panel]').forEach(function (panel) {
      var on = panel.dataset.wfPanel === wf;
      panel.classList.toggle('on', on);
      panel.hidden = !on;
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-wf-tab]');
    if (!btn) return;
    var win = btn.closest('[data-live="studio-workflow"]');
    if (!win) return;
    applyStudioWf(win, btn.dataset.wfTab);
    manualPause.set(win, Date.now() + 9000);
  });

  document.addEventListener('keydown', function (e) {
    var btn = e.target.closest && e.target.closest('[data-wf-tab][role="tab"]');
    if (!btn) return;
    var win = btn.closest('[data-live="studio-workflow"]');
    if (!win) return;
    var tabs = Array.prototype.slice.call(win.querySelectorAll('[data-wf-tab][role="tab"]'));
    var idx = tabs.indexOf(btn);
    if (idx < 0) return;
    var nextBtn = null;
    if (e.key === 'ArrowRight') nextBtn = tabs[(idx + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') nextBtn = tabs[(idx - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') nextBtn = tabs[0];
    else if (e.key === 'End') nextBtn = tabs[tabs.length - 1];
    if (!nextBtn) return;
    e.preventDefault();
    applyStudioWf(win, nextBtn.dataset.wfTab);
    manualPause.set(win, Date.now() + 9000);
    nextBtn.focus();
  });

  if (!reduced) {
    /* Studio 24h 团队：每 1.35 秒流畅推进一个时段，全天 8 个节点循环 */
    window.setInterval(function () {
      if (document.hidden) return;
      document.querySelectorAll('[data-live="team"]').forEach(function (win) {
        if (!inView(win)) return;
        var next = ((+win.dataset.step || 0) + 1) % 8;
        applyTeamStep(win, next);
      });
    }, 1350);

    /* Core 基础能力：每 3.0 秒流畅切换一个内置能力视图 */
    window.setInterval(function () {
      if (document.hidden) return;
      document.querySelectorAll('[data-live="core-blocks"]').forEach(function (win) {
        if (!inView(win)) return;
        if (Date.now() < (manualPause.get(win) || 0)) return;
        var cur = win.dataset.tab || CORE_ORDER[0];
        var next = CORE_ORDER[(CORE_ORDER.indexOf(cur) + 1) % CORE_ORDER.length];
        applyCoreTab(win, next);
      });
    }, 3000);

    /* Studio 工作流程：在标准流程 / 质量测试 / 精简流程间每 3.6 秒柔和切换 */
    window.setInterval(function () {
      if (document.hidden) return;
      document.querySelectorAll('[data-live="studio-workflow"]').forEach(function (win) {
        if (!inView(win)) return;
        if (Date.now() < (manualPause.get(win) || 0)) return;
        var cur = win.dataset.wf || WF_ORDER[0];
        var next = WF_ORDER[(WF_ORDER.indexOf(cur) + 1) % WF_ORDER.length];
        applyStudioWf(win, next);
      });
    }, 3600);
  }
})();
