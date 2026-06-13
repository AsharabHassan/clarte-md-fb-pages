'use client';

import { useRouter } from 'next/navigation';
import { QuizFunnel } from '@/components/funnel/QuizFunnel';
import type { ReviewsResult } from '@/lib/reviews/types';

export function QuizFunnelClient({ data }: { data: ReviewsResult }) {
  const router = useRouter();
  return (
    <QuizFunnel
      reviews={data.reviews}
      caseStudies={data.caseStudies}
      aggregate={data.aggregate}
      onChooseScan={() => router.push('/scan')}
    />
  );
}
