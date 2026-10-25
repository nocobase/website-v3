// Capture the NocoReach page's product figures (figs.html) in headless Chrome, both languages, at twice their size:
//   node _src/reach/shoot.mjs [figure ...]        (from html/; no names = every figure)
// Writes assets/reach/<figure>-<zh|en>.webp, lossless so the product's text stays sharp (PNG from Chrome, then cwebp).
// Needs Google Chrome (set CHROME for another binary) and cwebp (set CWEBP).
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(DIR, '../../assets/reach');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CWEBP = process.env.CWEBP || 'cwebp';
const ALL = ['insights', 'opportunities', 'review', 'replies', 'revise', 'playbook', 'tasks', 'results', 'aisearch', 'connect', 'health'];
const figs = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
fs.mkdirSync(OUT, { recursive: true });

const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'reach-figs-'));
const ch = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + prof, '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const ws0 = await new Promise((r) => { let b = ''; ch.stderr.on('data', (d) => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) r(m[1]); }); });
const list = await (await fetch(`http://127.0.0.1:${new URL(ws0).port}/json/list`)).json();
const ws = new WebSocket(list.find((p) => p.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let n = 0; const pend = new Map(), errs = [];
ws.addEventListener('message', (e) => { const d = JSON.parse(e.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); });
const send = (m, p = {}) => new Promise((r) => { const id = ++n; pend.set(id, r); ws.send(JSON.stringify({ id, method: m, params: p })); });
const js = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.value;
await send('Runtime.enable'); await send('Page.enable');
// a wide viewport, so the product's own breakpoints (sm … xl) apply as they do on a desktop
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 2000, deviceScaleFactor: 2, mobile: false });

for (const fig of figs) for (const lang of ['zh', 'en']) {
  await send('Page.navigate', { url: `file://${path.join(DIR, 'figs.html')}?fig=${fig}&lang=${lang}` });
  let ok = false;
  for (let k = 0; k < 40; k++) { await new Promise((r) => setTimeout(r, 250)); if (await js('document.documentElement.dataset.ready')) { ok = true; break; } }
  if (!ok) { console.log('not ready:', fig, lang); continue; }
  await new Promise((r) => setTimeout(r, 300));
  const b = await js(`(() => { const r = document.getElementById('shot').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 1 } });
  const png = path.join(prof, `${fig}-${lang}.png`), file = path.join(OUT, `${fig}-${lang}.webp`);
  fs.writeFileSync(png, Buffer.from(shot.data, 'base64'));
  execFileSync(CWEBP, ['-quiet', '-lossless', '-z', '6', png, '-o', file]);
  console.log('wrote', path.relative(process.cwd(), file), `${Math.round(b.w)}×${Math.round(b.h)}`, Math.round(fs.statSync(file).size / 1024) + ' KB');
}
if (errs.length) console.log('errors:', errs);
ch.kill('SIGKILL');
setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {} process.exit(0); }, 300);
