import express from "express";
import "dotenv/config";
import cors from "cors";
import extractRouter from "./db/checklistExtract.js";

import {
  clerkMiddleware,
  requireAuth,
  getAuth,
} from "@clerk/express";

import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { db } from "./db/index.js";

import {
  places,
  checklist,
  checklistItems,
  users,
  events,
  news,
} from "./db/schema.js";

import {
  eq,
  and,
  gt,
  lte,
  or,
  desc,
  inArray,
} from "drizzle-orm";
import { error } from "node:console";

// ================= CONFIG =================

const PORT =
  Number(process.env.PORT) || 3000;

const DINDANG_API_URL =
  "http://127.0.0.1:8000";

// ================= AUTH HELPER =================

function requireAuthJson(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { userId } =
    getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  next();
}

// ================= EXPRESS APP =================

const app = express();

app.use(
  cors({
    origin: ["http://localhost:8081"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use(clerkMiddleware());

// ทำให้ req.auth ใช้งานได้ทุก route
// แต่ไม่ได้บังคับให้ login ทุก route

// ================= HEALTH =================

app.get(
  "/health",
  (req, res) => {
    res.json({
      status: "ok",
    });
  }
);

// ============================================================
// P'DIN-DANG CHATBOT
// Python FastAPI RAG -> Express -> Mobile
// ============================================================

app.post(
  "/chat",
  async (req, res) => {
    try {
      const {
        question,
      } = req.body;

      if (
        !question ||
        typeof question !==
          "string" ||
        !question.trim()
      ) {
        return res.status(400).json({
          error:
            "question is required",
        });
      }

      const chatUrl =
        "http://127.0.0.1:8000/chat";

      console.log(
        "================================="
      );

      console.log(
        "P'Din-Dang Chat"
      );

      console.log(
        "URL:",
        chatUrl
      );

      console.log(
        "Question:",
        question
      );

      console.log(
        "================================="
      );

      const response =
        await fetch(
          chatUrl,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              question:
                question.trim(),
            }),
          }
        );

      console.log(
        "P'Din-Dang status:",
        response.status
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "P'Din-Dang API error:",
          response.status,
          errorText
        );

        return res
          .status(502)
          .json({
            error:
              "P'Din-Dang service unavailable",
          });
      }

      const data =
        await response.json();

      console.log(
        "P'Din-Dang response received"
      );

      return res.json(
        data
      );
    } catch (err) {
      console.error(
        "P'Din-Dang proxy error:",
        err
      );

      return res
        .status(502)
        .json({
          error:
            "Failed to connect to P'Din-Dang service",
        });
    }
  }
);

// ================= PLACES (public) =================

app.get(
  "/places",
  async (req, res) => {
    try {
      const result =
        await db.query.places.findMany();

      res.json(result);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to fetch places",
      });
    }
  }
);

app.get(
  "/places/:id",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const result =
        await db.query.places.findFirst(
          {
            where: eq(
              places.placeId,
              id
            ),

            with: {
              busLines: {
                with: {
                  busLine: true,
                },
              },
              weeklyHours: true,
            },
          }
        );

      if (!result) {
        return res
          .status(404)
          .json({
            error:
              "Place not found",
          });
      }

      res.json(result);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to fetch place",
      });
    }
  }
);

app.post(
  "/places",
  async (req, res) => {
    try {
      const {
        name,
        category,
        description,
        address,
        latitude,
        longitude,
        priceMin,
        priceMax,
      } = req.body;

      if (
        !name ||
        !category
      ) {
        return res
          .status(400)
          .json({
            error:
              "name and category are required",
          });
      }

      const [
        newPlace,
      ] = await db
        .insert(places)
        .values({
          name,
          category,
          description,
          address,
          latitude,
          longitude,
          priceMin,
          priceMax,
        })
        .returning();

      res
        .status(201)
        .json(newPlace);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to create place",
      });
    }
  }
);

app.put(
  "/places/:id",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const {
        name,
        category,
        description,
        address,
        latitude,
        longitude,
        priceMin,
        priceMax,
      } = req.body;

      const [
        updated,
      ] = await db
        .update(places)
        .set({
          name,
          category,
          description,
          address,
          latitude,
          longitude,
          priceMin,
          priceMax,
        })
        .where(
          eq(
            places.placeId,
            id
          )
        )
        .returning();

      if (!updated) {
        return res
          .status(404)
          .json({
            error:
              "Place not found",
          });
      }

      res.json(updated);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to update place",
      });
    }
  }
);

app.delete(
  "/places/:id",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const [
        deleted,
      ] = await db
        .delete(places)
        .where(
          eq(
            places.placeId,
            id
          )
        )
        .returning();

      if (!deleted) {
        return res
          .status(404)
          .json({
            error:
              "Place not found",
          });
      }

      res.json({
        success: true,
        deleted,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to delete place",
      });
    }
  }
);

// ================= EVENTS (public) =================

app.get(
  "/events",
  async (req, res) => {
    try {
      const result =
        await db.query.events.findMany();

      res.json(result);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to fetch events",
      });
    }
  }
);

app.get(
  "/events/:id",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const result =
        await db.query.events.findFirst(
          {
            where: eq(
              events.eventId,
              id
            ),
          }
        );

      if (!result) {
        return res
          .status(404)
          .json({
            error:
              "Event not found",
          });
      }

      res.json(result);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to fetch event",
      });
    }
  }
);

app.post(
  "/events",
  async (req, res) => {
    try {
      const {
        title,
        category,
        description,
        location,
        eventDate,
        capacity,
        externalLink,
        imageUrl,
      } = req.body;

      if (
        !title ||
        !eventDate
      ) {
        return res
          .status(400)
          .json({
            error:
              "title and eventDate are required",
          });
      }

      const [
        newEvent,
      ] = await db
        .insert(events)
        .values({
          title,
          category,
          description,
          location,
          eventDate:
            new Date(
              eventDate
            ),
          capacity,
          externalLink,
          imageUrl,
        })
        .returning();

      res
        .status(201)
        .json(newEvent);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to create event",
      });
    }
  }
);


/* ================= KKU EVENTS (public) ================= */

const KKU_EVENTS_API_URL =
  "https://www.kku.ac.th/wp-json/tribe/events/v1/events";

const KKU_EVENTS_TIMEOUT_MS = 10_000;

type KkuWpEvent = {
  id?: number | string;
  title?: string;
  excerpt?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  all_day?: boolean;
  url?: string;
  image?: false | {
    url?: string;
    sizes?: {
      medium?: { url?: string };
      medium_large?: { url?: string };
    };
  };
  venue?: false | {
    venue?: string;
  } | [];
};

function cleanKkuText(value?: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    hellip: "…",
    ndash: "–",
    mdash: "—",
    lsquo: "‘",
    rsquo: "’",
    ldquo: "“",
    rdquo: "”",
  };

  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(parseInt(decimal, 10))
    )
    .replace(/&([a-z]+);/gi, (match, name: string) =>
      entities[name.toLowerCase()] ?? match
    )
    .replace(/\s+/g, " ")
    .trim();
}

function parseKkuDate(value?: string): Date | null {
  if (!value) return null;

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (!match) return null;

  const [, year, month, day, hour = "00", minute = "00", second = "00"] =
    match;

  const date = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatKkuDate(
  start: Date,
  end: Date,
  allDay: boolean
): string {
  const months = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];

  const getParts = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);

    const get = (key: string) =>
      parts.find((part) => part.type === key)?.value ?? "0";

    return {
      day: Number(get("day")),
      month: Number(get("month")),
      hour: Number(get("hour")),
      minute: Number(get("minute")),
      dateKey: `${date.toLocaleDateString("en-CA", {
        timeZone: "Asia/Bangkok",
      })}`,
    };
  };

  const a = getParts(start);
  const b = getParts(end);

  const label = (p: ReturnType<typeof getParts>) =>
    `${p.day} ${months[p.month - 1]}`;

  if (a.dateKey !== b.dateKey) {
    return `${label(a)} – ${label(b)}`;
  }

  if (allDay) return label(a);

  return `${label(a)} • ${String(a.hour).padStart(2, "0")}:${String(
    a.minute
  ).padStart(2, "0")} น.`;
}



function normalizeKkuTitle(title: string): string {
  return cleanKkuText(title)
    .normalize("NFKC")
    .toLocaleLowerCase("th-TH")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

app.get("/kku-events", async (req, res) => {
  const requestedLimit = Number(req.query.limit ?? 6);

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(12, Math.max(1, Math.floor(requestedLimit)))
    : 6;

  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    KKU_EVENTS_TIMEOUT_MS
  );

  try {
    const todayParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const getTodayPart = (key: string) =>
      todayParts.find((part) => part.type === key)?.value ?? "";

    const today =
      `${getTodayPart("year")}-${getTodayPart("month")}-${getTodayPart("day")}`;

    const url = new URL(KKU_EVENTS_API_URL);
    url.searchParams.set("per_page", String(Math.min(limit * 3, 50)));
    url.searchParams.set("start_date", today);

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("KKU Events API status:", response.status);

      return res.status(502).json({
        error: "Failed to fetch KKU events",
      });
    }

    const json: unknown = await response.json();

    const rawEvents =
      json &&
      typeof json === "object" &&
      "events" in json &&
      Array.isArray(json.events)
        ? (json.events as KkuWpEvent[])
        : [];

    
    const seen = new Set<string>();
    const seenIdentities = new Set<string>();
    const result: Array<{
      id: string;
      title: string;
      excerpt: string;
      dateLabel: string;
      venue?: string | undefined;
      imageUrl?: string | undefined;
      url: string;
      startTs: number;
    }> = [];

    for (const raw of rawEvents) {
      const title = cleanKkuText(raw.title);
      const start = parseKkuDate(raw.start_date);

      if (!title || !start || !raw.id || !raw.url) continue;

      const end = parseKkuDate(raw.end_date) ?? start;

      const image =
        raw.image && typeof raw.image === "object"
          ? raw.image
          : undefined;

      const imageUrl =
        image?.sizes?.medium_large?.url ??
        image?.sizes?.medium?.url ??
        image?.url ??
        undefined;

      const venue =
        raw.venue && !Array.isArray(raw.venue)
          ? cleanKkuText(raw.venue.venue)
          : "";

      const titleKey = normalizeKkuTitle(title);

      const startDate = start.toLocaleDateString("en-CA", {
        timeZone: "Asia/Bangkok",
      });

      const venueKey = normalizeKkuTitle(venue);

      const identityKey = imageUrl
        ? `${imageUrl}|${startDate}|${venueKey}`
        : "";

      if (!titleKey || seen.has(titleKey)) continue;

      if (identityKey && seenIdentities.has(identityKey)) continue;

      seen.add(titleKey);

      if (identityKey) {
        seenIdentities.add(identityKey);
      }

      result.push({
        id: String(raw.id),
        title,
        excerpt: cleanKkuText(raw.excerpt || raw.description),
        dateLabel: formatKkuDate(start, end, Boolean(raw.all_day)),
        venue: venue || undefined,
        imageUrl,
        url: raw.url,
        startTs: start.getTime(),
      });
    }
    result.sort((a, b) => a.startTs - b.startTs);

    return res.json({
      events: result.slice(0, limit),
    });

  } catch (error) {
    console.error("KKU Events proxy error:", error);

    return res.status(502).json({
      error:
        error instanceof Error && error.name === "AbortError"
          ? "KKU Events API timeout"
          : "Failed to connect to KKU Events API",
    });
  } finally {
    clearTimeout(timer);
  }
});


// ================= NEWS (public) =================

app.get(
  "/news",
  async (req, res) => {
    try {
      const requestedType = req.query.type;
      if (
        requestedType !== undefined &&
        requestedType !== "news" &&
        requestedType !== "trivia"
      ) {
        return res.status(400).json({
          error: "type must be news or trivia",
        });
      }

      const isFeaturedQuery =
        req.query.featured ===
        "true";

      const now =
        new Date();

      let result;

      if (
        isFeaturedQuery
      ) {
        result =
          await db
            .select()
            .from(news)
            .where(
              and(
                requestedType
                  ? eq(news.contentType, requestedType)
                  : undefined,
                eq(
                  news.isFeatured,
                  true
                ),
                gt(
                  news.featuredUntil,
                  now
                )
              )
            )
            .orderBy(
              desc(
                news.publishedDate
              )
            );
        } else if (requestedType) {
          result = await db
            .select()
            .from(news)
            .where(eq(news.contentType, requestedType))
            .orderBy(desc(news.publishedDate));
      } else {
        result =
          await db
            .select()
            .from(news)
            .where(
              and(
                eq(
                  news.contentType,
                    "news"
                ),
                or(
                  eq(
                    news.isFeatured,
                    false
                  ),
                  lte(
                    news.featuredUntil,
                    now
                  )
                )
              )
            )
            .orderBy(
              desc(
                news.publishedDate
              )
            );
      }

      res.json(result);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to fetch news",
      });
    }
  }
);

app.post(
  "/news",
  async (req, res) => {
    try {
      const {
        title,
        category,
        description,
        icon,
        contentType,
        publishedDate,
        externalLink,
        imageUrl,
        bg,
        accent,
        isFeatured,
        featuredUntil,
      } = req.body;

      if (!title) {
        return res
          .status(400)
          .json({
            error:
              "title is required",
          });
      }

      if (contentType && contentType !== "news" && contentType !== "trivia") {
        return res.status(400).json({
          error: "contentType must be news or trivia",
        });
      }

      const [
        newNews,
      ] = await db
        .insert(news)
        .values({
          title,
          contentType: contentType ?? "news",
          category,
          description,
          icon,
          bg,
          accent,
          publishedDate,
          externalLink,
          imageUrl,

          isFeatured:
            isFeatured ??
            false,

          featuredUntil:
            featuredUntil
              ? new Date(
                  featuredUntil
                )
              : null,
        })
        .returning();

      res
        .status(201)
        .json(newNews);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to create news",
      });
    }
  }
);

// ================= FEATURE / UNFEATURE NEWS =================

app.patch(
  "/news/:id/feature",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const {
        featuredUntil,
      } = req.body;

      if (
        !featuredUntil
      ) {
        return res
          .status(400)
          .json({
            error:
              "featuredUntil is required",
          });
      }

      const [
        updated,
      ] = await db
        .update(news)
        .set({
          isFeatured: true,

          featuredUntil:
            new Date(
              featuredUntil
            ),
        })
        .where(
          eq(
            news.newsId,
            id
          )
        )
        .returning();

      if (!updated) {
        return res
          .status(404)
          .json({
            error:
              "News not found",
          });
      }

      res.json(updated);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to feature news",
      });
    }
  }
);

app.patch(
  "/news/:id/unfeature",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const [
        updated,
      ] = await db
        .update(news)
        .set({
          isFeatured: false,
          featuredUntil:
            null,
        })
        .where(
          eq(
            news.newsId,
            id
          )
        )
        .returning();

      if (!updated) {
        return res
          .status(404)
          .json({
            error:
              "News not found",
          });
      }

      res.json(updated);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to unfeature news",
      });
    }
  }
);


/* ================= DEMO CHECKLIST API ================= */
/* Temporary shared demo data. Do not use as production auth. */

type DemoItemInput = {
  itemId?: number;
  title: string;
  subtitle?: string | null;
  completed?: boolean;
  dueDate?: string | null;
  dueTime?: string | null;
  note?: string | null;
  url?: string | null;
  location?: string | null;
  placeId?: number | null;
};

const DEMO_CLERK_ID = "know-kku-demo";
const DEMO_EMAIL = "know-kku-demo@demo.invalid";

async function getDemoUserId(): Promise<number> {
  let user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, DEMO_CLERK_ID),
  });

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({
        clerkUserId: DEMO_CLERK_ID,
        name: "Know KKU Demo",
        email: DEMO_EMAIL,
      })
      .onConflictDoNothing()
      .returning();

    user = created ?? await db.query.users.findFirst({
      where: eq(users.clerkUserId, DEMO_CLERK_ID),
    });
  }

  if (!user) {
    throw new Error(
      "Could not find or create the Demo user. Check users table constraints."
    );
  }

  return user.userId;
}

async function getDemoTasks(userId: number) {
  const tasks = await db
    .select()
    .from(checklist)
    .where(eq(checklist.userId, userId));

  if (tasks.length === 0) return [];

  const items = await db
    .select()
    .from(checklistItems)
    .where(
      inArray(
        checklistItems.taskId,
        tasks.map((task) => task.taskId)
      )
    );

  return tasks.map((task) => ({
    ...task,
    items: items
      .filter((item) => item.taskId === task.taskId)
      .map((item) => ({
        ...item,
        dueTime: item.dueTime?.slice(0, 5) ?? null,
      })),
  }));
}

function itemValues(item: DemoItemInput) {
  return {
    title: item.title.trim(),
    subtitle: item.subtitle ?? null,
    completed: item.completed ?? false,
    completedAt: item.completed ? new Date() : null,
    dueDate: item.dueDate || null,
    dueTime: item.dueDate ? item.dueTime || null : null,
    note: item.note ?? null,
    url: item.url ?? null,
    location: item.location ?? null,
    placeId: item.placeId ?? null,
  };
}
   app.use("/checklists", extractRouter);

// GET all Demo checklists, including their items
app.get("/checklists", async (_req, res) => {
  try {
    const userId = await getDemoUserId();
    return res.json(await getDemoTasks(userId));
  } catch (error) {
    console.error("GET /checklists:", error);
    return res.status(500).json({
      error: "Failed to fetch checklists",
    });
  }
});

// CREATE a Demo checklist and its items
app.post("/checklists", async (req, res) => {
  try {
    const { title, description, items } = req.body as {
      title?: string;
      description?: string | null;
      items?: DemoItemInput[];
    };

    if (!title?.trim()) {
      return res.status(400).json({
        error: "title is required",
      });
    }

    if (
      items !== undefined &&
      (!Array.isArray(items) ||
        items.some((item) => !item.title?.trim()))
    ) {
      return res.status(400).json({
        error: "items must be an array of items with titles",
      });
    }

    const userId = await getDemoUserId();

    const [task] = await db
      .insert(checklist)
      .values({
        userId,
        title: title.trim(),
        description: description ?? null,
      })
      .returning();
if (!task) {
  return res.status(404).json({
    message: "Checklist task not found",
  });
}

if (items?.length) {
  await db.insert(checklistItems).values(
    items.map((item) => ({
      taskId: task.taskId,
      ...itemValues(item),
    }))
  );
}

    const result = (await getDemoTasks(userId)).find(
      (entry) => entry.taskId === task.taskId
    );

    return res.status(201).json(result);
  } catch (error) {
    console.error("POST /checklists:", error);
    return res.status(500).json({
      error: "Failed to create checklist",
    });
  }
});

// UPDATE a Demo checklist and reconcile its items
app.put("/checklists/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const { title, description, items } = req.body as {
      title?: string;
      description?: string | null;
      items?: DemoItemInput[];
    };

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ error: "Invalid checklist ID" });
    }

    if (!title?.trim()) {
      return res.status(400).json({ error: "title is required" });
    }

    if (
      !Array.isArray(items) ||
      items.some((item) => !item.title?.trim())
    ) {
      return res.status(400).json({
        error: "items must be an array of items with titles",
      });
    }

    const userId = await getDemoUserId();

    const [existingTask] = await db
      .select()
      .from(checklist)
      .where(
        and(
          eq(checklist.taskId, taskId),
          eq(checklist.userId, userId)
        )
      )
      .limit(1);

    if (!existingTask) {
      return res.status(404).json({ error: "Checklist not found" });
    }

    await db
      .update(checklist)
      .set({
        title: title.trim(),
        description: description ?? null,
      })
      .where(
        and(
          eq(checklist.taskId, taskId),
          eq(checklist.userId, userId)
        )
      );

    const existingItems = await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.taskId, taskId));

    const existingIds = new Set(
      existingItems.map((item) => item.itemId)
    );
    const retainedIds = new Set<number>();

    for (const item of items) {
      if (item.itemId && existingIds.has(item.itemId)) {
        await db
          .update(checklistItems)
          .set(itemValues(item))
          .where(
            and(
              eq(checklistItems.itemId, item.itemId),
              eq(checklistItems.taskId, taskId)
            )
          );

        retainedIds.add(item.itemId);
      } else {
        const [created] = await db
          .insert(checklistItems)
          .values({
            taskId,
            ...itemValues(item),
          })
          .returning();

        if (!created) {
          throw new Error("Failed to create checklist item")
        }

        retainedIds.add(created.itemId);
      }
    }

    for (const oldItem of existingItems) {
      if (!retainedIds.has(oldItem.itemId)) {
        await db
          .delete(checklistItems)
          .where(eq(checklistItems.itemId, oldItem.itemId));
      }
    }

    const result = (await getDemoTasks(userId)).find(
      (entry) => entry.taskId === taskId
    );

    return res.json(result);
  } catch (error) {
    console.error("PUT /checklists/:id:", error);
    return res.status(500).json({
      error: "Failed to update checklist",
    });
  }
});

// UPDATE an individual Demo checklist item
app.patch("/checklists/items/:itemId", async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    const userId = await getDemoUserId();

    const [item] = await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.itemId, itemId))
      .limit(1);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const [parent] = await db
      .select({ taskId: checklist.taskId })
      .from(checklist)
      .where(
        and(
          eq(checklist.taskId, item.taskId),
          eq(checklist.userId, userId)
        )
      )
      .limit(1);

    if (!parent) {
      return res.status(404).json({ error: "Item not found" });
    }

    const body = req.body as Partial<DemoItemInput>;
    const patch: Record<string, unknown> = {};

    if (typeof body.title === "string") {
      if (!body.title.trim()) {
        return res.status(400).json({ error: "title cannot be empty" });
      }
      patch.title = body.title.trim();
    }

    if ("subtitle" in body) patch.subtitle = body.subtitle ?? null;
    if ("completed" in body && typeof body.completed === "boolean") {
      patch.completed = body.completed;
      patch.completedAt = body.completed ? new Date() : null;
    }
    if ("dueDate" in body) patch.dueDate = body.dueDate || null;
    if ("dueTime" in body) patch.dueTime = body.dueTime || null;
    if ("note" in body) patch.note = body.note ?? null;
    if ("url" in body) patch.url = body.url ?? null;
    if ("location" in body) patch.location = body.location ?? null;
    if ("placeId" in body) patch.placeId = body.placeId ?? null;

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const [updated] = await db
      .update(checklistItems)
      .set(patch)
      .where(
        and(
          eq(checklistItems.itemId, itemId),
          eq(checklistItems.taskId, item.taskId)
        )
      )
      .returning();

    return res.json(updated);
  } catch (error) {
    console.error("PATCH checklist item:", error);
    return res.status(500).json({
      error: "Failed to update checklist item",
    });
  }
});

// DELETE an individual Demo checklist item
app.delete("/checklists/items/:itemId", async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    const userId = await getDemoUserId();

    const [item] = await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.itemId, itemId))
      .limit(1);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const [parent] = await db
      .select({ taskId: checklist.taskId })
      .from(checklist)
      .where(
        and(
          eq(checklist.taskId, item.taskId),
          eq(checklist.userId, userId)
        )
      )
      .limit(1);

    if (!parent) {
      return res.status(404).json({ error: "Item not found" });
    }

    await db
      .delete(checklistItems)
      .where(eq(checklistItems.itemId, itemId));

    return res.json({ success: true, itemId });
  } catch (error) {
    console.error("DELETE checklist item:", error);
    return res.status(500).json({
      error: "Failed to delete checklist item",
    });
  }
});

// DELETE a Demo checklist and all its items
app.delete("/checklists/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const userId = await getDemoUserId();

    const [deleted] = await db
      .delete(checklist)
      .where(
        and(
          eq(checklist.taskId, taskId),
          eq(checklist.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Checklist not found" });
    }

    // checklist_items are removed by ON DELETE CASCADE.
    return res.json({ success: true, deleted });
  } catch (error) {
    console.error("DELETE /checklists/:id:", error);
    return res.status(500).json({
      error: "Failed to delete checklist",
    });
  }
});

/* ================= END DEMO CHECKLIST API ================= */


// ================= CHECKLIST =================

// helper:
// หา internal userId จาก Clerk userId

async function getInternalUserId(
  clerkUserId: string
) {
  const user =
    await db.query.users.findFirst(
      {
        where: eq(
          users.clerkUserId,
          clerkUserId
        ),
      }
    );

  return (
    user?.userId ?? null
  );
}

// GET checklist

app.get(
  "/checklist",
  requireAuth(),
  async (req, res) => {
    try {
      const {
        userId:
          clerkUserId,
      } = getAuth(req);

      const userId =
        await getInternalUserId(
          clerkUserId!
        );

      if (!userId) {
        return res
          .status(404)
          .json({
            error:
              "User not found in database",
          });
      }

      const result =
        await db.query.checklist.findMany(
          {
            where: eq(
              checklist.userId,
              userId
            ),
          }
        );

      res.json(result);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to fetch checklist",
      });
    }
  }
);

// CREATE checklist

app.post(
  "/checklist",
  requireAuth(),
  async (req, res) => {
    try {
      const {
        userId:
          clerkUserId,
      } = getAuth(req);

      const userId =
        await getInternalUserId(
          clerkUserId!
        );

      if (!userId) {
        return res
          .status(404)
          .json({
            error:
              "User not found in database",
          });
      }

      const {
        title,
        description,
        dueDate,
      } = req.body;

      if (!title) {
        return res
          .status(400)
          .json({
            error:
              "title is required",
          });
      }

      const [
        newTask,
      ] = await db
        .insert(checklist)
        .values({
          userId,
          title,
          description,
          dueDate,
        })
        .returning();

      res
        .status(201)
        .json(newTask);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to create task",
      });
    }
  }
);

// UPDATE checklist

app.put(
  "/checklist/:id",
  requireAuth(),
  async (req, res) => {
    try {
      const {
        userId:
          clerkUserId,
      } = getAuth(req);

      const userId =
        await getInternalUserId(
          clerkUserId!
        );

      if (!userId) {
        return res
          .status(404)
          .json({
            error:
              "User not found in database",
          });
      }

      const taskId =
        Number(
          req.params.id
        );

      const {
        title,
        description,
        dueDate,
        status,
      } = req.body;

      const [
        updated,
      ] = await db
        .update(checklist)
        .set({
          title,
          description,
          dueDate,
          status,
        })
        .where(
          and(
            eq(
              checklist.taskId,
              taskId
            ),
            eq(
              checklist.userId,
              userId
            )
          )
        )
        .returning();

      if (!updated) {
        return res
          .status(404)
          .json({
            error:
              "Task not found or not yours",
          });
      }

      res.json(updated);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to update task",
      });
    }
  }
);

// DELETE checklist

app.delete(
  "/checklist/:id",
  requireAuth(),
  async (req, res) => {
    try {
      const {
        userId:
          clerkUserId,
      } = getAuth(req);

      const userId =
        await getInternalUserId(
          clerkUserId!
        );

      if (!userId) {
        return res
          .status(404)
          .json({
            error:
              "User not found in database",
          });
      }

      const taskId =
        Number(
          req.params.id
        );

      const [
        deleted,
      ] = await db
        .delete(checklist)
        .where(
          and(
            eq(
              checklist.taskId,
              taskId
            ),
            eq(
              checklist.userId,
              userId
            )
          )
        )
        .returning();

      if (!deleted) {
        return res
          .status(404)
          .json({
            error:
              "Task not found or not yours",
          });
      }

      res.json({
        success: true,
        deleted,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "Failed to delete task",
      });
    }
  }
);

// ================= START SERVER =================

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on http://0.0.0.0:${PORT}`
    );

    console.log(
      `P'Din-Dang RAG: ${DINDANG_API_URL}`
    );
  }
);