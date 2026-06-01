import { sql, type SQL } from 'drizzle-orm';

/**
 * Format a sequence number as a human-readable order ID.
 *   formatOrderNumber(2026, 42)      → 'CLM-2026-0042'
 *   formatOrderNumber(2026, 10000)   → 'CLM-2026-10000'
 *
 * Pure; safe for unit tests with no DB dependency.
 */
export function formatOrderNumber(year: number, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error(`Invalid order sequence: ${sequence}`);
  }
  const padded = sequence < 10000 ? String(sequence).padStart(4, '0') : String(sequence);
  return `CLM-${year}-${padded}`;
}

interface DbExecutor {
  execute(query: SQL): Promise<unknown>;
}

/**
 * Pulls nextval('order_seq') from Postgres and formats as CLM-YYYY-NNNN.
 * The db param is injected so unit tests don't pull in the real db client;
 * production callers pass `import { db } from '@/lib/db/client'`.
 *
 * The Postgres sequence guarantees monotonic, gapless numbering across
 * concurrent requests — race-free without app-level locking.
 */
export async function nextOrderNumber(db: DbExecutor): Promise<string> {
  const result = (await db.execute(
    sql`SELECT nextval('order_seq') AS nextval`,
  )) as Array<{ nextval: string | number | bigint }>;
  const value = result[0]?.nextval;
  if (value === undefined || value === null) {
    throw new Error('order_seq returned no rows');
  }
  return formatOrderNumber(new Date().getFullYear(), Number(value));
}
