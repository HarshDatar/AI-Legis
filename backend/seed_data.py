"""
AI-Legis: Seed Data Ingestion Script
Run this once to process and embed all seed case documents into the vector store.

Usage: python seed_data.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database.case_store import get_case, get_case_documents_text
from services.ocr_service import chunk_text, clean_text
from services.embedding_service import ingest_document
from database.vector_store import get_stats
from config import CASES_DIR


def ingest_case(case_id: str):
    """Ingest all documents from a case into the vector store."""
    print(f"\n📂 Processing case: {case_id}")
    
    case = get_case(case_id)
    if not case:
        print(f"   Case {case_id} not found (no metadata.json)")
        return
    
    print(f"  {case['title']}")
    
    # Read all text documents
    doc_texts = get_case_documents_text(case_id)
    if not doc_texts:
        print("   No text documents found")
        return
    
    total_chunks = 0
    for doc_name, text in doc_texts.items():
        cleaned = clean_text(text)
        chunks = chunk_text(cleaned)
        
        if chunks:
            result = ingest_document(
                case_id=case_id,
                doc_name=doc_name,
                chunks=chunks,
                doc_type="legal_document",
            )
            total_chunks += result["ingested"]
            print(f"   {doc_name}: {result['ingested']} chunks embedded")
        else:
            print(f"   {doc_name}: No text to process")
    
    print(f"   Total: {total_chunks} chunks ingested for this case")


def main():
    print("⚖️  AI-Legis: Seed Data Ingestion")
    print("=" * 50)
    
    # Find all case directories
    if not os.path.exists(CASES_DIR):
        print(f" Cases directory not found: {CASES_DIR}")
        return
    
    case_ids = [
        d for d in os.listdir(CASES_DIR)
        if os.path.isdir(os.path.join(CASES_DIR, d))
        and os.path.exists(os.path.join(CASES_DIR, d, "metadata.json"))
    ]
    
    if not case_ids:
        print(" No cases found to ingest.")
        return
    
    print(f"\n Found {len(case_ids)} case(s) to process")
    
    for case_id in case_ids:
        ingest_case(case_id)
    
    # Print final stats
    stats = get_stats()
    print(f"\n{'=' * 50}")
    print(f"Ingestion complete!")
    print(f" Vector store: {stats['total_chunks']} total chunks")
    print(f" Ready for AI agent queries\n")


if __name__ == "__main__":
    main()
