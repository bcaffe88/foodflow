import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { log } from "./logger";

export async function runMigrations() {
  log("Running Drizzle migrations...");
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const migrationsFolder = isProduction ? "./dist/migrations" : "./migrations";
    log(`Using migrations folder: ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    log("✅ Migrations complete.");
  } catch (error) {
    log("❌ Migration failed:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}
