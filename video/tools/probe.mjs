// Layout probe (references/review-and-delivery.md, languages.md): loads a film page on its virtual clock and, at each
// given time, lists every element whose content runs wider than its box (scrollWidth > clientWidth): a label pushed past
// its column, a title wider than its card, a table bursting its panel. Horizontal only: a line that wraps onto a second
// line still needs a still.
//   node tools/probe.mjs --page film-en.html --at 0,50000,112000
//   node tools/probe.mjs --page film-en.html --base film.html --at 0,50000   only what the base page does not have
// With --base, an element counts as new when the base page has no overflow at the same place (same element path), so
// the source version's deliberate crops (code lines under a mask, a clipped wall) drop out.
// --overlap also lists the blocks of each visible scene (its children; a wrapper that fills the frame is opened) that
// overlap or stand closer than --gap stage px (default 16), as drawn (transforms included): a bubble on a window, a title
// on a card. A bare text block (no fill, border or shadow) is measured by its words, not its box. Run it at the end of
// every push-in, where blocks have grown the most, and in the widest language.
// --blocks "<selectors>" measures just those elements, for a scene whose content sits inside a camera:
//   node tools/probe.mjs --page film-en.html --overlap --at 62500,69580
//   node tools/probe.mjs --page film-en.html --blocks "#ft2 .fzh, #ft2 .fln, #wfBub, #p2 .nd" --gap 40 --at 59500
// --type "<selectors>" lists the type sizes as drawn (stage px, transforms included) inside each given element — or each
// visible scene when no selector is given — weighted by characters, instead of the overflows. Every UI screen of a film
// reads at one scale: body 16.5–18 px, secondary lines 13.5–14 px (references/ui-on-screen.md).
//   node tools/probe.mjs --page film.html --type "#p1 .card, #p2 .wbox, #p3 .dwin, #hcon" --at 55000,63500,69000,104000
// --eval "<expression>" prints its value at each time (debugging: computed styles, boxes).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; };
const PAGE = opt('page', 'film.html'), BASE = opt('base', null), BLOCKS = opt('blocks', ''), GAP = Number(opt('gap', 16)), EVAL = opt('eval', '');
const OVERLAP = args.includes('--overlap') || !!BLOCKS;
const TYPE = args.includes('--type'), TYPESEL = TYPE && !String(opt('type', '--')).startsWith('--') ? opt('type', '') : '';
const AT = String(opt('at', '0')).split(',').map(Number).sort((a, b) => a - b);

const server = http.createServer((req, res) => {
  const p = path.join(DIR, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(DIR) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
  res.writeHead(200, { 'Content-Type': T[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const profile = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'nb-probe-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--hide-scrollbars', '--mute-audio', '--force-color-profile=srgb', '--window-size=1440,810',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((res, rej) => { let b = ''; chrome.stderr.on('data', (d) => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) res(m[1]); }); chrome.on('exit', (c) => rej(new Error('chrome exited ' + c))); });
const list = await (await fetch(`http://127.0.0.1:${new URL(wsUrl).port}/json/list`)).json();
const ws = new WebSocket(list.find((p) => p.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let seq = 0; const pending = new Map(), listeners = [];
ws.addEventListener('message', (ev) => { const d = JSON.parse(ev.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } else if (d.method) listeners.forEach((f) => f(d)); });
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const js = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
const done = () => { try { chrome.kill('SIGKILL'); } catch (e) {} server.close(); try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {} };

// the type sizes inside each root (TYPESEL, or each visible scene), in stage px as drawn, weighted by characters
const TYPESCAN = `(() => {
  const st = document.getElementById('stage'), sr = st.getBoundingClientRect(), k = sr.width / 1440, SEL = ${JSON.stringify(TYPESEL)};
  const shown = (e) => { for (let x = e; x && x !== st; x = x.parentElement) { const c = getComputedStyle(x); if (c.visibility === 'hidden' || c.display === 'none' || +c.opacity < 0.5) return false; } return true; };
  const roots = SEL ? [...document.querySelectorAll(SEL)] : [...document.querySelectorAll('#stage > .scene, #stage > section')];
  return roots.filter(shown).map((root) => {
    const h = {};
    root.querySelectorAll('*').forEach((el) => {
      const t = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (!t || !el.offsetWidth || !shown(el)) return;
      const r = el.getBoundingClientRect();
      if (r.right < sr.left || r.left > sr.right || r.bottom < sr.top || r.top > sr.bottom) return;
      const px = (parseFloat(getComputedStyle(el).fontSize) * r.width / el.offsetWidth / k).toFixed(1);
      (h[px] ||= { n: 0, ex: t.slice(0, 16) }).n += t.length;
    });
    const top = Object.entries(h).sort((a, b) => b[1].n - a[1].n).slice(0, 8);
    return (root.id ? '#' + root.id : root.className) + ': ' + top.map(([px, v]) => px + ' px ×' + v.n + ' “' + v.ex + '”').join(' · ');
  });
})()`;

// every overflowing element at time `at`: its path (ids, else tag and classes, four levels up) and its text
const SCAN = `(() => {
  const name = (e) => e.id ? '#' + e.id : e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).join('.') : '');
  const path = (e) => { const p = []; for (let x = e; x && x.id !== 'stage' && p.length < 4; x = x.parentElement) p.unshift(name(x)); return p.join(' > '); };
  const out = [];
  document.querySelectorAll('#stage *').forEach((el) => {
    // cameras, 3D rigs and scrolling strips are meant to be wider than the stage
    if (el.closest('svg') || el.matches('#grid, .cam, .hcam, .persp, .lockup, .lockup *, .wrow, .wrow *, .tscroll, #ring, #ring *')) return;
    if (getComputedStyle(el).display === 'none' || el.clientWidth === 0) return;
    const t = el.textContent.trim(); if (!t) return;  // containers too: a table can burst its panel
    const over = el.scrollWidth - el.clientWidth;
    if (over > 1) out.push({ path: path(el), over, text: t.replace(/\\s+/g, ' ').slice(0, 70) });
  });
  return out;
})()`;
// blocks that overlap or stand closer than GAP at time \`at\`: [{ key, gap, line }]
const NEAR = `(() => {
  const GAP = ${GAP}, SEL = ${JSON.stringify(BLOCKS)}, st = document.getElementById('stage').getBoundingClientRect(), k = st.width / (document.getElementById('stage').offsetWidth || st.width);
  const shown = (e) => { for (let x = e; x && x.id !== 'stage'; x = x.parentElement) { const c = getComputedStyle(x); if (c.visibility === 'hidden' || c.display === 'none' || +c.opacity < 0.05) return false; } return true; };
  const name = (e) => e.id ? '#' + e.id : e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).join('.') : '');
  const bare = (e) => { const c = getComputedStyle(e); return /rgba\\(0, 0, 0, 0\\)|transparent/.test(c.backgroundColor) && c.backgroundImage === 'none' && !parseFloat(c.borderLeftWidth) && !parseFloat(c.borderTopWidth) && c.boxShadow === 'none' && e.textContent.trim(); };
  const R = (e) => {
    let r = e.getBoundingClientRect();
    if (bare(e)) { const g = document.createRange(); g.selectNodeContents(e); r = g.getBoundingClientRect(); }
    return { l: (r.left - st.left) / k, t: (r.top - st.top) / k, r: (r.right - st.left) / k, b: (r.bottom - st.top) / k };
  };
  const W = document.getElementById('stage').offsetWidth, H = document.getElementById('stage').offsetHeight, big = (r) => (r.r - r.l) * (r.b - r.t) > 0.8 * W * H;
  const out = [];
  const pairs = (blocks, where) => {
    for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) {
      if (blocks[i].contains(blocks[j]) || blocks[j].contains(blocks[i])) continue;
      const a = R(blocks[i]), b = R(blocks[j]), gap = Math.max(b.l - a.r, a.l - b.r, b.t - a.b, a.t - b.b);
      const key = where + name(blocks[i]) + ' ↔ ' + name(blocks[j]);
      if (gap < GAP) out.push({ key, gap: Math.round(gap), line: (gap < 0 ? 'overlap ' + Math.round(-gap) : 'gap ' + Math.round(gap)) + 'px  ' + key });
    }
  };
  if (SEL) { pairs([...document.querySelectorAll(SEL)].filter((e) => shown(e) && e.getBoundingClientRect().width > 0), ''); return out; }
  document.querySelectorAll('#stage > .scene, #stage > section').forEach((sc) => {
    if (!shown(sc)) return;
    const blocks = [...sc.children].flatMap((e) => big(R(e)) ? [...e.children] : [e])  // open wrappers that fill the frame, one level
      .filter((e) => shown(e) && !e.matches('svg.cursor, .cursor, #grid, .cam, .persp') && e.getBoundingClientRect().width > 0 && !big(R(e)));  // a camera's box is not its content: measure inside it with --blocks
    pairs(blocks, sc.id + ': ');
  });
  return out;
})()`;

async function scan(page) {
  const loaded = new Promise((r) => listeners.push((d) => d.method === 'Page.loadEventFired' && r()));
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/${page}` });
  await loaded;
  await js(`(async () => {
    // every face the page declares, loaded before the first frame: Google Fonts splits a family by weight and script,
    // and a face that a later shot uses would otherwise still be on its way when that shot's frames are captured
    await document.fonts.ready;
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)));
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 300));
    return document.fonts.size;
  })()`);
  await js('__clock.freeze(); __director.start(); true');
  const res = []; let now = 0;
  for (const at of AT) {
    await js(`(() => { for (let t = ${now}; t < ${at}; t += 1000 / 60) { __clock.advance(1000 / 60); __director.frame(); } return 1; })()`);
    now = at; res.push({ over: await js(SCAN), near: OVERLAP ? await js(NEAR) : [], val: EVAL ? await js(EVAL) : undefined, type: TYPE ? await js(TYPESCAN) : [] });
  }
  return res;
}

try {
  await send('Page.enable'); await send('Runtime.enable');
  listeners.push((d) => { if (d.method === 'Runtime.exceptionThrown') console.error('[page exception]', d.params.exceptionDetails.exception?.description); });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 810, deviceScaleFactor: 1, mobile: false });
  const base = BASE ? await scan(BASE) : null;
  const res = await scan(PAGE);
  let total = 0;
  if (TYPE) res.forEach(({ type }, k) => { console.log(`t=${(AT[k] / 1000).toFixed(1)}s · type sizes (stage px, by characters)`); type.forEach((h) => console.log('  ' + h)); });
  else res.forEach(({ over, near, val }, k) => {
    let list = over, close = near;
    if (base) {
      const left = base[k].over.map((h) => h.path); list = over.filter((h) => { const i = left.indexOf(h.path); if (i < 0) return true; left.splice(i, 1); return false; });
      const keys = base[k].near.map((h) => h.key); close = near.filter((h) => !keys.includes(h.key));
    }
    total += list.length + close.length;
    console.log(`t=${(AT[k] / 1000).toFixed(1)}s · ${list.length} overflow${list.length === 1 ? '' : 's'}${OVERLAP ? ` · ${close.length} block${close.length === 1 ? '' : 's'} closer than ${GAP}px` : ''}${base ? ' not in ' + BASE : ''}`);
    list.forEach((h) => console.log(`  ${h.path}  +${h.over}px  “${h.text}”`));
    close.forEach((h) => console.log(`  ${h.line}`));
    if (EVAL) console.log('  eval: ' + JSON.stringify(val));
  });
  process.exitCode = total ? 1 : 0;
} finally { done(); }
process.exit(process.exitCode ?? 0);
