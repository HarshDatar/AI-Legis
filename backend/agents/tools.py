"""
AI-Legis: Agent Tools
Defines the tools that the AI agent can autonomously choose to call.
This is what makes it an AGENT (autonomous tool selection) vs a chatbot (just text in/out).
"""
from langchain_core.tools import tool
from agents.context import get_agent_user_id


def _run_async(coro):
    """Run async services from sync LangChain tools, even inside an event loop."""
    import asyncio
    from concurrent.futures import ThreadPoolExecutor

    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)

    with ThreadPoolExecutor(max_workers=1) as executor:
        return executor.submit(lambda: asyncio.run(coro)).result()


@tool
def search_case_documents(query: str, case_id: str = "") -> str:
    """Search through uploaded legal documents to find relevant passages.
    Use this when the user asks about specific facts, dates, statements, 
    or legal provisions in a case. If case_id is provided, searches only 
    that case; otherwise searches all cases.
    
    Args:
        query: The search query describing what to find
        case_id: Optional case ID to restrict search to a specific case
    """
    # Defensive check: sometimes 1B models pass objects instead of strings
    if isinstance(case_id, dict):
        case_id = case_id.get("case_id", str(case_id))
    
    from services.embedding_service import search_documents

    results = search_documents(query, case_id=case_id if case_id else None, top_k=8)
    
    if not results:
        return "No relevant documents found for this query."
    
    output_parts = []
    for i, r in enumerate(results, 1):
        doc_name = r["metadata"].get("document_name", "Unknown")
        case = r["metadata"].get("case_id", "Unknown")
        relevance = round((1 - r["distance"]) * 100, 1)
        output_parts.append(
            f"**Result {i}** (Relevance: {relevance}%)\n"
            f"📄 Document: {doc_name} | Case: {case}\n"
            f"Content: {r['text'][:500]}\n"
        )
    
    return "\n---\n".join(output_parts)


@tool
def get_case_info(case_id: str) -> str:
    """Get metadata about a specific case — parties, court, status, dates, 
    and list of documents. Use this to orient yourself before diving into 
    detailed analysis of a case.
    
    Args:
        case_id: The case ID to look up
    """
    # Defensive check
    if isinstance(case_id, dict):
        case_id = case_id.get("case_id", str(case_id))
        
    from database.case_store import get_case

    case = get_case(case_id, get_agent_user_id())
    if not case:
        return f"Case '{case_id}' not found. Please verify the Case ID and try again."
    
    docs = case.get("documents", [])
    doc_list = ", ".join(d["name"] for d in docs) if docs else "No documents uploaded"
    parties = case.get("parties", {})
    
    return (
        f"📋 **{case['title']}**\n"
        f"• Case Number: {case.get('case_number', 'N/A')}\n"
        f"• Court: {case.get('court', 'N/A')}\n"
        f"• Category: {case.get('category', 'N/A')}\n"
        f"• Status: {case.get('status', 'N/A')}\n"
        f"• Filed: {case.get('date_filed', 'N/A')}\n"
        f"• Next Hearing: {case.get('next_hearing', 'N/A')}\n"
        f"• Petitioner: {parties.get('petitioner', 'N/A')}\n"
        f"• Respondent: {parties.get('respondent', 'N/A')}\n"
        f"• Documents: {doc_list}\n"
    )


@tool
def find_contradictions(case_id: str) -> str:
    """Analyze all documents within a case to find logical contradictions,
    timeline conflicts, and factual inconsistencies between witness statements,
    FIRs, evidence, and other legal documents.
    
    Use this when the user asks to check for inconsistencies or contradictions.
    Requires at least 2 documents in the case.
    
    Args:
        case_id: The case ID to analyze
    """
    # Defensive check
    if isinstance(case_id, dict):
        case_id = case_id.get("case_id", str(case_id))
        
    from services.contradiction_service import detect_contradictions

    result = _run_async(detect_contradictions(case_id))
    
    if result["status"] == "insufficient_documents":
        return result["message"]
    
    if result["status"] == "error":
        return f"Error during analysis: {result['message']}"
    
    header = (
        f"🔍 **Contradiction Analysis for Case {case_id}**\n"
        f"Documents analyzed: {', '.join(result.get('documents_analyzed', []))}\n\n"
    )
    
    return header + result["analysis"]


@tool
def summarize_case(case_id: str) -> str:
    """Generate plain-English summaries of all documents in a case.
    Converts complex legal language into simple, understandable text.
    
    Use this when the user wants to understand a case or its documents
    in simple language.
    
    Args:
        case_id: The case ID whose documents to summarize
    """
    # Defensive check
    if isinstance(case_id, dict):
        case_id = case_id.get("case_id", str(case_id))
        
    from services.summarization_service import summarize_case_documents

    result = _run_async(summarize_case_documents(case_id))
    
    if result["status"] == "no_documents":
        return result["message"]
    
    output_parts = [f"📝 **Case Summary** ({result['documents_summarized']} documents)\n"]
    
    for s in result.get("summaries", []):
        if s["status"] == "success":
            output_parts.append(
                f"\n### {s['document']}\n{s['summary']}"
            )
        else:
            output_parts.append(
                f"\n### {s.get('document', 'Unknown')}\n⚠️ Could not summarize: {s.get('message', 'Unknown error')}"
            )
    
    return "\n".join(output_parts)


@tool
def list_all_cases() -> str:
    """List all cases currently in the system with their basic info.
    Use this when the user asks what cases are available or wants an overview.
    """
    from database.case_store import list_cases

    cases = list_cases(get_agent_user_id())
    if not cases:
        return "No cases in the system yet. Upload documents to create a case."
    
    output = f"📊 **{len(cases)} Cases in System**\n\n"
    for c in cases:
        status_emoji = {
            "active": "🟢",
            "hearing_scheduled": "📅",
            "closed": "⚪",
            "pending": "🟡",
        }.get(c.get("status", ""), "🔵")
        
        doc_count = len(c.get("documents", []))
        output += (
            f"{status_emoji} **{c['title']}** (ID: `{c['case_id']}`)\n"
            f"   Court: {c.get('court', 'N/A')} | "
            f"Category: {c.get('category', 'N/A')} | "
            f"Documents: {doc_count}\n\n"
        )
    
    return output


# Export all tools as a list for the agent
ALL_TOOLS = [
    search_case_documents,
    get_case_info,
    find_contradictions,
    summarize_case,
    list_all_cases,
]
