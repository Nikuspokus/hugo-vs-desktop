const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// Support manettes Xbox sur Windows et macOS
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('enable-features', 'WindowsGamingInput');
}

let mainWindow;
const saveFilePath = path.join(app.getPath('userData'), 'stickman-save.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 1024,
    minHeight: 640,
    title: 'Hugo vs Desktop',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    resizable: true,
    backgroundColor: '#090d16',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  // Raccourcis Plein Écran (F11 sur Windows/Linux, Ctrl+Cmd+F sur macOS)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      const isMacFS = process.platform === 'darwin' && input.control && input.meta && input.key.toLowerCase() === 'f';
      if (input.key === 'F11' || isMacFS) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
        event.preventDefault();
      }
    }
  });
}

// IPC : Plein écran & Quitter
ipcMain.on('toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

ipcMain.on('quit-app', () => {
  app.quit();
});

// IPC : Sauvegarde locale synchronisée
ipcMain.on('load-save', (event) => {
  try {
    if (fs.existsSync(saveFilePath)) {
      const data = JSON.parse(fs.readFileSync(saveFilePath, 'utf-8'));
      event.returnValue = data;
    } else {
      event.returnValue = null;
    }
  } catch (err) {
    event.returnValue = null;
  }
});

ipcMain.on('write-save', (event, data) => {
  try {
    fs.writeFileSync(saveFilePath, JSON.stringify(data, null, 2), 'utf-8');
    event.returnValue = true;
  } catch (err) {
    event.returnValue = false;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});