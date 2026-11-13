// Turns a day definition into a live scene.
import { THREE, clamp, easeOut, skyDome, starfield, snowfall, disposeTree } from './kit.js';
import { DAYS_A } from './days-a.js';
import { DAYS_B } from './days-b.js';

export const DAYS = [...DAYS_A, ...DAYS_B];

export function makeDay(n, aspect = 1.6) {
  const def = DAYS[n - 1], scene = new THREE.Scene(), g = new THREE.Group(); scene.add(g);
  const sky = def.sky ?? [0x060c2c, 0x243a78];
  scene.add(skyDome(sky[0], sky[1]));
  if (def.fogD !== 0) scene.fog = new THREE.FogExp2(sky[1], def.fogD ?? 0.012);
  const L = def.light ?? 1, hemi = def.hemi ?? [0x9fb4ff, 0x39486e];
  scene.add(new THREE.HemisphereLight(hemi[0], hemi[1], 1.15 * L));
  const dir = new THREE.DirectionalLight(def.hemi ? hemi[0] : 0xc4d4ff, 1.0 * L); dir.position.set(-6, 12, 8); scene.add(dir);
  if (def.stars !== false) scene.add(starfield(900));
  if (def.snow !== 0) scene.add(snowfall(def.snow ?? 1400, 26, 20));
  const camera = new THREE.PerspectiveCamera(def.fov ?? 50, aspect, 0.1, 600);
  const upd = def.build(g, { scene, camera });
  const ticks = []; scene.traverse((o) => { if (o.userData.tick) ticks.push(o.userData.tick); });
  const look = new THREE.Vector3(...def.look), base = new THREE.Vector3(...def.cam).sub(look), v = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  return {
    n, def, scene, camera,
    update(t, dt, mx = 0, my = 0) {
      for (const f of ticks) f(t, dt); if (upd) upd(t, dt);
      const portrait = clamp(1.25 / camera.aspect, 1, 2.2), zoom = (1 + 0.45 * (1 - easeOut(clamp(t / 5)))) * portrait;
      v.copy(base).multiplyScalar(zoom).applyAxisAngle(Y, Math.sin(t * 0.13) * (def.orbit ?? 0.14) - mx * 0.22);
      camera.position.copy(look).add(v); camera.position.y += my * 0.6 + Math.sin(t * 0.21) * 0.12; camera.lookAt(look);
    },
    dispose() { disposeTree(scene); },
  };
}
