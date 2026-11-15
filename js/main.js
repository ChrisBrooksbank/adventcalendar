import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import {
  TAU, PX, U, rnd, pick, clamp, lerp, smooth, easeIO, easeOut, M, G, sph, box, cyl, cone, tor, mesh, grp, put, light, prism, star3d,
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
import { createBand, glockenspiel } from './band.js';
import { HURON } from './tunes.js';
import { Q, initLook, GradeShader, HOME_GRADE, applyGrade, tierUniforms, portalRig, captureLoop, windowMaterial, watchFrames, resetWatch, LW } from './look.js';
import { createSky, streak, RIDDLES } from './stars.js';

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
// The Friends' Concert: the Huron Carol is always on the programme, and each day of December adds that day's carol
const setlist = () => [HURON, ...Array.from({ length: 24 }, (_, i) => i + 1).filter((n) => params.has('allcarols') || canOpen(n))];
const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...opened])); } catch { /* ignore */ } };
// Twenty-Four Stars: which doors' stars are home in the sky, and whether Christmas Eve's finale has played
let found = new Set(); try { found = new Set(JSON.parse(localStorage.getItem(KEY + '-stars') || '[]')); } catch { /* storage unavailable */ }
let finaleDone = false; try { finaleDone = localStorage.getItem(KEY + '-finale') === '1'; } catch { /* storage unavailable */ }
const saveStars = () => { try { localStorage.setItem(KEY + '-stars', JSON.stringify([...found])); localStorage.setItem(KEY + '-finale', finaleDone ? '1' : '0'); } catch { /* ignore */ } };
const dayOfDec = () => (isDec() ? today().getDate() : 0);
const tomorrow = () => { const d = dayOfDec(); return d >= 1 && d < 24 && opened.has(d) ? d + 1 : 0; }; // its keyhole glows once today's door is open

// ---------- renderer ----------
const $ = (id) => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
let PR = Math.min(devicePixelRatio, Q.tier === 0 ? 1 : 2); renderer.setPixelRatio(PR); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
$('stage').appendChild(renderer.domElement); initLook(renderer);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, 1, 0.1, 600);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 }));
const rp = new RenderPass(scene, camera), bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.65, 0.7, 0.88), grade = new ShaderPass(GradeShader), GU = grade.uniforms;
composer.addPass(rp); composer.addPass(bloom); composer.addPass(grade); composer.addPass(new OutputPass());
tierUniforms(GU); applyGrade(GU, HOME_GRADE, 1, 0.22);

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
const gableStar = mesh(star3d(0.7, 0.12), G(0xfff0b0, 2.2), 0, 13.75, 1.0, scene); const roofStar = mesh(star3d(0.6, 0.16), G(0xffe070, 2.4), 0, 17.75, -1.5, scene), roofHalo = halo(0xffd050, 5, 0, 17.75, -1.5, scene, 0.7);
const ROOF_C = roofStar.material.color.clone(); let roofLvl = 1, roofBoost = 0;
// the roof star is out from 1 December until its constellation brings the light home on Christmas Eve
const roofWant = () => (isDec() && !finaleDone && today().getDate() < 25 ? 0.22 + 0.4 * (found.size / 24) : 1);
const sky = createSky(scene), streaks = [];
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
    const d = { n, x, y, group, solid, portal, pm, mat, opened: opened.has(n) && canOpen(n), shake: -9, flash: -9 };
    solid.userData.door = portal.userData.door = d; if (d.opened) { solid.visible = false; pm.uniforms.uOpen.value = 0.35; thumbQueue.push(d); }
    // tomorrow's door: light leaking out underneath, and a keyhole to peek through
    const kh = grp(group, 0, DH * 0.36, 0.13), ks = new THREE.Shape(); ks.absarc(0, 0.05, 0.075, -0.35, Math.PI + 0.35, false); ks.lineTo(-0.06, -0.16); ks.lineTo(0.06, -0.16); ks.closePath();
    d.keyM = G(0xffd080, 2.6, { o: 1 }); mesh(new THREE.ShapeGeometry(ks), d.keyM, 0, 0, 0, kh); d.keyHalo = halo(0xffb040, 1.4, 0, 0, 0.05, kh, 0.6);
    d.leak = halo(0xffc060, 1, 0, 0.04, 0.24, group, 0.7); d.leak.scale.set(DW * 1.6, 0.35, 1); d.key = kh;
    doors.push(d); pickables.push(solid, portal);
  }));
}
// opened doors become living windows: a few seconds of their world, filmed when you leave (or when the house loads)
const thumbQueue = [];
function setWindow(d, day) {
  d.rt = captureLoop(day, d.rt); d.wm ??= windowMaterial(d.rt.texture); d.portal.material = d.wm;
}
const liveMat = new THREE.MeshBasicMaterial({ fog: false }); let portalRT = null, portal = null; // the doorway's live view of the world behind it
const doorEye = (d, out) => out.copy(camera.position).sub(v3.set(d.x, d.y + DH / 2, 0.018));
const v3 = new THREE.Vector3();
function portalSize() { // the doorway's live texture is sized to what the door covers on screen, so the hand-over is pixel for pixel
  if (!portal) return; const dist = Math.max(0.3, camera.position.z - 0.018), tv = Math.tan((camera.fov * Math.PI) / 360);
  const hpx = Math.min(innerHeight * PR * (DH / (2 * dist * tv)), innerWidth * PR * 1.3 * (DH / DW)) * (Q.tier === 0 ? 0.6 : 1), need = clamp(Math.round(hpx), 128, 2600);
  const cur = portalRT?.height ?? 0; if (need > cur * 1.2 || need < cur * 0.5) { const w = Math.round(need * DW / DH); if (!portalRT) { portalRT = new THREE.WebGLRenderTarget(w, need, { type: THREE.HalfFloatType }); liveMat.map = portalRT.texture; } else portalRT.setSize(w, need); }
}
function renderPortal() {
  if (!portal) return; portalSize(); const cam = portal.rig.place(doorEye(portal.d, v1), DW, DH);
  renderer.setRenderTarget(portalRT); renderer.render(portal.day.scene, cam); renderer.setRenderTarget(null);
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
[[sm1, 1.5], [sm2, 0.9], [mse, 2.1], [cow, 1.8]].forEach(([o, r]) => { o.userData.shadow = put(blobShadow(r, 0.55), scene, o.position.x, o.position.y + 0.05, o.position.z); }); // the shadows follow when the friends walk on for their concert
// a little glockenspiel left out on the lawn: tap it and the friends gather to play (The Friends' Concert)
const glk = put(glockenspiel([72, 74, 76, 77, 79, 81, 83, 84], { legs: 0.45 }), scene, 4.9, gy(4.9, 6.4) + 0.62, 6.4, 1.4, -0.3); mesh(sph(0.75), new THREE.MeshBasicMaterial({ visible: false }), 0, 0, 0, glk);
glk.add(twinkles([[-0.5, 0.25, 0, 0xffe9a0], [0.5, 0.3, 0.1, 0xffffff], [0, 0.4, -0.1, 0x9fd4ff], [0.25, 0.15, 0.25, 0xffd34d], [-0.2, 0.3, 0.2, 0xffffff]], 1.6, 2.4, 0.2));
glk.userData.click = () => { audio.chime(3); fxBurst(glk, 40); startGame('band'); }; pickables.push(glk);
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
    const st = ` · ✦ ${found.size} of 24 stars home`;
    if (day >= 25) el.textContent = 'Merry Christmas! Every door is open to you.' + st;
    else { const left = doors.filter((x) => canOpen(x.n) && !x.opened).length; el.textContent = `${day} December · ` + (left ? `${left} door${left > 1 ? 's' : ''} waiting to be opened` : tomorrow() ? 'peek through tomorrow’s keyhole' : 'come back tomorrow for the next door') + st; }
  } else {
    const tgt = new Date(d.getFullYear() + (m === 11 ? 1 : 0), 11, 1), s = Math.max(0, Math.floor((tgt - d) / 1000)), dd = Math.floor(s / 86400), p = (n) => String(n).padStart(2, '0');
    el.textContent = `The first door opens in ${dd} day${dd === 1 ? '' : 's'} · ${p(Math.floor(s / 3600) % 24)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
  }
}
$('sound').onclick = () => { audio.unlock(); $('sound').classList.toggle('off', !audio.toggle()); $('sound').blur(); };
$('play').onclick = () => { $('play').blur(); startGame(); }; $('swing').onclick = () => { $('swing').blur(); startGame('swing'); }; $('carol').onclick = () => { $('carol').blur(); startGame('carol'); }; $('band').onclick = () => { $('band').blur(); startGame('band'); };
$('back').onclick = () => leaveDay(); addEventListener('keydown', (e) => { if (e.key === 'Escape') leaveDay(); });

// ---------- tweens & camera ----------
const tweens = []; const tween = (dur, fn) => new Promise((res) => tweens.push({ t: 0, dur, fn, res }));
const home = new THREE.Vector3(0, 7, 30), homeLook = new THREE.Vector3(0, 7.4, 0), camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
let mode = 'home', view = 'main', busy = false, cur = null, T = 0, mx = 0, my = 0, hover = null;
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h); composer.setSize(w, h); bloom.resolution.set(w, h); PX.value = (h * PR) / 900;
  camera.aspect = w / h; camera.updateProjectionMatrix(); for (const dd of [cur, peek?.day]) if (dd) { dd.camera.aspect = w / h; dd.camera.updateProjectionMatrix(); } game?.resize(w / h);
  const tv = Math.tan((camera.fov * Math.PI) / 360); home.z = Math.max(10.5 / tv, 11.5 / (tv * camera.aspect)) + 1.5;
  GU.uRes.value.set(w * PR, h * PR); sky.layout(home, homeLook, camera.fov, camera.aspect);
}
addEventListener('resize', resize);

// ---------- opening a door: through the doorway, with no cut ----------
let prepared = null, idle = 0, peek = null, gradeK = 0, letter = 0, flash = 0, finaleOn = false;
const buildDay = (n) => { if (prepared?.n === n) { const d = prepared; prepared = null; return d; } return makeDay(n, innerWidth / innerHeight, { found: found.has(n) }); };
// how close the camera must come for the doorway to fill the whole screen
const zEndFor = () => { const tv = Math.tan((camera.fov * Math.PI) / 360); return (Math.min(DH / 2, DW / 2 / camera.aspect) / tv) * 0.97; };
async function openDoor(d) {
  if (busy) return; busy = true; mode = 'seq'; audio.unlock(); document.body.classList.add('focus'); hover = null;
  const wp = new THREE.Vector3(d.x, d.y + DH / 2, 0.1), from = camera.position.clone(), to = new THREE.Vector3(d.x * 0.9, wp.y + 0.2, 7.4), def = DAYS[d.n - 1];
  const day = buildDay(d.n), zEnd = zEndFor(); day.t = +params.get('t') || 0; day.door = d; renderer.compile(day.scene, day.camera);
  portal = { d, day, rig: portalRig(day, zEnd - 0.018) }; d.portal.material = liveMat; cur = day;
  await tween(1.5, (k) => { camPos.lerpVectors(from, to, easeIO(k)); camLook.lerpVectors(homeLook, wp, easeIO(k)); });
  if (!d.opened) {
    audio.magic(d.n); const frags = makeFragments(d.group, d.mat); d.solid.visible = false; d.mat.emissiveIntensity = 0.45;
    for (let i = 0; i < 90; i++) { const a = rnd(TAU); fx.emit(wp.x + Math.cos(a) * 0.9, wp.y + Math.sin(a) * 1.1, 0.3, Math.cos(a) * rnd(1, 4), Math.sin(a) * rnd(1, 4), rnd(0.5, 3), pick(def.col), rnd(0.8, 1.8), 1.2, 0.6); }
    await tween(3.4, (k) => {
      applyEffect(d.n, frags, k);
      for (let i = 0; i < 5; i++) { const f = pick(frags), p = f.m.getWorldPosition(v1); if (f.m.scale.x > 0.02) fx.emit(p.x, p.y, p.z + 0.1, rnd(-0.6, 0.6), rnd(-0.3, 1), rnd(0.2, 1.4), pick([...def.col, 0xffe9a0]), rnd(0.6, 1.4), rnd(0.5, 1.1), 0.5); }
    });
    frags.forEach((f) => { d.group.remove(f.m); f.m.geometry.dispose(); }); d.opened = true; opened.add(d.n); save();
  }
  // and step through: the camera glides into the doorway until the world behind it fills the screen
  const p0 = camPos.clone(), l0 = camLook.clone(), end = new THREE.Vector3(d.x, wp.y, zEnd), endLook = new THREE.Vector3(d.x, wp.y, -10);
  await tween(1.25, (k) => { const e = k * k * (3 - 2 * k) * 0.35 + k * k * 0.65; camPos.lerpVectors(p0, end, e); camLook.lerpVectors(l0, endLook, easeIO(Math.min(1, k * 1.6))); });
  enterDay(d, day);
}
function enterDay(d, day) {
  const def = DAYS[d.n - 1], fromDoor = !!day; cur = day ?? buildDay(d.n); if (!fromDoor) cur.t = +params.get('t') || 0; cur.door = d; view = 'day'; rp.scene = cur.scene; rp.camera = cur.camera;
  if (fromDoor) { cur.blend = { pos: portal.rig.E0.clone(), quat: portal.rig.q.clone(), fov: camera.fov, t0: cur.t, dur: 2.6 }; letter = 1; flash = 0.35; }
  portal = null; gradeK = fromDoor ? 0 : 1; resetWatch();
  $('num').textContent = d.n; $('title').textContent = def.t; $('text').textContent = def.s; $('tune').textContent = '♪ ' + tuneName(d.n) + ' · yours to play in Carol of the Doors';
  starLine(); document.body.classList.add('day'); audio.tune(d.n);
}
function starLine() {
  const s = cur?.spark, el = $('starline'); if (!el) return;
  el.textContent = !s || s.state === 'gone' && found.has(cur.n) && !cur.justFound ? '✦ This door’s star is already home in the sky' : cur.justFound ? '✦ You found the star! It will fly home when you leave.' : s.host ? '✦ A star is hiding here. Try tapping things…' : '✦ A star is hiding somewhere here. Can you spot it?';
  el.classList.toggle('got', !!cur?.justFound);
}
function onStar() {
  const n = cur.n; cur.justFound = true; found.add(n); saveStars(); starLine(); audio.fanfare(); for (let i = 0; i < 5; i++) setTimeout(() => audio.twinkle(i), 120 * i);
}
async function leaveDay() {
  if (view !== 'day' || !cur || cur.leaving) return; const day = cur, d = day.door; day.leaving = true; document.body.classList.remove('day');
  // ease back to the doorway's pose, bars closing in, then hand over to the house and back out through the door
  const zEnd = zEndFor(), rig = portalRig(day, zEnd - 0.018); day.blend = null; day.blendTo = { pos: rig.E0, quat: rig.q, fov: camera.fov, t0: day.t, dur: 1.0 };
  await tween(1.0, (k) => { letter = easeIO(k) * 0.6; gradeK = 1 - k * 0.6; });
  view = 'main'; rp.scene = scene; rp.camera = camera; portal = { d, day, rig }; d.portal.material = liveMat; day.blendTo = null;
  const wp = new THREE.Vector3(d.x, d.y + DH / 2, 0.1), from = new THREE.Vector3(d.x, wp.y, zEnd); camPos.copy(from); camLook.set(d.x, wp.y, -10); camera.position.copy(camPos); camera.lookAt(camLook);
  const l0 = camLook.clone(); flash = 0.2;
  await tween(2.4, (k) => { const e = easeIO(k); camPos.lerpVectors(from, home, e); camLook.lerpVectors(l0, homeLook, easeIO(Math.min(1, k * 1.3))); letter = 0.6 * (1 - k); });
  portal = null; setWindow(d, day); day.dispose(); cur = null; gradeK = 0; letter = 0;
  mode = 'home'; busy = false; document.body.classList.remove('focus'); status();
  if (day.justFound) flyHome(d, day.n);
  if (day.n === 24 && found.has(24) && !finaleDone && isDec()) setTimeout(() => finale(), 2600);
}
// the found star streaks out of its doorway and up to its place in the constellation
function flyHome(d, n) {
  const from = new THREE.Vector3(d.x, d.y + DH / 2, 0.4), to = sky.world(n); audio.whoosh();
  streaks.push({ fn: streak(fx, from, to, T, 1.9), done: () => { sky.light(n); audio.chime(n); setTimeout(() => audio.twinkle(n + 2), 160); const p = to; fx.burst(p.x, p.y, p.z, 80, 4, [0xffe9a0, 0xffffff, 0xffd34d], 1.6, 3, 0); toast(found.size === 24 ? 'Every star is home. Christmas Eve will be something to see…' : `Star ${n} is home. ${found.size} of 24 now shine above the house.`); } });
}
function lockedDoor(d) {
  d.shake = T; audio.locked(); const dec = isDec();
  toast(dec ? `Not yet! Door ${d.n} opens on ${d.n} December.` : `Door ${d.n} is fast asleep until ${d.n} December.`);
  for (let i = 0; i < 26; i++) fx.emit(d.x + rnd(-0.8, 0.8), d.y + rnd(0, DH), 0.3, rnd(-0.5, 0.5), rnd(0.2, 1.4), rnd(0.3, 1.5), pick([0xffe9a0, 0xffffff, 0x9fd4ff]), rnd(0.6, 1.3), 0.9, 0.8);
}
// tomorrow's keyhole: lean in close, and for a moment, through a blur, glimpse what is coming
async function peekDoor(d) {
  if (busy) return; busy = true; mode = 'seq'; audio.unlock(); document.body.classList.add('focus'); audio.creak();
  const kp = d.key.getWorldPosition(new THREE.Vector3()), from = camera.position.clone(), l0 = homeLook.clone(), to = kp.clone().setZ(1.1);
  await tween(1.4, (k) => { camPos.lerpVectors(from, to, easeIO(k)); camLook.lerpVectors(l0, kp, easeIO(k)); });
  const day = makeDay(d.n, innerWidth / innerHeight, { found: true }); day.t = 5; renderer.compile(day.scene, day.camera); peek = { day, d };
  view = 'peek'; rp.scene = day.scene; rp.camera = day.camera; GU.uKey.value = 1; GU.uKeyBlur.value = (Q.tier ? 11 : 6) * PR; audio.chime(d.n); document.body.classList.add('peeking');
  setTimeout(() => toast('Tomorrow… ' + RIDDLES[d.n], 4200), 400);
  await tween(0.9, (k) => { GU.uKeyR.value = 0.02 + easeOut(k) * 1.6; });
  await tween(2.6, () => {});
  await tween(0.7, (k) => { GU.uKeyR.value = 0.02 + (1 - easeIO(k)) * 1.6; });
  GU.uKey.value = 0; GU.uKeyBlur.value = 0; document.body.classList.remove('peeking'); view = 'main'; rp.scene = scene; rp.camera = camera; day.dispose(); peek = null;
  await tween(1.6, (k) => { camPos.lerpVectors(to, home, easeIO(k)); camLook.lerpVectors(kp, homeLook, easeIO(k)); });
  mode = 'home'; busy = false; document.body.classList.remove('focus'); status();
}
// Christmas Eve: the constellation comes down, star by star, and lights the roof star again
async function finale() {
  if (busy || view !== 'main') return; busy = true; mode = 'seq'; finaleOn = true; document.body.classList.add('focus'); audio.unlock();
  const from = camera.position.clone(), to = home.clone().add(new THREE.Vector3(0, 2.5, 5)), l1 = new THREE.Vector3(0, 15, -8);
  await tween(2.2, (k) => { camPos.lerpVectors(from, to, easeIO(k)); camLook.lerpVectors(homeLook, l1, easeIO(k)); });
  const list = [...found].sort((a, b) => a - b), target = roofStar.getWorldPosition(new THREE.Vector3()); audio.tune(24);
  list.forEach((n, i) => streaks.push({ fn: streak(fx, sky.world(n), target, T + i * 0.14, 1.7, n === 20 ? [0xff6a50, 0xffb0a0] : undefined), done: () => { sky.slots[n].want = 0.25; roofBoost += 2.4 / Math.max(1, list.length); audio.twinkle(n); } }));
  await tween(list.length * 0.14 + 1.8, () => {});
  // the star blazes; every door lights up in turn; the sky answers
  audio.bells(); audio.fanfare(); flash = 0.6; for (const d of doors) d.flash = T + 0.3 + d.n * 0.07;
  for (let i = 0; i < 10; i++) setTimeout(() => { const p = target; fx.burst(p.x + rnd(-12, 12), p.y + rnd(-4, 6), p.z + rnd(-4, 2), 160, 5, pick([[0xffd34d, 0xffffff], [0xff5040, 0xffd34d], [0x39d353, 0xffffff], [0x9fd4ff, 0xffffff]]), 2.2, 2.2, 1.5); audio.chime(i); }, 400 + i * 380);
  for (let i = 0; i < 8; i++) shoot();
  await tween(5.5, (k) => { aur.material.uniforms.uGain.value = 0.8 + Math.sin(k * Math.PI) * 1.4; });
  finaleDone = true; saveStars(); toast(`Happy Christmas! ${list.length} of 24 stars came home, and the Advent House shines again.`, 7000);
  await tween(2.4, (k) => { camPos.lerpVectors(to, home, easeIO(k)); camLook.lerpVectors(l1, homeLook, easeIO(k)); });
  finaleOn = false; mode = 'home'; busy = false; document.body.classList.remove('focus'); status();
}

// ---------- the games: Midnight Delivery (the sleigh), George Swings and Carol of the Doors (played on the house itself) ----------
const host = { scene, camera, camPos, camLook, doors, fx, shoot, friends: [sm1, sm2, george, mse, cow], band: { sm1, sm2, george, mse, cow }, prop: glk, gy, setlist, total: 25, toast, roof: roofTw.userData.u, roofSize: 2.1, aur: aur.material.uniforms, aurGain: 0.8, unlocked: carolOpen, time: () => T, world: (dt) => updateMain(dt) };
let game = null; const games = {}, MAKE = { delivery: createGame, swing: createSwing, carol: (o) => createCarol({ song: +params.get('carol') || 0, diff: params.has('full') ? 1 : undefined, ...o, host }), band: (o) => createBand({ song: +params.get('band') || 0, host, ...o }) };
const setPR = (p) => { PR = p; renderer.setPixelRatio(p); composer.setPixelRatio(p); resize(); };
const dayKey = () => { const d = today(); return params.get('seed') || `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const newGame = (kind = 'delivery', o = {}) => MAKE[kind]({ dom: renderer.domElement, audio, seed: dayKey(), onExit: leaveGame, setPR, getPR: () => PR, bot: params.has('bot'), adaptive: !STEPS, ...o });
function enterGame(kind = 'delivery') { game = games[kind] ??= newGame(kind); document.body.classList.toggle('swing', kind === 'swing'); document.body.classList.toggle('carol', kind === 'carol'); document.body.classList.toggle('band', kind === 'band'); view = 'game'; rp.scene = game.scene; rp.camera = game.camera; resize(); game.start(); document.body.classList.add('game'); }
async function startGame(kind = 'delivery') {
  if (busy || view !== 'main') return; busy = true; mode = 'seq'; audio.unlock(); document.body.classList.add('focus');
  if (kind === 'carol' || kind === 'band') { camPos.copy(camera.position); camLook.copy(homeLook); return enterGame(kind); } // no journey: the camera just settles on the house front (or leans in to the band)
  const sw = kind === 'swing', tgt = sw ? george.position.clone().setY(george.userData.y0 + 0.8) : team.position, from = camera.position.clone(), to = from.clone().lerp(tgt, sw ? 0.72 : 0.3); to.y += sw ? 0.6 : 4; // close in on George (or rise towards the sleigh), then slip through a snow cloud
  if (sw) setTimeout(() => { george.userData.t0 = T; }, 500); // one somersault for luck
  setTimeout(() => $('mist').classList.add('on'), 1150);
  await tween(1.6, (k) => { camPos.lerpVectors(from, to, easeIO(k)); camLook.lerpVectors(homeLook, tgt, easeIO(Math.min(1, k * 1.4))); });
  enterGame(kind); $('mist').classList.remove('on');
}
async function leaveGame() {
  if (game.leave) { // the concert: the friends walk home while the camera pulls back
    game.leave(); document.body.classList.remove('game', 'band'); const from = camPos.clone(), fl2 = camLook.clone();
    await tween(1.8, (k) => { camPos.lerpVectors(from, home, easeIO(k)); camLook.lerpVectors(fl2, homeLook, easeIO(k)); });
    game.stop(); view = 'main'; mode = 'home'; busy = false; document.body.classList.remove('focus'); status(); return;
  }
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
  mx = (e.clientX / innerWidth) * 2 - 1; my = (e.clientY / innerHeight) * 2 - 1; idle = 0; if (view !== 'main' || mode !== 'home') return;
  const h = pickAt(e); hover = h?.door ?? null; renderer.domElement.style.cursor = h ? 'pointer' : 'default';
  if (T - lastTrail > 0.025) { lastTrail = T; const p = ray.ray.at(16, v1); fx.emit(p.x, p.y, p.z, rnd(-0.3, 0.3), rnd(-0.6, 0.1), rnd(-0.3, 0.3), pick([0xffe9a0, 0xffffff, 0xbfe0ff]), rnd(0.5, 1.1), rnd(0.35, 0.7), 0.6); }
});
renderer.domElement.addEventListener('click', (e) => {
  audio.unlock(); idle = 0;
  if (view === 'day' && cur && !cur.leaving) { // inside a door: the star, a secret, or a friendly boing
    const r = cur.click(ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), cur.t);
    if (r === 'star') onStar(); else if (r === 'reveal') { audio.twinkle(3); audio.chime(5); } else if (r === 'tap') audio.chime(Math.floor(rnd(8))); else if (r === 'poke') audio.boing(false);
    return;
  }
  if (view !== 'main' || busy) return; const h = pickAt(e);
  if (h?.door) { const d = h.door; (d.opened || canOpen(d.n)) ? openDoor(d) : d.n === tomorrow() ? peekDoor(d) : lockedDoor(d); } else if (h?.obj) h.obj.userData.click();
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
  const tm = tomorrow();
  for (const d of doors) {
    const sh = clamp((T - d.shake) / 0.5); d.group.rotation.z = sh < 1 ? Math.sin(sh * 30) * 0.035 * (1 - sh) : 0;
    const fl = Math.max(0, 1 - Math.abs(T - d.flash) / 0.6) * 2.2, ready = canOpen(d.n) && !d.opened;
    d.mat.emissiveIntensity = lerp(d.mat.emissiveIntensity, (hover === d ? 0.75 : 0.3) + (ready ? 0.3 + 0.25 * Math.sin(T * 3 + d.n) : 0) + fl, 0.15);
    if (d.wm) d.wm.uniforms.uGlow.value = (hover === d ? 1.25 : 1) + fl; d.pm.uniforms.uTime.value = T;
    const kOn = d.n === tm && !d.opened; d.key.visible = d.leak.visible = kOn;
    if (kOn) { const p = 0.75 + 0.25 * Math.sin(T * 2.2); d.keyHalo.material.opacity = 0.5 * p + (hover === d ? 0.3 : 0); d.leak.material.opacity = 0.55 * p; if (Math.random() < 0.05) fx.emit(d.x + rnd(-0.8, 0.8), d.y + 0.05, 0.3, rnd(-0.1, 0.1), rnd(0.1, 0.4), rnd(0.1, 0.3), 0xffc060, 1.2, 0.5, 0); }
    if (ready && Math.random() < 0.03) fx.emit(d.x + rnd(-0.9, 0.9), d.y + rnd(0, DH), 0.25, 0, rnd(0.2, 0.6), rnd(0.1, 0.5), 0xffe9a0, 1.2, 0.7, 0);
  }
  if (thumbQueue.length && (thumbWait += dt) > 0.25 && mode === 'home') { thumbWait = 0; const d = thumbQueue.shift(), day = makeDay(d.n, LW.w / LW.h, { found: true }); day.t = 8; setWindow(d, day); day.dispose(); }
  // keep the next door's world ready behind it, so stepping through never stutters
  if (mode === 'home' && !busy && !prepared && !thumbQueue.length && (idle += dt) > 1.4 && !STEPS) {
    const nx = doors.filter((d) => canOpen(d.n) && !d.opened).sort((a, b) => b.n - a.n)[0];
    if (nx) { prepared = makeDay(nx.n, innerWidth / innerHeight, { found: found.has(nx.n) }); prepared.n = nx.n; renderer.compile(prepared.scene, prepared.camera); }
  }
  // the roof star and its constellation
  roofLvl = lerp(roofLvl, roofWant() + roofBoost, Math.min(1, dt * 3)); roofBoost = Math.max(0, roofBoost - dt * (finaleOn ? 0.12 : 0.6));
  roofStar.material.color.copy(ROOF_C).multiplyScalar(roofLvl); roofHalo.material.opacity = Math.min(1, 0.7 * roofLvl); roofHalo.scale.setScalar(5 * (0.6 + 0.4 * roofLvl + roofBoost * 0.5));
  sky.update(T, dt, isDec() || finaleDone ? 1 : 0);
  for (let i = streaks.length - 1; i >= 0; i--) if (streaks[i].fn(T)) { streaks[i].done?.(); streaks.splice(i, 1); }
  fx.update(dt);
  if (mode === 'home') { camera.position.set(home.x + mx * 2.2, home.y - my * 1.1 + Math.sin(T * 0.3) * 0.15, home.z); camera.lookAt(homeLook.x + mx * 0.5, homeLook.y - my * 0.3, 0); }
  else { camera.position.copy(camPos); camera.lookAt(camLook); }
  if (T - lastStatus > 1) { lastStatus = T; status(); }
}
function frame() { requestAnimationFrame(frame); if (!STEPS) tick(Math.min(clock.getDelta(), 0.05)); else composer.render(); }
function tick(dt) {
  T += dt;
  for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; tw.t += dt; const k = clamp(tw.t / tw.dur); tw.fn(k); if (k >= 1) { tweens.splice(i, 1); tw.res(); } }
  U.time.value = T; GU.uTime.value = T;
  if (view === 'main') { updateMain(dt); if (portal) { portal.day.t += dt; portal.day.update(portal.day.t, dt); renderPortal(); } }
  else if (view === 'game') game.update(dt);
  else if (view === 'peek' && peek) { peek.day.t += dt; peek.day.update(peek.day.t, dt, mx * 0.5, my * 0.5); }
  else if (cur) { cur.t += dt; cur.update(cur.t, dt, mx, my); if (!STEPS) watchFrames(dt, onTierDrop); }
  look();
  composer.render();
}
// the grade for whatever is on screen: the house, a door's world (eased in after stepping through), or a game
const _p = new THREE.Vector3();
function look() {
  const inDay = (view === 'day' && cur) || view === 'peek', d = view === 'peek' ? peek.day : cur;
  gradeK = inDay && view === 'day' ? Math.min(1, gradeK + 1 / 90) : gradeK; if (!inDay && !portal) gradeK = Math.max(0, gradeK - 0.03);
  grade.enabled = view !== 'game' || !!game?.inPlace;
  if (inDay && d) {
    applyGrade(GU, d.grade, view === 'peek' ? 1 : smooth(0, 1, gradeK), 0.3);
    const cam = d.camera; _p.copy(d.look).project(cam); GU.uFocus.value = clamp(_p.y * 0.5 + 0.5, 0.15, 0.85);
    GU.uTilt.value = Q.tier ? d.grade.tilt * 4.2 * PR * smooth(0.2, 1, gradeK) : 0;
    const r = d.rays[0]; let ray = 0;
    if (r && Q.tier) { r.obj.getWorldPosition(_p).project(cam); const off = Math.max(Math.abs(_p.x), Math.abs(_p.y)); ray = _p.z < 1 ? r.k * smooth(1.6, 0.9, off) : 0; GU.uRayPos.value.set(_p.x * 0.5 + 0.5, _p.y * 0.5 + 0.5); GU.uRayCol.value.copy(r.col); }
    GU.uRay.value = lerp(GU.uRay.value, ray * smooth(0.3, 1, gradeK || 1), 0.1);
  } else {
    applyGrade(GU, HOME_GRADE, 1, view === 'game' ? 0.12 : 0.22); GU.uTilt.value = 0;
    let ray = 0; if (finaleOn || roofBoost > 0.05) { roofStar.getWorldPosition(_p).project(camera); GU.uRayPos.value.set(_p.x * 0.5 + 0.5, _p.y * 0.5 + 0.5); GU.uRayCol.value.set(0xfff0c0); ray = Math.min(0.85, roofBoost * 0.5); }
    GU.uRay.value = lerp(GU.uRay.value, ray, 0.08);
  }
  letter = view === 'day' && cur && !cur.leaving ? Math.max(0, letter - 1 / 110) : letter; GU.uLetter.value = easeIO(clamp(letter));
  flash = Math.max(0, flash - 1 / 40); GU.uFlash.value = flash * flash;
}
function onTierDrop(tier) { // this device needs a lighter touch: soften the pixel ratio and the post effects, and drop the shadows at the bottom
  tierUniforms(GU); if (PR > 1) setPR(Math.max(1, PR - 0.5)); if (tier === 0 && cur) cur.dir.castShadow = false;
}

// ---------- start ----------
async function start() {
  try { await Promise.race([document.fonts.load('700 100px "Mountains of Christmas"'), new Promise((r) => setTimeout(r, 1800))]); } catch { /* fall back to Georgia */ }
  buildDoors(); scene.traverse((o) => { if (o.userData.tick) ticks.push(o.userData.tick); });
  sky.set(found, (n) => canOpen(n)); // the stars already home, and faint gaps where a missed door's star could still be fetched
  resize(); status(); frame(); document.body.classList.add('ready');
  if (!isDec()) setTimeout(() => toast('Every door is sleeping until December — but the snow, the stars and a few friends are wide awake. Try clicking them.', 7000), 1500);
  const o = +params.get('open'); if (params.has('shot')) $('veil').remove();
  const ck = +params.get('click'); if (ck) setTimeout(() => openDoor(doors.find((x) => x.n === ck)), STEPS ? 0 : 600);
  if (STEPS) (async () => { for (let i = 0; i < STEPS; i++) { if (i === +params.get("leave")) leaveDay(); tick(0.05); await new Promise((r) => setTimeout(r, 0)); } })();
  if (params.has('game') || params.has('swing') || params.has('carol') || params.has('band')) { busy = true; mode = 'seq'; document.body.classList.add('focus'); camPos.copy(home); camLook.copy(homeLook); enterGame(params.has('band') ? 'band' : params.has('carol') ? 'carol' : params.has('swing') ? 'swing' : 'delivery'); }
  if (o >= 1 && o <= 24) { busy = true; mode = 'seq'; document.body.classList.add('focus'); const d = doors.find((x) => x.n === o); camPos.set(d.x, d.y + 1, 7.4); camLook.set(d.x, d.y + 1, 0); enterDay(d); }
  const pk = +params.get('peek'); if (pk) setTimeout(() => peekDoor(doors.find((x) => x.n === pk)), 600);
  if (params.has('finale')) setTimeout(() => finale(), STEPS ? 0 : 900);
  else if (isDec() && today().getDate() >= 24 && found.has(24) && !finaleDone && !o) setTimeout(() => finale(), 2500); // came back to see it
}
// ?stars=1-12 (or all) fills the sky for previews; it only touches the preview save
if (params.has('stars') && pd) { const s = params.get('stars'), [a, b] = s === 'all' || !s ? [1, 24] : s.split('-').map(Number); for (let n = a; n <= (b || a); n++) found.add(n); }
window.__test = () => { const bad = []; for (let n = 1; n <= 24; n++) { try { const d = makeDay(n); for (const t of [0.1, 2, 5, 9]) d.update(t, 0.016); renderer.render(d.scene, d.camera); d.dispose(); } catch (e) { bad.push(n + ': ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]); } } return bad.length ? bad : 'all 24 ok'; };
// every door hides a star that can be found: it shows itself (by waiting, or by tapping its hiding place) and can be collected
window.__starTest = () => {
  const bad = [];
  for (let n = 1; n <= 24; n++) {
    try {
      const d = makeDay(n), s = d.spark; if (!s) { bad.push(n + ': no star'); d.dispose(); continue; }
      let t = 0; for (; t < 30 && s.state === 'hidden'; t += 0.1) { if (s.host && t > 1) s.reveal(t); d.update(t, 0.1); }
      for (let i = 0; i < 10; i++) d.update(t += 0.1, 0.1);
      if (s.state !== 'shown') bad.push(n + ': never shown'); else { const p = s.g.getWorldPosition(new THREE.Vector3()).project(d.camera); if (Math.abs(p.x) > 1.05 || Math.abs(p.y) > 1.05 || p.z > 1) bad.push(`${n}: off screen (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`); if (!s.collect(t, d.scene, d.fx)) bad.push(n + ': cannot collect'); }
      d.dispose();
    } catch (e) { bad.push(n + ': ' + e.message); }
  }
  return bad.length ? bad : 'all 24 stars ok';
};
// renders n frames of a door's world (post effects included) and reports the cost of one
window.__dayPerf = (n = 1, frames = 90) => { const d = makeDay(n, innerWidth / innerHeight), prs = rp.scene, prc = rp.camera; rp.scene = d.scene; rp.camera = d.camera; const gl = renderer.getContext(), px = new Uint8Array(4); renderer.compile(d.scene, d.camera); d.update(6, 0.016); composer.render(); const t0 = performance.now(); for (let i = 0; i < frames; i++) { d.update(6 + i / 60, 1 / 60); composer.render(); } gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const ms = (performance.now() - t0) / frames; const info = { n, ms: +ms.toFixed(2), calls: renderer.info.render.calls, tris: renderer.info.render.triangles, tier: Q.tier, pr: PR }; rp.scene = prs; rp.camera = prc; d.dispose(); return info; };
// plays the game flat out with the autopilot (no rendering) and reports how the run went
window.__gameTest = (secs = 240, o = {}) => { const g = newGame(o.kind ?? 'delivery', { bot: true, adaptive: false, record: false, onExit() {}, ...o }); g.start(); let i = 0; for (; i < secs * 60 && g.stats.state !== 'over'; i++) g.update(1 / 60); const s = g.stats; g.stop(); return { ...s, frames: i }; };
// the same for George Swings, over several nights' forests: how far does the autopilot get in each?
window.__swingTest = (secs = 120, seeds = 8) => Array.from({ length: seeds }, (_, i) => window.__gameTest(secs, { kind: 'swing', seed: 'test' + i }));
// plays every carol at both difficulties with the autopilot (no sound) and reports any it cannot play perfectly
window.__carolTest = () => { const g = newGame('carol', { bot: true, mute: true, record: false, song: 0, onExit() {} }), out = []; g.start(); for (let n = 1; n <= 24; n++) for (const d of [0, 1]) { g.play(n, d); let i = 0; for (; i < 200 * 60 && g.stats.state !== 'over'; i++) g.update(1 / 60); const s = g.stats; if (s.state !== 'over' || s.misses || s.hits !== s.targets || s.stars !== 3) out.push(s); } g.stop(); return out.length ? out : 'all 24 carols ok'; };
// plays every carol on the full programme through the band (no sound) and checks that every melody note was struck on time
window.__bandTest = () => {
  const out = [], g = newGame('band', { mute: true, onExit() {}, host: { ...host, setlist: () => Array.from({ length: 25 }, (_, k) => k + 1), toast() {} } }), run = (to) => { for (let k = 0; k < 200 * 60 && g.stats.state !== to; k++) g.update(1 / 60); };
  g.start(); run('play'); for (let n = 1; n <= 25; n++) { g.play(n); run('bow'); const st = g.stats; if (st.state !== 'bow' || st.song !== n || st.struck !== st.notes || st.maxErr > 1 / 60 + 1e-3) out.push(st); }
  g.stop(); return out.length ? out : 'all 25 carols ok';
};
window.__peek = () => game?.peek?.();
// renders n game frames back to back and reports the average cost of one (ms), GPU included
window.__gamePerf = (n = 120) => { const gl = renderer.getContext(), px = new Uint8Array(4), t0 = performance.now(); for (let i = 0; i < n; i++) { game.update(1 / 60); composer.render(); } gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const ms = (performance.now() - t0) / n; renderer.render(game.scene, game.camera); return { ms: +ms.toFixed(2), calls: renderer.info.render.calls, tris: renderer.info.render.triangles, pr: PR, w: innerWidth, h: innerHeight, stats: game.stats }; };
start().then(() => {
  if (!params.has('selftest')) return; const pre = document.createElement('pre'); pre.id = 'selftest'; document.body.appendChild(pre);
  setTimeout(() => { pre.textContent = 'SELFTEST ' + JSON.stringify({ scenes: window.__test(), stars: window.__starTest(), songs: validateSongs(), band: window.__bandTest(), errors: window.__errs }); }, 1500);
});
