"""
data_collector.py — Fetches OHLCV data via Alpha Vantage (primary) and yfinance (fallback),
and calculates all technical indicators using the `ta` library.
"""
import os
import requests
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import ta
from ta.momentum import RSIIndicator, StochRSIIndicator, StochasticOscillator, WilliamsRIndicator, ROCIndicator
from ta.trend import MACD, EMAIndicator, SMAIndicator, CCIIndicator
from ta.volatility import BollingerBands, AverageTrueRange
from ta.volume import OnBalanceVolumeIndicator, MFIIndicator

ALPHA_VANTAGE_KEY = os.environ.get("ALPHA_VANTAGE_KEY", "RL30PECT2JGPAIDH")

# ── Disk-based cache (survives container restarts) + in-memory cache ─────────
import time
import json
_PRICE_CACHE: dict = {}  # {ticker: {data: ..., ts: float}}
_CACHE_TTL = 300  # 5 minutes in-memory
_DISK_CACHE_FILE = "/tmp/stockmind_price_cache.json"
_DISK_CACHE_TTL = 3600  # 1 hour disk cache


def _load_disk_cache():
    global _PRICE_CACHE
    try:
        if os.path.exists(_DISK_CACHE_FILE):
            with open(_DISK_CACHE_FILE, "r") as f:
                disk = json.load(f)
            now = time.time()
            # Load non-expired entries into memory
            for k, v in disk.items():
                if now - v.get("ts", 0) < _DISK_CACHE_TTL:
                    _PRICE_CACHE[k] = v
    except Exception:
        pass


def _save_disk_cache():
    try:
        with open(_DISK_CACHE_FILE, "w") as f:
            json.dump(_PRICE_CACHE, f)
    except Exception:
        pass


def _cache_get(ticker: str):
    entry = _PRICE_CACHE.get(ticker)
    if entry and (time.time() - entry["ts"]) < _CACHE_TTL:
        return entry["data"]
    return None


def _cache_set(ticker: str, data: dict):
    _PRICE_CACHE[ticker] = {"data": data, "ts": time.time()}
    _save_disk_cache()


# Load existing cache on import
_load_disk_cache()
COMPANY_NAMES = {
    "AAPL": "Apple Inc.", "TSLA": "Tesla Inc.", "NVDA": "NVIDIA Corporation",
    "MSFT": "Microsoft Corporation", "GOOGL": "Alphabet Inc.", "AMZN": "Amazon.com Inc.",
    "META": "Meta Platforms Inc.", "NFLX": "Netflix Inc.", "AMD": "Advanced Micro Devices",
    "INTC": "Intel Corporation", "DIS": "Walt Disney Company", "BA": "Boeing Company",
    "JPM": "JPMorgan Chase & Co.", "V": "Visa Inc.", "WMT": "Walmart Inc.",
    "PG": "Procter & Gamble Co.", "JNJ": "Johnson & Johnson",
    "RELIANCE.NS": "Reliance Industries", "TCS.NS": "Tata Consultancy Services",
    "INFY": "Infosys Limited",
}


def _get_av_quote(ticker: str) -> dict:
    """Fetch real-time quote from Alpha Vantage (with cache)."""
    cached = _cache_get(f"quote_{ticker}")
    if cached:
        return cached
    try:
        url = (
            f"https://www.alphavantage.co/query"
            f"?function=GLOBAL_QUOTE&symbol={ticker}&apikey={ALPHA_VANTAGE_KEY}"
        )
        resp = requests.get(url, timeout=10)
        data = resp.json().get("Global Quote", {})
        if not data or "05. price" not in data:
            return {}
        price = float(data["05. price"])
        change = float(data["09. change"])
        change_pct = float(data["10. change percent"].replace("%", ""))
        high_52 = float(data.get("03. high", 0))
        low_52 = float(data.get("04. low", 0))
        result = {
            "current_price": round(price, 2),
            "price_change": round(change, 2),
            "price_change_pct": round(change_pct, 2),
            "fifty_two_week_high": high_52,
            "fifty_two_week_low": low_52,
        }
        _cache_set(f"quote_{ticker}", result)
        return result
    except Exception as e:
        print(f"Alpha Vantage quote error for {ticker}: {e}")
        return {}


def _get_av_daily(ticker: str, outputsize: str = "full") -> pd.DataFrame:
    """Fetch daily OHLCV from Alpha Vantage and return as DataFrame."""
    try:
        url = (
            f"https://www.alphavantage.co/query"
            f"?function=TIME_SERIES_DAILY&symbol={ticker}"
            f"&outputsize={outputsize}&apikey={ALPHA_VANTAGE_KEY}"
        )
        resp = requests.get(url, timeout=15)
        ts = resp.json().get("Time Series (Daily)", {})
        if not ts:
            return pd.DataFrame()
        rows = []
        for date_str, vals in ts.items():
            rows.append({
                "Date": pd.to_datetime(date_str),
                "Open": float(vals["1. open"]),
                "High": float(vals["2. high"]),
                "Low": float(vals["3. low"]),
                "Close": float(vals["4. close"]),
                "Volume": int(vals["5. volume"]),
            })
        df = pd.DataFrame(rows).set_index("Date").sort_index()
        return df
    except Exception as e:
        print(f"Alpha Vantage daily error for {ticker}: {e}")
        return pd.DataFrame()


def _get_yf_session():
    """Create a yfinance-compatible requests session with browser-like headers."""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    })
    return session


def fetch_ohlcv(ticker: str, period: str = "2y", interval: str = "1d") -> pd.DataFrame:
    """Fetch OHLCV data — Alpha Vantage primary, yfinance with headers fallback."""
    # Try Alpha Vantage first
    try:
        df = _get_av_daily(ticker, outputsize="full")
        if not df.empty:
            days_map = {"1y": 365, "2y": 730, "5y": 1825, "1mo": 30, "3mo": 90, "6mo": 180}
            cutoff_days = days_map.get(period, 730)
            cutoff = pd.Timestamp.now() - pd.Timedelta(days=cutoff_days)
            df = df[df.index >= cutoff]
            if not df.empty:
                return df
    except Exception as e:
        print(f"AV fetch_ohlcv error for {ticker}: {e}")

    # Fallback: yfinance with browser-like session headers
    try:
        session = _get_yf_session()
        stock = yf.Ticker(ticker, session=session)
        df = stock.history(period=period, interval=interval)
        if df.empty:
            # Try without custom session as last resort
            stock2 = yf.Ticker(ticker)
            df = stock2.history(period=period, interval=interval)
        if not df.empty:
            df.index = pd.to_datetime(df.index)
            if df.index.tz is not None:
                df.index = df.index.tz_localize(None)
            return df
    except Exception as e:
        print(f"yfinance fetch error for {ticker}: {e}")

    return pd.DataFrame()


def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate all technical indicators on OHLCV dataframe using the `ta` library."""
    if df.empty or len(df) < 50:
        return df

    close = df["Close"]
    high = df["High"]
    low = df["Low"]
    volume = df["Volume"]

    # RSI (14)
    try:
        df["rsi"] = RSIIndicator(close=close, window=14).rsi()
    except Exception:
        df["rsi"] = 50.0

    # MACD
    try:
        macd_ind = MACD(close=close, window_slow=26, window_fast=12, window_sign=9)
        df["macd"] = macd_ind.macd()
        df["macd_signal"] = macd_ind.macd_signal()
        df["macd_hist"] = macd_ind.macd_diff()
    except Exception:
        df["macd"] = 0.0
        df["macd_signal"] = 0.0
        df["macd_hist"] = 0.0

    # Bollinger Bands
    try:
        bb = BollingerBands(close=close, window=20, window_dev=2)
        df["bb_upper"] = bb.bollinger_hband()
        df["bb_middle"] = bb.bollinger_mavg()
        df["bb_lower"] = bb.bollinger_lband()
        bb_range = df["bb_upper"] - df["bb_lower"]
        bb_range = bb_range.replace(0, np.nan)
        df["bb_width"] = bb_range / df["bb_middle"]
        df["bb_position"] = (close - df["bb_lower"]) / bb_range
    except Exception:
        df["bb_upper"] = close
        df["bb_middle"] = close
        df["bb_lower"] = close
        df["bb_width"] = 0.0
        df["bb_position"] = 0.5

    # EMAs
    for period in [9, 21, 50]:
        try:
            df[f"ema_{period}"] = EMAIndicator(close=close, window=period).ema_indicator()
        except Exception:
            df[f"ema_{period}"] = close

    # SMAs
    for period in [20, 50, 200]:
        try:
            df[f"sma_{period}"] = SMAIndicator(close=close, window=period).sma_indicator()
        except Exception:
            df[f"sma_{period}"] = close

    # ATR
    try:
        df["atr"] = AverageTrueRange(high=high, low=low, close=close, window=14).average_true_range()
    except Exception:
        df["atr"] = 0.0

    # OBV
    try:
        df["obv"] = OnBalanceVolumeIndicator(close=close, volume=volume).on_balance_volume()
    except Exception:
        df["obv"] = 0.0

    # Stochastic
    try:
        stoch = StochasticOscillator(high=high, low=low, close=close, window=14, smooth_window=3)
        df["stoch_k"] = stoch.stoch()
        df["stoch_d"] = stoch.stoch_signal()
    except Exception:
        df["stoch_k"] = 50.0
        df["stoch_d"] = 50.0

    # Williams %R
    try:
        df["williams_r"] = WilliamsRIndicator(high=high, low=low, close=close, lbp=14).williams_r()
    except Exception:
        df["williams_r"] = -50.0

    # CCI
    try:
        df["cci"] = CCIIndicator(high=high, low=low, close=close, window=20).cci()
    except Exception:
        df["cci"] = 0.0

    # ROC
    try:
        df["roc"] = ROCIndicator(close=close, window=10).roc()
    except Exception:
        df["roc"] = 0.0

    # MFI
    try:
        df["mfi"] = MFIIndicator(high=high, low=low, close=close, volume=volume, window=14).money_flow_index()
    except Exception:
        df["mfi"] = 50.0

    # VWAP (approximate for daily)
    df["vwap"] = (volume * (high + low + close) / 3).cumsum() / volume.cumsum()

    # OBV normalized
    if "obv" in df.columns:
        obv_min = df["obv"].rolling(50, min_periods=1).min()
        obv_max = df["obv"].rolling(50, min_periods=1).max()
        obv_range = obv_max - obv_min
        obv_range = obv_range.replace(0, np.nan)
        df["obv_normalized"] = (df["obv"] - obv_min) / obv_range

    return df


def fetch_macro_data(df: pd.DataFrame) -> pd.DataFrame:
    """Fetch SPY, VIX, and TNX to provide macroeconomic context."""
    if df.empty:
        return df

    # Create empty columns
    df["spy_return"] = 0.0
    df["vix_close"] = 15.0
    df["tnx_close"] = 4.0

    start_date = df.index.min().strftime('%Y-%m-%d')
    end_date = (df.index.max() + timedelta(days=2)).strftime('%Y-%m-%d')

    try:
        # Fetch SPY
        spy = yf.Ticker("SPY").history(start=start_date, end=end_date)
        if not spy.empty:
            if spy.index.tz is not None:
                spy.index = spy.index.tz_localize(None)
            spy_ret = spy["Close"].pct_change().fillna(0) * 100
            spy_map = spy_ret.groupby(spy_ret.index.normalize()).first()
            df["spy_return"] = pd.Series(df.index.normalize()).map(spy_map).values
            df["spy_return"] = df["spy_return"].ffill().fillna(0.0)

        # Fetch VIX
        vix = yf.Ticker("^VIX").history(start=start_date, end=end_date)
        if not vix.empty:
            if vix.index.tz is not None:
                vix.index = vix.index.tz_localize(None)
            vix_map = vix["Close"].groupby(vix["Close"].index.normalize()).first()
            df["vix_close"] = pd.Series(df.index.normalize()).map(vix_map).values
            df["vix_close"] = df["vix_close"].ffill().fillna(15.0)

        # Fetch TNX (10 Yr Yield)
        tnx = yf.Ticker("^TNX").history(start=start_date, end=end_date)
        if not tnx.empty:
            if tnx.index.tz is not None:
                tnx.index = tnx.index.tz_localize(None)
            tnx_map = tnx["Close"].groupby(tnx["Close"].index.normalize()).first()
            df["tnx_close"] = pd.Series(df.index.normalize()).map(tnx_map).values
            df["tnx_close"] = df["tnx_close"].ffill().fillna(4.0)

    except Exception as e:
        print(f"Error fetching macro data: {e}")

    return df


def detect_patterns(df: pd.DataFrame) -> dict:
    """Detect chart patterns from the indicator data."""
    patterns = []
    if df.empty or len(df) < 5:
        return {
            "pattern_signals": [],
            "overall_technical_verdict": "NEUTRAL",
            "bullish_count": 0,
            "bearish_count": 0,
        }

    latest = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else latest
    bullish = 0
    bearish = 0

    # RSI signals
    rsi_val = latest.get("rsi", 50)
    if pd.notna(rsi_val):
        if rsi_val < 30:
            patterns.append({"name": "Oversold RSI", "type": "BULLISH", "detail": f"RSI = {rsi_val:.1f}"})
            bullish += 1
        elif rsi_val > 70:
            patterns.append({"name": "Overbought RSI", "type": "BEARISH", "detail": f"RSI = {rsi_val:.1f}"})
            bearish += 1
        elif rsi_val < 50:
            bearish += 0.5
        else:
            bullish += 0.5

    # MACD signals
    macd_val = latest.get("macd", 0)
    macd_sig = latest.get("macd_signal", 0)
    if pd.notna(macd_val) and pd.notna(macd_sig):
        if macd_val > macd_sig:
            patterns.append({"name": "MACD Bullish Crossover", "type": "BULLISH", "detail": "MACD > Signal"})
            bullish += 1
        else:
            patterns.append({"name": "MACD Bearish", "type": "BEARISH", "detail": "MACD < Signal"})
            bearish += 1

    # Golden / Death Cross
    sma50 = latest.get("sma_50", None)
    sma200 = latest.get("sma_200", None)
    prev_sma50 = prev.get("sma_50", None)
    prev_sma200 = prev.get("sma_200", None)
    if all(pd.notna(v) for v in [sma50, sma200, prev_sma50, prev_sma200]):
        if prev_sma50 < prev_sma200 and sma50 > sma200:
            patterns.append({"name": "Golden Cross", "type": "BULLISH", "detail": "SMA50 crossed above SMA200"})
            bullish += 2
        elif prev_sma50 > prev_sma200 and sma50 < sma200:
            patterns.append({"name": "Death Cross", "type": "BEARISH", "detail": "SMA50 crossed below SMA200"})
            bearish += 2

    # Volume spike
    if len(df) >= 20:
        avg_vol = df["Volume"].iloc[-20:].mean()
        curr_vol = latest.get("Volume", 0)
        if avg_vol > 0 and curr_vol > 2 * avg_vol:
            patterns.append({"name": "Volume Spike", "type": "NEUTRAL", "detail": f"{curr_vol / avg_vol:.1f}x average"})

    # Bollinger Squeeze
    bb_width = latest.get("bb_width", None)
    if pd.notna(bb_width) and len(df) >= 50:
        avg_bb_width = df["bb_width"].iloc[-50:].mean()
        if pd.notna(avg_bb_width) and avg_bb_width > 0 and bb_width < avg_bb_width * 0.5:
            patterns.append({"name": "Bollinger Squeeze", "type": "NEUTRAL", "detail": "Low volatility — breakout expected"})

    # EMA trend
    ema9 = latest.get("ema_9", None)
    ema21 = latest.get("ema_21", None)
    if pd.notna(ema9) and pd.notna(ema21):
        if ema9 > ema21:
            bullish += 1
        else:
            bearish += 1

    # Stochastic
    stoch_k = latest.get("stoch_k", 50)
    if pd.notna(stoch_k):
        if stoch_k < 20:
            bullish += 1
        elif stoch_k > 80:
            bearish += 1

    # Williams %R
    willr_val = latest.get("williams_r", -50)
    if pd.notna(willr_val):
        if willr_val < -80:
            bullish += 1
        elif willr_val > -20:
            bearish += 1

    # CCI
    cci_val = latest.get("cci", 0)
    if pd.notna(cci_val):
        if cci_val < -100:
            bullish += 0.5
        elif cci_val > 100:
            bearish += 0.5

    # Support / Resistance
    support = df["Low"].iloc[-20:].min()
    resistance = df["High"].iloc[-20:].max()

    # Determine verdict
    if bullish > bearish + 1:
        verdict = "BULLISH"
    elif bearish > bullish + 1:
        verdict = "BEARISH"
    else:
        verdict = "NEUTRAL"

    return {
        "pattern_signals": patterns,
        "overall_technical_verdict": verdict,
        "bullish_count": int(bullish),
        "bearish_count": int(bearish),
        "support_level": round(float(support), 2),
        "resistance_level": round(float(resistance), 2),
    }


def get_technical_analysis(ticker: str) -> dict:
    """Full technical analysis: fetch data, compute indicators, detect patterns."""
    df = fetch_ohlcv(ticker, period="2y")
    if df.empty:
        return _empty_technical()

    df = calculate_indicators(df)
    patterns = detect_patterns(df)
    latest = df.iloc[-1]

    # Volume ratio
    vol_ratio = 1.0
    if len(df) >= 20:
        avg_vol = df["Volume"].iloc[-20:].mean()
        if avg_vol > 0:
            vol_ratio = float(latest["Volume"] / avg_vol)

    def safe(key, default=0.0):
        v = latest.get(key, default)
        return round(float(v), 4) if pd.notna(v) else default

    result = {
        "rsi": safe("rsi", 50),
        "macd": safe("macd"),
        "macd_signal": safe("macd_signal"),
        "macd_hist": safe("macd_hist"),
        "bb_upper": safe("bb_upper"),
        "bb_middle": safe("bb_middle"),
        "bb_lower": safe("bb_lower"),
        "bb_width": safe("bb_width"),
        "bb_position": safe("bb_position", 0.5),
        "ema_9": safe("ema_9"),
        "ema_21": safe("ema_21"),
        "ema_50": safe("ema_50"),
        "sma_20": safe("sma_20"),
        "sma_50": safe("sma_50"),
        "sma_200": safe("sma_200"),
        "atr": safe("atr"),
        "obv": safe("obv"),
        "obv_normalized": safe("obv_normalized", 0.5),
        "stoch_k": safe("stoch_k", 50),
        "stoch_d": safe("stoch_d", 50),
        "williams_r": safe("williams_r", -50),
        "cci": safe("cci"),
        "roc": safe("roc"),
        "mfi": safe("mfi", 50),
        "vwap": safe("vwap"),
        "volume_ratio": round(vol_ratio, 2),
        **patterns,
    }
    return result


def get_historical_data(ticker: str, days: int = 365) -> list:
    """Return historical OHLCV + indicators as list of dicts for the frontend chart."""
    period = "5y" if days > 365 else "2y" if days > 90 else "1y"
    df = fetch_ohlcv(ticker, period=period)
    if df.empty:
        return []
    df = calculate_indicators(df)
    df = df.tail(days)
    records = []
    for idx, row in df.iterrows():
        records.append({
            "date": idx.strftime("%Y-%m-%d"),
            "open": round(float(row.get("Open", 0)), 2),
            "high": round(float(row.get("High", 0)), 2),
            "low": round(float(row.get("Low", 0)), 2),
            "close": round(float(row.get("Close", 0)), 2),
            "volume": int(row.get("Volume", 0)),
            "rsi": round(float(row.get("rsi", 50)), 2) if pd.notna(row.get("rsi")) else 50,
            "macd": round(float(row.get("macd", 0)), 4) if pd.notna(row.get("macd")) else 0,
            "sma_50": round(float(row.get("sma_50", 0)), 2) if pd.notna(row.get("sma_50")) else None,
            "ema_9": round(float(row.get("ema_9", 0)), 2) if pd.notna(row.get("ema_9")) else None,
        })
    return records


def get_stock_info(ticker: str) -> dict:
    """Get basic stock info — Alpha Vantage primary, yfinance fallback."""
    company_name = COMPANY_NAMES.get(ticker.upper(), ticker.upper())

    # Try Alpha Vantage first
    av_quote = _get_av_quote(ticker)
    if av_quote and av_quote.get("current_price", 0) > 0:
        return {
            "ticker": ticker.upper(),
            "company_name": company_name,
            "current_price": av_quote["current_price"],
            "price_change": av_quote["price_change"],
            "price_change_pct": av_quote["price_change_pct"],
            "market_cap": 0,
            "pe_ratio": None,
            "exchange": "",
            "sector": "",
            "industry": "",
            "fifty_two_week_high": av_quote.get("fifty_two_week_high"),
            "fifty_two_week_low": av_quote.get("fifty_two_week_low"),
        }

    # Fallback to yfinance
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        hist = stock.history(period="5d")
        if hist.empty:
            return _empty_info(ticker)

        current = float(hist["Close"].iloc[-1])
        prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current
        change = current - prev
        change_pct = (change / prev * 100) if prev != 0 else 0

        return {
            "ticker": ticker.upper(),
            "company_name": info.get("shortName", info.get("longName", company_name)),
            "current_price": round(current, 2),
            "price_change": round(change, 2),
            "price_change_pct": round(change_pct, 2),
            "market_cap": info.get("marketCap", 0),
            "pe_ratio": info.get("trailingPE", None),
            "exchange": info.get("exchange", ""),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh", None),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow", None),
        }
    except Exception as e:
        print(f"Error getting info for {ticker}: {e}")
        return _empty_info(ticker)


def _empty_info(ticker: str) -> dict:
    return {
        "ticker": ticker.upper(),
        "company_name": ticker.upper(),
        "current_price": 0,
        "price_change": 0,
        "price_change_pct": 0,
        "market_cap": 0,
        "pe_ratio": None,
        "exchange": "",
        "sector": "",
        "industry": "",
        "fifty_two_week_high": None,
        "fifty_two_week_low": None,
    }


def _empty_technical() -> dict:
    return {
        "rsi": 50, "macd": 0, "macd_signal": 0, "macd_hist": 0,
        "bb_upper": 0, "bb_middle": 0, "bb_lower": 0, "bb_width": 0, "bb_position": 0.5,
        "ema_9": 0, "ema_21": 0, "ema_50": 0,
        "sma_20": 0, "sma_50": 0, "sma_200": 0,
        "atr": 0, "obv": 0, "obv_normalized": 0.5,
        "stoch_k": 50, "stoch_d": 50, "williams_r": -50,
        "cci": 0, "roc": 0, "mfi": 50, "vwap": 0,
        "volume_ratio": 1.0,
        "pattern_signals": [],
        "overall_technical_verdict": "NEUTRAL",
        "bullish_count": 0, "bearish_count": 0,
        "support_level": 0, "resistance_level": 0,
    }
