// Twenty-four different ways for a door to open. Each door is cut into fragments;
// an effect positions one fragment f for progress p (0..1). Fragment space: x in [-W/2,W/2], y in [0,H].
import { THREE, TAU, clamp, smooth, easeOut, easeIO, easeBack } from './kit.js';

export const DW = 1.7, DH = 2.1;
const W = DW, H = DH, _v = new THREE.Vector3(), _p = new THREE.Vector3(), _ax = new THREE.Vector3();
const st = (p, d, span = 0.5) => clamp((p - d * (1 - span)) / span); // staggered local progress
function rigid(f, px, py, pz, ax, ay, az, ang) {
  _ax.set(ax, ay, az); _p.set(px, py, pz); _v.copy(f.home).sub(_p).applyAxisAngle(_ax, ang).add(_p);
  f.m.position.copy(_v); f.m.quaternion.setFromAxisAngle(_ax, ang);
}
const shrink = (f, k) => f.m.scale.setScalar(Math.max(0.0001, k));
const cx = (f) => f.home.x, cy = (f) => f.home.y - H / 2;

export const EFFECTS = [
  // 1 swing open on left hinge
  (f, p) => rigid(f, -W / 2, 0, 0.07, 0, 1, 0, -easeBack(clamp(p * 1.3)) * 1.9),
  // 2 swing open on right hinge
  (f, p) => rigid(f, W / 2, 0, 0.07, 0, 1, 0, easeBack(clamp(p * 1.3)) * 1.9),
  // 3 double doors
  (f, p) => { const s = f.u < 0.5 ? -1 : 1; rigid(f, s * W / 2, 0, 0.07, 0, 1, 0, s * easeIO(clamp(p * 1.25)) * 1.8); },
  // 4 drawbridge falls forward with a bounce
  (f, p) => { const q = clamp(p * 1.5), b = q < 0.7 ? easeIO(q / 0.7) : 1 - Math.sin((q - 0.7) / 0.3 * Math.PI) * 0.08; rigid(f, 0, 0, 0.07, 1, 0, 0, b * Math.PI / 2); },
  // 5 roller shutter
  (f, p) => { const y = f.home.y + easeIO(p) * H * 1.1; f.m.position.y = Math.min(y, H); f.m.scale.y = clamp((H + 0.2 - y) / 0.4) + 0.0001; f.m.position.z += Math.sin(clamp((y - H + 0.5) * 2) * 1.5) * 0.08; },
  // 6 venetian blind: rows tip flat then slide away
  (f, p) => { const q = st(p, f.v, 0.45); f.m.rotation.x = easeIO(clamp(q * 2)) * Math.PI / 2; f.m.position.x += easeIO(clamp(q * 2 - 1)) * (f.j % 2 ? 1 : -1) * W * 1.2; shrink(f, 1 - smooth(0.7, 1, q)); },
  // 7 spiral flip
  (f, p) => { const d = (Math.atan2(cy(f), cx(f)) / TAU + 0.5) * 0.6 + (1 - Math.hypot(cx(f), cy(f)) / 1.4) * 0.4, q = st(p, d, 0.35); f.m.rotation.y = q * Math.PI * 1.5; f.m.position.z += Math.sin(q * Math.PI) * 0.5; shrink(f, 1 - q * q); },
  // 8 shatter outward
  (f, p) => { const q = easeOut(p); f.m.position.x += cx(f) * q * 5 + (f.seed - 0.5) * q * 2; f.m.position.y += cy(f) * q * 4 + q * 1.5 - p * p * 6; f.m.position.z += q * (1 + f.s2 * 4); f.m.rotation.set(f.seed * q * 9, f.s2 * q * 9, q * 4); },
  // 9 melt like ice
  (f, p) => { const q = st(p, f.seed * 0.5 + (1 - f.v) * 0.3, 0.55), e = q * q; f.m.position.y -= e * (f.home.y + 0.2); f.m.scale.set(1 - e * 0.75, 1 + q * 1.4 - e * 2.3 + 0.001, 1); },
  // 10 drift away as snowflakes
  (f, p) => { const q = st(p, f.seed, 0.5); f.m.position.y -= q * q * 3; f.m.position.x += Math.sin(q * 9 + f.seed * 20) * 0.5 * q; f.m.position.z += q * 1.2; f.m.rotation.z = q * 5 * (f.s2 - 0.5); f.m.rotation.x = q * 3; shrink(f, 1 - q * 0.85); },
  // 11 flutter off like butterflies
  (f, p) => { const q = st(p, f.s2, 0.6); f.m.position.x += Math.sin(f.seed * 50) * 3 * q; f.m.position.y += q * q * 6; f.m.position.z += q * 2; f.m.rotation.y = Math.sin(p * 55 + f.seed * 10) * 1.3 * Math.min(1, q * 6); shrink(f, 1 - q * 0.7); },
  // 12 whirlpool into the portal
  (f, p) => { const q = easeIO(p), a0 = Math.atan2(cy(f), cx(f)), r = Math.hypot(cx(f), cy(f)) * (1 - q), a = a0 + q * 7 * (1 + f.seed * 0.5); f.m.position.set(Math.cos(a) * r, H / 2 + Math.sin(a) * r, 0.07 + Math.sin(q * Math.PI) * 0.6); f.m.rotation.z = q * 9; shrink(f, 1 - q); },
  // 13 iris: opens from the centre outward
  (f, p) => { const d = Math.hypot(cx(f), cy(f)), q = easeIO(st(p, d / 1.4, 0.5)); f.m.position.x += cx(f) / (d + 0.01) * q * 1.6; f.m.position.y += cy(f) / (d + 0.01) * q * 1.6; f.m.rotation.z = q * 2; shrink(f, 1 - q); },
  // 14 theatre curtains
  (f, p) => { const q = easeIO(clamp(p * 1.2)), s = f.u < 0.5 ? -1 : 1, k = Math.abs(f.u - 0.5) * 2; f.m.position.x = f.home.x + (s * (W / 2 + 0.05 - (1 - k) * 0.12) - f.home.x) * q; f.m.scale.x = 1 - q * 0.82; f.m.position.z += Math.sin(f.v * 9 + p * 14 + f.i) * 0.05 * Math.sin(p * Math.PI) + q * 0.03 * f.i; f.m.position.y += q * (1 - f.v) * 0.25 * (1 - k); },
  // 15 chequerboard tumble
  (f, p) => { const q = st(p, ((f.i + f.j) % 2) * 0.7 + f.seed * 0.3, 0.4); f.m.rotation.x = q * Math.PI; f.m.position.z += Math.sin(q * Math.PI) * 0.7 + q * 0.5; f.m.position.y -= q * q * 2.5; shrink(f, 1 - q * q); },
  // 16 a wave ripples across
  (f, p) => { const q = st(p, f.u * 0.8 + f.v * 0.2, 0.4); f.m.position.z += Math.sin(q * Math.PI) * 0.9; f.m.position.y += Math.sin(q * Math.PI) * 0.4; f.m.rotation.y = q * TAU; shrink(f, 1 - smooth(0.5, 1, q)); },
  // 17 spin like a top and vanish
  (f, p) => { rigid(f, 0, 0, 0.07, 0, 1, 0, p * p * 24); f.m.position.x *= 1 - p; f.m.position.y = H / 2 + (f.m.position.y - H / 2) * (1 - p * p); shrink(f, 1 - p * p); },
  // 18 sink into the floor
  (f, p) => { const y = f.home.y - easeIO(p) * H * 1.1; f.m.position.y = Math.max(y, 0); f.m.scale.y = clamp((y + 0.2) / 0.4) + 0.0001; f.m.position.x += Math.sin(p * 70) * 0.012 * Math.sin(p * Math.PI); },
  // 19 crumble to gold dust
  (f, p) => { const q = st(p, f.seed * 0.7 + f.v * 0.3, 0.3); f.m.rotation.z = q * 3; f.m.position.z += q * 0.4; f.m.position.y -= q * q * 0.6; shrink(f, 1 - easeOut(q)); },
  // 20 unzip down the middle
  (f, p) => { const q = easeIO(st(p, 1 - f.v, 0.45)), s = f.u < 0.5 ? -1 : 1; f.m.position.x += s * q * (W * 0.55); f.m.rotation.z = -s * q * 0.9; f.m.position.z += q * 0.3; shrink(f, 1 - smooth(0.6, 1, q)); },
  // 21 fragments form a ring, orbit, and fly off
  (f, p) => { const a = (f.i * 5 + f.j) / 20 * TAU + p * TAU * 1.5, k = smooth(0, 0.35, p), out = smooth(0.65, 1, p), r = 1.5 + out * 5; f.m.position.set(f.home.x + (Math.cos(a) * r - f.home.x) * k, f.home.y + (H / 2 + Math.sin(a) * r - f.home.y) * k, 0.07 + k * 0.6 + out * 3); f.m.rotation.z = a * k; shrink(f, 1 - k * 0.5 - out * 0.5); },
  // 22 page turn
  (f, p) => { const q = easeIO(st(p, 1 - f.u, 0.6)); rigid(f, -W / 2, 0, 0.07, 0, 1, 0, -q * Math.PI * 0.97); f.m.position.z += Math.sin(q * Math.PI) * 0.25 * f.u; },
  // 23 jigsaw pieces drop out one by one
  (f, p) => { const q = st(p, f.seed, 0.3); f.m.position.z += Math.min(q * 4, 1) * 0.35; f.m.position.y -= q * q * 4.5; f.m.rotation.z = (f.s2 - 0.5) * q * 4; f.m.rotation.x = q * 2; },
  // 24 rise into the sky as stars
  (f, p) => { const q = st(p, 1 - f.v * 0.7 - f.seed * 0.3, 0.5); f.m.position.y += q * q * 9; f.m.position.x += Math.sin(q * 8 + f.seed * 30) * 0.7 * q; f.m.position.z += q * 1.5; f.m.rotation.y = q * 12; f.m.rotation.z = q * 3; shrink(f, 1 - q * 0.8); },
];

export function makeFragments(group, material) {
  const C = 4, R = 5, fw = W / C, fh = H / R, out = [];
  for (let i = 0; i < C; i++) for (let j = 0; j < R; j++) {
    const geo = new THREE.BoxGeometry(fw * 0.99, fh * 0.99, 0.09), uv = geo.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, (i + uv.getX(k)) / C, (j + uv.getY(k)) / R);
    const m = new THREE.Mesh(geo, material); m.position.set(-W / 2 + fw * (i + 0.5), fh * (j + 0.5), 0.07); group.add(m);
    out.push({ m, i, j, u: (i + 0.5) / C, v: (j + 0.5) / R, home: m.position.clone(), seed: Math.random(), s2: Math.random() });
  }
  return out;
}
export function applyEffect(n, frags, p) {
  const fx = EFFECTS[n - 1], fade = 1 - smooth(0.88, 1, p);
  for (const f of frags) { f.m.position.copy(f.home); f.m.rotation.set(0, 0, 0); f.m.scale.setScalar(1); fx(f, p); f.m.scale.multiplyScalar(Math.max(fade, 0.0001)); }
}
export function portalMaterial(a, b) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpen: { value: 0 }, uA: { value: new THREE.Color(a) }, uB: { value: new THREE.Color(b) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uTime,uOpen; uniform vec3 uA,uB; varying vec2 vUv;
      void main(){ vec2 p=vUv-.5; p.y*=1.25; float r=length(p), a=atan(p.y,p.x);
      float s=.5+.5*sin(a*3.+r*16.-uTime*3.), s2=.5+.5*sin(a*5.-r*10.+uTime*2.);
      vec3 c=mix(uA,uB,s)*(.5+s2*.9)+vec3(1.,.95,.8)*smoothstep(.4,0.,r)*1.6;
      gl_FragColor=vec4(c*uOpen*1.5+vec3(.02,.015,.03),1.); }`,
  });
}
