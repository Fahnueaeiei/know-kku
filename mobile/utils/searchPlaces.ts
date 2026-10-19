/**
 * searchPlaces — ค้นหาสถานที่แบบยืดหยุ่น
 *
 * ตัวอย่างที่หาเจอ "SC.09":  sc09, Sc09, sC09, sc9, SC 09, sc.9
 *                          ตึกวิทยวิภาส, ตึกวิทยาวิภาส, วิทยวิภาส
 *
 * วิธีทำงาน
 *  1) normalize ทั้งคำค้นและข้อมูล: ตัวพิมพ์เล็ก, ตัดช่องว่าง/จุด/ขีด,
 *     ตัดเลข 0 นำหน้าหลังตัวอักษร (sc09 → sc9), ตัดวรรณยุกต์/ทัณฑฆาต,
 *     ตัดคำนำหน้า "ตึก"/"อาคาร"
 *  2) เทียบกับ ชื่อ → ชื่อเล่น (aliases) → หมวด/คำอธิบาย/ที่อยู่
 *  3) ถ้าไม่ตรงเป๊ะ จะยอมให้พิมพ์ผิด 1-2 ตัวอักษร (เฉพาะชื่อ/ชื่อเล่น
 *     และเฉพาะคำค้นที่ไม่มีตัวเลข เพื่อกัน sc9 ไปโผล่เป็น sc8)
 */

export type SearchablePlace = {
  name: string;
  category?: string | null;
  description?: string | null;
  address?: string | null;
  aliases?: string[] | null;
};

/**
 * ชื่อเล่น/คำเรียกอื่นของสถานที่ (key = ชื่อใน DB ตรงตัว)
 * เพิ่มได้เรื่อย ๆ — ถ้าภายหลังมีคอลัมน์ aliases ใน DB ก็ใช้ร่วมกันได้
 */
export const PLACE_ALIASES: Record<string, string[]> = {
  /* ---------- คณะวิทยาศาสตร์ ---------- */
  'SC.01': ['ตึกนิติวิทย์', 'นิติวิทยาศาสตร์'],
  'SC.02': ['ตึกกลม'],
  'SC.03': ['ตึกชีววิทยา', 'พิพิธภัณฑ์พืช'],
  'SC.04': ['ตึกเคมี'],
  'SC.05': ['สโมสรนักศึกษาวิทยาศาสตร์'],
  'SC.06': ['ตึกหลอด', 'ตึกสถิติ', 'ตึกคณบดี'],
  'SC.07': ['ตึกจุลชีว', 'ตึกคณิต'],
  'SC.08': ['ตึกสิ่งแวดล้อม'],
  'SC.09': ['วิทยวิภาส', 'วิทยาวิภาส', 'ตึกวิทยวิภาส', 'ตึกวิทยาวิภาส'],

  /* ---------- อาคาร / หน่วยงาน ---------- */
  'หอสมุดกลาง': ['library', 'ห้องสมุด', 'หอกลาง'],
  'อาคารพิมลกลกิจ': ['พิมล', 'ทะเบียน', 'สำนักทะเบียน'],
  'คณะบริหารธุรกิจและการบัญชี (KKBS)': ['kkbs', 'บริหาร', 'บัญชี'],
  'โรงพยาบาลศรีนครินทร์': ['ศรีนครินทร์', 'รพ', 'โรงพยาบาล', 'hospital', 'หมอ'],
  'กองป้องกันและรักษาความปลอดภัย มหาวิทยาลัยขอนแก่น': ['รปภ', 'ยาม', 'security', 'กองรักษาความปลอดภัย'],
  'ศาลเจ้าพ่อมอดินแดง': ['ศาลเจ้า', 'ศาลเจ้าพ่อ', 'เจ้าพ่อมอ'],
  'ศูนย์ประชุมอเนกประสงค์กาญจนาภิเษก': ['ศูนย์ประชุม', 'กาญจนา', 'ประชุมกาญจนา'],
  'สถาบันขงจื่อ มหาวิทยาลัยขอนแก่น': ['ขงจื่อ', 'confucius'],
  'อาคาร 50 ปี วิศวะรวมใจ': ['50ปี', 'วิศวะ', 'วิศวกรรม'],
  'อาคารพจน์ สารสิน': ['พจน์', 'พจน์สารสิน'],
  'อาคารพลศึกษาเอนกประสงค์': ['พลศึกษา', 'พละ', 'ยิม', 'โรงยิม', 'gym'],
  'สำนักเทคโนโลยีดิจิทัล มข.': ['dtc', 'ไอที', 'ศูนย์คอม', 'ศูนย์คอมพิวเตอร์', 'เทคโนโลยีดิจิทัล'],
  'PCU นักศึกษา มหาวิทยาลัยขอนแก่น': ['pcu', 'ศูนย์สุขภาพนักศึกษา', 'ศูนย์สุขภาพ', 'คลินิก', 'หน่วยบริการปฐมภูมิ', 'หมอ'],
  'PCU 123 มหาวิทยาลัยขอนแก่น': ['pcu', 'pcu123', 'หอแปดหลัง', 'คลินิก', 'หน่วยบริการปฐมภูมิ', 'หมอ'],

  /* ---------- ร้านอาหาร / คาเฟ่ / ตลาด ---------- */
  'Complex Canteen': ['คอมเพล็กซ์', 'คอมเพลก', 'ศูนย์อาหาร 1', 'ศูนย์อาหารและบริการ 1'],
  'ศูนย์อาหารและบริการ 2 (โรงชาย)': ['โรงชาย', 'ศูนย์อาหาร 2', 'the space', 'เดอะสเปซ', 'co-working', 'คอเวิร์กกิ้ง'],
  'ศูนย์อาหารและบริการ 6 (ยูเซนเตอร์)': ['ยูเซนเตอร์', 'u center', 'ucenter', 'ศูนย์อาหาร 6'],
  'โรงอาหารคณะมนุษยศาสตร์และสังคมศาสตร์': ['โรงอาหารมนุษย์', 'โรงอาหารมนุษยศาสตร์'],
  'โรงอาหาร MBA': ['mba', 'เอ็มบีเอ'],
  'โรงอาหารหอพักนักศึกษา คณะแพทย์ศาสตร์': ['โรงอาหารแพทย์', 'โรงอาหารหอแพทย์', 'หอแพทย์'],
  'Coffee Der La': ['เดอลา', 'เดอร์ลา', 'กาแฟ'],
  'Ori Cafe': ['โอริ', 'โอริคาเฟ่', 'ori'],
  'ตลาดมอดินแดง': ['ตลาดมอ', 'ตลาดมอดิน', 'ตลาดนัด'],

  /* ---------- พักผ่อน ---------- */
  'อุทยานเทคโนโลยีการเกษตร มหาวิทยาลัยขอนแก่น (สวนเกษตร)': ['สวนเกษตร', 'อุทยานเกษตร', 'ตลาดต้นไม้', 'agri park'],
  'บึงสีฐาน': ['บึง', 'sithan', 'sitan', 'ดูพระอาทิตย์ตก', 'ซันเซ็ต'],
  'สระพลาสติก': ['สระ', 'สระน้ำพลาสติก', 'สระพลาสติค', 'plastic pond'],

  /* ---------- คาเฟ่ ---------- */
  'TE Lake View Cafe': ['te', 'te cafe', 'te lake', 'lake view', 'เลควิว'],
  'Arabus Cafe KKUIC': ['arabus', 'อาราบัส', 'kkuic', 'วิทยาลัยนานาชาติ'],
  'Sribrown Cafe Science Square KKU': ['sribrown', 'ศรีบราวน์', 'ศรีบราว', 'science square', 'ไซเอนซ์สแควร์', 'u center'],
  "Cafe de' Forest (KKU)": ['forest', 'ฟอเรสต์', 'เดอฟอเรสต์', 'แก่นกาละปพฤกษ์', 'แก่นกาลปพฤกษ์'],
  'Juneko House': ['juneko', 'จูเนโกะ', 'ชิโอปัน'],
  'ROOSEUKDEE.tastespace': ['rooseukdee', 'รู้สึกดี', 'รูสึกดี', 'ตรงข้ามพยาบาล'],
};

/* ---------- normalize ---------- */

function normalize(s: string, stripPrefix = true): string {
  let t = s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u0E47-\u0E4C]/g, ''); // ไม้ไต่คู้ วรรณยุกต์ ทัณฑฆาต
  if (stripPrefix) t = t.replace(/ตึก|อาคาร/g, '');
  return t
    .replace(/[\s.\-_,/()'"“”‘’]+/g, '')
    .replace(/([a-z])0+(?=\d)/g, '$1'); // sc09 → sc9
}

/** คำค้นล้วน ๆ เช่น "ตึก" จะว่างหลังตัดคำนำหน้า → ใช้แบบไม่ตัดแทน */
function normalizeQuery(s: string): string {
  return normalize(s) || normalize(s, false);
}

/* ---------- approximate substring (Sellers) ---------- */

function approxContains(text: string, pattern: string, maxDist: number): boolean {
  const m = pattern.length;
  if (!m) return true;
  let prev = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 0; j < text.length; j++) {
    const cur = [0];
    for (let i = 1; i <= m; i++) {
      cur[i] = Math.min(
        prev[i] + 1,
        cur[i - 1] + 1,
        prev[i - 1] + (pattern[i - 1] === text[j] ? 0 : 1)
      );
    }
    if (cur[m] <= maxDist) return true;
    prev = cur;
  }
  return false;
}

function allowedTypos(q: string): number {
  if (/\d/.test(q)) return 0; // มีตัวเลข = ต้องตรงเป๊ะ
  if (q.length < 4) return 0;
  return q.length < 8 ? 1 : 2;
}

/* ---------- scoring ---------- */

function scoreText(hay: string, q: string, typos: number): number {
  if (!hay || !q) return 0;
  if (hay === q) return 100;
  if (hay.startsWith(q)) return 85;
  if (hay.includes(q)) return 65;
  if (typos > 0 && approxContains(hay, q, typos)) return 35;
  return 0;
}

function scorePlace(place: SearchablePlace, q: string): number {
  if (!q) return 0;
  const typos = allowedTypos(q);

  const aliases = [
    ...(place.aliases ?? []),
    ...(PLACE_ALIASES[place.name] ?? []),
  ];

  let best = scoreText(normalize(place.name), q, typos);

  for (const a of aliases) {
    best = Math.max(best, scoreText(normalize(a), q, typos) * 0.95);
  }

  // ฟิลด์ยาว ๆ: ตรงเป๊ะเท่านั้น (ไม่ fuzzy) และคะแนนต่ำกว่าชื่อเสมอ
  for (const field of [place.category, place.description, place.address]) {
    if (field && normalize(field).includes(q)) best = Math.max(best, 25);
  }

  return best;
}

/* ---------- public API ---------- */

export function searchPlaces<T extends SearchablePlace>(
  places: T[],
  query: string
): T[] {
  const raw = query.trim();
  if (!raw) return places;

  const whole = normalizeQuery(raw);
  const tokens = raw
    .split(/\s+/)
    .map(normalizeQuery)
    .filter(Boolean);

  return places
    .map((place) => {
      let score = scorePlace(place, whole);

      // พิมพ์หลายคำ เช่น "ตึก หลอด" → ทุกคำต้องเจอ
      if (tokens.length > 1) {
        const scores = tokens.map((t) => scorePlace(place, t));
        if (scores.every((s) => s > 0)) {
          score = Math.max(score, Math.min(...scores) * 0.9);
        }
      }
      return { place, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.place);
}