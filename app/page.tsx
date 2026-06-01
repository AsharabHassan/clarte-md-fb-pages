import { ScanFunnel } from '@/components/funnel/ScanFunnel';
import { getAcneReviews } from '@/lib/reviews/queries';

// Re-fetch the reviews from the DB at most every 5 minutes.
export const revalidate = 300;

export default async function Page() {
  const { reviews, caseStudies, aggregate } = await getAcneReviews();
  return <ScanFunnel reviews={reviews} caseStudies={caseStudies} aggregate={aggregate} />;
}
