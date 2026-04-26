import os
import re
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
from html.parser import HTMLParser
from PyPDF2 import PdfReader
from config import CHUNK_SIZE, CHUNK_OVERLAP, CASES_DIR, ENABLE_OCR_FALLBACK, TESSERACT_CMD

# Configure tesseract path
if os.path.exists(TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

class _HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts = []
        self._skip = False
    def handle_starttag(self, tag, attrs):
        if tag.lower() in {"script", "style"}: self._skip = True
        if tag.lower() in ("br", "p", "div", "h1", "h2", "tr"): self._parts.append("\n")
    def handle_endtag(self, tag):
        if tag.lower() in {"script", "style"}: self._skip = False
    def handle_data(self, data):
        if not self._skip: self._parts.append(data)
    def get_text(self): return "".join(self._parts)

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF with automatic OCR fallback for scans."""
    text = ""
    try:
        reader = PdfReader(pdf_path)
        parts = [p.extract_text() for p in reader.pages if p.extract_text()]
        text = "\n\n".join(parts)
    except Exception as e:
        print(f"  [PDF] Primary extraction failed: {e}")

    # OCR Fallback: If no text was found (likely a scan)
    if not text.strip() and ENABLE_OCR_FALLBACK:
        print(f"  [OCR] No text found in {os.path.basename(pdf_path)}. Starting OCR fallback...")
        try:
            images = convert_from_path(pdf_path)
            ocr_parts = [pytesseract.image_to_string(img) for img in images]
            text = "\n\n".join(ocr_parts)
            print(f"  [OCR] Successfully extracted {len(text)} chars from scan.")
        except Exception as e:
            print(f"  [OCR] Critical Failure: {e}. (Is Tesseract-OCR installed on the system?)")
    
    return text

def extract_text_from_file(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf": return extract_text_from_pdf(file_path)
    if ext in (".html", ".htm"):
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            ex = _HTMLTextExtractor()
            ex.feed(f.read())
            return ex.get_text()
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def clean_text(text: str) -> str:
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{3,}", "  ", text)
    return text.strip()

def chunk_text(text: str, size=CHUNK_SIZE, overlap=CHUNK_OVERLAP) -> list[str]:
    if not text: return []
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, curr, curr_len = [], [], 0
    for s in sentences:
        s_len = len(s.split())
        if curr_len + s_len > size and curr:
            chunks.append(" ".join(curr))
            curr = curr[-(overlap//20):] # Rough overlap
            curr_len = sum(len(x.split()) for x in curr)
        curr.append(s)
        curr_len += s_len
    if curr: chunks.append(" ".join(curr))
    return chunks

def process_document(file_path: str, case_id: str, doc_name: str) -> dict:
    text = extract_text_from_file(file_path)
    cleaned = clean_text(text)
    if not cleaned: raise ValueError("Document is empty or unreadable.")
    
    docs_dir = os.path.join(CASES_DIR, case_id, "documents")
    os.makedirs(docs_dir, exist_ok=True)
    with open(os.path.join(docs_dir, os.path.splitext(doc_name)[0] + ".txt"), "w", encoding="utf-8") as f:
        f.write(cleaned)

    chunks = chunk_text(cleaned)
    return {"case_id": case_id, "doc_name": doc_name, "text": cleaned, "chunks": chunks, "num_chunks": len(chunks), "text_length": len(cleaned)}
