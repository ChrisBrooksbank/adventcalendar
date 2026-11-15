// Twenty-Four Stars: on 1 December the star on the Advent House roof has gone out, its light scattered into the
// twenty-four worlds behind the doors. Each world hides one star-spark; found, it flies home and takes its place in
// a constellation over the house — one more line drawn each day — until on Christmas Eve the whole constellation
// comes down and lights the roof star again.
import { THREE, TAU, rnd, pick, clamp, lerp, smooth, easeOut, easeIO, easeBack, G, mesh, grp, star3d, halo, sprite, rayTex, glowTex } from './kit.js';

// A leaping reindeer, drawn so that every new star joins one already in the sky (door 20 is the nose, of course;
// door 24 is the last tip of the antlers). Coordinates are in a 0–20 by 0–12 sketch space.
export const POINTS = [
  null,
  [14.2, 8.4], [11.0, 7.9], [7.4, 7.4], [6.4, 8.2], [8.0, 5.8], [6.3, 4.0], [4.2, 3.4], [7.7, 3.7], [6.2, 2.3], [11.5, 5.4],
  [15.0, 6.2], [16.7, 4.7], [18.3, 4.6], [15.4, 4.1], [16.4, 2.8], [16.6, 7.5], [15.7, 9.0], [16.9, 9.0], [16.4, 9.8], [18.6, 8.1],
  [15.6, 11.0], [17.6, 11.3], [14.3, 11.7], [16.7, 12.2],
];
export const EDGES = [[1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [6, 7], [5, 8], [8, 9], [5, 10], [10, 11], [1, 11], [11, 12], [12, 13], [11, 14], [14, 15], [11, 16], [1, 17], [17, 18], [18, 19], [18, 20], [16, 20], [19, 21], [19, 22], [21, 23], [21, 24]];
// what tomorrow's keyhole whispers
export const RIDDLES = [
  '',
  'Something very small is about to fall for the very first time.',
  'Somebody small and furry has an eye on the best armchair.',
  'When nobody is looking, something cold begins to dance.',
  'Deep in the wood, something tall is waiting to be switched on.',
  'Footsteps in the snow, and a lantern swinging.',
  'A sack, a beard — and something wriggling inside.',
  'Voices under a lamp. A cow humming along.',
  'Bells on bobtails. Hold on tight.',
  'A small red visitor is coming to the door.',
  'Glass-clear and ringing. Mind your step.',
  'Hooves on a roof. Who is minding the sleigh?',
  'A bird with very high standards, in a very particular tree.',
  'On the darkest morning, someone carries the light.',
  'Fear not.',
  'A lane of windows, waiting for someone to light them.',
  'A whole world, small enough to hold. Give it a shake.',
  'Three travellers, and a star that will not keep still.',
  'Above the clouds, the sky is clearing its throat.',
  'The long road, and the little town in sight.',
  'Somebody with a very bright nose is warming up.',
  'The longest night, and the sky lights its own lamps.',
  'Bells on the hill. Everyone is climbing.',
  'Fresh hay. Everyone is waiting.',
  'All is calm. All is bright. Almost.',
];

// ---------- the star-spark hidden in each scene ----------
// o.t: appears after t seconds; o.tap: appears when that object is tapped; o.s: extra size (for far-off places).
export function makeSpark(parent, x, y, z, o = {}) {
  const g = grp(parent, x, y, z); parent.updateMatrixWorld(true);
  const ws = parent.getWorldScale(new THREE.Vector3()), k = (o.s ?? 1) / Math.max(0.05, (ws.x + ws.y + ws.z) / 3); g.scale.setScalar(k);
  const body = grp(g), core = mesh(star3d(0.2, 0.07), G(0xfff2b0, 3.2), 0, 0, 0, body);
  const glow = halo(0xffd870, 1.5, 0, 0, 0, g, 0.85), rays = sprite(rayTex(), 0xfff0c0, 1.2, 0, 0, 0, g, 0.75);
  const hit = mesh(new THREE.SphereGeometry(0.55, 8, 6), new THREE.MeshBasicMaterial({ visible: false }), 0, 0, 0, g);
  const s = { g, hit, host: o.tap ?? null, state: o.tap || o.t ? 'hidden' : 'shown', tReveal: o.t ?? 0, t0: -9, seen: 0, flying: null, core, glow, rays, k };
  g.scale.setScalar(s.state === 'shown' ? k : 0.0001); hit.userData.spark = s;
  s.reveal = (t) => { if (s.state === 'hidden') { s.state = 'shown'; s.t0 = t; } };
  s.update = (t, dt, fx, cam) => {
    if (s.state === 'hidden' && !s.host && t >= s.tReveal) s.reveal(t);
    if (s.state === 'shown') {
      const pop = easeBack(clamp((t - s.t0) / 0.7)); g.scale.setScalar(Math.max(0.0001, pop) * k); s.seen += dt;
      body.rotation.y = t * 1.6; body.position.y = Math.sin(t * 2.1) * 0.08; rays.material.rotation = t * 0.4;
      const hint = smooth(25, 28, s.seen); glow.material.opacity = 0.75 + 0.2 * Math.sin(t * 3) + hint * 0.4 * Math.max(0, Math.sin(t * 5));
      if (fx && Math.random() < 0.12 + hint * 0.5) { const p = g.getWorldPosition(_v); fx.emit(p.x + rnd(-0.2, 0.2) * k, p.y + rnd(-0.2, 0.2) * k, p.z, rnd(-0.2, 0.2), rnd(0.1, 0.6), rnd(-0.2, 0.2), pick([0xffe9a0, 0xffffff, 0xffd34d]), rnd(0.6, 1.2), 0.5 * Math.min(2.5, k), 0); }
    } else if (s.state === 'hidden' && s.host && fx) { // the hint: after a while, the hiding place itself starts to glitter
      s.seen += dt; if (s.seen > 25 && Math.random() < 0.25) { const p = s.host.getWorldPosition(_v); fx.emit(p.x + rnd(-0.4, 0.4), p.y + rnd(-0.2, 0.6), p.z + rnd(-0.4, 0.4), 0, rnd(0.2, 0.7), 0, 0xffe9a0, 1, 0.7, 0); }
    } else if (s.state === 'flying') {
      const f = s.flying, u = clamp((t - f.t0) / 1.5), e = easeIO(u); cam.updateMatrixWorld();
      const to = _w.set(0, 1.4, -3).applyMatrix4(cam.matrixWorld); g.position.lerpVectors(f.from, to, e); g.position.y += Math.sin(u * Math.PI) * 1.2;
      g.scale.setScalar(f.s * (1 + u * 0.6) * (1 - smooth(0.75, 1, u)) + 0.0001); body.rotation.y += dt * 14;
      if (fx) for (let i = 0; i < 6; i++) fx.emit(g.position.x, g.position.y, g.position.z, rnd(-0.5, 0.5), rnd(-0.5, 0.5), rnd(-0.5, 0.5), pick([0xffe9a0, 0xffffff, 0xffd34d, 0xffb060]), rnd(0.6, 1.4), rnd(0.6, 1.3), 0.4);
      if (u >= 1) { s.state = 'gone'; g.visible = false; }
    }
  };
  s.collect = (t, scene, fx) => {
    if (s.state !== 'shown') return false; scene.attach(g); s.flying = { t0: t, from: g.position.clone(), s: g.scale.x }; s.state = 'flying';
    if (fx) { const p = g.position; fx.burst(p.x, p.y, p.z, 120, 3.2, [0xffe9a0, 0xffffff, 0xffd34d], 1.6, 1.2, 0.6); }
    return true;
  };
  if (o.found) { s.state = 'gone'; g.visible = false; }
  return s;
}
const _v = new THREE.Vector3(), _w = new THREE.Vector3();

// ---------- the constellation over the house ----------
export function createSky(scene) {
  const root = grp(scene), slots = [], lines = [];
  for (let n = 1; n <= 24; n++) {
    const g = grp(root), core = sprite(glowTex(), n === 20 ? 0xff6a50 : 0xfff2c8, 1, 0, 0, 0, g, 0), ray = sprite(rayTex(), n === 20 ? 0xffa090 : 0xfff0c0, 1, 0, 0, 0, g, 0);
    slots[n] = { g, core, ray, on: 0, want: 0, ghost: 0, ph: rnd(TAU) };
  }
  for (const [a, b] of EDGES) {
    const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    l.frustumCulled = false; root.add(l); lines.push({ l, a, b, k: 0 });
  }
  let size = 1; const anchor = new THREE.Vector3(), basis = { r: new THREE.Vector3(), u: new THREE.Vector3(), f: new THREE.Vector3() }; let box = [0, 0, 1, 1];
  const world = (n, out = new THREE.Vector3()) => {
    const [px, py] = POINTS[n], ax = lerp(box[0], box[2], (px - 4) / 15), ay = lerp(box[1], box[3], (py - 2.2) / 10.2);
    return out.copy(basis.f).addScaledVector(basis.r, Math.tan(ax)).addScaledVector(basis.u, Math.tan(ay)).multiplyScalar(110).add(anchor);
  };
  const sky = {
    root, slots,
    // fit the reindeer into the open sky beside the roof (landscape) or above it (portrait), in the home camera's angles
    layout(home, look, fov, aspect) {
      anchor.copy(home); basis.f.subVectors(look, home).normalize(); basis.r.crossVectors(basis.f, new THREE.Vector3(0, 1, 0)).normalize(); basis.u.crossVectors(basis.r, basis.f);
      const tv = Math.tan((fov * Math.PI) / 360), vh = Math.atan(tv), hh = Math.atan(tv * aspect);
      // landscape: the open sky to the left of the roof, the reindeer leaping towards the roof star
      if (aspect >= 1.15) { const x0 = 0.3, y0 = vh * 0.42, y1 = vh * 0.97, w = Math.min(hh * 0.93 - x0, (y1 - y0) * 1.45); box = [-(x0 + w), y1 - w / 1.45, -x0, y1]; }
      else { const y0 = vh * 0.5, y1 = vh * 0.74, w = Math.min(hh * 1.7, (y1 - y0) * 1.45); box = [-w / 2, y0, w / 2, y0 + w / 1.45]; }
      size = (box[2] - box[0]) * 110 * 0.05;
      for (let n = 1; n <= 24; n++) world(n, slots[n].g.position);
      for (const L of lines) { const p = L.l.geometry.attributes.position; p.setXYZ(0, ...slots[L.a].g.position.toArray()); p.setXYZ(1, ...slots[L.b].g.position.toArray()); p.needsUpdate = true; }
    },
    world,
    // found: set of door numbers whose star is in the sky; ghosts: doors you could still go back for
    set(found, ghost) { for (let n = 1; n <= 24; n++) { slots[n].want = found.has(n) ? 1 : 0; slots[n].ghost = ghost(n) ? 1 : 0; } },
    light(n) { slots[n].want = 1; },
    update(t, dt, gain = 1) {
      for (let n = 1; n <= 24; n++) {
        const s = slots[n]; s.on = lerp(s.on, s.want, Math.min(1, dt * 2.2)); const tw = 0.8 + 0.2 * Math.sin(t * (1.3 + (n % 5) * 0.4) + s.ph);
        s.core.scale.setScalar(size * (0.9 + s.on * 1.6) * tw); s.core.material.opacity = (s.ghost * 0.16 * (1 - s.on) + s.on) * gain;
        s.ray.scale.setScalar(size * 3.2 * tw); s.ray.material.opacity = s.on * 0.6 * gain; s.ray.material.rotation = t * 0.05 + s.ph;
      }
      for (const L of lines) { const want = Math.min(slots[L.a].on, slots[L.b].on); L.l.material.opacity = smooth(0.6, 1, want) * 0.55 * gain; }
    },
  };
  return sky;
}

// a star streaking from an opened door up to its place in the sky (or down from the sky to the roof, at the finale)
export function streak(fx, from, to, t0, dur, colors = [0xffe9a0, 0xffffff, 0xffd34d]) {
  const ctrl = from.clone().lerp(to, 0.5); ctrl.y += Math.max(6, from.distanceTo(to) * 0.25); ctrl.z += 4;
  const head = new THREE.Vector3(), q = new THREE.QuadraticBezierCurve3(from.clone(), ctrl, to.clone());
  return (t) => {
    const u = clamp((t - t0) / dur); if (u <= 0) return false; q.getPoint(easeIO(u), head);
    for (let i = 0; i < 8; i++) fx.emit(head.x + rnd(-0.15, 0.15), head.y + rnd(-0.15, 0.15), head.z, rnd(-0.4, 0.4), rnd(-0.4, 0.4), rnd(-0.4, 0.4), pick(colors), rnd(0.5, 1.2), rnd(0.9, 2.2), 0.3);
    return u >= 1;
  };
}
export { easeOut };
