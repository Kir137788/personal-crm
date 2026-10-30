import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { contacts, contactNotes } from "@/lib/schema";
import { editNoteInput } from "@/lib/validation";
import { failure, unavailable, jsonBody } from "@/lib/api-response";
export async function PATCH(request: Request, {params}: {params:Promise<{id:string;noteId:string}>}) {
  const {id,noteId} = await params;
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(noteId).success) return failure(404,"Запись не найдена");
  const input = editNoteInput.safeParse(await jsonBody(request));
  if (!input.success) return failure(400,"Введите заметку до 20000 символов");
  try {
    return await db.transaction(async tx => {
      await tx.select({id:contacts.id}).from(contacts).where(eq(contacts.id,id)).for("update");
      const [current] = await tx.select().from(contactNotes).where(and(eq(contactNotes.id,noteId),eq(contactNotes.contactId,id))).for("update");
      if (!current) return failure(404,"Запись не найдена");
      if (current.updatedAt.toISOString()!==input.data.updatedAt) return failure(409,"Заметка изменена в другом окне. Ваш текст сохранён в редакторе. Обновите историю для сравнения.");
      const [note] = await tx.update(contactNotes).set({body:input.data.body,updatedAt:sql`greatest(clock_timestamp(), ${contactNotes.updatedAt} + interval '1 millisecond')`}).where(eq(contactNotes.id,noteId)).returning();
      if (current.legacy) await tx.update(contacts).set({notes:input.data.body,updatedAt:sql`greatest(clock_timestamp(), ${contacts.updatedAt} + interval '1 millisecond')`}).where(eq(contacts.id,id));
      return NextResponse.json(note);
    });
  } catch { return unavailable(); }
}
