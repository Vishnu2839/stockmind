"""
ai_brain.py — Streaming AI reasoning engine. The heart of StockMind.
Generates 5-step reasoning text and streams it word by word via SSE.
"""
import asyncio
import random
from datetime import datetime


async def brain_think(ticker: str, analysis_data: dict, timeframe: str = "1M"):
    """
    Generate streaming reasoning text for a stock analysis.
    Yields words one at a time with color hints for the frontend.

    Color code protocol (embedded in SSE):
      [TWITTER]...[/TWITTER] = #1d9bf0 (blue)
      [NEWS]...[/NEWS] = #0d9488 (teal)
      [REDDIT]...[/REDDIT] = #f97316 (orange)
      [GOOGLE]...[/GOOGLE] = #10b981 (green)
      [TECH]...[/TECH] = #9d5ff5 (purple)
      [EVENT]...[/EVENT] = #f59e0b (amber)
      [WARN]...[/WARN] = #ef4444 (red, bold)
      [STRONG]...[/STRONG] = white, bold
    """
    twitter = analysis_data.get("stocktwits", analysis_data.get("twitter", {}))
    news = analysis_data.get("news", {})
    reddit = analysis_data.get("fear_greed", analysis_data.get("reddit", {}))
    trends = analysis_data.get("trends", {})
    technical = analysis_data.get("technical", {})
    events = analysis_data.get("events", {})
    emotion = analysis_data.get("emotion_score", 50)
    emotion_label = analysis_data.get("emotion_label", "NEUTRAL")
    predictions = analysis_data.get("predictions", {})

    pred = predictions.get(timeframe, predictions.get("1M", {}))
    direction = pred.get("direction", "UP")
    confidence = pred.get("confidence_pct", 65)
    target = pred.get("predicted_price_target", 0)
    current_price = pred.get("current_price", 0)

    # Step 1: Evidence Gathering
    yield "[STEP]1[/STEP]"
    text = (
        f"Analyzing [STRONG]{ticker}[/STRONG]... "
        f"Collecting evidence from 6 live sources simultaneously. "
        f"Let me examine each signal carefully before making a decision.\n\n"
    )
    for word in text.split():
        yield word + " "
        await asyncio.sleep(0.04)

    # Step 2: Signal Reading
    yield "[STEP]2[/STEP]"

    # Twitter
    tweet_count = twitter.get("tweet_count", 0)
    tweet_sent = twitter.get("sentiment_pct", 50)
    tweet_label = twitter.get("sentiment_label", "NEUTRAL")
    top_tweet = twitter.get("top_tweet_text", "N/A")[:80]
    top_user = twitter.get("top_tweet_user", "unknown")

    text = (
        f"[TWITTER]StockTwits:[/TWITTER] Found {tweet_count} messages in the last 24 hours. "
        f"Sentiment is [TWITTER]{tweet_sent}% {tweet_label}[/TWITTER]. "
        f"Top insight from [TWITTER]@{top_user}[/TWITTER]: "
        f"'{top_tweet}'\n\n"
    )
    for word in text.split():
        yield word + " "
        await asyncio.sleep(0.04)

    # News
    headline_count = news.get("article_count", news.get("headline_count", 0))
    news_sent = news.get("sentiment_pct", news.get("avg_sentiment_pct", 50))
    news_label = news.get("sentiment_label", "NEUTRAL")
    headlines = news.get("headlines", [])
    latest_headline = headlines[0]["title"][:80] if headlines else "No recent headlines"
    latest_source = headlines[0]["source"] if headlines else "Unknown"

    text = (
        f"[NEWS]News:[/NEWS] Scanned {headline_count} headlines from major outlets. "
        f"Average sentiment is [NEWS]{news_sent:.0f}% {news_label}[/NEWS]. "
        f"Latest: '[NEWS]{latest_headline}[/NEWS]' — {latest_source}\n\n"
    )
    for word in text.split():
        yield word + " "
        await asyncio.sleep(0.04)

    # Reddit
    post_count = reddit.get("post_count", 0)
    bull_pct = reddit.get("bullish_pct", 50)
    bear_pct = reddit.get("bearish_pct", 50)
    reddit_label = reddit.get("sentiment_label", "MIXED")
    top_post = reddit.get("top_post_title", "N/A")[:60]

    text = (
        f"[REDDIT]Alpha Vantage:[/REDDIT] Found {post_count} recent deep-dive articles. "
        f"{bull_pct:.0f}% are [REDDIT]bullish[/REDDIT], "
        f"{bear_pct:.0f}% are [REDDIT]bearish[/REDDIT]. "
        f"Top headline: '[REDDIT]{top_post}[/REDDIT]'\n\n"
    )
    for word in text.split():
        yield word + " "
        await asyncio.sleep(0.04)

    # Google Trends
    trend_score = trends.get("trend_score", 50)
    trend_dir = trends.get("direction", "stable")
    spike = trends.get("spike_detected", False)
    spike_msg = "[WARN]Search spike detected — unusual activity![/WARN]" if spike else "Normal search volume."

    text = (
        f"[GOOGLE]Google Trends:[/GOOGLE] Searches for '[GOOGLE]{ticker} crash[/GOOGLE]' are "
        f"{trend_dir}. Trend score: [GOOGLE]{trend_score:.0f}/100[/GOOGLE]. "
        f"{spike_msg}\n\n"
    )
    for word in text.split():
        yield word + " "
        await asyncio.sleep(0.04)

    # Technical
    rsi = technical.get("rsi", 50)
    vol_ratio = technical.get("volume_ratio", 1.0)
    tech_verdict = technical.get("overall_technical_verdict", "NEUTRAL")
    bullish_c = technical.get("bullish_count", 0)
    bearish_c = technical.get("bearish_count", 0)
    macd_val = technical.get("macd", 0)
    macd_sig_name = "bullish" if macd_val > 0 else "bearish"

    rsi_label = "oversold" if rsi < 30 else "overbought" if rsi > 70 else "neutral range"

    text = (
        f"[TECH]Technical signals:[/TECH] RSI at [TECH]{rsi:.1f}[/TECH] — {rsi_label}. "
        f"Volume is [TECH]{vol_ratio:.1f}x[/TECH] above average. "
        f"MACD is [TECH]{macd_sig_name}[/TECH]. "
        f"[TECH]{bullish_c} bullish[/TECH] and [TECH]{bearish_c} bearish[/TECH] indicators.\n\n"
    )
    for word in text.split():
        yield word + " "
        await asyncio.sleep(0.04)

    # Events
    earnings_date = events.get("earnings_date", "Unknown")
    days_to = events.get("days_to_earnings", 90)
    has_catalyst = events.get("has_catalyst", False)
    analyst_con = events.get("analyst_consensus", "HOLD")
    analyst_target = events.get("avg_analyst_target", 0)

    if has_catalyst:
        earnings_msg = f"[WARN]Earnings in {days_to} days — strong catalyst![/WARN]"
    else:
        earnings_msg = f"[EVENT]Earnings on {earnings_date} ({days_to} days away)[/EVENT]"

    analyst_msg = f"[EVENT]Analyst consensus: {analyst_con}[/EVENT]"
    if analyst_target:
        analyst_msg += f", target [EVENT]${analyst_target:.2f}[/EVENT]"

    text = f"{earnings_msg}. {analyst_msg}.\n\n"
    for word in text.split():
        yield word + " "
        await asyncio.sleep(0.04)

    # Step 3: Conflict Analysis
    yield "[STEP]3[/STEP]"

    # Count directional signals
    sources = {
        "StockTwits": tweet_label,
        "News": news_label,
        "Alpha Vantage": reddit_label,
        "Trends": "BULLISH" if trend_score > 55 else "BEARISH" if trend_score < 45 else "NEUTRAL",
        "Technical": tech_verdict,
        "Events": analyst_con if analyst_con in ["BUY", "STRONG BUY"] else "BEARISH" if analyst_con == "SELL" else "NEUTRAL",
    }

    bullish_sources = [k for k, v in sources.items() if v in ["BULLISH", "BUY", "STRONG BUY"]]
    bearish_sources = [k for k, v in sources.items() if v in ["BEARISH", "SELL", "STRONG SELL"]]

    if len(bullish_sources) >= 4 or len(bearish_sources) >= 4:
        agree_count = max(len(bullish_sources), len(bearish_sources))
        agree_dir = "bullish" if len(bullish_sources) > len(bearish_sources) else "bearish"
        text = (
            f"[STRONG]Strong consensus detected[/STRONG] — {agree_count} out of 6 sources "
            f"point in the same {agree_dir} direction. "
            f"This is a [STRONG]high conviction setup[/STRONG].\n\n"
        )
    else:
        fear_count = len(bearish_sources)
        bull_count = len(bullish_sources)
        if fear_count > 0 and bull_count > 0:
            bull_src = ", ".join(bullish_sources[:2])
            bear_src = ", ".join(bearish_sources[:2])
            text = (
                f"[WARN]Conflict detected[/WARN] — {fear_count} sources ({bear_src}) signal bearish "
                f"but {bull_src} suggests bullish momentum. "
                f"The key question: which signal is historically stronger in this exact setup?\n\n"
            )
        else:
            text = (
                f"Signals are mixed with no strong directional consensus. "
                f"This calls for a more conservative position sizing.\n\n"
            )

    for word in text.split():
        yield word + " "
        await asyncio.sleep(0.04)

    # Step 4: Model Conviction
    yield "[STEP]4[/STEP]"

    # Use the actual model probabilities instead of random matching
    is_bullish_edge = confidence > 55 and direction == "UP"
    is_bearish_edge = confidence > 55 and direction == "DOWN"
    edge_desc = "clearly bullish" if is_bullish_edge else "slightly bearish" if is_bearish_edge else "neutral"

    rsi_range = f"{rsi-10:.0f}-{rsi+10:.0f}"
    sent_label_str = emotion_label.lower()

    catalyst_msg = "upcoming earnings" if has_catalyst else "no immediate catalysts"

    text = (
        f"Evaluating AI conviction... Based on the ML algorithm trained on its historical data, "
        f"the current setup (RSI [TECH]{rsi_range}[/TECH], "
        f"sentiment {sent_label_str}, {catalyst_msg}) "
        f"shows a [STRONG]{edge_desc}[/STRONG] edge. "
        f"The neural network assigned a {confidence}% probability to this directional move.\n\n"
    )
    for word in text.split():
        yield word + " "
        await asyncio.sleep(0.04)

    # Step 5: Final Verdict
    yield "[STEP]5[/STEP]"

    verdict = "BUY" if direction == "UP" and confidence > 60 else "SELL" if direction == "DOWN" and confidence > 60 else "HOLD"

    # Stop loss
    atr = technical.get("atr", current_price * 0.02) if technical else current_price * 0.02
    if not atr or atr == 0:
        atr = current_price * 0.02
    stop_loss = current_price - (2 * atr) if direction == "UP" else current_price + (2 * atr)

    risk = pred.get("risk_level", "MEDIUM")

    # Plain English reason
    if direction == "UP":
        plain_english = (
            f"{ticker} shows bullish signals across multiple sources with the social sentiment "
            f"confirming the technical setup. The risk-reward at current levels favors a long position "
            f"with a defined stop loss for protection."
        )
    else:
        plain_english = (
            f"{ticker} faces headwinds from bearish sentiment and weakening technicals. "
            f"The smart money appears to be reducing exposure. "
            f"Consider reducing position size or hedging downside risk."
        )

    tf_labels = {
        "1D": "1 day", "1W": "1 week", "1M": "1 month",
        "3M": "3 months", "6M": "6 months", "1Y": "1 year",
        "3Y": "3 years", "5Y": "5 years"
    }
    tf_label = tf_labels.get(timeframe, timeframe)

    text = (
        f"My decision: [STRONG]{verdict}[/STRONG] with [STRONG]{confidence}%[/STRONG] confidence.\n"
        f"Price target: [STRONG]${target:.2f}[/STRONG] ({tf_label}).\n"
        f"Stop loss: [STRONG]${stop_loss:.2f}[/STRONG].\n"
        f"Primary driver: {pred.get('key_driver', 'Mixed signals')}.\n"
        f"Risk level: [STRONG]{risk}[/STRONG].\n"
        f"In plain English: {plain_english}\n"
    )
    for word in text.split():
        yield word + " "
        await asyncio.sleep(0.04)

    yield "[DONE]"
