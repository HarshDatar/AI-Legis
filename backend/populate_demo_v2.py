import sqlite3
import os
import uuid
from datetime import datetime, timedelta
from database.db import init_db

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DB_PATH = os.path.join(DATA_DIR, "ai_legis.db")

def get_conn():
    return sqlite3.connect(DB_PATH)

def clear_db():
    conn = get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM cases")
    c.execute("DELETE FROM clients")
    c.execute("DELETE FROM users")
    conn.commit()
    conn.close()
    print("[1/4] Zero-State: Database cleared.")

def populate():
    conn = get_conn()
    c = conn.cursor()
    now = datetime.now().isoformat()

    # ─── 1. Create 3 Lawyers ───
    lawyers = [
        ("lawyer1", "adv_sharma", "Adv. Rajesh Sharma", "sharma@legis.com"),
        ("lawyer2", "adv_verma", "Adv. Meera Verma", "verma@legis.com"),
        ("lawyer3", "adv_khan", "Adv. Zaid Khan", "khan@legis.com"),
    ]
    for lid, user, name, email in lawyers:
        c.execute("INSERT INTO users (id, username, name, password, role) VALUES (?, ?, ?, ?, ?)",
                  (lid, user, name, "password123", "lawyer"))

    # ─── 2. Create Clients ───
    # Lawyer 1: 4 Clients (Client A will have multiple cases)
    # Lawyer 2: 5 Clients
    # Lawyer 3: 4 Clients
    clients = []
    # Lawyer 1 Clients
    l1_clients = [("c1_1", "Aditya Birla", "aditya@corp.com"), ("c1_2", "Suresh Raina", "suresh@cricket.com"), 
                  ("c1_3", "Priya Singh", "priya@tech.com"), ("c1_4", "Common Client", "common@test.com")]
    for cid, name, email in l1_clients:
        c.execute("INSERT INTO clients (id, lawyer_id, name, email, created_at) VALUES (?, ?, ?, ?, ?)",
                  (cid, "lawyer1", name, email, now))
        clients.append(cid)

    # Lawyer 2 Clients
    for i in range(1, 6):
        cid = f"c2_{i}"
        c.execute("INSERT INTO clients (id, lawyer_id, name, email, created_at) VALUES (?, ?, ?, ?, ?)",
                  (cid, "lawyer2", f"L2 Client {i}", f"l2_c{i}@test.com", now))
        clients.append(cid)

    # Lawyer 3 Clients
    for i in range(1, 5):
        cid = f"c3_{i}"
        c.execute("INSERT INTO clients (id, lawyer_id, name, email, created_at) VALUES (?, ?, ?, ?, ?)",
                  (cid, "lawyer3", f"L3 Client {i}", f"l3_c{i}@test.com", now))
        clients.append(cid)

    # ─── 3. Create 14 Cases ───
    # Lawyer 1: 5 cases (Client c1_1 has 2 cases)
    l1_cases = [
        ("L1_CASE_1", "c1_1", "Birla vs State - Land Dispute", "Property", "Open", "High"),
        ("L1_CASE_2", "c1_1", "Birla vs Tax Dept", "Taxation", "In Progress", "Medium"), # Relational Edge Case
        ("L1_CASE_3", "c1_2", "Raina Defamation Suit", "Civil", "In Progress", "High"),
        ("L1_CASE_4", "c1_3", "Priya Intellectual Property", "Corporate", "Closed", "Low"),
        ("L1_CASE_5", "c1_4", "Simple Tenant Dispute", "Civil", "Open", "Medium"),
    ]
    
    # Lawyer 2: 5 cases
    l2_cases = [(f"L2_CASE_{i}", f"c2_{i}", f"Verma Matter {i}", "Criminal", "In Progress", "Medium") for i in range(1, 6)]
    
    # Lawyer 3: 4 cases
    l3_cases = [(f"L3_CASE_{i}", f"c3_{i}", f"Khan Matter {i}", "Family", "Open", "Low") for i in range(1, 5)]

    def insert_cases(cases, lid):
        for cid, clid, title, cat, status, prio in cases:
            date = (datetime.now() - timedelta(days=10)).isoformat()
            c.execute('''INSERT INTO cases (id, user_id, client_id, title, category, status, created_at, updated_at, court) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                      (cid, lid, clid, title, cat, status, date, now, "High Court"))

    insert_cases(l1_cases, "lawyer1")
    insert_cases(l2_cases, "lawyer2")
    insert_cases(l3_cases, "lawyer3")

    conn.commit()
    conn.close()
    print("[2/4] Demo Data: Successfully generated 3 lawyers, 13 clients, and 14 cases.")

def validate():
    conn = get_conn()
    c = conn.cursor()
    
    print("\n[3/4] Validation Report:")
    
    # Total counts
    c.execute("SELECT COUNT(*) FROM users WHERE role='lawyer'")
    print(f"  - Lawyers: {c.fetchone()[0]} (Expected: 3)")
    
    c.execute("SELECT COUNT(*) FROM cases")
    total_cases = c.fetchone()[0]
    print(f"  - Total Cases: {total_cases} (Expected: 13-15)")
    
    # Distribution per lawyer
    c.execute("SELECT user_id, COUNT(*) FROM cases GROUP BY user_id")
    for lid, count in c.fetchall():
        print(f"  - {lid}: {count} cases (Expected: 4-5)")
        
    # Relational Edge Case: Client with multiple cases
    c.execute("SELECT client_id, COUNT(*) FROM cases GROUP BY client_id HAVING COUNT(*) > 1")
    row = c.fetchone()
    if row:
        print(f"  - RELATIONAL VALIDATED: Client {row[0]} has {row[1]} cases.")
    else:
        print("  - ERROR: No client found with multiple cases.")
        
    conn.close()

if __name__ == "__main__":
    init_db()
    clear_db()
    populate()
    validate()
