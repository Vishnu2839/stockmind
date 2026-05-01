import ConfidenceRing from './ConfidenceRing';

export default function VerdictCard({ predictions, timeframe = '1M' }) {
  const pred = predictions?.[timeframe] || {};
  const dir = pred.direction || 'UP';
  const isUp = dir === 'UP';
  const verdict = isUp ? (pred.confidence_pct > 60 ? 'BUY' : 'HOLD') : (pred.confidence_pct > 60 ? 'SELL' : 'HOLD');
  const color = verdict === 'BUY' ? '#10b981' : verdict === 'SELL' ? '#ef4444' : '#f59e0b';

  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-fadeup">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: color + '15' }}>
          {isUp ? '📈' : '📉'}
        </div>
        <div>
          <p className="text-2xl font-bold font-display" style={{ color }}>{verdict}</p>
          <p className="text-xs text-text2">{pred.explanation?.substring(0, 80) || 'Based on multi-source analysis'}</p>
        </div>
        <div className="ml-auto">
          <ConfidenceRing value={pred.confidence_pct || 65} color={color} />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatBox label="Price Target" value={`$${(pred.predicted_price_target || 0).toFixed(2)}`} color={color} />
        <StatBox label="Stop Loss" value={`$${(pred.price_low || 0).toFixed(2)}`} color="#ef4444" />
        <StatBox label="Timeframe" value={timeframe} color="#7c3aed" />
        <StatBox label="Expected Gain" value={`${pred.expected_gain_pct > 0 ? '+' : ''}${(pred.expected_gain_pct || 0).toFixed(1)}%`} color={pred.expected_gain_pct >= 0 ? '#10b981' : '#ef4444'} />
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="bg-bg3 rounded-lg p-2.5 text-center">
      <p className="text-[10px] text-text3 uppercase mb-1">{label}</p>
      <p className="text-sm font-mono font-bold" style={{ color }}>{value}</p>
    </div>
  );
}
