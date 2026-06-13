// lib/seo/site.ts
/**
 * Single source of truth for the public site origin. Used by metadata,
 * JSON-LD, robots, and sitemap so canonical/absolute URLs never drift.
 * MUST be set to the production domain in deploy env (see .env.example).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
