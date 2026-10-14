import * as T from 'three';
import { Tree } from '@dgreenheck/ez-tree';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import type { Placement } from './models';

// Procedural trees from ez-tree (MIT, Dan Greenheck): each world grows its own
// variants from the world seed, so a seed reproduces the same forest. C++ owns
// where things stand; this only decides how they look.
// leaves: fraction of the preset's leaf cards kept (single- instead of double-sided cards).
const SPECIES: Record<number, { presets: string[]; height: number; leaves: number }> = {
  0: { presets: ['Oak Medium', 'Ash Medium', 'Oak Large'], height: 15, leaves: 0.85 },
  1: { presets: ['Pine Medium', 'Pine Large', 'Pine Small'], height: 19, leaves: 0.5 },
  2: { presets: ['Bush 1', 'Bush 2', 'Bush 3'], height: 2.6, leaves: 0.6 },
};
const VARIANTS_PER_SPECIES = 3;
const CHUNK = 200;            // metres; lets frustum culling and LOD work per area
const NEAR = 300, CULL = 1900; // detailed trees inside NEAR; beyond CULL the fog hides everything

type Part = { geometry: T.BufferGeometry; material: T.Material; matrix: T.Matrix4 };
export type Forest = { group: T.Group; update(time: number, camera: T.Camera): void; dispose(): void; triangles: number };

function seedNumber(text: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < text.length; ++i) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 65536;
}

// Game LOD of the editor presets (13-16k -> ~4.5k triangles): fewer bark rings
// and sides, fewer but larger leaf cards.
function growVariant(preset: string, seed: number, height: number, leafShare: number) {
  const tree = new Tree();
  tree.loadPreset(preset);
  tree.options.seed = seed;
  const { branch, leaves } = tree.options;
  for (const level of [0, 1, 2, 3] as const) {
    branch.sections[level] = Math.max(level === 0 ? 3 : 1, Math.ceil(branch.sections[level] / (level === 0 ? 2 : 3)));
    branch.segments[level] = Math.min(branch.segments[level], level === 0 ? 5 : 3);
  }
  leaves.billboard = 'single';
  leaves.count = Math.max(2, Math.round(leaves.count * leafShare));
  leaves.size *= 1.3;
  tree.generate();
  tree.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(tree), size = box.getSize(new T.Vector3());
  const scale = height / Math.max(size.y, 0.001);
  const normalize = new T.Matrix4().makeScale(scale, scale, scale).multiply(new T.Matrix4().makeTranslation(0, -box.min.y, 0));
  // Alpha-tested leaf cards vanish at a distance as mipmaps average their alpha
  // below the cutoff; alpha-to-coverage (with MSAA) keeps canopies full.
  const leafMaterial = tree.leavesMesh.material as T.Material;
  leafMaterial.alphaToCoverage = true; leafMaterial.alphaTest = 0.08;
  // ez-tree's wind shader replaces three's project_vertex chunk and drops the
  // instanceMatrix transform, which would stack every instance's leaves at the
  // origin. Re-apply it after the sway.
  const windShader = leafMaterial.onBeforeCompile.bind(leafMaterial);
  leafMaterial.onBeforeCompile = (shader, renderer) => {
    windShader(shader, renderer);
    // Sample wind noise in world space so instances don't sway in lockstep.
    shader.vertexShader = shader.vertexShader.replace('simplex3(mvPosition.xyz / uWindScale)',
      '\n#ifdef USE_INSTANCING\nsimplex3((instanceMatrix * vec4(transformed, 1.0)).xyz / uWindScale)\n#else\nsimplex3(mvPosition.xyz / uWindScale)\n#endif\n');
    shader.vertexShader = shader.vertexShader.replace('mvPosition.xyz += windSway;',
      'mvPosition.xyz += windSway;\n#ifdef USE_INSTANCING\nmvPosition = instanceMatrix * mvPosition;\n#endif');
  };
  const parts: Part[] = [];
  for (const mesh of [tree.branchesMesh, tree.leavesMesh]) {
    if (!mesh.geometry.getAttribute('position')) continue;
    parts.push({ geometry: mesh.geometry, material: mesh.material as T.Material, matrix: normalize.clone().multiply(mesh.matrixWorld) });
  }
  return { tree, parts };
}

let rocks: Promise<{ geometries: T.BufferGeometry[]; material: T.Material }> | undefined;
function loadRocks() {
  rocks ??= (async () => {
    const draco = new DRACOLoader().setDecoderPath(new URL(`${import.meta.env.BASE_URL}draco/`, document.baseURI).href).setDecoderConfig({ type: 'wasm' });
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const scenes = await Promise.all([1, 2, 3].map(i => loader.loadAsync(new URL(`${import.meta.env.BASE_URL}models/ez-tree/rock${i}.glb`, document.baseURI).href)));
    let material: T.Material | undefined;
    const geometries = scenes.map(gltf => {
      let found: T.Mesh | undefined;
      gltf.scene.traverse(o => { if (!found && o instanceof T.Mesh) found = o; });
      material ??= found!.material as T.Material;
      const geometry = found!.geometry.clone(); geometry.computeBoundingBox();
      const box = geometry.boundingBox!, size = box.getSize(new T.Vector3());
      const s = 2.2 / Math.max(size.x, size.y, size.z);
      return geometry.translate(-(box.min.x + box.max.x) / 2, -box.min.y - size.y * 0.25, -(box.min.z + box.max.z) / 2).scale(s, s, s);
    });
    return { geometries, material: material! };
  })();
  return rocks;
}

// ez-tree's bark/leaf textures decode asynchronously; impostors must wait for them.
async function texturesReady(parts: Part[]) {
  const images: HTMLImageElement[] = [];
  for (const { material } of parts) for (const value of Object.values(material)) {
    if (value instanceof T.Texture && value.image instanceof HTMLImageElement) images.push(value.image);
  }
  await Promise.all(images.map(image => image.complete && image.naturalWidth ? undefined : image.decode().catch(() => undefined)));
}

// Far trees are impostors: each seeded variant is rendered once into a texture
// and drawn as two crossed cards (4 triangles instead of ~4,500).
function bakeImpostor(renderer: T.WebGLRenderer, parts: Part[]) {
  const stage = new T.Scene();
  for (const part of parts) {
    const mesh = new T.Mesh(part.geometry, part.material);
    mesh.matrixAutoUpdate = false; mesh.matrix.copy(part.matrix); stage.add(mesh);
  }
  stage.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(stage), size = box.getSize(new T.Vector3());
  const width = Math.max(size.x, size.z) * 1.04, height = size.y * 1.02;
  stage.add(new T.HemisphereLight('#9db3dc', '#2a3322', 2.6));
  const key = new T.DirectionalLight('#d4dcff', 2.2); key.position.set(0.4, 1, 1); stage.add(key);
  const camera = new T.OrthographicCamera(-width / 2, width / 2, height, 0, 0.1, width * 4);
  camera.position.set((box.min.x + box.max.x) / 2, 0, box.max.z + width); camera.lookAt((box.min.x + box.max.x) / 2, 0, (box.min.z + box.max.z) / 2);
  const target = new T.WebGLRenderTarget(256, Math.round(256 * Math.min(2, height / width)), { samples: 4 });
  target.texture.generateMipmaps = true; target.texture.minFilter = T.LinearMipmapLinearFilter;
  const previous = { target: renderer.getRenderTarget(), color: renderer.getClearColor(new T.Color()), alpha: renderer.getClearAlpha() };
  renderer.setRenderTarget(target); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(stage, camera);
  renderer.setRenderTarget(previous.target); renderer.setClearColor(previous.color, previous.alpha);
  const a = new T.PlaneGeometry(width, height).translate(0, height / 2, 0), b = a.clone().rotateY(Math.PI / 2);
  const geometry = mergeCards(a, b);
  const material = new T.MeshBasicMaterial({ map: target.texture, alphaTest: 0.08, alphaToCoverage: true, side: T.DoubleSide, color: '#c6cbd6' });
  return { geometry, material, target };
}
function mergeCards(a: T.BufferGeometry, b: T.BufferGeometry) {
  const geometry = new T.BufferGeometry(), count = a.getAttribute('position').count;
  for (const name of ['position', 'normal', 'uv']) {
    const x = a.getAttribute(name), y = b.getAttribute(name);
    const data = new Float32Array(x.array.length + y.array.length); data.set(x.array as Float32Array); data.set(y.array as Float32Array, x.array.length);
    geometry.setAttribute(name, new T.BufferAttribute(data, x.itemSize));
  }
  const ia = Array.from(a.index!.array), ib = Array.from(b.index!.array, i => i + count);
  geometry.setIndex([...ia, ...ib]);
  return geometry;
}

type Chunk = { center: T.Vector3; near: T.Group; far: T.Group };
const triangleCount = (g: T.BufferGeometry) => (g.index ? g.index.count : g.getAttribute('position').count) / 3;

export async function buildForest(seed: string, placements: Placement[], renderer: T.WebGLRenderer): Promise<Forest> {
  const group = new T.Group(), trees: Tree[] = [];
  const impostors: ReturnType<typeof bakeImpostor>[] = [];
  const chunks = new Map<string, Chunk>();
  const chunkOf = (p: Placement) => {
    const key = `${Math.floor(p[1] / CHUNK)},${Math.floor(p[3] / CHUNK)}`;
    let chunk = chunks.get(key);
    if (!chunk) {
      chunk = { center: new T.Vector3((Math.floor(p[1] / CHUNK) + 0.5) * CHUNK, p[2], (Math.floor(p[3] / CHUNK) + 0.5) * CHUNK), near: new T.Group(), far: new T.Group() };
      chunks.set(key, chunk); group.add(chunk.near, chunk.far);
    }
    return chunk;
  };
  let triangles = 0;
  const dummy = new T.Object3D(), matrix = new T.Matrix4();
  const instance = (target: T.Group, parts: Part[], items: Placement[], transform: (p: Placement) => void, shadows: boolean) => {
    for (const part of parts) {
      const mesh = new T.InstancedMesh(part.geometry, part.material, items.length);
      items.forEach((p, i) => { transform(p); dummy.updateMatrix(); mesh.setMatrixAt(i, matrix.multiplyMatrices(dummy.matrix, part.matrix)); });
      mesh.computeBoundingSphere(); mesh.castShadow = shadows; mesh.receiveShadow = true;
      target.add(mesh);
    }
  };
  const treeTransform = (p: Placement) => { dummy.position.set(p[1], p[2] - 0.15, p[3]); dummy.rotation.set(0, p[5], 0); dummy.scale.setScalar(p[4]); };

  for (const [kindText, species] of Object.entries(SPECIES)) {
    const kind = Number(kindText);
    const items = placements.filter(p => p[0] === kind);
    for (let v = 0; v < VARIANTS_PER_SPECIES; ++v) {
      // Variants come from the world seed, so each seed grows its own forest.
      const preset = species.presets[seedNumber(seed, kind * 31 + v) % species.presets.length]!;
      const treeSeed = seedNumber(seed, kind * 97 + v * 13 + 7), height = species.height * (0.85 + 0.1 * v);
      const near = growVariant(preset, treeSeed, height, species.leaves);
      await texturesReady(near.parts);
      const far = bakeImpostor(renderer, near.parts);
      trees.push(near.tree); impostors.push(far);
      const mine = items.filter((_, i) => i % VARIANTS_PER_SPECIES === v);
      const byChunk = new Map<Chunk, Placement[]>();
      for (const p of mine) { const c = chunkOf(p); (byChunk.get(c) ?? byChunk.set(c, []).get(c)!).push(p); }
      for (const [chunk, list] of byChunk) {
        instance(chunk.near, near.parts, list, treeTransform, kind !== 2);
        instance(chunk.far, [{ geometry: far.geometry, material: far.material, matrix: new T.Matrix4() }], list, treeTransform, false);
      }
      triangles += near.parts.reduce((n, part) => n + triangleCount(part.geometry), 0) * mine.length;
    }
  }
  const rock = await loadRocks();
  const rockItems = placements.filter(p => p[0] === 3);
  rock.geometries.forEach((geometry, v) => {
    const byChunk = new Map<Chunk, Placement[]>();
    for (const p of rockItems.filter((_, i) => i % rock.geometries.length === v)) { const c = chunkOf(p); (byChunk.get(c) ?? byChunk.set(c, []).get(c)!).push(p); }
    for (const [chunk, list] of byChunk) instance(chunk.near, [{ geometry, material: rock.material, matrix: new T.Matrix4() }], list,
      p => { dummy.position.set(p[1], p[2], p[3]); dummy.rotation.set(p[5] * 0.3, p[5], 0); dummy.scale.setScalar(p[4] * 1.4); }, false);
  });
  const toCamera = new T.Vector3();
  return {
    group, triangles,
    update(time, camera) {
      for (const tree of trees) tree.update(time);
      for (const chunk of chunks.values()) {
        const d = toCamera.copy(chunk.center).sub(camera.position).length();
        // From high up the fog thins (see world-view), so draw further.
        const cull = Math.max(CULL, camera.position.y * 4);
        chunk.near.visible = d < NEAR + CHUNK * 0.7;
        chunk.far.visible = !chunk.near.visible && d < cull;
      }
    },
    dispose() {
      for (const tree of trees) for (const mesh of [tree.branchesMesh, tree.leavesMesh]) { mesh.geometry.dispose(); (mesh.material as T.Material).dispose(); }
      for (const impostor of impostors) { impostor.geometry.dispose(); impostor.material.dispose(); impostor.target.dispose(); }
      group.traverse(o => { if (o instanceof T.InstancedMesh) o.dispose(); });
    },
  };
}
