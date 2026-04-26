# AI-Legis ⚖️
> Local-first intelligent legal case analysis & inconsistency detection platform.
 
![Python](https://img.shields.io/badge/Python-3.12+-blue?style=flat-square) ![FastAPI](https://img.shields.io/badge/FastAPI-Async-009688?style=flat-square) ![React](https://img.shields.io/badge/React-SPA-61DAFB?style=flat-square&logo=react) ![Ollama](https://img.shields.io/badge/Ollama-Llama3.2-orange?style=flat-square) ![ChromaDB](https://img.shields.io/badge/RAG-ChromaDB-purple?style=flat-square)
 
---
 
## What is AI-Legis?
 
AI-Legis is a privacy-first legal intelligence platform that runs entirely on your local machine. It enables lawyers to upload case documents, chat with an AI legal agent, detect inconsistencies across filings, and perform semantic search — all without sending data to the cloud.
 
---
 
## Features
 
- **AI Legal Chat** — Conversational agent powered by Llama 3.2 (local) with Gemini 2.0 Flash fallback
- **RAG Pipeline** — Semantic search over uploaded legal documents via ChromaDB + Sentence Transformers
- **Inconsistency Detection** — Automated analysis of contradictions across case documents
- **Case Management** — Create, track, and organize cases with persistent SQLite storage
- **Document OCR** — Extract text from scanned PDFs and court orders via Tesseract
- **Streaming Responses** — Real-time token streaming via Server-Sent Events (SSE)
- **Judicial OS UI** — Clean, professional interface built for legal workflows
---
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Backend | Python 3.12+, FastAPI, Uvicorn |
| Frontend | React.js, Vanilla CSS |
| Local LLM | Ollama — Llama 3.2 (1B) |
| Cloud LLM | Google Gemini 2.0 Flash (fallback) |
| Agent Framework | LangGraph + LangChain |
| RAG / Vector DB | ChromaDB + all-MiniLM-L6-v2 |
| Database | SQLite |
| OCR | Tesseract OCR |
| Document Formats | `.pdf`, `.txt` |
 
---
 
## Project Structure
 
```
AI-Legis/
├── backend/                        # FastAPI backend
│   ├── agents/                     # LangGraph legal agent
│   ├── database/                   # SQLite models & chat store
│   ├── routes/                     # API routes (chat, cases, docs, analysis)
│   ├── config.py                   # Environment configuration
│   └── main.py                     # App entry point
├── frontend/                       # React SPA
│   └── src/
│       ├── api.js                  # API client
│       └── ...                     # Components & pages
├── Constitutional, writ(Agent Dataset)/
├── Contract Disputes/
├── Criminal-IPS(Agent Dataset)/
├── Family Fraud(Agent Dataset)/
├── Family, Divorce(Agent Dataset)/
├── Property dispute(Agent Dataset)/
├── extracted_images/               # OCR output
├── start_app.bat                   # One-click launcher (Windows)
├── populate_demo.py                # Load demo case data
└── DEMO_CASE_FORMAT.md             # Guide for adding demo cases
```
 
---
 
## Prerequisites
 
Make sure you have these installed before running AI-Legis:
 
- [Python 3.12+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Ollama](https://ollama.com/download)
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) (for scanned PDFs)
- Google Gemini API key (optional, for cloud fallback)
---
 
## Installation & Setup
 
### 1. Clone the repository
 
```bash
git clone https://github.com/HarshDatar/AI-Legis.git
cd AI-Legis
```
 
### 2. Set up Ollama (Local AI)
 
```bash
# Start Ollama
ollama serve
 
# Pull the required model
ollama pull llama3.2:1b
```
 
### 3. Set up the Backend
 
```bash
cd backend
pip install -r requirements.txt
```
 
Create a `.env` file in the `backend/` folder:
 
```env
GEMINI_API_KEY=your_gemini_api_key_here
HOST=127.0.0.1
PORT=8000
```
 
Start the backend:
 
```bash
python main.py
```
 
The API will be available at `http://localhost:8000`.
 
### 4. Set up the Frontend
 
```bash
cd frontend
npm install
npm start
```
 
The app will open at `http://localhost:3000`.
 
### 5. (Optional) Load Demo Data
 
```bash
python populate_demo.py
```
 
---
 
## Quick Start (Windows)
 
Double-click `start_app.bat` to launch both the backend and frontend in one step.
 
---
 
## API Endpoints
 
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat/` | Send a message to the legal agent |
| `GET` | `/api/chat/history` | Retrieve chat history |
| `DELETE` | `/api/chat/history` | Clear chat history |
| `GET` | `/api/cases/` | List all cases |
| `POST` | `/api/cases/` | Create a new case |
| `POST` | `/api/documents/upload` | Upload a legal document |
| `POST` | `/api/analysis/` | Run inconsistency detection |
 
---
 
## Agent Datasets
 
AI-Legis ships with curated legal document datasets for the following domains:
 
- Constitutional & Writ matters
- Contract Disputes
- Criminal / IPS cases
- Family Fraud
- Family & Divorce
- Property Disputes
---
 
## Configuration
 
Key settings in `backend/config.py`:
 
| Variable | Default | Description |
|---|---|---|
| `HOST` | `127.0.0.1` | Backend host |
| `PORT` | `8000` | Backend port |
| `AGENT_SERVICE_URL` | `http://localhost:8001` | Isolated agent microservice URL |
| `AGENT_TIMEOUT_SECONDS` | `30` | Max wait time for AI response |
| `DATA_DIR` | `./data` | Document storage path |
 
---
 
## Contributing
 
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request
---
 
## License
 
MIT License — see [LICENSE](LICENSE) for details.
 
---
 
## Acknowledgements
 
Built with [FastAPI](https://fastapi.tiangolo.com/), [LangGraph](https://langchain-ai.github.io/langgraph/), [ChromaDB](https://www.trychroma.com/), [Ollama](https://ollama.com/), and [React](https://react.dev/).
