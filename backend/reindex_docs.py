import os
import sys

# Add backend to path
backend_path = os.path.abspath(os.path.dirname(__file__))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from database.case_store import get_all_cases
from database.vector_store import delete_case_chunks, add_chunks
from services.embedding_service import ingest_document
import sqlite3

def reindex_all():
    print("[REINDEX] Starting full re-indexing of all case documents...")
    cases = get_all_cases("lawyer1") # Default user
    
    # We need to read the actual text from the files.
    # Case documents are in data/cases/{case_id}/{doc_name}
    data_dir = os.path.join(backend_path, "..", "data", "cases")
    
    total_docs = 0
    for case in cases:
        case_id = case['case_id']
        print(f"[REINDEX] Processing Case: {case_id} ({case['title']})")
        
        # Clear existing embeddings for this case to avoid duplicates
        delete_case_chunks(case_id)
        
        case_path = os.path.join(data_dir, case_id)
        if not os.path.exists(case_path):
            print(f"  [!] Case path not found: {case_path}")
            continue
            
        for doc in case.get('documents', []):
            doc_name = doc['name']
            doc_path = os.path.join(case_path, doc_name)
            
            if os.path.exists(doc_path):
                print(f"  [+] Re-indexing: {doc_name}")
                with open(doc_path, 'r', encoding='utf-8', errors='replace') as f:
                    text = f.read()
                
                # Split into chunks (Simple split for re-indexing)
                from config import CHUNK_SIZE, CHUNK_OVERLAP
                chunks = []
                for i in range(0, len(text), CHUNK_SIZE - CHUNK_OVERLAP):
                    chunks.append(text[i:i + CHUNK_SIZE])
                
                ingest_document(case_id, doc_name, chunks)
                total_docs += 1
            else:
                print(f"  [!] Document file not found: {doc_path}")

    print(f"[REINDEX] Completed. {total_docs} documents re-indexed.")

if __name__ == "__main__":
    reindex_all()
