"""
AI-Legis: Case Data Store
Manages case metadata using SQLite database (ai_legis.db).
Documents are still stored on disk in the cases directory.
"""
import os
import uuid
from datetime import datetime
from typing import Optional
from config import CASES_DIR
from database.db import get_db_connection

def _ensure_dirs():
    os.makedirs(CASES_DIR, exist_ok=True)

def _docs_dir(case_id: str) -> str:
    # Path Traversal Protection: Sanitize case_id
    safe_id = "".join(c for c in case_id if c.isalnum() or c == "-")
    return os.path.join(CASES_DIR, safe_id, "documents")

def _row_to_dict(row) -> dict:
    d = dict(row)
    # Remap for backwards compatibility
    d["case_id"] = d.pop("id")
    d["client_id"] = d.get("client_id")
    d["parties"] = {
        "petitioner": d.pop("petitioner", ""),
        "respondent": d.pop("respondent", "")
    }
    return d

def create_case(
    title: str,
    case_number: str,
    court: str,
    category: str = "general",
    date_filed: str = "",
    status: str = "active",
    next_hearing: str = "",
    petitioner: str = "",
    respondent: str = "",
    user_id: str = "lawyer1",
    client_id: str = None
) -> dict:
    if not title or len(title.strip()) < 3:
        raise ValueError("Case title must be at least 3 characters long")
    if not case_number:
        raise ValueError("Case number is required")

    _ensure_dirs()
    case_id = str(uuid.uuid4())[:8]
    case_dir = os.path.join(CASES_DIR, case_id)
    
    # Verify the path is within CASES_DIR
    if not os.path.abspath(case_dir).startswith(os.path.abspath(CASES_DIR)):
        raise ValueError("Invalid case directory path")

    os.makedirs(case_dir, exist_ok=True)
    os.makedirs(os.path.join(case_dir, "documents"), exist_ok=True)

    now = datetime.now().isoformat()
    if not date_filed:
        date_filed = datetime.now().strftime("%Y-%m-%d")

    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO cases (id, user_id, client_id, title, case_number, court, category, date_filed, status, next_hearing, petitioner, respondent, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (case_id, user_id, client_id, title, case_number, court, category, date_filed, status, next_hearing, petitioner, respondent, now, now))
    conn.commit()
    conn.close()

    return get_case(case_id, user_id)

def get_case(case_id: str, user_id: str = None) -> Optional[dict]:
    if not user_id:
        return None # Require user_id for lookups
        
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM cases WHERE id = ? AND user_id = ?", (case_id, user_id))
    
    row = c.fetchone()
    if not row:
        conn.close()
        return None
    
    case = _row_to_dict(row)
    
    # Get documents
    c.execute("SELECT name, type, uploaded_at FROM documents WHERE case_id = ?", (case_id,))
    docs = [dict(d) for d in c.fetchall()]
    case["documents"] = docs
    
    conn.close()
    return case

def list_cases(user_id: str = None) -> list[dict]:
    if not user_id:
        return []  # Safety: Return nothing if user is not authenticated
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM cases WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    
    cases = []
    rows = c.fetchall()
    
    for row in rows:
        case = _row_to_dict(row)
        c.execute("SELECT name, type, uploaded_at FROM documents WHERE case_id = ?", (case["case_id"],))
        case["documents"] = [dict(d) for d in c.fetchall()]
        cases.append(case)
        
    conn.close()
    return cases

def list_clients(user_id: str) -> list[dict]:
    """List all clients for a specific lawyer."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM clients WHERE lawyer_id = ? ORDER BY name ASC", (user_id,))
    clients = [dict(row) for row in c.fetchall()]
    conn.close()
    return clients

def update_case(case_id: str, updates: dict, user_id: str = None) -> Optional[dict]:
    conn = get_db_connection()
    c = conn.cursor()
    
    # Extract parties if provided
    parties = updates.pop("parties", {})
    if "petitioner" in parties:
        updates["petitioner"] = parties["petitioner"]
    if "respondent" in parties:
        updates["respondent"] = parties["respondent"]
        
    updates.pop("case_id", None)
    updates["updated_at"] = datetime.now().isoformat()
    
    set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values())
    values.append(case_id)
    
    if set_clause:
        if not user_id:
            conn.close()
            return None
            
        values.append(user_id)
        c.execute(f"UPDATE cases SET {set_clause} WHERE id = ? AND user_id = ?", values)
        conn.commit()
        
    conn.close()
    return get_case(case_id, user_id)

def add_document_to_case(case_id: str, doc_name: str, doc_type: str = "general", user_id: str = None) -> Optional[dict]:
    conn = get_db_connection()
    c = conn.cursor()
    doc_id = str(uuid.uuid4())[:8]
    now = datetime.now().isoformat()
    
    c.execute("DELETE FROM documents WHERE case_id = ? AND name = ?", (case_id, doc_name))
    c.execute('''
        INSERT INTO documents (id, case_id, name, type, uploaded_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (doc_id, case_id, doc_name, doc_type, now))
    
    c.execute("UPDATE cases SET updated_at = ? WHERE id = ?", (now, case_id))
    conn.commit()
    conn.close()
    
    return get_case(case_id, user_id)

def delete_case(case_id: str, user_id: str = None) -> bool:
    import shutil
    from database.user_store import get_user_role
    
    # ─── SERVICE LEVEL RBAC ───
    role = get_user_role(user_id)
    if role != "admin" and user_id != "admin":
        return False # Silent rejection for non-admins at service level

    # Verify ownership or existence
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id FROM cases WHERE id = ?", (case_id,))
    if not c.fetchone():
        conn.close()
        return False

    c.execute("DELETE FROM cases WHERE id = ?", (case_id,))
    c.execute("DELETE FROM documents WHERE case_id = ?", (case_id,))
    conn.commit()
    conn.close()
    
    case_dir = os.path.join(CASES_DIR, case_id)
    if os.path.exists(case_dir):
        shutil.rmtree(case_dir)
        
    return True

def get_case_documents_text(case_id: str) -> dict[str, str]:
    from services.ocr_service import extract_text_from_file

    docs = {}
    docs_path = _docs_dir(case_id)
    if not os.path.exists(docs_path):
        return docs

    supported = {".txt", ".pdf", ".html", ".htm", ".md", ".text"}

    for fname in os.listdir(docs_path):
        fpath = os.path.join(docs_path, fname)
        ext = os.path.splitext(fname)[1].lower()

        if os.path.isfile(fpath) and ext in supported and not fname.startswith("_"):
            try:
                docs[fname] = extract_text_from_file(fpath)
            except Exception as e:
                print(f"  Warning: Could not read {fname}: {e}")

    return docs
