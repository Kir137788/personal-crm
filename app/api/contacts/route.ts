import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { contacts } from "@/lib/schema";
import { contactInput } from "@/lib/validation";
export const dynamic = "force-dynamic";
export async function GET() { try { return NextResponse.json(await db.select().from(contacts).orderBy(asc(contacts.name)), { headers: { "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ error: "Не удалось загрузить контакты. Попробуйте ещё раз." }, { status: 503 }); } }
export async function POST(request: Request) {
 try { const parsed = contactInput.safeParse(await request.json());
 if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
 const [contact] = await db.insert(contacts).values(parsed.data).returning();
 return NextResponse.json(contact, { status: 201 });
 } catch { return NextResponse.json({ error: "Не удалось сохранить контакт. Попробуйте ещё раз." }, { status: 500 }); }
}
