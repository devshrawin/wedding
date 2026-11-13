CREATE TABLE "contributions" (
	"id" text PRIMARY KEY NOT NULL,
	"registry_id" text NOT NULL,
	"item_id" text,
	"item_title" text,
	"guest_key" text,
	"guest_name" text,
	"guest_phone" text,
	"guest_place" text,
	"message" text,
	"anonymous" boolean DEFAULT false NOT NULL,
	"amount" integer NOT NULL,
	"fee" integer DEFAULT 0 NOT NULL,
	"method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"utr" text,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"thanked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" text PRIMARY KEY NOT NULL,
	"registry_id" text NOT NULL,
	"token" text NOT NULL,
	"guest_name" text NOT NULL,
	"opens" integer DEFAULT 0 NOT NULL,
	"last_opened_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"registry_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"emoji" text,
	"url" text,
	"store" text,
	"category" text DEFAULT 'other' NOT NULL,
	"price" integer,
	"quantity" integer DEFAULT 1 NOT NULL,
	"allow_chip_in" boolean DEFAULT false NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registries" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"owner_id" text NOT NULL,
	"partner_one" text NOT NULL,
	"partner_two" text NOT NULL,
	"wedding_date" text,
	"city" text,
	"note" text,
	"photo" text,
	"theme" text DEFAULT 'sindoor' NOT NULL,
	"visibility" text DEFAULT 'link' NOT NULL,
	"password_hash" text,
	"hide_reserved" boolean DEFAULT false NOT NULL,
	"show_amounts" boolean DEFAULT false NOT NULL,
	"upi_id" text,
	"upi_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "registry_members" (
	"id" text PRIMARY KEY NOT NULL,
	"registry_id" text NOT NULL,
	"phone" text NOT NULL,
	"name" text NOT NULL,
	"relation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"registry_id" text NOT NULL,
	"item_id" text NOT NULL,
	"guest_key" text NOT NULL,
	"guest_name" text,
	"guest_phone" text,
	"message" text,
	"anonymous" boolean DEFAULT false NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"thanked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_registry_id_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."registries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_registry_id_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."registries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_registry_id_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."registries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registries" ADD CONSTRAINT "registries_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_members" ADD CONSTRAINT "registry_members_registry_id_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."registries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_registry_id_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."registries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contributions_registry_idx" ON "contributions" USING btree ("registry_id");--> statement-breakpoint
CREATE INDEX "contributions_order_idx" ON "contributions" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE INDEX "invites_registry_idx" ON "invites" USING btree ("registry_id");--> statement-breakpoint
CREATE INDEX "items_registry_idx" ON "items" USING btree ("registry_id");--> statement-breakpoint
CREATE INDEX "otp_phone_idx" ON "otp_codes" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "member_registry_phone_idx" ON "registry_members" USING btree ("registry_id","phone");--> statement-breakpoint
CREATE INDEX "member_phone_idx" ON "registry_members" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "reservations_registry_idx" ON "reservations" USING btree ("registry_id");--> statement-breakpoint
CREATE INDEX "reservations_item_idx" ON "reservations" USING btree ("item_id");