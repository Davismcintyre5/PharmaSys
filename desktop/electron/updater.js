import electronUpdater from 'electron-updater';

const { autoUpdater } = electronUpdater;

let mainWindow = null;
let started = false;

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const INITIAL_DELAY_MS = 5000;

export function initUpdater(window) {
  mainWindow = window;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  autoUpdater.on('checking-for-update', () => {
    send('update-message', 'Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    send('update-message', `Downloading PharmaSys v${info.version}`);
  });

  autoUpdater.on('update-not-available', () => {
    send('update-message', 'PharmaSys is up to date');
  });

  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent);
    send('download-progress', percent);
  });

  autoUpdater.on('update-downloaded', (info) => {
    send('update-message', `PharmaSys v${info.version} downloaded. Restarting...`);
    send('download-progress', 100);

    setTimeout(() => {
      try {
        autoUpdater.quitAndInstall(false, true);
      } catch {}
    }, 3000);
  });

  autoUpdater.on('error', (err) => {
    send('update-error', err?.message || 'Update error');
  });

  if (started) return;
  started = true;

  setTimeout(checkForUpdates, INITIAL_DELAY_MS);
  setInterval(checkForUpdates, CHECK_INTERVAL_MS);
}

export function checkForUpdates() {
  autoUpdater.checkForUpdates().catch((err) => {
    send('update-error', err?.message || 'Update check failed');
  });
}

export function installUpdate() {
  try {
    autoUpdater.quitAndInstall(false, true);
  } catch (err) {
    send('update-error', err?.message || 'Install failed');
  }
}

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}