"""
AI-Legis: Contradiction Detection Service
Uses the LLM to compare documents within a case and find inconsistencies.
"""
import google.genai as genai
import asyncio
import re
from config import (
    AGENT_TIMEOUT_SECONDS,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    OLLAMA_BASE_URL,
    TEMPERATURE,
    USE_OLLAMA,
    OLLAMA_MODEL,
)
from agents.prompts import CONTRADICTION_PROMPT
from database.case_store import get_case_documents_text


def _get_genai_client():
    return genai.Client(api_key=GEMINI_API_KEY)


async def _run_llm_analysis(prompt: str) -> str:
    """Run analysis using the configured LLM backend."""
    if USE_OLLAMA:
        from langchain_ollama import ChatOllama
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
                max_output_tokens=2000,
            ),
        )
        return response.text


def _rule_based_contradiction_scan(doc_texts: dict[str, str], reason: str = "") -> str:
    findings = []
    
    # 1. Weapon/Injury Check
    combined = "\n".join(doc_texts.values()).lower()
    weapon_conflict = False
    if any(term in combined for term in ["knife", "stab", "sharp weapon"]) and any(
        term in combined for term in ["no stab", "no sharp", "blunt force", "blunt trauma"]
    ):
        findings.append(
            "### 📍 Possible Weapon / Injury Contradiction\n"
            "**Observation**: Discrepancy between 'sharp weapon/stab' claims and 'blunt force' medical findings.\n"
            "**Action**: Compare the Post-Mortem/Medicals against the FIR allegations."
        )

    # 2. Timeline Scan with Context
    time_hits = []
    for doc_name, text in doc_texts.items():
        # Find time patterns and extract the sentence they are in
        lines = text.splitlines()
        for line in lines:
            if re.search(r"\b(?:[01]?\d|2[0-3])(?::[0-5]\d)?\s*(?:am|pm)?\b", line, flags=re.IGNORECASE):
                time_hits.append(f"**{doc_name}**: \"...{line.strip()[:100]}...\"")
                if len(time_hits) >= 10: break # Limit hits
        if len(time_hits) >= 10: break

    if len(time_hits) >= 2:
        findings.append(
            "### 📍 Potential Timeline Inconsistency\n"
            "Multiple documents mention specific times. Cross-reference these statements:\n\n"
            + "\n".join(time_hits[:6])
        )

    # 3. Factual Keywords
    keywords = ["red", "blue", "drunk", "speeding", "braked", "signal", "dark", "light"]
    keyword_hits = []
    for doc_name, text in doc_texts.items():
        lower = text.lower()
        for kw in keywords:
            if kw in lower:
                # Find the sentence
                idx = lower.find(kw)
                start = max(0, idx - 40)
                end = min(len(text), idx + 60)
                snippet = text[start:end].replace("\n", " ").strip()
                keyword_hits.append(f"**{doc_name}** ({kw}): \"...{snippet}...\"")
                break # One per doc per keyword

    if len(keyword_hits) >= 2:
        findings.append(
            "### 📍 Description / Detail Discrepancy\n"
            "Found matching keywords in different documents with potential variations:\n\n"
            + "\n".join(keyword_hits[:6])
        )

    if not findings:
        findings.append(
            "### No Obvious Contradictions Found (Quick Scan)\n"
            "The basic scan didn't find clear conflicts. A deeper review of the legal arguments is recommended."
        )

    note = f"\n\n---\n*Note: This is a fast fallback analysis because the AI agent was slow or unavailable ({reason}).*"
    return "\n\n".join(findings) + note


async def detect_contradictions(case_id: str) -> dict:
    """Analyze all documents in a case for contradictions."""
    doc_texts = get_case_documents_text(case_id)

    if len(doc_texts) < 2:
        return {
            "case_id": case_id,
            "status": "insufficient_documents",
            "message": "Need at least 2 documents to detect contradictions.",
            "contradictions": [],
        }

    # Format documents for the prompt (Reduced limit to fit in context window)
    docs_formatted = ""
    max_per_doc = 3000 if len(doc_texts) > 3 else 5000
    
    for doc_name, text in doc_texts.items():
        # Truncate to ensure context window safety
        truncated = text[:max_per_doc]
        
        # Add line numbers to help the AI reference specific parts
        lines = truncated.splitlines()
        numbered_text = "\n".join([f"{i+1}: {line}" for i, line in enumerate(lines)])
        
        docs_formatted += f"\n\n=== DOCUMENT: {doc_name} ===\n{numbered_text}"

    prompt = CONTRADICTION_PROMPT.format(documents=docs_formatted)

    try:
        analysis = await _run_llm_analysis(prompt)

        has_contradictions = any(
            keyword in analysis.upper()
            for keyword in ["CONTRADICTION", "CONFLICT", "INCONSISTENCY", "DISCREPANCY"]
        )

        return {
            "case_id": case_id,
            "status": "contradictions_found" if has_contradictions else "consistent",
            "documents_analyzed": list(doc_texts.keys()),
            "analysis": analysis,
            "num_documents": len(doc_texts),
        }

    except Exception as e:
        # Handle empty error strings (like asyncio.TimeoutError)
        error_msg = str(e) or e.__class__.__name__ or "Unknown AI Timeout"
        
        if "429" in error_msg or "rate_limit" in error_msg.lower():
            error_msg = "API Rate limit exceeded. Please wait a moment before retrying."
        elif "quota" in error_msg.lower():
            error_msg = "API Quota exhausted. Please check your billing or plan."
        elif "TimeoutError" in error_msg:
            error_msg = "The AI model took too long to respond (Timeout)."
            
        fallback_analysis = _rule_based_contradiction_scan(doc_texts, error_msg)
        has_fallback_findings = "Possible" in fallback_analysis or "📍" in fallback_analysis
        print(f"[SERVICE ERROR] Contradiction Analysis: {error_msg}")
        return {
            "case_id": case_id,
            "status": "contradictions_found" if has_fallback_findings else "consistent",
            "message": error_msg,
            "documents_analyzed": list(doc_texts.keys()),
            "analysis": fallback_analysis,
            "num_documents": len(doc_texts),
            "contradictions": [],
        }


async def detect_contradictions_between(
    doc_a_name: str,
    doc_a_text: str,
    doc_b_name: str,
    doc_b_text: str,
) -> dict:
    """Compare two specific documents for contradictions."""
    docs_formatted = (
        f"\n=== DOCUMENT A: {doc_a_name} ===\n{doc_a_text[:3000]}"
        f"\n\n=== DOCUMENT B: {doc_b_name} ===\n{doc_b_text[:3000]}"
    )

    prompt = CONTRADICTION_PROMPT.format(documents=docs_formatted)

    try:
        analysis = await _run_llm_analysis(prompt)
        return {
            "status": "completed",
            "documents": [doc_a_name, doc_b_name],
            "analysis": analysis,
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
        }
