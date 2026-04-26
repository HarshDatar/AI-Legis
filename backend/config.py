"""
AI-Legis Configuration
Central configuration for LLM, vector store, and application settings.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ─── Server & Security ───
HOST = "0.0.0.0"
PORT = 8000
INTERNAL_HOST = "127.0.0.1"
PRACTITIONER_PASSKEY = os.getenv("PRACTITIONER_PASSKEY", "admin123")
MAX_UPLOAD_SIZE_MB = 50  # Restored missing variable to fix crash
DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID", "lawyer1")
AGENT_TIMEOUT_SECONDS = int(os.getenv("AGENT_TIMEOUT_SECONDS", "120"))

# ─── OCR Settings ───
ENABLE_OCR_FALLBACK = True  # Automatically use Tesseract if PDF text extraction fails
TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe" # Common Windows path

# ─── LLM Configuration ───
# Supports multiple keys separated by commas for rotation
GEMINI_API_KEYS = [k.strip().strip('"').strip("'") for k in os.getenv("GEMINI_API_KEY", "").split(",") if k.strip()]
GEMINI_API_KEY = GEMINI_API_KEYS[0] if GEMINI_API_KEYS else ""
GEMINI_MODEL = "gemini-2.0-flash"

# ─── Ollama (Local LLM) ───
USE_OLLAMA = False # Switching to Gemini Flash for speed and quality
OLLAMA_MODEL = "llama3.2:1b"
OLLAMA_BASE_URL = "http://localhost:11434"
AGENT_TIMEOUT_SECONDS = 180 # Increased for complex legal analysis

# ─── Vector Store ───
CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "chroma_db")
CHROMA_COLLECTION_NAME = "legal_documents"

# ─── Document Processing ───
CHUNK_SIZE = 600
CHUNK_OVERLAP = 100

# ─── Data Paths ───
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
CASES_DIR = os.path.join(DATA_DIR, "cases")

# ─── Agent Settings ───
MAX_AGENT_ITERATIONS = 5
TEMPERATURE = 0.1  # Set very low for high legal accuracy
AGENT_SERVICE_PORT = 8001
AGENT_SERVICE_URL = f"http://{INTERNAL_HOST}:{AGENT_SERVICE_PORT}"
OLLAMA_KEEP_ALIVE = -1 # Keep model in memory indefinitely (integer, not string)
