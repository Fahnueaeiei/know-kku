CREATE TYPE "public"."news_type" AS ENUM('news', 'trivia');--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "content_type" "news_type" DEFAULT 'news' NOT NULL;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "bg" varchar(20);--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "accent" varchar(20);