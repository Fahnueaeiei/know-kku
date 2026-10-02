import Constants from "expo-constants";
import { Platform } from "react-native";

const PORT = 3000;

function resolveApiUrl() {
  // An explicit override always wins (.env, tunnel, production)
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // Web runs on the same machine as the server
  if (Platform.OS === "web") return `http://localhost:${PORT}`;

  // Phone/emulator: use the same IP that Metro is served from
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host) return `http://${host}:${PORT}`;

  return `http://localhost:${PORT}`;
}

export const API_URL = resolveApiUrl();

export type ApiPlace = {
  placeId: number;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  priceMin: number | null;
  priceMax: number | null;
};

export type ApiEvent = {
  eventId: number;
  title: string;
  category: string | null;
  description: string | null;
  location: string | null;
  eventDate: string;
  capacity: number | null;
  externalLink: string | null;
  imageUrl: string | null;
};

/**
 * เช็คลิสต์ = กลุ่มหัวข้อ (เช่น "เตรียมสอบ")
 * แต่ละรายการมีวันที่/เวลา/รายละเอียดของตัวเอง เพราะเวลาไม่ตรงกัน
 */
export type ChecklistItem = {
  itemId: number;
  title: string;
  subtitle: string | null; // บรรทัดที่ 2 (ภาษาไทยในวงเล็บตาม Figma)
  completed: boolean;
  completedAt: string | null; // ISO datetime ตอนติ๊กเสร็จ ใช้โชว์ "Completed 28 Sep"
  dueDate: string | null; // "YYYY-MM-DD"
  dueTime: string | null; // "HH:mm" (มีได้เมื่อมี dueDate) ใช้ตั้งแจ้งเตือนล่วงหน้า 1 วัน
  note: string | null;
  url: string | null;
  location: string | null; // ข้อความที่แสดง เช่น "SC06"
  placeId: number | null; // ผูกกับ Place ในแอป (ว่างได้) ถ้ามีจะเปิดหน้า Place แทนการค้นแผนที่
};

export type ChecklistTask = {
  taskId: number;
  title: string;
  description: string | null;
  items: ChecklistItem[];
};

export type NewChecklistItem = {
  itemId?: number; // มีเมื่อแก้ไขรายการเดิม ไม่มี = รายการใหม่
  completed?: boolean;
  title: string;
  subtitle?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  note?: string;
  url?: string;
  location?: string;
  placeId?: number | null;
};

export type NewChecklistTask = {
  title: string;
  description?: string;
  items: NewChecklistItem[];
};

// ฟิลด์ที่แก้ได้ของรายการเดียว (ส่งเฉพาะที่เปลี่ยน)
export type ItemPatch = Partial<
  Pick<
    ChecklistItem,
    | "title"
    | "completed"
    | "dueDate"
    | "dueTime"
    | "note"
    | "url"
    | "location"
    | "placeId"
  >
>;

// ตอนเพิ่ม Clerk: ส่ง () => getToken() เข้ามา แล้ว backend อ่าน user จาก token
export type GetToken = () => Promise<string | null>;

/* =========================================================
   REQUEST HELPER
========================================================= */

async function request<T>(
  path: string,
  init?: RequestInit,
  getToken?: GetToken
): Promise<T> {
  const token = getToken ? await getToken() : null;

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      // ส่ง JSON เท่านั้น ถ้าเป็น FormData ปล่อยให้ RN ตั้ง boundary เอง
      ...(typeof init?.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

/* =========================================================
   PLACES / EVENTS (ของเดิม)
========================================================= */

export const getPlaces = () => request<ApiPlace[]>("/places");

export const getPlace = (placeId: string | string[]) =>
  request<ApiPlace>(`/places/${encodeURIComponent(String(placeId))}`);

export const getEvents = () => request<ApiEvent[]>("/events");

export const getEventById = (id: string | number) =>
  request<ApiEvent>(`/events/${id}`);

/* =========================================================
   CHECKLIST
   USE_CHECKLIST_MOCK = true  → ใช้ข้อมูลในเครื่อง (backend ยังไม่มี route)
   ต่อ DB: ตั้งเป็น false แล้วทำ route ตามนี้
     GET    /checklists                → ChecklistTask[]
     POST   /checklists                → ChecklistTask
     PUT    /checklists/:taskId        → ChecklistTask  (body: NewChecklistTask;
                                          รายการที่มี itemId = แก้, ไม่มี = เพิ่ม,
                                          รายการเดิมที่ไม่อยู่ใน body = ลบ)
     DELETE /checklists/:taskId        → { ok: true }
     PATCH  /checklists/items/:itemId  → ChecklistItem  (body: ItemPatch เฉพาะฟิลด์ที่แก้
                                          เช่น { completed } หรือ { title, dueDate, placeId ... })
     DELETE /checklists/items/:itemId  → { ok: true }
     (server ตั้ง completedAt เอง ตอน completed เปลี่ยนเป็น true)
========================================================= */

const USE_CHECKLIST_MOCK = true;

const pad = (n: number) => String(n).padStart(2, "0");

// วันที่เทียบจากวันนี้ เพื่อให้ข้อมูลตัวอย่างดูสมจริงเสมอ (ไม่เก่าค้าง)
const isoInDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const daysAgoISO = (days: number) =>
  new Date(Date.now() - days * 86400000).toISOString();

const blank = {
  completedAt: null,
  subtitle: null,
  dueDate: null,
  dueTime: null,
  note: null,
  url: null,
  location: null,
  placeId: null,
};

let mockTasks: ChecklistTask[] = [
  {
    taskId: 1,
    title: "Finish this first",
    description: null,
    items: [
      {
        ...blank,
        itemId: 1,
        title: "Submit documents at Division of Student Affairs",
        subtitle: "ส่งเอกสารกองพัฒน์",
        completed: true,
        completedAt: daysAgoISO(2),
        dueDate: isoInDays(-2),
        location: "Division of Student Affairs, KKU",
        note: "Bring a copy of your ID card.",
      },
      {
        ...blank,
        itemId: 2,
        title: "Lab session at Building SC06",
        subtitle: "เข้า Lab ตึก SC06",
        completed: false,
        dueDate: isoInDays(1),
        dueTime: "13:00",
        location: "Building SC06, KKU",
        note: "Bring your laptop and student ID.",
      },
    ],
  },
  {
    taskId: 2,
    title: "New Student Preparation",
    description: null,
    items: [
      { ...blank, itemId: 3, title: "เตรียมเอกสารสำคัญสำหรับรายงานตัว", completed: true, completedAt: daysAgoISO(3) },
      {
        ...blank,
        itemId: 4,
        title: "สมัคร KKU Account",
        completed: true,
        completedAt: daysAgoISO(3),
        url: "https://www.kku.ac.th",
      },
      {
        ...blank,
        itemId: 5,
        title: "ตรวจสอบตารางเรียน",
        completed: false,
        dueDate: isoInDays(3),
        dueTime: "09:00",
      },
      {
        ...blank,
        itemId: 6,
        title: "เตรียมอุปกรณ์การเรียน",
        completed: false,
        dueDate: isoInDays(5),
      },
      {
        ...blank,
        itemId: 7,
        title: "สำรวจเส้นทางไปอาคารเรียน",
        completed: false,
        dueDate: isoInDays(0),
        location: "Khon Kaen University",
      },
    ],
  },
  {
    taskId: 3,
    title: "First Week at KKU",
    description: null,
    items: [
      { ...blank, itemId: 8, title: "เข้าร่วมกิจกรรมปฐมนิเทศ", completed: true, completedAt: daysAgoISO(1) },
      {
        ...blank,
        itemId: 9,
        title: "เข้าร่วมกิจกรรมพบอาจารย์ที่ปรึกษา",
        completed: false,
        dueDate: isoInDays(2),
        dueTime: "10:30",
      },
      { ...blank, itemId: 10, title: "สมัครเข้าชมรมที่สนใจ", completed: false },
      { ...blank, itemId: 11, title: "สำรวจห้องสมุดกลาง", completed: false },
    ],
  },
  {
    taskId: 4,
    title: "Orientation Week",
    description: null,
    items: [
      {
        ...blank,
        itemId: 12,
        title: "Attend the faculty orientation",
        completed: true,
        completedAt: daysAgoISO(5),
        dueDate: isoInDays(-6),
        location: "Faculty of Engineering, KKU",
      },
      {
        ...blank,
        itemId: 13,
        title: "Join the freshman LINE group",
        completed: true,
        completedAt: daysAgoISO(5),
      },
    ],
  },
];

let mockNextId = 100;

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchTasks(getToken?: GetToken): Promise<ChecklistTask[]> {
  if (USE_CHECKLIST_MOCK) {
    await wait();
    return JSON.parse(JSON.stringify(mockTasks));
  }

  return request<ChecklistTask[]>("/checklists", undefined, getToken);
}

export async function createTask(
  draft: NewChecklistTask,
  getToken?: GetToken
): Promise<ChecklistTask> {
  if (USE_CHECKLIST_MOCK) {
    await wait();

    const created: ChecklistTask = {
      taskId: mockNextId++,
      title: draft.title,
      description: draft.description ?? null,
      items: draft.items.map((item) => ({
        itemId: mockNextId++,
        title: item.title,
        subtitle: item.subtitle ?? null,
        completed: false,
        completedAt: null,
        dueDate: item.dueDate ?? null,
        dueTime: item.dueDate ? item.dueTime ?? null : null,
        note: item.note ?? null,
        url: item.url ?? null,
        location: item.location ?? null,
        placeId: item.placeId ?? null,
      })),
    };

    mockTasks = [...mockTasks, created];
    return created;
  }

  return request<ChecklistTask>(
    "/checklists",
    { method: "POST", body: JSON.stringify(draft) },
    getToken
  );
}

export async function setItemCompleted(
  itemId: number,
  completed: boolean,
  getToken?: GetToken
): Promise<void> {
  if (USE_CHECKLIST_MOCK) {
    await wait(120);

    mockTasks = mockTasks.map((task) => ({
      ...task,
      items: task.items.map((item) =>
        item.itemId === itemId
          ? {
              ...item,
              completed,
              completedAt: completed ? new Date().toISOString() : null,
            }
          : item
      ),
    }));
    return;
  }

  await request<{ ok: true }>(
    `/checklists/items/${itemId}`,
    { method: "PATCH", body: JSON.stringify({ completed }) },
    getToken
  );
}

export async function updateItem(
  itemId: number,
  patch: ItemPatch,
  getToken?: GetToken
): Promise<ChecklistItem> {
  if (USE_CHECKLIST_MOCK) {
    await wait();

    mockTasks = mockTasks.map((task) => ({
      ...task,
      items: task.items.map((item) => {
        if (item.itemId !== itemId) return item;

        const merged: ChecklistItem = { ...item, ...patch };
        if (!merged.dueDate) merged.dueTime = null;
        return merged;
      }),
    }));

    const updated = mockTasks
      .flatMap((t) => t.items)
      .find((i) => i.itemId === itemId);
    if (!updated) throw new Error("Task not found");

    return JSON.parse(JSON.stringify(updated));
  }

  return request<ChecklistItem>(
    `/checklists/items/${itemId}`,
    { method: "PATCH", body: JSON.stringify(patch) },
    getToken
  );
}

export async function deleteItem(
  itemId: number,
  getToken?: GetToken
): Promise<void> {
  if (USE_CHECKLIST_MOCK) {
    await wait(150);

    mockTasks = mockTasks.map((task) => ({
      ...task,
      items: task.items.filter((i) => i.itemId !== itemId),
    }));
    return;
  }

  // backend ควรตอบ JSON เช่น { ok: true }
  await request<{ ok: true }>(
    `/checklists/items/${itemId}`,
    { method: "DELETE" },
    getToken
  );
}

export async function updateTask(
  taskId: number,
  draft: NewChecklistTask,
  getToken?: GetToken
): Promise<ChecklistTask> {
  if (USE_CHECKLIST_MOCK) {
    await wait();

    const existing = mockTasks.find((t) => t.taskId === taskId);
    if (!existing) throw new Error("Checklist not found");

    const updated: ChecklistTask = {
      ...existing,
      title: draft.title,
      items: draft.items.map((item) => {
        const prev = existing.items.find((i) => i.itemId === item.itemId);
        const completed = item.completed ?? false;

        return {
          itemId: item.itemId ?? mockNextId++,
          title: item.title,
          subtitle: item.subtitle ?? null,
          completed,
          completedAt: completed
            ? prev?.completedAt ?? new Date().toISOString()
            : null,
          dueDate: item.dueDate ?? null,
          dueTime: item.dueDate ? item.dueTime ?? null : null,
          note: item.note ?? null,
          url: item.url ?? null,
          location: item.location ?? null,
          placeId: item.placeId ?? null,
        };
      }),
    };

    mockTasks = mockTasks.map((t) => (t.taskId === taskId ? updated : t));
    return JSON.parse(JSON.stringify(updated));
  }

  return request<ChecklistTask>(
    `/checklists/${taskId}`,
    { method: "PUT", body: JSON.stringify(draft) },
    getToken
  );
}

export async function deleteTask(
  taskId: number,
  getToken?: GetToken
): Promise<void> {
  if (USE_CHECKLIST_MOCK) {
    await wait(150);
    mockTasks = mockTasks.filter((t) => t.taskId !== taskId);
    return;
  }

  // backend ควรตอบ JSON เช่น { ok: true } เพราะ request() อ่านผลเป็น JSON
  await request<{ ok: true }>(
    `/checklists/${taskId}`,
    { method: "DELETE" },
    getToken
  );
}

/* =========================================================
   สร้างเช็คลิสต์จากเอกสาร (อัปโหลด PDF/รูป → draft ให้ผู้ใช้ตรวจ)
   ต่อ DB/AI จริง: POST /checklists/extract  (multipart, field "file")
     → NewChecklistTask  (ยังไม่บันทึกลง DB ผู้ใช้ตรวจแล้วค่อย POST /checklists)
========================================================= */

export type PickedDocument = {
  uri: string;
  name: string;
  mimeType?: string;
};

export async function extractChecklistFromDocument(
  file: PickedDocument,
  getToken?: GetToken
): Promise<NewChecklistTask> {
  if (USE_CHECKLIST_MOCK) {
    // จำลอง: ยังไม่ได้อ่านไฟล์จริง คืนตัวอย่างคงที่เพื่อโชว์ flow
    await wait(1800);
    return {
      title: "เตรียมรายงานตัวนักศึกษาใหม่",
      items: [
        {
          title: "ส่งเอกสารรายงานตัวที่กองทะเบียน",
          dueDate: isoInDays(2),
          dueTime: "09:00",
        },
        { title: "ชำระค่าธรรมเนียมการศึกษา", dueDate: isoInDays(4) },
        {
          title: "ยื่นคำขอกู้ กยศ. ผ่านระบบ",
          dueDate: isoInDays(6),
          url: "https://www.studentloan.or.th",
        },
        { title: "ตรวจสอบตารางเรียนในระบบ" },
      ],
    };
  }

  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? "application/octet-stream",
  } as any);

  return request<NewChecklistTask>(
    "/checklists/extract",
    { method: "POST", body: form },
    getToken
  );
}