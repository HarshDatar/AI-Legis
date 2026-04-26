"""
AI-Legis: Embedding Service
Handles the full ingestion pipeline — takes processed document chunks 
and stores them in the vector store with rich metadata.
"""
import uuid
from database import vector_store


def ingest_document(
    case_id: str,
    doc_name: str,
    chunks: list[str],
    doc_type: str = "general",
) -> dict:
    """Embed and store document chunks in ChromaDB with case/document metadata.
    
    Each chunk gets:
    - A unique ID
    - The case_id for filtered retrieval
    - The document name for citation
    - The chunk index for ordering
    """
    if not chunks:
        return {"ingested": 0}

    ids = []
    metadatas = []

    for i, chunk in enumerate(chunks):
        chunk_id = f"{case_id}_{doc_name}_{i}_{uuid.uuid4().hex[:6]}"
        ids.append(chunk_id)
        metadatas.append({
            "case_id": case_id,
            "document_name": doc_name,
            "doc_type": doc_type,
            "chunk_index": i,
            "total_chunks": len(chunks),
        })

    count = vector_store.add_chunks(
        chunks=chunks,
        metadatas=metadatas,
        ids=ids,
    )

    return {
        "ingested": count,
        "case_id": case_id,
        "document": doc_name,
    }


def search_documents(query: str, case_id: str = None, top_k: int = 5) -> list[dict]:
    """Search documents — optionally filtered to a specific case."""
    if case_id:
        return vector_store.search_by_case(query, case_id, n_results=top_k)
    return vector_store.search(query, n_results=top_k)


def get_case_context(case_id: str) -> str:
    """Get all document text for a case, formatted for LLM context."""
    chunks = vector_store.get_all_case_chunks(case_id)
    if not chunks:
        return "No documents found for this case."

    # Group by document
    doc_texts = {}
    for chunk in chunks:
        doc_name = chunk["metadata"].get("document_name", "Unknown")
        if doc_name not in doc_texts:
            doc_texts[doc_name] = []
        doc_texts[doc_name].append((chunk["metadata"].get("chunk_index", 0), chunk["text"]))

    # Reconstruct documents in order
    context_parts = []
    for doc_name, indexed_chunks in doc_texts.items():
        indexed_chunks.sort(key=lambda x: x[0])
        text = "\n".join(c[1] for c in indexed_chunks)
        context_parts.append(f"--- Document: {doc_name} ---\n{text}")

    return "\n\n".join(context_parts)
