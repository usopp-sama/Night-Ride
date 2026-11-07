const fs = require('node:fs/promises');
const path = require('node:path');
const KEYS = new Set(['orbit-run.mars.v1']);
const MAX_BYTES = 64 * 1024;
function validate(key, value) {
  if (!KEYS.has(key)) throw new Error('Unknown save slot');
  if (value !== undefined && (typeof value !== 'string' || Buffer.byteLength(value) > MAX_BYTES)) throw new Error('Invalid save size');
  if (value !== undefined) JSON.parse(value);
}
function createSaveStore(directory) {
  // Serialize reads and writes: an older autosave cannot overwrite a departure save.
  let pending = Promise.resolve();
  function enqueue(task) { const next = pending.then(task); pending = next.catch(() => {}); return next; }
  function fileFor(key) { validate(key); return path.join(directory, `${key}.json`); }
  async function readValid(file) { const value = await fs.readFile(file, 'utf8'); validate('orbit-run.mars.v1', value); return value; }
  return {
    read(key) { return enqueue(async () => {
      const file = fileFor(key);
      try { return await readValid(file); } catch {
        try { return await readValid(`${file}.bak`); } catch { return null; }
      }
    }); },
    write(key, value) { return enqueue(async () => {
      validate(key, value); const file = fileFor(key);
      await fs.mkdir(directory, {recursive:true});
      // Preserve only a valid previous record; never replace a good backup with corrupt data.
      try { const previous = await readValid(file); await fs.writeFile(`${file}.bak`, previous, {mode:0o600}); } catch (error) {
        if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
      }
      await fs.writeFile(`${file}.tmp`, value, {mode:0o600, flush:true});
      await fs.rename(`${file}.tmp`, file);
      return true;
    }); },
    flush() { return pending; }
  };
}
module.exports = {createSaveStore};
