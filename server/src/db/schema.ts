import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  decimal,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
 
// ---------- Enums ----------
export const itemTypeEnum = pgEnum("item_type", ["place", "news", "event"]);
export const reportTargetEnum = pgEnum("report_target_type", ["place"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "reviewed", "resolved"]);
export const checklistStatusEnum = pgEnum("checklist_status", ["pending", "in_progress", "done"]);
export const busLineEnum = pgEnum("bus_line", ["green", "red", "blue", "yellow"]);
 
// ---------- User ----------
export const users = pgTable("users", {
  userId: serial("user_id").primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull().unique(),
  studentId: varchar("student_id", { length: 50 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  isEmailVerified: boolean("is_email_verified").default(false),
  phone: varchar("phone", { length: 20 }),
  profileImage: varchar("profile_image", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});
 
// ---------- Place ----------
export const places = pgTable("places", {
  placeId: serial("place_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),
  address: varchar("address", { length: 255 }),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
  priceMin: integer("price_min"),
  priceMax: integer("price_max"),
});
 
// ---------- Room ----------
export const rooms = pgTable("rooms", {
  roomId: serial("room_id").primaryKey(),
  roomNumber: varchar("room_number", { length: 50 }).notNull(),
  placeId: integer("place_id").references(() => places.placeId).notNull(),
});
 
// ---------- Bus Lines ----------
export const busLines = pgTable("bus_lines", {
  busLineId: serial("bus_line_id").primaryKey(),
  name: busLineEnum("name").notNull().unique(),
});
 
export const placeBusLines = pgTable(
  "place_bus_lines",
  {
    placeId: integer("place_id").references(() => places.placeId).notNull(),
    busLineId: integer("bus_line_id").references(() => busLines.busLineId).notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.placeId, t.busLineId] }) })
);
 
// ---------- Place Reviews ----------
export const placeReviews = pgTable("place_reviews", {
  reviewId: serial("review_id").primaryKey(),
  placeId: integer("place_id").references(() => places.placeId).notNull(),
  userId: integer("user_id").references(() => users.userId).notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});
 
// ---------- News ----------
export const news = pgTable("news", {
  newsId: serial("news_id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  publishedDate: date("published_date"),
  externalLink: varchar("external_link", { length: 500 }),
  imageUrl: varchar("image_url", { length: 500 }), // เผื่อยังไม่มี เพิ่มไว้เลย
  isFeatured: boolean("is_featured").default(false),   // true = อยู่ banner
  featuredUntil: timestamp("featured_until"),           // หมดเวลานี้ = หลุด banner อัตโนมัติ
});

export const documents = pgTable("documents", {
  documentId: serial("document_id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  fileUrl: varchar("file_url", { length: 500 }),
  externalLink: varchar("external_link", { length: 500 }),
  publishedDate: date("published_date"),
  createdAt: timestamp("created_at").defaultNow(),
});
 
// ---------- Favorite ----------
export const favorites = pgTable("favorites", {
  favoriteId: serial("favorite_id").primaryKey(),
  userId: integer("user_id").references(() => users.userId).notNull(),
  itemType: itemTypeEnum("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
 
export const events = pgTable("events", {
  eventId: serial("event_id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  eventDate: timestamp("event_date").notNull(),
  capacity: integer("capacity"),
  externalLink: varchar("external_link", { length: 500 }),
});

export const checklist = pgTable("checklist", {
  taskId: serial("task_id").primaryKey(),
  userId: integer("user_id").references(() => users.userId).notNull(),
  eventId: integer("event_id").references(() => events.eventId),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  status: checklistStatusEnum("status").default("pending"),
  isDefault: boolean("is_default").default(false),
});
 
// ---------- Report ----------
export const reports = pgTable("reports", {
  reportId: serial("report_id").primaryKey(),
  userId: integer("user_id").references(() => users.userId).notNull(),
  targetType: reportTargetEnum("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  reason: text("reason"),
  status: reportStatusEnum("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});
 
// ---------- ChatLog ----------
export const chatLogs = pgTable("chat_logs", {
  chatId: serial("chat_id").primaryKey(),
  userId: integer("user_id").references(() => users.userId).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
 
// ---------- Relations ----------
export const usersRelations = relations(users, ({ many }) => ({
  checklist: many(checklist),
  favorites: many(favorites),
  placeReviews: many(placeReviews),
  reports: many(reports),
  chatLogs: many(chatLogs),
}));
 
export const placesRelations = relations(places, ({ many }) => ({
  rooms: many(rooms),
  reviews: many(placeReviews),
  busLines: many(placeBusLines),
}));
 
export const placeReviewsRelations = relations(placeReviews, ({ one }) => ({
  place: one(places, { fields: [placeReviews.placeId], references: [places.placeId] }),
  user: one(users, { fields: [placeReviews.userId], references: [users.userId] }),
}));
 
export const placeBusLinesRelations = relations(placeBusLines, ({ one }) => ({
  place: one(places, { fields: [placeBusLines.placeId], references: [places.placeId] }),
  busLine: one(busLines, { fields: [placeBusLines.busLineId], references: [busLines.busLineId] }),
}));