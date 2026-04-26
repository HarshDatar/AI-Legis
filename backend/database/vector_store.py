"""
AI-Legis: Vector Store Service
Wraps ChromaDB for document embedding storage and semantic search.
"""
import os
import logging
from config import CHROMA_PERSIST_DIR, CHROMA_COLLECTION_NAME

# Suppress noisy model loading warnings
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)

os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

# Lazy-loaded globals — nothing heavy at import time
_client = None
_collection = None
_embedder = None


class _HashEmbedder:
    """Small offline fallback when the sentence-transformer model is unavailable."""

    dimension = 384

    def encode(self, texts):
        import hashlib
        import math
        import numpy as np

        single = isinstance(texts, str)
        items = [texts] if single else texts
        vectors = []

        for text in items:
            vector = [0.0] * self.dimension
            for token in str(text).lower().split():
                digest = hashlib.sha256(token.encode("utf-8", errors="ignore")).digest()
                index = int.from_bytes(digest[:4], "big") % self.dimension
                sign = 1.0 if digest[4] % 2 == 0 else -1.0
                vector[index] += sign

            norm = math.sqrt(sum(v * v for v in vector)) or 1.0
            vectors.append([v / norm for v in vector])

        arr = np.array(vectors, dtype=float)
        return arr[0] if single else arr


def _get_embedder():
    """Lazy-load the embedding model (runs locally, free)."""
    global _embedder
    if _embedder is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedder = SentenceTransformer("all-MiniLM-L6-v2", local_files_only=True)
        except Exception as exc:
            print(f"[VectorStore] SentenceTransformer unavailable locally; using hash embeddings. {exc}")
            _embedder = _HashEmbedder()
    return _embedder


def _get_collection():
    """Lazy-load ChromaDB client and collection."""
    global _client, _collection
    if _collection is None:
        import chromadb
        from chromadb.config import Settings
        os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False),
        )
        _collection = _client.get_or_create_collection(
            name=CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def embed_text(text: str) -> list[float]:
    """Generate embedding for a text string."""
    model = _get_embedder()
    return model.encode(text).tolist()


def add_chunks(
    chunks: list[str],
    metadatas: list[dict],
    ids: list[str],
):
    """Add text chunks with metadata to the vector store."""
    collection = _get_collection()
    model = _get_embedder()
    embeddings = model.encode(chunks).tolist()
    collection.add(
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
    )
    return len(chunks)


def search(
    query: str,
    n_results: int = 5,
    where_filter: dict = None,
) -> list[dict]:
    """Semantic search across all stored documents.
    
    Returns list of {text, metadata, distance} dicts.
    """
    collection = _get_collection()
    model = _get_embedder()
    query_embedding = model.encode(query).tolist()

    kwargs = {
        "query_embeddings": [query_embedding],
        "n_results": n_results,
    }
    if where_filter:
        kwargs["where"] = where_filter

    results = collection.query(**kwargs)

    output = []
    if results and results["documents"]:
        for i, doc in enumerate(results["documents"][0]):
            output.append({
                "text": doc,
                "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                "distance": results["distances"][0][i] if results["distances"] else 0,
            })
    return output


def search_by_case(query: str, case_id: str, n_results: int = 5) -> list[dict]:
    """Search documents filtered to a specific case."""
    return search(query, n_results, where_filter={"case_id": case_id})


def get_all_case_chunks(case_id: str) -> list[dict]:
    """Get all stored chunks for a specific case."""
    collection = _get_collection()
    results = collection.get(
        where={"case_id": case_id},
        include=["documents", "metadatas"],
    )
    output = []
    if results and results["documents"]:
        for i, doc in enumerate(results["documents"]):
            output.append({
                "text": doc,
                "metadata": results["metadatas"][i] if results["metadatas"] else {},
            })
    return output


def delete_case_chunks(case_id: str):
    """Delete all chunks for a specific case (Atomic)."""
    collection = _get_collection()
    # Use direct where filter for atomicity
    collection.delete(where={"case_id": case_id})
    return True


def delete_document_chunks(case_id: str, doc_name: str):
    """Delete chunks for a specific document within a case."""
    collection = _get_collection()
    collection.delete(where={
        "$and": [
            {"case_id": case_id},
            {"document_name": doc_name}
        ]
    })
    return True


def get_stats() -> dict:
    """Get vector store statistics."""
    collection = _get_collection()
    return {
        "total_chunks": collection.count(),
        "collection_name": CHROMA_COLLECTION_NAME,
    }
