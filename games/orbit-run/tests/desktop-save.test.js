import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const {createSaveStore}=createRequire(import.meta.url)('../desktop/save-store.cjs');
const KEY='orbit-run.mars.v1';
async function fixture(t){const dir=await mkdtemp(path.join(tmpdir(),'orbit-save-test-'));t.after(()=>rm(dir,{recursive:true,force:true}));return {dir,store:createSaveStore(dir)};}

test('native saves serialize autosaves and departure writes, retaining the previous valid record',async t=>{
  const {dir,store}=await fixture(t);
  await Promise.all([store.write(KEY,'{"version":1,"stage":0}'),store.write(KEY,'{"version":1,"stage":1}'),store.write(KEY,'{"version":1,"stage":2}')]);
  assert.equal(JSON.parse(await store.read(KEY)).stage,2);
  assert.equal(JSON.parse(await readFile(path.join(dir,KEY+'.json.bak'),'utf8')).stage,1);
  assert.equal((await import('node:fs')).existsSync(path.join(dir,KEY+'.json.tmp')),false);
});
test('a corrupt primary native save recovers from its valid backup, then accepts a new save',async t=>{
  const {dir,store}=await fixture(t);
  assert.equal(await store.read(KEY),null);
  await store.write(KEY,'{"stage":1}');await store.write(KEY,'{"stage":2}');
  await writeFile(path.join(dir,KEY+'.json'),'{damaged');
  assert.equal(JSON.parse(await store.read(KEY)).stage,1);
  await store.write(KEY,'{"stage":3}');assert.equal(JSON.parse(await store.read(KEY)).stage,3);
  assert.equal(JSON.parse(await readFile(path.join(dir,KEY+'.json.bak'),'utf8')).stage,1);
});
test('native save bridge rejects arbitrary paths, malformed JSON and oversized payloads',async t=>{
  const {store}=await fixture(t);
  await assert.rejects(store.write('../outside','{}'),/Unknown save slot/);
  await assert.rejects(store.read('settings'),/Unknown save slot/);
  await assert.rejects(store.write(KEY,'{broken'),SyntaxError);
  await assert.rejects(store.write(KEY,'"'+'x'.repeat(65536)+'"'),/save size/);
  await store.write(KEY,'{}');assert.equal(await store.read(KEY),'{}','rejections do not poison subsequent saves');
});
