import requests
import fitz  # PyMuPDF
from pathlib import Path


PDF_URL = (
    "https://registrar.kku.ac.th/wp-content/uploads/2026/07/"
    "calendar_th_undergraduate2569_updated-2.pdf"
)

OUTPUT_FILE = Path("data/documents/web/academic_calendar_2569.txt")


def download_pdf(url: str) -> bytes:
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.content


def extract_text(pdf_bytes: bytes) -> str:
    text_parts = []

    with fitz.open(stream=pdf_bytes, filetype="pdf") as pdf:
        for page in pdf:
            text = page.get_text("text")
            if text.strip():
                text_parts.append(text.strip())

    return "\n\n".join(text_parts)


def save_document(text: str, url: str) -> None:
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    content = f"""=================================================================================
SOURCE 1
URL: {url}
=================================================================================

{text}
"""

    OUTPUT_FILE.write_text(content, encoding="utf-8")


def main():
    print("Downloading KKU academic calendar...")

    pdf_bytes = download_pdf(PDF_URL)

    print("Extracting PDF text...")

    text = extract_text(pdf_bytes)

    if not text.strip():
        raise RuntimeError("ไม่สามารถอ่านข้อความจาก PDF ได้")

    save_document(text, PDF_URL)

    print(f"Saved to: {OUTPUT_FILE}")
    print(f"Characters: {len(text):,}")


if __name__ == "__main__":
    main()