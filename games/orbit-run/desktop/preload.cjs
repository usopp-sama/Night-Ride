const {contextBridge, ipcRenderer} = require('electron');
// Deliberately narrow: no filesystem paths, shell execution, or generic IPC exposed.
contextBridge.exposeInMainWorld('orbitDesktop', {
  platform: process.platform,
  readSave: key => ipcRenderer.invoke('save:read', key),
  writeSave: (key, value) => ipcRenderer.invoke('save:write', key, value),
  onBeforeQuit: handler => ipcRenderer.on('game:before-quit', async () => {
    try { await handler(); ipcRenderer.send('game:ready-to-quit'); }
    catch { ipcRenderer.send('game:save-failed'); }
  })
});
