"""
AI-Legis: Analysis API Routes
Contradiction detection and summarization endpoints.
"""
import os
import sys

# Self-healing path: Ensure backend folder is in path so 'database' and 'services' can be found
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path: sys.path.insert(0, backend_dir)

from fastapi import APIRouter, HTTPException
from database.case_store import get_case
from services.contradiction_service import detect_contradictions
from services.summarization_service import summarize_case_documents

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.get("/contradictions/{case_id}")
async def get_contradictions(case_id: str, user_id: str = "lawyer1"):
    """Run contradiction detection on all documents in a case.
    
    The AI analyzes all documents for:
    - Date/time conflicts
    - Factual contradictions  
    - Identity discrepancies
    - Sequence errors
    - Quantitative mismatches
    """
    case = get_case(case_id, user_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    result = await detect_contradictions(case_id)
    return result


@router.get("/summary/{case_id}")
async def get_case_summary(case_id: str, user_id: str = "lawyer1"):
    """Generate plain-English summaries of all documents in a case."""
    case = get_case(case_id, user_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    result = await summarize_case_documents(case_id)
    return result
