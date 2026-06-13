// components/seo/JsonLd.tsx
import { serializeJsonLd } from '@/lib/seo/jsonld';

/**
 * Renders a JSON-LD <script>. Server-rendered into the initial HTML so
 * crawlers that don't run JS (Google AdsBot, GPTBot, ClaudeBot, etc.) read it.
 * Uses serializeJsonLd (not raw JSON.stringify) so user-generated values
 * (e.g. review text) can't break out of the <script> element.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
