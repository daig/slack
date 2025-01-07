import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import installExtension from 'electron-devtools-installer'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.webContents.openDevTools()
  
  win.loadFile(path.join(__dirname, './renderer/index.html'))
}

app.whenReady().then(async () => {
  // Install Apollo DevTools
  try {
    await installExtension('apollo-developer-tools')
    console.log('Apollo DevTools installed successfully');
  } catch (e) {
    console.log('Apollo DevTools failed to install:', e);
  }

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