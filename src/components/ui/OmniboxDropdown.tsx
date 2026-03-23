import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, X } from 'lucide-react';

export const OmniboxDropdown: React.FC<{ 
  query: string, 
  onSelect: (q: string, engine?: string) => void,
  onClear?: () => void,
  accent: string
}> = ({ query, onSelect, onClear, accent }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        const results = await window.nexusAPI.getSuggestions(query);
        setSuggestions(results.slice(0, 10)); 
      } else {
        setSuggestions([]);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  if (!query.trim()) return null;
  
  return (
    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="omnibox-dropdown-google shadow-2xl">
      <div className="google-dd-header">
         <div className="header-query">
            <Search size={16} className="g-search-icon" />
            <span className="g-query-text">{query}</span>
         </div>
         <div className="header-right-actions">
           {onClear && (
             <button type="button" className="g-clear-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClear(); }}>
               <X size={16} />
             </button>
           )}
           <button type="button" className="g-modo-ia" style={{ borderColor: accent, color: accent }}>
              <Sparkles size={14} /> Modo IA
           </button>
         </div>
      </div>

      <div className="google-dd-list">
        {suggestions.length > 0 ? suggestions.map((s, i) => (
          <div key={i} className="g-suggestion-item" onClick={() => onSelect(s)}>
             <Search size={16} className="g-search-icon-item" />
             <span>{s}</span>
          </div>
        )) : (
          <div className="g-suggestion-item" onClick={() => onSelect(query)}>
             <Search size={16} className="g-search-icon-item" />
             <span>{query}</span>
          </div>
        )}
      </div>

      <div className="google-dd-footer">
         <button type="button" className="g-footer-btn" onClick={() => onSelect(query, 'google')}>Pesquisa Google</button>
         <button type="button" className="g-footer-btn" onClick={() => onSelect(query, 'google')}>Estou com sorte</button>
      </div>
    </motion.div>
  );
};
