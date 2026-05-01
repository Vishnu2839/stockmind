export default function BacktestChart({ data }) {
  if (!data) return null;
  const strategies = [
    { key: 'stockmind', label: 'StockMind', color: '#10b981' },
    { key: 'price_only', label: 'Price Only', color: '#8888aa' },
    { key: 'buy_and_hold', label: 'Buy & Hold', color: '#3b82f6' },
  ];

  const maxReturn = Math.max(...strategies.map(s => Math.abs(data[s.key]?.total_return_pct || 0)), 1);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold text-text mb-1">1 Year Paper Trading Simulation</h3>
      <p className="text-xs text-text3 mb-4">Starting capital: $10,000</p>
      <div className="space-y-3 mb-4">
        {strategies.map(s => {
          const ret = data[s.key]?.total_return_pct || 0;
          return (
            <div key={s.key}>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-text2">{s.label}</span>
                <span className="text-xs font-mono font-bold" style={{ color: s.color }}>
                  {ret > 0 ? '+' : ''}{ret.toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 bg-bg3 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: `${Math.abs(ret) / maxReturn * 100}%`,
                  backgroundColor: s.color,
                }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Return', value: `${(data.stockmind?.total_return_pct || 0).toFixed(1)}%`, color: '#10b981' },
          { label: 'Sharpe', value: (data.stockmind?.sharpe_ratio || 0).toFixed(2), color: '#7c3aed' },
          { label: 'Drawdown', value: `${(data.stockmind?.max_drawdown || 0).toFixed(1)}%`, color: '#ef4444' },
          { label: 'Win Rate', value: `${(data.stockmind?.win_rate || 0).toFixed(0)}%`, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="bg-bg3 rounded-lg p-2 text-center">
            <p className="text-[10px] text-text3 mb-1">{s.label}</p>
            <p className="text-xs font-mono font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
