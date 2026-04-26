import os
import pandas as pd
import numpy as np

# Fix for Protobuf version mismatch between TensorFlow and local environment
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2' # Hide annoying warnings

import tensorflow as tf
from tensorflow.keras.layers import TextVectorization, Embedding, GlobalAveragePooling1D, Dense, Dropout
from sklearn.model_selection import train_test_split

# ---------------------------------------------------------
# TEACHER'S NOTE:
# This is the Brain of your custom Legal AI. 
# We define the layers of the Neural Network, compile it, 
# and fit it to the data we built in the previous script.
# ---------------------------------------------------------

DATASET_IN = os.path.join(os.path.dirname(__file__), "ml_dataset.csv")
MODEL_OUT = os.path.join(os.path.dirname(__file__), "legal_classifier.keras")

def train_model():
    print("Loading dataset...")
    df = pd.read_csv(DATASET_IN)
    
    # Neural networks need numbers, not strings. 
    # We map Criminal -> 0, Property -> 1, Family -> 2, Fraud -> 3
    # ---------------------------------------------------------
    # TODO (HARSH): 
    # Add your string-to-number mapping for 'Family': 2 and 'Fraud': 3 here!
    # ---------------------------------------------------------
    label_map = {
        "Criminal": 0,
        "Property": 1,
        "Family": 2,
        "Fraud":3
    }
    
    df['target'] = df['label'].map(label_map)
    df = df.dropna()
    
    # Remove nasty non-ASCII characters (like weird bullet points from PDFs) 
    # to prevent Windows UnicodeEncodeError when saving the model
    df['text'] = df['text'].astype(str).str.replace(r'[^\x00-\x7F]+', ' ', regex=True)
    
    X = df['text'].values
    y = df['target'].values
    num_classes = len(label_map)
    
    # Split into 80% training data, 20% testing data
    X_train, X_test, y_train, y_test = train_test_split(X.tolist(), y.tolist(), test_size=0.2, random_state=42)
    
    # Keras requires strict TensorFlow Tensors for text vectorization
    X_train = tf.constant(X_train)
    X_test = tf.constant(X_test)
    y_train = tf.constant(y_train)
    y_test = tf.constant(y_test)
    
    print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples.")
    
    # ---------------------------------------------------------
    # TEACHER'S EXAMPLE: BUILDING THE NETWORK ARCHITECTURE
    # ---------------------------------------------------------
    
    # 1. Text Vectorization: Turns raw text into integer sequences
    max_vocab = 20000
    max_len = 2048 # Increased from 200 to 2048 for deep legal analysis (Issue 2.1)
    vectorize_layer = TextVectorization(
        max_tokens=max_vocab,
        output_mode='int',
        output_sequence_length=max_len)
    
    # Learn the vocabulary from our training data
    vectorize_layer.adapt(X_train)
    
    # 2. Build the Keras Sequential Model
    model = tf.keras.Sequential([
        vectorize_layer,
        Embedding(max_vocab, 64, name="embedding"),
        GlobalAveragePooling1D(),
        Dense(64, activation='relu'),
        Dropout(0.3),
        Dense(num_classes, activation='softmax') # Softmax gives probabilities for each category!
    ])
    
    # ---------------------------------------------------------
    # TODO (HARSH): 
    # You must COMPILE the model before training.
    # Hint: Use the "adam" optimizer. 
    # Because we have multiple classes (0,1,2,3), the loss should be 
    # "sparse_categorical_crossentropy".
    # And we want to track the "accuracy" metric.
    # ---------------------------------------------------------
    
    # YOUR CODE HERE (Hint: model.compile(...))
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])

    
    # ---------------------------------------------------------
    # TODO (HARSH): 
    # You must FIT (train) the model on X_train and y_train.
    # Hint: set epochs=5, and use (X_test, y_test) as validation_data.
    # ---------------------------------------------------------
    
    print("Starting Training...")
    # YOUR CODE HERE (Hint: history = model.fit(...))
    history = model.fit(X_train, y_train, epochs=5, validation_data=(X_test, y_test))
    print("Training completed!")
    
    # Save the model
    print("Saving model architecture and weights...")
    model.save(MODEL_OUT)
    print(f"Model saved to {MODEL_OUT}")

if __name__ == "__main__":
    train_model()
