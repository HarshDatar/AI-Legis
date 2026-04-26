import os
import json
import pandas as pd

# ---------------------------------------------------------
# TEACHER'S NOTE:
# This script reads your 28 cases and generates a CSV file 
# containing thousands of sentences with their labels.
# This is how Deep Learning models learn what a "criminal"
# case looks like versus a "property" case.
# ---------------------------------------------------------

CASES_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "cases")
DATASET_OUT = os.path.join(os.path.dirname(__file__), "ml_dataset.csv")

def extract_paragraphs(text):
    """Utility to split huge documents into smaller trainable paragraphs."""
    paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 50]
    return paragraphs

def build_dataset():
    print("Building TensorFlow Training Dataset...")
    
    texts = []
    labels = []
    
    for case_folder in os.listdir(CASES_DIR):
        case_dir = os.path.join(CASES_DIR, case_folder)
        meta_path = os.path.join(case_dir, "metadata.json")
        docs_dir = os.path.join(case_dir, "documents")
        
        if not os.path.exists(meta_path) or not os.path.exists(docs_dir):
            continue
            
        with open(meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
            
        category = metadata.get("category", "")
        
        # ---------------------------------------------------------
        # TEACHER'S EXAMPLE (Completed for you):
        # We only want to train on specific categories for now.
        # Here I handle 'criminal' and 'property'
        # ---------------------------------------------------------
        if category == "criminal":
            target_label = "Criminal"
        elif category == "property":
            target_label = "Property"
        elif category=="family":
            target_label = "Family"
        elif category == "fraud":
            target_label = "Fraud"
        else:
            # Skip cases we aren't training actively on right now
            continue
            
        # Read the documents and extract paragraphs
        for doc_name in os.listdir(docs_dir):
            if not doc_name.endswith(('.txt', '.html', '.pdf')):
                continue
                
            # For simplicity in this script, we assume the text files 
            # (which we generated earlier) are ready.
            if doc_name.endswith('.txt'):
                with open(os.path.join(docs_dir, doc_name), "r", encoding="utf-8", errors="ignore") as f:
                    doc_text = f.read()
                    paragraphs = extract_paragraphs(doc_text)
                    
                    # Add every paragraph to our training list!
                    for p in paragraphs:
                        texts.append(p)
                        labels.append(target_label)

    # Convert to Pandas DataFrame and save
    df = pd.DataFrame({"text": texts, "label": labels})
    
    # Shuffle the dataset so the neural network learns better
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    df.to_csv(DATASET_OUT, index=False)
    print(f"Dataset saved! Total training samples (paragraphs): {len(df)}")
    print(df["label"].value_counts())

if __name__ == "__main__":
    build_dataset()
