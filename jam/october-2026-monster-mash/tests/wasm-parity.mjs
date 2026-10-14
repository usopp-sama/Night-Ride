import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import createCore from '../public/wasm/night_core.js';

const core = await createCore();
assert.equal(core._nr_api_version(),1);
const encode = new TextEncoder(), decode = new TextDecoder('utf-8',{fatal:true});
function generate(seed) {
  const bytes = encode.encode(seed), ptr = core._malloc(Math.max(1,bytes.length));
  assert.ok(ptr);
  try {
    core.HEAPU8.set(bytes,ptr);
    const status=core._nr_generate(ptr,bytes.length);
    if (status !== 0) {
      const p=core._nr_error_ptr(),n=core._nr_error_size();
      throw new Error(decode.decode(core.HEAPU8.subarray(p,p+n)));
    }
    const p=core._nr_result_ptr(),n=core._nr_result_size();
    return decode.decode(core.HEAPU8.subarray(p,p+n));
  } finally { core._free(ptr); }
}
const corpus=[...Array.from({length:100},(_,i)=>`corpus-${i}`),'moonlit-run','last-light','silent-relay','salt-and-pine','home-before-dawn','रात 🌙','"a\\b"',' \tmoonlit-run\r\n', 'x'.repeat(128)];
const cli=resolve('build/native',process.platform==='win32'?'night_manifest.exe':'night_manifest');
for (const seed of corpus) {
  const native=execFileSync(cli,[seed],{encoding:'utf8'}).trim();
  assert.equal(generate(seed),native,`native/WASM canonical bytes differ for ${seed}`);
  assert.equal(generate(seed),native,`repeat differs for ${seed}`);
  const parsed=JSON.parse(native);
  assert.equal(parsed.manifest.schemaVersion,1);
}
assert.throws(()=>generate(''),/seed/i);
assert.throws(()=>generate('x'.repeat(129)),/128/);
assert.throws(()=>generate('a\0b'),/control/);
const stable=generate('moonlit-run');
// Force memory growth, then check that fresh heap views and returned buffers work.
const allocation=core._malloc(20*1024*1024);
assert.ok(allocation);
assert.equal(generate('moonlit-run'),stable);
core._free(allocation);
const golden=JSON.parse(readFileSync(new URL('./golden-seeds.json',import.meta.url),'utf8'));
for (const [seed,hash] of Object.entries(golden.hashes)) assert.equal(JSON.parse(generate(seed)).manifestHash,hash,`generator version needs review: ${seed}`);
console.log(`Native/WASM parity passed for ${corpus.length} seeds; repeatability, golden hashes, errors, Unicode and memory growth passed.`);

const nativeReplay=JSON.parse(execFileSync(resolve('build/native',process.platform==='win32'?'night_replay.exe':'night_replay'),[],{encoding:'utf8'}));
assert.equal(core._nr_drive_version(),1);
core._nr_drive_reset();
const inputPtr=core._nr_drive_input(),snapshotPtr=core._nr_drive_snapshot();
let maxPositionError=0;
for(let tick=0;tick<3600;++tick){
  const phase=tick%900;
  const input=new Float32Array(core.HEAPU8.buffer,inputPtr,8);
  input.set([1,phase<420?0.55:0,phase>=420&&phase<600?0.7:0,phase>=100&&phase<390?-0.16:0,phase>=650?1:0,0,0,0]);
  assert.equal(core._nr_drive_step(),0);
  if((tick+1)%60===0){
    const snapshot=new Float32Array(core.HEAPU8.buffer,snapshotPtr,64), expected=nativeReplay[(tick+1)/60-1];
    for(let j=0;j<64;++j){
      assert.ok(Number.isFinite(snapshot[j]));
      // Position <= 2 cm; normalized orientation <= .001; other floats 0.1% or .02 absolute.
      const tolerance=j>=2&&j<=4?0.02:j>=5&&j<=8?0.001:Math.max(0.02,Math.abs(expected[j])*0.001);
      assert.ok(Math.abs(snapshot[j]-expected[j])<=tolerance,`drive tick ${tick+1} slot ${j}: ${snapshot[j]} vs ${expected[j]}`);
      if(j>=2&&j<=4)maxPositionError=Math.max(maxPositionError,Math.abs(snapshot[j]-expected[j]));
    }
  }
}
const finalSnapshot=new Float32Array(core.HEAPU8.buffer,snapshotPtr,64).slice();
new Float32Array(core.HEAPU8.buffer,inputPtr,8)[0]=99;
assert.equal(core._nr_drive_step(),1);
assert.deepEqual(new Float32Array(core.HEAPU8.buffer,snapshotPtr,64),finalSnapshot,'bad version must not advance');
core._nr_drive_recover();
assert.equal(new Float32Array(core.HEAPU8.buffer,snapshotPtr,64)[25],1);
const growth=core._malloc(30*1024*1024);assert.ok(growth);
core._nr_drive_reset();assert.equal(new Float32Array(core.HEAPU8.buffer,snapshotPtr,64)[1],0);core._free(growth);
console.log(`60-second native/WASM vehicle replay passed; maximum sampled position error ${maxPositionError.toFixed(6)} m. ABI rejection/recovery/memory-growth passed.`);

