// Carol of the Doors — the house front is an instrument. The 6×4 grid of doors is two octaves of music box
// (bottom-left lowest, a semitone per door); sparks fall from the roof star and you tap each door as its ring closes.
// Unlike the other games this one plays on the real house, so it borrows the main scene through `host`.
import { THREE, rnd, clamp, easeIO } from './kit.js';
import { DW, DH } from './doors.js';
import { tuneName } from './audio.js';
import { chart } from './songs.js';

// ---------- tuning ----------
export const TUNE = {
  lead: 1.8,                 // seconds a spark takes to fall
  perfect: 0.08, good: 0.17, // timing windows either side of the beat
  gap: [0.42, 0.16],         // closest two notes you are asked to play: Gentle, All
  full: 28,                  // the streak that lights the whole roofline
  dance: 8,                  // the streak that gets the friends dancing
};
const KEYS = ['zxcvbn', 'asdfgh', 'qwerty', '123456'], COLS = 6, ROWS = 4, SX = 2.62, SY = 2.78, PW = DW * 2.3, PH = DH * 2.3;
const GOLD = [0xffd34d, 0xffffff, 0xffe9a0];

const padShader = {
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uCol; uniform float uFlash,uOn,uBad,uStars; uniform vec4 uRings; varying vec2 vUv;
    float bx(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }
    void main(){ vec2 p=(vUv-.5)*vec2(${PW.toFixed(3)},${PH.toFixed(3)}), b=vec2(${(DW / 2).toFixed(3)},${(DH / 2).toFixed(3)});
      float d=bx(p,b), edge=smoothstep(.09,0.,abs(d-.06)), fill=smoothstep(.05,-.3,d), glow=exp(-max(d,0.)*3.5);
      vec3 c=uCol*(uOn*(edge*.9+fill*.14)+uFlash*(fill*.9+glow*.8+edge))+vec3(1.,.22,.16)*uBad*(edge+fill*.35);
      for(int i=0;i<4;i++){ float k=uRings[i]; if(k>=0.){ float dr=bx(p,b+(1.-k)*1.05), w=.05+.06*k;
        c+=mix(uCol,vec3(1.,.95,.8),k*k)*smoothstep(w,0.,abs(dr-.06))*smoothstep(0.,.15,k)*(.5+k); } }
      for(int i=0;i<3;i++){ if(float(i)<uStars){ vec2 q=p-vec2((float(i)-(uStars-1.)*.5)*.36,b.y+.36); c+=vec3(1.,.82,.35)*smoothstep(.13,0.,length(q))*1.6; } }
      gl_FragColor=vec4(c,1.); }`,
};

export function createCarol({ host, dom, audio, onExit, bot = false, record = true, mute = false, song = 0, diff: diff0 }) {
  const $ = (id) => document.getElementById(id), coarse = matchMedia('(pointer: coarse)').matches;
  const ui = { score: $('g-score'), combo: $('g-combo'), tune: $('g-tune'), msg: $('g-msg'), pops: $('g-pops'), final: $('g-final'), stats: $('g-stats'), best: $('g-best'), name: $('g-name'), diff: $('c-diff'), free: $('c-free') };
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (record) localStorage.setItem(k, v); } catch { /* storage unavailable */ } return null; };
  const snd = (midi, when, len, vol, voice) => { if (!mute) audio.play(midi, when, len, vol, voice); };
  const { fx, camera } = host, _v = new THREE.Vector3(), ray = new THREE.Raycaster(), ptr = new THREE.Vector2();

  // ---------- the pads: one glowing overlay per door ----------
  const group = new THREE.Group(); group.visible = false; host.scene.add(group);
  const geo = new THREE.PlaneGeometry(PW, PH), pads = [];
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const idx = j * COLS + i, x = (i - 2.5) * SX, y = 1.0 + j * SY + DH / 2, col = new THREE.Color().setHSL((idx % 12) / 12, 0.85, 0.6);
    const mat = new THREE.ShaderMaterial({ ...padShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uCol: { value: col }, uFlash: { value: 0 }, uOn: { value: 0 }, uBad: { value: 0 }, uStars: { value: 0 }, uRings: { value: new THREE.Vector4(-1, -1, -1, -1) } } });
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, 0.42); m.renderOrder = 5; group.add(m);
    pads.push({ idx, x, y, col, u: mat.uniforms, flash: 0, bad: 0, on: 0, nr: 0, door: host.doors.find((d) => Math.abs(d.x - x) < 0.1 && Math.abs(d.y + DH / 2 - y) < 0.1) });
  }
  const byN = (n) => pads.find((p) => p.door.n === n);

  // ---------- state ----------
  let active = false, state = 'idle', aspect = 1, diff = diff0 ?? (store('advent-cd-diff') === '1' ? 1 : 0), cur = 0, ch = null, targets = [], low = 60;
  let songT = 0, t0 = null, ni = 0, ai = 0, ti = 0, beatI = -99, pulse = 0, flare = 0, label = '', lastHud = '', hoverI = -1;
  let score = 0, combo = 0, bestCombo = 0, hits = 0, perfects = 0, misses = 0, stars = 0;
  const camTo = new THREE.Vector3(), lookTo = new THREE.Vector3(0, 8.5, 0), camFrom = new THREE.Vector3(), lookFrom = new THREE.Vector3(); let camK = 0;
  const best = (n, d) => { const [s, st] = (store(`advent-cd-${n}-${d}`) || '0|0').split('|').map(Number); return { s: s || 0, st: st || 0 }; };
  const starStr = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

  // ---------- feedback ----------
  function msg(text, long) { ui.msg.textContent = text; ui.msg.className = ''; void ui.msg.offsetWidth; ui.msg.className = long ? 'show long' : 'show'; }
  function pop(p, text, gold) {
    const el = ui.pops.children[pop.i = ((pop.i ?? -1) + 1) % ui.pops.children.length]; _v.set(p.x, p.y + 1.3, 0.4).project(camera);
    el.textContent = text; el.style.left = `${(_v.x * 0.5 + 0.5) * 100}%`; el.style.top = `${(-_v.y * 0.5 + 0.5) * 100}%`; el.className = ''; void el.offsetWidth; el.className = gold ? 'go gold' : 'go';
  }
  function hud(force) {
    const key = `${state}|${score}|${combo}|${label}`; if (key === lastHud && !force) return; lastHud = key;
    ui.score.textContent = state === 'play' || state === 'over' ? score.toLocaleString() : 'Carol of the Doors'; ui.combo.textContent = state === 'play' && combo > 1 ? `×${combo}` : ''; ui.tune.textContent = label;
  }
  function buttons() { ui.diff.textContent = diff ? 'Notes: all ♫' : 'Notes: gentle ♪'; ui.free.textContent = state === 'free' ? 'Choose a carol' : 'Free play'; }
  const pick = (on) => document.body.classList.toggle('pick', on);

  // ---------- choosing a carol: the doors are the menu ----------
  function menu() {
    state = 'menu'; ch = null; low = 60; document.body.classList.remove('over'); pick(true); buttons(); hoverI = -1; let open = 0;
    for (const p of pads) { const ok = host.unlocked(p.door.n); open += ok; p.on = ok ? 1 : 0; p.u.uStars.value = ok ? Math.max(best(p.door.n, 0).st, best(p.door.n, 1).st) : 0; p.u.uRings.value.set(-1, -1, -1, -1); }
    label = open === 24 ? 'Every carol is yours — tap a door to play it' : `${open} of 24 carols unlocked · open a door in December to earn its carol`;
    msg('Tap a glowing door to play its carol', true); hud(true);
  }
  function choose(p) {
    const n = p.door.n;
    if (host.unlocked(n)) return play(n);
    p.bad = 1; if (!mute) audio.locked(); msg(`${tuneName(n)} unlocks when you open door ${n} on ${n} December`);
  }
  function free() {
    state = 'free'; ch = null; low = 60; pick(true); buttons(); for (const p of pads) { p.on = 0.3; p.u.uStars.value = 0; }
    label = coarse ? 'Free play — every door is a note' : 'Free play — every door is a note (try the keyboard: 1–6, Q–Y, A–H, Z–N)'; msg('The house is yours to play', true); hud(true);
  }

  // ---------- playing a carol ----------
  function thin(notes, gap) { // which notes the player is asked for: the ones on the beat first, never two closer than `gap`
    const ord = notes.map((_, i) => i).sort((a, b) => notes[b].w - notes[a].w || a - b), took = [];
    for (const i of ord) { const t = notes[i].t; if (took.every((u) => Math.abs(u - t) >= gap - 1e-6)) { took.push(t); notes[i].tg = true; } }
    return notes.filter((n) => n.tg);
  }
  function play(n, d = diff) {
    cur = n; diff = d; ch = chart(n); low = ch.low; targets = thin(ch.notes, TUNE.gap[diff]); state = 'play'; pick(false); document.body.classList.remove('over');
    songT = -Math.max(2.4, ch.meter * ch.beat + 0.5); t0 = null; ni = ai = ti = 0; beatI = -99; pulse = flare = 0; score = combo = bestCombo = hits = perfects = misses = stars = 0;
    const used = new Set(ch.notes.map((x) => x.pad)); for (const p of pads) { p.on = used.has(p.idx) ? 0.32 : 0; p.u.uStars.value = 0; p.flash = p.bad = 0; }
    label = `♪ ${ch.name} · 0/${targets.length}`; msg(ch.name, true); hud(true);
  }
  function hit(nt, p, off) {
    const perfect = Math.abs(off) <= TUNE.perfect; nt.j = 1; hits++; perfects += perfect; combo++; bestCombo = Math.max(bestCombo, combo);
    score += (perfect ? 100 : 60) * Math.min(4, 1 + Math.floor(combo / 10)); fx.burst(p.x, p.y, 0.6, perfect ? 26 : 12, perfect ? 4 : 2.5, [p.col, 0xffffff, 0xffe9a0], 0.9, 1, 1.5);
    pop(p, perfect ? 'Perfect!' : 'Good', perfect); if (combo === TUNE.dance) msg('The friends are dancing!'); else if (combo > 0 && combo % 25 === 0) msg(`${combo} in a row!`);
  }
  function miss(nt) { nt.j = 2; misses++; combo = 0; pads[nt.pad].bad = 1; snd(nt.midi, 0, 1, 0.05); }
  function judge(idx) {
    for (let i = ti; i < targets.length; i++) {
      const nt = targets[i], off = songT - nt.t; if (off < -TUNE.good) break;
      if (!nt.j && nt.pad === idx && off <= TUNE.good) return hit(nt, pads[idx], off);
    }
  }
  function tap(idx) {
    const p = pads[idx]; p.flash = 1;
    if (state === 'menu') return choose(p);
    if (state !== 'play' && state !== 'free') return;
    snd(low + idx, 0, 1.5, 0.24); snd(low + idx - 12, 0, 1.1, 0.05);
    if (state === 'play') judge(idx); else fx.burst(p.x, p.y, 0.6, 10, 2.5, [p.col, 0xffffff], 0.8, 0.9, 1.2);
  }
  function over() {
    state = 'over'; const tot = targets.length, perfectRun = misses === 0 && hits === tot; stars = perfectRun ? 3 : hits >= tot * 0.8 ? 2 : hits >= tot * 0.5 ? 1 : 0;
    const old = best(cur, diff), isBest = score > old.s && score > 0; if (isBest || stars > old.st) store(`advent-cd-${cur}-${diff}`, `${Math.max(score, old.s)}|${Math.max(stars, old.st)}`);
    ui.name.textContent = ch.name; ui.final.textContent = score.toLocaleString();
    ui.stats.textContent = `${starStr(stars)} · ${hits} of ${tot} notes · ${perfects} perfect · best streak ${bestCombo}`;
    ui.best.textContent = perfectRun ? '✦ A perfect carol — look at the sky! ✦' : isBest ? '★ A new best! ★' : `Your best ${Math.max(old.s, score).toLocaleString()} · ${diff ? 'all notes' : 'gentle'}`;
    if (!mute) audio.fanfare(); if (perfectRun) { flare = 1.6; for (let i = 0; i < 10; i++) host.shoot(); host.friends.forEach((f, i) => { f.userData.t0 = host.time() + i * 0.12; }); }
    document.body.classList.add('over'); hud(true);
  }

  // ---------- input ----------
  function padAt(e) {
    ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera);
    const o = ray.ray.origin, d = ray.ray.direction, k = (0.3 - o.z) / d.z, x = o.x + d.x * k, y = o.y + d.y * k, i = Math.round(x / SX + 2.5), j = Math.round((y - 1.0 - DH / 2) / SY);
    _v.set(x, y, 0.3); return i >= 0 && i < COLS && j >= 0 && j < ROWS && Math.abs(x - (i - 2.5) * SX) < SX / 2 && Math.abs(y - (1.0 + j * SY + DH / 2)) < SY / 2 ? j * COLS + i : -1;
  }
  function onDown(e) {
    e.preventDefault(); audio.unlock(); if (state === 'over' || state === 'idle') return; const idx = padAt(e);
    if (idx >= 0) tap(idx); else { fx.burst(_v.x, _v.y, 1, 14, 2, GOLD, 1, 0.8, 1); if (!mute) audio.twinkle(Math.floor(rnd(8))); }
  }
  function onMove(e) {
    if (state !== 'menu') return; const idx = padAt(e); dom.style.cursor = idx >= 0 ? 'pointer' : 'default'; if (idx === hoverI) return; hoverI = idx; if (idx < 0) return;
    const n = pads[idx].door.n, ok = host.unlocked(n); label = `Door ${n} · ${tuneName(n)}` + (ok ? ` · ${starStr(Math.max(best(n, 0).st, best(n, 1).st))}` : ` · unlocks on ${n} December`);
  }
  function back() { if (state === 'menu' || state === 'idle') exit(); else menu(); }
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key.toLowerCase();
    if (k === 'escape') return back();
    if (e.repeat) return; for (let j = 0; j < ROWS; j++) { const i = KEYS[j].indexOf(k); if (i >= 0 && k.length === 1) { e.preventDefault(); audio.unlock(); if (state !== 'over') tap(j * COLS + i); return; } }
  }
  const noMenu = (e) => e.preventDefault();
  const LISTEN = [[dom, 'pointerdown', onDown], [dom, 'pointermove', onMove], [dom, 'contextmenu', noMenu], [window, 'keydown', onKey]];
  function exit() { if (!active || exit.busy) return; exit.busy = true; onExit?.(); }
  function bind() {
    $('g-quit').onclick = back; $('g-home').onclick = exit; $('g-again').onclick = () => { if (state === 'over') play(cur); }; $('c-more').onclick = () => { if (state === 'over') menu(); };
    ui.name.textContent = 'Carol of the Doors'; $('g-again').textContent = 'Play it again';
    ui.diff.onclick = () => { diff = diff ? 0 : 1; store('advent-cd-diff', String(diff)); buttons(); ui.diff.blur(); msg(diff ? 'Every note is yours to play' : 'Just the notes on the beat — the house plays the rest'); };
    ui.free.onclick = () => { ui.free.blur(); if (state === 'free') menu(); else if (state === 'menu') free(); };
  }

  // ---------- frame ----------
  function frame() { // where the camera sits: the whole house front, doorstep to roof star (just the doors' width on a tall phone)
    const tv = Math.tan((camera.fov * Math.PI) / 360); camTo.set(0, 8.5, Math.max(10.4 / tv, (aspect < 1 ? 8.3 : 10.6) / (tv * aspect)) + 1);
  }
  function spark(nt, k) { // a spark arcs out from the roof star and down onto its door
    const p = pads[nt.pad], a = 1 - k, x = 2 * a * k * p.x * 0.55 + k * k * p.x, y = a * a * 17.8 + 2 * a * k * 15 + k * k * p.y, z = a * a * 0.9 + 2 * a * k * 7 + k * k * 0.6;
    fx.emit(x, y, z, rnd(-0.25, 0.25), rnd(-0.25, 0.25), rnd(-0.2, 0.2), p.col, 0.5, 1.1, 0); fx.emit(x, y, z, 0, 0, 0, 0xffffff, 0.07, 2.4, 0);
  }
  function step(dt) {
    songT += dt; const a = mute ? null : audio.now(); if (a !== null) { if (t0 === null || Math.abs(a - t0 - songT) > 0.12) t0 = a - songT; else songT = a - t0; } // keep to the audio clock when it is running
    const bi = Math.floor(songT / ch.beat + 1e-6);
    if (bi !== beatI) {
      beatI = bi; pulse = 1; if (songT < 0 && bi >= -ch.meter) snd(ch.base + 12, 0, 0.25, 0.07); // count-in
      if (combo >= TUNE.dance) { const f = host.friends[((bi % 5) + 5) % 5], T = host.time(); if (T - f.userData.t0 > 1) f.userData.t0 = T; }
    }
    while (ai < ch.acc.length && ch.acc[ai].t < songT + 0.12) { const e = ch.acc[ai++]; snd(e.midi, e.t - songT, e.len * 1.3, e.vol * 1.25, 'vibe'); }
    while (ni < ch.notes.length && ch.notes[ni].t < songT + 0.12) { const nt = ch.notes[ni++]; if (!nt.tg) { snd(nt.midi, nt.t - songT, Math.max(1, nt.d * 1.8), 0.15); pads[nt.pad].flash = Math.max(pads[nt.pad].flash, 0.45); } }
    for (const p of pads) p.nr = 0;
    for (let i = ti; i < targets.length; i++) {
      const nt = targets[i]; if (nt.t - TUNE.lead > songT) break; if (nt.j) continue;
      const k = clamp(1 - (nt.t - songT) / TUNE.lead), p = pads[nt.pad]; if (k < 1) spark(nt, k); if (p.nr < 4) p.u.uRings.value.setComponent(p.nr++, k);
      if (bot && songT >= nt.t) tap(nt.pad); else if (songT > nt.t + TUNE.good) miss(nt);
    }
    for (const p of pads) for (let i = p.nr; i < 4; i++) p.u.uRings.value.setComponent(i, -1);
    while (ti < targets.length && targets[ti].j) ti++;
    label = `♪ ${ch.name} · ${hits}/${targets.length}`;
    const prog = clamp(songT / ch.len); flare += ((misses === 0 && prog > 0.5 ? (prog - 0.5) * 1.2 : 0) - flare) * Math.min(1, dt * 3);
    if (ti >= targets.length && songT > ch.len + 0.9) over();
  }
  function update(dt) {
    host.world(dt); if (!active) return; const T = host.time();
    if (camK < 1) { camK = Math.min(1, camK + dt / 1.3); const e = easeIO(camK); host.camPos.lerpVectors(camFrom, camTo, e); host.camLook.lerpVectors(lookFrom, lookTo, e); } else { host.camPos.copy(camTo); host.camLook.copy(lookTo); }
    if (state === 'play') step(dt); else if (state === 'over') flare += ((stars === 3 ? 1.3 + 0.3 * Math.sin(T * 2) : 0) - flare) * Math.min(1, dt * 1.5); else flare *= Math.exp(-dt * 2);
    pulse *= Math.exp(-dt * 6);
    for (const p of pads) {
      p.flash *= Math.exp(-dt * 6); p.bad *= Math.exp(-dt * 5); p.u.uFlash.value = p.flash; p.u.uBad.value = p.bad;
      p.u.uOn.value = state === 'menu' ? p.on * (0.6 + 0.35 * Math.sin(T * 2.4 + p.idx * 0.7) + (hoverI === p.idx ? 0.6 : 0)) : p.on * (1 + pulse * 0.5);
    }
    const playing = state === 'play', r = host.roof; r.uReveal.value += ((playing ? clamp(combo / Math.min(TUNE.full, Math.max(6, targets.length * 0.6))) : 1) - r.uReveal.value) * Math.min(1, dt * 8);
    r.uSize.value = host.roofSize * (1 + pulse * (playing ? 0.5 : 0)); host.aur.uGain.value = host.aurGain + flare * 2.4;
    hud();
  }

  function start() {
    if (active) return; active = true; exit.busy = false; LISTEN.forEach(([t, ev, f]) => t.addEventListener(ev, f, { passive: false })); bind(); group.visible = true;
    camFrom.copy(host.camPos); lookFrom.copy(host.camLook); camK = 0; frame(); flare = pulse = 0; if (!mute) audio.chime(4);
    if (song >= 1 && song <= 24) play(song); else menu();
  }
  function stop() {
    active = false; state = 'idle'; LISTEN.forEach(([t, ev, f]) => t.removeEventListener(ev, f)); group.visible = false; dom.style.cursor = 'default';
    host.roof.uReveal.value = 1; host.roof.uSize.value = host.roofSize; host.aur.uGain.value = host.aurGain; document.body.classList.remove('over', 'pick');
  }
  function resize(a) { aspect = a; frame(); }
  return {
    scene: host.scene, camera, inPlace: true, start, stop, update, resize, play, menu, free, tap,
    peek: () => ({ songT: +songT.toFixed(2), next: targets.slice(ti, ti + 4).map((n) => [n.pad, +n.t.toFixed(2)]), low }), // for the test harness
    get stats() { return { state, song: cur, diff, t: +songT.toFixed(1), targets: targets.length, hits, perfects, misses, score, combo, bestCombo, stars }; },
  };
}
