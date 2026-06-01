import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { config as loadDotenv } from 'dotenv';

// Integration tests hit the real Supabase DB, so DATABASE_URL must be
// loaded into the parent process BEFORE worker threads boot — otherwise
// lib/db/client.ts evaluates with undefined env and postgres-js falls
// back to localhost:5432. See [[project_runtime_quirks]] §3.
loadDotenv({ path: '.env.local' });

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
    include: ['tests/funnel/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
