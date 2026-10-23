// Score for AI + NocoBase · v2 · one business system's year (141 s, 120 BPM, one piece centred on D; DIRECTION.md §4).
// The opening (AI writes code fast; a system has to last a year) runs on the dry bus — a narrow drone, a clock, the machine's
// motif D C A B♭ — racing while the terminal writes, thinning as the year line draws, gaining a layer with every request
// that lands on it, rising onto the dominant under the second half of the line, then a power-down a beat before the brand.
// NocoBase lands in D major on the downbeat with the motif's major form on the bells (D C# A B). Act one (day one, Core):
// D · A/C# · Bm · G, the code landing on the foundation; the two proofs in Bm colour; then the capability board that sums
// them up, on IV and ii with a pluck for every card that switches on, climbing, the whole board landing on I, its line and
// v1.0 on IV, V into act two. Act two (every change, Studio): the console's medium groove on D · G · Bm · A, the task page thickening
// while agents work in parallel, the arpeggio stepping out while a review asks for a change and back when it is fixed, a
// bell on the approval, a rising bell note on every version that lands; the project memory lighter, a soft pluck for every
// card and two bells as the next task reads them. Act three (the years after): half-time, wide pads, whole-note bass,
// one hit as Core 3.1 lands; the year's count lifting into the recap, three bells on its columns, the end card on Dmaj9.
// Every section is led in from the bar before and lands on its downbeat. Cue times come from the page (out/$OUT/events.json).
import { createScore } from './score-kit.mjs';
const S = createScore();
const BAR = S.BAR, BEAT = S.BEAT, R = S.ramp;
const C = {
  brand: S.at('brand'), a1: S.at('a1'), core: S.at('core'), slab: S.at('slab'), wall: S.at('wall'), wRev: S.at('wRev'), p2: S.at('p2'), p3: S.at('p3'), v10: S.at('v10'),
  a2: S.at('a2'), studio: S.at('studio'), c1: S.at('c1'), c2: S.at('c2'), review: S.at('review'), fixed: S.at('fixed'), c3: S.at('c3'), c4: S.at('c4'),
  live: S.at('live'), mont: S.at('mont'), mem: S.at('mem'), a3: S.at('a3'), up: S.at('up'), hand: S.at('hand'), yr: S.at('yr'), recap: S.at('recap'), end: S.at('end'), done: S.DONE_T,
};
const CHIP = S.cues('chip').map((c) => c.t), PD = C.brand - 1.0;   // the year's requests, and the power-down a beat before the base

// ---------------------------------------------------------------- the chart
S.chart(0, 'Dm', 'Dm', 'Bb', 'C');                        // 0–8    the terminal, the line, the year draws
S.chart(8, 'A'); S.push(10, 'A7b9');                       // 8–12   the dominant under "但企业要的是长期可靠的系统"
S.chart(C.brand, 'Dadd9', 'AC', 'Bm', 'G');                // 12–20  brand, the line, the division of work
S.chart(C.a1, 'D', 'AC');                                  // 20–24  day one's request
S.chart(C.core, 'D', 'AC', 'Bm', 'G');                     // 24–32  Core: the code lands on the foundation
S.chart(C.p2, 'Bm', 'G', 'D');                             // 32–38  permissions
S.chart(C.p3, 'Bm', 'G', 'A');                             // 38–44  approval; V into the board
S.chart(C.wall, 'G', 'Em', 'D', 'G', 'A');                 // 44–54  the board: cards on IV and ii, the whole board on I, its line and v1.0 on IV, V into act two
S.chart(C.a2, 'D'); S.chart(C.studio, 'D', 'AC');          // 54–60  Studio
for (let t = C.c1; t < C.a3 - 1e-6; t += 4 * BAR) S.chart(t, 'D', 'G', 'Bm', 'A');   // 60–108 the console, the versions, the memory
S.chart(C.a3, 'G', 'D', 'Bm', 'A', 'G', 'D', 'Em', 'As', 'G', 'A');                    // 108–128 the years after
S.chart(C.recap, 'Dadd9', 'G', 'A');                       // 128–134 the recap
S.push(C.end, 'Dmaj9');                                    // 134–    the end card

// ---------------------------------------------------------------- the opening: the dry bus
S.drone(0, PD + 0.55, { g: 0.14, att: 0.6, bright: R(0, PD, 0.45, 0.85) });
S.kit(0.3, PD, { dry: true, tick: true });
S.subs(0, PD + 0.55, 0.07, { dry: true });
const motif = (t) => (t >= 8 ? [69, 67, 64, 65] : S.MOTIF);   // A G E F on the dominant
// the terminal writes: the machine races, then steps back with it
S.seq(0.6, 4.0, { bright: R(0.6, 3.5, 0.4, 0.95), motif });
S.kit(1.6, 3.9, { dry: true, hat: 16, lvl: 0.8 });
S.bass(1.6, 3.9, { dry: true, len: 0.12, lvl: 0.85 });
S.seq(4.0, PD + 0.55, { bright: R(4, PD, 0.3, 0.7), lvl: R(4, PD, 0.5, 0.8), motif });
S.bass(4.6, PD + 0.55, { dry: true, half: true, lvl: 0.7 });
// every request that lands on the year adds a layer
S.kit(CHIP[0], PD, { dry: true, kick: 2, lvl: 0.75 });
S.kit(CHIP[1], PD, { dry: true, hat: 8, lvl: 0.7 });
S.seq(CHIP[3], PD + 0.55, { up: 12, shift: 2, bright: 0.55, lvl: 0.55, motif });
S.kit(CHIP[5], PD, { dry: true, clap: true, lvl: 0.7 });
S.bass(CHIP[6], PD + 0.55, { dry: true, len: 0.12, oct: true, lvl: 0.8 });
S.roll(PD - 1.5, PD + 0.5, 0.1, false, { dry: true });
// the power-down; under it the dominant's wide pad rises with a swell, no gap before the brick lands
S.powerDown(PD, 0.55);
S.pads(8.6, C.brand, { g: 0.18, att: 1.0 });
S.leadIn(C.brand, BAR, 1.5);

// ---------------------------------------------------------------- brand: D major from the downbeat; the division of work
S.arrive(C.brand, 1.0);
[[74, 0.02], [73, 0.52], [69, 1.02], [71, 1.52]].forEach(([m, d], j) => S.melody(C.brand + d, m, { g: 0.06, pan: j % 2 ? 0.3 : -0.3, passing: m === 73 }));
S.pads(C.brand, C.a1 - 2, { g: 0.1, att: 0.3, bright: R(C.brand, C.a1, 0.8, 1.0) });
S.subs(C.brand, C.a1, 0.08);
S.bass(C.brand + BAR, C.a1 - 2, { lvl: R(C.brand, C.a1, 0.6, 0.85) });
S.kit(C.brand + 2 * BAR, C.a1 - 2, { hat: 8, lvl: 0.7 });
S.arp(C.brand + 2 * BAR, C.a1 - 2, { every: 8, lvl: R(C.brand, C.a1, 0.45, 0.8), bright: 0.9 });
S.cues('role').forEach((c, i) => S.melody(c.t, [78, 81, 86][i], { g: 0.04, pan: [-0.3, 0, 0.3][i] }));
// into act one: IV, a roll and a swell; the groove runs to the downbeat
S.pads(C.a1 - 2, C.a1, { g: 0.1, bright: 1.05 });
S.bass(C.a1 - 2, C.a1 - 0.01, { lvl: 0.9 });
S.kit(C.a1 - 2, C.a1 - 0.01, { kick: 4, hat: 16, lvl: 0.85 });
S.roll(C.a1 - 2, C.a1, 0.1);
S.leadIn(C.a1, BAR, 0.9);

// ---------------------------------------------------------------- act one · day one: the request, then Core
S.arrive(C.a1, 0.5);
S.pads(C.a1, C.core, { g: 0.09 });
S.subs(C.a1, C.core, 0.07);
S.bass(C.a1, C.core - 2, { half: true, lvl: 0.8 });
S.kit(C.a1, C.core - 2, { hat: 8, lvl: 0.6 });
S.arp(C.a1, C.core - 2, { every: 8, lvl: 0.6 });
S.kit(C.core - 2, C.core - 0.01, { kick: 4, hat: 16, lvl: 0.85 });
S.roll(C.core - 2, C.core, 0.1);
S.leadIn(C.core, BAR, 1.0);
S.arrive(C.core, 0.6);
S.pads(C.core, C.p2 - 2, { g: 0.1 });
S.subs(C.core, C.p2, 0.08);
S.bass(C.core, C.p2 - 0.01, { lvl: 0.9 });
S.kit(C.core, C.p2 - 0.01, { kick: 4, hat: 8, lvl: 0.9 });
S.kit(C.slab, C.p2 - 0.01, { clap: true, lvl: 0.85 });
S.arp(C.core, C.p2, { every: 8, lvl: 0.8 });
S.melody(C.slab, 78, { g: 0.05 });   // the code lands on the foundation: F#5 on Bm
S.pads(C.p2 - 2, C.p2, { g: 0.1, bright: 1.1 });
S.roll(C.p2 - 2, C.p2, 0.12);
S.leadIn(C.p2, BAR, 0.8);

// the proofs: Bm colour, thinner while the titles read
S.arrive(C.p2, 0.5);
S.pads(C.p2, C.wall - 2, { g: 0.09, bright: 0.9 });
S.subs(C.p2, C.wall, 0.07);
S.bass(C.p2, C.wall - 2, { half: true, lvl: 1.0 });
S.heartbeat(C.p2, C.wall - 2);
S.kit(C.p2, C.wall - 2, { hat: 8, shaker: true, lvl: 0.72 });
S.kit(C.p3, C.wall - 2, { rim: true, kick: 2, lvl: 0.7 });
S.arp(C.p2, C.wall - 2, { every: 8, lvl: 0.7, bright: 0.9 });
for (const t of [C.p2, C.p3]) [[74, 0], [73, 0.5], [69, 1.0], [71, 1.5]].forEach(([m, d], j) => S.melody(t + d, m, { g: 0.035, pan: j % 2 ? 0.35 : -0.35, passing: true }));
// V into the board: the bar before builds
S.pads(C.wall - 2, C.wall, { g: 0.1, bright: 1.1 });
S.bass(C.wall - 2, C.wall - 0.01, { lvl: 0.95 });
S.kit(C.wall - 2, C.wall - 0.01, { kick: 4, hat: 16, lvl: 0.9 });
S.roll(C.wall - 2, C.wall, 0.12);
S.leadIn(C.wall, BAR, 0.9);

// the capability board: while the cards switch on, the plucks are the arpeggio — one per card, chord tones climbing column
// by column (rows panned left to right); a bell when the count turns 20+; then the whole board on I, the widest moment of act
// one, running on under the line and v1.0 (a bar on IV) into act two
S.arrive(C.wall, 0.6);
S.pads(C.wall, C.wRev, { g: 0.1, bright: 1.05 });
S.subs(C.wall, C.a2, 0.08);
S.bass(C.wall, C.wRev - 0.01, { lvl: 0.9 });
S.kit(C.wall, C.wRev - 0.01, { kick: 4, hat: 8, lvl: 0.85 });
S.cues('cap').forEach((c, i) => {
  const pcs = new Set(S.chordAt(c.t + 1e-4).v.map((m) => m % 12)), tones = [];
  for (let m = 67; m <= 93; m++) if (pcs.has(m % 12)) tones.push(m);
  const col = Math.floor(i / 4), row = i % 4;
  S.melody(c.t, tones[Math.min(tones.length - 1, col + row)], { inst: 'pluck', g: 0.04 + 0.0006 * i, pan: [-0.35, -0.12, 0.12, 0.35][row] });
  if (i === 20) S.melody(c.t, 88, { g: 0.05 });   // 20+
});
S.roll(C.wRev - 1, C.wRev, 0.1);
S.leadIn(C.wRev, BAR, 0.8);
S.arrive(C.wRev, 0.8);
S.pads(C.wRev, C.a2, { g: 0.12, bright: 1.2, up: 12 });
S.pads(C.wRev, C.a2, { g: 0.08, bright: 1.0 });
S.bass(C.wRev, C.a2 - 0.01, { lvl: 0.95, oct: true });
S.kit(C.wRev, C.a2 - 0.01, { kick: 4, hat: 16, clap: true, lvl: 0.9 });
S.arp(C.wRev, C.a2 - 2, { lvl: 0.8, up: 12 });
S.melody(C.wRev, 90, { g: 0.05 });   // the whole board: F#6 on D
S.melody(C.v10, 86, { g: 0.06 });   // v1.0 is live
// V into act two, under the line
S.roll(C.a2 - 2, C.a2, 0.12);
S.leadIn(C.a2, BAR, 1.0);

// ---------------------------------------------------------------- act two · every change: Studio, then the console
S.arrive(C.a2, 0.6);
S.pads(C.a2, C.a3 - 2, { g: 0.09 });
S.subs(C.a2, C.a3 - 2, 0.07);
S.bass(C.a2, C.c1 - 0.01, { half: true, lvl: 0.8 });
S.kit(C.a2, C.c1 - 0.01, { kick: 2, hat: 8, lvl: 0.75 });
S.arp(C.a2, C.c1, { every: 8, lvl: 0.7 });
S.arrive(C.studio, 0.5);
S.leadIn(C.c1, BAR, 0.8);
S.arrive(C.c1, 0.4);
S.bass(C.c1, C.a3 - 2, { lvl: 0.85 });
S.kit(C.c1, C.a3 - 2, { kick: 4, hat: 8, lvl: 0.8 });
S.arp(C.c1, C.review, { every: 8, lvl: 0.72 });
S.arp(C.fixed, C.a3 - 2, { every: 8, lvl: 0.72 });   // the arpeggio steps out while the review asks for a change
// the task page: the grid thickens while two agents work in parallel through the night
S.kit(C.c2 + 0.5, C.c3, { hat: 16, shaker: true, lvl: 0.68 });
S.arp(C.c2 + 0.5, C.review, { lvl: 0.5, up: 12, bright: 0.9 });
// before every page slide, a reverse cymbal
for (const t of [C.c2, C.c3, C.c4, C.mem]) S.add(S.air, S.reverseCymbal(BEAT), t - BEAT, 0.06);
// production goes live: a bell
S.melody(C.live, 86, { g: 0.07 });
S.melody(C.live + 0.25, 90, { g: 0.05, pan: 0.2 });
// the versions: the groove fills out, and a rising bell for each version that lands
S.kit(C.mont, C.mem - 0.01, { hat: 16, clap: true, lvl: 0.8 });
S.arp(C.mont, C.mem, { lvl: 0.6, up: 12 });
S.cues('ver').forEach((c, i) => S.melody(c.t, [81, 83, 86, 90, 95][i], { g: 0.045, pan: i % 2 ? 0.25 : -0.25 }));
// the project memory: the groove lightens to let it read; a soft pluck for every card, two bells as the next task reads them
S.arrive(C.mem, 0.4);
S.kit(C.mem, C.a3 - 2, { hat: 8, shaker: true, lvl: 0.72 });
S.cues('memc').forEach((c, i) => {
  const pcs = new Set(S.chordAt(c.t + 1e-4).v.map((m) => m % 12)), tones = [];
  for (let m = 69; m <= 90; m++) if (pcs.has(m % 12)) tones.push(m);
  S.melody(c.t, tones[Math.min(tones.length - 1, i)], { inst: 'pluck', g: 0.035, pan: i % 2 ? 0.3 : -0.3 });
});
S.cues('memu').forEach((c, i) => S.melody(c.t, [86, 90][i], { g: 0.05, pan: i ? 0.25 : -0.25 }));
// into act three: IV → V, a roll
S.pads(C.a3 - 2, C.a3, { g: 0.1, bright: 1.1 });
S.bass(C.a3 - 2, C.a3 - 0.01, { lvl: 0.9 });
S.kit(C.a3 - 2, C.a3 - 0.01, { kick: 4, hat: 16, lvl: 0.85 });
S.roll(C.a3 - 2, C.a3, 0.11);
S.leadIn(C.a3, BAR, 1.0);

// ---------------------------------------------------------------- act three · the years after: half-time and wide
S.arrive(C.a3, 0.7);
S.pads(C.a3, C.recap - 2, { g: 0.11, bright: R(C.a3, C.recap, 0.95, 1.2) });
S.pads(C.a3, C.recap - 2, { g: 0.06, bright: 1.0, up: 12 });
S.subs(C.a3, C.recap, 0.08);
S.bass(C.a3, C.recap - 2, { whole: true, lvl: 0.85 });
S.heartbeat(C.a3, C.recap - 2, 0.18);
S.kit(C.a3 + BAR, C.recap - 2, { hat: 8, lvl: R(C.a3, C.recap, 0.5, 0.8) });
S.arp(C.a3, C.recap - 2, { every: 8, lvl: R(C.a3, C.recap, 0.55, 0.85), bright: 0.95 });
S.melody(C.up, 81, { g: 0.06 }); S.melody(C.up + 0.25, 86, { g: 0.045, pan: 0.2 });   // Core 3.1 lands
for (const t of [C.hand, C.yr]) [[74, 0], [73, 0.5], [69, 1.0], [71, 1.5]].forEach(([m, d], j) => S.melody(t + d, m, { g: 0.035, pan: j % 2 ? 0.3 : -0.3, passing: true }));
S.kit(C.yr, C.recap - 2, { kick: 2, lvl: 0.7 });
// into the recap: the dominant, a roll
S.pads(C.recap - 2, C.recap, { g: 0.1, bright: 1.15 });
S.bass(C.recap - 2, C.recap - 0.01, { lvl: 0.9 });
S.kit(C.recap - 2, C.recap - 0.01, { kick: 4, hat: 16, lvl: 0.8 });
S.roll(C.recap - 2, C.recap, 0.1);
S.leadIn(C.recap, BAR, 0.8);

// ---------------------------------------------------------------- the recap: the drums leave, three bells, the bass walks home
S.arrive(C.recap, 0.5);
S.pads(C.recap, C.end, { g: 0.13, bright: R(C.recap, C.end, 1.0, 1.2) });
S.arp(C.recap, C.end - 2, { every: 8, lvl: 0.7, up: 12 });
S.subs(C.recap, C.end, 0.07);
S.bass(C.recap, C.end - 2, { whole: true, lvl: 0.8 });
S.cues('col').forEach((c, i) => S.melody(c.t, [86, 90, 93][i], { g: 0.05, pan: [-0.3, 0, 0.3][i] }));
[33, 35, 37, 38].forEach((m, i) => S.add(S.music, S.bassNote(m, BEAT * 0.9, 1.3), C.end - 2 + i * BEAT + 0.01, 0.3));
S.roll(C.end - 1, C.end, 0.08, false);
S.leadIn(C.end, BAR, 1.0);

// ---------------------------------------------------------------- the end card: Dmaj9, three bells, a long tail
S.arrive(C.end, 1.0);
S.pads(C.end, C.end + 4.5, { g: 0.1, att: 0.05, bright: 1.0, rel: 3.2 });
S.add(S.music, S.bassNote(26, 3.0, 1.0), C.end + 0.01, 0.26);
[[86, 0.02, 0.09, 0.2], [93, 0.32, 0.06, -0.2], [90, 0.62, 0.045, 0.1]].forEach(([m, d, g, p]) => S.add(S.music, S.bell(m, 5), C.end + d, g, p));

S.finish({
  sections: [['opening', 0, PD], ['brand', C.brand, C.a1], ['day one', C.a1, C.core], ['Core', C.core, C.p2], ['proofs', C.p2, C.wall], ['wall', C.wall, C.a2],
    ['Studio', C.a2, C.c1], ['console', C.c1, C.mont], ['versions', C.mont, C.mem], ['memory', C.mem, C.a3], ['years after', C.a3, C.recap], ['recap', C.recap, C.end], ['end', C.end, C.done]],
  lines: [C.brand, C.a1, C.core, C.p2, C.wall, C.a2, C.c1, C.mem, C.a3, C.recap, C.end],
  into: [C.brand],
});
