import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWatchlist, fetchAnalysis } from '../../api/stockApi';
import MoodBar from '../shared/MoodBar';
import StockRow from '../shared/StockRow';
import { usePortfolio } from '../../hooks/usePortfolio';

export default function HomeScreen() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [mood, setMood] = useState({ score: 50, label: 'NEUTRAL' });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { balance, holdings } = usePortfolio();
  const [prices, setPrices] = useState({});

  useEffect(() => {
    if (holdings.length > 0) {
      const tickers = holdings.map(h => h.ticker).join(',');
      fetchWatchlist(tickers).then(d => {
        const pm = {};
        (d.watchlist || []).forEach(s => { pm[s.ticker] = s.current_price; });
        setPrices(pm);
      }).catch(() => {});
    }
  }, [holdings]);

  const portfolioValue = balance + holdings.reduce((sum, h) => sum + (h.shares * (prices[h.ticker] || h.avgBuy)), 0);

  useEffect(() => {
    const load = async () => {
      try {
        const wl = await fetchWatchlist('AAPL,TSLA,NVDA,MSFT,GOOGL');
        setWatchlist(wl.watchlist || []);
        // Get mood from first stock's emotion
        try {
          const analysis = await fetchAnalysis('AAPL');
          setMood({ score: analysis.emotion_score || 50, label: analysis.emotion_label || 'NEUTRAL' });
          // Generate alerts from analysis
          const alertsList = [];
          if (analysis.twitter?.sentiment_pct > 75 || analysis.twitter?.sentiment_pct < 25) {
            alertsList.push({
              ticker: 'AAPL', signal: `StockTwits ${analysis.twitter.sentiment_pct > 75 ? 'spike' : 'drop'} detected`,
              verdict: analysis.predictions?.['1D']?.direction === 'UP' ? 'BUY' : 'SELL',
              confidence: analysis.predictions?.['1D']?.confidence_pct || 65,
            });
          }
          if (analysis.technical?.rsi < 30 || analysis.technical?.rsi > 70) {
            alertsList.push({
              ticker: 'AAPL', signal: `RSI ${analysis.technical.rsi < 30 ? 'oversold' : 'overbought'} at ${analysis.technical.rsi?.toFixed(0)}`,
              verdict: analysis.technical.rsi < 30 ? 'BUY' : 'SELL',
              confidence: 72,
            });
          }
          // No fallback for real mode
          setAlerts(alertsList.slice(0, 3));
        } catch {}
      } catch (err) {
        console.error('Home load error:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-4 p-4 md:p-6 pb-20 md:pb-6">
      {/* Portfolio Card */}
      <div className="bg-gradient-to-br from-purple/20 to-teal/10 border border-purple/30 rounded-xl p-5 animate-fadeup flex justify-between items-center">
        <div>
          <p className="text-xs text-text3 uppercase tracking-wider mb-1">Total Net Worth</p>
          <p className="text-3xl font-mono font-bold text-text">${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-text3 uppercase mb-1">Cash Available</p>
          <p className="text-sm font-mono font-bold text-teal">${balance.toLocaleString('en-US')}</p>
        </div>
      </div>

      {/* Your Stocks */}
      {holdings.length > 0 && (
        <div className="animate-fadeup anim-delay-0.5">
          <h2 className="text-sm font-bold text-text mb-2 flex items-center gap-2">
            🚀 Your Stocks <span className="text-[10px] bg-purple/10 text-purple2 px-1.5 py-0.5 rounded">{holdings.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {holdings.map((h, i) => {
              const current = prices[h.ticker] || h.avgBuy;
              const pl = (current - h.avgBuy) * h.shares;
              const plPct = (pl / (h.avgBuy * h.shares)) * 100;
              return (
                <div key={h.ticker} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between hover:border-border2 transition-all cursor-pointer"
                  onClick={() => navigate(`/stock/${h.ticker}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center text-xs font-bold text-purple2">{h.ticker.charAt(0)}</div>
                    <div>
                      <p className="text-xs font-bold">{h.ticker}</p>
                      <p className="text-[9px] text-text3">{h.shares} shares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold">${current.toFixed(2)}</p>
                    <p className={`text-[9px] font-mono ${pl >= 0 ? 'text-green' : 'text-red'}`}>
                      {pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mood Bar */}
      <div className="animate-fadeup anim-delay-1">
        <MoodBar score={mood.score} label={mood.label} />
      </div>

      {/* AI Alerts */}
      <div className="animate-fadeup anim-delay-2">
        <h2 className="text-sm font-bold text-text mb-2">🧠 AI Alerts Today</h2>
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 hover:border-border2 transition-all">
              <div className="w-9 h-9 rounded-lg bg-purple/10 flex items-center justify-center text-xs font-bold text-purple2">{a.ticker}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text font-medium">{a.signal}</p>
                <p className="text-[10px] text-text3">{a.ticker}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${
                a.verdict === 'BUY' ? 'bg-green/10 text-green' :
                a.verdict === 'SELL' ? 'bg-red/10 text-red' : 'bg-amber/10 text-amber'
              }`}>{a.verdict} {a.confidence}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Watchlist */}
      <div className="animate-fadeup anim-delay-3">
        <h2 className="text-sm font-bold text-text mb-2">📋 Your Watchlist</h2>
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-text3">Loading watchlist...</div>
          ) : (
            watchlist.map((s) => <StockRow key={s.ticker} stock={s} showVerdict={false} />)
          )}
        </div>
      </div>
    </div>
  );
}
