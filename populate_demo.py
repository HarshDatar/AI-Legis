import sys
import os

sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))
from database.case_store import create_case

def generate_evidence(case_id, doc_name, content):
    path = os.path.join(os.getcwd(), "data", "cases", case_id, "documents")
    os.makedirs(path, exist_ok=True)
    with open(os.path.join(path, f"{doc_name}.txt"), "w", encoding="utf-8") as f:
        f.write(content)

DEMO_CASES = [
    {
        "title": "State of Maharashtra v. Rajesh Sharma",
        "case_number": "WP/1042/2026",
        "court": "Bombay High Court",
        "category": "Criminal",
        "petitioner": "Rajesh Sharma",
        "respondent": "State of Maharashtra",
        "evidence": [
            ("FIR_Andheri_302", "Incident reported at 8:30 PM. Complainant states the accused was seen with a weapon near the gate."),
            ("Witness_A_Statement", "I saw Rajesh at the park at 8:45 PM. He was wearing a blue shirt and seemed calm."),
            ("Medical_Report", "Time of injury estimated between 10:00 PM and 11:00 PM. Cause of death: Blunt force trauma.")
        ]
    }
]

def run():
    print("⚖️  Initializing Professional Judicial Data...")
    for data in DEMO_CASES:
        evidence = data.pop("evidence")
        case = create_case(**data, user_id="lawyer1")
        cid = case["case_id"]
        print(f"  [CASE] Created {case['case_number']}")
        for name, content in evidence:
            generate_evidence(cid, name, content)
            print(f"    [DOC] Generated evidence: {name}")
    print("\n✅ Institutional Docket Ready. Restart your app to begin analysis.")

if __name__ == "__main__":
    run()
