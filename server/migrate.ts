import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./db";
import { log } from "./logger";

export async function runMigrations() {
  log("Running Drizzle migrations...");
  try {
    // A pasta de migrações é configurada em drizzle.config.ts como "./migrations"
    // O caminho relativo aqui deve ser a partir da raiz do projeto, que é onde o servidor está sendo executado.
    // Assumindo que o servidor é executado a partir da raiz 'foodflow', o caminho é 'db/migrations'.
    // No entanto, o drizzle.config.ts aponta para "./migrations" (relativo à raiz do projeto foodflow).
    // Vou usar o caminho correto que é `./db/migrations` conforme a estrutura de pastas.
    await migrate(db, { migrationsFolder: "./db/migrations" });
    log("✅ Migrations complete.");
  } catch (error) {
    log("❌ Migration failed:", error);
    throw error;
  }
}
