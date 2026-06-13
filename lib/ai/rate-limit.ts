import { createHash } from 'node:crypto';

/**
 * Per-hour ceilings. Both checked against the ai_sessions table (the
 * AI rate) and a notional orders rate-check inside /api/create-order
 * (the orders rate).
 *
 * Overridable via env so local dev / staging can raise the cap
 * (`AI_RATE_LIMIT_PER_HOUR=100` in .env.local) without changing prod
 * defaults. Production keeps the conservative number unless explicitly
 * raised in the deploy env.
 */
function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const RATE_LIMIT_AI_PER_HOUR = envInt('AI_RATE_LIMIT_PER_HOUR', 5);
export const RATE_LIMIT_ORDERS_PER_HOUR = envInt('ORDERS_RATE_LIMIT_PER_HOUR', 10);

/**
 * One-way hash of a raw IP using a server-side pepper. We store the
 * hash in `ai_sessions.client_ip_hash` so we can rate-limit by client
 * without ever persisting raw IP addresses (GDPR/PDPA friendly).
 *
 * Same IP + same pepper → same hash (rate-limit lookup works).
 * Same IP + rotated pepper → different hash (rotation defangs any
 * prior dump). Rotation is acceptable because the hashes are only
 * used for rolling-window rate checks, not long-lived identity.
 */
export function hashIp(ip: string): string {
  const pepper = process.env.IP_HASH_PEPPER;
  if (!pepper) {
    throw new Error('IP_HASH_PEPPER env var is required');
  }
  return createHash('sha256').update(ip + pepper).digest('hex');
}

/**
 * Best-effort client IP extraction from common proxy headers.
 * On Vercel, x-forwarded-for is set by the edge with the originating
 * client first, then any intermediate proxies. We take the leftmost
 * entry (the actual client).
 *
 * Returns '0.0.0.0' as a fallback so callers never have to handle
 * undefined; rate-limiting then groups all header-less callers
 * together, which is the safe default.
 */
export function extractClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = headers.get('x-real-ip');
  if (real) return real.trim();
  return '0.0.0.0';
}
