"""
AI-Legis: Document Upload & Processing Routes
Handles document upload, OCR, chunking, and embedding.
"""
import os
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from config import CASES_DIR, MAX_UPLOAD_SIZE_MB
from services.ocr_service import process_document
from services.embedding_service import ingest_document
from database.case_store import get_case, add_document_to_case, get_case_documents_text

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload/{case_id}")
async def upload_document(
    case_id: str,
    file: UploadFile = File(...),
    doc_type: str = Form("general"),
    user_id: str = "lawyer1",
):
    """Upload a document to a case. Triggers OCR + embedding pipeline.
    
    Flow: Upload → Save → Extract Text → Chunk → Embed → Store
    """
    # Validate case exists
    case = get_case(case_id, user_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    # Validate file size
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f}MB). Max: {MAX_UPLOAD_SIZE_MB}MB",
        )

    # Save the uploaded file
    safe_filename = os.path.basename(file.filename or "uploaded_document")
    docs_dir = os.path.join(CASES_DIR, case_id, "documents")
    os.makedirs(docs_dir, exist_ok=True)
    file_path = os.path.join(docs_dir, safe_filename)
    
    with open(file_path, "wb") as f:
        f.write(contents)

    try:
        result = process_document(file_path, case_id, safe_filename)

        # Clean up existing embeddings for this document (Deduplication - Issue 2)
        from database.vector_store import delete_document_chunks
        delete_document_chunks(case_id, safe_filename)

        # Embed and store in vector DB
        ingest_result = ingest_document(
            case_id=case_id,
            doc_name=safe_filename,
            chunks=result["chunks"],
            doc_type=doc_type,
        )

        # Update case metadata
        add_document_to_case(case_id, safe_filename, doc_type, user_id=user_id)

        # ─── ML Auto-Categorization (Issue 2.2) ───
        # Use the extracted text to predict the case category if it's currently "general"
        if case.get("category") == "general":
            from services.classifier_service import auto_categorize_case
            auto_categorize_case(case_id, result["text"], user_id=user_id)

        return {
            "message": "Document processed and indexed",
            "document": safe_filename,
            "case_id": case_id,
            "text_length": result["text_length"],
            "chunks_created": result["num_chunks"],
            "chunks_embedded": ingest_result["ingested"],
        }

    except Exception as e:
        # Clean up the file if processing failed
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}",
        )


@router.get("/{case_id}")
async def get_case_documents(case_id: str, user_id: str = "lawyer1"):
    """List all documents for a case."""
    case = get_case(case_id, user_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return {
        "case_id": case_id,
        "documents": case.get("documents", []),
    }


@router.get("/{case_id}/{doc_name}/text")
async def get_document_text(case_id: str, doc_name: str, user_id: str = "lawyer1"):
    """Get the extracted text of a specific document."""
    case = get_case(case_id, user_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    docs = get_case_documents_text(case_id)
    
    # Try exact match or partial match
    txt_name = os.path.splitext(doc_name)[0] + ".txt"
    text = docs.get(txt_name) or docs.get(doc_name)
    
    if not text:
        raise HTTPException(
            status_code=404,
            detail=f"Document '{doc_name}' not found in case {case_id}",
        )
    
    return {
        "case_id": case_id,
        "document": doc_name,
        "text": text,
        "length": len(text),
    }
