import { ScanFunnel } from '@/components/funnel/ScanFunnel';
import { getAcneReviews } from '@/lib/reviews/queries';

// Secondary funnel (AI photo scan). Re-fetch reviews at most every 5 min.
export const revalidate = 300;

export default async function Page() {
  const { reviews, caseStudies, aggregate } = await getAcneReviews();
  return <ScanFunnel reviews={reviews} caseStudies={caseStudies} aggregate={aggregate} />;
}
