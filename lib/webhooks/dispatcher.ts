/**
 * Fire-and-forget webhook POST.
 *
 * Bounded by a 3-second timeout — the customer's order POST never
 * waits longer than that on a slow Zapier endpoint. Failures are
 * logged but never thrown; the order flow continues regardless.
 *
 * Sub-project #3 — see docs/runbooks/2026-05-17-automation-webhooks.md.
 */

const TIMEOUT_MS = 3_000;

export async function dispatchWebhook(
  url: string | undefined,
  payload: Record<string, unknown>,
  eventLabel: string,
): Promise<void> {
  if (!url || url.trim() === '') {
    // No webhook configured for this event — silent skip
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(
        `webhook[${eventLabel}] failed status=${res.status} url=${redactUrl(url)}`,
      );
    } else {
      console.log(`webhook[${eventLabel}] ok status=${res.status} url=${redactUrl(url)}`);
    }
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    const reason = isTimeout ? 'timeout' : err instanceof Error ? err.message : String(err);
    console.error(`webhook[${eventLabel}] failed reason=${reason} url=${redactUrl(url)}`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Strip query strings + auth segments so we don't leak Zapier hook
 * codes into log streams (Vercel logs are queryable by anyone with
 * project access).
 */
function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname.split('/').slice(0, 3).join('/')}/...`;
  } catch {
    return '<invalid-url>';
  }
}
