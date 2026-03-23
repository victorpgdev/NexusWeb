const { app, BrowserWindow, shell, ipcMain, dialog, net } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Configuration for auto-updates (Production only)
autoUpdater.autoDownload = false; // We ask the user before downloading large updates
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
}

// Update Listeners
autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Atualiza\u00C7\u00C3o Dispon\u00C3vel',
        message: `Uma nova vers\u00C3o (${info.version}) do Nexus Browser est\u00C3¡ dispon\u00C3vel. Deseja baixar agora?`,
        buttons: ['Sim', 'Depois']
    }).then(result => {
        if (result.response === 0) autoUpdater.downloadUpdate();
    });
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Pronto para Instalar',
        message: 'A atualiza\u00C7\u00C3o foi baixada e ser\u00C3¡ instalada agora.',
        buttons: ['Reiniciar Agora']
    }).then(result => {
        if (result.response === 0) autoUpdater.quitAndInstall();
    });
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
