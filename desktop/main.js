// Malazgirt Akıncıları — masaüstü (Steam) kabuğu. Oyunun kendisi www/ içindeki web oyunudur.
const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron');
const path = require('path'), fs = require('fs');

app.setName('MalazgirtAkincilari');                 // kayıt klasörü ASCII olsun (Steam Cloud yolları için)
if (process.platform === 'linux') app.commandLine.appendSwitch('no-sandbox');   // Steam/Pardus: SUID sandbox izni olmadan da açılsın
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

let APP_ID = 0;
try { APP_ID = JSON.parse(fs.readFileSync(path.join(__dirname, 'steam.json'), 'utf8')).appId || 0; } catch (e) {}
let steam = null;
if (APP_ID) {
  try {
    const sw = require('steamworks.js');
    if (sw.restartAppIfNecessary(APP_ID)) { app.exit(0); }
    steam = sw.init(APP_ID);
    sw.electronEnableSteamOverlay();
  } catch (e) { console.log('Steam bağlantısı yok:', e.message); steam = null; }
}

const SAVE = () => path.join(app.getPath('userData'), 'kayit.json');
const CLOUD = 'kayit.json';
function readSave() {
  let local = null; try { local = fs.readFileSync(SAVE(), 'utf8'); } catch (e) {}
  if (steam) try { if (steam.cloud.isEnabledForApp() && steam.cloud.fileExists(CLOUD)) { const c = steam.cloud.readFile(CLOUD); if (c && (!local || score(c) >= score(local))) return c; } } catch (e) {}
  return local;
}
// iki kayıttan ilerlemesi çok olanı seç (bilgisayarlar arası taşıma)
function score(j) { try { const s = JSON.parse(j); return (s.unlocked || 0) * 10 + (s.stars || []).filter(Boolean).length; } catch (e) { return -1; } }
function writeSave(j) {
  try { fs.mkdirSync(path.dirname(SAVE()), { recursive: true }); fs.writeFileSync(SAVE() + '.tmp', j); fs.renameSync(SAVE() + '.tmp', SAVE()); } catch (e) {}
  if (steam) try { if (steam.cloud.isEnabledForApp()) steam.cloud.writeFile(CLOUD, j); } catch (e) {}
}

let win = null;
function createWindow() {
  const wa = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    width: Math.min(1280, wa.width), height: Math.min(800, wa.height), minWidth: 640, minHeight: 480,
    backgroundColor: '#0c1c34', title: 'Malazgirt Akıncıları', show: false, autoHideMenuBar: true,
    icon: path.join(__dirname, 'www', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false, spellcheck: false }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'www', 'index.html'));
  win.once('ready-to-show', () => win.show());
  win.webContents.on('before-input-event', (e, input) => { if (input.type === 'keyDown' && input.key === 'F12' && !app.isPackaged) win.webContents.toggleDevTools(); });
}

ipcMain.on('kayit-oku', e => { e.returnValue = readSave(); });
ipcMain.on('kayit-yaz', (e, j) => { if (typeof j === 'string' && j.length < 2e6) writeSave(j); });
ipcMain.on('basarim', (e, id) => { if (steam) try { if (!steam.achievement.isActivated(id)) steam.achievement.activate(id); } catch (x) {} });
ipcMain.on('istatistik', (e, name, v) => { if (steam) try { steam.stats.setInt(name, v | 0); steam.stats.store(); } catch (x) {} });
ipcMain.on('tam-ekran', (e, on) => { if (win) win.setFullScreen(!!on); });
ipcMain.on('cik', () => app.quit());
ipcMain.on('dil', e => { let l = ''; if (steam) try { l = steam.apps.currentGameLanguage(); } catch (x) {} e.returnValue = l; });

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
