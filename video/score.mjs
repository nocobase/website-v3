// Score for AI + NocoBase · v3.1 (118 s, 120 BPM, one piece centred on D; DIRECTION.md §4).
// The opening and the four problems run on the dry bus: a narrow drone, a clock, the machine's motif D C A B♭, racing while
// the terminal writes; under the problems (D minor, B♭, G minor, A) a layer joins with every problem, the groove tightening
// as the work piles up; the whole line rises onto the dominant, then a power-down a beat before the brick lands.
// NocoBase lands in D major on the downbeat with the motif's major form on the bells (D C# A B). Core: D · A/C# · Bm · G,
// the code landing on the foundation, the three modules dropping into one structure on Bm colour; a bell for each problem
// solved. Studio: its chapter, then the console's medium groove on D · G · Bm · A, thickening while the agents work through
// the night, the arpeggio stepping out while a review asks for a change; a bell when production goes live; the project memory
// lighter, a soft pluck for every card. The year: half-time and wide, a pluck for every request on the line, the end card on
// Dmaj9. Every section is led in from the bar before and lands on its downbeat. Cue times come from the page (out/$OUT/events.json).
import { createScore } from './score-kit.mjs';
const S = createScore();
const BAR = S.BAR, BEAT = S.BEAT, R = S.ramp;
const C = {
  type: S.at('type'), enter: S.at('enter'), run: S.at('run1'), pull: S.at('pull'),
  prob: S.at('problems'), tB: S.at('tB'), brand: S.at('brand'), core: S.at('core'), slab: S.at('slab'), p2: S.at('p2'), p3: S.at('p3'), wall: S.at('wall'), wRev: S.at('wRev'),
  arch: S.at('arch'), grid1: S.at('grid1'),
  studio: S.at('studio'), c1: S.at('c1'), c2: S.at('c2'), review: S.at('review'), fixed: S.at('fixed'), c3: S.at('c3'), live: S.at('live'), c4: S.at('c4'),
  grid2: S.at('grid2'), yr: S.at('yr'), end: S.at('end'), done: S.DONE_T,
};
const PROB = S.cues('prob').map((c) => c.t), PD = C.brand - 1.0;   // the four problems, and the power-down a beat before the brick

// ---------------------------------------------------------------- the chart
S.chart(0, 'Dm', 'Bb', 'C');                                               // 0–6     the question, the terminal, "AI 写代码很快，"
S.chart(C.prob, 'Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'Gm', 'A', 'Bb');        // 6–24    the four problems (4.5 s each, across the bars)
S.chart(C.tB, 'A', 'A', 'A'); S.push(C.tB + 2, 'A7b9');                    // 24–30   the whole line on the dominant, the power-down
S.chart(C.brand, 'Dadd9', 'AC', 'Bm', 'G');                                // 30–38   brand, the definition, the division of work
S.chart(C.core, 'D', 'AC', 'G');                                           // 38–44   Core: the code lands on the foundation
S.chart(C.p2, 'Bm', 'G', 'D', 'Bm', 'A');                                  // 44–54   permissions, then approval from 49 (mid-bar); V into the board
S.chart(C.wall, 'G', 'Em'); S.push(C.wRev, 'D');                           // 54–62   the board: cards on IV and ii, the whole board on I (57, beat 3),
S.push(C.wRev + 2, 'G'); S.push(C.arch - 1, 'A');                          //         its line on IV, V
S.chart(C.arch, 'Bm', 'G', 'D', 'A');                                      // 62–70   one structure for every agent
S.chart(C.grid1, 'D', 'A');                                                // 70–74   the first two problems solved
S.chart(C.studio, 'D', 'AC');                                              // 74–78   Studio
for (let t = C.c1; t < C.grid2 - 1e-6; t += 3 * BAR) S.chart(t, 'D', 'G', 'A');   // 78–102 the console, a page every three bars
S.chart(C.grid2, 'G', 'A');                                                // 102–106 the other two solved
S.chart(C.yr, 'G', 'D', 'A');                                              // 106–112 the year
S.push(C.end, 'Dmaj9');                                                    // 112–    the end card

// ---------------------------------------------------------------- the opening and the four problems: the dry bus
S.drone(0, PD + 0.55, { g: 0.14, att: 0.6, bright: R(0, PD, 0.45, 0.9) });
S.kit(0.3, PD, { dry: true, tick: true });
S.subs(0, PD + 0.55, 0.07, { dry: true });
const motif = (t) => (t >= C.tB ? [69, 67, 64, 65] : S.MOTIF);   // A G E F on the dominant
// the terminal writes: the machine races, then steps back with it
S.seq(C.type, C.pull, { bright: R(C.type, C.run, 0.4, 0.95), motif });
S.kit(C.enter, C.pull, { dry: true, hat: 16, lvl: 0.8 });
S.bass(C.enter, C.pull, { dry: true, len: 0.12, lvl: 0.85 });
S.seq(C.pull, PD + 0.55, { bright: R(C.pull, PD, 0.3, 0.75), lvl: R(C.pull, PD, 0.5, 0.85), motif });
// every problem adds a layer: the work piles up
S.bass(PROB[0], PD + 0.55, { dry: true, half: true, lvl: 0.75 });
S.kit(PROB[0], PD, { dry: true, kick: 2, lvl: 0.75 });
S.kit(PROB[1], PD, { dry: true, hat: 8, lvl: 0.7 });
S.seq(PROB[2], PD + 0.55, { up: 12, shift: 2, bright: 0.55, lvl: 0.55, motif });
S.kit(PROB[2], PD, { dry: true, hat: 16, lvl: 0.6 });
S.kit(PROB[3], PD, { dry: true, clap: true, lvl: 0.7 });
S.bass(PROB[3], PD + 0.55, { dry: true, len: 0.12, oct: true, lvl: 0.8 });
// the whole line: the dominant's wide pad rises with a swell, a roll, the power-down, no gap before the brick lands
S.pads(C.tB + 0.6, C.brand, { g: 0.18, att: 1.0 });
S.roll(PD - 1.5, PD + 0.5, 0.1, false, { dry: true });
S.powerDown(PD, 0.55);
S.leadIn(C.brand, BAR, 1.5);

// ---------------------------------------------------------------- brand: D major from the downbeat; the division of work
S.arrive(C.brand, 1.0);
[[74, 0.02], [73, 0.52], [69, 1.02], [71, 1.52]].forEach(([m, d], j) => S.melody(C.brand + d, m, { g: 0.06, pan: j % 2 ? 0.3 : -0.3, passing: m === 73 }));
S.pads(C.brand, C.core - 2, { g: 0.1, att: 0.3, bright: R(C.brand, C.core, 0.8, 1.0) });
S.subs(C.brand, C.core, 0.08);
S.bass(C.brand + BAR, C.core - 2, { lvl: R(C.brand, C.core, 0.6, 0.85) });
S.kit(C.brand + 2 * BAR, C.core - 2, { hat: 8, lvl: 0.7 });
S.arp(C.brand + 2 * BAR, C.core - 2, { every: 8, lvl: R(C.brand, C.core, 0.45, 0.8), bright: 0.9 });
S.cues('role').forEach((c, i) => S.melody(c.t, [78, 81, 86][i], { g: 0.04, pan: [-0.3, 0, 0.3][i] }));
// into Core: IV, a roll and a swell; the groove runs to the downbeat
S.pads(C.core - 2, C.core, { g: 0.1, bright: 1.05 });
S.bass(C.core - 2, C.core - 0.01, { lvl: 0.9 });
S.kit(C.core - 2, C.core - 0.01, { kick: 4, hat: 16, lvl: 0.85 });
S.roll(C.core - 2, C.core, 0.1);
S.leadIn(C.core, BAR, 1.0);

// ---------------------------------------------------------------- Core: the foundation, two capabilities, the board, one structure
S.arrive(C.core, 0.6);
S.pads(C.core, C.p2 - 2, { g: 0.1 });
S.subs(C.core, C.grid1, 0.08);
S.bass(C.core, C.p2 - 0.01, { lvl: 0.9 });
S.kit(C.core, C.p2 - 0.01, { kick: 4, hat: 8, lvl: 0.9 });
S.kit(C.slab, C.p2 - 0.01, { clap: true, lvl: 0.85 });
S.arp(C.core, C.p2, { every: 8, lvl: 0.8 });
S.melody(C.slab, 78, { g: 0.05 });   // the code lands on the foundation: F#5 on Bm
S.pads(C.p2 - 2, C.p2, { g: 0.1, bright: 1.1 });
S.roll(C.p2 - 2, C.p2, 0.12);
S.leadIn(C.p2, BAR, 0.8);
// the two capabilities: Bm colour, thinner while the titles read
S.arrive(C.p2, 0.5);
S.pads(C.p2, C.wall - 2, { g: 0.09, bright: 0.9 });
S.bass(C.p2, C.wall - 2, { half: true, lvl: 1.0 });
S.heartbeat(C.p2, C.wall - 2);
S.kit(C.p2, C.wall - 2, { hat: 8, shaker: true, lvl: 0.72 });
S.kit(C.p3, C.wall - 2, { rim: true, kick: 2, lvl: 0.7 });
S.arp(C.p2, C.wall - 2, { every: 8, lvl: 0.7, bright: 0.9 });
for (const t of [C.p2, C.p3]) [[74, 0], [73, 0.5], [69, 1.0], [71, 1.5]].forEach(([m, d], j) => S.melody(t + d, m, { g: 0.035, pan: j % 2 ? 0.35 : -0.35, passing: true }));
S.pads(C.wall - 2, C.wall, { g: 0.1, bright: 1.1 });
S.bass(C.wall - 2, C.wall - 0.01, { lvl: 0.95 });
S.kit(C.wall - 2, C.wall - 0.01, { kick: 4, hat: 16, lvl: 0.9 });
S.roll(C.wall - 2, C.wall, 0.12);
S.leadIn(C.wall, BAR, 0.9);
// the capability board: a pluck for every card that switches on, chord tones climbing column by column; a bell at 20+;
// the whole board on I, the widest moment of Core, running on under its line
S.arrive(C.wall, 0.6);
S.pads(C.wall, C.wRev, { g: 0.1, bright: 1.05 });
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
S.pads(C.wRev, C.arch, { g: 0.12, bright: 1.2, up: 12 });
S.pads(C.wRev, C.arch, { g: 0.08, bright: 1.0 });
S.bass(C.wRev, C.arch - 0.01, { lvl: 0.95, oct: true });
S.kit(C.wRev, C.arch - 0.01, { kick: 4, hat: 16, clap: true, lvl: 0.9 });
S.arp(C.wRev, C.arch - 2, { lvl: 0.8, up: 12 });
S.melody(C.wRev, 90, { g: 0.05 });   // the whole board: F#6 on D
S.roll(C.arch - 2, C.arch, 0.07);
S.leadIn(C.arch, BAR, 0.8);
// one structure: Bm colour, thinner while the header reads; a pluck for every module that drops in, climbing
S.arrive(C.arch, 0.5);
S.bass(C.arch, C.grid1 - 2, { half: true, lvl: 0.95 });
S.heartbeat(C.arch, C.grid1 - 2);
S.kit(C.arch, C.grid1 - 2, { kick: 2, hat: 8, shaker: true, lvl: 0.8 });
S.arp(C.arch, C.grid1 - 2, { every: 8, lvl: 0.8, bright: 0.95 });
S.cues('mod').forEach((c, i) => S.melody(c.t, [74, 78, 81][i], { inst: 'pluck', g: 0.05, pan: [-0.3, 0, 0.3][i] }));
S.pads(C.grid1 - 2, C.grid1, { g: 0.1, bright: 1.1 });
S.kit(C.grid1 - 2, C.grid1 - 0.01, { kick: 4, hat: 16, lvl: 0.85 });
S.roll(C.grid1 - 2, C.grid1, 0.12);
S.leadIn(C.grid1, BAR, 0.9);
// the first two problems solved: wide on I, a bell for each tick
S.arrive(C.grid1, 0.7);
S.pads(C.grid1, C.studio - 2, { g: 0.12, bright: 1.15, up: 12 });
S.bass(C.grid1, C.studio - 2, { lvl: 0.9, oct: true });
S.kit(C.grid1, C.studio - 2, { kick: 4, hat: 8, lvl: 0.8 });
S.cues('solve').filter((c) => c.t < C.studio).forEach((c, i) => S.melody(c.t, [86, 90][i], { g: 0.06, pan: i ? 0.25 : -0.25 }));
S.roll(C.studio - 2, C.studio, 0.1);
S.leadIn(C.studio, BAR, 1.0);

// ---------------------------------------------------------------- Studio: the chapter, then the console
S.arrive(C.studio, 0.6);
S.pads(C.studio, C.grid2 - 2, { g: 0.09 });
S.subs(C.studio, C.grid2 - 2, 0.07);
S.bass(C.studio, C.c1 - 0.01, { half: true, lvl: 0.8 });
S.kit(C.studio, C.c1 - 0.01, { kick: 2, hat: 8, lvl: 0.75 });
S.arp(C.studio, C.c1, { every: 8, lvl: 0.7 });
S.leadIn(C.c1, BAR, 0.8);
S.arrive(C.c1, 0.4);
S.bass(C.c1, C.grid2 - 2, { lvl: 0.85 });
S.kit(C.c1, C.grid2 - 2, { kick: 4, hat: 8, lvl: 0.8 });
S.arp(C.c1, C.review, { every: 8, lvl: 0.72 });
S.arp(C.fixed, C.grid2 - 2, { every: 8, lvl: 0.72 });   // the arpeggio steps out while the review asks for a change
// the task page: the grid thickens while the agents work through the night
S.kit(C.c2 + 0.5, C.c3, { hat: 16, shaker: true, lvl: 0.68 });
S.arp(C.c2 + 0.5, C.review, { lvl: 0.5, up: 12, bright: 0.9 });
// before every page slide, a reverse cymbal
for (const t of [C.c2, C.c3, C.c4]) S.add(S.air, S.reverseCymbal(BEAT), t - BEAT, 0.06);
// production goes live: a bell
S.melody(C.live, 86, { g: 0.07 });
S.melody(C.live + 0.25, 90, { g: 0.05, pan: 0.2 });
// the project memory: lighter; a soft pluck for every card, two bells as the next task reads them
S.arrive(C.c4, 0.4);
S.kit(C.c4, C.grid2 - 2, { hat: 8, shaker: true, lvl: 0.72 });
S.cues('memc').forEach((c, i) => {
  const pcs = new Set(S.chordAt(c.t + 1e-4).v.map((m) => m % 12)), tones = [];
  for (let m = 69; m <= 90; m++) if (pcs.has(m % 12)) tones.push(m);
  S.melody(c.t, tones[Math.min(tones.length - 1, i)], { inst: 'pluck', g: 0.035, pan: i % 2 ? 0.3 : -0.3 });
});
S.cues('memu').forEach((c, i) => S.melody(c.t, [86, 90][i], { g: 0.05, pan: i ? 0.25 : -0.25 }));
// into the other two problems: IV → V, a roll
S.pads(C.grid2 - 2, C.grid2, { g: 0.1, bright: 1.1 });
S.bass(C.grid2 - 2, C.grid2 - 0.01, { lvl: 0.9 });
S.kit(C.grid2 - 2, C.grid2 - 0.01, { kick: 4, hat: 16, lvl: 0.85 });
S.roll(C.grid2 - 2, C.grid2, 0.11);
S.leadIn(C.grid2, BAR, 1.0);
// the other two solved: a bell for each tick, all four done
S.arrive(C.grid2, 0.7);
S.pads(C.grid2, C.yr - 1, { g: 0.12, bright: 1.15, up: 12 });
S.bass(C.grid2, C.yr - 0.01, { lvl: 0.9, oct: true });
S.kit(C.grid2, C.yr - 0.01, { kick: 4, hat: 8, lvl: 0.8 });
S.cues('solve').filter((c) => c.t > C.studio).forEach((c, i) => S.melody(c.t, [90, 93][i], { g: 0.06, pan: i ? 0.25 : -0.25 }));
S.roll(C.yr - 1.5, C.yr, 0.07);
S.leadIn(C.yr, BAR, 1.0);

// ---------------------------------------------------------------- the year: half-time and wide; a pluck for every request on the line
S.arrive(C.yr, 0.7);
S.pads(C.yr, C.end - 2, { g: 0.11, bright: R(C.yr, C.end, 0.95, 1.2) });
S.pads(C.yr, C.end - 2, { g: 0.06, bright: 1.0, up: 12 });
S.subs(C.yr, C.end, 0.08);
S.bass(C.yr, C.end - 2, { whole: true, lvl: 0.85 });
S.heartbeat(C.yr, C.end - 2, 0.18);
S.kit(C.yr, C.end - 2, { kick: 2, hat: 8, lvl: R(C.yr, C.end, 0.6, 0.8) });
S.arp(C.yr, C.end - 2, { every: 8, lvl: R(C.yr, C.end, 0.55, 0.85), bright: 0.95 });
S.cues('chip').forEach((c, i) => {
  const pcs = new Set(S.chordAt(c.t + 1e-4).v.map((m) => m % 12)), tones = [];
  for (let m = 71; m <= 93; m++) if (pcs.has(m % 12)) tones.push(m);
  S.melody(c.t, tones[Math.min(tones.length - 1, i)], { inst: 'pluck', g: 0.04, pan: i % 2 ? 0.25 : -0.25 });
});
// the bass walks home into the end card
[33, 35, 37, 38].forEach((m, i) => S.add(S.music, S.bassNote(m, BEAT * 0.9, 1.3), C.end - 2 + i * BEAT + 0.01, 0.3));
S.roll(C.end - 1, C.end, 0.08, false);
S.leadIn(C.end, BAR, 1.0);

// ---------------------------------------------------------------- the end card: Dmaj9, three bells, a long tail
S.arrive(C.end, 1.0);
S.pads(C.end, C.end + 4.5, { g: 0.1, att: 0.05, bright: 1.0, rel: 3.2 });
S.add(S.music, S.bassNote(26, 3.0, 1.0), C.end + 0.01, 0.26);
[[86, 0.02, 0.09, 0.2], [93, 0.32, 0.06, -0.2], [90, 0.62, 0.045, 0.1]].forEach(([m, d, g, p]) => S.add(S.music, S.bell(m, 5), C.end + d, g, p));

S.finish({
  sections: [['opening', 0, C.prob], ['problems', C.prob, PD], ['brand', C.brand, C.core], ['Core', C.core, C.p2], ['capabilities', C.p2, C.wall], ['board', C.wall, C.arch], ['one structure', C.arch, C.grid1],
    ['solved 1', C.grid1, C.studio], ['Studio', C.studio, C.c1], ['console', C.c1, C.c4], ['memory', C.c4, C.grid2], ['solved 2', C.grid2, C.yr], ['year', C.yr, C.end], ['end', C.end, C.done]],
  lines: [C.brand, C.core, C.p2, C.wall, C.arch, C.grid1, C.studio, C.c1, C.grid2, C.yr, C.end],
  into: [C.brand],
});
