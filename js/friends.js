// The friends on the lawn — the snowmen, George the monkey and Monty the moose.
// Hand-modelled (not the generic kit figures): plush rim-lit fur, glinting eyes that blink,
// knitted scarves, sparkling snow and fairy lights in Monty's antlers.
import { THREE, TAU, rnd, pick, lerp, M, G, sph, box, cyl, tor, mesh, grp, halo, glowTex, twinkles, tuft } from './kit.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const LIGHTS = [0xff3b30, 0xffd34d, 0x39d353, 0x3aa0ff, 0xff7ad9];

// ---------- shared craft ----------
// A soft material with a fresnel rim: reads as plush fur, velvet, or moonlit snow.
export function soft(color, o = {}) {
  const m = M(color, { r: 0.95, ...o }), rim = new THREE.Color(o.rim ?? 0xffffff).multiplyScalar(o.ri ?? 0.3);
  m.onBeforeCompile = (s) => {
    s.uniforms.uRim = { value: rim };
    s.fragmentShader = 'uniform vec3 uRim;\n' + s.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += uRim * pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 2.6);');
  };
  m.customProgramCacheKey = () => 'rim'; return m;
}
// Smooth normals shared across coincident vertices (no seams on displaced spheres, organic edges on extrusions).
function smoothNormals(geo) {
  const p = geo.attributes.position, idx = geo.index, n = idx ? idx.count : p.count, acc = new Map(), a = V(), b = V(), c = V();
  const key = (i) => `${Math.round(p.getX(i) * 4e3)},${Math.round(p.getY(i) * 4e3)},${Math.round(p.getZ(i) * 4e3)}`, keys = [];
  for (let i = 0; i < p.count; i++) { const k = keys[i] = key(i); if (!acc.has(k)) acc.set(k, V()); }
  for (let i = 0; i < n; i += 3) {
    const ia = idx ? idx.getX(i) : i, ib = idx ? idx.getX(i + 1) : i + 1, ic = idx ? idx.getX(i + 2) : i + 2;
    a.fromBufferAttribute(p, ia); b.fromBufferAttribute(p, ib); c.fromBufferAttribute(p, ic); c.sub(b); a.sub(b); c.cross(a);
    acc.get(keys[ia]).add(c); acc.get(keys[ib]).add(c); acc.get(keys[ic]).add(c);
  }
  const out = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { a.copy(acc.get(keys[i])).normalize(); out.set([a.x, a.y, a.z], i * 3); }
  geo.setAttribute('normal', new THREE.BufferAttribute(out, 3)); return geo;
}
// A tube that tapers along a curve — tails, floppy hats.
function taperTube(pts, r0, r1, ts = 24, rs = 12, pw = 1) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => V(...p))), geo = new THREE.TubeGeometry(curve, ts, 1, rs, false), pos = geo.attributes.position, P = V(), v = V();
  for (let i = 0; i <= ts; i++) {
    const u = i / ts, rad = lerp(r0, r1, Math.pow(u, pw)); curve.getPointAt(u, P);
    for (let j = 0; j <= rs; j++) { const k = i * (rs + 1) + j; v.fromBufferAttribute(pos, k).sub(P).multiplyScalar(rad).add(P); pos.setXYZ(k, v.x, v.y, v.z); }
  }
  geo.computeVertexNormals(); return geo;
}
// Hand-packed snow: a sphere with gentle lumps.
function snowBall(r, seed) {
  const g = sph(r, 36, 26), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / r, y = p.getY(i) / r, z = p.getZ(i) / r;
    const k = 1 + 0.03 * Math.sin(x * 5 + seed) * Math.sin(y * 4 + seed * 2) + 0.022 * Math.sin(z * 7 + x * 3 + seed * 3) + 0.012 * Math.sin(y * 11 + z * 9 + seed);
    p.setXYZ(i, x * r * k, y * r * k, z * r * k);
  }
  return smoothNormals(g);
}
// Knitted wool: two-colour bands with little stitches.
const _knits = {};
function knit(a, b, across, rx = 1, ry = 1) {
  const k = [a, b, across, rx, ry].join('|');
  if (!_knits[k]) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), hex = (h) => '#' + new THREE.Color(h).getHexString();
    x.fillStyle = hex(a); x.fillRect(0, 0, 64, 64); x.fillStyle = hex(b); if (across) x.fillRect(40, 0, 24, 64); else x.fillRect(0, 40, 64, 24);
    x.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      x.strokeStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.moveTo(i * 8, j * 8); x.lineTo(i * 8 + 4, j * 8 + 6); x.lineTo(i * 8 + 8, j * 8); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.14)'; x.beginPath(); x.moveTo(i * 8, j * 8 + 2); x.lineTo(i * 8 + 4, j * 8 + 8); x.lineTo(i * 8 + 8, j * 8 + 2); x.stroke();
    }
    const t = _knits[k] = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  }
  const m = soft(0xffffff, { r: 1, ri: 0.14 }); m.map = _knits[k]; return m;
}
// A fluffy pompom / fur trim: a core with a cloud of little puffs.
function fluff(parent, x, y, z, r, mat, n = 16) {
  const f = grp(parent, x, y, z); mesh(sph(r * 0.78, 14, 10), mat, 0, 0, 0, f);
  for (let i = 0; i < n; i++) { const yy = 1 - (2 * (i + 0.5)) / n, rr = Math.sqrt(1 - yy * yy), a = i * 2.39996; mesh(sph(r * 0.36, 8, 6), mat, Math.cos(a) * rr * r * 0.66, yy * r * 0.66, Math.sin(a) * rr * r * 0.66, f); }
  return f;
}
// A glossy eye with catchlights, looking down local +z. Squash scale.y to blink.
function eye(parent, x, y, z, r, o = {}) {
  const e = grp(parent, x, y, z); e.rotation.y = o.ry ?? 0;
  if (o.white) mesh(sph(r * 1.42, 18, 14), M(0xfffdf8, { r: 0.35 }), 0, 0, -r * 0.6, e).scale.set(1, 1.06, 0.6);
  mesh(sph(r, 18, 14), M(o.color ?? 0x0b0705, { r: 0.06 }), 0, 0, 0, e).scale.z = 0.75;
  mesh(sph(r * 0.28, 10, 8), G(0xffffff, 0.86), r * 0.3, r * 0.36, r * 0.58, e); mesh(sph(r * 0.13, 8, 6), G(0xffffff, 0.8), -r * 0.3, -r * 0.26, r * 0.66, e);
  return e;
}
const blinker = (eyes) => { const seed = rnd(9); return (t) => { const p = (t + seed) % 4.3, k = p < 0.13 ? 0.12 : p > 0.5 && p < 0.6 && seed > 6 ? 0.12 : 1; eyes.forEach((e) => { e.scale.y = k; }); }; };
// Glints that keep their size relative to the character, however it is scaled in a scene.
function sparkles(parent, pts, size = 1, speed = 2.5, steady = 0.05) {
  const p = twinkles(pts, size, speed, steady), base = p.userData.tick, v = V();
  p.userData.tick = (t) => { base(t); p.userData.u.uSize.value = size * p.getWorldScale(v).y; }; parent.add(p); return p;
}
// A soft contact shadow to lay on the snow beneath a character.
export function blobShadow(r = 1, opacity = 0.5) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: glowTex(), color: 0x0a1640, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 1; return m;
}

// ---------- the snowmen ----------
export function snowman(o = {}) {
  const g = new THREE.Group(), col = o.scarf ?? 0xc8102e, S = soft(0xf6f9ff, { r: 0.9, rim: 0xa9c8ff, ri: 0.55 }), C = M(0x131317, { r: 0.35, flat: true }), W = M(0x4a3020, { r: 0.9 });
  const lump = (r, x, y, z, p) => { const m = mesh(new THREE.DodecahedronGeometry(r, 0), C, x, y, z, p); m.rotation.set(rnd(3), rnd(3), rnd(3)); return m; };
  mesh(snowBall(0.62, 1), S, 0, 0.52, 0, g).scale.y = 0.93; mesh(snowBall(0.45, 2.3), S, 0, 1.31, 0, g).scale.y = 0.95;
  const head = grp(g, 0, 1.95, 0); mesh(snowBall(0.33, 3.7), S, 0, 0, 0, head);
  // face: bright coal eyes, rosy cheeks, a crooked carrot and a coal smile
  const eyes = [-1, 1].map((sx) => eye(head, sx * 0.115, 0.075, 0.298, 0.046));
  for (const sx of [-1, 1]) { const c = mesh(sph(0.062, 12, 8), M(0xff8496, { r: 1, o: 0.5 }), sx * 0.2, -0.05, 0.257, head); c.scale.set(1, 0.75, 0.2); c.rotation.y = sx * 0.66; }
  const nose = grp(head, 0, -0.005, 0.3); nose.rotation.set(0.14, 0.1, 0);
  const cg = new THREE.ConeGeometry(0.058, 0.36, 14, 4); cg.rotateX(Math.PI / 2); cg.translate(0, 0, 0.18); mesh(cg, M(0xff7a1a, { r: 0.6 }), 0, 0, 0, nose);
  for (const d of [0.07, 0.15, 0.22]) mesh(tor(0.058 * (1 - d / 0.36) + 0.001, 0.005, 4, 14), M(0xd9590c, { r: 0.7 }), 0, 0, d, nose);
  for (let i = -3; i <= 3; i++) { const x = i * 0.05, y = -0.165 + (i / 3) ** 2 * 0.062; lump(0.024, x, y, Math.sqrt(0.33 * 0.33 - x * x - y * y) + 0.004, head); }
  // hat
  const hat = grp(head, 0, 0.24, 0); hat.rotation.z = -0.15;
  if (o.hat === 'bobble') {
    mesh(new THREE.SphereGeometry(0.34, 28, 14, 0, TAU, 0, Math.PI / 2), knit(col, 0xfff4e0, false, 6, 3), 0, -0.12, 0, hat).scale.y = 1.05;
    const brim = mesh(tor(0.325, 0.07, 10, 32), soft(0xfff6ea, { rim: 0xbfd4ff, ri: 0.3 }), 0, -0.11, 0, hat); brim.rotation.x = Math.PI / 2; brim.scale.z = 0.85;
    fluff(hat, 0, 0.28, 0, 0.115, soft(0xffffff, { rim: 0xbfd4ff, ri: 0.35 }));
  } else {
    const H = soft(0x17171d, { r: 0.6, rim: 0x8090c8, ri: 0.4 });
    mesh(cyl(0.36, 0.36, 0.035, 32), H, 0, 0.03, 0, hat); mesh(cyl(0.24, 0.215, 0.38, 32), H, 0, 0.235, 0, hat);
    mesh(cyl(0.228, 0.225, 0.09, 32), M(col, { r: 0.55 }), 0, 0.1, 0, hat); mesh(sph(0.24, 20, 8), S, 0, 0.425, 0, hat).scale.y = 0.16;
    const sprig = grp(hat, 0.15, 0.13, 0.19); sprig.rotation.y = 0.65;
    for (const s of [-1, 1]) { const l = mesh(sph(0.075, 10, 6), M(0x1f7a3a, { r: 0.45 }), s * 0.06, 0.02, 0, sprig); l.scale.set(1, 0.45, 0.16); l.rotation.z = s * 0.5; }
    for (let i = 0; i < 3; i++) mesh(sph(0.026, 10, 8), M(0xe01428, { r: 0.25, e: 0x70000a }), Math.cos(i * 2.1) * 0.024, -0.005 + Math.sin(i * 2.1) * 0.024, 0.02, sprig);
  }
  // knitted scarf with a knot, two tails and a fringe
  const wrap = mesh(tor(0.3, 0.1, 12, 36), knit(col, 0xfff4e0, true, 9, 1), 0, 1.67, 0, g); wrap.rotation.x = Math.PI / 2; wrap.scale.z = 0.8;
  const kt = knit(col, 0xfff4e0, false, 1, 3); mesh(sph(0.1, 12, 10), kt, 0.19, 1.65, 0.31, g).scale.set(1, 0.9, 0.8);
  [[0.21, 1.42, 0.435, 0.5, 0.16], [0.33, 1.47, 0.38, 0.38, 0.5]].forEach(([x, y, z, len, rz]) => {
    const t = mesh(box(0.17, len, 0.05), kt, x, y, z, g); t.rotation.set(-0.12, 0.25, rz);
    for (let i = -2; i <= 2; i++) mesh(cyl(0.012, 0.012, 0.08, 5), M(0xfff4e0), i * 0.035, -len / 2 - 0.035, 0, t);
  });
  for (let i = 0; i < 3; i++) { const dy = (i - 1) * 0.17; lump(0.052, 0, 1.31 + dy * 0.95, Math.sqrt(0.2025 - dy * dy) + 0.01, g); }
  // twig arms, raised in welcome (the outer group swings; scenes animate its rotation.z about ±2)
  const arms = [-1, 1].map((sx) => {
    const a = grp(g, sx * 0.38, 1.42, 0); a.rotation.z = -sx * 2.0; const t = grp(a); t.rotation.set(0, sx * 0.3, -sx * 2.19);
    mesh(cyl(0.02, 0.034, 0.8, 6), W, 0, -0.4, 0, t);
    const twig = (y, k, len) => { const f = mesh(cyl(0.009, 0.016, len, 5), W, Math.sin(k) * len / 2, y - Math.cos(k) * len / 2, 0, t); f.rotation.z = k; };
    twig(-0.78, -0.55, 0.22); twig(-0.78, 0.05, 0.24); twig(-0.78, 0.6, 0.2); twig(-0.46, sx * 0.9, 0.17);
    mesh(sph(0.04, 8, 6), S, 0, -0.52, 0.012, t).scale.set(1, 1.6, 0.8); return a;
  });
  // frost glints
  const pts = []; for (let i = 0; i < 20; i++) { const [cy, r] = pick([[0.52, 0.6], [0.52, 0.6], [1.31, 0.44], [1.95, 0.33]]), d = V(rnd(-1, 1), rnd(-0.6, 1), rnd(-0.2, 1)).normalize().multiplyScalar(r * 1.02); pts.push([d.x, cy + d.y, d.z, pick([0xffffff, 0xcfe4ff, 0xfff4d0])]); }
  sparkles(g, pts, 1.15, 2.6);
  g.userData = { head, hat, armL: arms[0], armR: arms[1], tick: blinker(eyes) }; return g;
}

// ---------- George ----------
// A cheerful little brown monkey in a floppy Christmas hat and a knitted scarf. Sits, facing +z.
export function monkey() {
  const g = new THREE.Group(), body = grp(g), fur = soft(0x93602f, { rim: 0xffc48a, ri: 0.24 }), furD = soft(0x71441f, { rim: 0xffc48a, ri: 0.2 });
  const skin = soft(0xf2cfa4, { r: 0.75, rim: 0xfff0dc, ri: 0.18 }), dark = M(0x3a1f12, { r: 0.5 }), white = soft(0xffffff, { rim: 0xbfd4ff, ri: 0.32 });
  const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 14);
  // pear-shaped body with a pale tummy
  mesh(sph(0.27, 26, 20), fur, 0, 0.6, 0, body).scale.set(1, 1.2, 0.92); mesh(sph(0.3, 26, 20), fur, 0, 0.45, -0.01, body).scale.set(1.02, 0.85, 0.95);
  mesh(sph(0.19, 22, 16), skin, 0, 0.52, 0.15, body).scale.set(1, 1.2, 0.72);
  // head: heart-shaped face, round muzzle, big ears
  const head = grp(body, 0, 1.06, 0); head.scale.setScalar(1.12); mesh(sph(0.25, 30, 22), fur, 0, 0, 0, head).scale.set(1.06, 1, 0.98);
  for (const sx of [-1, 1]) mesh(sph(0.135, 20, 16), skin, sx * 0.075, 0.035, 0.14, head).scale.set(1, 1.05, 0.8);
  mesh(sph(0.14, 22, 16), skin, 0, -0.095, 0.16, head).scale.set(1.3, 0.85, 0.85);
  const eyes = [-1, 1].map((sx) => eye(head, sx * 0.082, 0.05, 0.252, 0.037, { white: true, color: 0x1c0d06 }));
  for (const sx of [-1, 1]) {
    const b = mesh(sph(0.03, 10, 8), furD, sx * 0.088, 0.14, 0.222, head); b.scale.set(1.7, 0.4, 0.6); b.rotation.z = -sx * 0.25;
    mesh(sph(0.013, 8, 6), dark, sx * 0.022, -0.045, 0.27, head).scale.set(1, 0.7, 0.6);
    const c = mesh(sph(0.04, 10, 8), M(0xff8a8a, { r: 1, o: 0.42 }), sx * 0.135, -0.075, 0.236, head); c.scale.set(1, 0.7, 0.25); c.rotation.y = sx * 0.65;
    mesh(sph(0.105, 18, 14), fur, sx * 0.265, 0.03, -0.01, head).scale.z = 0.45; mesh(sph(0.075, 16, 12), skin, sx * 0.275, 0.03, 0.025, head).scale.z = 0.4;
    tuft(head, fur, sx * 0.2, -0.07, 0.05, sx, -0.5, 0.2, 0.1, 0.055); tuft(head, fur, sx * 0.18, -0.13, 0.04, sx * 0.7, -1, 0.15, 0.085, 0.05);
  }
  const smile = mesh(tor(0.08, 0.011, 6, 18, Math.PI), dark, 0, -0.085, 0.268, head); smile.rotation.set(0.13, 0, Math.PI);
  // floppy Santa hat with a fluffy trim and pompom
  const hat = grp(head, 0, 0.17, 0); hat.rotation.z = 0.3;
  mesh(taperTube([[0, -0.02, 0], [0, 0.18, 0], [-0.07, 0.36, 0], [-0.22, 0.43, 0], [-0.34, 0.34, 0]], 0.2, 0.04, 24, 16, 0.85), soft(0xc4131f, { r: 0.8, rim: 0xff9a8a, ri: 0.32 }), 0, 0, 0, hat);
  mesh(tor(0.2, 0.058, 10, 28), white, 0, 0.01, 0, hat).rotation.x = Math.PI / 2;
  for (let i = 0; i < 16; i++) { const a = i * TAU / 16; mesh(sph(0.046, 8, 6), white, Math.cos(a) * 0.218, 0.012 + (i % 2) * 0.022, Math.sin(a) * 0.218, hat); }
  fluff(hat, -0.36, 0.31, 0, 0.08, white);
  // scarf
  const wrap = mesh(tor(0.185, 0.062, 10, 28), knit(0x1f7a4a, 0xfff4e0, true, 8, 1), 0, 0.86, 0, body); wrap.rotation.x = Math.PI / 2; wrap.scale.z = 0.85;
  const kt = knit(0x1f7a4a, 0xfff4e0, false, 1, 2); mesh(sph(0.062, 10, 8), kt, 0.09, 0.85, 0.17, body);
  const st = mesh(box(0.105, 0.26, 0.04), kt, 0.1, 0.7, 0.245, body); st.rotation.z = 0.12; for (let i = -1; i <= 1; i++) mesh(cyl(0.009, 0.009, 0.05, 5), M(0xfff4e0), i * 0.032, -0.15, 0, st);
  // arms with proper little hands
  const arms = [-1, 1].map((sx) => {
    const a = grp(body, sx * 0.27, 0.8, 0); a.rotation.set(sx < 0 ? -0.55 : 0, 0, sx * 0.3); mesh(cap(0.06, 0.3), fur, 0, -0.19, 0, a);
    const h = grp(a, 0, -0.43, 0); mesh(sph(0.075, 16, 12), skin, 0, 0, 0, h).scale.set(1, 1.1, 0.7);
    for (let i = 0; i < 4; i++) mesh(cap(0.02, 0.05), skin, (i - 1.5) * 0.036, -0.085 + Math.abs(i - 1.5) * 0.01, 0, h);
    mesh(cap(0.021, 0.04), skin, -sx * 0.075, -0.02, 0.01, h).rotation.z = -sx * 0.9; return a;
  });
  // legs stuck out in front, soles to the world
  for (const sx of [-1, 1]) {
    const l = grp(body, sx * 0.15, 0.33, 0.08); l.rotation.set(-1.25, 0, sx * 0.35); mesh(cap(0.068, 0.24), fur, 0, -0.17, 0, l);
    const f = grp(l, 0, -0.38, 0.035); mesh(sph(0.085, 16, 12), skin, 0, 0, 0, f).scale.set(1, 0.7, 1.55);
    for (let i = 0; i < 4; i++) mesh(sph(0.028, 8, 6), skin, (i - 1.5) * 0.042, 0, 0.125 - Math.abs(i - 1.5) * 0.014, f);
  }
  // a long tail with a curl in it
  const tail = grp(body, 0, 0.34, -0.22);
  mesh(taperTube([[0, 0, 0], [0, -0.06, -0.16], [0, 0.02, -0.34], [0, 0.24, -0.42], [0, 0.44, -0.33], [0, 0.47, -0.15], [0, 0.36, -0.08], [0, 0.3, -0.17]], 0.044, 0.027, 40, 10), fur, 0, 0, 0, tail);
  mesh(sph(0.027, 8, 6), fur, 0, 0.3, -0.17, tail);
  const blink = blinker(eyes);
  g.userData = { head, armL: arms[0], armR: arms[1], body, tail, hat, tick: blink };
  g.userData.wave = (t) => { arms[1].rotation.z = 2.5 + Math.sin(t * 7) * 0.4; head.rotation.z = Math.sin(t * 2) * 0.15; tail.rotation.x = Math.sin(t * 3) * 0.16; hat.rotation.z = 0.3 + Math.sin(t * 2 + 1) * 0.07; };
  return g;
}

// ---------- Monty ----------
// Monty the moose: long pale-stockinged legs, a shoulder hump, a great soft nose,
// broad palmate antlers strung with fairy lights, and a bell at his throat. Faces +x.
const cup = (x, y) => 0.075 * x * x + 0.06 * y * Math.abs(y);
const TINES = [[3.3, -0.15], [3.45, 0.75], [3.0, 1.5], [2.2, 1.85], [1.4, 1.6], [0.75, 1.05]];
function antlerGeo(sz) {
  const s = new THREE.Shape(); s.moveTo(0, -0.17); s.quadraticCurveTo(0.9, -0.13, 1.5, -0.48); s.quadraticCurveTo(2.5, -0.8, 3.3, -0.15);
  [[2.35, 0.2], [2.25, 0.72], [2.05, 0.78], [1.65, 0.62], [1.1, 0.52]].forEach(([cx, cy], i) => s.quadraticCurveTo(cx, cy, TINES[i + 1][0], TINES[i + 1][1]));
  s.quadraticCurveTo(0.7, 0.22, 0, 0.17); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 3, curveSegments: 12 }), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) - 0.05 - sz * cup(p.getX(i), p.getY(i)));
  return smoothNormals(geo);
}
export function moose() {
  const g = new THREE.Group(), L = 1.12, r = 0.45, ht = 1.15, hs = 0.3, nl = 0.6, nk = 0.85, lw = 0.07, cy = ht + r;
  const fur = soft(0x8a5c3c, { rim: 0xe6b98c, ri: 0.22 }), furD = soft(0x6c452b, { rim: 0xe6b98c, ri: 0.18 }), pale = soft(0xdcc9a6, { rim: 0xfff0d8, ri: 0.2 });
  const muz = soft(0xb08a6c, { r: 0.8, rim: 0xffdcc0, ri: 0.2 }), dark = M(0x1c1410, { r: 0.5 }), bone = soft(0xf2deb0, { r: 0.6, rim: 0xfff4d0, ri: 0.26, e: 0x4a3818 });
  const gold = M(0xffd34d, { m: 0.85, r: 0.25, e: 0x6a4800 });
  // barrel body, high withers, rounded rump and deep chest
  const body = mesh(new THREE.CapsuleGeometry(r, L, 10, 22), fur, 0, cy, 0, g); body.rotation.z = Math.PI / 2;
  mesh(sph(r * 1.08, 24, 18), fur, L * 0.3, cy + r * 0.2, 0, g).scale.set(1.2, 1, 0.97);
  mesh(sph(r * 0.99, 20, 14), fur, -L * 0.42, cy - 0.01, 0, g); mesh(sph(r * 0.86, 20, 14), fur, L * 0.5, cy - r * 0.12, 0, g);
  for (let i = 0; i < 7; i++) { const a = -0.7 + i * 0.2; tuft(g, fur, L * 0.3 + Math.sin(a) * r * 1.2, cy + r * 0.2 + Math.cos(a) * r * 1.0, (i % 2 - 0.5) * 0.08, -1, 0.22, rnd(-0.15, 0.15), 0.2, 0.11); }
  for (let i = -1; i <= 1; i++) tuft(g, fur, L / 2 + r * 0.55, cy - r * 0.6, i * 0.1, 0.2, -1, i * 0.12, 0.13, 0.13);
  // long legs: dark thigh, knobbly knee, pale stocking, neat hoof
  const legs = [], ll = ht + r * 0.6;
  for (const sx of [1, -1]) for (const sz of [1, -1]) {
    const p = grp(g, sx * (L * 0.45 + r * 0.2), ll, sz * r * 0.52);
    mesh(sph(lw * 2.5, 14, 10), fur, 0, -0.04, 0, p).scale.set(1, 1.5, 0.9); mesh(cyl(lw * 2.0, lw * 1.15, ll * 0.5, 14), fur, 0, -ll * 0.25, 0, p);
    mesh(sph(lw * 1.3, 12, 10), fur, 0, -ll * 0.5, 0, p); mesh(cyl(lw * 1.1, lw * 0.85, ll * 0.44, 12), pale, 0, -ll * 0.72, 0, p);
    mesh(cyl(lw * 0.95, lw * 1.3, 0.11, 12), dark, 0, -ll + 0.055, 0, p); legs.push(p);
  }
  mesh(sph(0.09, 10, 8), furD, -L / 2 - r * 0.95, cy + r * 0.25, 0, g).scale.set(0.8, 1.4, 0.8);
  // strong neck with a mane, a red collar and a golden bell
  const neck = grp(g, L / 2 + r * 0.35, ht + r * 1.4, 0); neck.rotation.z = -nk; mesh(cyl(r * 0.5, r * 0.8, nl + r * 0.6, 16), fur, 0, nl / 2 - r * 0.3, 0, neck);
  for (let i = 0; i < 5; i++) tuft(neck, fur, -r * 0.48, -0.05 + i * 0.13, (i % 2 - 0.5) * 0.07, -0.8, -0.7, rnd(-0.15, 0.15), 0.17, 0.1);
  const collar = mesh(tor(r * 0.61, 0.036, 8, 28), M(0xc8102e, { r: 0.55 }), 0, nl * 0.4, 0, neck); collar.rotation.x = Math.PI / 2;
  const bell = grp(neck, r * 0.62, nl * 0.4 - 0.06, 0); mesh(sph(0.075, 16, 12), gold, 0, 0, 0, bell); mesh(box(0.012, 0.05, 0.13), dark, 0.07, -0.01, 0, bell); halo(0xffd070, 0.55, 0, 0, 0, bell, 0.35);
  // head: long face, great soft muzzle, kind half-lidded eyes
  const head = grp(neck, 0, nl, 0); head.rotation.z = nk - 0.2;
  mesh(sph(hs, 24, 18), fur, hs * 0.3, 0, 0, head).scale.set(1.35, 1.02, 0.95);
  const bridge = mesh(cyl(hs * 0.6, hs * 0.66, hs * 1.5, 18), fur, hs * 1.4, -hs * 0.16, 0, head); bridge.rotation.z = Math.PI / 2 - 0.15; bridge.scale.z = 0.9;
  const nose = mesh(sph(hs * 0.7, 22, 16), muz, hs * 2.2, -hs * 0.36, 0, head); nose.scale.set(1.05, 0.92, 0.98);
  mesh(sph(hs * 0.42, 14, 10), muz, hs * 1.95, -hs * 0.84, 0, head).scale.set(1.35, 0.55, 0.85);
  const dl = mesh(sph(hs * 0.36, 14, 10), furD, hs * 0.75, -hs * 1.1, 0, head); dl.scale.set(0.7, 1.7, 0.6); tuft(head, furD, hs * 0.75, -hs * 1.5, 0, 0.1, -1, 0, hs * 0.7, hs * 0.2);
  const eyes = [];
  for (const sz of [-1, 1]) {
    mesh(sph(hs * 0.1, 10, 8), dark, hs * 2.83, -hs * 0.2, sz * hs * 0.27, head).scale.set(0.6, 0.8, 1);
    mesh(sph(hs * 0.3, 14, 10), muz, hs * 0.97, hs * 0.3, sz * hs * 0.66, head).scale.set(1, 1, 0.6); // pale eye patch
    eyes.push(eye(head, hs * 1.0, hs * 0.31, sz * hs * 0.82, hs * 0.2, { ry: sz > 0 ? 0.5 : Math.PI - 0.5, color: 0x1c0e06 }));
    const lid = mesh(sph(hs * 0.2, 12, 10), fur, hs * 0.93, hs * 0.56, sz * hs * 0.76, head); lid.scale.set(1.3, 0.4, 0.8); lid.rotation.z = 0.25; // gentle brow
    const sm = mesh(tor(hs * 0.6, hs * 0.035, 6, 16, 1.4), dark, hs * 1.95, -hs * 0.2, sz * hs * 0.5, head); sm.rotation.z = -2.09; // smile
    const e = grp(head, -hs * 0.15, hs * 0.6, sz * hs * 0.8); e.rotation.x = sz * 1.0;
    mesh(sph(hs * 0.44, 14, 10), fur, 0, hs * 0.2, 0, e).scale.set(0.42, 1, 0.55); mesh(sph(hs * 0.32, 12, 10), muz, hs * 0.08, hs * 0.2, 0, e).scale.set(0.3, 0.95, 0.5);
    // antler: a broad cupped palm with six tines, set on a basis that sweeps out, up and a little back
    const a = grp(head, -hs * 0.02, hs * 0.72, sz * hs * 0.42), X = V(-0.12, 0.26, sz * 0.95).normalize(), Z = V().crossVectors(X, V(-0.3, 0.9, -sz * 0.35)).normalize(), Y = V().crossVectors(Z, X);
    a.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)); a.scale.setScalar(hs);
    mesh(antlerGeo(sz), bone, 0, 0, 0, a); mesh(sph(0.26, 12, 10), bone, 0.05, 0, 0, a).scale.set(1, 1, 0.8);
    // fairy lights looped from tine to tine
    const at = (x, y, lift = 0) => V(x, y, -sz * (cup(x, y) + 0.14 + lift)), tips = TINES.map(([x, y]) => at(x * 0.95, y * 0.95)), wire = [], lp = [];
    tips.forEach((p, i) => { if (i) { const q = tips[i - 1], m = at(lerp((p.x + q.x) / 2, 1.9, 0.3), lerp((p.y + q.y) / 2, 0.5, 0.3), 0.05); wire.push(m); } wire.push(p); });
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wire), 48, 0.022, 5), M(0x0f3a22, { r: 0.6 }), 0, 0, 0, a);
    tips.forEach((p, i) => { const c = LIGHTS[(i + (sz > 0 ? 0 : 2)) % 5]; mesh(sph(0.1, 10, 8), G(c, 2.2), p.x, p.y, p.z, a); lp.push([p.x, p.y, p.z, c]); });
    sparkles(a, lp, 1.9, 1.6, 0.55);
  }
  g.userData = { legs, neck, head, nose, body, nk, tick: blinker(eyes) }; return g;
}
