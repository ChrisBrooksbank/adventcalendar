// Shared building kit: materials, primitives, characters, weather, particles.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { THREE };

export const TAU = Math.PI * 2;
export const LK = 0.35; // global point-light scale
export const PX = { value: 1 }; // point-size scale, set by main on resize
export const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeBack = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// seeded randomness (the games build the same world for everyone on a given night)
export function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

// ---------- shared look ----------
// U.rim: a soft Fresnel edge light every standard material picks up (set per scene by main: cool moonlight at the house,
// each door's own colour inside), so the little primitive-built figures read as glowing toys against the night.
// U.time drives the glints in the snow. DETAIL scales curved geometry up on capable devices.
export const U = { time: { value: 0 }, rim: { value: new THREE.Color(0x000000) }, rimPow: { value: 2.6 } };
export let DETAIL = 1; export const setDetail = (d) => { DETAIL = d; };
const RIM_KEY = 'rim1';
function rimPatch(sh) {
  sh.uniforms.uRim = U.rim; sh.uniforms.uRimPow = U.rimPow;
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uRim; uniform float uRimPow;')
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ float fr = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), uRimPow); totalEmissiveRadiance += uRim * fr * diffuseColor.rgb * 1.6 + uRim * fr * 0.25; }');
}
export function withRim(m) { m.onBeforeCompile = rimPatch; m.customProgramCacheKey = () => RIM_KEY; return m; }

// ---------- materials & primitives ----------
export const M = (color, o = {}) => withRim(new THREE.MeshStandardMaterial({
  color, roughness: o.r ?? 0.85, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1,
  flatShading: !!o.flat, transparent: o.o !== undefined, opacity: o.o ?? 1, side: o.side ?? THREE.FrontSide,
}));
export const G = (color, i = 1.6, o = {}) => new THREE.MeshBasicMaterial({
  color: new THREE.Color(color).multiplyScalar(i), transparent: o.o !== undefined, opacity: o.o ?? 1,
  side: o.side ?? THREE.FrontSide, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !o.add,
});
const dd = (n, lo) => (n <= lo ? n : Math.round(n * DETAIL)); // low counts are deliberate facets (four-sided cones, flat-shaded rocks): keep those
export const sph = (r = 1, w = 16, h = 12) => new THREE.SphereGeometry(r, dd(w, 7), dd(h, 5));
export const box = (w = 1, h = 1, d = 1) => new THREE.BoxGeometry(w, h, d);
export const rbox = (w = 1, h = 1, d = 1, r = 0.08) => new RoundedBoxGeometry(w, h, d, DETAIL > 1 ? 3 : 2, Math.min(r, w / 2, h / 2, d / 2) * 0.999);
export const cyl = (rt = 1, rb = 1, h = 1, s = 12, open = false) => new THREE.CylinderGeometry(rt, rb, h, dd(s, 9), 1, open);
export const cone = (r = 1, h = 1, s = 12) => new THREE.ConeGeometry(r, h, dd(s, 9));
export const tor = (r = 1, t = 0.1, a = 8, b = 24, arc = TAU) => new THREE.TorusGeometry(r, t, dd(a, 6), dd(b, 12), arc);
export function mesh(geo, material, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); if (parent) parent.add(m); return m;
}
export function grp(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g;
}
export function put(o, parent, x = 0, y = 0, z = 0, s = 1, ry = 0) {
  o.position.set(x, y, z); o.scale.multiplyScalar(s); o.rotation.y = ry; parent.add(o); return o;
}
export function light(color, intensity, dist, x, y, z, parent) {
  const l = new THREE.PointLight(color, intensity * LK, dist, 1); l.position.set(x, y, z); if (parent) parent.add(l); return l;
}
export function prism(w, h, d) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g;
}
export function star3d(r = 1, depth = 0.2, pts = 5, inner = 0.45) {
  const s = new THREE.Shape();
  for (let i = 0; i < pts * 2; i++) {
    const a = (i / (pts * 2)) * TAU + Math.PI / 2, rr = i % 2 ? r * inner : r;
    i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g;
}

// ---------- textures & sprites ----------
function canvasTex(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let _glow, _ray, _flake; const _glyphs = {};
export const glowTex = () => _glow ??= canvasTex(128, (x) => {
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,.6)');
  g.addColorStop(0.55, 'rgba(255,255,255,.13)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
});
export const rayTex = () => _ray ??= canvasTex(256, (x) => {
  x.translate(128, 128);
  for (let i = 0; i < 8; i++) {
    const len = i % 2 ? 60 : 126, w = i % 2 ? 5 : 8;
    const g = x.createLinearGradient(0, 0, len, 0); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(0, -w); x.lineTo(len, 0); x.lineTo(0, w); x.fill(); x.rotate(TAU / 8);
  }
});
export const flakeTex = () => _flake ??= canvasTex(128, (x) => {
  x.translate(64, 64); x.strokeStyle = '#fff'; x.lineWidth = 5; x.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -54);
    for (const y of [-22, -38]) { x.moveTo(0, y); x.lineTo(-12, y - 12); x.moveTo(0, y); x.lineTo(12, y - 12); }
    x.stroke(); x.rotate(TAU / 6);
  }
});
export const glyphTex = (ch) => _glyphs[ch] ??= canvasTex(128, (x) => {
  x.fillStyle = '#fff'; x.font = 'bold 100px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 64, 70);
});
export function sprite(tex, color, size, x = 0, y = 0, z = 0, parent, opacity = 1, add = true) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, color, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false, transparent: true, opacity, fog: false,
  }));
  s.scale.setScalar(size); s.position.set(x, y, z); if (parent) parent.add(s); return s;
}
export const halo = (color, size, x, y, z, parent, opacity = 1) => sprite(glowTex(), color, size, x, y, z, parent, opacity);

// ---------- point systems ----------
export function snowfall(count = 1500, area = 30, height = 22, size = 1) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) { pos.set([rnd(-area, area), rnd(0, height), rnd(-area, area)], i * 3); seed[i] = Math.random(); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uH: { value: height }, uSize: { value: size }, uPx: PX }, transparent: true, depthWrite: false,
    vertexShader: `attribute float aSeed; uniform float uTime,uH,uSize,uPx; varying float vA;
      void main(){ vec3 p=position; float sp=.7+aSeed*1.3; p.y=mod(p.y-uTime*sp,uH);
      p.x+=sin(uTime*.5+aSeed*40.)*.9; p.z+=cos(uTime*.4+aSeed*31.)*.9;
      vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
      gl_PointSize=uPx*uSize*(45.+aSeed*60.)/-mv.z; vA=(.45+.55*aSeed)*smoothstep(0.,1.5,p.y); }`,
    fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); gl_FragColor=vec4(vec3(.95,.97,1.),smoothstep(.5,.15,d)*vA); }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.userData.tick = (t) => { mat.uniforms.uTime.value = t; };
  return pts;
}
// pts: array of [x,y,z,colorHex,order?]
export function twinkles(pts, size = 1, speed = 1, steady = 0.5) {
  const n = pts.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), seed = new Float32Array(n), ord = new Float32Array(n);
  const c = new THREE.Color();
  pts.forEach((p, i) => { pos.set([p[0], p[1], p[2]], i * 3); c.set(p[3] ?? 0xffffff); col.set([c.r, c.g, c.b], i * 3); seed[i] = Math.random(); ord[i] = p[4] ?? 0; });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1)); geo.setAttribute('aOrder', new THREE.BufferAttribute(ord, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: size }, uSpeed: { value: speed }, uReveal: { value: 1 }, uSteady: { value: steady }, uPx: PX },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec3 aColor; attribute float aSeed,aOrder; uniform float uTime,uSize,uSpeed,uReveal,uSteady,uPx; varying vec3 vC;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv;
      float tw=uSteady+(1.-uSteady)*(.5+.5*sin(uTime*uSpeed*(1.+aSeed*2.)+aSeed*60.));
      float on=smoothstep(aOrder-.02,aOrder+.02,uReveal+.0001);
      gl_PointSize=uPx*uSize*(60.+40.*aSeed)*tw*on/-mv.z; vC=aColor*tw*on; }`,
    fragmentShader: `varying vec3 vC; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d); gl_FragColor=vec4(vC*a*a*2.2,1.); }`,
  });
  const p = new THREE.Points(geo, mat); p.frustumCulled = false; p.userData.tick = (t) => { mat.uniforms.uTime.value = t; };
  p.userData.u = mat.uniforms; return p;
}
export function starfield(n = 900, R = 170) {
  const pts = [], cols = [0xffffff, 0xcfe0ff, 0xfff1d0, 0xffffff];
  for (let i = 0; i < n; i++) {
    const a = rnd(TAU), y = Math.pow(Math.random(), 0.8) * 0.98 + 0.02, r = Math.sqrt(1 - y * y);
    pts.push([Math.cos(a) * r * R, y * R, Math.sin(a) * r * R, pick(cols)]);
  }
  return twinkles(pts, rnd(5, 6), 0.8, 0.45);
}
export class Particles {
  constructor(n = 1500) {
    this.n = n; this.i = 0; this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3); this.sz = new Float32Array(n);
    this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.max = new Float32Array(n); this.s0 = new Float32Array(n); this.grav = new Float32Array(n);
    const geo = this.geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.sz, 1));
    this.points = new THREE.Points(geo, new THREE.ShaderMaterial({
      uniforms: { uPx: PX }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec3 aColor; attribute float aSize; uniform float uPx; varying vec3 vC;
        void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=uPx*aSize*90./-mv.z; vC=aColor; }`,
      fragmentShader: `varying vec3 vC; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d); gl_FragColor=vec4(vC*a*a*2.,1.); }`,
    }));
    this.points.frustumCulled = false; this._c = new THREE.Color();
  }
  emit(x, y, z, vx, vy, vz, color, life = 1, size = 1, grav = 0) {
    const i = this.i; this.i = (i + 1) % this.n; this._c.set(color);
    this.pos.set([x, y, z], i * 3); this.vel.set([vx, vy, vz], i * 3); this.col.set([this._c.r, this._c.g, this._c.b], i * 3);
    this.life[i] = this.max[i] = life; this.s0[i] = size; this.grav[i] = grav;
  }
  burst(x, y, z, n, speed, colors, life = 1.2, size = 1, grav = 1) {
    for (let k = 0; k < n; k++) {
      const a = rnd(TAU), b = Math.acos(rnd(-1, 1)), s = speed * rnd(0.3, 1);
      this.emit(x, y, z, Math.sin(b) * Math.cos(a) * s, Math.cos(b) * s, Math.sin(b) * Math.sin(a) * s, pick(colors), life * rnd(0.5, 1), size * rnd(0.5, 1.2), grav);
    }
  }
  update(dt) {
    const { pos, vel, life, max, sz, s0, grav } = this;
    for (let i = 0; i < this.n; i++) {
      if (life[i] <= 0) { if (sz[i] !== 0) sz[i] = 0; continue; }
      life[i] -= dt; const j = i * 3; vel[j + 1] -= grav[i] * dt;
      pos[j] += vel[j] * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt;
      const f = Math.max(0, life[i] / max[i]); sz[i] = s0[i] * Math.sqrt(f) * (0.7 + 0.3 * Math.sin(life[i] * 30 + i));
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aSize.needsUpdate = true; this.geo.attributes.aColor.needsUpdate = true;
  }
}

// ---------- sky ----------
export function skyDome(top, bottom, R = 200) {
  return new THREE.Mesh(new THREE.SphereGeometry(R, 24, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: { uT: { value: new THREE.Color(top) }, uB: { value: new THREE.Color(bottom) } },
    vertexShader: `varying float vH; void main(){ vH=normalize(position).y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uT,uB; varying float vH; void main(){ gl_FragColor=vec4(mix(uB,uT,pow(clamp(vH*1.15,0.,1.),.55)),1.); }`,
  }));
}
export function aurora(R = 130, y = 28, h = 55, a = 0x35ffb0, b = 0x9050ff, gain = 1, arc = 2.6) {
  const geo = new THREE.CylinderGeometry(R, R, h, 96, 1, true, Math.PI - arc / 2, arc);
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uA: { value: new THREE.Color(a) }, uB: { value: new THREE.Color(b) }, uGain: { value: gain } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uTime,uGain; uniform vec3 uA,uB; varying vec2 vUv;
      void main(){ float x=vUv.x, v=vUv.y;
      float n=sin(x*18.+uTime*.25)+.5*sin(x*43.-uTime*.18+2.*sin(uTime*.1+x*9.));
      float base=.12+.1*n; float prof=smoothstep(base-.1,base+.03,v)*pow(max(0.,1.-(v-base)),3.);
      float rays=.55+.45*sin(x*260.+n*4.+uTime*.6); float cur=smoothstep(-.9,1.2,n);
      float edge=smoothstep(0.,.12,x)*smoothstep(1.,.88,x);
      vec3 c=mix(uA,uB,clamp(v*1.5+.15*sin(uTime*.2+x*6.),0.,1.));
      gl_FragColor=vec4(c*prof*rays*cur*edge*uGain*.75,1.); }`,
  });
  const m = new THREE.Mesh(geo, mat); m.position.y = y; m.frustumCulled = false; m.userData.tick = (t) => { mat.uniforms.uTime.value = t; }; return m;
}
export function moon(r = 4, x = 0, y = 0, z = 0, parent) {
  const g = grp(parent, x, y, z); mesh(sph(r, 32, 24), G(0xfff6dc, 1.25), 0, 0, 0, g);
  for (let i = 0; i < 7; i++) { const c = mesh(sph(r * rnd(0.08, 0.2), 10, 8), G(0xe9dcb8, 1.1), 0, 0, 0, g); c.position.setFromSphericalCoords(r * 0.97, rnd(0.6, 2.4), rnd(-0.9, 0.9)); c.scale.z = 0.3; c.lookAt(g.position); }
  halo(0xcfe0ff, r * 9, 0, 0, -1, g, 0.55); return g;
}
export function bethStar(size = 3, parent, x = 0, y = 0, z = 0) {
  const g = grp(parent, x, y, z); const rays = sprite(rayTex(), 0xfff3c4, size * 3, 0, 0, 0, g); const rays2 = sprite(rayTex(), 0xffe9a0, size * 1.8, 0, 0, 0, g, 0.7);
  const h = halo(0xfff0c0, size * 2.4, 0, 0, 0, g, 0.9); mesh(sph(size * 0.09, 12, 8), G(0xffffff, 3), 0, 0, 0, g);
  g.userData.tick = (t) => { rays.material.rotation = t * 0.08; rays2.material.rotation = -t * 0.13 + 0.4; const s = 1 + 0.08 * Math.sin(t * 2.3); h.scale.setScalar(size * 2.4 * s); rays.scale.setScalar(size * 3 * (1 + 0.05 * Math.sin(t * 1.7))); };
  return g;
}
export function beam(h = 10, rTop = 0.15, rBot = 2, color = 0xfff0c0, opacity = 0.16) {
  const m = mesh(cyl(rTop, rBot, h, 24, true), G(color, 1, { o: opacity, add: true, side: THREE.DoubleSide })); m.geometry.translate(0, -h / 2, 0); return m;
}

// ---------- landscape ----------
export const hillH = (x, z) => Math.sin(x * 0.21 + 1.3) * Math.cos(z * 0.17) * 1.2 + Math.sin(x * 0.07 + z * 0.11) * 2.2;
export function snowGround(R = 110, bump = 0.6, color = 0xc2d0ee, flat = 9) {
  const geo = new THREE.PlaneGeometry(R * 2, R * 2, 72, 72); geo.rotateX(-Math.PI / 2); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z); p.setY(i, hillH(x, z) * smooth(flat, flat + 26, d) * bump + Math.sin(x * 1.3) * Math.cos(z * 1.1) * 0.04); }
  geo.computeVertexNormals(); return mesh(geo, sparkleSnow(M(color, { r: 0.95 })));
}
// Glints in the snow: a sparse grid of tiny facets, each catching the eye at its own viewing angle, so the
// sparkles come and go as the camera drifts (and with the slow passing of time). Bloom turns them into stars.
export const SPARKLE = { value: 1 };
export function sparkleSnow(m) {
  m.onBeforeCompile = (sh) => {
    rimPatch(sh); sh.uniforms.uTime = U.time; sh.uniforms.uSpk = SPARKLE;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSpk;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSpk = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSpk; uniform float uTime, uSpk;\nfloat spkH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { vec2 q = vSpk.xz * 9.; vec2 c = floor(q); float h = spkH(c);
        vec2 jit = vec2(spkH(c + 7.1), spkH(c + 3.7)) * .7 + .15; float d = length(fract(q) - jit);
        float a = fract(h * 31. + dot(normalize(vViewPosition), vec3(3.1, 2.3, 1.7)) * 2.2 + uTime * .05);
        float g = step(.72, h) * smoothstep(.045, 0., abs(a - .5)) * smoothstep(.2, .02, d);
        float fade = smoothstep(46., 8., length(vViewPosition));
        totalEmissiveRadiance += vec3(1., .97, .9) * g * fade * 4. * uSpk; }`);
  };
  m.customProgramCacheKey = () => 'sparkle1'; return m;
}
export const groundY = (x, z, bump = 0.6, flat = 9) => hillH(x, z) * smooth(flat, flat + 26, Math.hypot(x, z)) * bump;
// A tiling texture of soft blue hollows and bright drifts for a big, scrolling snowfield.
export function groundTex() {
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
const PINE_KINDS = 6, _pines = {}; let _pineMat;
export function pine(h = 3, snowy = true) {
  const g = new THREE.Group(); _pineMat ??= Object.assign(M(0xffffff, { r: 0.92 }), { vertexColors: true });
  const tree = mesh(pineGeometry(snowy, Math.floor(rnd(PINE_KINDS))), _pineMat, 0, 0, 0, g), w = h * rnd(0.88, 1.12);
  tree.scale.set(w, h, w); tree.rotation.y = rnd(TAU);
  return g;
}
// A unit-height fir (top at about 1.07) built from tiers of drooping boughs: each tier is a faceted skirt whose rim
// alternates between long, sagging bough tips and tucked-in gaps, with a ragged blanket of snow lying on top.
// About 500 triangles in one vertex-coloured mesh; a handful of variants are built once and shared by every tree
// (including the delivery game's instanced forests), so a whole wood is cheap to build and to draw.
export function pineGeometry(snowy = true, kind = 0) {
  const key = (snowy ? 's' : 'g') + (kind % PINE_KINDS); if (_pines[key]) return _pines[key];
  const P = [], C = [], a = new THREE.Vector3(), b = new THREE.Vector3(), n = new THREE.Vector3();
  // one flat triangle from [x, y, z, colour] corners, wound so that it faces up (or down)
  function tri(p, q, r, up = true) {
    n.crossVectors(a.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]), b.set(r[0] - p[0], r[1] - p[1], r[2] - p[2]));
    for (const v of (n.y > 0) === up ? [p, q, r] : [p, r, q]) { P.push(v[0], v[1], v[2]); C.push(v[3].r, v[3].g, v[3].b); }
  }
  const shade = (c, l, s = 0) => c.clone().offsetHSL(0, s, l);
  const green = new THREE.Color(0x1f5c42).offsetHSL(rnd(-0.02, 0.02), rnd(-0.04, 0.04), rnd(-0.02, 0.02));
  const tip = shade(green, 0.07, 0.04), deep = shade(green, -0.06), under = shade(green, -0.11), bark = new THREE.Color(0x5a3d2a);
  const white = new THREE.Color(0xf6f9ff), drift = new THREE.Color(0xd3e0f6), lx = rnd(-0.03, 0.03), lz = rnd(-0.03, 0.03), TIERS = 7;
  for (let i = 0; i < 6; i++) { // trunk
    const a0 = (i / 6) * TAU, a1 = ((i + 1) / 6) * TAU, q = (ang, y, r) => [Math.cos(ang) * r + lx * y, y, Math.sin(ang) * r + lz * y, bark];
    const v = [q(a0, 0, 0.05), q(a1, 0, 0.05), q(a1, 0.5, 0.022), q(a0, 0.5, 0.022)]; n.set(Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2));
    for (const [p, q2, r] of [[v[0], v[1], v[2]], [v[0], v[2], v[3]]]) { // wound to face outwards
      const out = a.set(q2[0] - p[0], q2[1] - p[1], q2[2] - p[2]).cross(b.set(r[0] - p[0], r[1] - p[1], r[2] - p[2])).dot(n) > 0;
      for (const c of out ? [p, q2, r] : [p, r, q2]) { P.push(c[0], c[1], c[2]); C.push(bark.r, bark.g, bark.b); }
    }
  }
  for (let i = 0; i < TIERS; i++) {
    const t = i / (TIERS - 1), y0 = 0.13 + 0.118 * i, R = 0.35 * Math.pow(1 - t, 0.9) + 0.055, H = 0.3 - 0.07 * t;
    const N = Math.round(lerp(10, 6, t)), twist = rnd(TAU), cx = lx * y0, cz = lz * y0, top = [cx + lx * H, y0 + H, cz + lz * H, deep], rim = [], snow = [];
    for (let k = 0; k < N * 2; k++) {
      const bough = k % 2 === 0, ang = twist + (k * Math.PI) / N + rnd(-0.1, 0.1), r = R * (bough ? rnd(0.9, 1.14) : rnd(0.52, 0.66));
      const p = [cx + Math.cos(ang) * r, y0 + (bough ? -R * rnd(0.1, 0.24) : 0.025), cz + Math.sin(ang) * r, bough ? tip : deep]; rim.push(p);
      // snow lies thick near the trunk and thins out along each bough; a few boughs are laden right to the tip
      const f = bough ? (Math.random() < 0.35 ? 1 : rnd(0.55, 0.9)) : rnd(0.56, 0.78);
      snow.push([lerp(top[0], p[0], f), lerp(top[1], p[1], f) + 0.013, lerp(top[2], p[2], f), f > 0.7 ? drift : white]);
    }
    const base = [cx, y0 + 0.03, cz, under], cap = [top[0], top[1] + 0.02, top[2], white];
    for (let k = 0; k < N * 2; k++) {
      const k2 = (k + 1) % (N * 2); tri(top, rim[k], rim[k2]); tri(base, rim[k], rim[k2], false);
      if (snowy) tri(cap, snow[k], snow[k2]);
    }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  geo.computeVertexNormals(); geo.computeBoundingSphere(); return (_pines[key] = geo);
}
export function forest(parent, n, r0, r1, bump = 0.6, keep = (x, z) => !(z > 2 && Math.abs(x) < z * 0.75 + 3)) {
  for (let i = 0; i < n; i++) {
    const a = rnd(TAU), r = rnd(r0, r1), x = Math.cos(a) * r, z = Math.sin(a) * r; if (!keep(x, z)) continue;
    put(pine(rnd(2.2, 5.5)), parent, x, groundY(x, z, bump) - 0.1, z);
  }
}
export function cloud(n = 7, s = 1, color = 0xdfe8ff) {
  const g = new THREE.Group(), m = M(color, { r: 1, e: 0x223355, ei: 0.4 });
  for (let i = 0; i < n; i++) { const b = mesh(sph(rnd(0.6, 1.2) * s, 12, 9), m, rnd(-1.6, 1.6) * s, rnd(-0.2, 0.3) * s, rnd(-0.7, 0.7) * s, g); b.scale.y = 0.65; }
  return g;
}

// ---------- props ----------
export function win(parent, x, y, z, w = 0.5, h = 0.6, ry = 0, color = 0xffc866, gain = 1.7) {
  const g = grp(parent, x, y, z); g.rotation.y = ry; const glass = mesh(box(w, h, 0.04), G(color, gain), 0, 0, 0, g);
  const d = M(0x2a1a12), f = M(0xf0e8dc, { r: 0.7 }), t = Math.min(w, h) * 0.09;
  mesh(box(w * 0.94, 0.03, 0.07), d, 0, 0, 0, g); mesh(box(0.03, h * 0.94, 0.07), d, 0, 0, 0, g); // glazing bars
  for (const sy of [-1, 1]) mesh(box(w + t * 2, t, 0.09), f, 0, sy * (h / 2 + t / 2), 0.01, g); // frame
  for (const sx of [-1, 1]) mesh(box(t, h, 0.09), f, sx * (w / 2 + t / 2), 0, 0.01, g);
  mesh(box(w + t * 3.2, 0.06, 0.16), M(0xf4f8ff), 0, -h / 2 - t - 0.02, 0.05, g); // the sill, snow on it
  mesh(sph(w * 0.5, 10, 6), M(0xf4f8ff), 0, -h / 2 - t + 0.02, 0.06, g).scale.set(1, 0.14, 0.2);
  g.userData.glass = glass; return g;
}
export function house(o = {}) {
  const w = o.w ?? 3, h = o.h ?? 2.2, d = o.d ?? 3, rh = o.rh ?? 1.5, g = new THREE.Group(), wall = M(o.color ?? 0xa86b4a);
  const trim = M(0xf0e8dc, { r: 0.7 }), wallC = new THREE.Color(o.color ?? 0xa86b4a), shut = M(wallC.clone().offsetHSL(0.45, -0.1, -0.12)), snowM = M(0xf4f8ff, { r: 0.95 });
  mesh(rbox(w, h, d, 0.06), wall, 0, h / 2, 0, g);
  mesh(box(w + 0.08, 0.22, d + 0.08), M(wallC.clone().offsetHSL(0, -0.15, -0.14)), 0, 0.11, 0, g); // a plinth
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(box(0.12, h, 0.12), trim, sx * w / 2, h / 2, sz * d / 2, g); // corner boards
  mesh(prism(w + 0.5, rh + 0.12, d + 0.5), snowM, 0, h - 0.04, 0, g);
  mesh(prism(w + 0.1, rh - 0.08, d + 0.54), wall, 0, h - 0.04, 0, g);
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) { const b = mesh(box(Math.hypot(w / 2 + 0.25, rh + 0.12) + 0.05, 0.08, 0.06), trim, sx * (w / 4 + 0.06), h + rh / 2, sz * (d / 2 + 0.27), g); b.rotation.z = -sx * Math.atan2(rh + 0.12, w / 2 + 0.25); } // bargeboards
  // icicles along both eaves
  const ice = M(0xdcecff, { r: 0.15, m: 0.1, e: 0x8fb8ff, ei: 0.25 });
  for (const sz of [-1, 1]) for (let i = 0; i < Math.round(d * 3); i++) { const len = 0.08 + Math.abs(Math.sin(i * 2.3 + sz)) * 0.22, ic = mesh(cone(0.035, len, 5), ice, 0, 0, 0, g); ic.position.set(sz * (w / 2 + 0.24), h - 0.05 - len / 2, -d / 2 - 0.2 + (i + 0.5) * (d + 0.4) / Math.round(d * 3)); ic.rotation.x = Math.PI; }
  const wy = h * 0.55, glass = [];
  for (const sx of [-1, 1]) {
    glass.push(win(g, sx * w * 0.28, wy, d / 2 + 0.02, w * 0.2, h * 0.3).userData.glass);
    for (const k of [-1, 1]) mesh(box(w * 0.08, h * 0.34, 0.04), shut, sx * w * 0.28 + k * w * 0.16, wy, d / 2 + 0.04, g); // shutters
    glass.push(win(g, sx * (w / 2 + 0.02), wy, 0, d * 0.22, h * 0.3, Math.PI / 2).userData.glass);
  }
  if (o.attic !== false) glass.push(win(g, 0, h + rh * 0.35, d / 2 + 0.28, w * 0.14, rh * 0.25).userData.glass);
  // the front door: frame, knocker, a wreath, a lantern and a snowy step
  const dw = w * 0.17, dh = h * 0.55, dz = d / 2 + 0.02;
  mesh(rbox(dw, dh, 0.06, 0.02), M(o.door ?? 0x6b1f1f), 0, dh / 2, dz, g);
  mesh(box(dw + 0.14, 0.08, 0.1), trim, 0, dh + 0.04, dz, g); for (const sx of [-1, 1]) mesh(box(0.07, dh, 0.1), trim, sx * (dw / 2 + 0.035), dh / 2, dz, g);
  mesh(sph(0.03, 8, 6), M(0xffd34d, { m: 0.9, r: 0.25 }), dw * 0.3, dh * 0.48, dz + 0.05, g);
  const wr = mesh(tor(dw * 0.26, dw * 0.08, 6, 16), M(0x1f5a36, { r: 0.8 }), 0, dh * 0.7, dz + 0.06, g); wr.userData.noBounce = true;
  for (let i = 0; i < 5; i++) mesh(sph(dw * 0.045, 6, 5), M(0xd0101c, { e: 0x500000 }), Math.cos(i * 1.3) * dw * 0.26, dh * 0.7 + Math.sin(i * 1.3) * dw * 0.26, dz + 0.1, g);
  mesh(box(dw + 0.5, 0.12, 0.35), M(0x8a8478, { flat: true }), 0, 0.06, dz + 0.17, g); mesh(box(dw + 0.52, 0.04, 0.37), snowM, 0, 0.14, dz + 0.17, g);
  mesh(box(0.1, 0.16, 0.1), G(0xffc866, 1.8), dw / 2 + 0.22, dh * 0.82, dz + 0.06, g); mesh(cone(0.1, 0.08, 4), M(0x1c1c22, { m: 0.6 }), dw / 2 + 0.22, dh * 0.82 + 0.12, dz + 0.06, g).rotation.y = Math.PI / 4;
  // a brick chimney, a little soot at the top, snow on the cap
  const ch = grp(g, w * 0.25, h + rh * 0.55, -d * 0.15), brick = M(0x7a4a3a, { flat: true }), mortar = M(0x5e3a2e);
  mesh(box(0.4, rh * 0.9, 0.4), brick, 0, 0, 0, ch); for (let i = 0; i < 4; i++) mesh(box(0.42, 0.02, 0.42), mortar, 0, -rh * 0.3 + i * rh * 0.2, 0, ch);
  mesh(box(0.48, 0.08, 0.48), M(0x4a3a34), 0, rh * 0.45, 0, ch); mesh(box(0.5, 0.1, 0.5), snowM, 0, rh * 0.52, 0, ch);
  g.userData = { glass, chimney: new THREE.Vector3(w * 0.25, h + rh * 1.05, -d * 0.15) }; return g;
}
export function present(s = 0.5, color = 0xc8102e, ribbon = 0xffd34d) {
  const g = new THREE.Group(), r = M(ribbon, { m: 0.5, r: 0.35 });
  mesh(rbox(s, s * 0.8, s, s * 0.07), M(color, { r: 0.5 }), 0, s * 0.4, 0, g);
  mesh(box(s * 1.03, s * 0.82, s * 0.16), r, 0, s * 0.4, 0, g); mesh(box(s * 0.16, s * 0.82, s * 1.03), r, 0, s * 0.4, 0, g);
  for (const sx of [-1, 1]) { const b = mesh(tor(s * 0.13, s * 0.045, 6, 12), r, sx * s * 0.13, s * 0.88, 0, g); b.rotation.y = Math.PI / 2; b.rotation.x = sx * 0.5; }
  return g;
}
export const GIFT = [[0xc8102e, 0xffd34d], [0x1f7a4a, 0xffffff], [0x2a5db0, 0xffd34d], [0x7a2f9a, 0xffe08a], [0xe0a020, 0xc8102e], [0xf2f2f2, 0xc8102e], [0x0f8a8a, 0xffffff]];
export const gift = (s = 0.5) => { const [a, b] = pick(GIFT); return present(s, a, b); };
export function lampPost(h = 3) {
  const g = new THREE.Group(), d = M(0x1c1c22, { m: 0.6, r: 0.5 });
  mesh(cyl(0.05, 0.08, h, 8), d, 0, h / 2, 0, g); mesh(cyl(0.14, 0.1, 0.2, 8), d, 0, 0.1, 0, g);
  const lamp = mesh(box(0.3, 0.4, 0.3), G(0xffd080, 2.2), 0, h + 0.2, 0, g); mesh(cone(0.3, 0.22, 4), d, 0, h + 0.5, 0, g).rotation.y = Math.PI / 4;
  mesh(cone(0.25, 0.14, 4), M(0xf4f8ff), 0, h + 0.62, 0, g).rotation.y = Math.PI / 4;
  const hl = halo(0xffc060, 3, 0, h + 0.2, 0, g, 0.6); const l = light(0xffc070, 14, 12, 0, h + 0.2, 0.3, g);
  g.userData = { lamp, hl, l }; return g;
}
export function fire(s = 1) {
  const g = new THREE.Group(), fl = [];
  [[0xff5a10, 0.3, 0.9], [0xff9a20, 0.22, 0.7], [0xffe070, 0.12, 0.45]].forEach(([c, r, h], i) => {
    for (let k = 0; k < (i ? 2 : 3); k++) { const f = mesh(cone(r * s, h * s, 8), G(c, 1.8, { o: 0.9 }), rnd(-0.12, 0.12) * s, h * s / 2, rnd(-0.08, 0.08) * s + i * 0.03, g); f.userData = { h: h * s, p: rnd(TAU) }; fl.push(f); }
  });
  for (let i = 0; i < 3; i++) { const lg = mesh(cyl(0.07 * s, 0.07 * s, 0.9 * s, 6), M(0x3a2414), 0, 0.06 * s, 0, g); lg.rotation.z = Math.PI / 2; lg.rotation.y = i * 1.1; }
  const l = light(0xff8030, 18, 14, 0, 0.6 * s, 0.4, g); const hl = halo(0xff7020, 4 * s, 0, 0.5 * s, 0, g, 0.5);
  g.userData.tick = (t) => {
    fl.forEach((f) => { const k = 0.8 + 0.3 * Math.sin(t * 11 + f.userData.p) + 0.15 * Math.sin(t * 23 + f.userData.p * 2); f.scale.y = k; f.position.y = f.userData.h * k / 2; });
    l.intensity = (g.userData.power ?? 18) * (0.85 + 0.15 * Math.sin(t * 13) + 0.1 * Math.sin(t * 29)) * LK;
  };
  g.userData.l = l; g.userData.hl = hl; return g;
}
export function candle(h = 0.4, color = 0xf3e9d0) {
  const g = new THREE.Group(); mesh(cyl(0.045, 0.045, h, 8), M(color), 0, h / 2, 0, g);
  const f = mesh(sph(0.04, 8, 6), G(0xffd070, 3), 0, h + 0.06, 0, g); f.scale.y = 1.8; halo(0xffb040, 0.7, 0, h + 0.06, 0, g, 0.7);
  g.userData.tick = (t) => { f.scale.y = 1.7 + 0.3 * Math.sin(t * 9 + h * 50); }; return g;
}

// ---------- characters ----------
const COAL = () => M(0x111114, { r: 0.4 });
// A robe that falls in soft folds: a lathe profile flaring to the hem, with pleats that fade out towards the shoulders.
let _robe;
const robeGeo = () => _robe ??= (() => {
  const prof = [[0, 0.02], [0.3, 0.02], [0.335, 0.06], [0.3, 0.3], [0.245, 0.58], [0.19, 0.86], [0.175, 0.98], [0.15, 1.08], [0.06, 1.14], [0, 1.15]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(prof, dd(22, 9)), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(z, x), k = 1 + 0.07 * Math.sin(a * 7) * smooth(0.95, 0.1, y); p.setX(i, x * k); p.setZ(i, z * k); }
  g.computeVertexNormals(); return g;
})();
export function figure(o = {}) {
  const g = new THREE.Group(), robe = M(o.robe ?? 0x8a3a3a), skin = M(o.skin ?? 0xe8b996, { r: 0.7 }), body = grp(g), dark = COAL();
  const robeD = M(new THREE.Color(o.robe ?? 0x8a3a3a).offsetHSL(0, 0, -0.08));
  mesh(robeGeo(), robe, 0, 0, 0, body); mesh(sph(0.165, 12, 8), robe, 0, 1.06, 0, body).scale.set(1.15, 0.7, 0.9); // (the robe stays the body's first child: others read its colour)
  mesh(tor(0.315, 0.03, 6, 22), robeD, 0, 0.07, 0, body).rotation.x = Math.PI / 2; // a turned hem
  for (const sx of [-1, 1]) mesh(sph(0.075, 10, 7), M(0x3a2618, { r: 0.6 }), sx * 0.1, 0.05, 0.25, body).scale.set(0.9, 0.5, 1.4); // toes peeping out
  if (o.trim) { mesh(tor(0.33, 0.045, 6, 22), M(o.trim, { m: 0.6, r: 0.35 }), 0, 0.1, 0, body).rotation.x = Math.PI / 2; mesh(box(0.05, 0.9, 0.03), M(o.trim, { m: 0.6, r: 0.35 }), 0, 0.6, 0.235, body).rotation.x = -0.1; }
  mesh(tor(0.185, o.sash ? 0.035 : 0.022, 6, 16), M(o.sash ?? new THREE.Color(o.robe ?? 0x8a3a3a).offsetHSL(0, -0.1, -0.15).getHex()), 0, 0.68, 0, body).rotation.x = Math.PI / 2; // belt or sash
  mesh(cyl(0.06, 0.07, 0.1, 10), skin, 0, 1.15, 0, body); // neck
  const head = grp(body, 0, 1.3, 0); mesh(sph(0.155, 16, 12), skin, 0, 0, 0, head).scale.set(0.95, 1.05, 1);
  mesh(sph(0.03, 8, 6), skin, 0, -0.01, 0.152, head).scale.set(0.9, 1, 1.1); // nose
  for (const sx of [-1, 1]) {
    mesh(sph(0.036, 8, 6), skin, sx * 0.148, 0, -0.005, head).scale.set(0.5, 1, 0.8); // ear
    mesh(sph(0.026, 8, 6), M(0xffffff, { r: 0.3 }), sx * 0.055, 0.03, 0.13, head).scale.set(1, 0.85, 0.6);
    mesh(sph(0.016, 8, 6), dark, sx * 0.055, 0.028, 0.146, head);
    const br = mesh(box(0.05, 0.011, 0.012), M(o.beard ?? 0x3a2618), sx * 0.056, 0.068, 0.142, head); br.rotation.z = -sx * 0.15; // brow
    mesh(sph(0.03, 8, 6), M(0xe89a8a, { r: 1, o: 0.35 }), sx * 0.085, -0.035, 0.12, head).scale.set(1, 0.7, 0.4); // cheek
  }
  const mouth = mesh(tor(0.03, 0.007, 4, 10, Math.PI), M(0x8a3a30), 0, -0.06, 0.142, head); mouth.rotation.z = Math.PI;
  const hc = M(o.hat ?? o.robe ?? 0x8a3a3a);
  switch (o.head) {
    case 'veil': mesh(sph(0.185, 14, 10), hc, 0, 0.025, -0.055, head); mesh(cyl(0.17, 0.26, 0.55, 12), hc, 0, -0.3, -0.07, head); mesh(tor(0.168, 0.018, 5, 18), M(new THREE.Color(o.hat ?? 0x8a3a3a).offsetHSL(0, 0, -0.12)), 0, 0.075, 0, head).rotation.x = Math.PI / 2 - 0.35; break;
    case 'crown': {
      const gold = M(0xffd34d, { m: 0.8, r: 0.25, e: 0x664400, side: THREE.DoubleSide }); mesh(cyl(0.13, 0.11, 0.11, 8, true), gold, 0, 0.17, 0, head); mesh(sph(0.15, 12, 8), hc, 0, 0.04, -0.02, head).scale.y = 0.9;
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8; mesh(cone(0.022, 0.06, 4), gold, Math.cos(a) * 0.125, 0.25, Math.sin(a) * 0.125, head); }
      mesh(sph(0.022, 8, 6), G(0xff4060, 1.6), 0, 0.17, 0.125, head); break;
    }
    case 'turban': mesh(sph(0.19, 12, 8), hc, 0, 0.1, -0.01, head).scale.y = 0.62; mesh(tor(0.16, 0.04, 6, 16), hc, 0, 0.07, 0, head).rotation.x = Math.PI / 2; mesh(sph(0.035), G(0xff5050, 1.5), 0, 0.12, 0.17, head); break;
    case 'tophat': mesh(cyl(0.2, 0.2, 0.025, 14), hc, 0, 0.12, 0, head); mesh(cyl(0.125, 0.135, 0.26, 14), hc, 0, 0.25, 0, head); mesh(cyl(0.137, 0.137, 0.04, 14), M(0xc8102e), 0, 0.15, 0, head); break;
    case 'bobble': mesh(sph(0.17, 12, 8), hc, 0, 0.05, -0.01, head).scale.y = 0.8; mesh(tor(0.16, 0.035, 6, 16), M(0xffffff), 0, 0, 0, head).rotation.x = Math.PI / 2; mesh(sph(0.055), M(0xffffff), 0, 0.2, 0, head); break;
    case 'bonnet': mesh(sph(0.185, 12, 8), hc, 0, 0.03, -0.05, head); mesh(tor(0.17, 0.03, 6, 16), M(0xffffff), 0, 0.03, 0.03, head); break;
    case 'hair': mesh(sph(0.165, 12, 8), hc, 0, 0.03, -0.03, head); for (const sx of [-1, 1]) mesh(sph(0.07, 8, 6), hc, sx * 0.12, -0.07, -0.05, head).scale.set(0.6, 1.4, 0.9); break;
  }
  if (o.beard) { const bm = M(o.beard, { r: 1 }); mesh(sph(0.11, 10, 8), bm, 0, -0.11, 0.07, head).scale.set(1, 1.15, 0.7); for (const sx of [-1, 1]) mesh(sph(0.04, 8, 6), bm, sx * 0.035, -0.045, 0.14, head).scale.set(1.3, 0.55, 0.6); mouth.visible = false; }
  if (o.scarf) mesh(tor(0.13, 0.05, 6, 14), M(o.scarf), 0, 1.15, 0, body).rotation.x = Math.PI / 2;
  const arms = [-1, 1].map((sx) => {
    const a = grp(body, sx * 0.19, 1.04, 0); a.rotation.z = sx * 0.18;
    mesh(cyl(0.05, 0.085, 0.5, 10), robe, 0, -0.25, 0, a); mesh(tor(0.08, 0.016, 5, 12), robeD, 0, -0.49, 0, a).rotation.x = Math.PI / 2; // a sleeve, wider at the cuff
    mesh(sph(0.05, 8, 6), skin, 0, -0.54, 0, a).scale.set(0.9, 1.15, 0.8); mesh(sph(0.02, 6, 5), skin, 0.035 * -sx, -0.52, 0.025, a); return a; // hand and thumb
  });
  if (o.staff) { mesh(cyl(0.022, 0.022, 1.7, 6), M(0x5a3a1c), 0, 0.3, 0.05, arms[1]).position.y = -0.2; arms[1].rotation.x = -0.9; if (o.staff === 'crook') mesh(tor(0.09, 0.022, 5, 10, Math.PI), M(0x5a3a1c), 0.09, 0.65, 0.05, arms[1]); }
  if (o.h) g.scale.setScalar(o.h);
  g.userData = { head, armL: arms[0], armR: arms[1], body }; return g;
}
export function walk(f, t, sp = 5, amp = 0.5) {
  const u = f.userData; u.body.position.y = Math.abs(Math.sin(t * sp)) * 0.05; u.body.rotation.z = Math.sin(t * sp) * 0.04;
  if (!u.fixL) u.armL.rotation.x = Math.sin(t * sp) * amp; if (!u.fixR) u.armR.rotation.x = -Math.sin(t * sp) * amp;
}
export function santa() {
  const g = new THREE.Group(), red = M(0xc4131f, { r: 0.7 }), fur = M(0xffffff, { r: 1 }), skin = M(0xf0c0a0), blk = M(0x15151a, { r: 0.4 }), body = grp(g);
  mesh(sph(0.5, 18, 14), red, 0, 0.82, 0, body).scale.set(1, 1.12, 0.92); mesh(cyl(0.44, 0.58, 0.55, 18), red, 0, 0.42, 0, body);
  mesh(tor(0.58, 0.075, 8, 24), fur, 0, 0.17, 0, body).rotation.x = Math.PI / 2; mesh(box(0.13, 0.95, 0.1), fur, 0, 0.72, 0.47, body);
  mesh(tor(0.51, 0.05, 6, 24), blk, 0, 0.72, 0, body).rotation.x = Math.PI / 2; mesh(box(0.2, 0.16, 0.05), M(0xffd34d, { m: 0.8, r: 0.3 }), 0, 0.72, 0.52, body);
  for (const sx of [-1, 1]) mesh(sph(0.16, 10, 8), blk, sx * 0.22, 0.07, 0.12, g).scale.set(1, 0.6, 1.5);
  const head = grp(body, 0, 1.5, 0); mesh(sph(0.25, 16, 12), skin, 0, 0, 0, head);
  mesh(sph(0.26, 16, 12), fur, 0, -0.16, 0.1, head).scale.set(1.05, 1.15, 0.75); mesh(sph(0.045, 8, 6), M(0xe58a7a), 0, -0.01, 0.25, head);
  for (const sx of [-1, 1]) { mesh(sph(0.028, 6, 5), blk, sx * 0.09, 0.07, 0.225, head); mesh(sph(0.075, 8, 6), fur, sx * 0.07, -0.07, 0.24, head).scale.set(1.5, 0.7, 0.7); mesh(sph(0.05, 8, 6), fur, sx * 0.09, 0.13, 0.21, head).scale.set(1.4, 0.5, 0.6); }
  const hat = grp(head, 0, 0.17, 0); hat.rotation.z = -0.3; mesh(cone(0.24, 0.6, 14), red, 0, 0.3, 0, hat); mesh(tor(0.235, 0.07, 8, 20), fur, 0, 0.02, 0, hat).rotation.x = Math.PI / 2; mesh(sph(0.09, 10, 8), fur, 0, 0.62, 0, hat);
  const arms = [-1, 1].map((sx) => { const a = grp(body, sx * 0.47, 1.12, 0); a.rotation.z = sx * 0.35; mesh(cyl(0.11, 0.13, 0.55, 10), red, 0, -0.27, 0, a); mesh(tor(0.125, 0.05, 6, 14), fur, 0, -0.55, 0, a).rotation.x = Math.PI / 2; mesh(sph(0.1, 8, 6), M(0x1f5a36), 0, -0.66, 0, a); return a; });
  g.userData = { head, armL: arms[0], armR: arms[1], body }; return g;
}
export function angel(o = {}) {
  const g = figure({ robe: o.robe ?? 0xfff6e6, head: 'hair', hat: o.hair ?? 0xe8c060, skin: o.skin });
  g.traverse((m) => { if (m.isMesh && m.material.color.getHex() === (o.robe ?? 0xfff6e6)) { m.material.emissive.set(0xffe6b0); m.material.emissiveIntensity = 0.45; } });
  const wm = M(0xffffff, { e: 0xfff0d0, ei: 0.7, r: 0.6 });
  const wings = [-1, 1].map((sx) => { const w = grp(g.userData.body, sx * 0.08, 1.05, -0.14); const f = mesh(sph(0.5, 12, 8), wm, sx * 0.42, 0.18, 0, w); f.scale.set(1, 0.42, 0.08); f.rotation.z = sx * 0.6; const f2 = mesh(sph(0.36, 10, 8), wm, sx * 0.32, -0.1, 0.01, w); f2.scale.set(1, 0.4, 0.08); f2.rotation.z = -sx * 0.1; return w; });
  mesh(tor(0.13, 0.018, 6, 20), G(0xffe9a0, 2.6), 0, 0.26, 0, g.userData.head).rotation.x = Math.PI / 2;
  g.userData.armL.rotation.z = -1.1; g.userData.armR.rotation.z = 1.1;
  if (o.trumpet) { const t = mesh(cone(0.09, 0.7, 10, ), M(0xffd34d, { m: 0.9, r: 0.2, e: 0x7a5200 }), 0, 0, 0, g.userData.head); t.position.set(0, -0.08, 0.5); t.rotation.x = -Math.PI / 2; }
  halo(0xffe9b0, 2.4, 0, 0.9, -0.2, g, 0.35);
  g.userData.wings = wings; g.userData.flap = (t, sp = 3) => wings.forEach((w, i) => { w.rotation.y = (i ? -1 : 1) * (0.25 + 0.3 * Math.sin(t * sp)); }); return g;
}
function antlers(head, hs, kind) {
  const m = M(kind === 'moose' ? 0xe6d2a4 : 0xcbb78f);
  for (const sz of [-1, 1]) {
    const a = grp(head, -hs * 0.1, hs * 0.75, sz * hs * 0.45); a.rotation.x = sz * 0.55;
    if (kind === 'moose') {
      mesh(cyl(hs * 0.1, hs * 0.12, hs * 1.2, 6), m, 0, hs * 0.6, 0, a);
      const p = mesh(sph(hs * 1.3, 10, 8), m, 0, hs * 1.7, 0, a); p.scale.set(0.75, 0.6, 0.12); p.rotation.x = -sz * 0.9;
      for (let i = 0; i < 5; i++) { const t = mesh(cone(hs * 0.11, hs * 0.75, 5), m, (i - 2) * hs * 0.42, hs * 2.25 - Math.abs(i - 2) * hs * 0.14, -sz * hs * 0.5, a); t.rotation.z = -(i - 2) * 0.3; t.rotation.x = -sz * 0.9; }
    } else {
      const beam = grp(a); beam.rotation.z = 0.25; mesh(cyl(hs * 0.06, hs * 0.1, hs * 1.2, 6), m, 0, hs * 0.6, 0, beam);
      const up = grp(beam, 0, hs * 1.15, 0); up.rotation.z = -0.55; mesh(cyl(hs * 0.045, hs * 0.065, hs * 1.1, 6), m, 0, hs * 0.55, 0, up); mesh(sph(hs * 0.045, 6, 5), m, 0, hs * 1.1, 0, up);
      for (let i = 0; i < 4; i++) { const t = grp(i < 2 ? beam : up, 0, hs * (i < 2 ? 0.45 + i * 0.4 : 0.3 + (i - 2) * 0.45), 0); t.rotation.z = -1.0 - i * 0.1; mesh(cone(hs * 0.05, hs * (0.7 - i * 0.08), 6), m, 0, hs * 0.3, 0, t); }
    }
  }
}
// Generic four-legged animal, facing +x.
export function beast(o = {}) {
  const g = new THREE.Group(), col = o.color ?? 0x8b5a2b, c = M(col), L = o.len ?? 1, r = o.r ?? 0.28, ht = o.ht ?? 0.6, hs = o.hs ?? 0.16, nl = o.nl ?? 0.45, nk = o.neck ?? 0.6, lw = o.lw ?? 0.055;
  const body = mesh(new THREE.CapsuleGeometry(r, L, 6, 14), c, 0, ht + r, 0, g); body.rotation.z = Math.PI / 2;
  if (o.hump) mesh(sph(r * 0.8, 12, 9), c, o.humpX ?? 0, ht + r * 1.8, 0, g);
  if (o.shag) for (let i = 0; i < 14; i++) { const s = mesh(cone(r * 0.35, r * 1.1, 5), M(new THREE.Color(col).offsetHSL(0, 0, rnd(-0.05, 0.03))), rnd(-L / 2, L / 2), ht + r * 0.55, (i % 2 ? 1 : -1) * r * 0.82, g); s.rotation.x = Math.PI + (i % 2 ? -0.25 : 0.25); }
  if (o.wool) for (let i = 0; i < 12; i++) mesh(sph(r * rnd(0.4, 0.55), 8, 6), c, rnd(-L / 2 - r * 0.4, L / 2 + r * 0.4), ht + r + rnd(-0.3, 0.7) * r, rnd(-0.7, 0.7) * r, g);
  // shoulders and haunches give the barrel a real animal's line
  mesh(sph(r * 0.95, 14, 10), c, L * 0.38, ht + r * 1.05, 0, g).scale.set(1.1, 1, 0.95); mesh(sph(r, 14, 10), c, -L * 0.4, ht + r * 1.05, 0, g).scale.set(1.15, 1, 1);
  if (!o.wool) mesh(sph(r * 0.7, 12, 9), M(new THREE.Color(col).offsetHSL(0, -0.05, 0.12)), L * 0.5 + r * 0.25, ht + r * 0.7, 0, g).scale.set(0.8, 1, 0.9); // a paler chest
  const legs = [], lm = M(o.leg ?? col), ll = ht + r * 0.6, hoofM = M(0x1c1410, { r: 0.5 });
  for (const sx of [1, -1]) for (const sz of [1, -1]) {
    // thigh, knee and slender cannon bone down to a flared hoof
    const p = grp(g, sx * (L * 0.45 + r * 0.2), ht + r * 0.6, sz * r * 0.55), k = ll * 0.48;
    mesh(cyl(lw * 1.5, lw * 1.05, k, 8), c, 0, -k / 2, 0, p); mesh(sph(lw * 1.08, 8, 6), lm, 0, -k, 0, p);
    mesh(cyl(lw * 0.95, lw * 0.75, ll - k - 0.05, 8), lm, 0, -k - (ll - k - 0.05) / 2, 0, p);
    mesh(cyl(lw * 0.85, lw * 1.12, 0.07, 8), hoofM, 0, -ll + 0.035, 0, p); legs.push(p);
  }
  const neck = grp(g, L / 2 + r * 0.35, ht + r * 1.4, 0); neck.rotation.z = -nk; mesh(cyl(r * 0.42, r * 0.62, nl + r * 0.5, 10), c, 0, nl / 2 - r * 0.25, 0, neck);
  const head = grp(neck, 0, nl, 0); head.rotation.z = nk - (o.nod ?? 0.2); const hm = M(o.headColor ?? col);
  mesh(sph(hs, 16, 12), hm, hs * 0.3, hs * 0.05, 0, head).scale.set(1.25, 1, 0.95); // skull
  mesh(sph(hs * 0.72, 14, 10), M(new THREE.Color(o.headColor ?? col).offsetHSL(0, -0.04, 0.06)), hs * 1.2, -hs * 0.22, 0, head).scale.set(1.15, 0.85, 0.82); // muzzle
  const nose = mesh(sph(hs * (o.muzzleS ?? 0.5), 12, 9), o.nose !== undefined ? G(o.nose, 2.6) : M(o.muzzle ?? 0x2a1c14, { r: 0.4 }), hs * 1.72, -hs * 0.2, 0, head); nose.scale.set(0.75, 0.8, 1);
  if (o.nose !== undefined) halo(o.nose, hs * 5, hs * 1.8, -hs * 0.18, 0, head, 0.7);
  const ears = [];
  for (const sz of [-1, 1]) {
    mesh(sph(hs * 0.15, 10, 8), M(0x0a0a0a, { r: 0.15 }), hs * 0.85, hs * 0.3, sz * hs * 0.72, head);
    mesh(sph(hs * 0.05, 6, 5), G(0xffffff, 1.4), hs * 0.93, hs * 0.37, sz * hs * 0.82, head); // a catchlight
    mesh(sph(hs * 0.05, 6, 5), M(0x140c08), hs * 1.98, -hs * 0.14, sz * hs * 0.17, head); // nostril
    const e = grp(head, -hs * 0.15, hs * 0.7, sz * hs * 0.8); e.rotation.x = sz * (o.earA ?? 0.8); ears.push(e);
    mesh(cone(hs * 0.3, hs * (o.ear ?? 0.8), 8), hm, 0, 0, 0, e).scale.z = 0.55; mesh(cone(hs * 0.18, hs * (o.ear ?? 0.8) * 0.75, 8), M(0xd9a0a0, { r: 1 }), hs * 0.06, -hs * 0.04, 0, e).scale.z = 0.4; // ear, pink inside
  }
  if (o.collar) { // a harness collar strung with sleigh bells
    const cl = grp(neck, 0, -r * 0.1, 0); mesh(tor(r * 0.58, r * 0.11, 6, 18), M(0xa0161c, { r: 0.5 }), 0, 0, 0, cl).rotation.x = Math.PI / 2;
    const bell = M(0xffd34d, { m: 0.9, r: 0.2, e: 0x5a3c00 }); for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; for (const sz of [-1, 1]) mesh(sph(r * 0.1, 8, 6), bell, Math.sin(a) * r * 0.62, -r * 0.05, sz * Math.cos(a) * r * 0.62, cl); }
  }
  if (o.ruff) for (let i = 0; i < 6; i++) mesh(sph(r * 0.32, 8, 6), M(0xf0e6d8, { r: 1 }), L / 2 + r * 0.55 + rnd(-0.05, 0.05), ht + r * (0.75 + i * 0.1), (i % 2 ? 1 : -1) * r * rnd(0.05, 0.3), g).scale.set(0.8, 1.2, 0.9); // a reindeer's pale chest ruff
  if (o.antlers) antlers(head, hs, o.antlers);
  if (o.horns) for (const sz of [-1, 1]) {
    if (o.horns === 'long') { const h = mesh(tor(hs * 1.5, hs * 0.13, 6, 14, Math.PI * 0.55), M(0xf0e6d0), 0, hs * 0.5, sz * hs * 2.0, head); h.rotation.set(0, Math.PI / 2, 0); h.rotation.z = sz > 0 ? Math.PI : -Math.PI * 0.55; h.scale.z = 1; }
    else { const h = mesh(cone(hs * 0.16, hs * 1.1, 6), M(0xf0e6d0), 0, hs * 0.75, sz * hs * 0.9, head); h.rotation.x = sz * 1.0; }
  }
  if (o.fringe) for (let i = 0; i < 7; i++) { const f = mesh(cone(hs * 0.3, hs * 1.3, 5), M(new THREE.Color(col).offsetHSL(0, 0, 0.04)), hs * (0.55 + rnd(0.3)), hs * 0.55, (i - 3) * hs * 0.26, head); f.rotation.x = Math.PI; f.rotation.z = -0.5; }
  if (o.dewlap) mesh(sph(hs * 0.4, 8, 6), c, hs * 0.5, -hs * 1.2, 0, head).scale.y = 1.6;
  const tail = mesh(o.tail === 'puff' ? sph(r * 0.3, 8, 6) : cyl(lw * 0.5, lw * 0.3, r * 1.6, 5), o.tail === 'white' ? M(0xffffff) : c, -L / 2 - r * 0.95, ht + r * (o.tail === 'puff' ? 1.2 : 0.7), 0, g); if (o.tail !== 'puff') tail.rotation.z = -0.3;
  g.userData = { legs, neck, head, nose, body, nk, ears }; return g;
}
export const gallop = (b, t, amp = 0.6, sp = 8) => b.userData.legs.forEach((l, i) => { l.rotation.z = Math.sin(t * sp + (i < 2 ? 0 : Math.PI) + (i % 2) * 0.7) * amp; });
export const nod = (b, t, amp = 0.12, sp = 1) => { b.userData.neck.rotation.z = -b.userData.nk + Math.sin(t * sp) * amp; };
export const reindeer = (red) => beast({ color: 0x8a5a33, len: 0.85, r: 0.25, ht: 0.68, nl: 0.5, hs: 0.15, antlers: 'deer', tail: 'white', nose: red ? 0xff2a1a : undefined, leg: 0x6b4526, collar: true, ruff: true, headColor: 0x7a4e2c });
export const horse = (c = 0x9a6436) => beast({ color: c, len: 1.15, r: 0.33, ht: 0.85, nl: 0.75, hs: 0.2, neck: 0.75, ear: 0.6, leg: 0x6b4526 });
export const donkey = () => beast({ color: 0x8d8a8c, len: 0.9, r: 0.29, ht: 0.6, nl: 0.5, hs: 0.18, ear: 1.7, earA: 0.3, muzzle: 0xe8e0d8, muzzleS: 0.6 });
export const camel = () => beast({ color: 0xc9a063, len: 1.3, r: 0.38, ht: 1.15, nl: 1.0, hs: 0.19, neck: 0.45, hump: true, ear: 0.4, lw: 0.07, muzzle: 0xa07a48, muzzleS: 0.6 });
export const ox = () => beast({ color: 0x6b3f22, len: 1.1, r: 0.42, ht: 0.5, nl: 0.3, hs: 0.22, neck: 1.1, horns: 'short', lw: 0.08, muzzle: 0xd9b89a, muzzleS: 0.65 });
export const sheep = () => beast({ color: 0xf2efe6, len: 0.4, r: 0.27, ht: 0.3, nl: 0.2, hs: 0.12, neck: 0.9, wool: true, headColor: 0x2c2826, leg: 0x2c2826, tail: 'puff', lw: 0.04 });
export const polarBear = (s = 1) => { const b = beast({ color: 0xf6f4ee, len: 1.2, r: 0.46, ht: 0.42, nl: 0.35, hs: 0.24, neck: 1.0, ear: 0.35, lw: 0.13, tail: 'puff', muzzle: 0x18181c, muzzleS: 0.3 }); b.scale.setScalar(s); return b; };
// Hamish the Highland cow — own build (not the generic beast) so the anatomy reads properly:
// horns sweep out from the poll above the ears, a dossan over the eyes, layered shaggy coat. Faces +x.
const _up = new THREE.Vector3(0, 1, 0);
export function tuft(parent, mat, x, y, z, dx, dy, dz, len, rad) {
  const d = new THREE.Vector3(dx, dy, dz).normalize(), m = mesh(lockGeo(), mat, x + d.x * len * 0.2, y + d.y * len * 0.2, z + d.z * len * 0.2, parent);
  m.scale.set(rad, len * 0.8, rad); m.quaternion.setFromUnitVectors(_up, d); return m;
}
// a lock of hair: rounded root, tapering to a soft point at +y
let _lock;
const lockGeo = () => _lock ??= (() => {
  const g = sph(1, 7, 6), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 0) p.setY(i, y * 0.3); else { const k = 1 - 0.45 * y; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } }
  g.computeVertexNormals(); return g;
})();
function hornGeo(pts, r0, r1) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), ts = 22, rs = 8, geo = new THREE.TubeGeometry(curve, ts, 1, rs, false);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), P = new THREE.Vector3(), v = new THREE.Vector3(), ca = new THREE.Color(0xefe4c8), cb = new THREE.Color(0x2e2620), c = new THREE.Color();
  for (let i = 0; i <= ts; i++) {
    const u = i / ts, rad = lerp(r0, r1, Math.pow(u, 0.8)); curve.getPointAt(u, P); c.copy(ca).lerp(cb, smooth(0.55, 1, u));
    for (let j = 0; j <= rs; j++) { const k = i * (rs + 1) + j; v.fromBufferAttribute(pos, k).sub(P).multiplyScalar(rad).add(P); pos.setXYZ(k, v.x, v.y, v.z); col.set([c.r, c.g, c.b], k * 3); }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals(); return geo;
}
export function highlandCow() {
  const g = new THREE.Group(), col = 0xb5601c, L = 1.15, r = 0.46, ht = 0.48, hs = 0.25, nl = 0.28, nk = 1.15, lw = 0.085, cy = ht + r;
  const shade = (l) => M(new THREE.Color(col).offsetHSL(0, 0, l), { r: 1 });
  const c = shade(0), coats = [shade(-0.07), shade(-0.03), shade(0.03), shade(0.07)], dark = M(0x1c1410, { r: 0.6 });
  // barrel body with raised withers
  const body = mesh(new THREE.CapsuleGeometry(r, L, 8, 16), c, 0, cy, 0, g); body.rotation.z = Math.PI / 2; body.scale.x = 1.05;
  mesh(sph(r * 0.9, 14, 10), c, L * 0.32, cy + r * 0.22, 0, g).scale.set(1.15, 1, 0.98);
  // long layered coat hanging down both flanks
  for (const sz of [-1, 1]) for (let i = 0; i < 64; i++) {
    const a = 0.35 + ((i % 8) + rnd()) * 0.25, x = lerp(-L / 2 - r * 0.6, L / 2 + r * 0.6, (Math.floor(i / 8) + rnd()) / 8), ex = Math.max(0, Math.abs(x) - L / 2), rr = Math.sqrt(r * r - ex * ex) * 0.97;
    tuft(g, pick(coats), x, cy + rr * Math.cos(a), sz * rr * Math.sin(a), rnd(-0.25, 0.25), -Math.sin(a) - 0.5, sz * Math.max(0.12, Math.cos(a) * 0.8), r * rnd(0.7, 1.15), r * rnd(0.16, 0.23));
  }
  for (let i = -2; i <= 2; i++) tuft(g, pick(coats), L / 2 + r * 0.72, cy - r * 0.15, i * r * 0.24, 0.25, -1, i * 0.08, r * rnd(0.8, 1), r * 0.28); // brisket
  // sturdy legs with feathering and dark hooves
  const legs = [], ll = ht + r * 0.6;
  for (const sx of [1, -1]) for (const sz of [1, -1]) {
    const p = grp(g, sx * (L * 0.45 + r * 0.2), ll, sz * r * 0.55);
    mesh(cyl(lw * 1.7, lw * 1.05, ll * 0.6, 8), c, 0, -ll * 0.3, 0, p); mesh(cyl(lw, lw * 0.9, ll * 0.4, 8), coats[1], 0, -ll * 0.78, 0, p);
    mesh(cyl(lw, lw * 1.2, 0.08, 8), dark, 0, -ll + 0.04, 0, p);
    for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.6; tuft(p, pick(coats), Math.cos(a) * lw * 0.9, -ll * 0.28, Math.sin(a) * lw * 0.9, Math.cos(a) * 0.15, -1, Math.sin(a) * 0.15, ll * 0.5, lw * 1.2); }
    legs.push(p);
  }
  // tail with a switch
  const tail = grp(g, -L / 2 - r * 0.93, cy + r * 0.35, 0); tail.rotation.z = -0.18;
  mesh(cyl(lw * 0.45, lw * 0.35, r * 1.7, 6), c, 0, -r * 0.85, 0, tail); mesh(sph(lw * 1.05, 8, 6), coats[0], 0, -r * 1.9, 0, tail).scale.y = 2.3;
  // short thick neck with throat hair
  const neck = grp(g, L / 2 + r * 0.35, ht + r * 1.4, 0); neck.rotation.z = -nk; mesh(cyl(r * 0.42, r * 0.62, nl + r * 0.5, 10), c, 0, nl / 2 - r * 0.25, 0, neck);
  for (let i = 0; i < 4; i++) tuft(neck, pick(coats), r * 0.42, -0.05 + i * 0.08, (i % 2 ? 1 : -1) * 0.1, 0.91, -0.41, 0, r * 0.8, r * 0.24);
  // head: broad skull, wide muzzle, pale nose pad
  const head = grp(neck, 0, nl, 0); head.rotation.z = nk - 0.2;
  mesh(sph(hs, 16, 12), c, hs * 0.35, 0, 0, head).scale.set(1.3, 1, 1);
  mesh(sph(hs * 0.72, 14, 10), coats[2], hs * 1.3, -hs * 0.22, 0, head).scale.set(1, 0.8, 0.95);
  const nose = mesh(sph(hs * 0.5, 12, 9), M(0xd9a58a, { r: 0.6 }), hs * 1.78, -hs * 0.3, 0, head); nose.scale.set(0.55, 0.6, 1.05);
  const hornM = M(0xffffff, { r: 0.45 }); hornM.vertexColors = true;
  for (const sz of [-1, 1]) {
    mesh(sph(hs * 0.07, 6, 5), dark, hs * 2.03, -hs * 0.24, sz * hs * 0.2, head); // nostril
    mesh(sph(hs * 0.13, 8, 6), M(0x0a0a0a, { r: 0.2 }), hs * 0.95, hs * 0.3, sz * hs * 0.8, head); // eye
    // ears sit low on the side of the head, below the horns, drooping a little
    const e = mesh(sph(hs * 0.45, 10, 8), c, -hs * 0.1, hs * 0.2, sz * hs * 1.25, head); e.scale.set(0.5, 0.35, 1); e.rotation.x = sz * 0.25;
    tuft(head, coats[3], -hs * 0.1, hs * 0.16, sz * hs * 1.2, 0, -0.5, sz, hs * 0.75, hs * 0.16);
    // horns grow from the poll, sweep out level, then curve forward and up to dark tips
    mesh(hornGeo([[-0.15, 0.5, 0.5], [-0.15, 0.62, 1.3], [0.05, 0.7, 2.0], [0.5, 0.95, 2.5], [0.85, 1.45, 2.65]].map(([x, y, z]) => [x * hs, y * hs, z * hs * sz]), hs * 0.2, hs * 0.03), hornM, 0, 0, 0, head);
    tuft(head, coats[1], hs * 0.45, hs * 0.55, sz * hs * 0.8, 0.35, -1, sz * 0.15, hs * 1.2, hs * 0.26); // cheek lock
    tuft(head, coats[0], hs * 0.9, -hs * 0.5, sz * hs * 0.45, 0.2, -1, 0, hs * 0.7, hs * 0.22); // jaw
  }
  // dossan: the mop between the horns and the fringe falling over the eyes
  mesh(sph(hs * 0.62, 10, 8), coats[2], hs * 0.15, hs * 0.72, 0, head).scale.set(1.1, 0.55, 1.15);
  for (let i = -2; i <= 2; i++) tuft(head, coats[3], hs * 0.1, hs * 0.95, i * hs * 0.28, 0.9, -0.2, i * 0.1, hs * 1.1, hs * 0.26);
  for (let i = -3; i <= 3; i++) tuft(head, coats[2 + (i & 1)], hs * (0.55 + rnd(0.15)), hs * 0.82, i * hs * 0.22, 0.85, -0.5 + rnd(-0.1, 0.1), i * 0.06, hs * rnd(1.15, 1.4), hs * 0.24);
  g.userData = { legs, neck, head, nose, body, nk }; return g;
}
export function bird(bodyC = 0x7a5a40, breast = 0xe8501c, s = 1) {
  const g = new THREE.Group(), b = grp(g); mesh(sph(0.16, 12, 9), M(bodyC), 0, 0.2, 0, b).scale.set(1, 0.95, 1.25);
  mesh(sph(0.13, 12, 9), M(breast), 0, 0.2, 0.07, b); const head = grp(b, 0, 0.38, 0.08); mesh(sph(0.1, 10, 8), M(bodyC), 0, 0, 0, head);
  mesh(cone(0.03, 0.09, 6), M(0xe0a020), 0, -0.01, 0.12, head).rotation.x = Math.PI / 2; for (const sx of [-1, 1]) mesh(sph(0.018, 6, 5), M(0x050505, { r: 0.2 }), sx * 0.055, 0.03, 0.075, head);
  mesh(box(0.1, 0.02, 0.25), M(bodyC), 0, 0.2, -0.26, b).rotation.x = 0.4;
  const wings = [-1, 1].map((sx) => { const w = grp(b, sx * 0.13, 0.24, 0); mesh(sph(0.13, 8, 6), M(bodyC), sx * 0.06, 0, -0.03, w).scale.set(0.9, 0.25, 1.3); return w; });
  for (const sx of [-1, 1]) mesh(cyl(0.008, 0.008, 0.1, 4), M(0x3a2a1a), sx * 0.05, 0.03, 0, g);
  g.scale.setScalar(s); g.userData = { head, wings, b }; return g;
}
let _runner;
const runnerGeo = () => _runner ??= new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-1.05, 0.12, 0], [-0.6, 0.06, 0], [0.4, 0.06, 0], [0.95, 0.12, 0], [1.2, 0.38, 0], [1.12, 0.62, 0], [0.95, 0.6, 0], [0.98, 0.48, 0]].map((v) => new THREE.Vector3(...v))), 48, 0.035, 8, false);
let _side;
const sideGeo = () => _side ??= (() => { // the side panel: low at the back, sweeping up into a scroll at the front
  const sh = new THREE.Shape(); sh.moveTo(-0.78, 0.3); sh.lineTo(0.55, 0.3); sh.bezierCurveTo(0.9, 0.3, 1.0, 0.55, 0.95, 0.85); sh.bezierCurveTo(0.9, 1.08, 0.66, 1.08, 0.66, 0.92); sh.bezierCurveTo(0.66, 0.8, 0.82, 0.8, 0.8, 0.9);
  sh.bezierCurveTo(0.7, 0.7, 0.5, 0.78, 0.2, 0.8); sh.lineTo(-0.4, 0.8); sh.bezierCurveTo(-0.6, 0.8, -0.65, 1.25, -0.82, 1.25); sh.lineTo(-0.82, 0.3);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 10 }); g.translate(0, 0, -0.03); return g;
})();
export function sleigh() {
  const g = new THREE.Group(), red = M(0xb0101c, { r: 0.45 }), gold = M(0xffd34d, { m: 0.85, r: 0.25, e: 0x5a3c00 }), green = M(0x1f5a36, { r: 0.9 });
  mesh(rbox(1.55, 0.18, 0.8, 0.05), red, -0.05, 0.4, 0, g); // the floor
  for (const sz of [-1, 1]) {
    mesh(sideGeo(), red, 0, 0, sz * 0.42, g); mesh(runnerGeo(), gold, 0, 0, sz * 0.42, g);
    for (const x of [-0.55, 0.35]) mesh(cyl(0.025, 0.025, 0.26, 6), gold, x, 0.2, sz * 0.42, g);
    const sc = mesh(tor(0.1, 0.018, 6, 16, Math.PI * 1.5), gold, 0.0, 0.58, sz * 0.46, g); sc.rotation.z = 0.5; // gold scrollwork
    mesh(box(1.2, 0.025, 0.02), gold, -0.15, 0.36, sz * 0.465, g); mesh(box(0.9, 0.025, 0.02), gold, -0.25, 0.78, sz * 0.465, g);
  }
  mesh(rbox(0.14, 0.9, 0.86, 0.05), red, -0.76, 0.85, 0, g); mesh(rbox(0.5, 0.14, 0.78, 0.06), green, -0.45, 0.55, 0, g); mesh(rbox(0.12, 0.55, 0.78, 0.05), green, -0.66, 0.85, 0, g); // backboard and cushions
  mesh(rbox(0.12, 0.42, 0.86, 0.04), red, 0.62, 0.62, 0, g); // the dashboard
  const sack = mesh(sph(0.42, 14, 10), M(0x6b4a2a, { r: 1 }), -0.3, 1.0, 0, g); sack.scale.set(1, 1.15, 0.9); mesh(tor(0.12, 0.03, 5, 12), M(0xd0b080), -0.3, 1.45, 0, g).rotation.x = Math.PI / 2;
  put(present(0.26, 0x1f7a4a, 0xffd34d), g, -0.1, 1.25, 0.2); put(present(0.22, 0x2a5db0, 0xffffff), g, -0.42, 1.35, -0.15); put(present(0.18, 0xc8102e, 0xffd34d), g, -0.25, 1.45, 0.05, 1, 0.6);
  mesh(sph(0.06, 8, 6), G(0xffd070, 2.2), 0.95, 0.95, 0.42, g); halo(0xffc060, 0.9, 0.95, 0.95, 0.42, g, 0.6); // a lamp on the scroll
  return g;
}
// Father Christmas, sleigh and reindeer. Local forward is +z (so lookAt works).
export function sleighTeam(pairs = 2, extra) {
  const root = new THREE.Group(), g = grp(root); g.rotation.y = -Math.PI / 2; const deer = [];
  g.add(sleigh()); const fc = put(santa(), g, 0.15, 0.6, 0, 0.75, Math.PI / 2); if (extra) put(extra, g, -0.35, 1.45, 0, 0.6, Math.PI / 2);
  for (let i = 0; i < pairs; i++) for (const sz of [-1, 1]) deer.push(put(reindeer(), g, 2.4 + i * 1.5, 0.1, sz * 0.42, 0.8));
  const lead = put(reindeer(true), g, 2.4 + pairs * 1.5, 0.1, 0, 0.85); deer.push(lead);
  const rein = M(0x3a2414); for (const sz of [-1, 1]) mesh(box(pairs * 1.5 + 1.6, 0.02, 0.02), rein, 1.6 + pairs * 0.75, 0.95, sz * 0.2, g);
  root.userData = { deer, fc, lead, tick: (t) => { deer.forEach((d, i) => { gallop(d, t + i * 0.4, 0.7, 9); d.position.y = 0.1 + Math.sin(t * 9 + i) * 0.06; }); fc.userData.armR.rotation.z = 2.4 + Math.sin(t * 5) * 0.4; } };
  return root;
}
export function stable() {
  const g = new THREE.Group(), w = M(0x6b4a2a, { flat: true }), dk = M(0x4a321c), plank = M(0x5a3c22), thatch = M(0xb8954a, { flat: true }), thatchD = M(0x957636, { flat: true }), snowM = M(0xf4f8ff, { r: 0.95 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(cyl(0.09, 0.11, 2.3, 6), dk, sx * 1.9, 1.15, sz * 1.0, g);
  mesh(box(4.0, 2.1, 0.1), w, 0, 1.05, -1.05, g); for (const sx of [-1, 1]) mesh(box(0.1, 2.1, 1.3), w, sx * 1.95, 1.05, -0.4, g);
  for (let i = 0; i < 9; i++) mesh(box(0.025, 2.1, 0.03), plank, -1.8 + i * 0.45, 1.05, -0.99, g); // plank seams
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) mesh(box(0.03, 2.1, 0.025), plank, sx * 1.89, 1.05, -0.9 + i * 0.4, g);
  mesh(box(4.1, 0.14, 0.14), dk, 0, 2.2, 1.0, g); mesh(box(4.1, 0.14, 0.14), dk, 0, 2.2, -1.0, g); // beams
  // thatch laid in overlapping courses, with snow resting along the ridge
  mesh(prism(4.9, 1.2, 2.9), thatch, 0, 2.25, 0, g);
  for (let i = 0; i < 4; i++) { const k = i / 4, c = mesh(prism(4.9 * (1 - k * 0.78) + 0.12, 0.12, 2.96), i % 2 ? thatchD : thatch, 0, 2.25 + k * 1.2 - 0.04, 0, g); c.scale.y = 1; }
  mesh(prism(5.0, 1.28, 2.6), snowM, 0, 2.33, -0.1, g); mesh(cyl(0.12, 0.12, 2.9, 8), snowM, 0, 3.5, 0, g).rotation.x = Math.PI / 2;
  mesh(cyl(2.3, 2.4, 0.06, 20), M(0xc9a94a), 0, 0.03, 0, g).scale.z = 0.62;
  for (let i = 0; i < 22; i++) { const s2 = mesh(cyl(0.006, 0.006, rnd(0.15, 0.3), 3), M(0xe0c060), rnd(-1.8, 1.8), 0.08, rnd(-0.9, 0.9), g); s2.rotation.set(rnd(-1.2, 1.2), 0, rnd(-1.2, 1.2)); } // loose straw
  const bale = (x, z, ry) => { const b = mesh(rbox(0.75, 0.38, 0.45, 0.06), M(0xcfae58, { flat: true }), x, 0.19, z, g); b.rotation.y = ry; for (const t of [-0.2, 0.2]) { const tw = mesh(box(0.02, 0.4, 0.47), M(0x7a5a2a), 0, 0, 0, b); tw.position.x = t; } return b; };
  bale(1.4, -0.65, 0.2); bale(1.45, -0.62, 0.2).position.y = 0.57; bale(-1.45, -0.7, -0.1);
  mesh(box(0.9, 0.3, 0.35), dk, -1.3, 0.15, 0.6, g); mesh(box(0.8, 0.04, 0.25), M(0x3a5a8a, { r: 0.1, m: 0.3 }), -1.3, 0.28, 0.6, g); // water trough
  const lan = grp(g, 1.55, 1.75, 0.95); mesh(cyl(0.006, 0.006, 0.3, 4), dk, 0, 0.3, 0, lan); mesh(box(0.14, 0.2, 0.14), G(0xffc866, 1.9), 0, 0, 0, lan); mesh(cone(0.12, 0.1, 4), M(0x1c1c22, { m: 0.6 }), 0, 0.15, 0, lan).rotation.y = Math.PI / 4;
  halo(0xffb050, 1.6, 0, 0, 0, lan, 0.7); light(0xffc070, 8, 6, 0, 0, 0.2, lan);
  return g;
}
export function manger(baby = true) {
  const g = new THREE.Group(), w = M(0x5a3a1c);
  for (const sx of [-1, 1]) for (const r of [-0.5, 0.5]) mesh(box(0.06, 0.62, 0.06), w, sx * 0.28, 0.27, 0, g).rotation.x = r;
  mesh(box(0.74, 0.2, 0.42), w, 0, 0.42, 0, g); mesh(sph(0.3, 10, 8), M(0xdcc060), 0, 0.52, 0, g).scale.set(1.25, 0.4, 0.75);
  if (baby) {
    const b = mesh(new THREE.CapsuleGeometry(0.09, 0.22, 4, 10), M(0xffffff, { e: 0xfff0d0, ei: 0.8 }), -0.04, 0.63, 0, g); b.rotation.z = Math.PI / 2;
    mesh(sph(0.075, 10, 8), M(0xf0c8a8, { e: 0x6a4a30 }), 0.2, 0.66, 0, g); g.userData.glow = halo(0xffe9b0, 2.6, 0, 0.75, 0.1, g, 0.8); g.userData.l = light(0xffe0a0, 10, 9, 0, 1.0, 0.4, g);
  }
  return g;
}
export const mary = () => { const f = figure({ robe: 0x3566b0, head: 'veil', hat: 0xe6eefa }); f.userData.armL.rotation.set(-0.9, 0, 0.5); f.userData.armR.rotation.set(-0.9, 0, -0.5); return f; };
export const joseph = () => figure({ robe: 0x7a5a36, head: 'veil', hat: 0x5a3a26, beard: 0x4a3020, staff: 'crook', sash: 0x3a2a1a });
export const shepherd = (c = 0x8a7a5a) => figure({ robe: c, head: 'veil', hat: 0xd8c8a8, beard: rnd() < 0.5 ? 0x7a6a5a : undefined, staff: 'crook' });
export const KINGS = [{ robe: 0x7a1f8a, head: 'crown', hat: 0x7a1f8a, beard: 0xffffff, trim: 0xffd34d, gift: 0xffd34d }, { robe: 0x0f7a5a, head: 'turban', hat: 0xf2e6c0, skin: 0x8a5a3a, trim: 0xffd34d, gift: 0xff8a50 }, { robe: 0xb0201f, head: 'crown', hat: 0xb0201f, skin: 0x5a3a26, beard: 0x1a1a1a, trim: 0xffffff, gift: 0x70c0ff }];
export function king(i) {
  const k = KINGS[i], f = figure(k); const a = f.userData.armR; a.rotation.x = -1.2; f.userData.fixR = true;
  mesh(box(0.14, 0.14, 0.14), M(k.gift, { m: 0.7, r: 0.25, e: k.gift, ei: 0.7 }), 0, -0.6, 0.02, a); halo(k.gift, 0.9, 0, -0.6, 0.02, a, 0.6); return f;
}
export function palm(h = 4) {
  const g = new THREE.Group(), tr = M(0x7a5a36), lf = M(0x2f6a3a, { side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) mesh(cyl(0.11, 0.13, h / 6 + 0.05, 6), tr, Math.sin(i * 0.5) * 0.25, h / 12 + i * h / 6, 0, g).rotation.z = -Math.cos(i * 0.5) * 0.12;
  const top = grp(g, Math.sin(3) * 0.25, h, 0);
  for (let i = 0; i < 8; i++) { const l = grp(top); l.rotation.y = i * TAU / 8; const f = mesh(sph(0.9, 8, 6), lf, 0.8, -0.15, 0, l); f.scale.set(1, 0.06, 0.24); f.rotation.z = -0.45; }
  return g;
}
export function disposeTree(root) {
  root.traverse((o) => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); });
}
