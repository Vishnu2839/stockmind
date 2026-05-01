import { useNavigate } from 'react-router-dom';
import SparkLine from '../chart/SparkLine';

export default function StockRow({ stock, showVerdict = true }) {
  const navigate = useNavigate();
  const ticker = stock?.ticker || '';
  const name = stock?.company_name || ticker;
  const price = stock?.current_price || 0;
  const change = stock?.price_change_pct || 0;
  const isUp = change >= 0;

  const letter = ticker.charAt(0);
  const colors = ['#7c3aed','#0d9488','#3b82f6','#f97316','#ef4444','#10b981','#f59e0b'];
  const color = colors[ticker.charCodeAt(0) % colors.length];

  return (
    <div
      onClick={() => navigate(`/stock/${ticker}`)}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-border2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{ backgroundColor: color + '22', color: color }}
      >
        {letter}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text">{ticker}</span>
          {showVerdict && stock?.predictions?.['1D'] && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
              stock.predictions['1D'].direction === 'UP'
                ? 'bg-green/10 text-green' : 'bg-red/10 text-red'
            }`}>
              {stock.predictions['1D'].direction === 'UP' ? 'BUY' : 'SELL'}
            </span>
          )}
        </div>
        <p className="text-xs text-text3 truncate">{name}</p>
      </div>
      <div className="w-16 h-8 shrink-0">
        <SparkLine data={stock?.sparkline || []} color={isUp ? '#10b981' : '#ef4444'} />
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-mono font-semibold">${price.toFixed(2)}</p>
        <p className={`text-xs font-mono font-medium ${isUp ? 'text-green' : 'text-red'}`}>
          {isUp ? '+' : ''}{change.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
