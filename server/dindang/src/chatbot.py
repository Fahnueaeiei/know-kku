"""
chatbot.py
================
Chatbot UI ด้วย Streamlit — ค้นหาข้อมูลที่เกี่ยวข้องจาก ChromaDB (RAG)
แล้วส่งให้ Gemini ตอบคำถามโดยอ้างอิงจากข้อมูลที่ค้นเจอเท่านั้น

หน้าตาปรับให้เข้ากับธีมแอป Know KKU (สีส้ม/ม่วง/เขียว, ฟอนต์ Kanit+Sarabun)
และใช้ "พี่ดินแดง" เป็นมาสคอทประจำบอท

รัน:
    streamlit run chatbot.py

โครงสร้างไฟล์ที่ต้องมี:
    <project_root>/assets/dindang.png   <- รูปมาสคอทพี่ดินแดง
"""

import streamlit as st
from dotenv import load_dotenv
from google import genai
from pathlib import Path
import chromadb
import base64
import os

load_dotenv()

# ==========================
# ตั้งค่า
# ==========================

# PROJECT_ROOT = โฟลเดอร์หลักของโปรเจกต์ (พาเรนต์ของ src/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CHROMA_DIR = str(PROJECT_ROOT / "chroma_db")
ASSETS_DIR = PROJECT_ROOT / "assets"
MASCOT_PATH = ASSETS_DIR / "dindang.png"
MASCOT_ICON = str(MASCOT_PATH) if MASCOT_PATH.exists() else "🎓"

COLLECTION_NAME = "kku_student_loan"
EMBEDDING_MODEL = "gemini-embedding-001"
CHAT_MODEL = "gemini-3.5-flash-lite"
TOP_K = 5  # จำนวน chunk ที่จะดึงมาใช้ตอบ

# ธีมสีของแอป Know KKU
PRIMARY = "#f76f54"      # ส้มคอรัล
SECONDARY = "#6b515e"    # ม่วงเข้ม
TERTIARY = "#1f7a70"     # เขียวทีล
SURFACE = "#fff8f0"      # ครีมอุ่น
SURFACE_CONTAINER = "#fce8dd"
INK = "#251e1a"

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """คุณคือผู้ช่วยตอบคำถามเกี่ยวกับกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)
สำหรับนักศึกษามหาวิทยาลัยขอนแก่น

กติกา:
1. ตอบจาก "ข้อมูลอ้างอิง" ที่ให้เท่านั้น ห้ามเดาหรือใช้ความรู้ภายนอก
2. ถ้าข้อมูลอ้างอิงไม่มีคำตอบ ให้บอกตรง ๆ ว่าไม่พบข้อมูลในระบบ และแนะนำให้ติดต่อกองพัฒนานักศึกษา มข. โดยตรง
3. ตอบเป็นภาษาไทย กระชับ เข้าใจง่าย
4. ถ้ามี URL ที่เกี่ยวข้อง ให้แนบท้ายคำตอบด้วย
"""

QUICK_REPLIES = ["กยศ.", "ทุน", "อื่นๆ"]


@st.cache_data
def get_mascot_base64():
    """เข้ารหัสรูปมาสคอทเป็น base64 เพื่อฝังใน HTML ของ header โดยตรง
    (คุมขนาด/ตำแหน่งได้แม่นกว่าการใช้ st.image แยกคอลัมน์)"""
    if MASCOT_PATH.exists():
        return base64.b64encode(MASCOT_PATH.read_bytes()).decode()
    return None


# ==========================
# ฟังก์ชันช่วย (RAG logic — ไม่แก้ไข)
# ==========================

@st.cache_resource
def get_collection():
    chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
    return chroma_client.get_collection(COLLECTION_NAME)


def embed_query(text: str):
    result = gemini_client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
    )
    return result.embeddings[0].values


def retrieve_context(question: str, collection, top_k: int = TOP_K):
    """ค้นหา chunk ที่เกี่ยวข้องกับคำถามมากที่สุด"""
    query_embedding = embed_query(question)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
    )

    chunks = results["documents"][0]
    metadatas = results["metadatas"][0]

    return chunks, metadatas


def generate_answer(question: str, chunks: list, metadatas: list):
    """สร้างคำตอบจาก Gemini โดยอ้างอิงเฉพาะ context ที่ค้นเจอ"""
    context_text = "\n\n".join(
        f"[แหล่งที่มา: {meta['url']}]\n{chunk}"
        for chunk, meta in zip(chunks, metadatas)
    )

    prompt = f"""{SYSTEM_PROMPT}

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


def ask(question: str, collection):
    """ประมวลผลคำถามหนึ่งข้อ: retrieve + generate + บันทึกลง session_state"""
    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user"):
        st.markdown(question)

    with st.chat_message("assistant", avatar=MASCOT_ICON):
        with st.spinner("พี่ดินแดงกำลังค้นข้อมูลให้อยู่นะ รอสักครู่..."):
            chunks, metadatas = retrieve_context(question, collection)
            answer = generate_answer(question, chunks, metadatas)

        st.markdown(answer)

        # with st.expander("📄 แหล่งข้อมูลที่ใช้อ้างอิง"):
        #     seen_urls = set()
        #     for meta in metadatas:
        #         if meta["url"] not in seen_urls:
        #             st.write(f"- {meta['url']}")
        #             seen_urls.add(meta["url"])

    st.session_state.messages.append({"role": "assistant", "content": answer})


# ==========================
# Streamlit UI
# ==========================

st.set_page_config(
    page_title="พี่ดินแดง | ผู้ช่วย กยศ. มข.",
    page_icon=MASCOT_ICON,
    layout="centered",
)

# ---- Custom theme: ฟอนต์ + สี Know KKU ----
st.markdown(
    f"""
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@500;600;700&family=Sarabun:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        html, body, [class*="css"] {{
            font-family: 'Sarabun', sans-serif;
            color: {INK};
        }}
        .stApp {{
            background-color: {SURFACE};
            background-image: radial-gradient(circle, rgba(37,30,26,0.05) 1px, transparent 1.4px);
            background-size: 22px 22px;
        }}
        h1, h2, h3, .kku-title {{
            font-family: 'Kanit', sans-serif !important;
        }}
        /* หัวข้อหลัก */
        .kku-header {{
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 2px 2px 14px;
            margin-bottom: 10px;
            border-bottom: 1px solid rgba(37,30,26,0.08);
        }}
        .kku-header img {{
            width: 44px;
            height: 44px;
            border-radius: 50%;
            object-fit: cover;
            background: {SURFACE_CONTAINER};
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(37,30,26,0.12);
            flex-shrink: 0;
        }}
        .kku-header .kku-text {{
            display: flex;
            flex-direction: column;
            justify-content: center;
            line-height: 1.25;
        }}
        .kku-header h1 {{
            font-size: 19px;
            font-weight: 700;
            color: {PRIMARY};
            margin: 0;
        }}
        .kku-header p {{
            margin: 1px 0 0;
            font-size: 12.5px;
            color: #5b4a45;
        }}
        /* ช่องแชท */
        [data-testid="stChatMessage"] {{
            border-radius: 16px;
            padding: 4px 6px;
        }}
        /* ปุ่ม quick reply / ปุ่มทั่วไป */
        .stButton > button {{
            font-family: 'Sarabun', sans-serif;
            border-radius: 20px;
            border: 1.5px solid {PRIMARY};
            color: {PRIMARY};
            background-color: {SURFACE};
            font-weight: 600;
            padding: 6px 18px;
            transition: all 0.15s ease;
        }}
        .stButton > button:hover {{
            background-color: {PRIMARY};
            color: white;
            border-color: {PRIMARY};
        }}
        /* กล่องแหล่งอ้างอิง */
        [data-testid="stExpander"] {{
            background-color: {SURFACE_CONTAINER};
            border-radius: 12px;
            border: none;
        }}
        [data-testid="stExpander"] summary {{
            color: {TERTIARY};
            font-weight: 600;
        }}
        /* ช่องพิมพ์คำถามด้านล่าง */
        [data-testid="stChatInput"] textarea {{
            font-family: 'Sarabun', sans-serif;
            border-radius: 20px !important;
        }}
    </style>
    """,
    unsafe_allow_html=True,
)

# ---- Header: มาสคอทพี่ดินแดง + ชื่อบอท (แถวเดียว จัดกึ่งกลางแนวตั้ง) ----
mascot_b64 = get_mascot_base64()
mascot_img_tag = (
    f'<img src="data:image/png;base64,{mascot_b64}" alt="พี่ดินแดง">'
    if mascot_b64
    else '<div style="width:44px;height:44px;border-radius:50%;background:#fce8dd;'
         'display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🎓</div>'
)

st.markdown(
    f"""
    <div class="kku-header">
        {mascot_img_tag}
        <div class="kku-text">
            <h1>พี่ดินแดง</h1>
            <p>ผู้ช่วยตอบคำถาม กยศ. มหาวิทยาลัยขอนแก่น — ถามอะไรก็ได้ พี่หาให้จากแหล่งข้อมูลจริง</p>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

collection = get_collection()

if "messages" not in st.session_state:
    st.session_state.messages = []

# ---- Quick reply ปุ่มลัด (แสดงเฉพาะตอนยังไม่มีบทสนทนา) ----
if len(st.session_state.messages) == 0:
    st.markdown("<p style='color:#5b4a45; font-size:13px; margin-bottom:6px;'>เริ่มจากหัวข้อยอดฮิต 👇</p>", unsafe_allow_html=True)
    qr_cols = st.columns(len(QUICK_REPLIES))
    for col, label in zip(qr_cols, QUICK_REPLIES):
        with col:
            if st.button(label, use_container_width=True, key=f"qr_{label}"):
                ask(f"อยากทราบข้อมูลเกี่ยวกับ {label}", collection)
                st.rerun()

# ---- แสดงประวัติแชท ----
for msg in st.session_state.messages:
    avatar = MASCOT_ICON if msg["role"] == "assistant" else None
    with st.chat_message(msg["role"], avatar=avatar):
        st.markdown(msg["content"])

# ---- รับคำถามใหม่ ----
question = st.chat_input("พิมพ์คำถามเกี่ยวกับ กยศ. ที่นี่...")

if question:
    ask(question, collection)