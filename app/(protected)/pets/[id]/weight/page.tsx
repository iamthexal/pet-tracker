// app/(protected)/pets/[id]/weight/page.tsx
import { Suspense } from 'react';
import { WeightTrackingClient } from './weight-tracking-client';
import { Loading } from '@/components/ui/loading';

interface WeightTrackingPageProps {
  params: Promise<{ id: string }>;
}

export default async function WeightTrackingPage({ params }: WeightTrackingPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <WeightTrackingClient petId={id} />
    </Suspense>
  );
}

