import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts, contactNotes } from "@/lib/schema";
import { contactInput } from "@/lib/validation";
import { getContact, listContacts } from "@/lib/contact-queries";
import { failure, unavailable, jsonBody } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export async function GET() { try { return NextResponse.json(await listContacts(), {headers:{"Cache-Control":"no-store"}}); } catch { return unavailable(); } }
export async function POST(request: Request) {
  const parsed = contactInput.safeParse(await jsonBody(request));
  if (!parsed.success) return failure(400, "Проверьте данные контакта");
  try {
    const id = await db.transaction(async tx => {
      const {notes, ...data} = parsed.data;
      const [contact] = await tx.insert(contacts).values({...data, notes: ""}).returning();
      if (notes.trim()) await tx.insert(contactNotes).values({contactId: contact.id, body: notes, occurredAt: new Date()});
      return contact.id;
    });
    return NextResponse.json(await getContact(id), {status:201});
  } catch { return unavailable(); }
}
