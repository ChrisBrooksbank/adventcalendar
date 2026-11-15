// The full carols for Carol of the Doors: each door's phrase (see tunes.js) grown into a whole song.
// Melody notation: "semitone[:beats]" from the tonic (beats default to 1), "r:beats" is a rest and "|" a bar line.
// Bar lines are only there to be checked: validate() makes sure every bar adds up.
import { tuneName } from './tunes.js';

const J = (...s) => s.join(' | '), P = (...s) => s.join(' '); // join whole-bar sections / sections that start with a pickup
const x = (s, n) => Array(n).fill(s);

const bleak = ['4:1.5 5:.5 7 4 | 2:2 0:2', '2:1.5 4:.5 2 -3 | 2:4', '2 4 2:1.5 -1:.5 | 0:4', '5:1.5 4:.5 5 7 | 9:2 9 4', '7:1.5 5:.5 4 2 | 0:4'];
const deck = '7:1.5 5:.5 4 2 | 0 2 4 0 | 2:.5 4:.5 5:.5 2:.5 4:1.5 2:.5 | 0 -1 0:2';
const jigA = '0:.5 4:.5 7:.5 4:.5 9:.5 7:.5 4 | 2:.5 4:.5 7:.5 4:.5 2 0 | 0:.5 4:.5 7:.5 4:.5 9:.5 7:.5 12 | 11:.5 9:.5 7:.5 4:.5 2 0';
const jigB = '12:.5 11:.5 9:.5 7:.5 9 7 | 5:.5 4:.5 2:.5 4:.5 5 2 | 4:.5 5:.5 7:.5 9:.5 7 4 | 2:.5 4:.5 2:.5 -1:.5 0:2';
const treeA = '-5 | 0:.75 0:.25 0:1.5 2:.5 | 4:.75 4:.25 4:1.5 4:.5 | 2:.5 4:.5 5 -1 | 2 0';
const treeB = 'r:.5 7:.5 | 7:.5 4:.5 9:1.5 7:.5 | 7:.5 5:.5 5:1.5 5:.5 | 5:.5 2:.5 7:1.5 5:.5 | 5:.5 4:.5 4';
const wen = ['0 0 0 2 | 0 0 -5:2', '-3 -5 -3 -1 | 0:2 0:2'];
const nick = '4 4 4 4 | 2 2 2:2 | 0 0 0 0 | 4:4 | -3 -3 -3 -3 | -5 -5 0:2';
const wishV = '-5 | 0 0:.5 2:.5 0:.5 -1:.5 | -3 -3 -3 | 2 2:.5 4:.5 2:.5 0:.5 | -1 -5 -5 | 4 4:.5 5:.5 4:.5 2:.5 | 0 -3 -5:.5 -5:.5 | -3 2 -1 | 0:2';
const wishC = '-5 | 0 0 0 | -1:2 -1 | 0 -1 -3 | -5:2 2 | 4 2 0 | 7 -5 -5:.5 -5:.5 | -3 2 -1 | 0:2';
const jbV = '-5 4 2 0 | -5:3 -5:.5 -5:.5 | -5 4 2 0 | -3:4 | -3 5 4 2 | -1:4 | 7 7 5 2 | 4:4 | -5 4 2 0 | -5:4 | -5 4 2 0 | -3:3 -3 | -3 5 4 2 | 7 7 7 7 | 9 7 5 2 | 0:4';
const jbC = '4 4 4:2 | 4 4 4:2 | 4 7 0:1.5 2:.5 | 4:4 | 5 5 5:1.5 5:.5 | 5 4 4 4:.5 4:.5';
const jbC1 = J(jbC, '4 2 2 4 | 2:2 7:2'), jbC2 = J(jbC, '7 7 5 2 | 0:4');
const holly = '0 | 0 0:.5 0:.5 9 | 7 4 0 | 0 0:.5 0:.5 9 | 7:2 7:.5 5:.5 | 4 2 0:.5 0:.5 | -3:.5 -3:.5 -5 -5 | 0:.5 2:.5 4 2 | 0:2';
const bellM = '3 2:.5 3:.5 0', bellH = '7 5:.5 7:.5 3';
const bellX = '12 12:.5 12:.5 10:.5 8:.5 | 7 7:.5 7:.5 5:.5 3:.5 | 5 5:.5 5:.5 7:.5 5:.5 | 0 0:.5 0:.5 0';
const bellR = '-5:.5 -3:.5 -1:.5 0:.5 2:.5 3:.5 | 5:.5 7:.5 5 3';
const roofV = '7 7:.5 9:.5 7 4 | 0 4 7:2';
const days = '-5:.5 -5:.5 | -5 0:.5 0:.5 0 -1:.5 0:.5 | 2:.5 4:.5 5:.5 2:.5', pear = '7 9:.5 5:.5 4:.5 0:.5 2 | 0:3';
const emm = ['0 | 3 7 7 7 | 5 8 7 5 | 3:3', '5 | 7 3 0 3 | 5 2 0 -2 | 0:3', '5 | 5 0 0 2 | 3:2 2 0 | -2:3', '3 | 5 7 7 7 | 5 8 7 5 | 3:3', '10 | 10:3 7 | 7:3 7 | 5 8 7 5 | 3:3'];
const nowA = '4:.5 2:.5 | 0:1.5 2:.5 4:.5 5:.5 | 7:2 9:.5 11:.5 | 12 11 9 | 7:2 9:.5 11:.5 | 12 11 9 | 7 9 11 | 12 7 5 | 4:2';
const nowR = '4:.5 2:.5 | 0:1.5 2:.5 4:.5 5:.5 | 7:2 12:.5 11:.5 | 9:2 9 | 7:3 | 12 11 9 | 7 9 11 | 12 7 5 | 4:2';
const rest1 = '0 | 0 7 7 5 | 3 2 0 -2 | 0 2 3 5 | 7:3';
const rest2 = '7 | 8 5 7 8 | 10 12 7 5 | 3 0 2 3 | 5:2 3 5 | 7:2 8 7 | 7 5 3 2 | 0:2 3:.5 2:.5 0 | 5:2 3 5 | 7 8 10 12 | 7 5 3 2 | 0:3';
const joy = '12:2 11:1.5 9:.5 | 7:3 5 | 4:2 2:2 | 0:3 7 | 9:3 9 | 11:3 11 | 12:3 12 | 12 11 9 7 | 7:1.5 5:.5 4 12 | 12 11 9 7 | 7:1.5 5:.5 4 4 | 4 4 4 4:.5 5:.5 | 7:3 5:.5 4:.5 | 2 2 2 2:.5 4:.5 | 5:3 4:.5 2:.5 | 0 12:2 9 | 7:1.5 5:.5 4 5 | 4:2 2:2 | 0:4';
const kingA = '7:2 5 | 3:2 0 | 2 3 2 | 0:3', kingS = '3:2 3 | 3:2 -2 | 3:2 0 | 3:3';
const angV = '4 4 4 7 | 7:1.5 5:.5 4:2 | 4 2 4 7 | 4:1.5 2:.5 0:2';
const angG = '7:2 9:.5 7:.5 5:.5 4:.5 | 5:2 7:.5 5:.5 4:.5 2:.5 | 4:2 5:.5 4:.5 2:.5 0:.5 | 2:3 -5 | 0 2 4 5 | 4:2 2:2';
const faith = '0 | 0:2 -5 0 | 2:2 -5:2 | 4 2 4 5 | 4:2 2 0 | 0:2 -1 -3 | -1 0 2 4 | -1:2 -3:1.5 -5:.5 | -5:3 r:1 | 7:2 5 4 | 5:2 4:2 | 2 4 0 2 | -1:1.5 -3:.5 -5 0 | 0 -1 0 2 | 0:2 -5 4 | 4 2 4 5 | 4:2 2 4 | 5 4 2 0 | -1:2 0 5 | 4:2 2:1.5 0:.5 | 0:3';
const gsA = '3:2 5 | 7:1.5 9:.5 7 | 5:2 2 | -2:1.5 0:.5 2', gsE1 = '3:2 0 | 0:1.5 -1:.5 0 | 2:2 -1', gsE2 = '3:1.5 2:.5 0 | -1:1.5 -3:.5 -1 | 0:3';
const hark = '-5 0 0:1.5 -1:.5 | 0 4 4 2', harkE = '2 4:.5 5:.5 7:1.5 0:.5';
const mangerA = '7 | 7:1.5 5:.5 4 | 4:1.5 2:.5 0 | 0 -1 -3 | -5:2 -5';
const huronA = '-5 | 0 2 3 5 | 3 2 0 -2', huronB = '0 | 7 7 2 3 | 5:1.5 3:.5 2 2 | 3 2 0 0 | 2:1.5 0:.5 0 -2 | -5 0 0:2 | -2 -4 -5:2 | 0:2 -2 -5 | 0:2 0 2 | 3 5 7 -5 | 0:3';
const silentA = '7:1.5 9:.5 7 | 4:3', silentB = '9:2 9 | 12:1.5 11:.5 9 | 7:1.5 9:.5 7 | 4:3';

// [beats in a bar, pickup beats, minor?, seconds per beat, tonic (midi), times through, melody]
export const SONGS = [
  [4, 0, 0, 0.46, 72, 1, J(bleak[0], bleak[1], bleak[0], bleak[2], bleak[3], bleak[4], bleak[0], bleak[2])],
  [4, 0, 0, 0.32, 72, 2, J(deck, deck, '2:1.5 4:.5 5 2 | 4:1.5 5:.5 7 2 | 4:.5 6:.5 7 9:.5 11:.5 12 | 11 9 7:2', '7:1.5 5:.5 4 2 | 0 2 4 0 | 9:.5 9:.5 9:.5 9:.5 7:1.5 5:.5 | 4 2 0:2')],
  [4, 0, 0, 0.28, 74, 1, J(jigA, jigA, jigB, jigA, jigB, jigA)],
  [3, 1, 0, 0.42, 72, 2, P(treeA, treeA, treeB, treeA)],
  [4, 0, 0, 0.36, 74, 2, J(wen[0], wen[1], wen[0], wen[1], '7 5 4 2 | 4 2 0:2', wen[1], '-5 -5 -3 -1 | 0 0 2:2', '7 5 4 2 | 0:2 5:2 | 0:4')],
  [4, 0, 0, 0.32, 72, 2, J(nick, '2 2 4 6 | 7:4', nick, '2 2 4 2 | 0:4')],
  [3, 1, 0, 0.3, 74, 1, P(wishV, wishV, wishC, wishV)],
  [4, 0, 0, 0.27, 74, 1, J(jbV, jbC1, jbC2)],
  [3, 1, 0, 0.4, 70, 3, holly],
  [3, 0, 1, 0.22, 79, 2, J(...x(bellM, 4), ...x(bellH, 4), bellX, bellX, bellR, bellR, ...x(bellM, 4), '0:3')],
  [4, 0, 0, 0.3, 72, 2, J(roofV, '9 9 7 4 | 2 2 7:2', roofV, '9 9:.5 9:.5 7 4 | 2 7 0:2', '5 5 9:2 | 7 7:.5 7:.5 4:2 | 2 2 5:2 | 4 4:.5 4:.5 0:2', '5 5:.5 5:.5 9 5 | 7 7 7:2 | 7 7:.5 9:.5 7 5 | 4 2 0:2')],
  [4, 1, 0, 0.32, 72, 1, P(J(days + ' 4:1.5 4:.5', pear), J(days + ' 4:2', '7 2 4 5:.5 4:.5', pear), J(days + ' 4:2', '7:2 9 6 | 7:4 | 7 5:.5 4:.5 2:2 | 5 4:.5 2:.5 0:2 | 4 2:.5 0:.5 -1:1.5 4:.5', pear))],
  [4, 1, 1, 0.48, 76, 1, P(emm[0], emm[1], emm[2], emm[3], emm[4], emm[1])],
  [3, 1, 0, 0.4, 67, 1, P(nowA, nowA, nowR)],
  [4, 1, 1, 0.33, 74, 2, P(rest1, rest1, rest2)],
  [4, 0, 0, 0.36, 67, 2, joy],
  [3, 0, 1, 0.3, 72, 1, J(kingA, kingA, '3:2 3 | 5:2 5 | 7:2 7 | 10 8 7 | 5 7 5 | 3:2 2 | 0:3', '2:3 | 5:3', kingS, kingS, '3:2 5 | 7:2 8 | 7:2 5 | 7:3', kingS)],
  [4, 0, 0, 0.31, 70, 1, J(angV, angV, angG, angG, '0:4')],
  [4, 1, 0, 0.38, 72, 1, faith],
  [4, 0, 0, 0.25, 72, 1, J(jbC1, jbC2, jbV, jbC1, jbC2)],
  [3, 1, 1, 0.36, 69, 1, P(J('0', gsA, gsE1, '-5:2'), J('0', gsA, gsE2, '0:3', '10:3 | 10:1.5 9:.5 7 | 5:2 2 | -2:1.5 0:.5 2', gsE1, '-5:3', '10:3 | 10:1.5 9:.5 7 | 5:2 2 | -2:1.5 0:.5 2', gsE2, '0:3'))],
  [4, 0, 0, 0.36, 72, 1, J(hark, '7 7 7:1.5 5:.5 | 4 2 4:2', hark, '7 2 2:1.5 -1:.5 | -1 -3 -5:2', '7 7 7 0 | 5 4 4 2', '7 7 7 0 | 5 4 4 2', '9 9 9 7 | 5 4 5:2', harkE, '0 2 4:2', '9:1.5 9:.5 9 7 | 5 4 5:2', harkE, '0 2 0:2')],
  [3, 1, 0, 0.44, 72, 2, P(mangerA, '| -5:1.5 -3:.5 -5 | -5 2 -1 | -3 -5 0 | 4:2', mangerA, '| 5:1.5 4:.5 2 | 4 2 0 | 2 -3 -1 | 0:2')],
  [3, 0, 0, 0.46, 65, 1, J(silentA, silentA, '14:2 14 | 11:3 | 12:2 12 | 7:3', silentB, silentB, '14:2 14 | 17:1.5 14:.5 11 | 12:3 | 16:3 | 12 7 4 | 7:1.5 5:.5 2 | 0:3 | r:3')],
];

SONGS.push([4, 1, 1, 0.44, 69, 2, P(huronA, '| 0 0 2 -2 | 0:3', huronA, '| 0 3 2 -2 | 0:3', huronB)]); // The Huron Carol (HURON in tunes.js)

const tok = (s) => { const [a, b] = s.split(':'); return [a === 'r' ? null : +a, b === undefined ? 1 : +b]; };
const CHORDS = [
  [[0, [0, 4, 7], 0.12], [5, [5, 9, 0], 0], [7, [7, 11, 2], 0.05], [9, [9, 0, 4], -0.08]],
  [[0, [0, 3, 7], 0.12], [5, [5, 8, 0], 0], [7, [7, 11, 2], 0.03], [10, [10, 2, 5], 0], [3, [3, 7, 10], 0], [8, [8, 0, 3], -0.05]],
];
const pc = (s) => ((s % 12) + 12) % 12;

// Everything the game needs to play carol n: timed melody notes (each with the door that sounds it) and a music-box accompaniment.
export function chart(n) {
  const [meter, pickup, minor, beat, base, rep, seq] = SONGS[n - 1], one = [];
  let b = 0; for (const s of seq.split(/\s+/)) { if (!s || s === '|') continue; const [st, d] = tok(s); if (st !== null) one.push({ b, d, st }); b += d; }
  const total = b, ev = []; for (let r = 0; r < rep; r++) for (const e of one) ev.push({ b: e.b + r * total, d: e.d, st: e.st });
  const beats = total * rep, lo = Math.min(...one.map((e) => e.st)), hi = Math.max(...one.map((e) => e.st)), low = base + lo - Math.floor((23 - (hi - lo)) / 2);
  const notes = ev.map((e) => { const k = e.b - pickup, on = Math.abs(k - Math.round(k)) < 1e-6; return { t: e.b * beat, d: e.d * beat, midi: base + e.st, pad: base + e.st - low, w: on ? (k >= 0 && Math.round(k) % meter === 0 ? 3 : 2) : 1 }; });
  notes[notes.length - 1].d = Math.max(notes[notes.length - 1].d, 2.2);
  return { n, name: tuneName(n), meter, pickup, beat, base, low, notes, acc: harmonise(ev, meter, pickup, minor, beat, base, beats), beats, len: beats * beat };
}

// A simple harmony for a melody ([{ b: beat, d: beats long, st: semitone }]): for each bar, whichever chord covers most of its notes.
// `final` ends on the chord of the last note, as a whole song should; a lone phrase is left to settle wherever it fits best.
export function harmonise(ev, meter, pickup, minor, beat, base, beats, final = true) {
  const acc = [], nb = Math.ceil((beats - pickup) / meter - 1e-6), cands = CHORDS[minor ? 1 : 0]; let prev = cands[0];
  for (let k = 0; k < nb; k++) {
    const b0 = pickup + k * meter, wt = new Float32Array(12); let W = 0, last = null;
    for (const e of ev) if (e.b >= b0 - 1e-6 && e.b < b0 + meter - 1e-6) { const w = e.d * (e.b - b0 < 1e-6 ? 1.6 : 1); wt[pc(e.st)] += w; W += w; last = e; }
    let best = prev; if (W) {
      let bs = -1e9; for (const c of cands) { let s = c[2] * W; for (let p = 0; p < 12; p++) s += wt[p] * (c[1].includes(p) ? 1 : -0.6); if (s > bs) { bs = s; best = c; } }
      if (final && k === nb - 1) best = cands.find((c) => c[0] === pc(last.st)) ?? cands[0];
    }
    prev = best; const root = best[0] > 6 ? best[0] - 12 : best[0]; let bass = base - 24 + root; while (bass < 43) bass += 12;
    const third = bass + 12 + pc(best[1][1] - best[0]), fifth = bass + 19, busy = beat < 0.27;
    for (let i = 0; i < meter && b0 + i < beats; i++) {
      const t = (b0 + i) * beat;
      if (i === 0) acc.push({ t, midi: bass, len: 1.8, vol: 0.11 });
      else if (!busy || i % 2 === 0 || meter === 3) { if (meter === 4 && i === 2) acc.push({ t, midi: bass + 7, len: 1.2, vol: 0.06 }); acc.push({ t, midi: third, len: 0.9, vol: 0.04 }, { t, midi: fifth, len: 0.9, vol: 0.035 }); }
    }
  }
  return acc;
}

// Checks every carol: bars add up, repeats line up, and the tune fits on the 24 doors. Returns a list of problems (empty = all good).
export function validate() {
  const bad = [];
  SONGS.forEach(([meter, pickup, , , , rep, seq], i) => {
    const n = i + 1, bars = seq.split('|').map((s) => s.trim()).filter(Boolean); let total = 0, lo = 99, hi = -99, count = 0;
    bars.forEach((bar, k) => {
      let sum = 0; for (const s of bar.split(/\s+/)) { const [st, d] = tok(s); if (!(d > 0) || (st !== null && !Number.isInteger(st))) bad.push(`${n}: bad token "${s}"`); else { sum += d; if (st !== null) { lo = Math.min(lo, st); hi = Math.max(hi, st); count++; } } }
      const want = k === 0 && pickup ? pickup : meter, lastBar = k === bars.length - 1;
      if (Math.abs(sum - want) > 1e-6 && !(lastBar && sum < meter)) bad.push(`${n}: bar ${k + 1} "${bar}" has ${sum} beats, not ${want}`);
      total += sum;
    });
    if (total % meter > 1e-6 && !(rep === 1 && (total - pickup) % meter < 1e-6)) bad.push(`${n}: ${total} beats does not make whole bars of ${meter}`);
    if (hi - lo > 23) bad.push(`${n}: range of ${hi - lo} semitones is too wide for 24 doors`);
    if (count * rep < 30) bad.push(`${n}: only ${count} notes`);
  });
  return bad;
}
