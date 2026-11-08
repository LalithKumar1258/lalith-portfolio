// Live 3D hero: a titanium core with eight system nodes on a ring and a
// travelling signal — the same visual language as the film. Mouse = parallax.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const host = document.getElementById("hero3d");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

try {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 4.2, 12);

  const titanium = new THREE.MeshPhysicalMaterial({ color: 0x9aa3ad, metalness: 0.95, roughness: 0.28, clearcoat: 0.4 });
  const graphite = new THREE.MeshPhysicalMaterial({ color: 0x141b2b, metalness: 0.6, roughness: 0.4, clearcoat: 0.6 });
  const glow = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2.2, toneMapped: false });

  const rig = new THREE.Group();
  scene.add(rig);

  // core
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 2.6, 8), titanium);
  rig.add(core);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.12, 8), glow(0x2864ff));
  band.position.y = 0.5;
  rig.add(band);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.16, 8), graphite);
  cap.position.y = 1.38;
  rig.add(cap);

  // ring + nodes
  const R = 4.2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.03, 12, 200), glow(0x00d9ff));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.6;
  rig.add(ring);
  const colors = [0x2864ff, 0xff6238, 0x00d9ff, 0xd9ff43, 0x00d9ff, 0x2864ff, 0xff6238, 0xd9ff43];
  const nodes = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const g = new THREE.Group();
    g.position.set(Math.sin(a) * R, -0.6, Math.cos(a) * R);
    const ped = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.5, 0.9, 4, 0.1), graphite);
    g.add(ped);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.72), glow(colors[i]));
    top.position.y = 0.27;
    g.add(top);
    rig.add(g);
    nodes.push(top);
  }
  // travelling signal
  const sig = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 12), glow(0xffffff));
  rig.add(sig);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 12), new THREE.MeshBasicMaterial({ color: 0x00d9ff, transparent: true, opacity: 0.25 }));
  sig.add(halo);

  // floor dots
  const dots = new THREE.Points(
    (() => {
      const g = new THREE.BufferGeometry();
      const p = [];
      for (let x = -14; x <= 14; x += 0.7) for (let z = -14; z <= 14; z += 0.7) p.push(x, -0.86, z);
      g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
      return g;
    })(),
    new THREE.PointsMaterial({ color: 0x3a4a78, size: 0.045 })
  );
  scene.add(dots);

  scene.add(new THREE.AmbientLight(0xffffff, 0.15));
  const key = new THREE.DirectionalLight(0xfff2e0, 2.4);
  key.position.set(6, 10, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x2864ff, 1.6);
  rim.position.set(-8, 4, -8);
  scene.add(rim);

  let mx = 0, my = 0;
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  const tick = () => {
    const t = clock.getElapsedTime();
    rig.rotation.y = reduce ? 0.4 : t * 0.12 + mx * 0.5;
    camera.position.y = 4.2 - my * 1.5;
    camera.lookAt(0, 0, 0);
    const a = (t * 0.6) % (Math.PI * 2);
    sig.position.set(Math.sin(a) * R, -0.6, Math.cos(a) * R);
    nodes.forEach((n, i) => {
      const na = (i / 8) * Math.PI * 2;
      const d = Math.abs(((a - na + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      n.material.emissiveIntensity = 0.8 + Math.max(0, 1 - d * 2) * 3;
    });
    band.material.emissiveIntensity = 1.6 + Math.sin(t * 2) * 0.6;
    renderer.render(scene, camera);
    if (!reduce) requestAnimationFrame(tick);
  };
  tick();
  host.classList.add("live");
} catch (e) {
  host.classList.add("fallback");
}
