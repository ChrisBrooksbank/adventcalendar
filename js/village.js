// My Village — every door opened in December brings a new building for a little snowy village of your own.
// Place each piece on the plot, turn it, move it about. Pieces are happier beside the neighbours they love
// (a bakery likes homes, a skating pond likes trees), and happy pieces add cheer: more cheer, more villagers out
// walking. Tomorrow's piece waits in the tray as a silhouette, with a hint of what it will love, so you can
// keep a good spot free for it.
import {
  THREE, TAU, rnd, pick, clamp, lerp, easeIO, easeBack, M, G, sph, box, rbox, cyl, cone, tor, mesh, grp, put, prism, star3d, halo,
  starfield, snowfall, skyDome, aurora, moon, light, pine, house, present, gift, lampPost, figure, walk, reindeer, horse, stable, Particles, groundTex,
} from './kit.js';
import { snowman } from './friends.js';
import { smoke, treeLights, topStar } from './days-a.js';

const N = 7, TS = 2.6, HALF = ((N - 1) * TS) / 2; // a 7 by 7 plot of 2.6-unit squares
const TAGS = { home: 'homes', food: 'food', play: 'fun', light: 'lights', nature: 'trees', water: 'water', faith: 'bells' };
const icon = { home: '🏠', food: '🥨', play: '⛸', light: '💡', nature: '🌲', water: '💧', faith: '🔔' };

// ---------- the pieces, one for each door ----------
// [name, its own tag, what it loves, builder]
const smokeOn = (g, ticks, x, y, z) => { ticks.push(smoke(g, x, y, z, 5)); };
const awning = (g, w, d, y, a = 0xc8102e, b = 0xffffff, z = 0) => { for (let i = 0; i < 6; i++) { const s = mesh(box(w / 6, 0.05, d), M(i % 2 ? b : a), -w / 2 + (i + 0.5) * w / 6, y, z, g); s.rotation.x = 0.25; } };
export const PIECES = [
  ['Cosy Cottage', 'home', 'light', (g, tk) => { const h = put(house({ color: 0xa86b4a }), g, 0, 0, 0, 0.55); smokeOn(g, tk, 0.4, 2.3, -0.25); return h; }],
  ['The Bakery', 'food', 'home', (g, tk) => {
    put(house({ color: 0xd8b48a, w: 3.2, attic: false }), g, 0, 0, 0, 0.55); awning(g, 1.0, 0.4, 0.95, 0x8a5a14, 0xf0e0c0, 1.0);
    const sign = mesh(tor(0.14, 0.04, 6, 14), M(0xc08040, { r: 0.6 }), 0.7, 1.15, 0.9, g); sign.scale.y = 0.8; smokeOn(g, tk, 0.45, 2.3, -0.25);
  }],
  ['Christmas Tree', 'light', 'home', (g) => { const t = put(pine(2.2, false), g, 0, 0, 0); treeLights(t, 2.2, 70, 6); topStar(t, 2.35, 0.2); for (let i = 0; i < 4; i++) put(gift(0.3), g, Math.cos(i * 1.6) * 0.6, 0, Math.sin(i * 1.6) * 0.6 + 0.2, 1, rnd(3)); }],
  ['Skating Pond', 'play', 'nature', (g, tk) => {
    mesh(cyl(1.05, 1.05, 0.05, 32), M(0x9fd0ee, { r: 0.08, m: 0.3, e: 0x204060, ei: 0.4 }), 0, 0.04, 0, g); mesh(tor(1.07, 0.1, 6, 32), M(0xf4f8ff), 0, 0.06, 0, g).rotation.x = Math.PI / 2;
    const sk = [0xc8102e, 0x2a5db0].map((c, i) => { const f = put(figure({ robe: c, head: 'bobble', hat: 0xffffff }), g, 0, 0.05, 0, 0.38); f.userData.i = i; return f; });
    tk.push((t) => sk.forEach((f, i) => { const a = t * 0.7 + i * Math.PI; f.position.set(Math.cos(a) * 0.6, 0.05, Math.sin(a) * 0.6); f.rotation.y = -a; f.rotation.z = Math.sin(t * 3 + i) * 0.1; f.userData.armL.rotation.z = -1.1; f.userData.armR.rotation.z = 1.1; }));
  }],
  ['Market Stall', 'food', 'home', (g) => {
    const wd = M(0x6b4a2a); for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(cyl(0.04, 0.04, 1.3, 6), wd, sx * 0.75, 0.65, sz * 0.4, g);
    mesh(rbox(1.6, 0.5, 0.7, 0.04), M(0x8a5a32), 0, 0.3, 0.05, g); awning(g, 1.7, 1.0, 1.35); for (let i = 0; i < 5; i++) put(gift(0.22), g, -0.6 + i * 0.3, 0.55, 0.15, 1, rnd(2));
    mesh(box(0.12, 0.16, 0.12), G(0xffc866, 1.8), 0.7, 1.1, 0.42, g); halo(0xffb050, 1.2, 0.7, 1.1, 0.42, g, 0.6);
  }],
  ['Lamp Posts', 'light', 'home', (g) => { for (const x of [-0.55, 0.55]) put(lampPost(1.6), g, x, 0, 0.1 * x); }],
  ['Snowman', 'play', 'play', (g) => { put(snowman({ scarf: 0x39d353, hat: 'bobble' }), g, 0, 0, 0, 0.65); }],
  ['Pine Copse', 'nature', 'water', (g) => { for (let i = 0; i < 5; i++) put(pine(rnd(1.4, 2.4)), g, Math.cos(i * 1.3) * 0.7, 0, Math.sin(i * 1.3) * 0.7); }],
  ['Village Well', 'water', 'home', (g) => {
    const st = M(0x8d8782, { flat: true }); mesh(cyl(0.5, 0.55, 0.6, 12), st, 0, 0.3, 0, g); mesh(cyl(0.42, 0.42, 0.62, 12, true), M(0x10141c), 0, 0.31, 0, g); mesh(tor(0.5, 0.06, 6, 16), M(0xf4f8ff), 0, 0.62, 0, g).rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) mesh(box(0.08, 1.1, 0.08), M(0x5a3a1c), sx * 0.45, 1.0, 0, g); mesh(cyl(0.05, 0.05, 1.0, 6), M(0x5a3a1c), 0, 1.25, 0, g).rotation.z = Math.PI / 2;
    mesh(prism(1.3, 0.5, 0.8), M(0x8a3a2a, { flat: true }), 0, 1.5, 0, g); mesh(prism(1.36, 0.54, 0.7), M(0xf4f8ff), 0, 1.52, 0, g); mesh(cyl(0.1, 0.08, 0.16, 8), M(0x6b4a2a), 0.1, 0.85, 0, g);
  }],
  ['Toy Shop', 'home', 'play', (g) => { put(house({ color: 0x7a2f9a }), g, 0, 0, 0, 0.55); put(present(0.45, 0xffd34d, 0xc8102e), g, 0, 2.05, 0.1); for (const sx of [-1, 1]) { const c = mesh(cyl(0.04, 0.04, 0.8, 6), M(0xffffff), sx * 0.95, 0.4, 0.9, g); mesh(tor(0.1, 0.04, 6, 10, Math.PI), M(0xc8102e), sx * 0.95 - 0.1 * sx, 0.8, 0.9, g).rotation.z = sx > 0 ? 0 : Math.PI; c.material.color.set(0xfff0f0); } }],
  ['Little Chapel', 'faith', 'light', (g) => {
    const wl = M(0xd8d0c0), rf = M(0x34446a, { flat: true }), sn = M(0xf4f8ff);
    mesh(box(1.2, 1.1, 1.7), wl, 0, 0.55, -0.15, g); mesh(prism(1.35, 0.7, 1.8), sn, 0, 1.1, -0.15, g); mesh(prism(1.25, 0.6, 1.82), rf, 0, 1.1, -0.15, g);
    mesh(box(0.6, 1.9, 0.6), wl, 0, 0.95, 0.75, g); mesh(cone(0.48, 1.0, 4), rf, 0, 2.4, 0.75, g).rotation.y = Math.PI / 4; mesh(star3d(0.13, 0.04), G(0xffe070, 2.2), 0, 3.05, 0.75, g);
    mesh(box(0.25, 0.42, 0.04), G(0xffc866, 1.8), 0, 1.4, 1.06, g); mesh(box(0.3, 0.5, 0.04), M(0x4a2a1a), 0, 0.25, 1.06, g);
    for (const sx of [-1, 1]) for (const z of [-0.6, 0.1]) mesh(box(0.04, 0.4, 0.22), G(0xffc866, 1.7), sx * 0.61, 0.6, z, g);
  }],
  ['Blue Cottage', 'home', 'light', (g, tk) => { put(house({ color: 0x3f6a94 }), g, 0, 0, 0, 0.55); smokeOn(g, tk, 0.4, 2.3, -0.25); }],
  ['Sledging Hill', 'play', 'nature', (g, tk) => {
    const hill = mesh(sph(1.1, 20, 12), M(0xeef3ff, { r: 0.95 }), 0, -0.2, 0, g); hill.scale.set(1.05, 0.85, 1.05);
    const sl = grp(g); mesh(box(0.42, 0.06, 0.22), M(0xc8102e), 0, 0.1, 0, sl); for (const sz of [-1, 1]) mesh(box(0.5, 0.03, 0.03), M(0xffd34d, { m: 0.8 }), 0, 0.03, sz * 0.1, sl);
    put(figure({ robe: 0x1f7a4a, head: 'bobble', hat: 0xc8102e }), sl, 0, 0.1, 0, 0.3);
    tk.push((t) => { const u = (t * 0.35) % 1, a = lerp(-0.2, 1.4, easeIO(u)); sl.position.set(Math.sin(a) * 0.95, Math.cos(a) * 0.95 * 0.85 - 0.12, 0); sl.rotation.z = -a * 0.9; });
  }],
  ['Bandstand', 'play', 'food', (g, tk) => {
    mesh(cyl(1.0, 1.05, 0.25, 8), M(0xe8e0d0), 0, 0.12, 0, g); for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + TAU / 16; mesh(cyl(0.035, 0.035, 1.1, 6), M(0x2f5a3a), Math.cos(a) * 0.9, 0.8, Math.sin(a) * 0.9, g); }
    mesh(cone(1.25, 0.7, 8), M(0x2f5a3a, { flat: true }), 0, 1.7, 0, g); mesh(cone(1.27, 0.6, 8), M(0xf4f8ff), 0, 1.78, 0, g);
    const ps = [0xc8102e, 0x2a5db0, 0xe0a020].map((c, i) => put(figure({ robe: c, head: 'tophat', hat: 0x1a1a22 }), g, Math.cos(i * 2.1) * 0.45, 0.25, Math.sin(i * 2.1) * 0.45, 0.42, i * 2.1));
    tk.push((t) => ps.forEach((p, i) => { p.userData.armR.rotation.z = 1.4 + Math.sin(t * 6 + i) * 0.4; p.position.y = 0.25 + Math.abs(Math.sin(t * 3 + i)) * 0.04; }));
  }],
  ['Chestnut Cart', 'food', 'play', (g, tk) => {
    mesh(rbox(1.0, 0.45, 0.6, 0.05), M(0x8a2a1a), 0, 0.55, 0, g); for (const sz of [-1, 1]) mesh(tor(0.28, 0.04, 6, 16), M(0x3a2414), -0.2, 0.3, sz * 0.33, g);
    mesh(cyl(0.25, 0.2, 0.2, 10), M(0x2a2a2e, { m: 0.6 }), 0.25, 0.9, 0, g); mesh(cyl(0.2, 0.2, 0.05, 10), G(0xff7020, 2), 0.25, 1.0, 0, g); halo(0xff8030, 1.4, 0.25, 1.05, 0, g, 0.6);
    for (const sx of [-1, 1]) mesh(cyl(0.025, 0.025, 1.0, 5), M(0x5a3a1c), sx * 0.45, 1.05, -0.25, g); awning(g, 1.05, 0.55, 1.55, 0x1f5a36, 0xffffff); smokeOn(g, tk, 0.25, 1.1, 0);
  }],
  ['Windmill', 'food', 'nature', (g, tk) => {
    mesh(cyl(0.4, 0.62, 2.0, 10), M(0xd8c8a8), 0, 1.0, 0, g); mesh(cone(0.52, 0.6, 10), M(0x6a3020), 0, 2.3, 0, g); mesh(cone(0.54, 0.4, 10), M(0xf4f8ff), 0, 2.42, 0, g);
    mesh(box(0.3, 0.45, 0.04), M(0x4a2a1a), 0, 0.23, 0.6, g); mesh(box(0.2, 0.25, 0.04), G(0xffc866, 1.8), 0, 1.3, 0.48, g);
    const hub = grp(g, 0, 1.95, 0.5); for (let i = 0; i < 4; i++) { const s = grp(hub); s.rotation.z = i * TAU / 4; mesh(box(0.05, 1.0, 0.03), M(0x5a3a1c), 0, 0.55, 0, s); mesh(box(0.22, 0.75, 0.02), M(0xf0e8d8), 0.12, 0.62, 0, s); }
    tk.push((t) => { hub.rotation.z = t * 0.8; });
  }],
  ['Reindeer Barn', 'nature', 'home', (g, tk) => { put(stable(), g, 0, 0, -0.3, 0.38); const r = put(reindeer(true), g, 0.1, 0, 0.55, 0.55, 0.3); tk.push((t) => { r.userData.neck.rotation.z = -r.userData.nk + Math.sin(t) * 0.15; }); }],
  ['Frozen Fountain', 'water', 'faith', (g) => {
    const st = M(0xc8ccd8, { r: 0.6 }), ice = M(0xbfe0ff, { r: 0.05, m: 0.3, e: 0x3a70b0, ei: 0.6 });
    mesh(cyl(0.95, 1.0, 0.3, 20), st, 0, 0.15, 0, g); mesh(cyl(0.85, 0.85, 0.05, 20), ice, 0, 0.29, 0, g); mesh(cyl(0.12, 0.16, 0.9, 10), st, 0, 0.7, 0, g); mesh(cyl(0.45, 0.2, 0.15, 14), st, 0, 1.15, 0, g);
    for (let i = 0; i < 10; i++) { const a = i * TAU / 10, c = mesh(cone(0.04, 0.25 + rnd(0.15), 5), ice, Math.cos(a) * 0.42, 1.0, Math.sin(a) * 0.42, g); c.rotation.x = Math.PI; }
    mesh(sph(0.12, 10, 8), ice, 0, 1.35, 0, g); halo(0x9fd4ff, 2.2, 0, 1.0, 0, g, 0.4);
  }],
  ['Post Office', 'home', 'light', (g) => {
    put(house({ color: 0x9a3a2e, attic: false }), g, 0, 0, 0, 0.55); const pb = grp(g, 0.75, 0, 0.95); mesh(cyl(0.12, 0.12, 0.6, 12), M(0xc8102e, { r: 0.4 }), 0, 0.3, 0, pb); mesh(sph(0.12, 12, 6, ), M(0xc8102e, { r: 0.4 }), 0, 0.6, 0, pb).scale.y = 0.6; mesh(box(0.14, 0.02, 0.02), M(0x1a1a1a), 0, 0.48, 0.12, pb);
    for (let i = 0; i < 3; i++) { const l = mesh(box(0.16, 0.11, 0.01), M(0xfff6e0), -0.4 + i * 0.12, 1.75 + i * 0.15, 0.6, g); l.rotation.z = rnd(-0.5, 0.5); }
  }],
  ['Carousel', 'play', 'food', (g, tk) => {
    const top = grp(g); mesh(cyl(1.0, 1.0, 0.18, 20), M(0xe8d0a0), 0, 0.09, 0, g); mesh(cyl(0.08, 0.08, 1.6, 8), M(0xffd34d, { m: 0.8 }), 0, 0.9, 0, top);
    mesh(cone(1.1, 0.6, 12), M(0xc8102e, { r: 0.5 }), 0, 1.95, 0, top); for (let i = 0; i < 6; i++) { const st = mesh(cone(1.11, 0.6, 12, ), M(0xffffff), 0, 1.95, 0, top); st.scale.set(0.12, 1.001, 1); st.rotation.y = i * TAU / 6; } mesh(tor(1.08, 0.06, 6, 24), M(0xffd34d, { m: 0.8 }), 0, 1.65, 0, top).rotation.x = Math.PI / 2;
    for (let i = 0; i < 12; i++) mesh(sph(0.05, 6, 5), G([0xffd34d, 0xff5050, 0x60c0ff][i % 3], 2), Math.cos(i * TAU / 12) * 1.05, 1.65, Math.sin(i * TAU / 12) * 1.05, top);
    const hs = [0, 1, 2, 3].map((i) => { const p = grp(top); p.rotation.y = i * TAU / 4; mesh(cyl(0.02, 0.02, 1.4, 5), M(0xffd34d, { m: 0.8 }), 0.72, 0.95, 0, p); const h = put(horse([0xffffff, 0x9a6436, 0x3a3a3a, 0xd8b080][i]), p, 0.72, 0.5, 0, 0.35, Math.PI / 2); return h; });
    tk.push((t) => { top.rotation.y = t * 0.6; hs.forEach((h, i) => { h.position.y = 0.45 + Math.sin(t * 2 + i * 1.6) * 0.15; }); });
  }],
  ['Gingerbread House', 'home', 'food', (g) => {
    put(house({ color: 0xa0602a, door: 0xffffff }), g, 0, 0, 0, 0.55); const ic = M(0xffffff, { r: 0.6 });
    for (let i = 0; i < 9; i++) mesh(sph(0.07, 8, 6), M([0xff3b30, 0x39d353, 0xffd34d, 0x3aa0ff][i % 4], { r: 0.3 }), -0.7 + i * 0.17, 1.62 - Math.abs(i - 4) * 0.13, 0.98, g);
    for (const sx of [-1, 1]) { const c = mesh(cyl(0.05, 0.05, 1.0, 8), M(0xfff0f0), sx * 0.95, 0.5, 0.95, g); mesh(tor(0.055, 0.02, 4, 12), ic, sx * 0.95, 0.3, 0.95, g).rotation.x = Math.PI / 2; c.rotation.z = sx * 0.05; }
  }],
  ['Snow Fort', 'play', 'play', (g) => {
    const sn = M(0xf2f6ff, { r: 0.95 }); for (let i = 0; i < 14; i++) { const a = i * TAU / 14; if (i === 3) continue; const b = mesh(rbox(0.38, 0.32, 0.3, 0.06), sn, Math.cos(a) * 0.85, 0.16 + (i % 2) * 0.02, Math.sin(a) * 0.85, g); b.rotation.y = -a; if (i % 3 === 0) mesh(rbox(0.32, 0.26, 0.26, 0.05), sn, Math.cos(a) * 0.85, 0.44, Math.sin(a) * 0.85, g).rotation.y = -a; }
    mesh(cyl(0.02, 0.02, 1.3, 5), M(0x5a3a1c), 0, 0.65, 0, g); const f = mesh(box(0.4, 0.25, 0.01), M(0xc8102e, { side: THREE.DoubleSide }), 0.2, 1.15, 0, g); f.userData.flag = true;
    for (let i = 0; i < 6; i++) mesh(sph(0.09, 8, 6), sn, rnd(-0.4, 0.4), 0.09, rnd(-0.4, 0.4), g);
  }],
  ['The Inn', 'home', 'light', (g, tk) => {
    put(house({ color: 0x7a5a6a, h: 3.2, w: 3.4 }), g, 0, 0, 0, 0.5); const s = grp(g, 1.0, 1.15, 0.9); mesh(box(0.5, 0.03, 0.03), M(0x1c1c22), -0.1, 0.25, 0, s); const sg = mesh(rbox(0.36, 0.26, 0.04, 0.03), M(0x1f5a36), 0.05, 0.08, 0, s);
    mesh(star3d(0.08, 0.02), G(0xffe070, 2), 0.05, 0.08, 0.03, s); smokeOn(g, tk, 0.42, 2.5, -0.25); tk.push((t) => { sg.rotation.x = Math.sin(t * 1.3) * 0.15; });
  }],
  ['The Great Tree', 'light', '*', (g) => { const t = put(pine(3.4, false), g, 0, 0, 0); treeLights(t, 3.4, 130, 8); topStar(t, 3.6, 0.3); for (let i = 0; i < 7; i++) put(gift(rnd(0.25, 0.4)), g, Math.cos(i * 0.9) * 0.85, 0, Math.sin(i * 0.9) * 0.85, 1, rnd(3)); }],
];
export const pieceName = (n) => PIECES[n - 1][0];
const loves = (n) => PIECES[n - 1][2];
const lovesText = (n) => (loves(n) === '*' ? 'loves every neighbour' : `loves ${TAGS[loves(n)]} nearby ${icon[loves(n)]}`);

export function createVillage({ dom, audio, onExit, host }) {
  const $ = (id) => document.getElementById(id), SAVE = host.saveKey;
  // ---------- the scene ----------
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
  scene.add(skyDome(0x050a26, 0x2a4a8e)); scene.fog = new THREE.FogExp2(0x1c3068, 0.012);
  scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x39486e, 1.3)); const dl = new THREE.DirectionalLight(0xc4d4ff, 1.1); dl.position.set(-10, 16, 12); scene.add(dl);
  scene.add(starfield(900), snowfall(1200, 26, 18)); scene.add(aurora(120, 34, 50, 0x35ffb0, 0x9050ff, 0.7, 2.6)); moon(5, -30, 34, -90, scene);
  const gtex = groundTex(); mesh(new THREE.PlaneGeometry(260, 260).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc2d0ee, roughness: 0.95, map: gtex }), 0, 0, 0, scene);
  for (let i = 0; i < 70; i++) { const a = rnd(TAU), r = rnd(HALF + 5, 60); put(pine(rnd(2.5, 6)), scene, Math.cos(a) * r, 0, Math.sin(a) * r); }
  // the plot: a low snowy border and a faint grid of squares
  const plot = grp(scene); mesh(new THREE.PlaneGeometry(N * TS, N * TS).rotateX(-Math.PI / 2), M(0xdfe8fa, { r: 0.95 }), 0, 0.01, 0, plot);
  for (let i = 0; i < 40; i++) { const k = i / 40, side = Math.floor(k * 4), u = (k * 4) % 1, e = (N * TS) / 2 + 0.3, x = side % 2 ? (side === 1 ? e : -e) : lerp(-e, e, u), z = side % 2 ? lerp(-e, e, u) : (side === 0 ? -e : e); mesh(sph(0.45, 8, 6), M(0xf4f8ff), x, 0, z, plot).scale.y = 0.45; }
  const lineM = new THREE.LineBasicMaterial({ color: 0x8fa6d8, transparent: true, opacity: 0.45 }), pts = [];
  for (let i = 0; i <= N; i++) { const v = -N * TS / 2 + i * TS, e = N * TS / 2; pts.push(-e, 0.03, v, e, 0.03, v, v, 0.03, -e, v, 0.03, e); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); const grid = new THREE.LineSegments(lg, lineM); plot.add(grid);
  const cursor = mesh(new THREE.PlaneGeometry(TS * 0.94, TS * 0.94).rotateX(-Math.PI / 2), G(0xffe9a0, 1.2, { o: 0.35, add: true }), 0, 0.04, 0, scene); cursor.visible = false;
  const pick1 = mesh(tor(TS * 0.46, 0.05, 6, 40).rotateX(Math.PI / 2), G(0xffd34d, 2.2, { add: true, o: 1 }), 0, 0.08, 0, scene); pick1.visible = false;
  const fx = new Particles(1500); scene.add(fx.points);
  const tileOf = (x, z) => [Math.round((x + HALF) / TS), Math.round((z + HALF) / TS)], at = (i) => -HALF + i * TS;

  // ---------- state ----------
  let layout = {}; try { layout = JSON.parse(localStorage.getItem(SAVE) || '{}'); } catch { /* storage unavailable */ }
  const saveLayout = () => { try { localStorage.setItem(SAVE, JSON.stringify(layout)); } catch { /* ignore */ } };
  const built = new Map(); // n -> { g, ticks, glow }
  let selected = 0, active = false, T = 0, yaw = 0.6, yawTo = 0.6, dist = 22, distTo = 22, focus = new THREE.Vector3(0, 0, 0), villagers = [], cheerShown = -1;
  const owned = () => Array.from({ length: 24 }, (_, i) => i + 1).filter((n) => host.unlocked(n));
  const occupant = (i, j) => { for (const k in layout) if (layout[k][0] === i && layout[k][1] === j) return +k; return 0; };

  // cheer: every piece is worth one, plus one for each kind of neighbour it loves (up to two); the Great Tree loves everyone
  function cheerOf(n) {
    const [i, j] = layout[n], seen = new Set(); let k = 0;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const o = occupant(i + di, j + dj); if (!o) continue; if (loves(n) === '*') k++; else if (PIECES[o - 1][1] === loves(n) && !seen.has(o)) { seen.add(o); k++; } }
    return 1 + Math.min(loves(n) === '*' ? 4 : 2, k);
  }
  const totalCheer = () => Object.keys(layout).reduce((a, n) => a + cheerOf(+n), 0);

  function build(n) {
    const g = grp(scene), ticks = []; PIECES[n - 1][3](g, ticks);
    g.traverse((o) => { if (o.userData.tick) ticks.push(o.userData.tick); });
    const glow = halo(0xffd870, 3.2, 0, 0.3, 0, g, 0); built.set(n, { g, ticks, glow, pop: T }); place(n); return g;
  }
  function place(n) { const b = built.get(n), [i, j, r] = layout[n]; b.g.position.set(at(i), 0, at(j)); b.g.rotation.y = (r ?? 0) * Math.PI / 2; }
  function unbuild(n) { const b = built.get(n); if (!b) return; scene.remove(b.g); b.g.traverse((o) => { o.geometry?.dispose?.(); }); built.delete(n); }

  // villagers come out as the village grows cheerful: one for every three cheer, up to twelve
  const ROBES = [0xc8102e, 0x2a5db0, 0x1f7a4a, 0x7a2f9a, 0xe0a020, 0x0f8a8a, 0x8a5a14];
  function people() {
    const want = Math.min(12, Math.floor(totalCheer() / 3)), spots = Object.keys(layout).map(Number);
    while (villagers.length > want) { const v = villagers.pop(); scene.remove(v.f); }
    while (villagers.length < want && spots.length) {
      const f = put(figure({ robe: pick(ROBES), head: pick(['bobble', 'tophat', 'bonnet']), hat: pick([0xffffff, 0xc8102e, 0x1a1a22, 0x39d353]), scarf: pick([0xc8102e, 0x39d353, 0xffd34d]) }), scene, 0, 0, 0, 0.42);
      const v = { f, from: new THREE.Vector3(), to: new THREE.Vector3(), u: 1, sp: rnd(0.8, 1.2) }; villagers.push(v); hop(v, true);
    }
  }
  function hop(v, first) { // stroll to a square beside some piece
    const spots = Object.keys(layout).map(Number); if (!spots.length) return; const [i, j] = layout[pick(spots)];
    v.from.copy(first ? new THREE.Vector3(at(i) + TS * 0.45, 0, at(j) + TS * 0.45) : v.f.position); v.to.set(at(i) + rnd(-0.5, 0.5) * TS + TS * 0.5 * (Math.random() < 0.5 ? -1 : 1), 0, at(j) + TS * 0.5); v.u = 0;
  }

  // ---------- UI ----------
  const ui = document.createElement('div'); ui.id = 'v-ui'; ui.className = 'ui';
  ui.innerHTML = `<div id="v-top"><div id="v-title">My Village</div><div id="v-cheer"></div><div id="v-hint"></div></div>
    <div id="v-tools"><button class="pill" id="v-rl" aria-label="Turn the view left">⟲</button><button class="pill" id="v-turn">Turn piece</button><button class="pill" id="v-away">Put away</button><button class="pill" id="v-rr" aria-label="Turn the view right">⟳</button></div>
    <div id="v-tray"></div>`;
  document.body.appendChild(ui);
  const css = document.createElement('style'); css.textContent = `
    #v-ui { inset: 0; opacity: 0; transition: opacity .6s; } body.village #v-ui { opacity: 1; } body.village #g-top, body.village #g-card { display: none; }
    #v-top { position: absolute; top: clamp(8px, 1.6vh, 18px); left: 50%; transform: translateX(-50%); width: min(92vw, 560px); text-align: center; text-shadow: 0 2px 14px rgba(0,10,40,.9); }
    #v-title { font: 700 clamp(30px, 5vh, 50px)/1 "Mountains of Christmas", Georgia, serif; color: var(--gold); }
    #v-cheer { margin-top: 4px; font-size: clamp(16px, 2.3vh, 21px); color: #fff6dc; } #v-hint { margin-top: 4px; font-style: italic; color: #cfdaff; font-size: clamp(14px, 2vh, 18px); min-height: 1.3em; text-wrap: balance; }
    #v-tools { position: absolute; left: 0; right: 0; bottom: calc(clamp(96px, 15vh, 130px) + 8px); display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; padding: 0 16px; }
    body.village #v-tools .pill, body.village #v-tray .vp { pointer-events: auto; } #v-tools .pill { padding: 7px 16px; } #v-turn, #v-away { display: none; } #v-ui.sel #v-turn, #v-ui.sel.placed #v-away { display: inline-block; }
    #v-tray { position: absolute; left: 0; right: 0; bottom: 0; height: clamp(96px, 15vh, 130px); display: flex; gap: 8px; overflow-x: auto; padding: 8px 16px 14px; background: linear-gradient(to top, rgba(4,7,26,.85), rgba(4,7,26,0)); scroll-snap-type: x proximity; }
    .vp { flex: 0 0 auto; width: clamp(104px, 15vh, 128px); scroll-snap-align: start; border-radius: 14px; border: 1px solid rgba(255,226,160,.45); background: rgba(8,14,44,.7); color: #fff6dc; font: 500 15px/1.15 "Cormorant Garamond", serif; padding: 6px 8px; text-align: left; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; }
    .vp b { font: 700 17px/1.05 "Mountains of Christmas", Georgia, serif; color: var(--gold); } .vp small { color: #b9c8f5; font-style: italic; } .vp i { font-style: normal; color: #ffe9a0; }
    .vp.on { background: rgba(255,226,160,.25); border-color: var(--gold); box-shadow: 0 0 18px rgba(255,200,100,.5); } .vp.new { animation: glow 2.4s ease-in-out infinite; }
    .vp.ghost { opacity: .6; border-style: dashed; cursor: default; } .vp.ghost b { color: #b9c8f5; }
    .vp:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }`;
  document.head.appendChild(css);

  function hint(text) { $('v-hint').textContent = text; }
  function refreshTray() {
    const tray = $('v-tray'), own = owned(), unplaced = own.filter((n) => !layout[n]), placed = own.filter((n) => layout[n]);
    let html = unplaced.map((n) => `<button class="vp${selected === n ? ' on' : ''}${host.isNew?.(n) ? ' new' : ''}" data-n="${n}"><b>${pieceName(n)}</b><small>${lovesText(n)}</small><i>Door ${n} · tap to place</i></button>`).join('');
    const nx = host.next?.(); if (nx) html += `<div class="vp ghost" aria-label="Tomorrow's piece"><b>Tomorrow…</b><small>${lovesText(nx)}</small><i>Door ${nx} · keep a spot free?</i></div>`;
    if (!own.length) html = `<div class="vp ghost" style="width:auto;max-width:520px"><b>Your village is waiting</b><small>Every door you open in December brings a new building for it. Place them, and keep good neighbours together.</small></div>`;
    tray.innerHTML = html; tray.querySelectorAll('button.vp').forEach((b) => { b.onclick = () => { audio.chime(+b.dataset.n); select(selected === +b.dataset.n ? 0 : +b.dataset.n); }; });
    const c = totalCheer(); $('v-cheer').textContent = placed.length ? `✦ Village cheer ${c} · ${placed.length} of 24 built · ${villagers.length} villager${villagers.length === 1 ? '' : 's'} out walking` : own.length ? 'Pick a piece below, then tap a square to build it' : '';
    if (c > cheerShown && cheerShown >= 0) { audio.twinkle(c); } cheerShown = c;
  }
  function select(n) {
    selected = n; ui.classList.toggle('sel', !!n); ui.classList.toggle('placed', !!(n && layout[n]));
    hint(n ? `${pieceName(n)}: ${lovesText(n)}. ${layout[n] ? 'Tap an empty square to move it.' : 'Tap an empty square to build it.'}` : owned().length ? 'Tap a building to move it · drag to look around' : '');
    refreshTray(); markPick();
  }
  function markPick() { const b = selected && built.get(selected); pick1.visible = !!b; if (b) pick1.position.set(b.g.position.x, 0.08, b.g.position.z); }

  // ---------- pointer ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), groundP = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  let down = null;
  function tileAt(e) { ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); if (!ray.ray.intersectPlane(groundP, hit)) return null; const [i, j] = tileOf(hit.x, hit.z); return i >= 0 && j >= 0 && i < N && j < N ? [i, j] : null; }
  function onDown(e) { if (!active || e.target !== dom) return; down = { x: e.clientX, y: e.clientY, yaw, moved: false, id: e.pointerId }; try { dom.setPointerCapture(e.pointerId); } catch { /* ignore */ } }
  function onMove(e) {
    if (!active) return;
    if (down && e.pointerId === down.id) { const dx = e.clientX - down.x; if (Math.abs(dx) > 8) down.moved = true; if (down.moved) yawTo = yaw = down.yaw - dx * 0.008; }
    const t = tileAt(e); cursor.visible = !!t && !!selected && !down?.moved; if (t) cursor.position.set(at(t[0]), 0.04, at(t[1]));
    if (t) cursor.material.color.set(occupant(t[0], t[1]) && occupant(t[0], t[1]) !== selected ? 0xff8070 : 0xffe9a0).multiplyScalar(1.2);
  }
  function onUp(e) {
    if (!active || !down || e.pointerId !== down.id) return; const wasDrag = down.moved; down = null; if (wasDrag) return;
    const t = tileAt(e); if (!t) return; const o = occupant(t[0], t[1]);
    if (selected && !o) { // build here (or move here)
      const fresh = !layout[selected]; layout[selected] = [t[0], t[1], layout[selected]?.[2] ?? 0]; saveLayout();
      if (fresh) { build(selected); host.placed?.(selected); } else place(selected);
      const p = built.get(selected).g.position; fx.burst(p.x, 1, p.z, 70, 3, [0xffd34d, 0xffffff, 0x9fd4ff], 1.3, 1.2, 2); audio.magic(selected); built.get(selected).pop = T;
      const n = selected, c = cheerOf(n); select(0); people(); refreshTray(); hint(c > 1 ? `${pieceName(n)} is happy here: +${c - 1} cheer from its neighbours!` : `${pieceName(n)} is built. It ${lovesText(n).replace('loves', 'would love')}.`);
      return;
    }
    if (o) { audio.chime(o); select(selected === o ? 0 : o); return; }
    select(0);
  }
  function onWheel(e) { if (!active) return; e.preventDefault(); distTo = clamp(distTo * (e.deltaY > 0 ? 1.1 : 0.9), 13, 40); }
  function onKey(e) { if (!active) return; if (e.key === 'Escape') exit(); if (e.key === 'ArrowLeft') yawTo -= Math.PI / 4; if (e.key === 'ArrowRight') yawTo += Math.PI / 4; if ((e.key === 'r' || e.key === 'R') && selected && layout[selected]) turn(); }
  function turn() { layout[selected][2] = ((layout[selected][2] ?? 0) + 1) % 4; saveLayout(); place(selected); audio.chime(2); }
  const LISTEN = [[dom, 'pointerdown', onDown], [window, 'pointermove', onMove], [window, 'pointerup', onUp], [dom, 'wheel', onWheel], [window, 'keydown', onKey]];
  function exit() { if (!active || exit.busy) return; exit.busy = true; onExit?.(); }

  // ---------- life ----------
  function start() {
    if (active) return; active = true; exit.busy = false; document.body.classList.add('village');
    LISTEN.forEach(([t, ev, f]) => t.addEventListener(ev, f, { passive: false })); $('g-quit').onclick = exit;
    $('v-rl').onclick = () => { yawTo -= Math.PI / 4; }; $('v-rr').onclick = () => { yawTo += Math.PI / 4; };
    $('v-turn').onclick = () => { if (selected && layout[selected]) turn(); else hint('Build it first, then you can turn it.'); };
    $('v-away').onclick = () => { if (!selected || !layout[selected]) return; unbuild(selected); delete layout[selected]; saveLayout(); audio.pff(); const n = selected; select(0); people(); hint(`${pieceName(n)} is back in the tray.`); };
    for (const k of Object.keys(layout)) { const n = +k; if (!host.unlocked(n)) continue; if (!built.has(n)) build(n); } // (a preview's layout can name pieces this calendar has not opened)
    for (const n of [...built.keys()]) if (!layout[n] || !host.unlocked(n)) unbuild(n);
    people(); select(0); const fresh = owned().filter((n) => !layout[n]); if (fresh.length) select(fresh[fresh.length - 1]);
    dist = 30; distTo = innerWidth < innerHeight ? 26 : 19; audio.chime(4);
  }
  function stop() { active = false; document.body.classList.remove('village'); LISTEN.forEach(([t, ev, f]) => t.removeEventListener(ev, f)); cursor.visible = false; dom.style.cursor = 'default'; }
  function update(dt) {
    T += dt; yaw = lerp(yaw, yawTo, Math.min(1, dt * 6)); dist = lerp(dist, distTo, Math.min(1, dt * 3));
    camera.position.set(focus.x + Math.sin(yaw) * dist, dist * 0.6, focus.z + Math.cos(yaw) * dist); camera.lookAt(focus.x, -1.2, focus.z);
    for (const [n, b] of built) {
      for (const f of b.ticks) f(T, dt);
      const k = clamp((T - b.pop) / 0.6); b.g.scale.setScalar(Math.max(0.01, easeBack(k)));
      const happy = cheerOf(n) - 1; b.glow.material.opacity = happy ? 0.12 + 0.08 * happy + 0.05 * Math.sin(T * 2 + n) : 0; // happy pieces glow warmly
      if (happy && Math.random() < 0.01 * happy) fx.emit(b.g.position.x + rnd(-1, 1), rnd(0.5, 2), b.g.position.z + rnd(-1, 1), 0, rnd(0.2, 0.6), 0, pick([0xffe9a0, 0xffffff]), 1, 0.6, 0);
    }
    for (const v of villagers) {
      v.u += dt * 0.25 * v.sp / Math.max(0.5, v.from.distanceTo(v.to) / 3);
      if (v.u >= 1) { if (v.u > 1.6) hop(v); else { v.f.userData.body.position.y = 0; continue; } }
      v.f.position.lerpVectors(v.from, v.to, Math.min(1, v.u)); v.f.rotation.y = Math.atan2(v.to.x - v.from.x, v.to.z - v.from.z); walk(v.f, T * v.sp, 6, 0.5);
    }
    pick1.material.opacity = 0.6 + 0.4 * Math.sin(T * 5); markPick();
    fx.update(dt);
  }
  function resize(a) { camera.aspect = a; camera.updateProjectionMatrix(); }
  return { scene, camera, start, stop, update, resize, stats: {}, get cheer() { return totalCheer(); } };
}
