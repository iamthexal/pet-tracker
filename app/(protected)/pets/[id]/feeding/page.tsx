// app/(protected)/pets/[id]/feeding/page.tsx
import { Suspense } from 'react';
import { FeedingScheduleClient } from './feeding-schedule-client';
import { Loading } from '@/components/ui/loading';

interface FeedingSchedulePageProps {
  params: Promise<{ id: string }>;
}

export default async function FeedingSchedulePage({ params }: FeedingSchedulePageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <FeedingScheduleClient petId={id} />
    </Suspense>
  );
}