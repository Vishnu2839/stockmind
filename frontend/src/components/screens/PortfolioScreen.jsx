import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWatchlist } from '../../api/stockApi';
import { usePortfolio } from '../../hooks/usePortfolio';

export default function PortfolioScreen() {
  const navigate = useNavigate();
  const { balance, holdings, buyStock, sellStock } = usePortfolio();
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  // Trade logic moved to StockDetail
  const [tradeLoading, setTradeLoading] = useState(false);

  useEffect(() => {
    if (holdings.length === 0) {
      setLoading(false);
      return;
    }
    const tickers = holdings.map(h => h.ticker).join(',');
    fetchWatchlist(tickers)
      .then(d => {
        const pm = {};
        (d.watchlist || []).forEach(s => { pm[s.ticker] = s.current_price; });
        setPrices(pm);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [holdings]);

  const handleTrade = async (e) => {
    // Moved to StockDetail
  };

  const holdingsWithPL = holdings.map(h => {
    const current = prices[h.ticker] || h.avgBuy;
    const value = current * h.shares;
    const cost = h.avgBuy * h.shares;
    const pl = value - cost;
    const plPct = cost > 0 ? (pl / cost) * 100 : 0;
    return { ...h, current, value, pl, plPct };
  });

  const totalInvestedValue = holdingsWithPL.reduce((sum, h) => sum + h.value, 0);
  const totalCost = holdingsWithPL.reduce((sum, h) => sum + h.avgBuy * h.shares, 0);
  const totalPL = totalInvestedValue - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  const totalPortfolioValue = balance + totalInvestedValue;

  // Donut chart data (using invested value)
  const donutSegments = holdingsWithPL.map((h, i) => {
    const pct = totalInvestedValue > 0 ? (h.value / totalInvestedValue) * 100 : 0;
    const colors = ['#7c3aed', '#0d9488', '#10b981', '#3b82f6', '#f97316', '#ef4444', '#f59e0b'];
    return { ticker: h.ticker, pct, color: colors[i % colors.length] };
  });

  let cumAngle = 0;
  const donutPaths = donutSegments.map(seg => {
    const startAngle = cumAngle;
    const angle = (seg.pct / 100) * 360;
    cumAngle += angle;
    return { ...seg, startAngle, angle };
  });

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-4">
      <h1 className="text-lg font-bold font-display">Portfolio</h1>

      {/* Portfolio total + donut */}
      <div className="bg-gradient-to-br from-purple/20 to-teal/10 border border-purple/30 rounded-xl p-5 animate-fadeup">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <p className="text-xs text-text3 uppercase tracking-wider mb-1">Net Worth</p>
            <p className="text-3xl font-mono font-bold">${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-mono ${totalPL >= 0 ? 'text-green' : 'text-red'}`}>
                {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
              </span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${totalPL >= 0 ? 'bg-green/10 text-green' : 'bg-red/10 text-red'}`}>
                {totalPLPct >= 0 ? '+' : ''}{totalPLPct.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-text3 mt-2">Cash Balance: <span className="font-mono text-text">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
          </div>
          {/* Simple donut */}
          {donutSegments.length > 0 && (
            <svg width="90" height="90" viewBox="0 0 90 90">
              {donutPaths.map((seg, i) => {
                const r = 35;
                const cx = 45, cy = 45;
                const startRad = (seg.startAngle - 90) * Math.PI / 180;
                const endRad = (seg.startAngle + seg.angle - 90) * Math.PI / 180;
                const largeArc = seg.angle > 180 ? 1 : 0;
                const x1 = cx + r * Math.cos(startRad);
                const y1 = cy + r * Math.sin(startRad);
                const x2 = cx + r * Math.cos(endRad);
                const y2 = cy + r * Math.sin(endRad);
                return (
                  <path key={i}
                    d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={seg.color} opacity="0.8" stroke="#05050f" strokeWidth="1" />
                );
              })}
              <circle cx="45" cy="45" r="20" fill="#05050f" />
              <text x="45" y="48" textAnchor="middle" fontSize="10" fill="#f0f0ff" fontFamily="JetBrains Mono" fontWeight="bold">
                {holdingsWithPL.length}
              </text>
            </svg>
          )}
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {donutSegments.map(seg => (
            <div key={seg.ticker} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }}></div>
              <span className="text-[10px] text-text3">{seg.ticker} {seg.pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Holdings list */}
      <div>
        <h2 className="text-sm font-bold text-text mb-2">Your Holdings</h2>
        {loading ? (
          <div className="text-center py-8 text-text3">Loading...</div>
        ) : holdingsWithPL.length === 0 ? (
          <div className="text-center py-8 text-text3 bg-card border border-border border-dashed rounded-xl">
            No holdings yet. Start playing by trading some stocks above!
          </div>
        ) : (
          <div className="space-y-2">
            {holdingsWithPL.map((h, i) => (
              <div key={h.ticker}
                onClick={() => navigate(`/stock/${h.ticker}`)}
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-border2 transition-all animate-fadeup"
                style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <div className="w-10 h-10 rounded-lg bg-purple/10 flex items-center justify-center text-sm font-bold text-purple2">
                  {h.ticker.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{h.ticker}</p>
                  <p className="text-[10px] text-text3">{h.shares} shares · avg ${h.avgBuy.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold">${h.value.toFixed(2)}</p>
                  <p className={`text-xs font-mono ${h.pl >= 0 ? 'text-green' : 'text-red'}`}>
                    {h.pl >= 0 ? '+' : ''}${h.pl.toFixed(2)} ({h.plPct.toFixed(1)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
