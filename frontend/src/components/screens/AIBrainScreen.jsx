import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStream } from '../../hooks/useStream';
import SearchBar from '../shared/SearchBar';
import StepIndicator from '../brain/StepIndicator';
import ThinkingStream from '../brain/ThinkingStream';

export default function AIBrainScreen() {
  const navigate = useNavigate();
  const [ticker, setTicker] = useState('');
  const [inputVal, setInputVal] = useState('');
  const stream = useStream();

  const handleAnalyze = (t) => {
    const tk = t || inputVal;
    if (!tk) return;
    setTicker(tk.toUpperCase());
    stream.startStream(tk.toUpperCase(), '1M');
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-4 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-purple to-teal bg-clip-text text-transparent mb-2">
          🧠 AI Brain
        </h1>
        <p className="text-sm text-text2">Watch the AI think out loud about any stock</p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <SearchBar onSelect={(t) => { setInputVal(t); handleAnalyze(t); }} placeholder="Analyze any stock..." />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL'].map(t => (
          <button key={t} onClick={() => handleAnalyze(t)}
            className="px-3 py-1.5 text-xs bg-bg3 border border-border rounded-lg text-text2 hover:text-purple2 hover:border-purple/30 transition-all">
            {t}
          </button>
        ))}
      </div>

      {/* Source scan cards */}
      {stream.isStreaming && stream.currentStep >= 1 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 animate-fadeup">
          {[
            { icon: '💬', name: 'StockTwits', color: '#1d9bf0' },
            { icon: '📰', name: 'News', color: '#0d9488' },
            { icon: '🧠', name: 'Alpha Vantage', color: '#f97316' },
            { icon: '📈', name: 'Trends', color: '#10b981' },
            { icon: '📊', name: 'Technical', color: '#9d5ff5' },
            { icon: '📅', name: 'Events', color: '#f59e0b' },
          ].map((s, i) => {
            const scanned = stream.currentStep >= 2;
            return (
              <div key={i} className="bg-card border border-border rounded-xl p-3 text-center transition-all"
                style={{ borderColor: scanned ? s.color + '40' : undefined }}>
                <div className="text-xl mb-1">{s.icon}</div>
                <p className="text-xs font-medium" style={{ color: scanned ? s.color : '#44445a' }}>{s.name}</p>
                <p className="text-[10px] text-text3">{scanned ? '✓ Scanned' : '...'}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Streaming reasoning */}
      {(stream.isStreaming || stream.isDone) && (
        <div className="animate-fadeup">
          <StepIndicator currentStep={stream.currentStep} isDone={stream.isDone} />
          <ThinkingStream text={stream.text} />
          {stream.isStreaming && (
            <div className="mt-3">
              <div className="h-1 bg-bg3 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple to-teal rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stream.currentStep / 5 * 100, 100)}%` }} />
              </div>
            </div>
          )}
          {stream.isDone && (
            <div className="mt-4 text-center">
              <button onClick={() => navigate(`/stock/${ticker}`)}
                className="px-6 py-2.5 bg-gradient-to-r from-purple to-teal rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity">
                View Full Analysis →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
