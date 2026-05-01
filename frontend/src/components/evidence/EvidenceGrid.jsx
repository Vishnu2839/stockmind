import SourceCard from './SourceCard';

const SOURCE_CONFIG = [
  { key: 'twitter', label: 'StockTwits', icon: '💬', color: '#1d9bf0' },
  { key: 'news', label: 'News', icon: '📰', color: '#0d9488' },
  { key: 'reddit', label: 'Alpha Vantage', icon: '🧠', color: '#f97316' },
  { key: 'trends', label: 'Google Trends', icon: '📈', color: '#10b981' },
  { key: 'technical', label: 'Price / Technical', icon: '📊', color: '#9d5ff5' },
  { key: 'events', label: 'Events / Earnings', icon: '📅', color: '#f59e0b' },
];

export default function EvidenceGrid({ data, onSourceClick }) {
  if (!data) return null;

  // Check if we only have meta data (no twitter/news/etc)
  const isDeepLoading = !data.twitter && !data.news;

    const getSourceData = (key) => {
      if (isDeepLoading) {
        return { pct: 50, label: 'SCANNING...', desc: 'Gathering live intelligence...' };
      }
      const src = data[key] || {};
      
      // Check if data is actually present or just fallback
      const hasData = (src.tweet_count > 0) || (src.headline_count > 0) || (src.post_count > 0) || (src.rsi !== undefined);

      switch (key) {
        case 'twitter':
          return { 
            pct: src.sentiment_pct || 50, 
            label: src.tweet_count > 0 ? src.sentiment_label : 'NO DATA', 
            desc: src.tweet_count > 0 ? `${src.tweet_count} messages analyzed` : 'Searching social feeds...' 
          };
        case 'news':
          return { 
            pct: src.avg_sentiment_pct || 50, 
            label: src.headline_count > 0 ? src.sentiment_label : 'EMPTY', 
            desc: src.headline_count > 0 ? `${src.headline_count} headlines scanned` : 'No recent news found' 
          };
        case 'reddit':
          return { 
            pct: src.bullish_pct || 50, 
            label: src.post_count > 0 ? src.sentiment_label : 'N/A', 
            desc: src.post_count > 0 ? `${src.post_count} articles analyzed` : 'Scraping Alpha Vantage...' 
          };
        case 'trends':
          return { pct: src.trend_score || 50, label: src.direction || 'stable', desc: src.spike_detected ? 'Spike detected!' : 'Normal volume' };
        case 'technical':
          return { 
            pct: src.rsi || 50, 
            label: src.rsi ? src.overall_technical_verdict : 'N/A', 
            desc: src.rsi ? `${src.bullish_count || 0} bullish, ${src.bearish_count || 0} bearish` : 'Calculating RSI/MACD...' 
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
