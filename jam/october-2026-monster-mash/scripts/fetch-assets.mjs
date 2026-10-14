// Downloads assets we don't redistribute in git (license not re-verified):
// the Ferrari 458 model and its contact shadow from the three.js r180 examples.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/models/gltf/';
const assets = { 'public/models/ferrari-458.glb': 'ferrari.glb', 'public/models/ferrari-458-ao.png': 'ferrari_ao.png' };
for (const [target, name] of Object.entries(assets)) {
  const path = resolve(root, target);
  if (existsSync(path)) continue;
  const response = await fetch(base + name);
  if (!response.ok) throw new Error(`Could not download ${name}: HTTP ${response.status}`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.from(await response.arrayBuffer()));
  console.log(`Fetched ${target}`);
}
