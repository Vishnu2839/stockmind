import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWatchlist } from '../../api/stockApi';
import SearchBar from '../shared/SearchBar';
import StockRow from '../shared/StockRow';

const TICKERS = 'AAPL,TSLA,NVDA,MSFT,GOOGL,AMZN,META,NFLX';

export default function MarketsScreen() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist(TICKERS)
      .then(d => setStocks(d.watchlist || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (ticker) => {
    navigate(`/stock/${ticker}`);
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-4">
      <h1 className="text-lg font-bold font-display">Markets</h1>
      <SearchBar onSelect={handleSelect} placeholder="Search any stock..." />

      <div>
        <h2 className="text-sm font-bold text-text mb-2">📊 Trending Stocks</h2>
        {loading ? (
          <div className="text-center py-8 text-text3">Loading market data...</div>
        ) : (
          <div className="space-y-2">
            {stocks.map((s, i) => (
              <div key={s.ticker} className="animate-fadeup" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <StockRow stock={s} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
