import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { log } from "./logger";
import fs from "fs";

export async function runMigrations() {
  // Verifica se o banco de dados está configurado
  if (!process.env.DATABASE_URL && !process.env.RAILWAY_DATABASE_URL) {
    log("⚠️ Skipping migrations - No database configured (using MemStorage)");
    return;
  }

  // Verifica se db tem a estrutura necessária
  if (!db || typeof db !== 'object' || !db.dialect) {
    log("⚠️ Skipping migrations - Database not properly initialized");
    return;
  }

  log("Running Drizzle migrations...");
  try {
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
    // Não lança o erro em desenvolvimento sem banco
    if (process.env.NODE_ENV === "production") {
      throw error;
    } else {
      log("⚠️ Continuing without database...");
    }
  }
}
