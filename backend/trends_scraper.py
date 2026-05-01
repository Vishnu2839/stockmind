"""
trends_scraper.py — Google Trends data via pytrends with fallback.
"""
import random
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


def scrape_trends(ticker: str) -> dict:
    """Get Google Trends data for a ticker. Falls back to synthetic data."""
    try:
        return _live_trends(ticker)
    except Exception as e:
        print(f"Google Trends error: {e}")
    return _empty_trends(ticker)


def _live_trends(ticker: str) -> dict:
    from pytrends.request import TrendReq

    pytrends = TrendReq(hl="en-US", tz=360, timeout=(10, 25))
    keywords = [
        f"{ticker} stock crash",
        f"{ticker} stock buy",
        f"{ticker} stock drop",
        f"{ticker} earnings",
    ]

    # Build payload for all keywords (pytrends only handles 5 at a time)
    results = {}
    for kw in keywords:
        try:
            pytrends.build_payload([kw], timeframe="now 7-d")
            data = pytrends.interest_over_time()
            if not data.empty and kw in data.columns:
                values = data[kw].tolist()
                avg_val = sum(values) / len(values) if values else 0
                max_val = max(values) if values else 0
                results[kw] = {
                    "keyword": kw,
                    "average": round(avg_val, 1),
                    "peak": max_val,
                    "spike": max_val > avg_val * 2 if avg_val > 0 else False,
                    "bar_value": min(int(max_val), 100),
                }
            else:
                results[kw] = {"keyword": kw, "average": 0, "peak": 0, "spike": False, "bar_value": 0}
        except Exception:
            results[kw] = {"keyword": kw, "average": 0, "peak": 0, "spike": False, "bar_value": 0}

    # Calculate fear vs greed from searches
    fear_kws = [k for k in results if "crash" in k or "drop" in k]
    greed_kws = [k for k in results if "buy" in k or "earnings" in k]
    fear_score = sum(results[k]["average"] for k in fear_kws)
    greed_score = sum(results[k]["average"] for k in greed_kws)
    total = fear_score + greed_score if (fear_score + greed_score) > 0 else 1

    trend_score = round(greed_score / total * 100, 1)
    spike = any(results[k]["spike"] for k in results)

    direction = "rising" if trend_score > 55 else "falling" if trend_score < 45 else "stable"

    return {
        "trend_score": trend_score,
        "spike_detected": spike,
        "trending_keywords": list(results.values()),
        "direction": direction,
        "fear_score": round(fear_score, 1),
        "greed_score": round(greed_score, 1),
        "is_live": True,
    }


def _empty_trends(ticker: str) -> dict:
    """Empty state when Google Trends fails."""
    return {
        "trend_score": 50.0,
        "spike_detected": False,
        "trending_keywords": [
            {"keyword": "API Rate Limited", "average": 50, "peak": 50, "spike": False, "bar_value": 50}
        ],
        "direction": "rate-limited",
        "fear_score": 50.0,
        "greed_score": 50.0,
        "is_live": False,
    }
