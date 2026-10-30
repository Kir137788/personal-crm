import { NextResponse } from "next/server";
import { listContacts } from "@/lib/contact-queries";
import { reminderDue } from "@/lib/keep-in-touch";
import { unavailable } from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function GET() {
 try {
  const now=new Date();
  const due=(await listContacts()).flatMap(contact=>{const result=reminderDue(contact,now);return result&&result.overdueDays>0?[{...contact,...result}]:[];});
  due.sort((a,b)=>a.dueAt.localeCompare(b.dueAt)||a.name.localeCompare(b.name,"ru")||a.id.localeCompare(b.id));
  return NextResponse.json({serverNow:now.toISOString(),contacts:due},{headers:{"Cache-Control":"no-store"}});
 } catch {return unavailable();}
}
