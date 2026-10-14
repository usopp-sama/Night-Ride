import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const env = { ...process.env, EM_CACHE: resolve('build/emcache') };
// CMake invokes libexec/em++ directly, bypassing Homebrew's Python wrapper.
// Honor emsdk first, otherwise discover a suitable interpreter without changing the user's PATH.
if (!env.EMSDK_PYTHON) {
  for (const python of ['python3', 'python3.14', 'python3.13', 'python3.12', 'python3.11', 'python3.10']) {
    const probe = spawnSync(python, ['-c', 'import sys; assert sys.version_info >= (3,10); print(sys.executable)'], { encoding: 'utf8' });
    if (probe.status === 0) { env.EMSDK_PYTHON = probe.stdout.trim(); break; }
  }
}
mkdirSync(env.EM_CACHE, { recursive: true });
function run(command, args = []) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit', shell: false });
  if (result.error) throw new Error(`${command}: ${result.error.message}. See README.md for toolchain setup.`);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
function native() {
  run('cmake', ['-S', '.', '-B', 'build/native', '-DCMAKE_BUILD_TYPE=Debug']);
  run('cmake', ['--build', 'build/native', '--parallel', '4']);
}
function wasm() {
  run('emcmake', ['cmake', '-S', '.', '-B', 'build/wasm', '-DCMAKE_BUILD_TYPE=Release']);
  run('cmake', ['--build', 'build/wasm', '--parallel', '4']);
}
function npmBin(name, args = []) {
  const bin = resolve('node_modules/.bin', process.platform === 'win32' ? `${name}.cmd` : name);
  run(bin, args);
}
function bundleReport() {
  const files = [];
  const walk = dir => {
    for (const item of readdirSync(dir)) {
      const path = resolve(dir, item);
      if (statSync(path).isDirectory()) walk(path);
      else { const buffer = readFileSync(path); files.push({ path: relative('dist', path), bytes: buffer.length, gzipBytes: gzipSync(buffer).length }); }
    }
  };
  walk(resolve('dist'));
  const report = { files, totalBytes: files.reduce((n,f)=>n+f.bytes,0), totalGzipBytes: files.reduce((n,f)=>n+f.gzipBytes,0) };
  writeFileSync('build/bundle-size.json', JSON.stringify(report,null,2) + '\n');
  console.table(files);
  console.log(`Total: ${report.totalBytes} bytes; ${report.totalGzipBytes} bytes gzip (estimated, hosting-dependent).`);
}
function assets() { run('node', ['scripts/fetch-assets.mjs']); }
switch (process.argv[2]) {
  case 'dev': assets(); wasm(); npmBin('vite'); break;
  case 'test':
    native(); run('ctest', ['--test-dir', 'build/native', '--output-on-failure']);
    wasm(); run('node', ['tests/wasm-parity.mjs']); break;
  case 'build': assets(); wasm(); npmBin('tsc', ['--noEmit']); npmBin('vite', ['build']); bundleReport(); break;
  case 'prepare':
    run('node', ['scripts/tasks.mjs','test']); run('node', ['scripts/tasks.mjs','build']); npmBin('playwright',['test']);
    console.log('Local release checks passed. dist/ is ready for a private RUN compatibility probe. No upload or publication performed.'); break;
  case 'versions':
    for (const [cmd,args] of [['node',['--version']],['npm',['--version']],['cmake',['--version']],['emcc',['--version']]]) run(cmd,args);
    break;
  default: throw new Error('Expected dev, test, build, prepare, or versions.');
}

