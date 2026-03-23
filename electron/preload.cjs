const { contextBridge, ipcRenderer } = require('electron');

/**
 * PRELOAD NEXUS - PONTE DE COMUNICA\u00C7\u00C3O (#10, #1, #4)
 * Exp\u00D5e de forma segura as funcionalidades do Core para a interface React.
 * Mant\u00E9m o contexto isolado e o sandbox ativo.
 */

contextBridge.exposeInMainWorld('nexusAPI', {
  // --- NAVEGA\u00C7\u00C3O INTELIGENTE (#7) ---
  resolveNavigation: (query, engine) => ipcRenderer.invoke('resolve-navigation', query, engine),

  // --- SEGURAN\u00C7A (SHIELD) (#2) ---
  getShieldStats: () => ipcRenderer.invoke('get-shield-stats'),
  getSuggestions: (query) => ipcRenderer.invoke('get-suggestions', query),

  // --- IA SERVICE (#4) ---
  getAISummary: (content) => ipcRenderer.invoke('ai-summary', content),

  // --- PERSIST\u00C2NCIA (#11, #5) ---
  getHistory: () => ipcRenderer.invoke('db-get-history'),
  
  // --- SISTEMA ---
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  ping: (host) => ipcRenderer.invoke('ping', host),

  // --- DOWNLOADS (#1767) ---
  onDownloadStarted: (cb) => ipcRenderer.on('download-started', (e, item) => cb(item)),
  onDownloadUpdated: (cb) => ipcRenderer.on('download-updated', (e, item) => cb(item)),
  openDownload: (path) => ipcRenderer.invoke('open-file', path),

  // --- UPDATES (#1.2.1) ---
  onUpdateReady: (cb) => ipcRenderer.on('update-ready', () => cb()),
  onUpdateStatus: (cb) => ipcRenderer.on('update-status', (event, status) => cb(status)),
  applyUpdate: () => ipcRenderer.invoke('apply-update'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // --- CHROMIUM CORE: DATA & TOOLS ---
  getHistory: () => ipcRenderer.invoke('db-get-history'),
  deleteHistoryItem: (idx) => ipcRenderer.invoke('db-delete-history-item', idx),
  clearHistory: () => ipcRenderer.invoke('db-clear-history'),
  
  getBookmarks: () => ipcRenderer.invoke('db-get-bookmarks'),
  saveBookmark: (b) => ipcRenderer.invoke('db-save-bookmark', b),
  deleteBookmark: (u) => ipcRenderer.invoke('db-delete-bookmark', u),

  getAppMetrics: () => ipcRenderer.invoke('get-process-metrics'),
  toggleDevTools: () => ipcRenderer.send('toggle-devtools'),
});
