import sqlite3
import os
from config import DATA_DIR

DB_PATH = os.path.join(DATA_DIR, 'ai_legis.db')

def get_db_connection():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('PRAGMA journal_mode=WAL')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            name TEXT,
            role TEXT DEFAULT 'user'
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            lawyer_id TEXT,
            name TEXT,
            email TEXT UNIQUE,
            phone TEXT,
            created_at TEXT,
            FOREIGN KEY (lawyer_id) REFERENCES users(id)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS cases (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            client_id TEXT,
            title TEXT,
            case_number TEXT,
            court TEXT,
            category TEXT,
            date_filed TEXT,
            status TEXT,
            next_hearing TEXT,
            petitioner TEXT,
            respondent TEXT,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (client_id) REFERENCES clients(id)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            case_id TEXT,
            name TEXT,
            type TEXT,
            uploaded_at TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            case_id TEXT,
            role TEXT,
            content TEXT,
            tools_used TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
