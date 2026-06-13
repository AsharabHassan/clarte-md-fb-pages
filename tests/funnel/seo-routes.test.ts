// tests/funnel/seo-routes.test.ts
import { describe, it, expect } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

describe('robots', () => {
  it('allows the named AI crawlers and references the sitemap', () => {
    const r = robots();
    const agents = (Array.isArray(r.rules) ? r.rules : [r.rules])
      .flatMap((rule) => (Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent]));
    expect(agents).toEqual(
      expect.arrayContaining(['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot']),
    );
    expect(String(r.sitemap)).toContain('/sitemap.xml');
  });
});

describe('sitemap', () => {
  it('lists the landing and quiz URLs', () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls.some((u) => u.endsWith('/'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/quiz'))).toBe(true);
  });
});
