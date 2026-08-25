from pathlib import Path
import os

import chromadb
from dotenv import load_dotenv
from google import genai


load_dotenv()


# =========================================================
# Paths
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

CHROMA_DIR = str(PROJECT_ROOT / "chroma_db")

COLLECTION_NAME = "kku_student_loan"

EMBEDDING_MODEL = "gemini-embedding-001"
CHAT_MODEL = "gemini-3.5-flash-lite"

TOP_K = 5


# =========================================================
# Gemini
# =========================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured")

gemini_client = genai.Client(
    api_key=GEMINI_API_KEY
)


# =========================================================
# System Prompt
# =========================================================

SYSTEM_PROMPT = """
คุณคือผู้ช่วยอัจฉริยะ "พี่ดินแดง" สำหรับนักศึกษามหาวิทยาลัยขอนแก่น

หน้าที่ของคุณคือช่วยตอบคำถามจากข้อมูลที่ระบบค้นพบจากเอกสารและเว็บไซต์ของมหาวิทยาลัยขอนแก่น

กติกาสำคัญ:

1. ให้ใช้ข้อมูลจาก "ข้อมูลอ้างอิง" เป็นหลัก
2. ห้ามสร้างข้อมูล ตัวเลข วันที่ หรือรายละเอียดที่ไม่มีอยู่ในข้อมูลอ้างอิง
3. หากข้อมูลอ้างอิงกล่าวถึงหัวข้อเดียวกับคำถาม แม้จะไม่ได้ใช้ประโยคเดียวกัน
   สามารถสรุปและเรียบเรียงคำตอบจากข้อมูลนั้นได้
4. หากข้อมูลอ้างอิงไม่เกี่ยวข้องกับคำถามจริง ๆ ให้ตอบว่า
   "ไม่พบข้อมูลในระบบ"
   และแนะนำให้ติดต่อกองพัฒนานักศึกษา มหาวิทยาลัยขอนแก่น
5. หากถามเกี่ยวกับ กยศ. ให้ตอบจากข้อมูล กยศ. ที่ค้นพบในระบบ
6. ตอบเป็นภาษาไทย
7. ตอบให้กระชับและเข้าใจง่าย
8. หากข้อมูลอ้างอิงมี URL ที่เกี่ยวข้อง ให้แสดง URL ท้ายคำตอบ
"""


# =========================================================
# ChromaDB
# =========================================================

_chroma_client = None
_collection = None


def get_collection():
    """
    เปิด ChromaDB แบบ Persistent
    และ reuse collection เดิม
    """

    global _chroma_client
    global _collection

    if _collection is not None:
        return _collection

    _chroma_client = chromadb.PersistentClient(
        path=CHROMA_DIR
    )

    _collection = _chroma_client.get_collection(
        COLLECTION_NAME
    )

    return _collection


# =========================================================
# Embedding
# =========================================================

def embed_query(text: str):
    result = gemini_client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
    )

    return result.embeddings[0].values


# =========================================================
# Retrieve
# =========================================================

def retrieve_context(
    question: str,
    top_k: int = TOP_K,
):
    """
    ค้นหา chunks ที่เกี่ยวข้องกับคำถาม
    จาก ChromaDB
    """

    collection = get_collection()

    query_embedding = embed_query(question)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
    )

    chunks = results["documents"][0]
    metadatas = results["metadatas"][0]

    return chunks, metadatas


# =========================================================
# Generate Answer
# =========================================================

def generate_answer(
    question: str,
    chunks: list[str],
    metadatas: list[dict],
):
    """
    ส่ง context ที่ค้นพบให้ Gemini
    และสร้างคำตอบโดยอ้างอิงเฉพาะข้อมูลนั้น
    """

    context_text = "\n\n".join(
        f"[แหล่งที่มา: {meta.get('url', '')}]\n{chunk}"
        for chunk, meta in zip(chunks, metadatas)
    )

    prompt = f"""
คุณคือ "พี่ดินแดง" ผู้ช่วยของแอป Know KKU
สำหรับนักศึกษามหาวิทยาลัยขอนแก่น

หน้าที่ของคุณคือช่วยตอบคำถามจากข้อมูลอ้างอิงที่ระบบค้นพบ

กฎสำคัญ:

1. ใช้ข้อมูลจาก "ข้อมูลอ้างอิง" ด้านล่างเท่านั้น
2. ห้ามใช้ความรู้ภายนอกข้อมูลอ้างอิง
3. สามารถสรุปและเรียบเรียงข้อมูลจากหลายส่วนเข้าด้วยกันได้
4. หากข้อมูลอ้างอิงมีข้อมูลที่เกี่ยวข้องกับคำถาม
   ให้ตอบคำถามจากข้อมูลนั้น
   แม้ข้อมูลจะไม่ได้เขียนเป็นคำตอบตรง ๆ
5. ห้ามแต่งข้อมูล ตัวเลข วันที่ หรือรายละเอียดที่ไม่มีอยู่ในข้อมูลอ้างอิง
6. หากไม่มีข้อมูลที่เกี่ยวข้องกับคำถามจริง ๆ
   ให้ตอบว่า:
   "ไม่พบข้อมูลในระบบ ขอแนะนำให้ติดต่อกองพัฒนานักศึกษา มหาวิทยาลัยขอนแก่นโดยตรง"
7. ตอบเป็นภาษาไทย
8. ตอบให้กระชับและเข้าใจง่าย
9. หากมี URL ที่เกี่ยวข้อง ให้แสดง URL ท้ายคำตอบ

==============================
ข้อมูลอ้างอิง
==============================

{context_text}

==============================
คำถาม
==============================

{question}

==============================
คำตอบ
==============================
"""

    response = gemini_client.models.generate_content(
        model=CHAT_MODEL,
        contents=prompt,
    )

    return response.text

# =========================================================
# Main RAG Function
# =========================================================

def ask_question(question: str):
    """
    RAG pipeline:

    Question
       ↓
    Embedding
       ↓
    ChromaDB
       ↓
    Retrieve Context
       ↓
    Gemini
       ↓
    Answer
    """

    question = question.strip()

    if not question:
        raise ValueError("Question is required")

    chunks, metadatas = retrieve_context(question)

    answer = generate_answer(
        question,
        chunks,
        metadatas,
    )

    # ส่งข้อมูลบางส่วนกลับไปด้วย
    # เพื่อให้ API สามารถใช้ทำ source/reference ได้ในอนาคต
    sources = []

    seen_urls = set()

    for meta in metadatas:
        url = meta.get("url")

        if url and url not in seen_urls:
            sources.append(url)
            seen_urls.add(url)

    return {
        "answer": answer,
        "sources": sources,
    }