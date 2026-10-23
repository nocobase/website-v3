// Measure sound-effect files: where the sound starts, where it is loudest, how long it rings, how bright and how heavy.
// Every file is decoded by ffmpeg to 48 kHz stereo float. The numbers set each cue's sync offset (click-type sounds line up
// their onset with the action, whooshes and hits their loudest point) and its gain in the mix (mix.mjs).
//   node tools/sfx-scan.mjs [file …]          print a table (default: every file under audio/sfx)
//   node tools/sfx-scan.mjs --json out.json   also write the measurements
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fft } from './fft.mjs';

export const SR = 48000;
const dbf = (x) => 20 * Math.log10(Math.max(x, 1e-9));

export function decode(file) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg failed on ${file}: ${r.stderr}`);
  const f = new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length));
  const n = f.length / 2, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = f[2 * i]; R[i] = f[2 * i + 1]; }
  return [L, R];
}

export function measure([L, R]) {
  const n = L.length;
  let peak = 0, peakAt = 0;
  for (let i = 0; i < n; i++) { const a = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (a > peak) { peak = a; peakAt = i; } }
  const W = Math.round(SR * 0.005), env = [];  // 5 ms RMS envelope
  for (let i = 0; i + W <= n; i += W) { let s = 0; for (let k = i; k < i + W; k++) s += (L[k] * L[k] + R[k] * R[k]) / 2; env.push(Math.sqrt(s / W)); }
  const emax = Math.max(...env), eAt = env.indexOf(emax);
  const onset = Math.max(0, env.findIndex((e) => e > emax * 0.1));        // first 5 ms within 20 dB of the loudest
  let end = env.length - 1; while (end > 0 && env[end] < emax * 0.01) end--; // last 5 ms within 40 dB
  let d20 = eAt; while (d20 < env.length && env[d20] > emax * 0.1) d20++;
  // brightness and weight over 4096 samples from the onset
  const N = 4096, re = new Float64Array(N), im = new Float64Array(N), o = onset * W;
  for (let k = 0; k < N; k++) { const i = o + k, w = 0.5 - 0.5 * Math.cos(2 * Math.PI * k / (N - 1)); re[k] = i < n ? ((L[i] + R[i]) / 2) * w : 0; }
  fft(re, im);
  let num = 0, den = 0, low = 0;
  for (let b = 1; b < N / 2; b++) { const m = re[b] * re[b] + im[b] * im[b], f = b * SR / N; num += f * m; den += m; if (f < 150) low += m; }
  let s = 0, c = 0;
  for (let i = onset * W; i < Math.min(n, (end + 1) * W); i++) { s += (L[i] * L[i] + R[i] * R[i]) / 2; c++; }
  return { dur: n / SR, peakDb: dbf(peak), peakT: peakAt / SR, onsetT: onset * W / SR, loudT: eAt * W / SR, endT: (end + 1) * W / SR,
    decay20: (d20 - eAt) * W / SR, rmsDb: dbf(Math.sqrt(s / Math.max(c, 1))), centroid: den ? num / den : 0, lowShare: den ? low / den : 0 };
}

const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), ji = args.indexOf('--json'), json = ji >= 0 ? args.splice(ji, 2)[1] : null;
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : /\.(wav|ogg|mp3)$/i.test(e.name) && !/preview/i.test(e.name) ? [path.join(d, e.name)] : []);
  const files = args.length ? args : walk(path.join(DIR, 'audio/sfx')).sort();
  const out = {};
  console.log('file'.padEnd(44) + 'dur    peak   rms   onset  loud   end    dec20  centroid  low%');
  for (const f of files) {
    const m = measure(decode(f)), k = path.relative(path.join(DIR, 'audio/sfx'), f);
    out[k] = m;
    console.log(k.padEnd(44) + [m.dur.toFixed(2), m.peakDb.toFixed(1).padStart(5), m.rmsDb.toFixed(1).padStart(5), m.onsetT.toFixed(3), m.loudT.toFixed(3), m.endT.toFixed(2).padStart(5),
      m.decay20.toFixed(3), String(Math.round(m.centroid)).padStart(6), (m.lowShare * 100).toFixed(0).padStart(5)].join('  '));
  }
  if (json) fs.writeFileSync(json, JSON.stringify(out, null, 1));
}
