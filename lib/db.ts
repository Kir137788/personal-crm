import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
const globalDb = globalThis as unknown as { crmClient?: ReturnType<typeof postgres> };
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const client = globalDb.crmClient ?? postgres(process.env.DATABASE_URL, { max: 5 });
if (process.env.NODE_ENV !== "production") globalDb.crmClient = client;
export const db = drizzle(client, { schema });
