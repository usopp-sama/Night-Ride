import './world-view.css';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { loadModule } from './core';
import type { CoreModule, Envelope } from './core';
import { CARS, loadCar } from './models';
import type { Car, CarId, Placement } from './models';
import { buildForest } from './forest';
import type { Forest } from './forest';
import { EngineAudio } from './engine-audio';

type Point = [number, number, number];
type Road = { id: string; main: boolean; surface: string; halfWidth: number; points: Point[] };
type Landscape = { sceneVersion: string; world: Envelope; roads: Road[]; lakes: [number,number,number,number,number][]; props: Placement[]; terrain: {minX:number;maxX:number;minZ:number;maxZ:number;columns:number;rows:number;heights:number[];cover:string} };
const el = <E extends HTMLElement>(id: string) => document.getElementById(id) as E;
const asset = (path: string) => new URL(`${import.meta.env.BASE_URL}${path}`, document.baseURI).href;

const renderer = new T.WebGLRenderer({ canvas: el<HTMLCanvasElement>('world-canvas'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const camera = new T.PerspectiveCamera(55, 1, 0.2, 9000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 4; controls.maxDistance = 6000;

let carId: CarId = (new URLSearchParams(location.search).get('car') as CarId) in CARS ? new URLSearchParams(location.search).get('car') as CarId : 'ferrari-458';
const audio = new EngineAudio(CARS[carId].engine);
let sound = false, touring = false, travel = 0, last = 0, wheelSpin = 0;
let scene: T.Scene, landscape: Landscape, core: CoreModule, car: Car, route: T.CatmullRomCurve3, routeLength = 1, forest: Forest | undefined;
const waters: Water[] = [];
const position = new T.Vector3(), ahead = new T.Vector3(), direction = new T.Vector3(), cameraTarget = new T.Vector3();
const MOON = new T.Vector3(-0.45, 0.42, 0.78).normalize();
const SKY_FOG = new T.Color('#0d1726');

function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---------- shared materials & textures (CC0 Poly Haven sets, 1k) ----------
const textureLoader = new T.TextureLoader();
function texture(name: string, color: boolean) {
  const t = textureLoader.load(asset(`textures/${name}`));
  t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (color) t.colorSpace = T.SRGBColorSpace;
  return t;
}
const tex = {
  meadow: texture('sparse_grass_diff_1k.jpg', true), meadowN: texture('sparse_grass_nor_1k.jpg', false),
  forest: texture('forest_leaves_04_diff_1k.jpg', true),
  rock: texture('aerial_grass_rock_diff_1k.jpg', true),
  sand: texture('coast_sand_01_diff_1k.jpg', true),
  asphalt: texture('asphalt_02_diff_1k.jpg', true), asphaltN: texture('asphalt_02_nor_1k.jpg', false),
  gravel: texture('gravel_road_diff_1k.jpg', true), gravelN: texture('gravel_road_nor_1k.jpg', false),
  water: texture('waternormals.jpg', false),
};

// Terrain splat: vertex color weights pick meadow (r), forest floor (g), shore sand (b);
// rocky grass shows through on slopes. World-space UVs keep tiling consistent.
const terrainMaterial = new T.MeshStandardMaterial({ map: tex.meadow, normalMap: tex.meadowN, normalScale: new T.Vector2(0.8, 0.8), roughness: 0.95, vertexColors: true });
terrainMaterial.onBeforeCompile = shader => {
  shader.uniforms.forestMap = { value: tex.forest }; shader.uniforms.sandMap = { value: tex.sand }; shader.uniforms.rockMap = { value: tex.rock };
  shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWorldN;\nvarying vec2 vFar;')
    .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldN = normal;\nvFar = position.xz / 95.0;');
  shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D forestMap, sandMap, rockMap;\nvarying vec3 vWorldN;\nvarying vec2 vFar;')
    .replace('#include <map_fragment>', `
      vec3 meadow = texture2D(map, vMapUv).rgb;
      // A second, larger tiling breaks visible repetition.
      meadow = mix(meadow, texture2D(map, vFar).rgb, 0.35);
      vec3 floorC = texture2D(forestMap, vMapUv * 0.8).rgb;
      vec3 sandC = texture2D(sandMap, vMapUv * 0.7).rgb;
      vec3 rockC = texture2D(rockMap, vFar * 2.0).rgb;
      vec3 w = vColor.rgb / max(vColor.r + vColor.g + vColor.b, 0.001);
      vec3 ground = meadow * w.r + floorC * w.g + sandC * w.b;
      float slope = 1.0 - clamp(vWorldN.y, 0.0, 1.0);
      ground = mix(ground, rockC, smoothstep(0.18, 0.42, slope));
      diffuseColor.rgb *= ground;`)
    .replace('#include <color_fragment>', '');
};
const asphaltMaterial = new T.MeshStandardMaterial({ map: tex.asphalt, normalMap: tex.asphaltN, roughness: 0.82, color: '#9a9a9a', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
const gravelMaterial = new T.MeshStandardMaterial({ map: tex.gravel, normalMap: tex.gravelN, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
const shoulderMaterial = new T.MeshStandardMaterial({ map: tex.gravel, normalMap: tex.gravelN, roughness: 1, color: '#8a8070', polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
const paintMaterial = new T.MeshStandardMaterial({ color: '#e8e0c4', roughness: 0.6, emissive: '#6d6858', emissiveIntensity: 0.35, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
const sharedMaterials = new Set<T.Material>([terrainMaterial, asphaltMaterial, gravelMaterial, shoulderMaterial, paintMaterial]);

// ---------- sky ----------
function makeSky() {
  const material = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: { moon: { value: MOON } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
    fragmentShader: `
      uniform vec3 moon; varying vec3 vDir;
      float hash(vec3 p){ p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      void main(){
        vec3 d = normalize(vDir); float h = clamp(d.y, -0.2, 1.0);
        vec3 col = mix(vec3(0.050, 0.085, 0.140), vec3(0.008, 0.014, 0.035), smoothstep(0.0, 0.6, h));
        col = mix(col, vec3(0.10, 0.12, 0.17), smoothstep(0.12, -0.05, h)); // horizon glow
        // Stars: sparse hashed cells, fading toward the horizon.
        vec3 cell = floor(d * 420.0); float s = hash(cell);
        float star = smoothstep(0.9965, 1.0, s) * smoothstep(0.02, 0.25, h);
        col += vec3(0.85, 0.9, 1.0) * star * (0.6 + 0.4 * hash(cell + 3.1));
        // Moon disc and halo.
        float m = dot(d, moon);
        col += vec3(0.95, 0.96, 0.88) * smoothstep(0.99955, 0.99975, m);
        col += vec3(0.25, 0.32, 0.45) * pow(max(m, 0.0), 180.0) * 0.9 + vec3(0.06, 0.08, 0.13) * pow(max(m, 0.0), 12.0);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new T.Mesh(new T.SphereGeometry(1, 48, 24), material);
  sky.scale.setScalar(8000); sky.renderOrder = -1; sky.frustumCulled = false; sky.userData.shared = true;
  return sky;
}
const sky = makeSky();

// ---------- geometry builders ----------
function roadStrip(road: Road, left: number, right: number, material: T.Material, lift: number, textureWidth: number, dashed = false) {
  const vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
  let distance = 0;
  for (let i = 0; i < road.points.length; ++i) {
    const p = road.points[i]!, a = road.points[Math.max(0, i - 1)]!, b = road.points[Math.min(road.points.length - 1, i + 1)]!;
    if (i > 0) distance += Math.hypot(p[0] - a[0], p[2] - a[2]);
    const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1;
    for (const w of [left, right]) { vertices.push(p[0] + dz / len * w, p[1] + lift, p[2] - dx / len * w); uvs.push((w - left) / textureWidth, distance / textureWidth); }
    if (i < road.points.length - 1 && !(dashed && Math.floor(distance / 6) % 2 === 1)) { const s = i * 2; indices.push(s, s + 2, s + 1, s + 1, s + 2, s + 3); }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new T.Mesh(geometry, material); mesh.receiveShadow = true; scene.add(mesh);
}

function buildTerrain(data: Landscape) {
  const t = data.terrain, vertices: number[] = [], uvs: number[] = [], colors: number[] = [], indices: number[] = [];
  for (let r = 0; r <= t.rows; ++r) for (let c = 0; c <= t.columns; ++c) {
    const i = r * (t.columns + 1) + c;
    const x = t.minX + (t.maxX - t.minX) * c / t.columns, z = t.minZ + (t.maxZ - t.minZ) * r / t.rows, h = t.heights[i]!;
    vertices.push(x, h, z); uvs.push(x / 9, z / 9);
    let shore = 0;
    for (const lake of data.lakes) { const d = Math.hypot((x - lake[0]) / lake[3], (z - lake[2]) / lake[4]); if (d < 1.35) shore = Math.max(shore, 1 - Math.max(0, (h - lake[1]) / 1.6)); }
    shore = T.MathUtils.clamp(shore, 0, 1);
    // Forest floor under woodland (C++ cover field), meadow elsewhere, sand at the shore.
    const forest = (t.cover.charCodeAt(i) - 48) / 9;
    colors.push((1 - forest) * (1 - shore), forest * (1 - shore), shore);
    if (r < t.rows && c < t.columns) { const a = i, b = a + t.columns + 1; indices.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new T.Mesh(geometry, terrainMaterial); mesh.receiveShadow = true; scene.add(mesh);
}

function buildLakes(data: Landscape) {
  for (const lake of data.lakes) {
    const water = new Water(new T.CircleGeometry(1, 96), {
      textureWidth: 512, textureHeight: 512, waterNormals: tex.water, sunDirection: MOON.clone(), sunColor: 0xc8d4ff,
      waterColor: 0x04121c, distortionScale: 1.4, fog: true,
    });
    water.rotation.x = -Math.PI / 2; water.scale.set(lake[3] * 1.35, lake[4] * 1.35, 1);
    water.position.set(lake[0], lake[1], lake[2]);
    (water.material as T.ShaderMaterial).uniforms.size!.value = 6;
    scene.add(water); waters.push(water);
  }
}

// ---------- car ----------
const headlights: T.SpotLight[] = [];
function mountCar(next: Car) {
  if (car) scene.remove(car.root);
  car = next;
  headlights.length = 0;
  for (const side of [-0.62, 0.62]) {
    const light = new T.SpotLight('#fff1d6', 650, 150, 0.5, 0.95, 1.5);
    light.position.set(side, 0.72, 2.05); light.target.position.set(side * 2.4, -0.4, 40);
    light.castShadow = side < 0; light.shadow.mapSize.set(1024, 1024); light.shadow.bias = -0.0004; light.shadow.camera.near = 0.5;
    car.root.add(light, light.target); headlights.push(light);
  }
  const glow = new T.PointLight('#ff2a1a', 6, 9, 2); glow.position.set(0, 0.8, -2.5); car.root.add(glow);
  car.root.traverse(o => { o.userData.shared = true; });
  scene.add(car.root);
}

// ---------- world assembly ----------
function disposeScene() {
  if (!scene) return;
  forest?.dispose(); forest = undefined;
  scene.traverse(o => {
    if (o.userData.shared || o === sky) return;
    if (o instanceof T.Mesh) { o.geometry.dispose(); const m = o.material as T.Material; if (!sharedMaterials.has(m) && !(o instanceof T.InstancedMesh)) m.dispose(); }
  });
  for (const w of waters) (w.material as T.ShaderMaterial).uniforms.mirrorSampler?.value?.dispose?.();
  waters.length = 0;
}
let buildToken = 0;
async function showWorld(data: Landscape) {
  const token = ++buildToken;
  el('world-status').textContent = 'Growing the forest for this seed…';
  const nextForest = await buildForest(data.world.manifest.seed, data.props, renderer);
  if (token !== buildToken) { nextForest.dispose(); return; }
  disposeScene(); landscape = data; forest = nextForest;
  scene = new T.Scene(); scene.background = SKY_FOG; scene.fog = new T.FogExp2(SKY_FOG, 0.0011);
  scene.add(sky);
  scene.add(new T.HemisphereLight('#5a76a8', '#1a2016', 1.9));
  const moon = new T.DirectionalLight('#c3d2ff', 1.7); moon.position.copy(MOON).multiplyScalar(500); scene.add(moon);
  buildTerrain(data);
  for (const road of data.roads) {
    const gravel = road.surface === 'gravel';
    roadStrip(road, -road.halfWidth - 1.6, road.halfWidth + 1.6, shoulderMaterial, 0.03, 4);
    roadStrip(road, -road.halfWidth, road.halfWidth, gravel ? gravelMaterial : asphaltMaterial, 0.05, road.halfWidth * 2);
    if (road.main && !gravel) {
      roadStrip(road, -0.07, 0.07, paintMaterial, 0.06, 1, true);
      roadStrip(road, -road.halfWidth + 0.25, -road.halfWidth + 0.38, paintMaterial, 0.06, 1);
      roadStrip(road, road.halfWidth - 0.38, road.halfWidth - 0.25, paintMaterial, 0.06, 1);
    }
  }
  buildLakes(data);
  scene.add(forest.group);
  mountCar(car);
  const points: Point[] = [];
  for (const road of data.roads.filter(r => r.main)) points.push(...road.points.slice(points.length ? 1 : 0));
  route = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)), false, 'centripetal'); route.arcLengthDivisions = 3000; routeLength = route.getLength(); travel = 0; touring = false;
  placeCar(0); closeView(); drawMap();
  const manifest = data.world.manifest;
  el('world-description').textContent = `${manifest.palette.replaceAll('-', ' ')} · ${(routeLength / 1000).toFixed(1)} km of main road · ${data.lakes.length} lakes · ${manifest.weather.replaceAll('-', ' ')}`;
  el('world-hash').textContent = data.world.manifestHash;
  el('world-status').textContent = `“${manifest.seed}” · ${data.props.length.toLocaleString()} placed trees, shrubs & rocks · ${data.roads.length} roads. Trees grown from this seed.`;
  el('tour').textContent = 'Tour the road'; el('tour').classList.remove('active');
  document.documentElement.dataset.worldReady = 'true'; document.documentElement.dataset.sceneHash = data.world.manifestHash;
}
function placeCar(progress: number) {
  route.getPointAt(progress, position); route.getPointAt(Math.min(0.99999, progress + 0.001), ahead);
  direction.copy(ahead).sub(position).normalize();
  car.root.position.copy(position); car.root.position.y += 0.06; car.root.lookAt(ahead.x, ahead.y + 0.06, ahead.z);
}
function closeView() {
  touring = false; controls.enabled = true; placeCar(0); travel = 0;
  const side = new T.Vector3(direction.z, 0, -direction.x);
  camera.position.copy(position).addScaledVector(direction, 6.2).addScaledVector(side, 2.6).add(new T.Vector3(0, 1.45, 0));
  controls.target.copy(position).add(new T.Vector3(0, 0.7, 0)); controls.update();
  el('tour').classList.remove('active'); el('tour').textContent = 'Tour the road';
}
function drawMap() {
  const canvas = el<HTMLCanvasElement>('world-map'), ctx = canvas.getContext('2d')!, t = landscape.terrain; ctx.clearRect(0, 0, 210, 280);
  const mx = (x: number) => 15 + (x - t.minX) / (t.maxX - t.minX) * 180, mz = (z: number) => 265 - (z - t.minZ) / (t.maxZ - t.minZ) * 250;
  for (const lake of landscape.lakes) { ctx.beginPath(); ctx.ellipse(mx(lake[0]), mz(lake[2]), lake[3] / (t.maxX - t.minX) * 180, lake[4] / (t.maxZ - t.minZ) * 250, 0, 0, Math.PI * 2); ctx.fillStyle = '#2b5266'; ctx.fill(); }
  for (const road of landscape.roads) { ctx.beginPath(); road.points.forEach((p, i) => { if (i === 0) ctx.moveTo(mx(p[0]), mz(p[2])); else ctx.lineTo(mx(p[0]), mz(p[2])); }); ctx.strokeStyle = road.main ? '#e6e6b5' : '#8bb3a1'; ctx.lineWidth = road.main ? 2 : 1; ctx.stroke(); }
}
function generate(seed: string) {
  const bytes = new TextEncoder().encode(seed); if (bytes.length > 256) throw new Error('Seed is too long');
  const ptr = core._malloc(Math.max(1, bytes.length));
  try {
    core.HEAPU8.set(bytes, ptr);
    if (core._nr_scene_generate(ptr, bytes.length)) throw new Error('Use a nonempty seed of at most 128 UTF-8 bytes.');
    const start = core._nr_scene_ptr(), size = core._nr_scene_size();
    return JSON.parse(new TextDecoder().decode(core.HEAPU8.subarray(start, start + size))) as Landscape;
  } finally { core._free(ptr); }
}

// ---------- UI ----------
const carSelect = el<HTMLSelectElement>('world-car');
for (const spec of Object.values(CARS)) carSelect.add(new Option(`${spec.label} · ${spec.engineLabel}`, spec.id));
carSelect.value = carId;
carSelect.addEventListener('change', async () => {
  carId = carSelect.value as CarId;
  const [next] = await Promise.all([loadCar(carId), audio.setEngine(CARS[carId].engine)]);
  mountCar(next); placeCar(touring ? travel / routeLength : 0);
  el('car-credit').textContent = CARS[carId].credit;
});
el('car-credit').textContent = CARS[carId].credit;
el('world-form').addEventListener('submit', event => { event.preventDefault(); try { void showWorld(generate(el<HTMLInputElement>('world-seed').value)); } catch (error) { el('world-status').textContent = String(error); } });
el('tour').addEventListener('click', () => { touring = !touring; controls.enabled = !touring; el('tour').textContent = touring ? 'Pause tour' : 'Continue tour'; el('tour').classList.toggle('active', touring); });
el('close-view').addEventListener('click', closeView);
el('overview').addEventListener('click', () => {
  touring = false; controls.enabled = true; const t = landscape.terrain;
  // Three-quarter view from above the start, looking up the valley.
  const cx = (t.minX + t.maxX) / 2, length = t.maxZ - t.minZ;
  controls.target.set(cx, 0, t.minZ + length * 0.42);
  camera.position.set(cx + 700, 950, t.minZ - 250); controls.update();
  el('tour').textContent = 'Tour the road'; el('tour').classList.remove('active');
});
el('world-audio').addEventListener('click', () => {
  sound = !sound; el('world-audio').textContent = sound ? 'Mute engine' : 'Engine sound'; el('world-audio').setAttribute('aria-pressed', String(sound));
  if (sound) void audio.start().catch(error => { el('world-status').textContent = `Audio unavailable: ${String(error)}`; }); else audio.silence();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { touring = false; audio.silence(); controls.enabled = true; el('tour').textContent = 'Continue tour'; el('tour').classList.remove('active'); } });

// Tour speed profile: brisk on straights, slower through bends; RPM follows a 6-speed box.
let speed = 0, gear = 1, previousGear = 1;
const gears = [3.23, 2.19, 1.61, 1.23, 0.97, 0.8];
function animate(time: number) {
  const dt = Math.min((time - last) / 1000, 0.05); last = time;
  if (scene && car) {
    let rpm = 850, load = 0;
    if (touring) {
      const f = travel / routeLength;
      route.getTangentAt(Math.min(0.999, f + 0.01), ahead); route.getTangentAt(f, direction);
      const bend = 1 - ahead.dot(direction);
      const target = T.MathUtils.clamp(31 - bend * 1600, 13, 31);
      load = target > speed + 0.5 ? 0.85 : target < speed - 1 ? 0 : 0.3;
      speed += T.MathUtils.clamp(target - speed, -6 * dt, 4.5 * dt);
      travel = Math.min(travel + speed * dt, routeLength * 0.999); placeCar(travel / routeLength);
      wheelSpin += speed * dt / 0.34;
      rpm = speed / 0.34 * gears[gear - 1]! * 3.4 * 60 / (2 * Math.PI);
      if (rpm > 6800 && gear < 6) gear++; else if (rpm < 2600 && gear > 1) gear--;
      if (gear !== previousGear) { previousGear = gear; load = 0; }
      rpm = Math.max(900, speed / 0.34 * gears[gear - 1]! * 3.4 * 60 / (2 * Math.PI));
      cameraTarget.copy(position).addScaledVector(direction, -8.5); cameraTarget.y += 2.4;
      camera.position.lerp(cameraTarget, 1 - Math.exp(-dt * 4));
      controls.target.copy(position).addScaledVector(direction, 10); controls.target.y += 0.8; camera.lookAt(controls.target);
      if (travel >= routeLength * 0.999) { touring = false; controls.enabled = true; el('tour').textContent = 'Tour complete'; }
    } else { speed = 0; gear = 1; controls.update(); }
    for (const wheel of car.wheels) wheel.rotation.x = wheelSpin;
    for (const m of car.lamps.tail) (m as T.MeshStandardMaterial).emissiveIntensity = touring && load === 0 ? 3.2 : 1.6;
    for (const w of waters) (w.material as T.ShaderMaterial).uniforms.time!.value = time / 2400;
    // Fog thins with altitude so the whole region stays readable from above.
    const altitude = Math.max(camera.position.y - 40, 1);
    (scene.fog as T.FogExp2).density = 0.0011 * Math.min(1, 160 / altitude);
    forest?.update(time / 1000, camera);
    audio.update(rpm, load, sound && !document.hidden);
    document.documentElement.dataset.engineRpm = String(Math.round(audio.simulatedRpm));
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
}
// Development-only handle for profiling from the console; stripped from production builds.
if (import.meta.env.DEV) Object.assign(window, { nightRide: { renderer, camera, get scene() { return scene; }, get forest() { return forest; } } });
async function boot() {
  [core, car] = await Promise.all([loadModule(), loadCar(carId)]);
  const seed = new URLSearchParams(location.search).get('seed') || 'moonlit-run';
  el<HTMLInputElement>('world-seed').value = seed;
  await showWorld(generate(seed));
  for (const button of document.querySelectorAll<HTMLButtonElement>('button')) button.disabled = false;
  requestAnimationFrame(animate);
}
boot().catch(error => { el('world-status').textContent = `Could not load the 3D world: ${String(error)}`; });
