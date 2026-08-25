from dotenv import load_dotenv
from google import genai
import os

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

response = client.models.generate_content(
    model="gemini-3.5-flash-lite",
    contents="สวัสดี พี่ดินแดงเอง แนะนำตัวในฐานะผู้ช่วยนักศึกษามหาวิทยาลัยขอนแก่นสั้น ๆ"
)

print(response.text)