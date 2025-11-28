import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { log } from "./logger";

export async function runMigrations() {
  log("Running Drizzle migrations...");
  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    log("✅ Migrations complete.");
  } catch (error) {
    log("❌ Migration failed:", error);
    throw error;
  }
}
