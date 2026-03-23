import React from 'react';
import { DownloadCloud, Download, FileText, ExternalLink, X, Clock, Trash2, History as HistoryIcon, Activity, Info, Star } from 'lucide-react';
import type { HistoryItem, BookmarkItem, DownloadItem } from '../../types';

export const DownloadsPage: React.FC<{ 
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

export const HistoryPage: React.FC<{
    history: HistoryItem[],
    onDelete: (idx: number) => void,
    onClear: () => void,
    onNavigate: (url: string) => void,
    onBack: () => void,
    accent: string
}> = ({ history, onDelete, onClear, onNavigate, onBack, accent }) => (
    <div className="nexus-management-page">
        <header className="mgmt-header">
            <div className="header-left">
                <HistoryIcon size={24} style={{ color: accent }} />
                <h1>Histórico de Navegação</h1>
            </div>
            <div className="header-right">
                {history.length > 0 && <button className="clear-btn" onClick={onClear}><Trash2 size={16} /> Limpar tudo</button>}
                <button className="back-btn" onClick={onBack}><X size={20} /></button>
            </div>
        </header>
        <div className="mgmt-list">
            {history.length === 0 ? (
                <div className="empty-state"><Clock size={48} /><p>Nenhum histórico encontrado</p></div>
            ) : (
                history.map((item, idx) => (
                    <div key={idx} className="mgmt-item">
                        <div className="item-main" onClick={() => onNavigate(item.url)}>
                            <span className="item-title">{item.title}</span>
                            <span className="item-url">{item.url}</span>
                            <span className="item-time">{item.time}</span>
                        </div>
                        <button className="delete-btn" onClick={() => onDelete(idx)}><Trash2 size={16} /></button>
                    </div>
                ))
            )}
        </div>
    </div>
);

export const TaskManagerPage: React.FC<{
  metrics: any[],
  onClose: () => void,
  accent: string
}> = ({ metrics, onClose, accent }) => (
  <div className="nexus-management-page task-manager">
    <header className="mgmt-header">
      <div className="header-left">
        <Activity size={24} style={{ color: accent }} />
        <h1>Gerenciador de Tarefas do Nexus</h1>
      </div>
      <button className="back-btn" onClick={onClose}><X size={20} /></button>
    </header>
    <div className="task-grid">
      <table className="task-table">
        <thead>
          <tr>
            <th>Processo</th>
            <th>ID</th>
            <th>Memória (MB)</th>
            <th>CPU (%)</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m, i) => (
            <tr key={i}>
              <td><div className="process-type-tag" style={{ borderLeft: `3px solid ${accent}` }}>{m.type}</div></td>
              <td>{m.pid}</td>
              <td>{Math.round(m.memory.workingSetSize / 1024 / 1024)} MB</td>
              <td>{m.cpu?.percentCPUUsage || 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const DiagnosticsPage: React.FC<{
  onClose: () => void,
  accent: string
}> = ({ onClose, accent }) => (
  <div className="nexus-management-page diagnostics">
    <header className="mgmt-header">
      <div className="header-left">
        <Info size={24} style={{ color: accent }} />
        <h1>Sobre o Nexus (Infra Version)</h1>
      </div>
      <button className="back-btn" onClick={onClose}><X size={20} /></button>
    </header>
    <div className="diag-content">
      <div className="version-info-box">
        <div className="v-row"><span>Versão do Nexus:</span> <span>1.5.0 (Modular)</span></div>
        <div className="v-row"><span>Chromium Engine:</span> <span>112.0.5615.165</span></div>
        <div className="v-row"><span>Node.js Runtime:</span> <span>18.15.0</span></div>
        <div className="v-row"><span>Data do Build:</span> <span>Março 2026</span></div>
        <div className="v-row"><span>Status do Sandbox:</span> <span style={{ color: '#00ffaa' }}>Protegido (Active)</span></div>
      </div>
      <p className="legal-stub">Este navegador utiliza a base open-source do Chromium para fornecer uma experiência de navegação segura e de alto desempenho.</p>
    </div>
  </div>
);

export const BookmarksPage: React.FC<{
    bookmarks: BookmarkItem[],
    onDelete: (url: string) => void,
    onNavigate: (url: string) => void,
    onBack: () => void,
    accent: string
}> = ({ bookmarks, onDelete, onNavigate, onBack, accent }) => (
    <div className="nexus-management-page">
        <header className="mgmt-header">
            <div className="header-left">
                <Star size={24} style={{ color: accent }} />
                <h1>Favoritos</h1>
            </div>
            <button className="back-btn" onClick={onBack}><X size={20} /></button>
        </header>
        <div className="mgmt-list">
            {bookmarks.length === 0 ? (
                <div className="empty-state"><Star size={48} /><p>Você ainda não tem favoritos</p></div>
            ) : (
                bookmarks.map((bm, idx) => (
                    <div key={idx} className="mgmt-item">
                        <div className="item-main" onClick={() => onNavigate(bm.url)}>
                            <span className="item-title">{bm.title}</span>
                            <span className="item-url">{bm.url}</span>
                        </div>
                        <button className="delete-btn" onClick={() => onDelete(bm.url)}><Trash2 size={16} /></button>
                    </div>
                ))
            )}
        </div>
    </div>
);
