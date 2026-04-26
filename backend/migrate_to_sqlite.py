import os
import json
import uuid
from database.db import get_db_connection, init_db
from config import CASES_DIR

def run_migration():
    init_db()
    conn = get_db_connection()
    c = conn.cursor()

    # Create 4 Demo Lawyers
    lawyers = [
        ("lawyer1", "lawyer1", "password", "Arjun Mehta (Lawyer 1)", 3),
        ("lawyer2", "lawyer2", "password", "Priya Sharma (Lawyer 2)", 3),
        ("lawyer3", "lawyer3", "password", "Rohan Desai (Lawyer 3)", 3),
        ("lawyer4", "lawyer4", "password", "Neha Gupta (Lawyer 4)", 4)
    ]

    for uid, user, pwd, name, _ in lawyers:
        c.execute("INSERT OR IGNORE INTO users (id, username, password, name) VALUES (?, ?, ?, ?)", 
                  (uid, user, pwd, name))

    # Read existing cases
    existing_cases = []
    if os.path.exists(CASES_DIR):
        for entry in os.listdir(CASES_DIR):
            case_dir = os.path.join(CASES_DIR, entry)
            meta_path = os.path.join(case_dir, "metadata.json")
            if os.path.isdir(case_dir) and os.path.exists(meta_path):
                with open(meta_path, "r", encoding="utf-8") as f:
                    existing_cases.append(json.load(f))
    
    # Sort cases to be deterministic
    existing_cases.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # Distribute cases
    case_index = 0
    for uid, user, pwd, name, num_cases in lawyers:
        for _ in range(num_cases):
            if case_index < len(existing_cases):
                case = existing_cases[case_index]
                c.execute('''
                    INSERT OR REPLACE INTO cases 
                    (id, user_id, title, case_number, court, category, date_filed, status, next_hearing, petitioner, respondent, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    case.get("case_id"),
                    uid,
                    case.get("title"),
                    case.get("case_number", ""),
                    case.get("court", ""),
                    case.get("category", ""),
                    case.get("date_filed", ""),
                    case.get("status", "active"),
                    case.get("next_hearing", ""),
                    case.get("parties", {}).get("petitioner", ""),
                    case.get("parties", {}).get("respondent", ""),
                    case.get("created_at", ""),
                    case.get("updated_at", "")
                ))
                
                # Documents
                for doc in case.get("documents", []):
                    c.execute('''
                        INSERT OR REPLACE INTO documents (id, case_id, name, type, uploaded_at)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (
                        str(uuid.uuid4())[:8],
                        case.get("case_id"),
                        doc.get("name"),
                        doc.get("type", "general"),
                        doc.get("uploaded_at", "")
                    ))
                
                case_index += 1

    # Assign remaining cases to lawyer1
    while case_index < len(existing_cases):
        case = existing_cases[case_index]
        c.execute('''
            INSERT OR REPLACE INTO cases 
            (id, user_id, title, case_number, court, category, date_filed, status, next_hearing, petitioner, respondent, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            case.get("case_id"),
            "lawyer1",
            case.get("title"),
            case.get("case_number", ""),
            case.get("court", ""),
            case.get("category", ""),
            case.get("date_filed", ""),
            case.get("status", "active"),
            case.get("next_hearing", ""),
            case.get("parties", {}).get("petitioner", ""),
            case.get("parties", {}).get("respondent", ""),
            case.get("created_at", ""),
            case.get("updated_at", "")
        ))
        for doc in case.get("documents", []):
            c.execute('''
                INSERT OR REPLACE INTO documents (id, case_id, name, type, uploaded_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                str(uuid.uuid4())[:8],
                case.get("case_id"),
                doc.get("name"),
                doc.get("type", "general"),
                doc.get("uploaded_at", "")
            ))
        case_index += 1

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()
