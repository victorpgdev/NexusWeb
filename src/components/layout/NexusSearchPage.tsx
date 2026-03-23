import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Search, Edit2 } from 'lucide-react';
import { OmniboxDropdown } from '../ui/OmniboxDropdown';

export const NexusSearchPage: React.FC<{ 
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
