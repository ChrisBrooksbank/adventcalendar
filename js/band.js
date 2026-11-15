// The Friends' Concert — everyone on the lawn gathers into a little band and plays a carol, Canadian style:
// George on the glockenspiel, the big snowman on bass bars, the little one on handbells, Monty shaking sleigh bells in his
// antlers, Hamish nodding a cowbell and Maple the beaver drumming on a hollow log, round a campfire under maple-leaf bunting.
// Like Carol of the Doors it plays on the real house scene (borrowed through `host`), so the camera only has to lean in.
// One list of timed events drives both the sound and the playing: each mallet starts to fall before its note so that it lands on it.
import { THREE, TAU, rnd, clamp, lerp, smooth, easeIO, easeBack, M, G, sph, box, cyl, cone, tor, mesh, grp, halo, sprite, glyphTex, disposeTree } from './kit.js';
import { chart } from './songs.js';
import { beaver, blobShadow } from './friends.js';

// ---------- tuning ----------
export const TUNE = {
  gather: 3, leave: 1.7, bow: 2.4, // seconds: walking on, walking home, the bow
  ahead: 0.12,                       // how far ahead of the beat a sound is handed to the audio clock
  up: 0.13, down: 0.15,              // a mallet's rebound and its fall
  look: [0, 1.7, 10.4],              // what the camera watches
};
const DOWN = new THREE.Vector3(0, -1, 0), UP = new THREE.Vector3(0, 1, 0), GOLD = [0xffd34d, 0xffffff, 0xffe9a0], SNOW = [0xffffff, 0xdfe9ff, 0xbfd4ff];
const _d = new THREE.Vector3(), _p = new THREE.Vector3(), _w = new THREE.Vector3(), V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wrap = (a) => a - TAU * Math.round(a / TAU), uniq = (a) => [...new Set(a)].sort((x, y) => x - y);
const gold = () => M(0xffd34d, { m: 0.85, r: 0.25, e: 0x6a4800 });

// ---------- instruments ----------
// A row of tuned bars, low on the left, each the colour of its note. `bars[i].top` is where a mallet should land.
export function glockenspiel(midis, o = {}) {
  const g = new THREE.Group(), tilt = grp(g), n = midis.length, w = Math.min(o.w ?? 0.17, (o.max ?? 1.6) / n), W = w * n, l0 = o.l0 ?? 0.52, l1 = o.l1 ?? 0.3, th = o.th ?? 0.035, bars = [];
  const wood = M(0x6a4326, { r: 0.7 }); tilt.rotation.x = o.tilt ?? 0.4;
  midis.forEach((midi, i) => {
    const f = n > 1 ? i / (n - 1) : 0.5, len = lerp(l0, l1, f), x = (i + 0.5) * w - W / 2, col = new THREE.Color().setHSL((((midi % 12) + 12) % 12) / 12, 0.8, 0.56);
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.35, emissive: col, emissiveIntensity: 0.3 });
    const m = mesh(box(w * 0.82, th, len), mat, x, 0.03 + th / 2, 0, tilt);
    for (const sz of [-1, 1]) mesh(sph(th * 0.3, 6, 5), M(0x20242c, { r: 0.4 }), x, 0.03 + th, sz * len * 0.36, tilt);
    if (o.res) mesh(box(w * 0.7, lerp(0.34, 0.2, f), len * 0.7), wood, x, -lerp(0.34, 0.2, f) / 2, 0, tilt); // a resonator box under each bass bar
    bars.push({ midi, m, mat, col, hit: 0, top: V(x, 0.03 + th, 0.02) });
  });
  for (const sz of [-1, 1]) mesh(box(W + 0.1, 0.03, 0.045), wood, 0, 0.015, sz * l1 * 0.36, tilt);
  for (const sx of [-1, 1]) mesh(box(0.045, 0.05, l0 * 0.9), wood, sx * (W / 2 + 0.04), 0.02, 0, tilt);
  if (o.legs) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = mesh(cyl(0.02, 0.02, o.legs + 0.1, 6), wood, sx * W * 0.4, -o.legs / 2, sz * 0.14, g); l.rotation.z = sx * 0.1; l.rotation.x = -sz * 0.12; }
  tilt.updateMatrix(); for (const b of bars) b.top.applyMatrix4(tilt.matrix);
  g.userData = { bars, W }; return g;
}
// Hang an instrument on a friend; its bars then know where they are in that friend's own space.
function mount(inst, parent, x, y, z) { inst.position.set(x, y, z); parent.add(inst); for (const b of inst.userData.bars) b.p = b.top.clone().add(inst.position); return inst; }

// A mallet held at the end of a limb whose rest direction is `e`. The stick gives a little, so the head always reaches.
function mallet(arm, e, L0, r = 0.045, col = 0xfff0d0) {
  const mg = grp(arm, e.x * L0, e.y * L0, e.z * L0), sg = cyl(0.012, 0.012, 1, 6); sg.translate(0, -0.5, 0); mg.quaternion.setFromUnitVectors(DOWN, e);
  const stick = mesh(sg, M(0xd9b98a, { r: 0.6 }), 0, 0, 0, mg), ball = mesh(sph(r, 12, 10), M(col, { r: 0.45, e: col, ei: 0.3 }), 0, -0.3, 0, mg);
  return { arm, e, L0, S: arm.position, mg, stick, ball, q0: arm.quaternion.clone() };
}
function aim(m, P) { // swing the limb so that the mallet's head is at P (in the limb's parent space)
  _d.copy(P).sub(m.S); const dist = _d.length(), len = Math.max(0.1, dist - m.L0);
  m.arm.quaternion.setFromUnitVectors(m.e, _d.divideScalar(dist)); m.stick.scale.y = len; m.ball.position.y = -len;
}
const limbDir = (arm) => DOWN.clone().applyQuaternion(arm.children[0].quaternion).normalize(); // which way a snowman's twig arm points within its shoulder

// A striker is one hand's (or head's) list of hits. lift() is 1 while it waits, raised, and 0 at the moment it lands:
// it springs up after a hit and falls into the next, fastest at the end.
const striker = () => ({ hits: [], i: 0 });
function lift(s, t, up = TUNE.up, down = TUNE.down) {
  while (s.i < s.hits.length && s.hits[s.i].t <= t) s.i++;
  const a = s.hits[s.i - 1], b = s.hits[s.i], u = a ? clamp((t - a.t) / up) : 1, w = b ? clamp((b.t - t) / down) : 1;
  return Math.min(1 - (1 - u) * (1 - u), 1 - (1 - w) * (1 - w));
}
const since = (s, t) => (s.hits[s.i - 1] ? t - s.hits[s.i - 1].t : 99);
function slide(s, t, rest, out) { // over the bar it last struck, crossing to the next in good time
  const a = s.hits[s.i - 1], b = s.hits[s.i]; if (!a || !b) return out.copy((b ?? a)?.p ?? rest);
  const mv = Math.min(b.t - a.t, 0.45); return out.copy(a.p).lerp(b.p, smooth(0, 1, clamp((t - (b.t - mv)) / Math.max(0.05, mv - 0.08))));
}

// ---------- set dressing ----------
const LEAF = [[0, 1], [0.15, 0.72], [0.33, 0.8], [0.27, 0.38], [0.52, 0.6], [0.57, 0.47], [0.86, 0.52], [0.76, 0.24], [0.9, 0.14], [0.48, -0.18], [0.54, -0.38], [0.06, -0.32], [0.06, -0.75]];
function flagTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#d5202a'; x.fillRect(0, 0, 32, 64); x.fillRect(96, 0, 32, 64);
  x.translate(64, 34); x.beginPath(); LEAF.forEach(([px, py], i) => (i ? x.lineTo(px * 26, -py * 26) : x.moveTo(px * 26, -py * 26)));
  for (let i = LEAF.length - 1; i >= 0; i--) x.lineTo(-LEAF[i][0] * 26, -LEAF[i][1] * 26); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function bunting(x0, x1, y, z, n = 11) { // a sagging line of little flags and fairy bulbs, strung between the lamp posts
  const g = new THREE.Group(), at = (f) => V(lerp(x0, x1, f), -0.8 * (1 - (2 * f - 1) ** 2), 0), pts = []; g.position.set(0, y, z);
  for (let i = 0; i <= 24; i++) pts.push(at(i / 24));
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.018, 5), M(0x0f3a22, { r: 0.6 }), 0, 0, 0, g);
  const tex = flagTex(), fm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.22 }), flags = [];
  for (let i = 0; i < n; i++) {
    const p = at((i + 0.5) / n), f = grp(g, p.x, p.y - 0.02, 0); mesh(new THREE.PlaneGeometry(0.66, 0.36), fm, 0, -0.2, 0, f); f.rotation.z = rnd(-0.08, 0.08); flags.push(f);
    const q = at(i / n); mesh(sph(0.055, 8, 6), G([0xff3b30, 0xffd34d, 0x39d353, 0x3aa0ff, 0xff7ad9][i % 5], 2), q.x, q.y - 0.05, 0, g);
  }
  g.userData.tick = (t) => flags.forEach((f, i) => { f.rotation.x = Math.sin(t * 1.6 + i * 0.9) * 0.14; }); return g;
}
function campfire() { // flames and a glow, but no real light: nothing in the scene has to be re-lit when it appears
  const g = new THREE.Group(), fl = [];
  [[0xff5a10, 0.3, 0.9], [0xff9a20, 0.22, 0.7], [0xffe070, 0.12, 0.45]].forEach(([c, r, h], i) => {
    for (let k = 0; k < (i ? 2 : 3); k++) { const f = mesh(cone(r, h, 8), G(c, 1.8, { o: 0.9 }), rnd(-0.12, 0.12), h / 2 + 0.08, rnd(-0.08, 0.08) + i * 0.03, g); f.userData = { h, p: rnd(TAU) }; fl.push(f); }
  });
  for (let i = 0; i < 4; i++) { const lg = mesh(cyl(0.075, 0.075, 1, 6), M(0x3a2414, { r: 0.9 }), 0, 0.1, 0, g); lg.rotation.z = Math.PI / 2 - 0.25; lg.rotation.y = i * 0.8; }
  for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; mesh(sph(0.13, 7, 5), M(0x70757f, { r: 0.9, flat: true }), Math.cos(a) * 0.62, 0.05, Math.sin(a) * 0.62, g).scale.y = 0.7; }
  const hl = halo(0xff7020, 4.5, 0, 0.6, 0.2, g, 0.45);
  g.userData.tick = (t) => { fl.forEach((f) => { const k = 0.8 + 0.3 * Math.sin(t * 11 + f.userData.p) + 0.15 * Math.sin(t * 23 + f.userData.p * 2); f.scale.y = k; f.position.y = 0.08 + f.userData.h * k / 2; }); hl.material.opacity = 0.4 + 0.08 * Math.sin(t * 13); };
  return g;
}
function hockey() { // two crossed sticks stuck in the snow, and a puck
  const g = new THREE.Group(), wood = M(0xd9b377, { r: 0.6 }), tape = M(0x15151a, { r: 0.7 });
  for (const s of [-1, 1]) {
    const st = grp(g, s * 0.32, 0, 0); st.rotation.z = s * 0.42; mesh(box(0.06, 1.7, 0.035), wood, 0, 0.9, 0, st); mesh(box(0.065, 0.3, 0.04), tape, 0, 1.62, 0, st);
    const bl = mesh(box(0.4, 0.09, 0.03), tape, -s * 0.17, 0.08, 0, st); bl.rotation.z = -s * 0.25; mesh(box(0.065, 0.12, 0.04), M(0xd5202a, { r: 0.6 }), 0, 1.2, 0, st);
  }
  mesh(cyl(0.13, 0.13, 0.06, 16), tape, 0.75, 0.05, 0.3, g); return g;
}
function stump() {
  const g = new THREE.Group(); mesh(cyl(0.4, 0.5, 0.8, 12), M(0x5a3d2a, { r: 0.95, flat: true }), 0, 0.4, 0, g); mesh(cyl(0.37, 0.37, 0.02, 12), M(0xd9b98a, { r: 0.8 }), 0, 0.805, 0, g);
  mesh(tor(0.2, 0.012, 4, 20), M(0xb08a5c), 0, 0.817, 0, g).rotation.x = Math.PI / 2; return g;
}

export function createBand({ host, dom, audio, onExit, mute = false, song = 0 }) {
  const $ = (id) => document.getElementById(id), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ui = { score: $('g-score'), combo: $('g-combo'), tune: $('g-tune'), msg: $('g-msg'), next: $('b-next') };
  const { fx, camera, scene } = host, F = host.band, gy = host.gy, ray = new THREE.Raycaster(), ptr = new THREE.Vector2();

  // ---------- who stands where ----------
  const crew = [
    { o: F.mse, x: -5.3, z: 8.6, look: [4, 26], hops: 5, hop: 0.14, legs: F.mse.userData.legs },
    { o: F.sm1, x: -2.7, z: 10, ry: 0.14, hops: 3, hop: 0.5 },
    { o: F.george, x: 0, z: 11.2, ry: 0, leap: true, up: 0.72 },
    { o: F.sm2, x: 2.1, z: 10.3, ry: -0.16, hops: 4, hop: 0.4 },
    { o: F.cow, x: 6.6, z: 9.6, look: [-2, 26], hops: 5, hop: 0.12, legs: F.cow.userData.legs },
  ];
  for (const f of crew) { f.gy = gy(f.x, f.z); f.y = f.gy + (f.up ?? 0); f.ry ??= Math.atan2(f.look[0] - f.x, f.look[1] - f.z) - Math.PI / 2; f.shadow = f.o.userData.shadow; }
  const bv = beaver(), BV = { x: 3.8, z: 12, y: gy(3.8, 12) }; bv.position.set(BV.x, BV.y, BV.z); bv.rotation.y = -0.3; bv.scale.setScalar(1.15); bv.visible = false; scene.add(bv);

  // ---------- the set: only there while the band is ----------
  const props = [[stump(), 0, 11.2], [campfire(), -4.4, 12.4], [hockey(), 4.4, 8.3]].map(([o, x, z]) => { o.position.set(x, gy(x, z), z); o.visible = false; scene.add(o); return o; });
  props[2].rotation.y = -0.2; const fire = props[1], flags = bunting(-7.4, 7.4, 3.45, 8.3); flags.visible = false; scene.add(flags);
  const shadows = [[0, 11.2, 1.0], [BV.x, BV.z, 1.0], [-4.4, 12.4, 1.1]].map(([x, z, r]) => { const s = blobShadow(r, 0.5); s.position.set(x, gy(x, z) + 0.05, z); s.visible = false; scene.add(s); return s; });

  // ---------- what they play ----------
  const gear = []; // everything that pops into being when the band has gathered
  const add = (o) => { gear.push(o); o.visible = false; return o; };
  const gu = F.george.userData, hands = [-1, 1].map((sx) => ({ sx, m: mallet(sx < 0 ? gu.armL : gu.armR, DOWN.clone(), 0.47, 0.042, sx < 0 ? 0xff5a50 : 0x50d070), s: striker(), rest: V(sx * 0.3, 0.55, 0.78) }));
  const bassH = [-1, 1].map((sx) => { const arm = sx < 0 ? F.sm1.userData.armL : F.sm1.userData.armR; return { sx, m: mallet(arm, limbDir(arm), 0.78, 0.07, 0xd5202a), s: striker(), rest: V(sx * 0.4, 1.0, 0.9) }; });
  const bells = [-1, 1].map((sx) => {
    const arm = sx < 0 ? F.sm2.userData.armL : F.sm2.userData.armR, e = limbDir(arm), b = grp(arm, e.x * 0.9, e.y * 0.9, e.z * 0.9); b.quaternion.setFromUnitVectors(UP, e);
    mesh(cyl(0.11, 0.035, 0.17, 16), gold(), 0, 0, 0, b); mesh(tor(0.11, 0.014, 6, 18), gold(), 0, 0.085, 0, b).rotation.x = Math.PI / 2; mesh(cyl(0.02, 0.02, 0.14, 6), M(sx < 0 ? 0xd5202a : 0x1f7a4a), 0, -0.15, 0, b);
    return { sx, arm, e, b: add(b), q0: arm.quaternion.clone(), s: striker(), up: V(sx * 0.5, 0.6, 0.62).normalize(), dn: V(sx * 0.4, -0.2, 0.9).normalize() };
  });
  // sleigh bells on a red ribbon along each of Monty's antlers
  const mu = F.mse.userData, jingles = [], shake = striker();
  for (const sz of [-1, 1]) for (let i = 0; i < 5; i++) {
    const f = i / 4, j = grp(mu.head, 0.09, 0.15 + 0.2 * f, sz * (0.28 + 0.7 * f)); mesh(cyl(0.008, 0.008, 0.1, 4), M(0xd5202a), 0, -0.05, 0, j);
    mesh(sph(0.055, 10, 8), gold(), 0, -0.13, 0, j); mesh(box(0.012, 0.03, 0.09), M(0x2a1a12), 0.045, -0.14, 0, j); jingles.push(add(j));
  }
  // Hamish's cowbell, swinging at his throat
  const cu = F.cow.userData, cbell = add(grp(cu.neck, 0.25, -0.1, 0)), clank = striker();
  mesh(cyl(0.012, 0.012, 0.08, 5), M(0x3a2414), 0, -0.04, 0, cbell); const cb = mesh(cyl(0.055, 0.1, 0.17, 4), M(0xc9963a, { m: 0.8, r: 0.35, e: 0x4a3008 }), 0, -0.16, 0, cbell); cb.rotation.y = Math.PI / 4; cb.scale.z = 0.7;
  // Maple's log drum
  const bu = bv.userData, log = grp(bv, 0, 0.36, 0.64), bark = M(0x6b4a2e, { r: 0.95, flat: true });
  for (const [r, len, m] of [[0.2, 1.0, bark], [0.165, 1.01, M(0xd9b98a, { r: 0.8 })], [0.11, 1.02, M(0x24160e, { r: 0.9 })]]) mesh(cyl(r, r, len, 14), m, 0, 0, 0, log).rotation.z = Math.PI / 2;
  for (const sx of [-1, 1]) mesh(box(0.1, 0.2, 0.34), bark, sx * 0.34, -0.26, 0, log);
  const drumH = [-1, 1].map((sx) => ({ sx, m: mallet(sx < 0 ? bu.armL : bu.armR, DOWN.clone(), 0.3, 0.04, 0xfff0d0), s: striker(), p: V(sx * 0.24, 0.57, 0.62) })), thump = striker();
  for (const h of [...hands, ...bassH, ...drumH]) add(h.m.mg);
  add(log);
  let glk = null, bass = null; // the tuned bars are rebuilt for each carol: just the notes it needs

  // ---------- state ----------
  let active = false, state = 'idle', aspect = 1, list = [], idx = 0, ch = null, ev = [], ai = 0, fi = 0, count = striker();
  let songT = -99, vt = -99, t0 = null, gk = 0, bowT = 0, bowK = 0, flare = 0, gearK = 0, camK = 0, struck = 0, maxErr = 0, finished = false, label = '';
  const camTo = V(), camFrom = V(), lookTo = V(...TUNE.look), lookFrom = V(), notes = [];
  for (let i = 0; i < 8; i++) { const s = sprite(glyphTex(i % 2 ? '♪' : '♫'), 0xffffff, 0.5, 0, 0, 0, scene, 0); s.visible = false; notes.push({ s, life: 0, vx: 0 }); }

  function msg(text, long) { ui.msg.textContent = text; ui.msg.className = ''; void ui.msg.offsetWidth; ui.msg.className = long ? 'show long' : 'show'; }
  let lastHud = ''; function hud() { if (label === lastHud) return; lastHud = label; ui.score.textContent = 'The Friends’ Concert'; ui.combo.textContent = ''; ui.tune.textContent = label; }
  const snd = (k, ...a) => { if (!mute) audio[k](...a); };
  function spark(o, n, cols, sp = 1.6) { o.getWorldPosition(_w); fx.burst(_w.x, _w.y + 0.08, _w.z, n, sp, cols, 0.7, 0.75, 0.4); }
  function note(bar) { // a little ♪ drifts up from the glockenspiel
    const q = notes.find((x) => x.life <= 0); if (!q) return; bar.m.getWorldPosition(q.s.position); q.s.position.y += 0.3; q.life = 1; q.vx = rnd(-0.4, 0.4); q.s.material.color.copy(bar.col).lerp(new THREE.Color(0xffffff), 0.35); q.s.visible = true;
  }

  // ---------- getting a carol ready ----------
  function swap(old, inst, parent, x, y, z) { if (old) { old.parent.remove(old); gear.splice(gear.indexOf(old), 1); disposeTree(old); } add(mount(inst, parent, x, y, z)); inst.visible = gearK > 0; inst.scale.setScalar(Math.max(0.001, gearK)); return inst; }
  function share(hs, hit, W) { // deal the notes between two hands: each takes its own side, and they take turns in the middle or when one is busy
    const last = [-9, -9]; let prev = 1;
    for (const { t, p } of hit) { let side = Math.abs(p.xb) < W * 0.17 ? 1 - prev : p.xb < 0 ? 0 : 1; if (t - last[side] < 0.2 && t - last[1 - side] >= 0.2) side = 1 - side; hs[side].s.hits.push({ t, p }); last[side] = t; prev = side; }
  }
  function prepare(n) {
    ch = chart(n); const { beat, meter, pickup } = ch, mids = uniq(ch.notes.map((x) => x.midi)), bassEv = ch.acc.filter((a) => a.vol >= 0.06), bm = uniq(bassEv.map((a) => a.midi));
    glk = swap(glk, glockenspiel(mids, { legs: 1.25, tilt: 0.5 }), F.george, 0, 0.4, 0.8);
    bass = swap(bass, glockenspiel(bm, { w: 0.27, max: 1.9, l0: 0.62, l1: 0.46, th: 0.06, res: true, legs: 0.92, tilt: 0.3 }), F.sm1, 0, 0.92, 0.97);
    for (const inst of [glk, bass]) for (const b of inst.userData.bars) b.p.xb = b.p.x - inst.position.x;
    for (const h of [...hands, ...bassH, ...drumH, ...bells]) h.s = striker(); shake.hits = []; clank.hits = []; thump.hits = []; shake.i = clank.i = thump.i = 0; count = striker();
    ev = []; for (let k = meter; k >= 1; k--) { ev.push({ t: -k * beat, kind: 'click' }); count.hits.push({ t: -k * beat }); }
    const mel = ch.notes.map((nt) => ({ t: nt.t, kind: 'mel', midi: nt.midi, d: nt.d, bar: glk.userData.bars[mids.indexOf(nt.midi)] })); ev.push(...mel);
    share(hands, mel.map((e) => ({ t: e.t, p: e.bar.p })), glk.userData.W);
    const low = bassEv.map((a) => ({ t: a.t, kind: 'acc', a, bar: bass.userData.bars[bm.indexOf(a.midi)] })); ev.push(...low);
    share(bassH, low.map((e) => ({ t: e.t, p: e.bar.p })), bass.userData.W);
    let side = 0, lastT = -1; for (const a of ch.acc) if (a.vol < 0.06) { const ring = a.t > lastT + 1e-6; if (ring) { lastT = a.t; bells[side].s.hits.push({ t: a.t }); } ev.push({ t: a.t, kind: 'acc', a, ring: ring ? bells[side] : null }); if (ring) side = 1 - side; }
    // the rhythm section: sleigh bells on the beat, the log drum under the bass, the cowbell answering
    const bassAt = new Map(bassEv.map((a) => [Math.round(a.t / beat), a.midi])), fast = beat < 0.3;
    for (let b = 0; b < ch.beats; b++) {
      const k = b - pickup, pos = ((k % meter) + meter) % meter, t = b * beat, down = pos === 0;
      if (!fast || pos % 2 === 0 || meter === 3) { ev.push({ t, kind: 'shake', down }); shake.hits.push({ t }); }
      if (k < 0) continue;
      if (bassAt.has(b)) { const lo = down ? 0 : 1; ev.push({ t, kind: 'drum', midi: bassAt.get(b), lo }); drumH[lo].s.hits.push({ t, p: drumH[lo].p }); if (down) thump.hits.push({ t }); }
      else if (meter === 3 ? pos === 2 : pos % 2 === 1) { ev.push({ t, kind: 'cow' }); clank.hits.push({ t }); }
    }
    ev.push({ t: ch.notes[ch.notes.length - 1].t, kind: 'fin' }); ev.sort((a, b) => a.t - b.t);
    ai = fi = 0; struck = 0; maxErr = 0; finished = false; bowT = bowK = 0; songT = vt = -99; t0 = null;
    label = `♪ ${ch.name}` + (list.length > 1 ? ` · one of ${list.length} carols on tonight’s programme` : ' · another carol joins the programme each day of December'); hud();
  }
  function begin() { state = 'play'; songT = -(ch.meter * ch.beat) - 0.5; vt = songT; t0 = null; ai = fi = 0; msg(ch.name, true); }
  function play(n) { idx = Math.max(0, list.indexOf(n)); prepare(list[idx]); if (state !== 'gather') begin(); }
  function another() { if (state !== 'play' && state !== 'bow') return; idx = (idx - 1 + list.length) % list.length; prepare(list[idx]); begin(); }

  // ---------- playing ----------
  function sound(e, w) { // hand one event to the audio clock, `w` seconds ahead
    switch (e.kind) {
      case 'mel': snd('play', e.midi + 12, w, Math.max(1, e.d * 1.8), 0.16, 'glock'); snd('play', e.midi, w, Math.max(1, e.d * 1.8), 0.09); break;
      case 'acc': snd('play', e.a.midi, w, e.a.len * 1.3, e.a.vol * 1.25, 'vibe'); break;
      case 'shake': snd('shake', w, e.down ? 0.04 : 0.024); break;
      case 'cow': snd('cowbell', w, 0.032); break;
      case 'drum': snd('drum', w, e.midi, e.lo ? 0.1 : 0.13); break;
      case 'click': snd('click', w, 0.1); break;
    }
  }
  function show(e) { // …and, when its moment comes, what it looks like
    switch (e.kind) {
      case 'mel': e.bar.hit = 1; struck++; maxErr = Math.max(maxErr, vt - e.t); spark(e.bar.m, 7, [e.bar.col, 0xffffff]); if (Math.random() < 0.4) note(e.bar); break;
      case 'acc': if (e.bar) { e.bar.hit = 1; spark(e.bar.m, 4, [e.bar.col, 0xffffff]); } else if (e.ring) spark(e.ring.b, 3, GOLD, 1.2); break;
      case 'shake': if (e.down) spark(jingles[2 + 5 * Math.floor(rnd(2))], 3, GOLD, 1.2); break;
      case 'cow': spark(cb, 2, GOLD, 1); break;
      case 'drum': spark(log, 6, SNOW, 1.4); break;
      case 'click': spark(hands[0].m.ball, 5, GOLD, 1.2); break;
      case 'fin': finished = true; flare = 1.5; for (let i = 0; i < 8; i++) host.shoot(); for (const f of crew) spark(f.o, 26, GOLD, 3.5); spark(bv, 26, GOLD, 3.5); break;
    }
  }
  function step(dt) {
    songT += dt; const a = mute ? null : audio.now(); if (a !== null) { if (t0 === null || Math.abs(a - t0 - songT) > 0.12) t0 = a - songT; else songT = a - t0; } else t0 = null; // keep to the audio clock when it is running
    vt = songT - (a !== null ? audio.latency() : 0); // what is being heard right now
    while (ai < ev.length && ev[ai].t < songT + TUNE.ahead) { const e = ev[ai++]; sound(e, Math.max(0, e.t - songT)); }
    while (fi < ev.length && ev[fi].t <= vt) show(ev[fi++]);
    if (state === 'play' && songT > ch.len + 1.3) { state = 'bow'; bowT = 0; msg('Bravo!'); }
  }

  // ---------- coming and going ----------
  function travel(k) { // k: 0 at home, 1 on stage and ready (everyone is in place by 0.7, then the instruments appear)
    const kc = clamp(k / 0.7), e = easeIO(kc), air = kc > 0 && kc < 1, T = host.time();
    for (const f of crew) {
      const o = f.o, h = f.home; o.position.x = lerp(h.x, f.x, e); o.position.z = lerp(h.z, f.z, e); o.rotation.y = h.ry + f.dry * e;
      o.userData.y0 = lerp(h.y, f.y, e) + (!air ? 0 : f.leap ? Math.sin(kc * Math.PI) * 2.4 : Math.abs(Math.sin(kc * Math.PI * f.hops)) * f.hop); o.position.y = o.userData.y0;
      f.flip = f.leap && air ? e * TAU : 0;
      if (f.legs) f.legs.forEach((l, i) => { l.rotation.z = air ? Math.sin(T * 10 + (i < 2 ? 0 : Math.PI) + (i % 2) * 0.7) * 0.45 * Math.sin(kc * Math.PI) : 0; });
      if (f.shadow) f.shadow.position.set(o.position.x, lerp(h.y, f.gy, e) + 0.05, o.position.z);
    }
    const pop = smooth(0.4, 0.85, k), ps = Math.max(0.001, easeBack(pop)), on = pop > 0;
    props.forEach((p) => { p.visible = on; p.scale.setScalar(ps); }); flags.visible = on; flags.scale.set(1, Math.max(0.001, pop), 1); shadows.forEach((s) => { s.visible = on; s.material.opacity = 0.5 * pop; });
    bv.visible = k > 0.35; bv.position.y = BV.y - (1 - easeBack(smooth(0.35, 0.75, k))) * 1.6;
    gearK = smooth(0.72, 1, k); const gs = Math.max(0.001, easeBack(gearK)); for (const o of gear) { o.visible = gearK > 0; o.scale.setScalar(gs); }
    if (gearK <= 0) rest();
  }
  function rest() { // hand every borrowed limb back the way it was found
    for (const h of [...hands, ...bassH, ...drumH]) h.m.arm.quaternion.copy(h.m.q0); for (const b of bells) b.arm.quaternion.copy(b.q0);
    gu.head.rotation.x = 0; gu.body.rotation.x = 0; F.sm1.userData.head.rotation.x = F.sm2.userData.head.rotation.x = 0; mu.head.rotation.x = 0; bu.body.rotation.x = bu.head.rotation.x = bu.tail.rotation.x = 0;
  }
  function pose(T) { // everyone's playing, read straight off the time being heard
    const beatPh = ch ? (vt / ch.beat) * Math.PI : 0, nodB = 0.5 + 0.5 * Math.cos(beatPh * 2);
    // George: two mallets on the glockenspiel (and, for the count-in, knocked together over his head)
    const cl = lift(count, vt, 0.1, 0.12), cin = ch ? smooth(-ch.beat * 0.8, -ch.beat * 0.3, vt) : 0;
    for (const h of hands) { const l = lift(h.s, vt); slide(h.s, vt, h.rest, _p); _p.y += l * 0.2; _p.z -= l * 0.04; if (cin < 1) _p.lerp(_w.set(h.sx * (0.035 + 0.22 * cl), 1.5, 0.42), 1 - cin); aim(h.m, _p); }
    gu.head.rotation.x = 0.16 * cin + 0.05 * nodB; gu.body.rotation.x = 0.45 * bowK; F.george.rotation.x = crew[2].flip;
    // the big snowman: bass bars
    for (const h of bassH) { const l = lift(h.s, vt, 0.16, 0.17); slide(h.s, vt, h.rest, _p); _p.y += l * 0.3; _p.z -= l * 0.05; aim(h.m, _p); }
    F.sm1.userData.head.rotation.x = 0.1 + 0.04 * nodB + 0.45 * bowK; F.sm2.userData.head.rotation.x = 0.04 * nodB + 0.45 * bowK;
    // the little snowman: a handbell in each hand, rung in turn
    for (const b of bells) { const l = lift(b.s, vt, 0.18, 0.14); b.arm.quaternion.setFromUnitVectors(b.e, _d.copy(b.dn).lerp(b.up, l).normalize()); }
    // Monty shakes his antlers; Hamish nods his bell
    const ls = lift(shake, vt, 0.2, 0.12), sj = Math.exp(-since(shake, vt) * 5);
    mu.neck.rotation.z = -mu.nk + 0.05 * ls - 0.12 * (1 - ls) - 0.45 * bowK; mu.head.rotation.x = (shake.i % 2 ? 1 : -1) * 0.1 * (1 - ls);
    jingles.forEach((j, i) => { j.rotation.x = Math.sin(vt * 38 + i * 1.7) * 0.6 * sj; });
    const lc = lift(clank, vt, 0.2, 0.14), sc = since(clank, vt);
    cu.neck.rotation.z = -cu.nk + 0.06 * lc - 0.18 * (1 - lc) - 0.4 * bowK; cbell.rotation.z = -cu.neck.rotation.z + Math.sin(sc * 19) * 0.7 * Math.exp(-sc * 5);
    // Maple: two sticks on the log, and a slap of the tail on the first beat of the bar
    let lm = 1; for (const h of drumH) { const l = lift(h.s, vt, 0.14, 0.15); lm = Math.min(lm, l); _p.copy(h.p); _p.y += l * 0.2; aim(h.m, _p); }
    lift(thump, vt); const nx = thump.hits[thump.i], tl = nx ? clamp(1 - (nx.t - vt) / 0.3) : 0;
    bu.tail.rotation.x = 0.5 * Math.sin(tl * Math.PI); bu.head.rotation.x = 0.1 * (1 - lm) + 0.03 * nodB; bu.body.rotation.x = 0.4 * bowK; bu.tick(T);
  }

  // ---------- input ----------
  function exit() { if (!active || exit.busy) return; exit.busy = true; onExit?.(); }
  function onDown(e) { // tap a player for a hop and a sparkle
    e.preventDefault(); audio.unlock(); if (state !== 'play') return;
    ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects([...crew.map((f) => f.o), bv], true)[0];
    if (!hit) { ray.ray.at(12, _w); fx.burst(_w.x, _w.y, _w.z, 14, 2, GOLD, 1, 0.8, 1); return; }
    let o = hit.object; while (o.parent && o.parent !== scene) o = o.parent;
    if (o !== bv && o !== F.george) o.userData.t0 = host.time(); spark(o, 30, GOLD, 3); snd('twinkle', Math.floor(rnd(8)));
  }
  const onKey = (e) => { if (e.key === 'Escape') exit(); }, noMenu = (e) => e.preventDefault();
  const LISTEN = [[dom, 'pointerdown', onDown], [dom, 'contextmenu', noMenu], [window, 'keydown', onKey]];

  // ---------- frame ----------
  function frame() { // the whole band, hooves to bunting (from further back on a tall phone)
    const tv = Math.tan((camera.fov * Math.PI) / 360), D = Math.max(3.5 / tv, 8.3 / (tv * aspect)); camTo.set(0, 2 + D * 0.14, TUNE.look[2] + D);
  }
  function update(dt) {
    host.world(dt); if (!active) return; const T = host.time();
    if (state !== 'leave') {
      camK = Math.min(1, camK + dt / TUNE.gather); const e = easeIO(camK), prog = ch && songT > 0 ? clamp(songT / ch.len) : 0;
      host.camPos.lerpVectors(camFrom, camTo, e); host.camLook.lerpVectors(lookFrom, lookTo, e);
      if (!reduced) { host.camPos.x += Math.sin(T * 0.13) * 1.5 * e; host.camPos.z -= (camTo.z - TUNE.look[2]) * 0.07 * prog + bowK * 0.6; }
    }
    if (state === 'gather') { const k0 = gk; gk = Math.min(1, gk + dt / TUNE.gather); travel(gk); if (k0 < 0.4 && gk >= 0.4) { fx.burst(BV.x, BV.y + 0.2, BV.z, 50, 3.5, SNOW, 1.1, 1.2, 3); props.forEach((p) => spark(p, 24, GOLD, 3)); } if (gk >= 1) begin(); }
    else if (state === 'play') step(dt);
    else if (state === 'bow') { step(dt); bowT += dt; bowK = Math.sin(clamp(bowT / (TUNE.bow - 0.5)) * Math.PI); if (bowT > TUNE.bow) { bowK = 0; exit(); } }
    else if (state === 'leave') { gk = Math.max(0, gk - dt / TUNE.leave); bowK = 0; travel(gk); if (gk <= 0) settle(); }
    if (gearK > 0) pose(T);
    for (const inst of [glk, bass]) if (inst) for (const b of inst.userData.bars) { b.hit *= Math.exp(-dt * 5); b.mat.emissiveIntensity = 0.3 + b.hit * 2.4; }
    for (const q of notes) if (q.life > 0) { q.life -= dt / 1.7; q.s.position.y += dt * 0.9; q.s.position.x += q.vx * dt; q.s.material.opacity = Math.min(1, q.life * 2) * 0.9; if (q.life <= 0) q.s.visible = false; }
    fire.userData.tick(T); flags.userData.tick(T);
    flare *= Math.exp(-dt * 0.9); host.aur.uGain.value = host.aurGain * (1 + 0.9 * gearK) + flare * 2.2;
    if (state === 'play' || state === 'bow') hud();
  }

  function start() {
    if (active) return; active = true; exit.busy = false; LISTEN.forEach(([t, e, f]) => t.addEventListener(e, f, { passive: false }));
    for (const f of crew) { const o = f.o; f.home = { x: o.position.x, y: o.userData.y0, z: o.position.z, ry: o.rotation.y }; f.dry = wrap(f.ry - o.rotation.y); }
    list = host.setlist(); idx = song && list.includes(song) ? list.indexOf(song) : list.length - 1; // the newest carol first
    $('g-quit').onclick = exit; ui.next.onclick = () => { ui.next.blur(); another(); }; ui.next.style.display = list.length > 1 ? '' : 'none';
    camFrom.copy(host.camPos); lookFrom.copy(host.camLook); camK = 0; frame(); flare = 0; gk = 0; state = 'gather'; lastHud = ''; if (host.prop) host.prop.visible = false;
    prepare(list[idx]); snd('chime', 3); for (const f of crew) spark(f.o, 14, GOLD, 2.5);
  }
  function leave() { if (active && state !== 'leave') state = 'leave'; } // the walk home; main pulls the camera back meanwhile
  function settle() { // everything exactly as it was
    travel(0); for (const f of crew) { f.o.rotation.x = 0; f.flip = 0; } for (const q of notes) { q.life = 0; q.s.visible = false; }
    host.aur.uGain.value = host.aurGain; if (host.prop) host.prop.visible = true; state = 'idle';
  }
  function stop() {
    if (!active) return; active = false; LISTEN.forEach(([t, e, f]) => t.removeEventListener(e, f)); gk = 0; settle();
    if (finished) host.toast(list.length < host.total ? 'The friends take a bow. Another carol joins their programme each day of December.' : 'The friends take a bow. Merry Christmas!', 5000);
  }
  function resize(a) { aspect = a; frame(); }
  return {
    scene, camera, inPlace: true, start, stop, leave, update, resize, another, play,
    get stats() { return { state, song: ch?.n, notes: ch?.notes.length, struck, maxErr: +maxErr.toFixed(4), t: +songT.toFixed(1) }; },
  };
}
