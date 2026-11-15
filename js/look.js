// The cinematic look shared by every door: quality tiers, soft shadows, night-sky reflections, foreground bokeh
// snow, the grade pass (miniature focus, light shafts, colour, vignette, grain, letterbox, keyhole), the doorway
// camera that makes an open door a true window into its world, and the little living loops on opened doors.
import { THREE, clamp, rnd, setDetail, skyDome, U, SPARKLE, PX } from './kit.js';

// ---------- quality ----------
const qs = new URLSearchParams(location.search), qp = qs.get('q');
const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
export const Q = { tier: qp !== null ? clamp(Math.round(+qp), 0, 2) : coarse || /Mobi|Android/i.test(navigator.userAgent) ? 1 : 2, fixed: qp !== null };
setDetail(Q.tier === 2 ? 1.5 : 1);
let R = null; export const initLook = (renderer) => {
  R = renderer; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
};
// Watch a day scene's real frame times and step down a tier if it can't keep up. Frames slower than a quarter of a
// second are a hidden or throttled tab (or a one-off hitch), not a slow device, so they are ignored; and the drop
// only takes effect once back at the house (main applies it), never in the middle of an open scene.
export function watchFrames(raw, onDrop) {
  if (Q.fixed || Q.tier === 0 || Q.pending || document.hidden || !(raw > 0) || raw > 0.25) return;
  Q.acc = (Q.acc ?? 0) + raw; Q.n = (Q.n ?? 0) + 1;
  if (Q.acc > 4) { const avg = Q.acc / Q.n; Q.acc = Q.n = 0; if (avg > 1 / 32) { Q.pending = true; onDrop?.(); } }
}
export function applyPendingDrop() { if (!Q.pending) return false; Q.pending = false; Q.tier = Math.max(0, Q.tier - 1); return true; }
export const resetWatch = () => { Q.acc = Q.n = 0; };

// ---------- environment light for reflections ----------
const envCache = new Map();
function envFor(top, bottom, warm = 0xffc070) {
  const key = `${top}-${bottom}-${warm}`; if (envCache.has(key)) return envCache.get(key);
  const s = new THREE.Scene(); s.add(skyDome(top, bottom, 50));
  const card = (c, i, x, y, z, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  card(0xfff6dc, 3, -18, 22, -20, 9, 9); card(warm, 2.2, 16, 4, 10, 14, 5); card(warm, 1.6, -14, 3, 16, 10, 4); card(0x9fc0ff, 1.2, 0, 30, 18, 20, 6);
  const pm = new THREE.PMREMGenerator(R), tex = pm.fromScene(s, 0.035).texture; pm.dispose(); envCache.set(key, tex); return tex;
}

// ---------- dress a freshly built day scene ----------
export function enhanceDay(day) {
  const { scene, def, dir, look, camera } = day, tier = Q.tier;
  const sky = def.sky ?? [0x060c2c, 0x243a78]; if (R) scene.environment = envFor(sky[0], sky[1], def.col?.[0] ?? 0xffc070);
  // one soft shadow from the key light, its frustum hugging the diorama
  const reach = clamp(new THREE.Vector3(...def.cam).distanceTo(look) * 0.95, 7, 16);
  if (tier > 0 && def.shadow !== false) {
    dir.castShadow = true; dir.shadow.mapSize.setScalar(tier === 2 ? 2048 : 1024); const c = dir.shadow.camera; c.left = c.bottom = -reach; c.right = c.top = reach; c.near = 1; c.far = 80;
    dir.shadow.bias = -0.0004; dir.shadow.normalBias = 0.035; dir.shadow.radius = 3; dir.position.copy(look).add(new THREE.Vector3(-0.42, 0.78, 0.46).multiplyScalar(40)); dir.target.position.copy(look); scene.add(dir.target);
    dir.intensity *= def.shadowKey ?? 1.25;
  }
  const bs = new THREE.Sphere();
  scene.traverse((o) => {
    if (!o.isMesh || !o.material) return; const m = o.material;
    if (m.isMeshStandardMaterial) {
      m.envMapIntensity = m.metalness > 0.3 ? 1.1 : m.roughness < 0.4 ? 0.5 : 0.18;
      if (tier > 0 && !m.transparent) { o.receiveShadow = true; o.geometry.boundingSphere ?? o.geometry.computeBoundingSphere(); bs.copy(o.geometry.boundingSphere); o.castShadow = bs.radius * o.scale.x < 9 && def.shadow !== false; }
    }
  });
  // big out-of-focus flakes drifting just in front of the lens
  if (def.snow !== 0 && tier > 0) camera.add(bokehSnow(tier === 2 ? 34 : 20));
  day.grade = gradeFor(def);
}
function bokehSnow(n) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos.set([rnd(-2.6, 2.6), rnd(-1.6, 1.6), -rnd(1.2, 3.4)], i * 3); seed[i] = Math.random(); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uPx: PX }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aSeed; uniform float uTime,uPx; varying float vA;
      void main(){ vec3 p=position; float sp=.18+aSeed*.25; p.y=mod(p.y+1.6-uTime*sp,3.2)-1.6; p.x+=sin(uTime*.3+aSeed*30.)*.25;
      vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=uPx*(80.+aSeed*150.)/-mv.z; vA=.018+.03*aSeed; }`,
    fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.38,d)*(.75+.25*smoothstep(.2,.45,d)); gl_FragColor=vec4(vec3(.85,.9,1.)*a*vA,1.); }`,
  });
  const p = new THREE.Points(geo, mat); p.frustumCulled = false; p.renderOrder = 10; return p;
}

// ---------- the grade pass ----------
export const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: U.time, uVig: { value: 0.35 }, uGrain: { value: 0.025 }, uSat: { value: 1 },
    uLift: { value: new THREE.Color(0, 0, 0) }, uGain: { value: new THREE.Color(1, 1, 1) }, uTilt: { value: 0 }, uFocus: { value: 0.5 }, uBand: { value: 0.16 },
    uRay: { value: 0 }, uRayPos: { value: new THREE.Vector2(0.5, 0.7) }, uRayCol: { value: new THREE.Color(1, 0.94, 0.8) }, uLetter: { value: 0 }, uFlash: { value: 0 },
    uKey: { value: 0 }, uKeyR: { value: 1 }, uKeyBlur: { value: 0 }, uTaps: { value: 12 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uRes,uRayPos; uniform float uTime,uVig,uGrain,uSat,uTilt,uFocus,uBand,uRay,uLetter,uFlash,uKey,uKeyR,uKeyBlur,uTaps; uniform vec3 uLift,uGain,uRayCol; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 uv=vUv; vec3 c=texture2D(tDiffuse,uv).rgb;
      float b=uTilt*smoothstep(uBand,uBand+.32,abs(uv.y-uFocus))+uKeyBlur;
      if(b>.4){ vec3 acc=c; float w=1.; float a0=h(uv*uRes+fract(uTime))*6.2832;
        for(int i=0;i<16;i++){ float fi=float(i); if(fi>=uTaps) break; float a=a0+fi*2.39996; float r=sqrt((fi+.5)/uTaps)*b; acc+=texture2D(tDiffuse,uv+vec2(cos(a),sin(a))*r/uRes).rgb; w+=1.; }
        c=acc/w; }
      if(uRay>.001){ vec2 d=(uv-uRayPos)*(1./30.); vec2 p=uv-d*h(uv*uRes)*.5; float dec=1.; vec3 r=vec3(0.);
        for(int i=0;i<30;i++){ p-=d; vec3 s=texture2D(tDiffuse,p).rgb; r+=max(s-vec3(.75),vec3(0.))*dec; dec*=.95; }
        c+=r*uRayCol*uRay*.12; }
      float l=dot(c,vec3(.2126,.7152,.0722)); c=mix(vec3(l),c,uSat); c=c*uGain+uLift*(1.-clamp(l*2.,0.,1.));
      vec2 q=uv-.5; q.x*=uRes.x/uRes.y; c*=1.-uVig*smoothstep(.3,1.05,length(q));
      c+=uFlash*vec3(1.,.93,.8);
      if(uKey>.001){ vec2 k=q/max(uKeyR,.001); float dc=length(k-vec2(0.,.07))-.15; float hw=.055+(.07-k.y)*.2;
        float dt=max(abs(k.x)-hw,max(k.y-.07,-.3-k.y)); float d=min(dc,dt); float m=smoothstep(.012,-.012,d);
        c=mix(c,c*m+vec3(1.,.75,.35)*smoothstep(.03,0.,abs(d))*.5,uKey); }
      float lb=uLetter*.105; c*=step(lb,uv.y)*step(uv.y,1.-lb);
      c+=(h(uv*uRes+fract(uTime*7.)*91.)-.5)*uGrain*(.3+.4*min(l,1.));
      gl_FragColor=vec4(c,1.);
    }`,
};
// a grade for each door, from its own colours: highlights lean gently towards the first, shadows towards the second
export function gradeFor(def) {
  const a = new THREE.Color(def.col?.[0] ?? 0xffffff), b = new THREE.Color(def.col?.[1] ?? 0x8090ff), g = def.grade ?? {};
  return { gain: new THREE.Color(1, 1, 1).lerp(a, g.warm ?? 0.1).multiplyScalar(g.exp ?? 1.04), lift: b.multiplyScalar(g.lift ?? 0.025), sat: g.sat ?? 1.08, vig: g.vig ?? 0.5, tilt: g.tilt ?? 1, rim: def.rim ?? def.col?.[0] ?? 0xbfd4ff };
}
export const HOME_GRADE = { gain: new THREE.Color(1.02, 1.0, 1.03), lift: new THREE.Color(0.004, 0.008, 0.03), sat: 1.05, vig: 0.38, tilt: 0, rim: 0x9fb8ff };
export function applyGrade(u, gr, k = 1, rimLevel = 0.28) {
  u.uGain.value.setRGB(1, 1, 1).lerp(gr.gain, k); u.uLift.value.setRGB(0, 0, 0).lerp(gr.lift, k); u.uSat.value = 1 + (gr.sat - 1) * k; u.uVig.value = 0.3 + (gr.vig - 0.3) * k;
  U.rim.value.set(gr.rim).multiplyScalar(rimLevel);
}
export function tierUniforms(u, pr) { u.uTaps.value = Q.tier === 2 ? 16 : Q.tier === 1 ? 9 : 0; u.uGrain.value = Q.tier ? 0.014 : 0; SPARKLE.value = Q.tier ? 1 : 0.6; return pr; }

// ---------- the doorway camera ----------
// The open door is a window in the house wall; behind it sits a window of the same shape in the day's world, just in
// front of the day camera's resting place. Wherever the house camera is, the portal camera is put at the matching
// place behind the day's window with an off-axis frustum through it, so the doorway shows true parallax — and when
// the house camera arrives in the doorway, the day camera is exactly where the portal camera was. No cut.
export const PORTAL_S = 0.5;
export function portalRig(day, zEnd) {
  const E0 = day.poseAt(5, new THREE.Vector3()), f = day.look.clone().sub(E0).normalize(), r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, f);
  const C = E0.clone().addScaledVector(f, zEnd * PORTAL_S), cam = new THREE.PerspectiveCamera(45, 1, 0.1, 600), q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f.clone().negate()));
  const e = new THREE.Vector3();
  return {
    cam, E0, q,
    // eye: the house camera's position relative to the doorway's centre (x right, y up, z out of the wall)
    place(eye, W, H) {
      e.copy(C).addScaledVector(r, eye.x * PORTAL_S).addScaledVector(u, eye.y * PORTAL_S).addScaledVector(f, -eye.z * PORTAL_S);
      const dz = Math.max(0.02, eye.z * PORTAL_S), n = Math.max(0.02, dz * 0.97), hw = (W * PORTAL_S) / 2, hh = (H * PORTAL_S) / 2, ex = eye.x * PORTAL_S, ey = eye.y * PORTAL_S, k = n / dz;
      cam.position.copy(e); cam.quaternion.copy(q); cam.near = n; cam.far = 600; cam.updateMatrixWorld();
      cam.projectionMatrix.makePerspective((-hw - ex) * k, (hw - ex) * k, (hh - ey) * k, (-hh - ey) * k, n, 600); cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
      return cam;
    },
  };
}

// ---------- living windows ----------
// When you leave a door, its world is filmed for a few seconds into a little strip of frames; the opened door then
// plays it back, softly blended, so the house front slowly fills with tiny moving worlds.
export const LW = { w: 160, h: 198, cols: 4, rows: 3 };
export function captureLoop(day, rt) {
  const { w, h, cols, rows } = LW, N = cols * rows;
  rt ??= new THREE.WebGLRenderTarget(w * cols, h * rows, { type: THREE.HalfFloatType });
  const cam = day.camera, a = cam.aspect; cam.aspect = w / h; cam.updateProjectionMatrix(); const t0 = Math.max(day.t ?? 0, 8), sm = R.shadowMap.autoUpdate;
  for (let i = 0; i < N; i++) {
    day.update(t0 + i * 0.22, 0.22); rt.viewport.set((i % cols) * w, (rows - 1 - Math.floor(i / cols)) * h, w, h); rt.scissor.copy(rt.viewport); rt.scissorTest = true;
    R.setRenderTarget(rt); R.render(day.scene, cam);
  }
  R.setRenderTarget(null); rt.scissorTest = false; rt.viewport.set(0, 0, w * cols, h * rows); R.shadowMap.autoUpdate = sm; cam.aspect = a; cam.updateProjectionMatrix(); return rt;
}
export function windowMaterial(tex) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, uTime: U.time, uGlow: { value: 1 }, uSeed: { value: Math.random() * 10 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D map; uniform float uTime,uGlow,uSeed; varying vec2 vUv;
      vec3 fr(float i){ vec2 cell=vec2(mod(i,${LW.cols}.),${LW.rows - 1}.-floor(i/${LW.cols}.)); return texture2D(map,(cell+vUv)/vec2(${LW.cols}.,${LW.rows}.)).rgb; }
      void main(){ float N=${LW.cols * LW.rows}.; float p=mod((uTime+uSeed)*4.5,2.*(N-1.)); p=p<N-1.?p:2.*(N-1.)-p; float i=floor(p);
        vec3 c=mix(fr(i),fr(min(i+1.,N-1.)),fract(p)); vec2 q=vUv-.5; c*=1.-.55*smoothstep(.25,.75,length(q*vec2(1.,.8)));
        gl_FragColor=vec4(c*1.2*uGlow,1.); }`,
  });
}
