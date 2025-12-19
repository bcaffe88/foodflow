import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, isDatabaseConfigured } from "./db";
import { log } from "./logger";
import fs from "fs";

export async function runMigrations() {
  log("Running Drizzle migrations...");
  try {
    // Skip migrations when database is not configured
    if (!isDatabaseConfigured) {
      log("Skipping migrations: database not configured");
      return;
    }

    // Tenta encontrar a pasta de migrações - verifica ambos os caminhos
    let migrationsFolder = "./migrations";
    
    // Se ./migrations/meta/_journal.json não existir, tenta ./dist/migrations
    if (!fs.existsSync("./migrations/meta/_journal.json")) {
      if (fs.existsSync("./dist/migrations/meta/_journal.json")) {
        migrationsFolder = "./dist/migrations";
      }
    }
    
    log(`Using migrations folder: ${migrationsFolder}`);
    log(`NODE_ENV: ${process.env.NODE_ENV}`);
    await migrate(db, { migrationsFolder });
    log("✅ Migrations complete.");
  } catch (error) {
    log("❌ Migration failed:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}
