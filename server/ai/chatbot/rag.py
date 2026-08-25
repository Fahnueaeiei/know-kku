from pathlib import Path
import os

import chromadb
from dotenv import load_dotenv
from google import genai

load_dotenv()

# =========================================================
# Paths
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parent

CHROMA_DIR = str(PROJECT_ROOT / "chroma_db")

COLLECTION_NAME = "kku_student_loan"

# =========================================================
# Gemini
# =========================================================

EMBEDDING_MODEL = "gemini-embedding-001"
CHAT_MODEL = "gemini-3.5-flash-lite"

gemini_api_key = os.getenv("GEMINI_API_KEY")

if not gemini_api_key:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured."
    )

gemini_client = genai.Client(
    api_key=gemini_api_key
)

# =========================================================
# RAG configuration
# =========================================================

TOP_K = 5

SYSTEM_PROMPT = """
คุณคือผู้ช่วยตอบคำถามเกี่ยวกับกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)
สำหรับนักศึกษามหาวิทยาลัยขอนแก่น

กติกา:

1. ตอบจาก "ข้อมูลอ้างอิง" ที่ให้เท่านั้น ห้ามเดาหรือใช้ความรู้ภายนอก
2. ถ้าข้อมูลอ้างอิงไม่มีคำตอบ ให้บอกตรง ๆ ว่าไม่พบข้อมูลในระบบ
   และแนะนำให้ติดต่อกองพัฒนานักศึกษา มข. โดยตรง
3. ตอบเป็นภาษาไทย กระชับ เข้าใจง่าย
4. ถ้ามี URL ที่เกี่ยวข้อง ให้แนบท้ายคำตอบด้วย
"""

# =========================================================
# ChromaDB
# =========================================================

def get_collection():
    """
    เปิด ChromaDB collection ที่สร้างจาก build_index.py
    """

    chroma_client = chromadb.PersistentClient(
        path=CHROMA_DIR
    )

    try:
        return chroma_client.get_collection(
            COLLECTION_NAME
        )
    except Exception as exc:
        raise RuntimeError(
            f"ไม่พบ ChromaDB collection '{COLLECTION_NAME}'. "
            f"กรุณารัน build_index.py ก่อน"
        ) from exc


# =========================================================
# Embedding
# =========================================================

def embed_query(text: str):
    """
    แปลงคำถามเป็น embedding vector ด้วย Gemini
    """

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
    collection,
    top_k: int = TOP_K,
):
    """
    ค้นหา chunk ที่เกี่ยวข้องกับคำถามมากที่สุด
    """

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
    chunks: list,
    metadatas: list,
):
    """
    สร้างคำตอบจาก Gemini โดยอ้างอิงเฉพาะ context
    """

    context_text = "\n\n".join(
        f"[แหล่งที่มา: {meta['url']}]\n{chunk}"
        for chunk, meta in zip(chunks, metadatas)
    )

    prompt = f"""
{SYSTEM_PROMPT}

=== ข้อมูลอ้างอิง ===

{context_text}

=== คำถามจากผู้ใช้ ===

{question}
"""

    response = gemini_client.models.generate_content(
        model=CHAT_MODEL,
        contents=prompt,
    )

    return response.text


# =========================================================
# Main RAG function
# =========================================================

def ask_question(question: str):
    """
    ประมวลผลคำถามหนึ่งข้อ

    Question
        ↓
    Embedding
        ↓
    ChromaDB Retrieval
        ↓
    Gemini
        ↓
    Answer + Sources
    """

    question = question.strip()

    if not question:
        raise ValueError("คำถามต้องไม่เป็นค่าว่าง")

    collection = get_collection()

    chunks, metadatas = retrieve_context(
        question,
        collection,
    )

    answer = generate_answer(
        question,
        chunks,
        metadatas,
    )

    # ป้องกัน source URL ซ้ำ
    sources = []

    for meta in metadatas:
        url = meta.get("url")

        if url and url not in sources:
            sources.append(url)

    return {
        "answer": answer,
        "sources": sources,
    }