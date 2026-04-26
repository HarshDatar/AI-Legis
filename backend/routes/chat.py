"""
AI-Legis: Chat API Route
The main agent interaction endpoint.
"""
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path: sys.path.insert(0, backend_dir)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database.chat_store import save_message, get_history, delete_history

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import httpx
import json

from database.chat_store import save_message, get_history, delete_history
from config import AGENT_SERVICE_URL, AGENT_TIMEOUT_SECONDS

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    chat_history: list[dict] = []
    case_id: Optional[str] = None
    user_id: Optional[str] = None

@router.post("/")
async def chat(req: ChatRequest):
    """
    Main chat entry point. 
    Now acts as a proxy to the isolated Agent Service with SSE support.
    """
    # 1. Save user message immediately
    save_message(req.user_id or "lawyer1", req.case_id, "user", req.message)
    
    # 2. Get history if not provided
    history = req.chat_history
    if not history and req.user_id:
        history = get_history(req.user_id, req.case_id)

    async def stream_proxy():
        # CIRCUIT BREAKER: 60s timeout on the whole request
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                # Call the isolated agent service
                async with client.stream(
                    "POST", 
                    f"{AGENT_SERVICE_URL}/chat/stream",
                    json={
                        "message": req.message,
                        "chat_history": history,
                        "case_id": req.case_id,
                        "user_id": req.user_id
                    }
                ) as response:
                    if response.status_code != 200:
                        yield f"data: {json.dumps({'error': 'Agent service error', 'text': 'The AI service is temporarily unavailable.'})}\n\n"
                        return

                    full_text = ""
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                # Save the final response to DB before finishing
                                save_message(req.user_id or "lawyer1", req.case_id, "assistant", full_text)
                                yield line + "\n\n"
                                break
                            
                            try:
                                data = json.loads(data_str)
                                full_text = data.get("text", full_text) # In 'values' mode, text is full content
                                yield line + "\n\n"
                            except:
                                yield line + "\n\n"

            except httpx.TimeoutException:
                yield f"data: {json.dumps({'error': 'Timeout', 'text': 'The analysis is taking longer than expected due to document complexity. Please try focusing your query on a specific part of the case.'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e), 'text': 'The AI service encountered a connection error.'})}\n\n"

    return StreamingResponse(stream_proxy(), media_type="text/event-stream")


@router.get("/history", response_model=List[dict])
async def get_chat_history(user_id: str, case_id: Optional[str] = None):
    """Retrieve persistent chat history for a user/case."""
    return get_history(user_id, case_id)

@router.delete("/history")
async def clear_chat_history(user_id: str, case_id: Optional[str] = None):
    """Clear persistent chat history."""
    delete_history(user_id, case_id)
    return {"status": "success", "message": "History cleared"}
