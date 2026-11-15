// The Advent House sound engine: a small Web Audio synth, with no samples to load.
//   voices - a music box, a warm vibraphone-like bell, a glockenspiel and sleigh bells, plus noise and tone effects
//   mix    - music / effects / ambience buses sharing one convolution reverb, kept well clear of full scale, then a soft clip as a safety net
import { TUNES, MELODY, tuneName } from './tunes.js';
import { SONGS, harmonise } from './songs.js';
export { tuneName };

const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const rnd = (a, b) => a + Math.random() * (b - a);
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];

// Struck voices: [frequency ratio, level, share of the note's length it rings for, detune in cents].
// The upper partials die away first, so a note starts bright and mellows as it rings; `tick` is the hammer.
const VOICES = {
  box: { level: 1, attack: 0.004, tick: 0.3, partials: [[1, 1, 1], [1, 0.2, 0.85, 4], [2, 0.3, 0.5], [3, 0.09, 0.3], [6.27, 0.12, 0.09], [9.1, 0.05, 0.05]] },
  vibe: { level: 1.15, attack: 0.01, tick: 0, partials: [[1, 1, 1], [1, 0.25, 1, -5], [2, 0.12, 0.5], [4, 0.16, 0.22], [10, 0.03, 0.06]] },
  glock: { level: 1.15, attack: 0.002, tick: 0.25, partials: [[1, 1, 1], [2.76, 0.32, 0.4], [5.4, 0.14, 0.2], [8.93, 0.05, 0.1]] },
};
const BELL = [[2550, 1], [3380, 0.8], [4210, 0.7], [5330, 0.5], [6820, 0.35]]; // the ringing bands of a sleigh bell

// A stereo room, generated: noise that fades over a couple of seconds and darkens as it goes, after a few early reflections.
function impulse(ctx, secs = 2.6) {
  const sr = ctx.sampleRate, n = Math.floor(sr * secs), buf = ctx.createBuffer(2, n, sr), pre = Math.floor(sr * 0.012), k = 48000 / sr;
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c); let lp = 0, hp = 0;
    for (let i = pre; i < n; i++) {
      const t = (i - pre) / sr;
      lp += (1 - (0.8 - 0.45 * Math.exp(-t * 1.6)) ** k) * (Math.random() * 2 - 1 - lp); // low-pass that closes with time
      hp += (1 - 0.98 ** k) * (lp - hp); // and no rumble
      d[i] = (lp - hp) * Math.exp(-t * 3.1) * Math.min(1, t / 0.004);
    }
    for (const [ms, a] of c ? [[19, 0.3], [37, -0.22], [58, 0.15]] : [[23, 0.28], [41, 0.2], [67, -0.14]]) d[pre + Math.floor(sr * ms / 1000)] += a;
  }
  return buf;
}
// The last line of defence: untouched below -3 dB, then bending smoothly so that nothing ever clips hard. Covers inputs up to +6 dB.
function softClip(n = 2049) {
  const c = new Float32Array(n), a = 0.7;
  for (let i = 0; i < n; i++) { const s = (i / (n - 1) * 2 - 1) * 2, m = Math.abs(s); c[i] = Math.sign(s) * (m < a ? m : a + (1 - a) * Math.tanh((m - a) / (1 - a))) * 0.97; }
  return c;
}

// Everything that makes sound, built on any audio context (the live one, or an offline one for sound-test.html to measure).
export function createEngine(ctx, { clip = true, reverb = true } = {}) {
  const top = Math.min(ctx.sampleRate * 0.45, 15000);
  const gain = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const filter = (type, f, q = 0.7, db = 0) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.gain.value = db; return b; };
  const chain = (...n) => { for (let i = 1; i < n.length; i++) n[i - 1].connect(n[i]); return n[n.length - 1]; };
  const panned = (dest, pan) => { if (!ctx.createStereoPanner) return dest; const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); p.connect(dest); return p; }; // a way in to `dest`, placed left or right

  // ---------- the mix ----------
  const out = gain(1), sum = gain(1); out.connect(ctx.destination);
  // No compressor: the levels leave headroom instead, so every attack arrives exactly as it was struck. Only a freak pile-up meets the clip.
  if (clip) { const shaper = ctx.createWaveShaper(); shaper.curve = softClip(); shaper.oversample = '2x'; chain(sum, filter('highshelf', 7000, 0.7, -2.5), gain(0.5 * TRIM), shaper, out); } // the curve expects half scale
  else sum.connect(out);
  const verb = ctx.createConvolver(); verb.buffer = impulse(ctx); verb.connect(sum);
  const bus = (level, send) => { const g = gain(level); g.connect(sum); if (reverb) chain(g, gain(send), verb); return g; };
  const music = bus(0.5, 0.3), sfx = bus(0.5, 0.22), amb = bus(0.5, 0.1);

  const nbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); { const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const noise = (t, stop, rate = 1) => { const s = ctx.createBufferSource(); s.buffer = nbuf; s.loop = true; s.playbackRate.value = rate; s.start(t, Math.random() * 1.9); if (stop) s.stop(stop); return s; };

  // ---------- voices ----------
  // One struck note. Unless told otherwise it sits across the stereo field by pitch, low notes to the left, like a keyboard.
  function strike(kind, midi, when = 0, len = 1.4, vol = 0.2, pan, dest = music) {
    const v = VOICES[kind], t = ctx.currentTime + Math.max(0, when), f = hz(midi);
    const o = gain(vol * v.level * clamp(1.15 - (midi - 72) / 70, 0.6, 1.15)); // very high notes are eased back: they carry further
    o.connect(panned(dest, pan ?? clamp((midi - 76) / 50, -0.4, 0.4) + rnd(-0.06, 0.06)));
    for (const [mul, amp, dec, cents] of v.partials) {
      const pf = f * mul; if (pf > top) continue;
      const osc = ctx.createOscillator(), g = gain(0), end = t + Math.max(0.05, len * dec);
      osc.frequency.value = pf; if (cents) osc.detune.value = cents;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + v.attack); g.gain.exponentialRampToValueAtTime(amp * 0.002, end);
      chain(osc, g, o); osc.start(t); osc.stop(end + 0.03);
    }
    if (v.tick) { const g = gain(0), d = 0.014; g.gain.setValueAtTime(v.tick, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); chain(noise(t, t + d + 0.01), filter('bandpass', clamp(f * 4, 1800, 6500), 1.5), g, o); }
  }
  const box = (...a) => strike('box', ...a), vibe = (...a) => strike('vibe', ...a), glock = (...a) => strike('glock', ...a);

  // One shake of the sleigh bells: the pellet rattles two or three times against a cluster of narrow, ringing bands.
  function sleigh(when = 0, vol = 0.05, pan = rnd(-0.5, 0.5), dest = sfx) {
    const t = ctx.currentTime + Math.max(0, when), o = gain(vol * SLEIGH), env = gain(0), hits = [1, 0.55, 0.3]; let th = t;
    o.connect(panned(dest, pan));
    hits.forEach((a, i) => { env.gain.setTargetAtTime(a, th, 0.0015); env.gain.setTargetAtTime(0, th + 0.006, i < hits.length - 1 ? 0.012 : 0.05); th += rnd(0.022, 0.04); });
    chain(noise(t, t + 0.45), filter('highpass', 1800), env);
    for (const [f, a] of BELL) chain(env, filter('bandpass', f * rnd(0.98, 1.02), 28), gain(a), o);
    for (const i of [1, 3]) { const osc = ctx.createOscillator(), g = gain(0); osc.frequency.value = BELL[i][0] * rnd(0.99, 1.01); g.gain.setValueAtTime(0.012, t); g.gain.exponentialRampToValueAtTime(0.00002, t + 0.24); chain(osc, g, o); osc.start(t); osc.stop(t + 0.26); } // a little metal ring
  }

  // ---------- effects ----------
  // A pitched sweep: f0 to f1 (then on to f2), optionally through a filter and with a wobble [rate, cents] that dies away.
  function tone({ type = 'sine', f0, f1 = f0, f2, len, vol, attack = 0.005, pan = 0, flt, wobble, when = 0, dest = sfx }) {
    const t = ctx.currentTime + when, osc = ctx.createOscillator(), g = gain(0); osc.type = type;
    osc.frequency.setValueAtTime(f0, t); osc.frequency.exponentialRampToValueAtTime(f1, t + (f2 ? len * 0.55 : len)); if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    if (wobble) { const l = ctx.createOscillator(), lg = gain(0); l.frequency.value = wobble[0]; lg.gain.setValueAtTime(wobble[1], t); lg.gain.exponentialRampToValueAtTime(wobble[1] * 0.1, t + len); chain(l, lg).connect(osc.detune); l.start(t); l.stop(t + len + 0.05); }
    chain(osc, ...(flt ? [filter(...flt)] : []), g, panned(dest, pan)); osc.start(t); osc.stop(t + len + 0.05);
  }
  // A breath of filtered noise, sweeping f0 to f1 and, if asked, across the stereo field.
  function burst({ type = 'bandpass', f0, f1 = f0, q = 0.7, len, vol, attack = 0.2, pan = 0, pan1, when = 0, dest = sfx }) {
    const t = ctx.currentTime + when, f = filter(type, f0, q), g = gain(0), p = panned(dest, pan);
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + len * attack); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    if (pan1 !== undefined && p.pan) { p.pan.setValueAtTime(pan, t); p.pan.linearRampToValueAtTime(pan1, t + len); }
    chain(noise(t, t + len + 0.05), f, g, p);
  }
  // The rush of air: on each side a broad body and a thin whistle, each drifting on its own slow swell so it never sits still.
  let wind = null;
  function setWind(level) {
    const t = ctx.currentTime;
    if (!wind) {
      if (!level) return;
      const g = gain(0), bodies = [], whistles = []; g.connect(amb);
      [-0.7, 0.7].forEach((pan, i) => {
        const src = noise(t, 0, i ? 0.87 : 1), body = filter('bandpass', 400, 0.6), whistle = filter('bandpass', 1200, 5), swell = gain(0.75), lfo = ctx.createOscillator(), slow = ctx.createOscillator();
        chain(src, body, swell, panned(g, pan)); chain(src, whistle, gain(0.5), swell);
        lfo.frequency.value = 0.13 + i * 0.07; slow.frequency.value = 0.05 + i * 0.03;
        chain(lfo, gain(0.25)).connect(swell.gain); chain(lfo, gain(260)).connect(body.detune); chain(slow, gain(420)).connect(whistle.detune);
        lfo.start(t); slow.start(t); bodies.push(body); whistles.push(whistle);
      });
      wind = { g, bodies, whistles };
    }
    wind.g.gain.setTargetAtTime(level * WIND, t, 0.25);
    for (const b of wind.bodies) b.frequency.setTargetAtTime(260 + level * 700, t, 0.25);
    for (const w of wind.whistles) w.frequency.setTargetAtTime(900 + level * 1100, t, 0.25);
  }

  return {
    mute(on) { out.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, 0.015); }, // a quick fade, never a click
    // A door's carol phrase: the melody on the music box, leaning on the beat, over a warm bass and harmony.
    tune(n) {
      const [, base, beat, seq] = TUNES[n - 1], [meter, pickup, minor] = SONGS[n - 1], ev = [], t0 = 0.08; let b = 0;
      for (const s of seq.split(' ')) { const [st, d] = s.split(':').map(Number); ev.push({ b, d, st }); b += d; }
      ev.forEach((e, i) => {
        const k = e.b - pickup, on = Math.abs(k - Math.round(k)) < 1e-6, down = on && k >= 0 && Math.round(k) % meter === 0, last = i === ev.length - 1, t = t0 + e.b * beat;
        box(base + e.st, t + (i ? rnd(-0.007, 0.007) : 0), Math.max(1.2, e.d * beat * 1.9) + (last ? 1 : 0), 0.2 * (down ? 1.08 : on ? 0.96 : 0.84) * rnd(0.95, 1.05));
        if (last) glock(base + e.st + 12, t + 0.02, 1.8, 0.03);
      });
      for (const a of harmonise(ev, meter, pickup, minor, beat, base, b, false)) vibe(a.midi, t0 + a.t + rnd(0, 0.008), a.len * 1.3, a.vol * 1.25);
    },
    chime(i = 0) { const m = 79 + SCALE[Math.abs(i) % SCALE.length]; box(m, 0, 1.8, 0.14); glock(m + 12, 0.01, 1.2, 0.03); },
    locked() { vibe(72, 0, 0.5, 0.085); vibe(67, 0.12, 0.7, 0.085); tone({ f0: 170, f1: 110, len: 0.09, vol: 0.1 }); },
    magic(n = 0) { // a rising glissando, sweeping left to right, as a door opens
      const sc = [0, 2, 4, 7, 9];
      for (let i = 0; i < 16; i++) glock(55 + (n % 5) + sc[i % 5] + 12 * Math.floor(i / 5), i * 0.11 + rnd(0, 0.02), 1.3, 0.07 + i * 0.004, -0.6 + i * 0.08);
      burst({ f0: 500, f1: 5000, q: 2, len: 1.9, vol: 0.05, attack: 0.7, pan: -0.5, pan1: 0.5 });
    },
    // --- Midnight Delivery ---
    tuneNote(n, i, bright) { // one note of a carol per present delivered
      const m = MELODY[n - 1][i % MELODY[n - 1].length]; box(m, 0, 1.6, 0.24); vibe(m - 12, 0, 1.3, 0.09); if (bright) glock(m + 12, 0.03, 1.1, 0.05);
    },
    wind: setWind, // a continuous rush of air; level 0 silences it
    jingle(v = 0.02) { sleigh(0, v); },
    pff() { burst({ type: 'lowpass', f0: 900, f1: 220, q: 0.5, len: 0.3, vol: 0.2 }); },
    whoosh() {
      burst({ f0: 350, f1: 2800, q: 1.4, len: 0.7, vol: 0.45, pan: -0.6, pan1: 0.6 }); burst({ f0: 900, f1: 6000, q: 3, len: 0.55, vol: 0.12, attack: 0.5, pan: 0.5, pan1: -0.5 });
      [0, 4, 7, 12].forEach((s, i) => glock(79 + s, i * 0.05, 0.9, 0.05));
    },
    thud() { // a soft landing in deep snow
      tone({ f0: 150, f1: 45, len: 0.3, vol: 0.45, attack: 0.003 }); tone({ type: 'triangle', f0: 95, f1: 38, len: 0.42, vol: 0.2, flt: ['lowpass', 300] });
      burst({ type: 'lowpass', f0: 1400, f1: 300, q: 0.5, len: 0.35, vol: 0.25, attack: 0.05 }); burst({ f0: 3200, f1: 1800, q: 0.8, len: 0.12, vol: 0.08, attack: 0.1 });
      for (let i = 0; i < 5; i++) glock(96 + ((i * 5) % 9), i * 0.045 + rnd(0, 0.02), 0.25, 0.03, rnd(-0.6, 0.6));
    },
    twinkle(i = 0) { glock(86 + SCALE[Math.abs(i) % SCALE.length], 0, 0.6, 0.06); },
    fanfare() {
      vibe(48, 0.25, 2.4, 0.12); vibe(55, 0.25, 2.4, 0.06);
      [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => { box(72 + s, 0.25 + i * 0.09, 1.7, 0.11, -0.45 + i * 0.15); if (i > 3) glock(84 + s, 0.26 + i * 0.09, 1.2, 0.03); });
    },
    // --- George Swings ---
    boing(big) { // a springy bounce off a hat (or, bigger, off Monty's antlers)
      const f0 = big ? 110 : 170, len = big ? 0.5 : 0.32;
      tone({ type: 'triangle', f0, f1: f0 * 3.2, f2: f0 * 2.4, len, vol: 0.3, attack: 0.012, flt: ['lowpass', 2400], wobble: [big ? 19 : 27, 90] });
      tone({ f0: f0 / 2, f1: f0 * 1.6, f2: f0 * 1.2, len: len * 0.8, vol: 0.14, attack: 0.012 });
      if (big) [0, 7, 12, 19].forEach((s, i) => glock(84 + s, 0.04 + i * 0.05, 0.7, 0.045));
    },
    creak() { // ice under strain: a slow stick-slip rasp and a few glassy ticks
      tone({ type: 'sawtooth', f0: 34, f1: 58, len: 0.26, vol: 1, attack: 0.03, flt: ['bandpass', 2800, 8] }); burst({ f0: 2600, f1: 3800, q: 9, len: 0.22, vol: 0.12 });
      for (let i = 0; i < 4; i++) glock(103 + ((i * 7) % 5), i * 0.05 + rnd(0, 0.02), 0.12, 0.025, rnd(-0.4, 0.4));
    },
    snap() {
      burst({ type: 'highpass', f0: 3000, f1: 900, q: 0.7, len: 0.16, vol: 0.38, attack: 0.02 }); burst({ f0: 1800, f1: 700, q: 2, len: 0.07, vol: 0.25, attack: 0.02 });
      glock(108, 0, 0.3, 0.07); glock(101, 0.03, 0.35, 0.05); glock(96, 0.07, 0.4, 0.03);
    },
    // --- Carol of the Doors ---
    play(midi, when = 0, len = 1.4, vol = 0.22, voice = 'box') { strike(voice, midi, when, len, vol); },
    bells() { for (let i = 0; i < 6; i++) sleigh(i * 0.16, i % 2 ? 0.05 : 0.07, i % 2 ? 0.3 : -0.3); },
    // --- The Friends' Concert: the rhythm section, each scheduled `when` seconds ahead ---
    shake(when = 0, vol = 0.03, pan = -0.45) { sleigh(when, vol, pan); },
    cowbell(when = 0, vol = 0.05, pan = 0.45) { for (const [f, a] of [[587, 1], [845, 0.7]]) tone({ type: 'square', f0: f, len: 0.26, vol: vol * a, attack: 0.002, pan, flt: ['bandpass', 800, 1.2], when: Math.max(0, when) }); },
    drum(when = 0, midi = 48, vol = 0.16, pan = 0.3) { // a hollow log: a pitched thump under a woody knock
      const f = hz(midi), w = Math.max(0, when); tone({ f0: f * 1.5, f1: f, len: 0.24, vol, attack: 0.003, pan, when: w });
      burst({ f0: 1100, q: 3, len: 0.05, vol: vol * 0.5, attack: 0.05, pan, when: w });
    },
    click(when = 0, vol = 0.1) { const w = Math.max(0, when); burst({ f0: 2600, q: 5, len: 0.045, vol, attack: 0.03, when: w }); tone({ type: 'triangle', f0: 1900, f1: 1500, len: 0.04, vol: vol * 0.5, attack: 0.001, when: w }); }, // two mallets knocked together
  };
}
const TRIM = 1.5, SLEIGH = 11, WIND = 0.065; // levels, set by measuring in sound-test.html

// ---------- the one the house plays through ----------
let ctx, eng, enabled = true;
function init() {
  if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false; ctx = new AC(); eng = createEngine(ctx); }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}
export const audio = {
  get on() { return enabled; },
  toggle() { enabled = !enabled; if (eng) { eng.mute(!enabled); if (!enabled) eng.wind(0); } return enabled; },
  unlock() { init(); },
  tuneLen: (n) => MELODY[n - 1].length,
  now() { return enabled && ctx && ctx.state === 'running' ? ctx.currentTime : null; }, // the audio clock, when there is one to keep time by
  wind(level) { if (init()) eng.wind(enabled ? level : 0); },
  latency() { return ctx ? Math.min(0.3, ctx.outputLatency || ctx.baseLatency || 0) : 0; }, // how long after the audio clock a sound is actually heard
};
for (const k of ['tune', 'chime', 'locked', 'magic', 'tuneNote', 'jingle', 'pff', 'whoosh', 'thud', 'twinkle', 'fanfare', 'boing', 'creak', 'snap', 'play', 'bells', 'shake', 'cowbell', 'drum', 'click']) audio[k] = (...a) => { if (enabled && init()) eng[k](...a); };
