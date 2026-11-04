import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import {
  contactGroupMemberships,
  contactGroups,
  contactNotes,
  contacts,
} from "./schema";
import {
  ContactMembershipError,
  type ContactMembershipRepository,
} from "./contact-membership-service";

async function ensureGroupsExist(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  groupIds: string[],
) {
  if (!groupIds.length) return;
  const existing = await transaction
    .select({ id: contactGroups.id })
    .from(contactGroups)
    .where(inArray(contactGroups.id, groupIds));
  if (existing.length !== groupIds.length) {
    throw new ContactMembershipError("unknown_group");
  }
}

export const contactMembershipRepository: ContactMembershipRepository = {
  async createContact(input, groupIds) {
    return db.transaction(async (transaction) => {
      await ensureGroupsExist(transaction, groupIds);
      const { notes, ...data } = input;
      const [contact] = await transaction
        .insert(contacts)
        .values({ ...data, notes: "" })
        .returning({ id: contacts.id });

      if (notes.trim()) {
        await transaction.insert(contactNotes).values({
          contactId: contact.id,
          body: notes,
          occurredAt: new Date(),
        });
      }
      if (groupIds.length) {
        await transaction.insert(contactGroupMemberships).values(
          groupIds.map((groupId) => ({ contactId: contact.id, groupId })),
        );
      }
      return contact.id;
    });
  },
  async replaceGroups(contactId, groupIds, updatedAt) {
    await db.transaction(async (transaction) => {
      const [current] = await transaction
        .select({ id: contacts.id, updatedAt: contacts.updatedAt })
        .from(contacts)
        .where(eq(contacts.id, contactId))
        .for("update");
      if (!current) throw new ContactMembershipError("not_found");
      if (current.updatedAt.toISOString() !== updatedAt) {
        throw new ContactMembershipError("conflict");
      }

      await ensureGroupsExist(transaction, groupIds);
      await transaction
        .delete(contactGroupMemberships)
        .where(eq(contactGroupMemberships.contactId, contactId));
      if (groupIds.length) {
        await transaction.insert(contactGroupMemberships).values(
          groupIds.map((groupId) => ({ contactId, groupId })),
        );
      }
      await transaction
        .update(contacts)
        .set({
          updatedAt: sql`greatest(clock_timestamp(), ${contacts.updatedAt} + interval '1 millisecond')`,
        })
        .where(eq(contacts.id, contactId));
    });
  },
};
