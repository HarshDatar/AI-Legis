"""
AI-Legis: Chat Data Store
Manages persistent chat history using SQLite.
"""
import json
from datetime import datetime
from database.db import get_db_connection

def save_message(user_id: str, case_id: str, role: str, content: str, tools_used: list = None):
    """Save a chat message to the database."""
    conn = get_db_connection()
    c = conn.cursor()
    tools_json = json.dumps(tools_used or [])
    c.execute('''
        INSERT INTO chat_history (user_id, case_id, role, content, tools_used)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, case_id, role, content, tools_json))
    conn.commit()
    conn.close()

def get_history(user_id: str, case_id: str = None, limit: int = 50):
    """Retrieve chat history for a user/case."""
    conn = get_db_connection()
    c = conn.cursor()
    if case_id:
        c.execute('''
            SELECT role, content, tools_used, created_at 
            FROM chat_history 
            WHERE user_id = ? AND case_id = ? 
            ORDER BY created_at ASC LIMIT ?
        ''', (user_id, case_id, limit))
    else:
        c.execute('''
            SELECT role, content, tools_used, created_at 
            FROM chat_history 
            WHERE user_id = ? 
            ORDER BY created_at ASC LIMIT ?
        ''', (user_id, limit))
    
    rows = c.fetchall()
    history = []
    for row in rows:
        history.append({
            "role": row["role"],
            "content": row["content"],
            "tools_used": json.loads(row["tools_used"]),
            "timestamp": row["created_at"]
        })
    conn.close()
    return history

def delete_history(user_id: str, case_id: str = None):
    """Clear chat history."""
    conn = get_db_connection()
    c = conn.cursor()
    if case_id:
        c.execute("DELETE FROM chat_history WHERE user_id = ? AND case_id = ?", (user_id, case_id))
    else:
        c.execute("DELETE FROM chat_history WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
