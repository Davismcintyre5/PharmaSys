const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  version: process.version,

  openExternal: (url) => {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      shell.openExternal(url);
    }
  },

  getAppVersion: () => ipcRenderer.invoke('app:version'),

  checkForUpdates: () => ipcRenderer.send('update:check'),
  installUpdate: () => ipcRenderer.send('update:install'),

  onUpdateMessage: (cb) => {
    const handler = (_e, msg) => cb(msg);
    ipcRenderer.on('update-message', handler);
    return () => ipcRenderer.removeListener('update-message', handler);
  },

  onDownloadProgress: (cb) => {
    const handler = (_e, percent) => cb(percent);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },

  onUpdateError: (cb) => {
    const handler = (_e, msg) => cb(msg);
    ipcRenderer.on('update-error', handler);
    return () => ipcRenderer.removeListener('update-error', handler);
  },
});