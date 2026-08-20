import express from "express";
import "dotenv/config";
import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "./db/index.js";
import { places, checklist, users, events, news, eventParticipants } from "./db/schema.js";
import { eq, and } from "drizzle-orm";

function requireAuthJson(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
const app = express();
app.use(express.json());
app.use(clerkMiddleware()); // ทำให้ req.auth ใช้งานได้ทุก route (ไม่บังคับ login)

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ================= PLACES (public) =================
app.get("/places", async (req, res) => {
  try {
    const result = await db.query.places.findMany();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch places" });
  }
});

app.get("/places/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const result = await db.query.places.findFirst({
      where: eq(places.placeId, id),

      with: {
        busLines: {
          with: {
            busLine: true,
          },
        },
      },
    });

    if (!result) {
      return res.status(404).json({
        error: "Place not found",
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch place",
    });
  }
});

app.post("/places", async (req, res) => {
  try {
    const { name, category, description, address, latitude, longitude, priceMin, priceMax } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: "name and category are required" });
    }
    const [newPlace] = await db
      .insert(places)
      .values({ name, category, description, address, latitude, longitude, priceMin, priceMax })
      .returning();
    res.status(201).json(newPlace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create place" });
  }
});

app.put("/places/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, category, description, address, latitude, longitude, priceMin, priceMax } = req.body;
    const [updated] = await db
      .update(places)
      .set({ name, category, description, address, latitude, longitude, priceMin, priceMax })
      .where(eq(places.placeId, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Place not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update place" });
  }
});

app.delete("/places/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(places).where(eq(places.placeId, id)).returning();
    if (!deleted) return res.status(404).json({ error: "Place not found" });
    res.json({ success: true, deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete place" });
  }
});

// ================= EVENTS (public) =================
app.get("/events", async (req, res) => {
  try {
    const result = await db.query.events.findMany();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.get("/events/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await db.query.events.findFirst({ where: eq(events.eventId, id) });
    if (!result) return res.status(404).json({ error: "Event not found" });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

app.post("/events", async (req, res) => {
  try {
    const { title, category, description, location, eventDate, capacity, externalLink } = req.body;
    if (!title || !eventDate) {
      return res.status(400).json({ error: "title and eventDate are required" });
    }
    const [newEvent] = await db
      .insert(events)
      .values({ title, category, description, location, eventDate: new Date(eventDate), capacity, externalLink })
      .returning();
    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// ================= NEWS (public) =================
app.get("/news", async (req, res) => {
  try {
    const result = await db.query.news.findMany({
      orderBy: (news, { desc }) => [desc(news.publishedDate)],
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

app.post("/news", async (req, res) => {
  try {
    const { title, category, description, icon, publishedDate, externalLink } = req.body;
    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }
    const [newNews] = await db
      .insert(news)
      .values({
        title,
        category,
        description,
        icon,
        publishedDate,
        externalLink,
      })
      .returning();
    res.status(201).json(newNews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create news" });
  }
});

// ================= CHECKLIST (protected - ต้อง login) =================

// helper: หา userId ในตาราง users จาก clerkUserId ของ token
async function getInternalUserId(clerkUserId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });
  return user?.userId ?? null;
}

// GET checklist ของ user ที่ login อยู่เท่านั้น
app.get("/checklist", requireAuth(), async (req, res) => {
  try {
    const { userId: clerkUserId } = getAuth(req);
    const userId = await getInternalUserId(clerkUserId!);
    if (!userId) return res.status(404).json({ error: "User not found in database" });

    const result = await db.query.checklist.findMany({
      where: eq(checklist.userId, userId),
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch checklist" });
  }
});

// CREATE task ใหม่ ผูกกับ user ที่ login อยู่
app.post("/checklist", requireAuth(), async (req, res) => {
  try {
    const { userId: clerkUserId } = getAuth(req);
    const userId = await getInternalUserId(clerkUserId!);
    if (!userId) return res.status(404).json({ error: "User not found in database" });

    const { title, description, dueDate } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    const [newTask] = await db
      .insert(checklist)
      .values({ userId, title, description, dueDate })
      .returning();
    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// UPDATE task — เช็คด้วยว่าเป็น task ของ user คนนี้จริง (กันแก้ของคนอื่น)
app.put("/checklist/:id", requireAuth(), async (req, res) => {
  try {
    const { userId: clerkUserId } = getAuth(req);
    const userId = await getInternalUserId(clerkUserId!);
    if (!userId) return res.status(404).json({ error: "User not found in database" });

    const taskId = Number(req.params.id);
    const { title, description, dueDate, status } = req.body;

    const [updated] = await db
      .update(checklist)
      .set({ title, description, dueDate, status })
      .where(and(eq(checklist.taskId, taskId), eq(checklist.userId, userId)))
      .returning();

    if (!updated) return res.status(404).json({ error: "Task not found or not yours" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE task — เช็คเจ้าของเหมือนกัน
app.delete("/checklist/:id", requireAuth(), async (req, res) => {
  try {
    const { userId: clerkUserId } = getAuth(req);
    const userId = await getInternalUserId(clerkUserId!);
    if (!userId) return res.status(404).json({ error: "User not found in database" });

    const taskId = Number(req.params.id);
    const [deleted] = await db
      .delete(checklist)
      .where(and(eq(checklist.taskId, taskId), eq(checklist.userId, userId)))
      .returning();

    if (!deleted) return res.status(404).json({ error: "Task not found or not yours" });
    res.json({ success: true, deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});