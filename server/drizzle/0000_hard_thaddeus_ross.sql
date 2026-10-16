
CREATE TABLE "checklist_items" (
    "item_id" serial PRIMARY KEY NOT NULL,
    "task_id" integer NOT NULL,
    "title" varchar(255) NOT NULL,
    "subtitle" text,
    "completed" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp,
    "due_date" date,
    "due_time" time(0),
    "note" text,
    "url" varchar(1000),
    "location" varchar(255),
    "place_id" integer
);
--> statement-breakpoint
ALTER TABLE "checklist_items"
ADD CONSTRAINT "checklist_items_task_id_checklist_task_id_fk"
FOREIGN KEY ("task_id")
REFERENCES "public"."checklist"("task_id")
ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "checklist_items"
ADD CONSTRAINT "checklist_items_place_id_places_place_id_fk"
FOREIGN KEY ("place_id")
REFERENCES "public"."places"("place_id")
ON DELETE set null ON UPDATE no action;
