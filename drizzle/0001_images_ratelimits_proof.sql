CREATE TABLE "images" (
	"id" text PRIMARY KEY NOT NULL,
	"registry_id" text NOT NULL,
	"kind" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"data" bytea NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "proof_image" text;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_registry_id_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."registries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "images_registry_idx" ON "images" USING btree ("registry_id");--> statement-breakpoint
-- Move couple photos stored inline as data URLs into the images table.
INSERT INTO "images" ("id", "registry_id", "kind", "mime", "bytes", "data")
SELECT 'p' || substr(md5(r."id" || clock_timestamp()::text), 1, 15), r."id", 'couple',
       substring(r."photo" from '^data:([a-z/]+);'),
       length(decode(substring(r."photo" from position(',' in r."photo") + 1), 'base64')),
       decode(substring(r."photo" from position(',' in r."photo") + 1), 'base64')
FROM "registries" r WHERE r."photo" LIKE 'data:image/%;base64,%';
--> statement-breakpoint
UPDATE "registries" r SET "photo" = '/img/' || i."id"
FROM "images" i WHERE i."registry_id" = r."id" AND i."kind" = 'couple' AND r."photo" LIKE 'data:%';
