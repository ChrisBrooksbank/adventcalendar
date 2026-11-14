// Doors 1–12.
import {
  THREE, LK, TAU, rnd, pick, clamp, lerp, smooth, easeOut, easeBack, M, G, sph, box, cyl, cone, tor, mesh, grp, put, light, star3d,
  flakeTex, glyphTex, sprite, halo, twinkles, Particles, aurora, moon, snowGround, groundY, pine, forest, win, house, present, gift, GIFT,
  lampPost, fire, candle, snowman, figure, walk, santa, beast, gallop, nod, reindeer, horse, moose, highlandCow, monkey, bird, sleigh, sleighTeam,
} from './kit.js';

export const face = (o, x, z) => { o.rotation.y = Math.atan2(x - o.position.x, z - o.position.z); return o; };
export const faceB = (o, x, z) => { o.rotation.y = Math.atan2(x - o.position.x, z - o.position.z) - Math.PI / 2; return o; };
export function smoke(g, x, y, z, n = 6) {
  const ps = []; for (let i = 0; i < n; i++) { const m = mesh(sph(0.25, 8, 6), M(0xcfd6e6, { o: 0.3 }), x, y, z, g); m.material.depthWrite = false; ps.push(m); }
  return (t) => ps.forEach((m, i) => { const u = (t * 0.16 + i / n) % 1; m.position.set(x + u * u * 1.6 + Math.sin(u * 6 + i) * 0.15, y + u * 3.2, z); m.scale.setScalar(0.5 + u * 2.4); m.material.opacity = 0.35 * (1 - u); });
}
const LIGHTS = [0xff3b30, 0xffd34d, 0x39d353, 0x3aa0ff, 0xff7ad9, 0xffffff];
// fairy lights spiralling up a tree of height h at the origin of `parent`
export function treeLights(parent, h, n = 150, turns = 9) {
  const pts = []; for (let i = 0; i < n; i++) { const f = i / n, a = f * TAU * turns, r = h * 0.37 * (1 - f) + 0.08; pts.push([Math.cos(a) * r, h * 0.2 + f * h * 0.83, Math.sin(a) * r, LIGHTS[i % LIGHTS.length], f]); }
  const l = twinkles(pts, 1.5, 2.5, 0.55); parent.add(l); return l;
}
export function topStar(parent, y, r = 0.4) {
  const g = grp(parent, 0, y, 0); mesh(star3d(r, r * 0.3), G(0xffe070, 2.4), 0, 0, 0, g); halo(0xffd050, r * 9, 0, 0, 0, g, 0.8); return g;
}

export const DAYS_A = [
  { // 1
    t: 'The First Snowflake', s: 'High above the sleeping forest, winter makes its very first snowflake — and then, quietly, a million more.',
    col: [0x9fd4ff, 0xffffff], cam: [0, 2.6, 10], look: [0, 2.8, 0],
    build(g) {
      g.add(snowGround()); forest(g, 34, 9, 30);
      const fm = M(0xd8ecff, { e: 0x7fc4ff, ei: 1.5, r: 0.2, m: 0.2 }), flake = grp(g, 0, 3, 0);
      for (let i = 0; i < 6; i++) {
        const a = grp(flake); a.rotation.z = i * TAU / 6; mesh(box(0.09, 1.7, 0.06), fm, 0, 0.85, 0, a);
        for (const [y, l] of [[0.5, 0.55], [0.92, 0.44], [1.3, 0.28]]) for (const s of [1, -1]) { const b = mesh(box(0.07, l, 0.05), fm, s * l * 0.43, y + l * 0.25, 0, a); b.rotation.z = -s * TAU / 6; }
        mesh(sph(0.07, 8, 6), G(0xcfeaff, 2.2), 0, 1.74, 0, a);
      }
      mesh(sph(0.17), G(0xffffff, 2.6), 0, 0, 0, flake); const h = halo(0x9fd4ff, 8, 0, 3, 0, g, 0.6); light(0x9fd0ff, 30, 22, 0, 3, 1.5, g);
      const minis = []; for (let i = 0; i < 40; i++) minis.push({ s: sprite(flakeTex(), 0xdff0ff, rnd(0.25, 0.65), 0, 0, 0, g), a: rnd(TAU), r: rnd(2.4, 7), y: rnd(0.6, 6), w: rnd(0.12, 0.45) * (rnd() < 0.5 ? -1 : 1) });
      return (t) => {
        flake.scale.setScalar(0.01 + easeBack(clamp(t / 3))); flake.position.y = 3 + (1 - easeOut(clamp(t / 3))) * 9 + Math.sin(t * 0.8) * 0.15; h.position.y = flake.position.y;
        flake.rotation.y = t * 0.5; flake.rotation.z = t * 0.15; h.material.opacity = 0.45 + 0.15 * Math.sin(t * 2);
        minis.forEach((m) => { const a = m.a + t * m.w, k = smooth(1.5, 5, t + m.r * 0.3); m.s.position.set(Math.cos(a) * m.r, m.y + Math.sin(t * 0.7 + m.a) * 0.4, Math.sin(a) * m.r); m.s.material.rotation = t * m.w * 2; m.s.material.opacity = k; });
      };
    },
  },
  { // 2
    t: 'Deck the Halls', s: 'The fire is lit, the stockings are hung, and somebody small and furry has claimed the best armchair.',
    col: [0xff8a30, 0xffd070], sky: [0x120806, 0x241008], snow: 0, stars: false, fogD: 0, light: 0.4, hemi: [0xffc9a0, 0x3a2015], cam: [0.6, 2.2, 7.2], look: [0.3, 1.8, -1.5], orbit: 0.1,
    build(g) {
      const wood = M(0x5a3a22), stone = M(0x8d8782, { flat: true });
      mesh(box(16, 0.2, 12), wood, 0, -0.1, 0, g); mesh(box(16, 8, 0.2), M(0x6e2430), 0, 4, -2.7, g); mesh(box(16, 1.1, 0.26), M(0x3d2516), 0, 0.55, -2.62, g);
      for (const sx of [-1, 1]) mesh(box(0.55, 2.1, 0.8), stone, sx * 1.15, 1.05, -2.25, g);
      mesh(box(2.85, 0.5, 0.8), stone, 0, 2.3, -2.25, g); mesh(box(2.5, 5, 0.5), stone, 0, 5, -2.45, g); mesh(box(1.8, 2.1, 0.1), M(0x0c0807), 0, 1.05, -2.55, g);
      mesh(box(3.4, 0.14, 1.0), M(0x3d2516), 0, 2.62, -2.2, g);
      const f = put(fire(1.15), g, 0, 0.1, -2.15); f.userData.power = 0;
      const socks = [0xc8102e, 0x1f7a4a, 0xf2f2f2, 0x2a5db0].map((c, i) => { const s = grp(g, -1.2 + i * 0.8, 2.52, -1.68), m = M(c); mesh(box(0.22, 0.5, 0.1), m, 0, -0.3, 0, s); mesh(box(0.38, 0.2, 0.1), m, 0.08, -0.62, 0, s); mesh(box(0.27, 0.15, 0.12), M(c === 0xf2f2f2 ? 0xc8102e : 0xffffff), 0, -0.08, 0, s); return s; });
      const gl = []; for (let i = 0; i < 30; i++) { const x = -1.65 + i * 0.114, y = 2.78 + Math.abs(Math.sin(i * 0.52)) * -0.1; gl.push([x, y, -1.72, LIGHTS[i % 6], i / 30]); mesh(sph(0.1, 6, 5), M(0x1f5a36), x, y - 0.02, -1.78, g); }
      const garland = twinkles(gl, 0.9, 3, 0.6); g.add(garland);
      for (const x of [-1.3, -0.9, 1.0, 1.35]) put(candle(rnd(0.3, 0.55)), g, x, 2.69, -2.3);
      const wr = grp(g, 0, 4.1, -2.15); mesh(tor(0.5, 0.15, 8, 24), M(0x1f5a36), 0, 0, 0, wr); for (let i = 0; i < 9; i++) mesh(sph(0.05), M(0xd0101c, { e: 0x600000 }), Math.cos(i * 0.7) * 0.5, Math.sin(i * 0.7) * 0.5, 0.14, wr); mesh(box(0.3, 0.2, 0.08), M(0xc8102e), 0, -0.5, 0.14, wr);
      win(g, -4.4, 3.3, -2.58, 1.9, 2.3, 0, 0x4466bb, 0.9);
      const tree = put(pine(3.6, false), g, 3.9, 0, -1.2); const tl = treeLights(tree, 3.6, 110, 7); topStar(tree, 3.85, 0.26);
      for (let i = 0; i < 6; i++) put(gift(rnd(0.35, 0.6)), g, 3.9 + Math.cos(i * 1.1) * 1.2, 0, -1.0 + Math.abs(Math.sin(i * 1.1)) * 1.1, 1, rnd(1));
      mesh(cyl(2.3, 2.3, 0.03, 32), M(0x7a1f2b), 0, 0.02, 0.6, g); mesh(cyl(1.9, 1.9, 0.035, 32), M(0xb89a5a), 0, 0.02, 0.6, g); mesh(cyl(1.7, 1.7, 0.04, 32), M(0x7a1f2b), 0, 0.02, 0.6, g);
      const cat = grp(g, 0.5, 0.05, 0.3), cm = M(0xd98a3a); const cb = mesh(sph(0.3, 12, 9), cm, 0, 0.18, 0, cat); cb.scale.set(1.35, 0.7, 1); mesh(sph(0.17, 10, 8), cm, 0.36, 0.2, 0.14, cat);
      for (const s of [-1, 1]) mesh(cone(0.05, 0.1, 4), cm, 0.36 + s * 0.09, 0.36, 0.14, cat); mesh(tor(0.2, 0.04, 5, 12, Math.PI), cm, -0.3, 0.08, 0.15, cat).rotation.x = Math.PI / 2;
      const ch = grp(g, -2.9, 0, 0.3); ch.rotation.y = 0.6; const cg = M(0x2f5a3a);
      mesh(box(1.2, 0.5, 1.1), cg, 0, 0.35, 0, ch); mesh(box(1.2, 1.3, 0.28), cg, 0, 1.0, -0.42, ch); for (const s of [-1, 1]) mesh(box(0.22, 0.45, 1.0), cg, s * 0.6, 0.75, 0.05, ch);
      const george = put(monkey(), ch, 0, 0.52, 0.1, 0.85);
      return (t) => {
        const k = smooth(0.4, 2.2, t); f.scale.setScalar(Math.max(0.01, k) * 1.0); f.userData.power = 70 * k; f.userData.hl.material.opacity = 0.5 * k;
        garland.userData.u.uReveal.value = clamp((t - 2) / 2); tl.userData.u.uReveal.value = clamp((t - 3.5) / 2.5);
        socks.forEach((s, i) => { s.rotation.z = Math.sin(t * 1.3 + i) * 0.07; }); cb.scale.y = 0.7 + Math.sin(t * 1.6) * 0.03; george.userData.wave(t);
      };
    },
  },
  { // 3
    t: 'The Snowmen Dance', s: 'When nobody is looking, snowmen dance. Tonight George caught them at it — and joined in with a snowball.',
    col: [0xffffff, 0x7fd0ff], cam: [0, 2.3, 9], look: [0, 1.5, 0], snow: 2200,
    build(g) {
      g.add(snowGround()); forest(g, 32, 10, 30); put(house({ color: 0x9a5a3a }), g, -8, 0, -10, 1.3, 0.5);
      const sm = [[0, 0, 1.3, 0xc8102e], [-2.3, 0.5, 0.95, 0x1f7a4a, 'bobble'], [2.0, 0.7, 0.7, 0x2a5db0, 'bobble']].map(([x, z, s, c, h]) => { const m = put(snowman({ scarf: c, hat: h }), g, x, 0, z); m.userData.s = s; return m; });
      const george = put(monkey(), g, 4.0, 0, 2.2, 0.9, -0.9), ball = mesh(sph(0.13, 10, 8), M(0xffffff), 0, 0, 0, g);
      const pool = new Particles(200); g.add(pool.points);
      return (t, dt) => {
        sm.forEach((m, i) => {
          const k = easeBack(clamp(t * 0.7 - i * 0.6)), b = t * 3 + i * 1.3; m.scale.setScalar(Math.max(0.001, k) * m.userData.s);
          m.position.y = Math.abs(Math.sin(b)) * 0.35 * k; m.rotation.z = Math.sin(b) * 0.12; m.rotation.y = Math.sin(t * 0.8 + i) * 0.6;
          m.userData.armL.rotation.z = 2 + Math.sin(b * 2) * 0.5; m.userData.armR.rotation.z = -2 - Math.sin(b * 2 + 1) * 0.5; m.userData.hat.position.y = 0.24 + Math.max(0, Math.sin(b + 1)) * 0.15;
        });
        george.userData.wave(t); george.position.y = Math.abs(Math.sin(t * 4)) * 0.2;
        const u = ((t + 1) % 3.5) / 1.1;
        if (u < 1) { ball.visible = true; ball.position.set(lerp(3.7, 0.3, u), 1.2 + Math.sin(u * Math.PI) * 1.8 + u * 1.0, lerp(2.0, 0.3, u)); }
        else { if (ball.visible) pool.burst(0.3, 2.2, 0.3, 30, 2.5, [0xffffff, 0xcfe8ff], 0.9, 0.9, 4); ball.visible = false; }
        pool.update(dt);
      };
    },
  },
  { // 4
    t: 'O Christmas Tree', s: 'Deep in the forest the great tree wakes, light by light — and the moose comes every year to see it.',
    col: [0x39d353, 0xffd34d], cam: [0, 3.4, 13.5], look: [0, 3.9, 0],
    build(g) {
      g.add(snowGround()); forest(g, 40, 11, 32); const h = 7.5, tree = put(pine(h), g, 0, 0, 0), tl = treeLights(tree, h, 220, 11), star = topStar(tree, h * 1.07, 0.5);
      const baubles = []; for (let i = 0; i < 40; i++) { const f = rnd(0.02, 0.9), a = rnd(TAU), r = h * 0.36 * (1 - f) + 0.12, c = pick([0xd0101c, 0xffc020, 0x2a6ad0, 0xc040c0, 0xf0f0f0]); const b = mesh(sph(0.13, 12, 9), M(c, { m: 0.9, r: 0.15, e: c, ei: 0.25 }), Math.cos(a) * r, h * 0.2 + f * h * 0.8, Math.sin(a) * r, tree); b.userData.f = f; baubles.push(b); }
      for (let i = 0; i < 9; i++) put(gift(rnd(0.4, 0.75)), g, Math.cos(i * 0.7) * 2.7, 0, Math.sin(i * 0.7) * 2.7 + 0.3, 1, rnd(2));
      const ms = faceB(put(moose(), g, -4.6, 0, 2.6, 1.05), 0, 0), rd = faceB(put(reindeer(), g, 4.4, 0, 2.2, 0.95), 0, 0), fawn = faceB(put(reindeer(), g, 5.3, 0, 3.1, 0.55), 0, 0);
      const l = light(0xffd070, 0, 26, 0, 4, 3, g);
      return (t) => {
        const rv = clamp((t - 1) / 4.5); tl.userData.u.uReveal.value = rv; baubles.forEach((b) => b.scale.setScalar(clamp((rv - b.userData.f) * 8) + 0.001));
        star.scale.setScalar(easeBack(clamp(t - 5.5)) + 0.001); star.rotation.y = t; l.intensity = rv * 40 * LK;
        nod(ms, t, 0.1, 0.7); nod(rd, t + 1, 0.1, 0.9); nod(fawn, t + 2, 0.2, 1.6);
      };
    },
  },
  { // 5
    t: 'Good King Wenceslas', s: 'Brightly shone the moon that night, though the frost was cruel — and the page trod safely in his master’s steps.',
    col: [0xcfe0ff, 0xffd34d], cam: [0, 2.6, 11], look: [0, 1.6, 0], snow: 2600, fogD: 0.016,
    build(g) {
      g.add(snowGround()); forest(g, 30, 12, 32); moon(6, 16, 22, -70, g); put(pine(5), g, 0, 0, 0);
      const cot = put(house({ color: 0x7a5a48, w: 2.6 }), g, -9, groundY(-9, -14), -14, 1, 0.5), sm = smoke(g, -8.2, groundY(-9, -14) + 4.2, -14.5);
      const kingF = figure({ robe: 0xa0151f, head: 'crown', hat: 0xa0151f, beard: 0x8a6a4a, trim: 0xffffff, staff: true, h: 1.15 }), page = figure({ robe: 0x2f6a3a, head: 'bobble', hat: 0x8a5a2a, h: 0.85 });
      g.add(kingF, page); const lan = grp(page.userData.armL, 0, -0.65, 0); mesh(box(0.14, 0.2, 0.14), G(0xffc050, 2.6), 0, 0, 0, lan); halo(0xffb040, 1.8, 0, 0, 0, lan, 0.7); light(0xffb050, 10, 8, 0, 0, 0, lan); page.userData.armL.rotation.x = -0.9; page.userData.fixL = true; kingF.userData.fixR = true;
      for (let i = 0; i < 70; i++) { const a = i / 70 * TAU, r = 4.5 + (i % 2 ? 0.14 : -0.14); mesh(cyl(0.09, 0.09, 0.02, 8), M(0xb8c6e0), Math.cos(a) * r, 0.012, Math.sin(a) * r, g).scale.z = 1.6; }
      const cow = faceB(put(highlandCow(), g, 6.5, 0, -2.5), 0, 4);
      return (t) => {
        [[kingF, 0], [page, -0.36]].forEach(([f, off]) => { const a = t * 0.22 + off + 1; f.position.set(Math.cos(a) * 4.5, 0, Math.sin(a) * 4.5); f.rotation.y = -a; walk(f, t + off * 3, 4.5, 0.45); });
        sm(t); nod(cow, t, 0.1, 0.8);
      };
    },
  },
  { // 6
    t: 'Saint Nicholas’ Day', s: 'Ho, ho, ho! Father Christmas opens his sack to check the presents — and finds one extra helper inside.',
    col: [0xff3b30, 0xffd34d], cam: [0, 2.6, 9.5], look: [0, 2.1, 0],
    build(g) {
      g.add(snowGround()); forest(g, 30, 11, 30); g.add(aurora(130, 30, 50, 0x35ffb0, 0x9050ff, 0.7));
      const fc = put(santa(), g, 0.4, 0, 0, 1.55), sack = grp(g, -2.2, 0, -0.2); mesh(sph(0.95, 14, 10), M(0x6b4a2a), 0, 0.85, 0, sack).scale.y = 1.1; mesh(tor(0.5, 0.1, 6, 16), M(0x5a3c20), 0, 1.75, 0, sack).rotation.x = Math.PI / 2;
      const george = put(monkey(), sack, 0, 1.2, 0, 0.8);
      const ws = put(house({ color: 0xa0352a, w: 4, d: 3.4 }), g, 0.5, 0, -8, 1.6); const eave = []; for (let i = 0; i < 26; i++) eave.push([-3.4 + i * 0.3 + 0.5, 3.55 + Math.abs(i - 12.5) * -0.0, -5.0, LIGHTS[i % 6]]); g.add(twinkles(eave, 1.2, 3, 0.5));
      const pole = grp(g, 3.3, 0, -1.2); for (let i = 0; i < 8; i++) mesh(cyl(0.09, 0.09, 0.3, 10), M(i % 2 ? 0xffffff : 0xd0101c), 0, 0.15 + i * 0.3, 0, pole); mesh(sph(0.2), G(0xffe070, 2), 0, 2.55, 0, pole); halo(0xffd050, 2, 0, 2.55, 0, pole, 0.6);
      mesh(box(1.1, 0.4, 0.06), M(0xf4ead0), 0.35, 1.9, 0.1, pole);
      const r1 = faceB(put(reindeer(true), g, 4.6, 0, -2.6), 0, 3), r2 = faceB(put(reindeer(), g, 5.8, 0, -1.9, 0.9), 0, 3);
      const gifts = []; for (let i = 0; i < 12; i++) { const [a, b] = GIFT[i % GIFT.length]; gifts.push(put(present(0.42, a, b), g, 0, 0, 0)); }
      const pool = new Particles(300); g.add(pool.points);
      return (t, dt) => {
        fc.userData.armR.rotation.z = 2.5 + Math.sin(t * 4) * 0.35; fc.userData.body.position.y = Math.abs(Math.sin(t * 5)) * 0.03; fc.userData.head.rotation.z = Math.sin(t * 2.5) * 0.08; fc.rotation.y = Math.sin(t * 0.5) * 0.25;
        george.position.y = 0.75 + smooth(3, 4, t) * 0.55 + Math.sin(t * 3) * 0.05; george.userData.wave(t);
        gifts.forEach((p, i) => {
          const k = easeOut(clamp((t - 1 - i * 0.4) / 1.6)), a = t * 0.55 + i * TAU / 12, r = 3 + 0.4 * Math.sin(t + i);
          p.position.set(lerp(-2.2, Math.cos(a) * r, k), lerp(1.8, 2.3 + 1.1 * Math.sin(t * 0.9 + i * 1.7), k) + Math.sin(k * Math.PI) * 2, lerp(-0.2, Math.sin(a) * r * 0.7, k));
          p.scale.setScalar(k + 0.001); p.rotation.y = t + i; p.rotation.z = Math.sin(t + i) * 0.3;
          if (k > 0.02 && Math.random() < 0.25) pool.emit(p.position.x, p.position.y + 0.2, p.position.z, rnd(-0.2, 0.2), rnd(-0.3, 0.1), rnd(-0.2, 0.2), pick([0xffd34d, 0xffffff, 0xff8060]), 0.9, 0.7, 0.3);
        });
        nod(r1, t, 0.15, 1.1); nod(r2, t + 1, 0.12, 0.8); pool.update(dt);
      };
    },
  },
  { // 7
    t: 'We Wish You a Merry Christmas', s: 'Under the lamplight the carollers sing, and every note floats up to join the stars. Even Hamish the Highland cow hums along.',
    col: [0xffc060, 0xff7ad9], cam: [0, 2.2, 8.5], look: [0, 1.9, 0],
    build(g) {
      g.add(snowGround()); forest(g, 26, 12, 30); const cot = put(house({ color: 0xb0886a, w: 4, d: 3 }), g, 1.2, 0, -5.5, 1.6);
      mesh(tor(0.28, 0.09, 6, 16), M(0x1f5a36), 1.2, 1.5, -3.02, g); const lp = put(lampPost(3.2), g, -2.6, 0, -0.4);
      const defs = [{ robe: 0x7a1f2b, head: 'tophat', hat: 0x15151a, scarf: 0xffffff }, { robe: 0x2a5db0, head: 'bonnet', hat: 0x8a2a4a, scarf: 0xffd34d }, { robe: 0x1f7a4a, head: 'bobble', hat: 0xc8102e, scarf: 0xc8102e, h: 0.68 }, { robe: 0x6a3a8a, head: 'bobble', hat: 0xffd34d, scarf: 0x39d353, beard: 0xdddddd }];
      const singers = defs.map((d, i) => { const f = put(figure(d), g, -1.5 + i * 1.0, 0, 0.5 - Math.abs(i - 1.5) * 0.3); f.rotation.y = (1.5 - i) * 0.22; f.userData.armL.rotation.set(-1.1, 0, 0.5); f.userData.armR.rotation.set(-1.1, 0, -0.5); mesh(box(0.3, 0.2, 0.03), M(0xffffff), 0, 0.82, 0.36, f.userData.body).rotation.x = -0.5; return f; });
      const cow = faceB(put(highlandCow(), g, 3.9, 0, 0.3), 0, 2); mesh(tor(0.2, 0.05, 6, 14), M(0xc8102e), 0, -0.1, 0, cow.userData.neck).rotation.x = Math.PI / 2;
      const notes = []; for (let i = 0; i < 14; i++) notes.push({ s: sprite(glyphTex(i % 2 ? '♪' : '♫'), pick([0xffe070, 0xff9ad0, 0x9fe0ff, 0xffffff]), 0.45, 0, 0, 0, g), x: -1.5 + (i % 4) * 1.0, ph: i / 14 });
      return (t) => {
        singers.forEach((f, i) => { f.userData.body.rotation.z = Math.sin(t * 2 + i * 0.5) * 0.07; f.userData.head.rotation.x = -0.15 + Math.sin(t * 4 + i) * 0.08; });
        notes.forEach((n) => { const u = (t * 0.22 + n.ph) % 1; n.s.position.set(n.x + Math.sin(u * 7 + n.ph * 20) * 0.5, 1.7 + u * 4.2, 0.6); n.s.material.opacity = Math.sin(u * Math.PI) * smooth(0.5, 2, t); n.s.material.rotation = Math.sin(u * 5) * 0.4; });
        nod(cow, t * 2, 0.12, 1); cow.rotation.z = Math.sin(t * 2) * 0.03; lp.userData.l.intensity = 16 * smooth(0, 1, t) * (0.95 + 0.05 * Math.sin(t * 17)) * LK;
      };
    },
  },
  { // 8
    t: 'Dashing Through the Snow', s: 'Bells on bobtails ring! Round and round the frozen wood goes the one-horse open sleigh.',
    col: [0xffffff, 0xff3b30], cam: [0, 3.2, 12.5], look: [0, 1.4, 0], snow: 2200,
    build(g) {
      g.add(snowGround(110, 0.6, 0xc2d0ee, 12)); forest(g, 34, 13, 32); for (let i = 0; i < 7; i++) put(pine(rnd(2.5, 5)), g, Math.cos(i * 0.9) * rnd(0.3, 2.4), 0, Math.sin(i * 0.9) * rnd(0.3, 2.2) - 0.5);
      const rig = grp(g), hs = put(horse(), rig, 2.3, 0, 0); rig.add(sleigh());
      const a = put(figure({ robe: 0x2a5db0, head: 'bobble', hat: 0xffd34d, scarf: 0xffffff }), rig, 0.25, 0.55, 0.2, 0.72, Math.PI / 2), b = put(figure({ robe: 0x7a1f8a, head: 'bonnet', hat: 0xc8102e, scarf: 0x39d353 }), rig, 0.25, 0.55, -0.2, 0.68, Math.PI / 2);
      for (const sz of [-1, 1]) mesh(box(2.1, 0.02, 0.02), M(0x3a2414), 1.6, 1.0, sz * 0.15, rig);
      const lan = mesh(sph(0.09), G(0xffc050, 3), 0.95, 1.25, 0.45, rig); halo(0xffb040, 1.6, 0.95, 1.25, 0.45, rig, 0.7); light(0xffb050, 10, 9, 1, 1.4, 0, rig);
      const ms = faceB(put(moose(), g, -2.9, 0, 2.2, 0.95), 0, 9), pool = new Particles(500); g.add(pool.points); const R = 6.3;
      return (t, dt) => {
        const an = t * 0.5; rig.position.set(Math.cos(an) * R, Math.abs(Math.sin(t * 9)) * 0.03, Math.sin(an) * R); rig.rotation.y = -(an + Math.PI / 2); rig.rotation.z = 0.05;
        gallop(hs, t, 0.75, 10); hs.position.y = Math.abs(Math.sin(t * 10)) * 0.1; a.userData.armR.rotation.z = 2.4 + Math.sin(t * 6) * 0.3;
        for (let i = 0; i < 3; i++) { const b2 = an - 0.12 - rnd(0.1); pool.emit(Math.cos(b2) * (R + rnd(-0.45, 0.45)), 0.1, Math.sin(b2) * (R + rnd(-0.45, 0.45)), rnd(-0.5, 0.5), rnd(0.6, 1.8), rnd(-0.5, 0.5), 0xdfeaff, 0.8, 0.8, 4); }
        pool.update(dt); nod(ms, t, 0.08, 0.6); faceB(ms, rig.position.x, rig.position.z);
      };
    },
  },
  { // 9
    t: 'The Holly and the Ivy', s: 'A wreath on the door says welcome. A robin on the wreath says: and a merry Christmas to you, too.',
    col: [0x39d353, 0xff3b30], cam: [0, 2.5, 6], look: [0, 2.5, 0], orbit: 0.09, snow: 900,
    build(g) {
      g.add(snowGround()); mesh(box(11, 7, 0.4), M(0x9a948c, { flat: true }), 0, 3.5, -0.4, g); mesh(box(2.3, 4.2, 0.16), M(0xa01420, { r: 0.5 }), 0, 2.1, -0.14, g);
      for (const [x, y] of [[-0.5, 3.2], [0.5, 3.2], [-0.5, 1.2], [0.5, 1.2]]) mesh(box(0.7, 1.3, 0.05), M(0x8a1019, { r: 0.5 }), x, y, -0.05, g);
      mesh(sph(0.08), M(0xffd34d, { m: 0.9, r: 0.2 }), 0.9, 2.0, 0, g); mesh(box(2.9, 0.25, 0.9), M(0xf4f8ff), 0, 0.1, 0.2, g); mesh(box(2.7, 0.3, 0.5), M(0xf4f8ff), 0, 4.35, -0.1, g);
      for (const sx of [-1, 1]) { win(g, sx * 3.3, 2.8, -0.18, 1.3, 1.6); const l = grp(g, sx * 1.75, 3.3, 0.1); mesh(box(0.22, 0.34, 0.22), G(0xffc050, 2.4), 0, 0, 0, l); halo(0xffb040, 2.2, 0, 0, 0, l, 0.6); }
      light(0xffc070, 22, 12, 0, 3.2, 2.5, g);
      const C = [0, 2.75, 0.12], leaves = [], R = 0.78;
      for (let i = 0; i < 170; i++) { const a = rnd(TAU), r = R + rnd(-0.17, 0.17), lf = mesh(cone(0.07, 0.3, 4), M(new THREE.Color(0x1f6a3a).offsetHSL(rnd(-0.03, 0.03), 0, rnd(-0.06, 0.05))), C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r, C[2] + rnd(0.16), g); lf.rotation.set(rnd(-0.6, 0.6) + Math.PI / 2, 0, a + rnd(-0.8, 0.8)); lf.userData.o = ((a / TAU + 0.75) % 1); leaves.push(lf); }
      for (let i = 0; i < 26; i++) { const a = rnd(TAU), b = mesh(sph(0.045, 8, 6), M(0xe01020, { e: 0xa00000, ei: 0.8, r: 0.3 }), C[0] + Math.cos(a) * (R + rnd(-0.1, 0.1)), C[1] + Math.sin(a) * (R + rnd(-0.1, 0.1)), C[2] + 0.2, g); b.userData.o = ((a / TAU + 0.75) % 1); leaves.push(b); }
      const wl = []; for (let i = 0; i < 22; i++) { const a = i / 22 * TAU; wl.push([C[0] + Math.cos(a) * R, C[1] + Math.sin(a) * R, C[2] + 0.26, 0xffd890, (a / TAU + 0.75) % 1]); } const lights = twinkles(wl, 0.8, 3, 0.4); g.add(lights);
      const bow = grp(g, 0, C[1] - R - 0.02, 0.36), bm = M(0xc8102e, { r: 0.5 }); for (const s of [-1, 1]) { mesh(tor(0.14, 0.05, 6, 12), bm, s * 0.16, 0, 0, bow).scale.y = 0.7; mesh(box(0.1, 0.5, 0.03), bm, s * 0.1, -0.3, 0, bow).rotation.z = s * 0.3; } mesh(sph(0.07), bm, 0, 0, 0.02, bow);
      const robin = put(bird(), g, 0, C[1] - R + 0.2, 0.3, 1.25);
      return (t) => {
        const rv = clamp(t / 4); leaves.forEach((l) => l.scale.setScalar(easeBack(clamp((rv - l.userData.o * 0.85) * 7)) + 0.001)); lights.userData.u.uReveal.value = rv; bow.scale.setScalar(easeBack(clamp(t - 4)) + 0.001);
        const k = smooth(4.5, 5.5, t), fl = (t % 6) < 0.7 && t > 6; robin.position.set((1 - k) * 4, C[1] - R + 0.2 + (1 - k) * 2 + Math.abs(Math.sin(t * 5)) * 0.03 + (fl ? Math.sin((t % 6) / 0.7 * Math.PI) * 0.25 : 0), 0.3);
        robin.userData.wings.forEach((w, i) => { w.rotation.z = (k < 1 || fl) ? Math.sin(t * 40) * 0.9 * (i ? 1 : -1) : 0; });
        robin.userData.head.rotation.z = Math.round(Math.sin(t * 1.3)) * 0.35; robin.rotation.y = Math.sin(t * 0.7) * 0.5;
      };
    },
  },
  { // 10
    t: 'Carol of the Bells', s: 'The pond has frozen clear as glass. Scarves fly, blades ring, and George discovers he is rather good at this.',
    col: [0x7fd0ff, 0xffd34d], cam: [0, 4.2, 13], look: [0, 0.8, 0],
    build(g) {
      g.add(snowGround(110, 0.6, 0xc2d0ee, 12)); forest(g, 34, 12, 32); mesh(cyl(8, 8, 0.06, 48), M(0x9fd0ee, { r: 0.08, m: 0.35 }), 0, 0.03, 0, g); mesh(tor(8.1, 0.35, 8, 48), M(0xf4f8ff), 0, 0, 0, g).rotation.x = Math.PI / 2;
      const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, a2 = (i + 1) / 10 * TAU; mesh(cyl(0.05, 0.06, 3, 6), M(0x3a2a1c), Math.cos(a) * 9, 1.5, Math.sin(a) * 9, g); for (let k = 0; k < 9; k++) { const f = k / 9, b = lerp(a, a2, f); pts.push([Math.cos(b) * 9, 3 - Math.sin(f * Math.PI) * 0.6, Math.sin(b) * 9, LIGHTS[(i * 9 + k) % 6]]); } }
      g.add(twinkles(pts, 1.6, 2.5, 0.5)); put(fire(0.9), g, -9.6, 0, 3);
      const mk = (o) => { const f = figure(o); f.userData.armL.rotation.z = -1.2; f.userData.armR.rotation.z = 1.2; g.add(f); return f; };
      const sk = [
        { f: mk({ robe: 0xc8102e, head: 'bobble', hat: 0xffffff, scarf: 0xffffff }), p: (s) => [5.5 * Math.sin(s), 2.8 * Math.sin(2 * s)], w: 0.55 },
        { f: mk({ robe: 0x2a5db0, head: 'bobble', hat: 0xffd34d, scarf: 0xffd34d }), p: (s) => [6.4 * Math.cos(s), 6.4 * Math.sin(s)], w: 0.45 },
        { f: mk({ robe: 0x1f7a4a, head: 'bonnet', hat: 0xc8102e, scarf: 0xc8102e, h: 0.7 }), p: (s) => [4 * Math.cos(-s), 4 * Math.sin(-s)], w: 0.6 },
        { f: put(monkey(), g, 0, 0, 0, 0.95), p: (s) => [2.2 * Math.cos(s * 1.3) + 1.5 * Math.cos(s * 0.4), 2.2 * Math.sin(s * 1.3) + 1.5 * Math.sin(s * 0.4)], w: 0.7, george: true },
      ];
      const spin = mk({ robe: 0xffffff, head: 'hair', hat: 0xe8c060, sash: 0x7fd0ff }), pool = new Particles(600); g.add(pool.points);
      return (t, dt) => {
        sk.forEach((k, i) => {
          const s = t * k.w + i * 2, [x, z] = k.p(s), [x2, z2] = k.p(s + 0.03); k.f.position.set(x, 0.05, z); k.f.rotation.y = Math.atan2(x2 - x, z2 - z); k.f.rotation.z = Math.sin(s * 2) * 0.12;
          if (k.george) k.f.userData.wave(t); if (Math.random() < 0.6) pool.emit(x, 0.1, z, rnd(-0.2, 0.2), rnd(0.2, 0.7), rnd(-0.2, 0.2), pick([0xcfeaff, 0xffffff]), 0.9, 0.55, 1.2);
        });
        const sp = smooth(0, 1, Math.sin(t * 0.5)); spin.rotation.y += dt * (2 + sp * 16); spin.position.y = 0.05; spin.userData.armL.rotation.z = -1.2 - sp * 1.7; spin.userData.armR.rotation.z = 1.2 + sp * 1.7;
        if (sp > 0.6) pool.emit(rnd(-0.3, 0.3), 0.1, rnd(-0.3, 0.3), rnd(-1, 1), rnd(0.5, 1.5), rnd(-1, 1), 0xffffff, 0.7, 0.6, 2);
        pool.update(dt);
      };
    },
  },
  { // 11
    t: 'Up on the Housetop', s: 'Reindeer pause, and down through the chimney goes Father Christmas. George is minding the sleigh. Probably.',
    col: [0xff3b30, 0xffffff], cam: [0, 6.6, 12], look: [0.4, 5.6, 0], snow: 1400, fogD: 0.01,
    build(g) {
      const base = mesh(box(200, 1, 200), M(0xdfe8fa), 0, -0.5, 0, g); moon(6, -10, 16, -60, g);
      const big = put(house({ color: 0x8a5a48, w: 5.5, d: 8, h: 3, rh: 2.6, attic: false }), g, 0, 0, 0, 1, Math.PI / 2);
      for (let i = 0; i < 9; i++) put(house({ color: pick([0x9a6a4a, 0x7a5a6a, 0xa07a5a, 0x6a6a7a]), h: rnd(2, 3) }), g, -18 + i * 4.6 + rnd(1), 0, -9 - rnd(8), 1.2, rnd(-0.3, 0.3));
      const ch = grp(g, 2.7, 0, 1.3), brick = M(0x8a4030, { flat: true }); for (const [x, z, w, d] of [[-0.6, 0, 0.14, 1.34], [0.6, 0, 0.14, 1.34], [0, -0.6, 1.34, 0.14], [0, 0.6, 1.34, 0.14]]) mesh(box(w, 2.6, d), brick, x, 5.1, z, ch);
      for (const [x, z, w, d] of [[-0.62, 0, 0.24, 1.5], [0.62, 0, 0.24, 1.5], [0, -0.62, 1.5, 0.24], [0, 0.62, 1.5, 0.24]]) mesh(box(w, 0.16, d), M(0xf4f8ff), x, 6.45, z, ch);
      const fc = put(santa(), ch, 0, 4.2, 0, 0.9), gf = put(present(0.4, 0x1f7a4a, 0xffd34d), fc.userData.armL, 0, -0.95, 0.1);
      const team = put(sleighTeam(1, monkey()), g, -2.6, 5.62, 0, 0.8, Math.PI / 2); team.userData.fc.visible = false; const tk = team.userData; delete team.userData.tick;
      const george = team.children[0].children[2]; const vl = []; for (let i = 0; i < 60; i++) vl.push([rnd(-30, 30), rnd(0.5, 3), rnd(-30, -12), pick([0xffc866, 0xffe0a0])]); g.add(twinkles(vl, 1.2, 1, 0.8));
      const pool = new Particles(200); g.add(pool.points);
      return (t, dt) => {
        const c = (t + 5) % 9, up = smooth(0.5, 1.6, c) * (1 - smooth(6.2, 7.2, c)); fc.position.y = 4.2 + up * 1.45; fc.rotation.y = Math.sin(t * 0.8) * 0.4 * up;
        fc.userData.armR.rotation.z = 0.35 + up * (2.1 + Math.sin(t * 6) * 0.35); gf.visible = c < 6.5;
        if (c > 7.2 && c < 7.6) pool.emit(2.7 + rnd(-0.3, 0.3), 6.5, 1.3 + rnd(-0.3, 0.3), rnd(-0.6, 0.6), rnd(1, 2.5), rnd(-0.6, 0.6), pick([0xffd34d, 0xffffff, 0xff6050]), 1.2, 0.9, 1.5);
        tk.deer.forEach((d, i) => { nod(d, t + i, 0.15, 1.2); d.userData.legs[0].rotation.z = Math.max(0, Math.sin(t * 2 + i * 2)) * 0.5; }); george.userData.wave(t); pool.update(dt);
      };
    },
  },
  { // 12
    t: 'A Partridge in a Pear Tree', s: 'Twelve gifts go round, two turtle doves go by, five gold rings go spinning — and the partridge thinks it all a great fuss.',
    col: [0xffd34d, 0x39d353], cam: [0, 3.2, 11], look: [0, 2.9, 0],
    build(g) {
      g.add(snowGround()); forest(g, 26, 12, 30); mesh(cyl(0.2, 0.32, 2.4, 8), M(0x5a3a22), 0, 1.2, 0, g);
      const fol = M(0x2f7a3a), tp = [];
      for (let i = 0; i < 11; i++) { const a = i * 2.4, r = i < 8 ? 1.0 : 0.3, x = Math.cos(a) * r, y = 3.2 + (i % 3) * 0.45 - 0.2 + (i >= 8 ? 0.8 : 0), z = Math.sin(a) * r; mesh(sph(rnd(0.75, 1.05), 12, 9), fol, x, y, z, g); }
      const pm = M(0xffc830, { m: 0.8, r: 0.2, e: 0xb07000, ei: 0.9 });
      for (let i = 0; i < 16; i++) { const a = rnd(TAU), y = rnd(2.4, 4.3), r = 1.75 - Math.abs(y - 3.3) * 0.5, p = grp(g, Math.cos(a) * r, y, Math.sin(a) * r); mesh(sph(0.14, 10, 8), pm, 0, 0, 0, p).scale.y = 1.15; mesh(sph(0.09, 8, 6), pm, 0, 0.14, 0, p); tp.push([p.position.x * 1.05, y + 0.3, p.position.z * 1.05, 0xfff0b0]); }
      g.add(twinkles(tp, 1.4, 2, 0.3)); const part = put(bird(0x9a8672, 0xd8b48a), g, 0, 4.72, 0.2, 1.7); light(0xffd070, 30, 16, 0, 3.5, 3, g);
      const ring = grp(g), gifts = []; for (let i = 0; i < 12; i++) { const [a, b] = GIFT[i % GIFT.length], p = put(present(0.5 + (i % 3) * 0.1, a, b), ring, Math.cos(i / 12 * TAU) * 4, 0, Math.sin(i / 12 * TAU) * 4); gifts.push(p); }
      const doves = [0, Math.PI].map((o) => ({ b: put(bird(0xffffff, 0xf0f0f0), g, 0, 0, 0, 1.3), o }));
      const rings = []; for (let i = 0; i < 5; i++) rings.push(mesh(tor(0.33, 0.05, 8, 24), M(0xffd34d, { m: 1, r: 0.15, e: 0xa06a00, ei: 1 }), 0, 0, 0, g));
      return (t) => {
        ring.rotation.y = t * 0.35; gifts.forEach((p, i) => { p.position.y = 0.5 + Math.sin(t * 1.6 + i * TAU / 3) * 0.45; p.scale.setScalar(easeBack(clamp(t * 0.8 - i * 0.25)) + 0.001); p.rotation.y = -t * 0.35 + i; });
        doves.forEach((d) => { const a = t * 0.7 + d.o; d.b.position.set(Math.cos(a) * 3.2, 5.2 + Math.sin(t * 1.3 + d.o) * 0.5, Math.sin(a) * 3.2); d.b.rotation.y = -a; d.b.userData.wings.forEach((w, i) => { w.rotation.z = Math.sin(t * 12) * 0.9 * (i ? 1 : -1); }); });
        rings.forEach((r, i) => { const a = -t * 0.5 + i * TAU / 5; r.position.set(Math.cos(a) * 2.2, 6 + Math.sin(t + i) * 0.2, Math.sin(a) * 2.2); r.rotation.set(t * 1.3 + i, t * 0.9, 0); r.scale.setScalar(smooth(3, 5, t) + 0.001); });
        part.userData.head.rotation.y = Math.round(Math.sin(t * 0.9)) * 0.7; part.position.y = 4.72 + Math.abs(Math.sin(t * 3)) * 0.03;
      };
    },
  },
];
