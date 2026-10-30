import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { contacts, contactNotes } from "@/lib/schema";
import { newNoteInput } from "@/lib/validation";
import { failure, unavailable, jsonBody } from "@/lib/api-response";
type Context = {params: Promise<{id:string}>};
export async function GET(_: Request, {params}: Context) {
  const {id} = await params;
  if (!z.uuid().safeParse(id).success) return failure(404,"Контакт не найден");
  try {
    if (!(await db.select({id:contacts.id}).from(contacts).where(eq(contacts.id,id))).length) return failure(404,"Контакт не найден");
    return NextResponse.json(await db.select().from(contactNotes).where(eq(contactNotes.contactId,id)).orderBy(sql`${contactNotes.occurredAt} desc nulls last`,contactNotes.id), {headers:{"Cache-Control":"no-store"}});
  } catch { return unavailable(); }
}
export async function POST(request: Request, {params}: Context) {
  const {id} = await params;
  if (!z.uuid().safeParse(id).success) return failure(404,"Контакт не найден");
  const input = newNoteInput.safeParse(await jsonBody(request));
  if (!input.success) return failure(400,"Введите заметку до 20000 символов");
  try {
    return await db.transaction(async tx => {
      const [contact] = await tx.select().from(contacts).where(eq(contacts.id,id)).for("update");
      if (!contact) return failure(404,"Контакт не найден");
      const [inserted] = await tx.insert(contactNotes).values({...input.data,contactId:id,occurredAt:new Date()}).onConflictDoNothing().returning();
      if (inserted) return NextResponse.json(inserted,{status:201});
      const [existing] = await tx.select().from(contactNotes).where(eq(contactNotes.id,input.data.id));
      if (!existing || existing.contactId!==id || existing.body!==input.data.body) return failure(409,"Эта операция уже сохранена с другим текстом. Обновите историю.");
      return NextResponse.json(existing);
    });
  } catch { return unavailable(); }
}
