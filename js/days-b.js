// Doors 13–24.
import {
  THREE, LK, TAU, rnd, pick, clamp, lerp, smooth, easeOut, easeBack, M, G, sph, box, cyl, cone, tor, mesh, grp, put, light, prism,
  sprite, halo, twinkles, Particles, aurora, moon, bethStar, beam, snowGround, groundY, pine, forest, cloud, win, house, gift,
  lampPost, fire, candle, figure, walk, angel, gallop, nod, donkey, camel, sheep, polarBear, highlandCow, bird,
  sleighTeam, stable, manger, mary, joseph, shepherd, king, palm, glowTex,
} from './kit.js';
import { snowman, moose, monkey } from './friends.js';
import { face, faceB, smoke, treeLights, topStar, iceMirror } from './days-a.js';
import { withRim } from './kit.js';
import { Q } from './look.js';

const scroller = (items, span = 46, speed = 1.2) => (t) => items.forEach((o) => { o.position.x = (((o.userData.x0 - t * speed) % span) + span * 1.5) % span - span / 2; });
function rock(s = 1, c = 0x8a7a6a) { const m = mesh(sph(0.5 * s, 6, 5), M(c, { flat: true })); m.scale.y = 0.6; return m; }
function bethlehem(g, x, y, z, n = 26) {
  const t = grp(g, x, y, z), pts = [];
  for (let i = 0; i < n; i++) { const w = rnd(1.2, 2.6), h = rnd(1.2, 3.2), px = rnd(-9, 9), pz = rnd(-3, 3); mesh(box(w, h, w), M(pick([0xb89a78, 0xa88a68, 0xc8aa88])), px, h / 2, pz, t); if (i % 4 === 0) mesh(sph(w * 0.4, 10, 8), M(0xc8aa88), px, h, pz, t); pts.push([x + px + rnd(-0.4, 0.4), y + h * rnd(0.3, 0.8), z + pz + w / 2 + 0.1, 0xffc866]); }
  g.add(twinkles(pts, 1.1, 1, 0.8)); return t;
}
let _sg;
function stainedTex() {
  if (_sg) return _sg; const c = document.createElement('canvas'); c.width = 128; c.height = 192; const x = c.getContext('2d');
  x.fillStyle = '#0a0a12'; x.fillRect(0, 0, 128, 192);
  x.save(); x.beginPath(); x.moveTo(8, 192); x.lineTo(8, 70); x.quadraticCurveTo(8, 8, 64, 6); x.quadraticCurveTo(120, 8, 120, 70); x.lineTo(120, 192); x.clip();
  for (let j = 0; j < 14; j++) for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(${pick([0, 45, 210, 280, 130, 30])},85%,${rnd(40, 62)}%)`; x.beginPath(); const cx = i * 18 + (j % 2) * 9, cy = j * 15; x.moveTo(cx, cy - 9); x.lineTo(cx + 10, cy); x.lineTo(cx, cy + 9); x.lineTo(cx - 10, cy); x.fill(); x.strokeStyle = '#0a0a12'; x.lineWidth = 2; x.stroke(); }
  x.fillStyle = 'rgba(255,230,150,.9)'; x.beginPath(); x.arc(64, 60, 20, 0, TAU); x.fill(); x.restore();
  _sg = new THREE.CanvasTexture(c); _sg.colorSpace = THREE.SRGBColorSpace; return _sg;
}

export const DAYS_B = [
  { // 13
    t: 'Saint Lucy’s Lanterns', s: 'On the darkest of mornings, light is carried out across the ice — and let go, one small flame at a time.',
    col: [0xffa040, 0xffe0a0], sky: [0x050a24, 0x1a2a5a], cam: [0, 2.2, 8], look: [0, 6, -12], fov: 58, snow: 500, orbit: 0.08, grade: { tilt: 0.6 },
    build(g, ctx) {
      g.add(snowGround()); const lake = grp(g, 0, 0, -49);
      if (!iceMirror(lake, new THREE.CircleGeometry(46, 72), 0.058, 0x3a4a70, 0x0c1838, 0.45)) mesh(cyl(46, 46, 0.05, 64), M(0x0c1838, { r: 0.12, m: 0.6 }), 0, 0.03, 0, lake); // every lantern twice: once in the sky, once in the ice
      ctx.star(g, 0.9, 3.2, -2.5, { t: 5 }); // the one lantern that rises golden
      const lucia = put(figure({ robe: 0xffffff, head: 'hair', hat: 0xe8c060, sash: 0xc8102e }), g, 0, 0, 1.2, 1, Math.PI);
      for (let i = 0; i < 6; i++) { const c = put(candle(0.14), lucia.userData.head, Math.cos(i * TAU / 6) * 0.12, 0.13, Math.sin(i * TAU / 6) * 0.12, 0.8); } light(0xffc070, 8, 7, 0, 2.2, 1.2, g);
      const folk = [[-2.6, 0x7a1f2b, 'bobble'], [-1.4, 0x2a5db0, 'bonnet'], [1.3, 0x1f7a4a, 'bobble'], [2.5, 0x6a3a8a, 'tophat'], [3.6, 0x8a5a2a, 'bobble']].map(([x, c, h], i) => { const f = put(figure({ robe: c, head: h, hat: pick([0xc8102e, 0x15151a, 0xffd34d]), h: i === 2 ? 0.65 : 1 }), g, x, 0, 0.6 + rnd(1), 1, Math.PI + rnd(-0.3, 0.3)); f.userData.armR.rotation.x = -1.4; return f; });
      const lm = G(0xffa040, 1.7, { side: THREE.DoubleSide }), lans = [];
      for (let i = 0; i < 80; i++) { const l = grp(g); mesh(cyl(0.2, 0.14, 0.36, 8, true), lm, 0, 0, 0, l); mesh(cyl(0.2, 0.2, 0.02, 8), G(0xffd080, 1.4), 0, 0.18, 0, l); halo(0xff9030, 1.6, 0, 0, 0, l, 0.7); lans.push({ l, x: rnd(-16, 16), z: rnd(-34, -3), d: i < 6 ? i * 0.5 : rnd(2, 22), sp: rnd(0.5, 1.0), ph: rnd(TAU), r: halo(0xff9030, 1.5, 0, 0, 0, g, 0.0) }); }
      return (t) => {
        lans.forEach((n) => { const up = Math.max(0, t - n.d) * n.sp, y = 0.35 + (up % 26); n.l.position.set(n.x + Math.sin(t * 0.4 + n.ph) * 0.8 * Math.min(1, up), y, n.z); n.l.rotation.z = Math.sin(t * 0.8 + n.ph) * 0.1; const f = smooth(26, 22, y); n.l.scale.setScalar(f + 0.001); n.r.position.set(n.l.position.x, 0.1, n.z); n.r.material.opacity = 0.35 * f / (1 + y * 0.35); });
        folk.forEach((f, i) => { f.userData.head.rotation.x = -0.3 - smooth(2, 8, t) * 0.25; f.userData.body.rotation.z = Math.sin(t + i) * 0.03; });
      };
    },
  },
  { // 14
    t: 'The First Nowell', s: 'Certain poor shepherds in fields as they lay — when all at once the dark was full of light, and a voice said: fear not.',
    col: [0xfff0c0, 0x9fd4ff], cam: [0, 2.3, 10], look: [0.6, 2.6, 0], snow: 0,
    build(g, ctx) {
      g.add(snowGround(110, 0.9, 0x6a7a5a)); for (let i = 0; i < 8; i++) put(rock(rnd(0.6, 1.6), 0x6a6a62), g, rnd(-12, 12), 0, rnd(-12, 2));
      put(fire(0.8), g, 0, 0, 0.4); bethlehem(g, -16, groundY(-16, -40, 0.9), -40, 18); bethStar(1.6, g, -16, 14, -44);
      const sh = [[-1.5, 0.9, 0x8a7a5a], [1.4, 1.0, 0x6a5a7a], [0.2, -1.2, 0x7a5a3a]].map(([x, z, c]) => { const s = put(shepherd(c), g, x, 0, z); face(s, 0, 0.4); s.userData.r0 = s.rotation.y; return s; });
      sh[1].scale.y = 0.72; const flock = []; for (let i = 0; i < 9; i++) { const s = put(sheep(), g, rnd(-6, 6), 0, rnd(-4, 3), rnd(0.85, 1.1), rnd(TAU)); if (Math.hypot(s.position.x, s.position.z - 0.4) < 2) s.position.x += 4; flock.push(s); }
      const A = [2.6, 4.4, -3.2], an = put(angel(), g, A[0], 20, A[2], 1.5), bm = put(beam(9, 0.3, 4.5, 0xfff0c0, 0.1), g, A[0], 20, A[2]), big = halo(0xfff0c0, 9, A[0], 20, A[2], g, 0), al = light(0xfff0d0, 0, 26, A[0], 5, A[2] + 1, g);
      const motes = []; for (let i = 0; i < 120; i++) motes.push([A[0] + rnd(-5, 5), rnd(0.5, 9), A[2] + rnd(-4, 4), 0xffe9b0, rnd()]); const mt = twinkles(motes, 0.9, 3, 0.2); g.add(mt);
      ctx.rays(an, 1.1); ctx.star(an, 0.5, 0.95, 0.4, { t: 7.5 }); // held out in the angel's hand
      return (t) => {
        const k = easeOut(clamp((t - 3) / 4)), y = lerp(20, A[1], k) + Math.sin(t * 1.2) * 0.2; an.position.y = y; an.userData.flap(t, 2.5); face(an, 0, 6); bm.position.y = y + 0.5; big.position.y = y + 1.2; big.material.opacity = k * 0.55; bm.material.opacity = 0.11 * k; al.intensity = 55 * k * LK; mt.userData.u.uReveal.value = k;
        sh.forEach((s, i) => { const want = Math.atan2(A[0] - s.position.x, A[2] - s.position.z), q = smooth(4 + i * 0.5, 6 + i * 0.5, t); s.rotation.y = lerp(s.userData.r0, want, q); s.userData.head.rotation.x = -0.5 * q; if (i === 0) s.userData.armL.rotation.set(-2.2 * q, 0, 0.6 * q); });
        flock.forEach((s, i) => nod(s, t + i * 1.7, 0.25, 0.9));
      };
    },
  },
  { // 15
    t: 'God Rest Ye Merry', s: 'Lamps are lit along the lane, chimneys puff, and every window in the village glows with tidings of comfort and joy.',
    col: [0xffc866, 0xff3b30], cam: [0, 2.6, 12], look: [0, 3, -8], snow: 2000, fogD: 0.014, grade: { tilt: 0.7 },
    build(g, ctx) {
      g.add(snowGround(110, 0.6, 0xc2d0ee, 34)); const glass = [], smokes = [], cols = [0xa86b4a, 0x8a5a6a, 0xb08a5a, 0x6a7a8a, 0x9a4a3a, 0x7a8a6a];
      for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) {
        const h = put(house({ color: cols[(i + (sx > 0 ? 3 : 0)) % 6], w: 3.6, d: 4.2, h: rnd(2.5, 3.8), rh: rnd(1.5, 2.2) }), g, sx * 6, 0, 5 - i * 5.2, 1, -sx * Math.PI / 2);
        h.userData.glass.forEach((m) => { m.userData.c = m.material.color.clone(); m.userData.d = rnd(0.5, 6); glass.push(m); });
        h.updateMatrixWorld(); const c = h.userData.chimney.clone().applyMatrix4(h.matrixWorld); if ((i + (sx > 0)) % 2) smokes.push(smoke(g, c.x, c.y, c.z, 5));
      }
      const lps = [[-3.4, 3], [3.4, -3.5], [-3.4, -10], [3.4, -16.5]].map(([x, z]) => put(lampPost(3), g, x, 0, z));
      ctx.star(g, -3.4, 4.05, 3, { t: 6 }); // perched on the first lamp, once the whole lane is lit
      const tree = put(pine(7), g, 0, 0, -25), tl = treeLights(tree, 7, 180, 10); topStar(tree, 7.5, 0.5); forest(g, 20, 30, 50, 0.6, (x, z) => z < -28);
      const a = put(figure({ robe: 0x7a1f2b, head: 'bonnet', hat: 0x2a5db0, scarf: 0xffffff }), g, -0.4, 0, 0), b = put(figure({ robe: 0x2f3a5a, head: 'tophat', hat: 0x15151a, scarf: 0xc8102e }), g, 0.4, 0, 0);
      const cow = put(highlandCow(), g, 2.3, 0, 1.5, 0.9, 2.2); mesh(tor(0.2, 0.05, 6, 14), M(0xc8102e), 0, -0.1, 0, cow.userData.neck).rotation.x = Math.PI / 2; put(snowman({ scarf: 0x39d353 }), g, -2.6, 0, -1.2, 0.8, 0.5);
      return (t) => {
        glass.forEach((m) => m.material.color.copy(m.userData.c).multiplyScalar(0.06 + 0.94 * smooth(m.userData.d, m.userData.d + 0.4, t)));
        lps.forEach((l, i) => { const k = smooth(i * 0.6, i * 0.6 + 0.5, t); l.userData.l.intensity = 14 * k * LK; l.userData.hl.material.opacity = 0.6 * k; });
        tl.userData.u.uReveal.value = clamp((t - 4) / 3); smokes.forEach((s) => s(t));
        const z = -8 + Math.sin(t * 0.12) * 9, dir = Math.cos(t * 0.12) > 0 ? 0 : Math.PI;[a, b].forEach((f, i) => { f.position.z = z; f.rotation.y = dir; walk(f, t + i, 4, 0.35); }); nod(cow, t, 0.1, 0.9);
      };
    },
  },
  { // 16
    t: 'Joy to the World', s: 'A whole world in a glass: one small village where it is always snowing, and always nearly Christmas. Give it a shake.',
    col: [0x9fd4ff, 0xffd34d], sky: [0x06040f, 0x1c1030], snow: 0, stars: false, fogD: 0, cam: [0, 3.2, 9.5], look: [0, 2.5, 0], light: 0.8, orbit: 0.3, grade: { tilt: 1.3 },
    build(g, ctx) {
      mesh(cyl(9, 9, 0.3, 48), M(0x4a2c18, { r: 0.5 }), 0, -0.15, 0, g); mesh(cyl(2.0, 2.35, 0.9, 32), M(0x5a2f1a, { r: 0.4 }), 0, 0.45, 0, g); mesh(tor(2.05, 0.09, 8, 40), M(0xffd34d, { m: 0.9, r: 0.2 }), 0, 0.9, 0, g).rotation.x = Math.PI / 2; mesh(tor(2.33, 0.07, 8, 40), M(0xffd34d, { m: 0.9, r: 0.2 }), 0, 0.08, 0, g).rotation.x = Math.PI / 2;
      for (let i = 0; i < 46; i++) { const a = rnd(TAU), r = rnd(22, 40); halo(pick([0xffc060, 0xff6050, 0x60c0ff, 0x70ff90, 0xffe0a0]), rnd(3, 8), Math.cos(a) * r, rnd(-2, 16), -Math.abs(Math.sin(a) * r) - 6, g, rnd(0.12, 0.32)); }
      const C = 2.9, R = 2.25, w = grp(g, 0, C, 0); mesh(cyl(1.82, 1.82, 0.12, 32), M(0xf4f8ff), 0, -1.32, 0, w); const md = mesh(sph(1.6, 20, 10), M(0xf4f8ff), 0, -1.5, 0, w); md.scale.y = 0.3;
      put(house({ color: 0xa0352a }), w, -0.6, -1.15, -0.2, 0.3, 0.4); put(house({ color: 0x3a6a9a, h: 2.8 }), w, 0.65, -1.2, -0.45, 0.26, -0.5); put(house({ color: 0xb08a5a }), w, 0.1, -1.2, -1.0, 0.22, 0.1);
      const tr = put(pine(3), w, 0.15, -1.15, 0.5, 0.3), tl = treeLights(tr, 3, 50, 5); tl.userData.u.uSize.value = 0.5; put(snowman({ scarf: 0x39d353 }), w, -0.75, -1.1, 0.75, 0.2, 0.5); for (let i = 0; i < 5; i++) put(pine(rnd(1.5, 2.6)), w, Math.cos(i * 1.4 + 2) * 1.3, -1.22, Math.sin(i * 1.4 + 2) * 1.2, 0.26);
      light(0xffe0b0, 12, 6, 0, C - 0.3, 0.8, g);
      const sw = [0, 1].map((k) => { const pts = []; for (let i = 0; i < 260; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(R * 0.93 * Math.cbrt(Math.random())); if (v.y < -1.2) v.y = -v.y; pts.push([v.x, v.y, v.z, 0xffffff]); } const p = twinkles(pts, 0.42, 2, 0.75); w.add(p); return p; });
      // real glass where the device can afford it: the village bends and swims as the globe turns
      const glass = mesh(sph(R, 48, 32), Q.tier === 2 ? withRim(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, roughness: 0.03, thickness: 0.6, ior: 1.28, envMapIntensity: 1.2, specularIntensity: 1 })) : M(0xffffff, { o: 0.08, r: 0.02 }), 0, C, 0, g); glass.material.depthWrite = false;
      ctx.star(w, 0.25, -0.7, 0.45, { t: 4.2 }); // stirred up by the first shake
      const rim = mesh(sph(R * 1.002, 48, 32), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `varying vec3 vN,vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `varying vec3 vN,vV; void main(){ float f=pow(clamp(1.-dot(vN,vV),0.,1.),2.6); float h=pow(max(dot(vN,normalize(vec3(-.5,.6,.6))),0.),60.); gl_FragColor=vec4(vec3(.65,.8,1.)*f*.9+vec3(1.)*h*1.5,1.); }` }), 0, C, 0, g);
      for (const x of [-4.6, 4.8]) { put(candle(0.9, 0xc8102e), g, x, 0, 0.8, 2); light(0xffb050, 12, 10, x, 2.2, 1, g); }
      const george = face(put(monkey(), g, 3.4, 0, 1.6, 1.15), 0, 0);
      return (t) => {
        const c = (t + 9) % 13, sh = c < 1.2 ? Math.sin(c * 26) * (1.2 - c) : 0, e = 1 + 7 * Math.exp(-Math.max(0, c - 0.2) * 0.5) * (c < 12 ? 1 : 0);
        w.rotation.z = glass.rotation.z = sh * 0.07; w.position.x = sh * 0.12; sw[0].rotation.y += 0.004 * e; sw[1].rotation.y -= 0.0027 * e; sw[0].rotation.x = Math.sin(t * 0.3) * 0.3 + sh; sw[1].rotation.z = Math.cos(t * 0.23) * 0.4;
        george.userData.head.rotation.z = Math.sin(t * 0.8) * 0.25; george.userData.armR.rotation.z = c < 1.4 ? 2.2 : 0.3; george.userData.armL.rotation.z = c < 1.4 ? -2.2 : -0.3; george.position.y = c < 1.2 ? Math.abs(Math.sin(c * 9)) * 0.2 : 0;
      };
    },
  },
  { // 17
    t: 'We Three Kings', s: 'Field and fountain, moor and mountain — three travellers and three patient camels, following yonder star.',
    col: [0xffd34d, 0x7a1f8a], sky: [0x070a2a, 0x4a3a7a], snow: 0, cam: [0, 2.4, 10.5], look: [0.5, 2.6, 0], fogD: 0.01,
    build(g, ctx) {
      g.add(snowGround(110, 1.1, 0xc9a56a, 7)); const st = bethStar(3.2, g, 10, 10.5, -14); const tail = sprite(glowTex(), 0xfff0c0, 1, 8.2, 11.3, -14.1, g, 0.35); tail.scale.set(9, 1.3, 1); tail.material.rotation = -0.42;
      const cams = [0, 1, 2].map((i) => { const c = put(camel(), g, -3.4 + i * 3.4, 0, i * 0.25); const k = put(king(i), c, -0.05, 1.72, 0, 0.82, Math.PI / 2); mesh(box(0.9, 0.5, 0.82), M(k.children[0].children[0].material.color.getHex()), 0, 1.72, 0, c); c.userData.k = k; return c; });
      const items = []; for (let i = 0; i < 16; i++) { const o = i % 3 === 0 ? palm(rnd(3.5, 5)) : i % 3 === 1 ? rock(rnd(0.8, 2), 0xa88a5a) : rock(rnd(3, 6), 0xb89a62); o.userData.x0 = rnd(-23, 23); put(o, g, 0, i % 3 === 2 ? -0.5 : 0, i % 3 === 2 ? rnd(-22, -9) : pick([rnd(-8, -2.5), rnd(2.5, 4)])); items.push(o); }
      const sc = scroller(items, 46, 1.0), far = scroller(items.filter((o, i) => i % 3 === 2), 46, 0.5); light(0xffe0a0, 16, 20, 4, 4, 4, g);
      ctx.rays(st, 0.7); ctx.star(cams[0].userData.k, 0, 1.95, 0.15, { t: 3 }); // above the eldest king's casket
      return (t) => { sc(t); far(t); cams.forEach((c, i) => { gallop(c, t * 0.33 + i, 0.32, 8); c.position.y = Math.abs(Math.sin(t * 2.64 + i * 8)) * 0.07; c.rotation.z = Math.sin(t * 2.64 + i * 8) * 0.02; nod(c, t * 2.64 + i, 0.07, 1); c.userData.k.userData.body.rotation.x = Math.sin(t * 2.64 + i * 8) * 0.05; }); };
    },
  },
  { // 18
    t: 'Angels We Have Heard on High', s: 'Above the clouds the whole sky is singing. Gloria — and the mountains echo it back.',
    col: [0xfff0c0, 0xffa0d0], sky: [0x0a1040, 0x7a52a8], snow: 0, cam: [0, 3.2, 12.5], look: [0, 3.9, 0], fogD: 0.004, light: 0.85, hemi: [0xffe6c0, 0x6a52a8], shadow: false,
    build(g, ctx) {
      const C = new THREE.Vector3(0, 4.2, -5), st = bethStar(3, g, C.x, C.y, C.z), cl = [];
      for (let i = 0; i < 22; i++) { const c = put(cloud(8, rnd(1.4, 2.6), 0xe8d8f8), g, rnd(-26, 26), rnd(-3.5, -0.8), rnd(-28, 5)); c.userData.x0 = c.position.x; cl.push(c); }
      const an = []; [[6, 3.6, 1], [9, 6.4, -1]].forEach(([n, r, dir], ring) => { for (let i = 0; i < n; i++) an.push({ a: put(angel({ trumpet: (i + ring) % 2 === 0, hair: pick([0xe8c060, 0x5a3a26, 0x2a1a12, 0xc86a30]), skin: pick([0xe8b996, 0x8a5a3a, 0xf0c8a8, 0x5a3a26]) }), g, 0, 0, 0, ring ? 1 : 1.2), o: i / n * TAU, r, dir, ring }); });
      const pts = []; for (let i = 0; i < 300; i++) { const a = rnd(TAU), r = rnd(2, 11); pts.push([Math.cos(a) * r, Math.sin(a) * r, rnd(-3, 2), pick([0xfff0c0, 0xffffff, 0xffc0e0])]); } const sw = twinkles(pts, 1.1, 3, 0.2); sw.position.copy(C); g.add(sw);
      light(0xfff0d0, 30, 40, 0, 4.2, 0, g); const sc = scroller(cl, 56, 0.35);
      ctx.rays(st, 1.2); ctx.star(g, C.x + 0.2, C.y - 2.0, C.z + 3.2, { t: 4 }); // sung down from the middle of the choir
      return (t) => {
        sc(t); sw.rotation.z = t * 0.08; st.scale.setScalar(easeOut(clamp(t / 3)) + 0.01);
        an.forEach((n, i) => { const k = easeOut(clamp((t - 0.5 - i * 0.12) / 3.5)), a = n.o + t * 0.22 * n.dir, r = n.r + (1 - k) * 30; n.a.position.set(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r * 0.8 + Math.sin(t * 1.5 + i) * 0.15, C.z + 2.5 + n.ring * -1.5 + Math.sin(a) * 1.5 * n.dir); n.a.rotation.z = Math.cos(a) * 0.25; n.a.rotation.y = -Math.cos(a) * 0.5; n.a.userData.flap(t + i, 3); });
      };
    },
  },
  { // 19
    t: 'O Come, All Ye Faithful', s: 'The road is long and the evening cold, but the little town is in sight at last. O come ye, O come ye to Bethlehem.',
    col: [0xffb070, 0x5a6ad0], sky: [0x10184a, 0xd0806a], snow: 0, cam: [0, 2.1, 9], look: [0.8, 1.9, 0], fogD: 0.012, hemi: [0xffc0a0, 0x4a4a6a], grade: { warm: 0.16 },
    build(g, ctx) {
      g.add(snowGround(110, 0.9, 0xa89a80, 7)); bethlehem(g, 16, groundY(16, -34, 0.9) + 1, -34, 30); ctx.rays(bethStar(2.6, g, 16, 15, -38), 0.6); put(beam(13, 0.2, 2.5, 0xfff0c0, 0.07), g, 16, 15, -38);
      const dk = put(donkey(), g, 0, 0, 0), m = put(mary(), dk, -0.05, 0.75, 0.05, 0.82, 1.2); const jo = put(joseph(), g, 1.9, 0, 0.5, 1.05, Math.PI / 2);
      const lan = grp(jo.userData.armL, 0, -0.66, 0); mesh(box(0.13, 0.19, 0.13), G(0xffc050, 2.6), 0, 0, 0, lan); halo(0xffb040, 1.7, 0, 0, 0, lan, 0.7); light(0xffb050, 14, 9, 0, 0, 0.3, lan); jo.userData.armL.rotation.x = -0.9; jo.userData.fixL = jo.userData.fixR = true;
      ctx.star(lan, 0, 0.32, 0.1, { t: 3 }); // in Joseph's lantern
      const items = []; for (let i = 0; i < 18; i++) { const k = i % 4, o = k === 0 ? palm(rnd(3, 4.5)) : k === 1 ? rock(rnd(0.6, 1.6)) : k === 2 ? mesh(sph(rnd(0.5, 1), 8, 6), M(0x4a5a3a, { flat: true })) : rock(rnd(3, 5), 0x9a8a70); o.userData.x0 = rnd(-23, 23); put(o, g, 0, k === 3 ? -0.6 : 0, k === 3 ? rnd(-20, -8) : pick([rnd(-7, -2), rnd(2, 3.6)])); items.push(o); }
      const sc = scroller(items, 46, 0.8);
      return (t) => { sc(t); gallop(dk, t * 0.45, 0.35, 8); dk.position.y = Math.abs(Math.sin(t * 3.6)) * 0.04; nod(dk, t * 3.6, 0.08, 1); m.userData.body.rotation.z = Math.sin(t * 3.6) * 0.04; walk(jo, t, 3.6, 0.3); };
    },
  },
  { // 20
    t: 'The Flight', s: 'Jingle all the way! Across the moon and over the rooftops — somebody with a very red nose is leading the way tonight.',
    col: [0xff3b30, 0xffd34d], sky: [0x030820, 0x1a3070], cam: [0, 3.5, 13], look: [0, 5.2, -4], snow: 700, fogD: 0.006, orbit: 0.06, shadow: false,
    build(g, ctx) {
      ctx.rays(moon(8, 0, 10, -55, g), 0.5, 0xcfe0ff); ctx.star(g, 0, 10.5, -44, { t: 4, s: 4 }); // in front of the moon, where the team crosses it
      const cl = []; for (let i = 0; i < 20; i++) { const c = put(cloud(8, rnd(1.5, 3), 0x9fb0e0), g, rnd(-34, 34), rnd(-2.5, 0.5), rnd(-36, 4)); c.userData.x0 = c.position.x; cl.push(c); }
      const vl = []; for (let i = 0; i < 380; i++) vl.push([rnd(-60, 60), -9, rnd(-90, 0), pick([0xffc866, 0xffe0a0, 0xff9a50])]); g.add(twinkles(vl, 2.2, 1, 0.8));
      const team = sleighTeam(3, monkey()); team.scale.setScalar(0.75); g.add(team); const george = team.children[0].children[2], pool = new Particles(1400); g.add(pool.points);
      const P = (a, v) => v.set(12 * Math.sin(a), 5.2 + 1.8 * Math.sin(a * 2 + 1), -6 + 8 * Math.cos(a)), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), sc = scroller(cl, 70, 0.6);
      return (t, dt) => {
        const a = t * 0.42 + 3.6; P(a, v1); P(a + 0.06, v2); team.position.copy(v1); team.lookAt(v2); team.rotateZ(-Math.cos(a) * 0.25); george.userData.wave(t); sc(t);
        v2.sub(v1).normalize(); for (let i = 0; i < 5; i++) pool.emit(v1.x - v2.x * rnd(0.6, 1.4), v1.y + rnd(0.2, 0.8), v1.z - v2.z * rnd(0.6, 1.4), rnd(-0.3, 0.3) - v2.x, rnd(-0.3, 0.3), rnd(-0.3, 0.3) - v2.z, pick([0xffd34d, 0xffffff, 0xff7050, 0xffe9a0]), rnd(1.5, 3), rnd(0.5, 1.1), 0.25);
        pool.update(dt);
      };
    },
  },
  { // 21
    t: 'The Longest Night', s: 'Midwinter. The sun has gone to bed early, so the sky puts on its own lights — and two bears stay up to watch.',
    col: [0x35ffb0, 0x9050ff], sky: [0x02040f, 0x0a2040], snow: 250, cam: [0, 2.2, 10.5], look: [0, 7, -10], fov: 60, fogD: 0.004, grade: { tilt: 0.5 },
    build(g, ctx) {
      if (!iceMirror(g, new THREE.CircleGeometry(160, 72), -0.01, 0x4a5a7a, 0x06182c, 0.5)) mesh(cyl(160, 160, 0.1, 48), M(0x06182c, { r: 0.15, m: 0.6 }), 0, -0.05, 0, g); // the aurora, doubled in the still sea
      const sheen = mesh(cyl(150, 150, 0.01, 48), G(0x1a9070, 0.6, { o: 0.13, add: true }), 0, 0.02, 0, g);
      g.add(aurora(130, 36, 64, 0x35ffb0, 0x9050ff, 1.5)); const a2 = aurora(155, 44, 76, 0x40c0ff, 0xff50a0, 0.9, 3.2); a2.rotation.y = 0.45; g.add(a2); const a3 = aurora(105, 26, 40, 0x90ff60, 0x30ffd0, 0.8, 1.9); a3.rotation.y = -0.6; g.add(a3);
      const ice = M(0xf2f6ff, { flat: true }), floes = [mesh(cyl(4.6, 4.9, 0.5, 7), ice, 0, 0.1, 0.5, g)];
      for (let i = 0; i < 18; i++) { const r = rnd(1, 3.4), a = rnd(TAU), d = rnd(8, 34); floes.push(mesh(cyl(r, r * 1.08, 0.4, 7), ice, Math.cos(a) * d, 0.05, Math.sin(a) * d - 8, g)); floes[i + 1].rotation.y = rnd(3); }
      mesh(cyl(16, 17, 1.2, 9), ice, -22, 0.4, -30, g); const ig = grp(g, -17, 1, -24); mesh(sph(2, 14, 10), M(0xf2f6ff, { flat: true }), 0, 0, 0, ig).scale.y = 0.8; mesh(box(0.8, 0.9, 0.4), G(0xffb050, 2), 1.2, 0.3, 1.5, ig); halo(0xffa040, 4, 1.2, 0.4, 1.7, ig, 0.6);
      const bg = grp(floes[0], 0, 0.25, 0), mum = put(polarBear(1), bg, -0.3, 0, 0.3, 1, 1.25), cub = put(polarBear(0.5), bg, 1.3, 0, 1.0, 1, 1.0);
      ctx.star(floes[0], 2.6, 0.9, 1.7, { t: 2 }); // a shooting star that landed beside the bears
      const sh = sprite(glowTex(), 0xffffff, 1, 0, 0, 0, g, 0); sh.scale.set(7, 0.35, 1); sh.material.rotation = -0.5;
      return (t) => {
        floes.forEach((f, i) => { f.position.y = (i ? 0.05 : 0.1) + Math.sin(t * 0.7 + i * 1.9) * 0.06; f.rotation.z = Math.sin(t * 0.5 + i) * 0.012; });
        mum.userData.neck.rotation.z = -0.45 + Math.sin(t * 0.4) * 0.08; cub.userData.neck.rotation.z = -0.35 + Math.sin(t * 1.1) * 0.2; cub.position.y = Math.max(0, Math.sin(t * 2.2)) * 0.12 * smooth(0, 1, Math.sin(t * 0.3));
        sheen.material.opacity = 0.1 + 0.05 * Math.sin(t * 0.4); const c = (t % 9) / 1.1; sh.material.opacity = c < 1 ? Math.sin(c * Math.PI) : 0; sh.position.set(-30 + c * 42, 44 - c * 20, -90);
      };
    },
  },
  { // 22
    t: 'Hark! The Herald Angels Sing', s: 'Hark — the bells! Lantern by lantern the whole village is climbing the hill to midnight service.',
    col: [0xffd34d, 0x6a8aff], cam: [4, 2.4, 19], look: [0, 6, 4], snow: 1800, fogD: 0.01,
    build(g, ctx) {
      g.add(snowGround(110, 0.6, 0xc2d0ee, 20)); forest(g, 36, 12, 40, 0.6, (x, z) => Math.abs(x) > 5.5 && z < 12); const stone = M(0x8a8a96, { flat: true }), slate = M(0xf4f8ff), sg = new THREE.MeshBasicMaterial({ map: stainedTex(), color: new THREE.Color(1.7, 1.7, 1.7) });
      mesh(box(5.4, 4.4, 9), stone, 0, 2.2, -1.5, g); mesh(prism(6, 3, 9.4), slate, 0, 4.36, -1.5, g); mesh(prism(5.5, 2.8, 9.44), stone, 0, 4.36, -1.5, g);
      mesh(box(3, 9, 3), stone, 0, 4.5, 4.4, g); const sp = mesh(cone(2.2, 5, 4), slate, 0, 11.5, 4.4, g); sp.rotation.y = Math.PI / 4; mesh(box(0.1, 1.1, 0.1), M(0xffd34d, { m: 0.9, r: 0.2, e: 0x8a6000 }), 0, 14.4, 4.4, g); mesh(box(0.6, 0.1, 0.1), M(0xffd34d, { m: 0.9, r: 0.2, e: 0x8a6000 }), 0, 14.55, 4.4, g);
      mesh(box(1.25, 1.9, 0.1), sg, 0, 4.6, 5.92, g); for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) mesh(box(0.1, 2, 1.2), sg, sx * 2.72, 2.5, -4.2 + i * 2.6, g);
      mesh(box(1.5, 1.7, 0.1), M(0x08080c), 0, 7.6, 5.92, g); const bell = grp(g, 0, 8.35, 6.02); mesh(cyl(0.16, 0.5, 0.7, 14), M(0xffd34d, { m: 0.9, r: 0.2, e: 0x7a5200, ei: 0.8 }), 0, -0.4, 0, bell); mesh(sph(0.1), M(0x8a6a2a, { m: 0.8 }), 0, -0.82, 0, bell); ctx.star(bell, 0, -1.1, 0.35, { tap: bell }); // rung out of the bell
      mesh(box(1.4, 2.3, 0.1), G(0xffb050, 1.5), 0, 1.15, 5.92, g); halo(0xffa040, 6, 0, 1.4, 6.3, g, 0.5); light(0xffb060, 30, 14, 0, 1.6, 7.5, g);
      for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) { const x = sx * 1.5, z = 8 + i * 2.2; mesh(cyl(0.03, 0.03, 0.8, 5), M(0x2a2018), x, 0.4, z, g); mesh(box(0.16, 0.2, 0.16), G(0xffc050, 2.4), x, 0.9, z, g); halo(0xffb040, 1.3, x, 0.9, z, g, 0.6); }
      const folk = [0x7a1f2b, 0x2a5db0, 0x1f7a4a, 0x6a3a8a].map((c, i) => put(figure({ robe: c, head: pick(['bobble', 'bonnet', 'tophat']), hat: pick([0xc8102e, 0x15151a, 0xffd34d]), h: i === 2 ? 0.65 : 1 }), g, rnd(-0.6, 0.6), 0, 0, 1, Math.PI));
      const rings = [0, 1, 2].map(() => mesh(tor(0.6, 0.03, 6, 40), G(0xffe090, 1.6, { o: 0.5, add: true }), 0, 7.6, 6.2, g)); put(snowman({ scarf: 0x2a5db0 }), g, 3.4, 0, 10, 0.9, -0.4);
      return (t) => {
        bell.rotation.z = Math.sin(t * 3.2) * 0.6; rings.forEach((r, i) => { const u = (t * 3.2 / TAU + i / 3) % 1; r.scale.setScalar(1 + u * 9); r.material.opacity = 0.5 * (1 - u) * (1 - u); });
        folk.forEach((f, i) => { const u = (t * 0.07 + i * 0.25) % 1; f.position.z = 19 - u * 13; f.scale.setScalar((f.userData.h0 ??= f.scale.x) * Math.min(1, smooth(1, 0.94, u) + 0.001)); walk(f, t + i, 4, 0.35); });
      };
    },
  },
  { // 23
    t: 'Away in a Manger', s: 'The stable is swept and the hay is fresh. The cattle are lowing, the doves are dozing — and everyone is waiting.',
    col: [0xffe0a0, 0x8a6a3a], cam: [0, 2.0, 8.5], look: [0, 1.8, 0], snow: 700, grade: { warm: 0.15 },
    build(g, ctx) {
      g.add(snowGround()); forest(g, 22, 12, 30); const s = put(stable(), g, 0, 0, 0, 1.35), mg = put(manger(false), g, 0, 0, 0.5, 1.2), hl = halo(0xffe0a0, 2.5, 0, 0.9, 0.6, g, 0.2);
      const cow = put(highlandCow(), g, -2.5, 0, 0, 0.85, -0.25), dk = put(donkey(), g, 2.4, 0, -0.1, 1, Math.PI + 0.3), fl = [[-1.2, 1.9, 0.5], [0.9, 2.2, 2.6], [1.7, 1.6, -2]].map(([x, z, r]) => put(sheep(), g, x, 0, z, 1, r));
      const ms = put(moose(), g, 4.9, 0, -1.2, 0.9, Math.PI - 0.5), doves = [-0.5, 0.2].map((x) => put(bird(0xffffff, 0xf2f2f2), g, x, 4.72, 0.3, 1.1, rnd(-0.5, 0.5)));
      const lan = grp(g, -1.4, 2.9, 0.9); mesh(cyl(0.01, 0.01, 0.5, 4), M(0x2a2018), 0, 0.25, 0, lan); mesh(box(0.2, 0.28, 0.2), G(0xffc050, 2.6), 0, -0.14, 0, lan); halo(0xffb040, 2.4, 0, -0.14, 0, lan, 0.7); light(0xffb050, 26, 12, 0, -0.3, 0.6, lan);
      const cat = grp(g, 0.9, 0, 1.3), cm = M(0x3a3a40); mesh(sph(0.2, 10, 8), cm, 0, 0.14, 0, cat).scale.set(1.3, 0.7, 1); mesh(sph(0.12, 8, 6), cm, 0.24, 0.17, 0.08, cat); for (const sx of [-1, 1]) mesh(cone(0.04, 0.08, 4), cm, 0.24 + sx * 0.06, 0.29, 0.08, cat);
      for (const [x, z] of [[-3.4, 1.2], [3.5, 1.5]]) mesh(box(0.9, 0.5, 0.6), M(0xd0b050, { flat: true }), x, 0.25, z, g);
      const st = bethStar(2.4, g, 0, 9.5, -5), bm = put(beam(7, 0.15, 2.2, 0xfff0c0, 0.0), g, 0, 9.5, -5);
      ctx.rays(st, 0.8); ctx.star(g, -0.15, 5.1, 0.35, { tap: doves[0] }); // tucked under the dozing doves
      return (t) => {
        nod(cow, t, 0.1, 0.8); nod(dk, t + 2, 0.12, 0.6); nod(ms, t + 1, 0.1, 0.5); fl.forEach((f, i) => nod(f, t + i * 2, 0.2, 0.7)); lan.rotation.z = Math.sin(t * 1.1) * 0.12;
        const k = smooth(2, 16, t); st.scale.setScalar(0.45 + k * 0.75); bm.material.opacity = 0.09 * k; hl.material.opacity = 0.2 + 0.35 * k + Math.sin(t * 1.5) * 0.05;
        doves.forEach((d, i) => { d.userData.head.rotation.y = Math.round(Math.sin(t * 0.8 + i * 2)) * 0.6; d.userData.b.scale.y = 1 + Math.sin(t * 2 + i) * 0.04; }); dk.userData.ears[1].rotation.z = Math.sin(t * 5) * 0.2;
      };
    },
  },
  { // 24
    t: 'Silent Night', s: 'All is calm, all is bright. The star has stopped, the long road has ended, and the whole world holds its breath. Happy Christmas.',
    col: [0xfff0c0, 0xffd34d], sky: [0x04071e, 0x1a2a66], cam: [0, 2.6, 12.5], look: [0, 2.6, 0], snow: 600, orbit: 0.16, grade: { warm: 0.14 },
    build(g, ctx) {
      g.add(snowGround(110, 0.6, 0xc2d0ee, 12)); forest(g, 28, 14, 34); put(stable(), g, 0, 0, 0, 1.45);
      const mg = put(manger(), g, 0, 0, 0.5, 1.25), ma = put(mary(), g, -1.05, 0, 0.5, 1, 1.0), jo = put(joseph(), g, 1.15, 0, 0.3, 1.1, -0.8); ma.scale.y = 0.85;
      const cow = put(highlandCow(), g, -2.3, 0, -0.5, 0.75, -0.2), dk = put(donkey(), g, 2.2, 0, -0.5, 0.85, Math.PI + 0.25);
      const sh = [[-4.4, 1.8], [-3.5, 2.8]].map(([x, z], i) => { const s = face(put(shepherd(i ? 0x6a5a7a : 0x8a7a5a), g, x, 0, z), 0, 0.5); if (i) s.scale.y = 0.75; return s; });
      const fl = [[-5.2, 3.0], [-2.7, 3.3], [-4.6, 0.6]].map(([x, z]) => faceB(put(sheep(), g, x, 0, z), 0, 0.5));
      const ks = [[3.3, 2.5], [4.3, 1.7], [5.2, 2.7]].map(([x, z], i) => { const k = face(put(king(i), g, x, 0, z, 1.05), 0, 0.5); if (i === 0) k.scale.y = 0.8; return k; }); const cm = put(camel(), g, 7.3, 0, -1.5, 1, Math.PI - 0.4);
      const an = put(angel({ trumpet: false }), g, 0, 16, -0.2, 1.3), S = [0, 12.5, -4], st = bethStar(4.5, g, ...S), bm = put(beam(11, 0.2, 3.4, 0xfff0c0, 0), g, ...S), gl = light(0xffe0a0, 0, 30, 0, 4, 3, g);
      ctx.rays(st, 1.1); ctx.star(g, 0, 2.3, 0.75, { t: 9 }); // rising out of the manger's glow
      const motes = []; for (let i = 0; i < 220; i++) motes.push([rnd(-7, 7), rnd(0.3, 9), rnd(-3, 4), pick([0xffe9b0, 0xffffff, 0xffd070]), rnd()]); const mt = twinkles(motes, 0.8, 2.5, 0.15); g.add(mt);
      const groups = [[sh.concat(fl), 4], [ks.concat([cm]), 5.5]]; groups.forEach(([arr]) => arr.forEach((o) => { o.userData.s0 = o.scale.clone(); }));
      return (t) => {
        st.scale.setScalar(easeOut(clamp(t / 3)) + 0.01); const b = smooth(2, 4.5, t); bm.material.opacity = 0.13 * b; gl.intensity = 40 * b * LK; mt.userData.u.uReveal.value = smooth(3, 9, t);
        mg.userData.glow.material.opacity = (0.3 + 0.6 * b) * (0.9 + 0.1 * Math.sin(t * 2)); mg.userData.glow.scale.setScalar(2.6 + b * 1.6 + Math.sin(t * 2) * 0.15); mg.userData.l.intensity = (6 + 18 * b) * LK;
        groups.forEach(([arr, t0]) => arr.forEach((o, i) => o.scale.copy(o.userData.s0).multiplyScalar(easeBack(clamp((t - t0 - i * 0.25) / 0.9)) + 0.001)));
        const k = easeOut(clamp((t - 7) / 4)); an.position.y = lerp(16, 5.9, k) + Math.sin(t * 1.1) * 0.15; an.userData.flap(t, 2.2);
        ma.userData.body.rotation.x = 0.12 + Math.sin(t * 0.8) * 0.03; nod(cow, t, 0.08, 0.7); nod(dk, t + 1, 0.1, 0.6); nod(cm, t, 0.06, 0.5); fl.forEach((f, i) => nod(f, t + i * 2, 0.15, 0.8));
        ks.forEach((kk, i) => { kk.userData.body.rotation.x = 0.15 + Math.sin(t * 0.6 + i) * 0.03; });
      };
    },
  },
];
