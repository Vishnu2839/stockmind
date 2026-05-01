"""
regime_detector.py — HMM-based market regime classification (Bull/Bear/Volatile).
"""
import numpy as np
import pandas as pd
import warnings

warnings.filterwarnings("ignore")


class RegimeDetector:
    """Detect market regime using a Gaussian HMM with 3 hidden states."""

    REGIMES = {0: "BULL", 1: "BEAR", 2: "VOLATILE"}

    def __init__(self):
        self.model = None
        self.fitted = False

    def fit(self, df: pd.DataFrame):
        """Train HMM on historical OHLCV data."""
        if df.empty or len(df) < 60:
            self.fitted = False
            return

        try:
            from hmmlearn.hmm import GaussianHMM

            # Features: daily returns, realized vol (20d), volume ratio
            returns = df["Close"].pct_change().dropna()
            vol_20 = returns.rolling(20).std().dropna()

            # Align all features
            min_len = min(len(returns), len(vol_20))
            returns = returns.iloc[-min_len:]
            vol_20 = vol_20.iloc[-min_len:]

            vol_series = df["Volume"].iloc[-min_len:]
            vol_mean = vol_series.rolling(20).mean()
            vol_ratio = (vol_series / vol_mean).dropna()

            min_len = min(len(returns), len(vol_20), len(vol_ratio))
            features = np.column_stack([
                returns.iloc[-min_len:].values,
                vol_20.iloc[-min_len:].values,
                vol_ratio.iloc[-min_len:].values,
            ])

            # Remove any NaN/inf
            mask = np.isfinite(features).all(axis=1)
            features = features[mask]

            if len(features) < 60:
                self.fitted = False
                return

            self.model = GaussianHMM(
                n_components=3,
                covariance_type="full",
                n_iter=200,
                random_state=42,
            )
            self.model.fit(features)
            self.fitted = True

            # Map states to regimes based on mean returns
            state_means = self.model.means_[:, 0]  # mean return per state
            state_vols = self.model.means_[:, 1]    # mean vol per state

            # Sort states: highest return = BULL, lowest = BEAR, highest vol = VOLATILE
            sorted_by_return = np.argsort(state_means)
            self.REGIMES = {
                sorted_by_return[2]: "BULL",
                sorted_by_return[0]: "BEAR",
                sorted_by_return[1]: "VOLATILE",
            }

            # If the middle state has highest vol, mark it VOLATILE
            vol_state = np.argmax(state_vols)
            if vol_state not in [sorted_by_return[0], sorted_by_return[2]]:
                self.REGIMES[vol_state] = "VOLATILE"

        except Exception as e:
            print(f"HMM training error: {e}")
            self.fitted = False

    def predict_regime(self, df: pd.DataFrame) -> dict:
        """Predict current market regime."""
        if not self.fitted or self.model is None:
            return _fallback_regime(df)

        try:
            returns = df["Close"].pct_change().dropna()
            vol_20 = returns.rolling(20).std().dropna()
            min_len = min(len(returns), len(vol_20))
            returns = returns.iloc[-min_len:]
            vol_20 = vol_20.iloc[-min_len:]

            vol_series = df["Volume"].iloc[-min_len:]
            vol_mean = vol_series.rolling(20).mean()
            vol_ratio = (vol_series / vol_mean).dropna()

            min_len = min(len(returns), len(vol_20), len(vol_ratio))
            features = np.column_stack([
                returns.iloc[-min_len:].values,
                vol_20.iloc[-min_len:].values,
                vol_ratio.iloc[-min_len:].values,
            ])
            mask = np.isfinite(features).all(axis=1)
            features = features[mask]

            if len(features) < 5:
                return _fallback_regime(df)

            states = self.model.predict(features)
            current_state = int(states[-1])
            regime = self.REGIMES.get(current_state, "VOLATILE")

            # State probabilities
            probs = self.model.predict_proba(features[-1:])
            state_probs = {self.REGIMES.get(i, "UNKNOWN"): round(float(p), 3) for i, p in enumerate(probs[0])}

            return {
                "regime": regime,
                "state_probabilities": state_probs,
                "confidence": round(float(max(probs[0])) * 100, 1),
            }
        except Exception as e:
            print(f"Regime prediction error: {e}")
            return _fallback_regime(df)


def _fallback_regime(df: pd.DataFrame) -> dict:
    """Simple fallback regime detection based on recent returns."""
    if df.empty or len(df) < 20:
        return {"regime": "VOLATILE", "state_probabilities": {"BULL": 0.33, "BEAR": 0.33, "VOLATILE": 0.34}, "confidence": 33.0}

    returns_20d = (df["Close"].iloc[-1] / df["Close"].iloc[-20] - 1) * 100
    vol = df["Close"].pct_change().iloc[-20:].std() * 100

    if returns_20d > 3 and vol < 2:
        regime = "BULL"
    elif returns_20d < -3:
        regime = "BEAR"
    else:
        regime = "VOLATILE"

    return {
        "regime": regime,
        "state_probabilities": {
            "BULL": 0.6 if regime == "BULL" else 0.2,
            "BEAR": 0.6 if regime == "BEAR" else 0.2,
            "VOLATILE": 0.6 if regime == "VOLATILE" else 0.2,
        },
        "confidence": 60.0,
    }


# Global detector instance
_detector = RegimeDetector()


def detect_regime(df: pd.DataFrame) -> dict:
    """Public API: fit (if needed) and predict regime."""
    global _detector
    if not _detector.fitted:
        _detector.fit(df)
    return _detector.predict_regime(df)
