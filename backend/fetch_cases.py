"""
AI-Legis: Case Dataset Builder
Creates folder structures and generates Indian Kanoon search URLs
for you to manually download cases.

Usage: python fetch_cases.py
"""
import os
import json
import urllib.parse
from datetime import datetime

CASES_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "cases")

# Each entry: (category, search_query, num_folders_to_create)
QUERIES = [
    ("criminal", "section 302 murder witness statement high court", 3),
    ("criminal", "section 307 attempt murder forensic report", 2),
    ("criminal", "culpable homicide section 304", 2),
    ("property", "property dispute possession title deed high court", 3),
    ("property", "partition suit inheritance succession act", 2),
    ("family", "section 498A domestic violence cruelty", 2),
    ("family", "divorce maintenance petition family court", 2),
    ("fraud", "section 420 cheating criminal breach trust", 2),
    ("fraud", "financial fraud misappropriation company", 2),
    ("writ", "fundamental rights article 21 writ petition", 2),
    ("cybercrime", "information technology act cyber fraud", 2),
]


def create_case_folder(case_id, category):
    """Create an empty case folder with template metadata."""
    case_dir = os.path.join(CASES_DIR, case_id)
    docs_dir = os.path.join(case_dir, "documents")
    os.makedirs(docs_dir, exist_ok=True)

    metadata = {
        "case_id": case_id,
        "title": "[PASTE CASE TITLE — e.g., State v. Accused Name]",
        "case_number": "[PASTE CASE NUMBER — e.g., CRI/2023/xxxx]",
        "court": "[PASTE COURT NAME — e.g., Bombay High Court]",
        "category": category,
        "date_filed": "",
        "status": "closed",
        "next_hearing": "",
        "parties": {
            "petitioner": "[Petitioner name]",
            "respondent": "[Respondent name]"
        },
        "documents": [],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }

    meta_path = os.path.join(case_dir, "metadata.json")
    if not os.path.exists(meta_path):
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)

    # Create a README in the documents folder
    readme_path = os.path.join(docs_dir, "_README.txt")
    if not os.path.exists(readme_path):
        with open(readme_path, "w") as f:
            f.write(
                "Save case documents here as .txt files.\n\n"
                "For best results, split the judgment into parts:\n"
                "  - judgment.txt (full text, or)\n"
                "  - facts.txt (factual background)\n"
                "  - witness_1.txt (witness testimony)\n"
                "  - witness_2.txt (another witness)\n"
                "  - order.txt (court's final order)\n\n"
                "Delete this _README.txt when done.\n"
            )

    return case_dir


def main():
    print()
    print("=" * 60)
    print("  AI-Legis: Case Dataset Builder")
    print("=" * 60)
    print()

    os.makedirs(CASES_DIR, exist_ok=True)

    # Check what already exists
    existing = set(os.listdir(CASES_DIR)) if os.path.exists(CASES_DIR) else set()
    print(f"  Existing cases: {len(existing)}")
    print()

    case_num = len(existing) + 1
    created = 0

    for category, query, count in QUERIES:
        encoded = urllib.parse.quote(query)
        url = f"https://indiankanoon.org/search/?formInput={encoded}"

        print(f"  [{category.upper()}]")
        print(f"  Search: {query}")
        print(f"  URL:    {url}")
        print()

        for i in range(count):
            case_id = f"case_{case_num:03d}"
            if case_id not in existing:
                folder = create_case_folder(case_id, category)
                print(f"    + Created: {case_id}/ (category: {category})")
                created += 1
            case_num += 1

        print()

    print("=" * 60)
    print(f"  Created {created} new case folders")
    print(f"  Location: {os.path.abspath(CASES_DIR)}")
    print()
    print("  WHAT TO DO NEXT:")
    print("  ─────────────────────────────────────────")
    print("  1. Open each URL above in your browser")
    print("  2. Pick a case with a detailed judgment")
    print("  3. Copy the judgment text (Ctrl+A, Ctrl+C)")
    print("  4. Save as 'judgment.txt' in the case folder")
    print("  5. Edit metadata.json with real case info")
    print("  6. Delete _README.txt from documents/")
    print("  7. Run: python seed_data.py")
    print()


if __name__ == "__main__":
    main()
