const {app, BrowserWindow, protocol, net, ipcMain, Menu, dialog} = require('electron');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {createSaveStore} = require('./save-store.cjs');
const SMOKE = process.argv.includes('--smoke-test');
const ORIGIN = 'orbit://game';
protocol.registerSchemesAsPrivileged([{scheme:'orbit', privileges:{standard:true, secure:true, supportFetchAPI:true, corsEnabled:true}}]);
if (SMOKE) app.setPath('userData', path.join(app.getPath('temp'), `orbit-run-smoke-${process.pid}`));
let win, store, quitting = false, quitTimer;
function trusted(event) { return event.sender === win?.webContents && event.senderFrame === win.webContents.mainFrame && event.senderFrame.url.startsWith(`${ORIGIN}/`); }
const ownsInstance=app.requestSingleInstanceLock();
if(!ownsInstance)app.quit();
app.on('second-instance',()=>{if(win?.isMinimized())win.restore();win?.show();win?.focus();});
if(ownsInstance)app.whenReady().then(async () => {
  store = createSaveStore(path.join(app.getPath('userData'), 'saves'));
  const assets = path.resolve(__dirname, '../dist');
  protocol.handle('orbit', request => {
    const url = new URL(request.url);
    if (url.host !== 'game') return new Response('Not found', {status:404});
    let relative; try { relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html'; } catch { return new Response('', {status:400}); }
    const file = path.resolve(assets, relative);
    if (!file.startsWith(`${assets}${path.sep}`)) return new Response('Not found', {status:404});
    return net.fetch(pathToFileURL(file).href);
  });
  ipcMain.handle('save:read', (event, key) => { if (!trusted(event)) throw new Error('Invalid sender'); return store.read(key); });
  ipcMain.handle('save:write', (event, key, value) => { if (!trusted(event)) throw new Error('Invalid sender'); return store.write(key, value); });
  function createWindow() {
    win = new BrowserWindow({width:1440,height:900,minWidth:1000,minHeight:680,backgroundColor:'#070d18',title:'Orbit Run — The Third Ring',show:false,
      webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
    win.webContents.setWindowOpenHandler(() => ({action:'deny'}));
    win.webContents.on('will-navigate', event => event.preventDefault());
    win.webContents.session.setPermissionRequestHandler((_web, _permission, callback) => callback(false));
    win.once('ready-to-show', () => win.show());
    win.on('close', event => { if (quitting) return; event.preventDefault(); win.webContents.send('game:before-quit');
      clearTimeout(quitTimer); quitTimer = setTimeout(() => {
        dialog.showMessageBox(win, {type:'warning',message:'The field log has not finished saving.',detail:'Try closing again, or quit using the last successful autosave.',buttons:['Keep playing','Quit anyway'],defaultId:0,cancelId:0}).then(({response}) => { if(response===1){quitting=true;app.quit();} });
      },5000);
    });
    win.loadURL(`${ORIGIN}/index.html${SMOKE?'?smoke=1':''}`);
  }
  ipcMain.on('game:ready-to-quit', async event => { if(!trusted(event))return; clearTimeout(quitTimer); await store.flush(); quitting=true;app.quit(); });
  ipcMain.on('game:save-failed', event => {if(trusted(event)) console.error('Final save failed; waiting for player decision.');});
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform==='darwin'?[{label:'Orbit Run',submenu:[{role:'about'},{type:'separator'},{role:'quit'}]}]:[]),
    {label:'Game',submenu:[{role:'togglefullscreen'},{type:'separator'},{label:'Quit',click:()=>win.close()}]},
    ...(!app.isPackaged?[{label:'Development',submenu:[{role:'toggleDevTools'},{role:'reload'}]}]:[])
  ]));
  createWindow();
  if(SMOKE) {
    const fail = message => {console.error(message);quitting=true;app.exit(1);};
    const timeout=setTimeout(()=>fail('Desktop smoke test timed out'),60000);
    const errors=[];win.webContents.on('console-message', (_event, details)=>{if(details.level==='error')errors.push(details.message);});
    await new Promise(resolve=>win.webContents.once('did-finish-load',resolve));
    try {
      const result=await win.webContents.executeJavaScript(`(async()=>{
        const pause = ms => new Promise(r=>setTimeout(r,ms));
        const until = async fn => {for(let i=0;i<200;i++){if(fn())return;await pause(100);}throw new Error('Scene load timeout');};
        document.getElementById('mars-launch').click();
        await until(()=>!document.getElementById('mars-ui').hidden && document.getElementById('surface-loading').hidden);
        const stops=document.querySelectorAll('[data-site]').length;
        const save=await window.orbitDesktop.readSave('orbit-run.mars.v1');
        if(!save||JSON.parse(save).version!==1)throw new Error('Native autosave missing');
        document.getElementById('mars-open-map').click();
        if(!document.getElementById('mars-map-dialog').open)throw new Error('Mars atlas did not open');
        document.getElementById('mars-map-close').click();
        return {stops,nativeSave:true,webgl:!!document.querySelector('#space canvas'),title:document.title};
      })()`);
      if(errors.length)throw new Error(errors.join('\n'));
      console.log('DESKTOP_SMOKE_OK',JSON.stringify(result));clearTimeout(timeout);quitting=true;await store.flush();app.quit();
    } catch(error){fail(error.stack);}
  }
});
app.on('before-quit', event=>{if(!quitting&&win&&!win.isDestroyed()){event.preventDefault();win.close();}});
app.on('window-all-closed',()=>{quitting=true;app.quit();});
