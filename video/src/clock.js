// Virtual clock for frame-accurate rendering.
// Until freeze() the page runs on real time. After freeze(), timers, rAF, Date.now and
// performance.now follow virtual time, and every CSS animation/transition is paused and
// seeked to it, so advance(dt) produces exactly the state of the page dt ms later.
(function () {
  const N = {
    setTimeout: window.setTimeout.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
    setInterval: window.setInterval.bind(window),
    clearInterval: window.clearInterval.bind(window),
    raf: window.requestAnimationFrame.bind(window),
    caf: window.cancelAnimationFrame.bind(window),
    dateNow: Date.now.bind(Date),
    perfNow: performance.now.bind(performance),
  };
  const C = (window.__clock = {
    frozen: false, vt: 0, baseDate: 0, basePerf: 0,
    timers: new Map(), rafs: new Map(), seq: 1e7, animStart: new WeakMap(),
  });

  window.setTimeout = function (fn, ms, ...args) {
    if (!C.frozen) return N.setTimeout(fn, ms, ...args);
    const id = C.seq++;
    C.timers.set(id, { due: C.vt + Math.max(0, +ms || 0), fn, args, every: 0, order: id });
    return id;
  };
  window.setInterval = function (fn, ms, ...args) {
    if (!C.frozen) return N.setInterval(fn, ms, ...args);
    const id = C.seq++;
    const every = Math.max(1, +ms || 0);
    C.timers.set(id, { due: C.vt + every, fn, args, every, order: id });
    return id;
  };
  window.clearTimeout = window.clearInterval = function (id) {
    if (C.timers.has(id)) C.timers.delete(id);
    else { N.clearTimeout(id); N.clearInterval(id); }
  };
  window.requestAnimationFrame = function (cb) {
    if (!C.frozen) return N.raf(cb);
    const id = C.seq++;
    C.rafs.set(id, cb);
    return id;
  };
  window.cancelAnimationFrame = function (id) {
    if (C.rafs.has(id)) C.rafs.delete(id); else N.caf(id);
  };
  Date.now = () => (C.frozen ? C.baseDate + C.vt : N.dateNow());
  performance.now = () => (C.frozen ? C.basePerf + C.vt : N.perfNow());

  function syncAnims() {
    for (const a of document.getAnimations()) {
      let st = C.animStart.get(a);
      if (st === undefined) {
        st = C.vt;
        C.animStart.set(a, st);
        try { a.pause(); } catch (e) {}
      }
      try { a.currentTime = C.vt - st; } catch (e) {}
    }
  }

  C.freeze = function () {
    if (C.frozen) return;
    C.baseDate = N.dateNow();
    C.basePerf = N.perfNow();
    C.vt = 0;
    C.frozen = true;
    syncAnims();
  };

  // Run everything due in (vt, vt + dt], then one rAF round, then seek animations.
  C.advance = function (dt) {
    const target = C.vt + dt;
    for (let guard = 0; guard < 20000; guard++) {
      let pick = null;
      for (const [id, t] of C.timers) {
        if (t.due > target) continue;
        if (!pick || t.due < pick.t.due || (t.due === pick.t.due && t.order < pick.t.order)) pick = { id, t };
      }
      if (!pick) break;
      C.vt = Math.max(C.vt, pick.t.due);
      if (pick.t.every) { pick.t.due += pick.t.every; pick.t.order = C.seq++; }
      else C.timers.delete(pick.id);
      try { pick.t.fn(...pick.t.args); } catch (e) { console.error('[clock] timer error', e); }
    }
    C.vt = target;
    const cbs = [...C.rafs.values()];
    C.rafs.clear();
    for (const cb of cbs) { try { cb(C.basePerf + C.vt); } catch (e) { console.error('[clock] raf error', e); } }
    syncAnims();
    return C.vt;
  };

  C.native = N;  // the real timers, for a preview player that drives the frozen clock itself
  // Real-time playback in a normal browser (preview): drive advance() from the native rAF.
  C.play = function () {
    C.freeze();
    let last = N.perfNow();
    const tick = () => {
      const now = N.perfNow();
      C.advance(Math.min(100, now - last));
      last = now;
      if (window.__onFrame) window.__onFrame(C.vt);
      N.raf(tick);
    };
    N.raf(tick);
  };
})();
