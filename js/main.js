import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  TAU, PX, rnd, pick, clamp, lerp, smooth, easeIO, easeOut, M, G, sph, box, cyl, cone, tor, mesh, grp, put, light, prism, star3d,
  halo, twinkles, starfield, snowfall, Particles, skyDome, aurora, moon, bethStar, beam, snowGround, groundY, pine, forest, gift, lampPost,
  sleighTeam, stable, manger, mary, joseph, sheep, highlandCow, nod,
} from './kit.js';
import { DW, DH, makeFragments, applyEffect, portalMaterial } from './doors.js';
import { DAYS, makeDay } from './days.js';
import { audio, tuneName } from './audio.js';
import { smoke, faceB, face } from './days-a.js';
import { snowman, moose, monkey, blobShadow } from './friends.js';
import { createGame } from './game.js';
import { createSwing } from './swing.js';
import { createCarol } from './carol.js';
import { validate as validateSongs } from './songs.js';

// ---------- date & saved state ----------
const params = new URLSearchParams(location.search), pd = params.get('date');
function today() {
  const m = pd && pd.match(/^(?:(\d{4})-)?(\d{1,2})-(\d{1,2})$/);
  return m ? new Date(+(m[1] ?? new Date().getFullYear()), m[2] - 1, +m[3], 12) : new Date();
}
const isDec = () => today().getMonth() === 11;
const canOpen = (n) => isDec() && n <= today().getDate();
const KEY = `advent-${today().getFullYear()}${pd ? '-preview' : ''}`;
let opened = new Set(); try { opened = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { /* storage unavailable */ }
let lastYear = new Set(); try { lastYear = new Set(JSON.parse(localStorage.getItem(`advent-${today().getFullYear() - 1}`) || '[]')); } catch { /* storage unavailable */ }
// Carol of the Doors: a door's carol is yours once you have opened it (last December's stay until the next one begins); two are always there to try
const carolOpen = (n) => n === 3 || n === 20 || params.has('allcarols') || (opened.has(n) && canOpen(n)) || (!isDec() && lastYear.has(n));
const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...opened])); } catch { /* ignore */ } };

// ---------- renderer ----------
const $ = (id) => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
let PR = Math.min(devicePixelRatio, 2); renderer.setPixelRatio(PR); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
$('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, 1, 0.1, 600);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 }));
const rp = new RenderPass(scene, camera), bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.65, 0.7, 0.88);
composer.addPass(rp); composer.addPass(bloom); composer.addPass(new OutputPass());

// ---------- the world outside ----------
const gy = (x, z) => groundY(x, z, 0.7);
scene.add(skyDome(0x050a26, 0x24407e)); scene.fog = new THREE.FogExp2(0x1c3068, 0.0065);
scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x39486e, 1.2)); const dl = new THREE.DirectionalLight(0xc4d4ff, 1.0); dl.position.set(-10, 16, 12); scene.add(dl);
scene.add(snowGround(160, 0.7), starfield(1500), snowfall(3200, 42, 30)); const aur = aurora(150, 44, 70, 0x35ffb0, 0x9050ff, 0.8, 2.8); scene.add(aur); moon(6, -34, 36, -110, scene);
forest(scene, 90, 13, 70, 0.7, (x, z) => !(z > 3 && Math.abs(x) < z * 0.8 + 17) && !(Math.abs(x) < 11 && z < 2 && z > -7));
const fx = new Particles(4000); scene.add(fx.points);
const pickables = [], WHITE = M(0xf4f8ff, { r: 0.95 }), GOLD = M(0xffd34d, { m: 0.85, r: 0.25, e: 0x6a4800 });

// The Advent House
const wallM = M(0x7a3b24, { r: 0.9 });
mesh(box(16.8, 12.1, 3), wallM, 0, 6.05, -1.5, scene); mesh(prism(19.4, 5.4, 4.7), WHITE, 0, 12.0, -1.5, scene); mesh(prism(18, 4.85, 4.74), wallM, 0, 12.0, -1.5, scene);
const rw = mesh(cyl(1.15, 1.15, 0.1, 40), G(0xffc860, 1.4), 0, 13.75, 0.88, scene); rw.rotation.x = Math.PI / 2; mesh(tor(1.18, 0.1, 8, 40), GOLD, 0, 13.75, 0.92, scene);
const gableStar = mesh(star3d(0.7, 0.12), G(0xfff0b0, 2.2), 0, 13.75, 1.0, scene); const roofStar = mesh(star3d(0.6, 0.16), G(0xffe070, 2.4), 0, 17.75, -1.5, scene); halo(0xffd050, 5, 0, 17.75, -1.5, scene, 0.7);
for (let i = 0; i < 46; i++) { const h = rnd(0.3, 0.9); mesh(cone(0.07, h, 5), M(0xdcecff, { r: 0.2, e: 0x8fb8ff, ei: 0.3 }), -9.2 + i * 0.41, 12.0 - h / 2, 0.75, scene).rotation.x = Math.PI; }
for (const sx of [-1, 1]) {
  for (let i = 0; i < 20; i++) mesh(cyl(0.32, 0.32, 0.61, 14), i % 2 ? WHITE : M(0xd0101c, { r: 0.5 }), sx * 8.45, 0.3 + i * 0.6, 0.12, scene);
  const ch = grp(scene, sx * 5.5, 15.2, -2.2); mesh(box(1.1, 2.6, 1.1), M(0x6a3020, { flat: true }), 0, 0, 0, ch); mesh(box(1.3, 0.22, 1.3), WHITE, 0, 1.4, 0, ch);
  for (let i = 0; i < 9; i++) mesh(sph(rnd(0.6, 1.1), 10, 8), WHITE, sx * rnd(1.5, 9.5), 0, rnd(0.2, 0.8), scene).scale.y = 0.45;
}
const smokes = [smoke(scene, -5.5, 16.8, -2.2), smoke(scene, 5.5, 16.8, -2.2)];
const LC = [0xff3b30, 0xffd34d, 0x39d353, 0x3aa0ff, 0xff7ad9, 0xffffff], fl = [];
for (let i = 0; i < 60; i++) { const f = i / 59, x = -9.6 + f * 19.2; fl.push([x, 12.05 - Math.abs(Math.sin(f * Math.PI * 12)) * 0.25, 0.95, LC[i % 6], 0.02 + 0.43 * Math.abs(f * 2 - 1)]); }
for (let i = 0; i < 64; i++) { const f = i / 63, x = -9.5 + f * 19, y = 12.15 + (1 - Math.abs(f - 0.5) * 2) * 5.35; fl.push([x, y, 0.9, LC[(i + 2) % 6], 0.5 + 0.45 * (1 - Math.abs(f * 2 - 1))]); }
const roofTw = twinkles(fl, 2.1, 2.2, 0.45); scene.add(roofTw); // each light also carries an order, so Carol of the Doors can light the roofline up along its length

// doors
const LAYOUT = [[10, 18, 4, 24, 7, 15], [2, 12, 17, 6, 21, 13], [16, 5, 23, 1, 9, 20], [8, 19, 3, 14, 22, 11]];
const HUES = [['#8f1220', '#5c0a14'], ['#1d6b3f', '#0f4226'], ['#23508f', '#13305c'], ['#6a2a7a', '#3f164a'], ['#0f6f6f', '#084545'], ['#8a5a14', '#55360a']];
function doorTex(n) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 316; const x = c.getContext('2d'), [a, b] = HUES[n % 6];
  const g = x.createLinearGradient(0, 0, 0, 316); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, 256, 316);
  x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 5; x.fillStyle = 'rgba(255,255,255,.06)';
  for (const [px, py, w, h] of [[22, 22, 96, 150], [138, 22, 96, 150], [22, 190, 96, 104], [138, 190, 96, 104]]) { x.fillRect(px, py, w, h); x.strokeRect(px, py, w, h); x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 2; x.strokeRect(px + 5, py + 5, w - 10, h - 10); x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 5; }
  x.strokeStyle = '#e8b83a'; x.lineWidth = 6; x.strokeRect(5, 5, 246, 306);
  x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.arc(128, 150, 74, 0, TAU); x.fill(); x.strokeStyle = '#ffd866'; x.lineWidth = 4; x.stroke();
  x.font = `700 ${n > 9 ? 96 : 110}px "Mountains of Christmas", Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffe9a0'; x.shadowColor = '#ffb020'; x.shadowBlur = 14; x.fillText(String(n), 128, 156);
  x.shadowBlur = 0; x.fillStyle = '#ffd866'; x.beginPath(); x.arc(222, 180, 8, 0, TAU); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const doors = [];
function buildDoors() {
  LAYOUT.forEach((row, j) => row.forEach((n, i) => {
    const x = (i - 2.5) * 2.62, y = 1.0 + j * 2.78, group = grp(scene, x, y, 0), def = DAYS[n - 1], tex = doorTex(n);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.3 });
    const solid = mesh(box(DW, DH, 0.09), mat, 0, DH / 2, 0.07, group), pm = portalMaterial(def.col[0], def.col[1]);
    const portal = mesh(new THREE.PlaneGeometry(DW, DH), pm, 0, DH / 2, 0.018, group);
    mesh(box(DW + 0.3, 0.14, 0.24), GOLD, 0, DH + 0.07, 0.06, group); for (const sx of [-1, 1]) mesh(box(0.14, DH, 0.24), GOLD, sx * (DW / 2 + 0.07), DH / 2, 0.06, group);
    mesh(box(DW + 0.5, 0.16, 0.42), WHITE, 0, -0.08, 0.14, group); mesh(box(DW + 0.4, 0.12, 0.34), WHITE, 0, DH + 0.2, 0.1, group);
    const d = { n, x, y, group, solid, portal, pm, mat, opened: opened.has(n) && canOpen(n), shake: -9 };
    solid.userData.door = portal.userData.door = d; if (d.opened) { solid.visible = false; pm.uniforms.uOpen.value = 0.35; thumbQueue.push(d); }
    doors.push(d); pickables.push(solid, portal);
  }));
}
const thumbQueue = [];
function setThumb(d, day) {
  d.rt ??= new THREE.WebGLRenderTarget(256, 316); const a = day.camera.aspect; day.camera.aspect = 256 / 316; day.camera.updateProjectionMatrix(); day.update(day.t ?? 7, 0);
  renderer.setRenderTarget(d.rt); renderer.render(day.scene, day.camera); renderer.setRenderTarget(null); day.camera.aspect = a; day.camera.updateProjectionMatrix();
  if (!d.tm) { d.tm = new THREE.MeshBasicMaterial({ map: d.rt.texture }); d.tm.color.setScalar(1.15); } d.portal.material = d.tm;
}

// friends in the snow
function friend(o, msg, hop = 0.8, sound = 0) { o.userData.y0 = o.position.y; o.userData.t0 = -9; o.userData.hop = hop; o.userData.click = () => { o.userData.t0 = T; toast(typeof msg === 'function' ? msg() : msg); audio.chime(sound); fxBurst(o, 40); }; pickables.push(o); return o; }
const fxBurst = (o, n) => { const p = o.getWorldPosition(new THREE.Vector3()); fx.burst(p.x, p.y + 1.5, p.z, n, 3, [0xffd34d, 0xffffff, 0x9fd4ff], 1.3, 1.1, 2); };
const sm1 = friend(put(snowman({ scarf: 0xc8102e }), scene, -10.0, gy(-10, 6), 6, 1.35, 0.45), 'The snowman tips his hat. “Not long now!”', 0.9, 1);
const sm2 = friend(put(snowman({ scarf: 0x39d353, hat: 'bobble' }), scene, -8.9, gy(-8.9, 7.9), 7.9, 0.8, 0.3), '“I’m only little, but I’m very good at waiting.”', 1.2, 3);
const lpL = put(lampPost(3.3), scene, -7.4, 0, 8.2), lpR = put(lampPost(3.3), scene, 7.4, 0, 8.2);
const george = friend(put(monkey(), scene, -7.4, 3.84, 8.2, 0.85, 0.3), () => pick(['George does a somersault!', '“Ooh ooh! Is it December yet?” asks George.', 'George waves both arms. And his tail.']), 1.1, 5);
george.userData.click = () => { audio.chime(5); fxBurst(george, 40); startGame('swing'); }; // George Swings
const mse = friend(faceB(put(moose(), scene, -13.1, gy(-13.1, 4), 4, 1.1), -4, 30), 'Monty the moose nods, slowly and wisely, as moose do. His antler lights twinkle.', 0.25, 0);
const cow = friend(faceB(put(highlandCow(), scene, 9.6, gy(9.6, 7.4), 7.4, 1.05), -2, 30), '“Mooo!” says Hamish the Highland cow, from somewhere under his fringe.', 0.3, 2);
mesh(tor(0.22, 0.05, 6, 14), M(0xc8102e), 0, -0.1, 0, cow.userData.neck).rotation.x = Math.PI / 2;
[[sm1, 1.5], [sm2, 0.9], [mse, 2.1], [cow, 1.8]].forEach(([o, r]) => put(blobShadow(r, 0.55), scene, o.position.x, o.position.y + 0.05, o.position.z));
for (let i = 0; i < 9; i++) { const sx = i % 2 ? 1 : -1; put(gift(rnd(0.5, 0.9)), scene, sx * rnd(9.4, 10.6), 0, rnd(1, 2.6), 1, rnd(2)); }
// nativity
const nat = grp(scene, 14.5, gy(14.5, 4.5), 4.5); nat.rotation.y = -0.5; nat.scale.setScalar(1.1); nat.add(stable()); put(manger(), nat, 0, 0, 0.35); put(mary(), nat, -0.8, 0, 0.3, 0.85, 0.9); put(joseph(), nat, 0.9, 0, 0.15, 1, -0.8);
put(sheep(), nat, -1.6, 0, 1.3, 1, 0.5); put(sheep(), nat, 1.5, 0, 1.4, 0.8, 2.4);
const star = bethStar(3.4, scene, 15, 14.5, 0); put(beam(11, 0.2, 2.6, 0xfff0c0, 0.09), scene, 15, 14.5, 0); star.userData.click = () => { toast('The star shines a little brighter.'); audio.chime(7); for (let i = 0; i < 6; i++) shoot(); }; pickables.push(star); mesh(sph(1.6), new THREE.MeshBasicMaterial({ visible: false }), 0, 0, 0, star);
nat.userData.click = () => { toast('Away in a manger, no crib for a bed…'); audio.tune(23); }; pickables.push(nat);
// Father Christmas in the sky
const team = sleighTeam(3); team.scale.setScalar(1.1); scene.add(team); mesh(sph(4.5), new THREE.MeshBasicMaterial({ visible: false }), 0, 1, 2.5, team);
team.userData.click = () => { audio.bells(); const p = team.position; fx.burst(p.x, p.y, p.z, 150, 7, [0xffd34d, 0xff5040, 0xffffff], 2, 1.6, 1.5); startGame(); }; pickables.push(team);
roofStar.userData.click = () => { audio.chime(6); fxBurst(roofStar, 60); startGame('carol'); }; pickables.push(roofStar); mesh(sph(1.3), new THREE.MeshBasicMaterial({ visible: false }), 0, 0, 0, roofStar); // Carol of the Doors
const SP = (a, v) => v.set(46 * Math.sin(a), 21 + 5 * Math.sin(a * 2 + 0.6), -34 + 22 * Math.cos(a)), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
const shoots = []; function shoot() { shoots.push({ x: rnd(-40, 40), y: rnd(26, 40), z: -60, vx: rnd(-22, 22), vy: rnd(-9, -4), life: rnd(0.8, 1.5) }); }

// ---------- UI ----------
let toastT; function toast(msg, ms = 3200) { const el = $('toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), ms); }
function status() {
  const d = today(), m = d.getMonth(), day = d.getDate(), el = $('status');
  if (m === 11) {
    if (day >= 25) el.textContent = 'Merry Christmas! Every door is open to you.';
    else { const left = doors.filter((x) => canOpen(x.n) && !x.opened).length; el.textContent = `${day} December · ` + (left ? `${left} door${left > 1 ? 's' : ''} waiting to be opened` : 'come back tomorrow for the next door'); }
  } else {
    const tgt = new Date(d.getFullYear() + (m === 11 ? 1 : 0), 11, 1), s = Math.max(0, Math.floor((tgt - d) / 1000)), dd = Math.floor(s / 86400), p = (n) => String(n).padStart(2, '0');
    el.textContent = `The first door opens in ${dd} day${dd === 1 ? '' : 's'} · ${p(Math.floor(s / 3600) % 24)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
  }
}
$('sound').onclick = () => { audio.unlock(); $('sound').classList.toggle('off', !audio.toggle()); $('sound').blur(); };
$('play').onclick = () => { $('play').blur(); startGame(); }; $('swing').onclick = () => { $('swing').blur(); startGame('swing'); }; $('carol').onclick = () => { $('carol').blur(); startGame('carol'); };
$('back').onclick = () => leaveDay(); addEventListener('keydown', (e) => { if (e.key === 'Escape') leaveDay(); });

// ---------- tweens & camera ----------
const tweens = []; const tween = (dur, fn) => new Promise((res) => tweens.push({ t: 0, dur, fn, res }));
const home = new THREE.Vector3(0, 7, 30), homeLook = new THREE.Vector3(0, 7.4, 0), camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
let mode = 'home', view = 'main', busy = false, cur = null, T = 0, mx = 0, my = 0, hover = null;
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h); composer.setSize(w, h); bloom.resolution.set(w, h); PX.value = (h * PR) / 900;
  camera.aspect = w / h; camera.updateProjectionMatrix(); if (cur) { cur.camera.aspect = w / h; cur.camera.updateProjectionMatrix(); } game?.resize(w / h);
  const tv = Math.tan((camera.fov * Math.PI) / 360); home.z = Math.max(10.5 / tv, 11.5 / (tv * camera.aspect)) + 1.5;
}
addEventListener('resize', resize);

// ---------- opening a door ----------
async function openDoor(d) {
  if (busy) return; busy = true; mode = 'seq'; audio.unlock(); document.body.classList.add('focus');
  const wp = new THREE.Vector3(d.x, d.y + DH / 2, 0.1), from = camera.position.clone(), to = new THREE.Vector3(d.x * 0.9, wp.y + 0.2, 7.4), def = DAYS[d.n - 1];
  await tween(1.5, (k) => { camPos.lerpVectors(from, to, easeIO(k)); camLook.lerpVectors(homeLook, wp, easeIO(k)); });
  if (!d.opened) {
    audio.magic(d.n); d.portal.material = d.pm; const frags = makeFragments(d.group, d.mat); d.solid.visible = false; d.mat.emissiveIntensity = 0.45;
    for (let i = 0; i < 90; i++) { const a = rnd(TAU); fx.emit(wp.x + Math.cos(a) * 0.9, wp.y + Math.sin(a) * 1.1, 0.3, Math.cos(a) * rnd(1, 4), Math.sin(a) * rnd(1, 4), rnd(0.5, 3), pick(def.col), rnd(0.8, 1.8), 1.2, 0.6); }
    await tween(3.4, (k) => {
      applyEffect(d.n, frags, k); d.pm.uniforms.uOpen.value = smooth(0, 0.5, k);
      for (let i = 0; i < 5; i++) { const f = pick(frags), p = f.m.getWorldPosition(v1); if (f.m.scale.x > 0.02) fx.emit(p.x, p.y, p.z + 0.1, rnd(-0.6, 0.6), rnd(-0.3, 1), rnd(0.2, 1.4), pick([...def.col, 0xffe9a0]), rnd(0.6, 1.4), rnd(0.5, 1.1), 0.5); }
    });
    frags.forEach((f) => { d.group.remove(f.m); f.m.geometry.dispose(); }); d.opened = true; opened.add(d.n); save();
  }
  $('fade').classList.add('on'); const z0 = camPos.z; await tween(0.9, (k) => { camPos.z = lerp(z0, 2.4, k * k); camPos.x = lerp(to.x, d.x, k); camPos.y = lerp(to.y, wp.y, k); });
  enterDay(d);
}
function enterDay(d) {
  const def = DAYS[d.n - 1]; cur = makeDay(d.n, innerWidth / innerHeight); cur.t = +params.get('t') || 0; cur.door = d; view = 'day'; rp.scene = cur.scene; rp.camera = cur.camera;
  $('num').textContent = d.n; $('title').textContent = def.t; $('text').textContent = def.s; $('tune').textContent = '♪ ' + tuneName(d.n) + ' · yours to play in Carol of the Doors';
  document.body.classList.add('day'); $('fade').classList.remove('on'); audio.tune(d.n);
}
async function leaveDay() {
  if (view !== 'day' || !cur || cur.leaving) return; cur.leaving = true; $('fade').classList.add('on'); document.body.classList.remove('day'); await tween(0.85, () => {});
  const d = cur.door; setThumb(d, cur); cur.dispose(); cur = null; view = 'main'; rp.scene = scene; rp.camera = camera; $('fade').classList.remove('on');
  const from = new THREE.Vector3(d.x * 0.9, d.y + DH / 2 + 0.2, 7.4), fl2 = new THREE.Vector3(d.x, d.y + DH / 2, 0.1);
  await tween(2.2, (k) => { camPos.lerpVectors(from, home, easeIO(k)); camLook.lerpVectors(fl2, homeLook, easeIO(k)); });
  mode = 'home'; busy = false; document.body.classList.remove('focus'); status();
}
function lockedDoor(d) {
  d.shake = T; audio.locked(); const dec = isDec();
  toast(dec ? `Not yet! Door ${d.n} opens on ${d.n} December.` : `Door ${d.n} is fast asleep until ${d.n} December.`);
  for (let i = 0; i < 26; i++) fx.emit(d.x + rnd(-0.8, 0.8), d.y + rnd(0, DH), 0.3, rnd(-0.5, 0.5), rnd(0.2, 1.4), rnd(0.3, 1.5), pick([0xffe9a0, 0xffffff, 0x9fd4ff]), rnd(0.6, 1.3), 0.9, 0.8);
}

// ---------- the games: Midnight Delivery (the sleigh), George Swings and Carol of the Doors (played on the house itself) ----------
const host = { scene, camera, camPos, camLook, doors, fx, shoot, friends: [sm1, sm2, george, mse, cow], roof: roofTw.userData.u, roofSize: 2.1, aur: aur.material.uniforms, aurGain: 0.8, unlocked: carolOpen, time: () => T, world: (dt) => updateMain(dt) };
let game = null; const games = {}, MAKE = { delivery: createGame, swing: createSwing, carol: (o) => createCarol({ song: +params.get('carol') || 0, diff: params.has('full') ? 1 : undefined, ...o, host }) };
const setPR = (p) => { PR = p; renderer.setPixelRatio(p); composer.setPixelRatio(p); resize(); };
const dayKey = () => { const d = today(); return params.get('seed') || `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const newGame = (kind = 'delivery', o = {}) => MAKE[kind]({ dom: renderer.domElement, audio, seed: dayKey(), onExit: leaveGame, setPR, getPR: () => PR, bot: params.has('bot'), adaptive: !STEPS, ...o });
function enterGame(kind = 'delivery') { game = games[kind] ??= newGame(kind); document.body.classList.toggle('swing', kind === 'swing'); document.body.classList.toggle('carol', kind === 'carol'); view = 'game'; rp.scene = game.scene; rp.camera = game.camera; resize(); game.start(); document.body.classList.add('game'); }
async function startGame(kind = 'delivery') {
  if (busy || view !== 'main') return; busy = true; mode = 'seq'; audio.unlock(); document.body.classList.add('focus');
  if (kind === 'carol') { camPos.copy(camera.position); camLook.copy(homeLook); return enterGame(kind); } // no journey: the camera just settles on the house front
  const sw = kind === 'swing', tgt = sw ? george.position.clone().setY(george.userData.y0 + 0.8) : team.position, from = camera.position.clone(), to = from.clone().lerp(tgt, sw ? 0.72 : 0.3); to.y += sw ? 0.6 : 4; // close in on George (or rise towards the sleigh), then slip through a snow cloud
  if (sw) setTimeout(() => { george.userData.t0 = T; }, 500); // one somersault for luck
  setTimeout(() => $('mist').classList.add('on'), 1150);
  await tween(1.6, (k) => { camPos.lerpVectors(from, to, easeIO(k)); camLook.lerpVectors(homeLook, tgt, easeIO(Math.min(1, k * 1.4))); });
  enterGame(kind); $('mist').classList.remove('on');
}
async function leaveGame() {
  if (game.inPlace) {
    game.stop(); view = 'main'; document.body.classList.remove('game', 'carol'); const from = camPos.clone(), fl2 = camLook.clone();
    await tween(1.4, (k) => { camPos.lerpVectors(from, home, easeIO(k)); camLook.lerpVectors(fl2, homeLook, easeIO(k)); });
    mode = 'home'; busy = false; document.body.classList.remove('focus'); status(); return;
  }
  $('mist').classList.add('on'); await tween(0.5, () => {});
  game.stop(); view = 'main'; rp.scene = scene; rp.camera = camera; resize(); document.body.classList.remove('game', 'swing'); $('mist').classList.remove('on');
  const from = new THREE.Vector3(0, 30, home.z + 8), fl2 = new THREE.Vector3(0, 34, -40);
  await tween(2.4, (k) => { camPos.lerpVectors(from, home, easeIO(k)); camLook.lerpVectors(fl2, homeLook, easeIO(k)); });
  mode = 'home'; busy = false; document.body.classList.remove('focus'); status();
}

// ---------- pointer ----------
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
function pickAt(e) {
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(pickables, true)[0]; if (!hit) return null; let o = hit.object;
  while (o) { if (o.userData.door) return { door: o.userData.door }; if (o.userData.click) return { obj: o }; o = o.parent; } return null;
}
let lastTrail = 0;
addEventListener('pointermove', (e) => {
  mx = (e.clientX / innerWidth) * 2 - 1; my = (e.clientY / innerHeight) * 2 - 1; if (view !== 'main' || mode !== 'home') return;
  const h = pickAt(e); hover = h?.door ?? null; renderer.domElement.style.cursor = h ? 'pointer' : 'default';
  if (T - lastTrail > 0.025) { lastTrail = T; const p = ray.ray.at(16, v1); fx.emit(p.x, p.y, p.z, rnd(-0.3, 0.3), rnd(-0.6, 0.1), rnd(-0.3, 0.3), pick([0xffe9a0, 0xffffff, 0xbfe0ff]), rnd(0.5, 1.1), rnd(0.35, 0.7), 0.6); }
});
renderer.domElement.addEventListener('click', (e) => {
  audio.unlock(); if (view !== 'main' || busy) return; const h = pickAt(e);
  if (h?.door) { const d = h.door; (d.opened || canOpen(d.n)) ? openDoor(d) : lockedDoor(d); } else if (h?.obj) h.obj.userData.click();
  else { const p = ray.ray.at(18, v1); fx.burst(p.x, p.y, p.z, 30, 2.5, [0xffe9a0, 0xffffff, 0x9fd4ff], 1.2, 0.9, 1); audio.chime(Math.floor(rnd(8))); }
});

// ---------- loop ----------
const ticks = []; let lastStatus = 0, thumbWait = 0;
const clock = new THREE.Clock(), STEPS = +params.get("steps") || 0; // steps: deterministic test stepping
function updateMain(dt) {
  for (const f of ticks) f(T, dt); smokes.forEach((s) => s(T));
  const a = T * 0.085 + 4.2; SP(a, v1); SP(a + 0.03, v2); team.position.copy(v1); team.lookAt(v2);
  v2.sub(v1).normalize(); for (let i = 0; i < 3; i++) fx.emit(v1.x - v2.x * rnd(1, 2.5), v1.y + rnd(0.3, 1), v1.z - v2.z * rnd(1, 2.5), rnd(-0.4, 0.4), rnd(-0.5, 0.2), rnd(-0.4, 0.4), pick([0xffd34d, 0xffffff, 0xff7050]), rnd(1.5, 3.5), rnd(0.8, 1.6), 0.2);
  if (Math.random() < 0.004) shoot();
  for (let i = shoots.length - 1; i >= 0; i--) { const s = shoots[i]; s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; fx.emit(s.x, s.y, s.z, 0, 0, 0, 0xffffff, 0.5, 2.2, 0); if (s.life < 0) shoots.splice(i, 1); }
  [sm1, sm2, george, mse, cow].forEach((o, i) => { const u = clamp((T - o.userData.t0) / 0.9); o.position.y = o.userData.y0 + Math.sin(u * Math.PI) * o.userData.hop; if (o === george) o.rotation.x = u < 1 ? u * TAU : 0; });
  sm1.userData.hat.position.y = 0.24 + Math.sin(clamp((T - sm1.userData.t0) / 0.9) * Math.PI) * 0.3; sm1.userData.armR.rotation.z = -2 - Math.sin(T * 1.5) * 0.2; sm2.rotation.z = Math.sin(T * 1.3) * 0.05;
  george.userData.wave(T); nod(mse, T, 0.1 + 0.5 * Math.sin(clamp((T - mse.userData.t0) / 0.9) * Math.PI), 0.6); nod(cow, T + 2, 0.1, 0.8);
  gableStar.rotation.z = T * 0.3; roofStar.rotation.y = T * 0.8;
  for (const d of doors) {
    const sh = clamp((T - d.shake) / 0.5); d.group.rotation.z = sh < 1 ? Math.sin(sh * 30) * 0.035 * (1 - sh) : 0;
    const ready = canOpen(d.n) && !d.opened; d.mat.emissiveIntensity = lerp(d.mat.emissiveIntensity, (hover === d ? 0.75 : 0.3) + (ready ? 0.3 + 0.25 * Math.sin(T * 3 + d.n) : 0), 0.15);
    d.pm.uniforms.uTime.value = T;
    if (ready && Math.random() < 0.03) fx.emit(d.x + rnd(-0.9, 0.9), d.y + rnd(0, DH), 0.25, 0, rnd(0.2, 0.6), rnd(0.1, 0.5), 0xffe9a0, 1.2, 0.7, 0);
  }
  if (thumbQueue.length && (thumbWait += dt) > 0.25 && mode === 'home') { thumbWait = 0; const d = thumbQueue.shift(), day = makeDay(d.n, 256 / 316); day.t = 7; setThumb(d, day); day.dispose(); }
  fx.update(dt);
  if (mode === 'home') { camera.position.set(home.x + mx * 2.2, home.y - my * 1.1 + Math.sin(T * 0.3) * 0.15, home.z); camera.lookAt(homeLook.x + mx * 0.5, homeLook.y - my * 0.3, 0); }
  else { camera.position.copy(camPos); camera.lookAt(camLook); }
  if (T - lastStatus > 1) { lastStatus = T; status(); }
}
function frame() { requestAnimationFrame(frame); if (!STEPS) tick(Math.min(clock.getDelta(), 0.05)); else composer.render(); }
function tick(dt) {
  T += dt;
  for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; tw.t += dt; const k = clamp(tw.t / tw.dur); tw.fn(k); if (k >= 1) { tweens.splice(i, 1); tw.res(); } }
  if (view === 'main') updateMain(dt); else if (view === 'game') game.update(dt); else if (cur) { cur.t += dt; cur.update(cur.t, dt, mx, my); }
  composer.render();
}

// ---------- start ----------
async function start() {
  try { await Promise.race([document.fonts.load('700 100px "Mountains of Christmas"'), new Promise((r) => setTimeout(r, 1800))]); } catch { /* fall back to Georgia */ }
  buildDoors(); scene.traverse((o) => { if (o.userData.tick) ticks.push(o.userData.tick); });
  resize(); status(); frame(); document.body.classList.add('ready');
  if (!isDec()) setTimeout(() => toast('Every door is sleeping until December — but the snow, the stars and a few friends are wide awake. Try clicking them.', 7000), 1500);
  const o = +params.get('open'); if (params.has('shot')) $('veil').remove();
  const ck = +params.get('click'); if (ck) setTimeout(() => openDoor(doors.find((x) => x.n === ck)), STEPS ? 0 : 600);
  if (STEPS) (async () => { for (let i = 0; i < STEPS; i++) { if (i === +params.get("leave")) leaveDay(); tick(0.05); await new Promise((r) => setTimeout(r, 0)); } })();
  if (params.has('game') || params.has('swing') || params.has('carol')) { busy = true; mode = 'seq'; document.body.classList.add('focus'); camPos.copy(home); camLook.copy(homeLook); enterGame(params.has('carol') ? 'carol' : params.has('swing') ? 'swing' : 'delivery'); }
  if (o >= 1 && o <= 24) { busy = true; mode = 'seq'; document.body.classList.add('focus'); const d = doors.find((x) => x.n === o); camPos.set(d.x, d.y + 1, 7.4); camLook.set(d.x, d.y + 1, 0); enterDay(d); }
}
window.__test = () => { const bad = []; for (let n = 1; n <= 24; n++) { try { const d = makeDay(n); for (const t of [0.1, 2, 5, 9]) d.update(t, 0.016); renderer.render(d.scene, d.camera); d.dispose(); } catch (e) { bad.push(n + ': ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]); } } return bad.length ? bad : 'all 24 ok'; };
// plays the game flat out with the autopilot (no rendering) and reports how the run went
window.__gameTest = (secs = 240, o = {}) => { const g = newGame(o.kind ?? 'delivery', { bot: true, adaptive: false, record: false, onExit() {}, ...o }); g.start(); let i = 0; for (; i < secs * 60 && g.stats.state !== 'over'; i++) g.update(1 / 60); const s = g.stats; g.stop(); return { ...s, frames: i }; };
// the same for George Swings, over several nights' forests: how far does the autopilot get in each?
window.__swingTest = (secs = 120, seeds = 8) => Array.from({ length: seeds }, (_, i) => window.__gameTest(secs, { kind: 'swing', seed: 'test' + i }));
// plays every carol at both difficulties with the autopilot (no sound) and reports any it cannot play perfectly
window.__carolTest = () => { const g = newGame('carol', { bot: true, mute: true, record: false, song: 0, onExit() {} }), out = []; g.start(); for (let n = 1; n <= 24; n++) for (const d of [0, 1]) { g.play(n, d); let i = 0; for (; i < 200 * 60 && g.stats.state !== 'over'; i++) g.update(1 / 60); const s = g.stats; if (s.state !== 'over' || s.misses || s.hits !== s.targets || s.stars !== 3) out.push(s); } g.stop(); return out.length ? out : 'all 24 carols ok'; };
window.__peek = () => game?.peek?.();
// renders n game frames back to back and reports the average cost of one (ms), GPU included
window.__gamePerf = (n = 120) => { const gl = renderer.getContext(), px = new Uint8Array(4), t0 = performance.now(); for (let i = 0; i < n; i++) { game.update(1 / 60); composer.render(); } gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const ms = (performance.now() - t0) / n; renderer.render(game.scene, game.camera); return { ms: +ms.toFixed(2), calls: renderer.info.render.calls, tris: renderer.info.render.triangles, pr: PR, w: innerWidth, h: innerHeight, stats: game.stats }; };
start().then(() => {
  if (!params.has('selftest')) return; const pre = document.createElement('pre'); pre.id = 'selftest'; document.body.appendChild(pre);
  setTimeout(() => { pre.textContent = 'SELFTEST ' + JSON.stringify({ scenes: window.__test(), songs: validateSongs(), errors: window.__errs }); }, 1500);
});
