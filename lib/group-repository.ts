import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { contactGroups } from "./schema";
import type { GroupRepository } from "./group-service";

export const groupRepository: GroupRepository = {
  async list() {
    return db.select().from(contactGroups).orderBy(asc(contactGroups.name));
  },
  async findById(id) {
    return (
      await db
        .select()
        .from(contactGroups)
        .where(eq(contactGroups.id, id))
        .limit(1)
    )[0];
  },
  async findByNormalizedName(normalizedName) {
    return (
      await db
        .select()
        .from(contactGroups)
        .where(eq(contactGroups.normalizedName, normalizedName))
        .limit(1)
    )[0];
  },
  async insert(input) {
    return (await db.insert(contactGroups).values(input).returning())[0];
  },
  async update(id, input) {
    return (
      await db
        .update(contactGroups)
        .set({
          ...input,
          updatedAt: sql`greatest(clock_timestamp(), ${contactGroups.updatedAt} + interval '1 millisecond')`,
        })
        .where(eq(contactGroups.id, id))
        .returning()
    )[0];
  },
  async remove(id) {
    return (
      await db.delete(contactGroups).where(eq(contactGroups.id, id)).returning()
    )[0];
  },
};
