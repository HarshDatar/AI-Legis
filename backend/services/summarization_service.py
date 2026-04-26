"""
AI-Legis: Summarization Service
Generates plain-English summaries of legal documents using the google.genai SDK.
"""
import google.genai as genai
from config import GEMINI_API_KEY, GEMINI_MODEL, TEMPERATURE, USE_OLLAMA, OLLAMA_MODEL
from agents.prompts import SUMMARIZATION_PROMPT


def _get_genai_client():
    return genai.Client(api_key=GEMINI_API_KEY)


async def _run_summarization(prompt: str) -> str:
    """Run summarization using the configured LLM backend."""
    if USE_OLLAMA:
        from langchain_ollama import ChatOllama
        from config import OLLAMA_BASE_URL, AGENT_TIMEOUT_SECONDS
        import asyncio
        llm = ChatOllama(
            model=OLLAMA_MODEL,
            temperature=TEMPERATURE,
            base_url=OLLAMA_BASE_URL,
            client_kwargs={"timeout": AGENT_TIMEOUT_SECONDS},
            async_client_kwargs={"timeout": AGENT_TIMEOUT_SECONDS},
            # SPEED OPTIMIZATIONS
            num_ctx=3072,
            num_predict=1024,
            top_k=20,
        )
        res = await asyncio.wait_for(llm.ainvoke(prompt), timeout=AGENT_TIMEOUT_SECONDS)
        return res.content
    else:
        client = _get_genai_client()
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                temperature=TEMPERATURE,
                max_output_tokens=1500,
            ),
        )
        return response.text


async def summarize_document(document_text: str, doc_name: str = "Unknown") -> dict:
    """Summarize a legal document into plain English."""
    if not document_text.strip():
        return {
            "status": "error",
            "message": "Document text is empty.",
        }

    # Truncate to fit context window (Limited for local LLM speed)
    max_chars = 6000
    truncated = document_text[:max_chars] if len(document_text) > max_chars else document_text
    was_truncated = len(document_text) > max_chars

    prompt = SUMMARIZATION_PROMPT.format(document_text=truncated)

    try:
        summary = await _run_summarization(prompt)

        return {
            "status": "success",
            "document": doc_name,
            "summary": summary,
            "original_length": len(document_text),
            "was_truncated": was_truncated,
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
        }


async def summarize_case_documents(case_id: str) -> dict:
    """Summarize all documents in a case."""
    from database.case_store import get_case_documents_text

    doc_texts = get_case_documents_text(case_id)
    if not doc_texts:
        return {
            "case_id": case_id,
            "status": "no_documents",
            "message": "No documents found for this case.",
        }

    summaries = []
    for doc_name, text in doc_texts.items():
        result = await summarize_document(text, doc_name)
        summaries.append(result)

    return {
        "case_id": case_id,
        "status": "success",
        "summaries": summaries,
        "documents_summarized": len(summaries),
    }
