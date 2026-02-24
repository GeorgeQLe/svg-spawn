import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let client: ReturnType<typeof postgres> | null = null;

/**
 * Get (or create) the Drizzle database instance.
 * Lazy singleton — only connects on first call.
 */
export function getDb() {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set');
    }
    client = postgres(url);
    db = drizzle(client, { schema });
  }
  return db;
}

/**
 * Close the PostgreSQL connection pool.
 * Call on graceful shutdown.
 */
export async function closePgPool(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
    db = null;
  }
}
