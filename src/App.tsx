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
  Search,
  Palette,
  Command,
  Maximize,
  Minus,
  LogOut,
  PlusCircle,
  Edit2,
  ShieldCheck,
  Download,
  DownloadCloud,
  FileText,
  ExternalLink,
  Zap
} from 'lucide-react';

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
      applyUpdate: () => Promise<void>;
      checkForUpdates: () => Promise<any>;
    };
  }
}

interface DownloadItem {
  id: string;
  name: string;
  url: string;
  total: number;
  received: number;
  state: 'progressing' | 'completed' | 'failed' | 'interrupted';
  path: string;
}

interface Tab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  progress: number;
}

// Sub-components
const NexusSearchPage: React.FC<{ 
  onSearch: (q: string, e?: string) => void, 
  onShowSettings: () => void,
  searchEngine: string,
  accent: string 
}> = ({ onSearch, onShowSettings, accent }) => {
    const [q, setQ] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    return (
        <div className="nexus-new-tab-page premium-ntp" onClick={() => setShowSuggestions(false)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="search-container">
                <div className="brand-logo-large">
                    <Command size={64} style={{ color: accent }} />
                    <span>NEXUS</span>
                </div>
                <div className="ntp-search-wrapper" style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
                    <form className="search-box-ntp" onSubmit={(e) => { e.preventDefault(); onSearch(q); }} onClick={(e) => e.stopPropagation()}>
                        <Search size={20} className="search-icon-ntp" />
                        <input 
                            type="text" 
                            placeholder="Pesquise no Google..." 
                            value={q} 
                            onChange={(e) => { setQ(e.target.value); setShowSuggestions(true); }} 
                            onFocus={() => { if(q) setShowSuggestions(true); }}
                        />
                    </form>
                    <AnimatePresence>
                        {showSuggestions && (
                            <div className="ntp-dropdown-pos" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100 }}>
                                <OmniboxDropdown query={q} accent={accent} onSelect={(val, engine) => { setQ(val); onSearch(val, engine); setShowSuggestions(false); }} />
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
            <button className="personalize-btn-ntp" onClick={onShowSettings}>
                <Edit2 size={14} /> Personalizar o Nexus
            </button>
        </div>
    );
};

const OmniboxDropdown: React.FC<{ 
  query: string, 
  onSelect: (q: string, engine?: string) => void,
  accent: string
}> = ({ query, onSelect }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        const results = await window.nexusAPI.getSuggestions(query);
        setSuggestions(results.slice(0, 6));
      } else {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  if (!query.trim() || suggestions.length === 0) return null;
  
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="omnibox-dropdown shadow-2xl">
      <div className="dropdown-section">
        {suggestions.map((s, i) => (
          <div key={i} className="suggestion-item" onClick={() => onSelect(s)}><Search size={14} className="icon" /><span>{s}</span></div>
        ))}
        <div className="dropdown-divider" />
        <div className="engine-options-row">
            <span className="label">Pesquisar com:</span>
            <div className="engine-btns">
              <button onClick={() => onSelect(query, 'google')} style={{ color: '#4285F4' }}><Globe size={14}/> Google</button>
              <button onClick={() => onSelect(query, 'brave')} style={{ color: '#ff531b' }}><ShieldCheck size={14}/> Brave</button>
              <button onClick={() => onSelect(query, 'bing')} style={{ color: '#00a1f1' }}><Globe size={14}/> Bing</button>
              <button onClick={() => onSelect(query, 'duckduckgo')} style={{ color: '#de5833' }}><Search size={14}/> DuckDuckGo</button>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

const ChromeMenu: React.FC<{ 
    onAddTab: () => void, 
    onShowSettings: () => void,
    onShowDownloads: () => void,
    onCheckUpdate: () => void,
    onZoom: (factor: number) => void,
    zoomFactor: number 
}> = ({ onAddTab, onShowSettings, onShowDownloads, onCheckUpdate, onZoom, zoomFactor }) => (
    <motion.div initial={{ opacity: 0, scale: 0.98, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="nexus-chrome-menu">
        <div className="menu-banner">Defina o Nexus como seu navegador padrão</div>
        <div className="menu-group">
            <div className="menu-item" onClick={onAddTab}><PlusCircle size={16} /> <span>Nova guia</span> <span className="shortcut">Ctrl+T</span></div>
            <div className="menu-item"><Plus size={16} /> <span>Nova janela</span> <span className="shortcut">Ctrl+N</span></div>
            <div className="menu-item" onClick={onShowDownloads}><Download size={16} /> <span>Downloads</span> <span className="shortcut">Ctrl+J</span></div>
        </div>
        <div className="menu-divider" />
        <div className="menu-zoom-bar">
            <span>Zoom</span>
            <div className="zoom-ctrl">
                <button onClick={() => onZoom(-0.1)}><Minus size={14} /></button>
                <span className="zoom-val">{Math.round(zoomFactor * 100)}%</span>
                <button onClick={() => onZoom(0.1)}><Plus size={14} /></button>
            </div>
            <Maximize size={16} />
        </div>
        <div className="menu-divider" />
        <div className="menu-group">
            <div className="menu-item" onClick={onCheckUpdate}><Zap size={16} /> <span>Verificar atualizações</span></div>
            <div className="menu-item" onClick={onShowSettings}><Settings size={16} /> <span>Configurações</span></div>
            <div className="menu-item" onClick={() => window.close()}><LogOut size={16} /> <span>Sair</span></div>
        </div>
    </motion.div>
);

const DownloadsPage: React.FC<{ 
    downloads: DownloadItem[], 
    onOpen: (path: string) => void,
    onBack: () => void,
    accent: string 
}> = ({ downloads, onOpen, onBack, accent }) => (
    <div className="nexus-downloads-page">
        <header className="downloads-header">
            <div className="header-left">
                <DownloadCloud size={24} style={{ color: accent }} />
                <h1>Downloads</h1>
            </div>
            <button className="back-to-home" onClick={onBack}><X size={20} /></button>
        </header>
        <div className="downloads-list">
            {downloads.length === 0 ? (
                <div className="empty-downloads">
                    <Download size={48} className="icon-empty" />
                    <p>Nenhum download encontrado</p>
                </div>
            ) : (
                downloads.map(dl => (
                    <div key={dl.id} className="download-item-row" onClick={() => dl.state === 'completed' && onOpen(dl.path)}>
                        <FileText size={20} className="file-icon" />
                        <div className="download-info">
                            <span className="file-name">{dl.name}</span>
                            <div className="dl-url-meta">{dl.url}</div>
                            {dl.state === 'progressing' && (
                                <div className="dl-progress-container">
                                    <div className="dl-progress-bar" style={{ width: `${(dl.received / dl.total) * 100}%`, backgroundColor: accent }}></div>
                                    <span className="dl-perc">{Math.round((dl.received / dl.total) * 100)}%</span>
                                </div>
                            )}
                            <span className={`dl-state ${dl.state}`}>{dl.state === 'completed' ? 'Concluído' : dl.state === 'progressing' ? 'Baixando...' : 'Falhou'}</span>
                        </div>
                        {dl.state === 'completed' && <ExternalLink size={16} className="open-icon" />}
                    </div>
                ))
            ).reverse()}
        </div>
    </div>
);

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

    const SEARCH_ENGINE = 'google';
    const webviewRefs = useRef<Record<string, any>>({});
    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

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
        });
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
        } else if (activeTab && activeTab.url === 'nexus:newtab' && !showDropdown) {
            setInputValue('');
        }
    }, [activeTabId, activeTab, showDropdown, inputValue]);

    const handleNavigate = async (e?: React.FormEvent, customQuery?: string, customEngine?: string) => {
        if (e) e.preventDefault();
        const query = (customQuery || inputValue).trim();
        if (!query) return;
        setShowDropdown(false);
        try {
            const result = await window.nexusAPI.resolveNavigation(query, customEngine || SEARCH_ENGINE);
            if (result && result.url) {
                updateTab(activeTabId, { url: result.url, title: 'Carregando...' });
                setTimeout(() => { webviewRefs.current[activeTabId]?.loadURL(result.url); }, 10);
            }
        } catch (err) { console.error(err); }
    };

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
                    </form>
                    <AnimatePresence>
                      {showDropdown && <OmniboxDropdown query={inputValue} accent={browserAccent} onSelect={(q, e) => { setInputValue(q); handleNavigate(undefined, q, e); }} />}
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
                <AnimatePresence>{showMenu && <ChromeMenu onAddTab={addTab} onShowSettings={() => setShowSettings(true)} onShowDownloads={() => setShowDownloads(true)} onCheckUpdate={() => window.nexusAPI.checkForUpdates()} onZoom={(f) => setZoomFactor(prev => prev + f)} zoomFactor={zoomFactor} />}</AnimatePresence>
            </nav>

            <main className="browser-viewport">
                {showDownloads ? (
                    <DownloadsPage accent={browserAccent} downloads={downloads} onBack={() => setShowDownloads(false)} onOpen={(p) => window.nexusAPI.openDownload(p)} />
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
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
};

export default App;
