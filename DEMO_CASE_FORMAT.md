# AI-Legis Demo Case Handoff Format

Use this format when preparing demo cases for agent testing. The app database is the source of truth for case number, title, court, parties, status, and hearing date. The folders below are the staging format your friends should prepare before you create/upload the cases in the UI.

## Folder Structure

Create one folder per demo case:

```text
demo_cases/
  DEMO_CRIMINAL_001/
    metadata.json
    documents/
      01_fir.txt
      02_complainant_statement.txt
      03_witness_statement.txt
      04_medical_or_forensic_report.txt
      05_charge_sheet.txt
    notes/
      expected_agent_findings.md
```

Accepted document formats: `.txt`, `.pdf`, `.html`, `.htm`, `.md`.

Recommended for reliable testing: use `.txt` first. PDFs are fine, but scanned PDFs depend on OCR/Tesseract and are less predictable.

## metadata.json Format

```json
{
  "case_id_hint": "DEMO_CRIMINAL_001",
  "case_number": "CRI/2026/001",
  "title": "State of Maharashtra v. Rajesh Sharma",
  "court": "Bombay High Court",
  "category": "Criminal",
  "status": "active",
  "date_filed": "2026-04-20",
  "next_hearing": "2026-05-12",
  "petitioner": "State of Maharashtra",
  "respondent": "Rajesh Sharma",
  "lawyer_user_id": "lawyer1",
  "document_order": [
    "01_fir.txt",
    "02_complainant_statement.txt",
    "03_witness_statement.txt",
    "04_medical_or_forensic_report.txt",
    "05_charge_sheet.txt"
  ],
  "test_focus": [
    "timeline contradiction",
    "weapon mismatch",
    "witness reliability",
    "applicable IPC sections"
  ]
}
```

## Document Content Format

Each document should begin with a small header, then plain factual content.

```text
DOCUMENT TYPE: FIR
CASE NUMBER: CRI/2026/001
DATE: 2026-04-20
SOURCE: Andheri Police Station

CONTENT:
At 8:30 PM on 14 April 2026, the complainant reported that Rajesh Sharma was seen near the gate carrying a knife...
```

Keep each document internally clear. The agent performs best when facts are explicit: dates, times, people, locations, allegations, exhibits, and document source.

## Example Demo Case

```text
demo_cases/
  DEMO_CRIMINAL_001/
    metadata.json
    documents/
      01_fir.txt
      02_complainant_statement.txt
      03_witness_statement.txt
      04_forensic_report.txt
      05_charge_sheet.txt
    notes/
      expected_agent_findings.md
```

### 01_fir.txt

```text
DOCUMENT TYPE: FIR
CASE NUMBER: CRI/2026/001
DATE: 2026-04-15
SOURCE: Andheri Police Station

CONTENT:
The complainant states that on 14 April 2026 at approximately 8:30 PM, Rajesh Sharma attacked Vikram Verma with a knife outside Green Valley Apartments. The FIR records two visible stab wounds and states that the accused fled toward Link Road.
```

### 02_complainant_statement.txt

```text
DOCUMENT TYPE: COMPLAINANT STATEMENT
CASE NUMBER: CRI/2026/001
DATE: 2026-04-15
SOURCE: Statement of Suresh Verma

CONTENT:
Suresh Verma states that he reached the building at 8:45 PM. He saw Rajesh Sharma leaving from the main gate wearing a blue jacket. He says Vikram Verma had argued with Rajesh earlier that evening regarding a property dispute.
```

### 03_witness_statement.txt

```text
DOCUMENT TYPE: WITNESS STATEMENT
CASE NUMBER: CRI/2026/001
DATE: 2026-04-16
SOURCE: Statement of Priya Nair

CONTENT:
Priya Nair states that she saw Rajesh Sharma at a tea stall near Andheri Station at 8:35 PM. She says he was wearing a grey shirt and did not appear injured or panicked. She did not see a knife.
```

### 04_forensic_report.txt

```text
DOCUMENT TYPE: FORENSIC REPORT
CASE NUMBER: CRI/2026/001
DATE: 2026-04-17
SOURCE: Forensic Medicine Department

CONTENT:
The post-mortem estimates time of death between 9:45 PM and 10:30 PM. No stab wounds were found. Cause of death was blunt force trauma to the left temporal region. No sharp weapon injury was observed.
```

### 05_charge_sheet.txt

```text
DOCUMENT TYPE: CHARGE SHEET
CASE NUMBER: CRI/2026/001
DATE: 2026-04-25
SOURCE: Investigating Officer

CONTENT:
The charge sheet alleges offences under IPC Sections 302 and 506. It relies on the FIR, complainant statement, and recovery of a kitchen knife from the accused's residence. The charge sheet does not discuss the forensic finding of blunt force trauma.
```

### notes/expected_agent_findings.md

```text
Expected findings:
- FIR alleges knife/stab injuries, but forensic report says no stab wounds.
- FIR time 8:30 PM conflicts with forensic death window 9:45 PM to 10:30 PM.
- Clothing differs between complainant and witness.
- Charge sheet relies on knife recovery but does not reconcile forensic report.
```

## Process For Adding New Demo Cases

1. Ask each friend to prepare one complete case folder under `demo_cases/`.
2. Review `metadata.json` first. The fields must be complete before upload.
3. Open the app and sign in as the matching `lawyer_user_id`, usually `lawyer1`.
4. Click `NEW MATTER`.
5. Copy these fields from `metadata.json`:
   `case_number`, `title`, `court`, `category`, `petitioner`, `respondent`, `next_hearing`.
6. Submit the case.
7. Open `UPLOAD FILE`.
8. Select the new case and upload every file from that case's `documents/` folder.
9. After upload, open the case and test:
   `Summarize this case`,
   `Find contradictions`,
   `What are the key facts?`,
   `What issues should the defence raise?`

## Quality Rules For Friends

- Use 3 to 6 documents per case.
- Add at least one intentional contradiction if the goal is testing contradiction detection.
- Do not make every document contradict every other document; keep most facts consistent.
- Use realistic Indian legal categories: Criminal, Civil, Family, Property, Constitutional, Tax, Arbitration.
- Prefer clear dates like `2026-04-15`, not vague words like `yesterday`.
- Keep document names lowercase, numbered, and descriptive.
- Keep each document between 200 and 1,200 words for fast local-agent testing.
