import { app, ipcMain, shell } from 'electron';
import path from 'path';

import { createWindow, getMainWindow, focusMainWindow } from './window.js';
import { buildMenu } from './menu.js';
import { initTray } from './tray.js';
import { initUpdater, checkForUpdates, installUpdate } from './updater.js';

app.setPath('cache', path.join(app.getPath('userData'), 'cache'));

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', focusMainWindow);
}

app.whenReady().then(() => {
  ipcMain.handle('app:version', () => app.getVersion());

  ipcMain.on('open-external', (_e, url) => {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      shell.openExternal(url);
    }
  });

  ipcMain.on('update:check', () => checkForUpdates());
  ipcMain.on('update:install', () => installUpdate());

  const win = createWindow();

  buildMenu();

  initTray({
    mainWindow: win,
    onCheckForUpdates: () => checkForUpdates(),
  });

  if (app.isPackaged) {
    initUpdater(win);
  }

  app.on('activate', () => {
    if (!getMainWindow()) {
      const next = createWindow();
      if (app.isPackaged) initUpdater(next);
    } else {
      focusMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});