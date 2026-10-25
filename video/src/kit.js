// NocoBase film kit · window.NBFilm
// What every NocoBase film shares, taken from the approved film (examples/ai-plus-nocobase, v13):
//   - one paused GSAP timeline, seeked to the virtual clock on every frame (frame-accurate, any t renders the same);
//   - the camera (camV / camTo) and the canvas grid that follows it at 35 % for depth;
//   - the type system: title cards, feature titles, chapter words with their rack focus;
//   - the logo lockup "AI + ▣ NocoBase" and its landing (the brick lands on the base);
//   - which way is on screen: the opening question whose grey line docks into the chapter chip, the lockup shrinking
//     into "02", and the ambient light (neutral while the film shows today's way, blue from NocoBase on);
//   - UI atoms in NocoBase 3's shadcn style: status pills, outline / black buttons, request bubbles, the cursor;
//   - CSS 3D boxes and the layer focus used by the 3D maps;
//   - the logs the rest of the pipeline reads: cue (score), sfx (mixer), mb (motion-blur windows for the renderer).
//   - language versions: <html lang> picks character- or word-by-word titles (K.split, K.stag) and the copy face
//     (--copy in nocobase-film.css); NBFilm({ T, avatars }) keeps each person's drawing under a localized name.
//
// A film script:
//   const T = { ..., done: 24 };                  // the cue sheet, seconds; big sections on bar lines (120 BPM → 2 s bars)
//   const K = NBFilm({ T });                      // { T, W, H } — W×H is the stage (1440×810 renders 1920×1080)
//   K.run(build, film);                           // build() writes #stage; film() places everything on K.tl
(function () {
  window.NBFilm = function (opts) {
    const T = opts.T, W = opts.W || 1440, H = opts.H || 810;
    if (!T || !(T.done > 0)) throw new Error('NBFilm: the cue sheet needs T.done (the film length in seconds)');
    const C = window.__clock, LOG = window.__VIDEO.log, LOGO = window.__LOGO, AV = window.__AVATARS || {};
    const D = (window.__director = { done: false, mode: 'transform', mb: [], W, H });
    const tl = gsap.timeline({ paused: true });
    const K = { T, W, H, tl, D, LOGO };
    // the version's language, from <html lang>: Chinese, Japanese and Korean titles rise character by character; Latin and
    // Cyrillic ones (en, de, fr, es, pt, ru, id, vi) word by word, with staggers ×2.3 so a line takes about as long
    K.lang = document.documentElement.lang || 'zh';
    K.byWord = /^(en|de|fr|es|pt|ru|id|vi)\b/i.test(K.lang);
    // the product UI's language, as the website shows it: Chinese for the Chinese version, Traditional Chinese for zh-TW,
    // English for every other version. Specimens pick their UI words by this (K.uiW), not by K.byWord.
    K.uiEn = !/^zh\b/i.test(K.lang);
    K.uiW = (zh, en, tw) => (K.uiEn ? en : K.lang === 'zh-TW' && tw != null ? tw : zh);
    K.stag = (s) => (K.byWord ? +(s * 2.3).toFixed(3) : s);

    // ---------------------------------------------------------------- DOM and text
    const $ = (K.$ = (s, r = document) => r.querySelector(s));
    const $$ = (K.$$ = (s, r = document) => Array.from(r.querySelectorAll(s)));
    K.esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    K.ic = (n) => `<i data-lucide="${n}"></i>`;                       // a lucide icon
    K.fmt = (n) => Math.round(n).toLocaleString('en-US');             // 102,640
    // Chinese copy: Latin runs (AI, NocoBase, API, SAP, CI …) set in the Latin face, not left to font fallback. Only the
    // Chinese version needs it: a Latin-script version has one face, and the Japanese, Korean and Traditional Chinese ones put
    // Inter first in their own face stacks (film-<lang>.css) and show the English UI, so K.ZH passes their text through
    K.ZH = (s) => K.uiEn ? s : s.replace(/[A-Za-z][A-Za-z0-9+#.\-]*(?: (?:\+|[A-Za-z][A-Za-z0-9+#.\-]*))*/g, (m) => `<span class="en">${m}</span>`);
    K.NB = (s) => `<span class="nb">${s}</span>`;                     // the blue: only what NocoBase provides
    // illustrated avatars (DiceBear Notionists, CC0; tools/avatars.mjs writes src/avatars.js); each copy gets its own ids.
    // A language version renames the cast but keeps each person's drawing: NBFilm({ T, avatars: { 'Emily Carter': '何静' } })
    let avN = 0;
    K.avatarOf = opts.avatars || {};
    K.avatar = (name, ch) => {
      const svg = AV[K.avatarOf[name] || name]; if (!svg) return `<i class="av">${ch || (name || '?')[0]}</i>`;
      const k = ++avN;
      return `<i class="av">${svg.replace(/id="([^"]+)"/g, `id="$1-${k}"`).replace(/url\(#([^)]+)\)/g, `url(#$1-${k})`).replace(/href="#([^"]+)"/g, `href="#$1-${k}"`)}</i>`;
    };
    // split a title into per-character spans (the title-card entrance animates them) — or, in a Latin-script version, into
    // per-word spans; K.split picks by the version's language
    const splitter = (unit) => (el) => {
      const walk = (node) => [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const c of unit(n.textContent)) {
            const s = document.createElement('span');
            if (c === ' ') { s.className = 'sp'; s.innerHTML = '&nbsp;'; } else { s.className = 'ch'; s.textContent = c; }
            frag.appendChild(s);
          }
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
      walk(el);
    };
    K.splitChars = splitter((t) => t);
    K.splitWords = splitter((t) => t.split(/( )/).filter(Boolean));
    K.split = (el) => (K.byWord ? K.splitWords : K.splitChars)(el);

    // ---------------------------------------------------------------- logs read by the score, the mixer and the renderer
    K.cue = (k, at, data) => LOG.push(Object.assign({ t: Math.round(at * 1000), type: 'cue', k }, data || {}));   // music
    K.sfx = (k, at, data) => LOG.push(Object.assign({ t: Math.round(at * 1000), type: 'sfx', k }, data || {}));   // effects: at = the action
    K.beat = (name, at) => LOG.push({ t: Math.round(at * 1000), type: 'beat', beat: ':' + name });                // section names in the dry run
    K.mb = (a, b) => D.mb.push([Math.round(a * 1000), Math.round(b * 1000)]);                                    // a motion-blur window

    // ---------------------------------------------------------------- timeline helpers
    K.show = (sel, at) => tl.set(sel, { autoAlpha: 1 }, at);
    K.hide = (sel, at) => tl.set(sel, { autoAlpha: 0 }, at);
    K.call = (fn, at) => tl.call(fn, null, at);
    K.cls = (sel, c, at) => K.call(() => $$(sel).forEach((e) => e.classList.add(c)), at);   // class switches are one-way: only play forward

    // ---------------------------------------------------------------- measuring (transform-free, so it can run before the timeline)
    K.box = (el, root) => {
      let x = 0, y = 0;
      for (let e = el; e && e !== root; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; if (e.offsetParent === null) break; }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
    };
    K.stageBox = (el) => { const r = el.getBoundingClientRect(), s = $('#stage').getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height, cx: r.left - s.left + r.width / 2, cy: r.top - s.top + r.height / 2 }; };
    // an element's stage position at the moment the call runs (elements inside 3D transforms can only be measured in place)
    K.stageBoxLater = (sel) => () => K.stageBox($(sel));

    // ---------------------------------------------------------------- camera
    // a camera shows its local point P at screen point S with zoom k: transform = translate(S − kP) scale(k), origin 0 0
    K.camV = (P, S, k) => ({ x: S[0] - k * P[0], y: S[1] - k * P[1], scale: k });
    K.ID = { x: 0, y: 0, scale: 1 };
    // the canvas grid follows a full-frame camera at 35 %: size 32·k', offset 0.35·t
    K.gridTo = (v, at, dur = 0, ease = 'power3.inOut') => {
      const k = 1 + 0.35 * (v.scale - 1), tx = 0.35 * v.x, ty = 0.35 * v.y;
      const g = { '--gs': (32 * k).toFixed(2) + 'px', '--gx': (16 * k + tx).toFixed(2) + 'px', '--gy': (5 * k + ty).toFixed(2) + 'px' };
      if (dur) tl.to('#grid', { ...g, duration: dur, ease }, at); else tl.set('#grid', g, at);
    };
    K.camTo = (sel, v, at, dur, ease = 'power3.inOut', grid = true) => {
      if (dur) tl.to(sel, { ...v, duration: dur, ease }, at); else tl.set(sel, v, at);
      if (grid) K.gridTo(v, at, dur, ease);
    };

    // ---------------------------------------------------------------- the canvas, the chapter marker, the black
    K.canvasHTML = () => `<div id="grid"></div><div class="glow" id="glowTop"></div><div id="glowAmb"></div><div id="glowAmbN"></div><div class="glow" id="glowBlue"></div><div class="glow" id="glowEnd"></div><div id="vignette"></div><div id="grain"></div>`;
    // the ambient light: 'nb' (the faint NocoBase blue, the default) or 'neutral' (a cool grey of the same depth, for the
    // act that shows today's way before NocoBase appears). Set it at 0; cross to 'nb' as the brick lands (1.6 s)
    K.ambient = (kind, at, dur = 1.6) => {
      const a = { opacity: kind === 'neutral' ? 0 : 1 }, b = { opacity: kind === 'neutral' ? 1 : 0 };
      if (dur) { tl.to('#glowAmb', { ...a, duration: dur, ease: 'sine.inOut' }, at); tl.to('#glowAmbN', { ...b, duration: dur, ease: 'sine.inOut' }, at); }
      else { tl.set('#glowAmb', a, at); tl.set('#glowAmbN', b, at); }
    };
    K.blackHTML = () => `<div id="black"></div>`;
    // top-left marker: "01 — 单独使用 Coding Agent", then (nb) the blue "02 — ▣ AI + NocoBase"
    K.modeHTML = (no, text) => `<div id="mode"><span class="no" id="modeNo">${no}</span><i></i><span id="modeMk">${LOGO.markStatic(16)}</span><span id="modeText">${text}</span></div>`;
    K.setMode = (at, no, text, nb) => K.call(() => { $('#mode').classList.toggle('nb', !!nb); $('#modeNo').textContent = no; $('#modeText').innerHTML = text; }, at);
    // the opening question: a title card whose grey line is the 01 chip's own text. The line sits under the question, rises
    // with it (`up`, before the first shot comes in under it) and at `dock` shrinks into the corner as "01 — …", while the
    // question goes. It is the move K.lockToChip makes into "02", so the viewer has seen what the corner names before it
    // changes. Build: K.modeHTML('01', …) and K.tcard(id, question, 343); call this before any other use of #mode.
    //   K.openQuestion('tAsk', { at: 0.25, up: 1.6, dock: 3.8 })       // sub: the grey line (default at + 0.5); rise: −247 px
    K.openQuestion = (id, o) => {
      const q = '#' + id, mt = $('#modeText'), top = parseFloat($(q).style.top) || 343, rise = o.rise ?? -247, sub = o.sub ?? o.at + 0.5;
      gsap.set(mt, { fontSize: 22, color: '#71717a' });
      const b = K.box(mt, $('#stage')), d = { x: W / 2 - b.w / 2 - b.x, y: top + 52 * 1.3 + 12 - b.y };
      gsap.set('#mode .no, #mode > i', { opacity: 0 });
      K.show('#mode', sub - 0.01);
      K.tcardIn(q, o.at);
      tl.fromTo(mt, { opacity: 0, x: d.x, y: d.y + 10 }, { opacity: 1, y: d.y, duration: 0.7, ease: 'expo.out' }, sub);
      if (o.up != null) {
        tl.to(q, { y: rise, duration: 0.75, ease: 'power3.inOut' }, o.up);
        tl.to(mt, { y: d.y + rise, duration: 0.75, ease: 'power3.inOut' }, o.up);
      }
      K.tcardOut(q, o.dock);
      tl.to(mt, { x: 0, y: 0, fontSize: 18, color: '#52525b', duration: 0.8, ease: 'power3.inOut' }, o.dock + 0.05);
      tl.fromTo('#mode .no, #mode > i', { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.45, ease: 'expo.out', stagger: 0.06 }, o.dock + 0.55);
    };
    // the brand lockup (L: what K.logoLand returned) shrinks into the corner and "02 — ▣ AI + NocoBase" takes over: its left
    // edge onto the chip's mark, as wide as mark and text. Hide #mode with the first act's last scene, before the brand.
    K.lockToChip = (id, L, at, o = {}) => {
      const s = '#' + id, m = $('#mode'), t = $('#modeText'), text = o.text ?? K.ZH('AI + NocoBase'), keep = [t.innerHTML, t.style.fontSize, m.className];
      t.style.fontSize = ''; m.classList.add('nb'); t.innerHTML = text;   // measure the chip as it will be
      const mk = K.box($('#modeMk'), $('#stage')), tx = K.box(t, $('#stage'));
      [t.innerHTML, t.style.fontSize, m.className] = keep;
      const lx = L.ai ? L.ai[0] : L.mk[0], ly = L.wd[1] + L.cap / 2;
      tl.to(s, { scale: (tx.x + tx.w - mk.x) / L.W, x: mk.x - lx, y: mk.cy - ly, transformOrigin: `${lx}px ${ly}px`, duration: 0.5, ease: 'power3.inOut' }, at);
      tl.to(s, { autoAlpha: 0, duration: 0.2 }, at + 0.32);
      K.mb(at, at + 0.5);
      if (o.sound !== false) K.sfx('whoosh', at, { i: o.i ?? 0, g: -10 });
      K.setMode(at + 0.3, o.no ?? '02', text, true);
      tl.fromTo('#mode', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, at + 0.32);
    };

    // ---------------------------------------------------------------- type
    // a title card: one line in the version's language (52 px / 600), centred; blue only for NocoBase's part (wrap it in K.NB)
    K.tcard = (id, zh, top) => `<div class="tcard" id="${id}" style="top:${top}px"><div class="t-zh">${zh}</div></div>`;
    K.tcardIn = (sel, at, o = {}) => {
      K.show(sel, at);
      tl.fromTo($$(sel + ' .t-zh .ch, ' + sel + ' .t-zh .sp'), { yPercent: 45, opacity: 0, filter: 'blur(8px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out', stagger: K.stag(o.stagger ?? 0.035) }, at);
    };
    K.tcardOut = (sel, at) => {
      tl.to($$(sel + ' .ch, ' + sel + ' .sp'), { yPercent: -30, opacity: 0, filter: 'blur(10px)', duration: 0.45, ease: 'power2.in', stagger: K.stag(0.006) }, at);
      K.hide(sel, at + 0.6);
    };
    // a feature title: blue index, the title (40 px / 600), the grey line under it (20 px) — stacked …
    K.ftl = (id, idx, zhT, zhL) => `<div class="ftl" id="${id}"><div class="fi">${idx}</div><div class="fzh">${K.ZH(zhT)}</div><div class="fln">${K.ZH(zhL)}</div></div>`;
    // … or as a header: index and title on one line, the grey line under them (cls 'hubT' top-left, 'ftl ctr' centred)
    K.ftlH = (id, idx, zhT, zhL, cls = 'hubT') => `<div class="${cls}" id="${id}"><div class="r1"><span class="fi">${idx}</span><span class="fzh">${K.ZH(zhT)}</span></div>` +
      `<div class="r2"><span class="fln">${K.ZH(zhL)}</span></div></div>`;
    K.ftlIn = (sel, at) => {
      K.show(sel, at);
      tl.fromTo($$(sel + ' .fi'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, at);
      tl.fromTo($$(sel + ' .fzh'), { autoAlpha: 0, y: 16, filter: 'blur(6px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out' }, at + 0.08);
      tl.fromTo($$(sel + ' .fln, ' + sel + ' .r2 > *'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, at + 0.3);
    };
    K.ftlOut = (sel, at) => { tl.to(sel, { autoAlpha: 0, y: -12, duration: 0.35, ease: 'power2.in' }, at); tl.set(sel, { y: 0 }, at + 0.36); };
    // typing into a text node, one character per `per` seconds
    K.typeOn = (el, text, at, per) => {
      const o = { n: 0 };
      tl.to(o, { n: text.length, duration: text.length * per, ease: 'none', onUpdate: () => { el.textContent = text.slice(0, Math.round(o.n)); } }, at);
    };
    // a number counting up in an element (b), formatted with thousands separators
    K.countTo = (el, from, to, at, dur, fmt = K.fmt) => {
      const o = { v: from };
      tl.to(o, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v); } }, at);
    };

    // ---------------------------------------------------------------- chapter words (Build / Run: the only English, in every language)
    K.chapHTML = (id, word, zh) => `<div class="chap" id="${id}"><div class="cword">${[...word].map((c) => `<span class="lt">${c}</span>`).join('')}</div>` +
      `<i class="cbase"></i><div class="czh">${zh}</div></div>`;
    // a blue base line draws, then the letters drop onto it one by one; the last one lands on `land` (put it on a bar line)
    K.chapterIn = (id, land, o = {}) => {
      const c = '#' + id, word = $(c + ' .cword'), lts = $$(c + ' .lt'), n = lts.length;
      const probe = document.createElement('i'); probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      word.appendChild(probe); const baseY = word.offsetTop + probe.offsetTop; probe.remove();
      const w = lts.reduce((s, e) => s + e.offsetWidth, 0) + 80;
      gsap.set(c + ' .cbase', { width: w, left: W / 2 - w / 2, top: baseY + 18, scaleX: 0 });
      gsap.set(c + ' .czh', { top: baseY + 70 });
      K.show(c, land - 0.7);
      tl.to(c + ' .cbase', { scaleX: 1, duration: 0.38, ease: 'power3.out' }, land - 0.62);
      lts.forEach((e, i) => {
        const L = land - (n - 1 - i) * 0.055;
        tl.fromTo(e, { y: -150, opacity: 0 }, { y: 0, duration: 0.2, ease: 'power2.in' }, L - 0.2);
        tl.to(e, { opacity: 1, duration: 0.05 }, L - 0.2);
      });
      K.mb(land - 0.2 - (n - 1) * 0.055, land + 0.03);
      if (o.impact !== false) K.sfx('impact', land, { i: o.i ?? 0 });
      tl.fromTo($$(c + ' .czh .ch, ' + c + ' .czh .sp'), { yPercent: 45, opacity: 0, filter: 'blur(8px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out', stagger: K.stag(0.03) }, land + 0.22);
    };
    // rack focus off the word: it blurs away, the scene behind (`z`, set blurred) comes into focus, the Chinese line rises
    // to the top and stays as the headline. Hold the word ≥ 2.5 s after it lands before racking (pacing.md).
    K.rack = (id, at, z) => {
      const c = '#' + id;
      tl.to([c + ' .cword', c + ' .cbase'], { filter: 'blur(14px)', autoAlpha: 0, duration: 0.9, ease: 'power2.inOut' }, at);
      tl.to(z, { filter: 'blur(0px)', autoAlpha: 1, duration: 1.0, ease: 'power2.inOut' }, at + 0.08);
      tl.set(z, { filter: 'none' }, at + 1.12);
      const zt = parseFloat($(c + ' .czh').style.top) || 0;
      tl.to(c + ' .czh', { y: 64 - zt, duration: 1.1, ease: 'power3.inOut' }, at);
    };

    // ---------------------------------------------------------------- the logo: lockup "AI + ▣ NocoBase" (official geometry, src/logo.js)
    K.lockHTML = (id, h, ai = true) => {
      const cap = h / LOGO.lockup.markToCap, fs = (cap / 0.727).toFixed(1);
      return `<div class="lockup" id="${id}" data-h="${h}" data-cap="${cap.toFixed(2)}">` +
        (ai ? `<span class="lai en" style="font-size:${fs}px">AI</span><span class="lplus en" style="font-size:${fs}px">+</span>` : '') +
        `<span class="lmk">${LOGO.mark(h)}</span><span class="lwd"><span class="lwi">${LOGO.word(cap)}</span></span></div>`;
    };
    // lay the lockup out, centred on (cx, capTop) — [AI][+][mark][wordmark] in the official horizontal proportions
    K.layLockup = (id, cx, capTop) => {
      const el = $('#' + id), h = +el.dataset.h, cap = +el.dataset.cap;
      const ai = $('.lai', el), pl = $('.lplus', el), mk = $('.lmk', el), wd = $('.lwd', el);
      const wAi = ai ? ai.offsetWidth : 0, wPl = pl ? pl.offsetWidth : 0, wMk = mk.offsetWidth, wWd = wd.offsetWidth;
      const g1 = ai ? cap * 0.34 : 0, g2 = ai ? cap * 0.46 : 0, g3 = cap * LOGO.lockup.gap;
      const Wl = wAi + g1 + wPl + g2 + wMk + g3 + wWd, x0 = cx - Wl / 2;
      const fs = ai ? parseFloat(ai.style.fontSize) : 0, base = capTop + cap;
      const tTop = base - fs * 0.866;  // Inter: cap height 0.727 em, baseline at 0.8 em in a 1-em line box
      const mTop = capTop - cap * LOGO.lockup.markTopAboveCap;
      const pos = { ai: [x0, tTop], pl: [x0 + wAi + g1, tTop], mk: [x0 + wAi + g1 + wPl + g2, mTop], wd: [x0 + wAi + g1 + wPl + g2 + wMk + g3, capTop] };
      [[ai, pos.ai], [pl, pos.pl], [mk, pos.mk], [wd, pos.wd]].forEach(([e, p]) => { if (e) { e.style.left = p[0].toFixed(1) + 'px'; e.style.top = p[1].toFixed(1) + 'px'; } });
      return { ...pos, wMk, W: Wl, h, cap };
    };
    // the brick lands on the base. Two layers fall and land, then both are swapped for the official compound path (.mo),
    // whose faces are holes. mode 'reveal' (the brand moment): base, brick, then the wordmark wipes out and "AI +" joins;
    // mode 'whole' (the end card): base, wordmark and "AI +" fade in first, then the brick lands.
    K.logoLand = (id, o) => {
      const s = '#' + id, land = o.land, mode = o.mode || 'reveal', drop = o.drop ?? 72, fall = o.fall ?? 0.22;
      const baseAt = o.base ?? land - 0.45, baseDur = o.baseDur ?? 0.35;
      // v11's end card: a base fade still running at the swap paints the solid base back over the brick
      if (baseAt + baseDur > land - 0.05) throw new Error(`logoLand(${id}): the base fade must finish before the landing (${(baseAt + baseDur).toFixed(2)} > ${(land - 0.05).toFixed(2)})`);
      const L = K.layLockup(id, o.cx ?? W / 2, o.capTop);
      tl.fromTo(s + ' .mb', { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: baseDur, ease: 'power2.out' }, baseAt);
      if (mode === 'reveal') {
        const dx = (o.cx ?? W / 2) - (L.mk[0] + L.wMk / 2);  // the mark starts centred alone, the lockup slides into place
        gsap.set(`${s} .lmk, ${s} .lwd`, { x: dx });
        gsap.set(s + ' .lwi', { clipPath: 'inset(0% 100% 0% 0%)' });
        gsap.set(`${s} .lai, ${s} .lplus`, { autoAlpha: 0 });
        const wipe = o.wipe ?? land + 0.15, ai = o.ai ?? land + 0.6;
        tl.to(`${s} .lmk, ${s} .lwd`, { x: 0, duration: 0.7, ease: 'power3.inOut' }, wipe);
        tl.to(s + ' .lwi', { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power3.inOut' }, wipe);
        tl.fromTo(`${s} .lai, ${s} .lplus`, { autoAlpha: 0, x: 18, filter: 'blur(6px)' }, { autoAlpha: 1, x: 0, filter: 'blur(0px)', duration: 0.6, ease: 'expo.out', stagger: 0.08 }, ai);
      } else {
        tl.fromTo(`${s} .lwd, ${s} .lai, ${s} .lplus`, { opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out' }, o.words ?? baseAt + 0.1);
      }
      tl.fromTo(s + ' .mk', { y: -drop }, { y: 0, duration: fall, ease: 'power2.in' }, land - fall);
      tl.fromTo(s + ' .mk', { opacity: 0 }, { opacity: 1, duration: 0.06 }, land - fall);
      K.mb(land - fall - 0.02, land + 0.03);
      tl.set(`${s} .mb, ${s} .mk`, { opacity: 0 }, land + 0.02); tl.set(s + ' .mo', { opacity: 1 }, land + 0.02);
      if (o.sound !== false) { K.sfx('impact', land, { i: o.i ?? 0 }); K.sfx('clack', land, { i: o.i ?? 0 }); }
      return L;
    };

    // ---------------------------------------------------------------- UI atoms (NocoBase 3 · shadcn: neutral zinc, black primary, pale pills)
    const ST = { run: ['s-run', '运行中'], upd: ['s-upd', '更新中'], stop: ['s-stop', '已停止'], ok: ['s-run', '成功'] };
    K.pillS = (id, k, text) => `<span class="stt ${(ST[k] || ST.run)[0]}"${id ? ` id="${id}"` : ''}><i></i><em>${text || (ST[k] || ST.run)[1]}</em></span>`;
    K.setPill = (id, k, text) => { const e = $('#' + id); e.className = 'stt ' + (ST[k] || ST.run)[0]; e.querySelector('em').textContent = text || (ST[k] || ST.run)[1]; };
    K.btnO = (icon, text, id) => `<span class="bo"${id ? ` id="${id}"` : ''}>${icon ? K.ic(icon) : ''}${text}</span>`;   // outline
    K.btnD = (icon, text, id) => `<span class="bo dk"${id ? ` id="${id}"` : ''}>${icon ? K.ic(icon) : ''}${text}</span>`; // black primary
    // an agent at work: a pill naming who acts and what it is doing, then 工作中 (blue dot with a soft ring) or 已完成 (green
    // dot). Only agents get one; people act through the cursor. o.cls 'tr' parks it at the top right, level with K.ftlH;
    // o.labels replaces the two state words for a language version (default: Chinese, or Working / Done for word-split ones).
    K.agentChip = (id, o = {}) => {
      const lb = o.labels || (K.byWord ? ['Working', 'Done'] : ['工作中', '已完成']);
      return `<div class="agchip${o.cls ? ' ' + o.cls : ''}" id="${id}" data-run="${lb[0]}" data-done="${lb[1]}"><i class="dot"></i>${K.ic(o.icon || 'sparkles')}<b></b><em></em></div>`;
    };
    // what the chip says from at on: K.agentAs('agt', '调度 Agent', '分派 3 个任务', 'run', 62.0) … ('done', 66.5)
    K.agentAs = (id, name, what, state, at) => K.call(() => {
      const e = $('#' + id), done = state === 'done';
      e.querySelector('b').textContent = name;
      e.querySelector('em').textContent = what + ' · ' + e.dataset[done ? 'done' : 'run'];
      e.classList.toggle('run', !done);
    }, at);
    // a request from a person: { name, role, av, msg } — full names, a role, one short sentence
    K.bubHTML = (p, id, cls = '') => `<div class="bub ${cls}"${id ? ` id="${id}"` : ''}>${K.avatar(p.name, p.av)}<div><div class="who">${K.ZH(p.role)} · ${p.name}</div>` +
      `<div class="tx">${K.ZH(p.msg)}</div></div><div class="ok">${K.ic('check')}</div></div>`;
    K.cursorSVG = (id) => `<svg class="cursor" id="${id}" viewBox="0 0 24 24"><path d="M5 3l14 9.5-6.2 1.3L9.6 20z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
    // the cursor tip lands on the centre of the target (both in the same positioned panel), then presses at at + dur
    // where the tip lands: a button's centre; or, with { edge: true }, just inside the target's lower edge, so the arrow's
    // body sits on the background below — clear of the label, and still visible when a dark selection slides in under it
    const tipOn = (cur, target, o) => { const b = K.box($(target), $(cur).parentElement); return o.edge ? { x: b.cx - 4.6, y: b.y + b.h - 4 - 2.75 } : { x: b.cx - 4.2 - 6, y: b.cy - 2.3 + 1 }; };
    const press = (cur, t) => tl.to(cur, { scale: 0.86, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.inOut', transformOrigin: '20% 12%' }, t);
    K.cursorTo = (cur, target, at, dur = 0.75, o = {}) => {
      const p = tipOn(cur, target, o);
      tl.fromTo(cur, { autoAlpha: 0, x: p.x - 190, y: p.y + 150 }, { autoAlpha: 1, x: p.x, y: p.y, duration: dur, ease: 'power3.inOut' }, at);
      press(cur, at + dur + 0.02);
      return at + dur + 0.02;  // the click
    };
    // a cursor already on screen glides on to the next target and clicks it (a user clicking through a switcher)
    K.cursorMove = (cur, target, at, dur = 0.75, o = {}) => {
      tl.to(cur, { ...tipOn(cur, target, o), duration: dur, ease: 'power3.inOut' }, at);
      press(cur, at + dur + 0.02);
      return at + dur + 0.02;
    };
    // a check mark pops in — the only place the house motion allows a bounce (motion-and-camera.md)
    K.tick = (sel, at) => tl.fromTo(sel, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, at);
    // a pale ring for a moment on whatever changed state, so the eye finds it among its neighbours
    K.ring = (sel, t, rgb = '59,130,246') => {
      tl.fromTo(sel, { boxShadow: `0 0 0 0px rgba(${rgb},0)` }, { boxShadow: `0 0 0 4px rgba(${rgb},.16)`, duration: 0.3, ease: 'power2.out' }, t);
      tl.to(sel, { boxShadow: `0 0 0 0px rgba(${rgb},0)`, duration: 0.6, ease: 'power2.inOut' }, t + 1.3);
    };

    // ---------------------------------------------------------------- CSS 3D (the maps)
    // a box: front width --w, depth --d, height --h; top face and front face take content
    K.blk = (id, cls, style, front, top = '') => `<div class="blk ${cls}" id="${id}" style="${style}"><div class="tp">${top}</div><div class="fr">${front}</div><div class="rs"></div><div class="ls"></div></div>`;
    K.faces = (id) => `#${id} .tp, #${id} .fr, #${id} .rs, #${id} .ls`;
    // pull one layer out of a stack: the others move apart (±z), darken and go soft; Zs holds each layer's rest z
    K.focus = (Zs, [target, dz], others, at, shade = 0.72, vanish = false) => {
      if (dz) tl.to('#' + target, { z: Zs[target] + dz, duration: 0.9, ease: 'power3.inOut' }, at);
      others.forEach(([id, d]) => {
        tl.to('#' + id, { z: Zs[id] + d, duration: 0.9, ease: 'power3.inOut' }, at);
        tl.to(`#${id} .shade`, { opacity: shade, duration: 0.7, ease: 'power2.out' }, at + 0.05);
        tl.to(K.faces(id), { filter: 'blur(3px)', duration: 0.7, ease: 'power2.out' }, at + 0.05);
        if (vanish) tl.to(K.faces(id), { opacity: 0, duration: 0.6, ease: 'power2.out' }, at + 0.2);
      });
    };

    // ---------------------------------------------------------------- run
    K.run = (build, film) => {
      document.documentElement.style.setProperty('--stage-w', W + 'px'); document.documentElement.style.setProperty('--stage-h', H + 'px');
      build();
      if (window.lucide) lucide.createIcons();
      $$('.tcard .t-zh, .chap .czh, .split').forEach(K.split);
      D.frame = () => {
        const t = C.vt / 1000;
        tl.seek(Math.min(t, T.done), false);
        if (t >= T.done && !D.done) { D.done = true; LOG.push({ t: Math.round(C.vt), type: 'done' }); }
        return { x: 0, y: 0, w: W, h: H, scale: 4 / 3, t: C.vt, done: D.done };
      };
      D.start = () => { film(); tl.set({}, {}, T.done); tl.seek(0, false); };
      // back to 0 in place (the review cut's backward seek): one-way class switches only play forward, so the stage is rebuilt
      // and the timeline laid again; the page, its audio and the viewer's click that allowed sound all stay
      D.rewind = () => {
        tl.clear(); LOG.length = 0; D.mb.length = 0; D.done = false;
        C.timers.clear(); C.rafs.clear(); C.vt = 0;
        build();
        if (window.lucide) lucide.createIcons();
        $$('.tcard .t-zh, .chap .czh, .split').forEach(K.split);
        D.start(); D.frame();
      };
      if (/[?&]play\b/.test(location.search)) window.addEventListener('load', () => document.fonts.ready.then(() => { C.play(); D.start(); window.__onFrame = () => D.frame(); }));
      // the review cut: preview.html (window.__PREVIEW), or film.html?preview
      if (window.__PREVIEW || /[?&]preview\b/.test(location.search)) window.addEventListener('load', () => document.fonts.ready.then(() => K.preview()));
    };

    // ---------------------------------------------------------------- the HTML review cut (preview.html, or film.html?preview)
    // The film plays in the browser at real time on the stage scaled to the window, with a bar: play / pause, a scrubber
    // marked with the film's sections (K.beat), a jump list, speed. Seeking forward advances the clock; seeking back rebuilds
    // the stage in place from 0 and fast-forwards (one-way class switches only play forward), so the sound keeps playing.
    // Keys: space play/pause · ← → 1 s (shift 5 s) · [ ] previous / next section · 0 the start.
    K.preview = () => {
      const N = C.native, q = new URLSearchParams(location.hash.slice(1));
      const css = document.createElement('style');
      css.textContent = `html.pv, html.pv body { width: 100%; height: 100%; background: #111113; cursor: auto; overflow: hidden; }
        html.pv #stage { position: absolute; transform-origin: 0 0; box-shadow: 0 0 0 1px #27272a; }
        #pvBar { position: fixed; left: 0; right: 0; bottom: 0; padding: 10px 16px 12px; background: #18181b; color: #e4e4e7; font: 500 13px/1 Inter, 'PingFang SC', sans-serif; display: grid; gap: 8px; user-select: none; z-index: 99; }
        #pvBar .r { display: flex; align-items: center; gap: 10px; }
        #pvBar button, #pvBar select { background: #27272a; color: #f4f4f5; border: 1px solid #3f3f46; border-radius: 6px; height: 28px; padding: 0 10px; font: inherit; cursor: pointer; }
        #pvBar button.on { background: #1677ff; border-color: #1677ff; }
        #pvBar .tm { font: 500 13px/1 'JetBrains Mono', monospace; min-width: 120px; color: #a1a1aa; } #pvBar .tm b { color: #fafafa; font-weight: 600; }
        #pvTrack { position: relative; height: 26px; cursor: pointer; }
        #pvTrack .rail { position: absolute; left: 0; right: 0; top: 11px; height: 4px; border-radius: 2px; background: #3f3f46; }
        #pvTrack .fill { position: absolute; left: 0; top: 11px; height: 4px; border-radius: 2px; background: #1677ff; }
        #pvTrack .mk { position: absolute; top: 4px; width: 1px; height: 18px; background: #71717a; }
        #pvTrack .head { position: absolute; top: 5px; width: 12px; height: 16px; margin-left: -6px; border-radius: 3px; background: #fafafa; }
        #pvSecs { display: flex; flex-wrap: wrap; gap: 6px; } #pvSecs button { height: 24px; padding: 0 8px; font-size: 12px; color: #d4d4d8; }
        #pvSecs button.cur { background: #3f3f46; color: #fff; }`;
      document.head.appendChild(css);
      document.documentElement.classList.add('pv');
      C.freeze(); D.start(); D.frame();  // the timeline first: it logs the sections (K.beat) the bar lists
      const secs = LOG.filter((e) => e.type === 'beat').map((e) => ({ t: e.t / 1000, n: e.beat.slice(1) }))
        .sort((a, b) => a.t - b.t).filter((e, i, a) => !i || e.n !== a[i - 1].n);
      const bar = document.createElement('div'); bar.id = 'pvBar';
      bar.innerHTML = `<div class="r"><button id="pvPlay">▶ 播放</button><span class="tm"><b id="pvT">0.0</b> / ${T.done.toFixed(1)} s</span>
        <button id="pvSnd">声音</button><select id="pvRate"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select>
        <span style="color:#71717a">空格 播放/暂停 · ← → 1 秒 · [ ] 上一段/下一段</span></div>
        <div id="pvTrack"><i class="rail"></i><i class="fill" id="pvFill"></i>${secs.map((s) => `<i class="mk" style="left:${(s.t / T.done * 100).toFixed(3)}%" title="${s.n} ${s.t.toFixed(1)}"></i>`).join('')}<i class="head" id="pvHead"></i></div>
        <div id="pvSecs">${secs.map((s, i) => `<button data-i="${i}">${s.n} · ${s.t.toFixed(1)}</button>`).join('')}</div>`;
      document.body.appendChild(bar);
      const st = $('#stage');
      const fit = () => {
        const bh = bar.offsetHeight, k = Math.min((innerWidth - 32) / W, (innerHeight - bh - 32) / H);
        st.style.transform = `scale(${k})`; st.style.left = ((innerWidth - W * k) / 2) + 'px'; st.style.top = Math.max(16, (innerHeight - bh - H * k) / 2) + 'px';
      };
      addEventListener('resize', fit);
      let playing = false, last = 0, rate = 1;
      const now = () => C.vt / 1000;
      // the soundtrack: the score and the effects as make.sh mixes them (AUDIO_ONLY=1 ./make.sh → out/film/preview.m4a, at the
      // film's loudness), or ?audio=<path>. Over http (./preview.sh) the track is fetched whole and decoded into memory (Web
      // Audio): it seeks to the sample with no range requests (python http.server answers none), and it starts the moment the
      // play click resumes the audio context, which Safari and Chrome both require of a user gesture. While it plays, its
      // clock leads the picture. Opened as a file (file://), where fetch is refused, an <audio> element plays it instead.
      const aSrc = new URLSearchParams(location.search).get('audio') || window.__AUDIO || 'out/film/preview.m4a';
      const AC = window.AudioContext || window.webkitAudioContext;
      const A = window.__pvAudio = { mode: 'wa', state: 'loading', muted: false, ctx: null, gain: null, buf: null, node: null, t0: 0, off: 0, el: null };
      const fail = (st) => { A.state = st; ui(); };
      const param = new URLSearchParams(location.search).get('audio');
      if (window.__AUDIO_B64 && AC && !param) {
        // the soundtrack loaded as a script (out/film/preview-audio.js): decoded straight into memory, over http or as a file
        A.ctx = new AC(); A.gain = A.ctx.createGain(); A.gain.connect(A.ctx.destination);
        const bin = atob(window.__AUDIO_B64), u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        new Promise((ok, no) => A.ctx.decodeAudioData(u8.buffer, ok, no))
          .then((buf) => { A.buf = buf; A.state = 'ready'; ui(); if (playing) auPlay(); })
          .catch(() => fail('error'));
      } else if (location.protocol === 'file:' || !AC) {
        A.mode = 'el'; A.el = new Audio(); A.el.preload = 'auto'; A.el.src = aSrc;
        A.el.addEventListener('loadeddata', () => { A.state = 'ready'; ui(); });
        A.el.addEventListener('error', () => fail(location.protocol === 'file:' ? 'file' : 'none'));
      } else {
        A.ctx = new AC(); A.gain = A.ctx.createGain(); A.gain.connect(A.ctx.destination);   // made now, suspended until a click
        fetch(aSrc + (aSrc.includes('?') ? '&' : '?') + 'v=' + (window.__v || Date.now()))   // a rebuilt soundtrack, not the cached one
          .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status === 404 ? 'none' : 'error')))
          .then((b) => new Promise((ok, no) => A.ctx.decodeAudioData(b, ok, no)))
          .then((buf) => { A.buf = buf; A.state = 'ready'; ui(); if (playing) auPlay(); })
          .catch((e) => fail(e === 'none' ? 'none' : 'error'));
      }
      // any click or key on the page wakes the audio context (a browser starts it suspended until the user acts)
      const unlock = () => { if (A.ctx && A.ctx.state !== 'running') A.ctx.resume(); };
      addEventListener('pointerdown', unlock, true); addEventListener('keydown', unlock, true);
      const auStop = () => {
        if (A.node) { try { A.node.stop(); } catch (e) {} A.node.disconnect(); A.node = null; }
        if (A.el) A.el.pause();
      };
      // the track from the picture's time: on play, on a seek while playing, on a speed change, when it drifts
      const auPlay = () => {
        auStop();
        if (!playing || A.state !== 'ready') return;
        const t = now();
        if (A.mode === 'wa') {
          unlock();
          if (t >= A.buf.duration) return;
          const n = A.node = A.ctx.createBufferSource();
          n.buffer = A.buf; n.playbackRate.value = rate; n.connect(A.gain);
          A.off = t; A.t0 = A.ctx.currentTime; n.start(0, t);
        } else {
          A.el.currentTime = t; A.el.playbackRate = rate; A.el.muted = A.muted;
          A.el.play().catch(() => fail('blocked'));
        }
      };
      // where the track is (seconds), or null while it is not sounding
      const auTime = () => {
        if (A.node && A.ctx.state === 'running') return A.off + (A.ctx.currentTime - A.t0) * rate;
        if (A.el && !A.el.paused && !A.el.seeking && A.el.readyState >= 3) return A.el.currentTime;
        return null;
      };
      const SND = { loading: '音轨加载中…', none: '这一版还没有音轨', error: '音轨无法播放', file: '这一版还没有音轨', blocked: '再点一次播放开启声音' };
      const ui = () => {
        const t = now(), p = Math.min(1, t / T.done) * 100;
        $('#pvT').textContent = t.toFixed(1); $('#pvFill').style.width = p + '%'; $('#pvHead').style.left = p + '%';
        let cur = -1; secs.forEach((s, i) => { if (t >= s.t - 1e-3) cur = i; });
        $$('#pvSecs button').forEach((b, i) => b.classList.toggle('cur', i === cur));
        $('#pvPlay').textContent = playing ? '❚❚ 暂停' : '▶ 播放'; $('#pvPlay').classList.toggle('on', playing);
        $('#pvSnd').textContent = A.state === 'ready' ? (A.muted ? '声音：关' : '声音：开') : SND[A.state];
        $('#pvSnd').disabled = A.state !== 'ready';
        $('#pvSnd').title = A.state === 'none' ? '画面定稿后运行 AUDIO_ONLY=1 ./make.sh 生成音轨' : '';
      };
      const ff = (t) => { const goal = Math.min(t, T.done) * 1000; while (C.vt < goal - 0.5) { C.advance(Math.min(50, goal - C.vt)); D.frame(); } };
      const seek = (t) => {
        t = Math.max(0, Math.min(T.done, t));
        if (t * 1000 < C.vt - 1) D.rewind();
        ff(t); if (playing) auPlay(); ui();
      };
      let resync = 0;
      const loop = (ts) => {
        if (playing) {
          const dt = Math.min(100, ts - last) * rate; last = ts;
          // with sound in step, the audio clock leads; otherwise (no track, still seeking, or out of step) real time, and a
          // track that drifted more than 0.4 s is put back at the picture's time
          let step = dt;
          const at = auTime();
          if (at != null) {
            const lead = at * 1000 - C.vt;
            if (Math.abs(lead) < 400) step = Math.max(0, Math.min(250, lead));
            else if (ts - resync > 1000) { resync = ts; auPlay(); }   // out of step: the track starts again at the picture's time
          }
          C.advance(step); D.frame();
          if (now() >= T.done) { playing = false; auStop(); }
          ui();
        }
        N.raf(loop);
      };
      const toggle = () => {
        unlock();
        if (!playing && now() >= T.done - 0.01) seek(0);   // at the end, play again from the start
        playing = !playing; last = N.perfNow();
        if (playing) auPlay(); else auStop();
        ui();
      };
      $('#pvPlay').onclick = toggle;
      $('#pvSnd').onclick = () => { A.muted = !A.muted; if (A.gain) A.gain.gain.value = A.muted ? 0 : 1; if (A.el) A.el.muted = A.muted; ui(); };
      $('#pvRate').onchange = (e) => { rate = +e.target.value; if (playing) auPlay(); };
      $('#pvSecs').onclick = (e) => { const b = e.target.closest('button'); if (b) seek(secs[+b.dataset.i].t); };
      const tr = $('#pvTrack'), at = (e) => { const r = tr.getBoundingClientRect(); return (e.clientX - r.left) / r.width * T.done; };
      tr.onmousedown = (e) => seek(at(e));
      addEventListener('keydown', (e) => {
        if (e.key === ' ') { e.preventDefault(); toggle(); }
        else if (e.key === 'ArrowRight') seek(now() + (e.shiftKey ? 5 : 1));
        else if (e.key === 'ArrowLeft') seek(now() - (e.shiftKey ? 5 : 1));
        else if (e.key === ']') { const s = secs.find((x) => x.t > now() + 0.05); if (s) seek(s.t); }
        else if (e.key === '[') { const s = [...secs].reverse().find((x) => x.t < now() - 0.6); seek(s ? s.t : 0); }
        else if (e.key === '0') seek(0);
      });
      if (q.get('r')) { rate = +q.get('r'); $('#pvRate').value = String(rate); }
      fit();
      if (q.get('t')) ff(+q.get('t'));
      ui(); N.raf(loop);
    };
    return K;
  };
})();
