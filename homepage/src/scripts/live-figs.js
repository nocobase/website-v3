/* 首页与产品页里界面示意的轻量动态交互（流畅持续、遵循 prefers-reduced-motion）：
   1. Studio「24 小时工作的 Agent 团队」([data-live="team"])：旋转时钟 + 24 小时时段、运行环境并发数字与调度记录持续流畅轮动。
   2. Core「20 多项现成的基础能力」([data-live="core-blocks"])：在流程管理（流程图）、角色与权限（权限矩阵）、文件存储之间持续流畅切换，也支持直接点击切换。 */
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

  /* ---------- 2. Core 基础能力多视图切换（流程图 / 角色矩阵 / 文件存储） ---------- */
  var CORE_ORDER = ['wf', 'roles', 'files'];

  function applyCoreTab(win, tab) {
    win.dataset.tab = tab;
    win.querySelectorAll('[data-cr-tab]').forEach(function (btn) {
      var on = btn.dataset.crTab === tab;
      btn.classList.toggle('on', on);
      if (btn.hasAttribute('aria-pressed')) btn.setAttribute('aria-pressed', String(on));
    });
    win.querySelectorAll('.cr-view[data-cr-view]').forEach(function (v) {
      var on = v.dataset.crView === tab;
      v.classList.toggle('on', on);
      v.setAttribute('aria-hidden', String(!on));
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
    manualPause.set(win, Date.now() + 6000);
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

    /* Core 基础能力：每 2.4 秒流畅切换一个内置能力视图 */
    window.setInterval(function () {
      if (document.hidden) return;
      document.querySelectorAll('[data-live="core-blocks"]').forEach(function (win) {
        if (!inView(win)) return;
        if (Date.now() < (manualPause.get(win) || 0)) return;
        var cur = win.dataset.tab || CORE_ORDER[0];
        var next = CORE_ORDER[(CORE_ORDER.indexOf(cur) + 1) % CORE_ORDER.length];
        applyCoreTab(win, next);
      });
    }, 2400);
  }
})();
