import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Settings, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Plus, 
  X, 
  Lock, 
  Menu as MenuIcon, 
  Home, 
  Star,
  ShieldCheck,
  Palette,
  ArrowRight as ArrowRightIcon,
  Zap
} from 'lucide-react';
import type { Tab, HistoryItem, BookmarkItem, DownloadItem } from './types';
import { OmniboxDropdown } from './components/ui/OmniboxDropdown';
import { ChromeMenu } from './components/ui/ChromeMenu';
import { NexusSearchPage } from './components/layout/NexusSearchPage';
import { DownloadsPage, HistoryPage, TaskManagerPage, DiagnosticsPage, BookmarksPage } from './components/layout/ManagementPages';

/**
 * NEXUS BROWSER - PREMIUM NAVEGA\u00C7\u00C3O & CUSTOMIZA\u00C7\u00C3O
 */

declare global {
  interface Window {
    nexusAPI: {
      resolveNavigation: (q: string, engine?: string) => Promise<{ action: string, url: string }>;
      getShieldStats?: () => Promise<{ blockedCount: number, isShieldActive: boolean }>;
      getSuggestions: (query: string) => Promise<string[]>;
      onDownloadStarted: (cb: (item: any) => void) => void;
      onDownloadUpdated: (cb: (item: any) => void) => void;
      openDownload: (path: string) => Promise<void>;
      onUpdateReady: (cb: () => void) => void;
      onUpdateStatus: (cb: (status: any) => void) => void;
      applyUpdate: () => Promise<void>;
      checkForUpdates: () => Promise<any>;
      getHistory: () => Promise<any[]>;
      deleteHistoryItem: (idx: number) => Promise<boolean>;
      clearHistory: () => Promise<boolean>;
      getBookmarks: () => Promise<any[]>;
      saveBookmark: (b: any) => Promise<boolean>;
      deleteBookmark: (u: string) => Promise<boolean>;
      getAppMetrics: () => Promise<any[]>;
      toggleDevTools: () => void;
    };
  }
}

// Componentes carregados via import modular

const App: React.FC = () => {
    const [tabs, setTabs] = useState<Tab[]>([{ id: '1', url: 'nexus:newtab', title: 'Nova Guia', isLoading: false, canGoBack: false, canGoForward: false, progress: 0 }]);
    const [activeTabId, setActiveTabId] = useState('1');
    const [inputValue, setInputValue] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [browserAccent, setBrowserAccent] = useState('#00ccff');
    const [themeMode, setThemeMode] = useState<'claro' | 'escuro' | 'dispositivo'>('escuro');
    const [zoomFactor, setZoomFactor] = useState(1);
    const [shieldBlocked, setShieldBlocked] = useState(0);
    const [downloads, setDownloads] = useState<DownloadItem[]>([]);
    const [showDownloads, setShowDownloads] = useState(false);
    const [isUpdateReady, setIsUpdateReady] = useState(false);
    
    // --- CHROMIUM DATA STATES ---
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
    
    // --- INFRA STATES ---
    const [showTasks, setShowTasks] = useState(false);
    const [taskMetrics, setTaskMetrics] = useState<any[]>([]);
    const [showDiagnostics, setShowDiagnostics] = useState(false);

    // --- UPDATE FEEDBACK ---
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'latest' | 'available' | 'error' | 'ready'>('idle');

    const SEARCH_ENGINE = 'google';
    const webviewRefs = useRef<Record<string, any>>({});
    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

    const refreshHistory = async () => {
        const items = await window.nexusAPI.getHistory();
        setHistory(items || []);
    };

    const refreshBookmarks = async () => {
        const items = await window.nexusAPI.getBookmarks();
        setBookmarks(items || []);
    };

    // Download & Update Listeners
    useEffect(() => {
        window.nexusAPI.onDownloadStarted((item) => {
            setDownloads(prev => [...prev, item]);
            setShowDownloads(true);
        });
        window.nexusAPI.onDownloadUpdated((update) => {
            setDownloads(prev => prev.map(dl => dl.id === update.id ? { ...dl, ...update } : dl));
        });
        window.nexusAPI.onUpdateReady(() => {
            setIsUpdateReady(true);
            setUpdateStatus('ready');
        });
        window.nexusAPI.onUpdateStatus((status: any) => {
            setUpdateStatus(status);
            if (status === 'latest' || status === 'error') {
                setTimeout(() => setUpdateStatus('idle'), 5000); // Auto-hide after 5s
            }
        });
        // Initial load
        refreshHistory();
        refreshBookmarks();
    }, []);

    useEffect(() => {
        document.documentElement.style.setProperty('--bg-accent', browserAccent);
    }, [browserAccent]);

    // Shield Poll - Real-time stats display
    useEffect(() => {
      const interval = setInterval(async () => {
        if (window.nexusAPI.getShieldStats) {
          const stats = await window.nexusAPI.getShieldStats();
          setShieldBlocked(stats.blockedCount);
        }
      }, 3000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTab && activeTab.url !== 'nexus:newtab' && activeTab.url !== inputValue) {
            setInputValue(activeTab.url);
        } else if (activeTab && activeTab.url === 'nexus:newtab' && !showDropdown && !showTasks && !showDiagnostics && !showHistory && !showBookmarks && !showDownloads) {
            setInputValue('');
        }
    }, [activeTabId, activeTab, showDropdown, inputValue, showTasks, showDiagnostics, showHistory, showBookmarks, showDownloads]);

    const handleNavigate = async (e?: React.FormEvent, customQuery?: string, customEngine?: string) => {
        if (e) e.preventDefault();
        const query = (customQuery || inputValue).trim();
        if (!query) return;
        setShowDropdown(false);
        try {
            const result = await window.nexusAPI.resolveNavigation(query, customEngine || SEARCH_ENGINE);
            
            // #Chromium: Internal URL Routing
            if (result.action === 'internal') {
              if (result.url === 'nexus://tasks') setShowTasks(true);
              if (result.url === 'nexus://history') setShowHistory(true);
              if (result.url === 'nexus://bookmarks') setShowBookmarks(true);
              if (result.url === 'nexus://version') setShowDiagnostics(true);
              if (result.url === 'nexus://downloads') setShowDownloads(true);
              setInputValue(result.url);
              return;
            }

            if (result && result.url) {
                updateTab(activeTabId, { url: result.url, title: 'Carregando...' });
                setTimeout(() => { webviewRefs.current[activeTabId]?.loadURL(result.url); }, 10);
            }
        } catch (err) { console.error(err); }
    };
    
    // Task Monitor Loop
    useEffect(() => {
      if (showTasks) {
        const interval = setInterval(async () => {
          const m = await window.nexusAPI.getAppMetrics();
          setTaskMetrics(m);
        }, 2000);
        return () => clearInterval(interval);
      }
    }, [showTasks]);

    const addTab = () => {
        const id = Math.random().toString(36).substr(2, 9);
        setTabs(prev => [...prev, { id, url: 'nexus:newtab', title: 'Nova Guia', isLoading: false, canGoBack: false, canGoForward: false, progress: 0 }]);
        setActiveTabId(id);
    };

    const handleCloseTab = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (tabs.length === 1) return;
        const index = tabs.findIndex(t => t.id === id);
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTabId === id) setActiveTabId(newTabs[index === 0 ? 0 : index - 1].id);
        delete webviewRefs.current[id];
    };

    const updateTab = (id: string, fields: Partial<Tab>) => {
        setTabs(current => current.map(t => t.id === id ? { ...t, ...fields } : t));
    };

    const setupWebview = (id: string, webview: HTMLWebViewElement | null) => {
        if (!webview || webviewRefs.current[id]) return;
        webviewRefs.current[id] = webview;

        const updateState = () => {
            const wv = webview as any;
            if (!wv.getURL) return;
            const url = wv.getURL();
            updateTab(id, { 
              isLoading: wv.isLoading(), 
              title: wv.getTitle() || 'Nexus Tab', 
              url, 
              canGoBack: wv.canGoBack(), 
              canGoForward: wv.canGoForward() 
            });
            if (id === activeTabId) setInputValue(url);
        };

        webview.addEventListener('did-stop-loading', updateState);
        webview.addEventListener('did-navigate', updateState);
        webview.addEventListener('did-navigate-in-page', updateState);
        webview.addEventListener('did-start-loading', () => updateTab(id, { isLoading: true }));
    };

    return (
        <div className="full-browser-env" onClick={() => { setShowMenu(false); setShowDropdown(false); }}>
            <header className="browser-tabs-row">
                <div className="tab-container-scroll">
                    {tabs.map(tab => (
                        <div key={tab.id} className={`browser-tab ${tab.id === activeTabId ? 'active' : ''}`} onClick={() => setActiveTabId(tab.id)} style={{ borderTop: tab.id === activeTabId ? `3px solid ${browserAccent}` : 'none' }}>
                            <Globe size={13} className={tab.isLoading ? 'spin' : ''} />
                            <span className="tab-title">{tab.title}</span>
                            <X size={12} className="tab-close" onClick={(e) => handleCloseTab(tab.id, e)} />
                        </div>
                    ))}
                    <button className="add-tab-btn" onClick={addTab}><Plus size={16} /></button>
                </div>
            </header>

            <nav className="main-nav-toolbar">
                <div className="nav-controls-group">
                    <button className="toolbar-btn" onClick={() => webviewRefs.current[activeTabId]?.goBack()} disabled={!activeTab.canGoBack}><ArrowLeft size={18} /></button>
                    <button className="toolbar-btn" onClick={() => webviewRefs.current[activeTabId]?.goForward()} disabled={!activeTab.canGoForward}><ArrowRight size={18} /></button>
                    <button className="toolbar-btn" onClick={() => webviewRefs.current[activeTabId]?.reload()}><RotateCw size={18} /></button>
                    <button className="toolbar-btn" onClick={() => updateTab(activeTabId, { url: 'nexus:newtab' })}><Home size={18} /></button>
                </div>
                
                <div className="address-bar-wrapper">
                    <form className="browser-address-bar" onSubmit={handleNavigate} onClick={(e) => e.stopPropagation()}>
                        <Lock size={12} className="security-icon" style={{ color: activeTab.url.startsWith('https') ? '#00ffca' : '#ff531b' }} />
                        <input 
                          type="text" 
                          className="address-input" 
                          value={inputValue} 
                          onChange={(e) => { setInputValue(e.target.value); setShowDropdown(true); }} 
                          onFocus={(e) => { e.target.select(); if (inputValue) setShowDropdown(true); }}
                          spellCheck="false" 
                          placeholder="Digite uma URL" 
                        />
                        <button 
                            type="button" 
                            className="star-btn" 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                window.nexusAPI.saveBookmark({ url: activeTab.url, title: activeTab.title }).then(() => refreshBookmarks());
                            }}
                            style={{ color: bookmarks.some(b => b.url === activeTab.url) ? browserAccent : '#9aa0a6' }}
                        >
                            <Star size={14} fill={bookmarks.some(b => b.url === activeTab.url) ? browserAccent : 'none'} />
                        </button>
                    </form>
                    <AnimatePresence>
                      {showDropdown && <OmniboxDropdown query={inputValue} accent={browserAccent} onSelect={(q, e) => { setInputValue(q); handleNavigate(undefined, q, e); }} onClear={() => { setInputValue(''); setShowDropdown(false); }} />}
                    </AnimatePresence>
                </div>

                <div className="toolbar-actions-group">
                    {isUpdateReady && (
                        <motion.button 
                           initial={{ opacity: 0, scale: 0.5 }}
                           animate={{ opacity: 1, scale: 1 }}
                           className="update-notif-btn" 
                           onClick={() => window.nexusAPI.applyUpdate()}
                        >
                            <Zap size={14} fill={browserAccent} />
                            <span>Atualizar</span>
                        </motion.button>
                    )}
                    <motion.div 
                        key={shieldBlocked}
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.3 }}
                        className="shield-stat-badge"
                    >
                        <ShieldCheck size={16} />
                        <span>{shieldBlocked}</span>
                    </motion.div>
                    <div className="user-avatar-stub">VH</div>
                    <button className="toolbar-btn" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}><MenuIcon size={18} /></button>
                </div>
                <AnimatePresence>{showMenu && <ChromeMenu 
                    onAddTab={addTab} 
                    onShowSettings={() => { setShowSettings(true); setShowMenu(false); }} 
                    onShowDownloads={() => { setShowDownloads(true); setShowMenu(false); }} 
                    onShowHistory={() => { setShowHistory(true); setShowMenu(false); refreshHistory(); }}
                    onShowBookmarks={() => { setShowBookmarks(true); setShowMenu(false); refreshBookmarks(); }}
                    onCheckUpdate={() => { 
                        setUpdateStatus('checking');
                        window.nexusAPI.checkForUpdates(); 
                        setShowMenu(false); 
                    }} 
                    onDevTools={() => { window.nexusAPI.toggleDevTools(); setShowMenu(false); }}
                    onZoom={(f) => setZoomFactor(prev => prev + f)} 
                    zoomFactor={zoomFactor} 
                />}</AnimatePresence>
            </nav>

            {/* --- UPDATE NOTIFICATION BANNER --- */}
            <AnimatePresence>
                {updateStatus !== 'idle' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`update-status-banner ${updateStatus}`}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {updateStatus === 'checking' && <span>🔄 Buscando atualizações...</span>}
                            {updateStatus === 'latest' && <span>✅ Você já está na versão mais recente!</span>}
                            {updateStatus === 'available' && <span>📦 Nova atualização encontrada!</span>}
                            {updateStatus === 'ready' && <span>🚀 Atualização pronta para instalar!</span>}
                            {updateStatus === 'error' && <span>⚠️ Erro ao buscar atualizações.</span>}
                        </div>
                        <button onClick={() => setUpdateStatus('idle')} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}>
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="browser-viewport">
                {showDownloads ? (
                    <DownloadsPage accent={browserAccent} downloads={downloads} onBack={() => setShowDownloads(false)} onOpen={(p) => window.nexusAPI.openDownload(p)} />
                ) : showTasks ? (
                    <TaskManagerPage accent={browserAccent} metrics={taskMetrics} onClose={() => setShowTasks(false)} />
                ) : showDiagnostics ? (
                   <DiagnosticsPage accent={browserAccent} onClose={() => setShowDiagnostics(false)} />
                ) : showHistory ? (
                    <HistoryPage accent={browserAccent} history={history} onBack={() => setShowHistory(false)} onNavigate={(u) => { setShowHistory(false); handleNavigate(undefined, u); }} onDelete={(idx) => window.nexusAPI.deleteHistoryItem(idx).then(() => refreshHistory())} onClear={() => window.nexusAPI.clearHistory().then(() => refreshHistory())} />
                ) : showBookmarks ? (
                    <BookmarksPage accent={browserAccent} bookmarks={bookmarks} onBack={() => setShowBookmarks(false)} onNavigate={(u) => { setShowBookmarks(false); handleNavigate(undefined, u); }} onDelete={(u) => window.nexusAPI.deleteBookmark(u).then(() => refreshBookmarks())} />
                ) : (
                    tabs.map(tab => (
                        <div key={tab.id} style={{ display: tab.id === activeTabId ? 'block' : 'none', width: '100%', height: '100%' }}>
                            {tab.url === 'nexus:newtab' ? (
                                <NexusSearchPage accent={browserAccent} searchEngine={SEARCH_ENGINE} onSearch={(q) => handleNavigate(undefined, q)} onShowSettings={() => setShowSettings(true)} />
                            ) : (
                                <webview ref={(el) => setupWebview(tab.id, el as HTMLWebViewElement)} src={tab.url} style={{ width: '100%', height: '100%' }} partition="persist:browser-main" className="webview-content" />
                            )}
                        </div>
                    ))
                )}
            </main>

            <AnimatePresence>
                {showSettings && (
                    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="chrome-style-sidebar">
                        <header className="sidebar-header">
                            <h2>Personalizar o Nexus</h2>
                            <X size={20} onClick={() => setShowSettings(false)} className="close-btn" />
                        </header>
                        <div className="sidebar-content">
                            <div className="appearance-card">
                                <h3>Aparência</h3>
                                <div className="browser-preview-stub" style={{ background: `linear-gradient(to bottom, ${browserAccent}33, #1e1e1e)` }}>
                                    <div className="preview-top-bar" style={{ background: browserAccent }}></div>
                                </div>
                                <button className="change-theme-btn"><Palette size={16} /> Mudar tema</button>
                            </div>
                            <div className="theme-selector-group">
                                {['Claro', 'Escuro', 'Dispositivo'].map(m => (
                                    <button key={m} className={themeMode === m.toLowerCase() ? 'active' : ''} onClick={() => setThemeMode(m.toLowerCase() as any)}>{m}</button>
                                ))}
                            </div>
                            <div className="color-grid">
                                {['#00ccff', '#ff1b1b', '#00ff8c', '#ff00ff', '#ffd700', '#ffffff', '#444444', '#ff8400', '#0044ff', '#00ffcc', '#e1ff00', '#8800ff'].map(color => (
                                    <div key={color} className={`color-circle ${browserAccent === color ? 'active' : ''}`} onClick={() => setBrowserAccent(color)} style={{ backgroundColor: color }}>
                                        {browserAccent === color && <div className="check-mark">✓</div>}
                                    </div>
                                ))}
                            </div>
                            <div className="sidebar-option-row"><span>Barra de ferramentas</span><ArrowRight size={16} /></div>
                            <div className="sidebar-option-row"><span>Atalhos</span><ArrowRight size={16} /></div>
                            
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                className="done-btn-settings" 
                                onClick={() => setShowSettings(false)}
                                style={{ marginTop: '20px', background: browserAccent }}
                            >
                                Concluído
                            </motion.button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
};

export default App;
