import { asc, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "./db";
import { contacts } from "./schema";
export const contactFields = {
  ...getTableColumns(contacts),
  lastContactAt: sql<string | null>`(select max(occurred_at) from contact_notes where contact_id = ${sql.identifier("contacts")}.${sql.identifier("id")})`,
  hasNotes: sql<boolean>`exists(select 1 from contact_notes where contact_id = ${sql.identifier("contacts")}.${sql.identifier("id")})`,
};
export async function listContacts() { return db.select(contactFields).from(contacts).orderBy(asc(contacts.name)); }
export async function getContact(id: string) { return (await db.select(contactFields).from(contacts).where(eq(contacts.id, id)))[0]; }
