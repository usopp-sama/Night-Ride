import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import type { EngineId } from './engine-audio';

// Each car pairs a model with the engine-sim definition of the engine it really carries.
export type CarId = 'ferrari-458' | 'camaro-ss';
// yaw turns the model so its nose faces +Z (the direction of travel).
export type CarSpec = { id: CarId; label: string; engine: EngineId; engineLabel: string; file: string; length: number; yaw: number; credit: string };
export const CARS: Record<CarId, CarSpec> = {
  'ferrari-458': {
    id: 'ferrari-458', label: 'Ferrari 458 Italia', engine: 'ferrari-f136', engineLabel: 'Ferrari F136 4.5 L flat-plane V8',
    file: 'ferrari-458.glb', length: 4.53, yaw: Math.PI, credit: 'Ferrari 458 Italia model by vicent091036 (via three.js examples)',
  },
  'camaro-ss': {
    id: 'camaro-ss', label: 'Chevrolet Camaro SS', engine: 'gm-ls', engineLabel: 'GM LS 5.7 L cross-plane V8',
    file: 'camaro-ss.glb', length: 4.7, yaw: 0, credit: 'Camaro SS LP by Mihail Burduja, CC-BY 3.0',
  },
};
export type Car = { spec: CarSpec; root: T.Group; wheels: T.Object3D[]; lamps: { head: T.Material[]; tail: T.Material[] } };

const asset = (path: string) => new URL(`${import.meta.env.BASE_URL}${path}`, document.baseURI).href;
let loader: GLTFLoader | undefined;
function gltfLoader() {
  if (!loader) {
    const draco = new DRACOLoader().setDecoderPath(asset('draco/')).setDecoderConfig({ type: 'wasm' });
    loader = new GLTFLoader().setDRACOLoader(draco);
  }
  return loader;
}

export async function loadCar(id: CarId): Promise<Car> {
  const spec = CARS[id];
  const gltf = await gltfLoader().loadAsync(asset(`models/${spec.file}`));
  const model = normalize(gltf.scene, spec.length, true);
  model.rotation.y = spec.yaw;
  const root = new T.Group(); root.add(model);
  const wheels: T.Object3D[] = [], head: T.Material[] = [], tail: T.Material[] = [];
  root.traverse(object => {
    if (/^wheel_(fl|fr|rl|rr)$/.test(object.name)) wheels.push(object);
    if (!(object instanceof T.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!(material instanceof T.MeshStandardMaterial)) continue;
      if (material.name === 'Body_Color') { material.color.set('#7a0c10'); material.metalness = 0.6; material.roughness = 0.28; if (material instanceof T.MeshPhysicalMaterial) { material.clearcoat = 1; material.clearcoatRoughness = 0.04; } }
      if (/Projector|Headl/i.test(material.name)) { material.emissive = new T.Color('#fff4dc'); material.emissiveIntensity = 2.2; head.push(material); }
      if (/Taillight|Tail|Brake/i.test(material.name)) { material.emissive = new T.Color('#ff1a12'); material.emissiveIntensity = 1.6; tail.push(material); }
    }
  });
  if (id === 'ferrari-458') {
    // Baked contact shadow shipped with the model.
    const ao = await new T.TextureLoader().loadAsync(asset('models/ferrari-458-ao.png'));
    const shadow = new T.Mesh(new T.PlaneGeometry(0.655 * 4, 1.3 * 4), new T.MeshBasicMaterial({ map: ao, blending: T.MultiplyBlending, toneMapped: false, transparent: true, premultipliedAlpha: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02; shadow.renderOrder = 2;
    shadow.scale.setScalar(spec.length / 4.53);
    root.add(shadow);
  }
  return { spec, root, wheels, lamps: { head, tail } };
}

// Kept for the authored-road drive: the hero car plus the Kenney nature kit.
export type ModelKit = { car: T.Group; nature: T.Group[] };
export async function loadModels(): Promise<ModelKit> {
  const names = ['tree_oak', 'tree_pineRoundA', 'grass', 'rock_largeA'];
  const [car, ...models] = await Promise.all([loadCar('ferrari-458'), ...names.map(name => gltfLoader().loadAsync(asset(`models/${name}.glb`)))]);
  const targets = [10, 12, 0.65, 1.7];
  return { car: car.root, nature: models.map((m, i) => normalize(m.scene, targets[i]!, false)) };
}
function normalize(source: T.Group, size: number, car: boolean) {
  const root = new T.Group(); root.add(source); source.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(source), dimensions = box.getSize(new T.Vector3());
  const scale = size / (car ? Math.max(dimensions.x, dimensions.z) : dimensions.y);
  source.scale.multiplyScalar(scale);
  if (car && dimensions.x > dimensions.z) source.rotation.y = Math.PI / 2;
  source.updateMatrixWorld(true); box.setFromObject(source); const center = box.getCenter(new T.Vector3());
  source.position.add(new T.Vector3(-center.x, -box.min.y, -center.z));
  source.traverse(object => { if (object instanceof T.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
  root.updateMatrixWorld(true); return root;
}
export type Placement = [number, number, number, number, number, number];
export function instanceNature(scene: T.Scene, kit: ModelKit, placements: Placement[]) {
  const dummy = new T.Object3D(), matrix = new T.Matrix4();
  kit.nature.forEach((model, kind) => {
    const items = placements.filter(p => p[0] === kind); model.updateMatrixWorld(true);
    model.traverse(object => {
      if (!(object instanceof T.Mesh) || items.length === 0) return;
      const mesh = new T.InstancedMesh(object.geometry, object.material, items.length);
      items.forEach((p, i) => {
        dummy.position.set(p[1], p[2], p[3]); dummy.rotation.set(0, p[5], 0); dummy.scale.setScalar(p[4]); dummy.updateMatrix();
        matrix.multiplyMatrices(dummy.matrix, object.matrixWorld); mesh.setMatrixAt(i, matrix);
      });
      mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
    });
  });
}
