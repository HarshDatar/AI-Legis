"""
AI-Legis: Intelligent Legal Case Analysis & Inconsistency Detection System
Main FastAPI application entry point.
"""
import sys
import os

# -- Fix OpenMP Runtime Conflict --
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Add the current directory (backend) to the sys.path
# This ensures 'import config' and 'import routes' work regardless of where it's called from
backend_path = os.path.dirname(os.path.abspath(__file__))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config import HOST, PORT, DATA_DIR, CASES_DIR

# Ensure necessary data directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CASES_DIR, exist_ok=True)

# ─── CRITICAL: Initialize Database ───
from database.db import init_db
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP LOGIC ---
    import subprocess
    import time
    from config import AGENT_SERVICE_PORT, INTERNAL_HOST

    # 1. CLEANUP: Kill any zombie processes on port 8001
    try:
        if sys.platform == "win32":
            # Find PID on port 8001 and kill it
            cmd = f'for /f "tokens=5" %a in (\'netstat -aon ^| findstr :{AGENT_SERVICE_PORT} ^| findstr LISTENING\') do taskkill /f /pid %a'
            subprocess.run(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except: pass

    # 2. STARTUP: Spawn the isolated Agent Service in a separate process
    agent_proc = None
    try:
        print(f"[SYSTEM] Spawning isolated AI Agent Service on port {AGENT_SERVICE_PORT}...")
        
        # Log AI Agent output for debugging
        log_file = open(os.path.join(DATA_DIR, "agent_service.log"), "a")
        
        # Fix for 'forrtl: error (200)' on Windows
        env = os.environ.copy()
        env["FOR_DISABLE_CONSOLE_CTRL_HANDLER"] = "1"
        env["KMP_DUPLICATE_LIB_OK"] = "TRUE"

        agent_proc = subprocess.Popen(
            [sys.executable, os.path.join(backend_path, "agent_service.py")],
            stdout=log_file,
            stderr=subprocess.STDOUT,
            bufsize=1,
            universal_newlines=True,
            env=env
        )
        app.state.agent_proc = agent_proc
    except Exception as e:
        print(f"[SYSTEM] Failed to spawn Agent Service: {e}")

    yield
    # --- SHUTDOWN LOGIC ---
    if agent_proc:
        print("[SYSTEM] Shutting down AI Agent Service...")
        agent_proc.terminate()

app = FastAPI(
    title="AI-Legis",
    description="Intelligent Legal Case Analysis System.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registering routes
from routes.cases import router as cases_router
from routes.documents import router as documents_router
from routes.chat import router as chat_router
from routes.analysis import router as analysis_router

app.include_router(cases_router)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(analysis_router)

@app.get("/")
async def root():
    return {"status": "online", "service": "AI-Legis Backend"}

if __name__ == "__main__":
    import uvicorn
    # Use the app object directly to avoid module path issues in local development
    print(f"\n[SYSTEM] AI-Legis Backend initializing on {HOST}:{PORT}...")
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
