"""
social_scraper.py — StockTwits web scraper and Reddit (praw) data collection.
All real data, no synthetic content.
"""
import os
import json
import random
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from textblob import TextBlob

load_dotenv()

# ──────────────────────────────────────────────
# STOCKTWITS (Free, no API key — web scrape)
# ──────────────────────────────────────────────

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://stocktwits.com/",
}


def scrape_stocktwits(ticker: str) -> dict:
    """Get real social sentiment for a stock using multiple free sources."""
    clean_ticker = ticker.upper().replace(".NS", "").replace(".BO", "")

    # Strategy 1: Try StockTwits API
    try:
        result = _stocktwits_api(clean_ticker)
        if result and result.get("tweet_count", 0) > 0:
            return result
    except Exception as e:
        print(f"StockTwits API failed: {e}")

    # Strategy 2: Use Yahoo Finance conversations data
    try:
        result = _yahoo_social(ticker)
        if result and result.get("tweet_count", 0) > 0:
            return result
    except Exception as e:
        print(f"Yahoo social failed: {e}")

    # Strategy 3: Derive social sentiment from yfinance news + TextBlob
    try:
        result = _derive_social_from_news(ticker)
        if result and result.get("tweet_count", 0) > 0:
            return result
    except Exception as e:
        print(f"Derived social failed: {e}")

    # Fallback: empty state
    return _empty_social(ticker)


def _stocktwits_api(ticker: str) -> dict:
    """Try StockTwits public API."""
    url = f"https://api.stocktwits.com/api/2/streams/symbol/{ticker}.json"
    resp = requests.get(url, headers=HEADERS, timeout=10)
    if resp.status_code != 200:
        raise Exception(f"StockTwits returned {resp.status_code}")

    data = resp.json()
    messages = data.get("messages", [])
    if not messages:
        return None

    return _process_messages(messages, "StockTwits")


def _yahoo_social(ticker: str) -> dict:
    """Get social data from Yahoo Finance news & analyst discussions."""
    import yfinance as yf
    stock = yf.Ticker(ticker)

    posts = []
    try:
        news = stock.news
        if news:
            for article in news[:15]:
                content = article.get("content", article)
                title = content.get("title", "")
                publisher = content.get("provider", {}).get("displayName", content.get("publisher", ""))
                link = content.get("clickThroughUrl", {}).get("url", "")
                pub_time = content.get("pubDate", "")

                polarity = TextBlob(title).sentiment.polarity
                sentiment_score = round((polarity + 1) / 2 * 100, 1)
                if polarity > 0.1:
                    label = "BULLISH"
                elif polarity < -0.1:
                    label = "BEARISH"
                else:
                    label = "NEUTRAL"

                posts.append({
                    "text": title[:200],
                    "username": publisher or "Yahoo Finance",
                    "likes": 0,
                    "retweets": 0,
                    "followers": 0,
                    "sentiment_score": sentiment_score,
                    "sentiment_label": label,
                    "created_at": pub_time,
                    "avatar": f"https://api.dicebear.com/7.x/initials/svg?seed={publisher}",
                    "source": "yahoo_finance",
                })
    except Exception:
        pass

    # Also get analyst recommendations as "social signals"
    try:
        recs = stock.recommendations
        if recs is not None and not recs.empty:
            recent = recs.tail(5)
            for _, row in recent.iterrows():
                firm = row.get("Firm", "Analyst")
                grade = row.get("To Grade", row.get("grade", ""))
                action = row.get("Action", "")

                bull_grades = {"buy", "overweight", "outperform", "strong buy", "positive", "accumulate", "sector perform"}
                bear_grades = {"sell", "underweight", "underperform", "strong sell", "negative", "reduce"}
                g_lower = str(grade).lower()

                if any(b in g_lower for b in bull_grades):
                    label = "BULLISH"
                    score = 75.0
                elif any(b in g_lower for b in bear_grades):
                    label = "BEARISH"
                    score = 25.0
                else:
                    label = "NEUTRAL"
                    score = 50.0

                posts.append({
                    "text": f"{action}: {grade}" if action else grade,
                    "username": str(firm),
                    "likes": 0,
                    "retweets": 0,
                    "followers": 0,
                    "sentiment_score": score,
                    "sentiment_label": label,
                    "created_at": "",
                    "avatar": f"https://api.dicebear.com/7.x/initials/svg?seed={firm}",
                    "source": "analyst",
                })
    except Exception:
        pass

    if not posts:
        return None

    bullish = sum(1 for p in posts if p["sentiment_label"] == "BULLISH")
    bearish = sum(1 for p in posts if p["sentiment_label"] == "BEARISH")
    total = bullish + bearish if (bullish + bearish) > 0 else 1
    sentiment_pct = round(bullish / total * 100, 1)
    overall = "BULLISH" if sentiment_pct > 55 else "BEARISH" if sentiment_pct < 45 else "NEUTRAL"

    return {
        "tweet_count": len(posts),
        "sentiment_pct": sentiment_pct,
        "sentiment_label": overall,
        "top_tweet_text": posts[0]["text"] if posts else "",
        "top_tweet_user": posts[0]["username"] if posts else "",
        "tweets": posts[:4],
        "bullish_count": bullish,
        "bearish_count": bearish,
        "is_live": True,
        "source_name": "Yahoo Finance & Analysts",
    }


def _derive_social_from_news(ticker: str) -> dict:
    """Use news headlines + TextBlob to derive social-like sentiment."""
    from news_scraper import get_news_sentiment
    news_data = get_news_sentiment(ticker)
    headlines = news_data.get("headlines", [])

    if not headlines:
        return None

    posts = []
    for h in headlines[:10]:
        text = h.get("title", "")
        polarity = TextBlob(text).sentiment.polarity
        score = round((polarity + 1) / 2 * 100, 1)
        label = "BULLISH" if polarity > 0.1 else "BEARISH" if polarity < -0.1 else "NEUTRAL"
        posts.append({
            "text": text[:200],
            "username": h.get("source", "News"),
            "likes": 0,
            "retweets": 0,
            "followers": 0,
            "sentiment_score": score,
            "sentiment_label": label,
            "created_at": h.get("published_at", ""),
            "avatar": f"https://api.dicebear.com/7.x/initials/svg?seed={h.get('source', 'N')}",
            "source": "news_derived",
        })

    bullish = sum(1 for p in posts if p["sentiment_label"] == "BULLISH")
    bearish = sum(1 for p in posts if p["sentiment_label"] == "BEARISH")
    total = bullish + bearish if (bullish + bearish) > 0 else 1
    sentiment_pct = round(bullish / total * 100, 1)
    overall = "BULLISH" if sentiment_pct > 55 else "BEARISH" if sentiment_pct < 45 else "NEUTRAL"

    return {
        "tweet_count": len(posts),
        "sentiment_pct": sentiment_pct,
        "sentiment_label": overall,
        "top_tweet_text": posts[0]["text"] if posts else "",
        "top_tweet_user": posts[0]["username"] if posts else "",
        "tweets": posts[:4],
        "bullish_count": bullish,
        "bearish_count": bearish,
        "is_live": True,
        "source_name": "News Sentiment",
    }


def _process_messages(messages: list, source_name: str) -> dict:
    """Process StockTwits-style messages into our format."""
    posts = []
    bullish_count = 0
    bearish_count = 0

    for msg in messages[:30]:
        body = msg.get("body", "")
        user = msg.get("user", {})
        username = user.get("username", "unknown")
        avatar = (user.get("avatar_url_ssl") or user.get("avatar_url")
                  or f"https://api.dicebear.com/7.x/initials/svg?seed={username}")
        followers = user.get("followers", 0)
        created = msg.get("created_at", "")

        st_sentiment = msg.get("entities", {}).get("sentiment", {})
        basic = st_sentiment.get("basic", None) if st_sentiment else None

        if basic == "Bullish":
            sentiment_label = "BULLISH"
            sentiment_score = 72.0
            bullish_count += 1
        elif basic == "Bearish":
            sentiment_label = "BEARISH"
            sentiment_score = 28.0
            bearish_count += 1
        else:
            polarity = TextBlob(body).sentiment.polarity
            sentiment_score = round((polarity + 1) / 2 * 100, 1)
            if polarity > 0.1:
                sentiment_label = "BULLISH"
                bullish_count += 1
            elif polarity < -0.1:
                sentiment_label = "BEARISH"
                bearish_count += 1
            else:
                sentiment_label = "NEUTRAL"

        likes = msg.get("likes", {})
        like_count = likes.get("total", 0) if isinstance(likes, dict) else 0

        posts.append({
            "text": body[:200],
            "username": username,
            "likes": like_count,
            "retweets": 0,
            "followers": followers,
            "sentiment_score": sentiment_score,
            "sentiment_label": sentiment_label,
            "created_at": created,
            "avatar": avatar,
            "source": "stocktwits",
        })

    total_tagged = bullish_count + bearish_count
    if total_tagged > 0:
        sentiment_pct = round(bullish_count / total_tagged * 100, 1)
    else:
        scores = [p["sentiment_score"] for p in posts]
        sentiment_pct = round(sum(scores) / len(scores), 1) if scores else 50.0

    overall = "BULLISH" if sentiment_pct > 55 else "BEARISH" if sentiment_pct < 45 else "NEUTRAL"
    top_post = max(posts, key=lambda p: p["likes"] + p.get("followers", 0)) if posts else posts[0]

    return {
        "tweet_count": len(posts),
        "sentiment_pct": sentiment_pct,
        "sentiment_label": overall,
        "top_tweet_text": top_post["text"],
        "top_tweet_user": top_post["username"],
        "tweets": posts[:4],
        "bullish_count": bullish_count,
        "bearish_count": bearish_count,
        "is_live": True,
        "source_name": source_name,
    }


def _empty_social(ticker: str) -> dict:
    """Empty social data when all sources fail."""
    return {
        "tweet_count": 0,
        "sentiment_pct": 50.0,
        "sentiment_label": "NEUTRAL",
        "top_tweet_text": f"No social data available for {ticker}",
        "top_tweet_user": "StockMind",
        "tweets": [],
        "bullish_count": 0,
        "bearish_count": 0,
        "is_live": False,
        "source_name": "None",
    }


# Backward compatibility alias
scrape_twitter = scrape_stocktwits


# ──────────────────────────────────────────────
# ALPHA VANTAGE NEWS SENTIMENT
# ──────────────────────────────────────────────

ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query"


def scrape_reddit(ticker: str) -> dict:
    """
    Replaced Reddit with Alpha Vantage News Sentiment.
    Function name kept as scrape_reddit for backward compatibility with
    main.py and ai_brain.py which call this function.
    """
    api_key = os.getenv("ALPHA_VANTAGE_KEY", "")
    if api_key and api_key != "your_alpha_vantage_key_here":
        try:
            return _live_alpha_vantage(ticker, api_key)
        except Exception as e:
            print(f"Alpha Vantage error: {e}")
    return _empty_alpha_vantage(ticker)


def _live_alpha_vantage(ticker: str, api_key: str) -> dict:
    """Fetch real news sentiment from Alpha Vantage."""
    clean_ticker = ticker.upper().replace(".NS", "").replace(".BO", "")

    params = {
        "function": "NEWS_SENTIMENT",
        "tickers": clean_ticker,
        "apikey": api_key,
        "limit": 50,
        "sort": "LATEST",
    }

    resp = requests.get(ALPHA_VANTAGE_URL, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    # Check for API errors
    if "Error Message" in data or "Note" in data:
        error = data.get("Error Message", data.get("Note", "Unknown error"))
        print(f"Alpha Vantage API note: {error}")
        return _empty_alpha_vantage(ticker)

    feed = data.get("feed", [])
    if not feed:
        return _empty_alpha_vantage(ticker)

    posts_data = []
    bullish_count = 0
    bearish_count = 0

    for article in feed[:20]:
        title = article.get("title", "")
        summary = article.get("summary", "")
        source = article.get("source", "Unknown")
        published = article.get("time_published", "")
        overall_score = float(article.get("overall_sentiment_score", 0))
        overall_label = article.get("overall_sentiment_label", "Neutral")

        # Find ticker-specific sentiment
        ticker_sentiment = {}
        for ts in article.get("ticker_sentiment", []):
            if ts.get("ticker", "").upper() == clean_ticker:
                ticker_sentiment = ts
                break

        if ticker_sentiment:
            relevance = float(ticker_sentiment.get("relevance_score", 0))
            t_score = float(ticker_sentiment.get("ticker_sentiment_score", 0))
            t_label = ticker_sentiment.get("ticker_sentiment_label", "Neutral")
        else:
            relevance = 0.5
            t_score = overall_score
            t_label = overall_label

        # Convert Alpha Vantage sentiment to our format
        # AV scores: -1 to +1, labels: Bearish, Somewhat-Bearish, Neutral, Somewhat-Bullish, Bullish
        if "bullish" in t_label.lower():
            sentiment_label = "BULLISH"
            bullish_count += 1
        elif "bearish" in t_label.lower():
            sentiment_label = "BEARISH"
            bearish_count += 1
        else:
            sentiment_label = "NEUTRAL"

        # Convert -1..+1 to 0..100
        sentiment_pct = round((t_score + 1) / 2 * 100, 1)

        # Format published time
        created_at = ""
        if published:
            try:
                dt = datetime.strptime(published[:15], "%Y%m%dT%H%M%S")
                created_at = dt.isoformat()
            except Exception:
                created_at = published

        posts_data.append({
            "subreddit": f"via {source}",
            "title": title[:120],
            "body": summary[:200],
            "upvotes": int(relevance * 100),  # Use relevance as a score proxy
            "comments": 0,
            "bullish_words": 1 if sentiment_label == "BULLISH" else 0,
            "bearish_words": 1 if sentiment_label == "BEARISH" else 0,
            "sentiment_label": sentiment_label,
            "sentiment_score": sentiment_pct,
            "source_name": source,
            "relevance": round(relevance, 3),
            "created_at": created_at,
        })

    if not posts_data:
        return _empty_alpha_vantage(ticker)

    total = bullish_count + bearish_count if (bullish_count + bearish_count) > 0 else 1
    bullish_pct = round(bullish_count / total * 100, 1)
    bearish_pct = round(bearish_count / total * 100, 1)
    top_post = max(posts_data, key=lambda p: p["upvotes"])
    label = "BULLISH" if bullish_pct > 55 else "BEARISH" if bearish_pct > 55 else "MIXED"

    return {
        "post_count": len(posts_data),
        "bullish_pct": bullish_pct,
        "bearish_pct": bearish_pct,
        "sentiment_label": label,
        "top_post_title": top_post["title"],
        "top_post_body": top_post["body"],
        "top_post_upvotes": top_post["upvotes"],
        "posts": posts_data[:3],
        "is_live": True,
    }


def _empty_alpha_vantage(ticker: str) -> dict:
    """Empty Alpha Vantage data — user needs to add API key."""
    return {
        "post_count": 0,
        "bullish_pct": 50.0,
        "bearish_pct": 50.0,
        "sentiment_label": "NEUTRAL",
        "top_post_title": "Add ALPHA_VANTAGE_KEY to .env for AI sentiment data",
        "top_post_body": "",
        "top_post_upvotes": 0,
        "posts": [],
        "is_live": False,
    }
