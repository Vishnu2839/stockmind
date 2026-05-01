import { useState, useEffect, useMemo } from 'react';
import { fetchHistorical } from '../../api/stockApi';

const HISTORY_BTNS = ['1W', '1M', '3M', '1Y', '5Y'];
const PREDICT_BTNS = ['1D', '1W', '1M', '3M', '6M', '1Y', '3Y', '5Y'];
const DAYS_MAP = { '1W': 7, '1M': 30, '3M': 90, '1Y': 365, '5Y': 1825 };

export default function PriceChart({ ticker, predictions, currentPrice }) {
  const [historyRange, setHistoryRange] = useState('1Y');
  const [predictTF, setPredictTF] = useState('1M');
  const [histData, setHistData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    fetchHistorical(ticker, DAYS_MAP[historyRange] || 365)
      .then(d => setHistData(d.data || []))
      .catch(() => setHistData([]))
      .finally(() => setLoading(false));
  }, [ticker, historyRange]);

  const pred = predictions?.[predictTF] || {};
  const predTarget = pred.predicted_price_target || currentPrice;
  const predLow = pred.price_low || predTarget * 0.95;
  const predHigh = pred.price_high || predTarget * 1.05;
  const predDir = pred.direction || 'UP';
  const predConf = pred.confidence_pct || 65;
  const expectedGain = pred.expected_gain_pct || 0;

  const W = 700, H = 260, PAD = 40;
  const chartW = W - PAD * 2, chartH = H - PAD * 2;

  const chart = useMemo(() => {
    const closes = (histData || []).map(d => d.close).filter(v => typeof v === 'number' && !isNaN(v));
    if (closes.length < 2) return null;

    const allVals = [...closes, predTarget, predLow, predHigh].filter(v => typeof v === 'number' && !isNaN(v));
    const minY = Math.min(...allVals) * 0.98;
    const maxY = Math.max(...allVals) * 1.02;
    const rangeY = (maxY - minY) || 1;

    // Total points: historical + 1 prediction point
    const totalPts = closes.length + 1;
    const scaleX = (i) => PAD + (i / (totalPts - 1)) * chartW;
    const scaleY = (v) => {
      const scaled = PAD + chartH - ((v - minY) / rangeY) * chartH;
      return isNaN(scaled) ? PAD + chartH : scaled;
    };

    // Historical line
    const histLine = closes.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ');
    const histArea = histLine + ` ${scaleX(closes.length - 1)},${H - PAD} ${scaleX(0)},${H - PAD}`;

    // Today marker
    const todayX = scaleX(closes.length - 1);
    const todayY = scaleY(closes[closes.length - 1]);

    // Prediction point
    const predX = scaleX(totalPts - 1);
    const predY = scaleY(predTarget);
    const predLowY = scaleY(predLow);
    const predHighY = scaleY(predHigh);

    // Y-axis labels
    const yLabels = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const val = minY + (rangeY / steps) * i;
      yLabels.push({ y: scaleY(val), label: `$${val.toFixed(0)}` });
    }

    return {
      histLine, histArea, todayX, todayY,
      predX, predY, predLowY, predHighY,
      yLabels, lastPrice: closes[closes.length - 1],
    };
  }, [histData, predTarget, predLow, predHigh]);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-3">
        <div>
          <p className="text-[10px] text-text3 mb-1 uppercase tracking-wider">View History</p>
          <div className="flex gap-1">
            {HISTORY_BTNS.map(b => (
              <button key={b} onClick={() => setHistoryRange(b)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  historyRange === b ? 'bg-purple text-white' : 'bg-bg3 text-text2 hover:text-text'
                }`}>{b}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-text3 mb-1 uppercase tracking-wider">Predict Next</p>
          <div className="flex gap-1 flex-wrap">
            {PREDICT_BTNS.map(b => (
              <button key={b} onClick={() => setPredictTF(b)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  predictTF === b ? 'bg-teal text-white' : 'bg-bg3 text-text2 hover:text-text'
                }`}>{b}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-sm font-bold font-mono ${predDir === 'UP' ? 'text-green' : 'text-red'}`}>
          {expectedGain > 0 ? '+' : ''}{expectedGain}% · {predConf}% confidence
        </span>
        <div className="flex items-center gap-2 text-xs text-text3">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-purple"></span>History</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-green border-dashed"></span>Prediction</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 bg-green/20 rounded"></span>Confidence</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: '400px' }}>
          <defs>
            <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {chart?.yLabels?.map((l, i) => (
            <g key={i}>
              <line x1={PAD} y1={l.y} x2={W - PAD} y2={l.y} stroke="#1a1a35" strokeWidth="0.5" />
              <text x={PAD - 5} y={l.y + 4} textAnchor="end" fontSize="9" fill="#44445a" fontFamily="JetBrains Mono">{l.label}</text>
            </g>
          ))}

          {chart && (
            <>
              {/* Historical area fill */}
              <polygon points={chart.histArea} fill="url(#histGrad)" />
              {/* Historical line */}
              <polyline points={chart.histLine} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinejoin="round" />
              {/* Today vertical line */}
              <line x1={chart.todayX} y1={PAD} x2={chart.todayX} y2={H - PAD}
                stroke="#7c3aed" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              <text x={chart.todayX} y={PAD - 6} textAnchor="middle" fontSize="9" fill="#7c3aed" fontFamily="JetBrains Mono">TODAY</text>
              {/* Today dot */}
              <circle cx={chart.todayX} cy={chart.todayY} r="4" fill="#7c3aed" stroke="#0d0d1f" strokeWidth="2" />

              {/* Confidence band */}
              <rect x={chart.todayX} y={chart.predHighY}
                width={chart.predX - chart.todayX} height={chart.predLowY - chart.predHighY}
                fill="url(#predGrad)" rx="4" />

              {/* Prediction dashed line */}
              <line x1={chart.todayX} y1={chart.todayY}
                x2={chart.predX} y2={chart.predY}
                stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" />

              {/* Prediction dot */}
              <circle cx={chart.predX} cy={chart.predY} r="4" fill="#10b981" stroke="#0d0d1f" strokeWidth="2" />
              <text x={chart.predX + 5} y={chart.predY + 4} fontSize="10" fill="#10b981"
                fontFamily="JetBrains Mono" fontWeight="bold">${predTarget.toFixed(2)}</text>
            </>
          )}

          {loading && (
            <text x={W/2} y={H/2} textAnchor="middle" fontSize="12" fill="#8888aa">Loading chart data...</text>
          )}
        </svg>
      </div>

      {/* Prediction details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
        {[
          { label: 'Price Target', value: `$${predTarget.toFixed(2)}`, color: predDir === 'UP' ? 'text-green' : 'text-red' },
          { label: 'Expected Gain', value: `${expectedGain > 0 ? '+' : ''}${expectedGain}%`, color: expectedGain >= 0 ? 'text-green' : 'text-red' },
          { label: 'Confidence', value: `${predConf}%`, color: 'text-purple2' },
          { label: 'Risk', value: pred.risk_level || 'MEDIUM', color: pred.risk_level === 'LOW' ? 'text-green' : pred.risk_level === 'HIGH' ? 'text-red' : 'text-amber' },
        ].map((c, i) => (
          <div key={i} className="bg-bg3 rounded-lg p-2.5">
            <p className="text-[10px] text-text3 uppercase">{c.label}</p>
            <p className={`text-sm font-mono font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Explanation */}
      {pred.explanation && (
        <div className="mt-3 bg-bg3 rounded-lg p-3">
          <p className="text-[10px] text-text3 uppercase mb-1">Explanation</p>
          <p className="text-xs text-text2 leading-relaxed">{pred.explanation}</p>
          <div className="flex gap-3 mt-2">
            <span className="text-[10px] text-text3">Model: <span className="text-purple2">{pred.model_used}</span></span>
            <span className="text-[10px] text-text3">Driver: <span className="text-amber">{pred.key_driver}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
