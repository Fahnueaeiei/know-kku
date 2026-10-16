import express from "express";
import "dotenv/config";
import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express";
import { db } from "./db/index.js";
import {
  places,
  checklist,
  checklistItems,
  users,
  events,
} from "./db/schema.js";
import { eq, and } from "drizzle-orm";

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
    const result = await db.query.places.findFirst({ where: eq(places.placeId, id) });
    if (!result) return res.status(404).json({ error: "Place not found" });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch place" });
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

// ================= CHECKLIST ITEMS (protected) =================

// GET: ดึงรายการย่อยของ task ที่เป็นของ user คนนี้
app.get(
  "/checklist/:taskId/items",
  requireAuth(),
  async (req, res) => {
    try {
      const { userId: clerkUserId } = getAuth(req);
      const userId = await getInternalUserId(clerkUserId!);

      if (!userId) {
        return res.status(404).json({
          error: "User not found in database",
        });
      }

      const taskId = Number(req.params.taskId);

      if (!Number.isInteger(taskId) || taskId <= 0) {
        return res.status(400).json({
          error: "Invalid task ID",
        });
      }

      // ตรวจสอบว่า task เป็นของ user คนนี้
      const task = await db.query.checklist.findFirst({
        where: and(
          eq(checklist.taskId, taskId),
          eq(checklist.userId, userId)
        ),
      });

      if (!task) {
        return res.status(404).json({
          error: "Task not found or not yours",
        });
      }

      const result = await db.query.checklistItems.findMany({
        where: eq(checklistItems.taskId, taskId),
      });

      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: "Failed to fetch checklist items",
      });
    }
  }
);

// POST: เพิ่มรายการย่อย
app.post(
  "/checklist/:taskId/items",
  requireAuth(),
  async (req, res) => {
    try {
      const { userId: clerkUserId } = getAuth(req);
      const userId = await getInternalUserId(clerkUserId!);

      if (!userId) {
        return res.status(404).json({
          error: "User not found in database",
        });
      }

      const taskId = Number(req.params.taskId);

      if (!Number.isInteger(taskId) || taskId <= 0) {
        return res.status(400).json({
          error: "Invalid task ID",
        });
      }

      const task = await db.query.checklist.findFirst({
        where: and(
          eq(checklist.taskId, taskId),
          eq(checklist.userId, userId)
        ),
      });

      if (!task) {
        return res.status(404).json({
          error: "Task not found or not yours",
        });
      }

      const {
        title,
        subtitle,
        dueDate,
        dueTime,
        note,
        url,
        location,
        placeId,
      } = req.body;

      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          error: "title is required",
        });
      }

      const [newItem] = await db
        .insert(checklistItems)
        .values({
          taskId,
          title: title.trim(),
          subtitle: subtitle ?? null,
          dueDate: dueDate || null,
          dueTime: dueTime || null,
          note: note ?? null,
          url: url ?? null,
          location: location ?? null,
          placeId: placeId ?? null,
        })
        .returning();

      return res.status(201).json(newItem);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: "Failed to create checklist item",
      });
    }
  }
);

// PUT: แก้ไขรายการย่อย
app.put(
  "/checklist/items/:itemId",
  requireAuth(),
  async (req, res) => {
    try {
      const { userId: clerkUserId } = getAuth(req);
      const userId = await getInternalUserId(clerkUserId!);

      if (!userId) {
        return res.status(404).json({
          error: "User not found in database",
        });
      }

      const itemId = Number(req.params.itemId);

      if (!Number.isInteger(itemId) || itemId <= 0) {
        return res.status(400).json({
          error: "Invalid item ID",
        });
      }

      // ค้นหารายการย่อย
      const item = await db.query.checklistItems.findFirst({
        where: eq(checklistItems.itemId, itemId),
      });

      if (!item) {
        return res.status(404).json({
          error: "Checklist item not found",
        });
      }

      // ตรวจสอบสิทธิ์ผ่าน task เจ้าของรายการย่อย
      const task = await db.query.checklist.findFirst({
        where: and(
          eq(checklist.taskId, item.taskId),
          eq(checklist.userId, userId)
        ),
      });

      if (!task) {
        return res.status(404).json({
          error: "Checklist item not found or not yours",
        });
      }

      const body = req.body;
      const updates: Record<string, any> = {};

      if ("title" in body) {
        if (typeof body.title !== "string" || !body.title.trim()) {
          return res.status(400).json({
            error: "title must not be empty",
          });
        }

        updates.title = body.title.trim();
      }

      if ("subtitle" in body) updates.subtitle = body.subtitle;
      if ("dueDate" in body) updates.dueDate = body.dueDate || null;
      if ("dueTime" in body) updates.dueTime = body.dueTime || null;
      if ("note" in body) updates.note = body.note;
      if ("url" in body) updates.url = body.url;
      if ("location" in body) updates.location = body.location;
      if ("placeId" in body) updates.placeId = body.placeId;

      if ("completed" in body) {
        if (typeof body.completed !== "boolean") {
          return res.status(400).json({
            error: "completed must be a boolean",
          });
        }

        updates.completed = body.completed;
        updates.completedAt = body.completed ? new Date() : null;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: "No fields to update",
        });
      }

      const [updated] = await db
        .update(checklistItems)
        .set(updates)
        .where(eq(checklistItems.itemId, itemId))
        .returning();

      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: "Failed to update checklist item",
      });
    }
  }
);

// DELETE: ลบรายการย่อย
app.delete(
  "/checklist/items/:itemId",
  requireAuth(),
  async (req, res) => {
    try {
      const { userId: clerkUserId } = getAuth(req);
      const userId = await getInternalUserId(clerkUserId!);

      if (!userId) {
        return res.status(404).json({
          error: "User not found in database",
        });
      }

      const itemId = Number(req.params.itemId);

      if (!Number.isInteger(itemId) || itemId <= 0) {
        return res.status(400).json({
          error: "Invalid item ID",
        });
      }

      const item = await db.query.checklistItems.findFirst({
        where: eq(checklistItems.itemId, itemId),
      });

      if (!item) {
        return res.status(404).json({
          error: "Checklist item not found",
        });
      }

      const task = await db.query.checklist.findFirst({
        where: and(
          eq(checklist.taskId, item.taskId),
          eq(checklist.userId, userId)
        ),
      });

      if (!task) {
        return res.status(404).json({
          error: "Checklist item not found or not yours",
        });
      }

      const [deleted] = await db
        .delete(checklistItems)
        .where(eq(checklistItems.itemId, itemId))
        .returning();

      return res.json({
        success: true,
        deleted,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: "Failed to delete checklist item",
      });
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});