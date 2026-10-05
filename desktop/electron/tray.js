import { Tray, Menu, app, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray = null;

export function initTray({ mainWindow, onCheckForUpdates }) {
  try {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar', 'assets', 'icon.png')
      : path.join(__dirname, '../assets/icon.png');

    const icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      return null;
    }

    const resized = icon.resize({ width: 16, height: 16 });
    tray = new Tray(resized);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open PharmaSys',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Check for Updates',
        click: () => onCheckForUpdates?.(),
      },
      { type: 'separator' },
      {
        label: 'Quit PharmaSys',
        click: () => app.quit(),
      },
    ]);

    tray.setToolTip('PharmaSys Desktop');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });

    return tray;
  } catch {
    return null;
  }
}

export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}