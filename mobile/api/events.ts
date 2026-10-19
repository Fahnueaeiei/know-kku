// api/events.ts
// ดึงกิจกรรมจาก kku.ac.th ผ่าน REST API ของปลั๊กอิน The Events Calendar
// (หน้า /th/events/ แสดงแค่ชื่อ/วันที่/สถานที่/เนื้อหาย่อ แต่ API ให้ข้อมูลเต็มของแต่ละกิจกรรม)

import { useNavigationBuilder } from "expo-router/build/react-navigation";

export const KKU_EVENTS_PAGE_URL = 'https://www.kku.ac.th/th/events/';

const API_BASE = 'https://www.kku.ac.th/wp-json/tribe/events/v1/events';

/* =========================================================
   TYPES
========================================================= */

export type KkuEvent = {
  id: string;
  title: string;
  url: string; // หน้ากิจกรรมบน kku.ac.th

  dateLabel: string; // เช่น "21–22 Nov 2026"
  startDate?: string;
  timeLabel?: string; // เช่น "10:00 – 19:00" (ไม่มีถ้าเป็นกิจกรรมทั้งวัน)

  venue?: string;
  venueAddress?: string;
  phone?: string;
  mapUrl?: string;

  organizer?: string;
  description?: string; // ข้อความล้วน (แปลงจาก HTML แล้ว)
  categories: string[];
  registerUrl?: string; // ลิงก์สมัคร ถ้าในเนื้อหามี
  cost?: string;
  imageUrl?: string;
};

/* =========================================================
   TEXT HELPERS
========================================================= */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

// อีโมจิจาก Facebook ในเนื้อหามาเป็นแท็ก <img alt="👕"> จึงดึง alt กลับมาเป็นตัวอักษร
function emojiFromImg(_match: string, alt: string): string {
  return alt.length > 0 && alt.length <= 4 && /[^\u0000-\u007f]/.test(alt) ? alt : '';
}

function htmlToText(html?: string | null): string {
  if (!html) return '';

  const text = html
    .replace(/<img[^>]*\balt="([^"]*)"[^>]*>/gi, emojiFromImg)
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  return decodeEntities(text)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ลิงก์ที่คัดลอกมาจาก Facebook จะถูกห่อด้วย l.facebook.com/l.php?u=... แกะออกให้เป็นลิงก์จริง
function unwrapFacebookLink(url: string): string {
  if (!/^https?:\/\/l\.facebook\.com\//i.test(url)) return url;

  const m = /[?&]u=([^&]+)/.exec(url);
  if (!m) return url;

  try {
    return decodeURIComponent(m[1]);
  } catch {
    return url;
  }
}

function findRegisterUrl(html?: string | null): string | undefined {
  if (!html) return undefined;

  const links = Array.from(html.matchAll(/href="([^"]+)"/gi)).map((m) =>
    unwrapFacebookLink(decodeEntities(m[1]))
  );

  return links.find((l) =>
    /regist|forms\.gle|docs\.google\.com\/forms|สมัคร/i.test(l)
  );
}

/* =========================================================
   DATE HELPERS
   API ส่งวันที่เป็นข้อความ "YYYY-MM-DD HH:mm:ss" ตามเวลาท้องถิ่นของเว็บ
   จึงแยกค่าเอง ไม่ผ่าน new Date() กันเขตเวลาเลื่อน
========================================================= */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type Parts = { y: number; mo: number; d: number; hh?: string; mm?: string };

function parseParts(s?: string): Parts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(s ?? '');
  if (!m) return null;

  return { y: +m[1], mo: +m[2] - 1, d: +m[3], hh: m[4], mm: m[5] };
}

function formatDateRange(startRaw?: string, endRaw?: string): string {
  const s = parseParts(startRaw);
  const e = parseParts(endRaw);

  if (!s) return '';

  const one = (p: Parts) => `${p.d} ${MONTHS[p.mo]} ${p.y}`;

  if (!e || (s.y === e.y && s.mo === e.mo && s.d === e.d)) return one(s);
  if (s.y === e.y && s.mo === e.mo) return `${s.d}–${e.d} ${MONTHS[s.mo]} ${s.y}`;
  if (s.y === e.y) return `${s.d} ${MONTHS[s.mo]} – ${e.d} ${MONTHS[e.mo]} ${s.y}`;

  return `${one(s)} – ${one(e)}`;
}

function formatTimeRange(startRaw?: string, endRaw?: string): string | undefined {
  const s = parseParts(startRaw);
  const e = parseParts(endRaw);

  if (!s?.hh || !s.mm) return undefined;

  const start = `${s.hh}:${s.mm}`;
  return e?.hh && e.mm ? `${start} – ${e.hh}:${e.mm}` : start;
}

/* =========================================================
   MAPPER
========================================================= */

function mapEvent(raw: any): KkuEvent {
  // ถ้าไม่มีสถานที่ ปลั๊กอินจะส่ง [] มาแทน object
  const venueObj = raw.venue && !Array.isArray(raw.venue) ? raw.venue : undefined;
  const organizerObj = Array.isArray(raw.organizer) ? raw.organizer[0] : raw.organizer;

  const venue = htmlToText(venueObj?.venue) || undefined;

  const venueAddress =
    [venueObj?.address, venueObj?.city, venueObj?.province ?? venueObj?.stateprovince, venueObj?.zip]
      .map((part: any) => htmlToText(part))
      .filter(Boolean)
      .join(' ') || undefined;

  const lat = venueObj?.geo_lat;
  const lng = venueObj?.geo_lng;

  const mapQuery = lat && lng ? `${lat},${lng}` : [venue, venueAddress].filter(Boolean).join(' ');

  const mapUrl = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : undefined;

  return {
    id: String(raw.id),
    title: htmlToText(raw.title),
    url: raw.url,

    dateLabel: formatDateRange(raw.start_date, raw.end_date),
    startDate: raw.start_date ? String(raw.start_date).slice(0, 10) : undefined,
    timeLabel: raw.all_day ? undefined : formatTimeRange(raw.start_date, raw.end_date),

    venue,
    venueAddress,
    phone: venueObj?.phone || organizerObj?.phone || undefined,
    mapUrl,

    organizer: htmlToText(organizerObj?.organizer) || undefined,
    description: htmlToText(raw.description) || undefined,
    categories: (raw.categories ?? []).map((c: any) => htmlToText(c.name)).filter(Boolean),
    registerUrl: findRegisterUrl(raw.description),
    cost: raw.cost || undefined,
    imageUrl: raw.image?.url || undefined,
  };
}

/* =========================================================
   API
========================================================= */

const todayISO = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** กิจกรรมที่กำลังจะมาถึง (เรียงตามวันเริ่มต้น) */
export async function fetchKkuEvents(limit = 20): Promise<KkuEvent[]> {
  // ขอเกินไว้ เผื่อมีหน้าภาษาอังกฤษปนมาแล้วต้องกรองทิ้ง
  const url = `${API_BASE}?per_page=${limit * 2}&start_date=${todayISO()}&lang=th`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`KKU events request failed: ${res.status}`);

  const json = await res.json();

  return (json.events ?? [])
    .filter((e: any) => !/\/en\/event\//.test(e.url))
    .slice(0, limit)
    .map(mapEvent);
}

/** รายละเอียดเต็มของกิจกรรมเดียว (ใช้ id ที่ไม่มีคำนำหน้า "kku-") */
export async function fetchKkuEventById(id: string): Promise<KkuEvent> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error(`KKU event request failed: ${res.status}`);

  return mapEvent(await res.json());
}