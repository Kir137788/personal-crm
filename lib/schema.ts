import { sql } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, index, integer, boolean, check, uniqueIndex } from "drizzle-orm/pg-core";
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  context: text("context").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  notes: text("notes").notNull().default(""),
  contactIntervalDays: integer("contact_interval_days"),
  reminderEnabledAt: timestamp("reminder_enabled_at", { withTimezone: true, precision: 3 }),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
}, (t) => [index("contacts_name_idx").on(t.name), check("contacts_interval_check", sql`${t.contactIntervalDays} in (7,30,90,365)`)]);
export const contactNotes = pgTable("contact_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true, precision: 3 }),
  legacy: boolean("legacy").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
}, (t) => [index("notes_contact_date_idx").on(t.contactId, t.occurredAt), uniqueIndex("notes_legacy_idx").on(t.contactId).where(sql`${t.legacy} = true`)]);
