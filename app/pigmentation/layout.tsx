// app/pigmentation/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Dark Spot Scan & 12-Week Pigmentation Treatment in Pakistan | Clarté MD',
  description:
    'Free AI skin scan — snap a close-up, see your dark spots projected 12 weeks ahead, and get a dermatologist-grade pigmentation protocol. Cash on delivery across Pakistan.',
  keywords: [
    'pigmentation treatment Pakistan',
    'dark spots treatment',
    'uneven skin tone',
    'hyperpigmentation treatment',
    'melasma treatment Pakistan',
    'skin brightening Pakistan',
    'vitamin C serum Pakistan',
    'cash on delivery skincare',
  ],
  alternates: { canonical: '/pigmentation' },
  openGraph: {
    type: 'website',
    siteName: 'Clarté MD',
    url: '/pigmentation',
    title: 'AI Dark Spot Scan & 12-Week Pigmentation Treatment in Pakistan | Clarté MD',
    description:
      'Free AI skin scan — see your dark spots projected 12 weeks ahead and get a dermatologist-grade pigmentation protocol. Cash on delivery across Pakistan.',
    images: ['/protocols/even-tone-protocol/hero.webp'],
  },
  robots: { index: true, follow: true },
  other: {
    'product:even-tone-essentials-protocol:retailer_item_id': 'even-tone-essentials-protocol',
    'product:even-tone-protocol:retailer_item_id': 'even-tone-protocol',
    // Primary = the default/lead offer (entry tier)
    'product:retailer_item_id': 'even-tone-essentials-protocol',
    'product:availability': 'in stock',
    'product:price:amount': '1799',
    'product:price:currency': 'PKR',
  },
};

export default function PigmentationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
