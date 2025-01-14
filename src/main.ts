import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables before anything else
dotenv.config()

async function createWindow(): Promise<void> {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload/index.js')
    }
  })

  if (!app.isPackaged) {
    try {
      const installExtension = require('electron-devtools-installer');
      await installExtension('apollo-developer-tools');
      console.log('Apollo DevTools installed successfully');
      win.webContents.openDevTools();
    } catch (e) {
      console.log('Apollo DevTools failed to install:', e);
    }
  }

  // Updated path resolution
  if (app.isPackaged) {
    // Production path
    win.loadFile(path.join(app.getAppPath(), 'dist/renderer/index.html'))
  } else {
    // Development path
    win.loadFile(path.join(__dirname, './renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}) 