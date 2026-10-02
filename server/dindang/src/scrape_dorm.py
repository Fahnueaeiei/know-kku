import requests
from bs4 import BeautifulSoup
from pathlib import Path

BASE_URL = "https://dorm.kku.ac.th"
OUTPUT_FILE = Path("data/documents/web/dormitories.txt")

PAGES = [
    ("หน้าหลักหอพัก", f"{BASE_URL}/"),
    ("หอพักในกำกับ", f"{BASE_URL}/sub-dorm-kku/"),
    ("หอพักคณะ", f"{BASE_URL}/dorm-group/"),
    ("หอพักเครือข่าย", f"{BASE_URL}/network-dorm/"),
]

# เพิ่มหอพัก 1-27
for dorm_number in range(1, 28):
    PAGES.append(
        (
            f"หอพัก {dorm_number}",
            f"{BASE_URL}/dorm-{dorm_number}/",
        )
    )


def fetch_page(url: str) -> str:
    response = requests.get(
        url,
        timeout=30,
        headers={
            "User-Agent": "Mozilla/5.0"
        },
    )
    response.raise_for_status()
    response.encoding = response.apparent_encoding

    soup = BeautifulSoup(response.text, "html.parser")

    # ลบส่วนที่ไม่ใช่เนื้อหาหลัก
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

    return text


def main():
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    all_documents = []

    for title, url in PAGES:
        print(f"กำลังดึงข้อมูล: {title}")
        print(f"URL: {url}")

        try:
            text = fetch_page(url)

            if not text.strip():
                print("  -> ไม่พบข้อความ")
                continue

            all_documents.append(
                f"""================================================================================
SOURCE
TITLE: {title}
URL: {url}
================================================================================

{text}
"""
            )

            print(f"  -> {len(text):,} characters")

        except Exception as error:
            print(f"  -> ERROR: {error}")

    OUTPUT_FILE.write_text(
        "\n\n".join(all_documents),
        encoding="utf-8",
    )

    print()
    print("==============================")
    print("ดึงข้อมูลหอพักเสร็จแล้ว!")
    print("==============================")
    print(f"บันทึกที่: {OUTPUT_FILE}")
    print(f"จำนวนหน้า: {len(all_documents)}")


if __name__ == "__main__":
    main()