import { asc, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { contactGroupMemberships, contactGroups, contacts } from "./schema";
import { attachGroupsToContacts } from "./contact-group-view";
export const contactFields = {
  ...getTableColumns(contacts),
  lastContactAt: sql<
    string | null
  >`(select max(occurred_at) from contact_notes where contact_id = ${sql.identifier("contacts")}.${sql.identifier("id")})`,
  hasNotes: sql<boolean>`exists(select 1 from contact_notes where contact_id = ${sql.identifier("contacts")}.${sql.identifier("id")})`,
};

async function listGroupRows(contactIds: string[]) {
  if (!contactIds.length) return [];
  return db
    .select({
      contactId: contactGroupMemberships.contactId,
      id: contactGroups.id,
      name: contactGroups.name,
    })
    .from(contactGroupMemberships)
    .innerJoin(
      contactGroups,
      eq(contactGroupMemberships.groupId, contactGroups.id),
    )
    .where(inArray(contactGroupMemberships.contactId, contactIds))
    .orderBy(asc(contactGroups.name), asc(contactGroups.id));
}

export async function listContacts() {
  const result = await db
    .select(contactFields)
    .from(contacts)
    .orderBy(asc(contacts.name));
  return attachGroupsToContacts(
    result,
    await listGroupRows(result.map((contact) => contact.id)),
  );
}

export async function getContact(id: string) {
  const contact = (
    await db.select(contactFields).from(contacts).where(eq(contacts.id, id))
  )[0];
  if (!contact) return undefined;
  return attachGroupsToContacts([contact], await listGroupRows([id]))[0];
}
