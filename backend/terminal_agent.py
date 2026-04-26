# -*- coding: utf-8 -*-
import asyncio
import os
import sys
import warnings
import io

# ── Fix Windows terminal encoding ──
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# ── Suppress noisy warnings ──
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# Add backend directory to path
file_path = os.path.abspath(__file__)
backend_dir = os.path.dirname(file_path)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from agents.legal_agent import chat
from agents.context import set_agent_user_id
from config import DEFAULT_USER_ID

import re

# Known case ID patterns — must match what's in the database
CASE_ID_PATTERN = re.compile(
    r'\b(case_\d{3,}|demo\d+|guddu_krishna|[0-9a-f]{8}|l[123]_case_\d+)\b',
    re.IGNORECASE
)

def extract_case_id(text: str) -> str | None:
    """Extract a case ID from user input, if one is present."""
    m = CASE_ID_PATTERN.search(text)
    return m.group(1).lower() if m else None


def try_direct_tools(user_input: str, case_id: str | None = None, user_id: str | None = None) -> str | None:
    """
    Route to the correct tool directly without going through the LLM.
    Priority (highest → lowest):
      1. Summarize a specific case
      2. Contradictions in a specific case
      3. Any mention of a case ID  → get_case_info
      4. List / show all cases
    Returns output string, or None to fall through to the LLM.
    """
    set_agent_user_id(user_id or DEFAULT_USER_ID)
    text = user_input.lower().strip()
    case_id = case_id or extract_case_id(text)

    # ── Priority 1: Summarize ──
    if case_id and any(k in text for k in ['summar', 'explain', 'simplify', 'overview']):
        from agents.tools import summarize_case
        return summarize_case.invoke({"case_id": case_id})

    # ── Priority 2: Contradictions ──
    if case_id and any(k in text for k in ['contradict', 'inconsist', 'conflict', 'discrepan']):
        from agents.tools import find_contradictions
        return find_contradictions.invoke({"case_id": case_id})

    # ── Priority 2.5: Search (New) ──
    search_keywords = ['search', 'find', 'lookup', 'where does it say']
    if case_id and any(k in text for k in search_keywords):
        # Try to extract a query: remove keywords and case_id from text
        query = text
        for k in search_keywords: query = query.replace(k, '')
        query = query.replace(case_id, '').replace('in case', '').replace('for', '').strip()
        if len(query) > 3:
            from agents.tools import search_case_documents
            return search_case_documents.invoke({"query": query, "case_id": case_id})

    wants_case_info = case_id and (
        text == case_id.lower()
        or text.startswith("case ")
        or any(k in text for k in ["case info", "case details", "matter details", "metadata", "show details"])
    )

    # ── Priority 3: Explicit case info requests ──
    if case_id and wants_case_info:
        from agents.tools import get_case_info
        return get_case_info.invoke({"case_id": case_id})

    # ── Priority 4: List / show all cases ──
    strict_list_commands = ['list', 'cases', 'list cases', 'all cases', 'show cases', 'show all cases', 'available cases']
    if text in strict_list_commands or text.startswith('list all '):
        from agents.tools import list_all_cases
        return list_all_cases.invoke({})

    return None  # Let the LLM handle free-form legal questions


def print_help():
    print("""
[INSTANT COMMANDS — No AI wait, results in <1 second]
  cases                         - List all 52 cases
  case_001                      - Get info for case_001 (just type the ID!)
  summarize case_001            - Summarize documents for a case
  contradict demo001            - Find contradictions in a case
  guddu_krishna                 - Works with any known case ID

[CASE IDs WITH DOCUMENTS]
  case_001 to case_026          - Individual Indian court cases
  demo001                       - State of Maharashtra v. Rajesh Sharma (4 docs)
  guddu_krishna                 - State of Maharashtra v. Guddu Krish Yadav (5 docs)

[AI QUERIES — Uses local LLM (~30-60s on i3 CPU)]
  What is IPC Section 302?
  Explain bail conditions in Indian law
  (Any free-form legal question with no case ID)

[OTHER]
  help   - Show this menu
  exit   - Stop the agent
""")


async def terminal_test():
    print("\n" + "=" * 57)
    print("       AI-LEGIS INTERACTIVE AGENT TERMINAL")
    print("=" * 57)
    print("  Backend : Ollama (100% LOCAL - No API Key Needed)")
    print("  Model   : llama3.2:1b")
    print("  Data    : 52 Indian Legal Cases")
    print("-" * 57)
    print("  Type 'help' for quick commands.")
    print("  Type 'exit' or 'quit' to stop.")
    print("=" * 57)
    print("\n>>> AI-Legis Agent is ready.\n")

    chat_history = []

    while True:
        try:
            user_input = input("You: ").strip()

            if not user_input:
                continue

            if user_input.lower() in ['exit', 'quit', 'q']:
                print("\nExiting AI-Legis. Goodbye!")
                break

            if user_input.lower() == 'help':
                print_help()
                continue

            # ── Try direct tool call first (fast, reliable) ──
            direct_result = try_direct_tools(user_input)
            if direct_result:
                print("\n[DIRECT TOOL RESULT]")
                print("-" * 57)
                print(direct_result)
                print("-" * 57 + "\n")
                chat_history.append({"role": "user", "content": user_input})
                chat_history.append({"role": "assistant", "content": direct_result})
                continue

            # ── Fall through to LLM agent ──
            print("\n[Thinking via local AI...]\n")
            result = await chat(user_input, chat_history=chat_history)

            if result.get('tools_used'):
                print("[TOOLS CALLED]")
                for tool in result['tools_used']:
                    print(f"  >> {tool['tool']}  |  Input: {tool['input']}")
                print()

            print("AI-Legis:")
            print("-" * 57)
            print(result['response'])
            print("-" * 57 + "\n")

            if result.get('status') == 'error':
                print("[TIP] Try a quick command instead — type 'help' to see options.\n")

            chat_history.append({"role": "user", "content": user_input})
            chat_history.append({"role": "assistant", "content": result['response']})

        except KeyboardInterrupt:
            print("\n\nInterrupted. Exiting...")
            break
        except Exception as e:
            print(f"\n[ERROR] {e}")
            print("Type 'help' to see quick commands.\n")


if __name__ == "__main__":
    asyncio.run(terminal_test())
