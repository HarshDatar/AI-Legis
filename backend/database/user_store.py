from database.db import get_db_connection

def get_user_role(user_id: str) -> str:
    """Fetch a user's role from the database."""
    if not user_id:
        return "guest"
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT role FROM users WHERE id = ?", (user_id,))
    row = c.fetchone()
    conn.close()
    
    if row:
        return row['role']
    return "user" # Default to user if ID is unknown but present
