import os
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from data_collector import fetch_ohlcv, calculate_indicators
from train import prepare_features, create_sequences, generate_synthetic_emotion, TICKERS, FULL_FEATURES, BASE_FEATURES
from evaluate import evaluate_model
from predictor import MODELS_DIR

def evaluate_all_existing():
    results = {}
    for ticker in TICKERS:
        try:
            print(f"Evaluating {ticker}...")
            df = fetch_ohlcv(ticker, period="2y", interval="1d")
            df = calculate_indicators(df)
            
            # Add synthetic emotions for standard metrics computation
            df = generate_synthetic_emotion(df)
            df = prepare_features(df)
            
            # Baseline feature set
            X_base, y_base = create_sequences(df, BASE_FEATURES, seq_len=60)
            
            # Full feature set
            X_full, y_full = create_sequences(df, FULL_FEATURES, seq_len=60)
            
            split_base = int(len(X_base) * 0.8)
            X_test_base, y_test_base = X_base[split_base:], y_base[split_base:]
            
            split_full = int(len(X_full) * 0.8)
            X_test_full, y_test_full = X_full[split_full:], y_full[split_full:]
            
            ticker_results = {}
            
            # Evaluate baseline
            base_model_path = os.path.join(MODELS_DIR, f"stockmind_{ticker.lower()}_baseline.h5")
            if os.path.exists(base_model_path):
                base_model = tf.keras.models.load_model(base_model_path, compile=False)
                base_model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
                res_base = evaluate_model(base_model, X_test_base, y_test_base, f"{ticker}_baseline")
                ticker_results["baseline"] = res_base
            
            # Evaluate full
            full_model_path = os.path.join(MODELS_DIR, f"stockmind_{ticker.lower()}_full.h5")
            if os.path.exists(full_model_path):
                full_model = tf.keras.models.load_model(full_model_path, compile=False)
                full_model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
                res_full = evaluate_model(full_model, X_test_full, y_test_full, f"{ticker}_full")
                ticker_results["full"] = res_full
            
            if ticker_results:
                results[ticker] = ticker_results
                
        except Exception as e:
            print(f"Error evaluating {ticker}: {e}")
            
    # Save the true evaluations
    with open(os.path.join(MODELS_DIR, "evaluation_results.json"), "w") as f:
        json.dump(results, f, indent=4)
    print("Saved true real-world metrics to evaluation_results.json!")

if __name__ == "__main__":
    evaluate_all_existing()
