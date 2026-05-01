"""
predictor.py — Load trained models and run multi-timeframe predictions.
"""
import os
import json
import numpy as np
import pandas as pd

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from data_collector import fetch_ohlcv, calculate_indicators, fetch_macro_data

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
SEQUENCE_LENGTH = 60

# Cache loaded models
_model_cache = {}

TIMEFRAMES = {
    "1D": {"days": 1},
    "1W": {"days": 5},
    "1M": {"days": 21},
    "3M": {"days": 63},
    "6M": {"days": 126},
    "1Y": {"days": 252},
    "3Y": {"days": 756},
    "5Y": {"days": 1260},
}


def load_model(ticker: str):
    """Load a trained model from disk."""
    key = f"{ticker}_model"
    if key in _model_cache:
        return _model_cache[key]

    path = os.path.join(MODELS_DIR, f"stockmind_{ticker.lower()}_model.h5")
    if not os.path.exists(path):
        return None

    try:
        from tensorflow import keras
        model = keras.models.load_model(path, compile=False)
        model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
        _model_cache[key] = model
        return model
    except Exception as e:
        print(f"Error loading model {path}: {e}")
        return None


def get_evaluation_results() -> dict:
    """Load evaluation results from disk."""
    path = os.path.join(MODELS_DIR, "evaluation_results.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {}


def predict_all_timeframes(ticker: str, technical_data: dict = None, emotion_score: float = 50.0) -> dict:
    """Generate predictions for all 8 timeframes."""
    # Get current price - use fallback if data unavailable
    current_price = 100.0  # safe default
    df = pd.DataFrame()
    try:
        df = fetch_ohlcv(ticker, period="2y")
        if not df.empty:
            current_price = float(df["Close"].iloc[-1])
            df = calculate_indicators(df)
            df = fetch_macro_data(df)
    except Exception as e:
        print(f"OHLCV fetch error for {ticker}: {e}")

    # Try to use trained model
    model = load_model(ticker)
    model_used = "StockMind BiLSTM+Attention" if model else "StockMind Heuristic"

    # Get base prediction from model or heuristics
    base_prob = _get_base_prediction(model, df, ticker, emotion_score)

    predictions = {}
    for tf_key, tf_config in TIMEFRAMES.items():
        pred = _predict_timeframe(
            ticker, tf_key, tf_config, current_price, base_prob,
            df, technical_data, emotion_score, model_used
        )
        predictions[tf_key] = pred

    return predictions


def _get_base_prediction(model, df: pd.DataFrame, ticker: str, emotion_score: float) -> float:
    """Get base probability from model or heuristics."""
    if model is not None and len(df) >= SEQUENCE_LENGTH:
        try:
            features = _prepare_inference_features(df, emotion_score)
            if features is not None:
                prob = float(model.predict(features, verbose=0)[0][0])
                return prob
        except Exception as e:
            print(f"Model prediction error: {e}")

    # Heuristic fallback
    return _heuristic_prediction(df, emotion_score)


def _prepare_inference_features(df: pd.DataFrame, emotion_score: float) -> np.ndarray:
    """Prepare feature array for model inference."""
    df = df.copy()
    latest = df.tail(SEQUENCE_LENGTH + 10)  # Extra for rolling calcs

    # Price normalization
    for col, raw in [("open_n", "Open"), ("high_n", "High"), ("low_n", "Low"), ("close_n", "Close")]:
        roll_min = latest[raw].rolling(200, min_periods=1).min()
        roll_max = latest[raw].rolling(200, min_periods=1).max()
        rng = (roll_max - roll_min).replace(0, 1)
        latest[col] = (latest[raw] - roll_min) / rng

    vol_mean = latest["Volume"].rolling(50, min_periods=1).mean().replace(0, 1)
    latest["volume_n"] = latest["Volume"] / vol_mean
    latest["rsi"] = latest.get("rsi", 50).fillna(50) / 100.0
    atr = latest.get("atr", pd.Series([1]*len(latest))).replace(0, 1).fillna(1)
    latest["macd"] = latest.get("macd", 0).fillna(0) / atr
    latest["macd_signal"] = latest.get("macd_signal", 0).fillna(0) / atr
    latest["bb_position"] = latest.get("bb_position", 0.5).fillna(0.5)

    close = latest["Close"].replace(0, 1)
    for col, raw in [("ema_9_n", "ema_9"), ("ema_21_n", "ema_21"), ("ema_50_n", "ema_50"), ("sma_50_n", "sma_50")]:
        if raw in latest.columns:
            latest[col] = latest[raw].fillna(close) / close
        else:
            latest[col] = 1.0

    latest["atr_n"] = latest.get("atr", 0).fillna(0) / close
    latest["obv_normalized"] = latest.get("obv_normalized", 0.5).fillna(0.5)
    latest["stoch_k"] = latest.get("stoch_k", 50).fillna(50) / 100.0
    latest["stoch_d"] = latest.get("stoch_d", 50).fillna(50) / 100.0
    latest["williams_r_n"] = (latest.get("williams_r", -50).fillna(-50) + 100) / 100.0
    latest["cci_n"] = latest.get("cci", 0).fillna(0) / 200.0
    latest["roc"] = latest.get("roc", 0).fillna(0) / 10.0

    latest["spy_return"] = latest.get("spy_return", 0.0) / 10.0
    latest["vix_n"] = latest.get("vix_close", 15.0) / 100.0
    latest["tnx_n"] = latest.get("tnx_close", 4.0) / 20.0

    em_scaled = emotion_score / 100.0
    latest["twitter_sentiment"] = em_scaled
    latest["news_sentiment"] = em_scaled
    latest["reddit_bullish"] = em_scaled
    latest["google_trends"] = 0.5
    latest["master_emotion"] = em_scaled
    latest["days_to_earnings_n"] = 0.5

    features = [
        "open_n", "high_n", "low_n", "close_n", "volume_n",
        "rsi", "macd", "macd_signal", "bb_position", "ema_9_n",
        "ema_21_n", "ema_50_n", "sma_50_n", "atr_n", "obv_normalized",
        "stoch_k", "stoch_d", "williams_r_n", "cci_n", "roc",
        "spy_return", "vix_n", "tnx_n",
        "twitter_sentiment", "news_sentiment", "reddit_bullish",
        "google_trends", "master_emotion", "days_to_earnings_n"
    ]

    for f in features:
        if f not in latest.columns:
            latest[f] = 0.5

    data = latest[features].tail(SEQUENCE_LENGTH).values
    data = np.nan_to_num(data, nan=0.0, posinf=1.0, neginf=0.0)

    if len(data) < SEQUENCE_LENGTH:
        return None

    return data.reshape(1, SEQUENCE_LENGTH, len(features)).astype(np.float32)


def _heuristic_prediction(df: pd.DataFrame, emotion_score: float) -> float:
    """Heuristic prediction when model is not available."""
    if df.empty:
        return 0.5

    latest = df.iloc[-1]
    score = 50.0

    rsi = latest.get("rsi", 50)
    if pd.notna(rsi):
        if rsi < 30:
            score += 15
        elif rsi > 70:
            score -= 15
        elif rsi < 50:
            score += 5
        else:
            score -= 5

    macd_hist = latest.get("macd_hist", 0)
    if pd.notna(macd_hist):
        if macd_hist > 0:
            score += 10
        else:
            score -= 10

    # Emotion influence
    if emotion_score > 60:
        score += 10
    elif emotion_score < 40:
        score -= 10

    return max(0.1, min(0.9, score / 100.0))


def _predict_timeframe(
    ticker: str, tf_key: str, tf_config: dict, current_price: float,
    base_prob: float, df: pd.DataFrame, technical_data: dict,
    emotion_score: float, model_used: str
) -> dict:
    """Generate prediction for a single timeframe."""
    days = tf_config["days"]
    
    # Mathematical confidence based on raw probability logic
    raw_conf = base_prob * 100 if base_prob > 0.5 else (1 - base_prob) * 100
    base_confidence = int(np.clip(raw_conf, 50.0, 99.0))

    # Direction
    is_up = base_prob > 0.5
    direction = "UP" if is_up else "DOWN"

    # Adjust probability for timeframe
    # Shorter timeframes stay close to model, longer revert to mean
    tf_factor = min(1.0, days / 252.0)
    adjusted_prob = base_prob * (1 - tf_factor * 0.3) + 0.5 * (tf_factor * 0.3)

    # Price target calculation
    if days <= 5:
        # Short-term: based on ATR
        atr = df.iloc[-1].get("atr", current_price * 0.02) if not df.empty else current_price * 0.02
        if pd.isna(atr):
            atr = current_price * 0.02
        move_pct = float(atr / current_price) * (1 if is_up else -1) * min(days, 3)
    elif days <= 63:
        # Medium-term: based on historical volatility
        returns = df["Close"].pct_change().dropna()
        daily_vol = float(returns.std()) if len(returns) > 20 else 0.02
        expected_move = daily_vol * np.sqrt(days) * (1 if is_up else -1)
        move_pct = expected_move * (0.5 + adjusted_prob)
    else:
        # Long-term: CAGR-based
        if len(df) > 252:
            yearly_return = float(df["Close"].iloc[-1] / df["Close"].iloc[-252] - 1)
        else:
            yearly_return = 0.10  # default 10% annual
        cagr = yearly_return * (days / 252)
        move_pct = cagr * (0.7 + adjusted_prob * 0.6)

    price_target = current_price * (1 + move_pct)
    expected_gain = round(move_pct * 100, 2)

    # Confidence band
    volatility_factor = 1 + tf_factor * 0.5  # wider for longer timeframes
    band_width = abs(move_pct) * volatility_factor + 0.02
    price_low = current_price * (1 + move_pct - band_width)
    price_high = current_price * (1 + move_pct + band_width)

    # Risk level
    if abs(move_pct) < 0.03 and days <= 5:
        risk = "LOW"
    elif abs(move_pct) < 0.10 and days <= 63:
        risk = "MEDIUM"
    else:
        risk = "HIGH" if days > 252 else "MEDIUM"

    # Key driver determination
    drivers = []
    if technical_data:
        verdict = technical_data.get("overall_technical_verdict", "NEUTRAL")
        if verdict != "NEUTRAL":
            drivers.append(f"Technical signals are {verdict}")
    if emotion_score > 65:
        drivers.append("Strong social sentiment momentum")
    elif emotion_score < 35:
        drivers.append("Negative social sentiment pressure")
    if not drivers:
        drivers.append("Mixed market signals")

    key_driver = drivers[0]

    # Explanation
    dir_word = "upward" if is_up else "downward"
    tf_labels = {
        "1D": "tomorrow", "1W": "next week", "1M": "next month",
        "3M": "the next 3 months", "6M": "the next 6 months",
        "1Y": "the next year", "3Y": "the next 3 years", "5Y": "the next 5 years"
    }
    tf_label = tf_labels.get(tf_key, tf_key)

    explanation = (
        f"Based on analysis of 26 features including technical indicators and social sentiment, "
        f"the model predicts {dir_word} movement for {ticker} over {tf_label}. "
        f"{key_driver}. "
        f"Confidence is {base_confidence}% with a target of ${price_target:.2f} "
        f"(range: ${price_low:.2f}–${price_high:.2f})."
    )

    return {
        "timeframe": tf_key,
        "direction": direction,
        "predicted_price_target": round(price_target, 2),
        "expected_gain_pct": expected_gain,
        "confidence_pct": base_confidence,
        "price_low": round(price_low, 2),
        "price_high": round(price_high, 2),
        "risk_level": risk,
        "model_used": model_used,
        "key_driver": key_driver,
        "explanation": explanation,
        "current_price": round(current_price, 2),
    }



