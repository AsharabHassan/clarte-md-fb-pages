/**
 * CDN image URLs for the products shown as single cards in the funnel.
 * Copied verbatim from the main app's lib/db/seed.ts. Hosts (cdn.shopify.com,
 * clartemd.com.pk) are whitelisted in next.config.ts images.remotePatterns.
 */
export const PRODUCT_IMAGE: Record<string, string> = {
  rescue: 'https://cdn.shopify.com/s/files/1/0782/5113/1112/files/wash.png?v=1773743070',
  acne: 'https://cdn.shopify.com/s/files/1/0782/5113/1112/files/Generated_Image_March_13_2026_-_3_48AM.png?v=1773743197',
  vitc: 'https://cdn.shopify.com/s/files/1/0782/5113/1112/files/3390b799-35fe-425b-bae9-41e4c8e41139.png?v=1773338016',
  reti: 'https://cdn.shopify.com/s/files/1/0782/5113/1112/files/Gemini_Generated_Image_rwcfs4rwcfs4rwcf.png?v=1773881855',
  spf: 'https://cdn.shopify.com/s/files/1/0782/5113/1112/files/91edf02b-ef9c-4062-a6b9-f0975d941393.png?v=1773337514',
  ha: 'https://clartemd.com.pk/products/ha/hero.webp',
  prep: 'https://cdn.shopify.com/s/files/1/0782/5113/1112/files/Prep.png?v=1773743330',
};

/** Local protocol hero image (copied into public/). */
export const PROTOCOL_HERO = '/protocols/acne-glow-protocol/hero.webp';
