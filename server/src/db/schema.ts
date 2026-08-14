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
export const itemTypeEnum = pgEnum("item_type", ["place", "news", "event", "post"]);
export const postCategoryEnum = pgEnum("post_category", ["news", "review", "question", "general"]);
export const reportTargetEnum = pgEnum("report_target_type", ["post", "place"]);
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
  publishedDate: date("published_date"),
  externalLink: varchar("external_link", { length: 500 }),
});

// ---------- Checklist ----------
export const checklist = pgTable("checklist", {
  taskId: serial("task_id").primaryKey(),
  userId: integer("user_id").references(() => users.userId).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  status: checklistStatusEnum("status").default("pending"),
  isDefault: boolean("is_default").default(false),
});

// ---------- Favorite ----------
export const favorites = pgTable("favorites", {
  favoriteId: serial("favorite_id").primaryKey(),
  userId: integer("user_id").references(() => users.userId).notNull(),
  itemType: itemTypeEnum("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- Event ----------
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

// ---------- EventParticipant ----------
export const eventParticipants = pgTable(
  "event_participants",
  {
    eventId: integer("event_id").references(() => events.eventId).notNull(),
    userId: integer("user_id").references(() => users.userId).notNull(),
    joinedAt: timestamp("joined_at").defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.eventId, t.userId] }) })
);

// ---------- Post ----------
export const posts = pgTable("posts", {
  postId: serial("post_id").primaryKey(),
  userId: integer("user_id").references(() => users.userId).notNull(),
  content: text("content").notNull(),
  category: postCategoryEnum("category").default("general"),
  isAnonymous: boolean("is_anonymous").default(false),
  imageUrl: varchar("image_url", { length: 500 }),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- Comment ----------
export const comments = pgTable("comments", {
  commentId: serial("comment_id").primaryKey(),
  postId: integer("post_id").references(() => posts.postId).notNull(),
  userId: integer("user_id").references(() => users.userId),
  content: text("content").notNull(),
  isAiGenerated: boolean("is_ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- Like ----------
export const likes = pgTable(
  "likes",
  {
    userId: integer("user_id").references(() => users.userId).notNull(),
    postId: integer("post_id").references(() => posts.postId).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.postId] }) })
);

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
  posts: many(posts),
  comments: many(comments),
  checklist: many(checklist),
  favorites: many(favorites),
  placeReviews: many(placeReviews),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.userId] }),
  comments: many(comments),
  likes: many(likes),
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