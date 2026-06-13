import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep postgres-js and drizzle-orm out of the server bundle; both rely
  // on dynamic require + native-feeling internals that break when bundled
  // by Turbopack. Per Drizzle's Supabase guide.
  serverExternalPackages: ['postgres', 'drizzle-orm'],

  // Dev-only: allow the LAN IP and the Cloudflare quick-tunnel host to
  // load /_next/* HMR assets cross-origin (needed to test the in-browser
  // camera over HTTPS on a phone). Has no effect on production builds.
  allowedDevOrigins: ['192.168.10.11', '*.trycloudflare.com'],

  /* ────────────────── Image optimisation ──────────────────
     - formats: serve modern webp/avif when the browser accepts it.
     - deviceSizes: shrink the breakpoints we ship srcsets for.
     - imageSizes: small thumbnails.
     - minimumCacheTTL: cache optimised variants for 30 days.
     - remotePatterns: allow Shopify CDN and clartemd.com.pk hosts.
  ─────────────────────────────────────────────────────────── */
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'clartemd.com.pk' },
    ],
  },

  /* ────────────────── Bundle trimming ─────────────────────
     optimizePackageImports rewrites barrel-file imports
     so the bundler only ships what each component actually uses.
  ─────────────────────────────────────────────────────────── */
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'motion',
      'motion/react',
    ],
  },
};

export default nextConfig;
