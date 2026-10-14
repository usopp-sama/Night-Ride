export interface WorldNode { id: string; role: string; label: string; xM: number; zM: number }
export interface WorldEdge { id: string; from: string; to: string; surface: string; lengthM: number; mainRoute: boolean }
export interface Manifest {
  schemaVersion: number; generatorVersion: string; seed: string; seedHash: number; attempt: number;
  palette: string; weather: string; mainRouteLengthM: number; nodes: WorldNode[]; edges: WorldEdge[];
}
export interface Envelope { apiVersion: number; manifestHash: string; manifest: Manifest }
export interface CoreModule {
  HEAPU8: Uint8Array;
  _malloc(size: number): number; _free(ptr: number): void;
  _nr_api_version(): number; _nr_generate(ptr: number, size: number): number;
  _nr_result_ptr(): number; _nr_result_size(): number;
  _nr_error_ptr(): number; _nr_error_size(): number;
  _nr_drive_version(): number; _nr_drive_input(): number; _nr_drive_snapshot(): number;
  _nr_drive_step(): number; _nr_drive_reset(): void; _nr_drive_recover(): void;
  _nr_track_count(): number; _nr_track_data(): number;
  _nr_scene_generate(ptr: number, size: number): number; _nr_scene_ptr(): number; _nr_scene_size(): number;
}

export async function loadModule(): Promise<CoreModule> {
  // Generated ES module remains intact in public/wasm; its .wasm is resolved beside it.
  const url = new URL(`${import.meta.env.BASE_URL}wasm/night_core.js`, document.baseURI).href;
  const { default: createCore } = await import(/* @vite-ignore */ url) as {
    default: () => Promise<CoreModule>;
  };
  const module = await createCore();
  if (module._nr_api_version() !== 1) throw new Error('Unsupported C++ bridge version. Reload the current build.');
  return module;
}
export async function loadCore(): Promise<(seed: string) => Envelope> {
  const module = await loadModule();
  const encoder = new TextEncoder(), decoder = new TextDecoder('utf-8', { fatal: true });
  return seed => {
    const bytes = encoder.encode(seed);
    if (bytes.length > 256) throw new Error('Seed input exceeds 256 UTF-8 bytes.');
    const ptr = module._malloc(Math.max(1, bytes.length));
    if (!ptr) throw new Error('Unable to allocate seed input.');
    try {
      module.HEAPU8.set(bytes, ptr);
      const status = module._nr_generate(ptr, bytes.length);
      // Reacquire HEAPU8 after native calls: malloc/generation may grow linear memory.
      if (status !== 0) {
        const start = module._nr_error_ptr(), size = module._nr_error_size();
        throw new Error(decoder.decode(module.HEAPU8.subarray(start, start + size)));
      }
      const start = module._nr_result_ptr(), size = module._nr_result_size();
      const envelope = JSON.parse(decoder.decode(module.HEAPU8.subarray(start, start + size))) as Envelope;
      if (envelope.apiVersion !== 1 || envelope.manifest.schemaVersion !== 1) throw new Error('Unsupported manifest version.');
      return envelope;
    } finally { module._free(ptr); }
  };
}

