import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { contacts } from "@/lib/schema";
import { reminderInput } from "@/lib/validation";
import { contactFields } from "@/lib/contact-queries";
import { failure, unavailable, jsonBody } from "@/lib/api-response";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 if(!z.uuid().safeParse(id).success)return failure(404,"Контакт не найден");
 const input=reminderInput.safeParse(await jsonBody(request));
 if(!input.success)return failure(400,"Проверьте частоту общения");
 try {return await db.transaction(async tx=>{
  const [current]=await tx.select().from(contacts).where(eq(contacts.id,id)).for("update");
  if(!current)return failure(404,"Контакт не найден");
  if(current.updatedAt.toISOString()!==input.data.updatedAt)return failure(409,"Контакт изменён в другом окне. Обновите карточку и повторите выбор.");
  const interval=input.data.contactIntervalDays;
  await tx.update(contacts).set({contactIntervalDays:interval,reminderEnabledAt:interval===null?null:current.contactIntervalDays===null?new Date():current.reminderEnabledAt,updatedAt:sql`greatest(clock_timestamp(), ${contacts.updatedAt} + interval '1 millisecond')`}).where(eq(contacts.id,id));
  const [result]=await tx.select(contactFields).from(contacts).where(eq(contacts.id,id));
  return NextResponse.json(result);
 });}catch{return unavailable();}
}
