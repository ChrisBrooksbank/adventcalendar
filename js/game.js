// Midnight Delivery — fly Father Christmas over an endless snowy village and post presents down the chimneys.
// The sleigh stays near the origin; the world scrolls past it (everything in `world` sits at z = -distance).
import {
  THREE, TAU, PX, rnd, pick, clamp, lerp, easeOut, M, G, sph, box, cyl, cone, tor, mesh, grp, prism, star3d, halo,
  starfield, Particles, skyDome, aurora, moon, light, sleighTeam, present, GIFT, pineGeometry,
} from './kit.js';
import { tuneName } from './audio.js';

// ---------- tuning ----------
const XR = 10, Y_LO = 7.6, Y_HI = 13.5;            // flight box
const GR = 26, DROP_V = 2.5, DROP_FWD = 4, PVX = 0.35; // present ballistics
const HIT_R = 1.55, PERFECT_R = 0.6, S = 1.35;      // chimney catch radius, house scale
const AHEAD = 200, BEHIND = 30, GAP = 14;
const SHAPES = [{ w: 3, h: 2.2, d: 3, rh: 1.5 }, { w: 4, h: 2.4, d: 3.2, rh: 1.7 }, { w: 2.8, h: 3.0, d: 2.8, rh: 1.7 }, { w: 3.4, h: 2.2, d: 4.4, rh: 1.6 }];
const WALLS = [0xa86b4a, 0x9a3a2e, 0x3f6a94, 0xb08a5a, 0x7a5a6a, 0x5f7a5a, 0x8a5a48];
const DARK = new THREE.Color(0x121a36), LIT = new THREE.Color(0xffc866).multiplyScalar(1.7);
const SPARK = [0xffd34d, 0xffffff, 0xff9a50], SNOW = [0xffffff, 0xdfe9ff, 0xbfd4ff];

// ---------- helpers ----------
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const _m4 = new THREE.Matrix4(), _c = new THREE.Color(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
// Merge coloured parts [geometry, colour, x, y, z, ry] into one vertex-coloured geometry (one draw call).
function merge(parts) {
  const P = [], N = [], C = [];
  for (const [geo, col, x = 0, y = 0, z = 0, ry = 0] of parts) {
    const g = geo.index ? geo.toNonIndexed() : geo; g.applyMatrix4(_m4.makeRotationY(ry).setPosition(x, y, z));
    const p = g.attributes.position.array, n = g.attributes.normal.array; _c.set(col);
    for (let i = 0; i < p.length; i += 3) { P.push(p[i], p[i + 1], p[i + 2]); N.push(n[i], n[i + 1], n[i + 2]); C.push(_c.r, _c.g, _c.b); }
    g.dispose(); geo.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); out.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  return out;
}
function houseGeo(s, wall) {
  const { w, h, d, rh } = s, W = 0xf4f8ff, cx = w * 0.25, cz = -d * 0.15, wy = h * 0.55, wins = [];
  const body = merge([
    [box(w, h, d), wall, 0, h / 2, 0], [prism(w + 0.5, rh + 0.12, d + 0.5), W, 0, h - 0.04, 0], [prism(w + 0.1, rh - 0.08, d + 0.54), wall, 0, h - 0.04, 0],
    [box(w * 0.17, h * 0.55, 0.06), 0x6b1f1f, 0, h * 0.275, d / 2 + 0.02], [box(0.62, rh * 0.95, 0.62), 0x7a4a3a, cx, h + rh * 0.58, cz], [box(0.8, 0.14, 0.8), W, cx, h + rh * 1.06, cz],
  ]);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) wins.push([box(w * 0.2, h * 0.3, 0.06), 0xffffff, sx * w * 0.28, wy, sz * (d / 2 + 0.03)]);
    wins.push([box(0.06, h * 0.3, d * 0.22), 0xffffff, sx * (w / 2 + 0.03), wy, 0]);
  }
  wins.push([box(w * 0.14, rh * 0.25, 0.06), 0xffffff, 0, h + rh * 0.35, d / 2 + 0.3]);
  return { body, wins: merge(wins), chim: new THREE.Vector3(cx, h + rh * 1.12, cz) };
}
function pineGeo() {
  return pineGeometry();
}
function groundTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 50; i++) {
    const px = Math.random() * 256, py = Math.random() * 256, r = 12 + Math.random() * 34, col = Math.random() < 0.65 ? '110,132,200' : '255,255,255';
    for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) {
      const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r); g.addColorStop(0, `rgba(${col},.26)`); g.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = g; x.fillRect(px + ox - r, py + oy - r, r * 2, r * 2);
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14); t.anisotropy = 4; return t;
}
// Snow hanging in the air that we fly through: wraps along z as the distance grows.
function speedSnow(n = 1600) {
  const pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos.set([rnd(-34, 34), rnd(0, 26), rnd(0, 120)], i * 3); seed[i] = Math.random(); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDist: { value: 0 }, uPx: PX }, transparent: true, depthWrite: false,
    vertexShader: `attribute float aSeed; uniform float uTime,uDist,uPx; varying float vA;
      void main(){ vec3 p=position; p.y=mod(p.y-uTime*(.7+aSeed*1.3),26.); p.z=mod(p.z+uDist,120.)-104.; p.x+=sin(uTime*.5+aSeed*40.)*.9;
      vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=min(uPx*(45.+aSeed*60.)/-mv.z,uPx*16.);
      vA=(.4+.5*aSeed)*smoothstep(-104.,-70.,p.z)*smoothstep(.6,3.5,-mv.z); }`,
    fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); gl_FragColor=vec4(vec3(.95,.97,1.),smoothstep(.5,.15,d)*vA); }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.userData.u = mat.uniforms; return pts;
}

export function createGame({ dom, audio, seed = 'tonight', onExit, setPR, getPR, bot = false, adaptive = true, record = true }) {
  const $ = (id) => document.getElementById(id), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, coarse = matchMedia('(pointer: coarse)').matches;
  const ui = { score: $('g-score'), combo: $('g-combo'), magic: $('g-magic'), bar: $('g-bar'), tune: $('g-tune'), msg: $('g-msg'), pops: $('g-pops'), final: $('g-final'), stats: $('g-stats'), best: $('g-best') };
  const seedN = hash(String(seed));

  // ---------- scene ----------
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(58, 1, 0.1, 600);
  scene.add(skyDome(0x050a26, 0x24407e)); scene.fog = new THREE.FogExp2(0x1c3068, 0.0105);
  scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x39486e, 1.25)); const dl = new THREE.DirectionalLight(0xc4d4ff, 1.0); dl.position.set(-10, 16, 12); scene.add(dl);
  const sky = starfield(1200), aur = aurora(150, 40, 70, 0x35ffb0, 0x9050ff, 0.9, 2.8), snow = speedSnow(); scene.add(sky, aur, snow);
  moon(7, 34, 48, -170, scene).traverse((o) => { if (o.material) o.material.fog = false; });
  const gtex = groundTex();
  mesh(new THREE.PlaneGeometry(440, 440).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc2d0ee, roughness: 0.95, map: gtex }), 0, 0, -130, scene);
  const world = grp(scene), fx = new Particles(3000); scene.add(fx.points);
  const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });

  // the sleigh
  const ship = grp(scene, 0, 10, 0), team = sleighTeam(3); team.rotation.y = Math.PI; ship.add(team);
  light(0xffd0a0, 34, 30, 0, -1.5, -2, ship); halo(0xffc070, 5, 0, 0.6, 0.4, ship, 0.25);
  const aimOff = G(0xbfe0ff, 1.1, { o: 0.75, add: true }), aimOn = G(0xffd34d, 2.4, { o: 1, add: true });
  const aim = mesh(tor(1.1, 0.07, 6, 40).rotateX(Math.PI / 2), aimOff, 0, 0, 0, scene); mesh(sph(0.14, 8, 6), aimOff, 0, 0, 0, aim);
  const presents = GIFT.map(([a, b]) => { const o = present(0.8, a, b); o.visible = false; scene.add(o); return { o, on: false }; });

  // ---------- pools ----------
  const ringGeo = tor(0.8, 0.07, 6, 28).rotateX(Math.PI / 2), ringMat = G(0xffe9a0, 1.5, { o: 0.9, add: true }), ringMatOn = G(0xffd34d, 3, { o: 1, add: true });
  const beamGeo = cyl(0.42, 0.16, 9, 12, true).translate(0, 4.5, 0), beamMat = G(0xffd880, 1, { o: 0.075, add: true, side: THREE.DoubleSide });
  const houses = [];
  for (let i = 0; i < 56; i++) {
    const si = i % 4, s = SHAPES[si], geo = houseGeo(s, WALLS[i % WALLS.length]), g = new THREE.Group(), wm = new THREE.MeshBasicMaterial();
    mesh(geo.body, bodyMat, 0, 0, 0, g); mesh(geo.wins, wm, 0, 0, 0, g);
    const mark = grp(g, geo.chim.x, geo.chim.y, geo.chim.z), ring = mesh(ringGeo, ringMat, 0, 0.5, 0, mark), beacon = mesh(beamGeo, beamMat, 0, 0.2, 0, mark);
    halo(0xffd070, 3.4, 0, 0.5, 0, mark, 0.6).material.fog = true;
    g.scale.setScalar(S); g.visible = false; world.add(g);
    houses.push({ g, wm, mark, ring, beacon, si, c: geo.chim, rad: Math.max(s.w, s.d) / 2 * S + 0.2, top: (s.h + s.rh * 0.7) * S, on: false });
  }
  function pool(n, make) {
    const free = []; for (let i = 0; i < n; i++) { const o = make(i); o.visible = false; world.add(o); free.push(o); }
    return { get() { const o = free.pop(); if (o) o.visible = true; return o; }, put(o) { o.visible = false; free.push(o); } };
  }
  const starGeo = star3d(0.55, 0.16), starMat = G(0xffe070, 2.2), gateGeo = tor(2.5, 0.13, 8, 44), gateMat = G(0x70ffc8, 1.6, { o: 0.95, add: true });
  const starPool = pool(64, () => new THREE.Mesh(starGeo, starMat));
  const gatePool = pool(10, () => { const g = new THREE.Group(); mesh(gateGeo, gateMat, 0, 0, 0, g); const h = halo(0x60ffc0, 9, 0, 0, 0, g, 0.22); h.material.fog = true; return g; });
  const cloudPool = pool(8, () => {
    const parts = []; for (let i = 0; i < 7; i++) { const r = rnd(1.5, 2.5); parts.push([sph(r, 10, 7).scale(1, 0.62, 1), 0x9aa8d4, rnd(-3.4, 3.4), rnd(-0.3, 0.5), rnd(-1.8, 1.8)]); }
    return new THREE.Mesh(merge(parts), bodyMat);
  });
  const churchPool = pool(2, () => {
    const g = new THREE.Group(), W = 0xf4f8ff, wall = 0x8a8478, glow = G(0xffc866, 1.7);
    mesh(merge([
      [box(5, 4, 8), wall, 0, 2, 0], [prism(5.6, 2.7, 8.5), W, 0, 3.96, 0], [prism(5.1, 2.5, 8.54), wall, 0, 3.96, 0], [box(2.6, 9.5, 2.6), wall, 0, 4.75, 4.2],
      [cone(2.0, 6.4, 4).rotateY(Math.PI / 4), 0x34446a, 0, 12.7, 4.2], [cone(1.1, 3.4, 4).rotateY(Math.PI / 4), W, 0, 14.25, 4.2], [box(1.1, 2, 0.1), 0x4a2a1a, 0, 1, 5.52],
    ]), bodyMat, 0, 0, 0, g);
    const w = [[box(0.7, 1.3, 0.1), 0xffffff, 0, 7.4, 5.52], [box(0.1, 1.3, 0.7), 0xffffff, 1.32, 7.4, 4.2], [box(0.1, 1.3, 0.7), 0xffffff, -1.32, 7.4, 4.2]];
    for (const sx of [-1, 1]) for (const z of [-2.6, -0.4, 1.8]) w.push([box(0.1, 1.7, 0.9), 0xffffff, sx * 2.52, 2.2, z]);
    mesh(merge(w), glow, 0, 0, 0, g); mesh(star3d(0.6, 0.15), G(0xffe070, 2.4), 0, 16.5, 4.2, g); halo(0xffd050, 7, 0, 16.5, 4.2, g, 0.8).material.fog = true;
    g.scale.setScalar(1.1); return g;
  });
  const lakePool = pool(2, () => new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), M(0x2a4a8a, { r: 0.12, m: 0.25, e: 0x0c1e4a, ei: 0.7 })));
  const NT = 440, NM = 110, ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const trees = new THREE.InstancedMesh(pineGeo(), bodyMat, NT), mounds = new THREE.InstancedMesh(sph(1, 14, 8), M(0xcad6f2, { r: 0.95 }), NM);
  trees.frustumCulled = mounds.frustumCulled = false; world.add(trees, mounds);
  let ti = 0, mi = 0;

  // ---------- state ----------
  const ents = [], obstacles = [], keys = {}, touches = new Map();
  let R = mulberry(seedN), genZ = 0, chunkI = 0, lastChunk = '';
  let state = 'idle', active = false, T = 0, tPlay = 0, dist = 0, prevDist = 0, v = 17, boost = 0, slow = 1, hurt = 0, shake = 0, spin = 1, slowmo = 0, flare = 0;
  let sx = 0, sy = 10, vx = 0, vy = 0, tx = 0, ty = 10, aimY = 0.25, cool = 0, introT = 0, endT = 0, jing = 0;
  let magic = 100, score = 0, shown = -1, combo = 0, bestCombo = 0, delivered = 0, carols = 0, tuneN = 1, tuneI = 0, gateChain = 0, starI = 0, hinted = 0, bumps = 0, misses = 0;
  let locked = null, lockD = 0, prevLocked = null, steerId = null, emaDt = 1 / 60, slowT = 0, lastNow = 0, aspect = 1.6, lastHud = '';
  const rr = (a, b) => a + R() * (b - a), ri = (n) => Math.floor(R() * n), coin = (p = 0.5) => R() < p;

  // ---------- world building ----------
  const blocked = (x, wz, r) => houses.some((h) => h.on && Math.abs(h.x - x) < h.rad + r && Math.abs(h.wz - wz) < h.rad + r) || ents.some((e) => e.solid && Math.abs(e.x - x) < e.solid + r && Math.abs(e.wz - wz) < e.solid * 1.6 + r);
  function addHouse(x, wz, o = {}) {
    const si = o.shape ?? [0, 0, 1, 3, 0, 1, 3, 2][ri(8)], h = houses.find((q) => !q.on && q.si === si) ?? houses.find((q) => !q.on); if (!h) return null;
    const ry = o.ry ?? rr(-0.4, 0.4), c = h.c, cs = Math.cos(ry), sn = Math.sin(ry);
    h.on = true; h.x = x; h.wz = wz; h.target = o.target !== false; h.done = false; h.k = h.target ? 0 : 1;
    h.g.position.set(x, 0, -wz); h.g.rotation.y = ry; h.g.visible = true; h.mark.visible = h.target; h.wm.color.copy(h.target ? DARK : LIT);
    h.cxw = x + S * (c.x * cs + c.z * sn); h.cwz = wz - S * (-c.x * sn + c.z * cs); h.cy = c.y * S; return h;
  }
  function freeHouse(h) { h.on = false; h.g.visible = false; h.ring.material = ringMat; if (prevLocked === h) prevLocked = null; }
  function tree(x, wz, h) {
    if (blocked(x, wz, h * 0.28)) return; const w = h * (0.85 + Math.random() * 0.3);
    trees.setMatrixAt(ti, _m4.compose(_v.set(x, -0.1, -wz), _q.setFromAxisAngle(UP, Math.random() * TAU), _s.set(w, h, w))); ti = (ti + 1) % NT; trees.instanceMatrix.needsUpdate = true;
    if (Math.abs(x) < 12.5 && h * 1.075 > Y_LO - 0.5) obstacles.push({ kind: 'tree', x, wz, h, top: h * 1.075 - 0.3 });
  }
  function mound(x, wz, r) {
    mounds.setMatrixAt(mi, _m4.compose(_v.set(x, -r * 0.04, -wz), _q.identity(), _s.set(r, r * 0.2, r * (0.7 + Math.random() * 0.6)))); mi = (mi + 1) % NM; mounds.instanceMatrix.needsUpdate = true;
  }
  function ent(kind, p, x, y, wz, extra) { const o = p.get(); if (!o) return null; o.position.set(x, y, -wz); const e = { kind, pool: p, o, x, y, wz, ...extra }; ents.push(e); return e; }
  const star = (x, y, wz) => ent('star', starPool, x, y, wz);
  const gate = (x, y, wz) => { const e = ent('gate', gatePool, x, y, wz); if (e) { e.o.scale.setScalar(1); e.passed = false; } };
  function cloud(x, y, wz) { if (ent('cloud', cloudPool, x, y, wz)) obstacles.push({ kind: 'cloud', x, wz, r: 5.2, bottom: y - 1.5 }); }
  function church(x, wz) { if (ent('church', churchPool, x, 0, wz, { solid: 4 })) obstacles.push({ kind: 'spire', x, wz: wz - 4.62, top: 17.5 }); }
  function lake(x, wz, rx, rz) { const e = ent('lake', lakePool, x, 0.06, wz); if (e) e.o.scale.set(rx, 1, rz); }
  const face = (x, wz, tx2, twz) => Math.atan2(tx2 - x, wz - twz); // rotation that turns a house's front door towards a point
  // scenery either side of the flight path
  function dress(z0, len, field = true) {
    for (let z = z0; z < z0 + len; z += 3.2) for (const sx2 of [-1, 1]) {
      if (coin(0.14)) addHouse(sx2 * rr(15, 26), z + rr(0, 3), { target: false, ry: rr(-0.6, 0.6) });
      else if (coin(0.8)) tree(sx2 * rr(14.5, 60), z + rr(0, 3), rr(3, 7.5));
    }
    for (let z = z0; z < z0 + len; z += 20) for (const sx2 of [-1, 1]) mound(sx2 * rr(30, 85), z + rr(0, 20), rr(8, 20));
    if (field) for (let z = z0; z < z0 + len; z += 8) mound(rr(-16, 16), z + rr(0, 8), rr(1.5, 4.5));
  }
  const CHUNKS = {
    lane(z0, D) { // a winding row of cottages, with stars leading from chimney to chimney
      const n = 5 + ri(3), sp = 14 - 3 * D, ph = rr(0, TAU), amp = 4 + 3.5 * D, X = (i) => amp * Math.sin(i * 0.95 + ph);
      for (let i = 0; i < n; i++) { const z = z0 + 8 + i * sp; addHouse(X(i), z); if (i < n - 1) for (let k = 1; k <= 2; k++) star(X(i + k / 3), 9.3, z + sp * k / 3); }
      return 8 + n * sp;
    },
    street(z0, D, w = 5.2, sp = 11.5 - 2 * D, shape) { // two facing rows; the sleepy houses swap sides every pair
      const n = 6 + ri(3);
      for (let i = 0; i < n; i++) {
        const z = z0 + 8 + i * sp, L = i % 4 < 2, both = D > 0.4 && coin(0.3);
        addHouse(-w, z, { ry: Math.PI / 2 + rr(-0.12, 0.12), target: L || both, shape }); addHouse(w, z, { ry: -Math.PI / 2 + rr(-0.12, 0.12), target: !L || both, shape });
        if (i % 2) star(0, 10.4 + 1.4 * Math.sin(i), z + sp / 2);
      }
      return 8 + n * sp;
    },
    terrace: (z0, D) => CHUNKS.street(z0, D, 3.5, 8.5 - D, 2), // tall houses packed tight
    square(z0, D) { // a church in the middle of the green: go round the spire
      const zc = z0 + 26, side = coin() ? 1 : -1; church(0, zc);
      for (const sx2 of [-1, 1]) for (const [x, dz] of [[7.4, -14], [9, -1], [7.4, 12]]) addHouse(sx2 * x, zc + dz, { ry: face(sx2 * x, zc + dz, 0, zc), target: sx2 === side || D > 0.3 });
      for (let i = 0; i <= 8; i++) star(side * (2.2 + 3.4 * Math.sin((i / 8) * Math.PI)), 11, zc - 16 + 30 * (i / 8));
      return 50;
    },
    forest(z0, D) { // a winding ride between tall pines; the stars are down among the trunks
      const len = 84, ph = rr(0, TAU), cx = (z) => 6 * Math.sin(z * 0.075 + ph), s1 = coin() ? 1 : -1;
      addHouse(cx(24) + s1 * 2.4, z0 + 24); addHouse(cx(58) - s1 * 2.4, z0 + 58);
      for (let z = 4; z < len - 4; z += 2.6) for (const sx2 of [-1, 1]) { const x = cx(z) + sx2 * rr(3.8 - D * 0.8, 12); if (Math.abs(x) < 14) tree(x, z0 + z + rr(-1, 1), coin(0.4 + 0.3 * D) ? rr(9, 12.2) : rr(4, 6.4)); }
      for (let z = 8; z < len - 6; z += 5.5) star(cx(z), 8.7, z0 + z);
      return len;
    },
    lake(z0) { // swoop low over the ice, then climb through the aurora gates
      const lx = rr(-2.5, 2.5); lake(lx, z0 + 40, 7, 30);
      for (let i = 0; i <= 12; i++) { const f = i / 12; star(lx + 4.5 * Math.sin(f * TAU), 12.3 - 4.4 * Math.sin(f * Math.PI), z0 + 10 + f * 58); }
      addHouse(lx - 10.5 > -9 ? lx - 10.5 : -9, z0 + 24, { ry: Math.PI / 2 }); addHouse(lx + 10.5 < 9 ? lx + 10.5 : 9, z0 + 50, { ry: -Math.PI / 2 });
      gate(-4, 9.5, z0 + 80); gate(3.5, 11, z0 + 96); gate(0, 12.6, z0 + 112);
      return 118;
    },
    gates(z0, D) { // aurora slalom: a gate one side, a chimney the other
      const n = 5, sp = 17;
      for (let i = 0; i < n; i++) { const x = (i % 2 ? 1 : -1) * rr(2.5, 4.5 + 3 * D), z = z0 + 10 + i * sp; gate(x, rr(8.8, 12.6), z); if (i < n - 1) addHouse(clamp(-x * 1.7, -8.5, 8.5), z + sp / 2); }
      return 10 + n * sp;
    },
    hamlet(z0, D) { // scattered cottages, with snow clouds and the odd tall pine to duck around
      let z = z0 + 8, x = rr(-6, 6); const n = 6 + ri(3);
      for (let i = 0; i < n; i++) {
        addHouse(x, z, { ry: rr(-0.6, 0.6) });
        if (D > 0.15 && coin(0.2 + 0.4 * D)) cloud(x + rr(-2, 2), 13, z + rr(-3, 3)); else if (coin(0.55)) star(x, 9.6, z - 5);
        if (D > 0.3 && coin(0.4)) tree(clamp(x + (coin() ? 5 : -5), -11, 11), z + 5.5, rr(9.5, 11.5));
        z += rr(10, 14) - 2 * D; x = clamp(x + rr(-9, 9), -8.5, 8.5);
      }
      return z - z0;
    },
  };
  const OPENING = ['lane', 'street', 'lake', 'hamlet', 'square'], BAG = ['lane', 'street', 'street', 'square', 'forest', 'forest', 'lake', 'gates', 'gates', 'hamlet', 'hamlet', 'terrace'];
  function nextChunk() {
    const D = clamp(genZ / 2800); let name = OPENING[chunkI];
    while (!name || name === lastChunk || (name === 'terrace' && D < 0.3)) name = BAG[ri(BAG.length)];
    const len = CHUNKS[name](genZ, D) + GAP; dress(genZ, len, name !== 'lake'); genZ += len; lastChunk = name; chunkI++;
  }
  function reset() {
    houses.forEach((h) => h.on && freeHouse(h)); ents.forEach((e) => e.pool.put(e.o)); ents.length = obstacles.length = 0;
    for (let i = 0; i < NT; i++) trees.setMatrixAt(i, ZERO); for (let i = 0; i < NM; i++) mounds.setMatrixAt(i, ZERO); trees.instanceMatrix.needsUpdate = mounds.instanceMatrix.needsUpdate = true;
    presents.forEach((p) => { p.on = false; p.o.visible = false; }); fx.life.fill(0);
    R = mulberry(seedN); genZ = 62; chunkI = 0; lastChunk = ''; ti = mi = 0;
    T = tPlay = dist = prevDist = boost = hurt = shake = slowmo = flare = cool = introT = endT = 0; v = 17; slow = 1; spin = 1;
    sx = vx = vy = tx = 0; sy = ty = 10; aimY = 0.25; magic = 100; score = combo = bestCombo = delivered = carols = tuneI = gateChain = starI = bumps = misses = 0; shown = -1;
    tuneN = (seedN % 24) + 1; locked = prevLocked = null; ship.visible = true; ship.position.set(0, 10, 0); ship.rotation.set(0, 0, 0);
    dress(-30, 92); for (let i = 0; i < 6; i++) star(2.5 * Math.sin(i * 0.9), 10 + 0.6 * Math.sin(i * 1.3), 24 + i * 6);
    while (genZ < AHEAD) nextChunk();
    camera.position.set(0, 14, 13); document.body.classList.remove('over'); ui.msg.className = ''; hud(true);
  }

  // ---------- feedback ----------
  function msg(text, long) { ui.msg.textContent = text; ui.msg.className = ''; void ui.msg.offsetWidth; ui.msg.className = long ? 'show long' : 'show'; }
  function pop(text, gold) {
    const el = ui.pops.children[pop.i = ((pop.i ?? -1) + 1) % ui.pops.children.length]; _v.set(sx, sy + 1.6, -2).project(camera);
    el.textContent = text; el.style.left = `${(_v.x * 0.5 + 0.5) * 100 + rnd(-4, 4)}%`; el.style.top = `${(-_v.y * 0.5 + 0.5) * 100}%`; el.className = ''; void el.offsetWidth; el.className = gold ? 'go gold' : 'go';
  }
  const mult = () => Math.min(8, 1 + Math.floor(combo / 3));
  function hud(force) {
    const sc = Math.round(shown = shown < 0 ? score : shown + (score - shown) * 0.25 + Math.sign(score - shown) * 0.5 * (Math.abs(score - shown) > 0.5)), m = mult();
    const key = `${sc}|${m}|${tuneN}|${tuneI}`; ui.bar.style.transform = `scaleX(${(magic / 100).toFixed(3)})`;
    if (key === lastHud && !force) return; lastHud = key;
    ui.score.textContent = sc.toLocaleString(); ui.combo.textContent = m > 1 ? `×${m}` : ''; ui.tune.textContent = `♪ ${tuneName(tuneN)} · ${tuneI}/${audio.tuneLen(tuneN)}`;
  }
  function sparkle(x, y, z, n, speed, cols, size = 1.2, up = 2) { for (let i = 0; i < n; i++) { const a = rnd(TAU), s = speed * rnd(0.3, 1); fx.emit(x, y, z, Math.cos(a) * s, rnd(0.3, 1) * speed * up * 0.5, Math.sin(a) * s + v, pick(cols), rnd(0.5, 1.1), size * rnd(0.6, 1.2), 4); } }

  // ---------- actions ----------
  const fallT = (Y) => { const h = sy - 0.3 - Y; return h <= 0 ? 0 : (-DROP_V + Math.sqrt(DROP_V * DROP_V + 2 * GR * h)) / GR; };
  function drop() {
    if (state !== 'play' || cool > 0) return; const p = presents.find((q) => !q.on); if (!p) return;
    cool = 0.24; p.on = true; p.h = null; p.x = sx; p.y = sy - 0.3; p.z = 0; p.vx = vx * PVX; p.vy = -DROP_V;
    p.o.visible = true; p.o.scale.setScalar(1); p.o.position.set(p.x, p.y, p.z); audio.twinkle(0);
  }
  function deliver(h, d) {
    const perfect = d < PERFECT_R; h.done = true; h.mark.visible = false; combo++; bestCombo = Math.max(bestCombo, combo); delivered++;
    const pts = (perfect ? 150 : 100) * mult(); score += pts; magic = Math.min(100, magic + (perfect ? 9 : 6.5));
    audio.tuneNote(tuneN, tuneI, perfect); tuneI++; pop(perfect ? `Perfect! +${pts}` : `+${pts}`, perfect);
    sparkle(h.cxw, h.cy + 0.3, dist - h.cwz, perfect ? 46 : 26, 4, SPARK, 1.3, 3); if (navigator.vibrate) navigator.vibrate(perfect ? 18 : 8);
    if (tuneI >= audio.tuneLen(tuneN)) { // a whole carol played, one chimney at a time
      carols++; score += 500; magic = Math.min(100, magic + 18); msg(`♪ ${tuneName(tuneN)} — carol complete! +500`, true); audio.fanfare(); flare = 1; if (!reduced) slowmo = 0.35;
      for (let i = 0; i < 5; i++) fx.burst(rnd(-14, 14), rnd(12, 20), rnd(-40, -22), 60, 9, [0xffd34d, 0xff5a60, 0x60ffc0, 0xffffff], 1.8, 1.6, 2);
      tuneN = (tuneN % 24) + 1; tuneI = 0;
    }
  }
  function miss(p, y) {
    p.on = false; p.o.visible = false; sparkle(p.x, y + 0.2, p.z, 16, 2.4, SNOW, 1); audio.pff(); misses++;
    if (combo > 2) pop('streak lost'); combo = 0; magic -= 2;
  }
  function bump() {
    hurt = 1.7; magic -= 16; combo = 0; gateChain = 0; slow = 0.5; boost = 0; bumps++; audio.thud(); msg('Oof!'); if (navigator.vibrate) navigator.vibrate(60);
    if (!reduced) { shake = 1; spin = 0; } fx.burst(sx, sy + 0.5, -3, 70, 7, SNOW, 1.1, 1.3, 3);
  }
  function passGate(e) {
    gateChain++; boost = 9; flare = Math.max(flare, 0.6); magic = Math.min(100, magic + 4 + gateChain); score += 50 * gateChain; audio.whoosh(); pop(`+${50 * gateChain}`);
    for (let i = 0; i < 40; i++) { const a = rnd(TAU); fx.emit(e.x + Math.cos(a) * 2.5, e.y + Math.sin(a) * 2.5, 0, Math.cos(a) * 3, Math.sin(a) * 3, v + rnd(4), pick([0x70ffc8, 0xb080ff, 0xffffff]), rnd(0.5, 1), 1.4, 0); }
  }
  function finish() {
    state = 'ending'; endT = 0; aim.visible = false; msg('The magic has run out… home we go!', true); audio.wind(0.25);
  }
  function over() {
    state = 'over'; ship.visible = false; audio.wind(0); audio.fanfare();
    let best = 0, night = 0; try { best = +localStorage.getItem('advent-md-best') || 0; night = +localStorage.getItem('advent-md-' + seed) || 0; } catch { /* storage unavailable */ }
    const isBest = score > best && score > 0;
    if (record) try { if (score > best) localStorage.setItem('advent-md-best', score); if (score > night) localStorage.setItem('advent-md-' + seed, score); } catch { /* ignore */ }
    ui.final.textContent = score.toLocaleString();
    ui.stats.textContent = `${delivered} present${delivered === 1 ? '' : 's'} delivered · best streak ${bestCombo}` + (carols ? ` · ${carols} carol${carols > 1 ? 's' : ''} played` : '');
    ui.best.textContent = isBest ? '★ A new best! ★' : `Tonight’s best ${Math.max(night, score).toLocaleString()} · all-time best ${Math.max(best, score).toLocaleString()}`;
    document.body.classList.add('over');
  }

  // ---------- input ----------
  const live = () => active && (state === 'play' || state === 'intro');
  function setAbs(e) { tx = clamp(((e.clientX / innerWidth) * 2 - 1) * XR * 1.15, -XR, XR); ty = lerp(Y_HI, Y_LO, clamp((e.clientY / innerHeight - 0.14) / 0.72)); }
  function onDown(e) {
    if (!live()) return; document.activeElement?.blur?.();
    if (e.pointerType === 'mouse') { setAbs(e); if (e.button === 0) drop(); return; }
    e.preventDefault(); const t = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, tapped: false }; touches.set(e.pointerId, t);
    if (touches.size > 1) { t.tapped = true; drop(); } else steerId = e.pointerId; // a second finger is always a drop
  }
  function onMove(e) {
    if (!live()) return; if (e.pointerType === 'mouse') { setAbs(e); return; }
    const t = touches.get(e.pointerId); if (!t) return; const dx = e.clientX - t.x, dy = e.clientY - t.y; t.x = e.clientX; t.y = e.clientY; t.moved += Math.abs(dx) + Math.abs(dy);
    if (e.pointerId === steerId) { tx = clamp(tx + (dx / innerWidth) * XR * (aspect < 1 ? 3.4 : 2.6), -XR, XR); ty = clamp(ty - (dy / innerHeight) * (Y_HI - Y_LO) * 2.4, Y_LO, Y_HI); }
  }
  function onUp(e) {
    const t = touches.get(e.pointerId); if (!t) return; touches.delete(e.pointerId); if (e.pointerId === steerId) steerId = touches.size ? touches.keys().next().value : null;
    if (live() && e.type === 'pointerup' && !t.tapped && t.moved < 18 && performance.now() - t.t < 280) drop(); // a quick tap
  }
  function onKey(e) {
    if (!active) return; const k = e.key.toLowerCase();
    if (e.type === 'keyup') { keys[k] = 0; return; }
    if (k === 'escape') { exit(); return; }
    if (!live()) return;
    if (k === ' ' || k === 'enter') { e.preventDefault(); if (!e.repeat) drop(); } else { keys[k] = 1; if (k.startsWith('arrow')) e.preventDefault(); }
  }
  const noMenu = (e) => e.preventDefault(), onHide = () => { if (document.hidden) audio.wind(0); };
  const LISTEN = [[dom, 'pointerdown', onDown], [dom, 'pointermove', onMove], [dom, 'pointerup', onUp], [dom, 'pointercancel', onUp], [dom, 'contextmenu', noMenu], [window, 'keydown', onKey], [window, 'keyup', onKey], [document, 'visibilitychange', onHide]];
  function exit() { if (!active || exit.busy) return; exit.busy = true; onExit?.(); }
  $('g-quit').onclick = exit; $('g-home').onclick = exit; $('g-again').onclick = () => { if (state === 'over') { reset(); begin(); } };

  // the autopilot used for testing and tuning: lines up on the next sleepy chimney and drops when the ring locks
  function botStep() {
    let best = null, bc = -1e9; for (const h of houses) if (h.on && h.target && !h.done) { const cr = dist - h.cwz; if (cr < -(v + DROP_FWD) * fallT(h.cy) + 0.5 && cr > bc) { bc = cr; best = h; } }
    tx = best ? best.cxw : 0; ty = 8.8;
    for (const o of obstacles) {
      const rel = dist - o.wz; if (rel < -30 || rel > 2 || Math.abs(o.x - sx) > 5.5) continue;
      if (o.kind === 'cloud') ty = Y_LO + 0.3; else if (o.kind === 'tree' && o.top < Y_HI - 0.6) ty = Math.max(ty, o.top + 1); else tx = o.x + (tx >= o.x ? 1 : -1) * Math.max(4, Math.abs(tx - o.x));
    }
    tx = clamp(tx, -XR, XR); if (locked) drop();
  }
  function hits(o, rel) {
    const dx = Math.abs(o.x - sx); let r;
    if (o.kind === 'tree') { if (sy - 0.3 > o.top) return false; r = o.h * 0.36 * Math.max(0, 1 - (sy - 0.3) / (o.top + 0.3)) + 0.7; }
    else if (o.kind === 'cloud') { if (sy + 0.9 < o.bottom) return false; r = o.r; }
    else r = (sy < 10.5 ? 1.6 : Math.max(0.2, 1.6 * (o.top - sy) / (o.top - 10.5))) + 0.6;
    return dx < r && rel > -6.6 - r * 0.6 && rel < 0.8 + r * 0.6;
  }

  // ---------- frame ----------
  function update(dt) {
    if (adaptive && setPR) { // drop the resolution a notch if this device can't hold a smooth frame rate (ignoring hitches and throttled tabs)
      const now = performance.now(), raw = (now - lastNow) / 1000; lastNow = now;
      if (raw < 0.2) { emaDt = lerp(emaDt, raw, 0.04); slowT = emaDt > 0.027 ? slowT + raw : Math.min(slowT, 0); if (slowT > 2.5 && getPR() > 1) { setPR(Math.max(1, getPR() - 0.5)); slowT = -4; } }
    }
    if (slowmo > 0) { slowmo -= dt; dt *= 0.45; }
    T += dt; prevDist = dist; cool -= dt; hurt -= dt; const playing = state === 'play' || state === 'intro';
    if (playing) {
      if (bot) botStep();
      const kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0), ky = (keys.arrowup || keys.w ? 1 : 0) - (keys.arrowdown || keys.s ? 1 : 0);
      tx = clamp(tx + kx * 26 * dt, -XR, XR); ty = clamp(ty + ky * 14 * dt, Y_LO, Y_HI);
      const n = Math.max(1, Math.ceil(dt * 120)), h = dt / n; // a weighty, slightly springy sleigh
      for (let i = 0; i < n; i++) { vx += ((tx - sx) * 42 - vx * 11.5) * h; vy += ((ty - sy) * 34 - vy * 10.5) * h; sx += vx * h; sy += vy * h; }
      if (state === 'intro') { if ((introT += dt) > 2.4) state = 'play'; } else tPlay += dt;
      slow = Math.min(1, slow + dt * 0.45); boost = Math.max(0, boost - dt * 2.6);
      v = (17 + 12 * (1 - Math.exp(-tPlay / 150))) * slow + boost;
      if (state === 'play' && dist > 55) { magic -= (2.4 + tPlay * 0.018 + 0.9 * (tPlay / 100) ** 2) * dt; if (magic <= 0) { magic = 0; finish(); } }
    } else if (state === 'ending') {
      endT += dt; v = lerp(v, 9, dt * 1.5); vx *= 0.9; sy += (1.5 + endT * 3.2) * dt; ship.position.z -= (8 + endT * 36) * dt; if (endT > 2.7) over();
    } else v = lerp(v, 4, dt);
    dist += v * dt; world.position.z = dist; while (genZ < dist + AHEAD) nextChunk();

    // houses: light up, pulse their beacons, and find the chimney the next present would land in
    locked = null; let aimT = 0.25, near = -1e9;
    for (const h of houses) {
      if (!h.on) continue; if (dist - h.wz > BEHIND) { freeHouse(h); continue; }
      if (h.done && h.k < 1) { h.k = Math.min(1, h.k + dt * 4); h.wm.color.lerpColors(DARK, LIT, easeOut(h.k)); }
      if (!h.target || h.done) continue; const cr = dist - h.cwz; h.ring.scale.setScalar(1 + 0.14 * Math.sin(T * 5 + h.wz)); h.ring.position.y = 0.5 + 0.12 * Math.sin(T * 3 + h.wz); h.beacon.scale.y = clamp((-cr - 14) / 30, 0.001, 1);
      if (!playing || cr < -55 || cr > 3) continue;
      const t = fallT(h.cy), d = Math.hypot(h.cxw - (sx + vx * PVX * t), cr + (v + DROP_FWD) * t);
      if (d < HIT_R * 0.9 && (!locked || d < lockD)) { locked = h; lockD = d; }
      if (cr < -1 && cr > near) { near = cr; aimT = h.cy; if (!hinted && cr > -70) { hinted = 1; msg(coarse ? 'Tap to drop a present down the glowing chimney' : 'Click (or press space) to drop a present down the glowing chimney', true); } }
    }
    if (locked !== prevLocked) { if (prevLocked) prevLocked.ring.material = ringMat; if (locked) locked.ring.material = ringMatOn; prevLocked = locked; }
    aimY += (aimT - aimY) * Math.min(1, dt * 9); const at = fallT(aimY);
    aim.visible = playing; aim.position.set(sx + vx * PVX * at, aimY + 0.12, -(v + DROP_FWD) * at); aim.material = aim.children[0].material = locked ? aimOn : aimOff; aim.scale.setScalar(locked ? 1.15 + 0.1 * Math.sin(T * 18) : 1);

    // presents in flight
    for (const p of presents) {
      if (!p.on) continue;
      if (p.h) { const k = Math.min(1, (p.t += dt / 0.15)), h = p.h; p.o.position.set(lerp(p.x, h.cxw, k), lerp(p.y, h.cy - 0.5, k), lerp(p.z, dist - h.cwz, k)); p.o.scale.setScalar(1 - 0.75 * k); if (k >= 1) { p.on = false; p.o.visible = false; } continue; }
      const py = p.y, px = p.x, pz = p.z; p.y += p.vy * dt - 0.5 * GR * dt * dt; p.vy -= GR * dt; p.x += p.vx * dt; p.z -= DROP_FWD * dt; p.o.rotation.x += dt * 5; p.o.rotation.z += dt * 3.1;
      for (const h of houses) {
        if (!h.on) continue; const cr = dist - h.cwz; if (cr < -14 || cr > 14) continue;
        if (h.target && !h.done && py > h.cy && p.y <= h.cy) { const f = (py - h.cy) / (py - p.y), d = Math.hypot(h.cxw - lerp(px, p.x, f), lerp(prevDist - h.cwz, cr, f) - lerp(pz, p.z, f)); if (d < HIT_R) { p.h = h; p.t = 0; deliver(h, d); break; } }
        if (p.y < h.top && Math.abs(h.x - p.x) < h.rad && Math.abs(dist - h.wz - p.z) < h.rad) { miss(p, h.top); break; }
      }
      if (p.on && !p.h) { if (p.y <= 0.25) miss(p, 0.25); else p.o.position.set(p.x, p.y, p.z); }
    }

    // stars, gates and scenery
    for (let i = ents.length - 1; i >= 0; i--) {
      const e = ents[i], rel = dist - e.wz; let gone = rel > BEHIND + (e.kind === 'lake' ? 34 : 0);
      if (e.kind === 'star') {
        e.o.rotation.y = T * 2.6 + e.wz; e.o.position.y = e.y + 0.15 * Math.sin(T * 2 + e.wz);
        if (playing && rel > -6.5 && rel < 1.5 && Math.abs(e.x - sx) < 1.75 && Math.abs(e.y - sy) < 1.9) { gone = true; score += 10; magic = Math.min(100, magic + 1.6); audio.twinkle(++starI); sparkle(e.x, e.y, rel, 10, 2.5, SPARK, 1, 1); }
      } else if (e.kind === 'gate') {
        e.o.rotation.z = T * 0.5; e.o.scale.setScalar(1 + 0.04 * Math.sin(T * 4 + e.wz));
        if (playing && !e.passed && rel >= -1.5) { e.passed = true; if (Math.hypot(e.x - sx, e.y - sy - 0.4) < 2.5) { passGate(e); gone = true; } else gateChain = 0; }
      }
      if (gone) { e.pool.put(e.o); ents[i] = ents[ents.length - 1]; ents.pop(); }
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i], rel = dist - o.wz; if (rel > 14) { obstacles[i] = obstacles[obstacles.length - 1]; obstacles.pop(); continue; }
      if (playing && hurt <= 0 && rel > -12 && hits(o, rel)) bump();
    }

    // sleigh, camera, atmosphere
    spin = Math.min(1, spin + dt / 0.8); shake = Math.max(0, shake - dt * 2.2); flare = Math.max(0, flare - dt * 0.5);
    ship.position.x = sx; ship.position.y = sy; ship.rotation.set(clamp(vy * 0.035, -0.4, 0.4), clamp(-vx * 0.02, -0.35, 0.35), clamp(-vx * 0.04, -0.55, 0.55) + easeOut(spin) * TAU);
    if (playing) ship.visible = hurt <= 0 || Math.floor(T * 16) % 2 === 0;
    team.userData.tick(T * (0.6 + v / 28));
    if (ship.visible) for (let i = 0; i < 2; i++) fx.emit(sx + rnd(-0.5, 0.5), ship.position.y + rnd(0, 0.5), ship.position.z + 0.9, rnd(-0.4, 0.4), rnd(-0.6, 0.2), v * rnd(0.5, 0.9), pick(SPARK), rnd(0.4, 0.9), rnd(0.5, 1) + boost * 0.08, 0.5);
    const pf = clamp((1.25 / aspect - 1) / 1.2), k = 1 - Math.exp(-dt * 5.5), cy = state === 'ending' ? camera.position.y : sy + lerp(3.9, 4.8, pf), sh = shake * shake * 0.5;
    camera.position.x += (sx * lerp(0.62, 0.9, pf) - camera.position.x) * k; camera.position.y += (cy - camera.position.y) * k; camera.position.z += (lerp(9.5, 14.5, pf) - boost * 0.12 - camera.position.z) * k;
    camera.fov += (lerp(58, 72, pf) + (v - 17) * 0.45 - camera.fov) * k; camera.updateProjectionMatrix();
    camera.lookAt(sx * lerp(0.8, 0.95, pf) + rnd(-sh, sh), ship.position.y - 1.7 + rnd(-sh, sh), -18 + ship.position.z * 0.8); camera.rotation.z += clamp(-vx * 0.006, -0.08, 0.08) * !reduced;
    gtex.offset.y = (dist / (440 / 14)) % 1; snow.userData.u.uTime.value = T; snow.userData.u.uDist.value = dist % 120;
    sky.userData.tick(T); aur.userData.tick(T); aur.material.uniforms.uGain.value = 0.9 + flare * 1.8; fx.update(dt);
    if (playing && (jing -= dt) < 0) { jing = 0.36 * (17 / Math.max(12, v)); audio.jingle(0.016); audio.wind(clamp(0.35 + (v - 17) / 20 + Math.abs(vx) / 40)); }
    ui.magic.classList.toggle('low', magic < 25 && state === 'play'); hud();
  }

  function begin() { state = 'intro'; exit.busy = false; msg(coarse ? 'Drag to steer the sleigh' : 'Move the mouse to steer the sleigh', true); audio.bells(); }
  function start() { if (active) return; active = true; LISTEN.forEach(([t, ev, f]) => t.addEventListener(ev, f, { passive: false })); dom.style.cursor = 'crosshair'; reset(); begin(); }
  function stop() { active = false; state = 'idle'; LISTEN.forEach(([t, ev, f]) => t.removeEventListener(ev, f)); touches.clear(); for (const k in keys) keys[k] = 0; audio.wind(0); dom.style.cursor = 'default'; document.body.classList.remove('over'); }
  function resize(a) { aspect = a; camera.aspect = a; camera.updateProjectionMatrix(); }
  return {
    scene, camera, start, stop, update, resize,
    get stats() { return { state, t: +tPlay.toFixed(1), dist: Math.round(dist), score, delivered, misses, bumps, bestCombo, carols, magic: Math.round(magic), v: +v.toFixed(1) }; },
  };
}
