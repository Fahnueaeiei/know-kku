import requests
from bs4 import BeautifulSoup
from pathlib import Path

IMAGE_URL = (
    "https://dorm.kku.ac.th/wp-content/uploads/2023/07/"
    "%E0%B8%AD%E0%B8%B1%E0%B8%95%E0%B8%A3%E0%B8%B2%E0%B8%84%E0%B9%88%E0%B8%B2%E0%B8%98%E0%B8%A3%E0%B8%A3%E0%B8%A1%E0%B9%80%E0%B8%99%E0%B8%B5%E0%B8%A2%E0%B8%A1%E0%B8%AB%E0%B8%AD%E0%B8%9E%E0%B8%B1%E0%B8%81%E0%B8%99%E0%B8%B1%E0%B8%81%E0%B8%A8%E0%B8%B6%E0%B8%81%E0%B8%A9%E0%B8%B2-"
    "%E0%B8%9B%E0%B8%B5%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A8%E0%B8%B6%E0%B8%81%E0%B8%A9%E0%B8%B2-2566_page-0001-scaled-e1688445355473-2048x1346.jpg"
)

OUTPUT_FILE = Path("data/documents/web/dormitory_fee.jpg")


def main():
    print("กำลังดาวน์โหลดรูปอัตราค่าหอพัก...")

    response = requests.get(
        IMAGE_URL,
        timeout=30,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    response.raise_for_status()

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_bytes(response.content)

    print("ดาวน์โหลดสำเร็จ")
    print(f"บันทึกที่: {OUTPUT_FILE}")
    print(f"ขนาดไฟล์: {len(response.content):,} bytes")


if __name__ == "__main__":
    main()