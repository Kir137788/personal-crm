import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { contacts } from "@/lib/schema";
import { noteInput } from "@/lib/validation";
import { failure, unavailable, jsonBody } from "@/lib/api-response";
import { contactFields } from "@/lib/contact-queries";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
 const {id}=await params;
 if(!z.uuid().safeParse(id).success)return failure(404,"Контакт не найден");
 const input=noteInput.safeParse(await jsonBody(request));
 if(!input.success)return failure(400,"Проверьте текст заметки");
 try {return await db.transaction(async tx=>{
  const [current]=await tx.select().from(contacts).where(eq(contacts.id,id)).for("update");
  if(!current)return failure(404,"Контакт не найден");
  if(current.updatedAt.toISOString()!==input.data.updatedAt)return failure(409,"Контакт изменён в другом окне. Скопируйте свою заметку и откройте карточку заново.");
  await tx.update(contacts).set({notes:input.data.notes,updatedAt:sql`greatest(clock_timestamp(), ${contacts.updatedAt} + interval '1 millisecond')`}).where(eq(contacts.id,id));
  const [contact]=await tx.select(contactFields).from(contacts).where(eq(contacts.id,id));
  return NextResponse.json(contact);
 });}catch{return unavailable();}
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 if (!z.uuid().safeParse(id).success) {
  return NextResponse.json({ error: "Некорректный идентификатор контакта" }, { status: 400 });
 }
 try {
  const [deleted] = await db.delete(contacts).where(eq(contacts.id, id)).returning({ id: contacts.id });
  if (!deleted) return NextResponse.json({ error: "Контакт уже удалён или не найден" }, { status: 404 });
  return new Response(null, { status: 204 });
 } catch {
  return NextResponse.json({ error: "Не удалось удалить контакт. Попробуйте ещё раз." }, { status: 503 });
 }
}
