// One save API shared by browser and desktop; progression formats stay identical.
const native = window.orbitDesktop;
const pending = new Set();
export const platform = native ? native.platform : 'browser';
export async function readSave(key) {
  if(native) return native.readSave(key);
  try { return localStorage.getItem(key); } catch { return null; }
}
export function writeSave(key,value) {
  const write = native ? native.writeSave(key,value) : Promise.resolve().then(()=>localStorage.setItem(key,value));
  pending.add(write);write.then(()=>pending.delete(write),()=>pending.delete(write));return write;
}
export async function flushSaves() { await Promise.all([...pending]); }
