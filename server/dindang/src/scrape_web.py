from playwright.sync_api import sync_playwright
from pathlib import Path
from urllib.parse import urljoin, urlparse
from google import genai
from dotenv import load_dotenv
import os
import re
import requests

load_dotenv()

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

START_URLS = [
    "https://sac.kku.ac.th/stdlone-01"
]

OUTPUT_DIR = Path("data/documents/web")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

visited = set()
documents = []

KEYWORDS = [
    "กยศ",
    "กองทุน",
    "กู้ยืม",
    "studentloan",
    "loan",
    "ทุน",
    "การศึกษา",
    "เอกสาร",
]


def is_relevant(url, text=""):
    content = (url + " " + text).lower()
    return any(keyword.lower() in content for keyword in KEYWORDS)


def clean_text(text):
    text = re.sub(r"\n+", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def ocr_image(image_url):
    """ดาวน์โหลดรูปแล้วส่งให้ Gemini อ่านข้อความในรูป"""
    try:
        resp = requests.get(image_url, timeout=15)
        resp.raise_for_status()

        # ข้ามไฟล์ที่ไม่ใช่รูปภาพจริง หรือไฟล์เล็กเกินไป (ไอคอน/โลโก้)
        content_type = resp.headers.get("content-type", "")
        if "image" not in content_type:
            return ""
        if len(resp.content) < 5000:  # กันไอคอนเล็ก ๆ ที่ไม่มีข้อความ
            return ""

        result = gemini_client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=[
                {
                    "inline_data": {
                        "mime_type": content_type,
                        "data": resp.content,
                    }
                },
                "อ่านและถอดข้อความทั้งหมดที่ปรากฏในภาพนี้แบบคำต่อคำ "
                "ถ้าไม่มีข้อความในภาพให้ตอบว่า 'ไม่มีข้อความ' เท่านั้น",
            ],
        )

        text = result.text.strip()
        if "ไม่มีข้อความ" in text or len(text) < 5:
            return ""

        return text

    except Exception as e:
        print(f"    -> OCR ERROR ({image_url}): {e}")
        return ""


def scrape_page(page, url):
    if url in visited:
        return

    visited.add(url)

    try:
        print(f"กำลังอ่าน: {url}")

        page.goto(url, wait_until="networkidle", timeout=60000)

        text = clean_text(page.locator("body").inner_text())

        # ดึง URL รูปภาพทั้งหมดในหน้านี้
        image_urls = page.locator("img").evaluate_all(
            "elements => elements.map(img => img.src)"
        )
        image_urls = [u for u in image_urls if u and u.startswith("http")]

        ocr_texts = []
        if image_urls:
            print(f"  -> พบรูปภาพ {len(image_urls)} รูป กำลังอ่านข้อความในรูป...")
            for img_url in image_urls:
                ocr_result = ocr_image(img_url)
                if ocr_result:
                    ocr_texts.append(f"[ข้อความจากรูปภาพ: {img_url}]\n{ocr_result}")
                    print(f"    -> อ่านได้ {len(ocr_result)} ตัวอักษร")

        # รวมข้อความปกติ + ข้อความจากรูปภาพ
        combined_text = text
        if ocr_texts:
            combined_text += "\n\n" + "\n\n".join(ocr_texts)

        if len(combined_text) < 100:
            print("  -> ข้อมูลน้อย ข้าม")
            return

        if is_relevant(url, combined_text):
            documents.append({
                "url": url,
                "text": combined_text
            })
            print(f"  -> เก็บข้อมูล {len(combined_text):,} ตัวอักษร")

    except Exception as e:
        print(f"  -> ERROR: {e}")


def get_relevant_links(page):
    links = page.locator("a").evaluate_all(
        """elements => elements.map(a => ({
            text: a.innerText.trim(),
            href: a.href
        }))"""
    )

    relevant = []
    for link in links:
        href = link["href"]
        text = link["text"]

        if not href:
            continue
        if "sac.kku.ac.th" not in href:
            continue
        if is_relevant(href, text):
            relevant.append(href)

    return relevant


with sync_playwright() as p:

    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    all_relevant_links = []

    for start_url in START_URLS:
        scrape_page(page, start_url)
        links = get_relevant_links(page)
        all_relevant_links.extend(links)

    all_relevant_links = list(dict.fromkeys(all_relevant_links))

    print(f"\nพบลิงก์ที่เกี่ยวข้อง {len(all_relevant_links)} หน้า\n")

    for url in all_relevant_links:
        scrape_page(page, url)

    browser.close()


output_file = OUTPUT_DIR / "kku_student_loan_2569.txt"

with open(output_file, "w", encoding="utf-8") as f:
    for i, doc in enumerate(documents, start=1):
        f.write("=" * 80)
        f.write(f"\nSOURCE {i}\n")
        f.write(f"URL: {doc['url']}\n")
        f.write("=" * 80)
        f.write("\n\n")
        f.write(doc["text"])
        f.write("\n\n")


print("\n==============================")
print("ดึงข้อมูลเสร็จแล้ว!")
print("==============================")
print(f"จำนวนหน้า: {len(documents)}")
print(f"บันทึกที่: {output_file}")
print(f"จำนวนตัวอักษรรวม: {sum(len(d['text']) for d in documents):,}")