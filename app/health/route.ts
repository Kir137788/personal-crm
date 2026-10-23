import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok", revision: process.env.APP_REVISION ?? "development" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
