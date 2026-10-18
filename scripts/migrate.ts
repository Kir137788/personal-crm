import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
async function main() {
 if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
 const client = postgres(process.env.DATABASE_URL, { max: 1 });
 try { await migrate(drizzle(client), { migrationsFolder: "drizzle" }); console.log("Migrations applied"); } finally { await client.end(); }
}
main().catch(() => { console.error("Migration failed. Check database availability and configuration."); process.exit(1); });
