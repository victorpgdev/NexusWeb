const { app, BrowserWindow, shell, ipcMain, dialog, net } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Configuration for auto-updates (Production only)
autoUpdater.autoDownload = true; 
autoUpdater.logger = console;

// #1: ARQUITETURA MODULAR (M\u00D3DULOS INDEPENDENTES)
const { setupShield } = require('./shield.cjs');
const { setupTabManager } = require('./tabs.cjs');
const { setupIPCAdapters } = require('./ipc.cjs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 940,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#202124',
      symbolColor: '#9aa0a6',
      height: 44
    },
    backgroundColor: '#050505',
    title: 'Nexus Browser',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: true,
    },
  });

  const isDev = process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    win.loadURL(isDev);
  } else {
    // Highly resilient path discovery
    const possiblePaths = [
      path.join(__dirname, '../dist/index.html'),
      path.join(__dirname, 'index.html'),
      path.join(process.resourcesPath, 'app/dist/index.html'),
      path.join(app.getAppPath(), 'dist/index.html')
    ];
    
    let loaded = false;
    for (const p of possiblePaths) {
      if (!loaded) {
        win.loadFile(p).then(() => loaded = true).catch(() => {});
      }
    }
  }

  win.once('ready-to-show', () => win.show());
  setupShield();
  win.setMenu(null); 

  // --- DOWNLOAD MANAGER (#1767) ---
  session.defaultSession.on('will-download', (event, item, webContents) => {
    const downloadId = Math.random().toString(36).substr(2, 9);
    const fileName = item.getFilename();
    const url = item.getURL();
    const totalBytes = item.getTotalBytes();
    
    const downloadItem = {
      id: downloadId,
      name: fileName,
      url: url,
      total: totalBytes,
      received: 0,
      state: 'progressing',
      path: ''
    };

    // Store in global or notify win
    webContents.send('download-started', downloadItem);

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        webContents.send('download-updated', { id: downloadId, state: 'interrupted' });
      } else if (state === 'progressing') {
        if (webContents.isDestroyed()) return;
        webContents.send('download-updated', { 
            id: downloadId, 
            received: item.getReceivedBytes(),
            state: 'progressing' 
        });
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        webContents.send('download-updated', { 
            id: downloadId, 
            state: 'completed', 
            path: item.getSavePath(),
            received: totalBytes 
        });
      } else {
        webContents.send('download-updated', { id: downloadId, state: 'failed' });
      }
    });
  });
}

// Silent Background Updates (No more prompts for available updates)

autoUpdater.on('update-downloaded', () => {
    // Notify the renderer that update is ready
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-ready'));
    
    // Optional fallback dialog if window is not responding
    console.log("[UPDATE] Downloaded and ready to install.");
});

// Initialization
app.whenReady().then(() => {
    try {
        setupTabManager();
        setupIPCAdapters();
        createWindow();
        
        // Start update check in production
        if (app.isPackaged) {
          autoUpdater.checkForUpdatesAndNotify();
        }

        ipcMain.handle('apply-update', () => {
            autoUpdater.quitAndInstall();
        });

        // --- BRAIN: SMART SEARCH SUGGESTIONS (#7) ---
        ipcMain.handle('get-suggestions', async (event, query) => {
            if (!query || query.length < 2) return [];
            return new Promise((resolve) => {
                const request = net.request(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`);
                request.on('response', (response) => {
                    let data = '';
                    response.on('data', (chunk) => { data += chunk; });
                    response.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            resolve(json[1] || []); // Index 1 contains suggestion strings
                        } catch (e) { resolve([]); }
                    });
                });
                request.on('error', () => resolve([]));
                request.end();
            });
        });

        // --- DOWNLOAD ACTIONS ---
        ipcMain.handle('open-file', (event, path) => {
            if (path) shell.openPath(path);
        });

    } catch (e) {
        console.error("[NEXUS BOOT FAILED] ", e);
    }
});

process.on('uncaughtException', (error) => {
    console.error("[NEXUS CORE CRASH PREVENTED] ", error);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
