import pytesseract
from PIL import Image, ImageEnhance
from pathlib import Path

IMAGE_FILE = Path("data/documents/web/shuttle_bus/shuttle_bus.jpg")
OUTPUT_FILE = Path("data/documents/web/shuttle_bus/shuttle_bus_ocr.txt")

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def main():
    print("กำลังอ่านรูปเส้นทาง Shuttle Bus KKU...")

    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

    image = Image.open(IMAGE_FILE)

    print(f"ขนาดรูปเดิม: {image.size}")

    # ขยายภาพเพื่อช่วยให้ OCR อ่านข้อความได้ดีขึ้น
    image = image.resize(
        (image.width * 2, image.height * 2)
    )

    image = ImageEnhance.Contrast(image).enhance(1.4)
    image = ImageEnhance.Sharpness(image).enhance(2)

    print(f"ขนาดรูปหลังขยาย: {image.size}")
    print("กำลังทำ OCR ภาษาไทย + อังกฤษ...")

    text = pytesseract.image_to_string(
        image,
        lang="tha+eng",
        config="--psm 11",
    )

    if not text.strip():
        raise RuntimeError("OCR ไม่พบข้อความ")

    content = f"""================================================================================
SOURCE
TITLE: เส้นทางการเดินรถ Shuttle Bus มหาวิทยาลัยขอนแก่น
URL: https://sac.kku.ac.th/wp-content/uploads/2023/09/356219155_719100860225249_8921412635355181888_n.jpg
================================================================================

{text.strip()}
"""

    OUTPUT_FILE.write_text(content, encoding="utf-8")

    print("==============================")
    print("OCR เสร็จแล้ว!")
    print("==============================")
    print(f"บันทึกที่: {OUTPUT_FILE}")
    print(f"Characters: {len(text):,}")


if __name__ == "__main__":
    main()