// Oyuna açılan köprü: window.MalazgirtHost (www/js/dil.js ve oyun.js kullanır)
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('MalazgirtHost', {
  platform: 'steam',
  lang: ipcRenderer.sendSync('dil'),
  load: () => ipcRenderer.sendSync('kayit-oku'),
  save: j => ipcRenderer.send('kayit-yaz', j),
  achieve: id => ipcRenderer.send('basarim', String(id)),
  stat: (name, v) => ipcRenderer.send('istatistik', String(name), +v),
  setFullscreen: on => ipcRenderer.send('tam-ekran', !!on),
  quit: () => ipcRenderer.send('cik'),
  demo: ipcRenderer.sendSync('demo'),
  openStore: () => ipcRenderer.send('magaza')
});
