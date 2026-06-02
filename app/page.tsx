import { getAcneReviews } from '@/lib/reviews/queries';
import { QuizFunnelClient } from './QuizFunnelClient';

// Quiz funnel is the default landing. Re-fetch reviews at most every 5 min.
export const revalidate = 300;

export default async function Page() {
  const data = await getAcneReviews();
  return <QuizFunnelClient data={data} />;
}
