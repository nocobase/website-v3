// Mixer (skill nocobase-video): the code-original music (score.mjs → out/$OUT/music.wav) plus the recorded sound effects
// the team chose (audio/sfx/CREDITS.md), each placed from the film's cue sheet (out/$OUT/events.json, type "sfx"). The music
// ducks under every effect with a per-role envelope (after guizang's starting points), and the master gets a gentle tilt
// toward the reference's balance (+3 dB below 100 Hz, +4 dB of presence around 3.5 kHz and +3 dB at 5.5 kHz, +1.5 dB above
// 8 kHz). Loudness is set afterwards by make.sh (two-pass loudnorm, −14 LUFS, −1 dBTP).
// The score arrives on every chapter by itself, so the recorded hit sits under it (−17 dB, never lifted) and the music gives
// way to it by only 2 dB — no dip under the downbeats (v12).
//   OUT=film node mix.mjs   → out/film/mix.wav, sfx-stem.wav, music-ducked.wav, mix-report.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode, measure, SR } from './tools/sfx-scan.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out', process.env.OUT || 'film');
const SRC = path.join(DIR, 'audio/sfx');  // kenney/ ships with the skill (CC0); mixkit/ comes from scripts/fetch-sfx.sh
const db = (d) => Math.pow(10, d / 20), todb = (x) => 20 * Math.log10(Math.max(x, 1e-9));

// ---- music
function readWavF32(file) {
  const b = fs.readFileSync(file); let o = 12, fmt = null, data = null;
  while (o < b.length) { const id = b.toString('latin1', o, o + 4), n = b.readUInt32LE(o + 4); if (id === 'fmt ') fmt = { ch: b.readUInt16LE(o + 10), sr: b.readUInt32LE(o + 12), bits: b.readUInt16LE(o + 22) }; if (id === 'data') data = b.subarray(o + 8, o + 8 + n); o += 8 + n + (n & 1); }
  if (!fmt || fmt.bits !== 32 || fmt.ch !== 2 || fmt.sr !== SR) throw new Error('expected 48 kHz stereo float WAV: ' + file);
  const n = data.length / 8, L = new Float32Array(n), R = new Float32Array(n);
  for (let k = 0; k < n; k++) { L[k] = data.readFloatLE(k * 8); R[k] = data.readFloatLE(k * 8 + 4); }
  return [L, R];
}
function writeWavF32(file, [L, R]) {
  const n = L.length, bytes = n * 8, b = Buffer.alloc(44 + bytes);
  b.write('RIFF', 0); b.writeUInt32LE(36 + bytes, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(3, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 8, 28); b.writeUInt16LE(8, 32); b.writeUInt16LE(32, 34); b.write('data', 36); b.writeUInt32LE(bytes, 40);
  for (let k = 0; k < n; k++) { b.writeFloatLE(L[k], 44 + k * 8); b.writeFloatLE(R[k], 48 + k * 8); }
  fs.writeFileSync(file, b);
}
const music = readWavF32(path.join(OUT, 'music.wav')), N = music[0].length;
// a slow leveller on the music: sections move 12 % of the way toward -25 dB (±3 dB at most), so the reading passages are
// not buried and the fullest bars are not overbearing; silence (the gaps before the impacts) is left alone
{
  const H = Math.round(0.01 * SR), W = Math.round(0.8 * SR / H), lv = [];
  for (let k = 0; k < N; k += H) { let s = 0, n = 0; for (let i = k; i < Math.min(N, k + H); i++) { s += music[0][i] ** 2 + music[1][i] ** 2; n += 2; } lv.push(s / Math.max(1, n)); }
  const g = lv.map((_, j) => { let s = 0, n = 0; for (let i = Math.max(0, j - W); i <= Math.min(lv.length - 1, j + W); i++) { s += lv[i]; n++; } const L = 10 * Math.log10(s / n + 1e-12); return L < -45 ? 0 : Math.max(-3, Math.min(3, (-25 - L) * 0.12)); });
  const sm = g.map((_, j) => { let s = 0, n = 0; for (let i = Math.max(0, j - 25); i <= Math.min(g.length - 1, j + 25); i++) { s += g[i]; n++; } return s / n; });
  for (let k = 0; k < N; k++) { const j = k / H, j0 = Math.floor(j), j1 = Math.min(sm.length - 1, j0 + 1), d = sm[j0] + (sm[j1] - sm[j0]) * (j - j0), q = Math.pow(10, d / 20); music[0][k] *= q; music[1][k] *= q; }
}
const { events } = JSON.parse(fs.readFileSync(path.join(OUT, 'events.json'), 'utf8'));

// ---- the chosen samples. sync: which landmark meets the action — 'onset' for clicks and taps, 'loud' for sweeps and
// hits (they start before the frame they belong to). trim: seconds after the onset to keep (a double click keeps one).
const S = {
  key: { file: 'kenney/click4.ogg', sync: 'onset', peak: -22 },
  click: { file: 'mixkit/mixkit-2997.wav', sync: 'onset', trim: 0.1, peak: -15 },
  pop: { file: 'kenney/toggle_002.ogg', sync: 'onset', peak: -17 },
  ok: { file: 'kenney/confirmation_001.ogg', sync: 'onset', peak: -15 },
  alert: { file: 'mixkit/mixkit-2569.wav', sync: 'onset', trim: 0.45, peak: -16 },
  whoosh: { file: 'mixkit/mixkit-166.wav', sync: 'loud', lead: 0.22, peak: -15 },
  impact: { file: 'mixkit/mixkit-2299.wav', sync: 'loud', peak: -17, under: true },  // weight under the score's own arrival: never lifted
  clack: { file: 'mixkit/mixkit-2857.wav', sync: 'loud', peak: -13 },
};
S.enter = { ...S.key, peak: -16 }; S.lock = { ...S.clack, peak: -19 };
// ducking per role: depth dB / attack before the audible point / hold / release (s)
const DUCK = { key: [2.5, 0.04, 0.35, 0.25], enter: [3, 0.04, 0.12, 0.24], click: [3, 0.04, 0.11, 0.22], pop: [3, 0.04, 0.12, 0.24], ok: [3.5, 0.04, 0.3, 0.38],
  alert: [3.5, 0.04, 0.3, 0.38], whoosh: [4, 0.04, 0.18, 0.32], impact: [2, 0.04, 0.35, 0.4], clack: [4, 0.04, 0.18, 0.3], lock: [3, 0.04, 0.12, 0.24] };

// every sample must be on disk: kenney/ ships with the skill; mixkit/ is fetched per person (its licence forbids shipping it)
{
  const need = [...new Set(Object.values(S).map((s) => s.file))].filter((f) => !fs.existsSync(path.join(SRC, f)));
  if (need.length) {
    const msg = 'missing sound effects in audio/sfx/: ' + need.join(', ') + '\n→ run <skill>/scripts/fetch-sfx.sh ' + DIR + ' (Mixkit licence: free use in films, no redistribution)';
    // SFX_PARTIAL=1: a review soundtrack without them (their roles are left out), until they are fetched
    if (!process.env.SFX_PARTIAL) { console.error(msg); process.exit(1); }
    const gone = Object.keys(S).filter((k) => need.includes(S[k].file));
    console.warn(msg + '\n  SFX_PARTIAL: mixing without ' + gone.join(', '));
    gone.forEach((k) => delete S[k]);
  }
}
const cache = {};
function sample(role) {
  const s = S[role];
  if (!cache[s.file + (s.trim || '')]) {
    const raw = decode(path.join(SRC, s.file)), m = measure(raw);
    const a = Math.max(0, Math.round((m.onsetT - 0.004) * SR)), b = s.trim ? Math.min(raw[0].length, Math.round((m.onsetT + s.trim) * SR)) : raw[0].length;
    const L = raw[0].slice(a, b), R = raw[1].slice(a, b), F = Math.min(L.length, Math.round(0.02 * SR));
    for (let i = 0; i < F; i++) { const g = i / F; L[L.length - 1 - i] *= g; R[R.length - 1 - i] *= g; }  // no click at the cut
    let pk = 0; for (let i = 0; i < L.length; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
    cache[s.file + (s.trim || '')] = { L, R, pk, sync: (s.sync === 'loud' ? m.loudT : m.onsetT) - a / SR };
  }
  return cache[s.file + (s.trim || '')];
}

// ---- the duck envelope first (it does not depend on levels; the deepest duck wins where they overlap)
const sfx = [new Float32Array(N), new Float32Array(N)], duck = new Float32Array(N).fill(0), report = [];
const fx = events.filter((e) => e.type === 'sfx' && S[e.k]).map((e) => ({ ...e, role: e.k, time: e.t / 1000 + (S[e.k].lead || 0) }));
for (const e of fx) {
  const [d, att, hold, rel] = DUCK[e.role], t = e.time, k0 = Math.round((t - att) * SR), k1 = Math.round(t * SR), k2 = Math.round((t + hold) * SR), k3 = Math.round((t + hold + rel) * SR);
  for (let k = Math.max(0, k0); k < Math.min(N, k3); k++) {
    const x = k < k1 ? (k - k0) / (k1 - k0) : k < k2 ? 1 : 1 - (k - k2) / (k3 - k2);
    duck[k] = Math.max(duck[k], d * Math.sin(Math.PI / 2 * Math.max(0, Math.min(1, x))));
  }
}
const md = [new Float32Array(N), new Float32Array(N)];
for (let k = 0; k < N; k++) { const g = db(-duck[k]); md[0][k] = music[0][k] * g; md[1][k] = music[1][k] * g; }
const win = (bus, t) => { let p = 0; for (let k = Math.max(0, Math.round((t - 0.02) * SR)); k < Math.min(N, Math.round((t + 0.1) * SR)); k++) p = Math.max(p, Math.abs(bus[0][k]), Math.abs(bus[1][k])); return p; };
// ---- then every effect, at its role level — lifted (up to +6 dB) where the ducked music around it would cover it
for (const e of fx) {
  const smp = sample(e.role), t = e.time, want = S[e.role].peak + (e.g || 0), floor = todb(win(md, t)) + 1;
  const level = S[e.role].under ? want : Math.min(want + 6, Math.max(want, floor)), g = db(level) / smp.pk, start = Math.round((t - smp.sync) * SR);
  for (let i = 0; i < smp.L.length; i++) { const k = start + i; if (k < 0 || k >= N) continue; sfx[0][k] += smp.L[i] * g; sfx[1][k] += smp.R[i] * g; }
  report.push({ t: +t.toFixed(3), role: e.role, file: S[e.role].file, levelDb: +level.toFixed(1), liftedDb: +(level - want).toFixed(1), duckDb: DUCK[e.role][0] });
}

// ---- master: sum, tilt toward the reference (low and high shelves, RBJ cookbook), soft limit
function shelf(x, type, f0, gainDb, S0 = 0.8) {
  const A = Math.pow(10, gainDb / 40), w = 2 * Math.PI * f0 / SR, cs = Math.cos(w), sn = Math.sin(w), al = sn / 2 * Math.sqrt((A + 1 / A) * (1 / S0 - 1) + 2), sq = 2 * Math.sqrt(A) * al;
  let b0, b1, b2, a0, a1, a2;
  if (type === 'low') { b0 = A * ((A + 1) - (A - 1) * cs + sq); b1 = 2 * A * ((A - 1) - (A + 1) * cs); b2 = A * ((A + 1) - (A - 1) * cs - sq); a0 = (A + 1) + (A - 1) * cs + sq; a1 = -2 * ((A - 1) + (A + 1) * cs); a2 = (A + 1) + (A - 1) * cs - sq; }
  else { b0 = A * ((A + 1) + (A - 1) * cs + sq); b1 = -2 * A * ((A - 1) + (A + 1) * cs); b2 = A * ((A + 1) + (A - 1) * cs - sq); a0 = (A + 1) - (A - 1) * cs + sq; a1 = 2 * ((A - 1) - (A + 1) * cs); a2 = (A + 1) - (A - 1) * cs - sq; }
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = x[i], y = (b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = v; y2 = y1; y1 = y; x[i] = y; }
}
function peaking(x, f0, gainDb, Q) {
  const A = Math.pow(10, gainDb / 40), w = 2 * Math.PI * f0 / SR, al = Math.sin(w) / (2 * Q), cs = Math.cos(w);
  const b0 = 1 + al * A, b1 = -2 * cs, b2 = 1 - al * A, a0 = 1 + al / A, a1 = -2 * cs, a2 = 1 - al / A;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = x[i], y = (b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = v; y2 = y1; y1 = y; x[i] = y; }
}
const mix = [new Float32Array(N), new Float32Array(N)];
for (let ch = 0; ch < 2; ch++) { for (let k = 0; k < N; k++) mix[ch][k] = md[ch][k] + sfx[ch][k]; shelf(mix[ch], 'low', 100, 3); peaking(mix[ch], 3500, 4, 0.7); peaking(mix[ch], 5500, 3, 1.1); shelf(mix[ch], 'high', 8000, 1.5); }
// a look-ahead peak limiter: the hits keep their shape but lose the few dB that would force the loudness pass into
// dynamic (pumping) mode — the ceiling sits 11 dB over the active RMS, so -14 LUFS can be reached with one linear gain
let peak = 0; for (let ch = 0; ch < 2; ch++) for (let k = 0; k < N; k++) peak = Math.max(peak, Math.abs(mix[ch][k]));
{
  let s = 0, n = 0; for (let k = 0; k < N; k += 480) { let e = 0; for (let i = k; i < Math.min(N, k + 480); i++) e += mix[0][i] ** 2 + mix[1][i] ** 2; e /= 960; if (e > 1e-6) { s += e; n++; } }
  const rmsDb = 10 * Math.log10(s / Math.max(1, n)), ceil = db(rmsDb + 11), LA = Math.round(0.005 * SR), rel = Math.exp(-1 / (0.08 * SR));
  const req = new Float32Array(N); for (let k = 0; k < N; k++) { const p = Math.max(Math.abs(mix[0][k]), Math.abs(mix[1][k])); req[k] = p > ceil ? ceil / p : 1; }
  const mn = new Float32Array(N); const dq = [];  // moving minimum over the next LA samples
  for (let k = N - 1; k >= 0; k--) { while (dq.length && req[dq[dq.length - 1]] >= req[k]) dq.pop(); dq.push(k); while (dq[0] > k + LA) dq.shift(); mn[k] = req[dq[0]]; }
  let g = 1, red = 0;
  for (let k = 0; k < N; k++) { g = mn[k] < g ? mn[k] : Math.min(mn[k], 1 - (1 - g) * rel); mix[0][k] *= g; mix[1][k] *= g; red = Math.max(red, -todb(g)); }
  console.log(`limiter: active RMS ${rmsDb.toFixed(1)} dB, ceiling ${(rmsDb + 11).toFixed(1)} dB, deepest reduction ${red.toFixed(1)} dB`);
}
writeWavF32(path.join(OUT, 'mix.wav'), mix); writeWavF32(path.join(OUT, 'sfx-stem.wav'), sfx); writeWavF32(path.join(OUT, 'music-ducked.wav'), md);

// ---- check: at each effect, its peak against the ducked music's peak in the same 120 ms
for (const r of report) { r.sfxPeakDb = +todb(win(sfx, r.t)).toFixed(1); r.musicPeakDb = +todb(win(md, r.t)).toFixed(1); }
const under = report.filter((r) => r.sfxPeakDb < r.musicPeakDb - 1 && !S[r.role].under), lifted = report.filter((r) => r.liftedDb > 0);
fs.writeFileSync(path.join(OUT, 'mix-report.json'), JSON.stringify({ cues: report.length, lifted: lifted.length, underMusic: under.length, cuesDetail: report }, null, 1));
const byRole = {}; report.forEach((r) => { byRole[r.role] = (byRole[r.role] || 0) + 1; });
console.log(`mix.wav · ${report.length} effects ${JSON.stringify(byRole)} · master peak before limiter ${peak.toFixed(2)} · lifted ${lifted.length} · still under the music ${under.length}`);
lifted.forEach((r) => console.log(`  lifted ${r.t}s ${r.role} +${r.liftedDb} dB`));
