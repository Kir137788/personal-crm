import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { contacts } from "@/lib/schema";
import { noteInput } from "@/lib/validation";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
 try {
 const { id } = await params;
 if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Контакт не найден" }, { status: 404 });
 const parsed = noteInput.safeParse(await request.json());
 if (!parsed.success) return NextResponse.json({ error: "Проверьте текст заметки" }, { status: 400 });
 const [contact] = await db.update(contacts).set({ notes: parsed.data.notes, updatedAt: new Date() }).where(and(eq(contacts.id, id), eq(contacts.updatedAt, new Date(parsed.data.updatedAt)))).returning();
 if (!contact) return NextResponse.json({ error: "Контакт изменён в другом окне. Скопируйте свою заметку и откройте карточку заново." }, { status: 409 });
 return NextResponse.json(contact);
 } catch { return NextResponse.json({ error: "Не удалось сохранить заметку. Текст остался в поле — попробуйте ещё раз." }, { status: 500 }); }
}
