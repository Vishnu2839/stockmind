import SourceCard from './SourceCard';

const SOURCE_CONFIG = [
  { key: 'stocktwits', label: 'StockTwits', icon: '💬', color: '#1d9bf0' },
  { key: 'news', label: 'News', icon: '📰', color: '#0d9488' },
  { key: 'fear_greed', label: 'Fear & Greed', icon: '🧠', color: '#f97316' },
  { key: 'trends', label: 'Google Trends', icon: '📈', color: '#10b981' },
  { key: 'technical', label: 'Price / Technical', icon: '📊', color: '#9d5ff5' },
  { key: 'events', label: 'Events / Earnings', icon: '📅', color: '#f59e0b' },
];

export default function EvidenceGrid({ data, onSourceClick }) {
  if (!data) return null;

  // Check if we only have meta data (no twitter/news/etc)
  const isDeepLoading = !data.stocktwits && !data.news;

    const getSourceData = (key) => {
      if (isDeepLoading) {
        return { pct: 50, label: 'SCANNING...', desc: 'Gathering live intelligence...' };
      }
      const src = data[key] || {};
      
      switch (key) {
        case 'stocktwits':
          return { 
            pct: src.sentiment_pct || 50, 
            label: src.sentiment_label || 'NEUTRAL', 
            desc: src.tweet_count > 0 ? `${src.tweet_count} messages analyzed` : 'Searching social feeds...' 
          };
        case 'news':
          return { 
            pct: src.sentiment_pct || 50, 
            label: src.sentiment_label || 'NEUTRAL', 
            desc: src.headline_count > 0 ? `${src.headline_count} headlines scanned` : 'No recent news found' 
          };
        case 'fear_greed':
          return { 
            pct: src.fear_greed_score || 50, 
            label: src.fear_greed_score > 60 ? 'GREED' : (src.fear_greed_score < 40 ? 'FEAR' : 'NEUTRAL'), 
            desc: 'CNN Market Fear & Greed Index' 
          };
        case 'trends':
          return { pct: src.trend_score || 50, label: src.trend_score > 50 ? 'UP' : 'DOWN', desc: 'Search volume momentum' };
        case 'technical':
          return { 
            pct: src.rsi || 50, 
            label: src.overall_technical_verdict || 'NEUTRAL', 
            desc: src.rsi ? `RSI: ${src.rsi.toFixed(1)} · ${src.trend || 'Stable'}` : 'Calculating RSI/MACD...' 
          };
        case 'events':
          return { 
            pct: src.days_to_earnings ? Math.max(0, 100 - src.days_to_earnings) : 30, 
            label: src.analyst_consensus || 'HOLD', 
            desc: src.days_to_earnings ? `Earnings in ${src.days_to_earnings}d` : 'Fetching calendar...' 
          };
        default:
          return { pct: 50, label: 'N/A', desc: '' };
      }
    };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${isDeepLoading ? 'opacity-50 pointer-events-none' : ''}`}>
      {SOURCE_CONFIG.map((cfg) => {
        const sd = getSourceData(cfg.key);
        return (
          <SourceCard
            key={cfg.key}
            icon={cfg.icon}
            label={cfg.label}
            color={cfg.color}
            pct={sd.pct}
            sentimentLabel={sd.label}
            description={sd.desc}
            showLive={!isDeepLoading}
            onClick={() => onSourceClick && onSourceClick(cfg.key)}
          />
        );
      })}
    </div>
  );
}
