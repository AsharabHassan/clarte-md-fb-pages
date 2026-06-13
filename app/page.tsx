// app/page.tsx
import { ScanFunnel } from '@/components/funnel/ScanFunnel';
import { getAcneReviews } from '@/lib/reviews/queries';
import { JsonLd } from '@/components/seo/JsonLd';
import { productLd, faqLd, catalogProductsLd, catalogProtocolsLd } from '@/lib/seo/jsonld';
import { AcneLandingContent } from '@/components/seo/AcneLandingContent';

// AI photo-scan funnel is the ad landing. Re-fetch reviews at most every 5 min.
export const revalidate = 300;

export default async function Page() {
  const { reviews, caseStudies, aggregate } = await getAcneReviews();
  return (
    <>
      {/* Lead product with aggregate ratings + reviews */}
      <JsonLd data={productLd({ aggregate, reviews })} />
      <JsonLd data={faqLd()} />
      {/* All 8 individual products — SKUs visible to ad crawlers */}
      {catalogProductsLd().map((ld) => (
        <JsonLd key={(ld as { sku: string }).sku} data={ld} />
      ))}
      {/* All 3 protocols/bundles — slugs as SKUs */}
      {catalogProtocolsLd().map((ld) => (
        <JsonLd key={(ld as { sku: string }).sku} data={ld} />
      ))}
      <ScanFunnel reviews={reviews} caseStudies={caseStudies} aggregate={aggregate} />
      <AcneLandingContent />
    </>
  );
}
