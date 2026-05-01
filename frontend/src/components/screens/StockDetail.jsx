import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStock } from '../../hooks/useStock';
import { useStream } from '../../hooks/useStream';
import { fetchBacktest } from '../../api/stockApi';
import PriceChart from '../chart/PriceChart';
import EvidenceGrid from '../evidence/EvidenceGrid';
import SourceModal from '../evidence/SourceModal';
import AIBrainPanel from '../brain/AIBrainPanel';
import VerdictCard from '../verdict/VerdictCard';
import AccuracyPanel from '../shared/AccuracyPanel';
import BacktestChart from '../shared/BacktestChart';
import { usePortfolio } from '../../hooks/usePortfolio';

export default function StockDetail() {
  const { ticker } = useParams();
  const { data, loading, error } = useStock(ticker);
  const stream = useStream();
  const [modalSource, setModalSource] = useState(null);
  const [backtest, setBacktest] = useState(null);

  const { balance, holdings, buyStock, sellStock } = usePortfolio();
  const [tradeShares, setTradeShares] = useState(1);
  const [tradeAction, setTradeAction] = useState('BUY');

  useEffect(() => {
    if (ticker) {
      fetchBacktest(ticker).then(setBacktest).catch(() => {});
    }
  }, [ticker]);

  const handleTrade = (e) => {
    e.preventDefault();
    if (!ticker || !tradeShares || tradeShares <= 0) return;
    const numShares = parseInt(tradeShares);
    const price = data.current_price || 0;

    if (tradeAction === 'BUY') {
      const success = buyStock(ticker, numShares, price);
      if (!success) alert("Insufficient balance!");
      else alert(`Bought ${numShares} shares of ${ticker}`);
    } else {
      const success = sellStock(ticker, numShares, price);
      if (!success) alert("Not enough shares to sell!");
      else alert(`Sold ${numShares} shares of ${ticker}`);
    }
  };

  const currentHolding = holdings.find(h => h.ticker === ticker);

  if (!ticker) return <div className="p-6 text-text3 text-center">Select a stock from Markets to view details.</div>;
  if (error) return <div className="p-6 text-red text-center">Error fetching intelligence: {error}</div>;
  if (!data) {
     return (
       <div className="p-6 flex flex-col items-center justify-center h-[60vh]">
         <div className="w-12 h-12 border-4 border-purple border-t-transparent rounded-full animate-spin mb-4"></div>
         <p className="text-text2 font-bold">Connecting to Market Data...</p>
       </div>
     );
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-4">
      {/* Stock Hero */}
      <div className="bg-card border border-border rounded-xl p-5 animate-fadeup">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-purple/10 flex items-center justify-center text-lg font-bold text-purple2">
            {ticker.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-bold font-display">{data.company_name || ticker}</h1>
            <p className="text-xs text-text3">{ticker} · {data.exchange}</p>
          </div>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-3xl font-mono font-bold">${data.current_price?.toFixed(2)}</span>
          <span className={`text-sm font-mono font-medium ${data.price_change_pct >= 0 ? 'text-green' : 'text-red'}`}>
            {data.price_change_pct >= 0 ? '+' : ''}${data.price_change?.toFixed(2)} ({data.price_change_pct?.toFixed(2)}%)
          </span>
        </div>
        <div className="flex gap-3 mt-3">
          {data.market_cap > 0 && <Tag label="Market Cap" value={formatMarketCap(data.market_cap)} />}
          {data.pe_ratio && <Tag label="P/E" value={data.pe_ratio?.toFixed(1)} />}
          {data.sector && <Tag label="Sector" value={data.sector} />}
        </div>
      </div>

      {/* Trade Widget */}
      <div className="bg-card border border-border rounded-xl p-4 animate-fadeup anim-delay-1">
        <h2 className="text-sm font-bold text-text mb-3">🎯 Trade {ticker}</h2>
        
        <div className="flex gap-4">
          {/* BUY Section */}
          <div className="flex-1 bg-bg3 rounded-xl p-3 border border-border">
            <p className="text-[10px] text-text3 uppercase mb-2">Buy {ticker}</p>
            <div className="flex gap-2">
              <input 
                type="number" 
                min="1"
                placeholder="Qty"
                value={tradeShares}
                onChange={e => setTradeShares(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg p-2 text-xs text-text font-mono focus:outline-none focus:border-green"
              />
              <button 
                onClick={() => {
                  if (!data.current_price || data.current_price <= 0) {
                    alert("Cannot buy: Market price unavailable.");
                    return;
                  }
                  const success = buyStock(ticker, parseInt(tradeShares), data.current_price);
                  if (success) alert(`Bought ${tradeShares} shares`);
                  else alert("Insufficient balance");
                }}
                className="bg-green hover:bg-green/90 text-white font-bold py-2 px-4 rounded-lg text-xs"
              >
                BUY
              </button>
            </div>
          </div>

          {/* SELL Section */}
          <div className="flex-1 bg-bg3 rounded-xl p-3 border border-border">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] text-text3 uppercase">Sell {ticker}</p>
              {currentHolding && (
                <span className="text-[9px] text-text2 font-bold">Owned: {currentHolding.shares}</span>
              )}
            </div>
            <div className="flex gap-2">
              <input 
                type="number" 
                min="1"
                placeholder="Qty"
                value={tradeShares}
                onChange={e => setTradeShares(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg p-2 text-xs text-text font-mono focus:outline-none focus:border-red"
              />
              <button 
                onClick={() => {
                  if (!data.current_price || data.current_price <= 0) {
                    alert("Cannot sell: Market price unavailable.");
                    return;
                  }
                  const success = sellStock(ticker, parseInt(tradeShares), data.current_price);
                  if (success) alert(`Sold ${tradeShares} shares`);
                  else alert("Not enough shares");
                }}
                disabled={!currentHolding}
                className="bg-red hover:bg-red/90 text-white font-bold py-2 px-4 rounded-lg text-xs disabled:opacity-30"
              >
                SELL
              </button>
            </div>
            {currentHolding && (
              <div className="mt-2 flex justify-between items-center">
                <p className="text-[9px] text-text3">P/L for trade:</p>
                <p className={`text-[9px] font-bold ${(data.current_price - currentHolding.avgBuy) >= 0 ? 'text-green' : 'text-red'}`}>
                  {(data.current_price - currentHolding.avgBuy) >= 0 ? '+' : ''}
                  ${((data.current_price - currentHolding.avgBuy) * parseInt(tradeShares || 0)).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
        <p className="text-[10px] text-text3 mt-2 text-center">
          Available Balance: <span className="text-text font-mono">${balance.toLocaleString('en-US')}</span>
        </p>
      </div>

      {/* Price Chart — 8 Predict Next buttons */}
      <div className="animate-fadeup anim-delay-1">
        <PriceChart ticker={ticker} predictions={data.predictions} currentPrice={data.current_price} />
      </div>

      {/* Evidence Grid — 6 cards */}
      <div className="animate-fadeup anim-delay-2">
        <h2 className="text-sm font-bold text-text mb-2">📡 Evidence Sources</h2>
        <EvidenceGrid data={data} onSourceClick={setModalSource} />
      </div>

      {/* Source Modal */}
      {modalSource && (
        <SourceModal sourceKey={modalSource} data={data} onClose={() => setModalSource(null)} />
      )}

      {/* AI Brain */}
      <div className="animate-fadeup anim-delay-3">
        <AIBrainPanel stream={stream} ticker={ticker} />
      </div>

      {/* Verdict */}
      {(stream.isDone || data.predictions) && (
        <VerdictCard predictions={data.predictions} />
      )}

      {/* Accuracy */}
      <div className="animate-fadeup anim-delay-4">
        <AccuracyPanel
          fullAcc={data.model_accuracy_with_emotion || 74.2}
          baseAcc={data.model_accuracy_without_emotion || 61.3}
          improvement={data.accuracy_improvement || 12.9}
        />
      </div>

      {/* Backtest */}
      {backtest && (
        <div className="animate-fadeup">
          <BacktestChart data={backtest} />
        </div>
      )}
    </div>
  );
}

function Tag({ label, value }) {
  return (
    <div className="bg-bg3 rounded-lg px-2.5 py-1">
      <span className="text-[10px] text-text3">{label}: </span>
      <span className="text-[10px] font-mono font-bold text-text2">{value}</span>
    </div>
  );
}

function formatMarketCap(val) {
  if (!val) return 'N/A';
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$` + val;
}
