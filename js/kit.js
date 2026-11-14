// Shared building kit: materials, primitives, characters, weather, particles.
import * as THREE from 'three';
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

// ---------- materials & primitives ----------
export const M = (color, o = {}) => new THREE.MeshStandardMaterial({
  color, roughness: o.r ?? 0.85, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1,
  flatShading: !!o.flat, transparent: o.o !== undefined, opacity: o.o ?? 1, side: o.side ?? THREE.FrontSide,
});
export const G = (color, i = 1.6, o = {}) => new THREE.MeshBasicMaterial({
  color: new THREE.Color(color).multiplyScalar(i), transparent: o.o !== undefined, opacity: o.o ?? 1,
  side: o.side ?? THREE.FrontSide, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !o.add,
});
export const sph = (r = 1, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h);
export const box = (w = 1, h = 1, d = 1) => new THREE.BoxGeometry(w, h, d);
export const cyl = (rt = 1, rb = 1, h = 1, s = 12, open = false) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open);
export const cone = (r = 1, h = 1, s = 12) => new THREE.ConeGeometry(r, h, s);
export const tor = (r = 1, t = 0.1, a = 8, b = 24, arc = TAU) => new THREE.TorusGeometry(r, t, a, b, arc);
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
  geo.computeVertexNormals(); return mesh(geo, M(color, { r: 0.95 }));
}
export const groundY = (x, z, bump = 0.6, flat = 9) => hillH(x, z) * smooth(flat, flat + 26, Math.hypot(x, z)) * bump;
export function pine(h = 3, snowy = true) {
  const g = new THREE.Group(); mesh(cyl(0.05 * h, 0.07 * h, 0.3 * h, 6), M(0x4a3020), 0, 0.15 * h, 0, g);
  const green = M(new THREE.Color(0x1c5a3c).offsetHSL(rnd(-0.02, 0.02), 0, rnd(-0.03, 0.03))), white = M(0xf4f8ff, { r: 0.95 });
  for (let i = 0; i < 4; i++) {
    const r = h * (0.36 - 0.075 * i), ch = h * 0.34, y = h * (0.18 + 0.185 * i);
    mesh(cone(r, ch, 9), green, 0, y + ch / 2, 0, g);
    if (snowy) mesh(cone(r * 0.7, ch * 0.6, 9), white, 0, y + ch * 0.705, 0, g);
  }
  return g;
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
  const d = M(0x2a1a12); mesh(box(w + 0.08, 0.04, 0.07), d, 0, 0, 0, g); mesh(box(0.04, h + 0.08, 0.07), d, 0, 0, 0, g);
  mesh(box(w + 0.14, 0.07, 0.12), M(0xf4f8ff), 0, -h / 2 - 0.03, 0.03, g); g.userData.glass = glass; return g;
}
export function house(o = {}) {
  const w = o.w ?? 3, h = o.h ?? 2.2, d = o.d ?? 3, rh = o.rh ?? 1.5, g = new THREE.Group(), wall = M(o.color ?? 0xa86b4a);
  mesh(box(w, h, d), wall, 0, h / 2, 0, g);
  mesh(prism(w + 0.5, rh + 0.12, d + 0.5), M(0xf4f8ff, { r: 0.95 }), 0, h - 0.04, 0, g);
  mesh(prism(w + 0.1, rh - 0.08, d + 0.54), wall, 0, h - 0.04, 0, g);
  const wy = h * 0.55, glass = [];
  for (const sx of [-1, 1]) {
    glass.push(win(g, sx * w * 0.28, wy, d / 2 + 0.02, w * 0.2, h * 0.3).userData.glass);
    glass.push(win(g, sx * (w / 2 + 0.02), wy, 0, d * 0.22, h * 0.3, Math.PI / 2).userData.glass);
  }
  if (o.attic !== false) glass.push(win(g, 0, h + rh * 0.35, d / 2 + 0.28, w * 0.14, rh * 0.25).userData.glass);
  mesh(box(w * 0.17, h * 0.55, 0.06), M(o.door ?? 0x6b1f1f), 0, h * 0.275, d / 2 + 0.02, g);
  const ch = grp(g, w * 0.25, h + rh * 0.55, -d * 0.15); mesh(box(0.4, rh * 0.9, 0.4), M(0x7a4a3a), 0, 0, 0, ch); mesh(box(0.5, 0.12, 0.5), M(0xf4f8ff), 0, rh * 0.48, 0, ch);
  g.userData = { glass, chimney: new THREE.Vector3(w * 0.25, h + rh * 1.05, -d * 0.15) }; return g;
}
export function present(s = 0.5, color = 0xc8102e, ribbon = 0xffd34d) {
  const g = new THREE.Group(), r = M(ribbon, { m: 0.5, r: 0.35 });
  mesh(box(s, s * 0.8, s), M(color, { r: 0.6 }), 0, s * 0.4, 0, g);
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
export function snowman(o = {}) {
  const g = new THREE.Group(), S = M(0xf7faff, { r: 0.92 }), C = COAL();
  mesh(sph(0.6, 20, 14), S, 0, 0.52, 0, g); mesh(sph(0.44, 20, 14), S, 0, 1.32, 0, g);
  const head = grp(g, 0, 1.95, 0); mesh(sph(0.32, 20, 14), S, 0, 0, 0, head);
  for (const sx of [-1, 1]) mesh(sph(0.04, 8, 6), C, sx * 0.11, 0.08, 0.285, head);
  const nose = mesh(cone(0.05, 0.3, 8), M(0xff7a1a), 0, 0, 0.44, head); nose.rotation.x = Math.PI / 2;
  for (let i = -2; i <= 2; i++) mesh(sph(0.022, 6, 5), C, i * 0.05, -0.1 - Math.cos(i * 0.6) * 0.04 + 0.03, 0.3, head);
  const hat = grp(head, 0, 0.24, 0); hat.rotation.z = -0.15;
  if (o.hat === 'bobble') { mesh(sph(0.3, 14, 10, ), M(o.scarf ?? 0xc8102e), 0, 0, 0, hat).scale.y = 0.75; mesh(sph(0.09), M(0xffffff), 0, 0.27, 0, hat); }
  else { mesh(cyl(0.33, 0.33, 0.035, 16), C, 0, 0, 0, hat); mesh(cyl(0.2, 0.22, 0.32, 16), C, 0, 0.17, 0, hat); mesh(cyl(0.225, 0.225, 0.07, 16), M(o.scarf ?? 0xc8102e), 0, 0.06, 0, hat); }
  const sc = M(o.scarf ?? 0xc8102e); mesh(tor(0.29, 0.085, 8, 20), sc, 0, 1.68, 0, g).rotation.x = Math.PI / 2;
  mesh(box(0.14, 0.42, 0.06), sc, 0.2, 1.48, 0.33, g).rotation.z = 0.2;
  for (let i = 0; i < 3; i++) mesh(sph(0.045, 8, 6), C, 0, 1.18 + i * 0.16, 0.42 - Math.abs(i - 1) * 0.04, g);
  const arms = [-1, 1].map((sx) => { const a = grp(g, sx * 0.38, 1.42, 0); a.rotation.z = -sx * 2.0; const st = mesh(cyl(0.02, 0.028, 0.75, 5), M(0x4a3020), 0, -0.37, 0, a); mesh(cyl(0.012, 0.016, 0.2, 4), st.material, 0.06, -0.7, 0, a).rotation.z = 0.7; return a; });
  g.userData = { head, hat, armL: arms[0], armR: arms[1] }; return g;
}
export function figure(o = {}) {
  const g = new THREE.Group(), robe = M(o.robe ?? 0x8a3a3a), skin = M(o.skin ?? 0xe8b996), body = grp(g);
  mesh(cyl(0.13, 0.32, 1.08, 14), robe, 0, 0.54, 0, body); mesh(sph(0.165, 12, 8), robe, 0, 1.06, 0, body).scale.set(1.15, 0.7, 0.9);
  if (o.trim) mesh(tor(0.31, 0.05, 6, 18), M(o.trim), 0, 0.06, 0, body).rotation.x = Math.PI / 2;
  if (o.sash) mesh(tor(0.2, 0.035, 6, 16), M(o.sash), 0, 0.68, 0, body).rotation.x = Math.PI / 2;
  const head = grp(body, 0, 1.3, 0); mesh(sph(0.155, 14, 10), skin, 0, 0, 0, head);
  for (const sx of [-1, 1]) mesh(sph(0.02, 6, 5), COAL(), sx * 0.055, 0.02, 0.145, head);
  const hc = M(o.hat ?? o.robe ?? 0x8a3a3a);
  switch (o.head) {
    case 'veil': mesh(sph(0.185, 14, 10), hc, 0, 0.025, -0.055, head); mesh(cyl(0.17, 0.26, 0.55, 12), hc, 0, -0.3, -0.07, head); break;
    case 'crown': mesh(cyl(0.13, 0.11, 0.11, 8, true), M(0xffd34d, { m: 0.8, r: 0.25, e: 0x664400, side: THREE.DoubleSide }), 0, 0.17, 0, head); mesh(sph(0.15, 12, 8), hc, 0, 0.04, -0.02, head).scale.y = 0.9; break;
    case 'turban': mesh(sph(0.19, 12, 8), hc, 0, 0.1, -0.01, head).scale.y = 0.62; mesh(sph(0.035), G(0xff5050, 1.5), 0, 0.12, 0.17, head); break;
    case 'tophat': mesh(cyl(0.2, 0.2, 0.025, 14), hc, 0, 0.12, 0, head); mesh(cyl(0.125, 0.135, 0.26, 14), hc, 0, 0.25, 0, head); break;
    case 'bobble': mesh(sph(0.17, 12, 8), hc, 0, 0.05, -0.01, head).scale.y = 0.8; mesh(sph(0.055), M(0xffffff), 0, 0.2, 0, head); break;
    case 'bonnet': mesh(sph(0.185, 12, 8), hc, 0, 0.03, -0.05, head); mesh(tor(0.17, 0.03, 6, 16), M(0xffffff), 0, 0.03, 0.03, head); break;
    case 'hair': mesh(sph(0.165, 12, 8), hc, 0, 0.03, -0.03, head); break;
  }
  if (o.beard) mesh(sph(0.11, 10, 8), M(o.beard), 0, -0.11, 0.07, head).scale.set(1, 1.15, 0.7);
  if (o.scarf) mesh(tor(0.13, 0.05, 6, 14), M(o.scarf), 0, 1.15, 0, body).rotation.x = Math.PI / 2;
  const arms = [-1, 1].map((sx) => { const a = grp(body, sx * 0.19, 1.04, 0); a.rotation.z = sx * 0.18; mesh(cyl(0.055, 0.065, 0.5, 8), robe, 0, -0.25, 0, a); mesh(sph(0.055, 8, 6), skin, 0, -0.52, 0, a); return a; });
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
      mesh(cyl(hs * 0.07, hs * 0.1, hs * 2, 5), m, 0, hs, 0, a);
      for (let i = 0; i < 3; i++) { const t = mesh(cyl(hs * 0.05, hs * 0.07, hs * 0.9, 5), m, hs * 0.3, hs * (0.8 + i * 0.55), 0, a); t.rotation.z = -0.9; }
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
  const legs = [], lm = M(o.leg ?? col), ll = ht + r * 0.6;
  for (const sx of [1, -1]) for (const sz of [1, -1]) {
    const p = grp(g, sx * (L * 0.45 + r * 0.2), ht + r * 0.6, sz * r * 0.55); mesh(cyl(lw, lw * 0.75, ll, 8), lm, 0, -ll / 2, 0, p);
    mesh(cyl(lw * 0.9, lw, 0.07, 8), M(0x1c1410), 0, -ll + 0.035, 0, p); legs.push(p);
  }
  const neck = grp(g, L / 2 + r * 0.35, ht + r * 1.4, 0); neck.rotation.z = -nk; mesh(cyl(r * 0.42, r * 0.62, nl + r * 0.5, 10), c, 0, nl / 2 - r * 0.25, 0, neck);
  const head = grp(neck, 0, nl, 0); head.rotation.z = nk - (o.nod ?? 0.2); const hm = M(o.headColor ?? col);
  mesh(sph(hs, 14, 10), hm, hs * 0.4, 0, 0, head).scale.set(1.5, 0.95, 0.9);
  const nose = mesh(sph(hs * (o.muzzleS ?? 0.5), 10, 8), o.nose !== undefined ? G(o.nose, 2.6) : M(o.muzzle ?? 0x2a1c14), hs * 1.7, -hs * 0.18, 0, head);
  if (o.nose !== undefined) halo(o.nose, hs * 5, hs * 1.8, -hs * 0.18, 0, head, 0.7);
  for (const sz of [-1, 1]) {
    mesh(sph(hs * 0.14, 8, 6), M(0x0a0a0a, { r: 0.2 }), hs * 0.95, hs * 0.32, sz * hs * 0.7, head);
    const e = mesh(cone(hs * 0.3, hs * (o.ear ?? 0.8), 6), hm, -hs * 0.2, hs * 0.7, sz * hs * 0.8, head); e.rotation.x = sz * (o.earA ?? 0.8);
  }
  if (o.antlers) antlers(head, hs, o.antlers);
  if (o.horns) for (const sz of [-1, 1]) {
    if (o.horns === 'long') { const h = mesh(tor(hs * 1.5, hs * 0.13, 6, 14, Math.PI * 0.55), M(0xf0e6d0), 0, hs * 0.5, sz * hs * 2.0, head); h.rotation.set(0, Math.PI / 2, 0); h.rotation.z = sz > 0 ? Math.PI : -Math.PI * 0.55; h.scale.z = 1; }
    else { const h = mesh(cone(hs * 0.16, hs * 1.1, 6), M(0xf0e6d0), 0, hs * 0.75, sz * hs * 0.9, head); h.rotation.x = sz * 1.0; }
  }
  if (o.fringe) for (let i = 0; i < 7; i++) { const f = mesh(cone(hs * 0.3, hs * 1.3, 5), M(new THREE.Color(col).offsetHSL(0, 0, 0.04)), hs * (0.55 + rnd(0.3)), hs * 0.55, (i - 3) * hs * 0.26, head); f.rotation.x = Math.PI; f.rotation.z = -0.5; }
  if (o.dewlap) mesh(sph(hs * 0.4, 8, 6), c, hs * 0.5, -hs * 1.2, 0, head).scale.y = 1.6;
  const tail = mesh(o.tail === 'puff' ? sph(r * 0.3, 8, 6) : cyl(lw * 0.5, lw * 0.3, r * 1.6, 5), o.tail === 'white' ? M(0xffffff) : c, -L / 2 - r * 0.95, ht + r * (o.tail === 'puff' ? 1.2 : 0.7), 0, g); if (o.tail !== 'puff') tail.rotation.z = -0.3;
  g.userData = { legs, neck, head, nose, body, nk }; return g;
}
export const gallop = (b, t, amp = 0.6, sp = 8) => b.userData.legs.forEach((l, i) => { l.rotation.z = Math.sin(t * sp + (i < 2 ? 0 : Math.PI) + (i % 2) * 0.7) * amp; });
export const nod = (b, t, amp = 0.12, sp = 1) => { b.userData.neck.rotation.z = -b.userData.nk + Math.sin(t * sp) * amp; };
export const reindeer = (red) => beast({ color: 0x8a5a33, len: 0.85, r: 0.25, ht: 0.68, nl: 0.5, hs: 0.15, antlers: 'deer', tail: 'white', nose: red ? 0xff2a1a : undefined, leg: 0x6b4526 });
export const horse = (c = 0x9a6436) => beast({ color: c, len: 1.15, r: 0.33, ht: 0.85, nl: 0.75, hs: 0.2, neck: 0.75, ear: 0.6, leg: 0x6b4526 });
export const donkey = () => beast({ color: 0x8d8a8c, len: 0.9, r: 0.29, ht: 0.6, nl: 0.5, hs: 0.18, ear: 1.7, earA: 0.3, muzzle: 0xe8e0d8, muzzleS: 0.6 });
export const camel = () => beast({ color: 0xc9a063, len: 1.3, r: 0.38, ht: 1.15, nl: 1.0, hs: 0.19, neck: 0.45, hump: true, ear: 0.4, lw: 0.07, muzzle: 0xa07a48, muzzleS: 0.6 });
export const ox = () => beast({ color: 0x6b3f22, len: 1.1, r: 0.42, ht: 0.5, nl: 0.3, hs: 0.22, neck: 1.1, horns: 'short', lw: 0.08, muzzle: 0xd9b89a, muzzleS: 0.65 });
export const sheep = () => beast({ color: 0xf2efe6, len: 0.4, r: 0.27, ht: 0.3, nl: 0.2, hs: 0.12, neck: 0.9, wool: true, headColor: 0x2c2826, leg: 0x2c2826, tail: 'puff', lw: 0.04 });
export const polarBear = (s = 1) => { const b = beast({ color: 0xf6f4ee, len: 1.2, r: 0.46, ht: 0.42, nl: 0.35, hs: 0.24, neck: 1.0, ear: 0.35, lw: 0.13, tail: 'puff', muzzle: 0x18181c, muzzleS: 0.3 }); b.scale.setScalar(s); return b; };
export const moose = () => beast({ color: 0x7a5236, len: 1.35, r: 0.42, ht: 1.15, nl: 0.6, hs: 0.26, neck: 0.85, antlers: 'moose', hump: true, humpX: 0.45, dewlap: true, leg: 0xb9a78c, lw: 0.07, muzzle: 0x6b5140, muzzleS: 0.8, ear: 0.7 });
// Hamish the Highland cow — own build (not the generic beast) so the anatomy reads properly:
// horns sweep out from the poll above the ears, a dossan over the eyes, layered shaggy coat. Faces +x.
const _up = new THREE.Vector3(0, 1, 0);
function tuft(parent, mat, x, y, z, dx, dy, dz, len, rad) {
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
// George — a cheerful little brown monkey in a Christmas hat.
export function monkey() {
  const g = new THREE.Group(), fur = M(0x7a4a22), face = M(0xecc79c), body = grp(g);
  mesh(sph(0.28, 14, 10), fur, 0, 0.55, 0, body).scale.set(1, 1.2, 0.9); mesh(sph(0.2, 12, 8), face, 0, 0.52, 0.13, body).scale.set(1, 1.15, 0.7);
  const head = grp(body, 0, 1.03, 0); mesh(sph(0.24, 14, 10), fur, 0, 0, 0, head); mesh(sph(0.185, 12, 8), face, 0, -0.02, 0.1, head).scale.set(1, 0.92, 0.8);
  mesh(sph(0.115, 10, 8), face, 0, -0.1, 0.19, head).scale.set(1.2, 0.8, 0.8); mesh(tor(0.06, 0.012, 5, 10, Math.PI), M(0x5a2a1a), 0, -0.1, 0.28, head).rotation.z = Math.PI;
  for (const sx of [-1, 1]) { mesh(sph(0.03, 6, 5), M(0x0a0a0a, { r: 0.2 }), sx * 0.075, 0.04, 0.215, head); mesh(sph(0.09, 8, 6), face, sx * 0.25, 0.02, 0, head).scale.z = 0.5; }
  const hat = grp(head, 0, 0.17, 0); hat.rotation.z = 0.35; mesh(cone(0.2, 0.42, 12), M(0xc4131f), 0, 0.2, 0, hat); mesh(tor(0.19, 0.055, 6, 16), M(0xffffff), 0, 0.01, 0, hat).rotation.x = Math.PI / 2; mesh(sph(0.065), M(0xffffff), 0, 0.43, 0, hat);
  mesh(tor(0.19, 0.06, 6, 14), M(0x1f7a4a), 0, 0.84, 0, body).rotation.x = Math.PI / 2;
  const arms = [-1, 1].map((sx) => { const a = grp(body, sx * 0.27, 0.76, 0); a.rotation.z = sx * 0.3; mesh(cyl(0.05, 0.05, 0.5, 6), fur, 0, -0.25, 0, a); mesh(sph(0.07, 8, 6), face, 0, -0.52, 0, a); return a; });
  for (const sx of [-1, 1]) { const l = grp(body, sx * 0.14, 0.32, 0.05); l.rotation.x = -1.2; l.rotation.z = sx * 0.3; mesh(cyl(0.055, 0.05, 0.36, 6), fur, 0, -0.18, 0, l); mesh(sph(0.075, 8, 6), face, 0, -0.38, 0.03, l).scale.z = 1.5; }
  const tail = mesh(tor(0.24, 0.035, 6, 18, Math.PI * 1.5), fur, 0, 0.42, -0.4, body); tail.rotation.y = Math.PI / 2;
  g.userData = { head, armL: arms[0], armR: arms[1], body, tail };
  g.userData.wave = (t) => { arms[1].rotation.z = 2.5 + Math.sin(t * 7) * 0.4; head.rotation.z = Math.sin(t * 2) * 0.15; tail.rotation.x = Math.sin(t * 3) * 0.3; };
  return g;
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
export function sleigh() {
  const g = new THREE.Group(), red = M(0xb0101c, { r: 0.45 }), gold = M(0xffd34d, { m: 0.85, r: 0.25, e: 0x5a3c00 });
  mesh(box(1.5, 0.5, 0.85), red, 0, 0.55, 0, g); mesh(box(0.14, 0.85, 0.85), red, -0.7, 1.0, 0, g); mesh(box(1.54, 0.06, 0.89), gold, 0, 0.81, 0, g);
  const curl = mesh(tor(0.32, 0.09, 8, 14, Math.PI * 1.1), red, 0.72, 0.82, 0, g); curl.rotation.z = -0.4; curl.scale.z = 4.2;
  for (const sz of [-1, 1]) {
    mesh(box(2.0, 0.05, 0.06), gold, 0, 0.1, sz * 0.42, g); const c = mesh(tor(0.25, 0.028, 6, 14, Math.PI), gold, 1.0, 0.35, sz * 0.42, g); c.rotation.z = -Math.PI / 2;
    for (const x of [-0.5, 0.4]) mesh(box(0.05, 0.25, 0.05), gold, x, 0.22, sz * 0.42, g);
  }
  mesh(sph(0.42, 12, 9), M(0x6b4a2a), -0.3, 1.0, 0, g).scale.set(1, 1.15, 0.9);
  put(present(0.26, 0x1f7a4a, 0xffd34d), g, -0.1, 1.25, 0.2); put(present(0.22, 0x2a5db0, 0xffffff), g, -0.42, 1.35, -0.15);
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
  const g = new THREE.Group(), w = M(0x6b4a2a, { flat: true }), dk = M(0x4a321c);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(cyl(0.09, 0.11, 2.3, 6), dk, sx * 1.9, 1.15, sz * 1.0, g);
  mesh(box(4.0, 2.1, 0.1), w, 0, 1.05, -1.05, g); for (const sx of [-1, 1]) mesh(box(0.1, 2.1, 1.3), w, sx * 1.95, 1.05, -0.4, g);
  mesh(prism(4.9, 1.2, 2.9), M(0xa8873f, { flat: true }), 0, 2.25, 0, g); mesh(prism(5.0, 1.28, 2.6), M(0xf4f8ff, { r: 0.95 }), 0, 2.33, -0.1, g);
  mesh(cyl(2.3, 2.4, 0.06, 20), M(0xc9a94a), 0, 0.03, 0, g).scale.z = 0.62;
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
