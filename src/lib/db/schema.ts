import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  createdAt: createdAt(),
});

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: text("id").primaryKey(),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumed: boolean("consumed").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("otp_phone_idx").on(t.phone)],
);

export const registries = pgTable("registries", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  partnerOne: text("partner_one").notNull(),
  partnerTwo: text("partner_two").notNull(),
  weddingDate: text("wedding_date"), // ISO yyyy-mm-dd
  city: text("city"),
  note: text("note"),
  photo: text("photo"), // small compressed data URL
  theme: text("theme").notNull().default("sindoor"),
  // privacy
  visibility: text("visibility").notNull().default("link"), // link | password | invite
  passwordHash: text("password_hash"),
  hideReserved: boolean("hide_reserved").notNull().default(false),
  showAmounts: boolean("show_amounts").notNull().default(false),
  // payments
  upiId: text("upi_id"),
  upiName: text("upi_name"),
  createdAt: createdAt(),
});

export const registryMembers = pgTable(
  "registry_members",
  {
    id: text("id").primaryKey(),
    registryId: text("registry_id")
      .notNull()
      .references(() => registries.id, { onDelete: "cascade" }),
    phone: text("phone").notNull(),
    name: text("name").notNull(),
    relation: text("relation"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("member_registry_phone_idx").on(t.registryId, t.phone), index("member_phone_idx").on(t.phone)],
);

export const items = pgTable(
  "items",
  {
    id: text("id").primaryKey(),
    registryId: text("registry_id")
      .notNull()
      .references(() => registries.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // product | fund
    title: text("title").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    emoji: text("emoji"),
    url: text("url"),
    store: text("store"),
    category: text("category").notNull().default("other"),
    price: integer("price"), // rupees; product price or fund target (null = open-ended fund)
    quantity: integer("quantity").notNull().default(1),
    allowChipIn: boolean("allow_chip_in").notNull().default(false),
    hidden: boolean("hidden").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("items_registry_idx").on(t.registryId)],
);

export const reservations = pgTable(
  "reservations",
  {
    id: text("id").primaryKey(),
    registryId: text("registry_id")
      .notNull()
      .references(() => registries.id, { onDelete: "cascade" }),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    guestKey: text("guest_key").notNull(),
    guestName: text("guest_name"),
    guestPhone: text("guest_phone"),
    message: text("message"),
    anonymous: boolean("anonymous").notNull().default(false),
    quantity: integer("quantity").notNull().default(1),
    status: text("status").notNull().default("reserved"), // reserved | purchased | cancelled
    thankedAt: timestamp("thanked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("reservations_registry_idx").on(t.registryId), index("reservations_item_idx").on(t.itemId)],
);

export const contributions = pgTable(
  "contributions",
  {
    id: text("id").primaryKey(),
    registryId: text("registry_id")
      .notNull()
      .references(() => registries.id, { onDelete: "cascade" }),
    itemId: text("item_id").references(() => items.id, { onDelete: "set null" }),
    itemTitle: text("item_title"), // snapshot, survives item deletion
    guestKey: text("guest_key"),
    guestName: text("guest_name"),
    guestPhone: text("guest_phone"),
    guestPlace: text("guest_place"),
    message: text("message"),
    anonymous: boolean("anonymous").notNull().default(false),
    amount: integer("amount").notNull(), // rupees
    fee: integer("fee").notNull().default(0), // paise, platform fee (Razorpay only)
    method: text("method").notNull(), // upi | razorpay | cash
    status: text("status").notNull().default("pending"), // initiated | pending | confirmed | rejected
    utr: text("utr"),
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    thankedAt: timestamp("thanked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("contributions_registry_idx").on(t.registryId), index("contributions_order_idx").on(t.razorpayOrderId)],
);

export const invites = pgTable(
  "invites",
  {
    id: text("id").primaryKey(),
    registryId: text("registry_id")
      .notNull()
      .references(() => registries.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    guestName: text("guest_name").notNull(),
    opens: integer("opens").notNull().default(0),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("invites_registry_idx").on(t.registryId)],
);

export type User = typeof users.$inferSelect;
export type Registry = typeof registries.$inferSelect;
export type Member = typeof registryMembers.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Contribution = typeof contributions.$inferSelect;
export type Invite = typeof invites.$inferSelect;
