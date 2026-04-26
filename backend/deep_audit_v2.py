import time
from database.case_store import list_cases, get_case, list_clients, create_case, delete_case
from database.user_store import get_user_role

def test_relationship_integrity():
    print("\n[TEST] Relationship Integrity (1 Client -> Multiple Cases)")
    # Lawyer 1 ( Rajesh Sharma) should have client c1_1 with 2 cases
    cases = list_cases("lawyer1")
    client_a_cases = [c for c in cases if c.get("client_id") == "c1_1"]
    
    if len(client_a_cases) == 2:
        print("  [PASS] SUCCESS: Client c1_1 correctly has 2 cases under lawyer1.")
    else:
        print(f"  [FAIL] FAILURE: Client c1_1 has {len(client_a_cases)} cases. Expected 2.")

def test_rbac_security():
    print("\n[TEST] RBAC & Data Isolation")
    # lawyer2 should NOT be able to see lawyer1's case L1_CASE_1
    case = get_case("L1_CASE_1", user_id="lawyer2")
    if case is None:
        print("  [PASS] SUCCESS: lawyer2 denied access to lawyer1's data (Data Isolation).")
    else:
        print("  [FAIL] FAILURE: lawyer2 was able to read lawyer1's case metadata!")

def test_role_escalation():
    print("\n[TEST] Role Escalation Check")
    # Only admins should delete. lawyer1 is a lawyer.
    # We'll check the delete_case logic we hardened earlier.
    try:
        success = delete_case("L1_CASE_1", user_id="lawyer1")
        if not success:
            print("  [PASS] SUCCESS: lawyer1 (non-admin) denied case deletion.")
        else:
            print("  [FAIL] FAILURE: lawyer1 was able to delete a case!")
    except Exception as e:
        if "403" in str(e) or "Forbidden" in str(e):
             print("  [PASS] SUCCESS: lawyer1 (non-admin) denied case deletion (Exception caught).")
        else:
             print(f"  [FAIL] FAILURE: Unexpected error during deletion test: {e}")

def test_performance():
    print("\n[TEST] Performance Simulation (List Retrieval)")
    start = time.time()
    for _ in range(100):
        list_cases("lawyer1")
    end = time.time()
    avg_time = (end - start) / 100
    print(f"  [METRIC] PERFORMANCE: Average list_cases latency: {avg_time*1000:.2f}ms")

def test_exploratory_edge_cases():
    print("\n[TEST] Exploratory Edge Cases")
    # Empty title
    try:
        c = create_case("", "NUM-123", "Court X", user_id="lawyer1")
        print("  [WARN] EDGE: System allowed case with empty title.")
    except:
        print("  [PASS] EDGE: System rejected empty title.")

if __name__ == "__main__":
    print("=== AI-LEGIS DEEP AUDIT V2.0 ===")
    test_relationship_integrity()
    test_rbac_security()
    test_role_escalation()
    test_performance()
    test_exploratory_edge_cases()
