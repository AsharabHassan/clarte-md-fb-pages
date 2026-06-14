import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart/provider';
import { FB_PIXEL_ID } from '@/lib/funnel/meta';
import { SITE_URL } from '@/lib/seo/site';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationLd, webSiteLd } from '@/lib/seo/jsonld';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'AI Acne Scan & 12-Week Acne Treatment in Pakistan | Clarté MD',
  description:
    'Free AI acne scan — snap a close-up, see your skin projected 12 weeks ahead, and get a dermatologist-grade acne protocol. Cash on delivery across Pakistan.',
  applicationName: 'Clarté MD',
  keywords: [
    'acne treatment Pakistan',
    'AI acne scan',
    'pimple treatment Pakistan',
    'acne scars',
    'dark spots',
    'acne protocol',
    'cash on delivery skincare',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Clarté MD',
    url: '/',
    title: 'AI Acne Scan & 12-Week Acne Treatment in Pakistan | Clarté MD',
    description:
      'Free AI acne scan — see your 12-week skin and get a dermatologist-grade protocol. Cash on delivery across Pakistan.',
    images: ['/protocols/acne-glow-protocol/hero.webp'],
  },
  // og:product tags — verified by Meta's catalog crawler and Google Merchant.
  // retailer_item_id matches the SKU used in Pixel Purchase/Lead events.
  other: {
    // ── Individual products ──────────────────────────────────────────────
    'product:prep:retailer_item_id':   'prep',
    'product:rescue:retailer_item_id': 'rescue',
    'product:vitc:retailer_item_id':   'vitc',
    'product:acne:retailer_item_id':   'acne',
    'product:ha:retailer_item_id':     'ha',
    'product:reti:retailer_item_id':   'reti',
    'product:light:retailer_item_id':  'light',
    'product:spf:retailer_item_id':    'spf',
    // ── Protocols / bundles (all 8 DB slugs) ────────────────────────────
    'product:acne-solo-protocol:retailer_item_id':           'acne-solo-protocol',
    'product:acne-essentials-protocol:retailer_item_id':     'acne-essentials-protocol',
    'product:acne-glow-protocol:retailer_item_id':           'acne-glow-protocol',
    'product:clear-skin-protocol:retailer_item_id':          'clear-skin-protocol',
    'product:barrier-protocol:retailer_item_id':             'barrier-protocol',
    'product:even-tone-protocol:retailer_item_id':           'even-tone-protocol',
    'product:even-tone-essentials-protocol:retailer_item_id': 'even-tone-essentials-protocol',
    'product:renewal-protocol:retailer_item_id':             'renewal-protocol',
    // Primary featured product (lead offer) for Meta catalog matching
    'product:retailer_item_id': 'acne-solo-protocol',
    'product:availability':     'in stock',
    'product:price:amount':     '1999',
    'product:price:currency':   'PKR',
  },
  robots: { index: true, follow: true },
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Font loading strategy:
          - Preconnect to both Google hosts first so the DNS/TLS handshake
            overlaps with HTML parse.
          - `display=swap` keeps text visible during fallback (avoids FOIT).
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Google Tag Manager — head snippet */}
        {GTM_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
        )}
        {/* Meta (Facebook) Pixel — base code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${FB_PIXEL_ID}');
fbq('track', 'PageView');`,
          }}
        />
      </head>
      {/*
        suppressHydrationWarning: browser extensions (Dashlane, Grammarly, etc.)
        inject attributes on <body> before React loads — suppresses those
        hydration attribute mismatches on this element only.
      */}
      <body suppressHydrationWarning>
        <JsonLd data={organizationLd()} />
        <JsonLd data={webSiteLd()} />
        {/* Meta (Facebook) Pixel — noscript fallback */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        {/* Google Tag Manager — noscript body iframe */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <CartProvider>
          <div className="funnel-root">
            <header className="funnel-topbar">
              <span className="funnel-wordmark">
                CLARTÉ<span className="funnel-md">MD</span>
              </span>
            </header>
            <main>{children}</main>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
