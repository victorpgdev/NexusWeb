import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Plus, History as HistoryIcon, Star, Download, Minus, Zap, Terminal, Settings, LogOut } from 'lucide-react';

export const ChromeMenu: React.FC<{ 
    onAddTab: () => void, 
    onShowSettings: () => void,
    onShowDownloads: () => void,
    onShowHistory: () => void,
    onShowBookmarks: () => void,
    onCheckUpdate: () => void,
    onDevTools: () => void,
    onZoom: (factor: number) => void,
    zoomFactor: number 
}> = ({ onAddTab, onShowSettings, onShowDownloads, onShowHistory, onShowBookmarks, onCheckUpdate, onDevTools, onZoom, zoomFactor }) => (
    <motion.div initial={{ opacity: 0, scale: 0.98, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="nexus-chrome-menu">
        <div className="menu-banner">Defina o Nexus como seu navegador padrão</div>
        <div className="menu-group">
            <div className="menu-item" onClick={onAddTab}><PlusCircle size={16} /> <span>Nova guia</span> <span className="shortcut">Ctrl+T</span></div>
            <div className="menu-item"><Plus size={16} /> <span>Nova janela</span> <span className="shortcut">Ctrl+N</span></div>
            <div className="menu-divider" />
            <div className="menu-item" onClick={onShowHistory}><HistoryIcon size={16} /> <span>Histórico</span> <span className="shortcut">Ctrl+H</span></div>
            <div className="menu-item" onClick={onShowBookmarks}><Star size={16} /> <span>Favoritos</span> <span className="shortcut">Ctrl+Shift+B</span></div>
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
        </div>
        <div className="menu-divider" />
        <div className="menu-group">
            <div className="menu-item" onClick={onCheckUpdate}><Zap size={16} /> <span>Verificar atualizações</span></div>
            <div className="menu-item" onClick={onDevTools}><Terminal size={16} /> <span>Inspecionar elemento</span> <span className="shortcut">F12</span></div>
            <div className="menu-item" onClick={onShowSettings}><Settings size={16} /> <span>Configurações</span></div>
            <div className="menu-item" onClick={() => window.close()}><LogOut size={16} /> <span>Sair</span></div>
        </div>
    </motion.div>
);
