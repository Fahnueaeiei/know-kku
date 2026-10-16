import { Router } from "express";
import multer from "multer";

/**
 * POST /checklists/extract   (multipart/form-data, field "file")
 * อ่าน PDF/รูป ด้วย Gemini API (free tier) แล้วคืน draft เช็คลิสต์ (ยังไม่บันทึกลง DB)
 * รูปแบบผลลัพธ์ตรงกับ NewChecklistTask ในแอป
 *
 * ต้องมีใน .env ของ server:
 *   GEMINI_API_KEY=...            (ขอฟรีที่ https://aistudio.google.com/apikey)
 *   GEMINI_MODEL=gemini-flash-latest   (ไม่ใส่ก็ได้ ใช้ค่านี้เป็นค่าเริ่มต้น)
 */

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB เท่ากับฝั่งแอป
});

const MAX_ITEMS = 15;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// บางทีมือถือส่ง application/octet-stream มา เลยเดาจากนามสกุลไฟล์ด้วย
function detectMime(file: Express.Multer.File): string {
  if (file.mimetype && file.mimetype !== "application/octet-stream") {
    return file.mimetype;
  }
  const ext = file.originalname.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return file.mimetype;
  }
}

/* =========================================================
   PROMPT  (แก้ตรงนี้ถ้าอยากปรับว่าให้ดึงอะไรบ้าง)
========================================================= */

const SYSTEM_PROMPT = `You turn an uploaded document (announcement, schedule, academic calendar, notice) into a to-do checklist for a university student.

Return ONLY one JSON object. No markdown fences, no commentary.

Schema:
{
  "title": string,                  // short checklist title
  "items": [
    {
      "title": string,              // short action, e.g. "ส่งเอกสารรายงานตัว"
      "dueDate": "YYYY-MM-DD" | null,
      "dueTime": "HH:mm" | null,    // only if a time is explicitly written
      "note": string | null,        // extra detail, e.g. the full date range
      "url": string | null,         // only if printed in the document
      "location": string | null     // only if a place is named
    }
  ]
}

Rules:
- Use ONLY information that appears in the document. Never invent dates, places or URLs. If unsure, use null.
- Write titles in the same language as the document (Thai stays Thai).
- Dates must be Gregorian "YYYY-MM-DD". Thai documents use the Buddhist Era (พ.ศ.): subtract 543 (e.g. 2569 -> 2026). Thai month abbreviations: ม.ค.=01, ก.พ.=02, มี.ค.=03, เม.ย.=04, พ.ค.=05, มิ.ย.=06, ก.ค.=07, ส.ค.=08, ก.ย.=09, ต.ค.=10, พ.ย.=11, ธ.ค.=12.
- For a date range, use the END date as dueDate and write the full range in note (e.g. "16-20 มี.ค. 2569").
- Read the dates carefully from the page itself. Do not guess or shift them.
- If the document is a calendar with several student groups or semesters, include only the rows for new first-year students (student ID starting with 69) in the first semester, in date order.
- At most ${MAX_ITEMS} items, most important first. Skip items with no action for the student.`;

/* =========================================================
   PARSE + CLEAN
========================================================= */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

function parseJson(text: string): any {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model output");
  return JSON.parse(text.slice(start, end + 1));
}

function toDraft(raw: any) {
  const title = str(raw?.title);
  const rawItems: any[] = Array.isArray(raw?.items) ? raw.items : [];

  const items = rawItems
    .map((i) => {
      const itemTitle = str(i?.title);
      if (!itemTitle) return null;

      const dueDate =
        typeof i?.dueDate === "string" && DATE_RE.test(i.dueDate)
          ? i.dueDate
          : null;
      const dueTime =
        dueDate && typeof i?.dueTime === "string" && TIME_RE.test(i.dueTime)
          ? i.dueTime
          : null;

      return {
        title: itemTitle,
        dueDate,
        dueTime,
        note: str(i?.note),
        url: str(i?.url),
        location: str(i?.location),
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null)
    .slice(0, MAX_ITEMS);

  if (!title || items.length === 0) {
    throw new Error("Model returned no usable checklist");
  }

  return { title, items };
}

/* =========================================================
   GEMINI CALL (REST ไม่ต้องลงแพ็กเกจเพิ่ม ต้องใช้ Node 18+)
========================================================= */

async function askGemini(mime: string, base64: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const model = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    signal: AbortSignal.timeout(55_000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [
            { inline_data: { mime_type: mime, data: base64 } },
            { text: "Create the checklist JSON from this document." },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini ${response.status}: ${body}`);
  }

  const json: any = await response.json();
  const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => (typeof p?.text === "string" ? p.text : "")).join("");

  if (!text) throw new Error("Gemini returned no text");
  return text;
}

/* =========================================================
   ROUTE
========================================================= */

router.post("/extract", upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "No file uploaded (field name must be 'file')" });
    return;
  }

  const mime = detectMime(file);

  if (!ALLOWED_TYPES.includes(mime)) {
    res.status(415).json({ error: `Unsupported file type: ${mime}` });
    return;
  }

  try {
    const text = await askGemini(mime, file.buffer.toString("base64"));
    res.json(toDraft(parseJson(text)));
  } catch (err) {
    console.error("extract failed:", err);
    res.status(502).json({ error: "Could not read the document" });
  }
});

export default router;