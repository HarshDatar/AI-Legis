import os
import tensorflow as tf
import numpy as np
from database.case_store import update_case
from config import DATA_DIR

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "legal_classifier.keras")

_model = None

def load_classifier():
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            try:
                _model = tf.keras.models.load_model(MODEL_PATH)
                print(f"[ML] Legal Classifier loaded from {MODEL_PATH}")
            except Exception as e:
                print(f"[ML] Error loading model: {e}")
        else:
            print(f"[ML] Model not found at {MODEL_PATH}")
    return _model

def predict_category(text: str) -> str:
    """Predict the legal category of a text snippet."""
    model = load_classifier()
    if not model:
        return None
        
    categories = ["Criminal", "Property", "Family", "Fraud"]
    
    # Pre-process: The model expects a tensor of strings
    prediction = model.predict(tf.constant([text[:2000]]), verbose=0)
    idx = np.argmax(prediction[0])
    
    return categories[idx]

def auto_categorize_case(case_id: str, text: str, user_id: str = None):
    """Update a case's category based on document content if current category is 'general'."""
    category = predict_category(text)
    if category:
        print(f"[ML] Auto-categorizing case {case_id} as {category}")
        update_case(case_id, {"category": category}, user_id=user_id)
    return category
