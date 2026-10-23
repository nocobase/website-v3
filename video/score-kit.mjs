// NocoBase film score kit (skill nocobase-video) — the sound palette and the arrangement rules of the approved score
// (examples/ai-plus-nocobase/score.mjs, v13). A film's score.mjs imports it, writes a chord chart and its sections, then
// calls finish(). Rules the kit encodes (music.md):
//   - one key centre (the voicings are named in D; setKey(n) moves everything n semitones);
//   - voicings kept on common tones; arps take chord tones, the bass the roots (E1–D2), the sub never below D1;
//   - a chapter is led into from the bar before (leadIn + roll) and arrives on its downbeat (arrive) — never silence
//     before a hit; grooves run to the downbeat;
//   - melody notes are checked against the chord under them (melody() warns on a clash);
//   - the report prints section levels and the level either side of every chapter line, so jumps and holes show up
//     without listening;
//   - the act that shows today's way (before NocoBase) can have its own sound on the dry bus: no delay, no hall, near the
//     centre, a sixteenth-note machine on the motif (seq, drone, and dry: true on bass / kit / subs / roll). It powers
//     down into the brand (powerDown) while the wide dominant pad and the lead-in carry the bar — no silence.
//   import { createScore } from './score-kit.mjs';
//   const S = createScore();                      // reads out/$OUT/events.json (OUT=film by default)
//   S.chart(0, 'Dm', 'Bb'); S.pads(0, 8); …; S.finish({ sections, lines });
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fft } from './tools/fft.mjs';

export function createScore(opts = {}) {
  const DIR = opts.dir || path.dirname(fileURLToPath(import.meta.url));
  const OUTNAME = opts.out || process.env.OUT || 'film';
  const SR = 48000, BEAT = 60 / (opts.bpm || 120), BAR = BEAT * 4;
  const { events } = JSON.parse(fs.readFileSync(path.join(DIR, 'out', OUTNAME, 'events.json'), 'utf8'));
  const sec = (ms) => ms / 1000;
  const cues = (k) => events.filter((e) => e.type === 'cue' && e.k === k).map((e) => ({ ...e, t: sec(e.t) }));
  const at = (k, i = 0) => { const c = cues(k)[i]; if (!c) throw new Error('missing cue ' + k + ' #' + i); return c.t; };
  const doneEv = events.find((e) => e.type === 'done');
  if (!doneEv) throw new Error('events.json has no "done" event: run the dry run first');
  const DONE_T = sec(doneEv.t), END = DONE_T + 0.6, N = Math.ceil(END * SR);

  // ---------------------------------------------------------------- buffers & helpers
  const stereo = () => [new Float32Array(N), new Float32Array(N)];
  const music = stereo(), drums = stereo(), air = stereo();  // air: cymbals and swells, roomed, not pumped
  const dry = stereo();  // today's way, before NocoBase: close and narrow — no delay, no hall, a small room at the mixdown
  let seed = opts.seed || 20260926;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const db = (d) => Math.pow(10, d / 20);
  function add(bus, buf, t, gain = 1, pan = 0) {
    const o = Math.round(t * SR), gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
    const L = Array.isArray(buf) ? buf[0] : buf, R = Array.isArray(buf) ? buf[1] : buf;
    for (let i = 0; i < L.length; i++) { const k = o + i; if (k < 0 || k >= N) continue; bus[0][k] += L[i] * gl; bus[1][k] += R[i] * gr; }
  }
  function saw(ph, dt) { // PolyBLEP
    let v = 2 * ph - 1;
    if (ph < dt) { const x = ph / dt; v -= x + x - x * x - 1; } else if (ph > 1 - dt) { const x = (ph - 1) / dt; v -= x * x + x + x + 1; }
    return v;
  }
  function biquad(buf, type, f, q = 0.707, fEnv = null) {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0, b0, b1, b2, a1, a2;
    const coef = (fc) => {
      const w = 2 * Math.PI * Math.min(Math.max(fc, 20), SR * 0.45) / SR, cs = Math.cos(w), al = Math.sin(w) / (2 * q);
      let B0, B1, B2;
      if (type === 'lp') { B0 = (1 - cs) / 2; B1 = 1 - cs; B2 = (1 - cs) / 2; } else if (type === 'hp') { B0 = (1 + cs) / 2; B1 = -(1 + cs); B2 = (1 + cs) / 2; } else { B0 = al; B1 = 0; B2 = -al; }
      const A0 = 1 + al; b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = -2 * cs / A0; a2 = (1 - al) / A0;
    };
    coef(f);
    for (let i = 0; i < buf.length; i++) {
      if (fEnv && (i & 31) === 0) coef(fEnv(i / SR));
      const x = buf[i], y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y; buf[i] = y;
    }
    return buf;
  }
  const env = (t, a, d, s, r, len) => { if (t < a) return t / a; if (t < a + d) return 1 - (1 - s) * (t - a) / d; if (t < len) return s; const v = s * (1 - (t - len) / r); return v > 0 ? v : 0; };
  const ramp = (t0, t1, v0, v1) => (t) => v0 + (v1 - v0) * Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));

  // ---------------------------------------------------------------- instruments: the v6 electronic palette (the user's choice; orchestral was rejected)
  function pad(midi, len, bright = 1, att = 0.5, rel = 2.0) {   // detuned saws, slow filter LFO
    const n = Math.floor((len + rel + 0.4) * SR), L = new Float32Array(n), R = new Float32Array(n);
    const det = [-0.12, -0.05, 0.04, 0.11], f = mtof(midi), ph = det.map(() => rnd());
    for (let i = 0; i < n; i++) {
      const t = i / SR, e = env(t, att, 0.8, 0.85, rel, len);
      let l = 0, r = 0;
      det.forEach((d, j) => { const fr = f * Math.pow(2, d / 12), dt = fr / SR; ph[j] += dt; if (ph[j] >= 1) ph[j] -= 1; const v = saw(ph[j], dt); if (j % 2) r += v; else l += v; });
      L[i] = l * e * 0.3; R[i] = r * e * 0.3;
    }
    const lfo = (t) => 700 * bright + 450 * bright * Math.sin(2 * Math.PI * 0.09 * t);
    biquad(L, 'lp', 900, 0.55, lfo); biquad(R, 'lp', 900, 0.55, (t) => lfo(t + 2.1));
    biquad(L, 'hp', 140, 0.6); biquad(R, 'hp', 140, 0.6);
    return [L, R];
  }
  function pluck(midi, bright = 1, dec = 6.5) {
    const n = Math.floor(1.1 * SR), b = new Float32Array(n), f = mtof(midi), dt = f / SR;
    let p = rnd(), p2 = rnd();
    for (let i = 0; i < n; i++) {
      const t = i / SR; p += dt; if (p >= 1) p -= 1; p2 += dt * 1.005; if (p2 >= 1) p2 -= 1;
      b[i] = (saw(p, dt) + 0.55 * saw(p2, dt * 1.005)) * Math.exp(-t * dec) * 0.6 * Math.min(1, t / 0.002);
    }
    return biquad(b, 'lp', 3000, 1.1, (t) => 380 + 4200 * bright * Math.exp(-t * 14));
  }
  function bassNote(midi, len, drive = 1.5) {
    const n = Math.floor((len + 0.1) * SR), b = new Float32Array(n), f = mtof(midi);
    let p = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR; p += f / SR;
      const e = Math.min(1, t / 0.005) * (t < len ? 1 : Math.max(0, 1 - (t - len) / 0.1)) * (0.78 + 0.22 * Math.exp(-t * 9));
      b[i] = Math.tanh(drive * (Math.sin(2 * Math.PI * p) + 0.18 * Math.sin(4 * Math.PI * p))) * e * 0.36;
    }
    return biquad(biquad(b, 'lp', 520, 0.8), 'hp', 38, 0.7);
  }
  function sub(midi, len, att = 0.6) {
    const n = Math.floor((len + 0.5) * SR), b = new Float32Array(n), f = mtof(midi);
    for (let i = 0; i < n; i++) { const t = i / SR; b[i] = Math.sin(2 * Math.PI * f * t) * env(t, att, 0.2, 1, 0.5, len) * 0.22; }
    return b;
  }
  function kick(punch = 1) {
    const n = Math.floor(0.5 * SR), b = new Float32Array(n);
    let p = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, f = 42 + 120 * punch * Math.exp(-t * 30); p += f / SR;
      b[i] = Math.tanh(1.4 * Math.sin(2 * Math.PI * p)) * Math.exp(-t * 6.5) + (t < 0.003 ? (rnd() * 2 - 1) * 0.25 * (1 - t / 0.003) : 0);
    }
    return b;
  }
  function hat(open = false) {
    const n = Math.floor((open ? 0.3 : 0.07) * SR), b = new Float32Array(n);
    for (let i = 0; i < n; i++) b[i] = (rnd() * 2 - 1) * Math.exp(-(i / SR) * (open ? 12 : 62));
    return biquad(biquad(b, 'hp', 7800, 0.9), 'hp', 7800, 0.9);
  }
  function clap() {
    const n = Math.floor(0.4 * SR), b = new Float32Array(n);
    for (let i = 0; i < n; i++) { const t = i / SR; const burst = [0, 0.012, 0.024].reduce((a, o) => a + (t >= o ? Math.exp(-(t - o) * 85) : 0), 0) * 0.5 + Math.exp(-t * 10) * 0.45; b[i] = (rnd() * 2 - 1) * burst; }
    return biquad(b, 'bp', 1300, 0.75);
  }
  function bell(midi, dur = 2.4, idx0 = 2.0) {  // FM bell: the checks, the motif, the brand
    const n = Math.floor(dur * SR), b = new Float32Array(n), f = mtof(midi);
    for (let i = 0; i < n; i++) { const t = i / SR, idx = idx0 * Math.exp(-t * 5); b[i] = 1.3 * Math.sin(2 * Math.PI * f * t + idx * Math.sin(2 * Math.PI * f * 3.5 * t)) * Math.exp(-t * 2.2) * Math.min(1, t / 0.003); }
    return b;
  }
  function riser(len, top = 5200) {
    const n = Math.floor(len * SR), b = new Float32Array(n);
    let p = 0;
    for (let i = 0; i < n; i++) { const t = i / SR, x = t / len; p += (180 + 1100 * x * x) / SR; b[i] = ((rnd() * 2 - 1) * 0.7 + 0.25 * Math.sin(2 * Math.PI * p)) * x * x; }
    return biquad(b, 'bp', 400, 1.3, (t) => 300 + top * Math.pow(t / len, 2));
  }
  function impact(size = 1) {
    const n = Math.floor(4 * SR), b = new Float32Array(n);
    let p = 0;
    for (let i = 0; i < n; i++) { const t = i / SR; p += (34 + 70 * Math.exp(-t * 5)) / SR; b[i] = Math.tanh(1.3 * Math.sin(2 * Math.PI * p)) * Math.exp(-t * 1.3 / size) * 0.9 + (rnd() * 2 - 1) * Math.exp(-t * 11) * 0.3; }
    return biquad(biquad(b, 'lp', 2600, 0.7), 'hp', 30, 0.7);
  }
  // the kit for fills and arrivals (v12): a crash (six inharmonic square partials + noise), its reverse, snare, toms, shaker
  function cymbal(len = 3.2, bright = 1) {
    const n = Math.floor(len * SR), out = [new Float32Array(n), new Float32Array(n)];
    const F = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0].map((f) => f * 2.4);
    for (let ch = 0; ch < 2; ch++) {
      const b = out[ch], ph = F.map(() => rnd());
      for (let i = 0; i < n; i++) {
        const t = i / SR; let m = 0;
        F.forEach((f, j) => { ph[j] += f * (ch ? 1.003 : 1) / SR; if (ph[j] >= 1) ph[j] -= 1; m += ph[j] < 0.5 ? 1 : -1; });
        b[i] = Math.min(1, t / 0.002) * (m / 6 * 0.5 * Math.exp(-t * 2.6) + (rnd() * 2 - 1) * 0.6 * Math.exp(-t * (1.25 / bright)));
      }
      biquad(b, 'hp', 4200, 0.7); biquad(b, 'hp', 4200, 0.7); biquad(b, 'lp', 14000, 0.7);
    }
    return out;
  }
  function reverseCymbal(len) {
    const c = cymbal(len + 0.05), n = Math.floor(len * SR), out = [new Float32Array(n), new Float32Array(n)];
    for (let ch = 0; ch < 2; ch++) for (let i = 0; i < n; i++) { const x = i / n; out[ch][i] = c[ch][n - 1 - i] * x * x * (i > n - 64 ? (n - i) / 64 : 1); }
    return out;
  }
  function snare(vel = 1) {
    const n = Math.floor(0.28 * SR), b = new Float32Array(n);
    let p = 0;
    for (let i = 0; i < n; i++) { const t = i / SR, f = 180 + 70 * Math.exp(-t * 45); p += f / SR; b[i] = (Math.sin(2 * Math.PI * p) * Math.exp(-t * 20) * 0.5 + (rnd() * 2 - 1) * Math.exp(-t * 19) * 0.75) * vel; }
    return biquad(biquad(b, 'hp', 170, 0.7), 'lp', 8000, 0.7);
  }
  function tom(f0 = 110, dec = 7) {
    const n = Math.floor(0.55 * SR), b = new Float32Array(n);
    let p = 0;
    for (let i = 0; i < n; i++) { const t = i / SR, f = f0 * (1 + 0.55 * Math.exp(-t * 26)); p += f / SR; b[i] = Math.sin(2 * Math.PI * p) * Math.exp(-t * dec) + (rnd() * 2 - 1) * Math.exp(-t * 70) * 0.12; }
    return biquad(b, 'lp', 2600, 0.7);
  }
  function shaker() {
    const n = Math.floor(0.07 * SR), b = new Float32Array(n);
    for (let i = 0; i < n; i++) { const t = i / SR; b[i] = (rnd() * 2 - 1) * (t < 0.006 ? t / 0.006 : Math.exp(-(t - 0.006) * 60)); }
    return biquad(biquad(b, 'hp', 6000, 0.7), 'bp', 9500, 0.8);
  }
  // the machine's voices (the dry bus): a short resonant pulse blip, a clock tick, a kick with a quicker body
  function blip(midi, bright = 1, dec = 34) {
    const n = Math.floor(0.24 * SR), b = new Float32Array(n), f = mtof(midi), dt = f / SR;
    let p = rnd();
    for (let i = 0; i < n; i++) {
      const t = i / SR; p += dt; if (p >= 1) p -= 1;
      let q = p + 0.32; if (q >= 1) q -= 1;
      b[i] = (saw(p, dt) - saw(q, dt)) * Math.exp(-t * dec) * 0.5 * Math.min(1, t / 0.0015);
    }
    return biquad(b, 'lp', 2000, 1.5, (t) => 240 + 3600 * bright * Math.exp(-t * 30));
  }
  function tick() {
    const n = Math.floor(0.04 * SR), b = new Float32Array(n);
    for (let i = 0; i < n; i++) { const t = i / SR; b[i] = Math.sin(2 * Math.PI * 2350 * t) * Math.exp(-t * 240) * 0.7 + (rnd() * 2 - 1) * Math.exp(-t * 1100) * 0.35; }
    return biquad(b, 'hp', 1100, 0.7);
  }
  function tightKick(punch = 1) {
    const n = Math.floor(0.3 * SR), b = new Float32Array(n);
    let p = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, f = 46 + 130 * punch * Math.exp(-t * 34); p += f / SR;
      b[i] = Math.tanh(1.5 * Math.sin(2 * Math.PI * p)) * Math.exp(-t * 13) + (t < 0.003 ? (rnd() * 2 - 1) * 0.3 * (1 - t / 0.003) : 0);
    }
    return b;
  }

  // ---------------------------------------------------------------- harmony: voicings named in D, kept on common tones
  const V = {
    Dm: { r: 38, v: [50, 57, 62, 65, 69] }, Bb: { r: 34, v: [50, 58, 62, 65, 69] }, C: { r: 36, v: [52, 60, 62, 64, 67] }, F: { r: 29, v: [53, 57, 60, 65, 69] },
    Gm: { r: 31, v: [50, 58, 62, 67, 69] }, A7: { r: 33, v: [52, 57, 61, 64, 67] }, A7b9: { r: 33, v: [52, 58, 61, 64, 67] },
    Dadd9: { r: 38, v: [50, 57, 62, 64, 66, 69] }, D: { r: 38, v: [62, 66, 69, 73] }, AC: { r: 37, v: [61, 64, 69, 71] }, Bm: { r: 35, v: [59, 62, 66, 69] },
    G: { r: 31, v: [59, 62, 66, 67] }, Gw: { r: 31, v: [55, 59, 62, 67, 71] }, Em: { r: 28, v: [55, 59, 62, 64, 67] }, As: { r: 33, v: [57, 62, 64, 67] }, A: { r: 33, v: [57, 61, 64, 67] },
    FsM: { r: 30, v: [54, 58, 61, 66] }, Dmaj9: { r: 38, v: [50, 57, 61, 64, 66, 69, 76] },
  };
  // move the whole palette n semitones (names stay the D-degree names: 'D' is I, 'G' is IV, 'A' is V, 'Bm' is vi …)
  let keyShift = 0;
  const setKey = (n) => { for (const c of Object.values(V)) { c.r += n - keyShift; c.v = c.v.map((m) => m + n - keyShift); } keyShift = n; };
  // the chord chart: [time, chord]; each entry holds until the next
  const CHART = [];
  const chart = (t, ...names) => names.forEach((nm, i) => { if (!V[nm]) throw new Error('unknown chord ' + nm); CHART.push([t + i * BAR, nm]); });
  const push = (t, nm) => { if (!V[nm]) throw new Error('unknown chord ' + nm); CHART.push([t, nm]); };
  const sorted = () => CHART.sort((a, b) => a[0] - b[0]);
  const chordAt = (t) => { sorted(); let c = CHART[0][1]; for (const [ct, nm] of CHART) { if (ct <= t + 1e-6) c = nm; else break; } return V[c]; };
  const nameAt = (t) => { sorted(); let c = CHART[0][1]; for (const [ct, nm] of CHART) { if (ct <= t + 1e-6) c = nm; else break; } return c; };
  function spans(t0, t1) {
    sorted(); const out = [];
    for (let i = 0; i < CHART.length; i++) {
      const a = Math.max(CHART[i][0], t0), b = Math.min(i + 1 < CHART.length ? CHART[i + 1][0] : END, t1);
      if (b - a > 0.02) out.push({ a, b, ch: V[CHART[i][1]] });
    }
    return out;
  }

  // ---------------------------------------------------------------- layers
  const kicks = [], marks = [], warnings = [];
  const lvAt = (o, t, d = 1) => (typeof o.lvl === 'function' ? o.lvl(t) : (o.lvl ?? d));
  function pads(t0, t1, o = {}) {
    for (const { a, b, ch } of spans(t0, t1)) {
      const lv = lvAt(o, a), br = typeof o.bright === 'function' ? o.bright(a) : (o.bright ?? 1);
      ch.v.forEach((m, j) => add(music, pad(m + (o.up || 0), b - a, br, o.att ?? 0.25, o.rel ?? 1.2), a, (o.g ?? 0.1) * lv, j % 2 ? 0.4 : -0.4));
    }
  }
  // a 16th grid between t0 and t1; fn(time, step-in-bar 0–15, chord)
  function grid(t0, t1, fn) {
    for (let st = Math.ceil(t0 / (BEAT / 4) - 1e-6) * BEAT / 4; st < t1 - 1e-6; st += BEAT / 4) fn(st, Math.round((st % BAR) / (BEAT / 4)) % 16, chordAt(st + 1e-4));
  }
  const ARP = [0, 1, 2, 3, 2, 1, 2, 3];
  function arp(t0, t1, o = {}) {
    grid(t0, t1, (st, s, ch) => {
      if (o.every === 8 && s % 2) return;
      const nn = ch.v.slice(-4), m = nn[ARP[(s + Math.floor(st / BAR) * 3) % 8] % nn.length] + 12 + (o.up || 0) + (s % 8 >= 4 ? 12 : 0);
      add(music, pluck(m, o.bright ?? 1), st, 0.085 * lvAt(o, st) * (s % 4 === 0 ? 1 : 0.72) * (o.g ?? 1), s % 2 ? 0.45 : -0.45);
    });
  }
  // bass: eighths (the last eighth of the bar an octave up), half, or whole notes. dry: on the dry bus; len: note length
  // (short for the machine, 0.11–0.12 s); oct: the second eighth of every beat an octave up (the bass digging in)
  function bass(t0, t1, o = {}) {
    const bus = o.dry ? dry : music;
    grid(t0, t1, (st, s, ch) => {
      const lv = lvAt(o, st);
      if (o.half) { if (s === 0) add(bus, bassNote(ch.r, 0.9), st + 0.01, 0.34 * lv); if (s === 8) add(bus, bassNote(ch.r - 5, 0.4), st + 0.01, 0.26 * lv); return; }
      if (o.whole) { if (s === 0) add(bus, bassNote(ch.r, BAR * 0.9, 1.2), st + 0.01, 0.3 * lv); return; }
      if (s % 2) return;
      const up = o.oct ? (s % 4 === 2 ? 12 : 0) : (s === 14 ? 12 : 0);
      add(bus, bassNote(ch.r + up, o.len ?? BEAT / 2 * 0.85, o.drive ?? 1.5), st + 0.01, 0.34 * lv);
    });
  }
  function subs(t0, t1, g = 0.09, o = {}) { for (const { a, b, ch } of spans(t0, t1)) add(o.dry ? dry : music, sub(ch.r - 12 < 26 ? ch.r : ch.r - 12, b - a - 0.05, 0.3), a, g); }
  // drums: kick 4 (every beat) or 2 (1 and 3); hat 8 (off-beat eighths) or 16; clap on 2 and 4; rim on 3; shaker 16ths.
  // dry: the machine's kit on the dry bus (a tight kick that does not pump the music, narrow hats) and tick: a clock on
  // every beat. Where a key effect (a request's pop, a warning) lands on a dry kick, end the kick there (sound-and-mix.md).
  function kit(t0, t1, o = {}) {
    const bus = o.dry ? dry : drums, w = o.dry ? 0.4 : 1;
    grid(t0, t1, (st, s) => {
      const lv = lvAt(o, st), beatNo = Math.floor(s / 4), off = s % 4;
      if (o.kick && off === 0 && (o.kick === 4 || beatNo % 2 === 0) && !(o.kick === 1 && beatNo)) {
        if (o.dry) add(dry, tightKick(o.punch ?? 1), st, 0.34 * lv); else { add(drums, kick(o.punch ?? 1), st, 0.36 * lv); kicks.push(st); }
      }
      if (o.hat && off === 2) add(bus, hat(), st, (o.dry ? 0.07 : 0.09) * lv, 0.25 * w);
      if (o.hat === 16 && off % 2 === 1) add(bus, hat(), st, (o.dry ? 0.034 : 0.04) * lv, -0.25 * w);
      if (o.clap && off === 0 && (beatNo === 1 || beatNo === 3)) add(bus, clap(), st, (o.dry ? 0.1 : 0.14) * lv, 0.05 * (o.dry ? 0 : 1));
      if (o.rim && off === 0 && beatNo === 2) add(bus, clap(), st, 0.07 * lv, -0.1 * w);
      if (o.shaker) add(bus, shaker(), st, (off === 2 ? 0.05 : 0.028) * lv, 0.35 * w);
      if (o.tick && off === 0) add(bus, tick(), st, 0.05 * lv, beatNo % 2 ? 0.05 : -0.05);
    });
  }
  // one soft kick a bar: the heartbeat that keeps time under a reading passage
  function heartbeat(t0, t1, g = 0.21) { grid(t0, t1, (st, s) => { if (s === 0) { add(drums, kick(0.7), st, g); kicks.push(st); } }); }
  // the machine: the four-note motif on sixteenths, on the dry bus. motif: notes, or t => notes (the dominant's version
  // for a section on V); shift rotates the cell (a canon of entries); up transposes; pan places a voice (−0.6 / 0 / 0.6
  // for three windows); bright opens the filter (0.2 dark … 1.0 open)
  const MOTIF = [74, 72, 69, 70];  // D C A B♭; on the dominant A G E F; in major, on the bells, D C# A B (music.md)
  function seq(t0, t1, o = {}) {
    grid(t0, t1, (st, s) => {
      const cell = typeof o.motif === 'function' ? o.motif(st) : (o.motif || MOTIF), br = typeof o.bright === 'function' ? o.bright(st) : (o.bright ?? 1);
      add(dry, blip(cell[(s + (o.shift || 0)) % cell.length] + (o.up || 0), br), st, 0.062 * lvAt(o, st) * (s % 4 === 0 ? 1 : 0.7), o.pan ?? (s % 2 ? 0.06 : -0.06));
    });
  }
  // a narrow bed on the dry bus: the pad voices with the root added, folded to mono and darker; one pad per run of a chord
  function drone(t0, t1, o = {}) {
    const runs = [];
    for (const sp of spans(t0, t1)) { const r = runs[runs.length - 1]; if (r && r.ch === sp.ch && Math.abs(r.b - sp.a) < 1e-6) r.b = sp.b; else runs.push({ ...sp }); }
    for (const { a, b, ch } of runs) [...new Set([ch.r + 12, ...ch.v.slice(0, 3)])].forEach((m) => {
      const [L, R] = pad(m, b - a, typeof o.bright === 'function' ? o.bright(a) : (o.bright ?? 0.6), o.att ?? 0.35, o.rel ?? 0.6);
      for (let i = 0; i < L.length; i++) { const v = (L[i] + R[i]) * 0.5; L[i] = v; R[i] = v; }
      add(dry, [L, R], a, (o.g ?? 0.1) * lvAt(o, a));
    });
  }
  // the dry bus powers down at t: speed and pitch fall together over len while a low-pass closes, like a machine losing
  // power; nothing on the bus sounds after it (one per film). Put t where the act's last shot leaves the frame, a beat
  // before the brand, keep the dry layers running to t + len, and carry the bar with pads on V and leadIn.
  const downs = [];
  const powerDown = (t, len = 0.55) => { downs.push([t, len]); };
  // a snare roll swelling into t (16ths, 32nds in the last beat), a tom run on the last half beat
  function roll(t0, t, g = 0.13, toms = true, o = {}) {
    const bus = o.dry ? dry : drums;
    for (let x = t0; x < t - 1e-6; x += BEAT / 4) {
      const k = (x - t0) / (t - t0), v = 0.18 + 0.82 * k * k;
      add(bus, snare(v), x, g, 0.1);
      if (t - x <= BEAT + 1e-6) add(bus, snare(v * 0.8), x + BEAT / 8, g * 0.8, -0.1);
    }
    if (toms) [196, 164, 138, 110].forEach((f, i) => add(bus, tom(f), t - BEAT / 2 + i * BEAT / 8, 0.15 + i * 0.02, 0.4 - i * 0.25));
  }
  // arriving on a downbeat: a soft crash, the sub, a low hit — size 0.35 (a thesis) … 1.0 (the brand, the end card)
  function arrive(t, size = 0.5) { add(air, cymbal(3.4), t, 0.1 * size); add(music, sub(26 + keyShift, 1.4 + size, 0.02), t, 0.12 * size); add(music, impact(0.8 + 0.4 * size), t, 0.16 * size); marks.push(t); }
  // leading in: a reverse cymbal and a riser over the bar (or `len`) before t
  function leadIn(t, len = BAR, g = 1) { add(air, reverseCymbal(len), t - len, 0.085 * g); add(music, riser(len, 5200), t - len, 0.08 * g); }
  // a melody note, checked against the chord under it: chord tones, the 9th and the 6th pass; anything else is reported
  function melody(t, midi, o = {}) {
    const ch = chordAt(t + 1e-4), pc = (x) => ((x % 12) + 12) % 12, ok = new Set(ch.v.map(pc)); ok.add(pc(ch.r + 2)); ok.add(pc(ch.r + 9));
    if (!ok.has(pc(midi)) && !o.passing) warnings.push(`${t.toFixed(2)}s melody ${midi} over ${nameAt(t)}`);
    add(music, (o.inst || 'bell') === 'pluck' ? pluck(midi, o.bright ?? 0.9, o.dec ?? 7) : bell(midi, o.dur ?? 1.6, o.idx ?? 1.2), t, o.g ?? 0.05, o.pan ?? 0);
  }

  // ---------------------------------------------------------------- effects & master (as approved)
  function reverb([L, R], wet = 0.25, size = 0.84) {
    const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((n) => Math.round(n * SR / 44100)), aps = [556, 441, 341, 225].map((n) => Math.round(n * SR / 44100));
    const out = [new Float32Array(N), new Float32Array(N)];
    [L, R].forEach((x, ch) => {
      const spread = ch ? 23 : 0, cb = combs.map((n) => ({ buf: new Float32Array(n + spread), i: 0, f: 0 })), ab = aps.map((n) => ({ buf: new Float32Array(n + spread), i: 0 })), y = out[ch];
      for (let k = 0; k < N; k++) {
        const inp = x[k] * 0.015; let s = 0;
        for (const c of cb) { const o = c.buf[c.i]; c.f = o * 0.8 + c.f * 0.2; c.buf[c.i] = inp + c.f * size; c.i = (c.i + 1) % c.buf.length; s += o; }
        for (const a of ab) { const o = a.buf[a.i]; a.buf[a.i] = s + o * 0.5; a.i = (a.i + 1) % a.buf.length; s = o - s; }
        y[k] = s * wet * 3;
      }
    });
    return out;
  }
  function delay([L, R], time, fb, wet) {
    const d = Math.round(time * SR), oL = new Float32Array(N), oR = new Float32Array(N);
    for (let k = 0; k < N; k++) { const dl = k >= d ? oR[k - d] : 0, dr = k >= d ? oL[k - d] : 0; oL[k] = L[k] * 0.5 + dl * fb; oR[k] = R[k] * 0.5 + dr * fb; }
    for (let k = 0; k < N; k++) { L[k] += (oL[k] - L[k] * 0.5) * wet; R[k] += (oR[k] - R[k] * 0.5) * wet; }
  }
  function roomIR(len, bands, pre = 0.02, seedIR = 11) {
    const m = Math.floor(len * SR), out = [new Float32Array(m), new Float32Array(m)];
    let q = seedIR; const r = () => { q = (q * 1103515245 + 12345) >>> 0; return q / 4294967296 * 2 - 1; };
    for (let ch = 0; ch < 2; ch++) {
      const acc = new Float32Array(m);
      for (const [lo, hi, rt] of bands) {
        const nz = new Float32Array(m); for (let i = 0; i < m; i++) nz[i] = r();
        if (hi < 20000) biquad(nz, 'lp', hi, 0.707); if (lo > 0) biquad(nz, 'hp', lo, 0.707);
        for (let i = 0; i < m; i++) acc[i] += nz[i] * Math.exp(-6.91 * (i / SR) / rt);
      }
      const p0 = Math.round(pre * SR), rp = Math.round(0.05 * SR);
      for (let i = m - 1; i >= 0; i--) out[ch][i] = i < p0 ? 0 : acc[i - p0] * Math.min(1, (i - p0) / rp);
    }
    let e = 0; for (const c of out) for (let i = 0; i < m; i++) e += c[i] * c[i];
    const g = 1 / Math.sqrt(e / 2); for (const c of out) for (let i = 0; i < m; i++) c[i] *= g;
    return out;
  }
  function convolve(x, h) {
    const B = 65536, F = 262144, H = [new Float64Array(F), new Float64Array(F)], y = new Float32Array(N);
    for (let i = 0; i < h.length; i++) H[0][i] = h[i];
    fft(H[0], H[1]);
    const re = new Float64Array(F), im = new Float64Array(F);
    for (let s0 = 0; s0 < N; s0 += B) {
      re.fill(0); im.fill(0);
      for (let i = 0; i < B && s0 + i < N; i++) re[i] = x[s0 + i];
      fft(re, im);
      for (let k = 0; k < F; k++) { const a = re[k], b = im[k]; re[k] = a * H[0][k] - b * H[1][k]; im[k] = -(a * H[1][k] + b * H[0][k]); }
      fft(re, im);
      for (let i = 0; i < F && s0 + i < N; i++) y[s0 + i] += re[i] / F;
    }
    return y;
  }
  const rmsOf = ([L, R]) => { let e = 0; for (let k = 0; k < N; k++) e += L[k] * L[k] + R[k] * R[k]; return Math.sqrt(e / (2 * N)) + 1e-12; };
  const room = (bus, ir, matchTo) => { const w = [convolve(bus[0], ir[0]), convolve(bus[1], ir[1])], g = rmsOf(matchTo) / rmsOf(w); for (const c of w) for (let k = 0; k < N; k++) c[k] *= g; return w; };
  function writeWav(file, [L, R]) {
    const n = L.length, bytes = n * 8, b = Buffer.alloc(44 + bytes);
    b.write('RIFF', 0); b.writeUInt32LE(36 + bytes, 4); b.write('WAVE', 8); b.write('fmt ', 12);
    b.writeUInt32LE(16, 16); b.writeUInt16LE(3, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(SR, 24);
    b.writeUInt32LE(SR * 8, 28); b.writeUInt16LE(8, 32); b.writeUInt16LE(32, 34); b.write('data', 36); b.writeUInt32LE(bytes, 40);
    for (let k = 0; k < n; k++) { b.writeFloatLE(L[k], 44 + k * 8); b.writeFloatLE(R[k], 48 + k * 8); }
    fs.writeFileSync(file, b);
  }
  // mix the buses, room them, pump the music with the kicks, fade out by the last frame, write out/$OUT/music.wav, report.
  //   sections: [[name, t0, t1], …]  lines: [t, …] (chapter lines: the level 1 s before and after each is printed)
  //   into: [t, …] — the second before a line and the half second after, in quarter seconds (the breath after a power-down)
  function finish({ sections = [], lines = [], into = [] } = {}) {
    delay(music, BEAT * 0.75, 0.3, 0.28);
    const HALL = roomIR(2.8, [[0, 250, 2.3], [250, 1200, 2.0], [1200, 4500, 1.6], [4500, 20000, 1.0]]), ROOM = roomIR(1.1, [[0, 400, 0.9], [400, 3000, 0.75], [3000, 20000, 0.5]], 0.008, 23);
    const mr = room(music, HALL, reverb(music, 0.3)), dr = room(drums, ROOM, reverb(drums, 0.08, 0.7)), ar = room(air, HALL, reverb(air, 0.18));
    // the dry bus, when a film uses it: the power-down (a tape stop and a closing low-pass), then only a small room
    let xr = null;
    if (dry[0].some((v) => v !== 0)) {
      for (const [t, len] of downs) {
        const k0 = Math.round(t * SR), n = Math.round(len * SR);
        for (const x of dry) {
          const src = x.slice(k0, k0 + n); let pos = 0;
          for (let i = 0; i < n; i++) { const u = i / n, j = Math.floor(pos), f = pos - j; x[k0 + i] = (j + 1 < src.length ? src[j] * (1 - f) + src[j + 1] * f : 0) * (1 - u * u * u); pos += Math.pow(1 - u, 1.7); }
          x.fill(0, k0 + n);
          biquad(x, 'lp', 20000, 0.7, (tt) => (tt < t ? 20000 : 160 + 7000 * Math.pow(Math.max(0, 1 - (tt - t) / len), 2)));
        }
      }
      xr = room(dry, roomIR(0.4, [[0, 400, 0.3], [400, 3000, 0.22], [3000, 20000, 0.14]], 0.004, 31), reverb(dry, 0.07, 0.5));
    }
    const pump = new Float32Array(N).fill(1);
    for (const t of kicks) { const k0 = Math.round(t * SR); for (let i = 0; i < 0.28 * SR; i++) { const k = k0 + i; if (k < N) pump[k] = Math.min(pump[k], 1 - 0.24 * Math.exp(-i / SR * 14)); } }
    const DONE = Math.round(DONE_T * SR), fade = (k) => Math.max(0, Math.min(1, k / (0.25 * SR), (DONE - k) / ((opts.fadeOut || 2.2) * SR)));
    const out = [new Float32Array(N), new Float32Array(N)], MG = db(-6), DG = db(-5), AG = db(-6), XG = db(opts.dryGain ?? -2);
    for (let ch = 0; ch < 2; ch++) for (let k = 0; k < N; k++) out[ch][k] = ((music[ch][k] + mr[ch][k]) * MG * pump[k] + (drums[ch][k] + dr[ch][k]) * DG + (air[ch][k] + ar[ch][k] * 0.6) * AG + (xr ? (dry[ch][k] + xr[ch][k] * 0.8) * XG : 0)) * fade(k);
    biquad(out[0], 'hp', 30, 0.7); biquad(out[1], 'hp', 30, 0.7);
    let peak = 0; for (let ch = 0; ch < 2; ch++) for (let k = 0; k < N; k++) peak = Math.max(peak, Math.abs(out[ch][k]));
    const pre = Math.min(1.4, 0.9 / Math.max(peak, 1e-6));
    for (let ch = 0; ch < 2; ch++) for (let k = 0; k < N; k++) { const x = out[ch][k] * pre; out[ch][k] = Math.tanh(x * 1.1) / 1.1; }
    const OUTDIR = path.join(DIR, 'out', OUTNAME); fs.mkdirSync(OUTDIR, { recursive: true });
    writeWav(path.join(OUTDIR, 'music.wav'), out);
    const rms = (a, b) => { let s = 0, n = 0; for (let k = Math.max(0, Math.round(a * SR)); k < Math.min(N, Math.round(b * SR)); k++) { s += out[0][k] ** 2 + out[1][k] ** 2; n += 2; } return 10 * Math.log10(s / Math.max(1, n) + 1e-12); };
    console.log(`music.wav ${END.toFixed(1)}s · peak before limiter ${peak.toFixed(2)} · gain ${pre.toFixed(2)} · arrivals ${marks.map((t) => t.toFixed(1)).join(', ')} · kicks ${kicks.length}`);
    if (sections.length) console.log(sections.map(([n, a, b]) => `${n} ${rms(a, b).toFixed(1)}`).join(' · '));
    if (lines.length) console.log('across the lines (1 s before → 1 s after, dB): ' + lines.map((t) => `${t.toFixed(1)}: ${rms(t - 1, t).toFixed(1)} → ${rms(t, t + 1).toFixed(1)}`).join(' · '));
    for (const t of into) console.log(`into ${t.toFixed(1)} (dB per 0.25 s from ${(t - 1).toFixed(2)}): ` + Array.from({ length: 6 }, (_, i) => rms(t - 1 + i * 0.25, t - 0.75 + i * 0.25).toFixed(1)).join(' '));
    const onGrid = marks.filter((t) => Math.abs(t / BAR - Math.round(t / BAR)) > 1e-3);
    if (onGrid.length) console.log('⚠ arrivals off the bar grid: ' + onGrid.map((t) => t.toFixed(2)).join(', '));
    if (warnings.length) console.log('⚠ melody over a clashing chord: ' + warnings.join(' · '));
    return out;
  }

  return { SR, BEAT, BAR, END, DONE_T, events, cues, at, music, drums, air, dry, add, mtof, db, rnd, ramp, biquad,
    pad, pluck, bassNote, sub, kick, hat, clap, bell, riser, impact, cymbal, reverseCymbal, snare, tom, shaker, blip, tick, tightKick,
    V, setKey, chart, push, chordAt, nameAt, spans, pads, grid, arp, bass, subs, kit, heartbeat, roll, arrive, leadIn, melody,
    MOTIF, seq, drone, powerDown, kicks, finish };
}
