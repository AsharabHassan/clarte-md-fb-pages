import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// One connection for the server-side process lifetime.
// Vercel functions reuse warm containers, so this is fine.
// prepare: false is required by Supabase's Transaction pooler (port 6543).
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(client, { schema });
export { schema };
