import fitz
from pathlib import Path

PDF_FILE = Path("data/documents/web/scholarship_2569.pdf")
OUTPUT_FILE = Path("data/documents/web/scholarship_2569.txt")

SOURCE_URL = "https://sac.kku.ac.th/scholarships"


def extract_text() -> str:
    text_parts = []

    with fitz.open(PDF_FILE) as pdf:
        for page in pdf:
            text = page.get_text("text")

            if text.strip():
                text_parts.append(text.strip())

    return "\n\n".join(text_parts)


def save_document(text: str) -> None:
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    content = f"""================================================================================
SOURCE 1
URL: {SOURCE_URL}
================================================================================

{text}
"""

    OUTPUT_FILE.write_text(content, encoding="utf-8")


def main():
    print("Reading scholarship PDF...")
    text = extract_text()

    if not text.strip():
        raise RuntimeError("ไม่สามารถอ่านข้อความจาก PDF ได้")

    save_document(text)

    print(f"Saved to: {OUTPUT_FILE}")
    print(f"Characters: {len(text):,}")


if __name__ == "__main__":
    main()