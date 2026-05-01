import { useState, useEffect, useRef } from 'react';
import { fetchSearch } from '../../api/stockApi';

export default function SearchBar({ onSelect, placeholder = "Search any stock..." }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!query || query.length < 1) { setResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const data = await fetchSearch(query);
        setResults(data.results || []);
        setShow(true);
      } catch {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (ticker) => {
    setQuery('');
    setShow(false);
    if (onSelect) onSelect(ticker);
  };

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text3">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShow(true)}
          placeholder={placeholder}
          className="w-full bg-bg3 border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-text placeholder-text3 focus:outline-none focus:border-purple transition-colors"
        />
      </div>
      {show && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl overflow-hidden z-50 shadow-xl shadow-black/40">
          {results.map((r) => (
            <button
              key={r.ticker}
              onClick={() => handleSelect(r.ticker)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg3 transition-colors text-left"
            >
              <span className="text-sm font-bold text-purple2">{r.ticker}</span>
              <span className="text-sm text-text2 truncate">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
