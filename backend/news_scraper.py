import yfinance as yf
from transformers import pipeline

_finbert = None

def get_finbert():
    global _finbert
    if _finbert is None:
        _finbert = pipeline(
            "text-classification",
            model="ProsusAI/finbert",
            truncation=True,
            max_length=512
        )
    return _finbert

def get_news_sentiment(ticker: str) -> dict:
    """
    Fetches latest news from Yahoo Finance for ticker.
    Scores each headline with FinBERT running locally.
    Returns news_sentiment_score as a feature for the model.
    Zero cost. Zero API key. Zero rate limit.
    """
    try:
        stock = yf.Ticker(ticker)
        articles = stock.news or []

        if not articles:
            return {
                "source": "yfinance_finbert",
                "article_count": 0,
                "avg_sentiment_score": 0.0,
                "news_sentiment_score": 0.0,
                "sentiment_pct": 50.0,
                "sentiment_label": "NEUTRAL",
                "headlines": [],
                "top_headline": "No news found"
            }

        finbert = get_finbert()
        scored = []

        for a in articles[:10]:
            title = a.get("title", "")
            if not title:
                continue
            try:
                result = finbert(title)[0]
                label = result["label"]
                score_map = {
                    "positive":  1.0,
                    "negative": -1.0,
                    "neutral":   0.0
                }
                score = score_map.get(label, 0.0) * result["score"]
                scored.append({
                    "title": title,
                    "source": a.get("publisher", "Unknown"),
                    "published": a.get("providerPublishTime", ""),
                    "sentiment_score": round(score, 4),
                    "sentiment_label": label.upper(),
                    "url": a.get("link", "")
                })
            except Exception:
                continue

        if not scored:
            return {
                "source": "yfinance_finbert",
                "article_count": 0,
                "avg_sentiment_score": 0.0,
                "news_sentiment_score": 0.0,
                "sentiment_pct": 50.0,
                "sentiment_label": "NEUTRAL",
                "headlines": [],
                "top_headline": "No scoreable articles"
            }

        avg = sum(a["sentiment_score"] for a in scored) / len(scored)
        pct = round((avg + 1) / 2 * 100, 1)
        label = (
            "BULLISH" if avg > 0.15 else
            "BEARISH" if avg < -0.15 else
            "NEUTRAL"
        )

        return {
            "source": "yfinance_finbert",
            "article_count": len(scored),
            "avg_sentiment_score": round(avg, 4),
            "news_sentiment_score": round(avg, 4),
            "sentiment_pct": pct,
            "sentiment_label": label,
            "headlines": scored,
            "top_headline": scored[0]["title"] if scored else ""
        }

    except Exception as e:
        return {
            "source": "yfinance_finbert",
            "article_count": 0,
            "avg_sentiment_score": 0.0,
            "news_sentiment_score": 0.0,
            "sentiment_pct": 50.0,
            "sentiment_label": "NEUTRAL",
            "headlines": [],
            "top_headline": f"Unavailable: {str(e)}"
        }
