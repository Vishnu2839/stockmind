"""
model.py — BiLSTM + Multi-Head Attention architecture for stock prediction.
"""
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import numpy as np


def build_stockmind_model(input_features: int = 29, sequence_length: int = 60) -> object:
    """
    Build Model A: Bidirectional LSTM with Multi-Head Attention.
    Input: (batch, 60, input_features)
    Output: (batch, 1) — probability of next-day UP.
    """
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers

    inputs = keras.Input(shape=(sequence_length, input_features))

    # First Bidirectional LSTM
    x = layers.Bidirectional(
        layers.LSTM(128, return_sequences=True, dropout=0.1, recurrent_dropout=0.1)
    )(inputs)

    # Multi-Head Attention
    attn = layers.MultiHeadAttention(num_heads=4, key_dim=32)(x, x)
    x = layers.Add()([x, attn])
    x = layers.LayerNormalization()(x)
    x = layers.Dropout(0.3)(x)

    # Second Bidirectional LSTM
    x = layers.Bidirectional(
        layers.LSTM(64, return_sequences=False, dropout=0.1, recurrent_dropout=0.1)
    )(x)
    x = layers.Dropout(0.2)(x)

    # Dense layers
    x = layers.Dense(64, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dense(32, activation="relu")(x)
    x = layers.Dropout(0.2)(x)

    outputs = layers.Dense(1, activation="sigmoid")(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name="stockmind_full")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )
    return model



