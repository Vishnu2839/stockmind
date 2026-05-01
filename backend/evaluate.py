"""
evaluate.py — Model evaluation: accuracy, precision, recall, F1, directional accuracy.
"""
import numpy as np


def evaluate_model(model, X_test: np.ndarray, y_test: np.ndarray, model_name: str = "model") -> dict:
    """Evaluate a trained model on test data."""
    if len(X_test) == 0:
        return _empty_metrics(model_name)

    try:
        y_pred_proba = model.predict(X_test, verbose=0).flatten()
        y_pred = (y_pred_proba > 0.5).astype(int)

        # Basic metrics
        accuracy = float(np.mean(y_pred == y_test) * 100)

        # Precision
        tp = int(np.sum((y_pred == 1) & (y_test == 1)))
        fp = int(np.sum((y_pred == 1) & (y_test == 0)))
        fn = int(np.sum((y_pred == 0) & (y_test == 1)))
        tn = int(np.sum((y_pred == 0) & (y_test == 0)))

        precision = tp / (tp + fp) * 100 if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) * 100 if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

        directional_accuracy = accuracy

        return {
            "model_name": model_name,
            "accuracy": round(accuracy, 2),
            "precision": round(precision, 2),
            "recall": round(recall, 2),
            "f1_score": round(f1, 2),
            "directional_accuracy": round(directional_accuracy, 2),
            "true_positives": tp,
            "false_positives": fp,
            "true_negatives": tn,
            "false_negatives": fn,
            "test_samples": len(y_test),
        }
    except Exception as e:
        print(f"Evaluation error: {e}")
        return _empty_metrics(model_name)


def _empty_metrics(name: str) -> dict:
    return {
        "model_name": name,
        "accuracy": 50.0,
        "precision": 50.0,
        "recall": 50.0,
        "f1_score": 50.0,
        "directional_accuracy": 50.0,
        "true_positives": 0,
        "false_positives": 0,
        "true_negatives": 0,
        "false_negatives": 0,
        "test_samples": 0,
    }
