export default function SourceModal({ sourceKey, data, onClose }) {
  if (!sourceKey || !data) return null;

  const renderContent = () => {
    console.log('SourceModal rendering for:', sourceKey, data[sourceKey]);
    const sourceData = data[sourceKey];
    
    if (!sourceData || (Object.keys(sourceData).length === 0 && sourceKey !== 'events')) {
      return (
        <div className="py-12 text-center">
          <p className="text-sm text-text3 mb-2">Fetching deep intelligence for {sourceKey}...</p>
          <div className="w-6 h-6 border-2 border-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      );
    }

    switch (sourceKey) {
      case 'twitter': return <TwitterModal data={sourceData} />;
      case 'news': return <NewsModal data={sourceData} />;
      case 'reddit': return <RedditModal data={sourceData} />;
      case 'trends': return <TrendsModal data={sourceData} />;
      case 'technical': return <TechnicalModal data={sourceData} />;
      case 'events': return <EventsModal data={sourceData} />;
      default: return null;
    }
  };

  const titles = {
    twitter: '💬 StockTwits Analysis',
    news: '📰 News Sentiment',
    reddit: '🧠 Alpha Vantage Sentiment',
    trends: '📈 Google Trends',
    technical: '📊 Technical Indicators',
    events: '📅 Events & Earnings',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">{titles[sourceKey]}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-bg3 flex items-center justify-center text-text2 hover:text-text">✕</button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}

function TwitterModal({ data }) {
  const tweets = data.tweets || [];
  return (
    <div className="space-y-3">
      <div className="flex gap-3 mb-2">
        <Stat label="Messages" value={data.tweet_count || 0} />
        <Stat label="Sentiment" value={`${data.sentiment_pct?.toFixed(0) || 50}%`} color={data.sentiment_label === 'BULLISH' ? '#10b981' : '#ef4444'} />
        {data.bullish_count > 0 && <Stat label="Bullish" value={data.bullish_count} color="#10b981" />}
        {data.bearish_count > 0 && <Stat label="Bearish" value={data.bearish_count} color="#ef4444" />}
      </div>
      {tweets.map((t, i) => (
        <div key={i} className="bg-bg3 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <img src={t.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${t.username}`} alt="" className="w-8 h-8 rounded-full" />
            <div>
              <span className="text-xs font-bold text-[#1d9bf0]">@{t.username}</span>
              <Badge label={t.sentiment_label} />
            </div>
          </div>
          <p className="text-xs text-text2 leading-relaxed mb-2">{t.text}</p>
          <div className="flex gap-3 text-[10px] text-text3">
            <span>❤️ {t.likes}</span>
            {t.followers > 0 && <span>👥 {t.followers} followers</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsModal({ data }) {
  const headlines = data.headlines || [];
  return (
    <div className="space-y-3">
      <div className="flex gap-3 mb-2">
        <Stat label="Headlines" value={data.headline_count || 0} />
        <Stat label="Avg Sentiment" value={`${data.avg_sentiment_pct?.toFixed(0) || 50}%`} />
      </div>
      {headlines.map((h, i) => (
        <div key={i} className="bg-bg3 rounded-lg p-3 border border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-teal font-semibold">{h.source}</span>
            <Badge label={h.sentiment_label} />
          </div>
          <p className="text-xs font-medium text-text mb-1">{h.title}</p>
          <p className="text-[10px] text-text3 leading-relaxed">{h.snippet}</p>
          <p className="text-[10px] text-text3 mt-1">{timeAgo(h.published_at)}</p>
        </div>
      ))}
    </div>
  );
}

function RedditModal({ data }) {
  const posts = data.posts || [];
  return (
    <div className="space-y-3">
      <div className="flex gap-3 mb-2">
        <Stat label="Posts" value={data.post_count || 0} />
        <Stat label="Bullish" value={`${data.bullish_pct?.toFixed(0) || 50}%`} color="#10b981" />
        <Stat label="Bearish" value={`${data.bearish_pct?.toFixed(0) || 50}%`} color="#ef4444" />
      </div>
      {posts.map((p, i) => (
        <div key={i} className="bg-bg3 rounded-lg p-3 border border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-orange font-semibold">{p.subreddit || p.source_name}</span>
            <Badge label={p.sentiment_label} />
          </div>
          <p className="text-xs font-medium text-text mb-1">{p.title}</p>
          <p className="text-[10px] text-text3 leading-relaxed mb-1">{p.body?.substring(0, 200)}</p>
          <div className="flex gap-3 text-[10px] text-text3">
            <span>⬆️ {p.upvotes}</span>
            <span>💬 {p.comments || 0}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendsModal({ data }) {
  const keywords = data.trending_keywords || [];
  return (
    <div className="space-y-3">
      <div className="flex gap-3 mb-2">
        <Stat label="Trend Score" value={`${data.trend_score?.toFixed(0) || 50}/100`} />
        <Stat label="Direction" value={data.direction || 'stable'} />
        {data.spike_detected && <Stat label="Spike" value="⚠️ YES" color="#ef4444" />}
      </div>
      {keywords.map((k, i) => (
        <div key={i} className="bg-bg3 rounded-lg p-3 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text2">{k.keyword}</span>
            <span className="text-xs font-mono text-green font-bold">{k.bar_value || k.peak || 0}</span>
          </div>
          <div className="h-2 bg-bg rounded-full overflow-hidden">
            <div className="h-full bg-green rounded-full transition-all" style={{ width: `${Math.min(k.bar_value || k.peak || 0, 100)}%` }} />
          </div>
          {k.spike && <span className="text-[10px] text-red mt-1 inline-block">🔺 Spike detected</span>}
        </div>
      ))}
    </div>
  );
}

function TechnicalModal({ data }) {
  const indicators = [
    { name: 'RSI (14)', value: data.rsi, signal: data.rsi < 30 ? 'BULLISH' : data.rsi > 70 ? 'BEARISH' : 'NEUTRAL' },
    { name: 'MACD', value: data.macd?.toFixed(4), signal: data.macd > data.macd_signal ? 'BULLISH' : 'BEARISH' },
    { name: 'Stochastic %K', value: data.stoch_k?.toFixed(1), signal: data.stoch_k < 20 ? 'BULLISH' : data.stoch_k > 80 ? 'BEARISH' : 'NEUTRAL' },
    { name: 'Williams %R', value: data.williams_r?.toFixed(1), signal: data.williams_r < -80 ? 'BULLISH' : data.williams_r > -20 ? 'BEARISH' : 'NEUTRAL' },
    { name: 'CCI (20)', value: data.cci?.toFixed(1), signal: data.cci < -100 ? 'BULLISH' : data.cci > 100 ? 'BEARISH' : 'NEUTRAL' },
    { name: 'MFI (14)', value: data.mfi?.toFixed(1), signal: data.mfi < 20 ? 'BULLISH' : data.mfi > 80 ? 'BEARISH' : 'NEUTRAL' },
    { name: 'ATR (14)', value: data.atr?.toFixed(2), signal: 'NEUTRAL' },
    { name: 'Volume Ratio', value: `${data.volume_ratio?.toFixed(1)}x`, signal: data.volume_ratio > 2 ? 'BULLISH' : 'NEUTRAL' },
    { name: 'BB Position', value: data.bb_position?.toFixed(2), signal: data.bb_position < 0.2 ? 'BULLISH' : data.bb_position > 0.8 ? 'BEARISH' : 'NEUTRAL' },
    { name: 'ROC (10)', value: data.roc?.toFixed(2), signal: data.roc > 0 ? 'BULLISH' : 'BEARISH' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex gap-3 mb-2">
        <Stat label="Verdict" value={data.overall_technical_verdict || 'NEUTRAL'} color={data.overall_technical_verdict === 'BULLISH' ? '#10b981' : data.overall_technical_verdict === 'BEARISH' ? '#ef4444' : '#f59e0b'} />
      </div>
      {indicators.map((ind, i) => (
        <div key={i} className="flex items-center justify-between bg-bg3 rounded-lg px-3 py-2 border border-border">
          <span className="text-xs text-text2">{ind.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-text">{ind.value}</span>
            <Badge label={ind.signal} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EventsModal({ data }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-bg3 rounded-lg p-3 border border-border">
          <p className="text-[10px] text-text3">Earnings Date</p>
          <p className="text-sm font-mono font-bold text-amber">{data.earnings_date || 'Unknown'}</p>
          <p className="text-[10px] text-text3">{data.days_to_earnings} days away</p>
        </div>
        <div className="bg-bg3 rounded-lg p-3 border border-border">
          <p className="text-[10px] text-text3">Catalyst</p>
          <p className="text-sm font-bold" style={{ color: data.has_catalyst ? '#ef4444' : '#10b981' }}>
            {data.has_catalyst ? '⚡ YES' : 'None'}
          </p>
          <p className="text-[10px] text-text3">Strength: {data.catalyst_strength || 'LOW'}</p>
        </div>
      </div>
      <div className="bg-bg3 rounded-lg p-3 border border-border">
        <p className="text-[10px] text-text3 mb-1">Analyst Consensus</p>
        <p className="text-lg font-bold text-purple2">{data.analyst_consensus || 'HOLD'}</p>
        <p className="text-xs text-text2">Target: ${data.avg_analyst_target?.toFixed(2) || 'N/A'}</p>
        <p className="text-[10px] text-text3">Range: ${data.analyst_target_low?.toFixed(2) || '?'} — ${data.analyst_target_high?.toFixed(2) || '?'}</p>
        <p className="text-[10px] text-text3">{data.num_analysts || 0} analysts</p>
      </div>
      {data.dividend_yield > 0 && (
        <div className="bg-bg3 rounded-lg p-3 border border-border">
          <p className="text-[10px] text-text3 mb-1">Dividends</p>
          <p className="text-xs text-text2">Yield: {data.dividend_yield}% | Rate: ${data.dividend_rate}</p>
        </div>
      )}
    </div>
  );
}

function Badge({ label }) {
  const isBull = ['BULLISH', 'BUY', 'STRONG BUY'].includes(label);
  const isBear = ['BEARISH', 'SELL', 'STRONG SELL'].includes(label);
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ml-1 ${
      isBull ? 'bg-green/10 text-green' : isBear ? 'bg-red/10 text-red' : 'bg-amber/10 text-amber'
    }`}>{label}</span>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-bg3 rounded-lg px-3 py-2">
      <p className="text-[10px] text-text3">{label}</p>
      <p className="text-sm font-mono font-bold" style={{ color: color || '#f0f0ff' }}>{value}</p>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
