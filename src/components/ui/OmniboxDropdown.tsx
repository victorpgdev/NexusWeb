import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, ShieldCheck } from 'lucide-react';

export const OmniboxDropdown: React.FC<{ 
  query: string, 
  onSelect: (q: string, engine?: string) => void,
  accent: string
}> = ({ query, onSelect, accent }) => {
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

  if (!query.trim()) return null;
  
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="omnibox-dropdown shadow-2xl">
      <div className="dropdown-section">
        {suggestions.length > 0 && suggestions.map((s, i) => (
          <div key={i} className="suggestion-item" onClick={() => onSelect(s)}><Search size={14} className="icon" /><span>{s}</span></div>
        ))}
        {suggestions.length > 0 && <div className="dropdown-divider" />}
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
