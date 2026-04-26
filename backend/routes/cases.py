"""
AI-Legis: Cases API Routes
CRUD operations for legal cases.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import case_store

router = APIRouter(prefix="/api/cases", tags=["cases"])


class CreateCaseRequest(BaseModel):
    title: str
    case_number: str
    court: str
    category: str = "general"
    date_filed: str = ""
    status: str = "active"
    next_hearing: str = ""
    petitioner: str = ""
    respondent: str = ""


class UpdateCaseRequest(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    next_hearing: Optional[str] = None
    court: Optional[str] = None
    category: Optional[str] = None


@router.get("/")
async def get_all_cases(user_id: Optional[str] = None):
    """List all cases."""
    cases = case_store.list_cases(user_id)
    return {"cases": cases, "count": len(cases)}



@router.get("/{case_id}")
async def get_case(case_id: str, user_id: Optional[str] = None):
    """Get a specific case by ID."""
    case = case_store.get_case(case_id, user_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found or unauthorized")
    return case


@router.post("/")
async def create_case(req: CreateCaseRequest, user_id: Optional[str] = "lawyer1"):
    """Create a new case."""
    try:
        case = case_store.create_case(**req.model_dump(), user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not case:
        raise HTTPException(status_code=500, detail="Case was created but could not be reloaded")
    return {"message": "Case created", "case": case}


@router.patch("/{case_id}")
async def update_case(case_id: str, req: UpdateCaseRequest, user_id: Optional[str] = None):
    """Update a case's metadata."""
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    case = case_store.update_case(case_id, updates, user_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found or unauthorized")
    return {"message": "Case updated", "case": case}


@router.delete("/{case_id}")
async def delete_case(case_id: str, user_id: Optional[str] = None):
    """Delete a case and all its data."""
    from database.vector_store import delete_case_chunks
    
    # ─── RBAC: Role-Based Access Control (Issue 5: Role Escalation) ───
    from database.user_store import get_user_role
    user_role = get_user_role(user_id)
    if user_role != "admin" and user_id != "admin": # Allow 'admin' ID or admin role
        raise HTTPException(status_code=403, detail="Forbidden: Only Admins can delete cases")

    delete_case_chunks(case_id)
    success = case_store.delete_case(case_id, user_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete case")
    return {"message": f"Case {case_id} deleted"}
