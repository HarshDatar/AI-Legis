"""
AI-Legis: Legal Agent
The core autonomous agent that reasons about user queries and decides
which tools to call. This is the BRAIN of the application.

Architecture:
    User Query → Agent reasons → Selects tool(s) → Executes → Synthesizes → Response

Backend: Gemini via langchain-google-genai (cloud, free tier)
"""
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

import os
import sys
import io
import asyncio

# Fix OpenMP Runtime Conflict
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Fix Pathing: Ensure backend directory is in sys.path
file_path = os.path.abspath(__file__)
backend_dir = os.path.dirname(os.path.dirname(file_path))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Fix Windows terminal encoding
if sys.stdout and hasattr(sys.stdout, 'encoding') and sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    except (AttributeError, io.UnsupportedOperation):
        pass

import httpx
from config import (
    AGENT_TIMEOUT_SECONDS, GEMINI_API_KEY, GEMINI_MODEL, OLLAMA_BASE_URL, OLLAMA_MODEL,
    TEMPERATURE, MAX_AGENT_ITERATIONS, USE_OLLAMA, OLLAMA_KEEP_ALIVE
)
from agents.prompts import LEGAL_AGENT_SYSTEM_PROMPT
from agents.context import reset_agent_user_id, set_agent_user_id


def _load_llm():
    """Load the correct LLM backend based on config."""
    if USE_OLLAMA:
        from langchain_ollama import ChatOllama
        print(f"[AI-AGENT] Engine: LOCAL OLLAMA ({OLLAMA_MODEL})")
        return ChatOllama(
            model=OLLAMA_MODEL,
            temperature=TEMPERATURE,
            base_url=OLLAMA_BASE_URL,
            # PERFORMANCE TUNING
            num_ctx=3072,
            repeat_penalty=1.2,
            top_k=40,
            top_p=0.9,
            mirostat=2,
            num_predict=768,
            keep_alive=OLLAMA_KEEP_ALIVE, # KEEP IN MEMORY
            client_kwargs={"timeout": AGENT_TIMEOUT_SECONDS},
        )
    else:
        from langchain_google_genai import ChatGoogleGenerativeAI
        print(f"[AI-AGENT] Engine: CLOUD GEMINI ({GEMINI_MODEL})")
        return ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GEMINI_API_KEY,
            temperature=TEMPERATURE,
        )


async def _ensure_ollama_available() -> None:
    """Fail fast when the local Ollama server is not running."""
    async with httpx.AsyncClient(timeout=2.0) as client:
        try:
            await client.get(f"{OLLAMA_BASE_URL}/api/tags")
        except Exception as exc:
            raise ConnectionError(f"Ollama is not reachable at {OLLAMA_BASE_URL}") from exc


def _create_agent():
    """Create the LangGraph agent with the configured LLM and legal tools."""
    from langgraph.prebuilt import create_react_agent
    llm = _load_llm()
    from agents.tools import ALL_TOOLS
    return create_react_agent(llm, tools=ALL_TOOLS, prompt=LEGAL_AGENT_SYSTEM_PROMPT)


# Module-level agent instance
_agent_executor = None


def get_agent():
    """Get or create the singleton agent executor."""
    global _agent_executor
    if _agent_executor is None:
        _agent_executor = _create_agent()
    return _agent_executor


async def warmup_ollama():
    """Warms up the Ollama model on startup."""
    if not USE_OLLAMA: return
    try:
        await _ensure_ollama_available()
        llm = _load_llm()
        await llm.ainvoke("Hi")
        print(f"[AI-Legis] Ollama model {OLLAMA_MODEL} loaded.")
    except Exception as e:
        print(f"[AI-Legis] Warm-up failed: {e}")


async def stream_chat(
    user_message: str,
    chat_history: list[dict] = None,
    case_context: str = None,
    user_id: str = None,
):
    """Streaming generator with API Key Rotation and Local Fallback."""
    from config import GEMINI_API_KEYS, GEMINI_MODEL, TEMPERATURE
    from agents.prompts import LEGAL_AGENT_SYSTEM_PROMPT
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langgraph.prebuilt import create_react_agent
    from agents.tools import ALL_TOOLS
    from langchain_core.messages import HumanMessage, AIMessage

    token = set_agent_user_id(user_id)
    try:
        # Build history
        lc_history = []
        if chat_history:
            for msg in chat_history[-6:]:
                cls = HumanMessage if msg.get("role") == "user" else AIMessage
                lc_history.append(cls(content=msg["content"]))

        enhanced_input = user_message
        if case_context:
            enhanced_input = f"[Context: Case {case_context}] {user_message}"
        lc_history.append(HumanMessage(content=enhanced_input))

        # --- ROTATION LOGIC ---
        # If Gemini is enabled, try all available keys first
        success = False
        print(f"[AI-AGENT] Processing request. Gemini Keys: {len(GEMINI_API_KEYS)}, Use Ollama: {USE_OLLAMA}", flush=True)
        
        if not USE_OLLAMA and GEMINI_API_KEYS:
            for i, key in enumerate(GEMINI_API_KEYS):
                print(f"[AI-AGENT] Attempting Gemini 2.0 with Key {i+1}...", flush=True)
                try:
                    # TRY 2.0 FIRST
                    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=key, temperature=TEMPERATURE)
                    agent = create_react_agent(llm, tools=ALL_TOOLS, prompt=LEGAL_AGENT_SYSTEM_PROMPT)
                    async for event in agent.astream({"messages": lc_history}, stream_mode="values"):
                        if "messages" in event:
                            last_msg = event["messages"][-1]
                            if isinstance(last_msg, AIMessage) and last_msg.content:
                                yield last_msg.content
                    success = True
                    print(f"[AI-AGENT] Gemini 2.0 Key {i+1} success.", flush=True)
                    break
                except Exception as e:
                    if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                        print(f"[AI-AGENT] Gemini 2.0 exhausted. Trying 1.5 Flash with Key {i+1}...", flush=True)
                        try:
                            # FALLBACK TO 1.5 FLASH (More stable quota)
                            # Try standard first, then latest
                            model_15 = "gemini-1.5-flash"
                            try:
                                llm_15 = ChatGoogleGenerativeAI(model=model_15, google_api_key=key, temperature=TEMPERATURE)
                                agent_15 = create_react_agent(llm_15, tools=ALL_TOOLS, prompt=LEGAL_AGENT_SYSTEM_PROMPT)
                                async for event in agent_15.astream({"messages": lc_history}, stream_mode="values"):
                                    if "messages" in event:
                                        last_msg = event["messages"][-1]
                                        if isinstance(last_msg, AIMessage) and last_msg.content:
                                            yield last_msg.content
                            except Exception as e15_inner:
                                if "404" in str(e15_inner):
                                    print(f"[AI-AGENT] gemini-1.5-flash 404. Trying gemini-1.5-flash-latest...", flush=True)
                                    llm_15 = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", google_api_key=key, temperature=TEMPERATURE)
                                    agent_15 = create_react_agent(llm_15, tools=ALL_TOOLS, prompt=LEGAL_AGENT_SYSTEM_PROMPT)
                                    async for event in agent_15.astream({"messages": lc_history}, stream_mode="values"):
                                        if "messages" in event:
                                            last_msg = event["messages"][-1]
                                            if isinstance(last_msg, AIMessage) and last_msg.content:
                                                yield last_msg.content
                                else: raise e15_inner
                            
                            success = True
                            print(f"[AI-AGENT] Gemini 1.5 Key {i+1} success.", flush=True)
                            break
                        except Exception as e15:
                            print(f"[AI-AGENT] Gemini 1.5 Key {i+1} failed: {str(e15)}", flush=True)
                            if i < len(GEMINI_API_KEYS) - 1:
                                yield "\n*Analysis is taking a bit longer... (processing complex data)*\n"
                                continue
                            else:
                                yield "\n*Performing deep factual check... (this may take a moment)*\n"
                    else:
                        print(f"[AI-AGENT] Gemini Key {i+1} hard error: {str(e)}", flush=True)
                        if i < len(GEMINI_API_KEYS) - 1: continue
                        else: break

        # --- FINAL FALLBACK TO OLLAMA ---
        if not success:
            from langchain_ollama import ChatOllama
            backup_llm = ChatOllama(
                model=OLLAMA_MODEL, temperature=TEMPERATURE, base_url=OLLAMA_BASE_URL,
                num_ctx=3072, keep_alive=-1
            )
            backup_agent = create_react_agent(backup_llm, tools=ALL_TOOLS, prompt=LEGAL_AGENT_SYSTEM_PROMPT)
            
            async for event in backup_agent.astream({"messages": lc_history}, stream_mode="values"):
                if "messages" in event:
                    last_msg = event["messages"][-1]
                    if isinstance(last_msg, AIMessage) and last_msg.content:
                        content = last_msg.content
                        # [Keep 1B interceptor logic here]
                        if "{function" in content:
                            import re, json
                            match = re.search(r'\{function\s+(\w+)\s+query="([^"]+)"(?:\s*,\s*case_id=({[^}]+}|"[^"]+"))?\}', content)
                            if match:
                                tool_name = match.group(1); query = match.group(2); raw_case_id = match.group(3) or ""
                                case_id = ""
                                if raw_case_id.startswith("{"):
                                    try: case_id = json.loads(raw_case_id.replace("'", '"')).get("case_id", "")
                                    except: pass
                                else: case_id = raw_case_id.strip('"')
                                tool_func = next((t for t in ALL_TOOLS if t.name == tool_name), None)
                                if tool_func:
                                    yield f"\n*🔄 AI-Legis is calling {tool_name}...*\n"
                                    try:
                                        if tool_name == "search_case_documents": res = tool_func.invoke({"query": query, "case_id": case_id})
                                        elif tool_name == "list_all_cases": res = tool_func.invoke({})
                                        else: res = tool_func.invoke({"case_id": case_id})
                                        yield f"\n### 📊 Tool Output ({tool_name})\n{res}\n"; continue
                                    except Exception as te: yield f"\n !Tool failed: {str(te)}\n"
                        yield content

    except Exception as e:
        yield f"\n\n[ERROR] {str(e)}"
    finally:
        reset_agent_user_id(token)


async def chat(user_message, chat_history=None, case_context=None, user_id=None):
    """Standard non-streaming chat (wraps stream_chat)."""
    full_response = ""
    async for chunk in stream_chat(user_message, chat_history, case_context, user_id):
        full_response = chunk # In values mode, the last chunk is the full message
    
    return {
        "response": full_response,
        "status": "success" if full_response else "error"
    }
