export default function SourceCard({ icon, label, color, pct, sentimentLabel, description, onClick, showLive }) {
  const isBullish = ['BULLISH', 'BUY', 'STRONG BUY', 'rising'].includes(sentimentLabel);
  const isBearish = ['BEARISH', 'SELL', 'STRONG SELL', 'falling'].includes(sentimentLabel);
  const borderColor = isBullish ? '#10b981' : isBearish ? '#ef4444' : '#f59e0b';

  return (
    <button
      onClick={onClick}
      className="relative bg-card rounded-xl p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple/10 group active:scale-95 w-full h-full min-h-[120px] border border-border flex flex-col justify-between overflow-hidden"
    >
      {showLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1 z-10 bg-bg/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-green/30 shadow-sm shadow-green/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></div>
          <span className="text-[8px] font-bold text-green uppercase tracking-tighter">Live</span>
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg group-hover:scale-125 transition-transform duration-300">{icon}</span>
          <span className="text-[10px] font-bold text-text2 uppercase tracking-widest">{label}</span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-2xl font-mono font-bold" style={{ color }}>{pct?.toFixed(0)}%</span>
          <span className={`text-[9px] px-2 py-0.5 rounded font-black tracking-tight ${
            isBullish ? 'bg-green/10 text-green border border-green/20' : isBearish ? 'bg-red/10 text-red border border-red/20' : 'bg-amber/10 text-amber border border-amber/20'
          }`}>
            {sentimentLabel}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-text3 font-medium leading-snug line-clamp-2 mt-auto">{description}</p>
      
      {/* Decorative Gradient Flare */}
      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-purple/5 blur-xl rounded-full group-hover:bg-purple/20 transition-all duration-500"></div>
    </button>
  );
}
