import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { log } from "./logger";

export async function runMigrations() {
  log("Running Drizzle migrations...");
  try {
    // O caminho para a pasta de migrações é relativo ao local de execução do script.
    // Assumindo que o script é executado a partir da raiz do projeto, o caminho é "./db/migrations".
    await migrate(db, { migrationsFolder: "./zoom/db/migrations" });
    log("✅ Migrations complete.");
  } catch (error) {
    log("❌ Migration failed:", error);
    // Não lançar o erro para não quebrar o processo, mas registrar o log.
    // O servidor pode continuar a rodar, mas o seeding falhará se as tabelas não existirem.
    // No entanto, para o propósito de correção, vamos relançar para que o erro seja visível.
    throw error;
  }
}
