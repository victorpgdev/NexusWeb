const { app, BrowserWindow, shell, ipcMain, dialog, net } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// --- [NEXUS ENGINE] CHROMIUM EXTREME PERFORMANCE FLAGS ---
// 1. Aceleração de Hardware Pesada (GPU)
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
// 2. Otimização de Memória e Processamento (RAM/CPU)
app.commandLine.appendSwitch('enable-features', 'CanvasOopRasterization,Vulkan'); 
app.commandLine.appendSwitch('disable-features', 'SpareRendererForSitePerProcess'); // Economiza RAM
// 3. Suavidade de Tela e Navegação
app.commandLine.appendSwitch('enable-smooth-scrolling');
app.commandLine.appendSwitch('disable-frame-rate-limit'); // Destrava o FPS
// 4. Rede ultra-rápida (QUIC)
app.commandLine.appendSwitch('enable-quic');

// Configuration for auto-updates (Production only)
autoUpdater.autoDownload = true; 
autoUpdater.logger = console;

// #1: ARQUITETURA MODULAR (MÓDULOS INDEPENDENTES)
const { setupShield } = require('../core/shield_service.cjs');
const { setupTabManager } = require('../core/tab_manager.cjs');
const { setupIPCAdapters } = require('../core/navigation_controller.cjs');

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
      preload: path.join(__dirname, '../preload.cjs'),
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

autoUpdater.on('checking-for-update', () => {
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-status', 'checking'));
});

autoUpdater.on('update-available', () => {
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-status', 'available'));
});

autoUpdater.on('update-not-available', () => {
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-status', 'latest'));
});

autoUpdater.on('error', (err) => {
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-status', 'error'));
    console.error("[UPDATE ERROR] ", err);
});

autoUpdater.on('update-downloaded', () => {
    // Notify the renderer that update is ready
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-ready'));
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-status', 'ready'));
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

        ipcMain.handle('check-for-updates', async () => {
            try {
                if (!app.isPackaged) {
                    // Prevenir bug de tela travada no 'checking' no modo de desenvolvimento
                    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-status', 'checking'));
                    setTimeout(() => {
                        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-status', 'latest'));
                    }, 1500);
                    return null;
                }
                return await autoUpdater.checkForUpdatesAndNotify();
            } catch (err) {
                console.error("[UPDATE ERROR] ", err);
                BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-status', 'error'));
                return null;
            }
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

// --- CHROMIUM CORE: AUTOMATIC HISTORY RECORDING ---
app.on('web-contents-created', (event, contents) => {
    if (contents.getType() === 'webview') {
        contents.on('did-navigate', (event, url) => {
            if (url.startsWith('http')) {
                const db = require('../profile/profile_manager.cjs');
                db.addHistory({ 
                    url, 
                    title: contents.getTitle() || url, 
                    time: new Date().toLocaleString() 
                });
            }
        });
    }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
