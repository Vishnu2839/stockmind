"""
emotion_fusion.py — Combine 6 data sources into a single 0-100 master emotion score.
"""

def fuse_emotion(
    stocktwits_bullish_pct: float,
    news_sentiment_pct: float,
    trends_score: float,
    fear_greed_score: float,
    days_to_earnings_n: float,
    analyst_score_n: float
) -> dict:
    score = (
        news_sentiment_pct     * 0.30 +
        stocktwits_bullish_pct * 0.25 +
        fear_greed_score       * 0.20 +
        (100 - trends_score)   * 0.12 +
        days_to_earnings_n     * 0.08 +
        analyst_score_n        * 0.05
    )
    score = round(max(0.0, min(100.0, score)), 1)
    if score < 25:
        label = "EXTREME FEAR"
    elif score < 45:
        label = "FEAR"
    elif score < 55:
        label = "NEUTRAL"
    elif score < 75:
        label = "GREED"
    else:
        label = "EXTREME GREED"
    return {"emotion_score": score, "emotion_label": label}
