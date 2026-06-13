// app/quiz/page.tsx
import { getAcneReviews } from '@/lib/reviews/queries';
import { QuizFunnelClient } from '../QuizFunnelClient';

// No-photo quiz funnel. Re-fetch reviews at most every 5 min.
export const revalidate = 300;

export default async function Page() {
  const data = await getAcneReviews();
  return <QuizFunnelClient data={data} />;
}
