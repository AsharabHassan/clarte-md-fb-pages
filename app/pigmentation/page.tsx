// app/pigmentation/page.tsx
import { ScanFunnel } from '@/components/funnel/ScanFunnel';
import { getPigmentationReviews } from '@/lib/reviews/pigmentation-queries';
import { JsonLd } from '@/components/seo/JsonLd';
import { pigmentationProductLd, pigmentationFaqLd } from '@/lib/seo/pigmentation-jsonld';
import { PigmentationLandingContent } from '@/components/seo/PigmentationLandingContent';

// Pigmentation ad landing. Re-fetch reviews at most every 5 min.
export const revalidate = 300;

export default async function Page() {
  const { reviews, caseStudies, aggregate } = await getPigmentationReviews();
  return (
    <>
      <JsonLd data={pigmentationProductLd({ aggregate, reviews })} />
      <JsonLd data={pigmentationFaqLd()} />
      <ScanFunnel concern="pigmentation" reviews={reviews} caseStudies={caseStudies} aggregate={aggregate} />
      <PigmentationLandingContent />
    </>
  );
}
