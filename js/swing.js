// George Swings — hold to hook the nearest fairy light with a strand of tinsel, let go to fling.
// A side-on, one-button pendulum swinger. The physics live in the x–y plane (George travels +x);
// the moonlit forest is built in 3D around that plane and recycled as he goes.
import {
  THREE, TAU, PX, rnd, pick, clamp, lerp, easeOut, M, G, sph, cyl, cone, tor, mesh, grp, star3d, halo,
  starfield, Particles, skyDome, aurora, moon, light, lampPost, pineGeometry, mulberry, hash, groundTex,
} from './kit.js';
import { tuneName } from './audio.js';
import { monkey, snowman, moose } from './friends.js';

// ---------- tuning: everything the feel depends on ----------
export const TUNE = {
  g: 28, fall: 1.3, vyMax: 24,                 // gravity, extra gravity when falling, terminal fall speed
  reach: 4.6, lMin: 1.3, lPref: 3.3, reel: 3.2, reelPow: 1.4, clear: 1.25, // tinsel: grab radius, lengths, reel-in speed, ground clearance
  keep: 0.8, grabMin: 5.5, swingTo: 1.75, pump: 8, swingMax: 16, lazy: 2.6, // momentum kept on a grab, slowest swing, the amplitude (radians) George kicks a tired swing back up to, and how long he can dangle before a streak is lost
  perfLo: 0.45, perfHi: 1.05, perfBoost: 1.12, vMax: 17, // the perfect release window (radians above horizontal) and its reward
  leapX: 7.5, leapY: 10,                       // the first leap off the lamp post
  hatV: 13.5, hatX: 6.5, antlerV: 17.5, antlerX: 9.5, // bounce pads
  creak: 0.8, icicle: 1.6,                   // icicles complain, then snap
};
const COLS = [0xff3b30, 0xffd34d, 0x39d353, 0x3aa0ff, 0xff7ad9].map((c) => new THREE.Color(c)), GOLDC = new THREE.Color(0xffb838);
const SPARK = [0xffd34d, 0xffffff, 0xff9a50], SNOW = [0xffffff, 0xdfe9ff, 0xbfd4ff];
const NB = 420, NT = 170, NM = 90, AHEAD = 75, BEHIND = 34, GS = 1.25, HALF = 0.78, PERCH = 4.02 + HALF;
const _m4 = new THREE.Matrix4(), _c = new THREE.Color(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), wrap = (a) => a - TAU * Math.round(a / TAU);

// Snow drifting through the wood; it wraps around the camera as we travel.
function sideSnow(n = 1500) {
  const pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos.set([rnd(0, 70), rnd(0, 26), rnd(-22, 10)], i * 3); seed[i] = Math.random(); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCam: { value: 0 }, uPx: PX }, transparent: true, depthWrite: false,
    vertexShader: `attribute float aSeed; uniform float uTime,uCam,uPx; varying float vA;
      void main(){ vec3 p=position; p.y=mod(p.y-uTime*(.7+aSeed*1.3),26.); p.x=uCam+mod(p.x-uCam-uTime*(.3+aSeed),70.)-35.+sin(uTime*.5+aSeed*40.)*.6;
      vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=min(uPx*(45.+aSeed*60.)/-mv.z,uPx*14.);
      vA=(.4+.5*aSeed)*smoothstep(.6,3.5,-mv.z); }`,
    fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); gl_FragColor=vec4(vec3(.95,.97,1.),smoothstep(.5,.15,d)*vA); }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.userData.u = mat.uniforms; return pts;
}

export function createSwing({ dom, audio, seed = 'tonight', onExit, setPR, getPR, bot = false, adaptive = true, record = true }) {
  const $ = (id) => document.getElementById(id), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, coarse = matchMedia('(pointer: coarse)').matches;
  const ui = { score: $('g-score'), combo: $('g-combo'), tune: $('g-tune'), msg: $('g-msg'), pops: $('g-pops'), final: $('g-final'), stats: $('g-stats'), best: $('g-best') };
  const seedN = hash('swing' + seed);

  // ---------- scene ----------
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 1, 0.1, 600), far = grp(scene);
  far.add(skyDome(0x040820, 0x1f3a78)); scene.fog = new THREE.FogExp2(0x16285c, 0.011);
  scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x39486e, 1.05)); const dl = new THREE.DirectionalLight(0xcfdcff, 1.1); dl.position.set(-8, 14, 10); scene.add(dl);
  const sky = starfield(1100), aur = aurora(150, 38, 70, 0x35ffb0, 0x9050ff, 0.8, 2.8), snow = sideSnow(); far.add(sky, aur); scene.add(snow);
  moon(8, 24, 33, -170, far).traverse((o) => { if (o.material) o.material.fog = false; });
  const gtex = groundTex(), ground = mesh(new THREE.PlaneGeometry(440, 440).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc2d0ee, roughness: 0.95, map: gtex }), 0, 0, -130, scene);
  const fx = new Particles(2600); scene.add(fx.points);
  const treeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  const trees = [0, 1, 2].map((k) => new THREE.InstancedMesh(pineGeometry(true, k), treeMat, NT)), mounds = new THREE.InstancedMesh(sph(1, 14, 8), M(0xcad6f2, { r: 0.95 }), NM);
  const bulbs = new THREE.InstancedMesh(sph(0.17, 10, 8), new THREE.MeshBasicMaterial(), NB);
  for (const o of [...trees, mounds, bulbs]) { o.frustumCulled = false; scene.add(o); }
  for (let i = 0; i < NB; i++) bulbs.setColorAt(i, _c.set(0));
  put0(lampPost(3.3), 0, 0, 0);
  function put0(o, x, y, z) { o.position.set(x, y, z); scene.add(o); return o; }

  // George, pivoting about his middle, and his strand of tinsel
  const rig = grp(scene), george = monkey(), gu = george.userData; george.position.y = -HALF; george.scale.setScalar(GS); george.rotation.y = 0.9; rig.add(george);
  const glow = light(0xffd0a0, 16, 11, 0, 0.5, 2.6, rig), glowC = new THREE.Color(0xffd0a0);
  const ropeOff = G(0xdfe8ff, 1.15), ropeOn = G(0xffd34d, 2.8), rope = mesh(cyl(0.035, 0.035, 1, 6).translate(0, 0.5, 0), ropeOff, 0, 0, 0, scene), hook = halo(0xfff0c0, 1.3, 0, 0, 0, scene, 0.9);
  const ring = mesh(tor(0.36, 0.035, 6, 28), G(0xffffff, 1.5, { o: 0.9, add: true }), 0, 0, 0, scene);
  const marker = grp(scene); mesh(cyl(0.05, 0.07, 2.4, 6), M(0x6a4a2a), 0, 1.2, 0, marker); mesh(star3d(0.42, 0.12), G(0xffe070, 2.4), 0, 2.75, 0, marker); halo(0xffd050, 3.2, 0, 2.75, 0, marker, 0.6).material.fog = true;

  // ---------- pools ----------
  function pool(n, make) {
    const free = []; for (let i = 0; i < n; i++) { const o = make(i); o.visible = false; scene.add(o); free.push(o); }
    return { get() { const o = free.pop(); if (o) o.visible = true; return o; }, put(o) { o.visible = false; free.push(o); } };
  }
  const wireMat = new THREE.LineBasicMaterial({ color: 0x3a7a58 }), iceMat = new THREE.LineBasicMaterial({ color: 0xcfe4ff }), LN = 26;
  const linePool = pool(12, () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(LN * 3), 3)); const l = new THREE.Line(g, wireMat); l.frustumCulled = false; return l; });
  const iceGeo = cone(0.17, 1.2, 6).rotateX(Math.PI).translate(0, -0.6, 0), iceM = M(0xdcecff, { r: 0.15, e: 0x8fb8ff, ei: 0.55 });
  const icePool = pool(16, () => new THREE.Mesh(iceGeo, iceM));
  const starGeo = star3d(0.34, 0.1), starMat = G(0xffe070, 2.2), starPool = pool(40, () => new THREE.Mesh(starGeo, starMat));
  const manPool = pool(6, (i) => { const o = snowman(i % 2 ? { scarf: 0x39d353, hat: 'bobble' } : { scarf: i % 4 ? 0x3a7ad0 : 0xc8102e }); o.rotation.y = 0.45; return o; });
  const moosePool = pool(3, () => { const o = moose(); o.rotation.y = -0.4; o.scale.setScalar(1.5); return o; });

  // ---------- state ----------
  const pts = [], ents = [], stars = [], bouncers = [], falling = [], keys = {};
  let R = mulberry(seedN), ex = 0, ey = 6, dressX = 0, chunkI = 0, lastChunk = '', bi = 0, ti = 0, mi = 0, sidN = 0, colN = 0;
  let state = 'idle', active = false, T = 0, tPlay = 0, readyT = 0, endT = 0, overT = 0, freeze = 0, shake = 0, flare = 0;
  let mode = 'perch', px = 0, py = PERCH, vx = 0, vy = 0, anchor = null, L = 3, th = 0, om = 0, th0 = 0, swingT = 0, looped = false, creaked = false;
  let held = false, lock = 0, lastB = null, lastLock = 0, cand = null, ox = 0, oy = 0, rz = 0, rzBase = 0, flip = 1, ropeK = 0, boostT = 0, windT = 0;
  let maxX = 0, bonus = 0, shown = -1, combo = 0, bestCombo = 0, grabs = 0, lit = 0, perfects = 0, bounces = 0, snaps = 0, loops = 0, carols = 0, tuneN = 1, tuneI = 0, starI = 0, hinted = 0;
  let rel = null, cx = 6, cy = 6.5, cz = 18, aspect = 1.6, emaDt = 1 / 60, slowT = 0, lastNow = 0, lastHud = '', bestD = 0, passed = false;
  const rr = (a, b) => a + R() * (b - a), ri = (n) => Math.floor(R() * n), coin = (p = 0.5) => R() < p, score = () => Math.floor(maxX) + bonus;

  // ---------- world building ----------
  function tree(x, z, h, wk = 1) {
    const w = h * wk * (0.85 + Math.random() * 0.3), tm = trees[ti % 3];
    tm.setMatrixAt(Math.floor(ti / 3), _m4.compose(_v.set(x, -0.1, z), _q.setFromAxisAngle(UP, Math.random() * TAU), _s.set(w, h, w))); ti = (ti + 1) % (NT * 3); tm.instanceMatrix.needsUpdate = true;
  }
  function mound(x, z, r) { mounds.setMatrixAt(mi, _m4.compose(_v.set(x, -r * 0.04, z), _q.identity(), _s.set(r, r * 0.22, r * (0.7 + Math.random() * 0.6)))); mi = (mi + 1) % NM; mounds.instanceMatrix.needsUpdate = true; }
  function dress(x1) {
    for (; dressX < x1; dressX += 2.4) {
      tree(dressX + rr(0, 2.4), -rr(5.5, 16), rr(5, 11)); tree(dressX + rr(0, 2.4), -rr(16, 46), rr(6, 14));
      if (coin(0.3)) mound(dressX, rr(1.5, 6), rr(1, 2.6)); if (coin(0.25)) mound(dressX, -rr(3, 30), rr(3, 9)); if (coin(0.08)) mound(dressX, -rr(60, 110), rr(18, 40));
    }
  }
  function addPt(x, y, z, kind, sid, i) { // kind 0: fairy light, 1: icicle, 2: golden lantern
    const p = { x, y, z, kind, sid, i, lit: false, dead: false, litAt: 0, slot: -1, o: null, col: kind === 2 ? GOLDC : kind === 1 ? null : COLS[colN++ % 5] };
    if (kind === 1) { p.o = icePool.get(); if (!p.o) return; p.o.position.set(x, y + 0.7, z); p.o.rotation.set(0, 0, 0); p.o.scale.setScalar(1); }
    else {
      p.slot = bi++ % NB; bulbs.setMatrixAt(p.slot, _m4.compose(_v.set(x, y, z), _q.identity(), _s.setScalar(kind === 2 ? 1.7 : 1)));
      bulbs.setColorAt(p.slot, _c.copy(p.col).multiplyScalar(0.3)); bulbs.instanceMatrix.needsUpdate = bulbs.instanceColor.needsUpdate = true;
    }
    pts.push(p);
  }
  // a wire slung between two firs, hung with lights (or icicles, or lanterns) every `sp` units
  function string(x0, y0, x1, y1, sag, kind = 0, sp = 1.3) {
    const sid = ++sidN, len = x1 - x0, n = Math.max(2, Math.round(len / sp)), line = linePool.get();
    const Y = (u) => lerp(y0, y1, u) - 4 * sag * u * (1 - u), Z = (u) => -2 * Math.pow(2 * u - 1, 6);
    tree(x0, -2.3, y0 / 0.62, 0.34); tree(x1, -2.3, y1 / 0.62, 0.34);
    if (line) { const a = line.geometry.attributes.position; for (let i = 0; i < LN; i++) { const u = i / (LN - 1); a.setXYZ(i, x0 + len * u, Y(u), Z(u)); } a.needsUpdate = true; line.material = kind === 1 ? iceMat : wireMat; ents.push({ o: line, pool: linePool, x: x1 }); }
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; addPt(x0 + len * u, Y(u) - (kind === 1 ? 0.7 : 0.14), Z(u), kind, sid, i); }
    const p = pts[pts.length - 1]; ex = p.x; ey = p.y; return sid;
  }
  function star(x, y) { const o = starPool.get(); if (o) { o.position.set(x, y, 0); stars.push({ o, x, y }); } }
  function arc(x0, y0, x1, y1, lift = 1.6, n = 3) { for (let k = 1; k <= n; k++) { const u = k / (n + 1); star(lerp(x0, x1, u), lerp(y0, y1, u) + lift * 4 * u * (1 - u)); } }
  function man(x, s) { const o = manPool.get(); if (!o) return false; o.position.set(x, 0, 0); o.scale.setScalar(s); bouncers.push({ kind: 'hat', o, pool: manPool, x, s, top: 2.6 * s, hw: 1.4, t0: -9 }); return true; }
  function monty(x) {
    const o = moosePool.get(); if (!o) return false; o.position.set(x, 0, 0); const b = { kind: 'antler', o, pool: moosePool, x: x + 1.6, top: 4.5, hw: 1.9, t0: -9 };
    bouncers.push(b, { kind: 'hat', o, pool: null, lead: b, x: x - 1, top: 3.2, hw: 1.3, t0: -9 }); return true; // his antlers, and his broad back
  }
  const yC = (y) => clamp(y, 6, 9);
  const CHUNKS = {
    garland(D) { // a long sagging string of lights
      const x0 = ex + rr(3.8, 4.8) + 2.2 * D, len = rr(9, 14) - 3 * D, y0 = yC(ey + rr(0.2, 1.8)); if (coin(0.6)) arc(ex, ey, x0 + 1, y0 - 0.6);
      string(x0, y0, x0 + len, yC(y0 + rr(-1.4, 1.4)), rr(0.8, 1.7));
    },
    lanterns(D) { // single golden lanterns, a good swing apart
      const sp = rr(4.6, 5.3) + 1.3 * D, n = 3 + ri(3), x0 = ex + rr(4.4, 5.2) + 1.4 * D - sp / 2, y0 = yC(ey + rr(-0.3, 1.5));
      string(x0, y0, x0 + n * sp, yC(y0 + rr(-1.5, 1.5)), rr(0.3, 0.8), 2, sp);
    },
    icicles(D) { // fast, long swings — but they will not hold him for long
      const sp = rr(4.8, 5.5) + 1.2 * D, n = 3 + ri(2), x0 = ex + rr(4.4, 5.2) + D - sp / 2, y0 = yC(ey + rr(0.6, 1.6)) + 0.7;
      string(x0, y0, x0 + n * sp, y0 + rr(-0.6, 0.6), 0.5, 1, sp);
    },
    hats(D) { // a clearing: bounce across on the snowmen's hats
      let x = ex + rr(5, 6); if (!man(x, rr(1.15, 1.45))) return CHUNKS.garland(D); if (D > 0.2 && coin(0.5)) { x += rr(5, 5.8); man(x, rr(1.1, 1.4)); }
      const x0 = x + rr(3.2, 4), y0 = rr(6.2, 7.2); arc(x - 1, 4.6, x0 + 1, y0 - 0.5, 1.4, 2); string(x0, y0, x0 + rr(8, 11), yC(y0 + rr(-0.6, 1.4)), rr(0.8, 1.4));
    },
    monty(D) { // Monty's antlers throw him right over the gap
      const mx = ex + rr(6.4, 7.4), x0 = mx + 1.6 + rr(8.5, 10) + D; if (!monty(mx)) return CHUNKS.garland(D); arc(mx + 2.2, 6.5, x0 + 1, 8, 3.2, 5);
      string(x0, rr(8, 9), x0 + rr(9, 12), rr(7, 8.4), rr(0.9, 1.5));
    },
  };
  const BAG = ['garland', 'garland', 'garland', 'lanterns', 'lanterns', 'hats', 'monty', 'icicles'];
  function nextChunk() {
    const D = clamp(ex / 900); let name = ['lanterns', 'hats', 'garland', 'monty', 'garland', 'icicles'][chunkI];
    while (!name || name === lastChunk) name = BAG[ri(BAG.length)];
    CHUNKS[name](D); lastChunk = name; chunkI++; dress(ex + 34);
  }
  function reset() {
    ents.forEach((e) => e.pool.put(e.o)); stars.forEach((s) => starPool.put(s.o)); bouncers.forEach((b) => b.pool?.put(b.o)); falling.forEach((f) => icePool.put(f.o));
    pts.forEach((p) => { if (p.o && !p.dead) icePool.put(p.o); }); pts.length = ents.length = stars.length = bouncers.length = falling.length = 0;
    for (const t of trees) { for (let i = 0; i < NT; i++) t.setMatrixAt(i, ZERO); t.instanceMatrix.needsUpdate = true; }
    for (let i = 0; i < NM; i++) mounds.setMatrixAt(i, ZERO); for (let i = 0; i < NB; i++) bulbs.setMatrixAt(i, ZERO); mounds.instanceMatrix.needsUpdate = bulbs.instanceMatrix.needsUpdate = true;
    fx.life.fill(0); R = mulberry(seedN); ex = 0; ey = 6; dressX = -46; chunkI = bi = ti = mi = sidN = colN = 0; lastChunk = '';
    T = tPlay = readyT = endT = freeze = shake = flare = 0; mode = 'perch'; state = 'ready'; px = 0; py = PERCH; vx = vy = 0; anchor = lastB = cand = null; held = false;
    ox = oy = rz = rzBase = lock = lastLock = boostT = 0; flip = 1; maxX = bonus = combo = bestCombo = grabs = lit = perfects = bounces = snaps = loops = carols = tuneI = starI = 0; shown = -1;
    tuneN = ((seedN >>> 3) % 24) + 1; passed = false; try { bestD = +localStorage.getItem('advent-gs-d-' + seed) || 0; } catch { bestD = 0; }
    marker.visible = bestD > 30; marker.position.set(bestD, 0, -1.3);
    // the opening: two generous strings with a snowman underneath, just in case
    string(3.2, 7.5, 17, 7.3, 1.5); man(21, 1.3); string(24, 7.3, 35.5, 7.2, 1.4); dress(40);
    while (ex < AHEAD) nextChunk();
    cx = 6; cy = 6.5; rig.rotation.z = 0; document.body.classList.remove('over'); ui.msg.className = ''; hud(true);
  }

  // ---------- feedback ----------
  function msg(text, long) { ui.msg.textContent = text; ui.msg.className = ''; void ui.msg.offsetWidth; ui.msg.className = long ? 'show long' : 'show'; }
  function pop(text, gold) {
    const el = ui.pops.children[pop.i = ((pop.i ?? -1) + 1) % ui.pops.children.length]; _v.set(px, py + 1.8, 0).project(camera);
    el.textContent = text; el.style.left = `${(_v.x * 0.5 + 0.5) * 100 + rnd(-3, 3)}%`; el.style.top = `${(-_v.y * 0.5 + 0.5) * 100}%`; el.className = ''; void el.offsetWidth; el.className = gold ? 'go gold' : 'go';
  }
  function hud(force) {
    const s = score(), sc = Math.round(shown = shown < 0 ? s : shown + (s - shown) * 0.25 + Math.sign(s - shown) * 0.5 * (Math.abs(s - shown) > 0.5));
    const key = `${sc}|${combo}|${tuneN}|${tuneI}`; if (key === lastHud && !force) return; lastHud = key;
    ui.score.textContent = sc.toLocaleString(); ui.combo.textContent = combo > 1 ? `×${combo}` : ''; ui.tune.textContent = `♪ ${tuneName(tuneN)} · ${tuneI}/${audio.tuneLen(tuneN)}`;
  }
  function sparkle(x, y, n, speed, cols, size = 1.2, up = 1) { for (let i = 0; i < n; i++) { const a = rnd(TAU), s = speed * rnd(0.3, 1); fx.emit(x, y, rnd(-0.3, 0.3), Math.cos(a) * s, Math.sin(a) * s + up, rnd(-1, 1) * s * 0.5, pick(cols), rnd(0.5, 1.1), size * rnd(0.6, 1.2), 5); } }
  function lightUp(p) {
    p.lit = true; p.litAt = 0; lit++; if (p.slot >= 0) { bulbs.setColorAt(p.slot, _c.copy(p.col).multiplyScalar(2.7)); bulbs.instanceColor.needsUpdate = true; }
    fx.emit(p.x, p.y, p.z, rnd(-1, 1), rnd(0.5, 2), rnd(-0.5, 0.5), p.col ?? 0xffffff, 0.6, 1.3, 2);
  }

  // ---------- the swing ----------
  function candidate() { // the grab point a press would catch: the nearest in reach, leaning towards those ahead and above
    let best = null, bc = 1e9;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], dx = p.x - px; if (dx > TUNE.reach) break; if (dx < -TUNE.reach || p.dead || (p === lastB && lastLock > 0)) continue;
      const dy = p.y - py, d = Math.hypot(dx, dy); if (d > TUNE.reach || dy < -0.6) continue;
      const c = d - 0.4 * dx - 0.25 * dy; if (c < bc) { bc = c; best = p; }
    }
    return best;
  }
  function attach(b) {
    const dx = px - b.x, dy = py - b.y, d = Math.hypot(dx, dy); anchor = b; L = Math.max(d, TUNE.lMin); th = Math.atan2(dx, -dy);
    if (d < TUNE.lMin) { const nx = b.x + L * Math.sin(th), ny = b.y - L * Math.cos(th); ox += px - nx; oy += py - ny; px = nx; py = ny; }
    const vt = vx * Math.cos(th) + vy * Math.sin(th), dir = Math.abs(vt) > 0.8 ? Math.sign(vt) : 1; // keep the momentum: nothing kills a swinger like a rope that eats speed
    om = dir * Math.max(Math.abs(vt), TUNE.keep * Math.hypot(vx, vy), TUNE.grabMin) / L; mode = 'swing'; swingT = 0; th0 = th; looped = creaked = false; ropeK = 0; grabs++; flip = 1;
    if (b.kind === 1) { audio.twinkle(7); sparkle(b.x, b.y, 8, 2, SNOW, 0.9); }
    else {
      if (b.col) glowC.copy(b.col).lerp(_c.set(0xfff0dc), 0.55);
      if (!b.lit) { // a new light: the next note of tonight's carol, and the whole string wakes up around it
        audio.tuneNote(tuneN, tuneI, combo > 1); tuneI++; if (b.kind === 2) { bonus += 5; pop('+5', true); }
        for (const p of pts) if (p.sid === b.sid && !p.lit) p.litAt = T + 0.001 + Math.abs(p.i - b.i) * 0.05;
        if (tuneI >= audio.tuneLen(tuneN)) { carols++; bonus += 100; msg(`♪ ${tuneName(tuneN)} — carol complete! +100`, true); audio.fanfare(); flare = 1; tuneN = (tuneN % 24) + 1; tuneI = 0; for (let i = 0; i < 4; i++) fx.burst(px + rnd(-8, 14), rnd(9, 14), rnd(-12, -4), 50, 8, [0xffd34d, 0xff5a60, 0x60ffc0, 0xffffff], 1.7, 1.5, 2); }
      } else audio.twinkle(grabs);
      sparkle(b.x, b.y, 14, 3, [b.col.getHex(), 0xffffff], 1.2);
    }
    if (navigator.vibrate) navigator.vibrate(6);
    if (hinted < 2) { hinted = 2; msg('Let go as he swings up to fling him onwards', true); }
  }
  function release(forced) {
    const sp = Math.hypot(vx, vy), ang = Math.atan2(vy, vx); rel = [anchor.x, anchor.y, anchor.kind, px, py, vx, vy, swingT].map((n) => +n.toFixed(1)); lastB = anchor; anchor = null; mode = 'fly'; lastLock = 0.4; lock = 0.1; rzBase = wrap(th);
    if (!forced && vx > 0 && ang >= TUNE.perfLo && ang <= TUNE.perfHi && sp >= 6.5) { // a well-timed release: a somersault and a little more distance
      const k = Math.max(1, Math.min(TUNE.perfBoost, TUNE.vMax / sp)); vx *= k; vy *= k; combo++; perfects++; bestCombo = Math.max(bestCombo, combo); flip = 0; boostT = 0.7;
      const pts2 = 5 * Math.min(combo, 10); bonus += pts2; pop(combo > 1 ? `Perfect ×${combo}  +${pts2}` : `Perfect! +${pts2}`, true); audio.whoosh(); audio.twinkle(combo);
      if (!reduced) freeze = 0.05; sparkle(px, py, 18, 4, SPARK, 1.2); if (navigator.vibrate) navigator.vibrate(14);
    } else { if (combo > 2) pop('streak lost'); combo = 0; if (!forced) audio.pff(); }
  }
  function snap() { // the icicle lets go
    const b = anchor; b.dead = true; b.regrow = T + 2.5; falling.push({ o: b.o, vy: 0 }); b.o = null; snaps++; release(true); vy = Math.min(vy, 2); audio.snap(); pop('Snap!'); sparkle(b.x, b.y + 0.6, 16, 3, SNOW, 1.1); if (!reduced) shake = 0.5;
  }
  function bounce(b) {
    const big = b.kind === 'antler'; vy = big ? TUNE.antlerV : TUNE.hatV; vx = Math.max(vx + 1, big ? TUNE.antlerX : TUNE.hatX); if (b.lead) { vx = 4; vy = 10; } // Monty's back only hops him forward, onto the antlers oy += py - b.top - 0.72; py = b.top + 0.72; (b.lead ?? b).t0 = T; bounces++; bonus += big ? 25 : 10;
    flip = 0; rzBase = 0; boostT = big ? 1 : 0.4; audio.boing(big); pop(big ? 'Boing! +25' : 'Boing! +10', big); fx.burst(px, b.top, 0.4, big ? 60 : 30, 5, big ? SPARK : SNOW, 1.1, 1.2, 4); if (navigator.vibrate) navigator.vibrate(20);
    if (big) { flare = Math.max(flare, 0.6); audio.jingle(0.08); }
  }
  function down() {
    mode = 'down'; state = 'ending'; endT = 0; py = 0.55; vx = vy = 0; held = false; audio.thud(); audio.wind(0); fx.burst(px, 0.4, 0.3, 90, 6, SNOW, 1.3, 1.4, 5); if (!reduced) shake = 1; if (navigator.vibrate) navigator.vibrate(50);
  }
  function leap() { state = 'play'; mode = 'fly'; vx = TUNE.leapX; vy = TUNE.leapY; flip = 0; rzBase = 0; lock = 0.05; audio.whoosh(); sparkle(px, py, 16, 3, SPARK); }
  function step(h) {
    lock -= h; lastLock -= h;
    if (mode === 'fly') {
      vy = Math.max(vy - TUNE.g * (vy < 0 ? TUNE.fall : 1) * h, -TUNE.vyMax); px += vx * h; py += vy * h;
      if (held && lock <= 0) { const b = candidate(); if (b) { attach(b); return; } }
      if (vy < 6) for (const b of bouncers) if (Math.abs(px - b.x) < b.hw && py - 0.72 < b.top) { bounce(b); return; } // any touch of a friend is a bounce
      if (py < 0.7) down();
    } else if (mode === 'swing') {
      const tgt = Math.max(TUNE.lMin, Math.min(TUNE.lPref, anchor.y - TUNE.clear)); // reel in: it shortens the swing and pumps a little speed into it
      if (L !== tgt) { const n = L > tgt ? Math.max(tgt, L - TUNE.reel * (L > anchor.y - TUNE.clear ? 3 : 1) * h) : Math.min(tgt, L + TUNE.reel * 0.6 * h); om *= Math.pow(L / n, TUNE.reelPow); L = n; }
      om -= (TUNE.g / L) * Math.sin(th) * h;
      if (0.5 * L * L * om * om + TUNE.g * L * (1 - Math.cos(th)) < TUNE.g * L * (1 - Math.cos(TUNE.swingTo))) om += (om >= 0 ? 1 : -1) * (TUNE.pump / L) * h; // George kicks his legs: a swing never dies, it only costs time
      if (Math.abs(om) * L > TUNE.swingMax) om = Math.sign(om) * TUNE.swingMax / L; // fast, but never a blur
      th += om * h; swingT += h; px = anchor.x + L * Math.sin(th); py = anchor.y - L * Math.cos(th); vx = L * om * Math.cos(th); vy = L * om * Math.sin(th);
      if (combo && swingT > TUNE.lazy) { if (combo > 2) pop('streak lost'); combo = 0; }
      if (!looped && Math.abs(th - th0) > TAU) { looped = true; loops++; bonus += 50; pop('Loop-the-loop! +50', true); audio.fanfare(); }
      if (anchor.kind === 1) { if (!creaked && swingT > TUNE.creak) { creaked = true; audio.creak(); } if (swingT > TUNE.icicle) { snap(); return; } }
      if (!held) release();
    }
  }

  // ---------- input ----------
  const live = () => active && (state === 'play' || state === 'ready');
  function press() { if (state === 'over') { if (T - overT > 0.5) { reset(); held = true; } return; } if (live()) held = true; }
  function onDown(e) { if (!active) return; document.activeElement?.blur?.(); if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); try { dom.setPointerCapture(e.pointerId); } catch { /* ignore */ } press(); }
  function onUp() { held = false; }
  function onKey(e) {
    if (!active) return; const k = e.key.toLowerCase();
    if (k === 'escape') { if (e.type === 'keydown') exit(); return; }
    if (k !== ' ' && k !== 'enter' && k !== 'arrowup') return; e.preventDefault();
    if (e.type === 'keyup') held = false; else if (!e.repeat) press();
  }
  const noMenu = (e) => e.preventDefault(), onHide = () => { held = false; if (document.hidden) audio.wind(0); };
  const LISTEN = [[dom, 'pointerdown', onDown], [dom, 'pointerup', onUp], [dom, 'pointercancel', onUp], [dom, 'contextmenu', noMenu], [window, 'keydown', onKey], [window, 'keyup', onKey], [window, 'blur', onHide], [document, 'visibilitychange', onHide]];
  function exit() { if (!active || exit.busy) return; exit.busy = true; onExit?.(); }
  function bind() { $('g-quit').onclick = exit; $('g-home').onclick = exit; $('g-again').onclick = () => { if (state === 'over') reset(); }; $('g-name').textContent = 'George Swings'; $('g-again').textContent = 'Swing again'; }

  // the autopilot used for testing and tuning: lets go when a ballistic look-ahead says the fling will reach something
  function reaches(x, y, ux, uy) {
    const minX = anchor.x + 0.8;
    for (let i = 0; i < 330; i++) {
      uy = Math.max(uy - TUNE.g * (uy < 0 ? TUNE.fall : 1) / 120, -TUNE.vyMax); x += ux / 120; y += uy / 120; if (y < 0.7) return false;
      if (uy < 6) for (const b of bouncers) { if (Math.abs(x - b.x) < b.hw * 0.5 && y - 0.72 < b.top) return true; if (Math.abs(x - b.x) < b.hw && y - 0.72 < b.top) return false; }
      if (i > 9 && i % 3 === 0) for (const p of pts) if (!p.dead && p.x > minX && p.y > y + 0.2 && Math.hypot(p.x - x, p.y - y) < TUNE.reach * 0.8) return true;
    }
    return false;
  }
  function botStep() {
    if (state === 'ready') { held = true; return; }
    if (mode === 'swing') {
      const ang = Math.atan2(vy, vx), k = ang >= TUNE.perfLo && ang <= TUNE.perfHi ? Math.max(1, Math.min(TUNE.perfBoost, TUNE.vMax / Math.hypot(vx, vy))) : 1;
      held = !(vx > 0 && ang > Math.max(-0.3, 0.45 - swingT * 0.12) && ang < 1.3 && reaches(px, py, vx * k, vy * k)) && !(anchor.kind === 1 && swingT > 1.3 && vx > 0 && ang > 0);
    } else if (mode === 'fly') { const c = candidate(); held = !!c && (vy < 1 || Math.hypot(c.x - px, c.y - py) < TUNE.reach * 0.7); }
  }

  function over() {
    state = 'over'; overT = T; audio.fanfare(); const s = score(), d = Math.floor(maxX);
    let best = 0, night = 0; try { best = +localStorage.getItem('advent-gs-best') || 0; night = +localStorage.getItem('advent-gs-' + seed) || 0; } catch { /* storage unavailable */ }
    const isBest = s > best && s > 0;
    if (record) try { if (s > best) localStorage.setItem('advent-gs-best', s); if (s > night) localStorage.setItem('advent-gs-' + seed, s); if (d > bestD) localStorage.setItem('advent-gs-d-' + seed, d); } catch { /* ignore */ }
    ui.final.textContent = s.toLocaleString();
    ui.stats.textContent = `${d} m swung · ${lit} light${lit === 1 ? '' : 's'} lit · best streak ${bestCombo}` + (carols ? ` · ${carols} carol${carols > 1 ? 's' : ''} played` : '');
    ui.best.textContent = isBest ? '★ A new best! ★' : `Tonight’s best ${Math.max(night, s).toLocaleString()} · all-time best ${Math.max(best, s).toLocaleString()}`;
    document.body.classList.add('over');
  }

  // ---------- frame ----------
  const turn = (o, x, y, z, k) => { const r = o.rotation; r.x += (x - r.x) * k; r.y += (y - r.y) * k; r.z += (z - r.z) * k; };
  function update(dt) {
    if (adaptive && setPR) { // drop the resolution a notch if this device can't hold a smooth frame rate
      const now = performance.now(), raw = (now - lastNow) / 1000; lastNow = now;
      if (raw < 0.2) { emaDt = lerp(emaDt, raw, 0.04); slowT = emaDt > 0.027 ? slowT + raw : Math.min(slowT, 0); if (slowT > 2.5 && getPR() > 1) { setPR(Math.max(1, getPR() - 0.5)); slowT = -4; } }
    }
    if (freeze > 0) { freeze -= dt; dt *= 0.1; } // a breath of hit-stop on a perfect release
    T += dt; const playing = state === 'play';
    if (state === 'ready') { readyT += dt; if (bot) botStep(); if (held && readyT > 0.3) leap(); if (!hinted && readyT > 0.6) { hinted = 1; msg(coarse ? 'Hold to leap and catch a light' : 'Hold the mouse button (or space) to leap and catch a light', true); } }
    if (playing) {
      tPlay += dt; if (bot) botStep();
      const n = Math.max(1, Math.ceil(dt * 120)), h = dt / n; for (let i = 0; i < n && state === 'play'; i++) step(h);
      if (px > maxX) maxX = px;
      if (!passed && bestD > 30 && maxX > bestD) { passed = true; pop('Further than ever tonight!', true); audio.twinkle(5); sparkle(bestD, 2.8, 40, 5, SPARK, 1.4, 3); }
    } else if (state === 'ending') { if ((endT += dt) > 1.1) over(); }
    while (ex < px + AHEAD) nextChunk();

    // lights waking along a string, stars, friends, icicles
    for (let i = 0; i < pts.length; i++) { const p = pts[i]; if (p.litAt && T >= p.litAt) lightUp(p); if (p.kind === 1 && p.dead && T > p.regrow && (p.o = icePool.get())) { p.dead = false; p.grow = 0; p.o.position.set(p.x, p.y + 0.7, p.z); } // a fresh icicle grows where one snapped, so the way is never lost
      if (p.kind === 1 && !p.dead) { if (p.grow < 1) p.grow = Math.min(1, p.grow + dt * 2); p.o.scale.setScalar(p.grow ?? 1); }
      if (p.kind === 1 && !p.dead) p.o.rotation.z = p === anchor && swingT > TUNE.creak ? Math.sin(T * 55) * 0.1 : p === anchor ? clamp(-th * 0.5, -0.5, 0.5) : 0; }
    while (pts.length && pts[0].x < px - BEHIND) { const p = pts.shift(); if (p.o && !p.dead) icePool.put(p.o); if (p === lastB) lastB = null; }
    for (let i = ents.length - 1; i >= 0; i--) if (ents[i].x < px - BEHIND) { ents[i].pool.put(ents[i].o); ents.splice(i, 1); }
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i]; s.o.rotation.y = T * 2.6 + s.x; s.o.position.y = s.y + 0.12 * Math.sin(T * 2 + s.x); let gone = s.x < px - BEHIND;
      if (playing && Math.abs(s.x - px) < 1.4 && Math.abs(s.y - py) < 1.5) { gone = true; bonus += 5; audio.twinkle(++starI); sparkle(s.x, s.y, 10, 2.5, SPARK, 1); }
      if (gone) { starPool.put(s.o); stars.splice(i, 1); }
    }
    for (let i = bouncers.length - 1; i >= 0; i--) {
      const b = bouncers[i], u = clamp((T - b.t0) / 0.6), k = Math.sin(u * Math.PI) * (1 - u); if (b.x < px - BEHIND - 4) { b.pool?.put(b.o); bouncers.splice(i, 1); continue; }
      if (b.lead) continue; b.o.userData.tick(T);
      if (b.kind === 'hat') { b.o.scale.y = b.s * (1 - 0.3 * k); b.o.userData.hat.position.y = 0.24 + 0.5 * k; b.o.userData.armR.rotation.z = -2 - Math.sin(T * 1.5 + b.x) * 0.2; }
      else b.o.userData.neck.rotation.z = -b.o.userData.nk + Math.sin(T * 0.7) * 0.06 - 0.7 * k;
    }
    for (let i = falling.length - 1; i >= 0; i--) { const f = falling[i]; f.vy -= 30 * dt; f.o.position.y += f.vy * dt; if (f.o.position.y < 0.6) { fx.burst(f.o.position.x, 0.3, 0, 24, 4, SNOW, 0.9, 1, 4); icePool.put(f.o); falling.splice(i, 1); } }

    // George
    const kk = 1 - Math.exp(-dt * 16), sp = Math.hypot(vx, vy), ang = Math.atan2(vy, vx), inWin = mode === 'swing' && vx > 0 && ang >= TUNE.perfLo && ang <= TUNE.perfHi;
    ox *= Math.exp(-dt * 14); oy *= Math.exp(-dt * 14); boostT -= dt; let rt = 0;
    if (mode === 'swing') {
      rt = th; turn(gu.armR, 0, 0, Math.PI, kk); turn(gu.armL, -0.2, 0, -0.5 - 0.3 * Math.sin(T * 6), kk);
      gu.legs.forEach((l, i) => turn(l, -0.3 + clamp(om * 0.3, -0.9, 0.7), 0, (i ? 1 : -1) * 0.2, kk)); gu.tail.rotation.x += (clamp(om * 0.3, -0.9, 0.9) - gu.tail.rotation.x) * kk; gu.head.rotation.z *= 1 - kk;
    } else if (mode === 'fly') {
      if (flip < 1) flip = Math.min(1, flip + dt / 0.55); rzBase += (clamp(vy * 0.028, -0.5, 0.5) - rzBase) * (1 - Math.exp(-dt * 6)); rt = rzBase - (reduced ? 0 : easeOut(flip) * TAU);
      const tuck = flip < 0.85; turn(gu.armR, 0, 0, held ? 2.9 : tuck ? 1.2 : 2.2, kk); turn(gu.armL, 0, 0, held ? -2.9 : tuck ? -1.2 : -2.2, kk);
      gu.legs.forEach((l, i) => turn(l, tuck ? -1.7 : -0.5 - clamp(vy * 0.03, -0.4, 0.5), 0, (i ? 1 : -1) * 0.3, kk)); gu.tail.rotation.x += (clamp(-vy * 0.04, -0.6, 0.6) - gu.tail.rotation.x) * kk;
    } else {
      turn(gu.armL, -0.55, 0, -0.3, kk); gu.legs.forEach((l, i) => turn(l, -1.25, 0, (i ? 1 : -1) * 0.35, kk));
      if (mode === 'down') { turn(gu.armR, 0, 0, 0.9, kk); gu.head.rotation.z = Math.sin(T * 9) * 0.22 * Math.exp(-endT * 1.5); } else gu.wave(T);
    }
    gu.tick(T); rz += wrap(rt - rz) * (1 - Math.exp(-dt * 22)); rig.rotation.z = rz; rig.position.set(px + ox, py + oy, 0);
    glow.color.lerp(glowC, kk * 0.3);
    if (boostT > 0 && mode === 'fly') for (let i = 0; i < 2; i++) fx.emit(px + rnd(-0.3, 0.3), py + rnd(-0.3, 0.3), rnd(-0.2, 0.2), -vx * 0.2 + rnd(-0.5, 0.5), rnd(-0.5, 0.5), 0, pick(SPARK), rnd(0.3, 0.7), rnd(0.6, 1.1), 1);

    // the tinsel: silver, turning gold while a release would be perfect
    rope.visible = hook.visible = mode === 'swing';
    if (anchor) {
      ropeK = Math.min(1, ropeK + dt / 0.07); const cs = Math.cos(rz), sn = Math.sin(rz), hx = px + ox + 0.2 * cs - 0.8 * sn, hy = py + oy + 0.2 * sn + 0.8 * cs;
      _v.set(anchor.x - hx, anchor.y - hy, anchor.z + 0.26); const len = _v.length(); rope.position.set(hx, hy, -0.26); rope.quaternion.setFromUnitVectors(UP, _v.divideScalar(len)); rope.scale.set(1, len * ropeK, 1);
      rope.material = inWin ? ropeOn : ropeOff; hook.position.set(anchor.x, anchor.y, anchor.z + 0.1); hook.scale.setScalar(inWin ? 2 + 0.3 * Math.sin(T * 30) : 1.3);
      if (Math.random() < (inWin ? 0.9 : 0.25)) { const f = Math.random(); fx.emit(hx + _v.x * len * f, hy + _v.y * len * f, -0.2, rnd(-0.4, 0.4), rnd(-0.6, 0.2), rnd(-0.3, 0.3), inWin ? 0xffd34d : 0xdfe8ff, rnd(0.3, 0.6), rnd(0.5, 0.9), 2); }
    }
    cand = (mode === 'fly' && playing) || state === 'ready' ? candidate() : null; ring.visible = !!cand;
    if (cand) { ring.position.set(cand.x, cand.y, cand.z); ring.scale.setScalar(1 + 0.18 * Math.sin(T * 12)); }
    marker.children[1].rotation.y = T * 1.5;

    // camera, sky and atmosphere
    const vis = 2 * Math.tan((camera.fov * Math.PI) / 360), tz = clamp(25 / (vis * aspect), 16.5, 34) + clamp(sp - 11, 0, 8) * 0.3, w = vis * tz * aspect, hgt = vis * tz;
    const k = 1 - Math.exp(-dt * 5), sh = shake * shake * 0.4; shake = Math.max(0, shake - dt * 2.4); flare = Math.max(0, flare - dt * 0.5);
    cx += (px + w * 0.2 - cx) * (1 - Math.exp(-dt * 7)); cy += (clamp(4.2 + (py - 4) * 0.5, 5.6, 16) + Math.max(0, hgt - 17) * 0.22 - cy) * (1 - Math.exp(-dt * 3.5)); cz += (tz - cz) * k;
    camera.position.set(cx + rnd(-sh, sh), cy + rnd(-sh, sh), cz); camera.lookAt(cx, cy - 0.7, 0);
    far.position.x = ground.position.x = cx; gtex.offset.x = ((cx * 14) / 440) % 1; snow.userData.u.uTime.value = T; snow.userData.u.uCam.value = cx;
    sky.userData.tick(T); aur.userData.tick(T); aur.material.uniforms.uGain.value = 0.8 + flare * 1.8; fx.update(dt);
    if (playing && (windT -= dt) < 0) { windT = 0.1; audio.wind(clamp(sp / 26)); }
    hud();
  }

  function start() { if (active) return; active = true; exit.busy = false; LISTEN.forEach(([t, ev, f]) => t.addEventListener(ev, f, { passive: false })); dom.style.cursor = 'pointer'; bind(); hinted = 0; reset(); audio.chime(5); }
  function stop() { active = false; state = 'idle'; held = false; LISTEN.forEach(([t, ev, f]) => t.removeEventListener(ev, f)); audio.wind(0); dom.style.cursor = 'default'; document.body.classList.remove('over'); }
  function resize(a) { aspect = a; camera.aspect = a; camera.updateProjectionMatrix(); }
  return {
    scene, camera, start, stop, update, resize,
    peek: () => ({ rel, x: +px.toFixed(1), y: +py.toFixed(1), swingT: +swingT.toFixed(1), anchor: anchor && [+anchor.x.toFixed(1), +anchor.y.toFixed(1), anchor.kind], pts: pts.filter((p) => p.x > px - 6 && p.x < px + 26 && !p.dead).map((p) => [+p.x.toFixed(1), +p.y.toFixed(1), p.kind]), pads: bouncers.filter((b) => b.x > px - 6 && b.x < px + 26).map((b) => [b.kind, +b.x.toFixed(1), +b.top.toFixed(1)]) }), // for the test harness
    get stats() { return { state, mode, t: +tPlay.toFixed(1), dist: Math.floor(maxX), score: score(), grabs, lit, perfects, bounces, snaps, loops, carols, bestCombo, last: lastChunk }; },
  };
}
