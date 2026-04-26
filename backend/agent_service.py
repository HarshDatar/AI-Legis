"""
AI-Legis: Isolated Agent Microservice
Runs on a separate port/process to prevent agent crashes from affecting the main API.
Supports SSE streaming for high-quality user experience.
"""
import sys
import os

# Add backend to path
backend_path = os.path.dirname(os.path.abspath(__file__))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import asyncio
import json

from agents.legal_agent import stream_chat, warmup_ollama
from config import AGENT_SERVICE_PORT, INTERNAL_HOST, AGENT_TIMEOUT_SECONDS

app = FastAPI(title="AI-Legis Agent Service")

class AgentRequest(BaseModel):
    message: str
    chat_history: List[dict] = []
    case_id: Optional[str] = None
    user_id: Optional[str] = None

@app.on_event("startup")
async def startup():
    # Warm up model in this process
    asyncio.create_task(warmup_ollama())

@app.get("/health")
async def health():
    return {"status": "ok", "service": "agent-isolated"}

@app.post("/chat/stream")
async def chat_stream(req: AgentRequest):
    """Server-Sent Events (SSE) streaming endpoint."""
    print(f"[AGENT] Received chat request for case {req.case_id}", flush=True)
    
    async def event_generator():
        try:
            # Add a small timeout wrapper at the generator level
            async for chunk in stream_chat(
                user_message=req.message,
                chat_history=req.chat_history,
                case_context=req.case_id,
                user_id=req.user_id
            ):
                # Format as SSE
                data = json.dumps({"text": chunk})
                yield f"data: {data}\n\n"
            
            yield "data: [DONE]\n\n"
        except asyncio.TimeoutError:
            yield f"data: {json.dumps({'error': 'Agent timeout', 'text': 'The AI took too long to respond.'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    print(f"[AGENT] Starting isolated service on {INTERNAL_HOST}:{AGENT_SERVICE_PORT}...")
    uvicorn.run(app, host=INTERNAL_HOST, port=AGENT_SERVICE_PORT)
