// Frame-accurate renderer (skill nocobase-video): headless Chrome + the page's virtual clock, frames piped into ffmpeg.
//   node render.mjs --dry                        simulate the film, write out/events.json (no frames)
//   node render.mjs --still 31000,42500          frames at t = 31 s and 42.5 s → out/still-31000.png …
//   node render.mjs [--fps 60] [--dsf 2] [--mb 4] [--from ms] [--to ms] [--out out/video.mp4]
//   --page film.html (default). The stage size comes from the page (NBFilm({ W, H }), default 1440×810); the output is
//   4/3 of it (1920×1080, 1080×1920, 1080×1080). Chrome: $CHROME, else the usual macOS / Linux install paths.
//   --mb 4   motion blur: inside the page's windows (__director.mb, ms) each frame averages 4 sub-frames over a 180°
//            shutter (t, t+DT/8, t+2DT/8, t+3DT/8); outside them one capture. --mb 1 turns it off. Stills take it too.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as png from './tools/png.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']
  .find((p) => fs.existsSync(p));
if (!CHROME) { console.error('Chrome not found: set CHROME=/path/to/chrome'); process.exit(1); }
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const FPS = Number(opt('fps', 60));
const DT = 1000 / FPS;
const MODE = opt('dry', false) ? 'dry' : opt('still', false) !== false ? 'still' : 'video';
// --dsf 2 renders at 2880×1620 and lets ffmpeg downsample to 1080p (cleaner edges, crisper type)
const DSF = Number(opt('dsf', 1));

// ---------- static server for the video folder ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(DIR, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(DIR) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

// ---------- Chrome + CDP ----------
const profile = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'nb3-chrome-'));
// the HTTP cache outlives the throwaway profile, so GSAP, lucide and the fonts load from disk once fetched: a slow or
// unreachable CDN then no longer stops a render
const cacheDir = path.join(process.env.TMPDIR || os.tmpdir(), 'nb3-chrome-cache');
const chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--disk-cache-dir=' + cacheDir, '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--hide-scrollbars', '--mute-audio', '--force-color-profile=srgb', '--window-size=1440,810',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
let W = 1440, H = 810;  // the stage; replaced by the page's own size after load
const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
  chrome.on('exit', c => reject(new Error('chrome exited ' + c)));
});
const cdpPort = new URL(wsUrl).port;
const pages = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let seq = 0;
const pending = new Map();
const listeners = [];
ws.addEventListener('message', ev => {
  const d = JSON.parse(ev.data);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  else if (d.method) listeners.forEach(f => f(d));
});
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
async function js(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('page: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
function cleanup() { try { chrome.kill('SIGKILL'); } catch (e) {} server.close(); try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {} }
process.on('exit', cleanup);

listeners.push(d => {
  if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning'))
    console.error('[page]', d.params.args.map(a => a.value ?? a.description).join(' '));
  if (d.method === 'Runtime.exceptionThrown') console.error('[page exception]', d.params.exceptionDetails.exception?.description);
});
await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 810, deviceScaleFactor: DSF, mobile: false });
const loaded = new Promise(r => listeners.push(d => d.method === 'Page.loadEventFired' && r()));
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${opt('page', 'film.html')}` });
await loaded;
[W, H] = await js('[(window.__director && __director.W) || 1440, (window.__director && __director.H) || 810]');
if (W !== 1440 || H !== 810) await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DSF, mobile: false });
await js(`(async () => {
  // every face the page declares, loaded before the first frame: Google Fonts splits a family by weight and script,
  // and a face that a later shot uses would otherwise still be on its way when that shot's frames are captured
  await document.fonts.ready;
  await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)));
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 300));
  return document.fonts.size;
})()`);
const CAMERA = opt('camera', 'transform');
await js(`__director.mode = '${CAMERA}'; __clock.freeze(); __director.start(); true`);

const OUT = path.join(DIR, 'out');
fs.mkdirSync(OUT, { recursive: true });
const step = (n) => js(`(() => { let f; for (let i = 0; i < ${n}; i++) { __clock.advance(${DT}); f = __director.frame(); } return f; })()`);
// transform mode: the camera is a CSS transform in the page, the capture is always the full stage
const FULL = { x: 0, y: 0, width: W, height: H, scale: DSF > 1 ? 1 : 4 / 3 };
const OUT_W = Math.round(W * 4 / 3), OUT_H = Math.round(H * 4 / 3);
const EXP_W = DSF > 1 ? Math.round(W * DSF) : OUT_W, EXP_H = DSF > 1 ? Math.round(H * DSF) : OUT_H;
const shot = async (f) => Buffer.from((await send('Page.captureScreenshot', {
  format: 'png', fromSurface: true, captureBeyondViewport: false, optimizeForSpeed: true,
  clip: CAMERA === 'clip' ? { x: f.x, y: f.y, width: f.w, height: f.h, scale: f.scale } : FULL,
})).data, 'base64');
const SUB = Math.max(1, Number(opt('mb', 1)));
const MBW = await js('(window.__director && __director.mb) || []');
const inMB = (t) => SUB > 1 && MBW.some(([a, b]) => t >= a && t <= b);
const adv = (dt) => js(`(() => { __clock.advance(${dt}); return __director.frame(); })()`);
// the frame at f.t, blurred over the shutter if it falls in a window; returns [png, time already advanced past f.t]
async function capture(f) {
  const buf = await shot(f);
  if (!inMB(f.t)) return [buf, 0];
  const fr = [png.decode(buf)];
  for (let k = 1; k < SUB; k++) { await adv(DT / (2 * SUB)); fr.push(png.decode(await shot(f))); }
  return [png.encode(png.average(fr)), (SUB - 1) * DT / (2 * SUB)];
}
const saveEvents = async () => {
  const log = await js('__VIDEO.log');
  fs.writeFileSync(path.join(OUT, 'events.json'), JSON.stringify({ fps: FPS, events: log }, null, 0));
  return log;
};

if (MODE === 'dry') {
  let f, n = 0;
  const t0 = Date.now();
  do { f = await step(30); n += 30; } while (!f.done && n < FPS * 400);
  const log = await saveEvents();
  const beats = log.filter(e => e.type === 'beat' || e.type === 'endcard' || e.type === 'done').map(e => `${e.type}${e.beat ?? ''}@${(e.t / 1000).toFixed(1)}s`);
  console.log(beats.join('  '));
  const manFile = path.join(DIR, 'vo', 'manifest.json');  // voice-over lines, only when the film has them
  const man = fs.existsSync(manFile) ? JSON.parse(fs.readFileSync(manFile, 'utf8')).lines : {};
  const vos = log.filter(e => e.type === 'vo' && man[e.id]).map(e => ({ id: e.id, a: e.t, b: e.t + man[e.id].end * 1000 }));
  vos.forEach((v, i) => {
    const next = vos[i + 1];
    const gap = next ? next.a - v.b : null;
    console.log(`  vo ${v.id.padEnd(9)} ${(v.a / 1000).toFixed(2).padStart(7)} → ${(v.b / 1000).toFixed(2).padStart(7)}${gap !== null && gap < 300 ? '   ⚠ gap ' + gap.toFixed(0) + 'ms' : ''}`);
  });
  console.log(`duration ${(f.t / 1000).toFixed(2)}s · ${log.length} events · simulated in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
} else if (MODE === 'still') {
  // --still 8000,41500,77500 → out/still-8000.png …
  const times = String(opt('still')).split(',').map(Number).sort((a, b) => a - b);
  let f = { t: 0 }, frame = 0;
  for (const at of times) {
    const target = Math.round(at / DT);
    if (target > frame) { f = await step(target - frame); frame = target; }
    const file = times.length === 1 ? opt('out', path.join(OUT, `still-${at}.png`)) : path.join(OUT, `still-${at}.png`);
    const [buf, carry] = await capture(f);
    if (carry) await adv(-carry);  // stills only: rewind the sub-frame steps so later stills stay on the frame grid
    fs.writeFileSync(file, buf);
    console.log(path.basename(file));
  }
} else {
  const from = Number(opt('from', 0)), to = Number(opt('to', 1e9));
  const file = opt('out', path.join(OUT, 'video.mp4'));
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-vf', `scale=${OUT_W}:${OUT_H}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  ff.stdin.on('error', e => { console.error('ffmpeg input closed:', e.message); process.exit(1); });
  const t0 = Date.now();
  let f = { t: 0, done: false }, frames = 0, warned = false, carry = 0, blurred = 0;
  if (from > 0) f = await step(Math.round(from / DT));
  while (!f.done && f.t < to) {
    f = carry ? await adv(DT - carry) : await step(1);
    const [buf, c] = await capture(f);
    carry = c; if (c) blurred++;
    const pw = buf.readUInt32BE(16), ph = buf.readUInt32BE(20);
    if ((pw !== EXP_W || ph !== EXP_H) && !warned) { warned = true; console.error(`\nframe ${frames}: ${pw}x${ph}`, JSON.stringify(f)); }
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    frames++;
    if (frames % (FPS * 5) === 0) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r${(f.t / 1000).toFixed(1)}s rendered · ${(frames / el).toFixed(1)} fps · ${el.toFixed(0)}s elapsed   `);
    }
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await saveEvents();
  console.log(`\n${file} · ${frames} frames (${blurred} motion-blurred × ${SUB}) · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
cleanup();
process.exit(0);
