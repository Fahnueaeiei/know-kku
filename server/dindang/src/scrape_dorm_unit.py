import requests
from bs4 import BeautifulSoup
from pathlib import Path

URL = "https://dorm.kku.ac.th/unit-dorm/"
OUTPUT_FILE = Path("data/documents/web/dorm_unit.txt")


def main():
    response = requests.get(
        URL,
        timeout=30,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    response.raise_for_status()
    response.encoding = response.apparent_encoding

    soup = BeautifulSoup(response.text, "html.parser")

    for tag in soup([
        "script",
        "style",
        "nav",
        "footer",
        "header",
        "noscript",
    ]):
        tag.decompose()

    text = soup.get_text("\n", strip=True)

    if not text.strip():
        raise RuntimeError("ไม่พบข้อมูลหน่วยบริการหอพัก")

    content = f"""================================================================================
SOURCE
TITLE: หน่วยบริการหอพักนักศึกษา
URL: {URL}
================================================================================

{text}
"""

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(content, encoding="utf-8")

    print()
    print("==============================")
    print("ดึงข้อมูลหน่วยบริการหอพักเสร็จแล้ว!")
    print("==============================")
    print(f"บันทึกที่: {OUTPUT_FILE}")
    print(f"Characters: {len(text):,}")


if __name__ == "__main__":
    main()