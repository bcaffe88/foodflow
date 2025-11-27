import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Use Replit DATABASE_URL first (native PostgreSQL), then fallback to RAILWAY_DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL;

let pool: any;
let db: any;

if (!databaseUrl) {
  console.warn("[DB] ⚠️ DATABASE_URL not configured - SmartStorage will use MemStorage fallback");
  // Create a no-op pool for development without database
  pool = {
    query: () => Promise.reject(new Error("Database not configured")),
    end: () => Promise.resolve(),
  };
  db = {};
} else {
  console.log("[DB] Connecting to:", databaseUrl.split('@')[0] + "@..." + (databaseUrl.includes('railway') ? 'railway' : databaseUrl.includes('supabase') ? 'supabase' : 'replit-db'));
  
  // Use appropriate timeout for database connection
  pool = new Pool({ 
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: process.env.NODE_ENV === "production" ? 10000 : 5000,
    query_timeout: 5000,
  });

  db = drizzle({ client: pool, schema });

  // Test connection with timeout
  const testTimeout = setTimeout(() => {
    if (process.env.NODE_ENV === "development") {
      console.warn("[DB] ⚠️ Database connection timeout - SmartStorage will use MemStorage");
    }
  }, 1500);

  pool.query('SELECT NOW()', (err: any, result: any) => {
    clearTimeout(testTimeout);
    if (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DB] ⚠️ Database unavailable:", err.message.split('\n')[0]);
      } else {
        console.error("[DB] Connection error:", err.message);
      }
    } else {
      console.log("[DB] ✅ PostgreSQL connected successfully");
    }
  });
}

export { pool, db };
