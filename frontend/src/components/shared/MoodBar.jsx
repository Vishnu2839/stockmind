export default function MoodBar({ score = 50, label = 'NEUTRAL' }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const getMoodColor = () => {
    if (clampedScore < 25) return '#ef4444';
    if (clampedScore < 45) return '#f97316';
    if (clampedScore < 55) return '#f59e0b';
    if (clampedScore < 75) return '#10b981';
    return '#10b981';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-text3 uppercase tracking-wider font-semibold">Market Mood</h3>
        <span className="text-xs font-bold font-mono" style={{ color: getMoodColor() }}>{label}</span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden" style={{
        background: 'linear-gradient(to right, #ef4444, #f97316, #f59e0b, #10b981, #10b981)'
      }}>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 shadow-lg transition-all duration-700"
          style={{ left: `calc(${clampedScore}% - 8px)`, borderColor: getMoodColor() }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-red">EXTREME FEAR</span>
        <span className="text-[10px] text-green">EXTREME GREED</span>
      </div>
    </div>
  );
}
