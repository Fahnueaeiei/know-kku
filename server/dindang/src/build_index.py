"""
build_index.py
================
อ่านไฟล์ข้อมูล .txt ที่ scrape มา -> แบ่งเป็น chunk เล็ก ๆ
-> แปลงเป็น embedding ด้วย Gemini -> เก็บลง ChromaDB (เก็บถาวรในโฟลเดอร์ local)

รันไฟล์นี้ทุกครั้งที่มีข้อมูลใหม่ หรือข้อมูลเปลี่ยน
    python build_index.py
"""

from pathlib import Path
from dotenv import load_dotenv
from google import genai
import chromadb
import os
import re

load_dotenv()

# ==========================
# ตั้งค่า
# ==========================

# PROJECT_ROOT = โฟลเดอร์หลักของโปรเจกต์ (พาเรนต์ของ src/)
# ใช้ __file__ เพื่อให้ path ถูกต้องไม่ว่าจะรันคำสั่งจากที่ไหนก็ตาม
PROJECT_ROOT = Path(__file__).resolve().parent.parent

DOCS_DIR = PROJECT_ROOT / "data" / "documents" / "web"   # โฟลเดอร์ไฟล์ .txt ที่ scrape มา
CHROMA_DIR = str(PROJECT_ROOT / "chroma_db")               # โฟลเดอร์เก็บ vector database
COLLECTION_NAME = "kku_student_loan"

CHUNK_SIZE = 800        # จำนวนตัวอักษรต่อ chunk
CHUNK_OVERLAP = 150      # จำนวนตัวอักษรที่ทับซ้อนกันระหว่าง chunk (กันข้อมูลขาดตอน)

EMBEDDING_MODEL = "gemini-embedding-001"

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# ==========================
# ฟังก์ชันช่วย
# ==========================

def load_documents(docs_dir: Path):
    """อ่านไฟล์ .txt ทั้งหมด แล้วแยกเป็นแต่ละ SOURCE ตาม URL"""
    documents = []

    for txt_file in docs_dir.glob("*.txt"):
        content = txt_file.read_text(encoding="utf-8")

        # แยกแต่ละ SOURCE ตามรูปแบบที่ scraper.py เขียนไว้
        blocks = re.split(r"={80}\nSOURCE \d+\nURL: (.+?)\n={80}\n\n", content)

        # blocks[0] จะว่างเปล่า, ตามด้วยคู่ (url, text, url, text, ...)
        for i in range(1, len(blocks), 2):
            url = blocks[i].strip()
            text = blocks[i + 1].strip() if i + 1 < len(blocks) else ""
            if text:
                documents.append({"url": url, "text": text, "source_file": txt_file.name})

    return documents


def chunk_text(text: str, chunk_size: int, overlap: int):
    """แบ่งข้อความยาว ๆ เป็นชิ้นเล็ก แบบมีทับซ้อนกันเล็กน้อย"""
    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


def embed_text(text: str):
    """แปลงข้อความเป็น embedding vector ด้วย Gemini"""
    result = gemini_client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
    )
    return result.embeddings[0].values


# ==========================
# Main
# ==========================

def main():
    print("กำลังโหลดเอกสาร...")
    documents = load_documents(DOCS_DIR)
    print(f"พบเอกสารทั้งหมด {len(documents)} หน้า\n")

    if not documents:
        print("ไม่พบไฟล์ข้อมูล กรุณาตรวจสอบ path DOCS_DIR")
        return

    # เตรียม ChromaDB (persistent - เก็บไฟล์ไว้ใน CHROMA_DIR)
    chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)

    # ลบ collection เก่าถ้ามี เพื่อสร้างใหม่ทุกครั้งที่รัน (กันข้อมูลซ้ำ)
    try:
        chroma_client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass

    collection = chroma_client.create_collection(COLLECTION_NAME)

    chunk_id = 0
    total_chunks = 0

    for doc in documents:
        chunks = chunk_text(doc["text"], CHUNK_SIZE, CHUNK_OVERLAP)
        print(f"[{doc['url']}] -> แบ่งได้ {len(chunks)} chunks")

        for chunk in chunks:
            try:
                embedding = embed_text(chunk)

                collection.add(
                    ids=[f"chunk_{chunk_id}"],
                    embeddings=[embedding],
                    documents=[chunk],
                    metadatas=[{"url": doc["url"], "source_file": doc["source_file"]}],
                )

                chunk_id += 1
                total_chunks += 1

            except Exception as e:
                print(f"  -> ERROR สร้าง embedding: {e}")

    print("\n==============================")
    print("สร้าง index เสร็จแล้ว!")
    print("==============================")
    print(f"จำนวน chunk ทั้งหมด: {total_chunks}")
    print(f"เก็บไว้ที่: {CHROMA_DIR}/")


if __name__ == "__main__":
    main()