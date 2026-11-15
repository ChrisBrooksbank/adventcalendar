// The original sine-wave synth, kept only so that sound-test.html can play old against new. Nothing else uses it.
export function createLegacy(ctx) {
let master, wet, enabled = true;
function init() {
  if (master) return true;
  master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
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
const tuneName = (n) => TUNES[n - 1][0];
const MELODY = TUNES.map(([, base, , seq]) => seq.split(' ').map((s) => base + +s.split(':')[0]));
// ---------- noise-based effects (wind, whooshes, soft snow) for Midnight Delivery ----------
let noiseBuf, windG, windF;
function noise() {
  if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s;
}
function puff(type, f0, f1, q, len, vol) {
  const t = ctx.currentTime, s = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + len);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + len * 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + len + 0.05);
}
return {
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
  // --- Midnight Delivery ---
  tuneLen: (n) => MELODY[n - 1].length,
  tuneNote(n, i, bright) { // one note of a carol per present delivered
    if (!enabled || !init()) return; const m = MELODY[n - 1][i % MELODY[n - 1].length]; note(m, 0, 1.5, 0.24); note(m - 12, 0, 1.2, 0.07); if (bright) note(m + 12, 0.03, 1.1, 0.08);
  },
  wind(level) { // continuous rush of air; level 0 silences it
    if (!init()) return; const t = ctx.currentTime;
    if (!windG) { const s = noise(); windF = ctx.createBiquadFilter(); windF.type = 'bandpass'; windF.Q.value = 0.6; windG = ctx.createGain(); windG.gain.value = 0; s.connect(windF); windF.connect(windG); windG.connect(master); s.start(); }
    windG.gain.setTargetAtTime(enabled ? level * 0.085 : 0, t, 0.25); windF.frequency.setTargetAtTime(260 + level * 700, t, 0.25);
  },
  jingle(v = 0.02) { if (!enabled || !init()) return; note(98, 0, 0.16, v); note(105, 0.012, 0.12, v * 0.8); },
  pff() { if (!enabled || !init()) return; puff('lowpass', 900, 220, 0.5, 0.3, 0.2); },
  whoosh() { if (!enabled || !init()) return; puff('bandpass', 350, 2800, 1.4, 0.7, 0.3); [0, 4, 7, 12].forEach((s, i) => note(79 + s, i * 0.05, 0.9, 0.06)); },
  thud() {
    if (!enabled || !init()) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.28); g.gain.setValueAtTime(0.45, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.35); puff('lowpass', 1400, 300, 0.5, 0.35, 0.25);
    for (let i = 0; i < 5; i++) note(96 + ((i * 5) % 9), i * 0.045 + Math.random() * 0.02, 0.2, 0.035);
  },
  twinkle(i = 0) { if (!enabled || !init()) return; const sc = [0, 2, 4, 7, 9, 12, 14, 16]; note(86 + sc[Math.abs(i) % sc.length], 0, 0.5, 0.06); },
  fanfare() { if (!enabled || !init()) return; [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => note(72 + s, 0.25 + i * 0.09, 1.6, 0.11)); },
  // --- George Swings ---
  boing(big) { // a springy bounce off a hat (or, bigger, off Monty's antlers)
    if (!enabled || !init()) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), f0 = big ? 110 : 170, len = big ? 0.5 : 0.32; o.type = 'triangle';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 3.2, t + len * 0.55); o.frequency.exponentialRampToValueAtTime(f0 * 2.4, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.32, t + 0.015); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + len + 0.05); if (big) [0, 7, 12, 19].forEach((s, i) => note(84 + s, 0.04 + i * 0.05, 0.7, 0.05));
  },
  creak() { if (!enabled || !init()) return; puff('bandpass', 2600, 3800, 9, 0.22, 0.16); for (let i = 0; i < 4; i++) note(103 + ((i * 7) % 5), i * 0.05 + Math.random() * 0.02, 0.12, 0.03); },
  snap() { if (!enabled || !init()) return; puff('highpass', 3000, 900, 0.7, 0.16, 0.3); note(108, 0, 0.25, 0.08); note(101, 0.03, 0.3, 0.06); },
  // --- Carol of the Doors ---
  now() { return enabled && ctx && ctx.state === 'running' ? ctx.currentTime : null; }, // the audio clock, when there is one to keep time by
  play(midi, when = 0, len = 1.4, vol = 0.22) { if (!enabled || !init()) return; note(midi, Math.max(0, when), len, vol); },
  bells() { if (!enabled || !init()) return; for (let i = 0; i < 6; i++) { note(96, i * 0.16, 0.25, 0.05); note(103, i * 0.16 + 0.02, 0.2, 0.04); } },
};
}
