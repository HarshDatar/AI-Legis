"""
AI-Legis: Copyright API Routes
Endpoints for filing and tracking copyrights.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from services.copyright_service import copyright_service
from config import DEFAULT_USER_ID

router = APIRouter(prefix="/api/copyright", tags=["copyright"])

class CopyrightApplicationRequest(BaseModel):
    title: str
    author: str
    work_type: str  # Literary, Artistic, Musical, etc.
    description: str

@router.post("/apply")
async def apply_copyright(req: CopyrightApplicationRequest, user_id: str = DEFAULT_USER_ID):
    """
    Submit a new copyright application.
    """
    try:
        application = copyright_service.apply_for_copyright(
            user_id=user_id,
            title=req.title,
            author=req.author,
            work_type=req.work_type,
            description=req.description
        )
        return {"status": "success", "application": application}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-applications")
async def get_my_applications(user_id: str = DEFAULT_USER_ID):
    """
    Retrieve all copyright applications for the current user.
    """
    applications = copyright_service.get_user_applications(user_id)
    return {"status": "success", "applications": applications}

@router.get("/status/{application_id}")
async def get_application_status(application_id: str):
    """
    Check the status of a specific copyright application.
    """
    application = copyright_service.get_status(application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"status": "success", "application": application}
