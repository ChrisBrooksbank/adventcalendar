// Tiny music-box synth: one carol phrase per door, plus chimes and sparkles.
let ctx, master, wet, enabled = true;
function init() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
  const d = ctx.createDelay(1); d.delayTime.value = 0.31; const fb = ctx.createGain(); fb.gain.value = 0.38; const lp = ctx.createBiquadFilter(); lp.frequency.value = 2600;
  wet = ctx.createGain(); wet.gain.value = 0.35; wet.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(master);
  return true;
}
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function note(midi, when, len = 1.4, vol = 0.22) {
  const t = ctx.currentTime + when, f = hz(midi), g = ctx.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0008, t + len);
  g.connect(master); g.connect(wet);
  [[1, 'sine', 1], [2, 'sine', 0.35], [3.01, 'sine', 0.12], [5.4, 'sine', 0.05]].forEach(([mul, type, v]) => {
    const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = f * mul; og.gain.value = v;
    o.connect(og); og.connect(g); o.start(t); o.stop(t + len + 0.05);
  });
}
// [name, base midi, seconds per beat, "semitone:beats ..."]
const TUNES = [
  ['In the Bleak Midwinter', 72, 0.46, '4:1.5 5:.5 7:1 4:1 2:2 0:2 2:1.5 4:.5 2:1 -3:1 2:4'],
  ['Deck the Halls', 72, 0.3, '7:1.5 5:.5 4:1 2:1 0:1 2:1 4:1 0:1 2:.5 4:.5 5:.5 2:.5 4:1.5 2:.5 0:1 -1:1 0:2'],
  ["The Snowmen's Jig", 74, 0.26, '0:.5 4:.5 7:.5 4:.5 9:.5 7:.5 4:1 2:.5 4:.5 7:.5 4:.5 2:1 0:1 12:2'],
  ['O Christmas Tree', 72, 0.42, '-5:1 0:.75 0:.25 0:1.5 2:.5 4:.75 4:.25 4:1.5 4:.5 2:.5 4:.5 5:1 -1:1 2:1 0:2'],
  ['Good King Wenceslas', 74, 0.36, '0:1 0:1 0:1 2:1 0:1 0:1 -5:2 -3:1 -5:1 -3:1 -1:1 0:2 0:2'],
  ['Jolly Old Saint Nicholas', 72, 0.32, '4:1 4:1 4:1 4:1 2:1 2:1 2:2 0:1 0:1 0:1 0:1 4:4'],
  ['We Wish You a Merry Christmas', 74, 0.3, '-5:1 0:1 0:.5 2:.5 0:.5 -1:.5 -3:1 -3:1 -3:1 2:1 2:.5 4:.5 2:.5 0:.5 -1:1 -5:1 -5:1 4:1 4:.5 5:.5 4:.5 2:.5 0:1 -3:1 -5:.5 -5:.5 -3:1 2:1 -1:1 0:2'],
  ['Jingle Bells (verse)', 74, 0.27, '-5:1 4:1 2:1 0:1 -5:3 -5:.5 -5:.5 -5:1 4:1 2:1 0:1 -3:4'],
  ['The Holly and the Ivy', 70, 0.4, '0:1 0:1 0:.5 0:.5 9:1 7:1 4:2 0:1 0:1 0:.5 0:.5 9:1 7:3'],
  ['Carol of the Bells', 79, 0.2, '3:1 2:.5 3:.5 0:1 3:1 2:.5 3:.5 0:1 3:1 2:.5 3:.5 0:1 3:1 2:.5 3:.5 0:1 7:1 5:.5 7:.5 3:1 7:1 5:.5 7:.5 3:1 3:1 2:.5 3:.5 0:3'],
  ['Up on the Housetop', 72, 0.3, '7:1 7:.5 9:.5 7:1 4:1 0:1 4:1 7:2'],
  ['The Twelve Days of Christmas', 72, 0.3, '-5:.5 -5:.5 -5:1 0:.5 0:.5 0:1 -1:.5 0:.5 2:.5 4:.5 5:.5 2:.5 4:2'],
  ['O Come, O Come, Emmanuel', 76, 0.48, '0:1 3:1 7:1 7:1 7:1 5:1 8:1 7:1 5:1 3:3'],
  ['The First Nowell', 67, 0.4, '4:.5 2:.5 0:1.5 2:.5 4:.5 5:.5 7:2 9:.5 11:.5 12:1 11:1 9:1 7:2'],
  ['God Rest Ye Merry, Gentlemen', 74, 0.33, '0:1 0:1 7:1 7:1 5:1 3:1 2:1 0:1 -2:1 0:1 2:1 3:1 5:1 7:3'],
  ['Joy to the World', 67, 0.36, '12:2 11:1.5 9:.5 7:3 5:1 4:2 2:2 0:3'],
  ['We Three Kings', 72, 0.3, '7:2 5:1 3:2 0:1 2:1 3:1 2:1 0:3 7:2 5:1 3:2 0:1 2:1 3:1 2:1 0:3'],
  ['Angels We Have Heard on High', 70, 0.3, '7:2 9:.5 7:.5 5:.5 4:.5 5:2 7:.5 5:.5 4:.5 2:.5 4:2 5:.5 4:.5 2:.5 0:.5 2:3 -5:1 0:1 2:1 4:1 5:1 4:2 2:2 0:3'],
  ['O Come, All Ye Faithful', 72, 0.38, '0:1 0:2 -5:1 0:1 2:2 -5:2 4:1 2:1 4:1 5:1 4:2 2:2'],
  ['Jingle Bells', 72, 0.25, '4:1 4:1 4:2 4:1 4:1 4:2 4:1 7:1 0:1.5 2:.5 4:4'],
  ['What Child Is This', 69, 0.36, '0:1 3:2 5:1 7:1.5 9:.5 7:1 5:2 2:1 -2:1.5 0:.5 2:1 3:2 0:1 0:1.5 -1:.5 0:1 2:2 -1:1 -5:2'],
  ['Hark! The Herald Angels Sing', 72, 0.36, '-5:1 0:1 0:1.5 -1:.5 0:1 4:1 4:1 2:1 7:1 7:1 7:1.5 5:.5 4:1 2:1 4:2'],
  ['Away in a Manger', 72, 0.44, '7:1 7:1.5 5:.5 4:1 4:1.5 2:.5 0:1 0:1 -1:1 -3:1 -5:3'],
  ['Silent Night', 65, 0.46, '7:1.5 9:.5 7:1 4:3 7:1.5 9:.5 7:1 4:3 14:2 14:1 11:3 12:2 12:1 7:3'],
];
export const tuneName = (n) => TUNES[n - 1][0];
export const audio = {
  get on() { return enabled; },
  toggle() { enabled = !enabled; if (master) master.gain.value = enabled ? 0.5 : 0; return enabled; },
  unlock() { init(); },
  tune(n) {
    if (!enabled || !init()) return; const [, base, beat, seq] = TUNES[n - 1]; let t = 0.05;
    seq.split(' ').forEach((s) => { const [st, b] = s.split(':').map(Number); note(base + st, t, Math.max(1.1, b * beat * 1.8), 0.2); t += b * beat; });
    note(base - 12, 0.05, 2.5, 0.08);
  },
  chime(i = 0) { if (!enabled || !init()) return; const sc = [0, 2, 4, 7, 9, 12, 14, 16]; note(79 + sc[Math.abs(i) % sc.length], 0, 1.6, 0.14); },
  locked() { if (!enabled || !init()) return; note(72, 0, 0.5, 0.1); note(67, 0.12, 0.7, 0.1); },
  magic(n = 0) { // rising glissando as a door opens
    if (!enabled || !init()) return; const sc = [0, 2, 4, 7, 9];
    for (let i = 0; i < 16; i++) note(67 + (n % 5) + sc[i % 5] + 12 * Math.floor(i / 5), i * 0.11 + Math.random() * 0.02, 1.3, 0.07 + i * 0.004);
  },
  bells() { if (!enabled || !init()) return; for (let i = 0; i < 6; i++) { note(96, i * 0.16, 0.25, 0.05); note(103, i * 0.16 + 0.02, 0.2, 0.04); } },
};
