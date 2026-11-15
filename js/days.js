// Turns a day definition into a live scene.
import { THREE, clamp, easeOut, easeIO, skyDome, starfield, snowfall, disposeTree, Particles } from './kit.js';
import { DAYS_A } from './days-a.js';
import { DAYS_B } from './days-b.js';
import { enhanceDay } from './look.js';
import { makeSpark } from './stars.js';

export const DAYS = [...DAYS_A, ...DAYS_B];

// opts.found: this door's star is already in the sky
export function makeDay(n, aspect = 1.6, opts = {}) {
  const def = DAYS[n - 1], scene = new THREE.Scene(), g = new THREE.Group(); scene.add(g);
  const sky = def.sky ?? [0x060c2c, 0x243a78];
  scene.add(skyDome(sky[0], sky[1]));
  if (def.fogD !== 0) scene.fog = new THREE.FogExp2(sky[1], def.fogD ?? 0.012);
  const L = def.light ?? 1, hemi = def.hemi ?? [0x9fb4ff, 0x39486e];
  scene.add(new THREE.HemisphereLight(hemi[0], hemi[1], 1.15 * L));
  const dir = new THREE.DirectionalLight(def.hemi ? hemi[0] : 0xc4d4ff, 1.0 * L); dir.position.set(-6, 12, 8); scene.add(dir);
  if (def.stars !== false) scene.add(starfield(900));
  if (def.snow !== 0) scene.add(snowfall(def.snow ?? 1400, 26, 20));
  const camera = new THREE.PerspectiveCamera(def.fov ?? 50, aspect, 0.1, 600); scene.add(camera);
  const fx = new Particles(1500); scene.add(fx.points);
  let spark = null; const rays = [], taps = [];
  const ctx = {
    scene, camera, fx,
    star: (parent, x, y, z, o = {}) => { spark = makeSpark(parent, x, y, z, { ...o, found: opts.found }); if (o.tap) taps.push(o.tap); return spark; },
    rays: (obj, k = 1, col = 0xfff0c0) => rays.push({ obj, k, col: new THREE.Color(col) }), // a light the grade pass draws shafts from
    tap: (obj, fn) => { obj.userData.tap = fn; taps.push(obj); }, // something in the scene with its own little secret
  };
  const upd = def.build(g, ctx);
  const ticks = []; scene.traverse((o) => { if (o.userData.tick) ticks.push(o.userData.tick); });
  const look = new THREE.Vector3(...def.look), base = new THREE.Vector3(...def.cam).sub(look), v = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), qa = new THREE.Quaternion();
  const pokes = [], ray = new THREE.Raycaster(), groundish = new THREE.Sphere();
  function poseAt(t, out, mx = 0, my = 0) {
    const portrait = clamp(1.25 / camera.aspect, 1, 2.2), zoom = (1 + 0.45 * (1 - easeOut(clamp(t / 5)))) * portrait;
    v.copy(base).multiplyScalar(zoom).applyAxisAngle(Y, Math.sin(t * 0.13) * (def.orbit ?? 0.14) - mx * 0.22);
    out.copy(look).add(v); out.y += my * 0.6 + Math.sin(t * 0.21) * 0.12; return out;
  }
  const day = {
    n, def, scene, camera, dir, look, fx, rays, g, poseAt, blend: null,
    get spark() { return spark; },
    update(t, dt, mx = 0, my = 0) {
      for (const p of pokes) p.o.position.y -= p.off;
      for (const f of ticks) f(t, dt); if (upd) upd(t, dt);
      for (let i = pokes.length - 1; i >= 0; i--) { const p = pokes[i], u = clamp((t - p.t0) / 0.55); p.off = Math.sin(u * Math.PI) * p.h; p.o.position.y += p.off; if (u >= 1) pokes.splice(i, 1); }
      spark?.update(t, dt, fx, camera); fx.update(dt);
      poseAt(t, camera.position, mx, my); camera.lookAt(look);
      const fov = def.fov ?? 50;
      if (day.blend) { // easing out of the doorway pose the house handed over
        const b = day.blend, k = easeIO(clamp((t - b.t0) / b.dur)); camera.position.lerpVectors(b.pos, camera.position, k); qa.copy(camera.quaternion); camera.quaternion.copy(b.quat).slerp(qa, k);
        const f2 = b.fov + (fov - b.fov) * k; if (camera.fov !== f2) { camera.fov = f2; camera.updateProjectionMatrix(); } if (k >= 1) day.blend = null;
      } else if (day.blendTo) { // and back towards it, when leaving
        const b = day.blendTo, k = easeIO(clamp((t - b.t0) / b.dur)); camera.position.lerp(b.pos, k); camera.quaternion.slerp(b.quat, k);
        const f2 = fov + (b.fov - fov) * k; if (camera.fov !== f2) { camera.fov = f2; camera.updateProjectionMatrix(); }
      } else if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    },
    // a tap inside the scene: the star, a secret, or just a friendly boing and a puff of sparkles
    click(ndc, t) {
      ray.setFromCamera(ndc, camera); const list = [g]; if (spark?.state === 'shown') list.push(spark.hit);
      const hits = ray.intersectObjects(list, true).filter((h) => h.object.visible && !h.object.isPoints && !h.object.isSprite); const h = hits.find((x) => x.object.userData.spark) ?? hits[0];
      if (!h) return null; if (h.object.userData.spark) return spark.collect(t, scene, fx) ? 'star' : null;
      let o = h.object, top = null; while (o && o !== g) { if (o.userData.tap || o === spark?.host) break; top = o; o = o.parent; }
      const p = h.point; fx.burst(p.x, p.y, p.z, 26, 1.8, [0xffe9a0, 0xffffff, 0xbfe0ff, ...def.col], 1, 0.7, 0.8);
      if (o && o !== g) { if (o === spark?.host && spark.state === 'hidden') { spark.reveal(t); bounce(o, t); return 'reveal'; } o.userData.tap?.(t); bounce(o, t); return 'tap'; }
      if (top) { top.geometry?.boundingSphere ?? top.geometry?.computeBoundingSphere(); groundish.copy(top.geometry?.boundingSphere ?? new THREE.Sphere(undefined, 1)); if (!top.geometry || groundish.radius * top.scale.x < 5) bounce(top, t); }
      return 'poke';
    },
    dispose() { scene.traverse((o) => { if (o.isReflector) o.dispose?.(); }); disposeTree(scene); },
  };
  function bounce(o, t) { if (pokes.some((p) => p.o === o)) return; const s = new THREE.Box3().setFromObject(o).getSize(v); pokes.push({ o, t0: t, off: 0, h: clamp(s.y * 0.18, 0.06, 0.45) / Math.max(0.2, o.parent?.getWorldScale(new THREE.Vector3()).y ?? 1) }); }
  enhanceDay(day);
  return day;
}
